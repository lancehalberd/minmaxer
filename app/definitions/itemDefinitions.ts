import {typedKeys} from 'app/utils/types';

const itemDefinitions: {[key in InventoryKey]?: GenericItem} = {};
export function requireItem(key: InventoryKey): GenericItem {
    const item = itemDefinitions[key];
    if (!item) {
        console.error('Missing item definition', key);
        return {
            key: '???',
            name: 'Missing Item',
            rarity: 0,
        };
    }
    return item;
}
export function getItemKeys(): InventoryKey[] {
    return typedKeys(itemDefinitions);
}

function addItemDefinition(item: GenericItem & {key: InventoryKey}) {
    itemDefinitions[item.key] = item;
}

function makeStatFunction<T>(stat: ModifiableHeroStat) {
    return (flatBonus: number, percentBonus?: number, multiplier?: number) => ({
        stat, flatBonus, percentBonus, multiplier
    });
}

const health = makeStatFunction('maxHealth');
const armor = makeStatFunction('armor');
const damage = makeStatFunction('damage');
const range = makeStatFunction('attackRange');
const str = makeStatFunction('str');
const dex = makeStatFunction('dex');
const int = makeStatFunction('int');
const regen = makeStatFunction('regenPerSecond');
const attackSpeed = makeStatFunction('attacksPerSecond');
const cooldownSpeed = makeStatFunction('cooldownSpeed');
const movementSpeed = makeStatFunction('movementSpeed');
const speed = makeStatFunction('speed');
//const damageTaken = makeStatFunction('incomingDamageMultiplier');


addItemDefinition({
    key: 'scales',
    name: 'Scales',
    charmStats: {modifiers: [armor(1)]},
    extraArmorModifiers: [armor(1)],
    rarity: 0,
});
addItemDefinition({
    key: 'largeScales',
    name: 'Large Scales',
    armorStats: {
        armor: 3,
    },
    baseArmorStats: {armor: 2, armorCap: 5, maxDecorations: 2, itemLabel: 'Scalemail'},
    extraArmorModifiers: [armor(2)],
    rarity: 1,
});
addItemDefinition({
    key: 'hardScales',
    name: 'Hard Scales',
    charmStats: {modifiers: [armor(5)]},
    extraArmorModifiers: [armor(3)],
    rarity: 2,
});


addItemDefinition({
    key: 'brokenShell',
    name: 'Broken Shell',
    charmStats: {modifiers: [armor(1)]},
    extraArmorModifiers: [armor(1)],
    rarity: 0,
});
addItemDefinition({
    key: 'carapace',
    name: 'Carapace',
    armorStats: {
        armor: 3,
    },
    baseArmorStats: {armor: 2, armorCap: 5, maxDecorations: 2, itemLabel: 'Scalemail'},
    extraArmorModifiers: [armor(1)],
    rarity: 1,
});

addItemDefinition({
    key: 'claw',
    name: 'Claw',
    weaponStats: {damage: 4, modifiers: [dex(1)]},
    baseWeaponStats: {damage: 3, damageCap: 12, maxDecorations: 2, itemLabel: 'Claws'},
    charmStats: {modifiers: [damage(3)]},
    extraCharmModifiers: [damage(2)],
    rarity: 0,
});
addItemDefinition({
    key: 'fang',
    name: 'Fang',
    weaponStats: {damage: 10, modifiers: [dex(2)]},
    baseWeaponStats: {damage: 7, damageCap: 30, maxDecorations: 3, itemLabel: 'Fierce Claws'},
    charmStats: {modifiers: [damage(5)]},
    extraCharmModifiers: [damage(3)],
    rarity: 1,
});
addItemDefinition({
    key: 'snakeFang',
    name: 'Snake Fang',
    // TODO: Reduce damage and add DOT effect.
    weaponStats: {damage: 20, modifiers: [dex(5)]},
    charmStats: {modifiers: [damage(7)]},
    extraCharmModifiers: [damage(4)],
    rarity: 2,
});
addItemDefinition({
    key: 'horn',
    name: 'Horn',
    weaponStats: {damage: 20, modifiers: [dex(5)]},
    baseWeaponStats: {damage: 20, damageCap: 50, maxDecorations: 3, itemLabel: 'Horn Spear'},
    charmStats: {modifiers: [damage(10)]},
    extraCharmModifiers: [damage(5)],
    rarity: 2,
});

addItemDefinition({
    key: 'leatherStrap',
    name: 'Leath Strap',
    baseCharmStats: {modifiers: [armor(1)], maxDecorations: 2, itemLabel: 'Bracelet'},
    charmStats: {modifiers: [armor(3)]},
    extraArmorModifiers: [armor(1)],
    rarity: 0,
});
addItemDefinition({
    key: 'leather',
    name: 'Leather',
    baseWeaponStats: {damage: 3, damageCap: 10, maxDecorations: 1, itemLabel: 'Leather Sling'},
    armorStats: {
        armor: 4,
    },
    baseArmorStats: {armor: 3, armorCap: 10, maxDecorations: 2, itemLabel: 'Leather Jerkin'},
    extraArmorModifiers: [armor(2)],
    rarity: 1,
});
addItemDefinition({
    key: 'fineLeather',
    name: 'Fine Leather',
    baseWeaponStats: {damage: 12, damageCap: 30, maxDecorations: 2, itemLabel: 'Boxing Gloves'},
    armorStats: {
        armor: 10,
        modifiers: [health(50)],
    },
    baseArmorStats: {armor: 8, armorCap: 30, maxDecorations: 4, itemLabel: 'Fine Leather Armor'},
    extraArmorModifiers: [armor(5)],
    rarity: 2,
});

addItemDefinition({
    key: 'hideScraps',
    name: 'Hide Scraps',
    charmStats: {modifiers: [armor(1)]},
    extraArmorModifiers: [armor(1)],
    rarity: 0,
});
addItemDefinition({
    key: 'hide',
    name: 'Hide',
    armorStats: {
        armor: 3,
    },
    baseArmorStats: {armor: 2, armorCap: 5, maxDecorations: 1, itemLabel: 'Patchwork Armor'},
    extraArmorModifiers: [armor(1)],
    rarity: 1,
});
addItemDefinition({
    key: 'largeHide',
    name: 'Large Hide',
    armorStats: {
        armor: 4,
        modifiers: [health(10)],
    },
    baseArmorStats: {armor: 3, armorCap: 10, maxDecorations: 2, itemLabel: 'Hide Armor'},
    extraArmorModifiers: [armor(1)],
    rarity: 2,
});

addItemDefinition({
    key:'furScraps',
    name: 'Fur Scraps',
    charmStats: {modifiers: [armor(2)]},
    extraArmorModifiers: [armor(2)],
    rarity: 0,
});
addItemDefinition({
    key: 'fur',
    name: 'Fur',
    armorStats: {
        armor: 5,
        modifiers: [health(20)],
    },
    baseArmorStats: {armor: 4, armorCap: 15, maxDecorations: 1, itemLabel: 'Fur Robe'},
    extraArmorModifiers: [armor(1)],
    rarity: 1,
});
addItemDefinition({
    key:'lionPelt',
    name: 'Lion Pelt',
    armorStats: {
        armor: 10,
        modifiers: [dex(5)],
    },
    baseArmorStats: {armor: 6, modifiers: [dex(3)], armorCap: 20, maxDecorations: 2, itemLabel: 'Proud Armor'},
    extraArmorModifiers: [armor(1), dex(1)],
    rarity: 3,
});
addItemDefinition({
    key: 'bearSkin',
    name: 'Bear Skin',
    armorStats: {
        armor: 10,
        modifiers: [str(5)],
    },
    baseArmorStats: {armor: 6, modifiers: [str(3)], armorCap: 20, maxDecorations: 2, itemLabel: 'Ursa Mail'},
    extraArmorModifiers: [armor(1), str(1)],
    rarity: 3,
});


addItemDefinition({
    key: 'phoenixFeather',
    name: 'Phoenix Feather',
    charmStats: {modifiers: [health(20), regen(1)]},
    extraCharmModifiers: [health(5), regen(1)],
    rarity: 1,
});
addItemDefinition({
    key: 'phoenixPlume',
    name: 'Phoenix Plume',
    charmStats: {modifiers: [health(50), regen(5)]},
    extraCharmModifiers: [health(10), regen(3)],
    rarity: 2,
});
addItemDefinition({
    key: 'phoenixPinion',
    name: 'Phoenix Pinion',
    charmStats: {modifiers: [health(100), regen(10)]},
    extraCharmModifiers: [health(20), regen(5)],
    rarity: 3,
});
addItemDefinition({
    key: 'phoenixCrown',
    name: 'Phoenix Crown',
    armorStats: {
        armor: 30,
        modifiers: [cooldownSpeed(50), health(50), regen(5), str(10), dex(10), int(10)],
    },
    rarity: 4,
});
addItemDefinition({
    key: 'thirdEye',
    name: 'Third Eye',
    charmStats: {
        modifiers: [dex(10, 10), int(10, 10), range(10)],
    },
    rarity: 4,
});
addItemDefinition({
    key: 'hasteRing',
    name: 'Haste Ring',
    charmStats: {
        modifiers: [speed(0, 20)],
    },
    rarity: 4,
});
addItemDefinition({
    key: 'sprintShoes',
    name: 'Sprint Shoes',
    charmStats: {
        modifiers: [movementSpeed(0, 50)],
    },
    rarity: 4,
});
addItemDefinition({
    key: 'berserkBelt',
    name: 'Berserk Belt',
    charmStats: {
        modifiers: [str(10, 10), attackSpeed(0, 50)],
    },
    rarity: 4,
});
addItemDefinition({
    key: 'ankh',
    name: 'Ankh',
    charmStats: {
        modifiers: [health(100), regen(20), str(10), int(10)],
    },
    rarity: 4,
});


addItemDefinition({
    key: 'wood',
    name: 'Wood',
    baseWeaponStats: {damage: 2, damageCap: 5, maxDecorations: 1, itemLabel: 'Wooden Club'},
    weaponStats: {damage: 1},
    rarity: 0,
});
addItemDefinition({
    key: 'hardwood',
    name: 'Hardwood',
    baseWeaponStats: {damage: 8, damageCap: 20, maxDecorations: 2, itemLabel: 'Bo Staff'},
    weaponStats: {damage: 10},
    rarity: 1,
});
addItemDefinition({
    key: 'silverwood',
    name: 'Silverwood',
    baseWeaponStats: {damage: 20, damageCap: 60, maxDecorations: 4, itemLabel: 'Silverwood Staff'},
    weaponStats: {damage: 30},
    rarity: 2,
});
addItemDefinition({
    key: 'enchantedWood',
    name: 'Enchanted Wood',
    baseWeaponStats: {damage: 60, damageCap: 200, maxDecorations: 5, itemLabel: 'Enchanted Staff'},
    weaponStats: {damage: 100},
    rarity: 3,
});
addItemDefinition({
    key: 'stone',
    name: 'Stone',
    baseWeaponStats: {damage: 5, damageCap: 25, maxDecorations: 1, itemLabel: 'Stone Axe'},
    weaponStats: {damage: 3},
    charmStats: {modifiers: [damage(1), armor(1)]},
    rarity: 0,
});
addItemDefinition({
    key: 'ironOre',
    name: 'Iron Ore',
    charmStats: {modifiers: [damage(2), armor(2)]},
    rarity: 1,
});


addItemDefinition({
    key: 'bronze',
    name: 'Bronze',
    charmStats: {modifiers: [health(15)]},
    baseWeaponStats: {damage: 10, damageCap: 30, maxDecorations: 4, itemLabel: 'Brass Knuckles'},
    baseArmorStats: {armor: 10, armorCap: 50, maxDecorations: 3, itemLabel: 'Bronze Armor'},
    extraArmorModifiers: [armor(0, 2)],
    extraWeaponModifiers: [damage(0, 2)],
    baseCharmStats: {modifiers: [health(10)], maxDecorations: 3, itemLabel: 'Bronze Bracelet'},
    extraCharmModifiers: [health(5)],
    rarity: 2,
});
addItemDefinition({
    key: 'iron',
    name: 'Iron',
    weaponStats: {damage: 10},
    charmStats: {modifiers: [damage(6), armor(6)]},
    baseArmorStats: {armor: 20, armorCap: 100, maxDecorations: 2, itemLabel: 'Iron Armor'},
    extraArmorModifiers: [armor(5)],
    baseWeaponStats: {damage: 25, damageCap: 120, maxDecorations: 2, itemLabel: 'Short Sword'},
    extraWeaponModifiers: [damage(5)],
    baseCharmStats: {modifiers: [damage(5), armor(5)], maxDecorations: 1, itemLabel: 'Iron Ring'},
    extraCharmModifiers: [damage(2), armor(2)],
    rarity: 2,
});
addItemDefinition({
    key:'steel',
    name: 'Steel',
    weaponStats: {damage: 30},
    charmStats: {modifiers: [damage(12), armor(6)]},
    baseArmorStats: {armor: 40, armorCap: 200, maxDecorations: 4, itemLabel: 'Chainmail'},
    extraArmorModifiers: [armor(10)],
    baseWeaponStats: {damage: 50, damageCap: 250, maxDecorations: 4, itemLabel: 'Longsword'},
    extraWeaponModifiers: [damage(15)],
    baseCharmStats: {modifiers: [damage(10), armor(5)], maxDecorations: 3, itemLabel: 'Bracers'},
    extraCharmModifiers: [damage(4), armor(2)],
    rarity: 3,
});

addItemDefinition({
    key: 'silver',
    name: 'Silver',
    charmStats: {modifiers: [health(30)]},
    extraArmorModifiers: [armor(0, 5)],
    extraWeaponModifiers: [damage(0, 5)],
    baseCharmStats: {modifiers: [health(20)], maxDecorations: 4, itemLabel: 'Silver Necklace'},
    extraCharmModifiers: [health(10)],
    rarity: 2,
});
addItemDefinition({
    key: 'gold',
    name: 'Gold',
    charmStats: {modifiers: [health(60)]},
    extraArmorModifiers: [armor(0, 10)],
    extraWeaponModifiers: [damage(0, 10)],
    baseCharmStats: {modifiers: [health(40)], maxDecorations: 4, itemLabel: 'Gold Necklace'},
    extraCharmModifiers: [health(20)],
    rarity: 3,
});

addItemDefinition({
    key: 'chippedEmerald',
    name: 'Chipped Emerald',
    charmStats: {modifiers: [dex(2)]},
    extraArmorModifiers: [dex(1)],
    extraWeaponModifiers: [dex(1)],
    extraCharmModifiers: [dex(3)],
    rarity: 1,
});
addItemDefinition({
    key: 'chippedRuby',
    name: 'Chipped Ruby',
    charmStats: {modifiers: [str(2)]},
    extraArmorModifiers: [str(1)],
    extraWeaponModifiers: [str(1)],
    extraCharmModifiers: [str(3)],
    rarity: 1,
});
addItemDefinition({
    key: 'chippedSapphire',
    name: 'Chipped Sapphire',
    charmStats: {modifiers: [int(2)]},
    extraArmorModifiers: [int(1)],
    extraWeaponModifiers: [int(1)],
    extraCharmModifiers: [int(3)],
    rarity: 1,
});
addItemDefinition({
    key: 'emerald',
    name: 'Emerald',
    charmStats: {modifiers: [dex(4)]},
    extraArmorModifiers: [dex(2)],
    extraWeaponModifiers: [dex(2)],
    extraCharmModifiers: [dex(5)],
    rarity: 2,
});
addItemDefinition({
    key: 'ruby',
    name: 'Ruby',
    charmStats: {modifiers: [str(4)]},
    extraArmorModifiers: [str(2)],
    extraWeaponModifiers: [str(2)],
    extraCharmModifiers: [str(5)],
    rarity: 2,
});
addItemDefinition({
    key: 'sapphire',
    name: 'Sapphire',
    charmStats: {modifiers: [int(4)]},
    extraArmorModifiers: [int(2)],
    extraWeaponModifiers: [int(2)],
    extraCharmModifiers: [int(5)],
    rarity: 2,
});
addItemDefinition({
    key: 'flawlessEmerald',
    name: 'Flawless Emerald',
    charmStats: {modifiers: [dex(7)]},
    extraArmorModifiers: [dex(3)],
    extraWeaponModifiers: [dex(4)],
    extraCharmModifiers: [dex(8)],
    rarity: 3,
});
addItemDefinition({
    key: 'flawlessRuby',
    name: 'Flawless Ruby',
    charmStats: {modifiers: [str(7)]},
    extraArmorModifiers: [str(3)],
    extraWeaponModifiers: [str(4)],
    extraCharmModifiers: [str(8)],
    rarity: 3,
});
addItemDefinition({
    key: 'flawlessSapphire',
    name: 'Flawless Sapphire',
    charmStats: {modifiers: [int(7)]},
    extraArmorModifiers: [int(3)],
    extraWeaponModifiers: [int(4)],
    extraCharmModifiers: [int(8)],
    rarity: 3,
});

addItemDefinition({
    key: 'emeraldRing',
    name: 'Emerald Ring',
    charmStats: {modifiers: [dex(10)]},
    extraArmorModifiers: [dex(3)],
    extraWeaponModifiers: [dex(3)],
    rarity: 2,
});
addItemDefinition({
    key: 'rubyRing',
    name: 'Ruby Ring',
    charmStats: {modifiers: [str(10)]},
    extraArmorModifiers: [str(3)],
    extraWeaponModifiers: [str(3)],
    rarity: 2,
});
addItemDefinition({
    key: 'sapphireRing',
    name: 'Sapphire Ring',
    charmStats: {modifiers: [int(10)]},
    extraArmorModifiers: [int(3)],
    extraWeaponModifiers: [int(3)],
    rarity: 2,
});
addItemDefinition({
    key: 'emeraldBracelet',
    name: 'Emerald Bracelet',
    charmStats: {modifiers: [dex(20)]},
    rarity: 3,
});
addItemDefinition({
    key: 'rubyBracelet',
    name: 'Ruby Bracelet',
    charmStats: {modifiers: [str(20)]},
    rarity: 3,
});
addItemDefinition({
    key: 'sapphireBracelet',
    name: 'Sapphire Bracelet',
    charmStats: {modifiers: [int(20)]},
    rarity: 3,
});
addItemDefinition({
    key: 'emeraldNecklace',
    name: 'Emerald Necklace',
    charmStats: {modifiers: [dex(50)]},
    rarity: 4,
});
addItemDefinition({
    key: 'rubyNecklace',
    name: 'Ruby Necklace',
    charmStats: {modifiers: [str(50)]},
    rarity: 4,
});
addItemDefinition({
    key: 'sapphireNecklace',
    name: 'Sapphire Necklace',
    charmStats: {modifiers: [int(50)]},
    rarity: 4,
});

// Logging tools
addItemDefinition({
    key: 'woodHatchet',
    name: 'Hatchet',
    weaponStats: {damage: 5, modifiers: [str(1), dex(1)]},
    rarity: 0,
});
addItemDefinition({
    key: 'stoneAxe',
    name: 'Stone Axe',
    weaponStats: {damage: 15, modifiers: [str(3), dex(3)]},
    rarity: 1,
});
addItemDefinition({
    key: 'ironHatchet',
    name: 'Iron Hatchet',
    weaponStats: {damage: 50, modifiers: [str(10), dex(10)]},
    rarity: 2,
});
addItemDefinition({
    key: 'steelAxe',
    name: 'Steel Axe',
    weaponStats: {damage: 150, modifiers: [str(25), dex(25)]},
    rarity: 3,
});

// Building/crafting tools
addItemDefinition({
    key: 'woodHammer',
    name: 'Mallet',
    weaponStats: {damage: 5, modifiers: [str(2)]},
    rarity: 0,
});
addItemDefinition({
    key: 'stoneHammer',
    name: 'Stone Hammer',
    weaponStats: {damage: 15, modifiers: [str(6)]},
    rarity: 1,
});
addItemDefinition({
    key: 'ironHammer',
    name: 'Iron Hammer',
    weaponStats: {damage: 50, modifiers: [str(20)]},
    rarity: 2,
});
addItemDefinition({
    key: 'steelHammer',
    name: 'Steel Hammer',
    weaponStats: {damage: 150, modifiers: [str(50)]},
    rarity: 3,
});

// Archer tools
addItemDefinition({
    key: 'shortBow',
    name: 'Short Bow',
    weaponStats: {damage: 5, modifiers: [dex(2)]},
    rarity: 0,
});
addItemDefinition({
    key: 'longBow',
    name: 'Long Bow',
    weaponStats: {damage: 15, modifiers: [dex(6)]},
    rarity: 1,
});
addItemDefinition({
    key: 'crossbow',
    name: 'Crossbow',
    weaponStats: {damage: 50, modifiers: [dex(20)]},
    rarity: 2,
});

// Mage tools
addItemDefinition({
    key: 'woodStaff',
    name: 'Wood Staff',
    weaponStats: {damage: 5, modifiers: [int(2)]},
    rarity: 0,
});
addItemDefinition({
    key: 'bronzeStaff',
    name: 'Bronze Staff',
    weaponStats: {damage: 50, modifiers: [int(20)]},
    rarity: 2,
});
addItemDefinition({
    key: 'steelStaff',
    name: 'Steel Staff',
    weaponStats: {damage: 150, modifiers: [int(50)]},
    rarity: 3,
});

// Mining tools.
addItemDefinition({
    key: 'stonePickaxe',
    name: 'Stone Pickaxe',
    weaponStats: {damage: 15, modifiers: [int(3), str(3)]},
    rarity: 1,
});
addItemDefinition({
    key: 'ironPickaxe',
    name: 'Iron Pickaxe',
    weaponStats: {damage: 50, modifiers: [int(10), str(10)]},
    rarity: 2,
});
addItemDefinition({
    key: 'steelPickaxe',
    name: 'Steel Pickaxe',
    weaponStats: {damage: 150, modifiers: [int(25), str(25)]},
    rarity: 3,
});
