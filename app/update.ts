import {frameLength} from 'app/gameConstants'
import {checkToAddNewSpawner} from 'app/objects/spawner';
import {state} from 'app/state';
import {updateMouseActions} from 'app/mouse';

function update() {
    // Reset the essence preview every frame so it doesn't get stale.
    state.nexus.previewEssenceChange = 0;
    updateMouseActions(state);

    // If the nexus is destroyed, stop update function
    // Pan world.camera to nexus, change background color (gray) and return.
    if (state.nexus.essence <= 0) {
        if (state.selectedHero){
            console.log(`Selected hero defeated ${state.selectedHero.enemyDefeatCount} enemies in total`);
            delete state.selectedHero;
        }
    } else {
        checkToAddNewSpawner(state);
        // Don't update the world objects until a hero is selected.
        if (state.selectedHero) {
            for (const object of state.world.objects) {
                object.update(state);
            }
        }
        state.world.time += 20;
    }


    updateCamera(state);

    // Advance state time, game won't render anything new if this timer isn't updated.
    state.time += 20;
}

function updateCamera(state: GameState) {
    const camera = state.world.camera;
    // Move the camera so the hero is in the center of the screen:
    // TODO: the camera should not follow the hero once we support moving the camera.
    if (state.nexus.essence <= 0) {
        camera.speed = 400;
        camera.target.x = state.nexus.x;
        camera.target.y = state.nexus.y;
    } else if (state.selectedHero) {
        camera.target.x = state.selectedHero.x;
        camera.target.y = state.selectedHero.y;
    } else {
        // Start centered on the nexus immediately.
        camera.x = state.nexus.x;
        camera.y = state.nexus.y;
    }
    // How many pixels the camera moves per frame.
    const pixelsPerFrame = camera.speed * frameLength / 1000;
    const dx = camera.target.x - camera.x, dy = camera.target.y - camera.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag < pixelsPerFrame) {
        camera.x = camera.target.x;
        camera.y = camera.target.y;
    } else {
        camera.x += pixelsPerFrame * dx / mag;
        camera.y += pixelsPerFrame * dy / mag;
    }
}

export function startUpdating() {
    // Run update at 50FPS (once every 20 milliseconds).
    setInterval(update, frameLength);
}
