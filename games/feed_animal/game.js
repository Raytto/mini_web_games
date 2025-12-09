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
    bg: '../../upload/img/cat_game_floor_bg.png',
    cat_neutral: '../../upload/img/cat_neutral.png',
    cat_happy: '../../upload/img/cat_happy.png',
    cat_disgust: '../../upload/img/cat_disgust.png',
    bowl: '../../upload/img/empty_pet_bowl.png',
    kraft_paper: '../../upload/img/kraft_paper_texture.png'
};

// Audio (BGM in Shell)

const sfx = {
    happy: [
        new Audio('../../upload/audio/cat-meow.mp3'),
        new Audio('../../upload/audio/cat-meow-2.mp3')
    ],
    disgust: [
        new Audio('../../upload/audio/cat-meow-3.mp3')
    ]
};
// Sound Effect Volume
Object.values(sfx).flat().forEach(audio => audio.volume = 0.6);

let loadedImages = 0;
const totalImages = Object.keys(imageSources).length;

// Game State
let catState = 'neutral'; // neutral, happy, disgust
let catStateTimer = 0;
const CAT_REACTION_TIME = 300; // frames (approx 5 seconds)

// Food
// Food Preferences and Data
const FOOD_DATA = {
    // Favorites (Happy)
    '🐟': { reaction: 'happy', emojis: ['😋', '😍', '🐟', '😻', '💖'] },   // Fish
    '🍖': { reaction: 'happy', emojis: ['😋', '😍', '🍖', '🦁', '🤤'] },   // Meat
    '🍗': { reaction: 'happy', emojis: ['😋', '😍', '🍗', '🍗', '🥰'] },   // Turkey
    '🍤': { reaction: 'happy', emojis: ['😋', '😍', '🍤', '🌊', '🤩'] },   // Shrimp
    '🥛': { reaction: 'happy', emojis: ['😋', '🥰', '🥛', '🍼', '😽'] },   // Milk
    '🧀': { reaction: 'happy', emojis: ['😋', '🧀', '🐁', '👌', '😺'] },   // Cheese
    '🍔': { reaction: 'happy', emojis: ['😋', '🍔', '👍', '😺', '🍟'] },   // Burger (Meat)
    '🥩': { reaction: 'happy', emojis: ['😋', '😍', '🥩', '🍴', '🦁'] },   // Steak

    // Dislike/Hate (Disgust)
    '🥦': { reaction: 'disgust', emojis: ['🤢', '😒', '🥦', '😑', '🍃'] }, // Broccoli (Veggies)
    '🍋': { reaction: 'disgust', emojis: ['😖', '😵', '🍋', '😝', '🥴'] }, // Lemon (Sour)
    '🧅': { reaction: 'disgust', emojis: ['🤢', '🤮', '🧅', '😢', '😷'] }, // Onion (Toxic/Smell)
    '🌶️': { reaction: 'disgust', emojis: ['🔥', '🥵', '🌶️', '😱', '🚒'] }, // Chili (Spicy)
    '🍫': { reaction: 'disgust', emojis: ['🤢', '💀', '🍫', '🚫', '⚠️'] }, // Chocolate (Toxic)
    '💊': { reaction: 'disgust', emojis: ['🤢', '🤮', '💊', '🏥', '💉'] }, // Medicine
    '🍇': { reaction: 'disgust', emojis: ['🤢', '🤮', '🍇', '🚫', '😵'] }, // Grapes (Toxic)
    '🌽': { reaction: 'disgust', emojis: ['😒', '🌽', '😑', '😶', '🌾'] }  // Corn (Filler/Bland)
};

const foodEmojis = Object.keys(FOOD_DATA);
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
    // Auto-start
    startGame();
}

// startBtn removed
function startGame() {
    if (startScreen) startScreen.classList.add('hidden');
    gameRunning = true;
    spawnFoods();
    loop();
}


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

    // 1. Background (Floor)
    if (images.bg) {
        const bgRatio = images.bg.width / images.bg.height;
        const canvasRatio = width / height;
        let sWidth, sHeight, sx, sy;

        if (canvasRatio > bgRatio) {
            sWidth = images.bg.width;
            sHeight = sWidth / canvasRatio;
            sx = 0;
            sy = (images.bg.height - sHeight) / 2;
        } else {
            sHeight = images.bg.height;
            sWidth = sHeight * canvasRatio;
            sy = 0;
            sx = (images.bg.width - sWidth) / 2;
        }
        ctx.drawImage(images.bg, sx, sy, sWidth, sHeight, 0, 0, width, height);
    }

    // Constants for layout
    const trayHeight = height * 0.25;
    const playAreaHeight = height - trayHeight;
    const shortEdge = Math.min(width, playAreaHeight); // Use play area for sizing

    // 2. Cat
    let currentCatImg = images.cat_neutral;
    if (catState === 'happy') currentCatImg = images.cat_happy;
    if (catState === 'disgust') currentCatImg = images.cat_disgust;

    let catSize = shortEdge * 1.8; // 1.5x larger (was 1.2)
    let catX = (width - catSize) / 2 - 25 * scale; // Move left to correct right-bias

    // Calculate bowl position to serve as anchor
    const bowlSize = catSize * 0.5;
    const bowlX = width / 2;
    // Position bowl near the bottom of the play area
    const bowlY = (height - trayHeight) - bowlSize * 0.1;

    // Position cat closer to the plate
    let catY = bowlY - catSize * 0.82;

    if (currentCatImg) {
        ctx.drawImage(currentCatImg, catX, catY, catSize, catSize);

        // Update mouth rect based on new position
        catMouthRect = {
            x: catX + catSize * 0.42,
            y: catY + catSize * 0.25,
            w: catSize * 0.16,
            h: catSize * 0.1
        };
    }

    // 3. Bowl (Plate) - Procedural to ensure transparency/style
    // derived variables above

    drawBowl(bowlX, bowlY, bowlSize);

    // 4. Tray Area (Kraft Paper Table)
    const trayY = height - trayHeight;

    if (images.kraft_paper) {
        // Draw kraft paper texture clipping to tray area
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, trayY, width, trayHeight);
        ctx.clip();

        // Draw image covering the area
        // We can just stretch it for now as it's a texture
        ctx.drawImage(images.kraft_paper, 0, trayY, width, trayHeight);
        ctx.restore();
    } else {
        // Fallback
        ctx.fillStyle = '#d2b48c'; // Tan color
        ctx.fillRect(0, trayY, width, trayHeight);
    }

    // Shadow/Edge for the table
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = -5;
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, trayY, width, 5); // visual separator
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;


    // Text on Table
    ctx.fillStyle = '#5c4033'; // Dark brown pen color
    ctx.font = `bold ${22 * scale}px "Fredoka One"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText("Delicious Food for Kitty!", width / 2, trayY + 40 * scale);

    // 5. Foods
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 5;

    foods.forEach(food => {
        ctx.font = `${food.size}px Arial`;
        ctx.fillText(food.type, food.x, food.y);
    });

    ctx.shadowBlur = 0; // Reset
}

function drawBowl(x, y, size) {
    const radiusX = size / 2;
    const radiusY = size / 4; // Perspective compression

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 10 * scale, radiusX * 1.1, radiusY * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bowl Outer (Ceramic White)
    const pattern = ctx.createLinearGradient(x, y - radiusY, x, y + radiusY);
    pattern.addColorStop(0, '#f0f0f0');
    pattern.addColorStop(1, '#d0d0d0');
    ctx.fillStyle = pattern;

    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = '#bbb';
    ctx.stroke();

    // Bowl Inner (Depth)
    ctx.fillStyle = '#e8e8e8'; // Slightly darker
    ctx.beginPath();
    ctx.ellipse(x, y - 5 * scale, radiusX * 0.85, radiusY * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner Shadow (Gradient)
    const innerGrad = ctx.createRadialGradient(x, y - 5 * scale, 0, x, y - 5 * scale, radiusX * 0.85);
    innerGrad.addColorStop(0.8, 'rgba(0,0,0,0)');
    innerGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = innerGrad;
    ctx.fill();
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

    // Get Preference Data
    const data = FOOD_DATA[food.type] || { reaction: 'neutral', emojis: ['?'] };

    // Set State
    catState = data.reaction;
    catStateTimer = CAT_REACTION_TIME;

    // Play Sound
    if (sfx[data.reaction]) {
        const sounds = sfx[data.reaction];
        const sound = sounds[Math.floor(Math.random() * sounds.length)];

        // Reset to look for new start
        sound.currentTime = 0;
        sound.play().catch(e => console.warn('SFX Error:', e));
    }

    // Show Bubble with specific Emoji from the list
    const moodEmoji = pickRandom(data.emojis);

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
