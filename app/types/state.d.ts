interface GameState {
    nexus: Nexus
    city: CityStats
    inventory: Inventory
    // Total resources harvested this round.
    totalResources: {
        [key in ResourceKey]: number
    }
    // Resources available to harvest currently.
    availableResources: {
        [key in ResourceKey]: number
    }
    // List of heroes available to summon.
    availableHeroes: Hero[],
    previewRequiredToolType?: ToolType
    previewResourceCost?: ComputedResourceCost
    selectedHero?: Hero
    hoveredAbility?: Ability
    selectedAbility?: ActiveAbility
    heroSlots: (Hero | null)[]
    hudUIElements: UIElement[]
    world: World
    isPaused: boolean
    lastTimeRendered: number
    time: number
    mouse: {
        currentPosition: Point
        mouseDownPosition?: Point
        mouseDownTarget?: MouseTarget
        mouseHoverTarget?: MouseTarget
        isOverCanvas?: boolean
        // This can be set to indicate the current mouse press has been handled and should not trigger
        // any further actions, such as drag to move.
        pressHandled?: boolean
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

type Computed<T, U> = T | ((state: GameState, object: U) => T)

interface HeroLevelDerivedStats {
    maxHealth: number
    damage: number
    movementSpeed: number
}

interface BaseUIElement extends Rect {
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    // Unique id for this button that can be used to check if different instances of a button
    // are for the same button. For example, we recreate an instance of many buttons each frame,
    // but they are effectively the same button.
    uniqueId?: string
    disabled?: boolean
    update?: (state: GameState) => void
    getChildren?: (state: GameState) => UIElement[]
}

interface UIContainer extends BaseUIElement {
    objectType: 'uiContainer'
}

interface UIButton extends BaseUIElement {
    objectType: 'uiButton'
    text?: string
    onHover?: (state: GameState) => boolean
    onPress?: (state: GameState) => boolean
    onClick?: (state: GameState) => boolean
}

type UIElement = UIContainer | UIButton;


type LootType = 'potion' | 'invincibilityPotion';

interface LootDefinition {
    name: string
    color: CanvasFill
    r: number
    onPickup: (state: GameState, hero: Hero) => void
}


interface AbilityTargetingInfo {
    // Ability can target an enemy unit.
    canTargetEnemy?: boolean
    // Ability can target an allied unit.
    canTargetAlly?: boolean
    // Ability can target an arbitrary location.
    canTargetLocation?: boolean
    // Set if this ability creates a projectile skill shot with a radius.
    projectileRadius?: number
    // Set if this ability has a circular AoE
    hitRadius?: number
    // Range of the ability. Should default to the hero's range.
    range: number
    // Whether the hero should move to put the target into range before activating this skill.
    moveToTarget?: boolean
}

interface ActiveAbilityDefinition {
    abilityType: 'activeAbility'
    name: string
    getTargetingInfo: (state: GameState, hero: Hero, ability: Ability) => AbilityTargetingInfo
    canActivate?: (state: GameState, hero: Hero, ability: Ability) => boolean
    onActivate: (state: GameState, hero: Hero, ability: Ability, target?: AbilityTarget) => void
    // Returns the cooldown for this ability in milliseconds.
    getCooldown: (state: GameState, hero: Hero, ability: Ability) => number
}

interface PassiveAbilityDefinition {
    abilityType: 'passiveAbility'
    name: string
    // Called when the ability user hits any target.
    onHitTarget?: (state: GameState, hero: Hero, target: AttackTarget, ability: Ability) => void
    modifyDamage?: (state: GameState, hero: Hero, target: AbilityTarget|undefined, ability: Ability, damage: number) => number
}

type AbilityDefinition = ActiveAbilityDefinition | PassiveAbilityDefinition;

interface PassiveAbility {
    abilityType: 'passiveAbility'
    definition: PassiveAbilityDefinition
    level: number
}
interface ActiveAbility {
    abilityType: 'activeAbility'
    definition: ActiveAbilityDefinition
    level: number
    // Cooldown in milliseconds.
    cooldown: number
    // Whether the hero should automatically use this ability if it is an active ability.
    autocast: boolean
}

type Ability = PassiveAbility | ActiveAbility;


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
interface SimpleEffect<T> extends BaseEffect<T> {
    effectType: 'simpleEffect'
}
type ObjectEffect<T> = AbilityEffect<T> | SimpleEffect<T>;


interface Loot extends Circle {
    objectType: 'loot'
    getChildren?: (state: GameState) => UIElement[]
    update: (state: GameState) => void
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    onPickup: (state: GameState, hero: Hero) => void
}


interface Cooldown {
    // Length of the entire cooldown in seconds
    total: number
    // Length of the remaining cooldown in seconds
    remaining: number
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


interface LocationTarget extends Point {
    objectType: 'point'
    r: 0
}

type AllyTarget = Hero | Nexus;
type EnemyTarget = Enemy | Spawner;

// Any target on the field.
type FieldTarget = LocationTarget | Hero | Enemy | Spawner | Nexus | Loot | Structure;

// Any target that an ability could theoretically target.
type AbilityTarget = FieldTarget;

// A target that can be attacked.
type AttackTarget = AllyTarget | EnemyTarget;

// This will eventually include clickable targets like buttons or interactive objects.
type MouseTarget = UIButton | FieldTarget;

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
    getChildren?: (state: GameState) => UIElement[]
    onHit: (state: GameState, attacker: Hero) => void
    onDeath?: (state: GameState) => void
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
