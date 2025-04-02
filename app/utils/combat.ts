import {enemyDefinitions} from 'app/definitions/enemyDefinitionsHash';
import {requireItem} from 'app/definitions/itemDefinitions';
import {addDamageNumber} from 'app/effects/damageNumber';
import {addTextEffect} from 'app/effects/textEffect';
import {createLoot, pickupLoot} from 'app/objects/loot';
import {frameLength, levelBuffer} from 'app/gameConstants';
import {gainEssence, loseEssence} from 'app/utils/essence';
import {doCirclesIntersect} from 'app/utils/geometry'
import {getItemLabel, getRarityColor} from 'app/utils/inventory';
import {rollLoot} from 'app/utils/lootPool';
import {removeFieldObject} from 'app/utils/world';


export function applyDamageOverTime(state: GameState, target: AttackTarget, damagePerSecond: number, source?: AttackTarget) {
    // Currently nexux is immune to damage over time.
    if (target.objectType === 'nexus') {
        return;
    }
    // Ignore damage against targets that have already been defeated.
    if (target.health <= 0) {
        return;
    }
    let damage = damagePerSecond * frameLength / 1000;
    if (target.objectType === 'hero') {
        damage *= target.getIncomingDamageMultiplier(state);
        const armorClass = target.getArmorClass(state);
        const maxDamageReduction = target.getMaxDamageReduction(state);
        const actualDamageReduction = Math.min(maxDamageReduction, armorClass / damagePerSecond);
        damage *= (1 - actualDamageReduction);
    }
    target.health = Math.max(0, target.health - damage);
    checkIfTargetIsDefeated(state, target, source);
}

export function damageTarget(state: GameState, target: AttackTarget, {damage, isCrit, source, showDamageNumber = true, delayDamageNumber = 0, onHit}: AttackHit) {
    if (damage < 0) {
        return
    }
    onHit?.(state, target);
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
    // Ignore damage against targets that have already been defeated.
    if (target.health <= 0) {
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
        addDamageNumber(state, {target, damage: damage | 0, isCrit, delay: delayDamageNumber});
    }
    checkIfTargetIsDefeated(state, target, source);
}

export function getHeroes(state: GameState) {
    const heroes: Hero[] = [];
    for (const hero of state.heroSlots) {
        if (hero) heroes.push(hero);
    }
    return heroes;
}

export function checkIfTargetIsDefeated(state: GameState, target: AttackTarget, source?: AttackTarget) {
    if (target.objectType === 'nexus' || target.health > 0) {
        return;
    }
    if (target.objectType === 'enemy' || target.objectType === 'spawner') {
        state.highestLevelEnemyDefeated = Math.max(state.highestLevelEnemyDefeated, target.level);
        // Nonsense to make the TS compiler happy.
        if (target.objectType === 'enemy') {
            if (target.onDeath?.(state, target) === false) {
                // If onDeath returns false, it means some effect is preventing the enemy from actually dying,
                // such as the phoenix' rebirth mechanic.
                return;
            }
        } else {
            target.onDeath?.(state, target);
        }

        // Loot drops+xp apply to all heroes in range.
        const heroesInRange = getTargetsInCircle(state, getHeroes(state), {x: target.x, y: target.y, r: 200});
        const lootType = (Math.random() < 0.1) ? (Math.random() < 0.9 ? 'potion' : 'invincibilityPotion') : undefined;
        for (const hero of heroesInRange) {
            const levelDisparity = hero.level - (target.level + levelBuffer);
            const experiencePenalty = 1 - 0.1 * Math.max(levelDisparity, 0);
            const experienceBonus = (1 + (state.prestige.heroExperienceBonus ?? 0) / 100);
            hero.experience += Math.max(target.experienceWorth * experiencePenalty * experienceBonus, 0) / heroesInRange.length;
            if (lootType) {
                pickupLoot(state, hero, createLoot(lootType, target));
            }
        }
        if (source?.objectType === 'hero') {
            source.enemyDefeatCount += 1;
        }
        if (target.objectType === 'enemy') {
            // TODO: add a cleanup function to objects to try to avoid memory leaks.
            target.aggroPack = [];
            const definition = enemyDefinitions[target.enemyType];
            const lootPool = definition?.getLootPool(state, target);
            let lootChance = (definition?.lootChance ?? 0.1);
            // Some enemies likes bosses may have lootChance higher than 1.
            // This will be 100% chance for N items, and possibly some % chance for an additional item.
            let delay = 400;
            while (lootPool?.length && lootChance > 0) {
                if (lootChance >= 1 || Math.random() < lootChance) {
                    const itemKey = rollLoot(lootPool);
                    const item = requireItem(itemKey);
                    const duration = 500 * (1 + item.rarity / 2);
                    addTextEffect(state, {
                        target,
                        text: getItemLabel(itemKey),
                        color: (state) => getRarityColor(state, item.rarity),
                        duration,
                        delay,
                    });
                    state.inventory[itemKey] = (state.inventory[itemKey] ?? 0) + 1;
                    delay += (duration - 100);
                }
                lootChance--;
            }
        }
        gainEssence(state, target.essenceWorth);
    }
    // remove the object from the state, if not a 'nexus' when it dies.
    removeFieldObject(state, target);
    if (target.objectType === 'hero') {
        const reviveTime = Math.floor((5 + target.level) * (1 + state.nexus.deathCount * 0.2));
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
        return target.objectType === 'hero' || target.objectType === 'ally';
    }
    if (target.objectType === 'point') {
        return !!targetingInfo.canTargetLocation;
    }
    if (target.objectType === 'enemy' || target.objectType === 'spawner') {
        return !!targetingInfo.canTargetAlly;
    }
    if (target.objectType === 'hero' || target.objectType === 'ally') {
        return !!targetingInfo.canTargetEnemy;
    }
    return false;
}

export function getValidAbilityTargets(state: GameState, zone: ZoneInstance, targetingInfo: AbilityTargetingInfo): AttackTarget[] {
    const validTargets: AttackTarget[] = [];
    for (const object of zone.objects) {
        if (!object || object.objectType === 'nexus' || object.objectType === 'waveSpawner' || object.objectType === 'loot' || object.objectType === 'structure') {
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
        if (object.objectType === 'hero' || object.objectType === 'ally') {
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
