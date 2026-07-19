const ASSET_ROOT = '../shared/generated_assets/';
const SHAPES = ['circle', 'square', 'triangle'];
const shapeInfo = {
    circle: { label: '圆包裹', encouragement: '圆圆的，投进圆洞洞！' },
    square: { label: '方包裹', encouragement: '方方的，投进方洞洞！' },
    triangle: { label: '三角包裹', encouragement: '尖尖的，投进三角洞洞！' }
};

const parcels = {
    circle: [
        ['circle-star', 'parcel_sort_v2_item_circle_star.png'],
        ['circle-stripe', 'parcel_sort_v2_item_circle_stripe.png'],
        ['circle-dot', 'parcel_sort_v2_item_circle_dot.png'],
        ['circle-heart', 'parcel_sort_v2_item_circle_heart.png'],
        ['circle-globe', 'parcel_sort_v2_item_circle_globe.png'],
        ['circle-moon', 'parcel_sort_v2_item_circle_moon.png']
    ],
    square: [
        ['square-rocket', 'parcel_sort_v2_item_square_rocket.png'],
        ['square-paw', 'parcel_sort_v2_item_square_paw.png'],
        ['square-music', 'parcel_sort_v2_item_square_music.png'],
        ['square-bear', 'parcel_sort_v2_item_square_bear.png'],
        ['square-truck', 'parcel_sort_v2_item_square_truck.png'],
        ['square-flower', 'parcel_sort_v2_item_square_flower.png']
    ],
    triangle: [
        ['triangle-dino', 'parcel_sort_v2_item_triangle_dino.png'],
        ['triangle-bee', 'parcel_sort_v2_item_triangle_bee.png'],
        ['triangle-wave', 'parcel_sort_v2_item_triangle_wave.png'],
        ['triangle-fox', 'parcel_sort_v2_item_triangle_fox.png'],
        ['triangle-constellation', 'parcel_sort_v2_item_triangle_constellation.png'],
        ['triangle-shell', 'parcel_sort_v2_item_triangle_shell.png']
    ]
};

const queueElement = document.getElementById('parcel-queue');
const binsElement = document.getElementById('bins');
const bins = [...document.querySelectorAll('.bin')];
const hint = document.getElementById('hint');
const encouragement = document.getElementById('encouragement');
const comboBadge = document.getElementById('combo-badge');
const comboCount = document.getElementById('combo-count');
const deliveryCount = document.getElementById('delivery-count');
const resetButton = document.getElementById('reset-btn');

let shapeBag = [];
let variantBags = {};
let lastVariant = {};
let combo = 0;
let delivered = 0;
let selectedButton = null;
let pointerState = null;
let spawnSerial = 0;

function shuffled(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function drawShape() {
    if (shapeBag.length === 0) shapeBag = shuffled(SHAPES);
    return shapeBag.pop();
}

function drawVariant(shape) {
    if (!variantBags[shape] || variantBags[shape].length === 0) {
        variantBags[shape] = shuffled(parcels[shape]);
        if (variantBags[shape].length > 1 && variantBags[shape][variantBags[shape].length - 1][0] === lastVariant[shape]) {
            [variantBags[shape][0], variantBags[shape][variantBags[shape].length - 1]] = [variantBags[shape][variantBags[shape].length - 1], variantBags[shape][0]];
        }
    }
    const item = variantBags[shape].pop();
    lastVariant[shape] = item[0];
    return item;
}

function spawnParcel() {
    const shape = drawShape();
    const [id, asset] = drawVariant(shape);
    const button = document.createElement('button');
    button.className = 'parcel-item';
    button.type = 'button';
    button.dataset.shape = shape;
    button.dataset.parcelId = id;
    button.dataset.spawn = String(++spawnSerial);
    button.setAttribute('aria-label', shapeInfo[shape].label);
    button.innerHTML = `<img src="${ASSET_ROOT}${asset}" alt="" draggable="false"><span>${shapeInfo[shape].label}</span>`;
    button.addEventListener('pointerdown', beginPointer);
    button.addEventListener('click', () => selectParcel(button));
    queueElement.appendChild(button);
    return button;
}

function selectParcel(button) {
    if (button.dataset.suppressClick === '1' || button.dataset.locked === '1') return;
    selectedButton = selectedButton === button ? null : button;
    [...queueElement.children].forEach((item) => item.classList.toggle('selected', item === selectedButton));
    bins.forEach((bin) => bin.classList.toggle('selected-target', !!selectedButton && bin.dataset.shape === selectedButton.dataset.shape));
    if (selectedButton) {
        const shape = selectedButton.dataset.shape;
        hint.textContent = shapeInfo[shape].encouragement;
        setEncouragement('再点一下对应的洞洞');
        window.GameJuice?.sound('pick');
        window.GameJuice?.vibrate(10);
    } else {
        hint.textContent = '看形状，把包裹送进一样的洞洞';
    }
}

bins.forEach((bin) => {
    bin.addEventListener('click', () => {
        if (!selectedButton) return;
        deliverOrReject(selectedButton, bin);
    });
});

function beginPointer(event) {
    const source = event.currentTarget;
    if (source.dataset.locked === '1') return;
    pointerState = {
        source,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragging: false,
        ghost: null
    };
    source.setPointerCapture(event.pointerId);
    source.addEventListener('pointermove', movePointer);
    source.addEventListener('pointerup', endPointer);
    source.addEventListener('pointercancel', cancelPointer);
}

function movePointer(event) {
    if (!pointerState) return;
    const distance = Math.hypot(event.clientX - pointerState.startX, event.clientY - pointerState.startY);
    if (!pointerState.dragging && distance > 7) startDrag(event);
    if (!pointerState.dragging) return;
    event.preventDefault();
    moveGhost(event.clientX, event.clientY);
    const hit = binAtPoint(event.clientX, event.clientY);
    bins.forEach((bin) => bin.classList.toggle('ready', bin === hit));
}

function startDrag(event) {
    const { source } = pointerState;
    pointerState.dragging = true;
    pointerState.ghost = source.querySelector('img').cloneNode(true);
    pointerState.ghost.className = 'drag-ghost';
    const rect = source.getBoundingClientRect();
    pointerState.ghost.style.width = `${rect.width}px`;
    pointerState.ghost.style.height = `${rect.height}px`;
    document.body.appendChild(pointerState.ghost);
    source.classList.add('dragging');
    selectedButton = null;
    [...queueElement.children].forEach((item) => item.classList.remove('selected'));
    bins.forEach((bin) => bin.classList.remove('selected-target'));
    window.GameJuice?.sound('pick');
    window.GameJuice?.vibrate(10);
    moveGhost(event.clientX, event.clientY);
}

function endPointer(event) {
    if (!pointerState) return;
    const { source, dragging } = pointerState;
    if (dragging) {
        event.preventDefault();
        source.dataset.suppressClick = '1';
        window.setTimeout(() => { if (source.isConnected) source.dataset.suppressClick = '0'; }, 80);
        const hit = binAtPoint(event.clientX, event.clientY);
        source.classList.remove('dragging');
        deliverOrReject(source, hit);
    }
    clearPointer();
}

function cancelPointer() {
    if (!pointerState) return;
    pointerState.source.classList.remove('dragging');
    clearPointer();
}

function clearPointer() {
    const { source, pointerId, ghost } = pointerState;
    try { source.releasePointerCapture(pointerId); } catch (error) { /* already released */ }
    source.removeEventListener('pointermove', movePointer);
    source.removeEventListener('pointerup', endPointer);
    source.removeEventListener('pointercancel', cancelPointer);
    ghost?.remove();
    bins.forEach((bin) => bin.classList.remove('ready'));
    pointerState = null;
}

function moveGhost(x, y) {
    pointerState.ghost.style.left = `${x}px`;
    pointerState.ghost.style.top = `${y}px`;
}

function binAtPoint(x, y) {
    return bins.find((bin) => {
        const rect = bin.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }) || null;
}

function deliverOrReject(button, bin) {
    if (!button || button.dataset.locked === '1') return;
    const shape = button.dataset.shape;
    if (bin && bin.dataset.shape === shape) deliverParcel(button, bin);
    else rejectParcel(button, bin);
}

function deliverParcel(button, bin) {
    button.dataset.locked = '1';
    selectedButton = null;
    [...queueElement.children].forEach((item) => item.classList.remove('selected'));
    bins.forEach((item) => item.classList.remove('selected-target', 'wrong', 'correct'));
    bin.classList.add('correct');
    animateDelivery(button, bin);
    combo += 1;
    delivered += 1;
    updateScore(true);
    hint.textContent = `投对啦！已经收到 ${delivered} 件快递`;
    setEncouragement(encouragementFor(combo));
    window.GameJuice?.sound(combo >= 3 ? 'sparkle' : 'correct');
    window.GameJuice?.vibrate(combo >= 5 ? [18, 28, 22] : 18);
    window.GameJuice?.burst(bin, { count: Math.min(10 + combo, 24), symbols: ['✦', '★', '●', '♥'] });

    window.setTimeout(() => {
        button.remove();
        spawnParcel();
        bin.classList.remove('correct');
        if (delivered % 2 === 0) {
            queueElement.classList.remove('refill');
            void queueElement.offsetWidth;
            queueElement.classList.add('refill');
        }
    }, 500);
}

function rejectParcel(button, bin) {
    const previousCombo = combo;
    combo = 0;
    updateScore(false);
    button.classList.remove('wrong');
    void button.offsetWidth;
    button.classList.add('wrong');
    if (bin) {
        bin.classList.remove('wrong');
        void bin.offsetWidth;
        bin.classList.add('wrong');
    }
    bins.forEach((item) => item.classList.remove('selected-target'));
    selectedButton = null;
    hint.textContent = '这个洞洞不一样，再看看包裹的外轮廓';
    setEncouragement(previousCombo > 1 ? '没关系，重新开始连击！' : '没关系，再试一次！');
    window.GameJuice?.sound('wrong');
    window.GameJuice?.vibrate([18, 32, 18]);
}

function animateDelivery(button, bin) {
    const sourceRect = button.getBoundingClientRect();
    const targetRect = bin.getBoundingClientRect();
    const ghost = button.querySelector('img').cloneNode(true);
    ghost.className = 'delivery-ghost';
    ghost.style.left = `${sourceRect.left}px`;
    ghost.style.top = `${sourceRect.top}px`;
    ghost.style.width = `${sourceRect.width}px`;
    ghost.style.height = `${sourceRect.height}px`;
    ghost.style.setProperty('--dx', `${targetRect.left + targetRect.width / 2 - sourceRect.left - sourceRect.width / 2}px`);
    ghost.style.setProperty('--dy', `${targetRect.top + targetRect.height * .62 - sourceRect.top - sourceRect.height / 2}px`);
    document.body.appendChild(ghost);
    button.style.visibility = 'hidden';
    window.setTimeout(() => ghost.remove(), 560);
}

function encouragementFor(value) {
    if (value >= 15) return `不可思议！连续 ${value} 个！`;
    if (value >= 10) return `完美连击 ×${value}！`;
    if (value >= 8) return '超级快递员！';
    if (value >= 5) return '形状小达人！';
    if (value >= 3) return '太厉害啦！';
    if (value === 2) return '真棒，连对两个！';
    return '投对啦，继续加油！';
}

function setEncouragement(text) {
    encouragement.textContent = text;
    encouragement.classList.remove('pop');
    void encouragement.offsetWidth;
    encouragement.classList.add('pop');
}

function updateScore(isCorrect) {
    comboCount.textContent = `×${combo}`;
    deliveryCount.textContent = `${delivered} 件`;
    comboBadge.classList.toggle('hot', combo >= 2);
    if (isCorrect && combo >= 2) {
        comboBadge.classList.remove('hot');
        void comboBadge.offsetWidth;
        comboBadge.classList.add('hot');
    }
}

function resetGame() {
    if (pointerState) cancelPointer();
    shapeBag = [];
    variantBags = {};
    lastVariant = {};
    combo = 0;
    delivered = 0;
    selectedButton = null;
    spawnSerial = 0;
    queueElement.replaceChildren();
    bins.forEach((bin) => bin.classList.remove('ready', 'selected-target', 'correct', 'wrong'));
    for (let i = 0; i < 4; i += 1) spawnParcel();
    updateScore(false);
    hint.textContent = '看形状，把包裹送进一样的洞洞';
    setEncouragement('准备好了吗？');
    window.setTimeout(() => window.GameJuice?.guide(queueElement.firstElementChild, bins.find((bin) => bin.dataset.shape === queueElement.firstElementChild.dataset.shape), 1200), 420);
}

function preloadAssets() {
    const assets = Object.values(parcels).flat().map(([, asset]) => asset);
    window.setTimeout(() => assets.forEach((asset) => { const image = new Image(); image.src = `${ASSET_ROOT}${asset}`; }), 700);
}

resetButton.addEventListener('click', resetGame);
resetGame();
preloadAssets();
