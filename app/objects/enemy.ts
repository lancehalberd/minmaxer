import {enemyDefinitions} from 'app/definitions/enemyDefinitions';
import {framesPerSecond} from 'app/gameConstants';
import {damageTarget, isTargetAvailable} from 'app/utils/combat';
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
    const definition = enemyDefinitions[this.enemyType];
    if (definition?.render) {
        definition.render(context, state, this);
    } else {
        fillCircle(context, this);
    }
    renderLifeBarOverCircle(context, this, this.health, this.maxHealth);
}
