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
    Transition to game over screen:
        Stop regular updates to the scene
        Pan camera back to the nexus
        Fade everything to black except the Nexus (eventually the nexus would show a destruction animation during this)
        Fade in text "Nexus Destroyed"
        Maybe add some statistics from the run like hero level, enemies defeated
        Click on Nexus to rewind to the start of the game
            For now just reset the game state to the initial state when they click the Nexus.
                Except fade the world in to the new state.
            Eventually we will need to only reset the state for the world itself, but not data that is tracked between runs.
            This would also play the destroyed nexus animation in reverse as we fade the world back in to its new state
* Implement experience gain and leveling up for the hero.
    * Derive stats from level to be close to these values with linear easing between:
        * level 1: health: 20, damage: 2, aps: 2, ms: 100
        * level 20: health: 400, damage: 40, aps: 2, ms: 150
    * Experience per level 10 * level ^ 2 (10 XP to reach level 2, 40XP to reach level 3, 90XP...)
    * 10% XP penalty per level over enemy. If an enemy is 5 levels below the hero, the hero only gains 50% as much experience from defeating it.
* Show Nexus Essence bar at the top of the screen with current/target taking about about 1/3 of the screen.
    * Essence should increase slowly over time.
    * Defeating monsters should increase essence.
    * Essence functions as life/money/experience for the Nexus
    * Add function for previewing essence costs that colors in the part of the bar that will be lost if essence colored orange or yellow.
    * Essence numbers
        Start with 100 Essence
        First goal is 200, 1000, 5k, 10k goals after that
        Unlock building a tower at 200 essence
        Unlock equipment creation at 1000 essence
        Unlock essence -> hero XP ability at 5K essence
        Unlock second champion slot at 10K essence
        Up 5 champions can be controlled eventually.
        Cost of anointing champion is based on the champion. Starter champions all cost 50 essence.
            More advanced champions might have higher base level and initial essence cost.
* Implement hero selection at the start of the game.
    * Add attack range stat to hero+monsters
        * 10px for melee hero/monster
        * ~50px for ranged attacks for now.
    * Create three starter hero definitions: Melee, Ranged, Magic
        * Eventually should have a tooltip on hover that describes the hero and stats and abilities.
        * Add hero definition, this should include functions for determining states from level
        * Add support for ranged attacks for Ranged+Magic hero, set attack type in hero definition
        * Don't include hero abilities yet, that is in a separate task.
    * Add uncontrolled heroes around the Nexus to the initial state.
        Each hero has a button over them labeled "Anoint Champion for 100 essence"
        Mouse over the button should preview the 50 essence cost on the essense bar HUD element
        Clicking this button will convert the champion to be controlled and make it selected
        The selected champion responds to clicks that don't interact with specific UI buttons.
    * Add an action to an uncontrolled hero to gain control of it.
* Implement hero death and respawn mechanics.
    * When a hero dies the Nexus has an ability for respawning them.
        * Add a hud element for each controlled hero to the left side
        * Clicking a hero hud element selects that hero if unselected, or pans camera to them if already selected
        * When a hero is dead, render a button over the hud element with essence cost for reviving.
            * Essence cost is (5 + hero level) essence per second left on cooldown
            * cooldown is 5 seconds per hero level
            * cooldown scales by 10% each time revive is used during the current run, so the more heroes are revived,
                the more expensive it is to revive for the rest of the run. This cost is additive, so on three revives, it is 30% more expensive.
* Implement hero abilities
    * use on cooldown for now
    * eventually we will want to be able to choose when and where to use this and be able to turn off autocasting.
    Melee
        Active: Spin Strike
            AoE circle attack that does 25/35/45/55/65% increased base damage, and radius is 1.1/1.2/1.3/1.4/1.5x base radius
            Cooldown is 5s
        Passive: Battle Rager
            Attack speed increase by 5%/6%/7%/8%/10% per hit up to 30%/35/40/45/50 increased attack speed
            This effect ends if the character does not attack for 2 seconds.
    Range
        Active: Piercing Shot
            Piercing skill shot with 80/90/100/110/120 range that does 1.5/1.7/1.9/2.1/2.3
            Cooldown is 8s
        Passive: Critical Shot
            20/21/22/23/25% chance to deal 1.5/1.6/1.7/1.8/2x damage
    Magic
        Active: Fire ball
            Area of Effect skill that does 40/45/50/55/60% increased damage over an area that is 1.4/1.55/1.70/1.85/2x base radius
                Range is 80
            Cooldown is 10s
        Passive: Fortress
            Prevents 50/55/60/65/70% incoming damage from the next 1/2/2/3/3 sources
            Barrier refreshes to full after 3/3/3/4/4 seconds since last damage instance
* Implement secondary resources
    * Types:
        Metal
        Wood
        Stone
    * Have these sources on the world for hero/villager farming (hero skills/passives are not triggered when farming)
    * Nexus abilities can use these resources
        * Building a nexus wall can cost X essence and Y stone
        * Nexus tower can cost X essence, Y stone, Z metal
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
    attackRange: 10,
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
            if (mag <= this.r + this.attackTarget.r + this.attackRange) {
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
        if (mag <= this.r + this.attackTarget.r + this.attackRange) {
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
    attackRange: 5,
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
