process.env.TMPDIR='/tmp';
const {chromium,webkit}=require('/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.DIG_BASE||'http://127.0.0.1:18870',engine=process.env.DIG_ENGINE||'chromium',out=process.env.DIG_EVIDENCE;assert(out);fs.mkdirSync(out,{recursive:true});const report={engine,base,checks:[],errors:[]};let browser,page;
const data=p=>p.evaluate(()=>({...document.body.dataset}));const phase=(p,v)=>p.waitForFunction(v=>document.body.dataset.phase===v,v);
async function open(){const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'});await c.route(/\/(api|bankend)\//,r=>r.fulfill({status:200,body:'{}'}));await c.addInitScript(()=>localStorage.setItem('xiaoxiaoEnglishVoiceEnabled','false'));const p=await c.newPage();page=p;p.on('pageerror',e=>report.errors.push(e.stack));await p.goto(base+'/games/dino_dig/');await phase(p,'dig');return{c,p};}
async function point(p,x,y){const r=await p.locator('#dig-canvas').boundingBox();return{x:r.x+(x-14)*r.width/692,y:r.y+(y-38)*r.height/520};}
async function driver(p,touch){const cdp=touch?await p.context().newCDPSession(p):null;const send=(type,q)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:q?[{...q,id:1,radiusX:5,radiusY:5,force:1}]:[]});return{
 down:async()=>{const q=await point(p,85,100);if(touch)await send('touchStart',q);else{await p.mouse.move(q.x,q.y);await p.mouse.down();}},
 move:async(x,y)=>{const q=await point(p,x,y);if(touch)await send('touchMove',q);else await p.mouse.move(q.x,q.y);},
 up:()=>touch?send('touchEnd'):p.mouse.up(),cancel:()=>send('touchCancel')};}
async function sweepTo(p,d,target){for(let round=0;round<25;round++)for(let row=0;row<8;row++)for(let col=0;col<12;col++){let s=await data(p);if(s.phase!=='dig'||+s.centralCoverage>=target)return s;await d.move(85+(row%2?11-col:col)*48,100+row*50);}throw Error('Cannot reach '+target);}
async function held(p,touch=false){const start=await data(p),d=await driver(p,touch);await d.down();let s=await sweepTo(p,d,.96);assert.equal(s.phase,'dig');assert(+s.centralCoverage>=.95&&+s.centralCoverage<1);assert.equal(s.fade,'none');assert.equal(s.dragging,'true');assert.equal(s.tool,start.tool);assert(await p.locator('#next-tool.taken').count());await p.waitForTimeout(1150);s=await data(p);assert.equal(s.phase,'dig');assert.equal(s.fade,'none');assert.equal(s.tool,start.tool);await p.screenshot({path:path.join(out,(touch?'touch':'mouse')+'-still-digging-'+start.layer+'.png')});const prior=+s.centralCoverage;s=await sweepTo(p,d,1);assert.equal(+s.centralCoverage,1);assert(+s.centralCoverage>prior);assert.equal(s.layer,start.layer);assert.equal(s.dragging,'true');assert.equal(s.phase,+start.layer===2?'finishing':'toolReady');await d.up();await p.waitForFunction(()=>document.body.dataset.fade==='none');report.checks.push({name:(touch?'touch':'mouse')+' held beyond 95%, continues cleaning, transitions only at 100%',layer:start.layer});}
async function releases(){
 const {c,p}=await open(),d=await driver(p,false);await d.down();let s=await sweepTo(p,d,.90);assert(+s.centralCoverage<.95);await d.up();await p.waitForTimeout(350);assert.equal((await data(p)).phase,'dig');assert.equal((await data(p)).fade,'none');
 for(let layer=0;layer<3;layer++){
  const tool=await driver(p,engine==='chromium'&&layer===1);await tool.down();s=await sweepTo(p,tool,.96);assert.equal(s.phase,'dig');assert.equal(s.fade,'none');assert(+s.centralCoverage>.95&&+s.centralCoverage<1);await tool.up();s=await data(p);assert.equal(s.phase,layer===2?'finishing':'toolReady');assert.equal(s.dragging,'false');assert.notEqual(s.fade,'none');await p.waitForFunction(()=>document.body.dataset.fade==='none');assert.equal(JSON.parse((await data(p)).coverages)[layer],1);
  if(layer<2){await p.locator('#next-tool').tap();await phase(p,'dig');assert.equal(+(await data(p)).layer,layer+1);}
 }
 await phase(p,'alive');report.checks.push({name:'release below 95% keeps digging; release above 95% finishes all three layers, including touch'});await c.close();
}
async function cancellations(){
 const {c,p}=await open(),d=await driver(p,engine==='chromium');await d.down();await sweepTo(p,d,.96);
 if(engine==='chromium'){await d.cancel();await p.waitForTimeout(350);assert.equal((await data(p)).phase,'dig');assert.equal((await data(p)).fade,'none');await d.down();}
 await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await d.up();await p.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await p.waitForTimeout(350);assert.equal((await data(p)).phase,'dig');assert.equal((await data(p)).fade,'none');
 // A new held gesture must still wait, despite progress exceeding the release threshold.
 const mouse=await driver(p,false);await mouse.down();await p.waitForTimeout(350);assert.equal((await data(p)).phase,'dig');await mouse.up();await phase(p,'toolReady');await p.locator('#again').tap();await phase(p,'dig');assert.equal(+(await data(p)).coverage,0);assert.equal((await data(p)).fade,'none');
 // Key repeat is a held action too; only the corresponding keyup assists clearing.
 await p.locator('#dig-canvas').focus();for(let n=0;n<400&&+(await data(p)).centralCoverage<=.95;n++)await p.keyboard.down('Enter');assert.equal((await data(p)).phase,'dig');assert(+(await data(p)).centralCoverage>.95);assert.equal((await data(p)).fade,'none');await p.keyboard.up('Enter');await phase(p,'toolReady');report.checks.push({name:'touch cancel/background do not assist; new press waits for release; restart and keyboard release'});await c.close();
}
(async()=>{
 browser=engine==='webkit'?await webkit.launch({executablePath:'/root/.cache/ms-playwright/webkit-2311/pw_run.sh'}):await chromium.launch({executablePath:'/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',args:['--no-sandbox','--disable-gpu','--no-proxy-server']});
 const {c,p}=await open();for(let layer=0;layer<3;layer++){await held(p);if(layer<2){const q=await point(p,320,260);await p.touchscreen.tap(q.x,q.y);await phase(p,'dig');assert.equal(+(await data(p)).layer,layer+1);}}await phase(p,'alive');const old=(await data(p)).dino;await p.locator('#next-dinosaur').tap();await phase(p,'dig');assert.notEqual((await data(p)).dino,old);await c.close();
 if(engine==='chromium'){const {c,p}=await open();await held(p,true);await c.close();}
 await releases();await cancellations();
 assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS',JSON.stringify(report.checks));
})().catch(async e=>{report.passed=false;report.failure=e.stack;if(page&&!page.isClosed()){report.last=await data(page);await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{})}console.error(e.stack);process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser?.close()});
