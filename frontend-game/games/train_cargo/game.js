const ASSET_ROOT = '../shared/generated_assets';

const cargoLibrary = [
    { id: 'red', colorName: '红色', color: '#ef4444', dark: '#b91c1c', light: '#ff8a7a', toy: '红皮球', asset: 'train_cargo_toy_red-ball.png', good: '红皮球装进红色车厢' },
    { id: 'yellow', colorName: '黄色', color: '#facc15', dark: '#c78308', light: '#fff27a', toy: '黄星星', asset: 'train_cargo_toy_yellow-star.png', good: '黄星星装进黄色车厢' },
    { id: 'blue', colorName: '蓝色', color: '#3b82f6', dark: '#1d4ed8', light: '#8ec5ff', toy: '蓝积木', asset: 'train_cargo_toy_blue-block.png', good: '蓝积木装进蓝色车厢' },
    { id: 'green', colorName: '绿色', color: '#22c55e', dark: '#15803d', light: '#86efac', toy: '绿恐龙', asset: 'train_cargo_toy_green-dinosaur.png', good: '绿恐龙装进绿色车厢' },
    { id: 'purple', colorName: '紫色', color: '#a855f7', dark: '#7e22ce', light: '#d8b4fe', toy: '紫礼盒', asset: 'train_cargo_toy_purple-gift.png', good: '紫礼盒装进紫色车厢' },
    { id: 'orange', colorName: '橙色', color: '#f97316', dark: '#c2410c', light: '#fdba74', toy: '橙篮球', asset: 'train_cargo_toy_orange-basketball.png', good: '橙篮球装进橙色车厢' },
    { id: 'pink', colorName: '粉色', color: '#ec4899', dark: '#be185d', light: '#f9a8d4', toy: '粉小鼓', asset: 'train_cargo_toy_pink-drum.png', good: '粉小鼓装进粉色车厢' },
    { id: 'cyan', colorName: '青色', color: '#06b6d4', dark: '#0e7490', light: '#67e8f9', toy: '青机器人', asset: 'train_cargo_toy_cyan-robot.png', good: '青机器人装进青色车厢' },
    { id: 'brown', colorName: '棕色', color: '#92400e', dark: '#6b2d0a', light: '#d69b65', toy: '棕熊熊', asset: 'train_cargo_toy_brown-bear.png', good: '棕熊熊装进棕色车厢' },
    { id: 'lime', colorName: '青柠色', color: '#84cc16', dark: '#4d7c0f', light: '#bef264', toy: '青柠风筝', asset: 'train_cargo_toy_lime-kite.png', good: '青柠风筝装进青柠色车厢' },
    { id: 'teal', colorName: '蓝绿色', color: '#14b8a6', dark: '#0f766e', light: '#5eead4', toy: '蓝绿小船', asset: 'train_cargo_toy_teal-boat.png', good: '蓝绿小船装进蓝绿色车厢' },
    { id: 'indigo', colorName: '靛蓝色', color: '#4f46e5', dark: '#3730a3', light: '#a5b4fc', toy: '靛蓝火箭', asset: 'train_cargo_toy_indigo-rocket.png', good: '靛蓝火箭装进靛蓝色车厢' }
];

const trainStage = document.getElementById('train-stage');
const train = document.getElementById('train');
const toyDock = document.getElementById('toy-dock');
const toyRow = document.getElementById('toy-row');
const hint = document.getElementById('hint');
const roundBadge = document.getElementById('round-badge');
const collectionBadge = document.getElementById('collection-badge');
const resetButton = document.getElementById('reset-btn');
const travelMessage = document.getElementById('travel-message');

let drawBag = [];
let currentCargo = [];
let loadedIds = new Set();
let discoveredIds = new Set();
let selectedToyId = null;
let roundNumber = 0;
let activeDrag = null;
let isTravelling = false;

startNextTrain(true);
window.setTimeout(preloadAssets, 1500);
resetButton.addEventListener('click', resetCurrentTrain);

function asset(filename) {
    return `${ASSET_ROOT}/${filename}`;
}

function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
}

function refillBag() {
    const previousIds = new Set(currentCargo.map((item) => item.id));
    drawBag = [
        ...shuffle(cargoLibrary.filter((item) => !previousIds.has(item.id))),
        ...shuffle(cargoLibrary.filter((item) => previousIds.has(item.id)))
    ];
}

function drawThree() {
    if (drawBag.length < 3) refillBag();
    return drawBag.splice(0, 3);
}

function preloadAssets() {
    cargoLibrary.forEach((item) => {
        const image = new Image();
        image.src = asset(item.asset);
    });
}

function startNextTrain(initial = false) {
    currentCargo = drawThree();
    roundNumber += 1;
    renderTrain();
    if (initial) {
        isTravelling = true;
        resetButton.disabled = true;
        toyDock.classList.add('hidden');
        hint.textContent = '小火车正在进站，准备接货！';
        window.setTimeout(() => {
            trainStage.classList.remove('entering');
            isTravelling = false;
            resetButton.disabled = false;
            toyDock.classList.remove('hidden');
            hint.textContent = '按颜色把玩具装进车厢';
            showLoadGuide(420);
        }, 1900);
    } else {
        trainStage.className = 'train-stage entering';
        hint.textContent = '下一列小火车进站啦！';
        window.setTimeout(() => {
            trainStage.classList.remove('entering');
            isTravelling = false;
            resetButton.disabled = false;
            toyDock.classList.remove('hidden');
            hint.textContent = '按颜色把玩具装进车厢';
            showLoadGuide(420);
        }, 1900);
    }
}

function resetCurrentTrain() {
    if (isTravelling) return;
    renderTrain();
    hint.textContent = '这一列重新摆好啦';
    showLoadGuide(700);
}

function renderTrain() {
    if (activeDrag) clearDrag();
    loadedIds = new Set();
    selectedToyId = null;
    travelMessage.hidden = true;
    toyDock.classList.remove('hidden');
    roundBadge.textContent = `第 ${roundNumber} 列`;
    updateCollectionBadge();
    train.replaceChildren();

    const locomotive = document.createElement('div');
    locomotive.className = 'locomotive';
    locomotive.innerHTML = `<img src="${asset('train_cargo_locomotive.png')}" alt="蓝色蒸汽火车头" draggable="false">`;
    train.appendChild(locomotive);

    currentCargo.forEach((cargo, index) => {
        train.appendChild(makeCoupler());
        const wagon = document.createElement('button');
        wagon.type = 'button';
        wagon.className = 'wagon';
        wagon.dataset.cargoId = cargo.id;
        wagon.style.setProperty('--wagon-color', cargo.color);
        wagon.style.setProperty('--wagon-dark', cargo.dark);
        wagon.style.setProperty('--wagon-light', cargo.light);
        wagon.setAttribute('aria-label', `${cargo.colorName}车厢，等待装货`);
        wagon.innerHTML = `
            <span class="cargo-bay"><img alt="" draggable="false"></span>
            <span class="wagon-body"><i class="shine"></i></span>
            <span class="wagon-wheel wheel-left"></span>
            <span class="wagon-wheel wheel-right"></span>
            <span class="wagon-label"><i style="background:${cargo.color}"></i>${cargo.colorName}</span>
        `;
        wagon.addEventListener('click', () => handleWagonTap(cargo.id));
        train.appendChild(wagon);
    });
    renderToys();
}

function makeCoupler() {
    const coupler = document.createElement('span');
    coupler.className = 'coupler';
    coupler.setAttribute('aria-hidden', 'true');
    coupler.innerHTML = '<i></i>';
    return coupler;
}

function renderToys() {
    toyRow.replaceChildren();
    shuffle(currentCargo).forEach((cargo) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'toy-card';
        button.dataset.toyId = cargo.id;
        button.setAttribute('aria-label', `${cargo.toy}，${cargo.colorName}玩具，可以拖动，也可以先点玩具再点车厢`);
        button.innerHTML = `<img src="${asset(cargo.asset)}" alt="${cargo.toy}" draggable="false"><span><i style="background:${cargo.color}"></i>${cargo.toy}</span>`;
        button.addEventListener('pointerdown', startDrag);
        button.addEventListener('click', () => {
            if (button.dataset.ignoreClick === 'true') {
                button.dataset.ignoreClick = 'false';
                return;
            }
            selectToy(cargo.id);
        });
        toyRow.appendChild(button);
    });
}

function showLoadGuide(delay = 600) {
    const firstToy = toyRow.querySelector('.toy-card');
    const targetWagon = firstToy && train.querySelector(`[data-cargo-id="${firstToy.dataset.toyId}"]`);
    window.GameJuice?.guide(firstToy, targetWagon, delay);
}

function selectToy(id) {
    if (isTravelling || loadedIds.has(id)) return;
    selectedToyId = selectedToyId === id ? null : id;
    toyRow.querySelectorAll('.toy-card').forEach((card) => card.classList.toggle('selected', card.dataset.toyId === selectedToyId));
    const cargo = currentCargo.find((item) => item.id === selectedToyId);
    if (cargo) {
        window.GameJuice?.sound('pick');
        window.GameJuice?.vibrate(10);
    }
    hint.textContent = cargo ? `把${cargo.toy}装进${cargo.colorName}车厢` : '选一个玩具，再点相同颜色的车厢';
}

function handleWagonTap(id) {
    if (!selectedToyId || loadedIds.has(id) || isTravelling) return;
    tryLoad(selectedToyId, id);
}

function tryLoad(toyId, wagonId) {
    const toy = currentCargo.find((item) => item.id === toyId);
    const wagon = train.querySelector(`.wagon[data-cargo-id="${wagonId}"]`);
    const toyButton = toyRow.querySelector(`.toy-card[data-toy-id="${toyId}"]`);
    if (!toy || !wagon || !toyButton || loadedIds.has(toyId) || loadedIds.has(wagonId)) return;

    if (toyId !== wagonId) {
        const target = currentCargo.find((item) => item.id === wagonId);
        wagon.classList.remove('wrong');
        toyButton.classList.remove('wrong');
        void wagon.offsetWidth;
        wagon.classList.add('wrong');
        toyButton.classList.add('wrong');
        hint.textContent = `颜色不一样，${toy.toy}要去${toy.colorName}车厢`;
        window.GameJuice?.sound('wrong');
        window.GameJuice?.vibrate([18, 32, 18]);
        window.GameJuice?.shake(wagon);
        window.setTimeout(() => {
            wagon.classList.remove('wrong');
            toyButton.classList.remove('wrong');
        }, 620);
        return;
    }

    loadedIds.add(toyId);
    window.GameJuice?.sound('drop');
    window.GameJuice?.vibrate(22);
    window.GameJuice?.burst(wagon, { symbols: ['★', '●', '✦'], colors: [toy.color, toy.light, '#ffffff'] });
    discoveredIds.add(toyId);
    selectedToyId = null;
    toyButton.classList.remove('selected');
    toyButton.classList.add('used');
    const cargoImage = wagon.querySelector('.cargo-bay img');
    cargoImage.src = asset(toy.asset);
    cargoImage.alt = toy.toy;
    wagon.classList.add('loaded');
    wagon.setAttribute('aria-label', `${toy.colorName}车厢已经装好${toy.toy}`);
    hint.textContent = toy.good;
    updateCollectionBadge();

    if (loadedIds.size === currentCargo.length) {
        window.setTimeout(departTrain, 720);
    }
}

function updateCollectionBadge() {
    const count = discoveredIds.size;
    collectionBadge.textContent = count === cargoLibrary.length ? '玩具图鉴集齐啦！' : `玩具图鉴 ${count}/${cargoLibrary.length}`;
    collectionBadge.classList.toggle('complete', count === cargoLibrary.length);
}

function departTrain() {
    if (isTravelling) return;
    isTravelling = true;
    resetButton.disabled = true;
    toyDock.classList.add('hidden');
    hint.textContent = '小火车由慢到快，出发啦！';
    travelMessage.hidden = false;
    trainStage.className = 'train-stage departing';
    window.GameJuice?.sound('engine');
    window.setTimeout(() => window.GameJuice?.sound('whoosh'), 620);
    window.GameJuice?.vibrate([20, 35, 20]);
    window.setTimeout(() => {
        travelMessage.hidden = true;
        startNextTrain(false);
    }, 2800);
}

function startDrag(event) {
    const source = event.currentTarget;
    if (source.classList.contains('used') || isTravelling || event.button > 0) return;
    event.preventDefault();
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
    source.addEventListener('pointercancel', clearDrag);
}

function moveDrag(event) {
    if (!activeDrag) return;
    if (Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY) > 8) activeDrag.moved = true;
    moveGhost(event.clientX, event.clientY);
    const target = wagonAtPoint(event.clientX, event.clientY);
    train.querySelectorAll('.wagon').forEach((wagon) => wagon.classList.toggle('ready', wagon === target));
}

function endDrag(event) {
    if (!activeDrag) return;
    const { source, moved } = activeDrag;
    const target = wagonAtPoint(event.clientX, event.clientY);
    if (moved) source.dataset.ignoreClick = 'true';
    if (target && moved) tryLoad(source.dataset.toyId, target.dataset.cargoId);
    clearDrag();
}

function clearDrag() {
    if (!activeDrag) return;
    const { source, ghost, pointerId } = activeDrag;
    try { source.releasePointerCapture(pointerId); } catch (error) { /* already released */ }
    source.removeEventListener('pointermove', moveDrag);
    source.removeEventListener('pointerup', endDrag);
    source.removeEventListener('pointercancel', clearDrag);
    ghost.remove();
    train.querySelectorAll('.wagon').forEach((wagon) => wagon.classList.remove('ready'));
    activeDrag = null;
}

function moveGhost(x, y) {
    activeDrag.ghost.style.left = `${x}px`;
    activeDrag.ghost.style.top = `${y}px`;
}

function wagonAtPoint(x, y) {
    return [...train.querySelectorAll('.wagon:not(.loaded)')].find((wagon) => {
        const rect = wagon.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }) || null;
}
