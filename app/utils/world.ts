

export function removeFieldObject(state: GameState, object: FieldObject) {
    const objectIndex = state.world.objects.indexOf(object);
    if (objectIndex >= 0) {
        state.world.objects.splice(objectIndex, 1);
    }
}
