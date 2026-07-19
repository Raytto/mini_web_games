const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
const MAX_PARTICLES = 600; // Limit maximum number of particles
let particles = [];
let hue = 0;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let goalTargets = [];
const GOAL_TARGET_COUNT = 4;

// Resize handling
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    createGoalTargets();
}

window.addEventListener('resize', resize);
resize();

// Particle Class
class Particle {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        // Random spread
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.hue = hue;
        this.life = 100; // 100% life
        this.decay = Math.random() * 1.5 + 0.5; // decay rate
        this.size = Math.random() * 15 + 5;
        this.type = Math.random() > 0.9 ? 'star' : 'circle'; // 10% chance to be a star
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.rotation += this.rotationSpeed;

        // Gravity/Float effect
        this.vy -= 0.02; // Slight float up
        this.vx *= 0.98; // Friction
        this.vy *= 0.98;

        if (this.size > 0.2) this.size -= 0.1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const alpha = this.life / 100;
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = `hsl(${this.hue}, 100%, 60%)`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;

        if (this.type === 'star') {
            this.drawStar(ctx, 0, 0, 5, this.size, this.size / 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}

// Sparkle/Burst Class (for release effect)
class StarBurst {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        this.hue = hue;
        this.life = 100;
        this.particles = [];
        this.initParticles();
    }

    initParticles() {
        // Create a burst of stars
        for (let i = 0; i < 8; i++) {
            const p = new Particle(this.x, this.y, this.hue);
            p.type = 'star';
            p.vx *= 2; // Explode faster
            p.vy *= 2;
            p.size += 5; // Bigger
            this.particles.push(p);
        }
    }

    update() {
        this.particles.forEach((p, index) => {
            p.update();
            if (p.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
        if (this.particles.length === 0) this.life = 0;
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}


// Input Handling
function startDrawing(e) {
    isDrawing = true;
    const { x, y } = getPos(e);
    lastX = x;
    lastY = y;
    createParticles(x, y); // Initial burst
}

function stopDrawing(e) {
    if (!isDrawing) return;
    isDrawing = false;

    // Spawn a "cute shape" (Star Burst) at the end position
    const { x, y } = getPos(e); // Note: touchend might not have clientX/Y directly if not carefully handled, but we use last known usually.
    // For touchend, use lastX/lastY
    if (e.type === 'touchend') {
        particles.push(new StarBurst(lastX, lastY, hue));
    } else {
        particles.push(new StarBurst(x, y, hue));
    }
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling

    const { x, y } = getPos(e);

    // Distance check to avoid too many particles on same spot
    const dx = x - lastX;
    const dy = y - lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) {
        createParticles(x, y);
        checkGoalTargets(x, y);
        // Add interpolated particles for smooth lines
        const steps = Math.min(distance / 5, 20); // Cap steps
        for (let i = 1; i < steps; i++) {
            const interpX = lastX + (dx * (i / steps));
            const interpY = lastY + (dy * (i / steps));
            if (Math.random() > 0.5) createParticles(interpX, interpY, 1); // Less density for interp
        }
    }

    lastX = x;
    lastY = y;

    hue += 2; // Cycle colors
}

function getPos(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function createParticles(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, hue));
    }
}

function createGoalTargets() {
    if (!width || !height) return;
    goalTargets = [];
    const marginX = Math.max(70, width * 0.15);
    const marginY = Math.max(90, height * 0.18);
    const minDistance = Math.min(130, Math.max(92, Math.min(width, height) * 0.24));
    for (let i = 0; i < GOAL_TARGET_COUNT; i++) {
        let x;
        let y;
        let attempts = 0;
        do {
            x = marginX + Math.random() * Math.max(1, width - marginX * 2);
            y = marginY + Math.random() * Math.max(1, height - marginY * 2);
            attempts++;
        } while (
            attempts < 80 &&
            goalTargets.some(target => Math.hypot(target.x - x, target.y - y) < minDistance)
        );

        goalTargets.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            done: false
        });
    }
}

function checkGoalTargets(x, y) {
    let completed = 0;
    goalTargets.forEach(target => {
        if (!target.done && Math.hypot(target.x - x, target.y - y) < 58) {
            target.done = true;
            particles.push(new StarBurst(target.x, target.y, hue + 60));
        }
        if (target.done) completed++;
    });
    if (completed === goalTargets.length) {
        setTimeout(createGoalTargets, 650);
    }
}

function drawGoalTargets() {
    const now = performance.now();
    goalTargets.forEach(target => {
        const pulse = Math.sin(now / 420 + target.phase);
        const starRadius = target.done ? 27 : 23 + pulse * 1.5;

        ctx.save();
        ctx.translate(target.x, target.y);

        // A soft ring makes untouched targets visible even near the screen edges.
        ctx.globalAlpha = target.done ? 0.25 : 0.42 + pulse * 0.08;
        ctx.strokeStyle = target.done ? '#fff59d' : '#80d8ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, starRadius + 12 + pulse * 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.fillStyle = target.done ? '#ffd740' : '#fff4a8';
        ctx.strokeStyle = target.done ? '#fff59d' : '#ffca45';
        ctx.lineWidth = 3;
        ctx.shadowBlur = target.done ? 28 : 22 + pulse * 4;
        ctx.shadowColor = target.done ? '#fff176' : '#ffd54f';
        drawTargetStar(starRadius);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(-starRadius * 0.22, -starRadius * 0.27, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawTargetStar(outerRadius) {
    const innerRadius = outerRadius * 0.46;
    ctx.beginPath();
    for (let point = 0; point < 10; point++) {
        const radius = point % 2 === 0 ? outerRadius : innerRadius;
        const angle = -Math.PI / 2 + point * Math.PI / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (point === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

// Event Listeners
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing, { passive: false });
canvas.addEventListener('touchmove', draw, { passive: false });
canvas.addEventListener('touchend', stopDrawing);

// Animation Loop
function animate() {
    // Soft trails: clear with slight opacity
    ctx.fillStyle = 'rgba(10, 10, 26, 0.2)'; // Match background but transparent
    ctx.fillRect(0, 0, width, height);

    // Note: To make "disappear softy", the clearRect opacity determines trail length.
    // But since we use an object-based particle system, we should clear fully and redraw particles.
    // HOWEVER, user wants "lines disappear softy".
    // If I use clearRect(0,0,w,h) completely, I rely solely on particles.
    // Let's try full clear + particles. It looks cleaner and more magical ("glittery").

    ctx.clearRect(0, 0, width, height);
    drawGoalTargets();

    // Enforce particle limit
    while (particles.length > MAX_PARTICLES) {
        particles.shift(); // Use shift() to remove from the start (oldest)
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }

    requestAnimationFrame(animate);
}

animate();
