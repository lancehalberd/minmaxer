import {addProjectile} from 'app/effects/projectile';
import {uiSize} from 'app/gameConstants';
import {isTargetAvailable} from 'app/utils/combat';
import {gainEssence} from 'app/utils/essence';
import {getDistance} from 'app/utils/geometry';
import {createJobComponent} from 'app/ui/jobComponent';

const archerJobDefinition: JobDefinition = {
    key: 'archer',
    label: 'Archers',
    requiredToolType: 'bow',
    update: updateArchers,
    //workerSeconds: 1,
    //repeat: true,
};
export const archerJobElement = createJobComponent(archerJobDefinition, { x: -11 * uiSize, y: -uiSize});

function updateArchers(state: GameState, archerJob: Job) {
    // Distance is measured from the center of the nexus, so add the radius of the nexus.
    const archerRange = state.nexus.r + 40;
    if (archerJob.workers > 0) {
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
            for (const object of state.nexus.zone.objects) {
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
            if (!state.city.archersLastAttackTime || state.city.archersLastAttackTime + attackCooldown <= state.nexus.zone.time) {
                // TODO: It should be possible to upgrade this.
                const damage = 5;
                const speed = 100;
                const dx = attackTarget.x - state.nexus.x, dy = attackTarget.y - state.nexus.y;
                const mag = Math.sqrt(dx*dx + dy*dy);
                addProjectile(state, {
                    zone: state.nexus.zone,
                    x: state.nexus.x + dx * state.nexus.r / mag,
                    y: state.nexus.y + dy * state.nexus.r / mag,
                    hitsEnemies: true,
                    vx: dx * speed / mag,
                    vy: dy * speed / mag,
                    color: '#AAA',
                    r: 3,
                    duration: 1000 * archerRange / speed,
                    hit: {damage},
                });
                //damageTarget(state, attackTarget, damage, this);
                //attackTarget.onHit?.(state, this);
                state.city.archersLastAttackTime = state.nexus.zone.time;
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
