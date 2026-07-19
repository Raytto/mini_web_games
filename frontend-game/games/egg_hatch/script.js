const eggButton = document.getElementById('egg-button');
const egg = document.getElementById('egg');
const crackLine = document.getElementById('crack-line');
const meterFill = document.getElementById('meter-fill');
const hint = document.getElementById('hint');
const baby = document.getElementById('baby');
const againBtn = document.getElementById('again-btn');
const resultCopy = document.getElementById('result-copy');
const babyName = document.getElementById('baby-name');
const babyRarity = document.getElementById('baby-rarity');
const babyLine = document.getElementById('baby-line');
const confettiLayer = document.getElementById('confetti-layer');
const collectionBadge = document.getElementById('collection-badge');
const COLLECTION_KEY = 'eggHatchCollectionV1';

const HATCHLINGS = [
    { visual: '🐣', name: '小鸡啾啾', line: '刚出壳就开始巡视全场。', weight: 7 },
    { visual: '🐥', name: '软糖小鸭', line: '走路像一颗会摇摆的布丁。', weight: 7 },
    { visual: '🐶', name: '汪汪幼崽', line: '尾巴的转速比风扇还快。', weight: 7 },
    { visual: '🐱', name: '奶盖猫猫', line: '已经把蛋壳当成了纸箱。', weight: 7 },
    { visual: '🐰', name: '棉花兔', line: '耳朵负责收听胡萝卜新闻。', weight: 6 },
    { visual: '🐹', name: '豆沙仓鼠', line: '两边脸颊各藏了一顿饭。', weight: 6 },
    { visual: '🐷', name: '草莓小猪', line: '鼻子自带寻找零食雷达。', weight: 6 },
    { visual: '🐮', name: '奶糖小牛', line: '认真思考今天吃哪片草。', weight: 6 },
    { visual: '🐸', name: '呱呱蛙', line: '擅长把雨天唱成演唱会。', weight: 6 },
    { visual: '🐢', name: '慢慢龟', line: '不着急，快乐总会追上来。', weight: 6 },
    { visual: '🐧', name: '摇摆企鹅', line: '肚皮是天然的滑雪板。', weight: 6 },
    { visual: '🐨', name: '困困考拉', line: '刚出生就申请了午睡。', weight: 5 },
    { visual: '🐼', name: '芝麻团熊猫', line: '黑眼圈是天生的时尚。', weight: 5 },
    { visual: '🦊', name: '橘子狐狸', line: '尾巴像一把蓬松的小扫帚。', weight: 5 },
    { visual: '🦁', name: '蒲公英狮子', line: '吼声暂时只有“咪”。', weight: 5 },
    { visual: '🐯', name: '条纹小虎', line: '正在数自己到底有几条纹。', weight: 5 },
    { visual: '🐵', name: '香蕉猴', line: '把蛋壳戴成了新帽子。', weight: 5 },
    { visual: '🐻', name: '蜂蜜小熊', line: '闻到甜味就会自动导航。', weight: 5 },
    { visual: '🦔', name: '栗子刺猬', line: '看起来扎手，其实很害羞。', weight: 5 },
    { visual: '🐿️', name: '松果松鼠', line: '已经开始建立冬粮仓库。', weight: 5 },
    { visual: '🦦', name: '泡泡水獭', line: '睡觉也要牵着小伙伴。', weight: 5 },
    { visual: '🦥', name: '慢动作树懒', line: '打一个哈欠需要三分钟。', weight: 4 },
    { visual: '🦝', name: '面具浣熊', line: '正在秘密清洗一颗空气。', weight: 4 },
    { visual: '🦭', name: '糯米海豹', line: '一鼓掌就停不下来。', weight: 4 },
    { visual: '🐙', name: '八爪章鱼', line: '可以同时拥抱八个朋友。', weight: 4 },
    { visual: '🦀', name: '横着走螃蟹', line: '从不走寻常的直线。', weight: 4 },
    { visual: '🐳', name: '喷水小鲸', line: '喷泉只开在高兴的时候。', weight: 4 },
    { visual: '🐬', name: '浪花海豚', line: '笑声听起来像小口哨。', weight: 4 },
    { visual: '🦈', name: '奶牙鲨鱼', line: '凶猛地吃掉了一块饼干。', weight: 4 },
    { visual: '🐡', name: '气球河豚', line: '一紧张就把自己吹圆。', weight: 4 },
    { visual: '🦜', name: '彩虹鹦鹉', line: '第一句话是“再来一次”。', weight: 4 },
    { visual: '🦉', name: '夜班猫头鹰', line: '白天困，晚上精神百倍。', weight: 4 },
    { visual: '🦩', name: '草莓火烈鸟', line: '单脚站立也不耽误发呆。', weight: 3 },
    { visual: '🦚', name: '小扇子孔雀', line: '一开心就打开彩色扇子。', weight: 3 },
    { visual: '🦋', name: '糖纸蝴蝶', line: '翅膀像两片会飞的糖纸。', weight: 3 },
    { visual: '🐌', name: '房车蜗牛', line: '走到哪里，家就在哪里。', weight: 3 },
    { visual: '🦇', name: '倒挂蝙蝠', line: '觉得全世界都站反了。', weight: 3 },
    { visual: '🦘', name: '口袋袋鼠', line: '随身携带一个软乎乎的家。', weight: 3 },
    { visual: '🦙', name: '云朵羊驼', line: '脖子负责看见更远的零食。', weight: 3 },
    { visual: '🦒', name: '长长颈鹿', line: '打招呼需要先低头十秒。', weight: 3 },
    { visual: '🐘', name: '喷水大象', line: '鼻子既是水管也是小号。', weight: 3 },
    { visual: '🦛', name: '胖胖河马', line: '泡澡时像一颗紫色汤圆。', weight: 3 },
    { visual: '🦏', name: '按钮犀牛', line: '小角像脑门上的开机键。', weight: 3 },
    { visual: '🦓', name: '条码斑马', line: '没人成功扫出过它的价格。', weight: 3 },
    { visual: '🦕', name: '长脖小恐龙', line: '来自很久很久以前的可爱。', rarity: '稀有', weight: 2 },
    { visual: '🦖', name: '奶凶霸王龙', line: '手很短，但拥抱很认真。', rarity: '稀有', weight: 2 },
    { visual: '🦄', name: '彩虹独角兽', line: '打喷嚏会掉下一点星光。', rarity: '稀有', weight: 2 },
    { visual: '🐲', name: '云朵小龙', line: '只会喷出暖暖的棉花糖。', rarity: '稀有', weight: 2 },
    { image: 'assets/catdog.png', fallback: '🐶', name: '猫猫狗狗', line: '到底该说喵还是汪，这是个问题。', rarity: '传说', weight: 3 },
    { image: 'assets/toast-capybara.png', fallback: '🍞', name: '吐司水豚', line: '情绪稳定，黄油放得也很稳定。', rarity: '传说', weight: 3 }
];
let warmth = 0;
let isHatched = false;
let lastMove = null;
let audioCtx = null;
let lastHatchling = null;
let discoveredNames = loadCollection();

updateCollectionBadge();

function loadCollection() {
    try {
        const stored = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '[]');
        return new Set(Array.isArray(stored) ? stored : []);
    } catch (_) {
        return new Set();
    }
}

function saveCollection() {
    try {
        localStorage.setItem(COLLECTION_KEY, JSON.stringify([...discoveredNames]));
    } catch (_) { /* Collection still works for this visit. */ }
}

function updateCollectionBadge() {
    collectionBadge.textContent = discoveredNames.size === HATCHLINGS.length
        ? '动物图鉴集齐啦！'
        : `动物图鉴 ${discoveredNames.size}/${HATCHLINGS.length}`;
    collectionBadge.classList.toggle('complete', discoveredNames.size === HATCHLINGS.length);
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playTone(kind) {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = kind === 'hatch' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(kind === 'hatch' ? 520 : 320, now);
    osc.frequency.linearRampToValueAtTime(kind === 'hatch' ? 980 : 520, now + 0.16);
    gain.gain.setValueAtTime(kind === 'hatch' ? 0.22 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
    osc.start(now);
    osc.stop(now + 0.3);
}

function addWarmth(amount) {
    if (isHatched) return;
    warmth = Math.min(100, warmth + amount);
    eggButton.classList.remove('needs-guide');
    window.GameJuice?.vibrate(8);
    meterFill.style.width = `${warmth}%`;
    eggButton.classList.add('warming');
    setTimeout(() => eggButton.classList.remove('warming'), 150);

    if (warmth >= 45) {
        eggButton.classList.add('cracked');
        crackLine.style.transform = `rotate(${10 + warmth / 4}deg)`;
    }

    if (warmth >= 100) {
        hatch();
    }
}

function hatch() {
    isHatched = true;
    playTone('hatch');
    eggButton.classList.add('hidden');
    hint.classList.add('hidden');

    const hatchling = chooseHatchling();
    const isNew = !discoveredNames.has(hatchling.name);
    discoveredNames.add(hatchling.name);
    saveCollection();
    updateCollectionBadge();
    renderHatchling(hatchling);
    baby.classList.remove('hidden');
    resultCopy.classList.remove('hidden');
    againBtn.classList.remove('hidden');
    burstConfetti();
    window.GameJuice?.sound(hatchling.rarity ? 'complete' : 'sparkle');
    window.GameJuice?.vibrate([24, 40, 28]);
    window.GameJuice?.burst(document.getElementById('stage'), { count: hatchling.rarity ? 26 : 18, symbols: ['★', '✦', '❤'] });
    if (isNew) {
        babyRarity.textContent = `新朋友 · ${hatchling.rarity || '常见'}`;
        babyRarity.dataset.rarity = hatchling.rarity || '常见';
    }
}

function chooseHatchling() {
    const unseen = HATCHLINGS.filter((item) => !discoveredNames.has(item.name) && item !== lastHatchling);
    const source = unseen.length > 0 && Math.random() < 0.72 ? unseen : HATCHLINGS;
    const pool = source.filter((item) => item !== lastHatchling || source.length === 1);
    const totalWeight = pool.reduce((total, item) => total + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of pool) {
        roll -= item.weight;
        if (roll <= 0) {
            lastHatchling = item;
            return item;
        }
    }

    lastHatchling = pool[pool.length - 1];
    return lastHatchling;
}

function renderHatchling(hatchling) {
    baby.replaceChildren();

    if (hatchling.image) {
        const image = document.createElement('img');
        image.src = hatchling.image;
        image.alt = hatchling.name;
        image.addEventListener('error', () => {
            baby.textContent = hatchling.fallback || '🐾';
        }, { once: true });
        baby.appendChild(image);
    } else {
        baby.textContent = hatchling.visual;
        baby.setAttribute('aria-label', hatchling.name);
    }

    babyName.textContent = hatchling.name;
    babyRarity.textContent = hatchling.rarity || '常见';
    babyRarity.dataset.rarity = hatchling.rarity || '常见';
    babyLine.textContent = hatchling.line;
}

function burstConfetti() {
    const colors = ['#ff7b54', '#ffd451', '#55c7ff', '#9d6cff', '#ff78ad', '#ffffff'];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 28; i += 1) {
        const piece = document.createElement('span');
        const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.25;
        const distance = 110 + Math.random() * 170;
        piece.className = 'confetti';
        piece.style.left = `${50 + (Math.random() - 0.5) * 8}%`;
        piece.style.top = `${46 + (Math.random() - 0.5) * 8}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
        piece.style.setProperty('--y', `${Math.sin(angle) * distance + 90}px`);
        piece.style.setProperty('--r', `${Math.round(Math.random() * 720 - 360)}deg`);
        fragment.appendChild(piece);
    }

    confettiLayer.replaceChildren(fragment);
    setTimeout(() => confettiLayer.replaceChildren(), 1000);
}

function resetGame() {
    warmth = 0;
    isHatched = false;
    lastMove = null;
    meterFill.style.width = '0%';
    eggButton.classList.remove('hidden', 'cracked', 'warming');
    baby.classList.add('hidden');
    baby.replaceChildren();
    resultCopy.classList.add('hidden');
    againBtn.classList.add('hidden');
    hint.classList.remove('hidden');
    hint.textContent = '点一点敲一敲，也可以拖着摸摸';
    eggButton.classList.add('needs-guide');
}

function getPoint(e) {
    const touch = e.touches?.[0] || e.changedTouches?.[0] || e;
    return { x: touch.clientX, y: touch.clientY };
}

eggButton.addEventListener('click', () => {
    playTone('tap');
    addWarmth(14);
});

eggButton.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    lastMove = { x: e.clientX, y: e.clientY };
    eggButton.setPointerCapture?.(e.pointerId);
});

eggButton.addEventListener('pointermove', (e) => {
    if (!lastMove || isHatched) return;
    const distance = Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y);
    if (distance > 18) {
        addWarmth(5);
        lastMove = { x: e.clientX, y: e.clientY };
    }
});

eggButton.addEventListener('pointerup', () => {
    lastMove = null;
});

eggButton.addEventListener('pointercancel', () => {
    lastMove = null;
});

againBtn.addEventListener('click', resetGame);
