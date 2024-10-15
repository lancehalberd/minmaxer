import {canvas, context} from 'app/gameConstants'
import {renderField} from 'app/renderField';
import {renderHUD} from 'app/renderHUD';
import {state} from 'app/state';

function render() {
    // Do no render more than once per update.
    if (state.lastTimeRendered < state.time) {
        // Erase the previous frame.
        context.clearRect(0, 0, canvas.width, canvas.height);
        renderField(context, state);
        renderHUD(context, state);
        state.lastTimeRendered = state.time;
    }

    window.requestAnimationFrame(render);
}

export function startRendering() {
    window.requestAnimationFrame(render);
}
