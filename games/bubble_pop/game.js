const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');

let score = 0;
let isPlaying = false;
let bubbles = [];
let particles = [];
let lastTime = 0;

// Resize canvas
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Game Configuration
const GRAVITY = 0.2; // For particles
const BUBBLE_SPAWN_Rate = 300; // ms
let lastSpawnTime = 0;

class Bubble {
    constructor() {
        // Spawn from the right side, somewhat randomly vertically but clustered
        // Assuming character is on right.
        this.x = canvas.width + 50;

        // Approximate mouth position: 70-90% height from top? No, usually 40-70%.
        // Let's randomize it a bit around typical mouth height
        this.y = canvas.height * 0.5 + (Math.random() * 200 - 100);

        // Size
        this.r = 20 + Math.random() * 30; // 20-50px radius

        // Movement
        this.speedX = -(1 + Math.random() * 2); // Moving left
        this.speedY = (Math.random() - 0.5) * 1; // Slight vertical drift

        // Oscillation for "wobble"
        this.angle = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.05 + Math.random() * 0.05;
        this.wobbleAmp = 0.5 + Math.random() * 1;

        // Visuals
        this.color = `hsla(${Math.random() * 360}, 70%, 70%, 0.3)`;
        this.markedForDeletion = false;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY + Math.sin(this.angle) * this.wobbleAmp;
        this.angle += this.wobbleSpeed;

        // Remove if off screen
        if (this.x + this.r < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);

        // Bubble Gradient
        // Inner transparent, outer rim
        let gradient = ctx.createRadialGradient(
            this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.1,
            this.x, this.y, this.r
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.6)');

        ctx.fillStyle = gradient;
        ctx.fill();

        // Rim stroke
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Specular highlight (the shine)
        ctx.beginPath();
        ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1; // opacity
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = Math.random() * 3 + 2;
        this.color = '200, 230, 255'; // Light blueish
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${this.color})`;
        ctx.fill();
        ctx.restore();
    }
}

// Interaction
let isPointerDown = false;
let pointerX = 0;
let pointerY = 0;

function handleStart(e) {
    isPointerDown = true;
    updatePointer(e);
    checkCollision();
}

function handleMove(e) {
    updatePointer(e);
    if (isPointerDown) {
        checkCollision();
    }
}

function handleEnd() {
    isPointerDown = false;
}

function updatePointer(e) {
    if (e.touches) {
        pointerX = e.touches[0].clientX;
        pointerY = e.touches[0].clientY;
    } else {
        pointerX = e.clientX;
        pointerY = e.clientY;
    }
}

function checkCollision() {
    if (!isPlaying) return;

    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(b.x - pointerX, b.y - pointerY);
        if (dist < b.r + 10) { // Slight buffer for easier popping
            popBubble(b);
            bubbles.splice(i, 1);
        }
    }
}

function popBubble(b) {
    score++;
    scoreEl.innerText = score;

    // Create particles
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(b.x, b.y));
    }

    // Play sound? (Optional, unimplemented for now as requested)
}

// Event Listeners
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleStart(e); }, { passive: false });

canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });

canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('touchend', handleEnd);

function animate(timestamp) {
    if (!isPlaying) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn Bubbles
    if (timestamp - lastSpawnTime > BUBBLE_SPAWN_Rate) {
        bubbles.push(new Bubble());
        lastSpawnTime = timestamp;
    }

    // Update & Draw Bubbles
    bubbles = bubbles.filter(b => !b.markedForDeletion);
    bubbles.forEach(b => {
        b.update();
        b.draw(ctx);
    });

    // Update & Draw Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    requestAnimationFrame(animate);
}

function startGame() {
    isPlaying = true;
    score = 0;
    scoreEl.innerText = score;
    bubbles = [];
    particles = [];
    startScreen.style.display = 'none';
    lastTime = performance.now();
    requestAnimationFrame(animate);
}

startBtn.addEventListener('click', startGame);

// Pre-spawn some bubbles so the screen isn't empty
function init() {
    // Generate background bubbles? No, wait for play.
    resize();
}

init();

