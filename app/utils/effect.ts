
export function removeEffect(state: GameState, effect: FieldEffect): void {
    const index = state.world.effects.indexOf(effect);
    if (index >= 0) {
        state.world.effects.splice(index, 1);
    }
}
