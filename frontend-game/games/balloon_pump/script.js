const balloon = document.getElementById('balloon');
const pumpHandle = document.getElementById('pump-handle');
const pumpContainer = document.getElementById('pump-container'); // for adding class
const scene = document.getElementById('scene');
const instructionText = document.getElementById('instruction-text');
const confettiContainer = document.getElementById('confetti-container');

// Game State
let currentScale = 0.5;
const startScale = 0.5;
const maxScale = 5.0; // Explosion threshold
const flyThreshold = 1.5; // Minimum size to fly
let isInflating = false;
let inflationInterval = null;
let pumpAnimationInterval = null;
let isAnimating = false; // Is flying or popping

// Audio Context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function resumeAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Sound Synthesis
function playSound(type) {
    resumeAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'pump') {
        // Air noise (using filtered noise or just a low sine for simplicity)
        // Creating noise buffer for "PSSHH" sound
        const bufferSize = audioCtx.sampleRate * 0.1; // 0.1 seconds
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        // Filter to make it sound like air
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        noise.connect(filter);
        filter.connect(gainNode);

        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        noise.start(now);
    } else if (type === 'pop') {
        // Pop sound: rapid frequency drop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        gainNode.gain.setValueAtTime(1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'fly') {
        // High pitched squeal
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 1.5); // Pitch drop as it flies away

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.5);

        osc.start(now);
        osc.stop(now + 1.5);
    } else if (type === 'cheer') {
        // Simple major chord arpeggio
        const notes = [440, 554, 659]; // A major
        notes.forEach((freq, idx) => {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);

            osc2.frequency.value = freq;
            osc2.start(now + idx * 0.1);
            gain2.gain.setValueAtTime(0.1, now + idx * 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.5);
            osc2.stop(now + idx * 0.1 + 0.5);
        });
    }
}

// Colors
const colors = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#a55eea', '#ff6b81'];
function randomizeBalloon() {
    const color = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.backgroundColor = color;
    document.documentElement.style.setProperty('--balloon-color', color);

    // Reset balloon visual state
    currentScale = startScale;
    balloon.style.transition = 'transform 0.1s linear, bottom 0.5s ease-in';
    balloon.style.transform = `scale(${currentScale})`;
    balloon.style.bottom = '0';
    balloon.style.left = '-50px';
    balloon.style.opacity = '1';
    balloon.querySelector('.string').style.opacity = '0';
    balloon.classList.remove('flying');
}

// Interaction Handlers
function startInflating(e) {
    if (isAnimating) return;
    if (e.cancelable) e.preventDefault(); // Prevent text selection/scrolling

    isInflating = true;
    instructionText.style.opacity = '0';
    resumeAudio();

    // Pump animation loop
    let toggle = false;
    pumpAnimationInterval = setInterval(() => {
        toggle = !toggle;
        if (toggle) {
            pumpContainer.classList.add('pumping');
            playSound('pump');
            // Grow trigger on downstroke
            growBalloon();
        } else {
            pumpContainer.classList.remove('pumping');
        }
    }, 150); // Pump speed
}

function stopInflating() {
    isInflating = false;
    clearInterval(pumpAnimationInterval);
    pumpContainer.classList.remove('pumping');

    if (isAnimating) return;

    // Check release outcome
    if (currentScale >= flyThreshold) {
        flyAway();
    } else {
        // Too small, deflate slightly or just stay (let's deflate to indicate fail)
        // Actually, for kids, let's just let it stay so they can continue pumping
    }
}

function growBalloon() {
    if (!isInflating) return;

    currentScale += 0.1;
    balloon.style.transform = `scale(${currentScale})`;

    if (currentScale >= maxScale) {
        popBalloon();
    }
}

function popBalloon() {
    isAnimating = true;
    isInflating = false;
    clearInterval(pumpAnimationInterval);
    pumpContainer.classList.remove('pumping');

    playSound('pop');
    createConfetti();

    balloon.style.transition = 'transform 0.05s';
    balloon.style.transform = `scale(${currentScale * 1.2})`; // momentary expand
    setTimeout(() => {
        balloon.style.opacity = '0'; // Disappear
        setTimeout(() => {
            isAnimating = false;
            randomizeBalloon();
        }, 1000);
    }, 50);
}

function flyAway() {
    isAnimating = true;
    playSound('fly');

    balloon.classList.add('flying');
    balloon.style.bottom = '120vh'; // Fly off screen

    // Add some horizontal drift
    const drift = (Math.random() - 0.5) * 50;
    balloon.style.left = `calc(-50px + ${drift}vw)`;

    // Show string
    balloon.querySelector('.string').style.opacity = '1';

    setTimeout(() => {
        if (currentScale > 3) playSound('cheer'); // Big balloon bonus sound

        isAnimating = false;
        randomizeBalloon();
    }, 3000);
}

// Confetti Effect
function createConfetti() {
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#9b59b6'];
    const rect = balloon.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.left = centerX + 'px';
        p.style.top = centerY + 'px';

        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 200 + 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        p.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-in';
        confettiContainer.appendChild(p);

        // Force reflow
        void p.offsetWidth;

        p.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        p.style.opacity = '0';

        setTimeout(() => p.remove(), 500);
    }
}

// Event Listeners
// Touch
scene.addEventListener('touchstart', startInflating, { passive: false });
scene.addEventListener('touchend', stopInflating);
scene.addEventListener('touchcancel', stopInflating);

// Mouse
scene.addEventListener('mousedown', startInflating);
scene.addEventListener('mouseup', stopInflating);
scene.addEventListener('mouseleave', stopInflating);

// Initial Setup
randomizeBalloon();
