import {frameLength} from 'app/gameConstants';
import {createEnemy} from 'app/objects/enemy';
import {Forest, Quary, Village} from 'app/objects/structure';
import {fillCircle, fillRing, fillText, renderCooldownCircle, renderLifeBarOverCircle} from 'app/utils/draw';
import {isPointInCircle} from 'app/utils/geometry';
import {millisecondsToTime} from 'app/utils/time';

class EnemySpawner implements Spawner {
    objectType = 'spawner' as const;
    x = 0;
    y = 0;
    r = 30;
    delay = 0;
    color = 'purple';
    spawnCooldown = 10000;
    spawnLimit = 3;
    spawnCount = 1;
    spawnedEnemies: Enemy[] = [];
    structure?: Structure;
    level = this.enemyLevel + 5;
    sampleEnemy = createEnemy(this.enemyType, this.enemyLevel, {x:0, y:0});
    maxHealth = this.sampleEnemy.maxHealth * 50;
    health = this.maxHealth;
    essenceWorth = this.sampleEnemy.essenceWorth * 50;
    experienceWorth = this.sampleEnemy.experienceWorth * 50;
    lastSpawnTime: number = 0;

    constructor(public enemyType: EnemyType, public enemyLevel: number, props: Partial<Spawner> = {}) {
        // Set any properties from props onto this instance.
        Object.assign(this, props);
        if (this.structure) {
            this.x = this.structure.x;
            this.y = this.structure.y;
            this.r = this.structure.r + 5;
        }
    }

    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        if (this.structure) {
            this.structure.render(context, state);
            context.save();
                context.globalAlpha *= 0.6
                fillRing(context, {...this, r2: this.r - 10});
            context.restore();
        }
        if (this.delay) {
            const time = millisecondsToTime(this.delay);
            fillText(context, {x: this.x, y: this.y + 12, size: 16, text: time, color: '#FFF'});
        }
        // Render a cooldown circle over the spawner while it is on cooldown.
        if (this.lastSpawnTime && state.world.time - this.lastSpawnTime < this.spawnCooldown) {
            const p = (state.world.time - this.lastSpawnTime) / this.spawnCooldown;
            renderCooldownCircle(context, {x: this.x, y: this.y, r: this.r - 4}, p, 'rgba(0, 0, 0, 0.3)');
        }
        renderLifeBarOverCircle(context, this, this.health, this.maxHealth);
    }
    update(state: GameState) {
        // The spawner does nothing during the initial delay.
        if (this.delay > 0) {
            this.delay -= frameLength;
            return;
        }
        // Remove any dead enemies from the array of spawned enemies this spawner is tracking.
        this.spawnedEnemies = this.spawnedEnemies.filter(enemy => enemy.health > 0);
        if (this.spawnedEnemies.length >= this.spawnLimit) {
            return;
        }
        // If we have no spawn time or it has been longer than the spawn cooldown, spawn a new enemy.
        if (!this.lastSpawnTime || state.world.time - this.lastSpawnTime >= this.spawnCooldown) {
            let theta = Math.atan2(-this.y, -this.x);
            for (let i = 0; i < this.spawnCount && this.spawnedEnemies.length < this.spawnLimit; i++) {
                const enemy: Enemy = createEnemy(this.enemyType, this.enemyLevel, this);
                enemy.x = this.x + this.r * Math.cos(theta);
                enemy.y = this.y + this.r * Math.sin(theta);
                this.spawnedEnemies.push(enemy);
                state.world.objects.push(enemy);
                this.lastSpawnTime = state.world.time;
                theta += Math.PI / 6;
            }
        }
    }
    onHit(state: GameState, attacker: Hero) {
        this.delay = 0;
        // On hit, reduce the delay for spawning the next batch of monsters by 1s.
        if (this.lastSpawnTime) {
            this.lastSpawnTime -= 1000;
        }
        // The spawner summons any nearby enemies to protect it.
        for (const enemy of this.spawnedEnemies) {
            if (isPointInCircle({x: this.x, y: this.y, r: 150}, enemy)) {
                if (enemy.attackTarget?.objectType !== 'hero') {
                    enemy.attackTarget = attacker;
                }
            }
        }
    }
    onDeath(state: GameState) {
        if (this.structure) {
            state.world.objects.push(this.structure);
            this.structure.onDiscover?.(state);
        }
    }
}




const spawnInterval = 5 * 60 * 1000;
const normalDelay =  60 * 1000;

const snakeForest = new Forest({wood: 1000, x: 200, y: 200});
const snakeSpawner: Spawner = new EnemySpawner('snake', 1, {delay: 5000, spawnCount: 2, structure: snakeForest});

const koboldTargetTime = 2 * 60 * 1000;

const smallVillage = new Village({population: 20, x: -200, y: 200});
const koboldSpawner: Spawner = new EnemySpawner('kobold', 2, {delay: koboldTargetTime, structure: smallVillage});


const enemyTypes: EnemyType[] = ['snake', 'kobold'];
export function checkToAddNewSpawner(state: GameState) {
    // The first spawner is added immediately.
    if (state.world.nextSpawnerLevel === 1) {
        // Test forest code.
        state.world.objects.push(snakeSpawner);
        state.world.objects.push(koboldSpawner);
        //state.world.objects.push(snakeSpawner);
        state.world.nextSpawnerLevel = 3;
        return;
    }

    // Check how many spawners are left so we can create new spawners early if all existing spawners are defeated.
    const numSpawners = state.world.objects.filter(o => o.objectType === 'spawner').length;

    // The second spawner will become active at 2 minutes and is spawned with a standard delay before it becomes active.
    // It will spawn earlier if the first spawner is destroyed, but will still become active at the 2 minute mark.

    /*if (state.world.nextSpawnerLevel === 2) {
        if (state.world.time >= koboldTargetTime - normalDelay || numSpawners === 0) {
            state.world.objects.push(koboldSpawner);
            koboldSpawner.delay = koboldTargetTime - state.world.time;
            state.world.nextSpawnerLevel++;
        }
        return;
    }*/

    // All future spawners become active every 5 minutes and are spawned with a standard delay before they become active.
    // They will spawn earlier if the previous spawner are all destroyed, but will still become active at the target time.
    const nextTargetTime = spawnInterval * (state.world.nextSpawnerLevel - 2);
    if (state.world.time >= nextTargetTime - normalDelay || numSpawners === 0) {
        const level = state.world.nextSpawnerLevel;
        const enemyType = enemyTypes[(Math.random() * enemyTypes.length) | 0];
        const theta = 2 * Math.PI * level / 8;
        const spawnRadius = 300 + 20 * level;
        const x = state.nexus.x + spawnRadius * Math.cos(theta);
        const y = state.nexus.y - spawnRadius * Math.sin(theta);
        let structure: Structure;
        if (level % 3 === 0) {
            structure = new Quary({stone: level * 1000, x, y});
        } else if (level % 3 === 1) {
            structure = new Forest({wood: level * 1000, x, y});
        } else {
            structure = new Village({population: 5, x, y});
        }
        state.world.objects.push(new EnemySpawner(enemyType, level, {
            structure,
            delay: nextTargetTime - state.world.time,
            spawnCount: enemyType === 'snake' ? 2 : 1,
        }));
        state.world.nextSpawnerLevel++;
    }
}
