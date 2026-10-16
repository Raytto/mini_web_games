const {chromium,webkit}=require('/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.PIANO_BASE||'http://127.0.0.1:18878',out=process.env.PIANO_TEST_OUT||process.env.CWW_JOB_RUNTIME;
const engines=process.env.PIANO_ENGINE?[process.env.PIANO_ENGINE]:['chromium','webkit'];
async function run(engine){
 const browser=await ({chromium,webkit}[engine]).launch({headless:true,executablePath:engine==='chromium'?'/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome':'/root/.cache/ms-playwright/webkit-2311/pw_run.sh',args:engine==='chromium'?['--no-sandbox','--disable-gpu','--no-proxy-server']:[]});
 const ctx=await browser.newContext({viewport:{width:1194,height:834},hasTouch:true,isMobile:true,deviceScaleFactor:1});await ctx.route(/\/(api|bankend)\//,r=>r.abort());
 const errors=[],bad=[];const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!/\/(api|bankend)\//.test(r.url()))bad.push([r.status(),r.url()]);});
 const state=()=>p.evaluate(()=>pianoDebug());
 const point=async n=>{const k=p.locator(`[data-note="${n}"]`),r=await k.boundingBox(),black=await k.evaluate(k=>k.classList.contains('black'));return{x:r.x+r.width/2,y:r.y+r.height*(black?.45:.82)};};
 const tap=async n=>{const q=await point(n);await p.touchscreen.tap(q.x,q.y);};
 const choose=async id=>{await p.locator('#choose').click();await p.locator(`[data-song="${id}"]`).click();};
 try{
 await p.goto(base+'/games/little_piano/index.html');await p.waitForFunction(()=>window.pianoDebug?.().ready);assert.equal((await state()).sampleCount,9);assert.equal(await p.locator('.white').count(),15);assert.equal(await p.locator('.black').count(),10);
 await tap(60);await p.waitForFunction(()=>pianoDebug().context==='running');assert.equal((await state()).context,'running');await p.locator('[data-mode="guide"]').click();await tap(62);assert.equal((await state()).cursor,0,'wrong note advanced');await p.waitForTimeout(500);assert.equal((await state()).cursor,0,'guide ran automatically');await p.locator('#play').click();assert.equal((await state()).cursor,0,'hear note advanced');
 await tap(60);assert.equal((await state()).cursor,1);await p.waitForTimeout(150);await tap(60);assert.equal((await state()).cursor,2,'repeated note not playable');await p.locator('#restart').click();assert.equal((await state()).cursor,0);
 // Real multi-touch input in Chromium; equivalent independent PointerEvents in WebKit.
 await p.locator('[data-mode="free"]').click();const positions=await Promise.all([60,64,67].map(point));
 if(engine==='chromium'){
  const cdp=await ctx.newCDPSession(p);const touches=positions.map((q,i)=>({...q,id:i+1}));await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches});assert.equal((await state()).pressed,3);assert.equal(await p.locator('.key.pressed').count(),3);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await state()).pressed,0);await cdp.detach();
 }else{
  await p.evaluate(()=>{[60,64,67].forEach((n,i)=>{const k=document.querySelector(`[data-note="${n}"]`);k.setPointerCapture=()=>{};k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:i+10,pointerType:'touch',button:0}));});});assert.equal((await state()).pressed,3);await p.evaluate(()=>[10,11,12].forEach(id=>document.querySelector('#keyboard').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:id}))));assert.equal((await state()).pressed,0);
 }
 // Every pitch hits its intended DOM key and starts a sampled voice.
 for(let n=60;n<=84;n++){await tap(n);assert.ok((await p.locator('#playing-note').innerText()).length>1);}
 await p.waitForTimeout(400);assert.equal((await state()).voices,0,'released notes kept sounding');
 // All songs, all actual touch targets, including black-key exercise and upper octave.
 await p.locator('[data-mode="guide"]').click();
 const songIds=await p.evaluate(async()=>{const {SONGS}=await import('./songs.js?v=20261014piano1');return SONGS.map(s=>({id:s.id,total:s.notes.length}));});
 for(const song of songIds){await choose(song.id);let count=0;while(!(await state()).finished){const s=await state();await p.waitForTimeout(115);await tap(s.expected);assert.equal((await state()).cursor,s.cursor+1,`${song.id} note ${s.cursor}`);if(++count>100)throw Error('Guide stuck');}assert.equal(count,song.total);await p.waitForTimeout(450);assert.equal((await state()).finished,true);console.log(engine,'guide',song.id,count);}
 await choose('twinkle');await p.screenshot({path:out+'/piano-'+engine+'-landscape.png'});
 // Repeated held note cannot advance again through an extra finger.
 await p.evaluate(()=>{const k=document.querySelector('[data-note="60"]');k.setPointerCapture=()=>{};k.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:31,button:0}));});const once=(await state()).cursor;await p.waitForTimeout(150);await p.evaluate(()=>document.querySelector('[data-note="60"]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:32,button:0})));assert.equal((await state()).cursor,once);await p.evaluate(()=>[31,32].forEach(id=>document.querySelector('#keyboard').dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:id}))));assert.equal((await state()).pressed,0);
 // Auto playback, pause, tempo changes, completion, and background stop.
 await choose('smurfs');await p.locator('[data-mode="listen"]').click();await p.waitForTimeout(800);assert.equal((await state()).running,true);await p.locator('#play').click();const paused=(await state()).cursor;await p.waitForTimeout(400);assert.equal((await state()).cursor,paused);assert.equal((await state()).voices,0);await p.locator('#tempo').selectOption('1');await p.locator('#play').click();await p.waitForFunction(()=>pianoDebug().finished,{},{timeout:12000});assert.equal((await state()).running,false);
 await choose('jingle');await p.waitForTimeout(600);assert.equal((await state()).running,true);await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal((await state()).running,false);assert.equal((await state()).voices,0);await p.waitForTimeout(250);assert.equal((await state()).running,false);await p.locator('#play').click();await p.waitForTimeout(300);assert.equal((await state()).running,true);await p.locator('#tempo').selectOption('0.65');assert.equal((await state()).speed,.65);await p.locator('#choose').click();assert.equal((await state()).running,false);await p.locator('#songs .close').click();
 // Smaller iPad, portrait iPad, and phone: geometry and actual hit tests.
 const geometry=[];for(const size of [{width:1024,height:768},{width:768,height:1024},{width:390,height:844}]){
  await p.setViewportSize(size);await p.locator('[data-mode="guide"]').click();await choose('raindrops');await p.waitForTimeout(180);await tap(61);assert.equal((await state()).cursor,1);const g=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,height:innerHeight,docHeight:document.documentElement.scrollHeight,white:document.querySelector('.white').getBoundingClientRect().width,black:document.querySelector('.black').getBoundingClientRect().width,bottom:document.querySelector('.instrument').getBoundingClientRect().bottom}));assert.ok(g.scroll<=g.width+1,'horizontal overflow');assert.ok(g.bottom<=g.height,'keyboard outside viewport');if(size.width>=768){assert.ok(g.black>=42,'black key too narrow on iPad');assert.ok(g.white>=60,'white key too narrow on iPad');}geometry.push(g);await p.screenshot({path:out+`/piano-${engine}-${size.width}.png`});
 }
 await p.setViewportSize({width:1194,height:834});await p.evaluate(()=>XiaoxiaoI18n.applyLanguage('zh'));assert.equal(await p.locator('h1').innerText(),'小钢琴');await p.locator('#info').click();assert.equal(await p.locator('#about a[href="https://creativecommons.org/licenses/by/3.0/"]').count(),1);await p.locator('#about .close').click();await p.screenshot({path:out+'/piano-'+engine+'-zh.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);const result={engine,passed:true,songs:songIds.length,geometry,errors,bad,at:new Date().toISOString()};fs.writeFileSync(out+'/piano-'+engine+'-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();}
}
(async()=>{for(const e of engines)await run(e)})().catch(e=>{console.error(e);process.exit(1)});
