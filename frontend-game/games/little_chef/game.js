(() => {
  "use strict";

  const ASSET_ROOT = "../shared/generated_assets";

  const toolCatalog = {
    milk: { name: "牛奶", label: "倒牛奶", alt: "牛奶小壶", asset: "little_chef_tool_milk.png" },
    egg: { name: "鸡蛋", label: "打鸡蛋", alt: "鸡蛋", asset: "little_chef_tool_egg.png" },
    flour: { name: "面粉", label: "加面粉", alt: "面粉袋", asset: "little_chef_tool_flour.png" },
    whisk: { name: "打蛋器", label: "搅一搅", alt: "蓝色打蛋器", asset: "little_chef_tool_whisk.png" },
    bake: { name: "烤盘", label: "送去烤", alt: "隔热手套和烤盘", asset: "little_chef_tool_bake.png" },
    rollingPin: { name: "擀面杖", label: "揉面团", alt: "蓝色手柄擀面杖", asset: "little_chef_tool_rolling_pin.png" },
    oil: { name: "油", label: "倒一点油", alt: "一小瓶食用油", asset: "little_chef_tool_oil.png" },
    spatula: { name: "锅铲", label: "翻一翻", alt: "蓝色小锅铲", asset: "little_chef_tool_spatula.png" },
    tomato: { name: "番茄", label: "放番茄", alt: "番茄和番茄块", asset: "little_chef_tool_tomato.png" },
    water: { name: "清水", label: "倒清水", alt: "装着清水的量杯", asset: "little_chef_tool_water.png" },
    vegetables: { name: "蔬菜", label: "放蔬菜", alt: "一篮彩色蔬菜", asset: "little_chef_tool_vegetables.png" },
    ladle: { name: "汤勺", label: "搅一搅", alt: "红柄小汤勺", asset: "little_chef_tool_ladle.png" }
  };

  const recipes = [
    {
      id: "cupcakes",
      name: "香香小蛋糕",
      shortName: "小蛋糕",
      accent: "#f47b20",
      startStage: "empty",
      startHint: "第一步，把牛奶倒进大碗",
      waiting: "烘烤中",
      finishTitle: "小蛋糕出炉啦！",
      finishCopy: "从牛奶和鸡蛋变成了一盘香香小蛋糕",
      finishHint: "金黄金黄的小蛋糕出炉啦！",
      finishPraise: "香喷喷的小蛋糕！",
      doneStage: "done",
      steps: [
        { tool: "milk", stage: "milk", hint: "第二步，咔嚓！打一个鸡蛋", praise: "牛奶倒进去啦！", effect: "milk" },
        { tool: "egg", stage: "egg", hint: "第三步，加入白白的面粉", praise: "鸡蛋咔嚓打开啦！", effect: "egg" },
        { tool: "flour", stage: "flour", hint: "第四步，用打蛋器搅一搅", praise: "面粉像小雪！", effect: "flour" },
        { tool: "whisk", stage: "mix", hint: "面糊变顺滑啦，送进烤箱", praise: "转圈圈，搅匀啦！", effect: "mix" },
        { tool: "bake", stage: "oven", hint: "烤一烤，马上就好……", praise: "放进烤箱喽！", effect: "spark" }
      ]
    },
    {
      id: "bread",
      name: "软软小面包",
      shortName: "小面包",
      accent: "#d98a26",
      startStage: "empty",
      startHint: "第一步，先把面粉倒进大碗",
      waiting: "面包变金黄",
      finishTitle: "小面包出炉啦！",
      finishCopy: "揉一揉、烤一烤，面团变成了软软小面包",
      finishHint: "软乎乎的小面包做好啦！",
      finishPraise: "面包香香的！",
      doneStage: "bread_done",
      steps: [
        { tool: "flour", stage: "flour", hint: "第二步，倒一点牛奶", praise: "白白的面粉！", effect: "flour" },
        { tool: "milk", stage: "milk", hint: "第三步，用擀面杖揉面团", praise: "面粉喝饱牛奶啦！", effect: "milk" },
        { tool: "rollingPin", stage: "bread_knead", hint: "面团变光滑啦，送去烤", praise: "揉呀揉，面团软软的！", effect: "mix" },
        { tool: "bake", stage: "bread_oven", hint: "烤一烤，马上就好……", praise: "面包进烤箱喽！", effect: "spark" }
      ]
    },
    {
      id: "fried_egg",
      name: "太阳煎蛋",
      shortName: "煎蛋",
      accent: "#f0a700",
      startStage: "fried_empty",
      startHint: "第一步，往平底锅里倒一点油",
      waiting: "滋滋煎一煎",
      finishTitle: "太阳煎蛋做好啦！",
      finishCopy: "小油滴和鸡蛋在锅里变成了圆圆的太阳",
      finishHint: "圆圆的太阳煎蛋装盘啦！",
      finishPraise: "煎蛋像小太阳！",
      doneStage: "fried_done",
      steps: [
        { tool: "oil", stage: "fried_oil", hint: "第二步，咔嚓！打一个鸡蛋", praise: "锅里亮晶晶！", effect: "oil" },
        { tool: "egg", stage: "fried_egg", hint: "第三步，用锅铲轻轻翻一翻", praise: "鸡蛋滑进锅里啦！", effect: "egg" },
        { tool: "spatula", stage: "fried_cook", hint: "滋滋滋，马上就熟啦……", praise: "轻轻翻一翻！", effect: "spark" }
      ]
    },
    {
      id: "tomato_eggs",
      name: "番茄炒蛋",
      shortName: "番茄炒蛋",
      accent: "#ef5341",
      startStage: "fried_empty",
      startHint: "第一步，往平底锅里倒一点油",
      waiting: "炒香香",
      finishTitle: "番茄炒蛋做好啦！",
      finishCopy: "红番茄和黄鸡蛋一起变成了香香的一盘菜",
      finishHint: "红红黄黄的番茄炒蛋装盘啦！",
      finishPraise: "红黄配，好香呀！",
      doneStage: "tomato_done",
      steps: [
        { tool: "oil", stage: "fried_oil", hint: "第二步，把红番茄放进锅", praise: "锅里亮晶晶！", effect: "oil" },
        { tool: "tomato", stage: "tomato", hint: "第三步，再打两个鸡蛋", praise: "番茄红红的！", effect: "tomato" },
        { tool: "egg", stage: "tomato_egg", hint: "第四步，用锅铲炒一炒", praise: "黄鸡蛋来作伴！", effect: "egg" },
        { tool: "spatula", stage: "tomato_cook", hint: "炒一炒，马上就好……", praise: "红红黄黄拌匀啦！", effect: "mix" }
      ]
    },
    {
      id: "vegetable_soup",
      name: "彩虹蔬菜汤",
      shortName: "蔬菜汤",
      accent: "#28a79c",
      startStage: "soup_empty",
      startHint: "第一步，往汤锅里倒清水",
      waiting: "咕嘟咕嘟",
      finishTitle: "彩虹蔬菜汤好啦！",
      finishCopy: "胡萝卜、西兰花和玉米在锅里咕嘟咕嘟",
      finishHint: "热乎乎的彩虹蔬菜汤做好啦！",
      finishPraise: "蔬菜汤暖暖的！",
      doneStage: "soup_done",
      steps: [
        { tool: "water", stage: "soup_water", hint: "第二步，把彩色蔬菜放进锅", praise: "清水哗啦啦！", effect: "water" },
        { tool: "vegetables", stage: "soup_vegetables", hint: "第三步，用汤勺慢慢搅一搅", praise: "好多彩色蔬菜！", effect: "vegetables" },
        { tool: "ladle", stage: "soup_stir", hint: "咕嘟咕嘟，马上就好……", praise: "慢慢搅，香味出来啦！", effect: "mix" }
      ]
    }
  ];

  const stageAlts = {
    empty: "一个空的黄色大碗，等待放入材料",
    milk: "牛奶正倒进黄色大碗",
    egg: "鸡蛋正被打进黄色大碗",
    flour: "面粉正倒进黄色大碗",
    mix: "蓝色打蛋器正在把材料搅成顺滑面糊",
    oven: "装着六个蛋糕杯的烤盘正在橙色烤箱里烘烤",
    done: "一盘刚出炉的金黄小蛋糕",
    bread_knead: "擀面杖正在木板上揉光滑的面团",
    bread_oven: "小面包正在橙色烤箱里变金黄",
    bread_done: "刚出炉的金黄小面包放在木板上",
    fried_empty: "一个干净的红色平底锅",
    fried_oil: "红色平底锅里有一小滴金黄的油",
    fried_egg: "一个鸡蛋正在红色平底锅里慢慢变熟",
    fried_cook: "蓝色锅铲正在轻轻翻煎蛋",
    fried_done: "圆圆的太阳煎蛋装在蓝色盘子里",
    tomato: "红色平底锅里放进了番茄块",
    tomato_egg: "番茄块上加入了两个鸡蛋",
    tomato_cook: "锅铲正在翻炒番茄和鸡蛋",
    tomato_done: "一盘红红黄黄的番茄炒蛋",
    soup_empty: "一口干净的蓝色空汤锅",
    soup_water: "蓝色汤锅里装了半锅清水",
    soup_vegetables: "蓝色汤锅里加入了胡萝卜西兰花和玉米",
    soup_stir: "汤勺正在搅拌彩色蔬菜汤",
    soup_done: "一碗热乎乎的彩虹蔬菜汤"
  };

  const stageImage = document.getElementById("stageImage");
  const stageHint = document.getElementById("stageHint");
  const stepBadge = document.getElementById("stepBadge");
  const recipeName = document.getElementById("recipeName");
  const cookStage = document.getElementById("cookDropZone");
  const effects = document.getElementById("cookEffects");
  const praise = document.getElementById("praise");
  const toolsPanel = document.getElementById("tools");
  const progressDots = document.getElementById("progressDots");
  const bakingBadge = document.getElementById("bakingBadge");
  const waitingText = document.getElementById("waitingText");
  const finishPanel = document.getElementById("finishPanel");
  const finishTitle = document.getElementById("finishTitle");
  const finishCopy = document.getElementById("finishCopy");
  const againButton = document.getElementById("againButton");
  const resetButton = document.getElementById("resetButton");
  const dragGhost = document.getElementById("dragGhost");

  let recipe = recipes[0];
  let recipeDeck = [];
  let lastRecipeId = "";
  let step = 0;
  let locked = false;
  let praiseTimer = 0;
  let cookTimer = 0;
  let drag = null;

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function takeNextRecipe() {
    if (recipeDeck.length === 0) {
      recipeDeck = shuffle(recipes);
      if (recipeDeck.length > 1 && recipeDeck[0].id === lastRecipeId) {
        [recipeDeck[0], recipeDeck[1]] = [recipeDeck[1], recipeDeck[0]];
      }
    }
    return recipeDeck.shift();
  }

  function stageAsset(name) {
    return `${ASSET_ROOT}/little_chef_stage_${name}.png`;
  }

  function setStage(name, animate = true) {
    if (animate) stageImage.classList.add("changing");
    const preload = new Image();
    preload.onload = () => {
      stageImage.src = stageAsset(name);
      stageImage.alt = stageAlts[name] || recipe.name;
      stageImage.classList.remove("changing");
      if (animate) {
        stageImage.classList.remove("pop");
        void stageImage.offsetWidth;
        stageImage.classList.add("pop");
      }
    };
    preload.onerror = () => stageImage.classList.remove("changing");
    preload.src = stageAsset(name);
  }

  function renderTools() {
    toolsPanel.replaceChildren();
    toolsPanel.dataset.count = String(recipe.steps.length);
    progressDots.replaceChildren();
    recipe.steps.forEach((item, index) => {
      const tool = toolCatalog[item.tool];
      const card = document.createElement("button");
      card.className = "tool-card";
      card.type = "button";
      card.dataset.tool = item.tool;
      card.setAttribute("aria-label", tool.label);
      card.innerHTML = `<img src="${ASSET_ROOT}/${tool.asset}" alt="${tool.alt}" draggable="false"><span>${tool.label}</span>`;
      card.addEventListener("pointerdown", event => beginDrag(event, card));
      toolsPanel.appendChild(card);

      const dot = document.createElement("span");
      dot.className = index === 0 ? "dot active" : "dot";
      progressDots.appendChild(dot);
    });
  }

  function updateUi() {
    document.querySelectorAll(".tool-card").forEach((card, index) => {
      card.classList.toggle("used", index < step);
      card.classList.toggle("expected", index === step && step < recipe.steps.length);
      card.setAttribute("aria-disabled", index < step ? "true" : "false");
    });
    document.querySelectorAll(".dot").forEach((dot, index) => {
      dot.classList.toggle("done", index < step);
      dot.classList.toggle("active", index === step && step < recipe.steps.length);
    });
    stepBadge.textContent = step < recipe.steps.length
      ? `第 ${step + 1} 步 / 共 ${recipe.steps.length} 步`
      : "全部完成！";
  }

  function showPraise(text) {
    window.clearTimeout(praiseTimer);
    praise.textContent = text;
    praise.classList.remove("show");
    void praise.offsetWidth;
    praise.classList.add("show");
    praiseTimer = window.setTimeout(() => praise.classList.remove("show"), 1150);
  }

  function clearEffects() {
    effects.replaceChildren();
  }

  function fallingSpecks(colors, count) {
    clearEffects();
    const palette = Array.isArray(colors) ? colors : [colors];
    for (let index = 0; index < count; index += 1) {
      const speck = document.createElement("i");
      speck.className = "ingredient-speck";
      const size = 5 + Math.random() * 11;
      speck.style.width = `${size}px`;
      speck.style.height = `${size}px`;
      speck.style.left = `${31 + Math.random() * 38}%`;
      speck.style.setProperty("--color", palette[index % palette.length]);
      speck.style.setProperty("--duration", `${.65 + Math.random() * .55}s`);
      speck.style.setProperty("--drift", `${-25 + Math.random() * 50}px`);
      speck.style.animationDelay = `${Math.random() * .3}s`;
      effects.appendChild(speck);
    }
    window.setTimeout(clearEffects, 1500);
  }

  function mixSwirl() {
    clearEffects();
    const swirl = document.createElement("i");
    swirl.className = "swirl";
    effects.appendChild(swirl);
    window.setTimeout(clearEffects, 1100);
  }

  function sparkleBurst() {
    clearEffects();
    for (let index = 0; index < 15; index += 1) {
      const spark = document.createElement("i");
      spark.className = "spark";
      spark.textContent = "✦";
      spark.style.left = `${8 + Math.random() * 84}%`;
      spark.style.top = `${6 + Math.random() * 78}%`;
      spark.style.setProperty("--size", `${22 + Math.random() * 29}px`);
      spark.style.animationDelay = `${Math.random() * .55}s`;
      effects.appendChild(spark);
    }
    window.setTimeout(clearEffects, 1750);
  }

  function playTone(kind) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      const notes = kind === "wrong" ? [185, 145] : kind === "done" ? [523, 659, 784] : [440, 587];
      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, context.currentTime + index * .1);
        gain.gain.exponentialRampToValueAtTime(.11, context.currentTime + index * .1 + .015);
        gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + index * .1 + .17);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(context.currentTime + index * .1);
        oscillator.stop(context.currentTime + index * .1 + .19);
      });
      window.setTimeout(() => context.close(), 650);
    } catch (_) { /* Sound is optional. */ }
  }

  function rejectTool() {
    cookStage.classList.remove("wrong");
    void cookStage.offsetWidth;
    cookStage.classList.add("wrong");
    showPraise(`先用${toolCatalog[recipe.steps[step].tool].name}哦！`);
    playTone("wrong");
    window.GameJuice?.vibrate([18, 34, 18]);
    window.GameJuice?.shake(cookStage);
  }

  function finishRecipe() {
    locked = true;
    bakingBadge.hidden = false;
    waitingText.textContent = recipe.waiting;
    stageImage.classList.add("baking");
    cookTimer = window.setTimeout(() => {
      stageImage.classList.remove("baking");
      bakingBadge.hidden = true;
      setStage(recipe.doneStage);
      stageHint.textContent = recipe.finishHint;
      stepBadge.textContent = "全部完成！";
      toolsPanel.hidden = true;
      progressDots.hidden = true;
      finishTitle.textContent = recipe.finishTitle;
      finishCopy.textContent = recipe.finishCopy;
      finishPanel.hidden = false;
      sparkleBurst();
      showPraise(recipe.finishPraise);
      playTone("done");
      window.GameJuice?.vibrate([24, 42, 30]);
      window.GameJuice?.burst(cookStage, { count: 24, symbols: ["✦", "★", "❤"] });
      try {
        window.GameTracking?.trackGameEvent?.("round_complete", { game: "little_chef", recipe: recipe.id });
      } catch (_) { /* Tracking must never interrupt play. */ }
    }, 1550);
  }

  function runStepEffect(effect) {
    const effectMap = {
      milk: ["#f4fbff"], egg: ["#ffd23e"], flour: ["#fffdf1"], oil: ["#ffc832"],
      tomato: ["#f04437", "#ff7668"], water: ["#81d8f2"], vegetables: ["#f28b2e", "#5cbd55", "#ffd84a"]
    };
    if (effect === "mix") mixSwirl();
    else if (effect === "spark") sparkleBurst();
    else if (effectMap[effect]) fallingSpecks(effectMap[effect], effect === "flour" ? 22 : 15);
  }

  function applyTool(tool) {
    if (locked || step >= recipe.steps.length) return;
    const current = recipe.steps[step];
    if (tool !== current.tool) {
      rejectTool();
      return;
    }
    locked = true;
    setStage(current.stage);
    stageHint.textContent = current.hint;
    showPraise(current.praise);
    runStepEffect(current.effect);
    step += 1;
    updateUi();
    playTone("good");
    window.GameJuice?.vibrate(20);
    window.GameJuice?.burst(cookStage, { count: 9, symbols: ["●", "✦", "★"] });
    window.setTimeout(() => {
      if (step === recipe.steps.length) finishRecipe();
      else locked = false;
    }, 470);
  }

  function beginRecipe(nextRecipe) {
    window.clearTimeout(cookTimer);
    recipe = nextRecipe;
    lastRecipeId = recipe.id;
    step = 0;
    locked = false;
    clearEffects();
    bakingBadge.hidden = true;
    stageImage.classList.remove("baking");
    toolsPanel.hidden = false;
    progressDots.hidden = false;
    finishPanel.hidden = true;
    document.documentElement.style.setProperty("--accent", recipe.accent);
    recipeName.textContent = recipe.name;
    stageHint.textContent = recipe.startHint;
    renderTools();
    setStage(recipe.startStage);
    updateUi();
    window.setTimeout(() => {
      const firstTool = document.querySelector(".tool-card");
      if (firstTool && !locked) window.GameJuice?.guide(firstTool, cookStage, 900);
    }, 280);
  }

  function pointInside(element, x, y) {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function moveGhost(x, y) {
    dragGhost.style.left = `${x}px`;
    dragGhost.style.top = `${y}px`;
    cookStage.classList.toggle("drop-ready", pointInside(cookStage, x, y));
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
    const dropped = pointInside(cookStage, event.clientX, event.clientY);
    const tapped = !drag.moved;
    const tool = drag.tool;
    dragGhost.classList.remove("visible");
    cookStage.classList.remove("drop-ready");
    drag = null;
    if (dropped || tapped) applyTool(tool);
  }

  window.addEventListener("pointermove", continueDrag);
  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);
  resetButton.addEventListener("click", () => beginRecipe(recipe));
  againButton.addEventListener("click", () => beginRecipe(takeNextRecipe()));

  beginRecipe(takeNextRecipe());
  window.setTimeout(() => {
    recipes.flatMap(item => [item.startStage, item.doneStage, ...item.steps.map(recipeStep => recipeStep.stage)])
      .filter((name, index, all) => all.indexOf(name) === index)
      .forEach(name => {
        const preload = new Image();
        preload.src = stageAsset(name);
      });
  }, 700);
})();
