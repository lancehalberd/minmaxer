import {addDamageNumber} from 'app/effects/damageNumber';
import {frameLength} from 'app/gameConstants';
import {loseEssence} from 'app/utils/essence';
import {doCirclesIntersect} from 'app/utils/geometry'
import {removeFieldObject} from 'app/utils/world';


export function applyDamageOverTime(state: GameState, target: AttackTarget, damagePerSecond: number) {
    // Currently nexux is immune to damage over time.
    if (target.objectType === 'nexus') {
        return;
    }
    let damage = damagePerSecond * frameLength / 1000;
    if (target.objectType === 'hero') {
        damage *= target.getIncomingDamageMultiplier(state);
    }
    target.health = Math.max(0, target.health - damage);
    checkIfTargetIsDefeated(state, target);
}

export function damageTarget(state: GameState, target: AttackTarget, {damage, isCrit, source, showDamageNumber = true}: AttackHit) {
    if (damage < 0) {
        return
    }
    if (target.objectType === 'nexus') {
        if (state.city.wall.health > 0) {
            // Wall cannot take more damage than its current health.
            const damageToWall = Math.min(state.city.wall.health, damage);
            state.city.wall.health -= damageToWall;
            damage -= damageToWall;
            if (source && state.city.wall.returnDamage) {
                damageTarget(state, source, {damage: state.city.wall.returnDamage});
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
        damage *= target.getIncomingDamageMultiplier(state);
        const armorClass = target.getArmorClass(state);
        const maxDamageReduction = target.getMaxDamageReduction(state);
        damage = Math.ceil(Math.max(
            damage - armorClass,
            damage * (1 - maxDamageReduction),
        ));
    }
    target.health = Math.max(0, target.health - damage);
    if (showDamageNumber) {
        addDamageNumber(state, {target, damage: damage | 0, isCrit});
    }
    checkIfTargetIsDefeated(state, target);
}

export function checkIfTargetIsDefeated(state: GameState, target: AttackTarget) {
    if (target.objectType === 'nexus' || target.health > 0) {
        return;
    }
    // remove the object from the state, if not a 'nexus' when it dies.
    removeFieldObject(state, target);
    if ((target.objectType === 'enemy' || target.objectType === 'spawner') && target.onDeath) {
        target.onDeath(state);
    }
    if (target.objectType === 'hero') {
        const reviveTime = Math.floor(target.level * 5 * (1 + state.nexus.deathCount * 0.2));
        target.reviveCooldown = {
            total: reviveTime,
            remaining: reviveTime,
        };
    }
}

// Returns whether a target is still available to target with an ability.
export function isTargetAvailable(state: GameState, target: AbilityTarget): boolean {
    if (target.objectType === 'waveSpawner') {
        return true;
    }
    if (target.objectType === 'nexus') {
        return true;
    }
    if (target.objectType === 'point') {
        return true;
    }
    if (target.objectType === 'loot') {
        return true;
    }
    if (target.objectType === 'structure') {
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

export function isAbilityMouseTargetValid(state: GameState, targetingInfo: AbilityTargetingInfo): boolean {
    const mouseTarget = state.mouse.mouseHoverTarget;
    if (!mouseTarget) {
        return false;
    }
    if (mouseTarget.objectType === 'point') {
        return !!targetingInfo.canTargetLocation;
    }
    if (mouseTarget.objectType === 'uiButton' || mouseTarget.objectType === 'uiContainer') {
        return false;
    }
    return isAbilityTargetValid(state, targetingInfo, mouseTarget);
    /*if (!mouseTarget) {
        return false;
    }
    if (mouseTarget.objectType === 'enemy' || mouseTarget.objectType === 'spawner') {
        return !!targetingInfo.canTargetEnemy;
    }
    if (mouseTarget.objectType === 'hero') {
        return !!targetingInfo.canTargetAlly;
    }
    return false;*/
}

export function isAbilityTargetValid(state: GameState, targetingInfo: AbilityTargetingInfo, target: FieldTarget): boolean {
    if (!target) {
        return false;
    }
    // Abilities that don't specify any target type are assumed to target enemies.
    if (!targetingInfo.canTargetLocation && !targetingInfo.canTargetEnemy && !targetingInfo.canTargetAlly) {
        return target.objectType === 'enemy' || target.objectType === 'spawner';
    }
    if (target.objectType === 'point') {
        return !!targetingInfo.canTargetLocation;
    }
    if (target.objectType === 'enemy' || target.objectType === 'spawner') {
        return !!targetingInfo.canTargetEnemy;
    }
    if (target.objectType === 'hero') {
        return !!targetingInfo.canTargetAlly;
    }
    return false;
}

export function isEnemyAbilityTargetValid(state: GameState, targetingInfo: AbilityTargetingInfo, target: FieldTarget): boolean {
    if (!target) {
        return false;
    }
    // Abilities that don't specify any target type are assumed to target enemies.
    if (!targetingInfo.canTargetLocation && !targetingInfo.canTargetEnemy && !targetingInfo.canTargetAlly) {
        return target.objectType === 'hero' || target.objectType === 'nexus';
    }
    if (target.objectType === 'point') {
        return !!targetingInfo.canTargetLocation;
    }
    if (target.objectType === 'enemy' || target.objectType === 'spawner') {
        return !!targetingInfo.canTargetAlly;
    }
    if (target.objectType === 'hero') {
        return !!targetingInfo.canTargetEnemy;
    }
    return false;
}

export function getValidAbilityTargets(state: GameState, zone: ZoneInstance, targetingInfo: AbilityTargetingInfo): AttackTarget[] {
    const validTargets: AttackTarget[] = [];
    for (const object of zone.objects) {
        if (!object || object.objectType === 'waveSpawner' || object.objectType === 'loot' || object.objectType === 'structure') {
            continue;
        }
        // Skip this object if the ability doesn't target this type of object.
        if (!isAbilityTargetValid(state, targetingInfo, object)) {
            continue;
        }
        validTargets.push(object);
    }
    return validTargets;
}

export function getAllyTargets(state: GameState, zone: ZoneInstance): AllyTarget[] {
    const allies: AllyTarget[] = [];
    for (const object of zone.objects) {
        if (object.objectType === 'hero' || object.objectType === 'nexus') {
            allies.push(object);
        }
    }
    return allies;
}

export function getEnemyTargets(state: GameState, zone: ZoneInstance): EnemyTarget[] {
    const enemies: EnemyTarget[] = [];
    for (const object of zone.objects) {
        if (object.objectType === 'enemy' || object.objectType === 'spawner') {
            enemies.push(object);
        }
    }
    return enemies;
}
