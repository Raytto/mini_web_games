process.env.TMPDIR='/tmp';
const {chromium,webkit}=require('/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.DIG_BASE||'http://127.0.0.1:8003',out=process.env.DIG_EVIDENCE||process.env.CWW_JOB_RUNTIME;
(async()=>{for(const engine of ['chromium','webkit']){
 const browser=await({chromium,webkit}[engine]).launch({executablePath:engine==='chromium'?'/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome':'/root/.cache/ms-playwright/webkit-2311/pw_run.sh',args:engine==='chromium'?['--no-sandbox','--disable-gpu']:[]});
 try{
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,serviceWorkers:'block'});
 await context.route(/\/(api|bankend)\//,r=>r.abort());
 if(process.env.DIG_GAME_OVERRIDE)await context.route('**/games/dino_dig/game.js*',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(process.env.DIG_GAME_OVERRIDE,'utf8')}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Observe real Web Audio nodes, without replacing the implementation or input.
 await page.addInitScript(()=>{
  window.soundProbe={loops:0,active:0,max:0,oscillators:0};
  const source=AudioContext.prototype.createBufferSource,osc=AudioContext.prototype.createOscillator;
  AudioContext.prototype.createBufferSource=function(){const node=source.call(this),start=node.start.bind(node);node.start=(...args)=>{if(node.loop){soundProbe.loops++;soundProbe.active++;soundProbe.max=Math.max(soundProbe.max,soundProbe.active);node.addEventListener('ended',()=>soundProbe.active--,{once:true});}return start(...args)};return node;};
  AudioContext.prototype.createOscillator=function(){soundProbe.oscillators++;return osc.call(this)};
 });
 await page.goto(base+'/games/dino_dig/');await page.waitForSelector('body[data-phase="dig"]');
 await page.locator('#dig-canvas').focus();for(let i=0;i<18;i++)await page.keyboard.press('Enter');await page.waitForSelector('body[data-phase=toolReady]');await page.locator('#next-tool').tap();await page.waitForSelector('body[data-layer="1"][data-phase=dig]');await page.waitForTimeout(300);await page.evaluate(()=>window.soundProbe={loops:0,active:0,max:0,oscillators:0});
 const r=await page.locator('#dig-canvas').boundingBox();
 const at=(x,y)=>({x:r.x+(x-14)*r.width/692,y:r.y+(y-38)*r.height/520});
 const start=at(160,190);await page.mouse.move(start.x,start.y);await page.mouse.down();await page.waitForFunction(()=>soundProbe.loops>0);
 for(let x=180;x<580;x+=25){const q=at(x,190);await page.mouse.move(q.x,q.y);await page.waitForTimeout(18);}
 let probe=await page.evaluate(()=>({...soundProbe}));assert.equal(probe.oscillators,0,'pitched chime while digging');assert.equal(probe.max,1,'noise voices stacked during a sweep');
 await page.mouse.up();await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>soundProbe.active),0,'release left sound running');
 const q=at(210,310);await page.mouse.move(q.x,q.y);await page.mouse.down();await page.waitForTimeout(80);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>soundProbe.active),0);assert.equal(await page.locator('body').getAttribute('data-dragging'),'false');await page.mouse.up();
 await page.locator('#dig-canvas').focus();await page.keyboard.down('Enter');await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>soundProbe.active),1);await page.keyboard.up('Enter');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>soundProbe.active),0);
 await page.locator('#mute').click();const muted=await page.evaluate(()=>soundProbe.loops);await page.locator('#dig-canvas').focus();await page.keyboard.press('Enter');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>soundProbe.loops),muted,'muted digging made sound');await page.locator('#mute').click();
 await page.locator('#dig-canvas').focus();await page.keyboard.down('Enter');await page.waitForTimeout(70);await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await page.keyboard.up('Enter');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>soundProbe.active),0);await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
 await page.locator('#again').click();await page.waitForSelector('body[data-phase="dig"]');assert.equal(await page.evaluate(()=>soundProbe.active),0);
 // Check every material's actual output, including spectral concentration and idle cleanup.
 // Use a fresh context to exclude voice narration from these signal measurements.
 const signalPage=await context.newPage();await signalPage.goto(base+'/games/dino_dig/');await signalPage.waitForSelector('body[data-phase="dig"]');
 await signalPage.evaluate(async()=>{
  const {DigScrubSound}=await import('./scrub-audio.js?v=20261017scrub1');
  const ctx=new AudioContext(),app={voice:{enabled:true,context:()=>ctx},hidden:false,destroyed:false,sounds:new Set()};
  window.audioCheck={ctx,app,scrub:new DigScrubSound(app)};
  const b=document.createElement('button');b.id='audio-check-start';b.textContent='Start sound check';b.style='position:fixed;inset:10px auto auto 10px;z-index:9999';b.onclick=()=>ctx.resume();document.body.append(b);
 });
 await signalPage.locator('#audio-check-start').click();await signalPage.waitForFunction(()=>audioCheck.ctx.state==='running');
 const levels=[];
 for(let layer=0;layer<3;layer++){
  await signalPage.evaluate(layer=>{const {ctx,scrub}=audioCheck;scrub.stroke(layer);const a=ctx.createAnalyser();a.fftSize=2048;a.smoothingTimeConstant=0;scrub.voice.gain.connect(a);audioCheck.analyser=a;},layer);
  await signalPage.waitForTimeout(70);
  const signal=await signalPage.evaluate(()=>{const a=audioCheck.analyser,t=new Float32Array(a.fftSize),f=new Float32Array(a.frequencyBinCount);a.getFloatTimeDomainData(t);a.getFloatFrequencyData(f);const power=Array.from(f,x=>10**(x/10)),sum=power.reduce((a,b)=>a+b,0);return{rms:Math.sqrt(t.reduce((s,v)=>s+v*v,0)/t.length),peak:Math.max(...t.map(Math.abs)),strongestBinFraction:Math.max(...power)/sum};});
  assert(signal.rms>.0002&&signal.rms<.025,JSON.stringify(signal));assert(signal.peak<.09);assert(signal.strongestBinFraction<.12,'tonal peak, expected broad friction noise');
  await signalPage.waitForTimeout(350);assert.equal(await signalPage.evaluate(()=>audioCheck.app.sounds.size),0,'idle noise leaked');levels.push({layer,...signal});
 }
 assert(levels[2].rms<levels[0].rms,'fine dust should be softer than soil');
 assert.deepEqual(errors,[]);const result={engine,passed:true,realPointer:true,release:true,keyboard:true,mute:true,blur:true,pagehide:true,restart:true,noPitchedDigging:true,noStacking:true,levels};
 fs.writeFileSync(out+'/dino-scrub-'+engine+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 await signalPage.evaluate(()=>audioCheck.ctx.close());await context.close();
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
