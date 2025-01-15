import {applyEffectToHero} from 'app/utils/combat';

export const lootDefinitions: {[key in LootType]?: LootDefinition} = {};



lootDefinitions.potion = {
    name: 'Health Potion',
    color: 'red',
    r: 5,
    onPickup(state: GameState, hero: Hero) {
        hero.health = Math.min(hero.maxHealth, hero.health + 20);
    }
};


function applyInvulnerabilityEffect(this: SimpleEffect<Hero>, state: GameState, hero: Hero) {
    hero.incomingDamageMultiplier.multipliers.push(0);
    hero.incomingDamageMultiplier.isDirty = true;
}
function removeInvulnerabilityEffect(this: SimpleEffect<Hero>, state: GameState, hero: Hero) {
    const index = hero.incomingDamageMultiplier.multipliers.indexOf(0);
    if (index >= 0) {
        hero.incomingDamageMultiplier.multipliers.splice(index, 1);
    }
    hero.incomingDamageMultiplier.isDirty = true;
}

lootDefinitions.invincibilityPotion = {
    name: 'Invincibility Potion',
    color: 'yellow',
    r: 5,
    onPickup(state: GameState, hero: Hero) {
        const invincibilityEffect: SimpleEffect<Hero> = {
            effectType: 'simpleEffect',
            duration: 10,
            apply: applyInvulnerabilityEffect,
            remove: removeInvulnerabilityEffect,
        };
        applyEffectToHero(state, invincibilityEffect, hero);
    }
};

