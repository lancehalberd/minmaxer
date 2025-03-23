import {addTextEffect} from 'app/effects/textEffect';
import {getItemLabel} from 'app/utils/inventory';


// This is set to 100 so that increases of 1% effect the chance of dropping the item.
// 10 * 50 * 20 = 10,000, so by default there is roughly a 1 in  10,000 chance of dropping a legendary item.
// By level 100, legendary weight increases to 200 and common weight is reduced to 800,000
// so the chance increase to roughly 1 in 4,000.
const legendaryWeight = 100;
const rareWeight = 10 * legendaryWeight;
const uncommonWeight = 50 * rareWeight;
const commonWeight = 20 * uncommonWeight;

export function standardEnemyLootPool(
    commonItems: InventoryKey[],
    uncommonItems: InventoryKey[],
    rareItems: InventoryKey[] = [],
    legendaryItems: InventoryKey[] = []
): LootPoolGenerator {
    return (state: GameState, enemy: Enemy) => {
        return generateLootPool(commonItems, uncommonItems, rareItems, legendaryItems, enemy.level);
    }
}

export function generateLootPool(
    commonItems: InventoryKey[],
    uncommonItems: InventoryKey[],
    rareItems: InventoryKey[] = [],
    legendaryItems: InventoryKey[] = [],
    bonusValue = 0
) {
    const weightedDrops: WeightedDrop[] = [];

    if (commonItems.length) {
        // Common items are 20% less likely by level 100.
        const weightAdjustment = 1 - 0.2 * bonusValue / 100;
        weightedDrops.push({keys: commonItems, weight: Math.floor(commonWeight * weightAdjustment)});
    }
    if (uncommonItems.length) {
        const weightAdjustment = 1 + 9 * bonusValue / 100;
        weightedDrops.push({keys: uncommonItems, weight: Math.floor(uncommonWeight * weightAdjustment)});
    }
    if (rareItems.length) {
        const weightAdjustment = 1 + 4 * bonusValue / 100;
        weightedDrops.push({keys: rareItems, weight: Math.floor(rareWeight * weightAdjustment)});
    }
    if (legendaryItems.length) {
        const weightAdjustment = 1 + bonusValue / 100;
        weightedDrops.push({keys: legendaryItems, weight: Math.floor(legendaryWeight * weightAdjustment)});
    }

    return weightedDrops;
}

export function rollLoot(weightedDrops: WeightedDrop[]): InventoryKey {
    let total = weightedDrops.map(d => d.weight).reduce((sum, weight) => sum + weight, 0);
    let roll = Math.floor(Math.random() * total);
    for (const drop of weightedDrops) {
        roll -= drop.weight;
        if (roll < 0) {
            return drop.keys[Math.floor(Math.random() * drop.keys.length)];
        }
    }
    console.error('Returning default drop');
    return 'wood';
}

export function gainLoot(state: GameState, itemKey: InventoryKey, target: FieldTarget) {
    const existingItemEffect = target.zone.effects.find(effect => effect.creator === 'lootText');
    // If there is existing loot text don't show more unless this is an item the player doesn't have a lot of.
    state.inventory[itemKey] = (state.inventory[itemKey] ?? 0) + 1;
    state.discoveredItems.add(itemKey);
    if (!existingItemEffect || (state.inventory[itemKey] ?? 0) < 5){
        addTextEffect(state, {target, text: getItemLabel(itemKey), delay: existingItemEffect ? 400 : 0, creator: 'lootText', duration: 1000});
    }
}
