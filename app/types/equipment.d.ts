type ToolType = 'hammer' | 'axe' | 'pickaxe' | 'bow' | 'staff';
type HammerType = 'woodHammer' | 'stoneHammer' | 'ironHammer' | 'steelHammer';
type AxeType = 'woodHatchet' | 'stoneAxe' | 'ironHatchet' | 'steelAxe';
type PickaxeType = 'stonePickaxe' | 'ironPickaxe' | 'steelPickaxe';
type BowType = 'shortBow' | 'longBow' | 'crossbow';
type StaffType = 'woodStaff' | 'bronzeStaff' | 'steelStaff';
type AmmoType = 'arrow';

type MaterialType = '???'
    | 'hideScraps' | 'hide' | 'largeHide'
    | 'furScraps' | 'fur' | 'lionPelt' | 'bearSkin'
    | 'leatherStrap' | 'leather' | 'fineLeather'
    | 'scales' | 'largeScales' | 'hardScales'
    | 'brokenShell' | 'carapace'
    | 'claw' | 'fang' | 'horn'
    | 'snakeFang'
    | 'wood' | 'hardwood' | 'silverwood' | 'enchantedWood'
    | 'stone'
    | 'ironOre' | 'iron'
    | 'bronze'
    | 'silver' | 'gold'
    | 'steel'
    | 'chippedEmerald' | 'chippedRuby' | 'chippedSapphire'
    | 'emerald' | 'ruby' | 'sapphire'
    | 'flawlessEmerald' | 'flawlessRuby' | 'flawlessSapphire'

type CharmType =
    'emeraldRing' | 'emeraldBracelet' | 'emeraldNecklace'
    | 'rubyRing' | 'rubyBracelet' | 'rubyNecklace'
    | 'sapphireRing' | 'sapphireBracelet' | 'sapphireNecklace'

type InventoryKey =
    MaterialType
    | AxeType | HammerType | PickaxeType
    | BowType | StaffType
    | CharmType;

type Inventory = {
    [key in InventoryKey]?: number
};

interface StatModifier {
    stat: ModifiableHeroStat
    flatBonus?: number
    percentBonus?: number
    multiplier?: number
}

interface BaseCraftingStats {
    maxDecorations: number
    modifiers?: StatModifier[]
    itemLabel?: string
    // Higher is better
    // defaults to the damageCap/armorCap value for weapons/armors.
    // defaults to the maxDecorations for charms.
    itemLabelPriority?: number
}

interface BaseArmorStats extends BaseCraftingStats {
    armor: number
    armorCap: number
}
interface BaseWeaponStats extends BaseCraftingStats {
    damage: number
    damageCap: number
    maxDecorations: number
}
interface BaseCharmStats extends BaseCraftingStats {
}
interface WeaponStats {
    damage: number
    modifiers?: StatModifier[]
}
interface ArmorStats {
    armor: number
    modifiers?: StatModifier[]
}
interface CharmStats {
    modifiers?: StatModifier[]
}
interface ModifierStats {
    modifiers?: StatModifier[]
}

interface DecorationCraftingStats {
    modifiers: StatModifier[]
}

interface GenericItem {
    // This should be defined for all generic items but it is made optional to make this
    // type compatable with CraftedEquipment which does not require a key.
    key?: InventoryKey
    name: string
    // Any material that implements these stats can be equipped as weapon/armor/charm.
    weaponStats?: WeaponStats
    armorStats?: ArmorStats
    charmStats?: CharmStats
    // These all describe the effect of using this material for different types of crafting.
    baseArmorStats?: BaseArmorStats
    extraArmorModifiers?: StatModifier[]
    baseWeaponStats?: BaseWeaponStats
    extraWeaponModifiers?: StatModifier[]
    baseCharmStats?: BaseCharmStats
    extraCharmModifiers?: StatModifier[]
    rarity: number
    // TODO: Possible include price information here if we allow purchasing materials.
}

interface Armor {
    key?: InventoryKey
    name: string
    armorStats: ArmorStats
    rarity: number
}
interface Weapon {
    key?: InventoryKey
    name: string
    weaponStats: WeaponStats
    rarity: number
}
interface Charm {
    key?: InventoryKey
    name: string
    charmStats: CharmStats
    rarity: number
}

interface CraftableEquipment {
    name: string
    equipmentType: EquipmentType
    // If this equipment was crafted, there recipe is stored here.
    // This could be displayed to the user if they want to know how equipment was made.
    // Also allows us to start equipment as recipes on save and recreate the specific stats on load.
    materials: InventoryKey[]
    decorations: InventoryKey[]
    rarity: number
}

interface CraftedArmor extends CraftableEquipment {
    // This will be set on armor that corresponds to a generic item.
    key?: InventoryKey
    equipmentType: 'armor'
    armorStats: ArmorStats
}
interface CraftedWeapon extends CraftableEquipment {
    // This will be set on weapons that corresponds to a generic item.
    key?: InventoryKey
    equipmentType: 'weapon'
    weaponStats: WeaponStats
}
interface CraftedCharm extends CraftableEquipment {
    // This will be set on charms that corresponds to a generic item.
    key?: InventoryKey
    equipmentType: 'charm'
    charmStats: CharmStats
}
type CraftedItem = CraftedArmor|CraftedWeapon|CraftedCharm;

type InventoryItem = GenericItem|CraftedItem;

type EquipmentType = 'weapon'|'armor'|'charm';
type CraftingSlotType = 'base'|'decoration';

interface CraftingBench {
    equipmentType: EquipmentType
    baseMaterialSlots: (GenericItem|undefined)[]
    decorationSlots: (GenericItem|undefined)[]
    // Max decoration slots allowed by the current base materials.
    maxDecorationSlots: number
    previewItem?: CraftedWeapon|CraftedArmor|CraftedCharm
}
