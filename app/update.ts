import {canvas, context, frameLength} from 'app/gameConstants'
import {state} from 'app/state';
import {updateMouseActions} from 'app/mouse';

function update() {
    updateMouseActions(state);
    for (const object of state.world.objects) {
        object.update(state);
        
        // If the nexus is destroyed, stop update function
        // Pan world.camera to nexus, change background color (gray) and return.
        if (object.objectType === "nexus" && object.health <= 0){
            state.world.camera.x = object.x - canvas.width / 2;
            state.world.camera.y = object.y - canvas.height / 2;
            return;
        }
    }
    // Move the camera so the hero is in the center of the screen:
    state.world.camera.x = state.hero.x - canvas.width / 2;
    state.world.camera.y = state.hero.y - canvas.height / 2;
    state.world.time += 20;
}

export function startUpdating() {
    // Run update at 50FPS (once every 20 milliseconds).
    setInterval(update, frameLength);
}
