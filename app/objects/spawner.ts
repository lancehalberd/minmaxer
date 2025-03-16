import {frameLength} from 'app/gameConstants';
import {createEnemy} from 'app/objects/enemy';
import {Forest, Quary, Village} from 'app/objects/structure';
import {fillCircle, fillRing, renderCooldownCircle} from 'app/utils/draw';
import {removeFieldObject} from 'app/utils/world';

/*class EnemySpawner implements Spawner {
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
}*/


const spawnAngleDelta = Math.PI / 6;
const spawnAngleResetTime = 500;

interface EnemyWaveSpawnerProps extends Partial<WaveSpawner> {
    zone: ZoneInstance
}
class EnemyWaveSpawner implements WaveSpawner {
    objectType = 'waveSpawner' as const;
    zone: ZoneInstance
    x = 0;
    y = 0;
    r = 30;
    color = 'purple';
    structure?: Structure;
    scheduledSpawns: ScheduledSpawn[] = [];
    spawnedEnemies: Enemy[] = [];
    isFinalWave = false;
    spawnAngle = 0;
    lastSpawnTime = 0;

    constructor(props: EnemyWaveSpawnerProps) {
        // Set any properties from props onto this instance.
        Object.assign(this, props);
        this.zone = props.zone;
        this.lastSpawnTime = this.zone.time;
        if (this.structure) {
            this.x = this.structure.x;
            this.y = this.structure.y;
            this.r = this.structure.r + 5;
        }
    }

    startNewWave(state: GameState, schedule: WaveSpawnerSchedule) {
        for (const newSpawn of schedule.spawns) {
            this.scheduledSpawns.push({
                ...newSpawn,
                spawnTime: this.zone.time + newSpawn.spawnTime * 1000,
            })
        }
        this.isFinalWave = !!schedule.isFinalWave;
        this.lastSpawnTime = this.zone.time;
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
        // This is debug code for drawing where the next enemy spawn will be.
        //const spawnAngle = Math.atan2(-this.y, -this.x) + this.spawnAngle;
        //fillCircle(context, {x: this.x + this.r * Math.cos(spawnAngle), y: this.y + this.r * Math.sin(spawnAngle), r: 5, color: 'red'});
        // Render a cooldown circle over the spawner while it is on cooldown.
        // TODO: This should be the next wave schedule for *this* spawner.
        //const nextWave = waves[state.nextWaveIndex];
        if (this.scheduledSpawns.length) {
            let nextSpawnTime = this.scheduledSpawns[0].spawnTime;
            for (const spawn of this.scheduledSpawns) {
                nextSpawnTime = Math.min(nextSpawnTime, spawn.spawnTime);
            }
            const spawnDuration = (nextSpawnTime - this.lastSpawnTime);
            const p = 1 - (nextSpawnTime - this.zone.time) / spawnDuration;
            const isNextWaveImportant = false;
            const color = isNextWaveImportant ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)';
            renderCooldownCircle(context, {x: this.x, y: this.y, r: this.r / 2}, p, color);
        }
    }
    update(state: GameState) {
        // Remove any dead enemies from the array of spawned enemies this spawner is tracking.
        this.spawnedEnemies = this.spawnedEnemies.filter(enemy => enemy.health > 0);
        if (this.spawnAngle > 0) {
            this.spawnAngle = Math.max(0, this.spawnAngle - spawnAngleDelta * frameLength / spawnAngleResetTime);
        } else if (this.spawnAngle < 0) {
            this.spawnAngle = Math.min(0, this.spawnAngle + spawnAngleDelta * frameLength / spawnAngleResetTime);
        }

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
            if (scheduledSpawn.spawnTime > state.world.time) {
                continue;
            }
            this.scheduledSpawns.splice(i--, 1);
            let theta = Math.atan2(-this.y, -this.x) + this.spawnAngle;
            const enemy: Enemy = createEnemy(scheduledSpawn.enemyType, scheduledSpawn.level, this);
            // Enemies spawned during waves all attack the nexus by default.
            enemy.defaultTarget = state.nexus;
            // Spawn enemies just slightly overlapping the spawner.
            enemy.x = this.x + (this.r + enemy.r - 4) * Math.cos(theta);
            enemy.y = this.y + (this.r + enemy.r - 4) * Math.sin(theta);
            this.lastSpawnTime = this.zone.time;
            this.spawnedEnemies.push(enemy);
            this.zone.objects.push(enemy);
            // The spawn angle increases in magnitude and swaps signs between spawnings
            if (this.spawnAngle >= spawnAngleDelta / 2) {
                this.spawnAngle = -this.spawnAngle;
            } else {
                this.spawnAngle = Math.abs(this.spawnAngle) + spawnAngleDelta;
            }
        }
    }
}


const easyEnemyTypes: EnemyType[] = ['snake', 'kobold'];
const advancedEnemyTypes: EnemyType[] = ['cobra', 'koboldCleric'];
const bossEnemyTypes: EnemyType[] = ['mummy'];
export function checkToAddNewSpawner(state: GameState) {
    // Check how many spawners are left so we can create new spawners early if all existing spawners are defeated.
    const numSpawners = state.world.objects.filter(o => o.objectType === 'waveSpawner').length;

    // Add additional spawners/waves as necessary for now.
    if (numSpawners === 0 || !state.waves[state.nextWaveIndex + 5]) {
        const level = state.world.nextSpawnerLevel;
        // This is slightly more than level * Math.PI / 4 so that the generated spawners mostly won't line up exactly.
        const theta = 21 * Math.PI * level / 80;
        const spawnRadius = 300 + 20 * level;
        const x = state.nexus.x + spawnRadius * Math.cos(theta);
        const y = state.nexus.y - spawnRadius * Math.sin(theta);
        let structure: Structure;
        if (level % 3 === 0) {
            structure = new Quary({zone: state.world, jobKey: 'quary-' + level, stone: level * 1000, x, y});
        } else if (level % 3 === 1) {
            structure = new Forest({zone: state.world, jobKey: 'forest-' + level, wood: 5 * level * 1000, x, y});
        } else {
            structure = new Village({zone: state.world, population: 5, x, y});
        }
        const newSpawner = new EnemyWaveSpawner({zone: state.world, structure});
        state.world.objects.push(newSpawner);
        state.world.nextSpawnerLevel++;
        const easyEnemyType = easyEnemyTypes[(Math.random() * easyEnemyTypes.length) | 0];
        const easyEnemy: SpacedSpawnProps = {type: easyEnemyType, level: Math.floor(3 + level / 2), count: 3};
        const advancedEnemyType = advancedEnemyTypes[(Math.random() * advancedEnemyTypes.length) | 0];
        const advancedEnemy: SpacedSpawnProps = {type: advancedEnemyType, level: Math.floor(5 + level / 2), count: 3};
        const bossEnemyType = bossEnemyTypes[(Math.random() * bossEnemyTypes.length) | 0];
        const bossEnemy: SpacedSpawnProps = {type: bossEnemyType, level: Math.floor(2 + level), count: 3, offset: 20 + level * 2};
        processWaveDefinitions(state, [
            {
                duration: 60 + level * 5,
                spawners: [
                    {spawner: newSpawner, spawns: spacedSpawns({...easyEnemy, count: Math.floor(3 + level / 3)})},
                ],
            },
            {
                duration: 60 + level * 5,
                spawners: [
                    {spawner: newSpawner, spawns: spacedSpawns({...easyEnemy, count: Math.floor(5 + level)})},
                ],
            },
            {
                duration: 60 + level * 5,
                spawners: [{spawner: newSpawner, spawns: [
                        ...spacedSpawns({...easyEnemy, count: Math.floor(5 + level)}),
                        ...spacedSpawns({...advancedEnemy, count: Math.floor(1 + level / 3)}),
                    ],
                }],
            },
            {
                duration: 60 + level * 5,
                spawners: [{spawner: newSpawner, spawns: [
                        ...spacedSpawns({...easyEnemy, count: Math.floor(5 + level)}),
                        ...spacedSpawns({...advancedEnemy, count: Math.floor(1 + 2 * level / 3)}),
                    ],
                }],
            },
            {
                duration: 60 + level * 5,
                spawners: [{spawner: newSpawner, isFinalWave: true, spawns: [
                        ...spacedSpawns({...easyEnemy, count: Math.floor(8 + level)}),
                        ...spacedSpawns({...advancedEnemy, count: Math.floor(3 + 2 * level / 3)}),
                        ...spacedSpawns({...bossEnemy, count: 1}),
                    ],
                }],
            },
        ])
    }
}

interface SpacedSpawnProps {
    type: EnemyType
    level: number
    // number of times to spawn
    count: number
    // number of enemies to spawn at once.
    amount?: number
    spacing?: number
    offset?: number
}
function spacedSpawns({type, level, count, amount = 1, spacing = 1, offset = 1}: SpacedSpawnProps): ScheduledSpawn[] {
    const spawns: ScheduledSpawn[] = [];
    for (let i = 0; i < count; i++) {
        for (let j = 0; j < amount; j++) {
            spawns.push({
                enemyType: type,
                level,
                spawnTime: offset + spacing * i
            });
        }
    }
    return spawns;
}

function processWaveDefinitions(state: GameState, waveDefinitions: WaveDefinition[]) {
    const lastWave = state.waves[state.waves.length - 1];
    let nextStartTime = (lastWave?.scheduledStartTime ?? 0) + (lastWave?.duration ?? 5000);
    for (const waveDefinition of waveDefinitions) {
        const newWave: Wave = {
            ...waveDefinition,
            duration: waveDefinition.duration * 1000,
            scheduledStartTime: nextStartTime,
            // This will be moved earlier if the wave is summoned sooner.
            actualStartTime: nextStartTime,
        }
        state.waves.push(newWave);
        nextStartTime += newWave.duration;
    }
}

const snake: SpacedSpawnProps = {type: 'snake', level: 1, count: 3};
const cobra: SpacedSpawnProps = <const>{type: 'cobra', level: 4, count: 1, offset: 5, spacing: 2};
const kobold: SpacedSpawnProps = {type: 'kobold', level: 3, count: 2, spacing: 3};
const koboldCleric: SpacedSpawnProps = {type: 'koboldCleric', level: 5, count: 1, offset: 2, spacing: 4};

export function initializeSpawners(state: GameState) {

    const smallSnakeForest = new Forest({jobKey: 'smallSnakeForest', wood: 100, zone: state.world, x: 190, y: 150, r: 20});
    const smallSnakeSpawner: WaveSpawner = new EnemyWaveSpawner({zone: state.world, structure: smallSnakeForest});

    const snakeForest = new Forest({jobKey: 'snakeForest', wood: 1000, zone: state.world,x: 200, y: 200});
    const snakeSpawner: WaveSpawner = new EnemyWaveSpawner({zone: state.world, structure: snakeForest});

    const smallVillage = new Village({population: 20, zone: state.world,x: -200, y: 200});
    const koboldSpawner: WaveSpawner = new EnemyWaveSpawner({zone: state.world, structure: smallVillage});


    // TODO: Make this a bridge or something that allows seeing more of the map when completed.
    const town = new Village({population: 50, zone: state.world,x: 200, y: -200});
    const mummySpawner: WaveSpawner = new EnemyWaveSpawner({zone: state.world, structure: town});
    // Test forest code.
    state.world.objects.push(smallSnakeSpawner);
    state.world.objects.push(snakeSpawner);
    state.world.objects.push(koboldSpawner);
    state.world.objects.push(mummySpawner);
    //state.world.objects.push(snakeSpawner);
    state.world.nextSpawnerLevel = 3;
    const waveDefinitions: WaveDefinition[] = [
        {
            duration: 25,
            spawners: [
                {spawner: smallSnakeSpawner, spawns: spacedSpawns({...snake, count: 3})},
            ],
        },
        {
            duration: 30,
            spawners: [
                {spawner: smallSnakeSpawner, spawns: [
                    ...spacedSpawns({...snake, count: 2, amount: 2, spacing: 2}),
                ]},
            ],
        },
        {
            duration: 30,
            spawners: [
                {spawner: smallSnakeSpawner, spawns: [
                    ...spacedSpawns({...snake, count: 2, amount: 3, spacing: 3}),
                ]},
            ],
        },
        {
            duration: 60,
            spawners: [
                {spawner: smallSnakeSpawner, isFinalWave: true, spawns: [
                    ...spacedSpawns({...snake, count: 2, amount: 2, spacing: 2}),
                    ...spacedSpawns({...cobra, count: 1}),
                ]},
            ],
        },
        {
            duration: 30,
            spawners: [
                {spawner: snakeSpawner, spawns: [
                    ...spacedSpawns({...snake, count: 2, amount: 2, spacing: 2}),
                ]},
                {spawner: koboldSpawner, spawns: [
                    ...spacedSpawns({...kobold, count: 1}),
                ]},
            ],
        },
        {
            duration: 30,
            spawners: [
                {spawner: snakeSpawner, spawns: [
                    ...spacedSpawns({...snake, count: 2, amount: 2, spacing: 2}),
                    ...spacedSpawns({...cobra, count: 1})
                ]},
                {spawner: koboldSpawner, spawns: [
                    ...spacedSpawns({...kobold, count: 2}),
                ]},
            ],
        },
        {
            duration: 30,
            spawners: [
                {spawner: snakeSpawner, spawns: [
                    ...spacedSpawns({...snake, count: 3, amount: 2, spacing: 2}),
                    ...spacedSpawns({...cobra, count: 3})
                ]},
                {spawner: koboldSpawner, spawns: [
                    ...spacedSpawns({...kobold, count: 3}),
                ]},
            ],
        },
        {
            duration: 30,
            spawners: [
                {spawner: snakeSpawner, spawns: [
                    ...spacedSpawns({...snake, count: 4, amount: 2, spacing: 2}),
                    ...spacedSpawns({...cobra, count: 3})
                ]},
                {spawner: koboldSpawner, spawns: [
                    ...spacedSpawns({...kobold, count: 3}),
                    ...spacedSpawns({...koboldCleric, count: 1}),
                ]},
            ],
        },
        {
            duration: 30,
            spawners: [
                {spawner: snakeSpawner, spawns: [
                    ...spacedSpawns({...snake, count: 4, amount: 2, spacing: 2}),
                    ...spacedSpawns({...cobra, count: 3})
                ]},
                {spawner: koboldSpawner, spawns: [
                    ...spacedSpawns({...kobold, count: 3}),
                    ...spacedSpawns({...koboldCleric, count: 2}),
                ]},
            ],
        },
        {
            duration: 60,
            spawners: [
                {spawner: snakeSpawner, isFinalWave: true, spawns: [
                    ...spacedSpawns({...snake, count: 3, amount: 3, spacing: 3}),
                    ...spacedSpawns({...cobra, count: 3}),
                    ...spacedSpawns({type: 'snake', level: 8, count: 1, offset: 15}),
                ]},
                {spawner: koboldSpawner, spawns: [
                    ...spacedSpawns({...kobold, count: 3}),
                    ...spacedSpawns({...koboldCleric, count: 2}),
                ]},
            ],
        },
        {
            duration: 45,
            spawners: [
                {spawner: koboldSpawner, spawns: [
                    ...spacedSpawns({...kobold, count: 4, amount: 2}),
                    ...spacedSpawns({...koboldCleric, count: 3}),
                ]},
            ],
        },
        {
            duration: 45,
            spawners: [
                {spawner: koboldSpawner, spawns: [
                    ...spacedSpawns({...kobold, count: 5, amount: 2}),
                    ...spacedSpawns({...koboldCleric, count: 3}),
                ]},
            ],
        },
        {
            duration: 90,
            spawners: [
                {spawner: koboldSpawner, isFinalWave: true, spawns: [
                    ...spacedSpawns({...kobold, count: 5, amount: 2}),
                    ...spacedSpawns({...koboldCleric, count: 3}),
                    ...spacedSpawns({...kobold, level: 9, offset: 10, count: 1, amount: 2}),
                ]},
            ],
        },
        {
            duration: 60,
            spawners: [
                {spawner: mummySpawner, spawns: [
                    ...spacedSpawns({...snake, count: 5, amount: 2}),
                    ...spacedSpawns({...cobra, count: 2}),
                    ...spacedSpawns({...kobold, count: 5, amount: 2}),
                    ...spacedSpawns({...koboldCleric, count: 1}),
                ]},
            ],
        },
        {
            duration: 60,
            spawners: [
                {spawner: mummySpawner, spawns: [
                    ...spacedSpawns({...snake, count: 5, amount: 2}),
                    ...spacedSpawns({...cobra, count: 4}),
                    ...spacedSpawns({...kobold, count: 5, amount: 2}),
                    ...spacedSpawns({...koboldCleric, count: 2}),
                ]},
            ],
        },
        {
            duration: 60,
            spawners: [
                {spawner: mummySpawner, spawns: [
                    ...spacedSpawns({...snake, count: 5, amount: 2}),
                    ...spacedSpawns({...cobra, count: 6}),
                    ...spacedSpawns({...kobold, count: 5, amount: 2}),
                    ...spacedSpawns({...koboldCleric, count: 3}),
                ]},
            ],
        },
        {
            duration: 120,
            spawners: [
                {spawner: mummySpawner, isFinalWave: true, spawns: [{enemyType: 'mummy', level: 5, spawnTime: 0}]},
            ],
        },
    ];
    processWaveDefinitions(state, waveDefinitions);
}


export function updateWaves(state: GameState) {
    const nextWave = state.waves[state.nextWaveIndex];
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
