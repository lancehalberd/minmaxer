import {canvas} from 'app/gameConstants';
import {isAbilityMouseTargetValid} from 'app/utils/combat';
import {fillCircle, strokeX} from 'app/utils/draw';
import {convertToZoneLocation} from 'app/utils/world';

export function renderFieldElements(context: CanvasRenderingContext2D, state: GameState, elements: UIElement[]) {
    for (const element of elements) {
        element.render(context, state);
        // Elements are responsible for rendering their own children?
        /*if (element.getChildren) {
            renderFieldElements(context, state, element.getChildren(state));
        }*/
    }
}

export function renderField(context: CanvasRenderingContext2D, state: GameState) {

    const scale = state.camera.scale;

    const renderedZone = state.camera.zone;
    context.fillStyle = renderedZone.floorColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.save();
        // Adjust the context to match the camera scale and render camera.x/camera.y in the center of the canvas.
        context.scale(scale, scale);
        context.translate(
            -state.camera.x + canvas.width / 2 / scale,
            -state.camera.y + canvas.height / 2 / scale
        );
        // Draw all base objects first.
        const sortedObjects = [...renderedZone.objects];
        sortedObjects.sort((A, B) => A.y - B.y);
        for (const object of sortedObjects) {
            object.render(context, state);
        }
        for (const effect of renderedZone.effects) {
            effect.render(context, state);
        }
        // If any objects have buttons associated with them, draw those on top next.
        for (const object of sortedObjects) {
            if (object.getChildren) {
                renderFieldElements(context, state, object.getChildren(state));
            }
        }
        // Render targeting graphics for abilities.
        if (state.selectedAbility?.abilityType === 'activeNexusAbility') {
            const definition = state.selectedAbility.definition;
            const targetingInfo = definition.getTargetingInfo(state, state.selectedAbility);
            const isTargetValid = isAbilityMouseTargetValid(state, targetingInfo);
            const target: Point = state.mouse.mouseHoverTarget || convertToZoneLocation(state, state.mouse.currentPosition);;
            if (isTargetValid) {
                if (targetingInfo.hitRadius) {
                    fillCircle(context, {...target, r: targetingInfo.hitRadius || 5, color: 'rgba(0, 0, 255, 0.5)'});
                }
            } else {
                strokeX(context, target, 10, '#F00');
            }
        } else if (state.selectedHero && state.selectedAbility) {
            if (state.selectedAbility.abilityType === 'activeAbility') {
                const definition = state.selectedAbility.definition;
                const targetingInfo = definition.getTargetingInfo(state, state.selectedHero, state.selectedAbility);
                const isTargetValid = isAbilityMouseTargetValid(state, targetingInfo);
                const target: Point = state.mouse.mouseHoverTarget || convertToZoneLocation(state, state.mouse.currentPosition);;
                if (isTargetValid) {
                    if (targetingInfo.hitRadius) {
                        fillCircle(context, {...target, r: targetingInfo.hitRadius || 5, color: 'rgba(0, 0, 255, 0.5)'});
                    }
                    if (targetingInfo.projectileRadius) {
                        context.strokeStyle = 'rgba(0, 0, 255, 0.5)';
                        context.lineWidth = 2 * targetingInfo.projectileRadius;
                        const dx = target.x - state.selectedHero.x, dy = target.y - state.selectedHero.y;
                        const mag = Math.sqrt(dx*dx + dy*dy);
                        context.beginPath();
                        context.moveTo(state.selectedHero.x, state.selectedHero.y);
                        context.lineTo(
                            state.selectedHero.x + targetingInfo.range * dx / mag,
                            state.selectedHero.y + targetingInfo.range * dy / mag
                        );
                        context.stroke();
                    }
                } else {
                    strokeX(context, target, 10, '#F00');
                }
            }
        } else if (state.selectedHero && state.hoveredAbility) {
            if (state.hoveredAbility.abilityType === 'activeAbility') {
                const definition = state.hoveredAbility.definition;
                const targetingInfo = definition.getTargetingInfo(state, state.selectedHero, state.hoveredAbility);
                if (targetingInfo.hitRadius) {
                    fillCircle(context, {...state.selectedHero, r: targetingInfo.hitRadius || 5, color: 'rgba(0, 0, 255, 0.5)'});
                }
            }
        }
        // Render mouse target
        /*const mousePosition = state.mouse.currentPosition;
        const worldPosition = convertToWorldPosition(state, mousePosition);
        fillCircle(context, {...worldPosition, r: 2, color:'blue'});*/

    context.restore();
    // Render grey over the screen if the selected hero is dead.
    if (state.nexus.essence <= 0 || state.selectedHero?.reviveCooldown) {
        context.save();
            context.globalCompositeOperation = 'hue';
            context.fillStyle = '#888';
            context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();
    }
}
