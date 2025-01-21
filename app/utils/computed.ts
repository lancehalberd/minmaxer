
function computedIsFunction<T, U>(computed: Computed<T, U>): computed is (state: GameState, object: U) => T {
    return (typeof computed === 'function');
}

export function computeValue<T, U>(state: GameState, object: U, computed: Computed<T, U>|undefined, defaultValue: T): T {
    if (computedIsFunction(computed)) {
        return computed(state, object);
    }
    return computed ?? defaultValue;
}

export function computeResourceCost<T>(state: GameState, object: T, resourceCost: Computed<ResourceCost<T>, T>): ComputedResourceCost {
    // Run compute against the resource object itself, in case it is dynamic.
    const computedResourceCost: ResourceCost<T> = computeValue(state, object, resourceCost, {});
    // This stores the concrete results of the computation which will be returned.
    const fullyComputedResourceCost: ComputedResourceCost = {};
    for (const [key, value] of Object.entries(computedResourceCost)) {
        // Compute each individual resource cost.
        const computedValue = computeValue(state, object, value, 0);
        if (computedValue) {
            fullyComputedResourceCost[key as ResourceKey] = computedValue;
        }
    }
    return fullyComputedResourceCost;
}
