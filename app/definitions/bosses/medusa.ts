import {stunEffect, StackingAllyEffectDefinition} from 'app/definitions/modifierEffects';
import {CircleEffect} from 'app/effects/circleEffect';
import {OrbitingProjectile} from 'app/effects/projectile';
import {createSummonMinionAbility, EnemyAreaHitAbility} from 'app/definitions/enemyAbilities';
import {getBasicEnemyStatsForLevel} from 'app/definitions/enemyDefinitions';
import {enemyDefinitions} from 'app/definitions/enemyDefinitionsHash';
import {canvas} from 'app/gameConstants';
import {getEnemyDamageForTarget} from 'app/objects/enemy';
import {createActiveEnemyAbilityInstance, prepareToUseEnemyAbilityOnTarget} from 'app/utils/ability';
import {createAnimation, drawFrameInCircle} from 'app/utils/animations';
import {createCanvasAndContext, drawCanvas} from 'app/utils/canvas';
import {fillCircle} from 'app/utils/draw';
import {enemyLootPoolfFromKeys} from 'app/utils/lootPool'


const [stethnoFrame] = createAnimation('gfx/enemies/stethno.png', {w: 96, h: 96, content: {x: 12, y: 7, w: 76, h: 82}}, {cols: 1}).frames;

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

const summonSnakes = createSummonMinionAbility({
    name: 'Summon Snakes',
    enemyTypes: ['snake', 'snake', 'snake'],
    cooldown: 10000,
    zoneCooldown: 3000,
    color: 'rgba(0, 255, 0, 0.5)',
});
const summonCobras = createSummonMinionAbility({
    name: 'Summon Cobras',
    enemyTypes: ['cobra', 'cobra', 'cobra'],
    cooldown: 10000,
    zoneCooldown: 3000,
    color: 'rgba(0, 255, 0, 0.5)',
});
interface MedusaProps {
    cobrasSummoned: number
}
const medusa: EnemyDefinition<MedusaProps> = {
    name: 'Medusa',
    color: '#8F8',
    r: 20,
    initialProps: {
        cobrasSummoned: 0,
    },
    abilities: [summonSnakes, petrifyingBarrier, petrifyingGaze],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (80 * baseStats.maxHealth) | 0,
            damage: (0.8 * baseStats.damage) | 0,
            attacksPerSecond: 0.5 * baseStats.attacksPerSecond,
            attackRange: 10,
            movementSpeed: 6,
        };
    },
    afterUpdate(state: GameState, enemy: Enemy<MedusaProps>) {
        if (
            (enemy.props.cobrasSummoned === 0 && enemy.health <= 2 * enemy.getMaxHealth(state) / 3)
            || (enemy.props.cobrasSummoned === 1 && enemy.health <= 1 * enemy.getMaxHealth(state) / 3)
        ) {
            const cobraAbilityInstance = createActiveEnemyAbilityInstance(summonCobras);
            prepareToUseEnemyAbilityOnTarget(state, enemy, cobraAbilityInstance, enemy);
            enemy.props.cobrasSummoned++;
        }
    },
    lootChance: 3.5,
    getLootPool: enemyLootPoolfFromKeys([
        'largeScales', 'chippedEmerald',
        'hardScales', 'emeraldRing', 'emerald',
        'emeraldBracelet',
        'flawlessEmerald', 'emeraldNecklace',
    ], ['snakeFang', 'thirdEye']),
    isBoss: true,
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        drawFrameInCircle(context, enemy, stethnoFrame);
    },
};
enemyDefinitions.medusa = medusa;
