import {requireItem} from 'app/definitions/itemDefinitions';
import {addTextEffect} from 'app/effects/textEffect';
import {getItemLabel, getRarityColor} from 'app/utils/inventory'

// Drop chances are scaled to reach their high frequency rates by this level.
// This constant should be increased as it becomes easier to reach higher levels in the game.
const currentLevelCap = 20;

export function enemyLootPoolfFromKeys(
    normalKeys: InventoryKey[],
    priorityKeys: InventoryKey[] = [],
): LootPoolGenerator {
    return (state: GameState, enemy: Enemy) => {
        return generatePoolFromKeys(state, 1, normalKeys, priorityKeys, enemy.level);
    }
}


const totalPoolWeight = 1e9;
// Rarity chance is basically 1 / ( 10 ** itemRarity) with certain factors making items more common like level of enemy.
/*export function generatePoolFromKeys(
    state: GameState,
    // This multiplier will be applied to all drop chances.
    // This is intended to be set to 0.1 for resource collection points that can be farmed very rapidly.
    multiplier: number,
    // These items will use standard weights.
    normalKeys: InventoryKey[],
    // These items will be more likely to drop than usual from this item pool.
    priorityKeys: InventoryKey[] = [],
    bonusValue = 0
): WeightedDrop[] {
    bonusValue += (state.prestige.lootRarityBonus ?? 0);
    const totalMultiplier = multiplier * (1 + bonusValue / currentLevelCap);
    const weightedDrops: WeightedDrop[] = [];
    const normalCommonKeys: InventoryKey[] = [];
    const priorityCommonKeys: InventoryKey[] = [];
    const uncommonKeys: InventoryKey[] = [];
    let remainingWeight = totalPoolWeight;
    for (const key of priorityKeys) {
        const item = requireItem(key);
        if (item.rarity < 1) {
            priorityCommonKeys.push(key);
            continue;
        }
        if (item.rarity === 1) {
            uncommonKeys.push(key);
        }
        // Items in the priorty pool are 5x more likely to drop than normal.
        const weight = totalMultiplier * 5 * totalPoolWeight * (0.1 ** item.rarity);
        weightedDrops.push({
            keys: [key],
            weight,
        });
        remainingWeight -= weight;
    }
    for (const key of normalKeys) {
        const item = requireItem(key);
        if (item.rarity < 1) {
            normalCommonKeys.push(key);
            continue;
        }
        if (item.rarity === 1) {
            uncommonKeys.push(key);
        }
        const weight = totalMultiplier * totalPoolWeight * (0.1 ** item.rarity);
        weightedDrops.push({
            keys: [key],
            weight,
        });
        remainingWeight -= weight;
    }
    if (remainingWeight <= 0) {
        console.error('No remaining weight for common items:', remainingWeight, normalKeys, priorityKeys);
        console.error('This will make rare and legendary items less likely to drop in this pool.');
        console.error('This typically means there are too many uncommon items in the pool', uncommonKeys);
    }
    const weight = Math.max(remainingWeight, totalPoolWeight / 2);
    if (normalCommonKeys.length && priorityCommonKeys.length) {
        weightedDrops.push({
            keys: priorityCommonKeys,
            weight: 5 * weight / 6,
        });
        weightedDrops.push({
            keys: normalCommonKeys,
            weight: weight / 6,
        });
    } else if (normalCommonKeys.length){
        weightedDrops.push({
            keys: normalCommonKeys,
            weight,
        });
    } else if (priorityCommonKeys.length){
        weightedDrops.push({
            keys: priorityCommonKeys,
            weight,
        });
    } else if (uncommonKeys.length){
        weightedDrops.push({
            keys: uncommonKeys,
            weight,
        });
    } else {
        console.error('No common or uncommon keys found:', normalKeys, priorityKeys);
    }

    return weightedDrops;
}*/
const maxRarity = 10;
export function generatePoolFromKeys(
    state: GameState,
    // This multiplier will be applied to all drop chances.
    // This is intended to be set to 0.1 for resource collection points that can be farmed very rapidly.
    multiplier: number,
    // These items will use standard weights.
    normalKeys: InventoryKey[],
    // These items will be more likely to drop than usual from this item pool.
    priorityKeys: InventoryKey[] = [],
    bonusValue = 0
): WeightedDrop[] {
    bonusValue += (state.prestige.lootRarityBonus ?? 0);
    const totalMultiplier = multiplier * (1 + bonusValue / currentLevelCap);
    const weightedDrops: WeightedDrop[] = [];

    const normalKeysByRarity: Set<InventoryKey>[] = [];
    const priorityKeysByRarity: Set<InventoryKey>[] = [];
    let remainingWeight = totalPoolWeight;
    for (const key of priorityKeys) {
        const item = requireItem(key);
        const itemKeys = priorityKeysByRarity[item.rarity] ?? new Set();
        itemKeys.add(key);
        priorityKeysByRarity[item.rarity] = itemKeys;
    }
    for (const key of normalKeys) {
        const item = requireItem(key);
        const itemKeys = normalKeysByRarity[item.rarity] ?? new Set();
        itemKeys.add(key);
        normalKeysByRarity[item.rarity] = itemKeys;
    }
    function addWeightedDrop(keys: Set<InventoryKey>, dropChance: number) {
        const weight = Math.min(remainingWeight, keys.size * dropChance * remainingWeight);
        weightedDrops.push({keys: [...keys], weight});
    }
    let remainingItemKeys: Set<InventoryKey> = new Set();
    for (let i = maxRarity; i >= 0; i--) {
        const priorityKeys = priorityKeysByRarity[i];
        if (priorityKeys) {
            addWeightedDrop(priorityKeys, 5 * totalMultiplier * (0.1 ** i));
            remainingItemKeys = priorityKeys;
        }
        if (remainingWeight < 1) {
            break;
        }
        const normalKeys = normalKeysByRarity[i];
        if (normalKeys) {
            addWeightedDrop(normalKeys, totalMultiplier * (0.1 ** i));
            if (!priorityKeys) {
                remainingItemKeys = normalKeys;
            }
        }
        if (remainingWeight < 1) {
            break;
        }
    }
    // If any unused item weight remains, assign it all to the most common+highest priority item keys.
    if (remainingWeight >= 1 && remainingItemKeys) {
        weightedDrops.push({keys: [...remainingItemKeys], weight: remainingWeight});
    }
    return weightedDrops;
}

export function rollLoot(weightedDrops: WeightedDrop[]): InventoryKey {
    let total = weightedDrops.map(d => d.weight).reduce((sum, weight) => sum + weight, 0);
    let roll = Math.floor(Math.random() * total);
    for (const drop of weightedDrops) {
        roll -= drop.weight;
        if (roll < 0) {
            const key = drop.keys[Math.floor(Math.random() * drop.keys.length)];
            if (requireItem(key).rarity >= 2) {
                //console.log('Drop chance for ' + key + ' was ' + (100 * drop.weight / total).toFixed(4) + '%, ' + drop.weight + '/' + total);
                console.log('Drop chance for ' + key + ' was 1 in ' + (total / drop.weight).toFixed(1));
            }
            return key;
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
    const item = requireItem(itemKey);
    if (!existingItemEffect || (state.inventory[itemKey] ?? 0) < 5 || item.rarity > 1){
        addTextEffect(state, {target,
            text: getItemLabel(itemKey),
            color: (state) => getRarityColor(state, item.rarity),
            delay: existingItemEffect ? 400 : 0,
            duration: 1000 * (1 + item.rarity / 2),
            creator: 'lootText',
        });
    }
}

export const commonLegendaryItems: InventoryKey[] = ['sprintShoes', 'hasteRing', 'berserkBelt'];


export function forestLootPool(state: GameState, levelBonus: number, rarityMultiplier: number = 0.1) {
    return generatePoolFromKeys(state, rarityMultiplier, ['wood', 'hardwood', 'chippedEmerald', 'silverwood', 'emerald', 'enchantedWood', 'flawlessEmerald'], [], levelBonus);
}
