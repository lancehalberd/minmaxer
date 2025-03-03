
type EnemyType = 'kobold'
    |'snake'|'cobra'
    |'mummy';

interface EnemyLevelDerivedStats {
    // Max life of the enemy
    maxHealth: number
    // How much damage the enemy deals on attack
    damage: number
    // How fast the enemy attacks in Hertz
    attacksPerSecond: number
    // How far away the enemy can hit targets from in pixels.
    attackRange: number
    // How much experience the enemy grants when defeated.
    experienceWorth: number
    // How much essence the enemy grants when defeated.
    essenceWorth: number
    // This is in pixels per second.
    movementSpeed: number
}
interface EnemyDefinition {
    // Indicates the type of enemy
    name: string
    r: number
    color: string
    getStatsForLevel: (level: number) => EnemyLevelDerivedStats
    aggroRadius: number
    isBoss?: boolean
}

interface Enemy extends Circle, EnemyLevelDerivedStats {
    objectType: 'enemy'
    level: number
    // Current life of the enemy
    health: number
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    getChildren?: (state: GameState) => UIElement[]
    onHit: (state: GameState, attacker: Hero) => void
    onDeath?: (state: GameState) => void
    aggroRadius: number
    // The last time the enemy attacked.
    lastAttackTime?: number
    movementTarget?: Point
    attackTarget?: AllyTarget
    isBoss?: boolean
}

interface Spawner extends Circle {
    objectType: 'spawner'
    enemyType: EnemyType
    // How often the spawner can create an enemy in milliseconds.
    spawnCooldown: number
    // How long before the spawner initially starts spawning in milliseconds.
    // If the spawner is attacked it will immediately start spawning.
    delay: number
    // The last world time this spawner spawned an enemy.
    lastSpawnTime?: number
    // Max number of enemies that can be spawned at the same time.
    spawnLimit: number
    // How many enemies the spawner can spawn at once.
    spawnCount: number
    spawnedEnemies: Enemy[]
    // Current and max life of the spawner.
    health: number
    maxHealth: number
    // How much experience the enemy grants when defeated.
    experienceWorth: number
    // How much essence the enemy grants when defeated.
    essenceWorth: number
    level: number
    // The structure left behind when this spawner is defeated.
    structure?: Structure
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    getChildren?: (state: GameState) => UIElement[]
    onHit: (state: GameState, attacker: Hero) => void
    onDeath?: (state: GameState) => void
}



interface ScheduledSpawn {
    enemyType: EnemyType
    level: number
    // In seconds after wave start time.
    spawnTime: number
}
interface WaveSpawner extends Circle {
    objectType: 'waveSpawner'
    // The time the last wave started, scheduled spawns occur relative to this time.
    waveStartTime?: number
    // Spawns scheduled for the current wave.
    scheduledSpawns: ScheduledSpawn[]
    // The structure left behind when this spawner is defeated.
    structure?: Structure
    spawnedEnemies: Enemy[]
    // The spawner will be removed when this flag is true and the last spawned enemy is defeated.
    isFinalWave: boolean
    startNewWave: (state: GameState, schedule: WaveSpawnerSchedule) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    getChildren?: (state: GameState) => UIElement[]
}
interface WaveSpawnerSchedule {
    spawner: WaveSpawner
    spawns: ScheduledSpawn[]
    isFinalWave?: boolean
}
interface WaveDefinition {
    duration: number
    spawners: WaveSpawnerSchedule[]
}
interface Wave {
    scheduledStartTime: number
    actualStartTime: number
    summonEarlySpeed?: number
    duration: number
    spawners: WaveSpawnerSchedule[]
}
