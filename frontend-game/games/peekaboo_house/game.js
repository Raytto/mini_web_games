import {Game, ui} from '../english_shared/core.js?v=20261017warm1';
import {animals, animalImage} from '../english_shared/vocabulary-100.js?v=20260930v100';

const g = new Game({
  id: 'peekaboo_house', zh: '谁在窗后', en: 'Peekaboo House',
  tagZh: '听一听，找朋友！', tagEn: 'Listen, find, and meet a new friend!',
  word: '', gloss: '', icon: '🪟',
  introZh: '看看朋友藏在哪里，帘子合上后听一听、找一找。',
  introEn: 'See where our friends hide, then listen and open a curtain.',
  parentZh: '100 种不同动物轮流登场。先看看两位朋友，帘子合上后听题找一找。找到后自动开始下一题，可以只听、只点，不要求跟读。',
  parentEn: 'Meet 100 different animals, two at a time. Listen after the curtains close. Open a curtain to find the friend. New questions follow automatically; repeating aloud is optional.',
  audio: [],
  audioContext: () => {
    try {
      if (window.parent !== window) return window.parent.peekabooAudioContext?.();
    } catch { /* A standalone or externally embedded game uses its own context. */ }
    return null;
  }
});

const replay = document.getElementById('replay');
let target, pair = [], bag = [], previousTarget = null, previousPair = [];
const PREVIEW_MS = 1600, CURTAIN_SETTLE_MS = 700;
let phase = 'preview', solved = false, timers = [], soundReady = false, round = 0;
let questionVoice = true;

function later(callback, ms) {
  const epoch = g.epoch;
  timers.push(setTimeout(() => {
    if (g.alive(epoch) && !g.hidden) callback();
  }, ms));
}
function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
  replay.classList.remove('nudge');
}
function setPhase(value) {
  phase = value;
  g.stage.dataset.phase = value;
  // The shared audio-retry button must never start a question mid-transition.
  g.lastCue = value === 'asking' ? ['where_' + target.id] : value === 'success' ? ['lf_p_yes_'+target.id] : [];
  g.stage.querySelectorAll('.window').forEach(button => {
    button.disabled = value !== 'asking';
  });
}
function openCurtain(button, open) {
  button.classList.toggle('open', open);
  button.setAttribute('aria-expanded', String(open));
}
function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function drawQuestion() {
  // All 100 animals get a turn before reshuffling; the bag boundary cannot repeat.
  if (!bag.length) {
    bag = shuffle(animals);
    if (bag.at(-1).id === previousTarget) {
      [bag[0], bag[bag.length - 1]] = [bag.at(-1), bag[0]];
    }
  }
  target = bag.pop();
  const others = animals.filter(item =>
    item.id !== target.id &&
    !(previousPair.includes(target.id) && previousPair.includes(item.id))
  );
  const other = others[Math.floor(Math.random() * others.length)];
  pair = shuffle([target, other]);
  previousTarget = target.id;
  previousPair = pair.map(item => item.id);
}
function questionHint() {
  if (soundReady) g.hint('听一听，打开帘子找朋友', 'Listen, then open a curtain to find our friend');
  else g.hint('点小喇叭听题，找找这位朋友', 'Tap the speaker to listen, then find this friend');
}
function scheduleHints() {
  later(() => replay.classList.add('nudge'), 5500);
  later(() => g.stage.querySelector('[data-animal="' + target.id + '"]')?.classList.add('hinting'), 11000);
}
function speak(ids) {
  if (g.hidden || !soundReady) return Promise.resolve(false);
  // Entry starts sound automatically when available; picture play never waits for it.
  return g.audio.play(ids);
}
function continueAfterSpeech(speech, minimum = 2400, callback = showQuestion) {
  clearTimers();
  const epoch = g.epoch;
  const turn = ++advanceSequence;
  const expectedPhase = phase;
  let elapsed = false, finished = false, advanced = false;
  const next = () => {
    if (!advanced && turn === advanceSequence && g.alive(epoch) && !g.hidden && phase === expectedPhase) {
      advanced = true;
      callback();
    }
  };
  later(() => { elapsed = true; if (finished) next(); }, minimum);
  void speech.then(() => { finished = true; if (elapsed) next(); });
  // Keep expressive words intact, but never wait indefinitely for unavailable audio.
  later(next, 8000);
}
let advanceSequence = 0;
function closeCurtains() {
  clearTimers();
  setPhase('closing');
  g.audio.stop();
  g.stage.querySelectorAll('.window').forEach(button => {
    button.classList.remove('try-again', 'hinting');
    openCurtain(button, false);
  });
  g.hint('朋友藏好啦，帘子正在合上…', 'Our friends are hiding. The curtains are closing…');
  // Start the 650 ms CSS transition now; leave a frame margin before speaking.
  void g.stage.offsetWidth;
  later(() => {
    setPhase('asking');
    questionHint();
    scheduleHints();
    if (questionVoice) speak('where_' + target.id);
  }, CURTAIN_SETTLE_MS);
}
function render() {
  g.stage.innerHTML = '<div class="windows">' + pair.map(item =>
    '<button class="window open" data-animal="' + item.id + '" aria-label="' + item.word + '" aria-expanded="true">' +
    '<img class="animal" src="' + animalImage(item) + '" alt="' + item.word + '" draggable="false">' +
    '<span class="curtain left"></span><span class="curtain right"></span>' +
    '<span class="window-word" lang="en">' + item.word + '</span></button>'
  ).join('') + '</div>';
  g.stage.querySelectorAll('.window').forEach(button => {
    let start = null, suppressClick = false;
    button.addEventListener('click', () => {
      if (suppressClick) { suppressClick = false; return; }
      choose(button);
    });
    button.addEventListener('pointerdown', event => {
      if (button.disabled || !event.isPrimary) return;
      suppressClick = false;
      start = {id: event.pointerId, x: event.clientX, y: event.clientY};
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener('pointerup', event => {
      if (!start || start.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 14) {
        suppressClick = true;
        choose(button);
      }
      start = null;
    });
    const reset = () => { start = null; };
    button.addEventListener('pointercancel', reset);
    button.addEventListener('lostpointercapture', reset);
  });
}
function showQuestion({fresh = true, voice = true} = {}) {
  g.nextEpoch();
  if (fresh) { drawQuestion(); round++; }
  solved = false;
  g.stage.dataset.target = target.id;
  g.stage.dataset.round = round;
  render();
  setPhase('preview');
  questionVoice = voice;
  g.word(target.word, target.zh);
  g.hint('看看两位朋友藏在哪里…', 'Take a peek! Where are our friends hiding?');
  // Give the child a full peek even when the pictures arrive on a slow connection.
  const epoch = g.epoch;
  Promise.all([...g.stage.querySelectorAll('.animal')].map(img => img.decode().catch(() => {}))).then(() => {
    if (g.alive(epoch) && !g.hidden) later(closeCurtains, PREVIEW_MS);
  });
}
function choose(button) {
  if (!g.started || g.hidden || phase !== 'asking') return;
  clearTimers();
  g.audio.stop();
  g.stage.querySelectorAll('.hinting').forEach(el => el.classList.remove('hinting'));
  const item = pair.find(animal => animal.id === button.dataset.animal);
  openCurtain(button, true);
  void g.stage.offsetWidth;
  if (item.id !== target.id) {
    setPhase('retry');
    button.classList.add('try-again');
    g.hint('再找找，另一位朋友也在这里', 'Try again — our other friend is here too');
    questionVoice = true;
    later(() => {
      continueAfterSpeech(speak('lf_p_this_'+item.id), 1000, closeCurtains);
    }, CURTAIN_SETTLE_MS);
    return;
  }

  solved = true;
  setPhase('revealing');
  g.hint('打开帘子，看看是谁！', 'Open the curtain! Who is here?');
  later(() => celebrate(button, item), CURTAIN_SETTLE_MS);
}
function celebrate(button, item) {
  setPhase('success');
  button.classList.add('found');
  g.hint('找到啦！下一位朋友来啦', 'You found it! Another friend is on the way');
  const celebration = document.createElement('div');
  celebration.className = 'peek-success';
  celebration.id = 'peek-success';
  celebration.setAttribute('role', 'status');
  celebration.innerHTML = '<div class="peek-success-card">' +
    '<div class="peek-stars" aria-hidden="true">✦ ★ ✦</div>' +
    '<img src="' + animalImage(item) + '" alt="" draggable="false">' +
    '<h2>' + ui('找到啦！', 'You found it!') + '</h2>' +
    '<strong lang="en">' + item.word + '</strong>' +
    '<p>' + ui('下一位朋友来啦…', 'Here comes another friend…') + '</p></div>';
  g.stage.append(celebration);
  continueAfterSpeech(speak(['lf_p_yes_'+item.id, 'great']));
}
async function activateSound({replayCue = false, automatic = false} = {}) {
  if (g.hidden || (soundReady && !replayCue && g.audio.context?.state === 'running')) return;
  const epoch = g.epoch;
  try {
    await g.audio.unlock();
    if (!g.alive(epoch) || g.hidden || g.audio.context?.state !== 'running') return;
    soundReady = true;
    questionVoice = true;
    // Entry or a gesture can unlock sound while friends hide; wait for closure.
    if (phase !== 'asking' && phase !== 'success') return;
    if (phase === 'asking') questionHint();
    const speech = speak(phase === 'success' ? 'lf_p_yes_'+target.id : 'where_' + target.id);
    if (phase === 'success') continueAfterSpeech(speech);
  } catch {
    if (!automatic && g.alive(epoch) && !g.hidden) g.audioError();
  }
}

g.onCancel = clearTimers;
g.onPause = () => setPhase('paused');
g.onResume = () => {
  if (g.started) showQuestion({fresh: solved, voice: false});
};
g.onReplay = () => activateSound({replayCue: true});
// Shared retry still prepares and plays lastCue; keep first-time unlock in sync too.
document.getElementById('audio-retry').addEventListener('click', () => { void activateSound(); });
g.onStart = () => {
  showQuestion();
  // Each entry attempts audio immediately; the question still waits for curtains.
  void activateSound({automatic: true});
};
document.addEventListener('pointerdown', event => {
  // The replay button has its own handler, so it never speaks twice on one tap.
  if (!event.target.closest('#replay, #audio-retry, .home-button')) void activateSound();
}, {passive: true});
document.addEventListener('keydown', event => {
  if (['Enter', ' '].includes(event.key) && !event.target.closest('#replay, #audio-retry, .home-button')) {
    void activateSound();
  }
});

// No welcome screen, animal picker, three-question limit, or next-question button.
document.getElementById('progress').hidden = true;
g.controls.hidden = true;
g.begin();
