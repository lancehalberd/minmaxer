import {damageTarget, getEnemyTargets, getTargetsInCircle, applyEffectToHero} from 'app/utils/combat';
import {addProjectile} from 'app/effects/projectile';


// Warrior skills
export const spinStrike: ActiveAbilityDefinition = {
    abilityType: 'activeAbility',
    name: 'Spin Strike',
    getTargetingInfo(state: GameState, hero: Hero, ability: Ability) {
        // This skill is used immediately where the hero is standing when activated.
        return {
            // The attack radius is 1.1/1.2/1.3/1.4/1.5x of the base radius.
            hitRadius: hero.r + [1.1, 1.2, 1.3, 1.4, 1.5][ability.level - 1] * hero.attackRange,
            range: 0,
        };
    },
    getCooldown(state: GameState, hero: Hero, ability: Ability) {
        return 5000;
    },
    onActivate(state: GameState, hero: Hero, ability: Ability) {
        const targetingInfo = this.getTargetingInfo(state, hero, ability);
        const hitCircle = {x: hero.x, y: hero.y, r: targetingInfo.hitRadius || 0};
        const targets = getTargetsInCircle(state, getEnemyTargets(state), hitCircle);
        // This attack does 25/35/45/55/65% increased base damage.
        const damage = [1.25, 1.35, 1.45, 1.55, 1.65][ability.level - 1] * hero.damage;
        for (const target of targets) {
            damageTarget(state, target, damage);
        }
    },
};

function getBattleRagerBonusValue(abilityLevel: number, stacks: number): number {
    // Attack speed increase by 5%/6%/7%/8%/10% per hit up to 30%/35/40/45/50 increased attack speed
    return Math.min([5, 6, 7, 8, 10][abilityLevel - 1] * stacks, [30, 35, 40, 45, 50][abilityLevel - 1]);
}
function applyBattleRagerEffect(this: AbilityEffect<Hero>, state: GameState, hero: Hero) {
    hero.attacksPerSecond.percentBonus += getBattleRagerBonusValue(this.abilityLevel, this.stacks);
    hero.attacksPerSecond.isDirty = true;
}
function removeBattleRagerEffect(this: AbilityEffect<Hero>, state: GameState, hero: Hero) {
    hero.attacksPerSecond.percentBonus -= getBattleRagerBonusValue(this.abilityLevel, this.stacks);
    hero.attacksPerSecond.isDirty = true;
}
export const battleRager: PassiveAbilityDefinition = {
    abilityType: 'passiveAbility',
    name: 'Battle Rager',
    onHitTarget(state: GameState, hero: Hero, target: AttackTarget, ability: Ability) {
        let effect = hero.effects.find(e => e.effectType === 'abilityEffect' && e.ability === ability);
        if (effect?.effectType === 'abilityEffect') {
            effect.remove(state, hero);
            effect.stacks!++;
            effect.abilityLevel = ability.level;
            effect.apply(state, hero);
            effect.duration = 2;
            return;
        }
        effect = {
            effectType: 'abilityEffect',
            ability,
            abilityLevel: ability.level,
            stacks: 1,
            duration: 2,
            apply: applyBattleRagerEffect,
            remove: removeBattleRagerEffect,
        }
        applyEffectToHero(state, effect, hero);
    },
};

// Ranger skills
function getPiercingShotRange(state: GameState, hero: Hero, ability: Ability): number {
    return [80, 90, 100, 110, 120][ability.level - 1];
}
const piercingShotRadius = 10;
export const piercingShot: ActiveAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeAbility',
    name: 'Piercing Shot',
    getTargetingInfo(state: GameState, hero: Hero, ability: Ability) {
        // This skill is used immediately where the hero is standing when activated.
        return {
            canTargetEnemy: true,
            canTargetLocation: true,
            projectileRadius: piercingShotRadius,
            // 80/90/100/110/120 range
            range: getPiercingShotRange(state, hero, ability),
        };
    },
    getCooldown(state: GameState, hero: Hero, ability: Ability) {
        return 8000;
    },
    onActivate(state: GameState, hero: Hero, ability: Ability, target: AbilityTarget) {
        // Create a piercing projectile.
        const speed = 200;
        const dx = target.x - hero.x, dy = target.y - hero.y;
        const mag = Math.sqrt(dx*dx + dy*dy);
        // This attack 1.5/1.7/1.9/2.1/2.3x base damage.
        const damage = [1.5, 1.7, 1.9, 2.1, 2.3][ability.level - 1] * hero.getDamageForTarget(state, target);
        const targetingInfo = this.getTargetingInfo(state, hero, ability);
        addProjectile(state, {
            x: hero.x + dx * hero.r / mag,
            y: hero.y + dy * hero.r / mag,
            hitsEnemies: targetingInfo.canTargetEnemy,
            vx: dx * speed / mag,
            vy: dy * speed / mag,
            r: piercingShotRadius,
            duration: 1000 * getPiercingShotRange(state, hero, ability) / speed,
            piercing: true,
            damage,
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
    modifyDamage(state: GameState, hero: Hero, target: AbilityTarget|undefined, ability: Ability, damage: number): number {
        // Nothing happens if the critical strike roll fails.
        if (Math.random() > getCriticalShotChance(ability.level) / 100) {
            return damage;
        }
        return (damage * getCriticalShotDamageMultiplier(ability.level)) | 0;
    },
};

// Mage skills
/*
Active: Fire ball
Area of Effect skill that does 40/45/50/55/60% increased damage over an area that is 1.4/1.55/1.70/1.85/2x base radius
Range is 80
Cooldown is 10s
Passive: Fortress
Prevents 50/55/60/65/70% incoming damage from the next 1/2/2/3/3 sources
Barrier refreshes to full after 3/3/3/4/4 seconds since last damage instance*/
