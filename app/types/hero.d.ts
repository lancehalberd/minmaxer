
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

interface HeroSkill {
    level: number
    experience: number
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
    getDamageForTarget: (state: GameState, target?: AbilityTarget) => number
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
