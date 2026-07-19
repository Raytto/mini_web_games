(function () {
    let audioContext = null;
    let muted = false;

    const NOTE = {
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392,
        A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
        G5: 783.99, C6: 1046.5
    };

    function context() {
        if (muted) return null;
        if (!audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return null;
            audioContext = new AudioContext();
        }
        if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
        return audioContext;
    }

    function tone(frequency, delay = 0, duration = 0.12, options = {}) {
        const ctx = context();
        if (!ctx) return;
        const start = ctx.currentTime + delay;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = options.type || "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        if (options.to) oscillator.frequency.exponentialRampToValueAtTime(options.to, start + duration);
        gain.gain.setValueAtTime(Math.max(0.0001, options.volume || 0.055), start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
    }

    function noise(delay = 0, duration = 0.08, volume = 0.025) {
        const ctx = context();
        if (!ctx) return;
        const length = Math.max(1, Math.round(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        const start = ctx.currentTime + delay;
        source.buffer = buffer;
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(start);
    }

    function sound(name) {
        const patterns = {
            tap: [[NOTE.C5, 0, 0.055, { volume: 0.035 }]],
            pick: [[NOTE.E5, 0, 0.07, { to: NOTE.G5, volume: 0.045 }]],
            drop: [[NOTE.G5, 0, 0.08, { to: NOTE.C5, volume: 0.05 }]],
            correct: [[NOTE.C5, 0, 0.1], [NOTE.E5, 0.09, 0.1], [NOTE.G5, 0.18, 0.15]],
            wrong: [[NOTE.D4, 0, 0.11, { type: "triangle", to: NOTE.C4 }], [NOTE.C4, 0.12, 0.14, { type: "triangle" }]],
            complete: [[NOTE.C5, 0, 0.13], [NOTE.E5, 0.1, 0.13], [NOTE.G5, 0.2, 0.13], [NOTE.C6, 0.32, 0.28]],
            whoosh: [[NOTE.C4, 0, 0.24, { type: "sawtooth", to: NOTE.C6, volume: 0.025 }]],
            water: [[NOTE.G5, 0, 0.08, { to: NOTE.C5, volume: 0.035 }], [NOTE.E5, 0.12, 0.08, { to: NOTE.C5, volume: 0.03 }]],
            sparkle: [[NOTE.E5, 0, 0.08], [NOTE.G5, 0.07, 0.08], [NOTE.C6, 0.14, 0.18]],
            drum: [[NOTE.C4, 0, 0.1, { type: "triangle", to: 85, volume: 0.09 }]],
            guitar: [[NOTE.C5, 0, 0.1, { type: "triangle" }], [NOTE.G5, 0.09, 0.18, { type: "triangle" }]],
            trumpet: [[NOTE.G4, 0, 0.12, { type: "square", volume: 0.035 }], [NOTE.C5, 0.12, 0.2, { type: "square", volume: 0.035 }]],
            engine: [[110, 0, 0.16, { type: "sawtooth", to: 180, volume: 0.03 }], [150, 0.14, 0.18, { type: "sawtooth", to: 240, volume: 0.025 }]]
        };
        (patterns[name] || patterns.tap).forEach(([frequency, delay, duration, options]) => tone(frequency, delay, duration, options));
        if (name === "drum" || name === "whoosh") noise(0, name === "whoosh" ? 0.2 : 0.07, 0.035);
    }

    function vibrate(pattern = 18) {
        if (navigator.vibrate) navigator.vibrate(pattern);
    }

    function burst(target, options = {}) {
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const x = options.x ?? rect.left + rect.width / 2;
        const y = options.y ?? rect.top + rect.height / 2;
        const symbols = options.symbols || ["★", "●", "✦", "❤"];
        const colors = options.colors || ["#ffca3a", "#ff595e", "#6a4c93", "#2ec4b6", "#ffffff"];
        const count = options.count || 12;
        for (let index = 0; index < count; index += 1) {
            const particle = document.createElement("i");
            const angle = (Math.PI * 2 * index) / count + Math.random() * 0.35;
            const distance = 45 + Math.random() * 65;
            particle.className = "juice-particle";
            particle.textContent = symbols[index % symbols.length];
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.color = colors[index % colors.length];
            particle.style.setProperty("--juice-x", `${Math.cos(angle) * distance}px`);
            particle.style.setProperty("--juice-y", `${Math.sin(angle) * distance}px`);
            document.body.appendChild(particle);
            window.setTimeout(() => particle.remove(), 850);
        }
    }

    function shake(target) {
        if (!target) return;
        target.classList.remove("juice-shake");
        void target.offsetWidth;
        target.classList.add("juice-shake");
        window.setTimeout(() => target.classList.remove("juice-shake"), 500);
    }

    function setMuted(value) {
        muted = Boolean(value);
    }

    let guideTimer = 0;
    function guide(source, target, delay = 1500) {
        window.clearTimeout(guideTimer);
        document.querySelector(".juice-guide")?.remove();
        if (!source || !target || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
        guideTimer = window.setTimeout(() => {
            if (!source.isConnected || !target.isConnected) return;
            const from = source.getBoundingClientRect();
            const to = target.getBoundingClientRect();
            const hand = document.createElement("i");
            hand.className = "juice-guide";
            hand.textContent = "☝";
            hand.style.setProperty("--juice-from-x", `${from.left + from.width / 2}px`);
            hand.style.setProperty("--juice-from-y", `${from.top + from.height / 2}px`);
            hand.style.setProperty("--juice-to-x", `${to.left + to.width / 2}px`);
            hand.style.setProperty("--juice-to-y", `${to.top + to.height / 2}px`);
            document.body.appendChild(hand);
            const dismiss = () => {
                hand.remove();
                document.removeEventListener("pointerdown", dismiss, true);
            };
            document.addEventListener("pointerdown", dismiss, true);
            window.setTimeout(dismiss, 2100);
        }, delay);
    }

    if (!document.getElementById("game-juice-style")) {
        const style = document.createElement("style");
        style.id = "game-juice-style";
        style.textContent = `
            .juice-particle { position: fixed; z-index: 20000; pointer-events: none; font-style: normal; font-size: 18px; transform: translate(-50%, -50%); animation: juiceBurst .78s cubic-bezier(.16,.84,.34,1) forwards; filter: drop-shadow(0 2px 1px rgba(0,0,0,.12)); }
            .juice-shake { animation: juiceShake .42s ease both !important; }
            .juice-guide { position: fixed; z-index: 21000; pointer-events: none; left: var(--juice-from-x); top: var(--juice-from-y); font-style: normal; font-size: clamp(42px,7vw,66px); filter: drop-shadow(0 5px 5px rgba(0,0,0,.22)); animation: juiceGuide 1.75s cubic-bezier(.5,.03,.3,1) both; }
            @keyframes juiceBurst { 0% { opacity: 0; transform: translate(-50%,-50%) scale(.25) rotate(0); } 18% { opacity: 1; } 100% { opacity: 0; transform: translate(calc(-50% + var(--juice-x)), calc(-50% + var(--juice-y))) scale(1.12) rotate(190deg); } }
            @keyframes juiceShake { 0%,100% { transform: translateX(0); } 22% { transform: translateX(-8px) rotate(-2deg); } 44% { transform: translateX(7px) rotate(2deg); } 66% { transform: translateX(-4px); } 82% { transform: translateX(3px); } }
            @keyframes juiceGuide { 0% { left:var(--juice-from-x); top:var(--juice-from-y); opacity:0; transform:translate(-22%,-18%) rotate(-20deg) scale(.75); } 16% { opacity:.94; transform:translate(-22%,-18%) rotate(-20deg) scale(1); } 36% { left:var(--juice-from-x); top:var(--juice-from-y); } 82% { left:var(--juice-to-x); top:var(--juice-to-y); opacity:.94; } 100% { left:var(--juice-to-x); top:var(--juice-to-y); opacity:0; transform:translate(-22%,-18%) rotate(-20deg) scale(.82); } }
            @media (prefers-reduced-motion: reduce) { .juice-particle { animation-duration: .01ms; } .juice-shake { animation-duration: .01ms !important; } }
        `;
        document.head.appendChild(style);
    }

    window.GameJuice = { sound, vibrate, burst, shake, guide, setMuted };
})();
