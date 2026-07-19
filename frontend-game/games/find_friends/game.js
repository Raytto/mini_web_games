(() => {
  "use strict";

  const ASSET_ROOT = "../shared/generated_assets";
  const habitats = [
    { id:"tree", name:"树梢", icon:"🌳", prompt:"谁住在树上？", background:"find_friends_habitat_tree.jpg" },
    { id:"grassland", name:"草原", icon:"🌾", prompt:"谁住在草原？", background:"find_friends_habitat_grassland.jpg" },
    { id:"water", name:"水下", icon:"🌊", prompt:"谁住在水里？", background:"find_friends_habitat_water.jpg" }
  ];
  const animals = [
    { id:"squirrel", name:"小松鼠", habitat:"tree" }, { id:"owl", name:"猫头鹰", habitat:"tree" },
    { id:"woodpecker", name:"啄木鸟", habitat:"tree" }, { id:"monkey", name:"小猴子", habitat:"tree" },
    { id:"parrot", name:"小鹦鹉", habitat:"tree" }, { id:"koala", name:"小考拉", habitat:"tree" },
    { id:"lion", name:"小狮子", habitat:"grassland" }, { id:"zebra", name:"小斑马", habitat:"grassland" },
    { id:"giraffe", name:"长颈鹿", habitat:"grassland" }, { id:"elephant", name:"小象", habitat:"grassland" },
    { id:"antelope", name:"小羚羊", habitat:"grassland" }, { id:"ostrich", name:"鸵鸟", habitat:"grassland" },
    { id:"clownfish", name:"小丑鱼", habitat:"water" }, { id:"bluefish", name:"蓝蓝鱼", habitat:"water" },
    { id:"seahorse", name:"小海马", habitat:"water" }, { id:"turtle", name:"小海龟", habitat:"water" },
    { id:"octopus", name:"小章鱼", habitat:"water" }, { id:"dolphin", name:"小海豚", habitat:"water" }
  ];

  const habitatGrid = document.getElementById("habitatGrid");
  const cardsRoot = document.getElementById("animalCards");
  const roundBadge = document.getElementById("roundBadge");
  const collectionBadge = document.getElementById("collectionBadge");
  const gameHint = document.getElementById("gameHint");
  const feedback = document.getElementById("feedback");
  const successBanner = document.getElementById("successBanner");
  const confetti = document.getElementById("confetti");
  const nextPanel = document.getElementById("nextPanel");
  const nextButton = document.getElementById("nextButton");
  const resetButton = document.getElementById("resetButton");
  const dragGhost = document.getElementById("dragGhost");

  const bags = new Map();
  const previous = new Map();
  let roundAnimals = [];
  let matched = new Set();
  let collected = new Set();
  let selectedAnimalId = "";
  let drag = null;
  let feedbackTimer = 0;
  let locked = false;

  function shuffled(source) {
    const result = [...source];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [result[index],result[target]] = [result[target],result[index]];
    }
    return result;
  }

  function drawFromHabitat(habitatId) {
    let bag = bags.get(habitatId) || [];
    if (!bag.length) {
      bag = shuffled(animals.filter(animal => animal.habitat === habitatId));
      const lastId = previous.get(habitatId);
      if (bag.length > 1 && bag[0].id === lastId) [bag[0],bag[1]] = [bag[1],bag[0]];
    }
    const chosen = bag.shift();
    bags.set(habitatId,bag);
    previous.set(habitatId,chosen.id);
    return chosen;
  }

  function takeRound() {
    return habitats.map(habitat => drawFromHabitat(habitat.id));
  }

  function asset(animal) {
    return `${ASSET_ROOT}/find_friends_animal_${animal.id}.png`;
  }

  function showFeedback(text) {
    window.clearTimeout(feedbackTimer);
    feedback.textContent = text;
    feedback.classList.remove("show");
    void feedback.offsetWidth;
    feedback.classList.add("show");
    feedbackTimer = window.setTimeout(() => feedback.classList.remove("show"),1100);
  }

  function updateCollection() {
    collectionBadge.textContent = collected.size === animals.length ? "动物图鉴集齐啦！" : `动物图鉴 ${collected.size}/${animals.length}`;
  }

  function playTone(kind) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const notes = kind === "wrong" ? [190,155] : kind === "finish" ? [523,659,784] : [440,587];
      notes.forEach((frequency,index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001,context.currentTime + index * .1);
        gain.gain.exponentialRampToValueAtTime(.1,context.currentTime + index * .1 + .015);
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
    for (let index = 0; index < 54; index += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.setProperty("--w",`${6 + Math.random() * 8}px`);
      piece.style.setProperty("--h",`${9 + Math.random() * 13}px`);
      piece.style.setProperty("--color",colors[index % colors.length]);
      piece.style.setProperty("--duration",`${1.8 + Math.random() * 1.2}s`);
      piece.style.setProperty("--delay",`${Math.random() * .55}s`);
      piece.style.setProperty("--drift",`${-80 + Math.random() * 160}px`);
      piece.style.setProperty("--spin",`${-520 + Math.random() * 1040}deg`);
      confetti.appendChild(piece);
    }
    window.setTimeout(() => confetti.replaceChildren(),3400);
  }

  function renderHabitats() {
    habitatGrid.replaceChildren();
    habitats.forEach(habitat => {
      const zone = document.createElement("button");
      zone.type = "button";
      zone.className = "habitat-card";
      zone.dataset.habitat = habitat.id;
      zone.style.backgroundImage = `url("${ASSET_ROOT}/${habitat.background}")`;
      zone.setAttribute("aria-label",`${habitat.name}，${habitat.prompt}`);
      zone.innerHTML = `<span class="habitat-label"><b>${habitat.icon}</b>${habitat.name}</span><span class="empty-cue">${habitat.prompt}</span><span class="resident"></span>`;
      zone.addEventListener("click",() => {
        if (selectedAnimalId) attemptMatch(selectedAnimalId,habitat.id);
        else if (!locked && !zone.classList.contains("matched")) showFeedback(habitat.prompt);
      });
      habitatGrid.appendChild(zone);
    });
  }

  function renderCards() {
    cardsRoot.replaceChildren();
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
    gameHint.textContent = "把小动物送到它生活的地方";
    if (!reuse) roundAnimals = takeRound();
    renderHabitats();
    renderCards();
    roundBadge.textContent = "本组回家 0/3";
    updateCollection();
    preloadLibrary();
  }

  function markSelected(animalId) {
    selectedAnimalId = animalId;
    document.querySelectorAll(".animal-card").forEach(card => card.classList.toggle("selected",card.dataset.animal === animalId));
    const animal = roundAnimals.find(item => item.id === animalId);
    if (animal) showFeedback(`帮${animal.name}找家吧！`);
  }

  function clearSelection() {
    selectedAnimalId = "";
    document.querySelectorAll(".animal-card").forEach(card => card.classList.remove("selected"));
    document.querySelectorAll(".habitat-card").forEach(zone => zone.classList.remove("selected-target"));
  }

  function rejectMatch(animalId,habitatId) {
    const zone = document.querySelector(`.habitat-card[data-habitat="${habitatId}"]`);
    const card = document.querySelector(`.animal-card[data-animal="${animalId}"]`);
    zone?.classList.remove("wrong"); card?.classList.remove("wrong");
    void zone?.offsetWidth;
    zone?.classList.add("wrong"); card?.classList.add("wrong");
    const habitat = habitats.find(item => item.id === habitatId);
    showFeedback(`这里是${habitat?.name || "另一个家"}，再想想！`);
    playTone("wrong");
  }

  function attemptMatch(animalId,habitatId) {
    if (locked || matched.has(animalId)) return;
    const animal = roundAnimals.find(item => item.id === animalId);
    if (!animal || animal.habitat !== habitatId) {
      rejectMatch(animalId,habitatId);
      return;
    }
    const zone = document.querySelector(`.habitat-card[data-habitat="${habitatId}"]`);
    const card = document.querySelector(`.animal-card[data-animal="${animalId}"]`);
    matched.add(animalId);
    collected.add(animalId);
    clearSelection();
    zone?.classList.add("matched");
    zone?.setAttribute("aria-label",`${animal.name}已经回到${habitats.find(item => item.id === habitatId)?.name}`);
    const cue = zone?.querySelector(".empty-cue");
    if (cue) cue.hidden = true;
    const resident = zone?.querySelector(".resident");
    if (resident) resident.innerHTML = `<img src="${asset(animal)}" alt="${animal.name}" draggable="false"><span class="resident-name">${animal.name} ✓</span>`;
    card?.classList.add("used");
    roundBadge.textContent = `本组回家 ${matched.size}/3`;
    updateCollection();
    showFeedback(`${animal.name}回到${habitats.find(item => item.id === habitatId)?.name}啦！`);
    playTone("good");
    if (matched.size === 3) window.setTimeout(finishRound,520);
  }

  function finishRound() {
    locked = true;
    clearSelection();
    successBanner.hidden = false;
    gameHint.textContent = "太棒啦，三个小动物都回家了！";
    cardsRoot.hidden = true;
    nextPanel.hidden = false;
    makeConfetti();
    playTone("finish");
    try { window.GameTracking?.trackGameEvent?.("round_complete",{game:"find_friends",collected:collected.size}); } catch (_) { /* Tracking must not interrupt play. */ }
  }

  function pointInside(element,x,y) {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function moveGhost(x,y) {
    dragGhost.style.left = `${x}px`;
    dragGhost.style.top = `${y}px`;
    document.querySelectorAll(".habitat-card:not(.matched)").forEach(zone => zone.classList.toggle("drop-ready",pointInside(zone,x,y)));
  }

  function beginDrag(event,card) {
    if (locked || card.classList.contains("used")) return;
    drag = { pointerId:event.pointerId, animalId:card.dataset.animal, startX:event.clientX, startY:event.clientY, moved:false };
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
    const zone = [...document.querySelectorAll(".habitat-card:not(.matched)")].find(item => pointInside(item,event.clientX,event.clientY));
    const animalId = drag.animalId;
    const tapped = !drag.moved;
    dragGhost.classList.remove("visible");
    document.querySelectorAll(".habitat-card").forEach(item => item.classList.remove("drop-ready"));
    drag = null;
    if (zone) attemptMatch(animalId,zone.dataset.habitat);
    else if (tapped) markSelected(animalId);
  }

  function preloadLibrary() {
    animals.forEach((animal,index) => window.setTimeout(() => { const image = new Image(); image.src = asset(animal); },index * 25));
  }

  document.addEventListener("pointermove",continueDrag,{ passive:true });
  document.addEventListener("pointerup",finishDrag);
  document.addEventListener("pointercancel",finishDrag);
  nextButton.addEventListener("click",() => startRound(false));
  resetButton.addEventListener("click",() => startRound(true));
  startRound(false);
})();
