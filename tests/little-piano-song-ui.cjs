process.env.TMPDIR='/tmp';
const {chromium,webkit}=require('/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
const base=process.env.PIANO_BASE||'http://127.0.0.1:8003';
(async()=>{for(const engine of ['chromium','webkit']){
 const b=await({chromium,webkit}[engine]).launch({executablePath:engine==='chromium'?'/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome':'/root/.cache/ms-playwright/webkit-2311/pw_run.sh',args:engine==='chromium'?['--no-sandbox','--disable-gpu']:[]});
 try{const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});await p.route(/\/(bankend|api)\//,r=>r.abort());await p.goto(base+'/games/little_piano/');await p.waitForFunction(()=>window.pianoDebug?.().ready);await p.locator('[data-mode=guide]').click();
 const geometry=[];
 for(const lang of ['zh','en']){await p.evaluate(l=>XiaoxiaoI18n.applyLanguage(l),lang);for(const size of [{width:390,height:844},{width:844,height:390},{width:768,height:1024}]){
  await p.setViewportSize(size);
  for(const id of ['mushroom','old-macdonald','clementine']){
   await p.locator('#choose').click();await p.locator(`[data-song="${id}"]`).click();
   const s=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bottom:document.querySelector('.instrument').getBoundingClientRect().bottom,height:innerHeight,chooseRight:document.querySelector('#choose').getBoundingClientRect().right}));assert(s.scroll<=s.width+1);assert(s.bottom<=s.height+1);assert(s.chooseRight<s.width);geometry.push({lang,id,...size,...s});
  }
 }
 }
 await p.setViewportSize({width:390,height:844});await p.evaluate(()=>XiaoxiaoI18n.applyLanguage('zh'));await p.locator('#choose').click();await p.locator('#songs').evaluate(d=>d.scrollTop=0);await p.screenshot({path:process.env.CWW_JOB_RUNTIME+'/songs-'+engine+'.png'});
 await p.locator('[data-song=raindrops]').scrollIntoViewIfNeeded();assert(await p.locator('#songs .close').isVisible());await p.locator('#songs .close').click();assert.equal(await p.locator('#songs').isVisible(),false);
 // Opening Mushroom Girl has real phrase rests; play from its button, not from debug state.
 await p.locator('[data-mode=listen]').click();await p.locator('#choose').click();await p.locator('[data-song=mushroom]').click();await p.locator('#tempo').selectOption('1');await p.waitForFunction(()=>pianoDebug().cursor===7,null,{timeout:10000});await p.waitForTimeout(700);assert.equal(await p.locator('.key.sounding').count(),0,'key stays lit during phrase rest');await p.waitForFunction(()=>pianoDebug().finished,null,{timeout:40000});assert.equal((await p.evaluate(()=>pianoDebug())).cursor,34);
 fs.writeFileSync(process.env.CWW_JOB_RUNTIME+'/songs-ui-'+engine+'.json',JSON.stringify({engine,passed:true,geometry,mushroomPlaybackCompleted:true},null,2));console.log(engine,'long titles, chooser, full Mushroom Girl playback PASS');
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
