import {requireItem} from 'app/definitions/itemDefinitions'
import {ChooseItemPanel} from 'app/ui/chooseItemPanel';
import {showArmorTooltip, showCharmTooltip, showWeaponTooltip} from 'app/ui/tooltip';
import {addItemToInventory, removeItemFromInventory} from 'app/utils/inventory';
import {isArmor, isCharm, isWeapon, typedKeys} from 'app/utils/types';

const noArmor: Armor = {name: 'None', armorStats: {armor: 0}, rarity: 0};
const noWeapon: Weapon = {name: 'None', weaponStats: {damage: 0}, rarity: 0};
const noCharm: Charm = {name: 'None', charmStats: {}, rarity: 0};



export const chooseArmorPanel = new ChooseItemPanel<Armor>({
    title: 'Choose Armor',
    items(state: GameState) {
        const armor: Armor[] = [noArmor, ...state.craftedArmors];
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
        if (item === noArmor) {
            return;
        }
        showArmorTooltip(state, item);
    },
    onSelectItem(state: GameState, item: Armor) {
        if (state.selectedHero) {
            if (state.selectedHero.equipment.armor && state.selectedHero.equipment.armor !== item) {
                const item = state.selectedHero.unequipArmor(state);
                addItemToInventory(state, item);
            }
            if (item !== noArmor) {
                state.selectedHero.equipArmor(state, item);
                removeItemFromInventory(state, item);
            }
        }
        state.openChooseArmorPanel = false;
    },
    onClose(state: GameState) {
        state.openChooseArmorPanel = false;
    },
});
export const chooseWeaponPanel = new ChooseItemPanel<Weapon>({
    title: 'Choose Weapon',
    items(state: GameState) {
        let weapons: Weapon[] = [noWeapon, ...state.craftedWeapons];
        for (const key of typedKeys(state.inventory)) {
            if (!state.inventory[key]) {
                continue;
            }
            const definition = requireItem(key);
            if (isWeapon(definition)) {
                weapons.push(definition);
            }
        }
        return weapons;
    },
    onHoverItem(state: GameState, item: Weapon) {
        if (item === noWeapon) {
            return;
        }
        showWeaponTooltip(state, item);
    },
    onSelectItem(state: GameState, item: Weapon) {
        if (state.selectedHero) {
            if (state.selectedHero.equipment.weapon && state.selectedHero.equipment.weapon !== item) {
                const item = state.selectedHero.unequipWeapon(state);
                addItemToInventory(state, item);
            }
            if (item !== noWeapon) {
                state.selectedHero.equipWeapon(state, item);
                removeItemFromInventory(state, item);
            }
        }
        state.openChooseWeaponPanel = false;
    },
    onClose(state: GameState) {
        state.openChooseWeaponPanel = false;
    },
});
export const chooseCharmPanel = new ChooseItemPanel<Charm>({
    title: 'Choose Charm',
    items(state: GameState) {
        const charms: Charm[] = [noCharm, ...state.craftedCharms];
        for (const key of typedKeys(state.inventory)) {
            if (!state.inventory[key]) {
                continue;
            }
            const definition = requireItem(key);
            if (isCharm(definition)) {
                charms.push(definition);
            }
        }
        return charms;
    },
    onHoverItem(state: GameState, item: Charm) {
        if (item === noCharm) {
            return;
        }
        showCharmTooltip(state, item);
    },
    onSelectItem(state: GameState, item: Charm) {
        const charmIndex = state.selectedCharmIndex ?? 0;
        if (state.selectedHero) {
            if (state.selectedHero.equipment.charms[charmIndex] && state.selectedHero.equipment.charms[charmIndex] !== item) {
                const item = state.selectedHero.unequipCharm(state, charmIndex);
                addItemToInventory(state, item);
            }
            if (item !== noCharm) {
                state.selectedHero.equipCharm(state, item, charmIndex);
                removeItemFromInventory(state, item);
            }
        }
        state.openChooseCharmPanel = false;
    },
    onClose(state: GameState) {
        state.openChooseCharmPanel = false;
    },
});
