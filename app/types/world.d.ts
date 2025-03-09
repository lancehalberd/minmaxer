

type LootType = 'potion' | 'invincibilityPotion';

interface LootDefinition {
    name: string
    color: CanvasFill
    r: number
    onPickup: (state: GameState, hero: Hero) => void
}

interface Loot extends Circle, ZoneLocation {
    objectType: 'loot'
    getChildren?: (state: GameState) => UIElement[]
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    onPickup: (state: GameState, hero: Hero) => void
}

interface FieldAnimationEffect extends ZoneLocation {
    objectType: 'animation'
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
}

interface Projectile extends Circle, ZoneLocation {
    objectType: 'projectile'
    vx: number
    vy: number
    duration: number
    piercing?: boolean
    hit: AttackHit
    hitsEnemies?: boolean
    hitsAllies?: boolean
    target?: AbilityTarget
    hitTargets: Set<AbilityTarget>
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
}

type FieldEffect = FieldAnimationEffect | Projectile;
type FieldObject = Hero | Nexus | Enemy | Spawner | WaveSpawner | Loot | Structure;


interface Camera extends ZoneLocation {
    scale: number
    // Pixels per second.
    speed: number
    target: Point
    // If this is true the camera will follow the selected hero or nexus.
    isLocked: boolean
}


interface Structure extends Circle, ZoneLocation {
    objectType: 'structure'
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    // Called when the structure becomes available to interact with.
    onDiscover?: (state: GameState) => void
    // Called when a hero reaches this structure as their movement target.
    onHeroInteraction?: (state: GameState, hero: Hero) => void
    getChildren?: (state: GameState) => UIElement[]
}

interface Nexus extends Circle, ZoneLocation {
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

interface ZoneDefinition {
    name: string
    floorColor: CanvasFill
    initialize: (state: GameState, instance: ZoneInstance) => void
}

interface ZoneInstance {
    name: string
    floorColor: CanvasFill
    definition?: ZoneDefinition
    time: number
    effects: FieldEffect[]
    objects: FieldObject[]
    // Where to return heroes to when they leave the zone.
    exit?: ZoneLocation
    zoneEnemyCooldowns: Map<EnemyAbilityDefinition, number>
}

interface World extends ZoneInstance {
    // The level of enemy that will be created by the next spawner.
    nextSpawnerLevel: number
}

interface ZoneLocation {
    x: number
    y: number
    // Unset indicates the over world.
    zone: ZoneInstance
}
