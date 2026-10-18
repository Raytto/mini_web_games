/* Check the real collection shell on a loopback server. No production events. */
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../frontend-game');
const out = process.env.CWW_JOB_RUNTIME || process.env.HIDE_SEEK_QA_DIR;
if (!out) throw Error('Set CWW_JOB_RUNTIME or HIDE_SEEK_QA_DIR.');
const report = {started:new Date().toISOString(), engines:[], errors:[]};
const server = http.createServer((req,res) => {
  const url = new URL(req.url,'http://localhost');
  const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try {
    const body = fs.readFileSync(file), ext = path.extname(file);
    res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.mp3':'audio/mpeg','.webp':'image/webp','.png':'image/png'})[ext] || 'application/octet-stream'});
    res.end(body);
  } catch {res.writeHead(404).end();}
});
let browser;
async function choose(frame,key) {
  await frame.locator('#worlds').click();
  await frame.locator(`[data-q="${key}"]`).click();
  assert.equal(await frame.locator('#stage').getAttribute('data-question'),key);
}
async function slot(frame,id) {
  return frame.evaluate(animal => {
    const expected = document.createElementNS('http://www.w3.org/2000/svg','svg');
    expected.innerHTML = window.HideSeekArt.animalArt(animal);
    const found = [...document.querySelectorAll('.hideout')].findIndex(b => b.querySelector('.friend>svg').innerHTML === expected.innerHTML);
    if(found < 0) throw Error('Animal is missing from this scene: ' + animal);
    return found;
  }, id);
}
(async () => {
  await new Promise(r => server.listen(0,'127.0.0.1',r));
  const base = 'http://127.0.0.1:' + server.address().port;
  for (const [name,type] of [['chromium',chromium],['webkit',webkit]]) {
    browser = await type.launch({headless:true,args:name==='chromium'?['--disable-gpu','--no-zygote','--single-process']:[]});
    // Make the deliberate failed-audio request deterministic: a previously
    // cached service-worker response would bypass Playwright's route handler.
    const context = await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,serviceWorkers:'block'});
    await context.addInitScript(() => {
      window.MiniTracking = {};
      window.__qaAudio = {starts:[],stops:0};
      const proto = window.AudioBufferSourceNode?.prototype;
      if (proto) {
        const start = proto.start, stop = proto.stop;
        proto.start = function(...args) {window.__qaAudio.starts.push({duration:this.buffer?.duration,time:performance.now(),state:this.context.state});return start.apply(this,args);};
        proto.stop = function(...args) {window.__qaAudio.stops++;return stop.apply(this,args);};
      }
    });
    const p = await context.newPage();
    p.on('pageerror',e => report.errors.push(name+': '+e.message));
    await p.goto(base+'/');
    let f = p.frameLocator('#content-frame');
    const card = f.locator('a[href="games/hide_seek/index.html"]');
    await card.waitFor();
    assert.equal(await f.locator('.game-card').count(),44);
    assert.equal(await card.locator('.card-title').innerText(),'Hide & Seek');
    assert.equal(await card.getAttribute('data-min-age'),'3');
    assert.equal(await f.locator('a[href*="rhythm_train"]').count(),1);
    assert.equal(await f.locator('a[href*="symmetry_draw"]').count(),1);
    await card.scrollIntoViewIfNeeded();
    await card.locator('img').evaluate(img => img.decode());
    assert.equal(await card.locator('img').evaluate(img => img.naturalWidth),720);
    await card.tap();
    await f.locator('.hideout').first().waitFor();
    let game = p.frames().find(frame => frame.url().includes('/games/hide_seek/'));
    assert.ok(game);
    const homeIconType=await game.evaluate(async()=>{
      const background=getComputedStyle(document.querySelector('#home'),'::before').backgroundImage;
      const url=background.match(/url\(["']?(.*?)["']?\)/)?.[1];
      if(!url) throw Error('Missing shared Home icon');
      return (await fetch(url)).headers.get('content-type');
    });
    assert.match(homeIconType,/image\/svg\+xml/);
    await p.waitForFunction(() => window.__qaAudio.starts.some(x=>x.duration>0 && x.state==='running'));
    const shell = await p.evaluate(() => {
      window.__qaContext = window.gameSpeechContext('hide_seek');
      return {mode:document.querySelector('#bgm').dataset.mode,paused:document.querySelector('#bgm').paused,toggle:getComputedStyle(document.querySelector('#music-toggle')).display,state:window.__qaContext.state};
    });
    assert.deepEqual(shell,{mode:'lesson',paused:true,toggle:'none',state:'running'});
    await choose(game,'forest:rabbit');
    await game.locator(`.hideout[data-slot="${await slot(game,'owl')}"]`).tap();
    assert.match(await game.locator('#message').innerText(),/It’s the owl!/);
    assert.equal(await game.locator('#next').isVisible(),false);
    await game.locator(`.hideout[data-slot="${await slot(game,'rabbit')}"]`).tap();
    assert.equal(await game.locator('#next').isVisible(),true);
    await game.locator('#next').tap();
    const beforeRapid = await p.evaluate(()=>window.__qaAudio.starts.length);
    for(let i=0;i<3;i++) await game.locator('#target').click();
    await p.waitForFunction(n=>window.__qaAudio.starts.length>n,beforeRapid);
    await game.locator('#sound').click();
    const atMute = await p.evaluate(()=>window.__qaAudio.starts.length);
    await p.waitForTimeout(800);
    assert.equal(await p.evaluate(()=>window.__qaAudio.starts.length),atMute);
    assert.ok(await p.evaluate(()=>window.__qaAudio.stops>0));
    await game.locator('#home').tap();
    await f.locator('.game-card').first().waitFor();
    // The shell closes the borrowed context in the iframe's load handler.
    await p.waitForFunction(()=>window.__qaContext.state==='closed',null,{timeout:10000});
    assert.equal(await p.evaluate(()=>window.__qaContext.state),'closed');
    await f.locator('#language-toggle').tap();
    assert.equal(await card.locator('.card-title').innerText(),'小伙伴藏哪儿');
    await card.tap();
    await f.locator('.hideout').first().waitFor();
    game = p.frames().find(frame => frame.url().includes('/games/hide_seek/'));
    assert.equal(await game.locator('h1').innerText(),'小伙伴藏哪儿');
    assert.equal(await game.locator('#sound').getAttribute('aria-pressed'),'true');
    await choose(game,'camp:owl');
    await game.locator('#hint').tap();
    assert.equal(await game.locator('.hinted').count(),1);
    await game.locator('.hinted').tap();
    assert.equal(await game.locator('#next').isVisible(),true);
    // A failed voice request must show a retry hint without preventing play.
    await p.route('**/english_shared/audio/**',route=>route.abort());
    await game.locator('#sound').tap();
    await choose(game,'farm:chick');
    await game.waitForFunction(()=>document.querySelector('#audioNote').textContent.includes('暂时不可用'));
    await p.unroute('**/english_shared/audio/**');
    const beforeRetry = await p.evaluate(()=>window.__qaAudio.starts.length);
    await game.locator('#target').tap();
    await p.waitForFunction(n=>window.__qaAudio.starts.length>n,beforeRetry);
    await game.locator(`.hideout[data-slot="${await slot(game,'chick')}"]`).tap();
    assert.equal(await game.locator('#next').isVisible(),true);
    await game.locator('#worlds').tap();
    assert.equal(await game.locator('.scene-card').count(),12);
    await game.locator('#closeWorlds').tap();
    await game.locator('#sound').tap();
    const layouts=[];
    for(const language of ['en','zh']) {
      await game.evaluate(value=>window.XiaoxiaoI18n.applyLanguage(value),language);
      for(const [width,height] of [[1365,900],[1024,768],[768,1024],[390,844],[320,568],[844,390]]) {
        await p.setViewportSize({width,height});
        await choose(game,'forest:rabbit');
        const measure = async selector => game.evaluate(s=>{
          scrollTo(0,0);const b=document.querySelector(s).getBoundingClientRect();
          return {top:b.top,bottom:b.bottom,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};
        },selector);
        const hint=await measure('#hint');
        assert.ok(hint.top>=0 && hint.bottom<=height,JSON.stringify({language,width,height,hint}));
        assert.equal(hint.overflow,false);
        await game.locator(`.hideout[data-slot="${await slot(game,'rabbit')}"]`).tap();
        const next=await measure('#next');
        assert.ok(next.top>=0 && next.bottom<=height,JSON.stringify({language,width,height,next}));
        assert.equal(next.overflow,false);
        layouts.push({language,width,height,hintBottom:hint.bottom,nextBottom:next.bottom});
      }
    }
    await p.setViewportSize({width:1024,height:768});
    await choose(game,'beach:turtle');
    await p.screenshot({path:path.join(out,`hide-seek-collection-${name}.png`),fullPage:true});
    const result={name,cards:44,autoSpeech:true,lessonMusic:true,sharedContextClosed:true,rapidSpeechCancellation:true,voicePreference:true,languageInherited:true,voiceFailureAndRetry:true,touchHome:true,scenePicker:12,layouts};
    report.engines.push(result);
    console.log(JSON.stringify(result));
    await browser.close(); browser = null;
  }
  assert.deepEqual(report.errors,[]);
  report.ok=true; report.finished=new Date().toISOString();
  report.files={};
  for(const name of ['index.html','home.html','games/hide_seek/index.html','games/hide_seek/style.css','games/hide_seek/art.js','games/hide_seek/game.js','games/hide_seek/voice.js','games/hide_seek/voices.js','scripts/hide-seek-home.js','assets/thumbnails/hide-seek-v1.webp']) {
    report.files[name]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
  }
})().catch(error=>{report.ok=false;report.error=error.stack;console.error(error);process.exitCode=1;}).finally(async()=>{
  if(browser) await browser.close().catch(()=>{});
  server.close();
  fs.writeFileSync(path.join(out,'hide-seek-collection-qa.json'),JSON.stringify(report,null,2));
});
