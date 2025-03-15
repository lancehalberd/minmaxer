type ToolType = 'hammer' | 'axe' | 'pickaxe' | 'bow' | 'staff';
type HammerType = 'woodHammer' | 'stoneHammer' | 'ironHammer' | 'steelHammer';
type AxeType = 'woodHatchet' | 'stoneAxe' | 'ironHatchet' | 'steelAxe';
type PickaxeType = 'stonePickaxe' | 'ironPickaxe' | 'steelPickaxe';
type BowType = 'shortBow' | 'longBow' | 'crossBow';
type StaffType = 'woodStaff' | 'bronzeStaff' | 'steelStaff';
type AmmoType = 'arrow';

type MaterialType =
    'hideScraps' | 'hide' | 'largeHide'
    | 'furScraps' | 'fur' | 'lionPelt' | 'bearSkin'
    | 'leatherStrap' | 'leather' | 'fineLeather'
    | 'scales' | 'largeScales' | 'hardScales'
    | 'wood' | 'hardwood'
    | 'stone'
    | 'ironOre' | 'iron'
    | 'bronze'
    | 'silver' | 'gold'
    | 'steel'
    | 'chippedEmerald' | 'chippedRuby' | 'chippedSapphire'

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

interface BaseArmorStats {
    armor: number
    armorCap: number
    modifiers?: StatModifier[]
}
interface BaseWeaponStats {
    damage: number
    damageCap: number
    modifiers?: StatModifier[]
}
interface BaseCharmStats {
    modifiers?: StatModifier[]
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

interface GenericItem {
    // This shouls be defined for all generic items but it is made optional to make this
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
    // TODO: Possible include price information here if we allow purchasing materials.
}

interface CraftableEquipment {
    name: string
    // If this equipment was crafted, there recipe is stored here.
    // This could be displayed to the user if they want to know how equipment was made.
    // Also allows us to start equipment as recipes on save and recreate the specific stats on load.
    materials?: MaterialType[]
    decorations?: MaterialType[]
}

interface Armor extends CraftableEquipment {
    // This will be set on armor that corresponds to a generic item.
    key?: InventoryKey
    armorStats: ArmorStats
}
interface Weapon extends CraftableEquipment {
    // This will be set on weapons that corresponds to a generic item.
    key?: InventoryKey
    weaponStats: WeaponStats
}
interface Charm extends CraftableEquipment {
    // This will be set on charms that corresponds to a generic item.
    key?: InventoryKey
    charmStats: CharmStats
}
type CustomItem = Armor|Weapon|Charm;

type InventoryItem = GenericItem|CustomItem;
