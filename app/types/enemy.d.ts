
type EnemyType = 'kobold'|'koboldCleric'
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
    render?: (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy) => void
    abilities?: EnemyAbilityDefinition[]
}

interface Enemy extends Circle, ZoneLocation, EnemyLevelDerivedStats {
    objectType: 'enemy'
    enemyType: EnemyType
    level: number
    // Current life of the enemy
    health: number
    getMaxHealth: (state: GameState) => number
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
    // If set the enemy will attack this target when idle.
    defaultTarget?: AllyTarget
    isBoss?: boolean
    abilities: EnemyAbility[]
    activeAbility?: ActiveEnemyAbility<any>;
}

interface Spawner extends Circle, ZoneLocation {
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
    getMaxHealth: (state: GameState) => number
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


interface ActiveEnemyAbilityDefinition<T extends AbilityTarget|undefined> {
    abilityType: 'activeEnemyAbility'
    name: string
    getTargetingInfo: (state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<T>) => AbilityTargetingInfo
    isTargetValid?: (state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<T>, target: AbilityTarget) => boolean
    canActivate?: (state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<T>) => boolean
    // Note that enemies initially choose valid targets for abilities, the final target is always a location target.
    onActivate: (state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<T>, target: LocationTarget) => void
    // Returns the cooldown for this ability in milliseconds.
    cooldown: Computed<number, ActiveEnemyAbility<T>>
    // Zone wide cooldown on how often enemies can attempt to use this ability. Note this starts during the ability warning
    // not on ability activiate.
    zoneCooldown?: number
    warningTime?: Computed<number, ActiveEnemyAbility<T>>
    renderWarning?: (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<T>, target: LocationTarget) => void
}

interface PassiveEnemyAbilityDefinition {
    abilityType: 'passiveEnemyAbility'
    name: string
    // Called when the ability user hits any target.
    onHitTarget?: (state: GameState, enemy: Enemy, target: AttackTarget, ability: PassiveEnemyAbility) => void
    modifyDamage?: (state: GameState, enemy: Enemy, target: AbilityTarget|undefined, ability: PassiveEnemyAbility, damage: number) => number
}

type EnemyAbilityDefinition = ActiveEnemyAbilityDefinition<any> | PassiveEnemyAbilityDefinition;

interface PassiveEnemyAbility {
    abilityType: 'passiveEnemyAbility'
    definition: PassiveEnemyAbilityDefinition
}
interface ActiveEnemyAbility<T extends AbilityTarget|undefined> {
    abilityType: 'activeEnemyAbility'
    definition: ActiveEnemyAbilityDefinition<T>
    // Cooldown in milliseconds.
    cooldown: number
    // Whether the hero should automatically use this ability if it is an active ability.
    warningTime: number
    warningDuration: number
    target?: LocationTarget
}

type EnemyAbility = PassiveEnemyAbility | ActiveEnemyAbility<any>;



interface ScheduledSpawn {
    enemyType: EnemyType
    level: number
    // In seconds after wave start time.
    spawnTime: number
}
interface WaveSpawner extends Circle, ZoneLocation {
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
