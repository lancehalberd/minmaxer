import {mageFlame, mageFrost, mageHeal, mageSummon} from 'app/definitions/nexusAbilities'
import {frameLength,} from 'app/gameConstants';
import {getAllyTargets, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';
import {createJobComponent} from 'app/ui/jobComponent';
import {getOrCreateJob} from 'app/utils/job';
import {getJobMultiplierFromTools} from 'app/utils/inventory';

export const mageJobDefinition: JobDefinition = {
    key: 'trainMages',
    label: (state: GameState) => 'Lv ' + state.city.mages.level + ' Mages',
    requiredToolType: 'staff',
    onComplete: (state: GameState) => {
        gainMageLevel(state);
    },
    workerSeconds: (state: GameState) => 100 * (1.2 ** (state.city.mages.level)) / (1 + (state.prestige.mageExperienceBonus ?? 0) / 100),
    repeat: true,
};
export const mageJobElement = createJobComponent({jobDefinition: mageJobDefinition, scale: 2});

export function gainMageLevel(state: GameState) {
    state.city.mages.level++;
    if (state.city.mages.level === 1) {
        state.city.mages.power = 1;
        state.city.mages.cooldownSpeed = 1;
        state.city.mages.range = 40;
    } else if (state.city.mages.level % 3 === 2) {
        state.city.mages.power *= 1.2;
    } else if (state.city.mages.level % 3 === 0) {
        state.city.mages.cooldownSpeed += 0.2;
    } else if (state.city.mages.level % 3 === 1) {
        state.city.mages.range += 5;
    }
}

const mageAbilityMap = <const>{
    flame: mageFlame,
    frost: mageFrost,
    heal: mageHeal,
    summon: mageSummon,
};

export function updateMages(state: GameState) {
    if (state.city.mages.level <= 0) {
        return;
    }
    if (state.city.mages.globalCooldown > 0) {
        state.city.mages.globalCooldown -= frameLength;
    }
    const mageJob = getOrCreateJob(state, mageJobDefinition);
    const jobMultiplier = getJobMultiplierFromTools(state, mageJob.workers, mageJob.definition.requiredToolType);
    const cooldownSpeed = state.city.mages.cooldownSpeed * (1 + jobMultiplier / 100);
    const powerMultiplier = (1 + jobMultiplier / 100);
    const range = state.city.mages.range * (1 + jobMultiplier / 100 / 10);
    const hitCircle = {x: state.nexus.x, y: state.nexus.y, r: state.nexus.r + range}
    for (const nexusAbility of state.nexusAbilities) {
        const abilityKey = nexusAbility.definition.abilityKey;
        if (nexusAbility.level <= 0) {
            continue;
        }
        const mageAbility = mageAbilityMap[abilityKey];
        if (!mageAbility) {
            continue;
        }
        const cooldown = state.city.mages.cooldowns[abilityKey] ?? 0;
        if (cooldown >= 0) {
            state.city.mages.cooldowns[abilityKey] = cooldown - frameLength * cooldownSpeed;
            continue;
        }
        if (state.city.mages.globalCooldown > 0) {
            continue;
        }
        const targetingInfo = mageAbility.getTargetingInfo(state, nexusAbility);
        if (targetingInfo.canTargetAlly === true) {
            const allyTargets = getTargetsInCircle(state, getAllyTargets(state, state.nexus.zone), hitCircle);
            for (const target of allyTargets) {
                if (!mageAbility.isTargetValid(state, nexusAbility, target)) {
                    continue;
                }
                mageAbility.onActivate(state, nexusAbility, target, powerMultiplier);
                state.city.mages.cooldowns[abilityKey] = mageAbility.getCooldown(state, nexusAbility);
                state.city.mages.globalCooldown = 500;
                break;
            }
        } else {
            const enemyTargets = getTargetsInCircle(state, getEnemyTargets(state, state.nexus.zone), hitCircle);
            for (const target of enemyTargets) {
                if (!mageAbility.isTargetValid(state, nexusAbility, target)) {
                    continue;
                }
                mageAbility.onActivate(state, nexusAbility, target, powerMultiplier);
                state.city.mages.cooldowns[abilityKey] = mageAbility.getCooldown(state, nexusAbility);
                state.city.mages.globalCooldown = 500;
                break;
            }
        }
    }
}
