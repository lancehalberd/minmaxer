import {canvas, uiPadding, uiSize} from 'app/gameConstants';
import {ChooseItemPanel} from 'app/ui/chooseItemPanel';
import {PanelPadding, TabbedPanel} from 'app/ui/panel';
import {CloseIconButton} from 'app/ui/iconButton';
import {TextButton} from 'app/ui/textButton';
import {showSimpleTooltip} from 'app/ui/tooltip';
import {requireItem} from 'app/definitions/itemDefinitions';
import {fillText} from 'app/utils/draw';
import {removeItemFromArray} from 'app/utils/array';
import {addItemToInventory, removeItemFromInventory} from 'app/utils/inventory';
import {statModifierStrings} from 'app/utils/modifiableStat';
import {typedKeys, isArmor, isCharm, isWeapon} from 'app/utils/types';


export function toggleCraftingBenchPanel(state: GameState, open = !state.openCraftingBenchPanel) {
    state.openCraftingBenchPanel = open;
    if (open) {
        state.openJobsPanel = false;
        state.openCharacterPanel = false;
        state.openChooseArmorPanel = false;
        state.openChooseWeaponPanel = false;
        state.openChooseCharmPanel = false;
    } else {
        hideChooseMaterialPanel(state);
    }
}

export function clearCraftingBench(state: GameState) {
    delete state.craftingBench.previewItem;
    // Return all selected items to the inventory since they may not
    // work for the new equipment type.
    for (let i = 0; i < state.craftingBench.baseMaterialSlots.length; i++) {
        if (state.craftingBench.baseMaterialSlots[i]) {
            addItemToInventory(state, state.craftingBench.baseMaterialSlots[i]);
            state.craftingBench.baseMaterialSlots[i] = undefined;
        }
    }
    for (let i = 0; i < state.craftingBench.decorationSlots.length; i++) {
        if (state.craftingBench.decorationSlots[i]) {
            addItemToInventory(state, state.craftingBench.decorationSlots[i]);
            state.craftingBench.decorationSlots[i] = undefined;
        }
    }
}

interface RemoveItemButtonProps {
    slotType: CraftingSlotType
    index: number
    x: number
    y: number
}
function createRemoveItemButton({slotType, index, x, y}: RemoveItemButtonProps) {
    return new CloseIconButton({
        uniqueId: 'remove-' + slotType + '-' + index,
        x,
        y,
        w: uiSize,
        h: uiSize,
        onPress: (state: GameState) => {
            if (slotType === 'base') {
                if (state.craftingBench.baseMaterialSlots[index]) {
                    addItemToInventory(state, state.craftingBench.baseMaterialSlots[index]);
                    state.craftingBench.baseMaterialSlots[index] = undefined
                }
            }
            if (slotType === 'decoration') {
                if (state.craftingBench.decorationSlots[index]) {
                    addItemToInventory(state, state.craftingBench.decorationSlots[index]);
                    state.craftingBench.decorationSlots[index] = undefined
                }
            }
            return true;
        },
    });
}

function showMaterialToolTip(state: GameState, slotType: CraftingSlotType, equipmentType: EquipmentType, material: GenericItem) {
    if (slotType === 'decoration') {
        if (equipmentType === 'weapon' && material.extraWeaponModifiers) {
            showSimpleTooltip(state, statModifierStrings(material.extraWeaponModifiers));
        }
        if (equipmentType === 'armor' && material.extraArmorModifiers) {
            showSimpleTooltip(state, statModifierStrings(material.extraArmorModifiers));
        }
        if (equipmentType === 'charm' && material.extraCharmModifiers) {
            showSimpleTooltip(state, statModifierStrings(material.extraCharmModifiers));
        }
    } else if (slotType === 'base') {
        if (equipmentType === 'weapon' && material.baseWeaponStats) {
            showSimpleTooltip(state, [
                'damage: ' + material.baseWeaponStats.damage + ' / ' + material.baseWeaponStats.damageCap,
                'decorations: ' + material.baseWeaponStats.maxDecorations,
                ...statModifierStrings(material.baseWeaponStats.modifiers),
            ]);
        }
        if (equipmentType === 'armor' && material.baseArmorStats) {
            showSimpleTooltip(state, [
                'armor: ' + material.baseArmorStats.armor + ' / ' + material.baseArmorStats.armorCap,
                'decorations: ' + material.baseArmorStats.maxDecorations,
                ...statModifierStrings(material.baseArmorStats.modifiers),
            ]);
        }
        if (equipmentType === 'charm' && material.baseCharmStats) {
            showSimpleTooltip(state, [
                'decorations: ' + material.baseCharmStats.maxDecorations,
                ...statModifierStrings(material.baseCharmStats.modifiers),
            ]);
        }
    }
}

class CraftingBenchContent implements UIContainer {
    objectType = <const>'uiContainer';
    w = 600;
    h = 400;
    x = 40;
    y = (canvas.height - this.h) / 2;
    children: UIElement[] = [];
    baseMaterialSlots: TextButton[] = [];
    decorationSlots: TextButton[] = [];
    itemPreview: ItemPreview = new ItemPreview();
    craftButton: TextButton = new TextButton({
        text: 'Craft',
        textProps: {size: 30},
        x: (this.w - 100) / 2,
        y: this.h - 4 * uiSize,
        h: 4 * uiSize,
        onClick(state: GameState) {
            const item = state.craftingBench.previewItem;
            if (item) {
                // Place the preview item in the inventory.
                if (isWeapon(item)) {
                    state.craftedWeapons.push(item);
                } else if (isArmor(item)) {
                    state.craftedArmors.push(item);
                } else if (isCharm(item)) {
                    state.craftedCharms.push(item);
                }
                // Delete the preview item and crafting materials from the bench.
                delete state.craftingBench.previewItem;
                for (let i = 0; i < state.craftingBench.baseMaterialSlots.length; i++) {
                    state.craftingBench.baseMaterialSlots[i] = undefined;
                }
                for (let i = 0; i < state.craftingBench.decorationSlots.length; i++) {
                    state.craftingBench.decorationSlots[i] = undefined;
                }
            }
            return true;
        }
    });
    update(state: GameState) {
        updateMaxDecorationSlots(state);
        this.children = [this.itemPreview];
        let selectedBaseMaterials = 0;
        for (let i = 0; i < state.craftingBench.baseMaterialSlots.length; i++) {
            if (!this.baseMaterialSlots[i]) {
                this.baseMaterialSlots[i] = new TextButton({
                    x: 0,
                    y: (2 * uiSize + uiPadding) * i,
                    w: 100,
                    text(state: GameState) {
                        const item = state.craftingBench.baseMaterialSlots[i];
                        return item ? item.name : 'None';
                    },
                    onHover(state: GameState) {
                        const material = state.craftingBench.baseMaterialSlots[i];
                        if (material) {
                            showMaterialToolTip(state, 'base', state.craftingBench.equipmentType, material);
                        } else {
                            showSimpleTooltip(state, ['Select Base Materal']);
                        }
                        return true;
                    },
                    onClick(state: GameState) {
                        showChooseMaterialPanel(state, state.craftingBench.equipmentType, 'base', i);
                        return true;
                    },
                });
            }
            if (state.craftingBench.baseMaterialSlots[i]) {
                selectedBaseMaterials++;
            }
            this.children.push(this.baseMaterialSlots[i]);
            if (state.craftingBench.baseMaterialSlots[i]) {
                this.children.push(createRemoveItemButton({slotType: 'base', index: i,
                    x: this.baseMaterialSlots[i].x + this.baseMaterialSlots[i].w + 5,
                    y: this.baseMaterialSlots[i].y + (this.baseMaterialSlots[i].h - uiSize) / 2,
                }));
            }
        }
        for (let i = 0; i < Math.min(state.craftingBench.maxDecorationSlots, state.craftingBench.decorationSlots.length); i++) {
            if (!this.decorationSlots[i]) {
                this.decorationSlots[i] = new TextButton({
                    x: 100 + uiSize + 2 * uiPadding,
                    y: (2 * uiSize + uiPadding) * i,
                    w: 100,
                    text(state: GameState) {
                        const item = state.craftingBench.decorationSlots[i];
                        return item ? item.name : 'None';
                    },
                    onHover(state: GameState) {
                        const material = state.craftingBench.decorationSlots[i];
                        if (material) {
                            showMaterialToolTip(state, 'decoration', state.craftingBench.equipmentType, material);
                        } else {
                            showSimpleTooltip(state, ['Select decorations']);
                        }
                        return true;
                    },
                    onClick(state: GameState) {
                        showChooseMaterialPanel(state, state.craftingBench.equipmentType, 'decoration', i);
                        return true;
                    },
                });
            }
            this.children.push(this.decorationSlots[i]);
            if (state.craftingBench.decorationSlots[i]) {
                this.children.push(createRemoveItemButton({slotType: 'decoration', index: i,
                    x: this.decorationSlots[i].x + this.decorationSlots[i].w + 5,
                    y: this.decorationSlots[i].y + (this.decorationSlots[i].h - uiSize) / 2,
                }));
            }
        }
        if (selectedBaseMaterials === 0) {
            delete state.craftingBench.previewItem;
        } else {
            state.craftingBench.previewItem = createCraftedItem(state, state.craftingBench.equipmentType, state.craftingBench.baseMaterialSlots, state.craftingBench.decorationSlots);
            // Only show the craft button when a valid craft is previewed.
            this.children.push(this.craftButton);
            this.craftButton.y = this.h - this.craftButton.h;
            this.craftButton.x = (this.w - this.craftButton.w) / 2;
        }
        this.itemPreview.item = state.craftingBench.previewItem;
        this.itemPreview.x = 250 + 4 * uiPadding;
        this.itemPreview.y = 0;
        this.itemPreview.h = this.h;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            context.translate(this.x, this.y);
            const children = this.getChildren(state);
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getChildren(state: GameState) {
        return this.children;
    }
}

const lineHeight = 25;
class ItemPreview implements UIContainer {
    objectType = <const>'uiContainer';
    w = 200;
    h = 300;
    x = 0;
    y = 0;
    item?: CraftedItem
    children: UIElement[] = [];
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            context.translate(this.x, this.y);
            if (!this.item) {
                fillText(context, {text: 'Choose Material', x: 0, y: 0, size: 20, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
            } else {
                fillText(context, {text: this.item.name, x: 0, y: 0, size: 20, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
                if (isWeapon(this.item)) {
                    fillText(context, {text: 'Damage: ' + this.item.weaponStats.damage, x: 0, y: lineHeight, size: 20, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
                    const modifierStrings = statModifierStrings(this.item.weaponStats.modifiers);
                    for (let i = 0; i < modifierStrings.length; i++) {
                        fillText(context, {text: modifierStrings[i], x: 0, y: lineHeight * (2 + i), size: 20, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
                    }
                } else if (isArmor(this.item)) {
                    fillText(context, {text: 'Armor: ' + this.item.armorStats.armor, x: 0, y: lineHeight, size: 20, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
                    const modifierStrings = statModifierStrings(this.item.armorStats.modifiers);
                    for (let i = 0; i < modifierStrings.length; i++) {
                        fillText(context, {text: modifierStrings[i], x: 0, y: lineHeight * (2 + i), size: 20, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
                    }
                }  else if (isCharm(this.item)) {
                    const modifierStrings = statModifierStrings(this.item.charmStats.modifiers);
                    for (let i = 0; i < modifierStrings.length; i++) {
                        fillText(context, {text: modifierStrings[i], x: 0, y: lineHeight * (1 + i), size: 20, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
                    }
                }
            }
            const children = this.getChildren(state);
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getChildren(state: GameState) {
        return this.children;
    }
}

const craftingBenchPanelContent = new PanelPadding(new CraftingBenchContent());

export const craftingBenchPanel = new TabbedPanel({
    w: 550,
    h: 400,
    x: 40,
    y: (canvas.height - 400) / 2,
    tabs(state: GameState) {
        const tabs = [{
            title: 'Craft Weapon',
            content: craftingBenchPanelContent,
        },{
            title: 'Craft Armor',
            content: craftingBenchPanelContent,
        }];
        // Lock Charm crafting until 1 decoration slot is available as charms aren't
        // very interesting without decorations and this makes unlocking the first
        // decoration slot feel more impactful.
        if (state.craftingBench.decorationSlots.length) {
            tabs.push({
                title: 'Craft Charm',
                content: craftingBenchPanelContent,
            });
        }
        return tabs;
    },
    onSelectTab(state: GameState, index: number) {
        const newEquipmentType = (<const>['weapon', 'armor', 'charm'])[index];
        if (state.craftingBench.equipmentType === newEquipmentType) {
            return;
        }
        hideChooseMaterialPanel(state);
        state.craftingBench.equipmentType = newEquipmentType
        clearCraftingBench(state);
    },
    /*title: (state) => {
        if (state.craftingBench.equipmentType === 'weapon') {
            return 'Craft Weapon';
        }
        if (state.craftingBench.equipmentType === 'armor') {
            return 'Craft Armor';
        }
        if (state.craftingBench.equipmentType === 'charm') {
            return 'Craft Charm';
        }
        const never: never = state.craftingBench.equipmentType;
        return never;
    },*/
    //content: ,
    onClose(state: GameState) {
        toggleCraftingBenchPanel(state, false);
    }
});

function hideChooseMaterialPanel(state: GameState) {
    state.openPanels = state.openPanels.filter(panel => panel.uniqueId !== 'choose-material-panel');
}

function showChooseMaterialPanel(state: GameState, equipmentType: EquipmentType, slotType: CraftingSlotType, index: number) {
    let array: (InventoryItem|undefined)[] = [];
    if (slotType === 'base') {
        array = state.craftingBench.baseMaterialSlots;
    } else {
        array = state.craftingBench.decorationSlots;
    }

    // Close any existing 'Choose Material' panels.
    hideChooseMaterialPanel(state);

    const chooseMaterialPanel = new ChooseItemPanel<InventoryItem>({
        uniqueId: 'choose-material-panel',
        title: 'Choose Material',
        items(state: GameState) {
            return getMaterials(state, equipmentType, slotType);
        },
        onHoverItem(state: GameState, item: InventoryItem) {
            showMaterialToolTip(state, slotType, equipmentType, item);
        },
        onSelectItem(state: GameState, item: InventoryItem) {
            if (array[index] === item) {
                return;
            }
            if (item.key && (state.inventory[item.key] ?? 0) <= 0) {
                return;
            }
            if (array[index]) {
                addItemToInventory(state, array[index]);
                array[index] = undefined;
            }
            array[index] = item;
            removeItemFromInventory(state, item);
            removeItemFromArray(state.openPanels, chooseMaterialPanel);
        },
        onClose(state: GameState) {
            removeItemFromArray(state.openPanels, chooseMaterialPanel);
        },
    });
    chooseMaterialPanel.x = (canvas.width - chooseMaterialPanel.w) / 2;
    chooseMaterialPanel.y = (canvas.height - chooseMaterialPanel.h) / 2;
    state.openPanels.push(chooseMaterialPanel);
}

function getMaterials(state: GameState, equipmentType: EquipmentType, slotType: CraftingSlotType): InventoryItem[] {
    const materials: InventoryItem[] = [];
    for (const itemKey of typedKeys(state.inventory)) {
        // Keep showing items with 0 quantity here so people can easily see the possible options when crafting.
        //if (!state.inventory[itemKey]) {
        //    continue;
        //}
        const definition = requireItem(itemKey);
        if (equipmentType === 'weapon') {
            if (slotType === 'base' && definition.baseWeaponStats) {
                materials.push(definition);
            }
            if (slotType === 'decoration' && definition.extraWeaponModifiers) {
                materials.push(definition);
            }
        } else if (equipmentType === 'armor') {
            if (slotType === 'base' && definition.baseArmorStats) {
                materials.push(definition);
            }
            if (slotType === 'decoration' && definition.extraArmorModifiers) {
                materials.push(definition);
            }
        } else if (equipmentType === 'charm') {
            if (slotType === 'base' && definition.baseCharmStats) {
                materials.push(definition);
            }
            if (slotType === 'decoration' && definition.extraCharmModifiers) {
                materials.push(definition);
            }
        }
    }
    return materials;
}


export function createCraftedItem(state: GameState, equipmentType: EquipmentType, baseMaterials: (GenericItem|undefined)[], extraMaterials: (GenericItem|undefined)[]): CraftedItem {
    if (equipmentType === 'weapon') {
        return createCraftedWeapon(state, baseMaterials, extraMaterials);
    }
    if (equipmentType === 'armor') {
        return createCraftedArmor(state, baseMaterials, extraMaterials);
    }
    if (equipmentType === 'charm') {
        return createCraftedCharm(state, baseMaterials, extraMaterials);
    }
    return createCraftedWeapon(state, baseMaterials, extraMaterials);
}

export function createCraftedWeapon(state: GameState, baseMaterials: (GenericItem|undefined)[], extraMaterials: (GenericItem|undefined)[]): CraftedWeapon {
    let modifiers: StatModifier[] = [];
    let weaponName = 'Custom Weapon', namePriority = 0, rarity = 0;
    const weapon: CraftedWeapon = {
        name: weaponName,
        equipmentType: 'weapon',
        weaponStats: {damage: 0},
        // If this equipment was crafted, there recipe is stored here.
        // This could be displayed to the user if they want to know how equipment was made.
        // Also allows us to start equipment as recipes on save and recreate the specific stats on load.
        materials: [],
        decorations: [],
        rarity: 0,
    };
    let damageCap = 0;
    for (const material of baseMaterials) {
        if (!material?.key) {
            continue;
        }
        if (!material.baseWeaponStats) {
            console.error(material + " cannot be used as a base material for crafting a weapon");
            continue;
        }
        weapon.materials.push(material.key);
        weapon.weaponStats.damage += material.baseWeaponStats.damage;
        if (material.baseWeaponStats.damageCap > damageCap) {
            damageCap = material.baseWeaponStats.damageCap;
        }
        const materialNamePriority = material.baseWeaponStats.itemLabelPriority ?? material.baseWeaponStats.damageCap;
        if (materialNamePriority > namePriority) {
            namePriority = materialNamePriority;
            weaponName = material.baseWeaponStats.itemLabel ?? (material + " Weapon");
        }

        if (material.baseWeaponStats.modifiers) {
            modifiers = [...modifiers, ...material.baseWeaponStats.modifiers];
        }
        rarity = Math.max(rarity, material.rarity);
    }
    for (const material of extraMaterials) {
        if (!material?.key) {
            continue;
        }
        if (!material.extraWeaponModifiers) {
            console.error(material + " cannot be used as an extra material for crafting a weapon");
            continue;
        }
        weapon.decorations.push(material.key);
        modifiers = [...modifiers, ...material.extraWeaponModifiers];
        rarity = Math.max(rarity, material.rarity);
    }
    // TODO: make weapon type based on the crafting hero.
    weapon.name = weaponName;
    weapon.weaponStats.damage = Math.min(weapon.weaponStats.damage, damageCap);
    weapon.weaponStats.modifiers = modifiers;
    weapon.rarity = rarity;
    return weapon;
}


export function createCraftedArmor(state: GameState, baseMaterials: (GenericItem|undefined)[], extraMaterials: (GenericItem|undefined)[]): CraftedArmor {
    let modifiers: StatModifier[] = [];
    let armorName = 'Custom Armor', namePriority = 0, rarity = 0;
    const armor: CraftedArmor = {
        name: armorName,
        equipmentType: 'armor',
        armorStats: {armor: 0},
        // If this equipment was crafted, there recipe is stored here.
        // This could be displayed to the user if they want to know how equipment was made.
        // Also allows us to start equipment as recipes on save and recreate the specific stats on load.
        materials: [],
        decorations: [],
        rarity,
    };
    let armorCap = 0;
    for (const material of baseMaterials) {
        if (!material?.key) {
            continue;
        }
        if (!material.baseArmorStats) {
            console.error(material + " cannot be used as a base material for crafting a armor");
            continue;
        }
        armor.materials.push(material.key);
        armor.armorStats.armor += material.baseArmorStats.armor;
        if (material.baseArmorStats.armorCap > armorCap) {
            armorCap = material.baseArmorStats.armorCap;
        }
        const materialNamePriority = material.baseArmorStats.itemLabelPriority ?? material.baseArmorStats.armorCap;
        if (materialNamePriority > namePriority) {
            namePriority = materialNamePriority;
            armorName = material.baseArmorStats.itemLabel ?? (material + " Armor");
        }

        if (material.baseArmorStats.modifiers) {
            modifiers = [...modifiers, ...material.baseArmorStats.modifiers];
        }
        rarity = Math.max(rarity, material.rarity);
    }
    for (const material of extraMaterials) {
        if (!material?.key) {
            continue;
        }
        if (!material.extraArmorModifiers) {
            console.error(material + " cannot be used as an extra material for crafting a armor");
            continue;
        }
        armor.decorations.push(material.key);
        modifiers = [...modifiers, ...material.extraArmorModifiers];
    }
    // TODO: make armor type based on the crafting hero.
    armor.name = armorName;
    armor.armorStats.armor = Math.min(armor.armorStats.armor, armorCap);
    armor.armorStats.modifiers = modifiers;
    armor.rarity = rarity;
    return armor;
}

export function createCraftedCharm(state: GameState, baseMaterials: (GenericItem|undefined)[], extraMaterials: (GenericItem|undefined)[]): CraftedCharm {
    let modifiers: StatModifier[] = [];
    let itemName = 'Custom Charm', namePriority = 0, rarity = 0;
    const charm: CraftedCharm = {
        name: itemName,
        equipmentType: 'charm',
        charmStats: {},
        // If this equipment was crafted, there recipe is stored here.
        // This could be displayed to the user if they want to know how equipment was made.
        // Also allows us to start equipment as recipes on save and recreate the specific stats on load.
        materials: [],
        decorations: [],
        rarity,
    };
    for (const material of baseMaterials) {
        if (!material?.key) {
            continue;
        }
        if (!material.baseCharmStats) {
            console.error(material + " cannot be used as a base material for crafting a charm");
            continue;
        }
        const materialNamePriority = material.baseCharmStats.itemLabelPriority ?? material.baseCharmStats.maxDecorations;
        if (materialNamePriority > namePriority) {
            namePriority = materialNamePriority;
            itemName = material.baseCharmStats.itemLabel ?? (material + " Charm");
        }
        charm.materials.push(material.key);

        if (material.baseCharmStats.modifiers) {
            modifiers = [...modifiers, ...material.baseCharmStats.modifiers];
        }
        rarity = Math.max(rarity, material.rarity);
    }
    for (const material of extraMaterials) {
        if (!material?.key) {
            continue;
        }
        if (!material.extraCharmModifiers) {
            console.error(material + " cannot be used as an extra material for crafting a charm");
            continue;
        }
        charm.decorations.push(material.key);
        modifiers = [...modifiers, ...material.extraCharmModifiers];
    }
    charm.name = itemName;
    charm.charmStats.modifiers = modifiers;
    charm.rarity = rarity;
    return charm;
}

function updateMaxDecorationSlots(state: GameState) {
    let maxDecorationSlots = 0;
    for (const baseMaterial of state.craftingBench.baseMaterialSlots) {
        if (!baseMaterial) {
            continue;
        }
        if (state.craftingBench.equipmentType === 'weapon' && baseMaterial.baseWeaponStats) {
            maxDecorationSlots = Math.max(maxDecorationSlots, baseMaterial.baseWeaponStats.maxDecorations);
        }
        if (state.craftingBench.equipmentType === 'armor' && baseMaterial.baseArmorStats) {
            maxDecorationSlots = Math.max(maxDecorationSlots, baseMaterial.baseArmorStats.maxDecorations);
        }
        if (state.craftingBench.equipmentType === 'charm' && baseMaterial.baseCharmStats) {
            maxDecorationSlots = Math.max(maxDecorationSlots, baseMaterial.baseCharmStats.maxDecorations);
        }
    }
    state.craftingBench.maxDecorationSlots = maxDecorationSlots;
    // Return items assigned to any hidden decoration slots back to the inventory.
    for (let i = maxDecorationSlots; i < state.craftingBench.decorationSlots.length; i++) {
        if (state.craftingBench.decorationSlots[i]) {
            addItemToInventory(state, state.craftingBench.decorationSlots[i]);
            state.craftingBench.decorationSlots[i] = undefined;
        }
    }
}
