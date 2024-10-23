import {loseEssence} from 'app/objects/nexus';
import {doCirclesIntersect} from 'app/utils/geometry'

export function damageTarget(state: GameState, target: AttackTarget, damage: number) {
    if (damage < 0) {
        return
    }
    if (target.objectType === 'nexus') {
        loseEssence(state, damage);
        return;
    }
    target.health = Math.max(0, target.health - damage);
    if (target.health <= 0) {
        // remove the object from the state, if not a 'nexus' when it dies.
        const objectIndex = state.world.objects.indexOf(target);
        if (objectIndex >= 0) {
            state.world.objects.splice(objectIndex, 1);
        }
    }
}

// Returns whether a target is still available to attack.
export function isTargetAvailable(state: GameState, target: AttackTarget): boolean {
    if (target.objectType === 'nexus') {
        return true;
    }
    return target.health > 0;
}

export function getTargetsInCircle<T extends AttackTarget>(state: GameState, possibleTargets: T[], circle: Circle) {
    const targetsInCircle: T[] = [];
    for (const target of possibleTargets) {
        if (!isTargetAvailable(state, target)) {
            continue;
        }
        if (doCirclesIntersect(target, circle)) {
            targetsInCircle.push(target);
        }
    }
    return targetsInCircle;
}


export function applyEffectToHero(state: GameState, effect: Effect<Hero>, hero: Hero) {
    hero.effects.push(effect);
    effect.apply(state, hero);
}

export function removeEffectFromHero(state: GameState, effect: Effect<Hero>, hero: Hero) {
    const index = hero.effects.indexOf(effect);
    if (index < 0) {
        return;
    }
    hero.effects.splice(index, 1);
    effect.remove(state, hero);
}
