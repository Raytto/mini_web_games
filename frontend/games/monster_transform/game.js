const monsterBody = document.getElementById('monster-body');
const monsterEyes = document.getElementById('monster-eyes');
const monsterNose = document.getElementById('monster-nose');
const monsterMouth = document.getElementById('monster-mouth');
const monsterFunction = document.getElementById('monster');
const gameContainer = document.getElementById('game-container');

// Sound
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Sound Types
const soundTypes = [
    // 0: Classic Boing
    (ctx, t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300 + Math.random() * 200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.6);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

        osc.start(t);
        osc.stop(t + 0.6);
    },
    // 1: Quick Pop
    (ctx, t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.1);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.start(t);
        osc.stop(t + 0.2);
    },
    // 2: Squeak (High pitch rise)
    (ctx, t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.linearRampToValueAtTime(1200, t + 0.15);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.15);

        osc.start(t);
        osc.stop(t + 0.15);
    },
    // 3: Wibble (Frequency Modulation)
    (ctx, t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);

        // Simple manual wobble via scheduling
        osc.frequency.linearRampToValueAtTime(450, t + 0.1);
        osc.frequency.linearRampToValueAtTime(350, t + 0.2);
        osc.frequency.linearRampToValueAtTime(420, t + 0.3);
        osc.frequency.linearRampToValueAtTime(380, t + 0.4);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        osc.start(t);
        osc.stop(t + 0.5);
    },
    // 4: Chime
    (ctx, t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        const freq = 500 + Math.random() * 300;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

        osc.start(t);
        osc.stop(t + 1.0);
    }
];

function playSound() {
    initAudio();
    if (!audioCtx) return;

    // Pick a random sound generator
    const soundGen = soundTypes[Math.floor(Math.random() * soundTypes.length)];
    soundGen(audioCtx, audioCtx.currentTime);
}

// Data
const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
    '#F1C40F', '#E74C3C', '#1ABC9C', '#34495E', '#e056fd',
    '#badc58', '#686de0', '#ffbe76', '#ff7979', '#c7ecee',
    '#fab1a0', '#00b894', '#fd79a8', '#6c5ce7', '#0984e3'
];

const bgColors = [
    '#fcfaf2', '#e8fbfd', '#fcecf2', '#fcefe6', '#e6fbf5',
    '#e6fdfd', '#f0eaff', '#fffbe6', '#f2f2f5', '#fcece9',
    '#fff5df', '#f0fbf9', '#fff7f7', '#fdfaff', '#f0f7fd'
];

// SVG Paths
// All bodies expanded to safely cover the face area (approx x:100-300, y:120-320)
const bodies = [
    // Round - Expanded
    "M 40 200 C 40 80 80 40 200 40 C 320 40 360 80 360 200 C 360 320 320 360 200 360 C 80 360 40 320 40 200 Z",

    // Square-ish - Expanded
    "M 60 200 C 60 70 70 60 200 60 C 330 60 340 70 340 200 C 340 330 330 340 200 340 C 70 340 60 330 60 200 Z",

    // Pear - Expanded
    "M 80 150 C 80 60 140 40 200 40 C 260 40 320 60 320 150 C 320 230 360 260 360 310 C 360 360 310 390 200 390 C 90 390 40 360 40 310 C 40 260 80 230 80 150 Z",

    // Bean - Expanded
    "M 70 200 C 70 90 140 40 200 40 C 310 40 340 140 340 200 C 340 260 320 360 200 360 C 110 360 90 310 70 200 Z",

    // Blobby - Expanded
    "M 50 200 Q 50 50 200 50 Q 350 50 350 200 Q 350 350 200 350 Q 50 350 50 200 Z",

    // Rounded Star - Rounded inner and outer corners, large enough
    "M 200 40 C 210 40 220 60 225 70 L 245 130 C 250 145 265 155 280 155 L 340 165 C 360 170 365 195 350 205 L 305 245 C 295 255 290 270 295 285 L 310 345 C 315 365 295 380 275 370 L 220 340 C 205 330 195 330 180 340 L 125 370 C 105 380 85 365 90 345 L 105 285 C 110 270 105 255 95 245 L 50 205 C 35 195 40 170 60 165 L 120 155 C 135 155 150 145 155 130 L 175 70 C 180 60 190 40 200 40 Z",

    // Triangle - Rounded & Expanded
    "M 200 40 L 360 350 C 365 360 355 370 345 370 L 55 370 C 45 370 35 360 40 350 L 200 40 Z",

    // Ghost - Expanded
    "M 60 360 L 60 150 C 60 40 340 40 340 150 L 340 360 L 293 310 L 246 360 L 199 310 L 152 360 L 105 310 Z",

    // Cloud - Expanded
    "M 80 310 C 20 310 20 200 70 180 C 70 90 180 70 230 110 C 280 70 380 110 370 200 C 420 220 400 310 320 310 Z",

    // Hexagon - Soft
    "M 120 40 L 280 40 L 360 200 L 280 360 L 120 360 L 40 200 Z",

    // Slime Drop
    "M 200 30 C 100 30 50 150 50 250 C 50 330 120 380 200 380 C 280 380 350 330 350 250 C 350 150 300 30 200 30 Z",

    // TV Shape
    "M 60 60 L 340 60 L 340 300 Q 340 340 300 340 L 100 340 Q 60 340 60 300 Z",

    // Fuzzy/Spiky Hair Ball
    "M 200 60 L 220 80 L 240 60 L 260 85 L 290 70 L 300 100 L 330 110 L 320 140 L 350 160 L 330 190 L 360 220 L 330 250 L 350 290 L 310 310 L 320 350 L 280 340 L 250 370 L 220 345 L 180 370 L 160 340 L 120 360 L 110 320 L 70 330 L 90 290 L 50 260 L 80 230 L 50 190 L 80 160 L 60 120 L 100 110 L 110 70 L 140 90 L 170 60 L 200 60 Z"
];

function getEyes() {
    const types = [
        // Two standard eyes
        `<circle cx="160" cy="180" r="30" fill="white" stroke="#333" stroke-width="3"/>
         <circle cx="240" cy="180" r="30" fill="white" stroke="#333" stroke-width="3"/>
         <circle cx="160" cy="180" r="10" fill="black"/>
         <circle cx="240" cy="180" r="10" fill="black"/>`,

        // Cyclops
        `<circle cx="200" cy="160" r="60" fill="white" stroke="#333" stroke-width="3"/>
         <circle cx="200" cy="160" r="20" fill="black"/>`,

        // Three eyes
        `<circle cx="150" cy="190" r="25" fill="white" stroke="#333" stroke-width="3"/>
         <circle cx="250" cy="190" r="25" fill="white" stroke="#333" stroke-width="3"/>
         <circle cx="200" cy="140" r="25" fill="white" stroke="#333" stroke-width="3"/>
         <circle cx="150" cy="190" r="8" fill="black"/>
         <circle cx="250" cy="190" r="8" fill="black"/>
         <circle cx="200" cy="140" r="8" fill="black"/>`,

        // Sleepy eyes
        `<path d="M 140 190 Q 170 170 200 190" stroke="#333" stroke-width="5" fill="none" />
         <path d="M 220 190 Q 250 170 280 190" stroke="#333" stroke-width="5" fill="none" />`,

        // Wide eyes
        `<ellipse cx="160" cy="180" rx="20" ry="35" fill="white" stroke="#333" stroke-width="3"/>
         <ellipse cx="240" cy="180" rx="20" ry="35" fill="white" stroke="#333" stroke-width="3"/>
         <circle cx="160" cy="180" r="5" fill="black"/>
         <circle cx="240" cy="180" r="5" fill="black"/>`,

        // Sunglasses
        `<path d="M 130 170 A 30 30 0 0 1 190 170 L 210 170 A 30 30 0 0 1 270 170 L 270 180 L 130 180 Z" fill="black"/>
          <line x1="120" y1="175" x2="280" y2="175" stroke="black" stroke-width="2"/>`,

        // Heart Eyes
        `<path d="M 150 180 L 160 195 L 170 180 A 10 10 0 0 0 150 180" fill="#e84118" />
          <path d="M 230 180 L 240 195 L 250 180 A 10 10 0 0 0 230 180" fill="#e84118" />`,

        // Cross Eyes
        `<line x1="140" y1="160" x2="180" y2="200" stroke="#333" stroke-width="4"/>
          <line x1="140" y1="200" x2="180" y2="160" stroke="#333" stroke-width="4"/>
          <line x1="220" y1="160" x2="260" y2="200" stroke="#333" stroke-width="4"/>
          <line x1="220" y1="200" x2="260" y2="160" stroke="#333" stroke-width="4"/>`,

        // Angry Eyes
        `<path d="M 140 160 L 190 190" stroke="#333" stroke-width="5" stroke-linecap="round"/>
          <path d="M 260 160 L 210 190" stroke="#333" stroke-width="5" stroke-linecap="round"/>
          <circle cx="165" cy="190" r="10" fill="white"/>
          <circle cx="235" cy="190" r="10" fill="white"/>
          <circle cx="165" cy="190" r="5" fill="black"/>
          <circle cx="235" cy="190" r="5" fill="black"/>`,

        // Robot Eyes
        `<rect x="140" y="160" width="40" height="40" fill="#dfe6e9" stroke="#333" stroke-width="2"/>
          <rect x="220" y="160" width="40" height="40" fill="#dfe6e9" stroke="#333" stroke-width="2"/>
          <rect x="150" y="170" width="20" height="20" fill="cyan"/>
          <rect x="230" y="170" width="20" height="20" fill="cyan"/>`,

        // Spiral Eyes
        `<path d="M 160 180 m -20 0 a 20 20 0 1 0 40 0 a 20 20 0 1 0 -40 0 m 5 0 a 15 15 0 1 1 30 0 a 15 15 0 1 1 -30 0 m 5 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0" fill="none" stroke="#333" stroke-width="2"/>
          <path d="M 240 180 m -20 0 a 20 20 0 1 0 40 0 a 20 20 0 1 0 -40 0 m 5 0 a 15 15 0 1 1 30 0 a 15 15 0 1 1 -30 0 m 5 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0" fill="none" stroke="#333" stroke-width="2"/>`,

        // Button Eyes
        `<circle cx="160" cy="180" r="25" fill="#fab1a0" stroke="#333" stroke-width="2"/>
          <circle cx="240" cy="180" r="25" fill="#fab1a0" stroke="#333" stroke-width="2"/>
          <circle cx="155" cy="175" r="3" fill="#333"/><circle cx="165" cy="175" r="3" fill="#333"/>
          <circle cx="155" cy="185" r="3" fill="#333"/><circle cx="165" cy="185" r="3" fill="#333"/>
          <circle cx="235" cy="175" r="3" fill="#333"/><circle cx="245" cy="175" r="3" fill="#333"/>
          <circle cx="235" cy="185" r="3" fill="#333"/><circle cx="245" cy="185" r="3" fill="#333"/>`
    ];
    return types[Math.floor(Math.random() * types.length)];
}

function getNose() {
    const types = [
        // Pig nose
        `<ellipse cx="200" cy="220" rx="25" ry="15" fill="#ffa502" stroke="#333" stroke-width="2"/>
         <circle cx="190" cy="220" r="5" fill="#333"/>
         <circle cx="210" cy="220" r="5" fill="#333"/>`,

        // Triangle nose
        `<path d="M 200 200 L 215 230 L 185 230 Z" fill="#ff7f50" stroke="#333" stroke-width="2"/>`,

        // Round button nose
        `<circle cx="200" cy="220" r="15" fill="#ff6b81" stroke="#333" stroke-width="2"/>`,

        // Cat nose
        `<path d="M 190 215 Q 200 230 210 215 Z" fill="#333"/>`,

        // Clown nose
        `<circle cx="200" cy="220" r="20" fill="red" stroke="#333" stroke-width="2"/>
         <circle cx="195" cy="215" r="5" fill="white" opacity="0.5"/>`,

        // Long nose
        `<path d="M 200 200 Q 230 220 200 240" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round"/>`,

        // Mustache
        `<path d="M 200 225 C 200 225 180 215 170 230 C 160 245 180 240 200 230 C 220 240 240 245 230 230 C 220 215 200 225 200 225 Z" fill="#333"/>`,

        // No nose (empty string)
        ``
    ];
    // Give "No nose" a smaller chance
    return types[Math.floor(Math.random() * types.length)];
}

function getMouth() {
    const types = [
        // Smile
        `<path d="M 150 260 Q 200 310 250 260" stroke="#333" stroke-width="5" fill="none" stroke-linecap="round"/>`,

        // Open Mouth
        `<circle cx="200" cy="280" r="30" fill="#333" />
         <path d="M 180 290 Q 200 300 220 290" stroke="#e84118" stroke-width="3" fill="none"/>`, // slight tongue hint

        // Tooth smile
        `<path d="M 150 270 Q 200 330 250 270 Z" fill="white" stroke="#333" stroke-width="3"/>
         <line x1="150" y1="270" x2="250" y2="270" stroke="#333" stroke-width="3"/>
         <line x1="200" y1="270" x2="200" y2="300" stroke="#333" stroke-width="2"/>`,

        // Fangs
        `<path d="M 160 270 L 170 300 L 180 270 M 220 270 L 230 300 L 240 270" stroke="#333" stroke-width="3" fill="white"/>
         <path d="M 160 270 Q 200 290 240 270" stroke="#333" stroke-width="3" fill="none"/>`,

        // Straight face
        `<line x1="160" y1="280" x2="240" y2="280" stroke="#333" stroke-width="5" stroke-linecap="round"/>`,

        // Tongue out
        `<path d="M 170 270 Q 200 270 230 270" stroke="#333" stroke-width="3"/>
         <path d="M 185 270 Q 185 320 200 320 Q 215 320 215 270" fill="#FF6B6B" stroke="#333" stroke-width="3"/>`,

        // Zipper
        `<line x1="160" y1="280" x2="240" y2="280" stroke="#333" stroke-width="2"/>
         <line x1="170" y1="275" x2="170" y2="285" stroke="#333" stroke-width="2"/>
         <line x1="180" y1="275" x2="180" y2="285" stroke="#333" stroke-width="2"/>
         <line x1="190" y1="275" x2="190" y2="285" stroke="#333" stroke-width="2"/>
         <line x1="200" y1="275" x2="200" y2="285" stroke="#333" stroke-width="2"/>
         <line x1="210" y1="275" x2="210" y2="285" stroke="#333" stroke-width="2"/>
         <line x1="220" y1="275" x2="220" y2="285" stroke="#333" stroke-width="2"/>
         <line x1="230" y1="275" x2="230" y2="285" stroke="#333" stroke-width="2"/>`,

        // Wavy (nervous)
        `<path d="M 160 280 Q 170 270 180 280 T 200 280 T 220 280 T 240 280" stroke="#333" stroke-width="4" fill="none" stroke-linecap="round"/>`,

        // Stitched
        `<line x1="160" y1="280" x2="240" y2="280" stroke="#333" stroke-width="3"/>
         <line x1="170" y1="270" x2="170" y2="290" stroke="#333" stroke-width="2"/>
         <line x1="200" y1="265" x2="200" y2="295" stroke="#333" stroke-width="2"/>
         <line x1="230" y1="270" x2="230" y2="290" stroke="#333" stroke-width="2"/>`,

        // Cat Mouth
        `<path d="M 200 230 L 200 240 M 200 240 Q 180 250 170 240 M 200 240 Q 220 250 230 240" stroke="#333" stroke-width="3" fill="none"/>`
    ];
    return types[Math.floor(Math.random() * types.length)];
}

// Animations
const animations = ['anim-bounce', 'anim-wobble', 'anim-jello', 'anim-tada', 'anim-spin', 'anim-shake'];

function transformMonster() {
    // Remove all animation classes
    monsterFunction.classList.remove(...animations);

    // Trigger reflow
    void monsterFunction.offsetWidth;

    // Add a random animation class
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    monsterFunction.classList.add(randomAnim);

    // Change Body Shape
    const newBody = bodies[Math.floor(Math.random() * bodies.length)];
    monsterBody.setAttribute('d', newBody);

    // Change Color
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    monsterBody.setAttribute('fill', newColor);

    // Change Eyes
    monsterEyes.innerHTML = getEyes();

    // Change Nose
    monsterNose.innerHTML = getNose();

    // Change Mouth
    monsterMouth.innerHTML = getMouth();

    // Change Background (light tint)
    const newBg = bgColors[Math.floor(Math.random() * bgColors.length)];
    document.body.style.background = newBg;

    // Sound
    playSound();
}

// Initial Transform
// Wait for DOM to be fully loaded to ensure elements exist
window.addEventListener('DOMContentLoaded', () => {
    transformMonster();
});


// Event Listener
document.body.addEventListener('click', (e) => {
    // Don't transform if clicking the back button
    if (e.target.closest('.back-btn')) return;
    transformMonster();
});
document.body.addEventListener('touchstart', (e) => {
    // Don't transform if clicking the back button
    if (e.target.closest('.back-btn')) return;

    e.preventDefault(); // Prevent double tap zoom
    transformMonster();
}, { passive: false });

// Make sure audio starts on first user interaction
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });
