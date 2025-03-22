import {invulnerabilityEffect} from 'app/definitions/modifierEffects';
import {addHealEffectToTarget} from 'app/effects/healAnimation';

export const lootDefinitions: {[key in LootType]?: LootDefinition} = {};



lootDefinitions.potion = {
    name: 'Health Potion',
    color: 'red',
    r: 5,
    onPickup(state: GameState, hero: Hero) {
        hero.health = Math.min(hero.getMaxHealth(state), hero.health + 20);
        addHealEffectToTarget(state, hero);
    }
};


/*function applyInvulnerabilityEffect(this: SimpleEffect, state: GameState, hero: Hero|Ally) {
    hero.stats.incomingDamageMultiplier.multipliers.push(0);
    hero.stats.incomingDamageMultiplier.isDirty = true;
}
function removeInvulnerabilityEffect(this: SimpleEffect, state: GameState, hero: Hero|Ally) {
    const index = hero.stats.incomingDamageMultiplier.multipliers.indexOf(0);
    if (index >= 0) {
        hero.stats.incomingDamageMultiplier.multipliers.splice(index, 1);
    }
    hero.stats.incomingDamageMultiplier.isDirty = true;
}*/

lootDefinitions.invincibilityPotion = {
    name: 'Invincibility Potion',
    color: 'yellow',
    r: 5,
    onPickup(state: GameState, hero: Hero) {
        invulnerabilityEffect.apply(state, hero);
    }
};

