import {computeValue} from 'app/utils/computed';

export function applyEffectToTarget(state: GameState, effect: ObjectEffect, target: ModifiableTarget) {
    target.effects.push(effect);
    effect.apply(state, target);
}

export function removeEffectFromTarget(state: GameState, effect: ObjectEffect, target: ModifiableTarget) {
    const index = target.effects.indexOf(effect);
    if (index < 0) {
        return;
    }
    target.effects.splice(index, 1);
    effect.remove(state, target);
}

export function checkForOnHitTargetAbilities(state: GameState, ally: Hero|Ally, target: AttackTarget) {
    for (const ability of ally.abilities) {
        if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
            ability.definition.onHitTarget?.(state, ally, ability, target);
        }
    }
}

export function prepareToUseEnemyAbilityOnTarget<T extends FieldTarget>(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<T>, target: T) {
    enemy.activeAbility = ability;
    ability.warningTime = 0;
    ability.warningDuration = computeValue(state, ability, ability.definition.warningTime, 0);
    if (target) {
        ability.target = {objectType: 'point', zone: target.zone, x: target.x, y: target.y, r: 0};
    } else {
        ability.target = {objectType: 'point', zone: enemy.zone, x: enemy.x, y: enemy.y, r: 0};
    }
    if (!ability.target?.zone) {
        debugger;
    }
    if (ability.definition.zoneCooldown) {
        enemy.zone.zoneEnemyCooldowns.set(ability.definition, ability.definition.zoneCooldown);
    }
}

export function createActiveEnemyAbilityInstance<T extends FieldTarget|undefined>(abilityDefinition: ActiveEnemyAbilityDefinition<T>): ActiveEnemyAbility<T>  {
    return {
        abilityType: <const>'activeEnemyAbility',
        definition: abilityDefinition,
        cooldown: 0,
        warningTime: 0,
        warningDuration: 0,
        charges: abilityDefinition.initialCharges ?? 1,
        maxCharges: abilityDefinition.maxCharges ?? 1,
    };
}
