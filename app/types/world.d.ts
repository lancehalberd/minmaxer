

type LootType = 'potion' | 'invincibilityPotion';

interface LootDefinition {
    name: string
    color: CanvasFill
    r: number
    onPickup: (state: GameState, hero: Hero) => void
}

interface Loot extends Circle {
    objectType: 'loot'
    getChildren?: (state: GameState) => UIElement[]
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    onPickup: (state: GameState, hero: Hero) => void
}

interface FieldAnimationEffect extends Point {
    objectType: 'animation'
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
}

interface Projectile extends Circle {
    objectType: 'projectile'
    vx: number
    vy: number
    duration: number
    piercing?: boolean
    damage: number
    hitsEnemies?: boolean
    hitsAllies?: boolean
    target?: AbilityTarget
    hitTargets: Set<AbilityTarget>
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
}

type FieldEffect = FieldAnimationEffect | Projectile;
type FieldObject = Hero | Nexus | Enemy | Spawner | Loot | Structure;


interface Camera extends Point {
    scale: number
    // Pixels per second.
    speed: number
    target: Point
}

interface World {
    time: number
    camera: Camera
    // The level of enemy that will be created by the next spawner.
    nextSpawnerLevel: number
    effects: FieldEffect[]
    objects: FieldObject[]
}

interface Structure extends Circle {
    objectType: 'structure'
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    // Called when the structure becomes available to interact with.
    onDiscover?: (state: GameState) => void
    // Called when a hero reaches this structure as their movement target.
    onHeroInteraction?: (state: GameState, hero: Hero) => void
    getChildren?: (state: GameState) => UIElement[]
}

interface Nexus extends Circle {
    objectType: 'nexus'
    essence: number
    // Essence gained per second.
    essenceGrowth: number
    // How much essence was lost recently.
    // Setting this draws red section on the end of the essence bar that shrinks after a moment.
    lostEssence: number
    // When essence was last lost, effects the animation.
    lostEssenceTime: number
    // Setthing this draws a green section on the end of the essence bar that shrinks over time.
    gainedEssence: number
    // When essence was last gained, effects the animation.
    gainedEssenceTime: number
    // Setting this draws an orange section on the esssence bar to preview a cost
    // or a green section on the end of the essence bar to preview gaining essence.
    previewEssenceChange: number
    level: number
    // The number of times heroes have died. Each death increases the cooldown for subsequence hero revivals.
    deathCount: number
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    getChildren?: (state: GameState) => UIElement[]
    onHit?: (state: GameState, attacker: Enemy) => void
    // Called when a hero reaches this structure as their movement target.
    onHeroInteraction?: (state: GameState, hero: Hero) => void
}
