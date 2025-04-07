import {canvas, canvasScale} from 'app/gameConstants'
import {useHeroAbility} from 'app/utils/ability';
import {isAbilityMouseTargetValid} from 'app/utils/combat';
import {isPointInCircle, isPointInRect} from 'app/utils/geometry';
import {convertToZoneLocation} from 'app/utils/world';

let isMouseDownOnCanvas = false, lastMouseDownPosition: Point|undefined, lastMouseUpPosition: Point|undefined;
let lastMousePosition: Point = {x: 300, y: 300}, isMouseOverCanvas = false;

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
        isMouseOverCanvas = true;
    });
    canvas.addEventListener('mouseout', (event: MouseEvent) => {
        isMouseOverCanvas = false;
    });
}

function convertToWorldTarget(state: GameState, canvasPoint: Point): LocationTarget {
    return {
        objectType: 'point',
        ...convertToZoneLocation(state, canvasPoint),
        r: 0,
    }
}

// Recursively find an interactive element from the list of elements or their descendants.
function getMouseElementAtPoint(state: GameState, point: Point, elements: UIElement[]): MouseTarget|null {
    // const locationTarget = convertToWorldTarget(state, screenPoint);
    for (const element of [...elements].reverse()) {
        if (element.getChildren) {
            const childPoint = {x: point.x - element.x, y: point.y - element.y};
            const target = getMouseElementAtPoint(state, childPoint, element.getChildren(state));
            if (target){
                return target;
            }
        }
        if (isPointInRect(element, point)) {
            return element;
        }
    }
    return null;
}


// Returns the highest priority mouse target under the given screen point.
function getTargetAtScreenPoint(state: GameState, screenPoint: Point): MouseTarget {
    // First, check for HUD elements.
    const hudTarget = getMouseElementAtPoint(state, screenPoint, state.hudUIElements);
    if (hudTarget) {
        return hudTarget;
    }

    // Second, check for button elements in the field.
    // These use the world location of the mouse point, since these elements use world coordinates.
    const locationTarget = convertToWorldTarget(state, screenPoint);
    const renderedZone = state.camera.zone;
    const sortedObjects = [...renderedZone.objects];
    sortedObjects.sort((A, B) => B.y - A.y);
    for (const object of sortedObjects) {
        if (!object.getChildren) {
            continue;
        }
        const target = getMouseElementAtPoint(state, locationTarget, object.getChildren(state));
        if (target) {
            return target;
        }
    }

    // Last, check for clickable targets in the field.
    for (const object of sortedObjects) {
        if (isPointInCircle(object, locationTarget)) {
            return object;
        }
    }

    return locationTarget;
}
// TODO: We don't know if the target is in world coordinates or screen coordinates so we just check both.
// This could probably cause undesirable results in some situations.
/*function isScreenPointOverTarget(state: GameState, screenPoint: Point, target: MouseTarget): boolean {
    const worldPoint = convertToZoneLocation(state, screenPoint);
    if (target.zone && target.zone !== state.camera.zone) {
        return false;
    }
    if (target.objectType === 'uiButton' || target.objectType === 'uiContainer') {
        const localPoint = convertToLocalPoint(state, target, screenPoint);
        if (!localPoint) {
            return false;
        }
        return isPointInRect(target, localPoint);
    }
    if (target.objectType === 'point') {
        return false;
    }
    return isPointInCircle(target, worldPoint);
}*/
/*
function convertToLocalPoint(state: GameState, target: UIElement, point: Point): Point|false {
    if (target.zone) {
        if (target.zone !== state.camera.zone) {
            return false;
        }
        return convertToZoneLocation(state, point);
    }
    if (target.parent) {
        const localPoint = convertToLocalPoint(state, target.parent, point);
        if (!localPoint) {
            return false;
        }
        localPoint.x -= target.parent.x;
        localPoint.y -= target.parent.y;
        return localPoint;
    }
    return {...point};
}*/

export function isMouseOverTarget(state: GameState, target: MouseTarget): boolean {
    const hoverTarget = state.mouse.mouseHoverTarget;
    if (!hoverTarget) {
        return false;
    }
    if (hoverTarget === target) {
        return true;
    }
    if (target.objectType === 'uiButton' || target.objectType === 'uiContainer') {
        if (hoverTarget.objectType !== target.objectType) {
            return false;
        }
        return !!target.uniqueId && hoverTarget.uniqueId === target.uniqueId;
    }
    return false;
}

export function updateMouseActions(state: GameState) {
    state.mouse.currentPosition = lastMousePosition;
    state.mouse.isOverCanvas = isMouseOverCanvas;
    // Trigger a click any time lastMouseUpPosition has been set since the last time we updated.
    if (lastMouseUpPosition && !state.mouse.pressHandled) {
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
            checkToHandleMousePress(state);
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
        if (target?.objectType === 'uiButton' || target?.objectType === 'uiContainer') {
            target.onHover?.(state);
        }
    }
}

function checkToHandleMousePress(state: GameState) {
    const target = state.mouse.mouseDownTarget;
    if (state.mouse.pressHandled || !target) {
        return;
    }
    // Trigger the effect of a button.
    if (target?.objectType === 'uiButton' || target?.objectType === 'uiContainer') {
        state.mouse.pressHandled = target.onPress?.(state);
    } else if (state.selectedAbility?.abilityType === 'activeNexusAbility') {
        const definition = state.selectedAbility.definition;
        const targetingInfo = definition.getTargetingInfo(state, state.selectedAbility);
        if (isAbilityMouseTargetValid(state, targetingInfo)) {
            definition.onActivate(state, state.selectedAbility, target);
            state.selectedAbility.cooldown = definition.getCooldown(state, state.selectedAbility);
            delete state.selectedAbility;
            state.mouse.pressHandled = true;
        }
    } else if (state.selectedHero) {
        if (state.selectedAbility) {
            if (state.selectedAbility.abilityType === 'activeAbility') {
                const definition = state.selectedAbility.definition;
                const targetingInfo = definition.getTargetingInfo(state, state.selectedHero, state.selectedAbility);
                if (isAbilityMouseTargetValid(state, targetingInfo)) {
                    if (targetingInfo.moveToTarget) {
                        // Assign the ability action to the hero if they should move until the
                        // target is in range.
                        state.selectedHero.abilityTarget = target
                        state.selectedHero.selectedAbility = state.selectedAbility;
                    } else {
                        // Activate the ability immediately if the hero should just use it where they are
                        // standing.
                        useHeroAbility(state, state.selectedHero, state.selectedAbility, target);
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
            delete state.selectedHero.assignedJob;
            state.mouse.pressHandled = true;
        } else if (target?.objectType === 'loot') {
            delete state.selectedHero.attackTarget;
            delete state.selectedHero.selectedAttackTarget;
            delete state.selectedHero.assignedJob;
            state.selectedHero.movementTarget = target;
            state.mouse.pressHandled = true;
        } else if (target?.objectType === 'structure') {
            if (!target.onClick?.(state)) {
                // If the structure doesn't have special on click handling,
                // just use the default behavior of moving the selected hero
                // to interact with the structure.
                delete state.selectedHero.attackTarget;
                delete state.selectedHero.selectedAttackTarget;
                delete state.selectedHero.assignedJob;
                state.selectedHero.movementTarget = target;
            }
            state.mouse.pressHandled = true;
        } else if (target?.objectType === 'nexus') {
            delete state.selectedHero.attackTarget;
            delete state.selectedHero.selectedAttackTarget;
            delete state.selectedHero.assignedJob;
            state.selectedHero.movementTarget = target;
            state.mouse.pressHandled = true;
        }
    }
}

function handleMouseClick(state: GameState, down: Point, up: Point) {
    /*const target = getTargetAtScreenPoint(state, down);
    if (!target || !isScreenPointOverTarget(state, up, target)) {
        return;
    }*/
    const downTarget = getTargetAtScreenPoint(state, down);
    const upTarget = getTargetAtScreenPoint(state, up);
    if (!downTarget || downTarget.objectType === 'point' || upTarget.objectType === 'point'){
        return;
    }
    // Trigger the effect of a button.
    if (downTarget?.objectType === 'uiButton' || downTarget?.objectType === 'uiContainer') {
        if (upTarget.objectType === downTarget.objectType) {
            if (downTarget !== upTarget && (!downTarget.uniqueId || downTarget.uniqueId !== upTarget.uniqueId)) {
                return;
            }
            downTarget.onClick?.(state);
        }
        return;
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
        delete state.selectedHero.selectedAttackTarget;
        delete state.selectedHero.assignedJob;
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
