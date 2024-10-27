import {frameLength} from 'app/gameConstants';
import {createEnemy} from 'app/objects/enemy';
import {fillCircle, renderCooldownCircle, renderLifeBar} from 'app/utils/draw';
import {isPointInCircle} from 'app/utils/geometry';
import {millisecondsToTime} from 'app/utils/time';

class EnemySpawner implements Spawner {
    objectType = 'spawner' as const;
    x = 0;
    y = 0;
    r = 20;
    delay = 0;
    color = 'purple';
    spawnCooldown = 2000;
    spawnLimit = 3;
    spawnCount = 1;
    spawnedEnemies: Enemy[] = [];
    level = this.enemyLevel + 5;
    sampleEnemy = createEnemy(this.enemyType, this.enemyLevel, {x:0, y:0});
    maxHealth = this.sampleEnemy.maxHealth * 50
    health = this.maxHealth;
    essenceWorth = this.sampleEnemy.essenceWorth * 50;
    experienceWorth = this.sampleEnemy.experienceWorth * 50;
    lastSpawnTime: number;

    constructor(public enemyType: EnemyType, public enemyLevel: number, props: Partial<Spawner> = {}) {
        // Set any properties from props onto this instance.
        Object.assign(this, props);
    }

    render(context: CanvasRenderingContext2D, state: GameState) {
        if (state.selectedHero?.attackTarget === this) {
            fillCircle(context, {...this, r: this.r + 2, color: '#FFF'});
        }
        fillCircle(context, this);
        if (this.delay) {
            const time = millisecondsToTime(this.delay);
            context.font = "16px san-serif";
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.fillStyle = '#000';
            context.fillText(time, this.x, this.y);
            context.fillStyle = '#FFF';
            context.fillText(time, this.x, this.y);
        }
        // Render a cooldown circle over the spawner while it is on cooldown.
        if (this.lastSpawnTime && state.world.time - this.lastSpawnTime < this.spawnCooldown) {
            const p = (state.world.time - this.lastSpawnTime) / this.spawnCooldown;
            renderCooldownCircle(context, {x: this.x, y: this.y, r: this.r - 4}, p, 'rgba(0, 0, 0, 0.3)');
        }
        renderLifeBar(context, this, this.health, this.maxHealth);
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
        // The spawner summons any nearby enemies to protect it.
        for (const enemy of this.spawnedEnemies) {
            if (isPointInCircle({x: this.x, y: this.y, r: 150}, enemy)) {
                if (enemy.attackTarget?.objectType !== 'hero') {
                    enemy.attackTarget = attacker;
                }
            }
        }
    }
}



const spawnInterval = 5 * 60 * 1000;
const normalDelay =  60 * 1000;

const snakeSpawner: Spawner = new EnemySpawner('snake', 1, {x: 200, y: 200, delay: 5000, spawnCount: 2});
const koboldSpawner: Spawner = new EnemySpawner('kobold', 2, {x: -200, y: 200, delay: normalDelay});


const enemyTypes: EnemyType[] = ['snake', 'kobold'];
export function checkToAddNewSpawner(state: GameState) {
    // The first spawner is added immediately.
    if (state.world.nextSpawnerLevel === 1) {
        state.world.objects.push(snakeSpawner);
        state.world.nextSpawnerLevel++;
        return;
    }

    // Check how many spawners are left so we can create new spawners early if all existing spawners are defeated.
    const numSpawners = state.world.objects.filter(o => o.objectType === 'spawner').length;

    // The second spawner will become active at 2 minutes and is spawned with a standard delay before it becomes active.
    // It will spawn earlier if the first spawner is destroyed, but will still become active at the 2 minute mark.
    const koboldTargetTime = 2 * 60 * 1000;
    if (state.world.nextSpawnerLevel === 2) {
        if (state.world.time >= koboldTargetTime - normalDelay || numSpawners === 0) {
            state.world.objects.push(koboldSpawner);
            koboldSpawner.delay = koboldTargetTime - state.world.time;
            state.world.nextSpawnerLevel++;
        }
        return;
    }

    // All future spawners become active every 5 minutes and are spawned with a standard delay before they become active.
    // They will spawn earlier if the previous spawner are all destroyed, but will still become active at the target time.
    const nextTargetTime = spawnInterval * (state.world.nextSpawnerLevel - 2);
    if (state.world.time >= nextTargetTime - normalDelay || numSpawners === 0) {
        const level = state.world.nextSpawnerLevel;
        const enemyType = enemyTypes[(Math.random() * enemyTypes.length) | 0];
        const theta = 2 * Math.PI * level / 8;
        const spawnRadius = 300 + 20 * level;
        state.world.objects.push(new EnemySpawner(enemyType, level, {
            x: state.nexus.x + spawnRadius * Math.cos(theta),
            y: state.nexus.y - spawnRadius * Math.sin(theta),
            delay: nextTargetTime - state.world.time,
            spawnCount: enemyType === 'snake' ? 2 : 1,
        }));
        state.world.nextSpawnerLevel++;
    }
}
