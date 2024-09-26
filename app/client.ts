console.log('Hello World!');

// Each frame is 20 milliseconds.
const frameLength = 20;
const framesPerSecond = 1000 / frameLength;

const canvas: HTMLCanvasElement = document.getElementsByClassName('js-mainCanvas')[0] as HTMLCanvasElement;
const context = canvas.getContext('2d');

// Add tasks to github project and assign some tasks
/*
* Fix clicking:
    Problem: If you click on an enemy and drag 1 pixel, you won't attack them.
    Problem: If you click and hold but don't move the mouse, the hero stops moving towards the mouse.
* Make the game reset when the Nexus dies.
* Implement experience gain and leveling up for the hero.
* Implement hero selection at the start of the game.
    * Create three starter hero definitions: Melee, Ranged, Magic
    * Add an action to an uncontroller hero to gain control of it
* Implement hero death and respawn mechanics.
* Implement hero abilities
    * use on cooldown for now
* Implement nexus abilities

*/

const nexus: Nexus = {
    objectType: 'nexus',
    x: 0,
    y: 0,
    r: 20,
    color: '#0FF',
    level: 1,
    essence: 100,
    health: 10,
    maxHealth: 10,
    render(this: Nexus, context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        renderLifeBar(context, this, this.health, this.maxHealth);
    },
    update(state: GameState) {
    },
}
const hero: Hero = {
    objectType: 'hero',
    x: 50,
    y: 50,
    r: 10,
    movementSpeed: 100,
    color: 'blue',
    level: 1,
    health: 20,
    maxHealth: 20,
    damage: 1,
    attacksPerSecond: 2,
    render(this: Hero, context: CanvasRenderingContext2D, state: GameState) {
        // Draw a circle for the hero centered at their location, with their radius and color.
        fillCircle(context, this);

        if (this.target) {
            fillCircle(context, {
                ...this.target,
                r: 2,
                color: 'blue',
            });
        }
        renderLifeBar(context, this, this.health, this.maxHealth);
    },
    update(this: Hero, state: GameState) {
        if (this.attackTarget) {
            const pixelsPerFrame = this.movementSpeed / framesPerSecond;
            // Move this until it reaches the target.
            const dx = this.attackTarget.x - this.x, dy = this.attackTarget.y - this.y;
            const mag = Math.sqrt(dx * dx + dy * dy);
            // Attack the target when it is in range.
            if (mag <= this.r + this.attackTarget.r) {
                // Attack the target if the enemy's attack is not on cooldown.
                const attackCooldown = 1000 / this.attacksPerSecond;
                if (!this.lastAttackTime || this.lastAttackTime + attackCooldown <= state.world.time) {
                    damageTarget(state, this.attackTarget, this.damage);
                    this.lastAttackTime = state.world.time;
                    if (this.attackTarget.objectType === 'enemy') {
                        this.attackTarget.attackTarget = this;
                    }
                }

                // Remove the attack target when it is dead.
                if (this.attackTarget.health <= 0) {
                    delete this.attackTarget;
                }
                return;
            }

            if (mag < pixelsPerFrame) {
                this.x = this.attackTarget.x;
                this.y = this.attackTarget.y;
            } else {
                this.x += pixelsPerFrame * dx / mag;
                this.y += pixelsPerFrame * dy / mag;
            }
            return;
        }
        if (this.target) {
            // Move hero until it reaches the target.
            const pixelsPerFrame = this.movementSpeed / framesPerSecond;
            const dx = this.target.x - this.x, dy = this.target.y - this.y;
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag < pixelsPerFrame) {
                this.x = this.target.x;
                this.y = this.target.y;
            } else {
                this.x += pixelsPerFrame * dx / mag;
                this.y += pixelsPerFrame * dy / mag;
            }

            // Remove the target once they reach their destination.
            if (this.x === this.target.x && this.y === this.target.y) {
                delete this.target;
            }
        } else {
            // hero.target = {
            //     x: hero.r + Math.floor(Math.random() * (canvas.width - 2 * hero.r)),
            //     y: hero.r + Math.floor(Math.random() * (canvas.height - 2 * hero.r)),
            // };
        }
    }
}
const snakeSpawner: Spawner = {
    objectType: 'spawner',
    x: 300,
    y: 300,
    r: 20,
    color: 'purple',
    enemyType: 'snake',
    spawnCooldown: 2000,
    spawnLimit: 3,
    spawnedEnemies: [],
    health: 50,
    maxHealth: 50,
    render(this: Spawner, context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        renderLifeBar(context, this, this.health, this.maxHealth);
    },
    update(this: Spawner, state: GameState) {
        // Remove any dead enemies from the array of spawned enemies this spawner is tracking.
        this.spawnedEnemies = this.spawnedEnemies.filter(enemy => enemy.health > 0);
        if (this.spawnedEnemies.length >= this.spawnLimit) {
            return;
        }
        // If we have no spawn time or it has been longer than the spawn cooldown, spawn a new enemy.
        if (!this.lastSpawnTime || state.world.time - this.lastSpawnTime >= this.spawnCooldown) {
            const enemy: Enemy = {
                objectType: 'enemy',
                ...enemyDefinitions[this.enemyType],
                update: updateEnemy,
                render: renderEnemy,
                x: this.x,
                y: this.y,
            };
            this.spawnedEnemies.push(enemy);
            state.world.objects.push(enemy);
            this.lastSpawnTime = state.world.time;
        }
    },
}
function damageTarget(state: GameState, target: AttackTarget, damage: number) {
    if (damage < 0) {
        return
    }
    target.health = Math.max(0, target.health - damage);
    if (target.health <= 0) {
        // remove the object from the state when it dies.
        const objectIndex = state.world.objects.indexOf(target);
        if (objectIndex >= 0) {
            state.world.objects.splice(objectIndex, 1);
        }
    }
}
function updateEnemy(this: Enemy, state: GameState) {
    if (this.attackTarget) {
        const pixelsPerFrame = this.movementSpeed / framesPerSecond;
        // Move this until it reaches the target.
        const dx = this.attackTarget.x - this.x, dy = this.attackTarget.y - this.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        // Attack the target when it is in range.
        if (mag <= this.r + this.attackTarget.r) {
            // Attack the target if the enemy's attack is not on cooldown.
            const attackCooldown = 1000 / this.attacksPerSecond;
            if (!this.lastAttackTime || this.lastAttackTime + attackCooldown <= state.world.time) {
                damageTarget(state, this.attackTarget, this.damage);
                this.lastAttackTime = state.world.time;
            }

            // Remove the attack target when it is dead.
            if (this.attackTarget.health <= 0) {
                delete this.attackTarget;
            }
            return;
        }

        if (mag < pixelsPerFrame) {
            this.x = this.attackTarget.x;
            this.y = this.attackTarget.y;
        } else {
            this.x += pixelsPerFrame * dx / mag;
            this.y += pixelsPerFrame * dy / mag;
        }
    } else {
        this.attackTarget = nexus;
    }
}
function renderEnemy(this: Enemy, context: CanvasRenderingContext2D, state: GameState) {
    if (state.hero.attackTarget === this) {
        fillCircle(context, {...this, r: this.r + 2, color: '#FFF'});
    }
    fillCircle(context, this);
    renderLifeBar(context, this, this.health, this.maxHealth);
}


const state: GameState = {
    hero,
    world: {
        time: 1000,
        camera: {x: 0, y: 0},
        objects: [nexus, hero, snakeSpawner],
    }
};

const enemyDefinitions: {[key in EnemyType]?: EnemyDefinition} = {};

enemyDefinitions.snake = {
    name: 'Snake',
    color: 'red',
    r: 10, x: 0, y: 0,
    level: 1,
    health: 4,
    maxHealth: 4,
    damage: 1,
    attacksPerSecond: 1,
    experience: 2,
    essence: 1,
    movementSpeed: 50,
    aggroRadius: 200,
};

function update() {
    for (const object of state.world.objects) {
        object.update(state);
    }
    // Move the camera so the hero is in the center of the screen:
    state.world.camera.x = state.hero.x - canvas.width / 2;
    state.world.camera.y = state.hero.y - canvas.height / 2;
    state.world.time += 20;
}
// Run update at 50FPS (once every 20 milliseconds).
setInterval(update, 20);

function render() {
    // Erase the previous frame.
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#CC4';
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.save();
        context.translate(-state.world.camera.x, -state.world.camera.y);
        for (const object of state.world.objects) {
            object.render(context, state);
        }
    context.restore();

    window.requestAnimationFrame(render);
}
window.requestAnimationFrame(render);


function fillCircle(context: CanvasRenderingContext2D, circle: Circle) {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
    context.fillStyle = circle.color;
    context.fill();
}

function fillRect(context: CanvasRenderingContext2D, {x, y, w, h}: Rect, color?: string) {
    if (color) {
        context.fillStyle = color;
    }
    context.fillRect(x, y, w, h);
}

function pad({x, y, w, h}: Rect, amount: number): Rect {
    return {
        x: x - amount,
        y: y - amount,
        w: w + 2 * amount,
        h: h + 2 * amount,
    };
}

function renderLifeBar(context: CanvasRenderingContext2D, circle: Circle, health: number, maxHealth: number) {
    const barHeight = 5;
    const padding = 5;
    const bar: Rect = {
        x: circle.x - circle.r,
        y: circle.y - circle.r - padding - barHeight,
        w: 2 * circle.r,
        h: barHeight,
    }
    // Draw a white box for an outline around the bar.
    fillRect(context, pad(bar, 1), '#FFF');
    // Draw a black box for the full bar.
    fillRect(context, bar, '#000');
    // Draw a colored box over the black box to indicate percent life left.
    fillRect(context, {
        ...bar,
        w: bar.w * health / maxHealth,
    }, health >= maxHealth / 2 ? '#080' : '#F80');
}

function isPointInCircle(this: void, circle: Circle, {x, y}: Point) {
    const dx = circle.x - x, dy = circle.y - y;
    const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
    return distanceToCenter <= circle.r;
}

let isMouseDownOnCanvas = false;

canvas.addEventListener('mousedown', (event: MouseEvent) => {
    isMouseDownOnCanvas = true;
    setMovementTarget(state, event);
});

document.addEventListener('mouseup', (event: MouseEvent) => {
    isMouseDownOnCanvas = false;
});

canvas.addEventListener('mousemove', (event: MouseEvent) => {
    // Don't do anything if the mouse wasn't pressed over the canvas.
    if (!isMouseDownOnCanvas) {
        return;
    }
    setMovementTarget(state, event);
});

function setMovementTarget(state: GameState, event: MouseEvent) {

    const worldTarget = convertToWorldPosition(getMousePosition(event, canvas, 3));
    delete state.hero.attackTarget;
    state.hero.target = worldTarget;
}

canvas.onclick =  function (event: MouseEvent) {
    const worldTarget = convertToWorldPosition(getMousePosition(event, canvas, 3));
    // Check if the user has clicked on an object.
    for (const object of state.world.objects) {
        if (object.objectType !== 'enemy' && object.objectType !== 'spawner') {
            continue;
        }
        // Did they click on this object?
        if (!isPointInCircle(object, worldTarget)) {
            continue;
        }
        state.hero.attackTarget = object;
        delete state.hero.target;
        return;
    }
    // If not attack target was found, set a movement target.
    delete state.hero.attackTarget;
    state.hero.target = worldTarget;
}

function convertToWorldPosition(canvasPoint: Point): Point {
    return {
        x: canvasPoint.x + state.world.camera.x,
        y: canvasPoint.y + state.world.camera.y,
    }
}

export function getMousePosition(event: MouseEvent, container: HTMLElement = null, scale = 1): Point {
    if (container) {
        const containerRect:DOMRect = container.getBoundingClientRect();
        return {
            x: (event.pageX - containerRect.x) / scale,
            y: (event.pageY - containerRect.y) / scale,
        };
    }
    return {x: event.pageX / scale, y: event.pageY / scale};
}
