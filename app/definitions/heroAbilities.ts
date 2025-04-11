import {StackingAllyEffectDefinition} from 'app/definitions/modifierEffects';
import {addProjectile} from 'app/effects/projectile';
import {applyEffectToTarget, removeEffectFromTarget} from 'app/utils/ability';
import {damageTarget, getAllyTargets, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';
import {fillCircle} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';
// import {getDistance} from 'app/utils/geometry';


// Warrior skills
export const spinStrike: ActiveAbilityDefinition = {
    abilityType: 'activeAbility',
    name: 'Spin Strike',
    getTargetingInfo(state: GameState, ally: Hero|Ally, ability: ActiveAbility) {
        // This skill is used immediately where the ally is standing when activated.
        return {
            hitRadius: ally.r + [1.4, 1.5, 1.6, 1.8, 2][ability.level - 1] * ally.getAttackRange(state),
            range: 0,
        };
    },
    getCooldown(state: GameState, ally: Hero|Ally, ability: ActiveAbility) {
        return 5000;
    },
    onActivate(state: GameState, ally: Hero|Ally, ability: ActiveAbility) {
        const targetingInfo = this.getTargetingInfo(state, ally, ability);
        const hitCircle = {x: ally.x, y: ally.y, r: targetingInfo.hitRadius || 0};
        const targets = getTargetsInCircle(state, getEnemyTargets(state, ally.zone), hitCircle);
        // console.log(hitCircle);
        // console.log(targets.length, 'vs ', getEnemyTargets(state, ally.zone).map(t => ({x: t.x, y: t.y, r: t.r, d: getDistance(t, hitCircle)})));
        // This attack does 25/35/45/55/65% increased base damage.
        let damage = [1.25, 1.35, 1.45, 1.55, 1.65][ability.level - 1] * ally.getDamage(state);
        // TODO: this should apply extra hit, crit chance + strength damage bonus.
        damage = damage | 0;
        for (const target of targets) {
            damageTarget(state, target, {damage, source: ally});
        }
    },
};



function getBattleRagerBonusValue(stacks: number, abilityLevel = 1): number {
    // Attack speed increase by 5%/6%/7%/8%/10% per hit up to 30%/35/40/45/50 increased attack speed
    return Math.min([5, 6, 7, 8, 10][abilityLevel - 1] * stacks, [30, 35, 40, 45, 50][abilityLevel - 1]);
}
const battleRagerStackingEffect = new StackingAllyEffectDefinition({
    duration: 2,
    getModifiers(state: GameState, effect: StackingEffect) {
        return [{
            stat: 'attacksPerSecond',
            percentBonus: getBattleRagerBonusValue(effect.stacks, effect.abilityLevel),
        }];
    },
});
export const battleRager: PassiveAbilityDefinition = {
    abilityType: 'passiveAbility',
    name: 'Battle Rager',
    onHitTarget(state: GameState, ally: Hero|Ally, ability: PassiveAbility, target: AttackTarget) {
        battleRagerStackingEffect.applyStacks(state, ally, 1, ability.level);
        /*let effect = ally.effects.find(e => e.effectType === 'abilityEffect' && e.creator === ability);
        if (effect?.effectType === 'abilityEffect') {
            effect.remove(state, ally);
            effect.stacks!++;
            effect.abilityLevel = ability.level;
            effect.apply(state, ally);
            effect.duration = 2;
            return;
        }
        effect = {
            effectType: 'abilityEffect',
            creator: ability,
            abilityLevel: ability.level,
            stacks: 1,
            duration: 2,
            apply: applyBattleRagerEffect,
            remove: removeBattleRagerEffect,
        }
        applyEffectToTarget(state, effect, ally);*/
    },
};



// Ranger skills
function getPiercingShotRange(state: GameState, ally: Hero|Ally, ability: ActiveAbility): number {
    return [80, 90, 100, 110, 120][ability.level - 1];
}
const piercingShotRadius = 10;
export const piercingShot: ActiveAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeAbility',
    name: 'Piercing Shot',
    getTargetingInfo(state: GameState, ally: Hero|Ally, ability: ActiveAbility) {
        // This skill is used immediately where the ally is standing when activated.
        return {
            canTargetEnemy: true,
            canTargetLocation: true,
            projectileRadius: piercingShotRadius,
            // 80/90/100/110/120 range
            range: getPiercingShotRange(state, ally, ability),
        };
    },
    getCooldown(state: GameState, ally: Hero|Ally, ability: ActiveAbility) {
        return 8000;
    },
    onActivate(state: GameState, ally: Hero|Ally, ability: ActiveAbility, target: AbilityTarget) {
        // Create a piercing projectile.
        const speed = 200;
        const dx = target.x - ally.x, dy = target.y - ally.y;
        const mag = Math.sqrt(dx*dx + dy*dy);
        // This attack 1.5/1.7/1.9/2.1/2.3x base damage.
        const damage = ([1.5, 1.7, 1.9, 2.1, 2.3][ability.level - 1] * ally.getDamageForTarget(state, target)) | 0;
        // TODO: this should apply extra hit, crit chance + strength damage bonus.
        const targetingInfo = this.getTargetingInfo(state, ally, ability);
        addProjectile(state, {
            zone: ally.zone,
            x: ally.x + dx * ally.r / mag,
            y: ally.y + dy * ally.r / mag,
            hitsEnemies: targetingInfo.canTargetEnemy,
            vx: dx * speed / mag,
            vy: dy * speed / mag,
            r: piercingShotRadius,
            duration: 1000 * getPiercingShotRange(state, ally, ability) / speed,
            piercing: true,
            hit: {damage, source: ally},
        });
    },
};

function getCriticalShotChance(abilityLevel: number): number {
    // 20/21/22/23/25% chance
    return [20, 21, 22, 23, 25][abilityLevel - 1];
}
function getCriticalShotDamageMultiplier(abilityLevel: number): number {
    // Deals 1.5/1.6/1.7/1.8/2x damage
    return [1.5, 1.6, 1.7, 1.8, 2][abilityLevel - 1];
}
export const criticalShot: PassiveAbilityDefinition = {
    abilityType: 'passiveAbility',
    name: 'Critical Shot',
    modifyDamage(state: GameState, ally: Hero|Ally, ability: Ability, target: AbilityTarget|undefined, damage: number): number {
        // Nothing happens if the critical strike roll fails.
        if (Math.random() > getCriticalShotChance(ability.level) / 100) {
            return damage;
        }
        return (damage * getCriticalShotDamageMultiplier(ability.level)) | 0;
    },
};

// Mage skills
const explosionFill = 'rgba(255, 0, 0, 0.5)';
interface ExplosionEffectProps extends ZoneLocation {
    r: number
    damage: number
    targetsAllies?: boolean
    targetsEnemies?: boolean
    source: AttackTarget
}
class ExplosionEffect implements GenericEffect {
    objectType = <const>'effect';
    color = explosionFill;
    zone = this.props.zone;
    r = this.props.r;
    x = this.props.x;
    y = this.props.y;
    damage = this.props.damage;
    targetsAllies = this.props.targetsAllies;
    targetsEnemies = this.props.targetsEnemies;
    source = this.props.source;
    constructor(public props: ExplosionEffectProps) {
        this.zone.effects.push(this);
    }
    update(state: GameState) {
        if (this.targetsAllies) {
            const targets = getTargetsInCircle(state, getAllyTargets(state, this.zone), this);
            for (const target of targets) {
                damageTarget(state, target, this);
            }
        }
        if (this.targetsEnemies) {
            const targets = getTargetsInCircle(state, getEnemyTargets(state, this.zone), this);
            for (const target of targets) {
                damageTarget(state, target, this);
            }
        }
        removeEffect(state, this);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this)
    }
}

const fireballProjectileRadius = 5;
export const fireball: ActiveAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeAbility',
    name: 'Fireball',
    getTargetingInfo(state: GameState, ally: Hero|Ally, ability: ActiveAbility) {
        // This skill is used immediately where the ally is standing when activated.
        return {
            canTargetEnemy: true,
            canTargetLocation: true,
            projectileRadius: fireballProjectileRadius,
            range: 110,
        };
    },
    getCooldown(state: GameState, ally: Hero|Ally, ability: ActiveAbility) {
        return 10000;
    },
    onActivate(state: GameState, ally: Hero|Ally, ability: ActiveAbility, target: AbilityTarget) {
        // Create a piercing projectile.
        const speed = 200;
        const dx = target.x - ally.x, dy = target.y - ally.y;
        const mag = Math.sqrt(dx*dx + dy*dy);
        const damage = ([1.4, 1.45, 1.5, 1.55, 1.6][ability.level - 1] * ally.getDamageForTarget(state, target)) | 0;
        const explosionRadius = ([1.4, 1.55, 1.70, 1.85, 2][ability.level - 1] * 20) | 0;
        // TODO: this should apply extra hit, crit chance + strength damage bonus.
        const targetingInfo = this.getTargetingInfo(state, ally, ability);
        addProjectile(state, {
            zone: ally.zone,
            x: ally.x + dx * ally.r / mag,
            y: ally.y + dy * ally.r / mag,
            hitsEnemies: targetingInfo.canTargetEnemy,
            vx: dx * speed / mag,
            vy: dy * speed / mag,
            r: fireballProjectileRadius,
            duration: 1000 * getPiercingShotRange(state, ally, ability) / speed,
            hit: {damage, source: ally},
            render: renderFireballProjectile,
            onExpire(this: Projectile, state: GameState) {
                // PoisonPoolEffect automatically adds itself to the zone in the constructor.
                new ExplosionEffect({
                    zone: this.zone,
                    x: this.x,
                    y: this.y,
                    r: explosionRadius,
                    targetsEnemies: true,
                    damage,
                    source: ally,
                });
            }
        });
    },
};
function renderFireballProjectile(this: Projectile, context: CanvasRenderingContext2D, state: GameState) {
    fillCircle(context, {...this, color: explosionFill});
}


function getFortressDamageReduction(abilityLevel: number): number {
    return [0.5, .45, .4, .35, .3][abilityLevel - 1]
}
function applyFortressEffect(this: AbilityEffect, state: GameState, target: ModifiableTarget) {
    target.addStatModifiers([{
        stat: 'incomingDamageMultiplier',
        multiplier: getFortressDamageReduction(this.abilityLevel),
    }]);
}
function removeFortressffect(this: AbilityEffect, state: GameState, target: ModifiableTarget) {
    target.removeStatModifiers([{
        stat: 'incomingDamageMultiplier',
        multiplier: getFortressDamageReduction(this.abilityLevel),
    }]);
}
export const fortress: PassiveAbilityDefinition = {
    abilityType: 'passiveAbility',
    name: 'Fortress',
    renderUnder(context: CanvasRenderingContext2D, state: GameState, ally: Hero|Ally, ability: PassiveAbility) {
        const effect = ally.effects.find(e => e.effectType === 'abilityEffect' && e.creator === ability);
        if (effect?.effectType === 'abilityEffect') {
            context.lineWidth = 1;
            context.strokeStyle = 'rgba(255, 0, 128, 0.6)';
            for (let i = 0; i < effect.stacks; i++) {
                fillCircle(context, {x: ally.x, y: ally.y, r: ally.r + 2 * (1+ i)});
                context.stroke();
            }
        }
    },
    update(state: GameState, ally: Hero|Ally, ability: PassiveAbility) {
        const maxStacks = [1, 2, 2, 3, 3][ability.level - 1];
        let effect = ally.effects.find(e => e.effectType === 'abilityEffect' && e.creator === ability);
        // Remove the effect from the ally when the ability level changes in order to update the buff to the new value.
        if (effect?.effectType === 'abilityEffect' && effect.abilityLevel !== ability.level) {
            removeEffectFromTarget(state, effect, ally);
        }
        if (effect?.effectType !== 'abilityEffect' || effect.stacks < maxStacks) {
            const recoveryDuration = 1000 * [3, 3, 3, 4, 4][ability.level - 1];
            const timeSinceDamageTaken = ally.zone.time - (ally.lastTimeDamageTaken || 0);
            if (timeSinceDamageTaken >= recoveryDuration) {
                if (effect?.effectType === 'abilityEffect') {
                    effect.stacks = maxStacks
                } else {
                    const newEffect: ObjectEffect = {
                        effectType: 'abilityEffect',
                        creator: ability,
                        abilityLevel: ability.level,
                        stacks: maxStacks,
                        apply: applyFortressEffect,
                        remove: removeFortressffect,
                    };
                    applyEffectToTarget(state, newEffect, ally);
                }
            }
        }
    },
    onHit(state: GameState, ally: Hero|Ally, ability: PassiveAbility, source: AttackTarget) {
        let effect = ally.effects.find(e => e.effectType === 'abilityEffect' && e.creator === ability);
        if (effect?.effectType === 'abilityEffect') {
            effect.stacks--;
            if (effect.stacks <= 0) {
                removeEffectFromTarget(state, effect, ally);
            }
        }
    },
};
