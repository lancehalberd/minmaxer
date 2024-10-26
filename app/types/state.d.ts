interface Point {
    x: number
    y: number
}

interface Circle extends Point {
    r: number
    color?: CanvasFill
}

interface Rect extends Point {
    w: number
    h: number
}

type CanvasFill = string | CanvasGradient | CanvasPattern;

interface HeroLevelDerivedStats {
    maxHealth: number
    damage: number
    movementSpeed: number
}

interface CanvasButton extends Rect {
    objectType: 'button'
    disabled?: boolean
    text?: string
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    onHover?: (state: GameState) => boolean
    onPress?: (state: GameState) => boolean
    onClick?: (state: GameState) => boolean
}

type HeroType = 'warrior' | 'ranger' | 'wizard';

interface HeroDefinition {
    // Name of the hero.
    name: string
    // Level that the hero starts at.
    startingLevel: number
    // Current and max life of the enemy.
    getStatsForLevel: (level: number) => HeroLevelDerivedStats
    // Essence cost of summoning this hero.
    cost: number

    // How fast the hero attacks in Hertz
    attacksPerSecond: number
    // How far away the hero can hit targets from in pixels.
    attackRange: number

    // Fields needed to render the hero.
    color: string
    radius: number
}

interface AbilityTargetingInfo {
    // Ability can target an enemy unit.
    canTargetEnemy?: boolean
    // Ability can target an allied unit.
    canTargetAlly?: boolean
    // Ability can target an arbitrary location.
    canTargetLocation?: boolean
    // Set if this ability has a circular AoE
    hitRadius?: number
    // Set if this ability has its own range. Otherwise the units attack range is used.
    range?: number
}

interface ActiveAbilityDefinition {
    type: 'activeAbility'
    name: string
    getTargetingInfo: (state: GameState, hero: Hero, ability: Ability) => AbilityTargetingInfo
    canActivate?: (state: GameState, hero: Hero, ability: Ability) => boolean
    onActivate: (state: GameState, hero: Hero, ability: Ability) => void
    // Returns the cooldown for this ability in seconds.
    getCooldown: (state: GameState, hero: Hero, ability: Ability) => number
}

interface PassiveAbilityDefinition {
    type: 'passiveAbility'
    name: string
    // Called when the ability user hits any target.
    onHitTarget?: (state: GameState, hero: Hero, target: AttackTarget, ability: Ability) => void
}

type AbilityDefinition = ActiveAbilityDefinition | PassiveAbilityDefinition;

interface Ability {
    definition: AbilityDefinition
    level: number
    cooldown?: number
}


interface ModifiableStat {
    baseValue: number
    addedBonus: number
    percentBonus: number
    multipliers: number[]
    finalValue: number
    isDirty?: boolean
}

interface BaseEffect<T> {
    // How much longer the effect will last in seconds.
    duration?: number
    apply: (state: GameState, target: T) => void
    remove: (state: GameState, target: T) => void
}
interface AbilityEffect<T> extends BaseEffect<T> {
    effectType: 'abilityEffect'
    // The ability that caused this effect, if any.
    // An ability might use this to check if it is currently effecting a target.
    ability: Ability
    // The level of the ability when it was applied.
    abilityLevel: number
    // How many stacks the effect has, if the effect stacks.
    stacks: number
}
type Effect<T> = AbilityEffect<T>;


interface Hero extends Circle {
    objectType: 'hero'
    definition: HeroDefinition
    movementSpeed: number
    level: number
    // Net amount of experience the hero has accumulated
    experience: number
    health: number
    maxHealth: number
    // How much damage the enemy deals on attack
    damage: number
    // How fast the enemy attacks in Hertz
    attacksPerSecond: ModifiableStat
    getAttacksPerSecond: (state: GameState) => number
    // How far away the hero can hit targets from in pixels.
    attackRange: number

    effects: Effect<Hero>[]

    // Properties that are often being updated during game play
    lastAttackTime?: number
    movementTarget?: Point
    // The target of the last explicit command the hero was given, if any.
    // Their actual attack target may be changed to an enemy that attacks them,
    // but they will go back to this target once the enemy is defeated.
    selectedAttackTarget?: EnemyTarget
    attackTarget?: EnemyTarget
    enemyDefeatCount: number
    // Methods
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    getFieldButtons?: (state: GameState) => CanvasButton[]
    onHit: (state: GameState, attacker: Enemy) => void
}

interface GameState {
    nexus: Nexus
    selectedHero?: Hero
    heroSlots: (Hero | null)[],
    world: World
    isPaused: boolean
    lastTimeRendered: number
    time: number
    mouse: {
        currentPosition: Point
        mouseDownPosition?: Point
        mouseDownTarget?: MouseTarget
    },
    keyboard: {
        gameKeyValues: number[]
        gameKeysDown: Set<number>
        gameKeysPressed: Set<number>
        // The set of most recent keys pressed, which is recalculated any time
        // a new key is pressed to be those keys pressed in that same frame.
        mostRecentKeysPressed: Set<number>
        gameKeysReleased: Set<number>
    },
}

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
    objects: (Nexus | Hero | Enemy | Spawner)[]
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
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    getFieldButtons?: (state: GameState) => CanvasButton[]
    onHit?: (state: GameState, attacker: Enemy) => void
}

type AllyTarget = Hero | Nexus;
type EnemyTarget = Enemy | Spawner;


type AttackTarget = AllyTarget | EnemyTarget;

// This will eventually include clickable targets like buttons or interactive objects.
type MouseTarget = CanvasButton | AttackTarget;

type EnemyType = 'kobold'|'snake'|'mummy';

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
}

interface Enemy extends Circle, EnemyLevelDerivedStats {
    objectType: 'enemy'
    level: number
    // Current life of the enemy
    health: number
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    getFieldButtons?: (state: GameState) => CanvasButton[]
    onHit: (state: GameState, attacker: Hero) => void
    aggroRadius: number
    // The last time the enemy attacked.
    lastAttackTime?: number
    movementTarget?: Point
    attackTarget?: AllyTarget
}

interface Spawner extends Circle {
    objectType: 'spawner'
    enemyType: EnemyType
    // How often the spawner can create an enemy in milliseconds.
    spawnCooldown: number
    // How long before the spawner initially starts spawning in milliseconds.
    // If the spawner is attacked it will immediately start spawning.
    delay: number
    // Max number of enemies that can be spawned at the same time.
    lastSpawnTime?: number
    spawnLimit: number
    spawnedEnemies: Enemy[]
    // Current and max life of the spawner.
    health: number
    maxHealth: number
    // How much experience the enemy grants when defeated.
    experienceWorth: number
    // How much essence the enemy grants when defeated.
    essenceWorth: number
    level: number
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    getFieldButtons?: (state: GameState) => CanvasButton[]
    onHit: (state: GameState, attacker: Hero) => void
}



interface ExtraAnimationProperties {
    // The animation will loop unless this is explicitly set to false.
    loop?: boolean
    // Frame to start from after looping.
    loopFrame?: number
}
type FrameAnimation = {
    frames: Frame[]
    frameDuration: number
    duration: number
} & ExtraAnimationProperties

interface FrameDimensions {
    w: number
    h: number
    // When a frame does not perfectly fit the size of the content, this content rectangle can be
    // set to specify the portion of the image that is functionally part of the object in the frame.
    // For example, a character with a long tail may have the content around the character's body and
    // exclude the tail when looking at the width/height of the character.
    content?: Rect
}
interface FrameRectangle extends Rect {
    // When a frame does not perfectly fit the size of the content, this content rectangle can be
    // set to specify the portion of the image that is functionally part of the object in the frame.
    // For example, a character with a long tail may have the content around the character's body and
    // exclude the tail when looking at the width/height of the character.
    content?: Rect
}

interface Frame extends FrameRectangle {
    image: HTMLCanvasElement | HTMLImageElement
    // Additional property that may be used in some cases to indicate a frame should be flipped
    // horizontally about the center of its content. Only some contexts respect this.
    flipped?: boolean
}

interface FrameWithPattern extends Frame {
    pattern?: CanvasPattern
}

interface CreateAnimationOptions {
    x?: number, y?: number
    xSpace?: number
    ySpace?: number
    rows?: number, cols?: number
    top?: number, left?: number
    duration?: number
    frameMap?: number[]
}
