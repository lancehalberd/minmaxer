import {frameLength} from 'app/gameConstants'
import {state} from 'app/state';
import {updateMouseActions} from 'app/mouse';

function update() {
    // Reset the essence preview every frame so it doesn't get stale.
    state.nexus.previewEssenceChange = 0;
    updateMouseActions(state);

    // If the nexus is destroyed, stop update function
    // Pan world.camera to nexus, change background color (gray) and return.
    if (state.nexus.essence <= 0){
        state.world.camera.x = state.nexus.x;
        state.world.camera.y = state.nexus.y;
        if (state.selectedHero){
            console.log(`Selected hero defeated ${state.selectedHero.enemyDefeatCount} enemies in total`);
            delete state.selectedHero;
        }
        return;
    }

    // Don't update the world objects until a hero is selected.
    if (state.selectedHero) {
        for (const object of state.world.objects) {
            object.update(state);

        }
    }

    // Move the camera so the hero is in the center of the screen:
    // TODO: the camera should not follow the hero once we support moving the camera.
    if (state.selectedHero) {
        state.world.camera.x = state.selectedHero.x;
        state.world.camera.y = state.selectedHero.y;
    } else {
        state.world.camera.x = state.nexus.x;
        state.world.camera.y = state.nexus.y;
    }

    // Advance timers
    state.time += 20;
    state.world.time += 20;
}

export function startUpdating() {
    // Run update at 50FPS (once every 20 milliseconds).
    setInterval(update, frameLength);
}
