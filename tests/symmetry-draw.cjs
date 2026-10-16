/* Real-browser acceptance tests. Run engines serially against the shared tree.
   SYMMETRY_BASE=http://127.0.0.1:18879 SYMMETRY_ENGINE=chromium
   SYMMETRY_EVIDENCE=/path/to/runtime node tests/symmetry-draw.cjs */
process.env.TMPDIR = '/tmp';
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || '/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const base = process.env.SYMMETRY_BASE || 'http://127.0.0.1:18879';
const engine = process.env.SYMMETRY_ENGINE || 'chromium', out = process.env.SYMMETRY_EVIDENCE;
assert(out, 'Set SYMMETRY_EVIDENCE'); fs.mkdirSync(out, { recursive: true });
const report = { engine, base, checks: [], errors: [], requests: [] };
let browser;
const check = (name, value = true) => { assert(value, name); report.checks.push(name); };
const url = base + '/games/symmetry_draw/index.html';
const key = 'xiaoxiaoSymmetryDraw.v1';

async function page(options = {}, audible = false) {
  const context = await browser.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true, ...options });
  const p = await context.newPage();
  p.on('pageerror', e => report.errors.push(e.message));
  p.on('response', r => { if (r.status() >= 400) report.requests.push({ status: r.status(), url: r.url() }); });
  await p.route('**/bankend/**', r => r.fulfill({ status: 204 }));
  await p.route('**/api/v1/**', r => r.fulfill({ status: 204 }));
  await p.addInitScript(audible => { localStorage.setItem('xiaoxiaoEnglishVoiceEnabled', audible ? 'true' : 'false'); }, audible);
  return p;
}
async function start(p) { await p.goto(url); await p.waitForSelector('[data-parts="6"]'); await p.waitForFunction(() => document.getElementById('draft-status').textContent.length > 0); }
async function draw(p, points, tap = false) {
  const r = await p.locator('#drawing').boundingBox();
  const at = ([x, y]) => [r.x + x / 1200 * r.width, r.y + y / 1200 * r.height];
  await p.mouse.move(...at(points[0])); await p.mouse.down();
  if (!tap) for (const v of points.slice(1)) await p.mouse.move(...at(v), { steps: 3 });
  await p.mouse.up();
}
async function pixels(p, points) {
  return p.evaluate(points => { const c = document.getElementById('drawing').getContext('2d'); return points.map(([x,y]) => Array.from(c.getImageData(Math.round(x),Math.round(y),1,1).data)); }, points);
}
const snapshot = p => p.evaluate(() => document.getElementById('drawing').toDataURL());
async function stored(p) { await p.waitForFunction(key => localStorage.getItem(key), key); await p.waitForFunction(() => !document.getElementById('draft-status').textContent.includes('…')); return p.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
async function close(p) { await p.context().close(); }

// Independent geometric oracle: fold the point into a wedge, then reflect it
// across each successive boundary. No production transform code is imported.
function mirrors([x, y], n) {
  const r = Math.hypot(x - 600, y - 600), width = 2 * Math.PI / n;
  let theta = (Math.atan2(y - 600, x - 600) + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
  const wedge = Math.floor(theta / width); theta %= width;
  if (wedge % 2) theta = width - theta;
  return Array.from({ length: n }, (_, k) => {
    const a = -Math.PI / 2 + k * width + (k % 2 ? width - theta : theta);
    return [600 + Math.cos(a) * r, 600 + Math.sin(a) * r];
  });
}
async function symmetry() {
  for (const n of [2,4,6,8]) {
    const p = await page(); await start(p); await p.click(`[data-parts="${n}"]`);
    await draw(p, [[720,250],[770,295],[740,340]]);
    for (const point of [[720,250],[770,295],[740,340]]) {
      const values = await pixels(p, mirrors(point,n));
      check(`${n} parts reflect all ${n} copies at ${point}`, values.every(v => v[0] > 200 && v[1] < 140 && v[3] > 240));
    }
    const p0=[720,250],angle=Math.atan2(p0[1]-600,p0[0]-600)+2*Math.PI/n,r=Math.hypot(p0[0]-600,p0[1]-600);
    const wrong=[600+Math.cos(angle)*r,600+Math.sin(angle)*r];
    check(`${n} parts are mirrored, not rotation-only`, (await pixels(p,[wrong]))[0][3]===0);
    check(`${n} dashed guide rays`, await p.locator('#guide-lines path').count()===n);
    const before = await snapshot(p); await p.click('#axes');
    check(`${n} guide toggle leaves artwork intact`, await snapshot(p)===before && await p.locator('#guides.off').count()===1);
    await p.click('#eraser'); await p.click('[data-size="2"]'); await draw(p,[[770,295]],true);
    check(`${n} eraser removes every reflected copy`, (await pixels(p,mirrors([770,295],n))).every(v=>v[3]===0));
    await p.click('#undo'); check(`${n} undo restores erased art`, await snapshot(p)===before);
    await p.click('#redo'); check(`${n} redo restores erasure`, (await pixels(p,mirrors([770,295],n))).every(v=>v[3]===0));
    await close(p);
  }
  const p=await page();await start(p);
  await draw(p,[[270,730],[300,760]]);
  check('Drawing starts in any sector', (await pixels(p,mirrors([270,730],6))).every(v=>v[3]>240));
  await p.click('#new');await p.click('#confirm-new');
  await draw(p,[[600,600]],true);
  check('A center tap makes a solid dot', (await pixels(p,[[600,600]]))[0][3]===255);
  await close(p);
}
async function editing() {
  const p = await page(); await start(p); await draw(p,[[720,250],[770,295],[740,340]]);
  const first = await snapshot(p);
  await p.click('[data-parts="8"]'); check('Mode change preserves previous art', await snapshot(p)===first);
  await p.click('[data-color="blue"]'); await p.click('[data-size="2"]'); await draw(p,[[680,440],[720,470]]);
  check('Selected color is drawn', (await pixels(p,[[680,440]]))[0][2]>150);
  const doc=await stored(p);check('Each stroke retains its own mode and color',doc.actions[0].parts===6&&doc.actions[1].parts===8&&doc.actions[1].color==='#648fbe');
  const second=await snapshot(p);await p.reload();await p.waitForSelector('[data-parts="8"][aria-pressed="true"]');
  check('Reload restores exactly the same drawing',await snapshot(p)===second);
  check('Reload restores brush settings',await p.locator('[data-color="blue"][aria-pressed="true"]').count()===1&&await p.locator('[data-size="2"][aria-pressed="true"]').count()===1);
  await p.click('#new');await p.click('#cancel-new');check('Cancel new paper preserves art',await snapshot(p)===second);
  await p.click('#new');await p.click('#confirm-new');check('New paper is empty and save is disabled',await p.locator('#save').isDisabled());
  await p.click('#undo');check('Undo new paper restores the whole drawing',await snapshot(p)===second);
  await p.keyboard.press('Control+z');check('Keyboard undo removes the last stroke',await snapshot(p)===first);
  await p.keyboard.press('Control+Shift+z');check('Keyboard redo restores the last stroke',await snapshot(p)===second);
  await p.setViewportSize({width:768,height:1024});check('Orientation/resize preserves pixel data',await snapshot(p)===second);
  await p.click('#eraser');await p.click('[data-color="green"]');check('Choosing a color returns from eraser to brush',await p.locator('#pen[aria-pressed="true"]').count()===1);
  await p.evaluate(()=>window.XiaoxiaoI18n.applyLanguage('zh'));check('Chinese labels and accessible names',await p.locator('h1').innerText()==='对称画'&&await p.locator('#undo').getAttribute('aria-label')==='撤销上一笔');
  await p.evaluate(()=>window.XiaoxiaoI18n.applyLanguage('en'));check('English labels and accessible names',await p.locator('h1').innerText()==='Symmetry Draw'&&await p.locator('#undo').getAttribute('aria-label')==='Undo');
  await p.click('#save');await p.waitForSelector('#save-dialog[open]');
  const clean=await p.evaluate(async()=>{
    const img=document.getElementById('preview');await img.decode();
    const expected=document.createElement('canvas'),actual=document.createElement('canvas');expected.width=actual.width=1200;expected.height=actual.height=1200;
    const a=expected.getContext('2d'),b=actual.getContext('2d');a.fillStyle='#fff';a.fillRect(0,0,1200,1200);a.drawImage(document.getElementById('drawing'),0,0);b.drawImage(img,0,0);
    const x=a.getImageData(0,0,1200,1200).data,y=b.getImageData(0,0,1200,1200).data;
    return {width:img.naturalWidth,height:img.naturalHeight,same:x.every((v,i)=>v===y[i])};
  });check('Export is 1200×1200 opaque art without axes or UI',clean.width===1200&&clean.height===1200&&clean.same);
  const download=await Promise.all([p.waitForEvent('download'),p.click('#download')]).then(x=>x[0]);
  await download.saveAs(path.join(out,'saved-picture.png'));const bytes=fs.readFileSync(path.join(out,'saved-picture.png'));
  check('Download produces a real PNG',bytes.readUInt32BE(16)===1200&&bytes.readUInt32BE(20)===1200&&bytes.subarray(1,4).toString()==='PNG');
  await p.click('#close-save');check('Close preview returns to painting',!await p.locator('#save-dialog').isVisible());
  const r=await p.locator('#drawing').boundingBox();await p.mouse.move(r.x+r.width*.62,r.y+r.height*.38);await p.mouse.down();await p.mouse.move(r.x+r.width*.65,r.y+r.height*.42);
  const active=await snapshot(p);await p.reload();await p.mouse.up();await p.waitForFunction(()=>document.getElementById('save').disabled===false);
  check('Leaving during a stroke saves the unfinished gesture',await snapshot(p)===active);
  await p.screenshot({path:path.join(out,'editing.png'),fullPage:true});
  await close(p);
}
async function touchAndFailure() {
  const p=await page({viewport:{width:390,height:844},hasTouch:true});await start(p);
  if(engine==='chromium'){
    const cdp=await p.context().newCDPSession(p),r=await p.locator('#drawing').boundingBox();
    const touch=(id,x,y)=>({id,x:r.x+x/1200*r.width,y:r.y+y/1200*r.height,radiusX:3,radiusY:3,force:1});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,720,250)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,770,295)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,770,295),touch(2,400,900)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,780,320),touch(2,440,930)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    check('Real Chromium touch drag draws mirrored strokes', (await pixels(p,mirrors([770,295],6))).every(v=>v[3]>240));
    const doc=await stored(p);check('Second finger does not create a stray stroke',doc.actions.length===1&&doc.actions[0].points.every(q=>q[1]<400));
  }else{await draw(p,[[720,250],[770,295]]);check('WebKit pointer input works on a phone layout',(await pixels(p,mirrors([770,295],6))).every(v=>v[3]>240));}
  await p.locator('#drawing').dispatchEvent('pointerdown',{pointerId:55,pointerType:'pen',button:0,clientX:200,clientY:300});
  await p.locator('#drawing').dispatchEvent('pointercancel',{pointerId:55,pointerType:'pen'});
  await draw(p,[[800,400],[800,440]]);check('Cancelled pointer does not leave drawing stuck',!(await p.locator('#undo').isDisabled()));
  await close(p);
  const blocked=await page();await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','QuotaExceededError')};});await start(blocked);await draw(blocked,[[720,250],[770,295]]);
  await blocked.waitForSelector('#draft-status.warning');check('Storage failure is visible and drawing still works',!(await blocked.locator('#save').isDisabled()));
  await blocked.click('#save');await blocked.waitForSelector('#save-dialog[open]');check('PNG export works with blocked storage');await close(blocked);
  const corrupt=await page();await corrupt.addInitScript(key=>localStorage.setItem(key,'{"version":99}'),key);await start(corrupt);
  check('Corrupt draft fails safely',await corrupt.locator('#draft-status.warning').count()===1);await draw(corrupt,[[720,250],[770,295]]);check('Drawing works after corrupt draft',!(await corrupt.locator('#save').isDisabled()));await close(corrupt);
  const silent=await page();await silent.route('**/symmetry_draw/audio/**',r=>r.abort());await start(silent);await silent.click('#voice');await draw(silent,[[720,250],[770,295]]);check('Audio failure does not block painting',!(await silent.locator('#save').isDisabled()));await close(silent);
}
async function layout() {
  for(const lang of ['en','zh'])for(const [w,h]of [[320,568],[390,844],[768,1024],[1024,768],[1366,900],[844,390]]){
    const p=await page({viewport:{width:w,height:h}});await p.addInitScript(lang=>localStorage.setItem('xiaoxiaoLanguage',lang),lang);await start(p);
    const metrics=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.getElementById('drawing').getBoundingClientRect().width,paletteBottom:document.getElementById('palette').getBoundingClientRect().bottom,hidden:[...document.querySelectorAll('button:not(:disabled)')].filter(e=>e.offsetParent&&!e.closest('dialog')&&e.getBoundingClientRect().right>innerWidth+1).map(e=>e.id)}));
    check(`${lang} ${w}×${h} no horizontal overflow`,!metrics.overflow&&metrics.hidden.length===0);
    check(`${lang} ${w}×${h} usable painting area`,metrics.canvas>=200);
    check(`${lang} ${w}×${h} finger-sized color buttons`,await p.locator('.swatch').evaluateAll(buttons=>buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44})));
    if(w<=390)check(`${lang} ${w}×${h} color buttons visible without scrolling`,metrics.paletteBottom<=h+1);
    await p.screenshot({path:path.join(out,`layout-${lang}-${w}-${h}.png`),fullPage:true});await close(p);
  }
}
async function endurance() {
  const p=await page();await start(p);
  for(let i=0;i<125;i++)await draw(p,[[650+i%10*15,250+Math.floor(i/10)*15]],true);
  const doc=await stored(p);check('Long session compacts old strokes without losing art',doc.actions.length<=120&&doc.base.startsWith('data:image/png;base64,'));
  const before=await snapshot(p);await p.reload();await p.waitForFunction(()=>document.getElementById('save').disabled===false);const after=await snapshot(p);
  // WebKit's PNG unpremultiplication changes a few antialiased RGB edges by
  // less than 3/255 after a second test decode. Require identical alpha and
  // opaque pixels; only antialiased transparent edges get this allowance.
  const delta=await p.evaluate(async({before,after})=>{
    const decode=async src=>{const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=c.height=1200;const x=c.getContext('2d');x.drawImage(img,0,0);return x.getImageData(0,0,1200,1200).data};
    const a=await decode(before),b=await decode(after);let visible=0,alpha=0,opaque=0;
    for(let i=0;i<a.length;i+=4){alpha=Math.max(alpha,Math.abs(a[i+3]-b[i+3]));for(let j=0;j<3;j++){const delta=Math.abs(a[i+j]*a[i+3]/255+255-a[i+3]-(b[i+j]*b[i+3]/255+255-b[i+3]));visible=Math.max(visible,delta);if(a[i+3]===255&&b[i+3]===255)opaque=Math.max(opaque,delta)}}return{visible,alpha,opaque};
  },{before,after});report.compactionPixelDelta=delta;
  check('Compacted artwork survives reload; opaque pixels and alpha unchanged',delta.alpha===0&&delta.opaque===0&&delta.visible<=3);await close(p);
}
async function voices() {
  const p=await page();await start(p);const files=JSON.parse(fs.readFileSync(path.join(__dirname,'../frontend-game/games/symmetry_draw/audio/manifest.json'))).clips;
  const decoded=await p.evaluate(async files=>{const a=new (window.AudioContext||window.webkitAudioContext)(),result=[];for(const f of files){const r=await fetch('audio/'+f.file);if(!r.ok)throw Error('Missing '+f.file);const b=await a.decodeAudioData(await r.arrayBuffer());result.push({duration:b.duration,nonzero:b.getChannelData(0).some(v=>Math.abs(v)>.01)});}await a.close();return result;},files);
  check('All 18 English recordings decode and contain sound',decoded.length===18&&decoded.every(r=>r.duration>.3&&r.nonzero));await close(p);
}
async function home(){
  const p=await page({viewport:{width:1024,height:768}},true);
  await p.addInitScript(()=>{window.__speechStarts=0;const old=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.__speechStarts++;return old.apply(this,args)}});
  await p.goto(base+'/');const frame=p.frameLocator('#content-frame');
  const card=frame.locator('a[href="games/symmetry_draw/index.html"]');await card.waitFor();check('Game is present in collection',await card.count()===1);
  check('Homepage cover loads',await card.locator('img').evaluate(async i=>{await i.decode();return i.naturalWidth===720&&i.naturalHeight===450}));
  await card.click();await frame.locator('#drawing').waitFor();check('Collection entry opens correct game',await frame.locator('h1').innerText()==='Symmetry Draw');
  check('Parent prepares an audio context for this game',await p.evaluate(()=>!!window.gameSpeechContext('symmetry_draw')));
  await p.waitForFunction(()=>window.__speechStarts>0);check('English welcome starts automatically after collection entry');
  await frame.locator('a[href="../../home.html"]').click();await frame.locator('.game-card').first().waitFor();check('Shared Home button returns to collection');
  await frame.locator('#language-toggle').click();await card.locator('.card-title').filter({hasText:'对称画'}).waitFor();check('Collection card translates into Chinese');
  await card.click();await frame.locator('h1').filter({hasText:'对称画'}).waitFor();check('Game inherits collection language');await close(p);
}
(async()=>{
  browser=engine==='webkit'?await webkit.launch({headless:true,executablePath:'/root/.cache/ms-playwright/webkit-2311/pw_run.sh'}):await chromium.launch({headless:true,executablePath:'/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',args:['--no-sandbox','--disable-gpu','--no-proxy-server']});
  for(const name of (process.env.SYMMETRY_GROUPS||'symmetry,editing,touchAndFailure,layout,endurance,voices').split(',')){await({symmetry,editing,touchAndFailure,layout,endurance,voices,home}[name])();console.log('PASS',name);}
  check('No uncaught page errors',report.errors.length===0);check('No missing runtime assets',report.requests.length===0);report.passed=true;
})().catch(e=>{report.passed=false;report.failure=e.stack;console.error(e.stack);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({engine,passed:report.passed,checks:report.checks.length}));await browser?.close();});
