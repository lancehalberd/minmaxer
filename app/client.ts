console.log('Hello World!');

const frameLength = 20;
const framesPerSecond = 1000 / frameLength;

const canvas: HTMLCanvasElement = document.getElementsByClassName('js-mainCanvas')[0] as HTMLCanvasElement;
const context = canvas.getContext('2d');

const nexus: Nexus = {
    x: 0,
    y: 0,
    r: 20,
    color: '#0FF',
    level: 1,
    essence: 100,
    health: 10,
    maxHealth: 10,
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
    },
    update(state: GameState) {
    },
}
const hero: Hero = {
    x: 50,
    y: 50,
    r: 10,
    speed: 5,
    color: 'blue',
    level: 1,
    health: 20,
    maxHealth: 20,
    damage: 1,
    attackSpeed: 2,
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
    },
    update(state: GameState) {
        const hero = this;
        if (hero.target) {
            // Move hero until it reaches the target.
            const dx = hero.target.x - hero.x, dy = hero.target.y - hero.y;
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag < hero.speed) {
                hero.x = hero.target.x;
                hero.y = hero.target.y;
            } else {
                hero.x += hero.speed * dx / mag;
                hero.y += hero.speed * dy / mag;
            }

            // Remove the target once they reach their destination.
            if (hero.x === hero.target.x && hero.y === hero.target.y) {
                delete hero.target;
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
    },
    update(this: Spawner, state: GameState) {
        if (this.spawnedEnemies.length >= this.spawnLimit) {
            return;
        }
        // If we have no spawn time or it has been longer than the spawn cooldown, spawn a new enemy.
        if (!this.lastSpawnTime || state.world.time - this.lastSpawnTime >= this.spawnCooldown) {
            console.log(state.world.time);
            const enemy: Enemy = {
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
function updateEnemy(this: Enemy, state: GameState) {
    if (this.attackTarget) {
        const pixelsPerFrame = this.movementSpeed / framesPerSecond;
        // Move this until it reaches the target.
        const dx = this.attackTarget.x - this.x, dy = this.attackTarget.y - this.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag < pixelsPerFrame) {
            this.x = this.attackTarget.x;
            this.y = this.attackTarget.y;
        } else {
            this.x += pixelsPerFrame * dx / mag;
            this.y += pixelsPerFrame * dy / mag;
        }

        // Remove the target once they reach their destination.
        if (this.x === this.attackTarget.x && this.y === this.attackTarget.y) {
            delete this.attackTarget;
        }
    } else {
        this.attackTarget = nexus;
    }
}
function renderEnemy(this: Enemy, context: CanvasRenderingContext2D, state: GameState) {
    fillCircle(context, this);
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
    attackSpeed: 1,
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
    context.fillStyle = 'green';
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

canvas.onclick =  function (event: MouseEvent) {
    state.hero.target = convertToWorldPosition(getMousePosition(event, canvas, 3));
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
