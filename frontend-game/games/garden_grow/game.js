const plantStage = document.getElementById('plant-stage');
const plantZone = document.getElementById('plant-zone');
const growthEffect = document.getElementById('growth-effect');
const sunshine = document.getElementById('sunshine');
const flowerName = document.getElementById('flower-name');
const hint = document.getElementById('hint');
const celebration = document.getElementById('celebration');
const collectionBadge = document.getElementById('collection-badge');
const stepProgress = document.getElementById('step-progress');
const toolTray = document.getElementById('tool-tray');
const nextFlowerButton = document.getElementById('next-flower-btn');
const resetButton = document.getElementById('reset-btn');

const ASSET_ROOT = '../shared/generated_assets';
const stageAssets = {
    pot: {
        soil: `${ASSET_ROOT}/garden_grow_zone_soil.png`,
        seeded: `${ASSET_ROOT}/garden_grow_stages_stage_seeded.png`,
        sprout: `${ASSET_ROOT}/garden_grow_stages_stage_sprout.png`
    },
    ground: {
        soil: `${ASSET_ROOT}/garden_grow_ground_soil.png`,
        seeded: `${ASSET_ROOT}/garden_grow_ground_seeded.png`,
        sprout: `${ASSET_ROOT}/garden_grow_ground_sprout.png`
    }
};

const tools = {
    loosen: { label: '松松土', emoji: '👐' },
    seed: { label: '放种子', image: `${ASSET_ROOT}/garden_grow_item_seed.png` },
    bulb: { label: '放球根', emoji: '🧅' },
    cover: { label: '盖好土', emoji: '🤲' },
    water: { label: '浇浇水', image: `${ASSET_ROOT}/garden_grow_item_water.png` },
    mist: { label: '喷细雾', emoji: '💦' },
    sun: { label: '晒太阳', image: `${ASSET_ROOT}/garden_grow_item_sun.png` },
    feed: { label: '加营养', emoji: '✨' },
    prune: { label: '修枝叶', emoji: '✂️' },
    weed: { label: '拔杂草', emoji: '🌿' },
    support: { label: '搭小架', emoji: '🪵' }
};

const flowers = [
    {
        id: 'sunflower',
        name: '向日葵',
        medium: 'pot',
        accent: '#e5a900',
        asset: `${ASSET_ROOT}/garden_grow_stages_stage_flower.png`,
        steps: [
            { id: 'loosen', hint: '先把泥土松一松', stage: 'soil', effect: 'soil' },
            { id: 'seed', hint: '放下一颗向日葵种子', stage: 'seeded' },
            { id: 'water', hint: '给种子浇点水', stage: 'sprout', effect: 'water' },
            { id: 'sun', hint: '让小苗晒晒太阳', stage: 'flower', effect: 'sun' }
        ]
    },
    {
        id: 'rose',
        name: '玫瑰',
        medium: 'pot',
        accent: '#e84562',
        asset: `${ASSET_ROOT}/garden_grow_flower_rose.png`,
        steps: [
            { id: 'loosen', hint: '先给玫瑰松松土', stage: 'soil', effect: 'soil' },
            { id: 'seed', hint: '种下玫瑰的小种子', stage: 'seeded' },
            { id: 'water', hint: '轻轻浇一点水', stage: 'sprout', effect: 'water' },
            { id: 'feed', hint: '加一点亮晶晶的营养', stage: 'sprout', effect: 'sparkle' },
            { id: 'prune', hint: '修一修多余的小枝叶', stage: 'flower', effect: 'leaves' }
        ]
    },
    {
        id: 'tulip',
        name: '郁金香',
        medium: 'pot',
        accent: '#ef6a4e',
        asset: `${ASSET_ROOT}/garden_grow_flower_tulip.png`,
        steps: [
            { id: 'loosen', hint: '先把泥土松软', stage: 'soil', effect: 'soil' },
            { id: 'bulb', hint: '把圆圆的球根放进去', stage: 'seeded' },
            { id: 'cover', hint: '给球根盖好小被子', stage: 'seeded', effect: 'soil' },
            { id: 'water', hint: '给泥土浇一点水', stage: 'sprout', effect: 'water' },
            { id: 'sun', hint: '请太阳来帮忙', stage: 'flower', effect: 'sun' }
        ]
    },
    {
        id: 'lavender',
        name: '薰衣草',
        medium: 'pot',
        accent: '#8d57d9',
        asset: `${ASSET_ROOT}/garden_grow_flower_lavender.png`,
        steps: [
            { id: 'loosen', hint: '把泥土轻轻松开', stage: 'soil', effect: 'soil' },
            { id: 'seed', hint: '撒下小小的薰衣草种子', stage: 'seeded' },
            { id: 'mist', hint: '喷一层细细的水雾', stage: 'sprout', effect: 'water' },
            { id: 'feed', hint: '加一点花朵营养', stage: 'sprout', effect: 'sparkle' },
            { id: 'sun', hint: '晒晒温暖的太阳', stage: 'flower', effect: 'sun' }
        ]
    },
    {
        id: 'daisy',
        name: '雏菊',
        medium: 'ground',
        accent: '#e5a900',
        asset: `${ASSET_ROOT}/garden_grow_flower_daisy_ground.png`,
        steps: [
            { id: 'loosen', hint: '先把草地上的泥土松一松', stage: 'soil', effect: 'soil' },
            { id: 'seed', hint: '在土地里撒下雏菊种子', stage: 'seeded' },
            { id: 'water', hint: '给小种子喝点水', stage: 'sprout', effect: 'water' },
            { id: 'weed', hint: '把抢营养的杂草拔掉', stage: 'sprout', effect: 'leaves' },
            { id: 'sun', hint: '最后晒一晒太阳', stage: 'flower', effect: 'sun' }
        ]
    },
    {
        id: 'grape',
        name: '葡萄',
        medium: 'ground',
        accent: '#8a37d7',
        asset: `${ASSET_ROOT}/garden_grow_plant_grape_ground.png`,
        finalAlt: '土地里的葡萄藤爬上木架，结出了两串紫葡萄',
        successHint: '太棒啦，紫葡萄成熟了！',
        celebrationText: '葡萄成熟啦！',
        steps: [
            { id: 'loosen', hint: '先给葡萄松一松土地', stage: 'soil', effect: 'soil' },
            { id: 'seed', hint: '把葡萄籽种进泥土里', stage: 'seeded' },
            { id: 'water', hint: '给葡萄籽浇点水', stage: 'sprout', effect: 'water' },
            { id: 'support', hint: '给葡萄藤搭一个小木架', stage: 'sprout', effect: 'leaves' },
            { id: 'sun', hint: '请太阳帮葡萄长大', stage: 'flower', effect: 'sun' }
        ]
    }
];

let currentFlower = flowers[0];
let stepIndex = 0;
let activeDrag = null;
let toolButtons = [];
const completedFlowerIds = new Set();

preloadAssets();
resetCurrentFlower();

resetButton.addEventListener('click', resetCurrentFlower);
nextFlowerButton.addEventListener('click', startNextFlower);

function preloadAssets() {
    const assetUrls = [
        ...Object.values(stageAssets).flatMap((medium) => Object.values(medium)),
        ...flowers.map((flower) => flower.asset),
        ...Object.values(tools).map((tool) => tool.image).filter(Boolean)
    ];
    [...new Set(assetUrls)].forEach((src) => {
        const image = new Image();
        image.src = src;
    });
}

function renderTools() {
    toolTray.replaceChildren();
    currentFlower.steps.forEach((step, index) => {
        const tool = tools[step.id];
        const button = document.createElement('button');
        button.className = 'drag-item';
        button.type = 'button';
        button.dataset.step = step.id;
        button.setAttribute('aria-label', `${tool.label}：${step.hint}`);

        let visual;
        if (tool.image) {
            visual = document.createElement('img');
            visual.src = tool.image;
            visual.alt = '';
            visual.draggable = false;
            visual.className = 'tool-visual';
        } else {
            visual = document.createElement('span');
            visual.className = 'tool-visual tool-emoji';
            visual.setAttribute('aria-hidden', 'true');
            visual.textContent = tool.emoji;
        }

        const label = document.createElement('span');
        label.className = 'tool-label';
        label.textContent = tool.label;
        button.append(visual, label);
        button.addEventListener('pointerdown', startDrag);
        button.addEventListener('keydown', handleToolKeydown);
        if (index < stepIndex) button.classList.add('used');
        toolTray.appendChild(button);
    });
    toolButtons = [...toolTray.querySelectorAll('.drag-item')];
    updateTools();
}

function renderProgress() {
    stepProgress.replaceChildren();
    currentFlower.steps.forEach((step, index) => {
        const dot = document.createElement('span');
        dot.className = 'progress-dot';
        dot.setAttribute('aria-label', `${index + 1}. ${tools[step.id].label}`);
        dot.classList.toggle('done', index < stepIndex);
        dot.classList.toggle('current', index === stepIndex);
        stepProgress.appendChild(dot);
    });
    stepProgress.setAttribute('aria-label', `第 ${Math.min(stepIndex + 1, currentFlower.steps.length)} 步，共 ${currentFlower.steps.length} 步`);
}

function startDrag(event) {
    const source = event.currentTarget;
    const expected = currentFlower.steps[stepIndex];
    if (!expected || source.classList.contains('used')) return;

    if (source.dataset.step !== expected.id) {
        source.classList.remove('wrong');
        void source.offsetWidth;
        source.classList.add('wrong');
        hint.textContent = expected.hint;
        window.GameJuice?.sound('wrong');
        window.GameJuice?.vibrate([18, 34, 18]);
        window.GameJuice?.shake(source);
        return;
    }

    event.preventDefault();
    window.GameJuice?.sound('pick');
    window.GameJuice?.vibrate(10);
    const rect = source.getBoundingClientRect();
    const visual = source.querySelector('.tool-visual');
    const ghost = visual.cloneNode(true);
    ghost.className = 'drag-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = `${Math.min(rect.width, 92)}px`;
    ghost.style.height = `${Math.min(rect.width, 92)}px`;
    if (visual.classList.contains('tool-emoji')) {
        ghost.style.fontSize = getComputedStyle(visual).fontSize;
    }
    document.body.appendChild(ghost);
    source.style.opacity = '0';
    activeDrag = {
        source,
        ghost,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false
    };
    moveGhost(event.clientX, event.clientY);
    source.setPointerCapture(event.pointerId);
    source.addEventListener('pointermove', moveDrag);
    source.addEventListener('pointerup', endDrag);
    source.addEventListener('pointercancel', cancelDrag);
}

function moveDrag(event) {
    if (!activeDrag) return;
    event.preventDefault();
    const distance = Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY);
    if (distance > 8) activeDrag.moved = true;
    moveGhost(event.clientX, event.clientY);
    plantZone.classList.toggle('ready', pointInZone(event.clientX, event.clientY));
}

function endDrag(event) {
    if (!activeDrag) return;
    event.preventDefault();
    const shouldUseTool = !activeDrag.moved || pointInZone(event.clientX, event.clientY);
    if (shouldUseTool) {
        completeStep(activeDrag.source);
    } else {
        activeDrag.source.style.opacity = '';
    }
    clearDrag();
}

function cancelDrag() {
    if (!activeDrag) return;
    activeDrag.source.style.opacity = '';
    clearDrag();
}

function handleToolKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const expected = currentFlower.steps[stepIndex];
    if (expected && event.currentTarget.dataset.step === expected.id) {
        completeStep(event.currentTarget);
    }
}

function moveGhost(x, y) {
    activeDrag.ghost.style.left = `${x}px`;
    activeDrag.ghost.style.top = `${y}px`;
}

function pointInZone(x, y) {
    const rect = plantZone.getBoundingClientRect();
    const padX = rect.width * 0.08;
    const padY = rect.height * 0.08;
    return x >= rect.left + padX && x <= rect.right - padX && y >= rect.top + padY && y <= rect.bottom - padY;
}

function clearDrag() {
    const { source, ghost, pointerId } = activeDrag;
    try {
        source.releasePointerCapture(pointerId);
    } catch (error) {
        // Pointer capture may already be released.
    }
    source.removeEventListener('pointermove', moveDrag);
    source.removeEventListener('pointerup', endDrag);
    source.removeEventListener('pointercancel', cancelDrag);
    ghost.remove();
    plantZone.classList.remove('ready');
    activeDrag = null;
}

function completeStep(source) {
    const step = currentFlower.steps[stepIndex];
    if (!step) return;

    source.style.opacity = '';
    source.classList.add('used');
    window.GameJuice?.sound(step.effect === 'water' ? 'water' : step.effect === 'sun' || step.effect === 'sparkle' ? 'sparkle' : 'drop');
    window.GameJuice?.vibrate(20);
    window.GameJuice?.burst(plantZone, { count: 10, symbols: step.effect === 'water' ? ['●', '◆'] : ['✦', '★', '●'] });
    showEffect(step.effect);
    setPlantStage(step.stage);

    stepIndex += 1;
    renderProgress();
    updateTools();

    if (stepIndex === currentFlower.steps.length) {
        completeFlower();
    } else {
        hint.textContent = currentFlower.steps[stepIndex].hint;
    }
}

function showEffect(effect) {
    if (!effect) return;
    if (effect === 'sun') {
        sunshine.classList.add('show');
        return;
    }
    growthEffect.className = `growth-effect ${effect}`;
    window.setTimeout(() => {
        growthEffect.className = 'growth-effect';
    }, 950);
}

function setPlantStage(stage) {
    const medium = currentFlower.medium || 'pot';
    const place = medium === 'ground' ? '土地里' : '花盆里';
    const src = stage === 'flower' ? currentFlower.asset : stageAssets[medium][stage];
    const alt = stage === 'flower'
        ? currentFlower.finalAlt || `${place}开出了开心的${currentFlower.name}`
        : stage === 'sprout'
            ? `${place}长出了两片叶子的小苗`
            : stage === 'seeded'
                ? `${place}种下了种子`
                : medium === 'ground' ? '草地上松软的种植土窝' : '装着松软泥土的花盆';
    plantStage.classList.remove('changing');
    plantStage.src = src;
    plantStage.alt = alt;
    void plantStage.offsetWidth;
    plantStage.classList.add('changing');
}

function updateTools() {
    const expected = currentFlower.steps[stepIndex];
    toolButtons.forEach((button) => {
        const isUsed = button.classList.contains('used');
        const isNext = expected && button.dataset.step === expected.id;
        button.classList.toggle('next', Boolean(isNext));
        button.classList.toggle('locked', !isUsed && !isNext);
    });
}

function completeFlower() {
    completedFlowerIds.add(currentFlower.id);
    hint.textContent = currentFlower.successHint || `太棒啦，${currentFlower.name}开花了！`;
    celebration.textContent = currentFlower.celebrationText || `${currentFlower.name}长大啦！`;
    toolTray.hidden = true;
    nextFlowerButton.hidden = false;
    updateCollectionBadge();
    window.GameJuice?.sound('complete');
    window.GameJuice?.vibrate([24, 42, 30]);
    window.GameJuice?.burst(plantZone, { count: 22, symbols: ['✿', '★', '✦'] });
    window.setTimeout(() => celebration.classList.add('show'), 260);
}

function updateCollectionBadge() {
    const count = completedFlowerIds.size;
    collectionBadge.textContent = count === flowers.length ? '花园图鉴集齐啦！' : `花园图鉴 ${count}/${flowers.length}`;
    collectionBadge.classList.toggle('complete', count === flowers.length);
}

function startNextFlower() {
    const unplanted = flowers.filter((flower) => !completedFlowerIds.has(flower.id) && flower.id !== currentFlower.id);
    const choices = unplanted.length > 0
        ? unplanted
        : flowers.filter((flower) => flower.id !== currentFlower.id);
    currentFlower = choices[Math.floor(Math.random() * choices.length)];
    resetCurrentFlower();
}

function resetCurrentFlower() {
    if (activeDrag) cancelDrag();
    stepIndex = 0;
    document.documentElement.style.setProperty('--flower-accent', currentFlower.accent);
    flowerName.textContent = currentFlower.name;
    hint.textContent = currentFlower.steps[0].hint;
    const medium = currentFlower.medium || 'pot';
    const placeLabel = medium === 'ground' ? '土地' : '花盆';
    plantZone.classList.toggle('ground', medium === 'ground');
    plantZone.dataset.medium = medium;
    plantZone.setAttribute('aria-label', `正在${placeLabel}里种${currentFlower.name}`);
    plantStage.src = stageAssets[medium].soil;
    plantStage.alt = medium === 'ground' ? '草地上松软的种植土窝' : '装着泥土的花盆';
    plantStage.classList.remove('changing');
    sunshine.classList.remove('show');
    growthEffect.className = 'growth-effect';
    celebration.classList.remove('show');
    celebration.textContent = '';
    nextFlowerButton.hidden = true;
    toolTray.hidden = false;
    renderTools();
    renderProgress();
    updateCollectionBadge();
    window.GameJuice?.guide(toolTray.querySelector('.drag-item.next'), plantZone, 1450);
}
