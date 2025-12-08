const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let isPlaying = false;
let balloons = [];
let particles = [];
let animationId;
let spawnTimer;

// Resize canvas
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Colors for balloons
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43', '#A8D8EA', '#AA96DA', '#FCBAD3', '#FFFFD2'];

class Balloon {
    constructor() {
        this.radius = Math.random() * 30 + 40; // 40-70px radius
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = canvas.height + this.radius;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.speedY = Math.random() * 2 + 1; // 1-3 px/frame
        this.speedX = (Math.random() - 0.5) * 1; // Slight horizontal drift
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
    }

    update() {
        this.y -= this.speedY;
        this.x += Math.sin(this.wobble) * 1;
        this.wobble += this.wobbleSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Balloon body
        ctx.beginPath();
        ctx.scale(0.8, 1); // Oval shape
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Shine/Reflection
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        ctx.restore();

        // String
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.radius);
        ctx.lineTo(this.x, this.y + this.radius + 40);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    isOffScreen() {
        return this.y < -this.radius - 50;
    }
}

class Ribbon {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 15 + 5; // Fast fly out
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.w = Math.random() * 6 + 4;
        this.h = Math.random() * 20 + 10;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.4;
        this.life = 1.0;
        this.decay = Math.random() * 0.015 + 0.005;
        this.gravity = 0.15;
        this.drag = 0.96; // Air resistance
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.rotation += this.rotationSpeed;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, isBird = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isBird = isBird;

        if (this.isBird) {
            this.size = 24;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            // Exaggerated explosion: larger and faster
            this.size = Math.random() * 12 + 6; // Bigger squares
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 15 + 5; // Much faster throw
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }

        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.gravity = 0.15;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        if (this.isBird) {
            ctx.font = '24px Arial';
            ctx.fillText('🐦', this.x, this.y);
        } else {
            ctx.translate(this.x, this.y);
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        ctx.restore();
    }
}

// Sound Effects using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playPopSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function spawnBalloon() {
    if (!isPlaying) return;
    balloons.push(new Balloon());
    // Spawn faster as score increases, but cap it
    let spawnRate = Math.max(500, 2000 - score * 10);
    spawnTimer = setTimeout(spawnBalloon, Math.random() * 1000 + 500);
}

function update() {
    if (!isPlaying) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw balloons
    for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        b.update();
        b.draw();
        if (b.isOffScreen()) {
            balloons.splice(i, 1);
            // Optional: Game Over if missed? Or just happy endless play?
            // User said "Baby", usually endless is better, but Fruit Slice has Game Over.
            // Let's keep it endless/relaxed or maybe loose a life? 
            // "Baby just needs to touch it". Let's not punish for missing, just keep going.
            // But to make it a "game", maybe track missed? 
            // For toddlers, usually no failure state is better. 
            // I'll leave it as endless for now, but UI has "Game Over". 
            // Maybe I'll add a timer? Or just let them play until they hit 'back'.
            // Actually the fruit game has lives. Let's make this one relaxed.
        }
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    animationId = requestAnimationFrame(update);
}

function popBalloon(x, y) {
    for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        const dx = x - b.x;
        const dy = y - (b.y + b.radius * 0.1); // center correction for oval
        // Approximate collision check
        if (dx * dx + dy * dy < (b.radius + 10) * (b.radius + 10)) {
            // Pop!
            playPopSound();
            createExplosion(b.x, b.y, b.color);
            balloons.splice(i, 1);
            score++;
            document.getElementById('score').innerText = score;
            return; // only pop one per touch? or mult-pop? let's pop one highest one (last drawn is top)
        }
    }
}

function createExplosion(x, y, color) {
    // 1. Standard Particles (Body of explosion)
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y, color));
    }

    // 2. White/Gold Sparkles
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(x, y, ['#FFF', '#FFD700'][Math.floor(Math.random() * 2)]));
    }

    // 3. Ribbons (Confetti) - Same color as balloon
    for (let i = 0; i < 12; i++) {
        particles.push(new Ribbon(x, y, color));
    }

    // 4. Ribbons (Confetti) - Random festive colors
    for (let i = 0; i < 8; i++) {
        particles.push(new Ribbon(x, y, COLORS[Math.floor(Math.random() * COLORS.length)]));
    }

    // Bird chance
    if (Math.random() < 0.3) { // 30% chance for bird
        particles.push(new Particle(x, y, null, true));
    }
}

// Input handling
let isMouseDown = false;
canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    popBalloon(e.clientX, e.clientY);
});
canvas.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
        popBalloon(e.clientX, e.clientY);
    }
});
canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

// Touch handling
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
        popBalloon(e.touches[i].clientX, e.touches[i].clientY);
    }
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (let i = 0; i < e.touches.length; i++) {
        popBalloon(e.touches[i].clientX, e.touches[i].clientY);
    }
}, { passive: false });


// Game State Management
function startGame() {
    isPlaying = true;
    score = 0;
    balloons = [];
    particles = [];
    document.getElementById('score').innerText = score;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    if (audioCtx.state === 'suspended') audioCtx.resume();

    spawnBalloon();
    update();
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
