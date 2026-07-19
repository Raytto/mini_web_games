const container = document.getElementById('game-area');
const toysLayer = document.getElementById('toys-layer');
const boxZone = document.getElementById('box-zone');
const boxImg = document.getElementById('box-img');
const winOverlay = document.getElementById('win-overlay');
const againButton = document.getElementById('again-button');

const TOY_TYPES = ['🧸', '⚽', '🧱', '🚗', '🧩', '🦕', '🚂', '🥁', '🦆', '🤖'];
const NUM_TOYS = 5;

let toys = [];
let activeToy = null;
let startX, startY, initialToyLeft, initialToyTop;
let toysRemaining = 0;

againButton.addEventListener('click', initGame);

function initGame() {
    toysLayer.innerHTML = '';
    toys = [];
    toysRemaining = NUM_TOYS;
    boxImg.src = 'assets/box_open_clean.png';
    winOverlay.classList.add('hidden');

    const containerRect = container.getBoundingClientRect();
    const boxRect = boxZone.getBoundingClientRect();

    for (let i = 0; i < NUM_TOYS; i++) {
        createToy(i, containerRect, boxRect);
    }
}

function createToy(index, containerRect, boxRect) {
    const toy = document.createElement('div');
    toy.classList.add('toy');
    toy.textContent = TOY_TYPES[Math.floor(Math.random() * TOY_TYPES.length)];

    // Random position logic loops until valid
    let left, top;
    let validPosition = false;
    let attempts = 0;
    const toySize = getToySize();
    const margin = Math.max(18, toySize * 0.3);

    // Use percentage for relative positioning? No, absolute pixels is easier for drag limits,
    // but percentages are better for responsiveness.
    // Let's use pixels based on current container size, assuming fixed view for now or simple resize.

    while (!validPosition && attempts < 50) {
        attempts++;
        // Random pos within container
        left = margin + Math.random() * Math.max(1, containerRect.width - toySize - margin * 2);
        top = margin + Math.random() * Math.max(1, containerRect.height - toySize - margin * 2);

        // Check distance from box
        const toycx = left + toySize / 2;
        const toycy = top + toySize / 2;
        const boxcx = boxRect.left - containerRect.left + boxRect.width / 2;
        const boxcy = boxRect.top - containerRect.top + boxRect.height / 2;

        const dist = Math.hypot(toycx - boxcx, toycy - boxcy);

        const minClearance = Math.min(boxRect.width, boxRect.height) * 0.5 + toySize * 0.75;
        if (dist > minClearance) {
            validPosition = true;
        }
    }

    toy.style.left = left + 'px';
    toy.style.top = top + 'px';
    toy.style.fontSize = toySize + 'px';

    // Add event listeners
    toy.addEventListener('mousedown', dragStart);
    toy.addEventListener('touchstart', dragStart, { passive: false });

    toysLayer.appendChild(toy);
}

function getToySize() {
    const shortSide = Math.min(window.innerWidth, window.innerHeight);
    return Math.max(54, Math.min(82, shortSide * 0.17));
}

function dragStart(e) {
    if (e.target.classList.contains('captured')) return;

    activeToy = e.target;

    // Get initial positions
    const rect = activeToy.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    // Mouse/Touch pos
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;

    // Current CSS left/top (need to parse or use offset)
    initialToyLeft = parseFloat(activeToy.style.left || 0);
    initialToyTop = parseFloat(activeToy.style.top || 0);

    // Bring to front
    activeToy.style.zIndex = 100;

    // Attach move/end listeners
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}

function dragMove(e) {
    if (!activeToy) return;
    e.preventDefault();

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    activeToy.style.left = (initialToyLeft + dx) + 'px';
    activeToy.style.top = (initialToyTop + dy) + 'px';
}

function dragEnd(e) {
    if (!activeToy) return;

    // Check collision with box
    const toyRect = activeToy.getBoundingClientRect();
    const boxRect = boxZone.getBoundingClientRect();

    // Simple AABB collision or Center Distance
    const toyCx = toyRect.left + toyRect.width / 2;
    const toyCy = toyRect.top + toyRect.height / 2;
    const boxCx = boxRect.left + boxRect.width / 2;
    const boxCy = boxRect.top + boxRect.height / 2;

    const dist = Math.hypot(toyCx - boxCx, toyCy - boxCy);

    const captureRadius = Math.min(boxRect.width, boxRect.height) * 0.42;
    if (dist < captureRadius) {
        tidyUpToy(activeToy);
    } else {
        // Drop sounds or bounce could go here
        activeToy.style.zIndex = '';
    }

    activeToy = null;
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);
}

function tidyUpToy(toy) {
    // Disable drag
    toy.classList.add('captured');

    // Animate to exact center of box
    // We need to calculate position relative to toysLayer again
    const containerRect = container.getBoundingClientRect();
    const boxRect = boxZone.getBoundingClientRect();

    const targetLeft = (boxRect.left - containerRect.left) + (boxRect.width / 2) - (toy.offsetWidth / 2);
    const targetTop = (boxRect.top - containerRect.top) + (boxRect.height / 2) - (toy.offsetHeight / 2);

    toy.style.transform = `translate(${targetLeft - parseFloat(toy.style.left)}px, ${targetTop - parseFloat(toy.style.top)}px) scale(0.1)`;
    // Wait for transition then remove
    // Actually the CSS transition logic might be tricky with changing 'left' vs 'transform'.
    // Let's use the CSS class 'captured' which has transform.
    // We overwrite the inline styles for exact centering:

    toy.style.left = targetLeft + 'px';
    toy.style.top = targetTop + 'px';

    // Trigger effects
    spawnStars(boxRect.left + boxRect.width / 2, boxRect.top + boxRect.height / 2);
    playCheer();

    setTimeout(() => {
        toy.remove();
        toysRemaining--;
        if (toysRemaining <= 0) {
            gameWin();
        }
    }, 500); // Match CSS transition time
}

function spawnStars(x, y) {
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('div');
        star.classList.add('particle');
        star.textContent = '⭐';
        star.style.left = (x + (Math.random() - 0.5) * 50) + 'px';
        star.style.top = (y + (Math.random() - 0.5) * 50) + 'px';
        document.body.appendChild(star);

        setTimeout(() => star.remove(), 800);
    }
}

function playCheer() {
    // Visual feedback is enough if no audio, but we can animate the box
    boxImg.classList.add('box-shake');
    setTimeout(() => boxImg.classList.remove('box-shake'), 500);
}

function gameWin() {
    setTimeout(() => {
        // wrapper for closing animation
        boxImg.src = 'assets/box_closed_clean.png';
        setTimeout(() => {
            winOverlay.classList.remove('hidden');
        }, 1000);
    }, 500);
}

// Start
initGame();
