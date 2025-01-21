
export const inventoryLabels: {[key in InventoryKey]: string} = {
    wood: 'Wood',
    hardwood: 'Hardwood',
    stone: 'Stone',
    ironOre: 'Iron Ore',
    // Wood chopping tools
    woodHatchet: 'Hatchet',
    woodAxe: 'Wood Axe',
    stoneAxe: 'Stone Axe',
    ironHatchet: 'Iron Hatchet',
    steelAxe: 'Steel Axe',
    // Mining tools
    stonePickaxe: 'Stone Pickaxe',
    ironPickaxe: 'Iron Pickaxe',
    steelPickaxe: 'Steel Pickaxe',
    // Building tools
    woodHammer: 'Mallet',
    stoneHammer: 'Stone Hammer',
    ironHammer: 'Iron Hammer',
    steelHammer: 'Steel Hammer',
    // Archery weapons
    shortBow: 'Short Bow',
    longBow: 'Long Bow',
    crossBow: 'Crossbow',
    // Archery ammunition
    woodArrow: 'Wood Arrow',
    flintArrow: 'Flint Arrow',
    ironArrow: 'Iron Arrow',
    steelArrow: 'Steel Arrow',
    // Staff weapons
    woodStaff: 'Wood Staff',
    bronzeStaff: 'Bronze Staff',
    steelStaff: 'Steel Staff',
};

export const toolTypeLabels:{[key in ToolType]: string} = {
    axe: 'Axe',
    hammer: 'Hammer',
    pickaxe: 'Pickaxe',
    bow: 'Bow',
    staff: 'Staff',
}

export function getAvailableToolCount(state: GameState, toolType: ToolType): number {
    if (toolType === 'axe') {
        return state.inventory.woodHatchet + state.inventory.woodAxe + state.inventory.stoneAxe
            + state.inventory.ironHatchet + state.inventory.steelAxe;
    }
    if (toolType === 'hammer') {
        return state.inventory.woodHammer + state.inventory.stoneHammer + state.inventory.ironHammer + state.inventory.steelHammer;
    }
    if (toolType === 'pickaxe') {
        return state.inventory.stonePickaxe + state.inventory.ironPickaxe + state.inventory.steelPickaxe;
    }
    if (toolType === 'bow') {
        return state.inventory.shortBow + state.inventory.longBow + state.inventory.crossBow;
    }
    if (toolType === 'staff') {
        return state.inventory.woodStaff + state.inventory.bronzeStaff + state.inventory.steelStaff;
    }
    // This will cause a compiler failure if a toolType is not handled above.
    const never: never = toolType;
    return never;
}
