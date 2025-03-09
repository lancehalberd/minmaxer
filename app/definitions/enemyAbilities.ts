import {addHealEffectToTarget} from 'app/effects/healAnimation';
import {damageTarget, getAllyTargets, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';

// TODO: Add global cooldown to prevent stacking too many of the same abilities at once.
export const groupHeal: ActiveEnemyAbilityDefinition<EnemyTarget> = {
    abilityType: 'activeEnemyAbility',
    name: 'Heal',
    getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<EnemyTarget> ) {
        // This skill is used immediately where the hero is standing when activated.
        return {
            canTargetAlly: true,
            hitRadius: 100,
            range: 100,
        };
    },
    cooldown: 5000,
    zoneCooldown: 1000,
    isTargetValid(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<EnemyTarget> , target: AbilityTarget) {
        if (target.objectType !== 'enemy') {
            return false;
        }
        return target.health < target.getMaxHealth(state);
    },
    onActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<EnemyTarget> , target: EnemyTarget) {
        const targetingInfo = this.getTargetingInfo(state, enemy, ability);
        const hitCircle = {x: target.x, y: target.y, r: targetingInfo.hitRadius || 0};
        const targets = getTargetsInCircle(state, getEnemyTargets(state, enemy.zone), hitCircle);
        // Heals 33% of health for a standard enemy of this level.
        let healAmount = ((enemy.level * 5 * (1.1 ** enemy.level)) / 3) | 0;
        for (const target of targets) {
            target.health = Math.min(target.getMaxHealth(state), target.health + healAmount);
            addHealEffectToTarget(state, target);
        }
    },
};

export const slam: ActiveEnemyAbilityDefinition<undefined> = {
    abilityType: 'activeEnemyAbility',
    name: 'Slam',
    getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) {
        // This skill is used immediately where the hero is standing when activated.
        return {
            canTargetEnemy: true,
            hitRadius: enemy.r + 60,
            range: 0,
        };
    },
    cooldown: 5000,
    zoneCooldown: 1000,
    warningTime: 1500,
    onActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) {
        const targetingInfo = this.getTargetingInfo(state, enemy, ability);
        const hitCircle = {x: enemy.x, y: enemy.y, r: targetingInfo.hitRadius || 0};
        const targets = getTargetsInCircle(state, getAllyTargets(state, enemy.zone), hitCircle);
        for (const target of targets) {
            damageTarget(state, target, {damage: 2 + 2 * enemy.damage, source: enemy});
        }
    },
};


