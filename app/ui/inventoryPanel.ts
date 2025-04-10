import {requireItem} from 'app/definitions/itemDefinitions'
import {ChooseItemList} from 'app/ui/chooseItemPanel';
import {PanelPadding, TabbedPanel} from 'app/ui/panel';
import {showArmorTooltip, showCharmTooltip, showWeaponTooltip} from 'app/ui/tooltip';
import {addItemToInventory, isTool, removeItemFromInventory} from 'app/utils/inventory';
import {isArmor, isCharm, isWeapon, typedKeys} from 'app/utils/types';


export function toggleInventoryPanel(state: GameState, open = !state.openInventoryPanel) {
    state.openInventoryPanel = open;
}

const allItemsList = new ChooseItemList<InventoryItem>({
    items(state: GameState) {
        const items: InventoryItem[] = [...state.craftedWeapons, ...state.craftedArmors, ...state.craftedCharms];
        for (const key of typedKeys(state.inventory)) {
            if (!state.inventory[key]) {
                continue;
            }
            items.push(requireItem(key));
        }
        return items;
    }
});

const toolsList = new ChooseItemList<InventoryItem>({
    items(state: GameState) {
        const items: InventoryItem[] = [...state.craftedWeapons, ...state.craftedArmors, ...state.craftedCharms];
        for (const key of typedKeys(state.inventory)) {
            if (!state.inventory[key] || !isTool(key)) {
                continue;
            }
            items.push(requireItem(key));
        }
        return items;
    }
});

const materialsList = new ChooseItemList<InventoryItem>({
    items(state: GameState) {
        const items: InventoryItem[] = [...state.craftedWeapons, ...state.craftedArmors, ...state.craftedCharms];
        for (const key of typedKeys(state.inventory)) {
            if (!state.inventory[key]) {
                continue;
            }
            const item = requireItem(key);
            if (item.baseWeaponStats || item.extraWeaponModifiers
                || item.baseArmorStats || item.extraArmorModifiers
                || item.baseCharmStats || item.extraCharmModifiers
            ) {
                items.push(requireItem(key));
            }
        }
        return items;
    }
});

const armorList = new ChooseItemList<Armor>({
    items(state: GameState) {
        const armor: Armor[] = [...state.craftedArmors];
        for (const key of typedKeys(state.inventory)) {
            if (!state.inventory[key]) {
                continue;
            }
            const definition = requireItem(key);
            if (isArmor(definition)) {
                armor.push(definition);
            }
        }
        return armor;
    },
    onHoverItem(state: GameState, item: Armor) {
        showArmorTooltip(state, item);
    },
    onSelectItem(state: GameState, item: Armor) {
        if (state.selectedHero) {
            if (state.selectedHero.equipment.armor && state.selectedHero.equipment.armor !== item) {
                const item = state.selectedHero.unequipArmor(state);
                addItemToInventory(state, item);
            }
            state.selectedHero.equipArmor(state, item);
            removeItemFromInventory(state, item);
        }
        state.openCharacterPanel = true;
    },
});

const weaponsList = new ChooseItemList<Weapon>({
    items(state: GameState) {
        const weapon: Weapon[] = [...state.craftedWeapons];
        for (const key of typedKeys(state.inventory)) {
            if (!state.inventory[key]) {
                continue;
            }
            const definition = requireItem(key);
            if (isWeapon(definition)) {
                weapon.push(definition);
            }
        }
        return weapon;
    },
    onHoverItem(state: GameState, item: Weapon) {
        showWeaponTooltip(state, item);
    },
    onSelectItem(state: GameState, item: Weapon) {
        if (state.selectedHero) {
            if (state.selectedHero.equipment.weapon && state.selectedHero.equipment.weapon !== item) {
                const item = state.selectedHero.unequipWeapon(state);
                addItemToInventory(state, item);
            }
            state.selectedHero.equipWeapon(state, item);
            removeItemFromInventory(state, item);
        }
        state.openCharacterPanel = true;
    },
});

const charmsList = new ChooseItemList<Charm>({
    items(state: GameState) {
        const weapon: Charm[] = [...state.craftedCharms];
        for (const key of typedKeys(state.inventory)) {
            if (!state.inventory[key]) {
                continue;
            }
            const definition = requireItem(key);
            if (isCharm(definition)) {
                weapon.push(definition);
            }
        }
        return weapon;
    },
    onHoverItem(state: GameState, item: Charm) {
        showCharmTooltip(state, item);
    },
    onSelectItem(state: GameState, item: Charm) {
        state.openCharacterPanel = true;
    },
});

export const inventoryPanel = new TabbedPanel({
    w: 400,
    tabs(state: GameState) {
        const tabs = [{
            title: 'All Items',
            content: new PanelPadding(allItemsList),
        },{
            title: 'Tools',
            content: new PanelPadding(toolsList),
        },{
            title: 'Materials',
            content: new PanelPadding(materialsList),
        },{
            title: 'Weapons',
            content: new PanelPadding(weaponsList),
        },{
            title: 'Armor',
            content: new PanelPadding(armorList),
        },{
            title: 'Charms',
            content: new PanelPadding(charmsList),
        }];
        return tabs;
    },
    onClose(state: GameState) {
        toggleInventoryPanel(state, false);
    }
});
