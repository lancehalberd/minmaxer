import {addHealEffectToTarget} from 'app/effects/healAnimation';
import {addProjectile} from 'app/effects/projectile';
import {frameLength} from 'app/gameConstants';
import {applyDamageOverTime, damageTarget, getAllyTargets, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';
import {fillCircle} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';

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
    onActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<EnemyTarget> , target: LocationTarget) {
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


const poisonCanvasFill = 'rgba(128, 255, 128, 0.5)';
interface PoisonEffectProps extends ZoneLocation {
    r: number
    duration: number
    damagePerSecond: number
    maxRadius: number
    targetsAllies?: boolean
    targetsEnemies?: boolean
    source: AttackTarget
}
class PoisonPoolEffect implements GenericEffect {
    objectType = <const>'effect';
    color = poisonCanvasFill;
    zone = this.props.zone;
    r = this.props.r;
    maxRadius = this.props.maxRadius;
    x = this.props.x;
    y = this.props.y;
    duration = this.props.duration;
    damagePerSecond = this.props.damagePerSecond;
    targetsAllies = this.props.targetsAllies;
    targetsEnemies = this.props.targetsEnemies;
    source = this.props.source;
    constructor(public props: PoisonEffectProps) {
        this.zone.effects.push(this);
    }
    update(state: GameState) {
        if (this.r < this.maxRadius) {
            this.r++;
        }
        this.duration -= frameLength;
        if (this.duration <= 0) {
            removeEffect(state, this);
        }
        if (this.targetsAllies) {
            const targets = getTargetsInCircle(state, getAllyTargets(state, this.zone), this);
            for (const target of targets) {
                applyDamageOverTime(state, target, this.damagePerSecond);
            }
        }
        if (this.targetsEnemies) {
            const targets = getTargetsInCircle(state, getEnemyTargets(state, this.zone), this);
            for (const target of targets) {
                applyDamageOverTime(state, target, this.damagePerSecond);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this)
    }
}

const poisionSpitProjectileRadius = 8;
export const poisonSpit: ActiveEnemyAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeEnemyAbility',
    name: 'Poison Spit',
    getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<AbilityTarget>) {
        // This skill is used immediately where the hero is standing when activated.
        return {
            canTargetEnemy: true,
            // This is the hit radius of the projectile, not the poison pool.
            // Prefer using this so that the enemy tends to deploy the pool so that its target is near
            // the center and not at the very edge.
            hitRadius: poisionSpitProjectileRadius,
            range: 100,
        };
    },
    cooldown: 5000,
    zoneCooldown: 1000,
    warningTime: 0,
    onActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<AbilityTarget>, target: LocationTarget) {
        const targetingInfo = this.getTargetingInfo(state, enemy, ability);
        const speed = 200;
        const dx = target.x - enemy.x, dy = target.y - enemy.y;
        const mag = Math.sqrt(dx*dx + dy*dy);
        addProjectile(state, {
            zone: enemy.zone,
            x: enemy.x + dx * enemy.r / mag,
            y: enemy.y + dy * enemy.r / mag,
            hitsEnemies: targetingInfo.canTargetEnemy,
            vx: dx * speed / mag,
            vy: dy * speed / mag,
            r: poisionSpitProjectileRadius,
            // Set the duration to expire either at the target location, or the maximum range.
            duration: 1000 * Math.min(mag, targetingInfo.range) / speed,
            piercing: true,
            // The projectile itself does regular enemy damage.
            // but it leaves a pool that deals damage over time.
            hit: {damage: enemy.damage, source: enemy},
            render: renderPoisonSpitProjectile,
            onExpire(this: Projectile, state: GameState) {
                // PoisonPoolEffect automatically adds itself to the zone in the constructor.
                new PoisonPoolEffect({
                    zone: this.zone,
                    x: this.x,
                    y: this.y,
                    r: this.r,
                    targetsAllies: true,
                    maxRadius: 40,
                    duration: 2000,
                    damagePerSecond: enemy.damage,
                    source: enemy,
                });
            }
        });
    },
};
function renderPoisonSpitProjectile(this: Projectile, context: CanvasRenderingContext2D, state: GameState) {
    fillCircle(context, {...this, color: poisonCanvasFill});
}
