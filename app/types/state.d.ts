interface Point {
    x: number
    y: number
}

interface Circle extends Point {
    r: number
    color?: string
}

interface Rect extends Point {
    w: number
    h: number
}

interface Hero extends Circle {
    objectType: 'hero'
    target?: Point
    attackTarget?: EnemyTarget
    movementSpeed: number
    level: number
    // Net amount of experience the hero has accumulated
    experience: number
    health: number
    maxHealth: number
    // How much damage the enemy deals on attack
    damage: number
    // How fast the enemy attacks in Hertz
    attacksPerSecond: number
    // How far away the hero can hit targets from in pixels.
    attackRange: number
    lastAttackTime?: number
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
}

interface GameState {
    hero: Hero
    world: World
    mouse: {
        currentPosition: Point
        mouseDownPosition?: Point
        mouseDownTarget?: MouseTarget
    }
}

interface World {
    time: number
    camera: Point
    objects: (Nexus | Hero | Enemy | Spawner)[]
}

interface Nexus extends Circle {
    objectType: 'nexus'
    health: number
    maxHealth: number
    essence: number
    level: number
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
}

type AllyTarget = Hero | Nexus;
type EnemyTarget = Enemy | Spawner;


type AttackTarget = AllyTarget | EnemyTarget;

// This will eventually include clickable targets like buttons or interactive objects.
type MouseTarget = AttackTarget;

type EnemyType = 'snake';

interface EnemyDefinition extends Circle {
    // Indicates the type of enemy
    name: string
    // How difficult the enemy is.
    level: number
    // Current and max life of the enemy.
    health: number
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
    essence: number
    // This is in pixels per second.
    movementSpeed: number
    movementTarget?: Point
    attackTarget?: AllyTarget
    aggroRadius: number
}

interface Enemy extends EnemyDefinition {
    objectType: 'enemy'
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    // The last time the enemy attacked.
    lastAttackTime?: number
}

interface Spawner extends Circle {
    objectType: 'spawner'
    enemyType: EnemyType
    // How often the spawner can create an enemy in milliseconds.
    spawnCooldown: number
    // Max number of enemies that can be spawned at the same time.
    lastSpawnTime?: number
    spawnLimit: number
    spawnedEnemies: Enemy[]
    // Current and max life of the spawner.
    health: number
    maxHealth: number
    // How much experience the enemy grants when defeated.
    experienceWorth: number
    level: number
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
}
