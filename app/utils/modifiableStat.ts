import {computeValue} from 'app/utils/computed';

export function createModifiableStat<T>(baseValue: Computed<number, T>): ModifiableStat<T> {
    return {
        baseValue,
        addedBonus: 0,
        percentBonus: 0,
        multipliers: [],
        finalValue: 0,
        isDirty: true,
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
    // console.log(stat, stat.finalValue);
    return stat.finalValue;
}
