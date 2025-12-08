const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreEl = document.getElementById('score');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Audio
const sliceSound = new Audio('slice.mp3');
sliceSound.preload = 'auto'; // Preload
function playSliceSound() {
    const sound = sliceSound.cloneNode();
    sound.volume = Math.random() * 0.2 + 0.6; // 0.6 - 0.8
    // Pitch shift up to make it sound faster/sharper (0.5x to 1.5x faster than base, so 1.5-2.5x total speed)
    // "chuala" implies a quick heavy slice.
    sound.playbackRate = 1.5 + Math.random() * 0.8;
    // sound.preservesPitch = false; // Not needed for simple Audio, playbackRate affects pitch by default
    sound.play().catch(e => console.log('Audio error:', e));
}

// Game State
let isPlaying = false;
let score = 0;
let animationId;
let fruits = [];
let particles = [];
let trail = [];
let spawnTimer = 0;
let spawnInterval = 30; // Spawns faster (was 60)

// Fruit Configuration
const FRUIT_TYPES = [
    { name: 'Watermelon', emoji: '🍉', color: '#ff5e62', radius: 60, points: 10 },
    { name: 'Orange', emoji: '🍊', color: '#ffa500', radius: 50, points: 20 },
    { name: 'Apple', emoji: '🍎', color: '#ff4d4d', radius: 48, points: 15 },
    { name: 'Banana', emoji: '🍌', color: '#ffe135', radius: 55, points: 20 },
    { name: 'Pineapple', emoji: '🍍', color: '#ffff00', radius: 65, points: 30 },
    { name: 'Mango', emoji: '🥭', color: '#ffcc00', radius: 55, points: 25 },
    { name: 'Strawberry', emoji: '🍓', color: '#ff0000', radius: 45, points: 30 },
    { name: 'Grape', emoji: '🍇', color: '#800080', radius: 45, points: 25 },
    { name: 'Peach', emoji: '🍑', color: '#ffcc99', radius: 50, points: 20 },
    { name: 'Cherry', emoji: '🍒', color: '#cc0000', radius: 40, points: 40 },
    { name: 'Pear', emoji: '🍐', color: '#dbe600', radius: 50, points: 20 },
    { name: 'Kiwi', emoji: '🥝', color: '#8b4513', radius: 45, points: 30 },
    { name: 'Lemon', emoji: '🍋', color: '#fff700', radius: 48, points: 20 },
    { name: 'Coconut', emoji: '🥥', color: '#f0f0f0', radius: 52, points: 25 },
    { name: 'Avocado', emoji: '🥑', color: '#568203', radius: 50, points: 30 },
    { name: 'Melon', emoji: '🍈', color: '#98FB98', radius: 55, points: 25 },
    { name: 'Tangerine', emoji: '🍊', color: '#FFA500', radius: 46, points: 20 },
    { name: 'Green Apple', emoji: '🍏', color: '#7FFF00', radius: 48, points: 15 },
];

const GRAVITY = 0.1; // Reduced gravity (was 0.2)

// Resize handling
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Input Handling
const input = { x: 0, y: 0, isDown: false, px: 0, py: 0 };

function handleInput(x, y) {
    input.px = input.x;
    input.py = input.y;
    input.x = x;
    input.y = y;

    // Add to trail
    trail.push({ x, y, life: 10 });

    if (isPlaying) {
        checkCollisions();
    }
}

window.addEventListener('mousemove', e => handleInput(e.clientX, e.clientY));
window.addEventListener('touchmove', e => {
    e.preventDefault(); // Stop scrolling
    handleInput(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

// Classes
class Fruit {
    constructor() {
        this.type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = canvas.height + 80;

        // Throw towards center slightly
        const centerX = canvas.width / 2;
        const distFromCenter = this.x - centerX;

        this.vx = -distFromCenter * 0.01 + (Math.random() - 0.5) * 2;
        // Slower upward force for kids (was 13-18, now 8-12)
        this.vy = -(Math.random() * 4 + 10);

        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1; // Slower rotation
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        this.rotation += this.rotationSpeed;

        // Deactivate if falls below screen
        if (this.y > canvas.height + 100) {
            this.active = false;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Draw Emoji
        ctx.font = `${this.type.radius * 2}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Adjust text metrics? centering emoji can be tricky across browsers
        // usually middle/center works okay, sometimes offset needed.
        ctx.fillText(this.type.emoji, 0, 10); // +10 for vertical adjustment

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, speed, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * speed;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY * 0.5;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class SlicedPart {
    constructor(fruit, clipRect, generation = 0) {
        this.x = fruit.x;
        this.y = fruit.y;
        this.type = fruit.type;
        this.rotation = fruit.rotation;

        // Base velocity inheritance
        this.vx = fruit.vx;
        this.vy = fruit.vy;

        this.clipRect = clipRect;
        this.generation = generation;
        this.isSliceable = generation < 1; // Limit to 1 additional cut (Total 2 levels of fragmentation)
        this.sliceCooldown = 10; // Frames before this part can be sliced again

        // Calculate center offset of this fragment to modify velocity correctly
        // (Push fragment away from the center of the original fruit)
        const fragmentCenterX = clipRect.x + clipRect.w / 2;
        const fragmentCenterY = clipRect.y + clipRect.h / 2;

        // Apply separation force based on fragment position relative to center
        // Separation strength
        const strength = 1.0 + (generation * 0.5);
        this.vx += (fragmentCenterX * 0.05) * strength;
        this.vy += (fragmentCenterY * 0.05) * strength;

        // Add some random spin
        this.rotationSpeed = fruit.rotationSpeed + (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        this.rotation += this.rotationSpeed;
        if (this.sliceCooldown > 0) this.sliceCooldown--;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // No scaling - we want original size parts
        // ctx.scale(1, 1); 

        // Clip the area based on the rect
        ctx.beginPath();
        ctx.rect(this.clipRect.x, this.clipRect.y, this.clipRect.w, this.clipRect.h);
        ctx.clip();

        // Draw Emoji centered at (0,0) of the original fruit coordinate system
        ctx.font = `${this.type.radius * 2}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.emoji, 0, 10);

        ctx.restore();
    }
}

// Collision Check
function checkCollisions() {
    if (trail.length < 2) return;

    const p1 = { x: input.px, y: input.py };
    const p2 = { x: input.x, y: input.y };

    // Check Fruits
    for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i];
        if (!fruit.active) continue;

        const dist = distToSegment(fruit, p1, p2);
        if (dist < fruit.type.radius * 0.9) {
            sliceFruit(i);
        }
    }

    // Check Sliceable Parts (Slicing slices!)
    for (let i = particles.length - 1; i >= 0; i--) {
        const part = particles[i];
        if (part instanceof SlicedPart && part.isSliceable) {
            // Prevent slicing immediately after spawning
            if (part.sliceCooldown > 0) continue;

            const dist = distToSegment(part, p1, p2);
            // Slightly smaller hit box for parts
            if (dist < part.type.radius * 0.8) {
                slicePart(i);
            }
        }
    }
}

function distToSegment(p, v, w) {
    const l2 = distSq(v, w);
    if (l2 === 0) return distSq(p, v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(distSq(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }));
}

function distSq(v, w) {
    return (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
}

function createSplash(x, y, color, amount = 15, speedMult = 1.0) {
    for (let i = 0; i < amount; i++) {
        const speed = (Math.random() * 8 + 4) * speedMult;
        const size = Math.random() * 8 + 3;
        particles.push(new Particle(x, y, color, speed, size));
    }
}

function sliceFruit(index) {
    const fruit = fruits[index];
    fruit.active = false;
    playSliceSound();

    score += fruit.type.points;

    // Define Clip Rects for Halves
    const r = fruit.type.radius;
    // Padding to ensure full coverage
    const rawSize = r * 1.5;
    const fullHeight = r * 3;

    // Left Half: x from -rawSize to 0
    const leftRect = { x: -rawSize, y: -rawSize, w: rawSize, h: fullHeight };
    // Right Half: x from 0 to rawSize
    const rightRect = { x: 0, y: -rawSize, w: rawSize, h: fullHeight };

    particles.push(new SlicedPart(fruit, leftRect, 0));
    particles.push(new SlicedPart(fruit, rightRect, 0));

    // HUGE Splash for main fruit
    createSplash(fruit.x, fruit.y, fruit.type.color, 25, 1.5);
}

function slicePart(index) {
    const part = particles[index];
    particles.splice(index, 1); // Remove parent part
    playSliceSound();

    score += 5;

    // Split the current clipRect in half vertically (Top/Bottom split)
    const oldRect = part.clipRect;
    const halfHeight = oldRect.h / 2;

    // Top Fragment
    const topRect = {
        x: oldRect.x,
        y: oldRect.y,
        w: oldRect.w,
        h: halfHeight
    };

    // Bottom Fragment
    const bottomRect = {
        x: oldRect.x,
        y: oldRect.y + halfHeight,
        w: oldRect.w,
        h: halfHeight
    };

    const nextGen = part.generation + 1;
    particles.push(new SlicedPart(part, topRect, nextGen));
    particles.push(new SlicedPart(part, bottomRect, nextGen));

    // Splash for part slice
    createSplash(part.x, part.y, part.type.color, 12, 1.0);
}

// Main Loop
function loop() {
    if (!isPlaying) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn Fruits
    spawnTimer++;
    if (spawnTimer > spawnInterval) {
        fruits.push(new Fruit());
        spawnTimer = 0;
        // Keep interval fast for lots of fruits!
        // if (spawnInterval > 20) spawnInterval -= 0.1;
    }

    // Update & Draw Fruits
    for (let i = fruits.length - 1; i >= 0; i--) {
        const f = fruits[i];
        f.update();
        f.draw();

        if (!f.active) {
            fruits.splice(i, 1);
        }
    }

    // Update & Draw Particles (Juice & Slices)
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        // Remove offscreen or dead particles
        if (p.life <= 0 || p.y > canvas.height + 100) {
            particles.splice(i, 1);
        }
    }

    // Draw Trail
    drawTrail();

    // Update Score UI
    scoreEl.innerText = score;

    animationId = requestAnimationFrame(loop);
}

function drawTrail() {
    // Update trail life
    for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].life--;
        if (trail[i].life <= 0) trail.splice(i, 1);
    }

    if (trail.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);

    // Use quadratic curves for smoother trail
    for (let i = 1; i < trail.length - 1; i++) {
        const xc = (trail[i].x + trail[i + 1].x) / 2;
        const yc = (trail[i].y + trail[i + 1].y) / 2;
        ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
    }

    // Connect to the last point
    if (trail.length > 1) {
        ctx.lineTo(trail[trail.length - 1].x, trail[trail.length - 1].y);
    }

    // Blade Style - Rainbow for kids? Or just bright.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#00f2fe';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f2fe';
    ctx.stroke();

    // Inner white core
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.shadowBlur = 0;
}

// Game Control
function startGame() {
    score = 0;
    fruits = [];
    particles = [];
    trail = [];
    isPlaying = true;
    canvas.classList.add('playing');
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    loop();
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Init
resize();
