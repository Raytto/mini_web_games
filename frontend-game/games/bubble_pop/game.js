const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const resourceLoader = document.getElementById('resource-loader');

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

// Audio (BGM in Shell)

// Game Configuration
const GRAVITY = 0.2; // For particles
const BUBBLE_SPAWN_Rate = 300; // ms
let lastSpawnTime = 0;

class Bubble {
    constructor() {
        // Spawn from the right side, somewhat randomly vertically but clustered
        this.x = canvas.width + 50;

        // Approximate mouth position area
        const mouthBand = canvas.height * 0.55 + (Math.random() * 240 - 120);

        // Size: mix of tiny, mid, and oversized bubbles for more variance
        const sizeRoll = Math.random();
        if (sizeRoll < 0.2) {
            this.r = 14 + Math.random() * 12; // 14-26px radius
        } else if (sizeRoll > 0.85) {
            this.r = 80 + Math.random() * 50; // 80-130px radius
        } else {
            this.r = 35 + Math.random() * 45; // 35-80px radius
        }

        // Keep bubbles on-screen even when large
        const safeMargin = this.r + 12;
        this.y = Math.min(canvas.height - safeMargin, Math.max(safeMargin, mouthBand));

        // Movement - VARIETY of SPEEDS
        this.speedX = -(0.2 + Math.random() * 0.6); // Very slow range: -0.2 to -0.8
        this.speedY = (Math.random() - 0.5) * 0.3; // Gentle vertical drift

        // Oscillation for "wobble" (Composed of two sine waves for irregularity)
        this.angle = Math.random() * Math.PI * 2;
        this.angle2 = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.005 + Math.random() * 0.02; // Slower wobble
        this.wobbleSpeed2 = 0.01 + Math.random() * 0.03;
        this.wobbleAmp = 1.0 + Math.random() * 2.0;

        // Extra randomness in path (turbulence)
        this.wanderStrength = 0.02 + Math.random() * 0.05;

        // Visuals - VIBRANT COLORS
        this.hue = Math.floor(Math.random() * 360);
        this.markedForDeletion = false;
    }

    update() {
        // Random walk on vertical speed to keep trajectories varied
        this.speedY += (Math.random() - 0.5) * this.wanderStrength;
        this.speedY *= 0.99; // Slight damping
        this.speedY = Math.max(-0.8, Math.min(0.8, this.speedY)); // Cap vertical speed strictly

        // Randomize horizontal speed slightly (wind gusts)
        this.speedX += (Math.random() - 0.5) * 0.02;
        this.speedX = Math.max(-1.0, Math.min(-0.15, this.speedX)); // Cap horizontal speed strictly

        this.x += this.speedX;

        // Composite wobble
        const wobble = Math.sin(this.angle) * this.wobbleAmp + Math.sin(this.angle2) * (this.wobbleAmp * 0.6);
        this.y += this.speedY + wobble;

        this.angle += this.wobbleSpeed;
        this.angle2 += this.wobbleSpeed2;

        // Remove if off screen
        if (this.x + this.r + 50 < 0) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);

        // Bubble Gradient - VIBRANT AND CLEAR
        // Center highlight to colored rim
        let gradient = ctx.createRadialGradient(
            this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.1,
            this.x, this.y, this.r
        );

        // Shiny white highlight
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 95%, 0.9)`);
        // Vibrant body color
        gradient.addColorStop(0.4, `hsla(${this.hue}, 80%, 70%, 0.5)`);
        // Darker, rich rim
        gradient.addColorStop(1, `hsla(${this.hue}, 90%, 45%, 0.9)`);

        ctx.fillStyle = gradient;
        ctx.fill();

        // Rim stroke
        ctx.strokeStyle = `hsla(${this.hue}, 100%, 90%, 0.8)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Specular highlight (the shine)
        ctx.beginPath();
        ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        // Secondary small highlight
        ctx.beginPath();
        ctx.arc(this.x + this.r * 0.4, this.y + this.r * 0.4, this.r * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        // Increase velocity slightly for more "scattering" effect
        this.vx = (Math.random() - 0.5) * 15;
        this.vy = (Math.random() - 0.5) * 15;
        this.life = 1; // opacity
        this.decay = 0.015 + Math.random() * 0.03; // Last slightly longer
        this.size = Math.random() * 4 + 3; // Slightly larger

        // Use passed hue or random fall back (though hue should always be passed now)
        const finalHue = (hue !== undefined) ? hue : Math.floor(Math.random() * 360);
        this.color = `hsl(${finalHue}, 100%, 60%)`;
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
        ctx.fillStyle = this.color;
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
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(b.x, b.y, b.hue));
    }

    // Play sound
    playPopSound();
}

// Audio Context for procedural sounds
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function unlockAudio() {
    if (!audioCtx) initAudio();

    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            if (resourceLoader) resourceLoader.classList.add('hidden');
            ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'].forEach(evt => {
                window.removeEventListener(evt, unlockAudio);
            });
        }).catch(e => console.error(e));
    } else {
        if (resourceLoader) resourceLoader.classList.add('hidden');
    }
}

// Bind listeners to unlock audio on first interaction
['touchstart', 'touchend', 'mousedown', 'keydown', 'click'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { passive: true });
});

function playPopSound() {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type = 'sine';

    // Frequency sweep for "pop" effect
    const freqCheck = Math.random() * 200 + 600; // Vary slightly
    osc.frequency.setValueAtTime(freqCheck, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

    // Volume envelope
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
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
    initAudio();
    isPlaying = true;
    score = 0;
    scoreEl.innerText = score;
    bubbles = [];
    particles = [];
    if (startScreen) startScreen.style.display = 'none';
    lastTime = performance.now();
    requestAnimationFrame(animate);
}

// startBtn.addEventListener('click', startGame);

// Pre-spawn some bubbles so the screen isn't empty
function init() {
    // Generate background bubbles? No, wait for play.
    resize();
    startGame();
}

init();
