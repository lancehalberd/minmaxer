import {addHealEffect} from 'app/effects/healAnimation';
import {uiSize} from 'app/gameConstants';
import {isTargetAvailable} from 'app/utils/combat';
import {getDistance} from 'app/utils/geometry';
import {createJobElement} from 'app/utils/job';

// We should probably find a way to track this on the state, but since we update this
// every tick, it probably won't break anything to have this here.
let lastTarget: Hero|undefined;
const healerRange = 40;
const healerJobDefinition: JobDefinition = {
    key: 'healer',
    label: 'Healers',
    requiredToolType: 'staff',
    workerSeconds: 10,
    repeat: true,
    essenceCost: 10,
    canProgress(state: GameState) {
        if (lastTarget && (!isTargetAvailable(state, lastTarget) || lastTarget.health >= lastTarget.maxHealth)) {
            lastTarget = undefined;
        }
        if (!lastTarget) {
            let closestDistance = state.nexus.r + healerRange;
            for (const object of state.world.objects) {
                if (object.objectType === 'hero' && object.health < object.maxHealth) {
                    const distance = getDistance(state.nexus, object);
                    if (distance < closestDistance) {
                        lastTarget = object;
                        closestDistance = distance;
                    }
                }
            }
        }
        return !!lastTarget;
    },
    onComplete(state: GameState) {
        if (lastTarget) {
            lastTarget.health = Math.min(lastTarget.maxHealth, lastTarget.health + 20);
            addHealEffect(state, {target: lastTarget});
        }
    }
};
export const healerJobElement = createJobElement(healerJobDefinition, { x: -11 * uiSize, y: -3.5 * uiSize});

