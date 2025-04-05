
type HeroType = 'warrior' | 'ranger' | 'wizard';

type HeroSkillType = 'logging' | 'mining' | 'building' | 'crafting';


interface HeroDefinition {
    // Name of the hero.
    name: string
    heroType: HeroType
    coreState: CoreStat
    // Level that the hero starts at.
    startingLevel: number
    // TODO: Replace this with getClassBonuses that give arbitrary bonuses
    // to stats based on class.
    // getStatsForLevel: (level: number) => HeroLevelDerivedStats
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


interface Hero extends Circle, ZoneLocation {
    objectType: 'hero'
    definition: HeroDefinition
    stats: ModifiableHeroStats
    getMovementSpeed: (state: GameState) => number
    level: number
    skills: {
        [key in HeroSkillType]?: HeroSkill
    }
    // The number of skill levels gained by this hero.
    // Each level reduces skill experience gained by 2%.
    totalSkillLevels: number
    // Net amount of experience the hero has accumulated
    experience: number
    health: number
    getMaxHealth: (state: GameState) => number
    // How much damage the enemy deals on attack
    getDamage: (state: GameState) => number
    getAttacksPerSecond: (state: GameState) => number
    getDamageForTarget: (state: GameState, target: AbilityTarget) => number
    // How far away the hero can hit targets from in pixels.
    getAttackRange: (state: GameState) => number
    // Grants 1% bonus hit chance, up to 1 Armor Class. Also gives flat damage to dex heroes.
    getDex: (state: GameState) => number
    // Grants 1% increased damage and 2 max health. Also gives flat damage to strength heroes.
    getStr: (state: GameState) => number
    // Grants 1% cooldown speed, and 0.5% critical chance. Also gives flat damage to intelligence heroes.
    getInt: (state: GameState) => number
    getArmor: (state: GameState) => number
    getArmorClass: (state: GameState) => number
    getMaxDamageReduction: (state: GameState) => number
    getExtraHitChance: (state: GameState) => number
    getCriticalChance: (state: GameState) => number
    getCooldownSpeed: (state: GameState) => number
    getMaxAbilityCharges(state: GameState): number
    getCriticalMultipler: (state: GameState) => number
    // Any damage the hero takes is multiplied by this state. This allows us to
    // create effects that cause the hero to take increased or decreased damage.
    getIncomingDamageMultiplier: (state: GameState) => number

    effects: ObjectEffect[]

    equipment: HeroEquipment
    equipArmor(state: GameState, armor: Armor): boolean
    unequipArmor(state: GameState): Armor|undefined
    equipWeapon(state: GameState, weapon: Weapon): boolean
    unequipWeapon(state: GameState): Weapon|undefined
    equipCharm(state: GameState, charm: Charm, index: number): boolean
    unequipCharm(state: GameState, index: number): Charm|undefined

    addStatModifiers: (modifiers?: StatModifier[]) => void
    removeStatModifiers: (modifiers?: StatModifier[]) => void

    // Properties that are often being updated during game play
    lastAttackTime?: number
    lastTimeDamageTaken?: number
    movementTarget?: FieldTarget
    // Indicates whether movement was hindered during the most recent movement attempt.
    movementWasBlocked?: boolean
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

    autocastCooldown: number
    abilities: Ability[]
    totalSkillPoints: number
    spentSkillPoints: number
    // Ability the hero is currently trying to use.
    selectedAbility?: ActiveAbility
    abilityTarget?: AbilityTarget

    reviveCooldown?: Cooldown
}

interface HeroEquipment {
    armor?: Armor
    weapon?: Weapon
    charms: (Charm|undefined)[]
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
    // Range of the ability. Should default to the user's range.
    range: number
    // Whether the hero should move to put the target into range before activating this skill.
    moveToTarget?: boolean
}

interface ActiveAbilityDefinition<T=AbilityTarget|undefined> {
    abilityType: 'activeAbility'
    name: string
    getTargetingInfo: (state: GameState, ally: Hero|Ally, ability: ActiveAbility) => AbilityTargetingInfo
    canActivate?: (state: GameState, ally: Hero|Ally, ability: ActiveAbility) => boolean
    onActivate: (state: GameState, ally: Hero|Ally, ability: ActiveAbility, target: T) => void
    // Returns the cooldown for this ability in milliseconds.
    getCooldown: (state: GameState, ally: Hero|Ally, ability: ActiveAbility) => number
}

interface PassiveAbilityDefinition {
    abilityType: 'passiveAbility'
    name: string
    update?: (state: GameState, ally: Hero|Ally, ability: PassiveAbility) => void
    renderUnder?: (context: CanvasRenderingContext2D, state: GameState, ally: Hero|Ally, ability: PassiveAbility) => void
    renderOver?: (context: CanvasRenderingContext2D, state: GameState, ally: Hero|Ally, ability: PassiveAbility) => void
    // Called when the ability user is hit by something.
    onHit?: (state: GameState, ally: Hero|Ally, ability: PassiveAbility, source: AttackTarget) => void
    // Called when the ability user hits any target.
    onHitTarget?: (state: GameState, ally: Hero|Ally, ability: PassiveAbility, target: AttackTarget) => void
    modifyDamage?: (state: GameState, ally: Hero|Ally, ability: PassiveAbility, target: AbilityTarget|undefined, damage: number) => number
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
    // How many chargest the ability currently has. Abilities are more powerful the
    // more charges they have when used. Max charges increases with cooldown speed.
    charges: number
    // Cooldown in milliseconds.
    cooldown: number
    // Whether the hero should automatically use this ability if it is an active ability.
    autocast: boolean
}

type Ability = PassiveAbility | ActiveAbility;

interface BaseEffect {
    // How much longer the effect will last in seconds.
    duration?: number
    apply: (state: GameState, target: ModifiableTarget) => void
    remove: (state: GameState, target: ModifiableTarget) => void
    renderUnder?: (context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) => void
    renderOver?: (context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) => void
    creator?: any
}
interface AbilityEffect extends BaseEffect {
    effectType: 'abilityEffect'
    // The level of the ability when it was applied.
    abilityLevel: number
    // How many stacks the effect has, if the effect stacks.
    stacks: number
}
interface SimpleEffect extends BaseEffect {
    effectType: 'simpleEffect'
}
interface StackingEffect extends BaseEffect {
    effectType: 'stackingEffect'
    stacks: number
    // Some stacking effects may track the level of the ability that created
    // them if this is necessary to calculate the effect of the buff.
    abilityLevel?: number
}
type ObjectEffect = AbilityEffect | StackingEffect | SimpleEffect;

interface AttackHit {
    damage: number
    isCrit?: boolean
    source?: AttackTarget
    showDamageNumber?: boolean
    delayDamageNumber?: number
    onHit?: (state: GameState, target: AttackTarget) => void
}

type NexusAbilityKey = 'heal'|'flame'|'frost'|'summon'
interface NexusAbilityDefinition<T extends AbilityTarget|undefined> {
    abilityType: 'activeNexusAbility'
    abilityKey: NexusAbilityKey
    name: string
    canActivate?: (state: GameState, ability: NexusAbility<T>) => boolean
    getTargetingInfo: (state: GameState, ability: NexusAbility<T>) => AbilityTargetingInfo
    onActivate: (state: GameState, ability: NexusAbility<T>, target: T) => void
    getCooldown: (state: GameState, ability: NexusAbility<T>) => number
    renderIcon: (context: CanvasRenderingContext2D, state: GameState, r: Rect) => void
}
interface NexusAbility<T extends AbilityTarget|undefined> {
    abilityType: 'activeNexusAbility'
    definition: NexusAbilityDefinition<T>
    level: number
    cooldown: number
}
