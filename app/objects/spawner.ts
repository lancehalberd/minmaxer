import {createEnemy} from 'app/objects/enemy';
import {fillCircle, renderLifeBar} from 'app/utils/draw';
import {isPointInCircle} from 'app/utils/geometry';

class EnemySpawner implements Spawner {
    objectType = 'spawner' as const;
    x = 0;
    y = 0;
    r = 20;
    color = 'purple';
    spawnCooldown = 2000;
    spawnLimit = 3;
    spawnedEnemies: Enemy[] = [];
    level = this.enemyLevel + 5;
    sampleEnemy = createEnemy(this.enemyType, this.enemyLevel, {x:0, y:0});
    maxHealth = this.sampleEnemy.maxHealth * 50
    health = this.maxHealth;
    essenceWorth = this.sampleEnemy.essenceWorth * 50;
    experienceWorth = this.sampleEnemy.experienceWorth * 50;
    lastSpawnTime: number;

    constructor(public enemyType: EnemyType, public enemyLevel: number, props: Partial<Spawner> = {}) {
        // Set any properties
        Object.assign(this, props);
    }

    render(context: CanvasRenderingContext2D, state: GameState) {
        if (state.selectedHero?.attackTarget === this) {
            fillCircle(context, {...this, r: this.r + 2, color: '#FFF'});
        }
        fillCircle(context, this);
        renderLifeBar(context, this, this.health, this.maxHealth);
    }
    update(state: GameState) {
        // Remove any dead enemies from the array of spawned enemies this spawner is tracking.
        this.spawnedEnemies = this.spawnedEnemies.filter(enemy => enemy.health > 0);
        if (this.spawnedEnemies.length >= this.spawnLimit) {
            return;
        }
        // If we have no spawn time or it has been longer than the spawn cooldown, spawn a new enemy.
        if (!this.lastSpawnTime || state.world.time - this.lastSpawnTime >= this.spawnCooldown) {
            const enemy: Enemy = createEnemy(this.enemyType, this.enemyLevel, this);
            this.spawnedEnemies.push(enemy);
            state.world.objects.push(enemy);
            this.lastSpawnTime = state.world.time;
        }
    }
    onHit(state: GameState, attacker: Hero) {
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

export const snakeSpawner: Spawner = new EnemySpawner('snake', 1, {x: 200, y: 200});
export const koboldSpawner: Spawner = new EnemySpawner('kobold', 2, {x: -200, y: 200});


const enemyTypes: EnemyType[] = ['snake', 'kobold'];

export function checkToAddNewSpawner(state: GameState) {
    if (state.world.time === 1000) {
        state.world.objects.push(snakeSpawner);
        return;
    }
    if (state.world.time === 2 * 60 * 1000) {
        state.world.objects.push(koboldSpawner);
        return;
    }
    const spawnInterval = 5 * 60 * 1000;
    if (state.world.time % spawnInterval === 0) {
        const level = 2 + state.world.time / spawnInterval;
        const enemyType = enemyTypes[(Math.random() * enemyTypes.length) | 0];
        const theta = 2 * Math.PI * level / 8;
        const spawnRadius = 300 + 20 * level;
        state.world.objects.push(new EnemySpawner(enemyType, level, {
            x: state.nexus.x + spawnRadius * Math.cos(theta),
            y: state.nexus.y - spawnRadius * Math.sin(theta),
        }));
    }
}
