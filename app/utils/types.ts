export function typedKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
}

export function isArmor(item: GenericItem): item is Armor {
    return !!item.armorStats;
}
export function isCharm(item: GenericItem): item is Charm {
    return !!item.charmStats;
}
export function isWeapon(item: GenericItem): item is Weapon {
    return !!item.weaponStats;
}
