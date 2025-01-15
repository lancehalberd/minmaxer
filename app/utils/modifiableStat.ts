

export function createModifiableStat(baseValue: number): ModifiableStat {
    return {
        baseValue,
        addedBonus: 0,
        percentBonus: 0,
        multipliers: [],
        finalValue: baseValue,
    };
}

export function getModifiableStatValue(stat: ModifiableStat): number {
    if (!stat.isDirty) {
        return stat.finalValue;
    }
    delete stat.isDirty;
    stat.finalValue = (stat.baseValue + stat.addedBonus) * (1 + stat.percentBonus / 100);
    for (const multiplier of stat.multipliers) {
        stat.finalValue *= multiplier;
    }
    // console.log(stat, stat.finalValue);
    return stat.finalValue;
}
