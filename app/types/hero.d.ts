
type HeroType = 'warrior' | 'ranger' | 'wizard';

type HeroSkillType = 'logging' | 'mining' | 'building' | 'crafting';

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

    abilities: AbilityDefinition[]
}

interface Hero extends Circle {
    objectType: 'hero'
    definition: HeroDefinition
    movementSpeed: number
    level: number
    skills: {
        [key in HeroSkillType]?: HeroSkill
    }
    // Net amount of experience the hero has accumulated
    experience: number
    health: number
    maxHealth: number
    // How much damage the enemy deals on attack
    damage: number
    // How fast the enemy attacks in Hertz
    attacksPerSecond: ModifiableStat
    getAttacksPerSecond: (state: GameState) => number
    getDamageForTarget: (state: GameState, target: AbilityTarget) => number
    // How far away the hero can hit targets from in pixels.
    attackRange: number

    effects: ObjectEffect<Hero>[]

    // Any damage the hero takes is multiplied by this state. This allows us to
    // create effects that cause the hero to take increased or decreased damage.
    incomingDamageMultiplier: ModifiableStat

    // Properties that are often being updated during game play
    lastAttackTime?: number
    movementTarget?: FieldTarget
    assignedJob?: Job
    // The target of the last explicit command the hero was given, if any.
    // Their actual attack target may be changed to an enemy that attacks them,
    // but they will go back to this target once the enemy is defeated.
    selectedAttackTarget?: EnemyTarget
    attackTarget?: EnemyTarget
    enemyDefeatCount: number
    // Methods
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    update: (state: GameState) => void
    getChildren?: (state: GameState) => UIElement[]
    onHit: (state: GameState, attacker: Enemy) => void

    abilities: Ability[]
    totalSkillPoints: number
    spentSkillPoints: number
    // Ability the hero is currently trying to use.
    selectedAbility?: ActiveAbility
    abilityTarget?: AbilityTarget

    reviveCooldown?: Cooldown
}

interface Cooldown {
    // Length of the entire cooldown in seconds
    total: number
    // Length of the remaining cooldown in seconds
    remaining: number
}

interface HeroLevelDerivedStats {
    maxHealth: number
    damage: number
    movementSpeed: number
}

interface HeroSkill {
    level: number
    experience: number
}

interface ModifiableStat {
    baseValue: number
    addedBonus: number
    percentBonus: number
    multipliers: number[]
    finalValue: number
    isDirty?: boolean
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

interface ActiveAbilityDefinition<T=AbilityTarget|undefined> {
    abilityType: 'activeAbility'
    name: string
    getTargetingInfo: (state: GameState, hero: Hero, ability: Ability) => AbilityTargetingInfo
    canActivate?: (state: GameState, hero: Hero, ability: Ability) => boolean
    onActivate: (state: GameState, hero: Hero, ability: Ability, target: T) => void
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

type AbilityDefinition = ActiveAbilityDefinition<any> | PassiveAbilityDefinition;

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
