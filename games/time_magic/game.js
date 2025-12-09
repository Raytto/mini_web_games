const scene = document.getElementById('scene');
const elementsContainer = document.getElementById('elements');
const overlayText = document.getElementById('overlay-text');
const interactiveElements = document.querySelectorAll('.element');

const states = [
    { name: 'sunny', text: 'Sunny Day ☀️', bg: 'var(--bg-sunny)' },
    { name: 'rainy', text: 'Rainy Day 🌧️', bg: 'var(--bg-rainy)' },
    { name: 'snowy', text: 'Snowy Day ❄️', bg: 'var(--bg-snowy)' },
    { name: 'rainbow', text: 'Rainbow! 🌈', bg: 'var(--bg-rainbow)' }
];

let currentStateIndex = 0;
let particleInterval = null;

// Audio Context for synthetic sounds (soft beeps/bloops)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'swipe') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + Math.random() * 200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

function updateState() {
    const state = states[currentStateIndex];

    // Remove old state classes
    states.forEach(s => scene.classList.remove(s.name));

    // Add new state class
    scene.classList.add(state.name);
    overlayText.textContent = state.text;

    // Manage particles
    clearInterval(particleInterval);
    elementsContainer.querySelectorAll('.particle').forEach(el => el.remove());

    if (state.name === 'rainy') {
        startParticles('💧', 200, 1.5); // Emoji, interval, speed factor
    } else if (state.name === 'snowy') {
        startParticles('❄️', 300, 3);
    }

    playSound('swipe');
}

function startParticles(char, interval, durationIsSeconds) {
    particleInterval = setInterval(() => {
        const p = document.createElement('div');
        p.textContent = char;
        p.classList.add('particle');
        p.style.left = Math.random() * 100 + 'vw';
        p.style.fontSize = (Math.random() * 2 + 1) + 'rem';
        p.style.animationDuration = (Math.random() * 1 + durationIsSeconds) + 's';
        p.style.opacity = Math.random() * 0.5 + 0.5;

        elementsContainer.appendChild(p);

        // Self cleanup
        setTimeout(() => {
            p.remove();
        }, (durationIsSeconds + 2) * 1000);
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
        if (diff > 0) {
            // Swipe Up -> Next
            currentStateIndex = (currentStateIndex + 1) % states.length;
        } else {
            // Swipe Down -> Previous
            currentStateIndex = (currentStateIndex - 1 + states.length) % states.length;
        }
        updateState();
    }
}

// Click interactions
interactiveElements.forEach(el => {
    el.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent swipe confusion if overlapping
        playSound('click');

        // Remove animation class reset trick
        el.classList.remove('active-feedback');
        void el.offsetWidth; // trigger reflow
        el.classList.add('active-feedback');

        // Random visual effect
        const effects = ['bounce', 'shake', 'pulse'];
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        el.style.animation = 'none'; // reset specific animation
        setTimeout(() => {
            el.style.animation = `${randomEffect} 0.5s ease`;
        }, 10);

        // Restore default animation after interaction
        setTimeout(() => {
            el.style.animation = '';
        }, 600);
    });
});

// Initialize
updateState();
