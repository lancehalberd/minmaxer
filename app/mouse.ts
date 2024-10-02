import {canvas} from 'app/gameConstants'
import {state} from 'app/state';
import {isPointInCircle} from 'app/utils/geometry';

let isMouseDownOnCanvas = false;

export function registerMouseEventHandlers() {
    // This event is fired as soon as the mouse button is pressed over the canvas.
    canvas.addEventListener('mousedown', (event: MouseEvent) => {
        isMouseDownOnCanvas = true;
        setMovementTarget(state, event);
    });

    document.addEventListener('mouseup', (event: MouseEvent) => {
        isMouseDownOnCanvas = false;
    });

    canvas.addEventListener('mousemove', (event: MouseEvent) => {
        // Don't do anything if the mouse wasn't pressed over the canvas.
        if (!isMouseDownOnCanvas) {
            return;
        }
        setMovementTarget(state, event);
    });


    canvas.onclick =  function (event: MouseEvent) {
        const worldTarget = convertToWorldPosition(getMousePosition(event, canvas, 3));
        // Check if the user has clicked on an object.
        for (const object of state.world.objects) {
            if (object.objectType !== 'enemy' && object.objectType !== 'spawner') {
                continue;
            }
            // Did they click on this object?
            if (!isPointInCircle(object, worldTarget)) {
                continue;
            }
            state.hero.attackTarget = object;
            delete state.hero.target;
            return;
        }
        // If not attack target was found, set a movement target.
        delete state.hero.attackTarget;
        state.hero.target = worldTarget;
    }
}

function setMovementTarget(state: GameState, event: MouseEvent) {
    const worldTarget = convertToWorldPosition(getMousePosition(event, canvas, 3));
    delete state.hero.attackTarget;
    state.hero.target = worldTarget;
}

function convertToWorldPosition(canvasPoint: Point): Point {
    return {
        x: canvasPoint.x + state.world.camera.x,
        y: canvasPoint.y + state.world.camera.y,
    }
}

export function getMousePosition(event: MouseEvent, container: HTMLElement = null, scale = 1): Point {
    if (container) {
        const containerRect:DOMRect = container.getBoundingClientRect();
        return {
            x: (event.pageX - containerRect.x) / scale,
            y: (event.pageY - containerRect.y) / scale,
        };
    }
    return {x: event.pageX / scale, y: event.pageY / scale};
}
