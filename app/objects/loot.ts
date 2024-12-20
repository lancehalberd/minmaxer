import {lootDefinitions} from 'app/definitions/lootDefinitions';
import {fillCircle} from 'app/utils/draw';

export function createLoot(lootType: LootType, {x, y}: Point): Loot {
    const definition = lootDefinitions[lootType]!;
    const loot: Loot = {
        objectType: 'loot',
        color: definition.color,
        r: definition.r,
        x,
        y,
        update: updateLoot,
        render: renderLoot,
        onPickup: definition.onPickup,
    };
    return loot;
}

export function pickupLoot(state: GameState, hero: Hero, loot: Loot) {
    // Apply the loot to the hero.
    loot.onPickup(state, hero);

    // Remove the picked up loot from the world.
    const lootIndex = state.world.objects.indexOf(loot);
    state.world.objects.splice(lootIndex, 1);
}

export function updateLoot(this: Loot, state: GameState) {
    // Nothing to do here.
    // TODO: Make this disappear after 30 seconds or so.
}

export function renderLoot(this: Loot, context: CanvasRenderingContext2D, state: GameState) {
    fillCircle(context, this);
}
