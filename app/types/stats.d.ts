
interface ModifiableStat<T> {
    baseValue: Computed<number, T>
    addedBonus: number
    percentBonus: number
    multipliers: number[]
    finalValue: number
    isDirty?: boolean
    minValue?: number
    maxValue?: number
}

type CoreStat = 'dex' | 'str' | 'int';

// These stats can be modified on all units.
type CommonModifiableStats = 'speed' | 'movementSpeed'
| 'attacksPerSecond' | 'damage' | 'attackRange'
| 'incomingDamageMultiplier' | 'regenPerSecond';

type ModifiableHeroStat = CoreStat | CommonModifiableStats | 'maxHealth'
    | 'extraHitChance' | 'criticalChance' | 'criticalMultiplier'
    | 'cooldownSpeed'
    | 'armor' | 'maxDamageReduction'
type ModifiableHeroStats = {[key in ModifiableHeroStat]: ModifiableStat<Hero>};

type ModifiableEnemyStat = CommonModifiableStats;
type ModifiableEnemyStats = {[key in ModifiableEnemyStat]: ModifiableStat<Enemy>};


type AnyModifiableStat = ModifiableHeroStat | ModifiableEnemyStat;

type ModifiableTarget = Hero|Ally|Enemy;


interface StatModifier {
    stat: AnyModifiableStat
    flatBonus?: number
    percentBonus?: number
    multiplier?: number
}
