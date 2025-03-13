import {enemyDefinitions} from 'app/definitions/enemyDefinitions';
import {frameLength, framesPerSecond} from 'app/gameConstants';
import {damageTarget, isEnemyAbilityTargetValid, isTargetAvailable} from 'app/utils/combat';
import {computeValue} from 'app/utils/computed';
import {fillCircle, renderLifeBarOverCircle} from 'app/utils/draw';
import {getDistance} from 'app/utils/geometry';

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
        aggroRadius: definition.aggroRadius,
        health: derivedStats.maxHealth,
        getMaxHealth(state: GameState) {
            return derivedStats.maxHealth;
        },
        abilities: (definition.abilities ?? []).map((abilityDefinition): EnemyAbility => {
            if (abilityDefinition.abilityType === 'activeEnemyAbility') {
                const activeAbility: ActiveEnemyAbility<any> = {
                    abilityType: <const>'activeEnemyAbility',
                    definition: abilityDefinition,
                    cooldown: 0,
                    warningTime: 0,
                    warningDuration: 0,
                };
                return activeAbility;
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
        update: updateEnemy,
        render: renderEnemy,
        onHit: onHitEnemy,
    };
    return enemy;
}

function onHitEnemy(this: Enemy, state: GameState, attacker: Hero) {
    // Bosses ignore attacks from heroes.
    if (this.isBoss) {
        return;
    }
    // Heroes will prioritize attacking a hero over other targets.
    if (this.attackTarget?.objectType !== 'hero') {
        this.attackTarget = attacker;
    }
}

export function updateEnemy(this: Enemy, state: GameState) {
    if (this.activeAbility?.target) {
        this.activeAbility.warningTime += frameLength;
        if (this.activeAbility.warningTime > this.activeAbility.warningDuration) {
            this.activeAbility.definition.onActivate(state, this, this.activeAbility, this.activeAbility.target);
            this.activeAbility.cooldown = computeValue(state, this.activeAbility, this.activeAbility.definition.cooldown, 5000);
            delete this.activeAbility;
        }
        return;
    }
    // Remove the current attack target if it is becomes invalid (it dies, for example).
    if (this.attackTarget && !isTargetAvailable(state, this.attackTarget)) {
        delete this.attackTarget;
    }
    if (this.isBoss) {
        this.attackTarget = state.nexus;
    }
    // Check to choose a new attack target.
    if (!this.attackTarget) {
        // Choose the closest valid target within the aggro radius as an attack target.
        let closestDistance = this.aggroRadius;
        for (const object of this.zone.objects) {
            if (object.objectType !== 'hero' && object.objectType !== 'nexus') {
                continue;
            }
            const distance = getDistance(this, object);
            if (distance < closestDistance) {
                this.attackTarget = object;
                closestDistance = distance;
            }
        }
    }
    // Update ability cooldown and autocast any abilities that make sense.
    for (const ability of this.abilities) {
        if (ability.abilityType === 'activeEnemyAbility') {
            if (ability.cooldown > 0) {
                ability.cooldown -= frameLength;
            } else if ((this.zone.zoneEnemyCooldowns.get(ability.definition) ?? 0) <= 0) {
                checkToAutocastAbility(state, this, ability);
            }
        }
    }
    if (this.activeAbility) {
        return;
    }
    // If the enemy has nothing else to do, move towards its default target.
    if (!this.attackTarget && !this.movementTarget) {
        this.movementTarget = this.defaultTarget;
    }
    if (this.attackTarget) {
        const pixelsPerFrame = this.movementSpeed / framesPerSecond;
        // Move this until it reaches the target.
        const dx = this.attackTarget.x - this.x, dy = this.attackTarget.y - this.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        // Attack the target when it is in range.
        if (mag <= this.r + this.attackTarget.r + this.attackRange) {
            // Attack the target if the enemy's attack is not on cooldown.
            const attackCooldown = 1000 / this.attacksPerSecond;
            if (!this.lastAttackTime || this.lastAttackTime + attackCooldown <= this.zone.time) {
                damageTarget(state, this.attackTarget, {damage: this.damage, source: this});
                this.attackTarget.onHit?.(state, this);
                this.lastAttackTime = this.zone.time;
            }
            return;
        }
        if (mag < pixelsPerFrame) {
            this.x = this.attackTarget.x;
            this.y = this.attackTarget.y;
        } else {
            this.x += pixelsPerFrame * dx / mag;
            this.y += pixelsPerFrame * dy / mag;
        }
        return;
    }
    if (!this.attackTarget && this.movementTarget) {
        // Move enemy until it reaches the target.
        const pixelsPerFrame = this.movementSpeed / framesPerSecond;
        const dx = this.movementTarget.x - this.x, dy = this.movementTarget.y - this.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag < pixelsPerFrame) {
            this.x = this.movementTarget.x;
            this.y = this.movementTarget.y;
        } else {
            this.x += pixelsPerFrame * dx / mag;
            this.y += pixelsPerFrame * dy / mag;
        }

        // Remove the target once they reach their destination.
        if (this.x === this.movementTarget.x && this.y === this.movementTarget.y) {
            delete this.movementTarget;
        }
    }
}

export function renderEnemy(this: Enemy, context: CanvasRenderingContext2D, state: GameState) {
    if (this.activeAbility) {
        renderAbilityWarning(context, state, this, this.activeAbility);
    }
    const definition = enemyDefinitions[this.enemyType];
    if (definition?.render) {
        definition.render(context, state, this);
    } else {
        fillCircle(context, this);
    }
    renderLifeBarOverCircle(context, this, this.health, this.maxHealth);
}


function prepareToUseAbilityOnTarget<T extends FieldTarget|undefined>(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<T>, target: T) {
    enemy.activeAbility = ability;
    ability.warningTime = 0;
    ability.warningDuration = computeValue(state, ability, ability.definition.warningTime, 0);
    if (target) {
        ability.target = {objectType: 'point', zone: target.zone, x: target.x, y: target.y, r: 0};
    } else {
        ability.target = {objectType: 'point', zone: enemy.zone, x: enemy.x, y: enemy.y, r: 0};
    }
    if (ability.definition.zoneCooldown) {
        enemy.zone.zoneEnemyCooldowns.set(ability.definition, ability.definition.zoneCooldown);
    }
}

function renderAbilityWarning(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<any>) {
    if (!ability.target) {
        return;
    }
    if (ability.definition.renderWarning) {
        return ability.definition.renderWarning(context, state, enemy, ability, ability.target);
    }
    const p = ability.warningTime / ability.warningDuration;
    defaultRenderWarning(context, state, p, enemy, ability.definition.getTargetingInfo(state, enemy, ability), ability.target);
}

function defaultRenderWarning(context: CanvasRenderingContext2D, state: GameState, p: number, enemy: Enemy, targetingInfo: AbilityTargetingInfo, target: ZoneLocation) {
    // Don't show warnings for enemy skills that target their allies.
    if (targetingInfo.canTargetAlly) {
        return;
    }
    if (targetingInfo.hitRadius) {
        // Attacks can hit units barely inside their range, so we increase the range of the warning to make
        // it more obvious that a player might be in range when they are on the very edge of the range.
        const drawnRadius = 10 + targetingInfo.hitRadius;
        // const center: Point = targetingInfo.range > 0 ? {} : {x: enemy.x, y: enemy.y};
        fillCircle(context, {x: target.x, y: target.y, r: drawnRadius});
        context.lineWidth = 2;
        context.strokeStyle = '#F00';
        context.stroke();
        fillCircle(context, {x: target.x, y: target.y, r: p * drawnRadius, color: 'rgba(255, 0, 0, 0.4)'});
    }
    if (targetingInfo.projectileRadius) {
        /*context.strokeStyle = 'rgba(0, 0, 255, 0.5)';
        context.lineWidth = 2 * targetingInfo.projectileRadius;
        const dx = target.x - state.selectedHero.x, dy = target.y - state.selectedHero.y;
        const mag = Math.sqrt(dx*dx + dy*dy);
        context.beginPath();
        context.moveTo(state.selectedHero.x, state.selectedHero.y);
        context.lineTo(
            state.selectedHero.x + targetingInfo.range * dx / mag,
            state.selectedHero.y + targetingInfo.range * dy / mag
        );*/
    }
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
            const target = distance < range
                ? object
                : {x: enemy.x + dx * range / distance, y: enemy.y + dy * range / distance};
            prepareToUseAbilityOnTarget(state, enemy, ability, target);
            return;
        }
    }
}
