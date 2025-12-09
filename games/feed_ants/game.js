const canvas = document.getElementById('ant-world');
const ctx = canvas.getContext('2d');
const container = document.getElementById('game-container');

// Game State
let ants = [];
let foods = [];
let bgElements = [];
let draggingFood = null;
let spawnTimer = 0;
const MAX_ANTS = 200;
const SPAWN_RATE = 60;

// Assets
const antSprite = new Image();
antSprite.src = 'ant_walk_sheet_transparent.png';

// BGM handled by shell

// Audio System
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSpawnSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(t + 0.1);
}

function playDropSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(t + 0.1);
}

function playFinishSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.1);

    gain.gain.setValueAtTime(0.08, t); // Reduced volume (was 0.2)
    gain.gain.linearRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(t + 0.2);
}

// Food Types
const FOOD_TYPES = [
    { type: 'apple', emoji: '🍎' },
    { type: 'strawberry', emoji: '🍓' },
    { type: 'cookie', emoji: '🍪' },
    { type: 'cake', emoji: '🍰' },
    { type: 'pizza', emoji: '🍕' },
    { type: 'donut', emoji: '🍩' }
];

// Dimensions
let width, height;

// Resize
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    generateBackground();
}
window.addEventListener('resize', resize);

// Background Generation
function generateBackground() {
    bgElements = [];
    const density = (width * height) / 60000; // Halved density (was 30000)

    // Crushed Stones
    for (let i = 0; i < density * 0.6; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        // Richer size variety: some small (~9px), some big (~60px)
        const size = (3 + Math.random() * 17) * 3;
        const vertices = [];
        const numPoints = 6; // Hexagon-ish irregular
        for (let j = 0; j < numPoints; j++) {
            const angle = (j / numPoints) * Math.PI * 2;
            const r = size * (0.5 + Math.random() * 0.7);
            vertices.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }

        bgElements.push({
            type: 'stone',
            x: x,
            y: y,
            vertices: vertices,
            color: Math.random() > 0.5 ? '#9E9E9E' : '#BCAAA4', // Grey and Light Brown
            alpha: 0.6 + Math.random() * 0.4
        });
    }

    // Weeds / Grass Tuft
    for (let i = 0; i < density; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const blades = [];
        const numBlades = 3 + Math.floor(Math.random() * 3);

        for (let j = 0; j < numBlades; j++) {
            // Randomize blade
            blades.push({
                angle: -Math.PI / 2 + (Math.random() - 0.5) * 1.5,
                length: (12 + Math.random() * 15) * 6, // 6x length (2x of previous)
                curve: (Math.random() - 0.5) * 15
            });
        }

        bgElements.push({
            type: 'weed',
            x: x,
            y: y,
            blades: blades,
            color: Math.random() > 0.5 ? '#558B2F' : '#7CB342' // Green variants
        });
    }
}

// Classes
class Ant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.angle = Math.atan2(this.vy, this.vx);
        this.speed = 1.5 + Math.random();
        this.state = 'wander';
        this.targetFood = null;
        this.size = 12 + Math.random() * 5; // Adjusted size for sprite (was 6-9)
        this.wobble = Math.random() * 100;

        // Animation
        this.totalFrames = 8;
        this.currentFrame = Math.floor(Math.random() * this.totalFrames);
        this.animTimer = 0;
        this.animSpeed = 0.2; // Speed of animation
    }

    updateAndWrap(targetAnts, currentAntCount) {
        let currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        // Update Animation
        this.animTimer += currentSpeed * this.animSpeed;
        if (this.animTimer >= 1) {
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            this.animTimer = 0;
        }

        // State Logic
        let nearestFood = null;
        let minDist = Infinity;

        // Find nearest food
        for (let food of foods) {
            if (food.dragging) continue;
            let dx = food.x - this.x;
            let dy = food.y - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            // Only care about existing food
            if (food.health > 0 && dist < minDist) {
                minDist = dist;
                nearestFood = food;
            }
        }

        // Logic based on state
        if (nearestFood && minDist < 400) {
            this.state = 'seek';
            this.targetFood = nearestFood;

            // Stop distance: interaction radius of food + ant size
            if (minDist < nearestFood.radius + this.size * 0.5 + 2) {
                this.state = 'eat';
            }
        } else {
            this.state = 'wander';
            this.targetFood = null;
        }

        // Movement
        if (this.state === 'eat' && this.targetFood && this.targetFood.health > 0) {
            // Eat logic
            // Face the food
            let dx = this.targetFood.x - this.x;
            let dy = this.targetFood.y - this.y;
            this.angle = Math.atan2(dy, dx);

            // Stop moving substantially
            this.vx = 0;
            this.vy = 0;

            // Damage food
            if (Math.random() < 0.1) { // Faster eating rate
                this.targetFood.health -= 3.0;
            }

        } else if (this.state === 'seek' && this.targetFood && this.targetFood.health > 0) {
            let dx = this.targetFood.x - this.x;
            let dy = this.targetFood.y - this.y;
            let angleToFood = Math.atan2(dy, dx);

            // Turn smoothly towards food
            let angleDiff = angleToFood - this.angle;
            // Normalize angleDiff
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            this.angle += angleDiff * 0.1;

            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;

        } else {
            // Wander
            this.state = 'wander';
            this.wobble += 0.05;
            let wanderAngle = Math.sin(this.wobble) * 0.5;
            this.angle += (Math.random() - 0.5) * 0.2 + wanderAngle * 0.05;

            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
        }

        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;

        // Bounce/Wrap logic
        // Only wrap if we are within population limits
        const shouldWrap = currentAntCount <= targetAnts;

        if (this.x < -50) {
            if (shouldWrap) this.x = width + 50;
        } else if (this.x > width + 50) {
            if (shouldWrap) this.x = -50;
        }

        if (this.y < -50) {
            if (shouldWrap) this.y = height + 50;
        } else if (this.y > height + 50) {
            if (shouldWrap) this.y = -50;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Rotation
        // Assuming sprite faces RIGHT (0 rad).
        ctx.rotate(this.angle);

        // Draw Sprite
        // Assuming 4x4 Grid (Standard DALL-E Square Sprite Sheet)
        // Cols: 4, Rows: 4. Frame size 256x256.
        // We use first 8 frames (Run 0..7).

        const cols = 4;
        const rows = 4; // 1024 / 256 = 4
        const col = this.currentFrame % cols;
        const row = Math.floor(this.currentFrame / cols);

        const sheetW = 1024;
        const sheetH = 1024;
        const frameW = sheetW / cols; // 256
        const frameH = sheetH / rows; // 256

        // Draw centered
        const drawSize = this.size * 6; // slightly larger to account for whitespace in sprite

        if (antSprite.complete) {
            ctx.drawImage(
                antSprite,
                col * frameW, row * frameH, frameW, frameH,
                -drawSize / 2, -drawSize / 2, drawSize, drawSize
            );
        } else {
            // Fallback
            ctx.fillStyle = '#5D4037';
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Food {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.maxHealth = 400;
        this.health = this.maxHealth;
        this.baseRadius = 40; // Increased base size (was 25)
        this.radius = this.baseRadius;
        this.dragging = false;

        // Determine color/emoji
        this.emoji = '';
        const foodType = FOOD_TYPES.find(f => f.type === type);
        if (foodType) {
            this.emoji = foodType.emoji;
        } else {
            this.emoji = '🍎';
        }
    }

    update() {
        // Shrink based on health
        let healthPct = Math.max(0, this.health / this.maxHealth);
        this.radius = this.baseRadius * (0.4 + 0.6 * healthPct);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.4, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Emoji
        // RESET styles to ensure emoji isn't transparent
        ctx.fillStyle = '#000000';
        ctx.font = `${this.radius * 2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(this.emoji, 0, 0);

        ctx.restore();
    }
}

// Input Handling
function getPos(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.changedTouches && e.changedTouches.length > 0) { // For touchend
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function handleStart(e) {
    const pos = getPos(e);

    // Check if touching existing food (Game world)
    for (let i = foods.length - 1; i >= 0; i--) {
        let f = foods[i];
        let dx = pos.x - f.x;
        let dy = pos.y - f.y;
        if (dx * dx + dy * dy < (f.radius + 20) * (f.radius + 20)) {
            e.preventDefault();
            f.dragging = true;
            draggingFood = f;

            // Move to end of array so it draws on top
            foods.splice(i, 1);
            foods.push(f);

            return;
        }
    }
}

function handleMove(e) {
    if (draggingFood) {
        e.preventDefault();
        const pos = getPos(e);
        draggingFood.x = pos.x;
        draggingFood.y = pos.y;
    }
}

function handleEnd(e) {
    if (draggingFood) {
        draggingFood.dragging = false;
        draggingFood = null;
        playDropSound();
    }
}

// Spawner
function spawnAnts(targetAnts) {
    if (ants.length < targetAnts) {
        let edge = Math.floor(Math.random() * 4);
        let x, y;
        switch (edge) {
            case 0: x = Math.random() * width; y = -20; break;
            case 1: x = width + 20; y = Math.random() * height; break;
            case 2: x = Math.random() * width; y = height + 20; break;
            case 3: x = -20; y = Math.random() * height; break;
        }
        ants.push(new Ant(x, y));
    }
}

function trySpawnFood() {
    // Disable automatic spawning to rely on manual feeding
    if (foods.length === 0 && Math.random() < 0.005) {
        // Very rare auto-spawn if empty, just in case
        // spawnRandomFood();
    }
}

function spawnRandomFood() {
    const margin = 50;
    const x = margin + Math.random() * (width - margin * 2);
    const y = margin + Math.random() * (height - margin * 2);

    const randomType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];

    foods.push(new Food(x, y, randomType.type));
}

// Main Loop
function loop() {
    ctx.clearRect(0, 0, width, height);

    // Draw Background Elements
    bgElements.forEach(el => {
        ctx.save();
        ctx.translate(el.x, el.y);

        if (el.type === 'stone') {
            ctx.fillStyle = el.color;
            ctx.globalAlpha = el.alpha || 1;
            ctx.beginPath();
            if (el.vertices && el.vertices.length > 0) {
                ctx.moveTo(el.vertices[0].x, el.vertices[0].y);
                for (let i = 1; i < el.vertices.length; i++) {
                    ctx.lineTo(el.vertices[i].x, el.vertices[i].y);
                }
            }
            ctx.closePath();
            ctx.fill();

            // Subtle detail for stone (a crack or light)
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            // Just a small highlight on one vertex
            if (el.vertices && el.vertices.length > 0) {
                ctx.arc(el.vertices[0].x * 0.5, el.vertices[0].y * 0.5, 2, 0, Math.PI * 2);
            }
            ctx.fill();

        } else if (el.type === 'weed') {
            ctx.strokeStyle = el.color;
            ctx.lineWidth = 12; // 6x thickness
            ctx.lineCap = 'round';
            el.blades.forEach(blade => {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                // Quadratic curve for bent grass
                const endX = Math.cos(blade.angle) * blade.length;
                const endY = Math.sin(blade.angle) * blade.length;
                const cpX = Math.cos(blade.angle + 0.2) * (blade.length * 0.5) + blade.curve;
                const cpY = Math.sin(blade.angle + 0.2) * (blade.length * 0.5);
                ctx.quadraticCurveTo(cpX, cpY, endX, endY);
                ctx.stroke();
            });
        }

        ctx.restore();
    });

    // Spawn Food
    trySpawnFood();

    // Update & Draw Foods
    // Check for consumed food
    foods.forEach(f => {
        if (f.health <= 0) playFinishSound();
    });
    foods = foods.filter(f => f.health > 0);
    foods.forEach(f => {
        f.update();
        f.draw(ctx);
    });

    // Calculate Target Ants
    let totalFoodHealth = foods.reduce((sum, f) => sum + f.health, 0);

    // Ambient ants (fluctuate between 0 and 5 over time)
    const time = Date.now() / 5000; // Slow fluctuation
    const ambientAnts = Math.floor(Math.abs(Math.sin(time)) * 6);

    // Positive correlation: 0 food = 0 ants. 1 food unit (~400 health) approx 15-20 ants.
    let targetAnts = Math.floor(totalFoodHealth / 20) + ambientAnts;
    if (targetAnts > MAX_ANTS) targetAnts = MAX_ANTS;

    // Spawn Logic
    spawnTimer++;
    if (spawnTimer > SPAWN_RATE) {
        // Only spawn if below target
        if (ants.length < targetAnts) {
            spawnAnts(targetAnts);
        }
        spawnTimer = 0;
    }

    // Update & Draw Ants
    // we iterate backwards or use filter to safely remove
    for (let i = ants.length - 1; i >= 0; i--) {
        let ant = ants[i];

        // Custom update with external logic for wrapping
        ant.updateAndWrap(targetAnts, ants.length);

        // Remove if far off screen (failed to wrap)
        if (ant.x < -150 || ant.x > width + 150 || ant.y < -150 || ant.y > height + 150) {
            ants.splice(i, 1);
            continue;
        }

        ant.draw(ctx);
    }

    requestAnimationFrame(loop);
}

// Init
canvas.addEventListener('mousedown', handleStart);
window.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', handleStart, { passive: false });
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', handleEnd);

// UI Handling
function setupUI() {
    const items = document.querySelectorAll('.food-item');
    items.forEach(item => {
        const startDrag = (e) => {
            e.preventDefault(); // Prevent text selection / scrolling
            const type = item.getAttribute('data-type');

            // Get position
            let pos = { x: 0, y: 0 };
            if (e.touches && e.touches.length > 0) {
                pos.x = e.touches[0].clientX;
                pos.y = e.touches[0].clientY;
            } else {
                pos.x = e.clientX;
                pos.y = e.clientY;
            }

            // Create new food
            const newFood = new Food(pos.x, pos.y, type);
            newFood.dragging = true;
            foods.push(newFood);
            draggingFood = newFood;
            playSpawnSound();
        };

        item.addEventListener('mousedown', startDrag);
        item.addEventListener('touchstart', startDrag, { passive: false });
    });
}

setupUI();

resize();
// Spawn initial food
for (let i = 0; i < 3; i++) spawnRandomFood();
loop();
