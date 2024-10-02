import {canvas} from 'app/gameConstants'
import {state} from 'app/state';
import {isPointInCircle} from 'app/utils/geometry';

let isMouseDownOnCanvas = false, lastMouseDownPosition: Point, lastMouseUpPosition: Point;
let lastMousePosition: Point = {x: 0, y: 0};

export function registerMouseEventHandlers() {
    // This event is fired as soon as the mouse button is pressed over the canvas.
    canvas.addEventListener('mousedown', (event: MouseEvent) => {
        isMouseDownOnCanvas = true;
        lastMousePosition = getMousePosition(event, canvas, 3);
        lastMouseDownPosition = lastMousePosition;
    });

    document.addEventListener('mouseup', (event: MouseEvent) => {
        isMouseDownOnCanvas = false;
        lastMousePosition = getMousePosition(event, canvas, 3);
        lastMouseUpPosition = lastMousePosition;
    });

    canvas.addEventListener('mousemove', (event: MouseEvent) => {
        lastMousePosition = getMousePosition(event, canvas, 3);
    });
}

// Returns the highest priority mouse target under the given screen point.
function getTargetAtScreenPoint(state: GameState, screenPoint: Point): MouseTarget {
    const worldPoint = convertToWorldPosition(screenPoint);
    for (const object of state.world.objects) {
        if (object.objectType !== 'enemy' && object.objectType !== 'spawner') {
            continue;
        }
        if (isPointInCircle(object, worldPoint)) {
            return object;
        }
    }
}

export function updateMouseActions(state: GameState) {
    state.mouse.currentPosition = lastMousePosition;
    // Trigger a click any time lastMouseUpPosition has been set since the last time we updated.
    if (lastMouseUpPosition) {
        // If state.mouse.mouseDownPosition was set assume the click started at this position.
        // We definitely want to use this value if the user has released the mouse and pressed
        // again since the last update, in which the new press should have no bearing on the
        // click action, and this also works well enough for all other cases with additional
        // presses+releases as we only process a maximum of one click action per frame.
        const downPoint = state.mouse.mouseDownPosition
            || lastMouseDownPosition
            || lastMousePosition;
        handleMouseClick(state, downPoint, lastMouseUpPosition);
    }
    // Make sure that state.mouse.mouseDownPosition and state.mouse.mouseDownTarget
    // are set consistently with the current state of the mouse and the mose recent position
    // that we recorded a mouse down event on the canvas.
    if (isMouseDownOnCanvas) {
        const previousMouseDownPosition = state.mouse.mouseDownPosition;
        state.mouse.mouseDownPosition = lastMouseDownPosition
            || state.mouse.mouseDownPosition
            || lastMousePosition;
        // Update state.mouse.mouseDownTarget any time state.mouse.mouseDownPosition is changed.
        if (previousMouseDownPosition !== state.mouse.mouseDownPosition) {
            state.mouse.mouseDownTarget = getTargetAtScreenPoint(state, state.mouse.mouseDownPosition);
        }
    } else {
        delete state.mouse.mouseDownPosition;
        delete state.mouse.mouseDownTarget;
    }
    // Delete these values to track that they have been processed.
    lastMouseUpPosition = undefined;
    lastMouseDownPosition = undefined;

    // If the user clicks anywhere on the world that has no mouse target and holds,
    // they will set the movement target to the current mouse position every frame.
    if (state.mouse.mouseDownPosition && !state.mouse.mouseDownTarget) {
        setMovementTarget(state, state.mouse.currentPosition);
    }
}
function handleMouseClick(state: GameState, down: Point, up: Point) {
    const worldDownPoint = convertToWorldPosition(down);
    const worldUpPoint = convertToWorldPosition(up);
    // Check if the user has clicked on an object by checking if the object
    // intersects both with where the user pressed and released the mouse.
    for (const object of state.world.objects) {
        if (object.objectType !== 'enemy' && object.objectType !== 'spawner') {
            continue;
        }
        // Did they click on this object?
        if (!isPointInCircle(object, worldDownPoint) || ! isPointInCircle(object, worldUpPoint)) {
            continue;
        }
        // Currently the only supported action is attacking an attackable target.
        state.hero.attackTarget = object;
        delete state.hero.target;
        return;
    }
}

function setMovementTarget(state: GameState, mousePosition: Point) {
    const worldTarget = convertToWorldPosition(mousePosition);
    delete state.hero.attackTarget;
    state.hero.target = worldTarget;
}

function convertToWorldPosition(canvasPoint: Point): Point {
    return {
        x: canvasPoint.x + state.world.camera.x,
        y: canvasPoint.y + state.world.camera.y,
    }
}

function getMousePosition(event: MouseEvent, container: HTMLElement = null, scale = 1): Point {
    if (container) {
        const containerRect:DOMRect = container.getBoundingClientRect();
        return {
            x: (event.pageX - containerRect.x) / scale,
            y: (event.pageY - containerRect.y) / scale,
        };
    }
    return {x: event.pageX / scale, y: event.pageY / scale};
}
