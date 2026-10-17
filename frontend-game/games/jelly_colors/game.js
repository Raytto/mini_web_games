import {Game, ui} from '../english_shared/core.js?v=20260930lf1';
import {objects, shapeArt} from '../english_shared/catalog.js?v=20260924e2';
import {Library} from '../english_shared/library.js?v=20260930lf1';
import {pigments, mixPigments} from './paint-mix.js?v=20260925j1';

const g = new Game({
  id:'jelly_colors', zh:'彩虹果冻工坊', en:'Jelly Colors',
  tagZh:'8 种颜色 · 自由调色', tagEn:'8 colors. Mix and discover.',
  word:'Mix colors', gloss:'一起调色', icon:'🎨',
  introZh:'点颜料，看看它们混在一起的颜色。擦掉就能再试一次。',
  introEn:'Tap the paints and discover a new color. Wipe clean to try again.',
  parentZh:'每种颜色加一份，可以混两种、三种或更多颜色；加白色变浅，加黑色变深。也可以换一个形状玩。',
  parentEn:'Each paint adds one portion. Try two, three, or more colors. White lightens and black darkens. Try another shape, too.',
  audio:[]
});
let mold = objects.find(item => item.id === 'heart') || objects[0];
let ingredients = [], current = null, timers = new Set();
const library = new Library(g, objects, {zh:'换个形状', en:'Change shape'}, item => {
  mold = item;
  updateMix();
  speak(['lf_j_shape_'+item.id]);
});
// This free-play game keeps its mixture on resume instead of reopening a picker.
g.library = null;
library.selected = mold;
library.picked.add(mold.id);
library.bar.querySelector('#current-choice').textContent = mold.word;

function later(callback, ms) {
  const epoch = g.epoch;
  const timer = setTimeout(() => {
    timers.delete(timer);
    if (g.alive(epoch) && !g.hidden) callback();
  }, ms);
  timers.add(timer);
}
function clearEffects() {
  timers.forEach(clearTimeout);
  timers.clear();
  g.stage.querySelectorAll('.paint-stream').forEach(stream => stream.remove());
  g.stage.querySelectorAll('.is-pouring,.mixing,.wiped').forEach(el => {
    el.classList.remove('is-pouring','mixing','wiped');
  });
}
let pendingSpeech = null, speechPump = 0, pumping = false, speechRevision = 0;
function speak(ids, interrupt = false) {
  if (g.hidden || !g.started) return;
  if (interrupt && !pendingSpeech && g.audio.active?.key === ids.join('|')) return;
  speechRevision++;
  if (interrupt) { g.audio.stop(); speechPump++; pumping = false; }
  pendingSpeech = ids;
  if (pumping) return;
  pumping = true;
  const token = ++speechPump;
  void (async () => {
    while (pendingSpeech && token === speechPump && !g.hidden) {
      const next = pendingSpeech; pendingSpeech = null;
      await g.say(next);
    }
    if (token === speechPump) pumping = false;
  })();
}
function stopSpeech() { pendingSpeech = null; speechPump++; pumping = false; }
function mixtureCue() {
  return ingredients.length ? ingredients.map(id => 'lf_j_color_'+id).concat(
    ingredients.length === pigments.length ? 'lf_j_full' : 'lf_j_more') : ['lf_j_intro'];
}
library.onOpen = () => speak(['lf_j_shape']);
function canPlay() {
  return g.started && !g.hidden && library.overlay.hidden;
}
function bump(el, name) {
  el.classList.remove(name);
  void el.offsetWidth;
  el.classList.add(name);
}
function render() {
  g.stage.innerHTML = '<div class="palette-pumps">' + pigments.map(paint =>
    '<button class="paint-pump" data-color="' + paint.id + '" style="--paint:' + paint.hex + '" aria-label="' + paint.id + '">' +
      '<span class="pump-drawing" aria-hidden="true"><span class="paint-cap"></span><span class="paint-neck"></span>' +
      '<span class="paint-tank"><span class="paint-liquid"></span></span><span class="paint-nozzle"></span></span>' +
      '<strong lang="en">' + paint.id + '</strong><span class="pump-state">' + ui('点一下', 'Tap') + '</span>' +
    '</button>'
  ).join('') + '</div>' +
  '<div class="mix-area"><button class="mix-dish" id="mix-dish" data-aria-zh="看看调出的颜色" data-aria-en="Enjoy your color">' +
  '<span class="mix-shape"></span></button><div class="mix-recipe" id="mix-recipe" aria-live="polite"></div></div>';

  g.stage.querySelectorAll('.paint-pump').forEach(button => {
    // Native click handles touch, mouse and keyboard. No hold timers or audio locks.
    button.addEventListener('click', () => pour(button));
  });
  document.getElementById('mix-dish').addEventListener('click', () => {
    if (!canPlay() || !ingredients.length) return;
    bump(g.stage.querySelector('.mix-shape'), 'mixing');
    speak(mixtureCue(), true);
  });
  g.controls.innerHTML = '';
  const erase = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m5 20 13-14q2-2 4 0l5 5q2 2 0 4L16 27H9l-4-4q-2-1 0-3ZM10 15l10 9M16 27h12"/></svg>';
  g.action('clear-palette', erase, '擦掉重来', 'Wipe clean', clearPalette, 'quiet clear-palette');
  updateMix();
}
function updateMix() {
  current = mixPigments(ingredients);
  g.stage.dataset.ingredients = ingredients.join(',');
  g.stage.dataset.mixColor = current || '';
  g.stage.dataset.choice = mold.id;
  g.stage.dataset.phase = ingredients.length ? 'mixed' : 'empty';
  g.stage.querySelector('.mix-shape').innerHTML = shapeArt(mold, current || '#e6dfd1');
  g.stage.querySelector('.mix-dish').classList.toggle('is-empty', !current);
  g.stage.querySelectorAll('.paint-pump').forEach(button => {
    const used = ingredients.includes(button.dataset.color);
    button.disabled = used || g.hidden;
    button.classList.toggle('is-used', used);
    button.dataset.used = String(used);
    const label = button.querySelector('.pump-state span');
    label.dataset.zh = used ? '✓ 已加入' : '点一下';
    label.dataset.en = used ? '✓ Added' : 'Tap';
  });
  document.getElementById('clear-palette').disabled = !ingredients.length || g.hidden;
  const recipe = document.getElementById('mix-recipe');
  if (!ingredients.length) {
    recipe.innerHTML = ui('试试两种、三种颜色一起混', 'Try mixing two or three colors');
    g.word('Mix colors', '一起调色');
    g.hint('点任意一个颜料，开始调色吧', 'Tap any paint to start mixing');
  } else {
    recipe.innerHTML = ingredients.map(id => {
      const paint = pigments.find(item => item.id === id);
      return '<span class="ingredient"><i style="--paint:' + paint.hex + '" aria-hidden="true"></i><span lang="en">' + id + '</span></span>';
    }).join('<span class="mix-plus" aria-hidden="true">+</span>');
    const only = pigments.find(paint => paint.id === ingredients[0]);
    g.word(ingredients.length === 1 ? only.id : 'Your mix', ingredients.length === 1 ? only.zh : '混合色');
    g.hint(
      ingredients.length === pigments.length ? '每种颜色都加过啦，擦掉再试一盘吧' : '还可以点其他颜色；擦掉就能重新调',
      ingredients.length === pigments.length ? 'All paints added! Wipe clean to try again' : 'Add another paint, or wipe clean to start again'
    );
  }
  g.localize();
}
function showStream(button, paint) {
  const area = g.stage.getBoundingClientRect();
  const from = button.querySelector('.paint-nozzle').getBoundingClientRect();
  const to = g.stage.querySelector('.mix-shape').getBoundingClientRect();
  const x = from.x + from.width / 2 - area.x, y = from.bottom - area.y;
  const tx = to.x + to.width / 2 - area.x, ty = to.y + to.height / 2 - area.y;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('paint-stream');
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('viewBox', '0 0 ' + area.width + ' ' + area.height);
  svg.innerHTML = '<path d="M' + x + ',' + y + ' C' + x + ',' + (y+38) + ' ' + tx + ',' + (ty-45) + ' ' + tx + ',' + ty +
    '" pathLength="1" fill="none" stroke="' + paint.hex + '" stroke-width="12" stroke-linecap="round"/>';
  g.stage.append(svg);
  later(() => svg.remove(), 650);
}
function pour(button) {
  if (!canPlay() || ingredients.includes(button.dataset.color)) return;
  const paint = pigments.find(item => item.id === button.dataset.color);
  // Commit the portion and its disabled state before animation or async sound.
  ingredients.push(paint.id);
  updateMix();
  button.classList.add('is-pouring');
  bump(g.stage.querySelector('.mix-shape'), 'mixing');
  showStream(button, paint);
  later(() => button.classList.remove('is-pouring'), 650);
  const next = ['lf_j_color_'+paint.id];
  if (ingredients.length === 1) next.push('lf_j_more');
  if (ingredients.length === pigments.length) next.push('lf_j_full');
  speak(next);
}
function clearPalette() {
  if (!canPlay() || !ingredients.length) return;
  g.nextEpoch();
  ingredients = [];
  updateMix();
  bump(g.stage.querySelector('.mix-dish'), 'wiped');
  g.hint('擦干净啦！换几种颜色试试', 'All clean! Try some different colors');
  speak(['lf_j_clear']);
  later(() => g.stage.querySelector('.mix-dish').classList.remove('wiped'), 450);
}
g.onCancel = () => { clearEffects(); stopSpeech(); };
g.onPause = updateMix;
g.onResume = updateMix;
g.onReplay = () => speak(library.overlay.hidden ? mixtureCue() : ['lf_j_shape'], true);
g.onStart = () => {
  render();
  g.lastCue = ['lf_j_intro'];
  const epoch = g.epoch, revision = speechRevision;
  void g.audio.unlock().then(() => {
    if (g.alive(epoch) && !g.hidden && revision === speechRevision) speak(['lf_j_intro']);
  }).catch(() => {});
};
document.getElementById('progress').hidden = true;
g.begin();
