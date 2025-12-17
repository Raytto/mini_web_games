const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// Back button is now an anchor tag, no JS needed
const tutorialOverlay = document.getElementById('tutorial-overlay');
const celebrationOverlay = document.getElementById('celebration-overlay');

let width, height;
let trackPoints = [];
let carPosition = { x: 0, y: 0, angle: 0 };
let carProgressIndex = 0; // Index in trackPoints
let isDragging = false;
let carImage = new Image();
let isGameWon = false;
let particles = [];
let lastTime = 0;
let currentTheme = 'grass';

// Configuration
// Configuration
let roadWidth, borderWidth, magnetDistance;
const SNAP_SEARCH_RANGE = 50; // How many points ahead to search (prevents jumping)
let scale = 1;

const BASE_WIDTH = 140;
const BASE_BORDER = 170;
const BASE_MAGNET = 100;
const BASE_CAR_WIDTH = 135;
const BASE_HIT_RADIUS = 120;


const THEMES = {
    grass: {
        bg: '#a8e6cf',
        road: '#f0f0f0',
        border: '#5c5c5c',
        centerLine: '#a0a0a0',
        decor: '🌲'
    },
    desert: {
        bg: '#f4e1d2', // Sand color
        road: '#e6cfbd', // Lighter sand
        border: '#8d6e63', // Brown
        centerLine: '#bcaaa4',
        decor: '🌵'
    },
    snow: {
        bg: '#e3f2fd', // Ice blue
        road: '#ffffff', // White
        border: '#90a4ae', // Blue grey
        centerLine: '#cfd8dc',
        decor: '⛄'
    }
};

// Asset Loading
carImage.src = 'assets/car.png?v=' + new Date().getTime();
carImage.onload = () => {
    // We'll start the game loop once the image is loaded, 
    // but the resize/init can happen before.
    requestAnimationFrame(gameLoop);
};

// Navigation
// backBtn handled via basic href in HTML code now

const nextLevelBtn = document.getElementById('next-level-btn');

nextLevelBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent canvas click
    resetGame();
});

// Audio Logic
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let honkInterval = null;


let honkBuffer = null;

// Preload audio
function loadAudioBuffer() {
    if (!audioCtx) audioCtx = new AudioContext();
    fetch('assets/double-car-horn.mp3')
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(decodedBuffer => {
            honkBuffer = decodedBuffer;
        })
        .catch(e => console.error("Error loading audio:", e));
}

// Initialize audio context and load sound if not already loaded
function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
        loadAudioBuffer();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Play the loaded buffer
let lastHonkTime = 0;

// Play the loaded buffer
function playHonk() {
    if (!audioCtx || !honkBuffer) return;

    const now = Date.now();
    if (now - lastHonkTime < 2000) return;
    lastHonkTime = now;

    const source = audioCtx.createBufferSource();
    source.buffer = honkBuffer;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.5; // Adjust volume if needed

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    source.start(0);
}
// Start loading immediately so it's ready
try {
    window.addEventListener('load', () => {
        // Create context on user interaction usually, but we can setup the fetch
        // We can't decode without context.
        // Let's wait for first interaction for full init, or just fetch raw data now?
        // Simpler: Just rely on initAudio called on mousedown/touchstart.
        // But delay might be noticeable on first honk.
        // Let's try to init audio context (suspended) and load data on script execution if possible, 
        // but 'new AudioContext' is allowed.
        if (!audioCtx) {
            audioCtx = new AudioContext();
            loadAudioBuffer();
        }
    });
} catch (e) { console.log(e); }

function startHonkingOp() {
    if (honkInterval) return;
    initAudio();
    // Play immediately one distinct 'Di'
    playHonk();

    // Loop for "Di... Di..." every ~400ms while moving? 
    // "DiDiDi" suggests a triplet or fast sequence.
    // Let's just play a rhythmic pulse sound.
    honkInterval = setInterval(() => {
        // Check if we are still dragging (moved recently?)
        // Ideally only honk if moving.
        playHonk();
    }, 400);
}

function stopHonkingOp() {
    if (honkInterval) {
        clearInterval(honkInterval);
        honkInterval = null;
    }
}

// Resize Handling
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Calculate scale reference: 800px width or height
    // Use the smaller dimension to prevent elements from vanishing on very narrow screens,
    // but typically width is the constraint on mobile portrait.
    const refDimension = 800;
    scale = Math.min(width, height) / refDimension;

    // Clamp scale reasonable limits if needed, but linear ref scaling usually works best for "zoom" feel
    scale = Math.max(0.4, Math.min(2.0, scale));

    roadWidth = BASE_WIDTH * scale;
    borderWidth = BASE_BORDER * scale;
    magnetDistance = BASE_MAGNET * scale;

    generateTrack();
}

window.addEventListener('resize', resize);

// Input Handling
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('touchstart', handleStart, { passive: false });
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('touchmove', handleMove, { passive: false });
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('touchend', handleEnd);

function getPos(e) {
    if (e.touches) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function handleStart(e) {
    initAudio();
    if (isGameWon) {
        return;
    }
    e.preventDefault();
    const pos = getPos(e);
    const dx = pos.x - carPosition.x;
    const dy = pos.y - carPosition.y;
    // Increased hit area (scaled)
    if (Math.hypot(dx, dy) < BASE_HIT_RADIUS * scale) {
        isDragging = true;
        tutorialOverlay.style.display = 'none';
        startHonkingOp();
    }
}

function handleMove(e) {
    if (!isDragging || isGameWon) return;
    e.preventDefault();
    const pos = getPos(e);

    // Find closest point on track relative to current position
    // We only look ahead a bit to prevent cheating/jumping
    let bestDist = Infinity;
    let bestIndex = -1;

    // Search window: Look 10 points behind and 50 points ahead (scaled by track length)
    // Actually, just search all points but penalize distance by index difference?
    // No, searching a window is safer for "Path Following".

    const startIndex = Math.max(0, carProgressIndex - 10);
    const endIndex = Math.min(trackPoints.length - 1, carProgressIndex + 100);

    for (let i = startIndex; i <= endIndex; i++) {
        const p = trackPoints[i];
        const dist = Math.hypot(pos.x - p.x, pos.y - p.y);

        // Check if this point is physically close to cursor
        if (dist < magnetDistance) {
            // We want the point closest to the cursor, 
            // BUT we want to ensure we are progressing or staying put, not jumping wildy.
            if (dist < bestDist) {
                bestDist = dist;
                bestIndex = i;
            }
        }
    }

    if (bestIndex !== -1) {
        // Only if we actually moved significantly? 
        // Logic remains simple: if dragging and close, snap.
        carProgressIndex = bestIndex;
        updateCarState();

        // If close to end
        if (carProgressIndex >= trackPoints.length - 50) {
            stopHonkingOp();
            winGame();
        }
    }
}

function handleEnd() {
    isDragging = false;
    stopHonkingOp();
}

// Logic
function updateCarState() {
    const p = trackPoints[carProgressIndex];
    carPosition.x = p.x;
    carPosition.y = p.y;

    // Calculate angle based on nearby points for smoothness
    const lookAhead = Math.min(trackPoints.length - 1, carProgressIndex + 5);
    const lookBehind = Math.max(0, carProgressIndex - 5);
    const next = trackPoints[lookAhead];
    const prev = trackPoints[lookBehind];

    carPosition.angle = Math.atan2(next.y - prev.y, next.x - prev.x);
}

function generateTrack() {
    trackPoints = [];
    isGameWon = false;
    celebrationOverlay.classList.add('hidden');

    // Pick Random Theme
    const themeKeys = Object.keys(THEMES);
    currentTheme = themeKeys[Math.floor(Math.random() * themeKeys.length)];

    // Update body background to match theme for seamless look
    document.body.style.backgroundColor = THEMES[currentTheme].bg;

    // Generate Control Points
    const points = [];
    const pad = 100 * scale;

    // Start (Bottom Leftish)
    points.push({ x: pad, y: height - pad });

    // Random Middle Points
    // We want a nice curve. Let's create 2-3 intermediate points.
    // We can vary X and Y to create S shapes or Loops.
    // Simple S-shape strategy: Divide height into segments.
    // Randomize X side to side.

    const numSegments = 3;
    for (let i = 1; i <= numSegments; i++) {
        const segmentY = height - pad - (i * (height - 2 * pad) / (numSegments + 1));
        // Random X: Keep it within bounds
        const segmentX = Math.random() * (width - 2 * pad) + pad;
        points.push({ x: segmentX, y: segmentY });
    }

    // End (Top Rightish)
    points.push({ x: width - pad, y: pad });

    // Interpolate using Catmull-Rom (or simple subdivision for now)
    // Let's implement a simple Catmull-Rom spline function

    // Helper to get point on Catmull-Rom spline
    // P0, P1, P2, P3 are control points, t [0,1] is between P1 and P2
    function catmullRom(p0, p1, p2, p3, t) {
        const v0 = (t) => 0.5 * (
            (2 * p1) +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
        );
        return {
            x: v0(t),
            y: 0.5 * (
                (2 * p1.y) +
                (-p0.y + p2.y) * t +
                (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t * t +
                (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t * t * t
            ) // Corrected manual expansion for X and Y separately
        };
        // Re-writing concise version to avoid errors
    }

    function getSplinePoint(p0, p1, p2, p3, t) {
        const tt = t * t;
        const ttt = tt * t;

        const q0 = -tt + 2 * tt - t; // Error in expansion above, using standard formula:
        // 0.5 * ( (2*P1) + (-P0 + P2)*t + (2*P0 - 5*P1 + 4*P2 - P3)*t^2 + (-P0 + 3*P1 - 3*P2 + P3)*t^3 )

        let x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * ttt);
        let y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * ttt);
        return { x, y };
    }

    // Duplicate start and end points for Catmull-Rom (it needs 4 points to draw between 2)
    const pts = [points[0], ...points, points[points.length - 1]];

    // Generate dense points
    for (let i = 0; i < pts.length - 3; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const p2 = pts[i + 2];
        const p3 = pts[i + 3];

        // Steps based on distance
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const steps = Math.floor(dist / 2); // Every 2 pixels

        for (let t = 0; t < 1; t += 1 / steps) {
            trackPoints.push(getSplinePoint(p0, p1, p2, p3, t));
        }
    }
    // Add final point
    trackPoints.push(points[points.length - 1]);

    // Reset Car
    carProgressIndex = 0;
    updateCarState();
}

function winGame() {
    if (isGameWon) return;
    isGameWon = true;
    celebrationOverlay.classList.remove('hidden');
    stopHonkingOp();

    // Play Win Sound: 3 Honks "Di Di Di"
    initAudio();
    let count = 0;
    const winInterval = setInterval(() => {
        playHonk();
        count++;
        if (count >= 3) clearInterval(winInterval);
    }, 400); // 3 times

    for (let i = 0; i < 100; i++) {
        particles.push({
            x: width / 2,
            y: height / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            life: 1.0
        });
    }
}

function resetGame() {
    generateTrack();
    tutorialOverlay.style.display = 'block';
}

function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    const theme = THEMES[currentTheme];
    // Fill Background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    // Draw simple decor (random fixed positions would be better, but let's just draw some static ones based on noise or math?)
    // For now, just a plain background color as requested "Improve Performance/Scene" by color.
    // Adding text emojis as decor for fun?
    // Doing it simple: Background color is enough for the "Scene" requirement for this iteration.

    if (trackPoints.length > 0) {
        // Draw Road Border
        ctx.beginPath();
        ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
        for (let i = 1; i < trackPoints.length; i++) {
            ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = theme.border; // Dark gray/black border
        ctx.stroke();

        // Draw Road Surface
        ctx.beginPath();
        ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
        for (let i = 1; i < trackPoints.length; i++) {
            ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
        }
        ctx.lineWidth = roadWidth;
        ctx.strokeStyle = theme.road; // Light gray road
        ctx.stroke();

        // Draw Center Line
        ctx.beginPath();
        ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
        for (let i = 1; i < trackPoints.length; i++) {
            ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
        }
        ctx.lineWidth = 10 * scale;
        ctx.strokeStyle = theme.centerLine;
        ctx.setLineDash([30 * scale, 30 * scale]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Start/End Lines
        // (Simplified as circles for now)
        ctx.fillStyle = '#4CAF50'; // Start green
        ctx.beginPath();
        ctx.arc(trackPoints[0].x, trackPoints[0].y, roadWidth / 2 - 5 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF5252'; // End red
        ctx.beginPath();
        ctx.arc(trackPoints[trackPoints.length - 1].x, trackPoints[trackPoints.length - 1].y, roadWidth / 2 - 5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Checkerboard pattern for finish line?
        // Let's stick to simple colored zones for MVP
    }

    // Draw Car
    ctx.save();
    ctx.translate(carPosition.x, carPosition.y);
    ctx.rotate(carPosition.angle + Math.PI / 2); // Adjust if car sprite is facing up

    if (carImage.complete && carImage.naturalWidth > 0) {
        // Use a fixed scale relative to the road width to ensure the car size looks right
        // The car image is approx 172px wide (based on check). Road is 140px.
        // We want the car to fit comfortably. Let's make the car's physical width approx 80-90px.
        // If we use a scale factor, we preserve aspect ratio perfectly.

        const targetWidth = BASE_CAR_WIDTH * scale; // Scaled car width
        const carDrawScale = targetWidth / carImage.naturalWidth;

        const drawWidth = carImage.naturalWidth * carDrawScale;
        const drawHeight = carImage.naturalHeight * carDrawScale;

        ctx.drawImage(carImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    } else {
        // Fallback placeholder
        ctx.fillStyle = 'red';
        ctx.fillRect(-30, -50, 60, 100);
    }
    ctx.restore();

    // Particles
    if (isGameWon) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.vy += 0.5; // Gravity

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

// Init
resize(); // Generates track too
