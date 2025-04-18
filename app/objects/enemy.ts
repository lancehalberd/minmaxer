import {enemyDefinitions} from 'app/definitions/enemyDefinitionsHash';
import {renderAbilityWarning} from 'app/draw/renderIndicator';
import {frameLength, framesPerSecond} from 'app/gameConstants';
import {createActiveEnemyAbilityInstance, prepareToUseEnemyAbilityOnTarget, removeEffectFromTarget} from 'app/utils/ability';
import {damageTarget, isEnemyAbilityTargetValid, isTargetAvailable} from 'app/utils/combat';
import {computeValue} from 'app/utils/computed';
import {fillCircle, renderLifeBarOverCircle} from 'app/utils/draw';
import {getDistanceBetweenCircles} from 'app/utils/geometry';
import {createModifiableStat, applyStatModifier, isEnemyStat, removeStatModifier, getModifiableStatValue} from 'app/utils/modifiableStat';

export function createEnemy(enemyType: EnemyType, level: number, {zone, x, y}: ZoneLocation): Enemy {
    const definition = enemyDefinitions[enemyType]!;
    const derivedStats = definition.getStatsForLevel(level);
    const enemy: Enemy = {
        objectType: 'enemy',
        enemyType,
        isBoss: definition.isBoss,
        level,
        color: definition.color,
        r: definition.r,
        aggroRadius: definition.aggroRadius ?? 150,
        props: {...(definition.initialProps ?? {})},
        aggroPack: [],
        health: derivedStats.maxHealth,
        getMaxHealth(state: GameState) {
            return derivedStats.maxHealth;
        },
        stats: {
            damage: createModifiableStat<Enemy>(derivedStats.damage),
            attacksPerSecond: createModifiableStat<Enemy>(derivedStats.attacksPerSecond),
            attackRange: createModifiableStat<Enemy>(derivedStats.attackRange),
            speed: createModifiableStat<Enemy>(1),
            movementSpeed: createModifiableStat<Enemy>(derivedStats.movementSpeed),
            incomingDamageMultiplier: createModifiableStat<Enemy>(1),
            regenPerSecond: createModifiableStat<Enemy>((state: GameState) => 0),
        },
        abilities: (definition.abilities ?? []).map((abilityDefinition): EnemyAbility => {
            if (abilityDefinition.abilityType === 'activeEnemyAbility') {
                return createActiveEnemyAbilityInstance(abilityDefinition);
            }
            const passiveAbility: PassiveEnemyAbility = {
                abilityType: <const>'passiveEnemyAbility',
                definition: abilityDefinition,
            };
            return passiveAbility;
        }),
        ...derivedStats,
        zone,
        x,
        y,
        theta: Math.atan2(y, x) + Math.PI,
        animationTime: 0,
        update: updateEnemy,
        beforeUpdate: definition.beforeUpdate,
        afterUpdate: definition.afterUpdate,
        onDeath: definition.onDeath,
        render: renderEnemy,
        onHit: onHitEnemy,
        cleanup: cleanupEnemy,
        effects: [],
        addStatModifiers(modifiers?: StatModifier[]) {
            if (!modifiers) {
                return;
            }
            // TODO: remove this once we correctly mark derived stats as dirty.
            markEnemyStatsAsDirty(this);
            for (const modifier of modifiers) {
                if (isEnemyStat(modifier.stat)) {
                    applyStatModifier(this.stats[modifier.stat], modifier);
                }
            }
        },
        removeStatModifiers(modifiers?: StatModifier[]) {
            if (!modifiers) {
                return;
            }
            // TODO: remove this once we correctly mark derived stats as dirty.
            markEnemyStatsAsDirty(this);
            for (const modifier of modifiers) {
                if (isEnemyStat(modifier.stat)) {
                    removeStatModifier(this.stats[modifier.stat], modifier);
                }
            }
        }
    };
    enemy.zone.objects.push(enemy);
    return enemy;
}

function markEnemyStatsAsDirty(enemy: Enemy) {
    for (const stat of Object.values(enemy.stats)) {
        stat.isDirty = true;
    }
}

function onHitEnemy(this: Enemy, state: GameState, attacker: Hero|Ally) {
    // Bosses ignore attacks from heroes.
    if (this.isBoss) {
        return;
    }
    aggroEnemyPack(this, attacker);
}

function aggroEnemyPack(enemy: Enemy, target: Nexus | AllyTarget) {
    // Heroes will prioritize attacking a hero over other targets.
    if (enemy.attackTarget?.objectType !== 'hero') {
        enemy.attackTarget = target;
    }
    // Aggro the entire pack if one exists.
    for (const ally of (enemy.aggroPack ?? [])) {
        if (ally.attackTarget?.objectType !== 'hero') {
            ally.attackTarget = target;
        }
    }
}

export function updateEnemy(this: Enemy, state: GameState) {
    if (this.beforeUpdate?.(state, this) !== false) {
        updateEnemyMain.apply(this, [state]);
    }
    this.afterUpdate?.(state, this);
}

export function getClosestAttackTargetInRange(state: GameState, enemy: Enemy, range = Infinity): AllyTarget|Nexus|undefined {
    // Choose the closest valid target within the aggro radius as an attack target.
    let attackTarget: AllyTarget|Nexus|undefined;
    let closestDistance = range;
    for (const object of enemy.zone.objects) {
        if (object.objectType !== 'ally' && object.objectType !== 'hero' && object.objectType !== 'nexus') {
            continue;
        }
        const distance = getDistanceBetweenCircles(enemy, object);
        if (distance < closestDistance) {
            attackTarget = object;
            closestDistance = distance;
        }
    }
    return attackTarget;
}

export function updateEnemyMain(this: Enemy, state: GameState) {
    // Stop updating after death.
    if (this.health <= 0) {
        return;
    }
    this.animationTime += frameLength * getModifiableStatValue(state, this, this.stats.speed);
    // Update any effects being applied to this hero and remove them if their duration elapses.
    for (let i = 0; i < this.effects.length; i++) {
        const effect = this.effects[i];
        if (effect.duration) {
            effect.duration -= frameLength / 1000;
            if (effect.duration <= 0) {
                removeEffectFromTarget(state, this.effects[i--], this);
            }
        }
    }
    if (this.activeAbility?.target) {
        this.activeAbility.warningTime += frameLength;
        if (this.activeAbility.warningTime > this.activeAbility.warningDuration) {
            this.activeAbility.definition.onActivate(state, this, this.activeAbility, this.activeAbility.target);
            // this.activeAbility.cooldown = computeValue(state, this.activeAbility, this.activeAbility.definition.cooldown, 5000);
            this.activeAbility.charges--;
            delete this.activeAbility;
        }
        return;
    }
    // Remove the current attack target if it is becomes invalid (it dies, for example).
    if (this.attackTarget && !isTargetAvailable(state, this.attackTarget)) {
        delete this.attackTarget;
    }
    // Bosses on the overworld always attack the nexus and don't explicitly target anything else.
    if (this.isBoss && this.zone === state.nexus.zone) {
        this.attackTarget = state.nexus;
    }
    // Check to choose a new attack target.
    const attackRange = getEnemyAttackRange(state, this);
    if (!this.attackTarget) {
        this.attackTarget = getClosestAttackTargetInRange(state, this, this.aggroRadius);
        if (this.attackTarget) {
            aggroEnemyPack(this, this.attackTarget);
        }
    }
    // Update ability cooldown and autocast any abilities that make sense.
    const cooldownDelta = frameLength * getEnemyCooldownSpeed(state, this);
    for (const ability of this.abilities) {
        if (ability.abilityType === 'activeEnemyAbility') {
            if (ability.cooldown <= 0) {
                ability.cooldown = computeValue(state, ability, ability.definition.cooldown, 1000);
            }
            if (ability.charges < ability.maxCharges) {
                ability.cooldown -= cooldownDelta;
                if (ability.cooldown <= 0) {
                    ability.charges++;
                }
            }
            if (ability.charges > 0 && (this.zone.zoneEnemyCooldowns.get(ability.definition) ?? 0) <= 0) {
                checkToAutocastAbility(state, this, ability);
            }
        }
        if (ability.abilityType === 'passiveEnemyAbility') {
            ability.definition.update?.(state, this, ability);
        }
    }
    if (this.activeAbility) {
        return;
    }
    // If the enemy has nothing else to do, move towards its default target.
    if (!this.attackTarget && !this.movementTarget) {
        this.movementTarget = this.defaultTarget;
    }
    let targetToAttack: AllyTarget|Nexus|undefined;
    const priorityTarget = this.attackTarget || this.movementTarget;
    if (this.attackTarget) {
        // Move towards the primary target.
        if (moveEnemyTowardsTarget(state, this, this.attackTarget, this.r + this.attackTarget.r + attackRange)) {
            // Attack the main target once it is in range.
            targetToAttack = this.attackTarget;
        }
    }
    // The enemy will attack a random nearby target in two circumstances:
    // 1) They are not currently moving/attacking anything
    // 2) Their movement was blocked and their primary target is not in range.
    if (!targetToAttack && (!priorityTarget || this.movementWasBlocked)) {
        // If no other attack target is in range, just try attacking the nearest target.
        targetToAttack = getClosestAttackTargetInRange(state, this, attackRange);
    }
    if (targetToAttack) {
        const attackCooldown = 1000 / getEnemyAttacksPerSecond(state, this);
        if (!this.lastAttackTime || this.lastAttackTime + attackCooldown <= this.zone.time) {
            const damage = getEnemyDamageForTarget(state, this, targetToAttack);
            damageTarget(state, targetToAttack, {damage, source: this});
            targetToAttack.onHit?.(state, this);
            this.lastAttackTime = this.zone.time;
        }
    }
    if (!this.attackTarget && this.movementTarget) {
        // Remove the target once they reach their destination.
        if (moveEnemyTowardsTarget(state, this, this.movementTarget)) {
            delete this.movementTarget;
        }
    }
}
function getEnemyMovementSpeed(state: GameState, enemy: Enemy): number {
    const movementSpeed = getModifiableStatValue(state, enemy, enemy.stats.movementSpeed);
    const speed = getModifiableStatValue(state, enemy, enemy.stats.speed);
    return Math.max(0, movementSpeed * speed);
}
function getEnemyAttacksPerSecond(state: GameState, enemy: Enemy): number {
    const attacksPerSecond = getModifiableStatValue(state, enemy, enemy.stats.attacksPerSecond);
    const speed = getModifiableStatValue(state, enemy, enemy.stats.speed);
    return Math.max(0, attacksPerSecond * speed);
}
function getEnemyAttackRange(state: GameState, enemy: Enemy): number {
    return getModifiableStatValue(state, enemy, enemy.stats.attackRange);
}
function getEnemyCooldownSpeed(state: GameState, enemy: Enemy): number {
    return Math.max(0, getModifiableStatValue(state, enemy, enemy.stats.speed));
}
export function getEnemyDamageForTarget(state: GameState, enemy: Enemy, target?: AbilityTarget): number {
    let damage = getModifiableStatValue(state, enemy, enemy.stats.damage);
    if (enemy.isBoss && target?.objectType === 'nexus') {
        // Bosses deal 5-10x damage to the nexus.
        // This makes them a threat to the nexus without making them too dangerous to heroes.
        damage *= (5 + 5 * enemy.level / 100);
    }
    for (const ability of enemy.abilities) {
        if (ability.abilityType === 'passiveEnemyAbility') {
            if (ability.definition.modifyDamage) {
                damage = ability.definition.modifyDamage(state, enemy, ability, target, damage);
            }
        }
    }
    return damage;
}

function moveEnemyTowardsTarget(state: GameState, enemy: Enemy, target: AbilityTarget, distance = 0): boolean {
    enemy.movementWasBlocked = false;
    const pixelsPerFrame = getEnemyMovementSpeed(state, enemy) / framesPerSecond;
    // Move this until it reaches the target.
    // Slightly perturb the target so enemies don't get stacked with the exact same heading.
    const dx = target.x - 0.5 + Math.random() - enemy.x;
    const dy = target.y - 0.5 + Math.random() - enemy.y;
    enemy.theta = Math.atan2(dy, dx);
    const mag = Math.sqrt(dx * dx + dy * dy);
    // Attack the target when it is in range.
    if (mag <= distance) {
        return true;
    }
    if (mag < pixelsPerFrame) {
        enemy.x = target.x;
        enemy.y = target.y;
    } else {
        enemy.x += pixelsPerFrame * dx / mag;
        enemy.y += pixelsPerFrame * dy / mag;
    }
    // Push the enemy away from any objects they get too close to.
    for (const object of enemy.zone.objects) {
        if (object === enemy) {
            continue;
        }
        // Boss cannot be blocked by hero/allies.
        if (enemy.isBoss && object.objectType === 'ally' || object.objectType === 'hero') {
            continue;
        }
        let minDistance = enemy.r + object.r - 6;
        if (minDistance <= 0) {
            continue;
        }
        //if (object.objectType === 'enemy') {
        //    minDistance = enemy.r + object.r - 10;
        //} else if (object.objectType === '')
        const dx = enemy.x - object.x, dy = enemy.y - object.y;
        if (!dx && !dy) {
            enemy.movementWasBlocked = true;
            continue;
        }
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag < minDistance) {
            enemy.movementWasBlocked = true;
            //console.log(mag, ' < ', minDistance);
            //console.log(enemy.x, enemy.y);
            enemy.x = object.x + dx * minDistance / mag;
            enemy.y = object.y + dy * minDistance / mag;
            //console.log('->', enemy.x, enemy.y);
        }
    }
    return false;
}

export function cleanupEnemy(this: Enemy, state: GameState) {
    for (const ability of this.abilities) {
        if (ability.abilityType === 'passiveEnemyAbility') {
            ability.definition.cleanup?.(state, this, ability);
        }
    }
    this.abilities = [];
}

export function renderEnemy(this: Enemy, context: CanvasRenderingContext2D, state: GameState) {
    // Render effects behind the enemy
    for (const effect of this.effects) {
        effect.renderUnder?.(context, state, this);
    }
    // Warnings should appear under the enemy but over effects, for clarity.
    if (this.activeAbility) {
        renderAbilityWarning(context, state, this, this.activeAbility);
    }
    // Render the enemy
    const definition = enemyDefinitions[this.enemyType];
    if (definition?.render) {
        definition.render(context, state, this);
    } else {
        fillCircle(context, this);
    }

    // Render effects over the enemy
    for (const effect of this.effects) {
        effect.renderOver?.(context, state, this);
    }

    // Render the enemy lifebar.
    renderLifeBarOverCircle(context, this, this.health, this.maxHealth);
}


function checkToAutocastAbility(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<any>) {
    const targetingInfo = ability.definition.getTargetingInfo(state, enemy, ability);
    // prioritize the current attack target over other targets.
    // TODO: prioritize the closest target out of other targets.
    for (const object of [enemy.attackTarget, ...enemy.zone.objects]) {
        if (!object) {
            continue;
        }
        // Skip this object if the ability doesn't target this type of object.
        if (!isEnemyAbilityTargetValid(state, targetingInfo, object)) {
            continue;
        }
        if (ability.definition.isTargetValid?.(state, enemy, ability, object) === false){
            continue;
        }
        // Use the ability on the target if it is in range.
        const dx = object.x - enemy.x, dy = object.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const range = targetingInfo.range;
        if (distance < object.r + range + (targetingInfo.hitRadius ?? 0)) {
            const target: FieldTarget = distance < range
                ? object
                : {objectType: 'point', zone: enemy.zone, x: enemy.x + dx * range / distance, y: enemy.y + dy * range / distance};
            prepareToUseEnemyAbilityOnTarget(state, enemy, ability, target);
            return;
        }
    }
}
