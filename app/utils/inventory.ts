
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
};

export const toolTypeLabels:{[key in ToolType]: string} = {
    axe: 'Axe',
    hammer: 'Hammer',
    bow: 'Bow',
}
