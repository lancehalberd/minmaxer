
export function removeItemFromArray<T>(array: T[], item: T): number {
    const index = array.indexOf(item);
        if (index >= 0) {
            array.splice(index, 1);
        }
    return index;
}
