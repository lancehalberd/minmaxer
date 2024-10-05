
export function damageTarget(state: GameState, target: AttackTarget, damage: number) {
    if (damage < 0) {
        return
    }
    target.health = Math.max(0, target.health - damage);
    if (target.health <= 0 && target.objectType !== 'nexus') {
        // remove the object from the state, if not a 'nexus' when it dies.
        const objectIndex = state.world.objects.indexOf(target);
        if (objectIndex >= 0) {
            state.world.objects.splice(objectIndex, 1);
        }
    }
}
