import {computeValue} from 'app/utils/computed';
import {typedKeys} from 'app/utils/types';

const commonStatMap: {[key in CommonModifiableStats]: boolean} = {
    speed: true,
    attacksPerSecond: true,
    movementSpeed: true,
    incomingDamageMultiplier: true,
    damage: true,
}
const enemyStatMap: {[key in ModifiableEnemyStat]: boolean} = {
    ...commonStatMap,
}
const heroStatMap: {[key in ModifiableHeroStat]: boolean} = {
    ...commonStatMap,
    dex: true,
    str: true,
    int: true,
    maxHealth: true,
    armor: true,
    extraHitChance: true,
    criticalChance: true,
    criticalMultiplier: true,
    cooldownSpeed: true,
    maxDamageReduction: true,
}

const allEnemyStats = new Set<ModifiableEnemyStat>(typedKeys(enemyStatMap));
const allHeroStats = new Set<ModifiableHeroStat>(typedKeys(heroStatMap));

export function isEnemyStat(stat: AnyModifiableStat): stat is ModifiableEnemyStat {
    return allEnemyStats.has(stat as ModifiableEnemyStat);
}
export function isHeroStat(stat: AnyModifiableStat): stat is ModifiableHeroStat {
    return allHeroStats.has(stat as ModifiableHeroStat);
}

export function createModifiableStat<T>(baseValue: Computed<number, T>, props: {minValue?: number, maxValue?: number} = {}): ModifiableStat<T> {
    return {
        baseValue,
        addedBonus: 0,
        percentBonus: 0,
        multipliers: [],
        finalValue: 0,
        isDirty: true,
        ...props,
    };
}

export function getModifiableStatValue<T>(state: GameState, context: T, stat: ModifiableStat<T>): number {
    if (!stat.isDirty) {
        return stat.finalValue;
    }
    delete stat.isDirty;
    stat.finalValue = (computeValue(state, context, stat.baseValue, 0) + stat.addedBonus) * (1 + stat.percentBonus / 100);
    for (const multiplier of stat.multipliers) {
        stat.finalValue *= multiplier;
    }
    // console.log(stat, stat.finalValue, [stat.minValue, stat.maxValue]);
    if (stat.minValue) {
        stat.finalValue = Math.max(stat.minValue, stat.finalValue);
    }
    if (stat.maxValue) {
        stat.finalValue = Math.min(stat.maxValue, stat.finalValue);
    }
    return stat.finalValue;
}

export function applyStatModifier(stat: ModifiableStat<any>, modifier: StatModifier) {
    if (modifier.flatBonus) {
        stat.addedBonus += modifier.flatBonus;
        stat.isDirty = true;
    }
    if (modifier.percentBonus) {
        stat.percentBonus += modifier.percentBonus;
        stat.isDirty = true;
    }
    if (modifier.multiplier !== undefined && modifier.multiplier !== 1) {
        stat.multipliers.push(modifier.multiplier);
        stat.isDirty = true;
    }
}

export function removeStatModifier(stat: ModifiableStat<any>, modifier: StatModifier) {
    if (modifier.flatBonus) {
        stat.addedBonus -= modifier.flatBonus;
        stat.isDirty = true;
    }
    if (modifier.percentBonus) {
        stat.percentBonus -= modifier.percentBonus;
        stat.isDirty = true;
    }
    if (modifier.multiplier !== undefined && modifier.multiplier !== 1) {
        const index = stat.multipliers.indexOf(modifier.multiplier);
        if (index >= 0) {
            stat.multipliers.splice(index, 1);
            stat.isDirty = true;
        } else {
            console.error('Failed to remove multiplier', stat, modifier);
        }
    }
}
