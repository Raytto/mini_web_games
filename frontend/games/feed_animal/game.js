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
    kraft_paper: '../../upload/img/kraft_paper_texture.png',
    trash: '../../upload/img/trash_can.png?v=2'
};

// Audio (BGM in Shell)

const sfx = {
    happy: [
        new Audio('../../upload/audio/cat-meow.mp3'),
        new Audio('../../upload/audio/cat-meow-2.mp3')
    ],
    disgust: [
        new Audio('../../upload/audio/cat-meow-3.mp3')
    ],
    trash: [
        new Audio('../../upload/audio/trash.mp3')
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

let trayHeight = 0;
const trashBin = {
    x: 0,
    y: 0,
    radius: 0,
    isHighlighted: false
};

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
    trayHeight = height * 0.25;
    updateTrashBinPosition();
    repositionFoods();
}

window.addEventListener('resize', resize);

function updateTrashBinPosition() {
    trashBin.radius = 60 * scale;
    trashBin.x = 80 * scale; // Fixed distance from left
    trashBin.y = height - (trayHeight * 0.5);
}


function repositionFoods() {
    const tableTop = height - trayHeight;
    const padding = 50 * scale;

    foods.forEach(food => {
        food.size = 100 * scale;

        // Strict clamp to valid area
        const minX = padding;
        const maxX = width - padding;
        const minY = tableTop + padding; // Top of tray area
        const maxY = height - padding;    // Bottom of screen

        // X Axis
        if (food.x < minX) food.x = minX;
        if (food.x > maxX) food.x = maxX;

        // Y Axis
        if (food.y < minY) food.y = minY;
        if (food.y > maxY) food.y = maxY;

        // Final sanity check if window is VERY small
        if (food.y < tableTop) food.y = tableTop + trayHeight / 2;
    });
}


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
    const trayAreaHeight = trayHeight || height * 0.25;
    const x = Math.random() * (width - 100 * scale) + 50 * scale;
    const y = height - (Math.random() * Math.max(60 * scale, trayAreaHeight - 80 * scale) + 40 * scale);

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
    const trayAreaHeight = trayHeight || height * 0.25;
    const playAreaHeight = height - trayAreaHeight;
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
    const bowlY = (height - trayAreaHeight) - bowlSize * 0.1;

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
    const trayY = height - trayAreaHeight;

    if (images.kraft_paper) {
        // Draw kraft paper texture clipping to tray area
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, trayY, width, trayAreaHeight);
        ctx.clip();

        // Draw image covering the area
        // We can just stretch it for now as it's a texture
        ctx.drawImage(images.kraft_paper, 0, trayY, width, trayAreaHeight);
        ctx.restore();
    } else {
        // Fallback
        ctx.fillStyle = '#d2b48c'; // Tan color
        ctx.fillRect(0, trayY, width, trayAreaHeight);
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
    ctx.font = `bold ${16 * scale}px "Fredoka One"`;
    ctx.fillText("Drop unwanted snacks into the trash bin.", width / 2, trayY + 70 * scale);

    drawTrashBin();

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

function drawTrashBin() {
    const { x, y, radius, isHighlighted } = trashBin;

    // Draw Trash Can Image if available and valid
    if (images.trash && images.trash.complete && images.trash.naturalWidth > 0) {
        const img = images.trash;
        // Calculate aspect ratio to fit within radius * 2.5
        const targetSize = radius * 2.5;
        const scaleFactor = Math.min(targetSize / img.width, targetSize / img.height);
        const w = img.width * scaleFactor;
        const h = img.height * scaleFactor;

        ctx.save();
        if (isHighlighted) {
            ctx.shadowColor = 'rgba(255, 100, 100, 0.8)';
            ctx.shadowBlur = 20;
            // Pop effect
            ctx.translate(x, y);
            ctx.scale(1.1, 1.1);
            ctx.translate(-x, -y);
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowBlur = 10;
        }

        // Draw image opaque
        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, x - w / 2, y - h / 2, w, h);

        ctx.restore();
    } else {
        // Fallback to emoji
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = isHighlighted ? 18 : 10;
        ctx.fillStyle = isHighlighted ? 'rgba(255,140,140,0.9)' : 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 0.95, radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 3 * scale;
        ctx.strokeStyle = isHighlighted ? '#c23b3b' : '#c0c0c0';
        ctx.stroke();

        ctx.font = `${radius * 0.9}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🗑️', x, y);
        ctx.restore();
    }

    // Label
    ctx.save();
    ctx.fillStyle = '#5c4033';
    ctx.font = `bold ${14 * scale}px "Fredoka One"`;
    ctx.textAlign = 'center';
    ctx.fillText('Trash Bin', x, y + radius * 1.2);
    ctx.restore();
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
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    if (!touch) return { x: 0, y: 0 };
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

function isInside(pos, food) {
    const r = food.size / 2;
    return pos.x > food.x - r && pos.x < food.x + r && pos.y > food.y - r && pos.y < food.y + r;
}

function isInTrash(pos) {
    const dx = pos.x - trashBin.x;
    const dy = pos.y - trashBin.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= trashBin.radius * 1.05;
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
    trashBin.isHighlighted = false;
}

function handleMove(e) {
    if (!draggedFood) return;
    e.preventDefault(); // Prevent scrolling
    const pos = getTouchPos(e);
    draggedFood.x = pos.x;
    draggedFood.y = pos.y;
    trashBin.isHighlighted = isInTrash(pos);
}

function handleEnd(e) {
    if (!draggedFood) return;

    const trayTop = height - (trayHeight || height * 0.25);
    const dropPos = { x: draggedFood.x, y: draggedFood.y };

    if (isInTrash(dropPos)) {
        discardFood(draggedFood);
    } else if (dropPos.y < trayTop) {
        // EAT!
        eatFood(draggedFood);
    } else {
        // Drop back to original pos or stay? Let's drop back to tray random pos
        // Animate back would be nice, but instant snap is easier for MVP. 
        // Let's just drop it there? No, it might clutter the face. Snap back to tray.
        if (dropPos.y < trayTop - 0.05 * height) {
            // If dropped in play area but not mouth, fall back down
            draggedFood.y = height - 100 * scale;
        }
    }

    draggedFood.isDragging = false;
    draggedFood = null;
    trashBin.isHighlighted = false;
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

function discardFood(food) {
    const index = foods.indexOf(food);
    if (index > -1) foods.splice(index, 1);

    // Play Sound
    if (sfx.trash) {
        const sounds = sfx.trash;
        const sound = sounds[Math.floor(Math.random() * sounds.length)];
        sound.currentTime = 0;
        sound.play().catch(e => console.warn('SFX Error:', e));
    }

    // Replace discarded food shortly so the tray stays stocked
    setTimeout(spawnFoodItem, 350);
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
