import {canvas, context} from 'app/gameConstants'
import {state} from 'app/state';

function render() {
    // Erase the previous frame.
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#CC4';
    context.fillRect(0, 0, canvas.width, canvas.height)

    context.save();
        context.translate(-state.world.camera.x, -state.world.camera.y);
        for (const object of state.world.objects) {
            object.render(context, state);
        }
    context.restore();

    window.requestAnimationFrame(render);
}

export function startRendering() {
    window.requestAnimationFrame(render);
}
