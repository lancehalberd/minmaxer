import {typedKeys} from 'app/utils/types';

export function calculatePrestigeStats(state: GameState): PrestigeStats {
    let totalHeroLevels = 0, totalSkillLevels = 0;
    for (const hero of state.heroSlots) {
        totalHeroLevels += (hero?.level ?? 0);
        totalSkillLevels += (hero?.totalSkillLevels ?? 0);
    }
    const newPrestigeStats: PrestigeStats = {
        lootRarityBonus: state.highestLevelEnemyDefeated,
        archerExperienceBonus: 5 * state.city.archers.level,
        mageExperienceBonus: 5 * state.city.mages.level,
        essenceGainBonus: 5 * state.nexus.level,
        heroExperienceBonus: 5 * totalHeroLevels,
        skillExperienceBonus: 5 * totalSkillLevels,
    };
    // Keep the highest prestigate stats from the current run.
    for (const key of typedKeys(newPrestigeStats)) {
        newPrestigeStats[key] = Math.max(state.prestige[key], newPrestigeStats[key]);
    }
    return newPrestigeStats;
}
