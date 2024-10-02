import {canvas, frameLength} from 'app/gameConstants'
import {state} from 'app/state';

function update() {
    for (const object of state.world.objects) {
        object.update(state);
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
