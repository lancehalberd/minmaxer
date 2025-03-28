import {requireItem} from 'app/definitions/itemDefinitions'
import {ChooseItemPanel} from 'app/ui/chooseItemPanel';
import {typedKeys} from 'app/utils/types';



export function toggleInventoryPanel(state: GameState, open = !state.openInventoryPanel) {
    state.openInventoryPanel = open;
}

export const inventoryPanel = new ChooseItemPanel<InventoryItem>({
    title: 'Inventory',
    items(state: GameState) {
        const items: InventoryItem[] = [...state.craftedWeapons, ...state.craftedArmors, ...state.craftedCharms];
        for (const key of typedKeys(state.inventory)) {
            if (!state.inventory[key]) {
                continue;
            }
            items.push(requireItem(key));
        }
        return items;
    },
    onHoverItem(state: GameState, item: InventoryItem) {
        // TODO: Show item description plus weapon/armor/charm stats
        // showArmorTooltip(state, item);
    },
    onSelectItem(state: GameState, item: InventoryItem) {
        // Selecting items in the main inventory panel does nothing currently.
    },
    onClose(state: GameState) {
        toggleInventoryPanel(state, false);
    },
});
