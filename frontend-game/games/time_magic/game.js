const scene = document.getElementById('scene');
const overlayText = document.getElementById('overlay-text');
const rainContainer = document.getElementById('rain-container');
const snowContainer = document.getElementById('snow-container');

const states = [
    { name: 'sunny', text: '晴天 ☀️' },
    { name: 'rainy', text: '下雨 🌧️' },
    { name: 'snowy', text: '下雪 ❄️' },
    { name: 'rainbow', text: '彩虹 🌈' }
];

let currentStateIndex = 0;
let particleInterval = null;
let lastSwipeAt = 0;

// Preload images to avoid flashing
const imageUrls = [
    'assets/bg_sunny.png',
    'assets/bg_rainy.png',
    'assets/bg_snowy.png',
    'assets/bg_rainbow.png'
];
imageUrls.forEach(url => {
    const img = new Image();
    img.src = url;
});

// Audio Context for synthetic sounds
let audioCtx = null;
let audioReady = false;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    audioReady = true;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!audioReady) return;
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'swipe') {
        // Whoosh sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'click') {
        // Cute pop sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }
}

function updateState() {
    const state = states[currentStateIndex];

    // Update Scene Class
    states.forEach(s => scene.classList.remove(s.name));
    scene.classList.add(state.name);

    // Update Text
    overlayText.textContent = state.text;
    overlayText.style.animation = 'none';
    void overlayText.offsetWidth; // trigger reflow
    overlayText.style.animation = 'pulse 0.5s';

    // Manage particles
    clearParticles();

    if (state.name === 'rainy') {
        startParticles(rainContainer, 'rain-drop', '💧', 50, 0.8); // Fast rain
    } else if (state.name === 'snowy') {
        startParticles(snowContainer, 'snow-flake', '❄️', 300, 4); // Slow snow
    }

    playSound('swipe');
}

function clearParticles() {
    if (particleInterval) clearInterval(particleInterval);
    rainContainer.innerHTML = '';
    snowContainer.innerHTML = '';
}

function startParticles(container, className, char, interval, durationIsSeconds) {
    particleInterval = setInterval(() => {
        const p = document.createElement('div');
        p.classList.add('particle', className);
        p.textContent = char; // Use Emoji
        p.style.left = Math.random() * 100 + 'vw';

        // Randomize size using fontSize instead of scale for crisp Emojis
        const size = Math.random() * 1.5 + 1; // 1rem to 2.5rem
        p.style.fontSize = `${size}rem`;

        // Pass scale for animation if needed (optional, but font-size handles visual size)
        p.style.setProperty('--scale', Math.random() * 0.5 + 0.8);

        p.style.animationDuration = (durationIsSeconds * 0.8 + Math.random() * durationIsSeconds * 0.4) + 's';
        p.style.opacity = Math.random() * 0.5 + 0.6;

        container.appendChild(p);

        // Self cleanup
        setTimeout(() => {
            p.remove();
        }, (durationIsSeconds + 1) * 1000);
    }, interval);
}

// Swipe handling
let startY = 0;
const threshold = 50;

document.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
}, { passive: false });

document.addEventListener('touchend', e => {
    const endY = e.changedTouches[0].clientY;
    handleSwipe(startY, endY);
});

document.addEventListener('mousedown', e => {
    startY = e.clientY;
});

document.addEventListener('mouseup', e => {
    const endY = e.clientY;
    handleSwipe(startY, endY);
});

function handleSwipe(start, end) {
    const diff = start - end;
    if (Math.abs(diff) > threshold) {
        initAudio();
        if (diff > 0) {
            // Swipe Up -> Next
            currentStateIndex = (currentStateIndex + 1) % states.length;
        } else {
            // Swipe Down -> Previous
            currentStateIndex = (currentStateIndex - 1 + states.length) % states.length;
        }
        updateState();
        lastSwipeAt = Date.now();
    }
}

function nextWeather() {
    initAudio();
    currentStateIndex = (currentStateIndex + 1) % states.length;
    updateState();
}

// Interaction for specific elements
const sun = document.getElementById('sun-element');
const rainbow = document.getElementById('rainbow-element');

[sun, rainbow].forEach(el => {
    if (!el) return;
    el.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent swipe triggers if dragged
        nextWeather();
        playSound('click');

        // Visual feedback
        el.classList.remove('feedback-bounce');
        void el.offsetWidth;
        el.classList.add('feedback-bounce');
    });
});

scene.addEventListener('click', (e) => {
    if (e.target.closest('.back-btn')) return;
    if (Date.now() - lastSwipeAt < 350) return;
    nextWeather();
});

// Initialize
updateState();
