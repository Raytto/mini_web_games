process.env.TMPDIR='/tmp';
const {chromium,webkit}=require('/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.DIG_BASE||'http://127.0.0.1:8003',out=process.env.DIG_EVIDENCE||process.env.CWW_JOB_RUNTIME;
(async()=>{for(const engine of ['chromium','webkit']){
 const b=await({chromium,webkit}[engine]).launch({executablePath:engine==='chromium'?'/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome':'/root/.cache/ms-playwright/webkit-2311/pw_run.sh',args:engine==='chromium'?['--no-sandbox','--disable-gpu']:[]});
 try{const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,serviceWorkers:'block'});await c.route(/\/(api|bankend)\//,r=>r.abort());await c.addInitScript(()=>localStorage.setItem('xiaoxiaoEnglishVoiceEnabled','false'));let attempts=0,release;const gate=new Promise(r=>release=r);
 if(process.env.DIG_GAME_OVERRIDE)await c.route('**/games/dino_dig/game.js*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.DIG_GAME_OVERRIDE,'utf8')}));
 await c.route('**/assets/layer-rock-v1.webp*',r=>++attempts===1?r.fulfill({status:503,body:'intentional test'}):r.continue());
 await c.route('**/assets/depth/*-peek-lite.webp*',async r=>{await gate;await r.continue();});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/games/dino_dig/');await p.waitForFunction(()=>window.dinoRockDebug?.().pieces?.length===18);assert(attempts>=2,'rock image did not retry');
 await p.locator('#dig-canvas').focus();for(let i=0;i<18;i++)await p.keyboard.press('Enter');await p.waitForSelector('body[data-phase=toolReady]');assert.equal(await p.locator('#next-tool').isDisabled(),true,'advanced before next reveal was ready');assert.equal(await p.locator('body').getAttribute('data-layer'),'0');
 release();await p.waitForFunction(()=>!document.querySelector('#next-tool').disabled);await p.locator('#next-tool').tap();await p.waitForSelector('body[data-layer="1"][data-phase=dig]');assert.equal(await p.locator('body').getAttribute('data-tool'),'shovel');assert.equal(+(await p.locator('body').getAttribute('data-coverage')),0);
 assert.deepEqual(errors,[]);const result={engine,passed:true,rockImageRetry:attempts,laterImageDoesNotBlockRock:true,toolWaitsForImage:true,resumesSameRound:true,errors};fs.writeFileSync(out+'/rock-loading-'+engine+'.json',JSON.stringify(result,null,2));console.log(engine,'PASS rock image retry and soil handoff readiness');
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
