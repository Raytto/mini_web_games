const ASSET_ROOT = '../shared/generated_assets/monster_dressup_v2_';
const CATEGORIES = ['hat', 'eyes', 'nose', 'mouth', 'chest'];

const categoryInfo = {
    hat: { label: '帽子', hint: '把帽子放到怪兽头顶' },
    eyes: { label: '眼睛', hint: '把眼睛放到怪兽脸上' },
    nose: { label: '鼻子', hint: '把鼻子放到眼睛下面' },
    mouth: { label: '嘴巴', hint: '把嘴巴放到鼻子下面' },
    chest: { label: '饰品', hint: '把饰品放到怪兽胸前' }
};

const bodies = [
    { id: 'teal', name: '毛毛怪', asset: 'body_teal.png', anchors: { hat: [50, 14, 57, 31], eyes: [50, 41, 34, 25], nose: [50, 52, 16, 15], mouth: [50, 62, 28, 19], chest: [50, 77, 28, 24] } },
    { id: 'purple', name: '软耳怪', asset: 'body_purple.png', anchors: { hat: [50, 13, 56, 31], eyes: [50, 39, 34, 25], nose: [50, 50, 16, 15], mouth: [50, 60, 28, 19], chest: [50, 75, 29, 25] } },
    { id: 'orange', name: '独角怪', asset: 'body_orange.png', anchors: { hat: [50, 14, 55, 30], eyes: [50, 40, 32, 24], nose: [50, 51, 15, 15], mouth: [50, 61, 27, 19], chest: [50, 76, 27, 25] } },
    { id: 'blue', name: '泡泡怪', asset: 'body_blue.png', anchors: { hat: [50, 14, 58, 30], eyes: [50, 40, 34, 25], nose: [50, 51, 16, 15], mouth: [50, 61, 28, 19], chest: [50, 76, 29, 25] } },
    { id: 'pink', name: '糖果怪', asset: 'body_pink.png', anchors: { hat: [50, 14, 57, 30], eyes: [50, 39, 34, 25], nose: [50, 50, 16, 15], mouth: [50, 60, 28, 19], chest: [50, 75, 28, 25] } }
];

const pools = {
    hat: [
        ['top', 'hat_top.png'], ['crown', 'hat_crown.png'], ['wizard', 'hat_wizard.png'],
        ['cap', 'hat_cap.png'], ['party', 'hat_party.png'], ['flowers', 'hat_flowers.png']
    ],
    eyes: [
        ['green', 'eyes_green.png'], ['cyclops', 'eyes_cyclops.png'], ['triple', 'eyes_triple.png'],
        ['sleepy', 'eyes_sleepy.png'], ['star', 'eyes_star.png'], ['silly', 'eyes_silly.png']
    ],
    nose: [
        ['pig', 'nose_pig.png'], ['clown', 'nose_clown.png'], ['triangle', 'nose_triangle.png'],
        ['cat', 'nose_cat.png'], ['heart', 'nose_heart.png'], ['button', 'nose_button.png']
    ],
    mouth: [
        ['smile', 'mouth_smile.png'], ['surprise', 'mouth_surprise.png'], ['fangs', 'mouth_fangs.png'],
        ['tongue', 'mouth_tongue.png'], ['gentle', 'mouth_gentle.png'], ['zipper', 'mouth_zipper.png']
    ],
    chest: [
        ['bow-red', 'chest_bow_red.png'], ['tie-blue', 'chest_tie_blue.png'], ['star', 'chest_star.png'],
        ['scarf', 'chest_scarf.png'], ['gem', 'chest_gem.png'], ['bow-orange', 'chest_bow_orange.png']
    ]
};

const monsterStage = document.getElementById('monster-stage');
const monsterBase = document.getElementById('monster-base');
const slotsLayer = document.getElementById('slots-layer');
const placedLayer = document.getElementById('placed-layer');
const partsTray = document.getElementById('parts-tray');
const hint = document.getElementById('hint');
const celebration = document.getElementById('celebration');
const nextPanel = document.getElementById('next-panel');
const nextButton = document.getElementById('next-btn');
const resetButton = document.getElementById('reset-btn');
const collectionCount = document.getElementById('collection-count');
const monsterName = document.getElementById('monster-name');

const completed = new Set();
const collectedBodies = new Set();
const bags = {};
let currentBody = null;
let currentParts = {};
let selectedPart = null;
let activeDrag = null;

function shuffled(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function drawFromBag(key, source) {
    if (!bags[key] || bags[key].length === 0) bags[key] = shuffled(source);
    return bags[key].pop();
}

function cssAnchor(anchor) {
    const [x, y, w, h] = anchor;
    return `--x:${x}%;--y:${y}%;--w:${w}%;--h:${h}%`;
}

function buildRound() {
    currentBody = drawFromBag('bodies', bodies);
    currentParts = Object.fromEntries(CATEGORIES.map((category) => [category, drawFromBag(category, pools[category])]));
    completed.clear();
    selectedPart = null;
    monsterBase.src = `${ASSET_ROOT}${currentBody.asset}`;
    monsterBase.dataset.bodyId = currentBody.id;
    monsterBase.alt = `没有眼睛、鼻子和嘴巴的${currentBody.name}`;
    monsterName.textContent = currentBody.name;
    celebration.classList.remove('show');
    nextPanel.hidden = true;
    partsTray.hidden = false;
    slotsLayer.replaceChildren();
    placedLayer.replaceChildren();
    partsTray.replaceChildren();
    monsterStage.classList.remove('complete', 'reveal');
    void monsterStage.offsetWidth;
    monsterStage.classList.add('reveal');

    CATEGORIES.forEach((category) => {
        const [variant, asset] = currentParts[category];
        const anchor = currentBody.anchors[category];
        const slot = document.createElement('div');
        slot.className = 'part-slot';
        slot.dataset.part = category;
        slot.style.cssText = cssAnchor(anchor);
        slotsLayer.appendChild(slot);

        const placed = document.createElement('img');
        placed.className = 'placed-part';
        placed.dataset.part = category;
        placed.dataset.variant = variant;
        placed.src = `${ASSET_ROOT}${asset}`;
        placed.alt = '';
        placed.draggable = false;
        placed.style.cssText = cssAnchor(anchor);
        placedLayer.appendChild(placed);

        const button = document.createElement('button');
        button.className = 'drag-item';
        button.type = 'button';
        button.dataset.part = category;
        button.dataset.variant = variant;
        button.setAttribute('aria-label', categoryInfo[category].label);
        button.innerHTML = `<img src="${ASSET_ROOT}${asset}" alt="" draggable="false"><span>${categoryInfo[category].label}</span>`;
        button.addEventListener('pointerdown', startDrag);
        button.addEventListener('click', () => selectPart(button));
        partsTray.appendChild(button);
    });

    hint.textContent = '选一个部件，帮怪兽装扮起来';
    window.setTimeout(() => window.GameJuice?.guide(partsTray.firstElementChild, slotsLayer.firstElementChild, 1150), 450);
    preloadNextAssets();
}

function selectPart(button) {
    const part = button.dataset.part;
    if (button.classList.contains('used') || activeDrag) return;
    selectedPart = selectedPart === part ? null : part;
    [...partsTray.children].forEach((item) => item.classList.toggle('selected', item === button && selectedPart === part));
    [...slotsLayer.children].forEach((slot) => slot.classList.toggle('selected-target', slot.dataset.part === selectedPart));
    if (selectedPart) {
        hint.textContent = `${categoryInfo[part].hint}，再点一下怪兽也可以`;
        window.GameJuice?.sound('pick');
        window.GameJuice?.vibrate(10);
    }
}

monsterStage.addEventListener('click', (event) => {
    if (!selectedPart || completed.has(selectedPart) || activeDrag) return;
    const selectedSlot = slotsLayer.querySelector(`[data-part="${selectedPart}"]`);
    if (pointInsideSlot(selectedSlot, event.clientX, event.clientY, 0)) {
        placePart(selectedPart);
        return;
    }
    const clickedSlot = anySlotAtPoint(event.clientX, event.clientY);
    if (clickedSlot && clickedSlot.dataset.part !== selectedPart) {
        rejectPart(document.querySelector(`.drag-item[data-part="${selectedPart}"]`), clickedSlot);
        return;
    }
    placePart(selectedPart);
});

function startDrag(event) {
    const source = event.currentTarget;
    if (source.classList.contains('used')) return;
    event.preventDefault();
    selectedPart = null;
    [...slotsLayer.children].forEach((slot) => slot.classList.remove('selected-target'));
    const ghost = source.querySelector('img').cloneNode(true);
    ghost.className = 'drag-ghost';
    document.body.appendChild(ghost);
    source.style.opacity = '0';
    activeDrag = { source, ghost, part: source.dataset.part, pointerId: event.pointerId };
    hint.textContent = categoryInfo[activeDrag.part].hint;
    moveGhost(event.clientX, event.clientY);
    source.setPointerCapture(event.pointerId);
    source.addEventListener('pointermove', moveDrag);
    source.addEventListener('pointerup', endDrag);
    source.addEventListener('pointercancel', cancelDrag);
    window.GameJuice?.sound('pick');
    window.GameJuice?.vibrate(10);
}

function moveDrag(event) {
    if (!activeDrag) return;
    event.preventDefault();
    moveGhost(event.clientX, event.clientY);
    const hit = preferredSlotAtPoint(event.clientX, event.clientY, activeDrag.part);
    [...slotsLayer.children].forEach((slot) => slot.classList.toggle('ready', slot === hit));
}

function endDrag(event) {
    if (!activeDrag) return;
    event.preventDefault();
    const hit = preferredSlotAtPoint(event.clientX, event.clientY, activeDrag.part);
    if (hit && hit.dataset.part === activeDrag.part) placePart(activeDrag.part);
    else rejectPart(activeDrag.source, hit);
    clearDrag();
}

function cancelDrag() {
    if (!activeDrag) return;
    activeDrag.source.style.opacity = '';
    clearDrag();
}

function anySlotAtPoint(x, y) {
    return [...slotsLayer.children].find((slot) => pointInsideSlot(slot, x, y)) || null;
}

function preferredSlotAtPoint(x, y, part) {
    const preferred = slotsLayer.querySelector(`[data-part="${part}"]`);
    return pointInsideSlot(preferred, x, y) ? preferred : anySlotAtPoint(x, y);
}

function pointInsideSlot(slot, x, y, padding = null) {
    if (!slot) return false;
    const rect = slot.getBoundingClientRect();
    const extra = padding ?? Math.max(10, rect.width * 0.08);
    return x >= rect.left - extra && x <= rect.right + extra && y >= rect.top - extra && y <= rect.bottom + extra;
}

function moveGhost(x, y) {
    activeDrag.ghost.style.left = `${x}px`;
    activeDrag.ghost.style.top = `${y}px`;
}

function rejectPart(source, slot) {
    if (source) {
        source.style.opacity = '';
        source.classList.remove('wrong');
        void source.offsetWidth;
        source.classList.add('wrong');
    }
    if (slot) {
        slot.classList.remove('wrong-target');
        void slot.offsetWidth;
        slot.classList.add('wrong-target');
    }
    hint.textContent = '这个位置不对，再找找看';
    window.GameJuice?.sound('wrong');
    window.GameJuice?.vibrate([18, 34, 18]);
}

function placePart(part) {
    if (completed.has(part)) return;
    completed.add(part);
    selectedPart = null;
    const button = partsTray.querySelector(`[data-part="${part}"]`);
    const placed = placedLayer.querySelector(`[data-part="${part}"]`);
    button.style.opacity = '';
    button.classList.add('used');
    placed.classList.add('show');
    [...slotsLayer.children].forEach((slot) => slot.classList.remove('ready', 'selected-target'));
    window.GameJuice?.sound(part === 'hat' || part === 'chest' ? 'sparkle' : 'correct');
    window.GameJuice?.vibrate(20);
    window.GameJuice?.burst(monsterStage, { count: 12, symbols: ['✦', '★', '♥'] });

    if (completed.size === CATEGORIES.length) finishRound();
    else hint.textContent = `装好了 ${completed.size}/5，再选一个吧`;
}

function finishRound() {
    collectedBodies.add(currentBody.id);
    collectionCount.textContent = `${collectedBodies.size}/${bodies.length}`;
    hint.textContent = `${currentBody.name}装扮完成啦！`;
    celebration.classList.add('show');
    monsterStage.classList.remove('complete');
    void monsterStage.offsetWidth;
    monsterStage.classList.add('complete');
    partsTray.hidden = true;
    nextPanel.hidden = false;
    window.setTimeout(() => window.GameJuice?.sound('complete'), 170);
    window.GameJuice?.vibrate([24, 42, 30]);
    window.GameJuice?.burst(monsterStage, { count: 28, symbols: ['✦', '★', '●', '♥'] });
}

function clearDrag() {
    const { source, ghost, pointerId } = activeDrag;
    try { source.releasePointerCapture(pointerId); } catch (error) { /* already released */ }
    source.removeEventListener('pointermove', moveDrag);
    source.removeEventListener('pointerup', endDrag);
    source.removeEventListener('pointercancel', cancelDrag);
    ghost.remove();
    [...slotsLayer.children].forEach((slot) => slot.classList.remove('ready'));
    activeDrag = null;
}

function resetRound() {
    if (activeDrag) cancelDrag();
    completed.clear();
    selectedPart = null;
    celebration.classList.remove('show');
    nextPanel.hidden = true;
    partsTray.hidden = false;
    monsterStage.classList.remove('complete');
    [...partsTray.children].forEach((button) => {
        button.classList.remove('used', 'wrong', 'selected');
        button.style.opacity = '';
    });
    [...placedLayer.children].forEach((part) => part.classList.remove('show'));
    [...slotsLayer.children].forEach((slot) => slot.classList.remove('ready', 'selected-target', 'wrong-target'));
    hint.textContent = '选一个部件，帮怪兽装扮起来';
    window.GameJuice?.guide(partsTray.firstElementChild, slotsLayer.firstElementChild, 850);
}

function preloadNextAssets() {
    const assets = [
        ...bodies.map((body) => body.asset),
        ...Object.values(pools).flat().map(([, asset]) => asset)
    ];
    window.setTimeout(() => assets.forEach((asset) => { const image = new Image(); image.src = `${ASSET_ROOT}${asset}`; }), 600);
}

resetButton.addEventListener('click', resetRound);
nextButton.addEventListener('click', buildRound);
buildRound();
