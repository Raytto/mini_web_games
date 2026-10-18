const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const base=process.env.TRAIN_BASE||'https://xiaoxiao.cool',out=process.env.TRAIN_TEST_OUT||process.env.CWW_JOB_RUNTIME;
const all=[];
const untranslated=()=>{const found=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode;if(/[\u3400-\u9fff]/.test(n.nodeValue)&&!n.parentElement.closest('script,style')&&n.parentElement.getClientRects().length&&getComputedStyle(n.parentElement).visibility!=='hidden')found.push(n.nodeValue.trim())}return found};
async function run(engine){
 const b=await({chromium,webkit}[engine]).launch({headless:true,executablePath:engine==='chromium'?'/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome':'/root/.cache/ms-playwright/webkit-2311/pw_run.sh',args:engine==='chromium'?['--no-sandbox','--disable-gpu','--no-proxy-server']:[]});
 const report={engine,checks:[],errors:[],bad:[]};const check=x=>report.checks.push(x);
 try{
 const ctx=await b.newContext({viewport:{width:1024,height:768},hasTouch:true});
 await ctx.route(/\/(api|bankend)\//,r=>r.fulfill({status:204,body:'',headers:{'access-control-allow-origin':'*'}}));
 await ctx.addInitScript(()=>{const old=fetch;window.fetch=(i,o)=>/\/(api|bankend)\//.test(typeof i==='string'?i:i.url)?Promise.resolve(new Response(null,{status:204})):old(i,o);navigator.sendBeacon=()=>true;});
 const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.bad.push([r.status(),r.url()])});
 await p.goto(base+'/');const fl=p.frameLocator('#content-frame');await fl.locator('.game-card').first().waitFor();
 const order=await fl.locator('.game-card').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));assert.equal(order.length,43);assert.equal(order.indexOf('games/rhythm_train/index.html'),9);assert.equal(order[8],'games/little_drums/index.html');assert.equal(order.filter(x=>x.includes('/rhythm_train/')).length,1);
 const card=fl.locator('a[href="games/rhythm_train/index.html"]');await card.scrollIntoViewIfNeeded();assert.equal(await card.locator('.card-title').innerText(),'Rhythm Railway');await p.waitForFunction(()=>{const i=document.querySelector('#content-frame').contentDocument.querySelector('a[href="games/rhythm_train/index.html"] img');return i.complete&&i.naturalWidth===720});await p.screenshot({path:out+'/'+engine+'-homepage.png'});check('43 homepage cards; train is tenth, after drums; cover decodes');
 await card.tap();await fl.locator('#play').waitFor();let frame=p.frames().find(f=>f.url().includes('/games/rhythm_train/'));
 await frame.waitForFunction(()=>trainDebug().speechPlaying);assert.equal(await frame.locator('h1').innerText(),'Rhythm Railway');assert.equal(await frame.evaluate(()=>trainDebug().parentAudio),true);assert.equal(await p.evaluate(()=>document.querySelector('audio').paused),true);assert.equal(await p.evaluate(()=>document.querySelector('audio').getAttribute('data-mode')),'lesson');assert.equal(await frame.evaluate(()=>window.MINI_GAME.id),'rhythm_train');check('Homepage entry inherits unlocked audio, English welcome, metadata and quiet BGM');
 await fl.locator('#play').tap();await frame.waitForFunction(()=>trainDebug().running);assert.equal(await frame.evaluate(()=>trainDebug().speechPlaying),false);await frame.waitForFunction(()=>trainDebug().signal>0.0001);await frame.waitForFunction(()=>trainDebug().cursor>=1);check('Play cancels narration; decoded music produces signal and advances');
 await fl.locator('a[href="../../home.html"]').tap();await fl.locator('.game-card').first().waitFor();await p.waitForFunction(()=>window.gameSpeechContext('rhythm_train')===null);check('Shared Home button exits and releases the game audio context');
 await fl.locator('#language-toggle').tap();assert.equal(await card.locator('.card-title').innerText(),'节奏小火车');await card.tap();await fl.locator('#play').waitFor();frame=p.frames().find(f=>f.url().includes('/games/rhythm_train/'));assert.equal(await frame.locator('h1').innerText(),'节奏小火车');await fl.locator('[data-tool="crash"]').tap();await fl.locator('[data-index="1"]').tap();assert.ok(await frame.evaluate(()=>trainDebug().model.steps[1].includes('crash')));check('Chinese homepage choice carries into the game; real touch edits work');
 await fl.locator('#help').tap();await frame.waitForFunction(()=>trainDebug().speechPlaying);await fl.locator('#voice-toggle').tap();assert.equal(await frame.evaluate(()=>trainDebug().speechPlaying),false);assert.equal(await frame.evaluate(()=>localStorage.getItem('xiaoxiaoEnglishVoiceEnabled')),'false');await fl.locator('#replay-guide').tap();await frame.waitForFunction(()=>trainDebug().speechPlaying);await fl.locator('#help-dialog .close').tap();assert.equal(await frame.evaluate(()=>trainDebug().speechPlaying),false);check('Help, persistent voice toggle and replay use working buttons');
 await p.goto(base+'/games/rhythm_train/index.html');await p.locator('#play').waitFor();await p.evaluate(()=>XiaoxiaoI18n.setLanguage('en'));await p.waitForTimeout(80);assert.deepEqual(await p.evaluate(untranslated),[]);
 for(const tool of ['kick','snare','hat','crash']){await p.locator(`[data-tool="${tool}"]`).tap();await p.locator('[data-index="3"]').tap()}
 await p.locator('#save').tap();await p.locator('#library').tap();await p.waitForTimeout(80);assert.deepEqual(await p.evaluate(untranslated),[]);await p.locator('#library-dialog .close').tap();await p.locator('#add').tap();assert.deepEqual(await p.evaluate(untranslated),[]);await p.locator('[data-pattern="1"]').tap();await p.locator('#help').tap();await p.locator('#help-dialog details').evaluate(x=>x.open=true);await p.waitForTimeout(80);assert.deepEqual(await p.evaluate(untranslated),[]);await p.locator('#help-dialog .close').tap();check('English tools, dynamic notices, garage, presets and expanded instructions translate');
 const geometry=[];
 for(const lang of ['en','zh']){
  await p.evaluate(lang=>XiaoxiaoI18n.setLanguage(lang),lang);
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[844,390]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(60);
   const g=await p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom}};return{width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,home:box('header a'),play:box('#play'),tools:box('#tools'),transport:box('.transport')}});
   assert.ok(g.scroll<=width+1,JSON.stringify(g));assert.ok(g.play.y>=0&&g.play.bottom<=height+1,JSON.stringify(g));assert.equal(Math.round(g.home.w),48);assert.equal(Math.round(g.home.h),48);if(width===320)assert.ok(g.tools.bottom<=g.transport.y,JSON.stringify(g));
   geometry.push({lang,...g});await p.screenshot({path:out+`/${engine}-${lang}-${width}x${height}-integrated.png`});
  }
 }
 report.geometry=geometry;check('Both languages fit five phone/tablet sizes; smallest portrait exposes tools and play together');
 await p.setViewportSize({width:1024,height:768});await p.locator('#play').tap();await p.waitForFunction(()=>trainDebug().running);await p.locator('header a').tap();await p.locator('.game-card').first().waitFor();check('Direct game URL also returns to the collection');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.bad,[]);report.passed=true;
 }finally{await b.close();fs.writeFileSync(out+'/'+engine+'-integration.json',JSON.stringify(report,null,2));all.push(report)}
 console.log(engine,report.checks.length,'integration groups passed');
}
(async()=>{for(const engine of (process.env.TRAIN_ENGINE?[process.env.TRAIN_ENGINE]:['chromium','webkit']))await run(engine);fs.writeFileSync(out+'/integration.json',JSON.stringify(all,null,2))})().catch(e=>{console.error(e);process.exitCode=1});
