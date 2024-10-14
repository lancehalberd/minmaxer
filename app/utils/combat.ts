import {loseEssence} from 'app/objects/nexus';
export function damageTarget(state: GameState, target: AttackTarget, damage: number) {
    if (damage < 0) {
        return
    }
    if (target.objectType === 'nexus') {
        loseEssence(state, damage);
        return;
    }
    target.health = Math.max(0, target.health - damage);
    if (target.health <= 0) {
        // remove the object from the state, if not a 'nexus' when it dies.
        const objectIndex = state.world.objects.indexOf(target);
        if (objectIndex >= 0) {
            state.world.objects.splice(objectIndex, 1);
        }
    }
}

// Returns whether a target is still available to attack.
export function isTargetAvailable(state: GameState, target: AttackTarget): boolean {
    if (target.objectType === 'nexus') {
        return true;
    }
    return target.health > 0;
}
