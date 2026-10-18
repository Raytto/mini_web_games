// Render the original game's vector art into the collection's 720 × 450 cover.
// Requires Playwright Chromium and ffmpeg. Keep temporary renders outside the repo.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../..');
const runtime = process.env.CWW_JOB_RUNTIME;
if (!runtime) throw new Error('Set CWW_JOB_RUNTIME to a temporary output directory.');
const scope = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'frontend-game/games/hide_seek/art.js'), 'utf8'), scope);
const {animalArt, clueSource, coverArt, backdrop} = scope.window.HideSeekArt;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 625">
  <g transform="translate(0,-85)">${backdrop('forest')}</g>
  <ellipse cx="272" cy="554" rx="174" ry="23" fill="#617b57" opacity=".16"/>
  <svg x="44" y="148" width="420" height="420" viewBox="0 0 200 200">${animalArt('rabbit')}</svg>
  <g transform="translate(727,317) scale(1.32)">${coverArt('bush')}
    <svg x="55" y="-150" width="72" height="110" viewBox="131 78 65 94" overflow="hidden">${clueSource('fox')}</svg>
  </g>
  <g transform="translate(710,544) scale(1.15)">
    <svg x="-88" y="-195" width="177" height="177" viewBox="0 0 200 200">${animalArt('owl')}</svg>
    ${coverArt('leaves')}
  </g>
</svg>`;
(async () => {
  const png = path.join(runtime, 'hide-seek-cover-render.png');
  const output = path.join(root, 'frontend-game/assets/thumbnails/hide-seek-v1.webp');
  const browser = await chromium.launch({headless: true, args: ['--disable-gpu', '--no-zygote', '--single-process']});
  try {
    const page = await browser.newPage({viewport: {width: 720, height: 450}, deviceScaleFactor: 1});
    await page.setContent('<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}svg{display:block;width:100%;height:100%}</style>' + svg);
    await page.screenshot({path: png});
    const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', png, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '88', output], {encoding:'utf8'});
    if (result.status !== 0) throw new Error(result.stderr || 'WebP conversion failed');
    console.log('Rendered cover: ' + path.relative(root, output));
  } finally {
    await browser.close();
    fs.rmSync(png, {force:true});
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
