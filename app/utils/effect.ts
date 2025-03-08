
export function removeEffect(state: GameState, effect: FieldEffect): void {
    const index = effect.zone.effects.indexOf(effect);
    if (index >= 0) {
        effect.zone.effects.splice(index, 1);
    }
}
