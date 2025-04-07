import {stunEffect} from 'app/definitions/modifierEffects';
import {CircleEffect} from 'app/effects/circleEffect';
import {addHealEffectToTarget} from 'app/effects/healAnimation';
import {AreaDamageOverTimeEffect} from 'app/effects/enemyAbilityEffects';
import {addProjectile} from 'app/effects/projectile';
import {createEnemy, getEnemyDamageForTarget} from 'app/objects/enemy';
import {damageTarget, getAllyTargets, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';
import {fillCircle} from 'app/utils/draw';

export const groupHeal: ActiveEnemyAbilityDefinition<EnemyTarget> = {
    abilityType: 'activeEnemyAbility',
    name: 'Heal',
    getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<EnemyTarget> ) {
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

interface BaseEnemyAbilityProps {
    name: string
    cooldown?: number
    zoneCooldown?: number
    warningTime?: number
    renderWarning?: (context: CanvasRenderingContext2D, state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) => void
    initialCharges?: number
    maxCharges?: number
}

interface EnemyAreaHitAbilityProps extends BaseEnemyAbilityProps{
    r: number
    damageMultiplier?: number
    afterActivate?: (state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) => void
    getHit?: (state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) => Partial<AttackHit>
}
export class EnemyAreaHitAbility implements ActiveEnemyAbilityDefinition<undefined> {
    abilityType = <const>'activeEnemyAbility';
    name = this.props.name;
    r = this.props.r;
    constructor(public props: EnemyAreaHitAbilityProps) {}
    getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) {
        return {
            canTargetEnemy: true,
            hitRadius: enemy.r + this.r,
            range: 0,
        };
    }
    cooldown = this.props.cooldown ?? 5000;
    zoneCooldown = this.props.zoneCooldown ?? 1000;
    warningTime = this.props.warningTime ?? 1500;
    getHit = this.props.getHit;
    afterActivate = this.props.afterActivate;
    renderWarning = this.props.renderWarning;
    initialCharges = this.props.initialCharges;
    maxCharges = this.props.maxCharges;
    damageMultiplier = this.props.damageMultiplier ?? 1;
    onActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) {
        const targetingInfo = this.getTargetingInfo(state, enemy, ability);
        const hitCircle = {x: enemy.x, y: enemy.y, r: targetingInfo.hitRadius || 0};
        const hit = {
            ...(this.getHit?.(state, enemy, ability)),
            source: enemy,
        }
        const targets = getTargetsInCircle(state, getAllyTargets(state, enemy.zone), hitCircle);
        for (const target of targets) {
            damageTarget(state, target, {
                ...hit,
                damage: this.damageMultiplier * getEnemyDamageForTarget(state, enemy, target),
            });
        }
        this.afterActivate?.(state, enemy, ability);
    }
};

export const stunningSlam = new EnemyAreaHitAbility({
    name: 'Stunning Slam',
    damageMultiplier: 2,
    r: 60,
    cooldown: 5000,
    zoneCooldown: 1000,
    warningTime: 1500,
    getHit(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) {
        return {
            onHit(state: GameState, target: AttackTarget) {
                if (target.objectType === 'hero' || target.objectType === 'ally') {
                    stunEffect.apply(state, target, 2);
                }
            },
        };
    }
});

/*export const slam: ActiveEnemyAbilityDefinition<undefined> = {
    abilityType: 'activeEnemyAbility',
    name: 'Slam',
    getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) {
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
};*/
interface EnemyProjectileAbilityProps extends Partial<ActiveEnemyAbilityDefinition<AbilityTarget>> {
    name: string
    getProjectile?: (state: GameState, enemy: Enemy<any>) => Partial<Projectile>
    speed?: number
}
export class EnemyProjectileAbility implements ActiveEnemyAbilityDefinition<AbilityTarget> {
    abilityType = <const>'activeEnemyAbility';
    name = this.props.name;
    getProjectile = this.props.getProjectile;
    cooldown = this.props.cooldown ?? 8000;
    zoneCooldown = this.props.zoneCooldown ?? 1000;
    warningTime = this.props.warningTime ?? 500;
    speed = this.props.speed ?? 200;
    constructor(public props: EnemyProjectileAbilityProps) {}
    getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<AbilityTarget>) {
        return {
            canTargetEnemy: true,
            // This is the hit radius of the projectile, not the poison pool.
            // Prefer using this so that the enemy tends to deploy the pool so that its target is near
            // the center and not at the very edge.
            hitRadius: this.getProjectile?.(state, enemy).r ?? 8,
            range: 100,
        };
    }
    onActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<AbilityTarget>, target: LocationTarget) {
        const targetingInfo = this.getTargetingInfo(state, enemy, ability);
        const dx = target.x - enemy.x, dy = target.y - enemy.y;
        const mag = Math.sqrt(dx*dx + dy*dy);
        const distanceToTarget = mag - enemy.r;
        addProjectile(state, {
            zone: enemy.zone,
            x: enemy.x + dx * enemy.r / mag,
            y: enemy.y + dy * enemy.r / mag,
            hitsAllies: true,
            vx: dx * this.speed / mag,
            vy: dy * this.speed / mag,
            r: 8,
            // Set the duration to expire either at the target location, or the maximum range.
            duration: 1000 * Math.min(distanceToTarget, targetingInfo.range) / this.speed,
            // The projectile itself does regular enemy damage.
            // but it leaves a pool that deals damage over time.
            hit: {damage: getEnemyDamageForTarget(state, enemy, target), source: enemy},
            ...this.getProjectile?.(state, enemy),
        });
    }
};


const poisonCanvasFill = 'rgba(128, 255, 128, 0.5)';
//const poisionSpitProjectileRadius = 8;
/*export const poisonSpit: ActiveEnemyAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeEnemyAbility',
    name: 'Poison Spit',
    getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<AbilityTarget>) {
        return {
            canTargetEnemy: true,
            // This is the hit radius of the projectile, not the poison pool.
            // Prefer using this so that the enemy tends to deploy the pool so that its target is near
            // the center and not at the very edge.
            hitRadius: poisionSpitProjectileRadius,
            range: 100,
        };
    },
    cooldown: 8000,
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
            hitsAllies: true,
            vx: dx * speed / mag,
            vy: dy * speed / mag,
            r: poisionSpitProjectileRadius,
            // Set the duration to expire either at the target location, or the maximum range.
            duration: 1000 * Math.min(mag, targetingInfo.range) / speed,

            // The projectile itself does regular enemy damage.
            // but it leaves a pool that deals damage over time.
            hit: {damage: getEnemyDamageForTarget(state, enemy, target), source: enemy},
        });
    },
};*/
export const poisonSpit = new EnemyProjectileAbility({
    name: 'Poison Spit',
    getProjectile: (state: GameState, enemy: Enemy) => ({
        r: 8,
        piercing: true,
        render: renderPoisonSpitProjectile,
        onExpire(this: Projectile, state: GameState) {
            // PoisonPoolEffect automatically adds itself to the zone in the constructor.
            new AreaDamageOverTimeEffect({
                zone: this.zone,
                color: poisonCanvasFill,
                x: this.x,
                y: this.y,
                r: this.r,
                targetsAllies: true,
                maxRadius: 30,
                duration: 2000,
                damagePerSecond: getEnemyDamageForTarget(state, enemy, undefined),
                source: enemy,
            });
        }
    }),
})
function renderPoisonSpitProjectile(this: Projectile, context: CanvasRenderingContext2D, state: GameState) {
    fillCircle(context, {...this, color: poisonCanvasFill});
}

const piercingShotRadius = 8;
export const piercingShot: ActiveEnemyAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeEnemyAbility',
    name: 'Piercing Shot',
    getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<AbilityTarget>) {
        return {
            canTargetEnemy: true,
            hitRadius: piercingShotRadius,
            range: 80,
        };
    },
    cooldown: 8000,
    zoneCooldown: 1000,
    warningTime: 500,
    onActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<AbilityTarget>, target: LocationTarget) {
        const targetingInfo = this.getTargetingInfo(state, enemy, ability);
        const speed = 200;
        const dx = target.x - enemy.x, dy = target.y - enemy.y;
        const mag = Math.sqrt(dx*dx + dy*dy);
        addProjectile(state, {
            zone: enemy.zone,
            x: enemy.x + dx * enemy.r / mag,
            y: enemy.y + dy * enemy.r / mag,
            hitsAllies: true,
            vx: dx * speed / mag,
            vy: dy * speed / mag,
            r: piercingShotRadius,
            // Set the duration to expire either at the target location, or the maximum range.
            duration: 1000 * Math.min(mag, targetingInfo.range) / speed,
            piercing: true,
            // The projectile itself does regular enemy damage.
            // but it leaves a pool that deals damage over time.
            hit: {damage: 1.5 * getEnemyDamageForTarget(state, enemy, target), source: enemy},
        });
    },
};

interface CreateSummonMinionAbilityProps{
    name: string
    enemyTypes: EnemyType[]
    cooldown?: number
    zoneCooldown?: number
    color?: CanvasFill
}
export function createSummonMinionAbility(props: CreateSummonMinionAbilityProps) {
    const ability: ActiveEnemyAbilityDefinition<FieldTarget> = {
        abilityType: 'activeEnemyAbility',
        name: props.name,
        getTargetingInfo(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<FieldTarget>) {
            return {
                canTargetAlly: true,
                hitRadius: 50,
                range: 100,
            };
        },
        isTargetValid(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<EnemyTarget> , target: AbilityTarget) {
            // Don't use the ability if all minions are already active.
            return enemy.zone.objects.filter(e => e.objectType === 'enemy' && e.creator === ability).length !== props.enemyTypes.length;
        },
        cooldown: props.cooldown ?? 8000,
        zoneCooldown: props.zoneCooldown ?? 1000,
        warningTime: 0,
        onActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<FieldTarget>, target: LocationTarget) {
            // Remove existing summons.
            enemy.zone.objects = enemy.zone.objects.filter(e => e.objectType !== 'enemy' || e.creator !== ability);
            const targetingInfo = this.getTargetingInfo(state, enemy, ability);
            const spawnCircle = {
                x: target.x,
                y: target.y,
                r: Math.max(enemy.r + 10, targetingInfo.hitRadius || 0),
            };
            const dx = (target.x - enemy.x), dy = (target.y - enemy.y);
            const baseTheta = Math.atan2(dy, dx) + Math.PI / 2;
            const count = props.enemyTypes.length;
            const aggroPack: Enemy[] = [];
            for (let i = 0; i < count; i++) {
                const enemyType = props.enemyTypes[i];
                const theta = baseTheta + 2 * Math.PI * i / count;
                const minion = createEnemy(enemyType, enemy.level, {
                    zone: target.zone,
                    x: count > 1 ? spawnCircle.x + Math.cos(theta) * (spawnCircle.r - 5) : spawnCircle.x,
                    y: count > 1 ? spawnCircle.y + Math.sin(theta) * (spawnCircle.r - 5) : spawnCircle.y,
                });
                // TODO: prevent enemy from spawning in invalid positions.
                aggroPack.push(minion);
                minion.creator = ability;
                minion.defaultTarget = enemy.defaultTarget;
                minion.aggroPack = aggroPack;
                if (!target.zone) {
                    debugger;
                    return;
                }
                new CircleEffect({
                    zone: target.zone,
                    duration: 200,
                    x: minion.x,
                    y: minion.y,
                    r: minion.r + 3,
                    color: props.color ?? 'rgba(128,128,128,0.3)',
                });
            }
        },
    };
    return ability;
}

