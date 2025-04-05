

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

// Generic effect for anything we don't have more specific effects for.
interface GenericEffect extends ZoneLocation {
    objectType: 'effect'
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    creator?: any
}

// Used for simple animations the don't have complex interactions.
interface FieldAnimationEffect extends ZoneLocation {
    objectType: 'animation'
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    creator?: any
}


// Effects representing projectiles from attacks or skills.
interface Projectile extends Circle, ZoneLocation {
    objectType: 'projectile'
    vx: number
    vy: number
    duration: number
    piercing?: boolean
    hit: AttackHit
    hitsEnemies?: boolean
    hitsAllies?: boolean
    hitsNexus?: boolean
    target?: AbilityTarget
    // Set of targets not hit during the current frame.
    missedTargets: Set<AbilityTarget>
    // Set of targets hit by this projectile. May be updated to allow a projectile
    // to hit the same target multiple times.
    hitTargets: Set<AbilityTarget>
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    // Called for any valid attack targets are hit by this projectile.
    onHit?: (state: GameState, target: AttackTarget) => void
    // Called when the projectile duration expires.
    onExpire?: (state: GameState) => void
    creator?: any
}

type FieldEffect = GenericEffect | FieldAnimationEffect | Projectile;
type FieldObject = Hero | Nexus | Ally | Enemy | Spawner | WaveSpawner | Loot | Structure;


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
    onClick?: (state: GameState) => boolean
    getChildren?: (state: GameState) => UIElement[]
    structureId?: string
    exportData?: (state: GameState) => any
    importData?: (state: GameState, data: any) => void
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
    // Milliseconds passed since this zone was created.
    // Many time fields on objects and effects will be based on this value.
    time: number
    effects: FieldEffect[]
    objects: FieldObject[]
    // Where to return heroes to when they leave the zone.
    exit?: ZoneLocation
    // Where to return heroes to if they return to the overworld.
    overworldExit?: ZoneLocation
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
