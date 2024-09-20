interface Point {
    x: number
    y: number
}

interface Circle extends Point {
    r: number
    color?: string
}

interface Hero extends Circle {
    target?: Point
    attackTarget?: EnemyTarget
    speed: number
    level: number
    health: number
    maxHealth: number
    // How much damage the enemy deals on attack
    damage: number
    // How fast the enemy attacks in Hertz
    attackSpeed: number
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
}

interface GameState {
    hero: Hero
    world: World
}

interface World {
    time: number
    camera: Point
    objects: (Nexus | Hero | Enemy | Spawner)[]
}

interface Nexus extends Circle {
    health: number
    maxHealth: number
    essence: number
    level: number
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
}

type AllyTarget = Hero | Nexus;
type EnemyTarget = Enemy | Spawner;

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
    attackSpeed: number
    // How much experience the enemy grants when defeated.
    experience: number
    // How much essence the enemy grants when defeated.
    essence: number
    // This is in pixels per second.
    movementSpeed: number
    movementTarget?: Point
    attackTarget?: AllyTarget
    aggroRadius: number
}

interface Enemy extends EnemyDefinition {
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
}

interface Spawner extends Circle {
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
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
}
