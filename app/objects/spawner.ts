import {frameLength} from 'app/gameConstants';
import {createEnemy} from 'app/objects/enemy';
import {Forest, Quary, Village} from 'app/objects/structure';
import {fillCircle, fillRing, fillText, renderCooldownCircle, renderLifeBarOverCircle} from 'app/utils/draw';
import {isPointInCircle} from 'app/utils/geometry';
import {millisecondsToTime} from 'app/utils/time';
import {removeFieldObject} from 'app/utils/world';

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



class EnemyWaveSpawner implements WaveSpawner {
    objectType = 'waveSpawner' as const;
    x = 0;
    y = 0;
    r = 30;
    color = 'purple';
    structure?: Structure;
    waveStartTime: number = 0;
    scheduledSpawns: ScheduledSpawn[] = [];
    spawnedEnemies: Enemy[] = [];
    isFinalWave = false;

    constructor(props: Partial<WaveSpawner> = {}) {
        // Set any properties from props onto this instance.
        Object.assign(this, props);
        if (this.structure) {
            this.x = this.structure.x;
            this.y = this.structure.y;
            this.r = this.structure.r + 5;
        }
    }

    startNewWave(state: GameState, schedule: WaveSpawnerSchedule) {
        // TODO: Figure out what to do with any remaining scheduled spawns.
        this.waveStartTime = state.world.time;
        this.scheduledSpawns = [...schedule.spawns];
        this.isFinalWave = !!schedule.isFinalWave;
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
        // Render a cooldown circle over the spawner while it is on cooldown.
        // TODO: This should be the next wave schedule for *this* spawner.
        const nextWave = waves[state.nextWaveIndex];
        if (!this.spawnedEnemies.length && !this.scheduledSpawns.length && nextWave) {
            const spawnDuration = (nextWave.scheduledStartTime - this.waveStartTime);
            const p = (state.world.time - this.waveStartTime) / spawnDuration;
            // TODO: Render something more interesting for the next wave and take into account the
            // next wave
            const isNextWaveImportant = false;
            const color = isNextWaveImportant ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)';
            renderCooldownCircle(context, {x: this.x, y: this.y, r: this.r - 4}, p, color);
        }
    }
    update(state: GameState) {
        // Remove any dead enemies from the array of spawned enemies this spawner is tracking.
        this.spawnedEnemies = this.spawnedEnemies.filter(enemy => enemy.health > 0);

        // Remove this spawner when all enemies from it are defeated (replace with contained structure if necessary).
        if (this.isFinalWave && !this.spawnedEnemies.length && !this.scheduledSpawns.length) {
            if (this.structure) {
                state.world.objects.push(this.structure);
                this.structure.onDiscover?.(state);
            }
            removeFieldObject(state, this);
            return;
        }
        // Spawn any scheduled enemies.
        for (let i = 0; i < this.scheduledSpawns.length; i++) {
            const scheduledSpawn = this.scheduledSpawns[i];
            if (this.waveStartTime + scheduledSpawn.spawnTime * 1000 > state.world.time) {
                continue;
            }
            this.scheduledSpawns.splice(i--, 1);
            let theta = Math.atan2(-this.y, -this.x);
            const enemy: Enemy = createEnemy(scheduledSpawn.enemyType, scheduledSpawn.level, this);
            enemy.x = this.x + this.r * Math.cos(theta);
            enemy.y = this.y + this.r * Math.sin(theta);
            this.spawnedEnemies.push(enemy);
            state.world.objects.push(enemy);
            theta += Math.PI / 6;
        }
    }
}



const spawnInterval = 5 * 60 * 1000;
const normalDelay =  60 * 1000;

const koboldTargetTime = 2 * 60 * 1000;

const smallVillage = new Village({population: 20, x: -200, y: 200});
const koboldSpawner: Spawner = new EnemySpawner('kobold', 2, {delay: koboldTargetTime, structure: smallVillage});


const mummyTargetTime = 10 * 60 * 1000;
// TODO: Make this a bridge or something that allows seeing more of the map when completed.
const town = new Village({population: 50, x: 200, y: -200});
const mummySpawner: Spawner = new EnemySpawner('mummy', 4, {delay: mummyTargetTime, spawnLimit: 1, structure: town});


const enemyTypes: EnemyType[] = ['snake', 'kobold'];
export function checkToAddNewSpawner(state: GameState) {
    // The first spawner is added immediately.
    if (state.world.nextSpawnerLevel === 1) {
        // Test forest code.
        state.world.objects.push(snakeSpawner);
        state.world.objects.push(koboldSpawner);
        state.world.objects.push(mummySpawner);
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

interface SpacedSpawnProps {
    type: EnemyType
    level: number
    count: number
    spacing?: number
    offset?: number
}
function spacedSpawns({type, level, count, spacing = 1, offset = 1}: SpacedSpawnProps): ScheduledSpawn[] {
    const spawns: ScheduledSpawn[] = [];
    for (let i = 0; i < count; i++) {
        spawns.push({
            enemyType: type,
            level,
            spawnTime: offset + spacing * i
        });
    }
    return spawns;
}


const snakeForest = new Forest({wood: 1000, x: 200, y: 200});
const snakeSpawner: WaveSpawner = new EnemyWaveSpawner({structure: snakeForest});

export const waves: Wave[] = [];
window.waves = waves;
function processWaveDefinitions(waveDefinitions: WaveDefinition[]) {
    let nextStartTime = (waves[0]?.scheduledStartTime ?? 0) + (waves[0]?.duration ?? 5000);
    for (const waveDefinition of waveDefinitions) {
        const newWave: Wave = {
            ...waveDefinition,
            duration: waveDefinition.duration * 1000,
            scheduledStartTime: nextStartTime,
            // This will be moved earlier if the wave is summoned sooner.
            actualStartTime: nextStartTime,
        }
        waves.push(newWave);
        nextStartTime += newWave.duration;
    }
}

const snake: SpacedSpawnProps = {type: 'snake', level: 1, count: 3};
const cobra: SpacedSpawnProps = <const>{type: 'cobra', level: 4, count: 1, offset: 5, spacing: 2};
const waveDefinitions: WaveDefinition[] = [
    {
        duration: 25,
        spawners: [
            {spawner: snakeSpawner, spawns: spacedSpawns({...snake, count: 3})},
        ],
    },
    {
        duration: 30,
        spawners: [
            {spawner: snakeSpawner, spawns: spacedSpawns({...snake, count: 5})},
        ],
    },
    {
        duration: 30,
        spawners: [
            {spawner: snakeSpawner, spawns: [
                ...spacedSpawns({...snake, count: 2}),
                ...spacedSpawns({...cobra, count: 1}),
            ]},
        ],
    },
    {
        duration: 30,
        spawners: [
            {spawner: snakeSpawner, spawns: [
                ...spacedSpawns({...snake, count: 4}),
                ...spacedSpawns({...cobra, count: 1}),
            ]},
        ],
    },
    {
        duration: 30,
        spawners: [
            {spawner: snakeSpawner, spawns: [
                ...spacedSpawns({...snake, count: 3}),
                ...spacedSpawns({...cobra, count: 2}),
            ]},
        ],
    },
    {
        duration: 30,
        spawners: [
            {spawner: snakeSpawner, spawns: [
                ...spacedSpawns({...snake, count: 4}),
                ...spacedSpawns({...cobra, count: 2})
            ]},
        ],
    },
    {
        duration: 30,
        spawners: [
            {spawner: snakeSpawner, spawns: [
                ...spacedSpawns({...snake, count: 3}),
                ...spacedSpawns({...cobra, count: 3})
            ]},
        ],
    },
    {
        duration: 30,
        spawners: [
            {spawner: snakeSpawner, spawns: [
                ...spacedSpawns({...snake, count: 4}),
                ...spacedSpawns({...cobra, count: 3})
            ]},
        ],
    },
    {
        duration: 30,
        spawners: [
            {spawner: snakeSpawner, spawns: [
                ...spacedSpawns({...snake, count: 5}),
                ...spacedSpawns({...cobra, count: 3})
            ]},
        ],
    },
    {
        duration: 60,
        spawners: [
            {spawner: snakeSpawner, isFinalWave: true, spawns: [
                ...spacedSpawns({...snake, count: 5}),
                ...spacedSpawns({...cobra, count: 3}),
                ...spacedSpawns({type: 'snake', level: 7, count: 1, offset: 15}),
            ]},
        ],
    },
];
processWaveDefinitions(waveDefinitions);

export function updateWaves(state: GameState) {
    const nextWave = waves[state.nextWaveIndex];
    if (nextWave?.summonEarlySpeed && nextWave.actualStartTime > state.world.time) {
        nextWave.actualStartTime -= state.waveScale * nextWave.summonEarlySpeed * frameLength;
        nextWave.actualStartTime = Math.max(nextWave.actualStartTime, state.world.time);
        nextWave.summonEarlySpeed *= 1.05;
    }
    if (!nextWave || nextWave.actualStartTime > state.world.time) {
        return;
    }
    state.nextWaveIndex++;
    for (const spawnerSchedule of nextWave.spawners) {
        const spawner = spawnerSchedule.spawner;
        spawner.startNewWave(state, spawnerSchedule);
    }
}
