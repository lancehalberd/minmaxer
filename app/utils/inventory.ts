import {requireItem} from 'app/definitions/itemDefinitions'
import {createAnimation} from 'app/utils/animations';
import {removeItemFromArray} from 'app/utils/array';
import {isCraftedWeapon, isCraftedArmor, isCraftedCharm} from 'app/utils/types';

export const toolTypes: ToolType[] = ['axe', 'hammer', 'pickaxe', 'bow', 'staff'];
export const toolTypeLabels:{[key in ToolType]: string} = {
    axe: 'Axe',
    hammer: 'Hammer',
    pickaxe: 'Pickaxe',
    bow: 'Bow',
    staff: 'Staff',
}

export const [hammerIcon, axeIcon, pickaxeIcon, staffIcon, bowIcon] = createAnimation('gfx/toolTypes.png', {w: 16, h: 16}, {cols: 5}).frames;
export const toolTypeIcons:{[key in ToolType]: Frame} = {
    axe: axeIcon,
    hammer: hammerIcon,
    pickaxe: pickaxeIcon,
    bow: bowIcon,
    staff: staffIcon,
}
export function getToolIcon(toolType: ToolType): Frame {
    return toolTypeIcons[toolType];
}

export const axeTypes: AxeType[] = ['woodHatchet', 'stoneAxe', 'ironHatchet', 'steelAxe'];
export const hammerTypes: HammerType[] = ['woodHammer', 'stoneHammer', 'ironHammer', 'steelHammer'];
export const pickaxeTypes: PickaxeType[] = ['stonePickaxe', 'ironPickaxe', 'steelPickaxe'];
export const bowTypes: BowType[] = ['shortBow', 'longBow', 'crossbow'];
export const staffTypes: StaffType[] = ['woodStaff', 'bronzeStaff', 'steelStaff'];

export function getItemLabel(itemKey: InventoryKey): string {
    return requireItem(itemKey).name;
}

export function getItemCount(state: GameState, key: InventoryKey): number {
    return state.inventory[key] ?? 0;
}
export function sumItemCount(state: GameState, keys: InventoryKey[]): number {
    let sum = 0;
    for (const key of keys) {
        sum += state.inventory[key] ?? 0;
    }
    return sum;
}

export function getAvailableToolCount(state: GameState, toolType: ToolType): number {
    if (toolType === 'axe') {
        return sumItemCount(state, axeTypes);
    }
    if (toolType === 'hammer') {
        return sumItemCount(state, hammerTypes);
    }
    if (toolType === 'pickaxe') {
        return sumItemCount(state, pickaxeTypes);
    }
    if (toolType === 'bow') {
        return sumItemCount(state, bowTypes);
    }
    if (toolType === 'staff') {
        return sumItemCount(state, staffTypes);
    }
    // This will cause a compiler failure if a toolType is not handled above.
    const never: never = toolType;
    return never;
}

export function computeIdleToolCounts(state: GameState): void {
    for (const toolType of toolTypes) {
        state.city.idleToolCounts[toolType] = getAvailableToolCount(state, toolType);
    }
    state.city.idlePopulation = state.city.population;
    for (const job of Object.values(state.city.jobs)) {
        // Automatically cut workers if there are not enough people left to work them.
        // In theory this shouldn't happen unless a mechanic that reduces population is added.
        if (state.city.idlePopulation < job.workers) {
            job.workers = state.city.idlePopulation;
        }
        state.city.idlePopulation -= job.workers;
        const requiredToolType = job.definition.requiredToolType;
        if (requiredToolType) {
            // Automatically cut workers if there are not enough people left to work them.
            // This might happen if the player sells or equips a tool.
            if (state.city.idleToolCounts[requiredToolType] < job.workers) {
                job.workers = state.city.idleToolCounts[requiredToolType];
            }
            state.city.idleToolCounts[requiredToolType] -= job.workers;
        }
    }
}


export function computeJobMultiplier(state: GameState, workerCount: number, toolTypes: InventoryKey[]) {
    let sum = 0;
    for (let i = toolTypes.length; i > 0; i--) {
        const toolBonus = i;
        const toolCount = state.inventory[toolTypes[i - 1]] ?? 0;
        if (toolCount < workerCount) {
            sum += toolBonus * toolCount;
            workerCount -= toolCount;
        } else {
            sum += toolBonus * workerCount;
            return sum;
        }
    }
    return sum;
}
window.computeJobMultiplier = computeJobMultiplier;

export function getJobMultiplierFromTools(state: GameState, workerCount: number, toolType?: ToolType): number {
    if (!toolType) {
        return workerCount;
    }
    if (toolType === 'axe') {
        return computeJobMultiplier(state, workerCount, axeTypes);
    }
    if (toolType === 'hammer') {
        return computeJobMultiplier(state, workerCount, hammerTypes);
    }
    if (toolType === 'pickaxe') {
        return computeJobMultiplier(state, workerCount, pickaxeTypes);
    }
    if (toolType === 'bow') {
        return computeJobMultiplier(state, workerCount, bowTypes);
    }
    if (toolType === 'staff') {
        return computeJobMultiplier(state, workerCount, staffTypes);
    }
    // This will cause a compiler failure if a toolType is not handled above.
    const never: never = toolType;
    return never as never;
}

export function addItemToInventory(state: GameState, item?: InventoryItem) {
    if (!item) {
        return;
    }
    if (item.key){
        state.inventory[item.key] = (state.inventory[item.key] ?? 0) + 1;
    } else if (isCraftedWeapon(item)) {
        state.craftedWeapons.push(item);
    } else if (isCraftedArmor(item)) {
        state.craftedArmors.push(item);
    } else if (isCraftedCharm(item)) {
        state.craftedCharms.push(item);
    } else {
        console.error('Failed to add item to inventory', item);
        debugger;
    }
}

export function removeItemFromInventory(state: GameState, item?: InventoryItem) {
    if (!item) {
        return;
    }
    if (item.key){
        state.inventory[item.key] = (state.inventory[item.key] ?? 0) - 1;
    } else if (isCraftedWeapon(item)) {
        removeItemFromArray(state.craftedWeapons, item);
    } else if (isCraftedArmor(item)) {
        removeItemFromArray(state.craftedArmors, item);
    } else if (isCraftedCharm(item)) {
        removeItemFromArray(state.craftedCharms, item);
    } else {
        console.error('Failed to add item to inventory', item);
        debugger;
    }
}
