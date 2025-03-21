
/*
type MaterialType =
    |
*/

export const itemDefinitions: {[key in InventoryKey]?: GenericItem} = {};
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
const str = makeStatFunction('str');
const dex = makeStatFunction('dex');
const int = makeStatFunction('int');


addItemDefinition({
    key: 'scales',
    name: 'Scales',
    charmStats: {modifiers: [armor(1)]},
    extraArmorModifiers: [armor(1)],
});
addItemDefinition({
    key: 'largeScales',
    name: 'Large Scales',
    armorStats: {
        armor: 3,
    },
    baseArmorStats: {armor: 2, armorCap: 5},
    extraArmorModifiers: [armor(1)],
});
addItemDefinition({
    key: 'hardScales',
    name: 'Hard Scales',
    charmStats: {modifiers: [armor(5)]},
    extraArmorModifiers: [armor(3)],
});

addItemDefinition({
    key: 'snakeFang',
    name: 'Snake Fang',
    // TODO: Reduce damage and add DOT effect.
    weaponStats: {damage: 20, modifiers: [dex(5)]},
});

addItemDefinition({
    key: 'leatherStrap',
    name: 'Leath Strap',
    baseCharmStats: {modifiers: [armor(1)]},
    charmStats: {modifiers: [armor(3)]},
    extraArmorModifiers: [armor(1)],
});
addItemDefinition({
    key: 'leather',
    name: 'Leather',
    armorStats: {
        armor: 4,
    },
    baseArmorStats: {armor: 1, armorCap: 5},
    extraArmorModifiers: [armor(2)],
});
addItemDefinition({
    key: 'fineLeather',
    name: 'Fine Leather',
    armorStats: {
        armor: 10,
        modifiers: [health(50)],
    },
    baseArmorStats: {armor: 8, armorCap: 30},
    extraArmorModifiers: [armor(5)],
});

addItemDefinition({
    key: 'hideScraps',
    name: 'Hide Scraps',
    charmStats: {modifiers: [armor(1)]},
    extraArmorModifiers: [armor(1)],
});
addItemDefinition({
    key: 'hide',
    name: 'Hide',
    armorStats: {
        armor: 3,
    },
    baseArmorStats: {armor: 2, armorCap: 5},
    extraArmorModifiers: [armor(1)],
});
addItemDefinition({
    key: 'largeHide',
    name: 'Large Hide',
    armorStats: {
        armor: 4,
        modifiers: [health(10)],
    },
    baseArmorStats: {armor: 3, armorCap: 10},
    extraArmorModifiers: [armor(1)],
});

addItemDefinition({
    key:'furScraps',
    name: 'Fur Scraps',
    charmStats: {modifiers: [armor(2)]},
    extraArmorModifiers: [armor(2)],
});
addItemDefinition({
    key: 'fur',
    name: 'Fur',
    armorStats: {
        armor: 5,
        modifiers: [health(20)],
    },
    baseArmorStats: {armor: 4, armorCap: 15},
    extraArmorModifiers: [armor(1)],
});
addItemDefinition({
    key:'lionPelt',
    name: 'Lion Pelt',
    armorStats: {
        armor: 10,
        modifiers: [dex(5)],
    },
    baseArmorStats: {armor: 5, armorCap: 20},
    extraArmorModifiers: [armor(1), dex(1)],
});
addItemDefinition({
    key: 'bearSkin',
    name: 'Bear Skin',
    armorStats: {
        armor: 10,
        modifiers: [str(5)],
    },
    baseArmorStats: {armor: 5, armorCap: 20},
    extraArmorModifiers: [armor(1), str(1)],
});

addItemDefinition({
    key: 'wood',
    name: 'Wood',
    weaponStats: {damage: 1},
});
addItemDefinition({
    key: 'hardwood',
    name: 'Hardwood',
    weaponStats: {damage: 10},
});
addItemDefinition({
    key: 'stone',
    name: 'Stone',
    weaponStats: {damage: 3},
    charmStats: {modifiers: [damage(1), armor(1)]},
});
addItemDefinition({
    key: 'ironOre',
    name: 'Iron Ore',
    charmStats: {modifiers: [damage(2), armor(2)]},
});


addItemDefinition({
    key: 'bronze',
    name: 'Bronze',
    charmStats: {modifiers: [health(15)]},
    baseArmorStats: {armor: 10, armorCap: 50},
    extraArmorModifiers: [armor(0, 2)],
    extraWeaponModifiers: [damage(0, 2)],
    baseCharmStats: {modifiers: [health(10)]},
    extraCharmModifiers: [health(5)],
});
addItemDefinition({
    key: 'iron',
    name: 'Iron',
    weaponStats: {damage: 10},
    charmStats: {modifiers: [damage(6), armor(6)]},
    baseArmorStats: {armor: 20, armorCap: 100},
    extraArmorModifiers: [armor(5)],
    baseWeaponStats: {damage: 25, damageCap: 120},
    extraWeaponModifiers: [damage(5)],
    baseCharmStats: {modifiers: [damage(5), armor(5)]},
    extraCharmModifiers: [damage(2), armor(2)],
});
addItemDefinition({
    key:'steel',
    name: 'Steel',
    weaponStats: {damage: 30},
    charmStats: {modifiers: [damage(12), armor(6)]},
    baseArmorStats: {armor: 40, armorCap: 200},
    extraArmorModifiers: [armor(10)],
    baseWeaponStats: {damage: 50, damageCap: 250},
    extraWeaponModifiers: [damage(15)],
    baseCharmStats: {modifiers: [damage(10), armor(5)]},
    extraCharmModifiers: [damage(4), armor(2)],
});

addItemDefinition({
    key: 'silver',
    name: 'Silver',
    charmStats: {modifiers: [health(30)]},
    extraArmorModifiers: [armor(0, 5)],
    extraWeaponModifiers: [damage(0, 5)],
    baseCharmStats: {modifiers: [health(20)]},
    extraCharmModifiers: [health(10)],
});
addItemDefinition({
    key: 'gold',
    name: 'Gold',
    charmStats: {modifiers: [health(60)]},
    extraArmorModifiers: [armor(0, 10)],
    extraWeaponModifiers: [damage(0, 10)],
    baseCharmStats: {modifiers: [health(40)]},
    extraCharmModifiers: [health(20)],
});

addItemDefinition({
    key: 'chippedEmerald',
    name: 'Chipped Emerald',
    charmStats: {modifiers: [dex(3)]},
    extraArmorModifiers: [dex(1)],
    extraWeaponModifiers: [dex(1)],
    baseCharmStats: {modifiers: [dex(2)]},
    extraCharmModifiers: [dex(1)],
});
addItemDefinition({
    key: 'chippedRuby',
    name: 'Chipped Ruby',
    charmStats: {modifiers: [str(3)]},
    extraArmorModifiers: [str(1)],
    extraWeaponModifiers: [str(1)],
    baseCharmStats: {modifiers: [str(2)]},
    extraCharmModifiers: [str(1)],
});
addItemDefinition({
    key: 'chippedSapphire',
    name: 'Chipped Sapphire',
    charmStats: {modifiers: [int(3)]},
    extraArmorModifiers: [int(1)],
    extraWeaponModifiers: [int(1)],
    baseCharmStats: {modifiers: [int(2)]},
    extraCharmModifiers: [int(1)],
});

addItemDefinition({
    key: 'emeraldRing',
    name: 'Emerald Ring',
    charmStats: {modifiers: [dex(10)]},
    extraArmorModifiers: [dex(3)],
    extraWeaponModifiers: [dex(3)],
});
addItemDefinition({
    key: 'rubyRing',
    name: 'Ruby Ring',
    charmStats: {modifiers: [str(10)]},
    extraArmorModifiers: [str(3)],
    extraWeaponModifiers: [str(3)],
});
addItemDefinition({
    key: 'sapphireRing',
    name: 'Sapphire Ring',
    charmStats: {modifiers: [int(10)]},
    extraArmorModifiers: [int(3)],
    extraWeaponModifiers: [int(3)],
});
addItemDefinition({
    key: 'emeraldBracelet',
    name: 'Emerald Bracelet',
    charmStats: {modifiers: [dex(20)]},
});
addItemDefinition({
    key: 'rubyBracelet',
    name: 'Ruby Bracelet',
    charmStats: {modifiers: [str(20)]},
});
addItemDefinition({
    key: 'sapphireBracelet',
    name: 'Sapphire Bracelet',
    charmStats: {modifiers: [int(20)]},
});
addItemDefinition({
    key: 'emeraldNecklace',
    name: 'Emerald Necklace',
    charmStats: {modifiers: [dex(50)]},
});
addItemDefinition({
    key: 'rubyNecklace',
    name: 'Ruby Necklace',
    charmStats: {modifiers: [str(50)]},
});
addItemDefinition({
    key: 'sapphireNecklace',
    name: 'Sapphire Necklace',
    charmStats: {modifiers: [int(50)]},
});

// Logging tools
addItemDefinition({
    key: 'woodHatchet',
    name: 'Hatchet',
    weaponStats: {damage: 5, modifiers: [str(1), dex(1)]},
});
addItemDefinition({
    key: 'stoneAxe',
    name: 'Stone Axe',
    weaponStats: {damage: 15, modifiers: [str(3), dex(3)]},
});
addItemDefinition({
    key: 'ironHatchet',
    name: 'Iron Hatchet',
    weaponStats: {damage: 50, modifiers: [str(10), dex(10)]},
});
addItemDefinition({
    key: 'steelAxe',
    name: 'Steel Axe',
    weaponStats: {damage: 150, modifiers: [str(25), dex(25)]},
});

// Building/crafting tools
addItemDefinition({
    key: 'woodHammer',
    name: 'Mallet',
    weaponStats: {damage: 5, modifiers: [str(2)]},
});
addItemDefinition({
    key: 'stoneHammer',
    name: 'Stone Hammer',
    weaponStats: {damage: 15, modifiers: [str(6)]},
});
addItemDefinition({
    key: 'ironHammer',
    name: 'Iron Hammer',
    weaponStats: {damage: 50, modifiers: [str(20)]},
});
addItemDefinition({
    key: 'steelHammer',
    name: 'Steel Hammer',
    weaponStats: {damage: 150, modifiers: [str(50)]},
});

// Archer tools
addItemDefinition({
    key: 'shortBow',
    name: 'Short Bow',
    weaponStats: {damage: 5, modifiers: [dex(2)]},
});
addItemDefinition({
    key: 'longBow',
    name: 'Long Bow',
    weaponStats: {damage: 15, modifiers: [dex(6)]},
});
addItemDefinition({
    key: 'crossbow',
    name: 'Crossbow',
    weaponStats: {damage: 50, modifiers: [dex(20)]},
});

// Mage tools
addItemDefinition({
    key: 'woodStaff',
    name: 'Wood Staff',
    weaponStats: {damage: 5, modifiers: [int(2)]},
});
addItemDefinition({
    key: 'bronzeStaff',
    name: 'Bronze Staff',
    weaponStats: {damage: 50, modifiers: [int(20)]},
});
addItemDefinition({
    key: 'steelStaff',
    name: 'Steel Staff',
    weaponStats: {damage: 150, modifiers: [int(50)]},
});

// Mining tools.
addItemDefinition({
    key: 'stonePickaxe',
    name: 'Stone Pickaxe',
    weaponStats: {damage: 15, modifiers: [int(3), str(3)]},
});
addItemDefinition({
    key: 'ironPickaxe',
    name: 'Iron Pickaxe',
    weaponStats: {damage: 50, modifiers: [int(10), str(10)]},
});
addItemDefinition({
    key: 'steelPickaxe',
    name: 'Steel Pickaxe',
    weaponStats: {damage: 150, modifiers: [int(25), str(25)]},
});
