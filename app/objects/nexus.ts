import {fillCircle, renderGameStatus} from 'app/utils/draw';
import { frameLength } from 'app/gameConstants';

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
