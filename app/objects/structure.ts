import {fillCircle, renderGameStatus} from 'app/utils/draw';
import { frameLength } from 'app/gameConstants';

/*
TODO:

Forest
    Contains wood for harvest 1 wood per second


Max population is 10 initially

Population jobs:
    Jobs have prerequisites and are initially hidden if prereqs are not met
        On rebirth known jobs can be seen or hidden based on player preference.
    Jobs require assigning people to completed them and take time to complete.
    Jobs may require inputs to complete that are consumed at the start of each job.
    Jobs may have a limit to the number of people that can be assigned to them.
    Jobs may require a tool.
        The number of tools will limit the number of people that can be assigned.
        The quality of tools can effect the rate or outcome of the job.
    Jobs may be automatically repeatable.

    Craft hammer:
        2 wood, 10 seconds

    Upgrade Palisade(N Levels):
        X resources, requires hammer, takes N seconds
        Improve the max life of the palisade + return damage
            500 wood -> 300 health, 5 thorns damage
            200 stone+2000 wood -> 1000 health, 20 thorns damage



    Craft 1 bow:
        1 wood, 20 seconds

    Craft N(10-100) arrows:
        1 wood, 10 seconds

    Utility structures:
        Market (Allow buying items)
        Houses (increase population)
        Farms
        Armory (crafting armor)
        Workshops (crafting  other tools)
        Refinery (convert raw resources into refined resources like lumber -> planks, ore -> ingots)

Implement structures

Add ability to create structures

Define upgrade paths for structures:
    For example upgrade overall structure, or upgrade specific stats like range, rate of fire, damage for Guard Tower.

*/

export const nexus: Nexus = {
    objectType: 'nexus',
    x: 0,
    y: 0,
    r: 20,
    color: '#0FF',
    level: 1,
    deathCount: 0,
    essence: 100,
    essenceGrowth: 1,
    lostEssence: 0,
    lostEssenceTime: 0,
    gainedEssence: 0,
    gainedEssenceTime: 0,
    previewEssenceChange: 0,
    render(this: Nexus, context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        if (this.essence <= 0){
            renderGameStatus(context, "nexus destroyed!");
        }
      
    },
    update(state: GameState) {
        // If we are tracking gained essence, remove it linearly for 1 second following the last time
        // essence was gained.
       if (this.gainedEssence) {
            const timeLeft = this.gainedEssenceTime + 1000 - state.world.time;
            if (timeLeft > 0) {
                // Reduce essence by one frame if there is time remaining.
                this.gainedEssence = this.gainedEssence * (timeLeft - frameLength) / timeLeft;
            } else {
                // If there is no time remaining, just set gained essence to 0.
                this.gainedEssence = 0;
            }
        }
        // If we are tracking lost essence, remove it linearly for 0.5 seconds after a second has passed.
        if (this.lostEssence) {
            const timeLeft = this.lostEssenceTime + 600 - state.world.time;
            // There is a short delay before depleting the lost essence section.
            if (timeLeft > 0 && timeLeft < 400) {
                // Reduce essence by one frame if there is time remaining.
                this.lostEssence = this.lostEssence * (timeLeft - frameLength) / timeLeft;
            } else if (timeLeft <= 0) {
                // If there is no time remaining, just set gained essence to 0.
                this.lostEssence = 0;
            }

        }
        // Since this is gained every frame we don't want to animate this change.
        gainEssence(state, this.essenceGrowth * frameLength / 1000, false);
    },
};

const nexusLevels = [
    {
        goal:  200,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            // TODO: allow building simple towers.
        }
    },
    {
        goal:  1000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            // TODO: allow forging hero equipment
        }
    },
    {
        goal:  5000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            // TODO: allow convering essence to hero experience.
        }
    },
    {
        goal:  10000,
        applyChanges(state: GameState) {
            state.nexus.essenceGrowth++;
            // Gain an extra hero slot.
            state.heroSlots.push(null);
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
