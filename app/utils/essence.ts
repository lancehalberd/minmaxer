const nexusLevels = [
    {
        goal:  200,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            state.nexusAbilitySlots.push(undefined);
            state.maxNexusAbilityLevel = 2;
        }
    },
    {
        goal:  1000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            state.craftingBench.baseMaterialSlots.push(undefined);
            state.craftingBench.baseMaterialSlots.push(undefined);
        }
    },
    {
        goal:  2000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            state.craftingBench.decorationSlots.push(undefined);
        }
    },
    {
        goal:  5000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            // Old idea: Allow converting essence into hero XP.
            state.nexusAbilitySlots.push(undefined);
        }
    },
    {
        goal:  10000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            // Gain an extra hero slot.
            state.heroSlots.push(undefined);
            state.maxHeroSkillPoints = 8;
            state.craftingBench.baseMaterialSlots.push(undefined);
        }
    },
    {
        goal:  20000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            state.maxNexusAbilityLevel = 2;
            state.craftingBench.decorationSlots.push(undefined);
        }
    },
    {
        goal:  50000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            state.nexusAbilitySlots.push(undefined);
        }
    },
    {
        goal:  100000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            // Gain an extra hero slot.
            state.heroSlots.push(undefined);
            state.maxHeroSkillPoints = 9;
            state.craftingBench.baseMaterialSlots.push(undefined);
        }
    },
    {
        goal:  200000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            state.maxNexusAbilityLevel = 3;
            state.craftingBench.decorationSlots.push(undefined);
        }
    },
    {
        goal:  500000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            state.craftingBench.baseMaterialSlots.push(undefined);
            state.craftingBench.decorationSlots.push(undefined);
        }
    },
    {
        goal:  1000000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            state.maxHeroSkillPoints = 10;
            state.craftingBench.decorationSlots.push(undefined);
        }
    },
];


export function gainEssence(state: GameState, essence: number, showDelta = true) {
    if (essence <= 0) {
        return;
    }
    state.nexus.essence += essence;
    // Set gained essence to animate gaining the essence over time in the essence bar.
    if (showDelta) {
        state.nexus.gainedEssence += essence;
        state.nexus.gainedEssenceTime = state.world.time;
    }
    checkToLeveNexusUp(state);
}

export function loseEssence(state: GameState, essence: number) {
    if (essence <= 0) {
        return;
    }
    state.nexus.essence = Math.max(0, state.nexus.essence - essence);
    state.nexus.lostEssence += essence;
    state.nexus.lostEssenceTime = state.world.time;
}

export function spendEssence(state: GameState, essence: number): boolean {
    if (essence >= state.nexus.essence) {
        return false;
    }
    loseEssence(state, essence);
    return true;
}

export function getNextEssenceGoal(state: GameState): number|undefined {
    return nexusLevels[state.nexus.level - 1]?.goal;
}

function checkToLeveNexusUp(state: GameState) {
    let nextLevel = nexusLevels[state.nexus.level - 1];
    while (nextLevel && nextLevel.goal <= state.nexus.essence) {
        nextLevel.applyChanges(state);
        state.nexus.level++;
        nextLevel = nexusLevels[state.nexus.level - 1];
    }
}

