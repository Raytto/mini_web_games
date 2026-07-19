const container = document.getElementById('game-container');
const foodSource = document.getElementById('food-source');

const fishTypes = [
    { name: 'clownfish', img: 'clownfish.png?v=10', width: 96, height: 58, baseSpeed: 0.28, maxSpeed: 0.72 },
    { name: 'whale', img: 'whale.png?v=9', width: 360, height: 150, fitWidth: true, baseSpeed: 0.22, maxSpeed: 0.58 },
    { name: 'shark', img: 'shark.png?v=9', width: 230, height: 130, fitWidth: true, baseSpeed: 0.34, maxSpeed: 0.88 },
    { name: 'turtle', img: 'turtle.png?v=2', width: 130, height: 79, baseSpeed: 0.18, maxSpeed: 0.46 },
    { name: 'manta', img: 'manta.png?v=1', width: 160, height: 114, baseSpeed: 0.22, maxSpeed: 0.52 },
    { name: 'pufferfish', img: 'pufferfish.png?v=2', width: 96, height: 82, baseSpeed: 0.25, maxSpeed: 0.62 }
];

let fishes = [];
let foods = [];
let draggedFood = null;
// Fish Class
class Fish {
    constructor(type, startOnScreen = false) {
        this.type = type;

        let direction;
        if (startOnScreen) {
            // Spawn anywhere visible
            this.x = Math.random() * (container.clientWidth - type.width);
            // Random direction
            direction = Math.random() < 0.5 ? 1 : -1;
        } else {
            // Spawn just off-screen
            const leftSide = Math.random() < 0.5;
            this.x = leftSide ? -type.width : container.clientWidth;
            direction = leftSide ? 1 : -1;
        }

        this.y = Math.random() * (container.clientHeight - type.height - 100); // Avoid very bottom
        this.vx = direction * (type.baseSpeed * (0.8 + Math.random() * 0.4));
        this.vy = (Math.random() - 0.5) * 0.5 * 0.33; // Reduced initial vertical speed
        this.direction = direction; // 1 = right, -1 = left

        // Outer container for position (remove facing)
        this.element = document.createElement('div');
        this.element.className = 'fish';
        this.element.style.width = `${type.width}px`;
        this.element.style.height = `${type.height}px`;
        this.element.style.left = '0px';
        this.element.style.top = '0px';

        // Flip wrapper for smooth turning
        this.flipWrapper = document.createElement('div');
        this.flipWrapper.style.width = '100%';
        this.flipWrapper.style.height = '100%';
        this.flipWrapper.style.transition = 'transform 0.4s ease-in-out'; // Animation!
        this.flipWrapper.style.transformStyle = 'preserve-3d';

        // Inner container for wiggle animation
        this.inner = document.createElement('div');
        this.inner.style.width = '100%';
        this.inner.style.height = '100%';
        this.inner.style.backgroundImage = `url(${type.img})`;
        // Whale and shark assets use square canvases with wide transparent margins.
        // Fit them by width so the visible animal matches its gameplay dimensions.
        this.inner.style.backgroundSize = type.fitWidth ? '100% auto' : 'contain';
        this.inner.style.backgroundRepeat = 'no-repeat';
        this.inner.style.backgroundPosition = 'center';

        // Apply wiggle animation
        // Randomize delay so they don't sync
        const delay = Math.random() * 2;
        let baseDuration = 0.5 + Math.random() * 0.5;
        let animName = 'swim';

        if (this.type.name === 'shark') {
            baseDuration *= 3;
        } else if (this.type.name === 'whale') {
            baseDuration *= 5;
            animName = 'whale-swim'; // Use more subtle animation
        }
        this.inner.style.animation = `${animName} ${baseDuration}s infinite ease-in-out -${delay}s`;

        this.flipWrapper.appendChild(this.inner);
        this.element.appendChild(this.flipWrapper);

        // IMPORTANT: Set initial transform immediately to avoid 1-frame flash at (0,0)
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
        this.flipWrapper.style.transform = `scaleX(${this.direction})`;

        container.appendChild(this.element);

        this.state = 'wandering'; // wandering, chasing, eating
        this.targetFood = null;
    }

    update(dt) {
        // AI Logic
        this.findFood();

        // Movement
        if (this.targetFood) {
            // Chase food
            // Use mouth position (leading edge)
            // Food is small (20px), use center (x+10, y+10)
            const foodCenterX = this.targetFood.x + 10;
            const foodCenterY = this.targetFood.y + 10;

            const mouthX = this.direction === 1 ? (this.x + this.type.width) : this.x;
            const mouthY = this.y + this.type.height / 2;

            const dx = foodCenterX - mouthX;
            const dy = foodCenterY - mouthY;

            // Enhanced Eating Logic
            // Problem: Large fish (Whale/Shark) might overshoot the food slightly or have the food
            // fall "behind" the exact mouth point (inside the head area) between frames.
            // If we only use a radius check, this causes the fish to try to turn around (flip-flop), 
            // creating a vibrating effect where they never catch the food.

            // Solution: Use a "Mouth Box" check.
            // We define "Forward" distance relative to current facing.
            // Positive = In front of mouth. Negative = Behind mouth (Inside head).
            const forwardDist = this.direction === 1 ? dx : -dx;
            const verticalDist = Math.abs(dy);

            // Eating Thresholds:
            // Vertical: Within 60px (allows for mouth height tolerance)
            // Horizontal: From -150px (deep inside mouth/head) to +50px (just in reach)
            // This huge negative buffer prevents the flip-flop for large fish.
            const canEat = verticalDist < 60 && forwardDist > -150 && forwardDist < 50;

            if (canEat) {
                // Eat
                this.eat(this.targetFood);
            } else {
                // Accelerate towards food
                const angle = Math.atan2(dy, dx);
                const speed = this.type.maxSpeed * 2; // Double speed when chasing
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
            }
        } else {
            // Wandering Behavior

            // 1. Randomly change vertical speed (Floating effect)
            if (Math.random() < 0.05) {
                this.vy += (Math.random() - 0.5) * 0.5 * 0.33; // Reduced variation
            }

            // 2. Randomly change horizontal speed (Variable swimming pace)
            if (Math.random() < 0.05) {
                const currentDir = Math.sign(this.vx) || 1;
                let speed = Math.abs(this.vx);
                speed += (Math.random() - 0.5) * 0.2;

                // Clamp speed limits
                const minS = this.type.baseSpeed * 0.5;
                const maxS = this.type.maxSpeed * 1.5;
                speed = Math.max(minS, Math.min(maxS, speed));

                this.vx = currentDir * speed;
            }

            // 3. Randomly flip direction
            if (Math.random() < 0.0001) {
                this.vx = -this.vx;
            }

            // Clamp vy to keep movement reasonable
            this.vy = Math.max(-2, Math.min(2, this.vy));
        }

        this.x += this.vx;
        this.y += this.vy;

        // Facing direction
        if (Math.abs(this.vx) > 0.1) {
            this.direction = this.vx > 0 ? 1 : -1;
        }

        // Apply Transform to OUTER element (Position only)
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;

        // Apply Transform to FLIP wrapper (Facing)
        this.flipWrapper.style.transform = `scaleX(${this.direction})`;

        // No frame update needed

        // Bounds Check (Remove if far off screen)
        // Use a smaller buffer so they respawn sooner. Whale is ~1100px.
        const margin = this.type.width + 200;
        if (this.x < -margin || this.x > container.clientWidth + margin) {
            this.remove();
            return false; // Removed
        }
        return true; // Still active
    }

    findFood() {
        if (this.targetFood && !foods.includes(this.targetFood)) {
            this.targetFood = null;
        }
        if (this.targetFood) return; // Already chasing

        let closest = null;
        let minInfo = 300; // Awareness radius

        for (let food of foods) {
            const dx = food.x - (this.x + this.type.width / 2);
            const dy = food.y - (this.y + this.type.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minInfo) {
                minInfo = dist;
                closest = food;
            }
        }

        if (closest) {
            this.targetFood = closest;
        }
    }

    eat(food) {
        // Remove food
        const idx = foods.indexOf(food);
        if (idx > -1) {
            foods.splice(idx, 1);
            food.element.remove();
        }
        this.targetFood = null;

        // Visual Effect
        // Temporarily override swim animation with eating animation
        this.inner.classList.add('eating-anim');

        // Spawn Happy Expression
        const emoji = document.createElement('div');
        emoji.innerText = '😍';
        emoji.style.position = 'absolute';
        emoji.style.fontSize = '40px';
        emoji.style.pointerEvents = 'none';

        // Calculate mouth position logic again
        // Front (direction * width) + a bit forward (+30)
        // Top (height/2) - a bit up (-40)
        const mouthX = this.direction === 1 ? (this.x + this.type.width) : this.x;
        const mouthY = this.y + this.type.height / 2;

        // "Front Top" offset
        // If facing right: x + 20, y - 50
        // If facing left: x - 50 (since font size is ~40), y - 50
        const offsetX = this.direction === 1 ? 20 : -60;
        const offsetY = -60;

        emoji.style.left = `${mouthX + offsetX}px`;
        emoji.style.top = `${mouthY + offsetY}px`;
        emoji.style.zIndex = '200';
        // Add animation class via JS or inline
        emoji.style.transition = 'all 1s ease-out';
        emoji.style.transform = 'scale(0)';

        container.appendChild(emoji);

        // Trigger animation
        requestAnimationFrame(() => {
            emoji.style.transform = 'scale(1) translateY(-30px)';
            emoji.style.opacity = '1';
        });

        // Cleanup
        setTimeout(() => {
            emoji.style.opacity = '0';
            setTimeout(() => emoji.remove(), 200);
        }, 800);

        // Remove class after animation to resume swimming
        setTimeout(() => {
            this.inner.classList.remove('eating-anim');
        }, 500);

        // Reset velocity to wandering feel
        this.vx = (this.direction) * this.type.baseSpeed;
        this.vy = 0;
    }

    remove() {
        this.element.remove();
    }
}



function updateFishes(dt) {
    fishes = fishes.filter(fish => fish.update(dt));
}

// Food Logic
class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 0.11; // Initial fall speed (reduced again)
        this.dragging = false;
        this.element = document.createElement('div');
        this.element.className = 'food';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        container.appendChild(this.element);
    }

    update() {
        if (this.dragging) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
            return true;
        }

        this.vy += 0.005; // Gravity (approx 1/3 of 0.016)
        if (this.vy > 0.33) this.vy = 0.33; // Terminal velocity (1/3 of 1)

        this.y += this.vy;

        // Use top/left for positioning. Do not use transform as it adds to the offset.
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;

        if (this.y > container.clientHeight) {
            this.element.remove();
            return false;
        }
        return true;
    }
}

function updateFoods(dt) {
    foods = foods.filter(food => food.update());
}

// Interaction
// Interaction: tap to drop, or drag from the food source.
if (foodSource) {
    foodSource.style.display = 'block';
}

function getClientPoint(e) {
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    return { clientX: touch.clientX, clientY: touch.clientY };
}

function spawnFood(e) {
    // Prevent default only if necessary (e.g. to stop zooming)
    // e.preventDefault(); 

    const rect = container.getBoundingClientRect();
    // Handle both mouse and touch events
    let { clientX, clientY } = getClientPoint(e);

    const x = clientX - rect.left - 10; // Center food roughly on tap
    const y = clientY - rect.top - 10;

    const food = new Food(x, y);
    foods.push(food);
}

function startDragFood(e) {
    if (!foodSource) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = container.getBoundingClientRect();
    const { clientX, clientY } = getClientPoint(e);
    draggedFood = new Food(clientX - rect.left - 10, clientY - rect.top - 10);
    draggedFood.dragging = true;
    foods.push(draggedFood);
}

function moveDragFood(e) {
    if (!draggedFood) return;
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    const { clientX, clientY } = getClientPoint(e);
    draggedFood.x = clientX - rect.left - 10;
    draggedFood.y = clientY - rect.top - 10;
}

function endDragFood() {
    if (!draggedFood) return;
    draggedFood.dragging = false;
    draggedFood = null;
}

// Bind click/tap to container
container.addEventListener('mousedown', spawnFood);
container.addEventListener('touchstart', (e) => {
    // Prevent default to avoid simulating click after touch (double firing) if needed,
    // but usually nice to strictly handle touch. 
    // We'll use preventDefault to stop scrolling while playing.
    if (e.cancelable) e.preventDefault();
    spawnFood(e);
}, { passive: false });

if (foodSource) {
    foodSource.addEventListener('mousedown', startDragFood);
    foodSource.addEventListener('touchstart', startDragFood, { passive: false });
    window.addEventListener('mousemove', moveDragFood);
    window.addEventListener('touchmove', moveDragFood, { passive: false });
    window.addEventListener('mouseup', endDragFood);
    window.addEventListener('touchend', endDragFood);
}




// Spawner
function spawnFish(startOnScreen = false) {
    const targets = {
        'clownfish': 3,
        'whale': 1,
        'shark': 1,
        'turtle': 2,
        'manta': 1,
        'pufferfish': 2
    };
    const currentCounts = { 'clownfish': 0, 'whale': 0, 'shark': 0, 'turtle': 0, 'manta': 0, 'pufferfish': 0 };

    fishes.forEach(f => {
        if (targets.hasOwnProperty(f.type.name)) {
            currentCounts[f.type.name]++;
        }
    });

    const candidates = fishTypes.filter(type => currentCounts[type.name] < targets[type.name]);

    if (candidates.length > 0) {
        const type = candidates[Math.floor(Math.random() * candidates.length)];
        const fish = new Fish(type, startOnScreen);
        fishes.push(fish);
    }
}

// Initialize some fish
for (let i = 0; i < 10; i++) {
    if (fishes.length >= 7) break;
    spawnFish(true);
}


// Game Loop
let lastTime = 0;
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    updateFishes(deltaTime);
    updateFoods(deltaTime);

    // Spawner
    if (Math.random() < 0.006 && fishes.length < 8) {
        spawnFish();
    }

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
