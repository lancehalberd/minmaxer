import {damageTarget, getTargetsInCircle, applyEffectToHero} from 'app/utils/combat';

/*eventually we will want to be able to choose when and where to use this and be able to turn off autocasting.
Melee

Range
Active: Piercing Shot
Piercing skill shot with 80/90/100/110/120 range that does 1.5/1.7/1.9/2.1/2.3
Cooldown is 8s
Passive: Critical Shot
20/21/22/23/25% chance to deal 1.5/1.6/1.7/1.8/2x damage
Magic
Active: Fire ball
Area of Effect skill that does 40/45/50/55/60% increased damage over an area that is 1.4/1.55/1.70/1.85/2x base radius
Range is 80
Cooldown is 10s
Passive: Fortress
Prevents 50/55/60/65/70% incoming damage from the next 1/2/2/3/3 sources
Barrier refreshes to full after 3/3/3/4/4 seconds since last damage instance*/



function getEnemyTargets(state: GameState) {
    const enemies: EnemyTarget[] = [];
    for (const object of state.world.objects) {
        if (object.objectType === 'enemy' || object.objectType === 'spawner') {
            enemies.push(object);
        }
    }
    return enemies;
}

export const spinStrike: ActiveAbilityDefinition = {
    type: 'activeAbility',
    name: 'Spin Strike',
    getTargetingInfo(state: GameState, hero: Hero, ability: Ability) {
        return {
            canTargetEnemy: true,
            canTargetLocation: true,
            // The attack radius is 1.1/1.2/1.3/1.4/1.5x of the base radius.
            hitRadius: [1.1, 1.2, 1.3, 1.4, 1.5][ability.level - 1] * hero.attackRange,
        };
    },
    getCooldown(state: GameState, hero: Hero, ability: Ability) {
        return 5;
    },
    onActivate(state: GameState, hero: Hero, ability: Ability) {
        const targetingInfo = this.getTargetingInfo(state, hero, ability);
        const hitCircle = {x: hero.x, y: hero.y, r: targetingInfo.hitRadius || 0};
        const targets = getTargetsInCircle(state, getEnemyTargets(state), hitCircle);
        // This attack does 25/35/45/55/65% increased base damage.
        const damage = [1.25, 1.35, 1.45, 1.55, 1.65][ability.level - 1] * hero.damage
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
    type: 'passiveAbility',
    name: 'Battle Rager',
    onHitTarget(state: GameState, hero: Hero, target: AttackTarget, ability: Ability) {
        let effect = hero.effects.find(e => e.effectType === 'abilityEffect' && e.ability === ability);
        if (effect) {
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
