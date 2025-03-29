import {stunEffect, StackingAllyEffectDefinition} from 'app/definitions/modifierEffects';
import {CircleEffect} from 'app/effects/circleEffect';
import {addHealEffectToTarget} from 'app/effects/healAnimation';
import {addProjectile, OrbitingProjectile} from 'app/effects/projectile';
import {canvas, frameLength} from 'app/gameConstants';
import {createEnemy, getEnemyDamageForTarget} from 'app/objects/enemy';
import {createCanvasAndContext, drawCanvas} from 'app/utils/canvas';
import {applyDamageOverTime, damageTarget, getAllyTargets, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';
import {fillCircle} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';

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
class EnemyAreaHitAbility implements ActiveEnemyAbilityDefinition<undefined> {
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
            piercing: true,
            // The projectile itself does regular enemy damage.
            // but it leaves a pool that deals damage over time.
            hit: {damage: getEnemyDamageForTarget(state, enemy, target), source: enemy},
            render: renderPoisonSpitProjectile,
            onExpire(this: Projectile, state: GameState) {
                // PoisonPoolEffect automatically adds itself to the zone in the constructor.
                new PoisonPoolEffect({
                    zone: this.zone,
                    x: this.x,
                    y: this.y,
                    r: this.r,
                    targetsAllies: true,
                    maxRadius: 30,
                    duration: 2000,
                    damagePerSecond: getEnemyDamageForTarget(state, enemy, target),
                    source: enemy,
                });
            }
        });
    },
};
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
        cooldown: props.cooldown ?? 8000,
        zoneCooldown: props.zoneCooldown ?? 1000,
        warningTime: 0,
        onActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<FieldTarget>, target: LocationTarget) {
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
                minion.defaultTarget = enemy.defaultTarget;
                minion.aggroPack = aggroPack;
                if (!target.zone) {
                    debugger;
                    return;
                }
                target.zone.objects.push(minion);
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

const stackingPetrificationEffect = new StackingAllyEffectDefinition({
    maxStacks: 8,
    duration: 4,
    getModifiers(state: GameState, effect: StackingEffect) {
        const slowAmount = Math.min(80, 10 * effect.stacks);
        return [{
            stat: 'speed',
            percentBonus: -slowAmount,
        }];
    },
    renderOver(context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) {
        fillCircle(context, {x: target.x, y: target.y, r: target.r + 2, color: 'rgba(255, 255, 255, 0.4)'});
    },
});
/**
 * Remove projectiles when the eneme is destroyed.
 *   Add enemy.cleanup which calls ability.cleanup/effect.cleanup, etc.
 */
export const petrifyingBarrier: PassiveEnemyAbilityDefinition = {
    abilityType: 'passiveEnemyAbility',
    name: 'Petrification Barrier',
    update(state: GameState, enemy: Enemy, ability: PassiveEnemyAbility) {
        if (!enemy.zone.effects.find(e => e.creator === ability)) {
            const projectileCount = 3;
            for (let i = 0; i < projectileCount; i++) {
                new OrbitingProjectile({
                    hitsAllies: true,
                    zone: enemy.zone,
                    target: enemy,
                    r: 6,
                    theta: 2 * Math.PI * i / projectileCount,
                    vTheta: Math.PI,
                    orbitRadius: 50,
                    hit: {
                        damage: Math.ceil(getEnemyDamageForTarget(state, enemy) / 2),
                        onHit(state: GameState, target: AttackTarget) {
                            if (target.objectType === 'hero' || target.objectType === 'ally') {
                                stackingPetrificationEffect.applyStacks(state, target, 1);
                            }
                        },
                    },
                    creator: ability,
                    render(this: OrbitingProjectile, context: CanvasRenderingContext2D, state: GameState) {
                        renderEyecon(context, {x: this.x, y: this.y, r: this.r, theta: 0});
                    }
                });
            }
        }
    },
    cleanup(state: GameState, enemy: Enemy, ability: PassiveEnemyAbility) {
        enemy.zone.effects = enemy.zone.effects.filter(e => e.creator !== ability);
    }
};

function renderEyecon(context: CanvasRenderingContext2D, circle: Circle) {
    context.save();
        context.translate(circle.x, circle.y);
        context.rotate(circle.theta ?? 0);
        context.strokeStyle = '#FFF';
        context.lineWidth = 0;
        // Outer circle, background and pupil
        fillCircle(context, {x: 0, y: 0, r: circle.r, color:'#888'});
        context.stroke();
        context.scale(1, 0.5);
        fillCircle(context, {x: 0, y: 0, r: circle.r, color:'#000'});
        context.scale(1, 2);
        fillCircle(context, {x: 0, y: 0, r: circle.r / 6, color:'#FFF'});
        context.stroke();
    context.restore();
}
function renderClosedEyecon(context: CanvasRenderingContext2D, circle: Circle) {
    context.save();
        context.translate(circle.x, circle.y);
        context.rotate(circle.theta ?? 0);
        context.strokeStyle = '#FFF';
        context.lineWidth = 0;
        // Outer circle, background and pupil
        fillCircle(context, {x: 0, y: 0, r: circle.r, color:'#888'});
        context.stroke();
        context.beginPath();
        context.moveTo(-circle.r, 0);
        context.lineTo(circle.r, 0);
        context.stroke();
    context.restore();
}


const [effectCanvas, effectContext] = createCanvasAndContext(canvas.width, canvas.height);

export const petrifyingGaze = new EnemyAreaHitAbility({
    name: 'Petrifying Gaze',
    r: 80,
    cooldown: 15000,
    initialCharges: 0,
    zoneCooldown: 1000,
    warningTime: 2000,
    renderWarning(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) {
        const targetingInfo = ability.definition.getTargetingInfo(state, enemy, ability);
        const p = ability.warningTime / ability.warningDuration;
        const r = targetingInfo.hitRadius ?? 0;
        effectContext.clearRect(0, 0, canvas.width, canvas.height);
        effectContext.save();
            effectContext.setTransform(context.getTransform());
            fillCircle(effectContext, {x: enemy.x, y: enemy.y, r, color:'rgba(0, 0, 0, 0.3'})
            fillCircle(effectContext, {x: enemy.x, y: enemy.y, r: p * r, color:'rgba(0, 0, 0, 0.6)'})
            effectContext.globalCompositeOperation = 'source-atop';
            renderClosedEyecon(effectContext, {x: enemy.x, y: enemy.y, r});
        effectContext.restore();
        const rect: Rect = {
            x: 0,
            y: 0,
            w: canvas.width,
            h: canvas.height,
        };
        context.save();
            context.resetTransform();
            drawCanvas(context, effectCanvas, rect, rect);
        context.restore();
    },
    afterActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) {
        const targetingInfo = ability.definition.getTargetingInfo(state, enemy, ability);
        new CircleEffect({
            zone: enemy.zone,
            duration: 60,
            fadeDuration: 800,
            x: enemy.x,
            y: enemy.y,
            r: targetingInfo.hitRadius ?? 0,
            render(context: CanvasRenderingContext2D, state: GameState, effect: CircleEffect) {
                renderEyecon(context, effect);
            },
        });
    },
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
