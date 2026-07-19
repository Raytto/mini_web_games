(() => {
  "use strict";

  const ASSET_ROOT = "../shared/generated_assets";
  const animals = [
    { id: "bear", name: "小熊", alt: "圆滚滚的小熊" },
    { id: "dog", name: "小狗", alt: "垂耳朵的小狗" },
    { id: "cat", name: "小猫", alt: "橘色的小猫" },
    { id: "duck", name: "小鸭", alt: "黄澄澄的小鸭" },
    { id: "chick", name: "小鸡", alt: "毛茸茸的小鸡" },
    { id: "bunny", name: "小兔", alt: "长耳朵的小兔" }
  ];
  const stages = ["dirty", "soap", "rinse", "clean"];
  const tools = ["soap", "rinse", "towel"];
  const hints = ["先用香皂搓出好多泡泡", "泡泡真多！再用花洒冲一冲", "冲干净啦，最后用毛巾擦干", "干干净净，香喷喷！"];
  const praiseText = ["泡泡咕噜咕噜！", "哗啦啦，冲干净！", "香喷喷，亮晶晶！"];

  const image = document.getElementById("animalImage");
  const animalName = document.getElementById("animalName");
  const animalStage = document.getElementById("animalDropZone");
  const stageHint = document.getElementById("stageHint");
  const collectionBadge = document.getElementById("collectionBadge");
  const guestBadge = document.getElementById("guestBadge");
  const praise = document.getElementById("praise");
  const effects = document.getElementById("washEffects");
  const toolsPanel = document.getElementById("tools");
  const progressWrap = document.getElementById("progressWrap");
  const nextPanel = document.getElementById("nextPanel");
  const nextButton = document.getElementById("nextButton");
  const resetButton = document.getElementById("resetButton");
  const dragGhost = document.getElementById("dragGhost");

  let current = null;
  let step = 0;
  let visit = 0;
  let bag = [];
  let lastAnimalId = "";
  let completed = new Set();
  let locked = false;
  let praiseTimer = 0;
  let drag = null;

  function shuffled(source) {
    const copy = [...source];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function refillBag() {
    bag = shuffled(animals);
    if (bag.length > 1 && bag[0].id === lastAnimalId) {
      [bag[0], bag[1]] = [bag[1], bag[0]];
    }
  }

  function asset(animal, stage) {
    return `${ASSET_ROOT}/bath_time_${animal.id}_${stage}.png`;
  }

  function setAnimalImage(stage, animate = true) {
    if (animate) image.classList.add("changing");
    const nextSrc = asset(current, stage);
    const preload = new Image();
    preload.onload = () => {
      image.src = nextSrc;
      image.alt = `${current.alt}，${stage === "dirty" ? "身上有泥点，等待洗澡" : stage === "soap" ? "手里拿着香皂，浑身都是泡泡" : stage === "rinse" ? "正在用清水冲泡泡" : "已经洗干净并披上毛巾"}`;
      image.classList.remove("changing");
      if (animate) {
        image.classList.remove("pop");
        void image.offsetWidth;
        image.classList.add("pop");
      }
    };
    preload.src = nextSrc;
  }

  function updateProgress() {
    document.querySelectorAll(".progress-step").forEach((node, index) => {
      node.classList.toggle("done", index < step);
      node.classList.toggle("active", index === step && step < 3);
      const number = node.querySelector("b");
      number.textContent = index < step ? "✓" : String(index + 1);
    });
    document.querySelectorAll(".tool-card").forEach((card, index) => {
      card.classList.toggle("used", index < step);
      card.classList.toggle("expected", index === step && step < 3);
      card.setAttribute("aria-disabled", index < step ? "true" : "false");
    });
  }

  function updateCollection() {
    collectionBadge.textContent = completed.size === animals.length
      ? "洗澡图鉴集齐啦！"
      : `洗澡图鉴 ${completed.size}/${animals.length}`;
  }

  function loadNextAnimal() {
    if (!bag.length) refillBag();
    current = bag.shift();
    lastAnimalId = current.id;
    step = 0;
    visit += 1;
    locked = false;
    guestBadge.textContent = `今天的第 ${visit} 位`;
    animalName.textContent = current.name;
    stageHint.textContent = hints[0];
    toolsPanel.hidden = false;
    progressWrap.hidden = false;
    nextPanel.hidden = true;
    setAnimalImage("dirty", visit > 1);
    updateProgress();
    preloadAnimal(current);
    window.GameJuice?.guide(document.querySelector('.tool-card[data-tool="soap"]'), animalStage, 1500);
  }

  function preloadAnimal(animal) {
    stages.slice(1).forEach(stage => {
      const preload = new Image();
      preload.src = asset(animal, stage);
    });
  }

  function preloadLibrary() {
    window.setTimeout(() => {
      animals.forEach(animal => stages.forEach(stage => {
        const preload = new Image();
        preload.src = asset(animal, stage);
      }));
    }, 900);
  }

  function showPraise(text) {
    window.clearTimeout(praiseTimer);
    praise.textContent = text;
    praise.classList.remove("show");
    void praise.offsetWidth;
    praise.classList.add("show");
    praiseTimer = window.setTimeout(() => praise.classList.remove("show"), 1200);
  }

  function clearEffects() {
    effects.replaceChildren();
  }

  function bubbleBurst() {
    clearEffects();
    for (let i = 0; i < 21; i += 1) {
      const bubble = document.createElement("i");
      bubble.className = "effect-bubble";
      const size = 14 + Math.random() * 35;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${8 + Math.random() * 84}%`;
      bubble.style.setProperty("--duration", `${1.2 + Math.random() * .85}s`);
      bubble.style.setProperty("--drift", `${-55 + Math.random() * 110}px`);
      bubble.style.animationDelay = `${Math.random() * .32}s`;
      effects.appendChild(bubble);
    }
    window.setTimeout(clearEffects, 2200);
  }

  function rinseShower() {
    clearEffects();
    for (let i = 0; i < 28; i += 1) {
      const drop = document.createElement("i");
      drop.className = "effect-drop";
      drop.style.left = `${18 + Math.random() * 64}%`;
      drop.style.setProperty("--duration", `${.55 + Math.random() * .45}s`);
      drop.style.setProperty("--drift", `${-22 + Math.random() * 44}px`);
      drop.style.animationDelay = `${Math.random() * .65}s`;
      effects.appendChild(drop);
    }
    window.setTimeout(clearEffects, 1700);
  }

  function sparkleBurst() {
    clearEffects();
    for (let i = 0; i < 12; i += 1) {
      const sparkle = document.createElement("i");
      sparkle.className = "effect-sparkle";
      sparkle.textContent = "✦";
      sparkle.style.left = `${8 + Math.random() * 84}%`;
      sparkle.style.top = `${8 + Math.random() * 72}%`;
      sparkle.style.setProperty("--size", `${22 + Math.random() * 27}px`);
      sparkle.style.animationDelay = `${Math.random() * .5}s`;
      effects.appendChild(sparkle);
    }
    window.setTimeout(clearEffects, 1700);
  }

  function playTone(kind) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const notes = kind === "wrong" ? [180, 145] : kind === "finish" ? [523, 659, 784] : [440, 587];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, context.currentTime + index * .1);
        gain.gain.exponentialRampToValueAtTime(.12, context.currentTime + index * .1 + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + index * .1 + .16);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + index * .1);
        oscillator.stop(context.currentTime + index * .1 + .18);
      });
      window.setTimeout(() => context.close(), 650);
    } catch (_) { /* Sound is an enhancement; interaction still works without it. */ }
  }

  function rejectTool() {
    animalStage.classList.remove("wrong");
    void animalStage.offsetWidth;
    animalStage.classList.add("wrong");
    const expectedNames = ["香皂", "花洒", "毛巾"];
    showPraise(`还没到它哦，先用${expectedNames[step]}！`);
    playTone("wrong");
    window.GameJuice?.vibrate([18, 34, 18]);
    window.GameJuice?.shake(animalStage);
  }

  function completeBath() {
    completed.add(current.id);
    updateCollection();
    toolsPanel.hidden = true;
    progressWrap.hidden = true;
    nextPanel.hidden = false;
    document.getElementById("finishedTitle").textContent = `${current.name}洗得香喷喷！`;
    playTone("finish");
    window.GameJuice?.vibrate([24, 42, 30]);
    window.GameJuice?.burst(animalStage, { count: 20, symbols: ["✦", "●", "❤"] });
    try {
      if (window.GameTracking?.trackGameEvent) {
        window.GameTracking.trackGameEvent("round_complete", { game: "bath_time", animal: current.id, collected: completed.size });
      }
    } catch (_) { /* Tracking must never interrupt play. */ }
  }

  function applyTool(tool) {
    if (locked || step >= tools.length) return;
    if (tool !== tools[step]) {
      rejectTool();
      return;
    }
    locked = true;
    step += 1;
    stageHint.textContent = hints[step];
    setAnimalImage(stages[step]);
    updateProgress();
    showPraise(praiseText[step - 1]);
    if (step === 1) bubbleBurst();
    if (step === 2) rinseShower();
    if (step === 3) sparkleBurst();
    playTone(step === 3 ? "finish" : "good");
    window.GameJuice?.vibrate(20);
    window.GameJuice?.burst(animalStage, { count: 10, symbols: step === 1 ? ["○", "◌"] : step === 2 ? ["●", "◆"] : ["✦", "★"] });
    window.setTimeout(() => {
      locked = false;
      if (step === 3) completeBath();
    }, step === 3 ? 650 : 460);
  }

  function pointInside(element, x, y) {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function moveGhost(x, y) {
    dragGhost.style.left = `${x}px`;
    dragGhost.style.top = `${y}px`;
    animalStage.classList.toggle("drop-ready", pointInside(animalStage, x, y));
  }

  function beginDrag(event, card) {
    if (card.classList.contains("used") || locked) return;
    window.GameJuice?.sound("pick");
    window.GameJuice?.vibrate(10);
    drag = { pointerId: event.pointerId, tool: card.dataset.tool, startX: event.clientX, startY: event.clientY, moved: false };
    card.setPointerCapture?.(event.pointerId);
    dragGhost.replaceChildren(card.querySelector("img").cloneNode(true));
    dragGhost.classList.add("visible");
    moveGhost(event.clientX, event.clientY);
  }

  function continueDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 7) drag.moved = true;
    moveGhost(event.clientX, event.clientY);
  }

  function finishDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dropped = pointInside(animalStage, event.clientX, event.clientY);
    const shouldTap = !drag.moved;
    const tool = drag.tool;
    dragGhost.classList.remove("visible");
    animalStage.classList.remove("drop-ready");
    drag = null;
    if (dropped || shouldTap) applyTool(tool);
  }

  document.querySelectorAll(".tool-card").forEach(card => {
    card.addEventListener("pointerdown", event => beginDrag(event, card));
  });
  window.addEventListener("pointermove", continueDrag);
  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);

  nextButton.addEventListener("click", loadNextAnimal);
  resetButton.addEventListener("click", () => {
    step = 0;
    locked = false;
    clearEffects();
    stageHint.textContent = hints[0];
    toolsPanel.hidden = false;
    progressWrap.hidden = false;
    nextPanel.hidden = true;
    setAnimalImage("dirty");
    updateProgress();
    showPraise("重新洗一次吧！");
    window.GameJuice?.guide(document.querySelector('.tool-card[data-tool="soap"]'), animalStage, 900);
  });

  refillBag();
  loadNextAnimal();
  preloadLibrary();
})();
