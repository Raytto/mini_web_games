const roadStage = document.getElementById('road-stage');
const roadScene = document.getElementById('road-scene');
const repairTarget = document.getElementById('repair-target');
const actionProp = document.getElementById('action-prop');
const driveCar = document.getElementById('drive-car');
const stepStrip = document.getElementById('step-strip');
const toolTray = document.getElementById('tool-tray');
const hint = document.getElementById('hint');
const success = document.getElementById('success');
const resetButton = document.getElementById('reset-btn');
const againButton = document.getElementById('again-btn');

const ASSET_ROOT = '../shared/generated_assets';
const stages = {
    broken: `${ASSET_ROOT}/road_helper_stage_broken_v2.png`,
    gravel: `${ASSET_ROOT}/road_helper_stage_gravel_v2.png`,
    fixed: `${ASSET_ROOT}/road_helper_stage_fixed_v2.png`
};

const steps = [
    {
        id: 'gravel',
        label: '填碎石',
        hint: '先把碎石填进路坑',
        workingHint: '碎石正在填满路坑…',
        image: `${ASSET_ROOT}/road_helper_item_gravel_v2.png`,
        stage: 'gravel',
        alt: '破损的路坑已经用小碎石填满',
        actionClass: 'pouring',
        changeDelay: 360,
        duration: 760
    },
    {
        id: 'roller',
        label: '压压平',
        hint: '再用小压路机压平',
        workingHint: '压路机把路面压结实…',
        image: `${ASSET_ROOT}/road_helper_item_roller_v2.png`,
        stage: 'fixed',
        alt: '路坑已经铺成平整的新沥青路面，黄色车道线也接好了',
        actionClass: 'rolling',
        changeDelay: 450,
        duration: 920
    },
    {
        id: 'car',
        label: '开过去',
        hint: '最后让小车试一试',
        workingHint: '小车正在试走新路…',
        image: `${ASSET_ROOT}/road_helper_item_car.png`,
        duration: 1850
    }
];

let stepIndex = 0;
let busy = false;
let activeDrag = null;
let toolButtons = [];
let timers = [];

preloadAssets();
resetGame();

resetButton.addEventListener('click', resetGame);
againButton.addEventListener('click', resetGame);

function preloadAssets() {
    const urls = [...Object.values(stages), ...steps.map((step) => step.image)];
    [...new Set(urls)].forEach((src) => {
        const image = new Image();
        image.src = src;
    });
}

function renderTools() {
    toolTray.replaceChildren();
    steps.forEach((step, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tool-card';
        button.dataset.step = step.id;
        button.setAttribute('aria-label', `${step.label}：${step.hint}`);

        const image = document.createElement('img');
        image.src = step.image;
        image.alt = '';
        image.draggable = false;
        const label = document.createElement('span');
        label.textContent = step.label;
        button.append(image, label);
        button.addEventListener('pointerdown', startDrag);
        button.addEventListener('keydown', handleToolKeydown);
        if (index < stepIndex) button.classList.add('used');
        toolTray.appendChild(button);
    });
    toolButtons = [...toolTray.querySelectorAll('.tool-card')];
    updateTools();
}

function renderProgress() {
    stepStrip.replaceChildren();
    steps.forEach((step, index) => {
        const chip = document.createElement('span');
        chip.className = 'step-chip';
        chip.textContent = step.label;
        chip.classList.toggle('done', index < stepIndex);
        chip.classList.toggle('current', index === stepIndex);
        stepStrip.appendChild(chip);
    });
    stepStrip.setAttribute('aria-label', stepIndex >= steps.length
        ? '修路完成，共三步'
        : `修路第 ${stepIndex + 1} 步，共三步`);
}

function startDrag(event) {
    const source = event.currentTarget;
    const expected = steps[stepIndex];
    if (!expected || busy || source.classList.contains('used')) return;

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
    const ghost = source.cloneNode(true);
    ghost.className = 'tool-card dragging';
    ghost.removeAttribute('data-step');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
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
    if (Math.hypot(event.clientX - activeDrag.startX, event.clientY - activeDrag.startY) > 8) {
        activeDrag.moved = true;
    }
    moveGhost(event.clientX, event.clientY);
    roadScene.classList.toggle('ready', pointInTarget(event.clientX, event.clientY));
}

function endDrag(event) {
    if (!activeDrag) return;
    event.preventDefault();
    const shouldUse = !activeDrag.moved || pointInTarget(event.clientX, event.clientY);
    if (shouldUse) {
        completeStep(activeDrag.source);
    } else {
        activeDrag.source.style.opacity = '';
        hint.textContent = '把工具放到破损的路面上';
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
    const expected = steps[stepIndex];
    if (expected && !busy && event.currentTarget.dataset.step === expected.id) {
        completeStep(event.currentTarget);
    }
}

function moveGhost(x, y) {
    activeDrag.ghost.style.left = `${x}px`;
    activeDrag.ghost.style.top = `${y}px`;
}

function pointInTarget(x, y) {
    const rect = repairTarget.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
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
    roadScene.classList.remove('ready');
    activeDrag = null;
}

function completeStep(source) {
    const step = steps[stepIndex];
    if (!step || busy) return;

    busy = true;
    window.GameJuice?.sound(step.id === 'car' ? 'engine' : 'drop');
    window.GameJuice?.vibrate(20);
    window.GameJuice?.burst(repairTarget, { count: 10, symbols: ['●', '✦', '★'] });
    source.style.opacity = '';
    source.classList.add('used');
    hint.textContent = step.workingHint;
    updateTools();

    if (step.id === 'car') {
        runCarStep(step);
        return;
    }

    actionProp.src = step.image;
    actionProp.hidden = false;
    actionProp.className = `action-prop ${step.actionClass}`;
    schedule(() => setRoadStage(step), step.changeDelay);
    schedule(() => {
        actionProp.hidden = true;
        actionProp.className = 'action-prop';
        finishStep();
    }, step.duration);
}

function setRoadStage(step) {
    roadStage.classList.remove('changing');
    roadStage.src = stages[step.stage];
    roadStage.alt = step.alt;
    void roadStage.offsetWidth;
    roadStage.classList.add('changing');
}

function runCarStep(step) {
    roadScene.classList.add('testing');
    driveCar.hidden = false;
    driveCar.classList.remove('driving');
    void driveCar.offsetWidth;
    driveCar.classList.add('driving');
    schedule(() => {
        driveCar.hidden = true;
        driveCar.classList.remove('driving');
        roadScene.classList.remove('testing');
        stepIndex += 1;
        busy = false;
        hint.textContent = '小车安全通过啦！';
        renderProgress();
        toolTray.hidden = true;
        success.hidden = false;
        window.GameJuice?.sound('complete');
        window.GameJuice?.vibrate([24, 42, 30]);
        window.GameJuice?.burst(roadScene, { count: 22, symbols: ['★', '✦', '❤'] });
    }, step.duration);
}

function finishStep() {
    stepIndex += 1;
    busy = false;
    renderProgress();
    renderTools();
    hint.textContent = steps[stepIndex].hint;
}

function updateTools() {
    const expected = steps[stepIndex];
    toolButtons.forEach((button) => {
        const isUsed = button.classList.contains('used');
        const isNext = !busy && expected && button.dataset.step === expected.id;
        button.classList.toggle('next', Boolean(isNext));
        button.classList.toggle('locked', !isUsed && !isNext);
    });
}

function schedule(callback, delay) {
    const timer = window.setTimeout(callback, delay);
    timers.push(timer);
}

function clearTimers() {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
}

function resetGame() {
    if (activeDrag) cancelDrag();
    clearTimers();
    stepIndex = 0;
    busy = false;
    roadStage.src = stages.broken;
    roadStage.alt = '前方道路有一个宽宽的破损路坑';
    roadStage.classList.remove('changing');
    actionProp.hidden = true;
    actionProp.className = 'action-prop';
    driveCar.hidden = true;
    driveCar.classList.remove('driving');
    roadScene.classList.remove('testing');
    success.hidden = true;
    toolTray.hidden = false;
    hint.textContent = steps[0].hint;
    renderTools();
    renderProgress();
    window.GameJuice?.guide(toolTray.querySelector('.tool-card.next'), repairTarget, 1450);
}
