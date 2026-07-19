(() => {
    "use strict";

    const GOAL = 5;
    const FOOD_LIBRARY = [
        { id: "fish", name: "小鱼", image: "assets/food_fish.webp", liked: true },
        { id: "chicken", name: "鸡肉", image: "assets/food_chicken.webp", liked: true },
        { id: "shrimp", name: "小虾", image: "assets/food_shrimp.webp", liked: true },
        { id: "kibble", name: "猫粮", image: "assets/food_kibble.webp", liked: true },
        { id: "broccoli", name: "西兰花", image: "assets/food_broccoli.webp", liked: false },
        { id: "lemon", name: "柠檬", image: "assets/food_lemon.webp", liked: false }
    ];

    const CAT_IMAGES = {
        waiting: "assets/cat_waiting.webp",
        happy: "assets/cat_happy.webp",
        nope: "assets/cat_nope.webp"
    };

    const HAPPY_LINES = ["猫猫好喜欢！", "真好吃，谢谢你！", "喵呜，好香呀！", "选得真棒！"];
    const SORT_LINES = ["分好啦，真细心！", "放对小篮子啦！", "你很会照顾猫猫！"];

    const scene = document.getElementById("scene");
    const foodList = document.getElementById("foodList");
    const template = document.getElementById("foodTemplate");
    const catTarget = document.getElementById("catTarget");
    const catImage = document.getElementById("catImage");
    const basketTarget = document.getElementById("basketTarget");
    const bowlFood = document.getElementById("bowlFood");
    const statusText = document.getElementById("statusText");
    const mealProgress = document.getElementById("mealProgress");
    const roundFinish = document.getElementById("roundFinish");
    const nextRoundButton = document.getElementById("nextRoundButton");
    const resetButton = document.getElementById("resetButton");
    const sparkles = document.getElementById("sparkles");

    let score = 0;
    let roundFinished = false;
    let selectedCard = null;
    let reactionTimer = null;
    let dragState = null;
    let audioContext = null;

    function randomItem(items) {
        return items[Math.floor(Math.random() * items.length)];
    }

    function shuffled(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function buildRoundFoods() {
        const liked = shuffled(FOOD_LIBRARY.filter(food => food.liked)).slice(0, 2);
        const sort = shuffled(FOOD_LIBRARY.filter(food => !food.liked));
        return shuffled([...liked, ...sort]);
    }

    function makeFoodCard(food, animate = false) {
        const card = template.content.firstElementChild.cloneNode(true);
        const image = card.querySelector("img");
        image.src = food.image;
        image.alt = food.name;
        card.querySelector("span").textContent = food.name;
        card.dataset.foodId = food.id;
        card._food = food;
        if (animate) card.classList.add("entering");
        card.addEventListener("pointerdown", event => beginPointer(event, card));
        return card;
    }

    function renderFoods() {
        foodList.replaceChildren(...buildRoundFoods().map(food => makeFoodCard(food)));
    }

    function renderProgress() {
        mealProgress.replaceChildren();
        for (let i = 0; i < GOAL; i += 1) {
            const star = document.createElement("span");
            star.className = `meal-star${i < score ? " filled" : ""}`;
            star.textContent = "★";
            mealProgress.appendChild(star);
        }
    }

    function setStatus(message, pop = false) {
        statusText.textContent = message;
        statusText.classList.toggle("pop", pop);
        if (pop) window.setTimeout(() => statusText.classList.remove("pop"), 260);
    }

    function setCatState(state) {
        catImage.src = CAT_IMAGES[state];
        catImage.alt = state === "happy" ? "开心舔嘴的橘猫" : state === "nope" ? "轻轻摇头的橘猫" : "等待吃饭的橘猫";
        catTarget.classList.toggle("reacting", state === "happy");
        catTarget.classList.toggle("nope", state === "nope");
    }

    function resetCatSoon(delay = 1050) {
        window.clearTimeout(reactionTimer);
        reactionTimer = window.setTimeout(() => {
            if (!roundFinished) setCatState("waiting");
            catTarget.classList.remove("reacting", "nope");
        }, delay);
    }

    function playTone(kind) {
        try {
            audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === "suspended") audioContext.resume();
            const now = audioContext.currentTime;
            const notes = kind === "happy" ? [523, 659, 784] : kind === "sort" ? [440, 554] : [246, 220];
            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                oscillator.type = "sine";
                oscillator.frequency.value = frequency;
                gain.gain.setValueAtTime(0.0001, now + index * .08);
                gain.gain.exponentialRampToValueAtTime(.055, now + index * .08 + .015);
                gain.gain.exponentialRampToValueAtTime(.0001, now + index * .08 + .14);
                oscillator.connect(gain).connect(audioContext.destination);
                oscillator.start(now + index * .08);
                oscillator.stop(now + index * .08 + .16);
            });
        } catch (_) {
            // Visual feedback remains complete when audio is unavailable.
        }
    }

    function createSparkles(big = false) {
        const icons = ["★", "❤", "✦", "★", "✦"];
        const count = big ? 24 : 9;
        for (let i = 0; i < count; i += 1) {
            const sparkle = document.createElement("span");
            sparkle.className = "sparkle";
            sparkle.textContent = icons[i % icons.length];
            sparkle.style.color = ["#ffba31", "#ff7587", "#7bd6c0", "#8e7ce8"][i % 4];
            const spread = big ? 360 : 180;
            sparkle.style.setProperty("--dx", `${(Math.random() - .5) * spread}px`);
            sparkle.style.setProperty("--dy", `${-40 - Math.random() * (big ? 250 : 130)}px`);
            sparkle.style.left = `${35 + Math.random() * 30}%`;
            sparkle.style.top = `${48 + Math.random() * 14}%`;
            sparkle.style.animationDelay = `${Math.random() * .12}s`;
            sparkles.appendChild(sparkle);
            window.setTimeout(() => sparkle.remove(), 1100);
        }
    }

    function showFoodInBowl(food) {
        bowlFood.src = food.image;
        bowlFood.alt = food.name;
        requestAnimationFrame(() => bowlFood.classList.add("show"));
        window.setTimeout(() => bowlFood.classList.remove("show"), 720);
    }

    function markTargetFor(food) {
        catTarget.classList.toggle("is-ready", Boolean(food?.liked));
        basketTarget.classList.toggle("is-ready", Boolean(food && !food.liked));
    }

    function clearSelection() {
        if (selectedCard) selectedCard.classList.remove("selected");
        selectedCard = null;
        markTargetFor(null);
    }

    function selectCard(card) {
        if (roundFinished || !card?.isConnected) return;
        if (selectedCard === card) {
            clearSelection();
            setStatus("选一个食物试试看");
            return;
        }
        clearSelection();
        selectedCard = card;
        card.classList.add("selected");
        markTargetFor(card._food);
        setStatus(card._food.liked ? "把它送给猫猫吧！" : "这个放进小篮子吧！", true);
    }

    function replacementFood(excludeId) {
        const cards = [...foodList.children];
        const visibleIds = new Set(cards.map(card => card.dataset.foodId));
        const candidates = FOOD_LIBRARY.filter(food => food.id !== excludeId && !visibleIds.has(food.id));
        return randomItem(candidates.length ? candidates : FOOD_LIBRARY.filter(food => food.id !== excludeId));
    }

    function removeAndReplace(card) {
        const replacement = replacementFood(card.dataset.foodId);
        const nextCard = makeFoodCard(replacement, true);
        card.classList.add("leaving");
        window.setTimeout(() => {
            if (card.isConnected && !roundFinished) card.replaceWith(nextCard);
        }, 220);
    }

    function rejectCard(card, message) {
        card.classList.remove("wrong");
        requestAnimationFrame(() => card.classList.add("wrong"));
        window.setTimeout(() => card.classList.remove("wrong"), 480);
        setStatus(message, true);
        playTone("nope");
        clearSelection();
    }

    function feedCat(card) {
        if (!card?._food || roundFinished) return;
        const food = card._food;
        if (!food.liked) {
            setCatState("nope");
            rejectCard(card, "猫猫摇摇头：放进小篮子吧");
            resetCatSoon(1200);
            return;
        }

        clearSelection();
        score += 1;
        renderProgress();
        setCatState("happy");
        setStatus(randomItem(HAPPY_LINES), true);
        showFoodInBowl(food);
        createSparkles(false);
        playTone("happy");
        removeAndReplace(card);

        if (score >= GOAL) {
            window.setTimeout(finishRound, 430);
        } else {
            resetCatSoon();
        }
    }

    function sortFood(card) {
        if (!card?._food || roundFinished) return;
        const food = card._food;
        if (food.liked) {
            rejectCard(card, "这个猫猫很想吃，送给它吧！");
            return;
        }

        clearSelection();
        basketTarget.classList.remove("bump");
        requestAnimationFrame(() => basketTarget.classList.add("bump"));
        setStatus(randomItem(SORT_LINES), true);
        playTone("sort");
        removeAndReplace(card);
    }

    function finishRound() {
        if (roundFinished) return;
        roundFinished = true;
        clearSelection();
        setCatState("happy");
        setStatus("猫猫吃饱啦，肚子圆滚滚！", true);
        foodList.hidden = true;
        roundFinish.hidden = false;
        createSparkles(true);
        playTone("happy");
        track("round_complete", { score });
    }

    function startRound() {
        roundFinished = false;
        score = 0;
        window.clearTimeout(reactionTimer);
        clearSelection();
        setCatState("waiting");
        setStatus("猫猫肚子饿啦！");
        bowlFood.classList.remove("show");
        roundFinish.hidden = true;
        foodList.hidden = false;
        renderProgress();
        renderFoods();
        track("round_start");
    }

    function track(eventName, data = {}) {
        try {
            if (typeof window.trackGameEvent === "function") {
                window.trackGameEvent(eventName, data);
            }
        } catch (_) {
            // Tracking must never interrupt play.
        }
    }

    function createGhost(card, x, y) {
        const ghost = document.createElement("div");
        ghost.className = "drag-ghost";
        const image = card.querySelector("img").cloneNode(true);
        ghost.appendChild(image);
        ghost.style.left = `${x}px`;
        ghost.style.top = `${y}px`;
        document.body.appendChild(ghost);
        return ghost;
    }

    function beginPointer(event, card) {
        if (roundFinished || event.button > 0) return;
        event.preventDefault();
        dragState = {
            pointerId: event.pointerId,
            card,
            startX: event.clientX,
            startY: event.clientY,
            moved: false,
            ghost: null
        };
        card.setPointerCapture?.(event.pointerId);
    }

    function movePointer(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        const dx = event.clientX - dragState.startX;
        const dy = event.clientY - dragState.startY;
        if (!dragState.moved && Math.hypot(dx, dy) > 8) {
            dragState.moved = true;
            clearSelection();
            dragState.card.classList.add("drag-source");
            dragState.ghost = createGhost(dragState.card, event.clientX, event.clientY);
            markTargetFor(dragState.card._food);
        }
        if (dragState.ghost) {
            dragState.ghost.style.left = `${event.clientX}px`;
            dragState.ghost.style.top = `${event.clientY}px`;
        }
    }

    function endPointer(event) {
        if (!dragState || event.pointerId !== dragState.pointerId) return;
        const current = dragState;
        dragState = null;
        current.card.classList.remove("drag-source");
        current.ghost?.remove();
        markTargetFor(null);

        if (!current.moved) {
            selectCard(current.card);
            return;
        }

        const zone = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-drop-zone]");
        if (zone?.dataset.dropZone === "cat") {
            feedCat(current.card);
        } else if (zone?.dataset.dropZone === "basket") {
            sortFood(current.card);
        } else {
            setStatus("再靠近一点点");
        }
    }

    window.addEventListener("pointermove", movePointer, { passive: false });
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
    catTarget.addEventListener("click", () => selectedCard && feedCat(selectedCard));
    document.getElementById("bowlTarget").addEventListener("click", () => selectedCard && feedCat(selectedCard));
    basketTarget.addEventListener("click", () => selectedCard && sortFood(selectedCard));
    nextRoundButton.addEventListener("click", startRound);
    resetButton.addEventListener("click", startRound);
    scene.addEventListener("dragstart", event => event.preventDefault());
    foodList.addEventListener("dragstart", event => event.preventDefault());

    Object.values(CAT_IMAGES).concat(FOOD_LIBRARY.map(food => food.image)).forEach(source => {
        const image = new Image();
        image.src = source;
    });

    startRound();
})();
