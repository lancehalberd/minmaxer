export const lootDefinitions: {[key in LootType]?: LootDefinition} = {};



lootDefinitions.potion = {
    name: 'Potion',
    color: 'red',
    r: 5,
    onPickup(state: GameState, hero: Hero) {
        hero.health = Math.min(hero.maxHealth, hero.health + 20);
    }
};
