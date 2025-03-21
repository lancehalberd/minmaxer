// Simplified version of HeroDefinition
interface AllyDefinition {
    // Name of the ally.
    name: string
    // How fast the hero attacks in Hertz
    attacksPerSecond: number
    // How far away the hero can hit targets from in pixels.
    attackRange: number
    damage: number
    // Fields needed to render the hero.
    color: string
    radius: number
    abilities: AbilityDefinition[]
}


type ModifiableAllyStats = {[key in ModifiableHeroStat]: ModifiableStat<Ally>}
interface Ally extends Circle, ZoneLocation {
    objectType: 'ally'
    // Track where the ally originated, for example, the ability that summoned it.
    source: any
    stats: ModifiableAllyStats
    getMovementSpeed: (state: GameState) => number
    level: number
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
    getCriticalMultipler: (state: GameState) => number
    // Any damage the hero takes is multiplied by this state. This allows us to
    // create effects that cause the hero to take increased or decreased damage.
    getIncomingDamageMultiplier: (state: GameState) => number

    effects: ObjectEffect<Hero|Ally>[]
    addStatModifiers: (modifiers?: StatModifier[]) => void
    removeStatModifiers: (modifiers?: StatModifier[]) => void

    // Properties that are often being updated during game play
    lastAttackTime?: number
    lastTimeDamageTaken?: number
    movementTarget?: FieldTarget
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
    abilityTarget?: AbilityTarget
}
