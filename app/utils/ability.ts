export function applyEffectToHero(state: GameState, effect: ObjectEffect<Hero|Ally>, hero: Hero|Ally) {
    hero.effects.push(effect);
    effect.apply(state, hero);
}

export function removeEffectFromHero(state: GameState, effect: ObjectEffect<Hero|Ally>, hero: Hero|Ally) {
    const index = hero.effects.indexOf(effect);
    if (index < 0) {
        return;
    }
    hero.effects.splice(index, 1);
    effect.remove(state, hero);
}

export function applyEffectToAlly(state: GameState, effect: ObjectEffect<Hero|Ally>, ally: Hero|Ally) {
    ally.effects.push(effect);
    effect.apply(state, ally);
}

export function removeEffectFromAlly(state: GameState, effect: ObjectEffect<Hero|Ally>, ally: Hero|Ally) {
    const index = ally.effects.indexOf(effect);
    if (index < 0) {
        return;
    }
    ally.effects.splice(index, 1);
    effect.remove(state, ally);
}

/*
This doesn't work because T could be a specific sub type of Enemy or Hero not satisfied by a generic Enemy or Hero...
export function applyEffectToTarget<T extends Enemy|Hero>(state: GameState, effect: ObjectEffect<T>, target: T) {
    target.effects.push(effect);
    effect.apply(state, target);
}
*/

export function applyEffectToEnemy(state: GameState, effect: ObjectEffect<Enemy>, enemy: Enemy) {
    enemy.effects.push(effect);
    effect.apply(state, enemy);
}

export function removeEffectFromEnemy(state: GameState, effect: ObjectEffect<Enemy>, enemy: Enemy) {
    const index = enemy.effects.indexOf(effect);
    if (index < 0) {
        return;
    }
    enemy.effects.splice(index, 1);
    effect.remove(state, enemy);
}

export function checkForOnHitTargetAbilities(state: GameState, ally: Hero|Ally, target: AttackTarget) {
    for (const ability of ally.abilities) {
        if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
            ability.definition.onHitTarget?.(state, ally, ability, target);
        }
    }
}
