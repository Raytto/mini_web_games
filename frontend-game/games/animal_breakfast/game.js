const ASSET_ROOT = '../shared/generated_assets';

const breakfastPairs = [
    { id: 'monkey', animal: '小猴', foodId: 'banana', food: '香蕉', good: '小猴开心地吃起香蕉', animalAsset: 'animal_breakfast_animal_monkey.png', foodAsset: 'animal_breakfast_food_banana.png' },
    { id: 'rabbit', animal: '小兔', foodId: 'carrot', food: '胡萝卜', good: '小兔咔嚓咔嚓吃萝卜', animalAsset: 'animal_breakfast_animal_rabbit.png', foodAsset: 'animal_breakfast_food_carrot.png' },
    { id: 'cat', animal: '小猫', foodId: 'fish', food: '小鱼', good: '小猫美滋滋地吃小鱼', animalAsset: 'animal_breakfast_animal_cat.png', foodAsset: 'animal_breakfast_food_fish.png' },
    { id: 'dog', animal: '狗狗', foodId: 'biscuit', food: '骨头饼干', good: '狗狗把饼干吃得香香的', animalAsset: 'animal_breakfast_animal_dog.png', foodAsset: 'animal_breakfast_food_biscuit.png' },
    { id: 'panda', animal: '熊猫', foodId: 'bamboo', food: '鲜竹子', good: '熊猫抱着竹子开饭啦', animalAsset: 'animal_breakfast_animal_panda.png', foodAsset: 'animal_breakfast_food_bamboo.png' },
    { id: 'bear', animal: '小熊', foodId: 'honey', food: '甜蜂蜜', good: '小熊舔到了甜甜蜂蜜', animalAsset: 'animal_breakfast_animal_bear.png', foodAsset: 'animal_breakfast_food_honey.png' },
    { id: 'fox', animal: '小狐狸', foodId: 'drumstick', food: '鸡腿', good: '小狐狸开心地吃起鸡腿', animalAsset: 'animal_breakfast_animal_fox.png', foodAsset: 'animal_breakfast_food_drumstick.png' },
    { id: 'pig', animal: '小猪', foodId: 'apple', food: '红苹果', good: '小猪把苹果嚼得脆脆的', animalAsset: 'animal_breakfast_animal_pig.png', foodAsset: 'animal_breakfast_food_apple.png' },
    { id: 'cow', animal: '小奶牛', foodId: 'grass', food: '青草', good: '小奶牛吃到了嫩青草', animalAsset: 'animal_breakfast_animal_cow.png', foodAsset: 'animal_breakfast_food_grass.png' },
    { id: 'sheep', animal: '小绵羊', foodId: 'clover', food: '四叶草', good: '小绵羊吃到了幸运草', animalAsset: 'animal_breakfast_animal_sheep.png', foodAsset: 'animal_breakfast_food_clover.png' },
    { id: 'elephant', animal: '小象', foodId: 'watermelon', food: '西瓜', good: '小象吃到了多汁西瓜', animalAsset: 'animal_breakfast_animal_elephant.png', foodAsset: 'animal_breakfast_food_watermelon.png' },
    { id: 'giraffe', animal: '长颈鹿', foodId: 'leaves', food: '嫩树叶', good: '长颈鹿吃到了嫩树叶', animalAsset: 'animal_breakfast_animal_giraffe.png', foodAsset: 'animal_breakfast_food_leaves.png' },
    { id: 'squirrel', animal: '小松鼠', foodId: 'acorn', food: '橡果', good: '小松鼠抱着橡果开心地吃起来', animalAsset: 'animal_breakfast_animal_squirrel.png', foodAsset: 'animal_breakfast_food_acorn.png' },
    { id: 'penguin', animal: '小企鹅', foodId: 'shrimp', food: '小虾', good: '小企鹅一口吃掉鲜鲜的小虾', animalAsset: 'animal_breakfast_animal_penguin.png', foodAsset: 'animal_breakfast_food_shrimp.png' },
    { id: 'koala', animal: '小考拉', foodId: 'eucalyptus', food: '桉树叶', good: '小考拉嚼起香香的桉树叶', animalAsset: 'animal_breakfast_animal_koala.png', foodAsset: 'animal_breakfast_food_eucalyptus.png' },
    { id: 'hedgehog', animal: '小刺猬', foodId: 'strawberry', food: '草莓', good: '小刺猬吃到了甜甜的草莓', animalAsset: 'animal_breakfast_animal_hedgehog.png', foodAsset: 'animal_breakfast_food_strawberry.png' },
    { id: 'chick', animal: '小鸡', foodId: 'corn', food: '玉米粒', good: '小鸡啄起金黄的玉米粒', animalAsset: 'animal_breakfast_animal_chick.png', foodAsset: 'animal_breakfast_food_corn.png' },
    { id: 'deer', animal: '小鹿', foodId: 'mushroom', food: '蘑菇', good: '小鹿尝到了嫩嫩的小蘑菇', animalAsset: 'animal_breakfast_animal_deer.png', foodAsset: 'animal_breakfast_food_mushroom.png' }
];

const animalRow = document.getElementById('animal-row');
const foodRow = document.getElementById('food-row');
const foodDock = document.querySelector('.food-dock');
const hint = document.getElementById('hint');
const roundBadge = document.getElementById('round-badge');
const collectionBadge = document.getElementById('collection-badge');
const successPanel = document.getElementById('success-panel');
const successCopy = document.getElementById('success-copy');
const nextRoundButton = document.getElementById('next-round-btn');
const resetButton = document.getElementById('reset-btn');
const celebration = document.getElementById('celebration');

let drawBag = [];
let currentPairs = [];
let fedAnimalIds = new Set();
let discoveredAnimalIds = new Set();
let selectedFoodId = null;
let roundNumber = 0;
let activeDrag = null;

startNextRound();
window.setTimeout(preloadAssets, 1400);

nextRoundButton.addEventListener('click', startNextRound);
resetButton.addEventListener('click', resetCurrentRound);

function asset(filename) {
    return `${ASSET_ROOT}/${filename.replace(/\.(?:png|jpe?g)$/i, '_optimized.webp')}`;
}

function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function refillBag() {
    const previousIds = new Set(currentPairs.map((pair) => pair.id));
    const preferred = breakfastPairs.filter((pair) => !previousIds.has(pair.id));
    const previous = breakfastPairs.filter((pair) => previousIds.has(pair.id));
    drawBag = [...shuffle(preferred), ...shuffle(previous)];
}

function drawThree() {
    if (drawBag.length < 3) refillBag();
    return drawBag.splice(0, 3);
}

function preloadAssets() {
    breakfastPairs.flatMap((pair) => [pair.animalAsset, pair.foodAsset]).forEach((filename) => {
        const image = new Image();
        image.src = asset(filename);
    });
}

function startNextRound() {
    currentPairs = drawThree();
    roundNumber += 1;
    renderRound();
}

function resetCurrentRound() {
    renderRound();
    hint.textContent = '这一桌重新摆好啦';
}


function guideNext() {
    const next = currentPairs.find(item => !fedAnimalIds.has(item.id));
    if (next) window.GameVoice?.guide('request', next.id);
    else window.GameVoice?.clearGuide();
}

function renderRound() {
    window.GameVoice?.begin('intro');
    if (activeDrag) clearDrag(false);
    fedAnimalIds = new Set();
    selectedFoodId = null;
    successPanel.hidden = true;
    foodDock.hidden = false;
    celebration.replaceChildren();
    hint.textContent = '把早餐送给喜欢它的动物';
    roundBadge.textContent = `第 ${roundNumber} 桌`;
    updateCollectionBadge();
    renderAnimals();
    renderFoods();
    guideNext();
}

function renderAnimals() {
    animalRow.replaceChildren();
    currentPairs.forEach((pair) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'animal-card';
        button.dataset.animalId = pair.id;
        button.setAttribute('aria-label', `${pair.animal}，正在等早餐`);
        button.innerHTML = `
            <span class="animal-halo" aria-hidden="true"></span>
            <img src="${asset(pair.animalAsset)}" alt="${pair.animal}" draggable="false">
            <span class="animal-name">${pair.animal}</span>
            <span class="happy-mark" aria-hidden="true">❤</span>
        `;
        button.addEventListener('click', () => handleAnimalTap(pair.id));
        animalRow.appendChild(button);
    });
}

function renderFoods() {
    foodRow.replaceChildren();
    shuffle(currentPairs).forEach((pair) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'food-card';
        button.dataset.foodId = pair.foodId;
        button.dataset.targetId = pair.id;
        button.setAttribute('aria-label', `${pair.food}，可以拖动，也可以先点早餐再点动物`);
        button.innerHTML = `<img src="${asset(pair.foodAsset)}" alt="${pair.food}" draggable="false"><span>${pair.food}</span>`;
        button.addEventListener('pointerdown', startDrag);
        button.addEventListener('click', (event) => {
            if (button.dataset.ignoreClick === 'true') {
                button.dataset.ignoreClick = 'false';
                return;
            }
            selectFood(pair.foodId);
        });
        foodRow.appendChild(button);
    });
    const firstFood = foodRow.querySelector('.food-card');
    const targetAnimal = firstFood && animalRow.querySelector(`[data-animal-id="${firstFood.dataset.targetId}"]`);
    window.GameJuice?.guide(firstFood, targetAnimal, 1450);
}

function selectFood(foodId) {
    const button = foodRow.querySelector(`[data-food-id="${foodId}"]`);
    if (!button || button.classList.contains('used')) return;
    selectedFoodId = selectedFoodId === foodId ? null : foodId;
    foodRow.querySelectorAll('.food-card').forEach((card) => card.classList.toggle('selected', card.dataset.foodId === selectedFoodId));
    if (selectedFoodId) {
    window.GameVoice?.cue('food', selectedFoodId);
        window.GameJuice?.sound('pick');
        window.GameJuice?.vibrate(10);
        const pair = breakfastPairs.find((item) => item.foodId === selectedFoodId);
        window.GameVoice?.guide('request', pair.id, {announce:false});
        hint.textContent = `把${pair.food}送给喜欢它的动物`;
    } else {
        hint.textContent = '选一份早餐，再点一只动物';
    }
}

function handleAnimalTap(animalId) {
    if (fedAnimalIds.has(animalId)) return;
    if (!selectedFoodId) { window.GameVoice?.cue('animal', animalId);
    window.GameVoice?.guide('request', animalId, {announce:false}); return; }
    tryFeed(selectedFoodId, animalId);
}

function tryFeed(foodId, animalId) {
    const pair = currentPairs.find((item) => item.id === animalId);
    const foodButton = foodRow.querySelector(`[data-food-id="${foodId}"]`);
    const animalButton = animalRow.querySelector(`[data-animal-id="${animalId}"]`);
    if (!pair || !foodButton || foodButton.classList.contains('used') || fedAnimalIds.has(animalId)) return;

    if (pair.foodId !== foodId) {
    window.GameVoice?.cue('wrong', animalId);
    window.GameVoice?.guide('request', animalId, {announce:false});
        window.GameJuice?.sound('wrong');
        window.GameJuice?.vibrate([18, 32, 18]);
        window.GameJuice?.shake(foodButton);
        window.GameJuice?.shake(animalButton);
        foodButton.classList.remove('wrong');
        animalButton.classList.remove('wrong');
        void foodButton.offsetWidth;
        foodButton.classList.add('wrong');
        animalButton.classList.add('wrong');
        hint.textContent = `${pair.animal}想吃${pair.food}，再试试吧`;
        window.setTimeout(() => {
            foodButton.classList.remove('wrong');
            animalButton.classList.remove('wrong');
        }, 620);
        return;
    }

    fedAnimalIds.add(animalId);
    window.GameVoice?.cue('fed', animalId);
    guideNext();
    window.GameJuice?.sound('correct');
    window.GameJuice?.vibrate(22);
    window.GameJuice?.burst(animalButton, { symbols: ['❤', '★', '✦'] });
    discoveredAnimalIds.add(animalId);
    selectedFoodId = null;
    foodButton.classList.add('used');
    foodButton.classList.remove('selected');
    animalButton.classList.add('fed');
    animalButton.setAttribute('aria-label', `${pair.animal}已经吃饱了`);
    hint.textContent = pair.good;
    updateCollectionBadge();
    makeHearts(animalButton);

    if (fedAnimalIds.size === currentPairs.length) {
        window.setTimeout(completeRound, 620);
    }
}

function completeRound() {
    window.GameVoice?.cue('complete');
    const remaining = breakfastPairs.length - discoveredAnimalIds.size;
    successCopy.textContent = remaining === 0 ? '所有动物朋友全都认识啦！' : `再认识 ${remaining} 位朋友就集齐图鉴啦`;
    foodDock.hidden = true;
    successPanel.hidden = false;
    window.GameJuice?.sound('complete');
    window.GameJuice?.vibrate([24, 42, 30]);
    makeCelebration();
}

function updateCollectionBadge() {
    const count = discoveredAnimalIds.size;
    collectionBadge.textContent = count === breakfastPairs.length ? '动物图鉴集齐啦！' : `动物图鉴 ${count}/${breakfastPairs.length}`;
    collectionBadge.classList.toggle('complete', count === breakfastPairs.length);
}

function startDrag(event) {
    const source = event.currentTarget;
    if (source.classList.contains('used') || event.button > 0) return;
    event.preventDefault();
    window.GameVoice?.cue('food', source.dataset.foodId);
    window.GameJuice?.sound('pick');
    window.GameJuice?.vibrate(10);
    const ghost = source.querySelector('img').cloneNode(true);
    ghost.className = 'drag-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ghost);
    activeDrag = { source, ghost, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    moveGhost(event.clientX, event.clientY);
    source.setPointerCapture(event.pointerId);
    source.addEventListener('pointermove', moveDrag);
    source.addEventListener('pointerup', endDrag);
    source.addEventListener('pointercancel', cancelDrag);
}

function moveDrag(event) {
    if (!activeDrag) return;
    const distance = Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY);
    if (distance > 8) activeDrag.moved = true;
    moveGhost(event.clientX, event.clientY);
    const target = animalAtPoint(event.clientX, event.clientY);
    animalRow.querySelectorAll('.animal-card').forEach((card) => card.classList.toggle('ready', card === target));
}

function endDrag(event) {
    if (!activeDrag) return;
    const { source, moved } = activeDrag;
    const target = animalAtPoint(event.clientX, event.clientY);
    if (moved) source.dataset.ignoreClick = 'true';
    if (target && moved) tryFeed(source.dataset.foodId, target.dataset.animalId);
    clearDrag(true);
}

function cancelDrag() {
    clearDrag(false);
}

function clearDrag(restore) {
    if (!activeDrag) return;
    const { source, ghost, pointerId } = activeDrag;
    try { source.releasePointerCapture(pointerId); } catch (error) { /* already released */ }
    source.removeEventListener('pointermove', moveDrag);
    source.removeEventListener('pointerup', endDrag);
    source.removeEventListener('pointercancel', cancelDrag);
    ghost.remove();
    animalRow.querySelectorAll('.animal-card').forEach((card) => card.classList.remove('ready'));
    if (restore) source.style.opacity = '';
    activeDrag = null;
}

function moveGhost(x, y) {
    activeDrag.ghost.style.left = `${x}px`;
    activeDrag.ghost.style.top = `${y}px`;
}

function animalAtPoint(x, y) {
    return [...animalRow.querySelectorAll('.animal-card:not(.fed)')].find((card) => {
        const rect = card.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }) || null;
}

function makeHearts(animalButton) {
    for (let i = 0; i < 5; i += 1) {
        const heart = document.createElement('i');
        heart.className = 'flying-heart';
        heart.textContent = i % 2 ? '♥' : '❤';
        heart.style.setProperty('--x', `${(i - 2) * 25}px`);
        heart.style.setProperty('--delay', `${i * 55}ms`);
        animalButton.appendChild(heart);
        window.setTimeout(() => heart.remove(), 1200);
    }
}

function makeCelebration() {
    celebration.replaceChildren();
    const symbols = ['★', '❤', '●', '✦'];
    for (let i = 0; i < 28; i += 1) {
        const piece = document.createElement('i');
        piece.textContent = symbols[i % symbols.length];
        piece.style.left = `${4 + Math.random() * 92}%`;
        piece.style.setProperty('--delay', `${Math.random() * 500}ms`);
        piece.style.setProperty('--drift', `${-55 + Math.random() * 110}px`);
        celebration.appendChild(piece);
    }
}
