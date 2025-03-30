import {canvas, frameLength} from 'app/gameConstants';
import {createEnemy} from 'app/objects/enemy';
import {Forest, Quary, Village} from 'app/objects/structure';
import {fillCircle, fillRing, renderCooldownCircle} from 'app/utils/draw';
import {gainEssence} from 'app/utils/essence';
import {removeFieldObject} from 'app/utils/world';
import {generateLootPool} from 'app/utils/lootPool'

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
    essenceWorth = 0;

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
    checkToRemove(state: GameState, skipEssenceGain = false) {
        if (!this.isFinalWave || this.spawnedEnemies.length || this.scheduledSpawns.length) {
            return false;
        }
        if (this.structure) {
            state.world.objects.push(this.structure);
            this.structure.onDiscover?.(state);
        }
        if (!skipEssenceGain) {
           gainEssence(state, this.essenceWorth);
        }
        removeFieldObject(state, this);
        return true;
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
        if (this.checkToRemove(state)) {
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


const easyEnemyTypes: EnemyType[] = ['snake', 'kobold', 'flyingBeetle'];
const advancedEnemyTypes: EnemyType[] = ['cobra', 'koboldArcher', 'koboldCleric'];
const bossEnemyTypes: EnemyType[] = ['medusa', 'mummy'];
export function checkToAddNewSpawner(state: GameState): boolean {
    // Check how many spawners are left so we can create new spawners early if all existing spawners are defeated.
    const numSpawners = state.world.objects.filter(o => o.objectType === 'waveSpawner').length;

    // Add additional spawners/waves as necessary for now.
    const lastWave = state.waves[state.waves.length - 1];
    // Compute the bottom of the last defined wave stone visually and add additional waves if it is not below the bottom
    // edge of the screen.
    const lastWaveBottom = (lastWave.actualStartTime - state.world.time + lastWave.duration) / 1000 / state.waveScale;
    if (state.waves.length > state.nextWaveIndex + 1 && numSpawners > 0 && lastWaveBottom >= canvas.height) {
        return false;
    }
    const level = state.world.nextSpawnerLevel;
    // This is slightly more than level * Math.PI / 4 so that the generated spawners mostly won't line up exactly.
    const theta = 21 * Math.PI * level / 80;
    const spawnRadius = 300 + 20 * level;
    const x = state.nexus.x + spawnRadius * Math.cos(theta);
    const y = state.nexus.y - spawnRadius * Math.sin(theta);
    let structure: Structure, bossEnemyType: EnemyType = 'mummy';
    if (level % 3 === 0) {
        structure = new Quary({
            zone: state.world,
            jobKey: 'quary-' + level,
            drops: generateLootPool(['stone'], ['ironOre'], ['bronze', 'iron', 'chippedRuby'], ['gold', 'steel', 'ruby', 'emerald', 'sapphire'], level),
            stone: level * 1000,
            x,
            y,
        });
        bossEnemyType = bossEnemyTypes[(Math.random() * bossEnemyTypes.length) | 0];
    } else if (level % 3 === 1) {
        structure = new Forest({
            zone: state.world,
            jobKey: 'forest-' + level,
            drops: forestLootPool(level),
            wood: 5 * level * 1000,
            x,
            y,
        });
        bossEnemyType = 'medusa';
    } else {
        structure = new Village({zone: state.world, population: 5, x, y});
        bossEnemyType = 'mummy';
    }
    const newSpawner = new EnemyWaveSpawner({zone: state.world, essenceWorth: 500 * level, structure});
    state.world.objects.push(newSpawner);
    state.world.nextSpawnerLevel++;
    const easyEnemyType = easyEnemyTypes[(Math.random() * easyEnemyTypes.length) | 0];
    const easyEnemy: SpacedSpawnProps = {type: easyEnemyType, level: Math.floor(3 + level), count: 3};
    const advancedEnemyType = advancedEnemyTypes[(Math.random() * advancedEnemyTypes.length) | 0];
    const advancedEnemy: SpacedSpawnProps = {type: advancedEnemyType, level: Math.floor(4 + level), count: 3};
    //const bossEnemy: SpacedSpawnProps = {type: bossEnemyType, level: Math.floor(9 + level), count: 3, offset: 15 + level};
    const duration = 80 + level * 5;
    const spawnDuration = duration / 5;
    processWaveDefinitions(state, [
        {
            duration,
            spawners: [
                {spawner: newSpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...easyEnemy, count: Math.floor(10 + level / 3)},
                    ], duration: spawnDuration,
                })},
            ],
        },
        {
            duration,
            spawners: [
                {spawner: newSpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...easyEnemy, count: Math.floor(10 + level / 3)},
                        {...advancedEnemy, count: Math.floor(5 + level / 3)},
                    ], duration: spawnDuration,
                })},
            ],
        },
        {
            duration,
            spawners: [
                {spawner: newSpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...easyEnemy, count: Math.floor(10 + level)},
                        {...advancedEnemy, count: Math.floor(5 + level / 2)},
                    ], duration: spawnDuration,
                })},
            ],
        },
        {
            duration,
            spawners: [
                {spawner: newSpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...easyEnemy, count: Math.floor(10 + level)},
                        {...advancedEnemy, count: Math.floor(5 + 2 * level / 3)},
                    ], duration: spawnDuration,
                })},
            ],
        },
        {
            duration: duration + 20,
            spawners: [
                {spawner: newSpawner, isFinalWave: true, spawns: [
                    ...spreadSpawns({
                        spawnTypes: [
                            {...easyEnemy, count: Math.floor(10 + 2 * level)},
                            {...advancedEnemy, count: Math.floor(5 + level)},
                        ], duration: spawnDuration,
                    }),
                    {enemyType: bossEnemyType, level: Math.floor(5 + level), spawnTime: spawnDuration}
                ]},
            ],
        },
    ]);
    return true;
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
interface SreadSpawnProps {
    spawnTypes: {
        type: EnemyType
        level: number
        // number of times to spawn
        count: number
        // number of enemies to spawn at once.
        amount?: number
    }[]
    duration?: number
    offset?: number
}
function spreadSpawns({spawnTypes, duration = 20, offset = 0}: SreadSpawnProps): ScheduledSpawn[] {
    const spawns: ScheduledSpawn[] = [];
    for (const spawnType of spawnTypes) {
        const {type, level, count, amount = 1} = spawnType
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < amount; j++) {
                spawns.push({
                    enemyType: type,
                    level,
                    spawnTime: offset + (i + 1) * duration / (count + 1),
                });
            }
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
const koboldArcher: SpacedSpawnProps = {type: 'koboldArcher', level: 3, count: 1, offset: 2, spacing: 4};
const koboldCleric: SpacedSpawnProps = {type: 'koboldCleric', level: 5, count: 1, offset: 2, spacing: 4};

function forestLootPool(bonus: number) {
    return generateLootPool(['wood'], ['hardwood'], ['chippedEmerald', 'silverwood'], ['enchantedWood']);
}

export function initializeSpawners(state: GameState) {

    const smallSnakeForest = new Forest({jobKey: 'smallSnakeForest', wood: 100, drops: forestLootPool(0), zone: state.world, x: 190, y: 150, r: 20});
    const smallSnakeSpawner: WaveSpawner = new EnemyWaveSpawner({zone: state.world, essenceWorth: 150, structure: smallSnakeForest});

    const snakeForest = new Forest({jobKey: 'snakeForest', wood: 1000, drops: forestLootPool(1), zone: state.world,x: 200, y: 200});
    const snakeSpawner: WaveSpawner = new EnemyWaveSpawner({zone: state.world, essenceWorth: 300, structure: snakeForest});

    const smallVillage = new Village({population: 20, zone: state.world,x: -200, y: 200});
    const koboldSpawner: WaveSpawner = new EnemyWaveSpawner({zone: state.world, essenceWorth: 300, structure: smallVillage});


    // TODO: Make this a bridge or something that allows seeing more of the map when completed.
    const town = new Village({population: 50, zone: state.world,x: 200, y: -200});
    const mummySpawner: WaveSpawner = new EnemyWaveSpawner({zone: state.world, essenceWorth: 1000, structure: town});
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
                    ...spacedSpawns({...kobold, count: 1}),
                    ...spacedSpawns({...koboldArcher, count: 1}),
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
                    ...spacedSpawns({...kobold, count: 2}),
                    ...spacedSpawns({...koboldArcher, count: 2}),
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
                {spawner: koboldSpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...kobold, count: 2},
                        {...koboldArcher, count: 2},
                        koboldCleric
                    ], duration: 15,
                })},
            ],
        },
        {
            duration: 30,
            spawners: [
                {spawner: snakeSpawner, spawns: [
                    ...spacedSpawns({...snake, count: 4, amount: 2, spacing: 2}),
                    ...spacedSpawns({...cobra, count: 3})
                ]},
                {spawner: koboldSpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...kobold, count: 2},
                        {...koboldArcher, count: 2},
                        {...koboldCleric, count: 2},
                    ], duration: 15,
                })},
            ],
        },
        {
            duration: 60,
            spawners: [
                {spawner: snakeSpawner, isFinalWave: true, spawns: [
                    ...spacedSpawns({...snake, count: 3, amount: 3, spacing: 3}),
                    ...spacedSpawns({...cobra, count: 3}),
                    ...spacedSpawns({type: 'medusa', level: 1, count: 1, offset: 15}),
                ]},
                {spawner: koboldSpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...kobold, count: 2},
                        {...koboldArcher, count: 2},
                        {...koboldCleric, count: 2},
                    ], duration: 15,
                })},
            ],
        },
        {
            duration: 45,
            spawners: [
                {spawner: koboldSpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...kobold, count: 4},
                        {...koboldArcher, count: 4},
                        {...koboldCleric, count: 3},
                    ], duration: 20,
                })},
            ],
        },
        {
            duration: 45,
            spawners: [
                {spawner: koboldSpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...kobold, count: 5},
                        {...koboldArcher, count: 5},
                        {...koboldCleric, count: 3},
                    ], duration: 20,
                })},
            ],
        },
        {
            duration: 90,
            spawners: [
                {spawner: koboldSpawner, isFinalWave: true,spawns: [...spreadSpawns({
                        spawnTypes: [
                            {...kobold, count: 4},
                            {...koboldArcher, count: 4},
                            {...koboldCleric, count: 3},
                        ], duration: 20,
                    }),
                    {enemyType: 'koboldCleric', level: 9, spawnTime: 25},
                    {enemyType: 'kobold', level: 9, spawnTime: 25},
                    {enemyType: 'koboldArcher', level: 9, spawnTime: 25},
                ]},
            ],
        },
        {
            duration: 60,
            spawners: [
                {spawner: mummySpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...snake, count: 5, amount: 2},
                        {...cobra, count: 2},
                        {...kobold, count: 5},
                        {...koboldArcher, count: 5},
                        {...koboldCleric, count: 2},
                    ], duration: 30,
                })},
            ],
        },
        {
            duration: 60,
            spawners: [
                {spawner: mummySpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...snake, count: 5, amount: 2},
                        {...cobra, count: 3},
                        {...kobold, count: 5},
                        {...koboldArcher, count: 5},
                        {...koboldCleric, count: 2},
                    ], duration: 30,
                })},
            ],
        },
        {
            duration: 60,
            spawners: [
                {spawner: mummySpawner, spawns: spreadSpawns({
                    spawnTypes: [
                        {...snake, count: 5, amount: 2},
                        {...cobra, count: 4},
                        {...kobold, count: 5},
                        {...koboldArcher, count: 5},
                        {...koboldCleric, count: 3},
                    ], duration: 30,
                })},
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
