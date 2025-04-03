import {addHealEffectToTarget} from 'app/effects/healAnimation';
import {uiSize} from 'app/gameConstants';
import {isTargetAvailable} from 'app/utils/combat';
import {getDistance} from 'app/utils/geometry';
import {createJobComponent} from 'app/ui/jobComponent';

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
        if (lastTarget && (
            !isTargetAvailable(state, lastTarget)
            || lastTarget.health >= lastTarget.getMaxHealth(state)
        )) {
            lastTarget = undefined;
        }
        if (!lastTarget) {
            let closestDistance = state.nexus.r + healerRange;
            for (const object of state.nexus.zone.objects) {
                if (object.objectType === 'hero' && object.health < object.getMaxHealth(state)) {
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
            lastTarget.health = Math.min(lastTarget.getMaxHealth(state), lastTarget.health + 20);
            addHealEffectToTarget(state, lastTarget);
        }
    }
};
export const healerJobElement = createJobComponent({jobDefinition: healerJobDefinition, x: 0.5 * uiSize, y: -3.5 * uiSize, scale: 2});

