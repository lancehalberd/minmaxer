import {loseEssence} from 'app/utils/essence';
import {doCirclesIntersect} from 'app/utils/geometry'
import {getModifiableStatValue} from 'app/utils/modifiableStat';

export function damageTarget(state: GameState, target: AttackTarget, damage: number, damageSource?: AttackTarget) {
    if (damage < 0) {
        return
    }
    if (target.objectType === 'nexus') {
        if (state.city.wall.health > 0) {
            const tempDamage = damage;
            damage -= state.city.wall.health;
            state.city.wall.health -= tempDamage;
            if (damageSource && state.city.wall.returnDamage) {
                damageTarget(state, damageSource, state.city.wall.returnDamage);
            }
            // Stop if the wall absorbed all of the damage.
            if (damage <= 0) {
                return;
            }
        }
        loseEssence(state, damage);
        return;
    }
    if (target.objectType === 'hero') {
        damage *= getModifiableStatValue(target.incomingDamageMultiplier);
    }
    target.health = Math.max(0, target.health - damage);
    if (target.health <= 0) {
        // remove the object from the state, if not a 'nexus' when it dies.
        const objectIndex = state.world.objects.indexOf(target);
        if (objectIndex >= 0) {
            state.world.objects.splice(objectIndex, 1);
        }
        if (target.objectType === 'hero') {
            const reviveTime = Math.floor(target.level * 5 * (1 + state.nexus.deathCount * 0.2));
            target.reviveCooldown = {
                total: reviveTime,
                remaining: reviveTime,
            };
        }
    }
}

// Returns whether a target is still available to attack.
export function isTargetAvailable(state: GameState, target: AbilityTarget): boolean {
    if (target.objectType === 'nexus') {
        return true;
    }
    if (target.objectType === 'point') {
        return true;
    }
    if (target.objectType === 'loot') {
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


export function applyEffectToHero(state: GameState, effect: ObjectEffect<Hero>, hero: Hero) {
    hero.effects.push(effect);
    effect.apply(state, hero);
}

export function removeEffectFromHero(state: GameState, effect: ObjectEffect<Hero>, hero: Hero) {
    const index = hero.effects.indexOf(effect);
    if (index < 0) {
        return;
    }
    hero.effects.splice(index, 1);
    effect.remove(state, hero);
}

export function isAbilityTargetValid(state: GameState, targetingInfo: AbilityTargetingInfo): boolean {
    const mouseTarget = state.mouse.mouseHoverTarget;
    if (!mouseTarget) {
        return false;
    }
    if (mouseTarget.objectType === 'point') {
        return !!targetingInfo.canTargetLocation;
    }
    if (mouseTarget.objectType === 'enemy' || mouseTarget.objectType === 'spawner') {
        return !!targetingInfo.canTargetEnemy;
    }
    if (mouseTarget.objectType === 'hero') {
        return !!targetingInfo.canTargetAlly;
    }
    return false;
}

export function getEnemyTargets(state: GameState) {
    const enemies: EnemyTarget[] = [];
    for (const object of state.world.objects) {
        if (object.objectType === 'enemy' || object.objectType === 'spawner') {
            enemies.push(object);
        }
    }
    return enemies;
}
