
export function damageTarget(state: GameState, target: AttackTarget, damage: number) {
    if (damage < 0) {
        return
    }
    target.health = Math.max(0, target.health - damage);
    if (target.health <= 0) {
        // remove the object from the state when it dies.
        const objectIndex = state.world.objects.indexOf(target);
        if (objectIndex >= 0) {
            state.world.objects.splice(objectIndex, 1);
        }
    }
}
