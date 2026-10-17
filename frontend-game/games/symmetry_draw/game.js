import { SIZE, MODES, COLORS, PEN_SIZES, ERASER_SIZES, segment, action, hasInk, validateDocument } from './engine.js?v=20261016sym1';
import { Voice } from './voice.js?v=20261017warm1';

const $ = id => document.getElementById(id);
const canvas = $('drawing'), ctx = canvas.getContext('2d'), base = document.createElement('canvas');
base.width = base.height = SIZE;
const baseCtx = base.getContext('2d'), voice = new Voice(), KEY = 'xiaoxiaoSymmetryDraw.v1';
const words = {
  title: ['对称画', 'Symmetry Draw'], subtitle: ['画一笔，发现小惊喜。', 'A little line. A lovely surprise.'],
  home: ['回首页', 'Home'], save: ['保存作品', 'Save picture'], mirror: ['选一种对称', 'Make it mirror'],
  modeNote: ['在任意一片画，相邻的画会镜像出现。', 'Try any slice. Every line has a friend.'],
  colors: ['挑个颜色', 'Pick a color'], create: ['开始画吧', 'Make your mark'], tools: ['绘画工具', 'Drawing tools'],
  pen: ['画笔', 'Brush'], eraser: ['橡皮擦', 'Eraser'], eraseNote: ['橡皮擦也会对称地擦除哦。', 'The eraser mirrors, too.'],
  size: ['笔触大小', 'Brush size'], thin: ['细', 'Small'], medium: ['中', 'Medium'], thick: ['粗', 'Large'],
  undo: ['撤销上一笔', 'Undo'], redo: ['恢复上一笔', 'Redo'], guides: ['虚线', 'Guides'], new: ['新画纸', 'New'],
  drawingArea: ['对称画板', 'Symmetry drawing area'], canvas: ['用手指、鼠标或画笔在这里绘画', 'Draw here with your finger, mouse or pen'],
  start: ['随便画一笔吧！', 'Draw a little line!'], hint: ['画在一片里，惊喜开满整张纸。', 'Draw in one slice. Watch it bloom everywhere.'],
  saved: ['画作已记在这个浏览器里', 'Your drawing is remembered in this browser'], saving: ['正在记住画作…', 'Remembering your drawing…'],
  blank: ['放心画，画作会自动记住', 'Make yourself at home. Your drawing is remembered.'],
  storageError: ['暂时无法记住草稿，请用“保存作品”下载图片', 'Draft storage is unavailable. Use Save picture to keep your art.'],
  loadError: ['上次的草稿没能打开，可以开始新画作', 'The last draft could not be opened. You can start a new picture.'],
  madeByYou: ['小小艺术家的作品', 'MADE BY YOU'], pictureReady: ['你的作品，真好看', 'Your little masterpiece'],
  preview: ['可长按保存的画作预览', 'Your picture, ready to save'], cleanPicture: ['只留下你的画，虚线不会保存。', 'Just your art. No guide lines.'],
  download: ['下载图片', 'Download PNG'], share: ['分享 / 存到相册', 'Share / Save image'],
  saveHelp: ['手机上也可以长按图片，选择保存到照片。', 'On a phone, you can also press and hold the picture to save it.'],
  downloaded: ['已发起图片下载，也可以长按上面的图片保存。', 'Download started. You can also press and hold the picture.'],
  shareFailed: ['暂时无法分享，可以下载或长按图片保存。', 'Sharing is unavailable. Download or press and hold the picture instead.'],
  saveFailed: ['图片暂时没有准备好，请再试一次。画作还在。', 'Could not prepare the image. Please try again. Your drawing is still here.'],
  preparing: ['正在准备图片…', 'Preparing your picture…'], close: ['关闭', 'Close'],
  newTitle: ['换一张新画纸吗？', 'A fresh piece of paper?'],
  newHelp: ['喜欢这幅画的话，先保存下来吧。换纸后也能用撤销找回来。', 'Save your picture first if you like. You can also undo a fresh start.'],
  keepDrawing: ['继续画这张', 'Keep drawing'], freshStart: ['开始画新画', 'Start a new picture'],
  voiceOn: ['英语语音已开启，点击关闭', 'English voice on. Tap to mute'], voiceOff: ['英语语音已关闭，点击开启', 'English voice off. Tap to enable'],
  modeChanged: ['接下来画 {n} 等分，已经画好的会保留。', 'New lines mirror into {n} parts. Your earlier drawing stays.'],
  restored: ['接着上次的画，继续创作吧。', 'Welcome back. Your picture is right where you left it.'],
  parts: ['{n} 等分对称', '{n} mirror parts'], moreTools: ['更多工具', 'More tools'], settings: ['工具 · {n}', 'Tools · {n}']
};
let lang = 'en';
try { lang = parent.XiaoxiaoI18n?.language || (localStorage.getItem('xiaoxiaoLanguage') === 'zh' ? 'zh' : 'en'); } catch {}
const t = key => words[key]?.[lang === 'zh' ? 0 : 1] || key;
let parts = 6, color = COLORS[0][1], size = 1, tool = 'pen', showGuides = true;
let actions = [], redo = [], baseInk = false, baseData = '', active = null, ready = false;
let saveTimer, toastTimer, imageURL = '', imageFile = null, exporting = false, draftState = 'blank';
let restored = false, storageBroken = false, strokePointCount = 0;
try { voice.enabled = localStorage.getItem('xiaoxiaoEnglishVoiceEnabled') !== 'false'; } catch {}

function modeIcon(n) {
  let rays = '', sectors = '';
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + k * 2 * Math.PI / n, b = a + 2 * Math.PI / n;
    const x = 20 + 17 * Math.cos(a), y = 20 + 17 * Math.sin(a);
    if (k % 2 === 0) sectors += `<path d="M20 20L${x} ${y}A17 17 0 0 1 ${20 + 17 * Math.cos(b)} ${20 + 17 * Math.sin(b)}Z" fill="#a7bd9e"/>`;
    rays += `<path d="M20 20L${x} ${y}"/>`;
  }
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#fffdf7"/>${sectors}<g fill="none" stroke="#64816a" stroke-width="1.2">${rays}<circle cx="20" cy="20" r="17"/></g></svg>`;
}
for (const n of MODES) {
  const button = document.createElement('button'); button.className = 'mode'; button.dataset.parts = n;
  button.innerHTML = `${modeIcon(n)}<span>${n}</span>`;
  button.onclick = () => {
    finish(); if (parts === n) return;
    parts = n; renderUI(); remember();
    if (hasInk(baseInk, actions)) toast(t('modeChanged').replace('{n}', n));
    void voice.say(`mode${n}`);
  };
  $('modes').append(button);
}
for (const [name, hex, zh] of COLORS) {
  const button = document.createElement('button'); button.className = 'swatch'; button.dataset.color = name;
  button.style.setProperty('--swatch', hex);
  button.onclick = () => { finish(); color = hex; tool = 'pen'; renderUI(); remember(); void voice.say(`color_${name}`); };
  $('palette').append(button);
}

function drawGuides() {
  const lines = [];
  for (let i = 0; i < parts; i++) {
    const a = -Math.PI / 2 + i * Math.PI * 2 / parts;
    lines.push(`<path d="M600 600L${600 + Math.cos(a) * 600} ${600 + Math.sin(a) * 600}"/>`);
  }
  $('guide-lines').innerHTML = `<g fill="none" stroke="#becdc4" stroke-width="2.3" stroke-dasharray="9 13" stroke-linecap="round">${lines.join('')}</g>`;
  $('guides').classList.toggle('off', !showGuides);
}
function renderUI() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'; document.title = `${t('title')} · Xiaoxiao`;
  document.querySelectorAll('[data-t]').forEach(e => { e.textContent = t(e.dataset.t); });
  document.querySelectorAll('[data-label]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.label)); e.title = t(e.dataset.label); });
  document.querySelectorAll('[data-parts]').forEach(b => {
    b.setAttribute('aria-pressed', Number(b.dataset.parts) === parts);
    b.setAttribute('aria-label', t('parts').replace('{n}', b.dataset.parts));
  });
  for (const [name, hex, zh] of COLORS) {
    const button = document.querySelector(`[data-color="${name}"]`), selected = hex === color;
    const label = lang === 'zh' ? zh : name[0].toUpperCase() + name.slice(1);
    button.setAttribute('aria-label', label); button.title = label; button.setAttribute('aria-pressed', selected);
    if (selected) $('color-name').textContent = label;
  }
  $('settings-label').textContent = t('settings').replace('{n}', parts);
  $('pen').setAttribute('aria-pressed', tool === 'pen'); $('eraser').setAttribute('aria-pressed', tool === 'eraser');
  document.documentElement.style.setProperty('--color', tool === 'eraser' ? '#9aa598' : color);
  document.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.size) === size));
  $('axes').setAttribute('aria-pressed', showGuides);
  $('voice').setAttribute('aria-pressed', voice.enabled); $('voice').setAttribute('aria-label', t(voice.enabled ? 'voiceOn' : 'voiceOff'));
  $('voice').title = t(voice.enabled ? 'voiceOn' : 'voiceOff'); $('voice').querySelector('use').setAttribute('href', voice.enabled ? '#i-sound' : '#i-muted');
  $('draft-status').textContent = t(draftState); $('draft-status').classList.toggle('warning', storageBroken || draftState === 'loadError');
  if (restored) $('hint').textContent = t('restored');
  drawGuides(); updateHistory();
}
function updateHistory() {
  const ink = hasInk(baseInk, actions) || active?.stroke.tool === 'pen';
  $('undo').disabled = !actions.length && !active; $('redo').disabled = !redo.length;
  $('save').disabled = !ink || exporting || !ready; $('new').disabled = !ink || !ready;
  $('empty-hint').hidden = !!ink;
}
function repaint() {
  ctx.clearRect(0, 0, SIZE, SIZE); ctx.drawImage(base, 0, 0);
  actions.forEach(a => action(ctx, a)); updateHistory();
}
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3400); }
function draftStatus(key) { draftState = key; $('draft-status').textContent = t(key); $('draft-status').classList.toggle('warning', storageBroken || key === 'loadError'); }
function compact() {
  strokePointCount = actions.reduce((sum, a) => sum + (a.points?.length || 0), 0);
  if (actions.length <= 120 && strokePointCount <= 80000) return;
  let count = actions.length > 120 ? 40 : Math.max(1, Math.floor(actions.length / 2));
  const old = actions.splice(0, count); old.forEach(a => action(baseCtx, a));
  baseInk = hasInk(baseInk, old); baseData = base.toDataURL('image/png');
}
function persist() {
  clearTimeout(saveTimer); if (!ready) return;
  try {
    compact();
    localStorage.setItem(KEY, JSON.stringify({ version: 1, parts, color, size, tool, showGuides, base: baseData, baseInk, actions }));
    storageBroken = false; draftStatus(hasInk(baseInk, actions) ? 'saved' : 'blank');
  } catch { storageBroken = true; draftStatus('storageError'); }
}
function remember() { if (!ready) return; draftStatus(storageBroken ? 'storageError' : 'saving'); clearTimeout(saveTimer); saveTimer = setTimeout(persist, 400); }
async function restore() {
  try {
    const text = localStorage.getItem(KEY);
    if (text) {
      if (text.length > 9000000) throw new Error('Draft too large');
      const doc = validateDocument(JSON.parse(text)); if (!doc) throw new Error('Invalid draft');
      if (doc.base) {
        const image = new Image(); image.src = doc.base; await image.decode();
        if (image.width !== SIZE || image.height !== SIZE) throw new Error('Invalid draft size');
        baseCtx.drawImage(image, 0, 0); baseData = doc.base; baseInk = !!doc.baseInk;
      }
      parts = doc.parts; actions = doc.actions;
      if (COLORS.some(c => c[1] === doc.color)) color = doc.color;
      if ([0, 1, 2].includes(doc.size)) size = doc.size;
      if (['pen', 'eraser'].includes(doc.tool)) tool = doc.tool;
      showGuides = doc.showGuides !== false;
      restored = hasInk(baseInk, actions); draftState = restored ? 'saved' : 'blank';
    }
  } catch (error) {
    draftState = error.name === 'SecurityError' ? 'storageError' : 'loadError';
    storageBroken = error.name === 'SecurityError';
  }
  ready = true; repaint(); renderUI(); voice.welcome();
}

function point(event) {
  const r = canvas.getBoundingClientRect();
  return [Math.max(-SIZE, Math.min(SIZE * 2, Math.round((event.clientX - r.left) / r.width * SIZE * 10) / 10)),
    Math.max(-SIZE, Math.min(SIZE * 2, Math.round((event.clientY - r.top) / r.height * SIZE * 10) / 10))];
}
function cursor(event) {
  if (event.pointerType === 'touch') { $('cursor').style.display = 'none'; return; }
  const r = canvas.getBoundingClientRect(), diameter = (tool === 'pen' ? PEN_SIZES : ERASER_SIZES)[size] / SIZE * r.width;
  const e = $('cursor'); e.classList.toggle('eraser', tool === 'eraser');
  Object.assign(e.style, { display: 'block', left: `${event.clientX - r.left}px`, top: `${event.clientY - r.top}px`, width: `${Math.max(5, diameter)}px`, height: `${Math.max(5, diameter)}px` });
}
function addPoint(event) {
  const p = point(event), stroke = active.stroke, last = stroke.points.at(-1);
  if (Math.hypot(last[0] - p[0], last[1] - p[1]) < .65) return;
  // Very long gestures are split without breaking the visible line. The new
  // chunk is also undoable, and bounds persisted memory on a held stylus.
  if (stroke.points.length >= 6000) {
    actions.push(stroke); compact();
    active.stroke = { ...stroke, points: [last] };
  }
  segment(ctx, active.stroke, last, p); active.stroke.points.push(p);
}
canvas.addEventListener('pointerdown', event => {
  if (!ready || active || event.button !== 0 || $('save-dialog').open || $('new-dialog').open) return;
  const p = point(event); if (Math.hypot(p[0] - 600, p[1] - 600) > 600) return;
  event.preventDefault();
  const stroke = { type: 'stroke', tool, color, parts, width: (tool === 'pen' ? PEN_SIZES : ERASER_SIZES)[size], points: [p] };
  active = { id: event.pointerId, stroke }; redo = []; restored = false;
  try { canvas.setPointerCapture(event.pointerId); } catch {}
  segment(ctx, stroke, p, p); cursor(event); updateHistory();
});
canvas.addEventListener('pointermove', event => {
  if (active && event.pointerId !== active.id) return;
  cursor(event); if (!active) return; event.preventDefault();
  const events = event.getCoalescedEvents?.();
  for (const item of events?.length ? events : [event]) addPoint(item);
});
function finish() {
  if (!active) return;
  const current = active; active = null; actions.push(current.stroke);
  try { if (canvas.hasPointerCapture(current.id)) canvas.releasePointerCapture(current.id); } catch {}
  updateHistory(); remember();
}
canvas.addEventListener('pointerup', event => { if (active?.id === event.pointerId) { addPoint(event); finish(); } });
canvas.addEventListener('pointercancel', event => { if (active?.id === event.pointerId) finish(); });
canvas.addEventListener('lostpointercapture', event => { if (active?.id === event.pointerId) finish(); });
canvas.addEventListener('pointerleave', () => { $('cursor').style.display = 'none'; });
canvas.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('pointerdown', () => { void voice.unlock(); }, { capture: true });
function undoStroke() { finish(); if (!actions.length) return; redo.push(actions.pop()); repaint(); remember(); }
function redoStroke() { finish(); if (!redo.length) return; actions.push(redo.pop()); repaint(); remember(); }
$('undo').onclick = undoStroke; $('redo').onclick = redoStroke;
for (const name of ['pen', 'eraser']) $(name).onclick = () => { finish(); tool = name; renderUI(); remember(); void voice.say(name); };
document.querySelectorAll('[data-size]').forEach(b => { b.onclick = () => { finish(); size = Number(b.dataset.size); renderUI(); remember(); }; });
$('axes').onclick = () => { showGuides = !showGuides; renderUI(); remember(); };
$('voice').onclick = () => {
  voice.enabled = !voice.enabled; voice.stop();
  try { localStorage.setItem('xiaoxiaoEnglishVoiceEnabled', voice.enabled); } catch {}
  renderUI(); if (voice.enabled) { voice.welcomed = true; void voice.say('welcome'); }
};
const settingsDialog = $('settings-dialog');
$('settings').onclick = () => { finish(); settingsDialog.showModal(); $('settings').setAttribute('aria-expanded', 'true'); };
$('close-settings').onclick = () => settingsDialog.close();
settingsDialog.addEventListener('close', () => { $('settings').setAttribute('aria-expanded', 'false'); $('settings').focus({ preventScroll: true }); });
let backdropStart = false;
settingsDialog.addEventListener('pointerdown', event => { const r = settingsDialog.getBoundingClientRect(); backdropStart = event.target === settingsDialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom); });
settingsDialog.addEventListener('click', event => { const r = settingsDialog.getBoundingClientRect(); if (backdropStart && event.target === settingsDialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) settingsDialog.close(); backdropStart = false; });
$('new').onclick = () => { finish(); $('new-dialog').showModal(); };
$('cancel-new').onclick = () => $('new-dialog').close();
$('confirm-new').onclick = () => {
  finish(); actions.push({ type: 'clear' }); redo = []; restored = false; $('new-dialog').close(); settingsDialog.close(); repaint(); remember();
};

function dropPreview() { if (imageURL) URL.revokeObjectURL(imageURL); imageURL = ''; imageFile = null; $('preview').removeAttribute('src'); }
$('save').onclick = async () => {
  finish(); if (exporting || !hasInk(baseInk, actions)) return;
  exporting = true; updateHistory();
  try {
    const output = document.createElement('canvas'); output.width = output.height = SIZE;
    const c = output.getContext('2d'); c.fillStyle = '#ffffff'; c.fillRect(0, 0, SIZE, SIZE); c.drawImage(canvas, 0, 0);
    const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png')); if (!blob) throw new Error('No image');
    dropPreview(); imageURL = URL.createObjectURL(blob);
    const now = new Date(), pad = n => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    imageFile = new File([blob], `xiaoxiao-symmetry-${stamp}.png`, { type: 'image/png' });
    $('preview').src = imageURL; $('save-status').textContent = '';
    let canShare = false; try { canShare = !!navigator.canShare?.({ files: [imageFile] }); } catch {}
    $('share').hidden = !canShare; $('save-dialog').showModal(); void voice.say('picture'); persist();
  } catch { toast(t('saveFailed')); }
  finally { exporting = false; updateHistory(); }
};
$('download').onclick = () => {
  if (!imageFile || !imageURL) return;
  const link = document.createElement('a'); link.href = imageURL; link.download = imageFile.name; document.body.append(link); link.click(); link.remove();
  $('save-status').textContent = t('downloaded');
};
$('share').onclick = async () => {
  if (!imageFile) return;
  try { await navigator.share({ files: [imageFile], title: t('title') }); }
  catch (error) { if (error.name !== 'AbortError') $('save-status').textContent = t('shareFailed'); }
};
$('close-save').onclick = () => $('save-dialog').close();
// Keep the blob alive after closing so an in-flight browser download can finish.
// It is released on the next export or when this document is destroyed.
window.addEventListener('keydown', event => {
  if ($('save-dialog').open || $('new-dialog').open || settingsDialog.open || event.altKey) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault(); event.shiftKey ? redoStroke() : undoStroke();
  }
});
window.addEventListener('resize', () => { finish(); $('cursor').style.display = 'none'; });
window.addEventListener('pagehide', () => { finish(); persist(); voice.stop(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { finish(); persist(); voice.stop(); } });
window.XiaoxiaoI18n = { get language() { return lang; }, applyLanguage(value) { lang = value === 'zh' ? 'zh' : 'en'; renderUI(); } };
window.addEventListener('storage', event => {
  if (event.key === 'xiaoxiaoLanguage') window.XiaoxiaoI18n.applyLanguage(event.newValue);
  if (event.key === 'xiaoxiaoEnglishVoiceEnabled') { voice.enabled = event.newValue !== 'false'; if (!voice.enabled) voice.stop(); renderUI(); }
});
renderUI(); void restore();
