import {canvas, canvasScale} from 'app/gameConstants'
import {isAbilityTargetValid} from 'app/utils/combat';
import {convertToWorldPosition, isPointInCircle, isPointInRect} from 'app/utils/geometry';

let isMouseDownOnCanvas = false, lastMouseDownPosition: Point|undefined, lastMouseUpPosition: Point|undefined;
let lastMousePosition: Point = {x: 0, y: 0};

export function registerMouseEventHandlers() {
    // This event is fired as soon as the mouse button is pressed over the canvas.
    canvas.addEventListener('mousedown', (event: MouseEvent) => {
        isMouseDownOnCanvas = true;
        lastMousePosition = getMousePosition(event, canvas, canvasScale);
        lastMouseDownPosition = lastMousePosition;
    });

    document.addEventListener('mouseup', (event: MouseEvent) => {
        isMouseDownOnCanvas = false;
        lastMousePosition = getMousePosition(event, canvas, canvasScale);
        lastMouseUpPosition = lastMousePosition;
    });

    canvas.addEventListener('mousemove', (event: MouseEvent) => {
        lastMousePosition = getMousePosition(event, canvas, canvasScale);
    });
}

function convertToWorldTarget(state: GameState, canvasPoint: Point): LocationTarget {
    return {
        objectType: 'point',
        ...convertToWorldPosition(state, canvasPoint),
        r: 0,
    }
}


// Returns the highest priority mouse target under the given screen point.
function getTargetAtScreenPoint(state: GameState, screenPoint: Point): MouseTarget {
    // First, check for HUD elements.
    for (const button of [...state.hudButtons].reverse()) {
        if (isPointInRect(button, screenPoint)) {
            return button;
        }
    }

    // Second, check for button elements in the field.
    const locationTarget = convertToWorldTarget(state, screenPoint);
    for (const object of [...state.world.objects].reverse()) {
        if (!object.getFieldButtons) {
            continue;
        }
        for (const button of [...object.getFieldButtons(state)].reverse()) {
            if (isPointInRect(button, locationTarget)) {
                return button;
            }
        }
    }

    // Last, check for clickable targets in the field.
    for (const object of [...state.world.objects].reverse()) {
        if (isPointInCircle(object, locationTarget)) {
            return object;
        }
    }

    return locationTarget;
}
function isScreenPointOverTarget(state: GameState, screenPoint: Point, target: MouseTarget): boolean {
    const worldPoint = convertToWorldPosition(state, screenPoint);
    if (target.objectType === 'button') {
        return isPointInRect(target, worldPoint);
    }
    if (target.objectType === 'point') {
        return false;
    }
    return isPointInCircle(target, worldPoint);
}

export function isMouseOverTarget(state: GameState, target: MouseTarget): boolean {
    const hoverTarget = state.mouse.mouseHoverTarget;
    if (!hoverTarget) {
        return false;
    }
    if (hoverTarget === target) {
        return true;
    }
    if (target.objectType === 'button' && hoverTarget.objectType === 'button') {
        return hoverTarget.uniqueId === target.uniqueId;
    }
    return false;
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
            const target = getTargetAtScreenPoint(state, state.mouse.mouseDownPosition);
            state.mouse.mouseDownTarget = target;
            // Trigger the effect of a button.
            if (target?.objectType === 'button') {
                target.onPress?.(state);
            } else if (state.selectedHero) {
                if (state.selectedAbility) {
                    const definition = state.selectedAbility.definition;
                    if (definition.abilityType === 'activeAbility') {
                        const targetingInfo = definition.getTargetingInfo(state, state.selectedHero, state.selectedAbility);
                        if (isAbilityTargetValid(state, targetingInfo)) {
                            if (targetingInfo.moveToTarget) {
                                // Assign the ability action to the hero if they should move until the
                                // target is in range.
                                state.selectedHero.abilityTarget = target
                                state.selectedHero.selectedAbility = state.selectedAbility;
                            } else {
                                // Activate the ability immediately if the hero should just use it where they are
                                // standing.
                                definition.onActivate(state, state.selectedHero, state.selectedAbility, target);
                                state.selectedAbility.cooldown = definition.getCooldown(state, state.selectedHero, state.selectedAbility);
                            }
                            delete state.selectedAbility;
                            state.mouse.pressHandled = true;
                        }
                    }
                } else if (target?.objectType === 'enemy' || target?.objectType === 'spawner') {
                    // Default action is to make the enemy an attack target.
                    // Make the selected hero attack an enemy target.
                    state.selectedHero.attackTarget = target;
                    state.selectedHero.selectedAttackTarget = target;
                    delete state.selectedHero.movementTarget;
                }
            }
        }
    } else {
        delete state.mouse.mouseDownPosition;
        delete state.mouse.mouseDownTarget;
        delete state.mouse.pressHandled;
    }
    // Delete these values to track that they have been processed.
    lastMouseUpPosition = undefined;
    lastMouseDownPosition = undefined;

    // If the user clicks anywhere on the world that has no mouse target and holds,
    // they will set the movement target to the current mouse position every frame.
    if (state.mouse.mouseDownTarget?.objectType === 'point' && !state.mouse.pressHandled) {
        setMovementTarget(state, state.mouse.currentPosition);
    }
    delete state.mouse.mouseHoverTarget;
    if (!state.mouse.mouseDownPosition) {
        const target = getTargetAtScreenPoint(state, state.mouse.currentPosition);
        state.mouse.mouseHoverTarget = target;
        if (target?.objectType === 'button') {
            target.onHover?.(state);
        }
    }
}

function handleMouseClick(state: GameState, down: Point, up: Point) {
    const target = getTargetAtScreenPoint(state, down);
    if (!target || !isScreenPointOverTarget(state, up, target)) {
        return;
    }
    // Trigger the effect of a button.
    if (target.objectType === 'button') {
        target.onClick?.(state);
    }
    // Check if the user has clicked on an object by checking if the object
    // intersects both with where the user pressed and released the mouse.
    /*for (const object of state.world.objects) {
        if (object.objectType !== 'enemy' && object.objectType !== 'spawner') {
            continue;
        }
        // Did they click on this object?
        if (!isPointInCircle(object, worldDownPoint) || ! isPointInCircle(object, worldUpPoint)) {
            continue;
        }
        // Currently the only supported action is attacking an attackable target.
        if (state.selectedHero) {
        }
        return;
    }*/
}

function setMovementTarget(state: GameState, canvasPoint: Point) {
    const locationTarget = convertToWorldTarget(state, canvasPoint);
    if (state.selectedHero) {
        delete state.selectedHero.attackTarget;
        delete state.selectedHero.selectedAttackTarget
        state.selectedHero.movementTarget = locationTarget;
    }
}

function getMousePosition(event: MouseEvent, container?: HTMLElement, scale = 1): Point {
    if (container) {
        const containerRect:DOMRect = container.getBoundingClientRect();
        return {
            x: (event.pageX - containerRect.x) / scale,
            y: (event.pageY - containerRect.y) / scale,
        };
    }
    return {x: event.pageX / scale, y: event.pageY / scale};
}
