const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const reactionText = document.getElementById('reaction-text');

let width, height;
let gameRunning = false;

// Assets
const images = {};
const imageSources = {
    bg: '../../upload/img/kitchen_bg.png',
    cat_neutral: '../../upload/img/cat_neutral.png',
    cat_happy: '../../upload/img/cat_happy.png',
    cat_disgust: '../../upload/img/cat_disgust.png'
};

let loadedImages = 0;
const totalImages = Object.keys(imageSources).length;

// Game State
let catState = 'neutral'; // neutral, happy, disgust
let catStateTimer = 0;
const CAT_REACTION_TIME = 120; // frames (approx 2 seconds)

// Food
const foodEmojis = ['🍎', '🌭', '🌽', '🍚', '🍇', '🍓', '🍔', '🍕', '🥦', '🍦', '🍩', '🥕'];
let foods = [];
let draggedFood = null;

// Scale factors
let scale = 1;

function loadImages() {
    for (const [key, src] of Object.entries(imageSources)) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                initGame();
            }
        };
        images[key] = img;
    }
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    scale = Math.min(width / 800, height / 600); // Base scale on 800x600 reference
}

window.addEventListener('resize', resize);

function initGame() {
    resize();
    // Initial render or waitForStart
    draw();
}

startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameRunning = true;
    spawnFoods();
    loop();
});

function spawnFoods() {
    // Fill the tray with foods
    const trayCount = 5;
    for (let i = 0; i < trayCount; i++) {
        spawnFoodItem();
    }
}

function spawnFoodItem() {
    if (foods.length >= 8) return;

    const type = foodEmojis[Math.floor(Math.random() * foodEmojis.length)];
    // Random position in the bottom tray area
    const trayHeight = height * 0.25;
    const x = Math.random() * (width - 100) + 50;
    const y = height - (Math.random() * (trayHeight - 80) + 40);

    foods.push({
        x: x,
        y: y,
        originalX: x,
        originalY: y,
        type: type,
        size: 100 * scale,
        isDragging: false,
        vx: 0,
        vy: 0
    });
}

function update() {
    if (!gameRunning) return;

    // Cat reaction timer
    if (catState !== 'neutral') {
        catStateTimer--;
        if (catStateTimer <= 0) {
            catState = 'neutral';
            reactionText.style.display = 'none';
        }
    }

    // Spawn more food occasionally if low
    if (foods.length < 5 && Math.random() < 0.01) {
        spawnFoodItem();
    }

    // Physics/Movement for dragging (smoothing)
    // Actually simple direct mapping is fine for drag
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // 1. Background
    if (images.bg) {
        // Draw BG to cover screen (like CSS object-fit: cover)
        const bgRatio = images.bg.width / images.bg.height;
        const canvasRatio = width / height;
        let sWidth, sHeight, sx, sy;

        if (canvasRatio > bgRatio) {
            // Canvas is wider than BG -> Crop top/bottom
            sWidth = images.bg.width;
            sHeight = sWidth / canvasRatio;
            sx = 0;
            sy = (images.bg.height - sHeight) / 2;
        } else {
            // Canvas is taller than BG -> Crop left/right
            sHeight = images.bg.height;
            sWidth = sHeight * canvasRatio;
            sy = 0;
            sx = (images.bg.width - sWidth) / 2;
        }
        ctx.drawImage(images.bg, sx, sy, sWidth, sHeight, 0, 0, width, height);
    }

    // 2. Cat
    let currentCatImg = images.cat_neutral;
    if (catState === 'happy') currentCatImg = images.cat_happy;
    if (catState === 'disgust') currentCatImg = images.cat_disgust;

    if (currentCatImg) {
        // Size: 1/2 of the short edge
        const shortEdge = Math.min(width, height);
        const catSize = shortEdge * 0.5;

        // Center the cat
        const catX = (width - catSize) / 2;
        const catY = (height - catSize) / 2;

        ctx.drawImage(currentCatImg, catX, catY, catSize, catSize);

        // Define mouth area for collision detection
        catMouthRect = {
            x: catX + catSize * 0.42,
            y: catY + catSize * 0.25,
            w: catSize * 0.16,
            h: catSize * 0.1
        };

        // Debug mouth
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(catMouthRect.x, catMouthRect.y, catMouthRect.w, catMouthRect.h);
    }

    // 4. Tray Area (Visual indicator)
    const trayY = height * 0.75;
    // Optional: Draw a semi-transparent overlay for tray if needed, but keeping it minimal as per user preference likely
    // display text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, trayY, width, height * 0.25);

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${20 * scale}px "Fredoka One"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic'; // Reset baseline
    ctx.fillText("Delicious Food Below!", width / 2, trayY + 30 * scale);

    // 5. Foods
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    foods.forEach(food => {
        ctx.font = `${food.size}px Arial`; // Emoji font
        ctx.fillText(food.type, food.x, food.y);
    });
}

function loop() {
    update();
    draw();
    if (gameRunning) requestAnimationFrame(loop);
}

// Input Handling
let catMouthRect = { x: 0, y: 0, w: 0, h: 0 };

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

function isInside(pos, food) {
    const r = food.size / 2;
    return pos.x > food.x - r && pos.x < food.x + r && pos.y > food.y - r && pos.y < food.y + r;
}

function handleStart(e) {
    if (!gameRunning) return;
    const pos = getTouchPos(e);

    // Check foods (reverse order to pick top one)
    for (let i = foods.length - 1; i >= 0; i--) {
        if (isInside(pos, foods[i])) {
            draggedFood = foods[i];
            draggedFood.isDragging = true;
            // Move to end of array to draw on top
            foods.splice(i, 1);
            foods.push(draggedFood);
            break;
        }
    }
}

function handleMove(e) {
    if (!draggedFood) return;
    e.preventDefault(); // Prevent scrolling
    const pos = getTouchPos(e);
    draggedFood.x = pos.x;
    draggedFood.y = pos.y;
}

function handleEnd(e) {
    if (!draggedFood) return;

    // Check collision: ANYWHERE above the tray (height * 0.75) is valid
    if (draggedFood.y < height * 0.75) {

        // EAT!
        eatFood(draggedFood);
    } else {
        // Drop back to original pos or stay? Let's drop back to tray random pos
        // Animate back would be nice, but instant snap is easier for MVP. 
        // Let's just drop it there? No, it might clutter the face. Snap back to tray.
        if (draggedFood.y < height * 0.70) {
            // If dropped in play area but not mouth, fall back down
            draggedFood.y = height - 100;
        }
    }

    draggedFood.isDragging = false;
    draggedFood = null;
}

function eatFood(food) {
    // Remove food
    const index = foods.indexOf(food);
    if (index > -1) foods.splice(index, 1);

    // Trigger Reaction
    const isGood = Math.random() > 0.5; // Random reaction
    catState = isGood ? 'happy' : 'disgust';
    catStateTimer = CAT_REACTION_TIME;

    // Show Bubble with Emoji
    const moodEmojis = isGood ? ['😍', '😋', '🥰', '🤩'] : ['🤢', '🤮', '😖', '😵'];
    const moodEmoji = pickRandom(moodEmojis);

    reactionText.innerHTML = `<span style="font-size: 80px;">${moodEmoji}</span>`;
    reactionText.style.display = 'block';

    // Style as bubble
    reactionText.style.backgroundColor = 'white';
    reactionText.style.padding = '10px 30px';
    reactionText.style.borderRadius = '50px';
    reactionText.style.color = '#333';
    reactionText.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';

    // Spawn replacement in tray immediately? Or wait?
    setTimeout(spawnFoodItem, 500);
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Event Listeners
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('touchend', handleEnd);

// Init
loadImages();
