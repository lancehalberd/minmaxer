
function computedIsFunction<T, U>(computed: Computed<T, U>): computed is (state: GameState, object: U) => T {
    return (typeof computed === 'function');
}

export function computeValue<T, U>(state: GameState, object: U, computed: Computed<T, U>|undefined, defaultValue: T): T {
    if (computedIsFunction(computed)) {
        return computed(state, object);
    }
    return computed ?? defaultValue;
}

export function computeResourceCost<T>(state: GameState, object: T, resourceCost: ResourceCost<T>): ComputedResourceCost {
    const computedResourceCost: ComputedResourceCost = {};
    for (const [key, value] of Object.entries(resourceCost) as [ResourceKey, number][]) {
        const computedValue = computeValue(state, object, value, 0);
        if (computedValue) {
            computedResourceCost[key] = computedValue;
        }
    }

    return computedResourceCost;
}
