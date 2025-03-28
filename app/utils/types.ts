export function typedKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
}

export function isArmor(item: GenericItem): item is Armor {
    return !!item.armorStats;
}
export function isCraftedArmor(item: GenericItem): item is CraftedArmor {
    if (!item.armorStats) {
        return false;
    }
    return !!(item as CraftedArmor).materials && !!(item as CraftedArmor).decorations;
}
export function isCharm(item: GenericItem): item is Charm {
    return !!item.charmStats;
}
export function isCraftedCharm(item: GenericItem): item is CraftedCharm {
    if (!item.charmStats) {
        return false;
    }
    return !!(item as CraftedCharm).materials && !!(item as CraftedCharm).decorations;
}
export function isWeapon(item: GenericItem): item is Weapon {
    return !!item.weaponStats;
}
export function isCraftedWeapon(item: GenericItem): item is CraftedWeapon {
    if (!item.weaponStats) {
        return false;
    }
    return !!(item as CraftedWeapon).materials && !!(item as CraftedWeapon).decorations;
}
