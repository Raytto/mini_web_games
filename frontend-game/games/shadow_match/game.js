(() => {
  "use strict";

  const ASSET_ROOT = "../shared/generated_assets";
  const animals = [
    { id:"cat", name:"小猫" }, { id:"dog", name:"小狗" }, { id:"bear", name:"小熊" },
    { id:"bunny", name:"小兔" }, { id:"panda", name:"熊猫" }, { id:"fox", name:"狐狸" },
    { id:"pig", name:"小猪" }, { id:"elephant", name:"大象" }, { id:"lion", name:"狮子" },
    { id:"monkey", name:"猴子" }, { id:"cow", name:"奶牛" }, { id:"sheep", name:"绵羊" },
    { id:"giraffe", name:"长颈鹿" }, { id:"koala", name:"考拉" }, { id:"penguin", name:"企鹅" },
    { id:"owl", name:"猫头鹰" }, { id:"duck", name:"小鸭" }, { id:"frog", name:"青蛙" },
    { id:"tiger", name:"老虎" }, { id:"hippo", name:"河马" }
  ];

  const slotsRoot = document.getElementById("slots");
  const cardsRoot = document.getElementById("animalCards");
  const roundBadge = document.getElementById("roundBadge");
  const collectionBadge = document.getElementById("collectionBadge");
  const gameHint = document.getElementById("gameHint");
  const feedback = document.getElementById("feedback");
  const confetti = document.getElementById("confetti");
  const successBanner = document.getElementById("successBanner");
  const nextPanel = document.getElementById("nextPanel");
  const nextButton = document.getElementById("nextButton");
  const resetButton = document.getElementById("resetButton");
  const dragGhost = document.getElementById("dragGhost");

  let bag = [];
  let roundAnimals = [];
  let previousRoundIds = [];
  let matched = new Set();
  let collected = new Set();
  let selectedAnimalId = "";
  let drag = null;
  let feedbackTimer = 0;
  let locked = false;

  function shuffled(source) {
    const copy = [...source];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [copy[index],copy[target]] = [copy[target],copy[index]];
    }
    return copy;
  }

  function refillBag(excluded = []) {
    const excludedSet = new Set(excluded);
    const first = shuffled(animals.filter(animal => !excludedSet.has(animal.id)));
    const rest = shuffled(animals.filter(animal => excludedSet.has(animal.id)));
    bag.push(...first,...rest);
  }

  function takeRound() {
    const picked = [];
    while (picked.length < 3) {
      if (!bag.length) refillBag([...previousRoundIds,...picked.map(animal => animal.id)]);
      const next = bag.shift();
      if (picked.some(animal => animal.id === next.id)) {
        bag.push(next);
        continue;
      }
      picked.push(next);
    }
    previousRoundIds = picked.map(animal => animal.id);
    return picked;
  }

  function asset(animal) {
    return `${ASSET_ROOT}/shadow_match_animal_${animal.id}.png`;
  }

  function updateCollection() {
    collectionBadge.textContent = collected.size === animals.length ? "动物图鉴集齐啦！" : `动物图鉴 ${collected.size}/${animals.length}`;
  }

  function showFeedback(text) {
    window.clearTimeout(feedbackTimer);
    feedback.textContent = text;
    feedback.classList.remove("show");
    void feedback.offsetWidth;
    feedback.classList.add("show");
    feedbackTimer = window.setTimeout(() => feedback.classList.remove("show"),1100);
  }

  function playTone(kind) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const notes = kind === "wrong" ? [180,145] : kind === "finish" ? [523,659,784] : [440,587];
      notes.forEach((frequency,index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001,context.currentTime + index * .1);
        gain.gain.exponentialRampToValueAtTime(.11,context.currentTime + index * .1 + .015);
        gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime + index * .1 + .17);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + index * .1);
        oscillator.stop(context.currentTime + index * .1 + .19);
      });
      window.setTimeout(() => context.close(),650);
    } catch (_) { /* Sound is optional. */ }
  }

  function makeConfetti() {
    confetti.replaceChildren();
    const colors = ["#ff5f6d","#ffd43b","#61d095","#65a8ff","#a978ff","#ff8e42"];
    for (let index = 0; index < 58; index += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty("--w",`${6 + Math.random() * 8}px`);
      piece.style.setProperty("--h",`${9 + Math.random() * 13}px`);
      piece.style.setProperty("--color",colors[index % colors.length]);
      piece.style.setProperty("--duration",`${1.8 + Math.random() * 1.2}s`);
      piece.style.setProperty("--delay",`${Math.random() * .55}s`);
      piece.style.setProperty("--drift",`${-85 + Math.random() * 170}px`);
      piece.style.setProperty("--spin",`${-520 + Math.random() * 1040}deg`);
      confetti.appendChild(piece);
    }
    window.setTimeout(() => confetti.replaceChildren(),3400);
  }

  function renderRound() {
    slotsRoot.replaceChildren();
    cardsRoot.replaceChildren();
    roundAnimals.forEach((animal,index) => {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "slot";
      slot.dataset.target = animal.id;
      slot.setAttribute("aria-label",`第 ${index + 1} 个动物影子`);
      slot.innerHTML = `<img class="slot-image" src="${asset(animal)}" alt="第 ${index + 1} 个黑色动物影子" draggable="false"><span class="slot-label">找找看</span>`;
      slot.addEventListener("click",() => {
        if (selectedAnimalId) attemptMatch(selectedAnimalId,animal.id);
      });
      slotsRoot.appendChild(slot);
    });

    shuffled(roundAnimals).forEach(animal => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "animal-card";
      card.dataset.animal = animal.id;
      card.setAttribute("aria-label",animal.name);
      card.innerHTML = `<img src="${asset(animal)}" alt="${animal.name}" draggable="false"><span>${animal.name}</span>`;
      card.addEventListener("pointerdown",event => beginDrag(event,card));
      cardsRoot.appendChild(card);
    });
  }

  function startRound(reuse = false) {
    locked = false;
    matched = new Set();
    selectedAnimalId = "";
    successBanner.hidden = true;
    nextPanel.hidden = true;
    cardsRoot.hidden = false;
    gameHint.textContent = "把小动物送到一样的影子上";
    if (!reuse) roundAnimals = takeRound();
    renderRound();
    roundBadge.textContent = "本组找到 0/3";
    updateCollection();
    preloadLibrary();
  }

  function markSelected(animalId) {
    selectedAnimalId = animalId;
    document.querySelectorAll(".animal-card").forEach(card => card.classList.toggle("selected",card.dataset.animal === animalId));
    const animal = roundAnimals.find(item => item.id === animalId);
    if (animal) showFeedback(`帮${animal.name}找影子吧！`);
  }

  function rejectMatch(animalId,targetId) {
    const slot = document.querySelector(`.slot[data-target="${targetId}"]`);
    const card = document.querySelector(`.animal-card[data-animal="${animalId}"]`);
    slot?.classList.remove("wrong");
    card?.classList.remove("wrong");
    void slot?.offsetWidth;
    slot?.classList.add("wrong");
    card?.classList.add("wrong");
    showFeedback("轮廓不一样，再看看！");
    playTone("wrong");
  }

  function attemptMatch(animalId,targetId) {
    if (locked || matched.has(animalId)) return;
    if (animalId !== targetId) {
      rejectMatch(animalId,targetId);
      return;
    }
    const animal = roundAnimals.find(item => item.id === animalId);
    const slot = document.querySelector(`.slot[data-target="${targetId}"]`);
    const card = document.querySelector(`.animal-card[data-animal="${animalId}"]`);
    matched.add(animalId);
    collected.add(animalId);
    selectedAnimalId = "";
    slot?.classList.add("matched");
    slot?.setAttribute("aria-label",`${animal.name}配对成功`);
    const image = slot?.querySelector(".slot-image");
    if (image) image.alt = `${animal.name}已经找到影子`;
    const label = slot?.querySelector(".slot-label");
    if (label) label.textContent = `${animal.name} ✓`;
    card?.classList.add("used");
    card?.classList.remove("selected");
    roundBadge.textContent = `本组找到 ${matched.size}/3`;
    updateCollection();
    showFeedback(`${animal.name}找到影子啦！`);
    playTone("good");
    if (matched.size === 3) window.setTimeout(finishRound,520);
  }

  function finishRound() {
    locked = true;
    successBanner.hidden = false;
    gameHint.textContent = "太棒啦，三个影子全都找到了！";
    cardsRoot.hidden = true;
    nextPanel.hidden = false;
    makeConfetti();
    playTone("finish");
    try {
      window.GameTracking?.trackGameEvent?.("round_complete",{game:"shadow_match",collected:collected.size});
    } catch (_) { /* Tracking must never interrupt play. */ }
  }

  function pointInside(element,x,y) {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function moveGhost(x,y) {
    dragGhost.style.left = `${x}px`;
    dragGhost.style.top = `${y}px`;
    document.querySelectorAll(".slot:not(.matched)").forEach(slot => slot.classList.toggle("drop-ready",pointInside(slot,x,y)));
  }

  function beginDrag(event,card) {
    if (locked || card.classList.contains("used")) return;
    drag = {pointerId:event.pointerId,animalId:card.dataset.animal,startX:event.clientX,startY:event.clientY,moved:false};
    card.setPointerCapture?.(event.pointerId);
    dragGhost.replaceChildren(card.querySelector("img").cloneNode(true));
    dragGhost.classList.add("visible");
    moveGhost(event.clientX,event.clientY);
  }

  function continueDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY) > 7) drag.moved = true;
    moveGhost(event.clientX,event.clientY);
  }

  function finishDrag(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const target = [...document.querySelectorAll(".slot:not(.matched)")].find(slot => pointInside(slot,event.clientX,event.clientY));
    const animalId = drag.animalId;
    const tapped = !drag.moved;
    dragGhost.classList.remove("visible");
    document.querySelectorAll(".slot").forEach(slot => slot.classList.remove("drop-ready"));
    drag = null;
    if (target) attemptMatch(animalId,target.dataset.target);
    else if (tapped) markSelected(animalId);
  }

  function preloadLibrary() {
    window.setTimeout(() => {
      animals.forEach(animal => {
        const image = new Image();
        image.src = asset(animal);
      });
    },950);
  }

  window.addEventListener("pointermove",continueDrag);
  window.addEventListener("pointerup",finishDrag);
  window.addEventListener("pointercancel",finishDrag);
  nextButton.addEventListener("click",() => startRound(false));
  resetButton.addEventListener("click",() => startRound(true));

  refillBag();
  startRound(false);
})();
