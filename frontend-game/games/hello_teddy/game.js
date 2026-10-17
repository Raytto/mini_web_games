import {Game, sprite, pose, icons} from '../english_shared/core.js?v=20261017warm1';
import {teddyObjects as objects} from '../english_shared/vocabulary-100.js?v=20260930v100';

const g = new Game({
  id: 'hello_teddy', zh: '小熊电话屋', en: 'Hello, Teddy!',
  tagZh: '听听小熊想要什么，送给它吧！', tagEn: 'Listen, find, and make Teddy smile!',
  word: '', gloss: '', icon: '🧸',
  introZh: '听听小熊的请求，从六件物品中找一找。',
  introEn: 'Listen to Teddy and find one of six little things.',
  parentZh: '100 种物品轮流登场。把物品拖到小熊身上，也可以轻点送给它。点小熊或对话可重听。送错后小熊会再说一遍想要什么，送对后道谢并自动开始下一题。无需跟读，不录音、不计分。',
  parentEn: 'Meet 100 different things. Drag a gift onto Teddy, or tap it to give. Tap Teddy or his words to listen again. Teddy repeats his request after a mix-up and says thank you for the right gift. No recording or scoring.',
  audio: []
});

const itemPicture = item => '<img class="object-art teddy-object" src="assets/objects/' + item.id + '-v1.webp" alt="' + item.word + '" width="256" height="256" draggable="false" decoding="async">';
const RETRY_CUE = 't_try_again_20260930';
let drag = null;
const consumedClicks = new WeakSet();
const request = document.createElement('button');
request.id = 'teddy-request';
request.className = 'teddy-request';
request.innerHTML = '<span class="request-speaker" aria-hidden="true">' + icons.sound + '</span>';
// Reuse the shared word card so translation, replay, and speaking feedback stay in sync.
request.append(document.querySelector('.word-card'));
let target, choices = [], bag = [], previousTarget = null;
let phase = 'asking', removed = new Set(), round = 0, timers = [], soundEnabled = false, advanceTimer, advanceSequence = 0;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function drawQuestion() {
  if (!bag.length) {
    bag = shuffle(objects);
    if (bag.at(-1).id === previousTarget) {
      [bag[0], bag[bag.length - 1]] = [bag.at(-1), bag[0]];
    }
  }
  target = bag.pop();
  previousTarget = target.id;
  choices = shuffle([target, ...shuffle(objects.filter(item => item.id !== target.id)).slice(0, 5)]);
  removed = new Set();
  round++;
}
function later(callback, ms) {
  const epoch = g.epoch;
  const timer = setTimeout(() => {
    if (g.alive(epoch) && !g.hidden) callback();
  }, ms);
  timers.push(timer);
  return timer;
}
function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}
function scheduleNextQuestion(ms = 2800, speech = null) {
  clearTimeout(advanceTimer);
  const turn = ++advanceSequence, epoch = g.epoch;
  let elapsed = false, finished = !speech;
  const next = () => {
    if (turn === advanceSequence && g.alive(epoch) && !g.hidden && phase === 'success') showQuestion();
  };
  advanceTimer = later(() => { elapsed = true; if (finished) next(); }, ms);
  if (speech) {
    void speech.then(() => { finished = true; if (elapsed) next(); });
    later(next, 8000);
  }
}
function askCue() { return 't_ask_' + target.id; }
function questionHint() {
  g.hint('把它想要的东西拖到小熊身上；点小熊可以再听一遍',
    'Drag a gift to Teddy. Tap Teddy to listen again!');
}
function replayRequest() {
  if (!g.started || g.hidden) return;
  soundEnabled = true;
  // Always repeat this turn's request, even after a wrong answer or during the smile.
  const speech = g.say(askCue());
  if (phase === 'success') scheduleNextQuestion(2600, speech);
}
function setPhase(value) {
  phase = value;
  g.stage.dataset.phase = value;
  g.stage.querySelectorAll('.teddy-choice').forEach(button => {
    button.disabled = value !== 'asking' || removed.has(button.dataset.object);
  });
}
function render() {
  const card = item => '<div class="toy-slot"><button class="teddy-choice' +
    (removed.has(item.id) ? ' gone' : '') + '" data-object="' + item.id +
    '" aria-label="' + item.word + '">' + itemPicture(item) + '</button></div>';
  g.stage.innerHTML = '<div class="request-slot"></div><div class="teddy-playfield">' +
    '<div class="toy-side">' + choices.slice(0, 3).map(card).join('') + '</div>' +
    '<div class="teddy-middle"><div class="teddy-rug" aria-hidden="true"></div>' +
    '<button id="teddy-listen" class="teddy-listen" data-aria-zh="点小熊，再听一遍" data-aria-en="Tap Teddy to listen again">' +
    sprite('teddy', 1, 'listening-bear') + '</button>' +
    '<div id="teddy-gift" class="teddy-gift" aria-hidden="true" hidden></div>' +
    '<div id="teddy-success" class="teddy-success" role="status" hidden>' +
    '<div class="happy-hearts" aria-hidden="true">♥ ✦ ♥</div><strong lang="en">Thank you!</strong></div></div>' +
    '<div class="toy-side">' + choices.slice(3).map(card).join('') + '</div></div>';
  g.stage.querySelector('.request-slot').append(request);
  g.stage.querySelector('#teddy-listen').addEventListener('click', replayRequest);
  g.stage.querySelectorAll('.teddy-choice').forEach(button => {
    button.addEventListener('click', event => {
      if (consumedClicks.has(button) && event.detail !== 0) {
        consumedClicks.delete(button);
        return;
      }
      choose(button);
    });
    button.addEventListener('pointerdown', event => beginDrag(event, button));
    button.addEventListener('pointermove', moveDrag);
    button.addEventListener('pointerup', endDrag);
    button.addEventListener('pointercancel', event => { if (event.pointerId === drag?.pointerId) cancelDrag(); });
    button.addEventListener('lostpointercapture', event => { if (event.pointerId === drag?.pointerId) cancelDrag(); });
    button.addEventListener('contextmenu', event => event.preventDefault());
  });
  g.stage.dataset.target = target.id;
  g.stage.dataset.round = round;
  const phrase = target.requestText || (target.quantifier || (/^[aeiou]/.test(target.word) ? 'An' : 'A')) + ' ' + target.word + ', please.';
  g.word(phrase, '请给我' + (target.quantifier === 'Some' ? '一些' : '一个') + target.zh + '。');
  request.dataset.ariaZh = '再听一遍：' + phrase;
  request.dataset.ariaEn = 'Listen again: ' + phrase;
  g.localize();
}
function showQuestion({fresh = true, voice = true} = {}) {
  g.nextEpoch();
  if (fresh) drawQuestion();
  render();
  setPhase('asking');
  g.lastCue = [askCue()];
  questionHint();
  if (voice && soundEnabled) void g.say(askCue());
}
function choose(button, fromRect) {
  if (!g.started || g.hidden || phase !== 'asking' || button.disabled) return;
  soundEnabled = true;
  const id = button.dataset.object;
  if (id !== target.id) {
    // Remove only this object. The other five stay in place and remain available.
    removed.add(id);
    button.disabled = true;
    button.classList.add('gone');
    g.hint('再找找，听听小熊想要什么', 'Oops! Try again. Listen to Teddy!');
    // Keep the request as the replay/retry cue. The two clips share one cancellable voice.
    const epoch = g.epoch;
    void g.audio.play([RETRY_CUE, askCue()]).then(played => {
      // If only the new retry clip fails, the existing request still gets a chance.
      if (!played && g.alive(epoch) && !g.hidden && phase === 'asking' && !g.audio.active) {
        void g.audio.play(askCue());
      }
    });
    // A keyboard user should not lose focus on the disappearing object.
    if (document.activeElement === button) request.focus({preventScroll: true});
    return;
  }

  clearTimers();
  setPhase('success');
  g.audio.stop();
  const gift = document.getElementById('teddy-gift');
  gift.innerHTML = itemPicture(target);
  gift.hidden = false;
  const from = fromRect || button.getBoundingClientRect(), to = gift.getBoundingClientRect();
  gift.style.setProperty('--gift-x', (from.x + from.width / 2 - to.x - to.width / 2) + 'px');
  gift.style.setProperty('--gift-y', (from.y + from.height / 2 - to.y - to.height / 2) + 'px');
  gift.classList.add('arriving');
  button.classList.add('given');
  g.hint('送对啦！小熊好开心', 'You found it! Teddy is so happy!');
  if (document.activeElement === button) request.focus({preventScroll: true});
  later(() => {
    pose(g.stage.querySelector('.listening-bear'), 4);
    g.stage.querySelector('#teddy-listen').classList.add('happy');
    document.getElementById('teddy-success').hidden = false;
    // Keep lastCue as the request: the shared sound retry must not replay an old answer.
    if (soundEnabled && g.audio.active?.key !== askCue()) scheduleNextQuestion(2370, g.audio.play('lf_t_got_'+target.id));
  }, 430);
  // The thank-you may extend this minimum; an eight-second fallback keeps play moving.
  scheduleNextQuestion();
}

// Pointer events cover mouse, touch and pen, including iOS Safari. Native HTML
// drag-and-drop is deliberately unnecessary for this interaction.
function overTeddy(x, y) {
  const box = g.stage.querySelector('.listening-bear').getBoundingClientRect();
  const padding = 12;
  return x >= box.left - padding && x <= box.right + padding &&
    y >= box.top - padding && y <= box.bottom + padding;
}
function beginDrag(event, button) {
  if (!event.isPrimary || event.button !== 0 || drag || g.hidden || phase !== 'asking' || button.disabled) return;
  consumedClicks.delete(button);
  drag = {button, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
    moved: false, ghost: null, touch: event.pointerType === 'touch'};
  button.setPointerCapture(event.pointerId);
}
function moveDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8) return;
  if (!drag.moved) {
    drag.moved = true;
    const box = drag.button.getBoundingClientRect();
    drag.ghost = document.createElement('div');
    drag.ghost.className = 'teddy-drag-ghost';
    drag.ghost.setAttribute('aria-hidden', 'true');
    drag.ghost.innerHTML = drag.button.innerHTML;
    drag.ghost.style.width = Math.max(box.width, 76) + 'px';
    drag.ghost.style.height = Math.max(box.height, 76) + 'px';
    document.body.append(drag.ghost);
    drag.button.classList.add('dragging');
    g.stage.classList.add('drag-active');
  }
  event.preventDefault();
  drag.ghost.style.left = event.clientX + 'px';
  drag.ghost.style.top = (event.clientY - (drag.touch ? 24 : 0)) + 'px';
  g.stage.querySelector('#teddy-listen').classList.toggle('drop-ready', overTeddy(event.clientX, event.clientY));
}
function cancelDrag() {
  if (!drag) return;
  const previous = drag;
  drag = null;
  if (previous.moved) consumedClicks.add(previous.button);
  previous.button.classList.remove('dragging');
  previous.ghost?.remove();
  g.stage.classList.remove('drag-active');
  g.stage.querySelector('#teddy-listen')?.classList.remove('drop-ready');
  if (previous.button.hasPointerCapture(previous.pointerId)) previous.button.releasePointerCapture(previous.pointerId);
}
function endDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const {button, moved, ghost} = drag;
  const accepted = moved && overTeddy(event.clientX, event.clientY);
  const from = ghost?.getBoundingClientRect();
  cancelDrag();
  if (moved) {
    event.preventDefault();
    if (accepted) choose(button, from);
  }
  // A short press continues through the native click for keyboard/tap parity.
}
document.addEventListener('keydown', event => { if (event.key === 'Escape') cancelDrag(); });
window.addEventListener('resize', cancelDrag);

request.addEventListener('click', replayRequest);
g.onReplay = replayRequest;
g.onCancel = () => { clearTimers(); cancelDrag(); };
g.onPause = () => {
  g.stage.querySelectorAll('.teddy-choice').forEach(button => { button.disabled = true; });
};
g.onResume = () => {
  if (g.started) showQuestion({fresh: phase === 'success', voice: false});
};
g.onStart = () => {
  showQuestion();
  const epoch = g.epoch;
  // Entering from the home page may already allow audio. Otherwise the scene is
  // ready immediately and a tap on Teddy or his words unlocks the first request.
  try {
    void g.audio.unlock().then(() => {
      if (g.alive(epoch) && !g.hidden && g.audio.context?.state === 'running') {
        soundEnabled = true;
        void g.say(askCue());
      }
    }).catch(() => {});
  } catch { /* Audio remains optional; an explicit tap can retry. */ }
};
// The first touch unlocks Safari audio without an extra start screen. Sound controls
// have their own click handlers; object taps still respond synchronously.
function firstGesture(event) {
  if (soundEnabled || g.hidden || event.target.closest('#teddy-listen, #teddy-request, #replay, #audio-retry, .home-button')) return;
  replayRequest();
}
document.addEventListener('pointerdown', firstGesture, {passive: true});
document.addEventListener('keydown', event => {
  if (['Enter', ' '].includes(event.key)) firstGesture(event);
});
document.getElementById('progress').hidden = true;
g.controls.hidden = true;
// Keep the shared word card in the document while begin() cancels previous speech.
g.stage.append(request);
g.begin();
