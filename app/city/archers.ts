import {addProjectile} from 'app/effects/projectile';
import {uiSize} from 'app/gameConstants';
import {isTargetAvailable} from 'app/utils/combat';
import {getDistanceBetweenCircles} from 'app/utils/geometry';
import {createJobComponent} from 'app/ui/jobComponent';
import {getOrCreateJob} from 'app/utils/job';
import {getJobMultiplierFromTools} from 'app/utils/inventory';

export const archerJobDefinition: JobDefinition = {
    key: 'trainArchers',
    label: (state: GameState) => 'Lv ' + state.city.archers.level + ' Archers',
    requiredToolType: 'bow',
    onComplete: (state: GameState) => {
        gainArcherLevel(state);
    },
    workerSeconds: (state: GameState) => 100 * (1.2 ** (state.city.archers.level)) / (1 + (state.prestige.archerExperienceBonus ?? 0) / 100),
    repeat: true,
};
export const archerJobElement = createJobComponent({jobDefinition: archerJobDefinition, scale: 2, x: -6.5 * uiSize, y: -3.5 * uiSize});

export function gainArcherLevel(state: GameState) {
    state.city.archers.level++;
    if (state.city.archers.level === 1) {
        state.city.archers.damage = 5;
        state.city.archers.attacksPerSecond = 3;
        state.city.archers.range = 50;
    } else if (state.city.archers.level % 3 === 2) {
        state.city.archers.damage *= 1.2;
    } else if (state.city.archers.level % 3 === 0) {
        state.city.archers.attacksPerSecond += 0.3;
    } else if (state.city.archers.level % 3 === 1) {
        state.city.archers.range += 10;
    }
}

export function updateArchers(state: GameState) {
    if (state.city.archers.level <= 0) {
        return;
    }
    const archerJob = getOrCreateJob(state, archerJobDefinition);
    const jobMultiplier = getJobMultiplierFromTools(state, archerJob.workers, archerJob.definition.requiredToolType);
    const damage = Math.floor(state.city.archers.damage * (1 + jobMultiplier / 100));
    const attacksPerSecond = state.city.archers.attacksPerSecond * (1 + jobMultiplier / 100);
    const range = state.city.archers.range * (1 + jobMultiplier / 100 / 10);
    if (state.city.archers.target && !isTargetAvailable(state, state.city.archers.target)) {
        delete state.city.archers.target
    }
    // Remove the target if it goes out of range since the archers cannot chase it.
    const currentTarget = state.city.archers.target;
    if (currentTarget && getDistanceBetweenCircles(state.nexus, currentTarget) > range) {
        delete state.city.archers.target
    }
    // The archers will automatically attack an enemy within its range if it is idle.
    if (!state.city.archers.target) {
        // Choose the closest valid target within the aggro radius as an attack target.
        let closestDistance = range;
        for (const object of state.nexus.zone.objects) {
            if (object.objectType === 'enemy') {
                const distance = getDistanceBetweenCircles(state.nexus, object);
                if (distance < closestDistance) {
                    state.city.archers.target = object;
                    closestDistance = distance;
                }
            }
        }
    }
    if (state.city.archers.target) {
        const attackTarget = state.city.archers.target;
        const attackCooldown = 1000 / attacksPerSecond;
        if (!state.city.archers.lastAttackTime || state.city.archers.lastAttackTime + attackCooldown <= state.nexus.zone.time) {
            const speed = 2 * range;
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
                duration: 1000 * range / speed,
                hit: {damage},
            });
            state.city.archers.lastAttackTime = state.nexus.zone.time;
        }
    }
}
