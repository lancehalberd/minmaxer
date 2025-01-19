import {addProjectile} from 'app/effects/projectile';
import {uiSize} from 'app/gameConstants';
import {isTargetAvailable} from 'app/utils/combat';
import {gainEssence} from 'app/utils/essence';
import {getDistance} from 'app/utils/geometry';
import {createJobElement} from 'app/utils/job';

const archerJobDefinition: JobDefinition = {
    key: 'archer',
    label: 'Archers',
    requiredToolType: 'bow',
    update: updateArchers,
    //workerSeconds: 1,
    //repeat: true,
};
export const archerJobElement = createJobElement(archerJobDefinition, { x: - 2 * uiSize, y: -uiSize});

function updateArchers(state: GameState, archerJob: Job) {
    // Update archers
    const arrows = state.inventory.woodArrow; // + flintArrows etc.
    // Distance is measured from the center of the nexus, so add the radius of the nexus.
    const archerRange = state.nexus.r + 40;
    if (archerJob.workers > 0 && arrows > 0) {
        if (state.city.archersTarget && !isTargetAvailable(state, state.city.archersTarget)) {
            delete state.city.archersTarget
        }
        // Remove the target if it goes out of range since the archers cannot chase it.
        if (state.city.archersTarget && getDistance(state.nexus, state.city.archersTarget)) {
            delete state.city.archersTarget
        }
        // The archers will automatically attack an enemy within its range if it is idle.
        if (!state.city.archersTarget) {
            // Choose the closest valid target within the aggro radius as an attack target.
            let closestDistance = archerRange;
            for (const object of state.world.objects) {
                if (object.objectType === 'enemy') {
                    const distance = getDistance(state.nexus, object);
                    if (distance < closestDistance) {
                        state.city.archersTarget = object;
                        closestDistance = distance;
                    }
                }
            }
        }
        if (state.city.archersTarget) {
            const attackTarget = state.city.archersTarget;
            const attacksPerSecond = archerJob.workers;
            const attackCooldown = 1000 / attacksPerSecond;
            if (!state.city.archersLastAttackTime || state.city.archersLastAttackTime + attackCooldown <= state.world.time) {
                // TODO: This should be calculated from various factors.
                const damage = 1;
                const speed = 100;
                const dx = attackTarget.x - state.nexus.x, dy = attackTarget.y - state.nexus.y;
                const mag = Math.sqrt(dx*dx + dy*dy);
                state.inventory.woodArrow--;
                addProjectile(state, {
                    x: state.nexus.x + dx * state.nexus.r / mag,
                    y: state.nexus.y + dy * state.nexus.r / mag,
                    hitsEnemies: true,
                    vx: dx * speed / mag,
                    vy: dy * speed / mag,
                    color: '#AAA',
                    r: 3,
                    duration: 1000 * archerRange / speed,
                    damage,
                });
                //damageTarget(state, attackTarget, damage, this);
                //attackTarget.onHit?.(state, this);
                state.city.archersLastAttackTime = state.world.time;
            }

            // Remove the attack target when it is dead.
            // Update hero experience.
            if (attackTarget.health <= 0) {
                gainEssence(state, attackTarget.essenceWorth);
                // Don't drop items from enemies killed by the Nexus to prevent them from
                // stacking up too much.
            }

        }
    }
}
