const animals = [
    { emoji: '🐻', name: 'Bear', color: '#8B4513' },
    { emoji: '🐰', name: 'Bunny', color: '#FFB6C1' },
    { emoji: '🐥', name: 'Chick', color: '#FFD700' },
    { emoji: '🐸', name: 'Frog', color: '#90EE90' },
    { emoji: '🐱', name: 'Cat', color: '#FFA07A' },
    { emoji: '🐶', name: 'Dog', color: '#D2B48C' },
    { emoji: '🐷', name: 'Piggy', color: '#FFC0CB' },
    { emoji: '🐼', name: 'Panda', color: '#FFFFFF' },
    { emoji: '🦁', name: 'Lion', color: '#CD853F' },
    { emoji: '🐯', name: 'Tiger', color: '#FF8C00' },
    { emoji: '🐨', name: 'Koala', color: '#808080' },
    { emoji: '🦊', name: 'Fox', color: '#FF4500' },
    { emoji: '🐮', name: 'Cow', color: '#F5F5DC' },
    { emoji: '🐭', name: 'Mouse', color: '#D3D3D3' },
    { emoji: '🐵', name: 'Monkey', color: '#D2691E' },
    { emoji: '🐧', name: 'Penguin', color: '#000000' },
    { emoji: '🐘', name: 'Elephant', color: '#A9A9A9' }
];

const reactions = ['JUMP', 'SHAKE', 'ROTATE', 'WOBBLE', 'SWAY'];
const feedbackWords = ['Yay!', 'Cute!', 'Wow!', 'Hello!', 'Haha!'];

let currentAnimal = null;
let tapCount = 0;
let isAnimating = false;

const animalEl = document.getElementById('animal');
const emojiEl = animalEl.querySelector('.animal-emoji');
const feedbackEl = document.getElementById('feedback-text');
const instructionEl = document.querySelector('.instruction');

// Sound Setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Animal Audio Configuration
const animalSoundConfig = {
    'Cat': {
        src: '../../upload/audio/cat-meow.mp3',
        synth: { type: 'triangle', freqStart: 400, freqEnd: 600, duration: 0.3 }
    },
    'Bear': {
        src: null,
        synth: { type: 'triangle', freqStart: 150, freqEnd: 100, duration: 0.3, vol: 0.5 } // Softer growl
    },
    'Bunny': {
        src: null,
        synth: { type: 'sine', freqStart: 600, freqEnd: 900, duration: 0.15, vol: 0.3 } // High jump squeak
    },
    'Chick': {
        src: null,
        synth: { type: 'triangle', freqStart: 800, freqEnd: 700, duration: 0.1, vol: 0.3 } // Peep
    },
    'Frog': {
        src: null,
        synth: { type: 'triangle', freqStart: 250, freqEnd: 150, duration: 0.2, vol: 0.4 } // Soft Croak
    },
    'Dog': {
        src: null, // Placeholder for future dog-bark.mp3
        synth: { type: 'triangle', freqStart: 300, freqEnd: 150, duration: 0.15, vol: 0.4 } // Bark
    },
    'Piggy': {
        src: null,
        synth: { type: 'triangle', freqStart: 350, freqEnd: 250, duration: 0.2, vol: 0.4 } // Cute oink
    },
    'Panda': {
        src: null,
        synth: { type: 'triangle', freqStart: 250, freqEnd: 350, duration: 0.3, vol: 0.8 } // Louder chuff
    },
    'Lion': {
        src: null,
        synth: { type: 'triangle', freqStart: 120, freqEnd: 80, duration: 0.6, vol: 1.0 } // Soft deep roar
    },
    'Tiger': {
        src: null,
        synth: { type: 'sawtooth', freqStart: 200, freqEnd: 150, duration: 0.6, vol: 0.5 } // Growl
    },
    'Koala': {
        src: null,
        synth: { type: 'triangle', freqStart: 200, freqEnd: 150, duration: 0.4, vol: 0.4 } // Grunt
    },
    'Fox': {
        src: null,
        synth: { type: 'sawtooth', freqStart: 600, freqEnd: 400, duration: 0.2, vol: 0.4 } // Yip
    },
    'Cow': {
        src: null,
        synth: { type: 'sawtooth', freqStart: 150, freqEnd: 100, duration: 1.0, vol: 0.5 } // Moo
    },
    'Mouse': {
        src: null,
        synth: { type: 'sine', freqStart: 800, freqEnd: 1000, duration: 0.1, vol: 0.3 } // Squeak
    },
    'Monkey': {
        src: null,
        synth: { type: 'triangle', freqStart: 400, freqEnd: 500, duration: 0.3, vol: 0.4 } // Ooh aah
    },
    'Penguin': {
        src: null,
        synth: { type: 'square', freqStart: 300, freqEnd: 200, duration: 0.2, vol: 0.4 } // Honk
    },
    'Elephant': {
        src: null,
        synth: { type: 'sawtooth', freqStart: 400, freqEnd: 600, duration: 0.6, vol: 0.6 } // Trumpet
    }
};

// Prelaod Audio Objects
const audioCache = {};
Object.keys(animalSoundConfig).forEach(key => {
    if (animalSoundConfig[key].src) {
        audioCache[key] = new Audio(animalSoundConfig[key].src);
        audioCache[key].volume = 0.8;
    }
});

function playSynthSound(config, now) {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const type = config.type || 'sine';
    const fStart = config.freqStart || 400;
    const fEnd = config.freqEnd || fStart;
    const dur = config.duration || 0.2;
    const vol = config.vol || 0.5;

    osc.type = type;

    // Frequency envelope
    osc.frequency.setValueAtTime(fStart, now);
    if (fStart !== fEnd) {
        osc.frequency.exponentialRampToValueAtTime(fEnd, now + dur);
    }

    // Volume envelope
    gainNode.gain.setValueAtTime(vol, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + dur);

    osc.start(now);
    osc.stop(now + dur + 0.1);
}

function playSound(type, animalName = null) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'animal' && animalName) {
        // Try to play file first
        if (audioCache[animalName]) {
            const sound = audioCache[animalName];
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Audio play failed", e));
        } else {
            // Fallback to synth
            const config = (animalSoundConfig[animalName] && animalSoundConfig[animalName].synth)
                || animalSoundConfig['Cat'].synth;
            playSynthSound(config, now);
        }

    } else if (type === 'custom_tap') {
        // Keep generic tap for non-animal events if needed
        playSynthSound({ type: 'sine', freqStart: 500, freqEnd: 800, duration: 0.1 }, now);

    } else if (type === 'special') {
        // Magic sparkle sound
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(1500, now + 0.1);
        osc.frequency.linearRampToValueAtTime(500, now + 0.2);
        osc.frequency.linearRampToValueAtTime(1500, now + 0.3);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.3);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);

    } else if (type === 'appear') {
        // Pop sound
        playSynthSound({ type: 'sine', freqStart: 200, freqEnd: 600, duration: 0.2, vol: 0.5 }, now);
    }
}

function spawnAnimal() {
    // Pick random animal
    const nextAnimal = animals[Math.floor(Math.random() * animals.length)];
    // Ensure not same as before if possible (unless only 1 exists)
    if (currentAnimal && animals.length > 1 && nextAnimal === currentAnimal) {
        spawnAnimal();
        return;
    }

    currentAnimal = nextAnimal;
    tapCount = 0;

    // Reset classes
    animalEl.className = '';
    void animalEl.offsetWidth; // Trigger reflow
    animalEl.className = 'anim-pop-in';

    emojiEl.innerText = currentAnimal.emoji;
    playSound('appear');

    instructionEl.style.opacity = '1';
}

function showFeedback(text) {
    feedbackEl.innerText = text;
    feedbackEl.style.opacity = '1';

    // Clear feedback after a short delay
    setTimeout(() => {
        feedbackEl.style.opacity = '0';
    }, 1000);
}

function handleTap() {
    if (isAnimating) return; // Prevent spamming animations glitch

    // Hide instruction on first tap
    instructionEl.style.display = 'none';

    tapCount++;

    // Logic: 
    // Taps 1-4: Normal reaction
    // Tap 5: Special reaction -> Refresh animal

    if (tapCount >= 5) {
        // Special Action
        isAnimating = true;
        playSound('special');
        // Play animal sound too for effect?
        setTimeout(() => playSound('animal', currentAnimal.name), 200);

        animalEl.className = 'anim-special';
        showFeedback("Super " + currentAnimal.name + "!");

        // Wait for animation then spawn new
        setTimeout(() => {
            isAnimating = false;
            spawnAnimal();
        }, 1200);

    } else {
        // Normal Action
        // Randomly choose jump or shake or rotate or wobble or sway
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];
        const word = feedbackWords[Math.floor(Math.random() * feedbackWords.length)];

        // Reset animation class
        animalEl.className = '';
        void animalEl.offsetWidth;

        if (reaction === 'JUMP') {
            animalEl.classList.add('anim-jump');
        } else if (reaction === 'SHAKE') {
            animalEl.classList.add('anim-shake');
        } else if (reaction === 'ROTATE') {
            animalEl.classList.add('anim-rotate');
        } else if (reaction === 'WOBBLE') {
            animalEl.classList.add('anim-wobble');
        } else if (reaction === 'SWAY') {
            animalEl.classList.add('anim-sway');
        }

        // Play Specific Animal Sound
        playSound('animal', currentAnimal.name);
        showFeedback(word);
    }
}

// Event Listeners
animalEl.addEventListener('click', handleTap);
animalEl.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent double firing on some devices
    handleTap();
});

// Start Game
spawnAnimal();
