(() => {
  "use strict";

  const ASSET_ROOT = "../shared/generated_assets/";
  const INSTRUMENTS = [
    { id: "drum", name: "小鼓", word: "咚咚咚", freq: 120, wave: "sine" },
    { id: "guitar", name: "吉他", word: "叮咚", freq: 330, wave: "triangle" },
    { id: "trumpet", name: "小号", word: "嘟嘟嘟", freq: 392, wave: "square" },
    { id: "violin", name: "小提琴", word: "啦啦啦", freq: 440, wave: "sawtooth" },
    { id: "saxophone", name: "萨克斯", word: "呜哇", freq: 294, wave: "square" },
    { id: "accordion", name: "手风琴", word: "呼啦啦", freq: 262, wave: "triangle" },
    { id: "flute", name: "长笛", word: "啾啾", freq: 659, wave: "sine" },
    { id: "tambourine", name: "铃鼓", word: "铃铃铃", freq: 740, wave: "triangle" },
    { id: "maracas", name: "沙锤", word: "沙沙沙", freq: 520, wave: "square" },
    { id: "keyboard", name: "电子琴", word: "哆来咪", freq: 523, wave: "sine" }
  ];

  const grid = document.getElementById("musicianGrid");
  const cards = document.getElementById("instrumentCards");
  const roundBadge = document.getElementById("roundBadge");
  const collectionBadge = document.getElementById("collectionBadge");
  const feedback = document.getElementById("feedback");
  const successBanner = document.getElementById("successBanner");
  const nextPanel = document.getElementById("nextPanel");
  const nextButton = document.getElementById("nextButton");
  const dockTip = document.getElementById("dockTip");
  const resetButton = document.getElementById("resetButton");
  const confetti = document.getElementById("confetti");
  const dragGhost = document.getElementById("dragGhost");

  let bag = [];
  let round = [];
  let matched = new Set();
  let discovered = new Set();
  let selected = null;
  let previousRound = [];
  let feedbackTimer = 0;
  let audioContext = null;
  let drag = null;
  let suppressClickUntil = 0;

  const shuffle = values => {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const asset = (id, state) => `${ASSET_ROOT}little_band_${id}_${state}.png`;

  function drawRound() {
    const chosen = [];
    while (chosen.length < 3) {
      if (!bag.length) {
        const blocked = new Set([...chosen.map(item => item.id), ...previousRound]);
        const fresh = INSTRUMENTS.filter(item => !blocked.has(item.id));
        const rest = INSTRUMENTS.filter(item => blocked.has(item.id));
        bag = shuffle([...fresh, ...rest]);
      }
      const next = bag.shift();
      if (!chosen.some(item => item.id === next.id)) chosen.push(next);
    }
    previousRound = chosen.map(item => item.id);
    return chosen;
  }

  function renderRound({ keepOrder = false } = {}) {
    if (drag) cleanupDrag();
    matched = new Set();
    selected = null;
    successBanner.hidden = true;
    nextPanel.hidden = true;
    dockTip.hidden = false;
    cards.hidden = false;
    confetti.replaceChildren();
    hideFeedback();

    grid.innerHTML = round.map(item => `
      <button class="musician-card" type="button" data-id="${item.id}" aria-label="给这位小乐手找到缺少的乐器">
        <img src="${asset(item.id, "missing")}" alt="缺少一件乐器的小乐手" draggable="false">
      </button>`).join("");

    const dockItems = keepOrder ? [...round] : shuffle(round);
    cards.innerHTML = dockItems.map(item => `
      <button class="instrument-card" type="button" data-id="${item.id}" aria-label="${item.name}" title="${item.name}">
        <img src="${asset(item.id, "item")}" alt="${item.name}" draggable="false">
      </button>`).join("");

    grid.querySelectorAll(".musician-card").forEach(card => card.addEventListener("click", () => {
      if (selected) tryMatch(selected, card.dataset.id);
    }));
    cards.querySelectorAll(".instrument-card").forEach(bindInstrumentCard);
    updateBadges();
    preloadRound();
  }

  function bindInstrumentCard(card) {
    card.addEventListener("click", event => {
      if (Date.now() < suppressClickUntil) return;
      event.preventDefault();
      chooseInstrument(card.dataset.id);
    });
    card.addEventListener("pointerdown", startDrag);
  }

  function clearSelection() {
    selected = null;
    cards.querySelectorAll(".instrument-card").forEach(card => card.classList.remove("selected"));
    grid.querySelectorAll(".musician-card").forEach(card => card.classList.remove("is-target"));
  }

  function chooseInstrument(id) {
    if (matched.has(id)) return;
    selected = selected === id ? null : id;
    cards.querySelectorAll(".instrument-card").forEach(card => card.classList.toggle("selected", card.dataset.id === selected));
    grid.querySelectorAll(".musician-card:not(.matched)").forEach(card => card.classList.toggle("is-target", Boolean(selected)));
    if (selected) showFeedback("再点一位小乐手，把乐器送过去"); else hideFeedback();
    playInstrument(id, .18);
  }

  function startDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const card = event.currentTarget;
    if (matched.has(card.dataset.id)) return;
    if (drag) cleanupDrag();
    clearSelection();
    drag = { id: card.dataset.id, card, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    try { card.setPointerCapture?.(event.pointerId); } catch (_) { /* Global listeners still finish the drag. */ }
  }

  function moveDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 9) {
      drag.moved = true;
      drag.card.classList.add("selected");
      dragGhost.innerHTML = `<img src="${asset(drag.id, "item")}" alt="">`;
      dragGhost.classList.add("active");
      grid.querySelectorAll(".musician-card:not(.matched)").forEach(card => card.classList.add("is-target"));
    }
    if (drag.moved) {
      event.preventDefault();
      dragGhost.style.left = `${event.clientX}px`;
      dragGhost.style.top = `${event.clientY}px`;
    }
  }

  function endDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const current = drag;
    cleanupDrag();
    if (current.moved) {
      suppressClickUntil = Date.now() + 250;
      const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".musician-card");
      if (target) tryMatch(current.id, target.dataset.id);
    }
  }

  function cancelDrag(event) {
    if (!drag || (event && drag.pointerId !== event.pointerId)) return;
    cleanupDrag();
  }

  function cleanupDrag() {
    if (!drag) return;
    const current = drag;
    drag = null;
    try {
      if (current.card.hasPointerCapture?.(current.pointerId)) current.card.releasePointerCapture(current.pointerId);
    } catch (_) { /* The pointer may already be released. */ }
    current.card.classList.remove("selected");
    dragGhost.classList.remove("active");
    grid.querySelectorAll(".musician-card").forEach(card => card.classList.remove("is-target"));
  }

  function tryMatch(instrumentId, musicianId) {
    if (matched.has(musicianId)) return;
    const musician = grid.querySelector(`[data-id="${musicianId}"]`);
    if (instrumentId !== musicianId) {
      clearSelection();
      musician.classList.remove("wrong");
      void musician.offsetWidth;
      musician.classList.add("wrong");
      setTimeout(() => musician.classList.remove("wrong"), 450);
      showFeedback("这个形状不一样，再看看 👀");
      playWrong();
      return;
    }

    const item = INSTRUMENTS.find(value => value.id === instrumentId);
    matched.add(instrumentId);
    discovered.add(instrumentId);
    clearSelection();
    musician.classList.add("matched");
    const image = musician.querySelector("img");
    image.src = asset(instrumentId, "complete");
    image.alt = `正在演奏${item.name}的小乐手`;
    const card = cards.querySelector(`[data-id="${instrumentId}"]`);
    card?.classList.add("used");
    showFeedback(`${item.word}！${item.name}找到了！`);
    playInstrument(instrumentId, .5);
    updateBadges();
    if (matched.size === 3) setTimeout(completeRound, 430);
  }

  function updateBadges() {
    roundBadge.textContent = `本组完成 ${matched.size}/3`;
    collectionBadge.textContent = `乐器图鉴 ${discovered.size}/10`;
  }

  function completeRound() {
    successBanner.hidden = false;
    dockTip.hidden = true;
    cards.hidden = true;
    nextPanel.hidden = false;
    hideFeedback();
    celebrate();
    playBandFanfare();
  }

  function nextRound() {
    round = drawRound();
    renderRound();
    showFeedback("新朋友来啦，看看他们缺什么乐器");
  }

  function resetRound() {
    renderRound({ keepOrder: true });
    showFeedback("这一组重新开始啦");
  }

  function preloadRound() {
    round.forEach(item => ["missing", "item", "complete"].forEach(state => {
      const image = new Image();
      image.src = asset(item.id, state);
    }));
  }

  function showFeedback(message) {
    clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedback.classList.add("show");
    feedbackTimer = setTimeout(hideFeedback, 1900);
  }

  function hideFeedback() { feedback.classList.remove("show"); }

  function celebrate() {
    const symbols = ["♪", "♫", "★", "●", "◆", "🎵"];
    for (let i = 0; i < 34; i++) {
      const piece = document.createElement("i");
      piece.textContent = symbols[i % symbols.length];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.color = ["#ff4d83", "#ffc43d", "#5c8dff", "#8d60db", "#35bba8"][i % 5];
      piece.style.fontSize = `${16 + Math.random() * 18}px`;
      piece.style.setProperty("--duration", `${1.8 + Math.random() * 1.4}s`);
      piece.style.setProperty("--delay", `${Math.random() * .45}s`);
      piece.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
      confetti.appendChild(piece);
    }
  }

  function ensureAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function tone(freq, wave, start, duration, volume = .07) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .025);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
  }

  function playInstrument(id, duration = .35) {
    const item = INSTRUMENTS.find(value => value.id === id);
    const ctx = ensureAudio();
    if (!ctx || !item) return;
    if (id === "drum") {
      tone(120, "sine", ctx.currentTime, .18, .14);
      tone(90, "sine", ctx.currentTime + .2, .18, .12);
    } else if (id === "maracas" || id === "tambourine") {
      [0,.09,.18].forEach((offset, index) => tone(item.freq + index * 90, "square", ctx.currentTime + offset, .055, .025));
    } else {
      tone(item.freq, item.wave, ctx.currentTime, duration, .065);
      tone(item.freq * 1.5, "sine", ctx.currentTime + .08, duration * .7, .035);
    }
  }

  function playWrong() {
    const ctx = ensureAudio();
    if (!ctx) return;
    tone(190, "triangle", ctx.currentTime, .12, .04);
    tone(150, "triangle", ctx.currentTime + .12, .14, .035);
  }

  function playBandFanfare() {
    const ctx = ensureAudio();
    if (!ctx) return;
    [262,330,392,523].forEach((freq, index) => tone(freq, "triangle", ctx.currentTime + index * .13, .36, .065));
  }

  window.addEventListener("pointermove", moveDrag, { passive: false });
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", cancelDrag);
  nextButton.addEventListener("click", nextRound);
  resetButton.addEventListener("click", resetRound);
  round = drawRound();
  renderRound();
})();
