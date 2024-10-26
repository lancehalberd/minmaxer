import {canvas} from 'app/gameConstants';
import {isAbilityTargetValid} from 'app/utils/combat';
import {fillCircle, strokeX} from 'app/utils/draw';
import {convertToWorldPosition} from 'app/utils/geometry';

export function renderField(context: CanvasRenderingContext2D, state: GameState) {
    context.fillStyle = '#CC4';
    context.fillRect(0, 0, canvas.width, canvas.height)

    const scale = state.world.camera.scale;

    context.save();
        // Adjust the context to match the camera scale and render camera.x/camera.y in the center of the canvas.
        context.scale(scale, scale);
        context.translate(
            -state.world.camera.x + canvas.width / 2 / scale,
            -state.world.camera.y + canvas.height / 2 / scale
        );
        // Draw all base objects first.
        for (const object of state.world.objects) {
            object.render(context, state);
        }
        // If any objects have buttons associated with them, draw those on top next.
        for (const object of state.world.objects) {
            if (!object.getFieldButtons) {
                continue;
            }
            for (const button of object.getFieldButtons(state)) {
                button.render(context, state);
            }
        }
        // Render targeting graphics for abilities.
        if (state.selectedHero && state.selectedAbility) {
            const definition = state.selectedAbility.definition;
            if (definition.abilityType === 'activeAbility') {
                const targetingInfo = definition.getTargetingInfo(state, state.selectedHero, state.selectedAbility);
                const isTargetValid = isAbilityTargetValid(state, targetingInfo);
                const target: Point = state.mouse.mouseHoverTarget || convertToWorldPosition(state, state.mouse.currentPosition);;
                if (isTargetValid) {
                    fillCircle(context, {...target, r: targetingInfo.hitRadius || 5, color: 'rgba(0, 0, 255, 0.5)'});
                } else {
                    strokeX(context, target, 10, '#F00');
                }
            }
        } else if (state.selectedHero && state.hoveredAbility) {
            const definition = state.hoveredAbility.definition;
            if (definition.abilityType === 'activeAbility') {
                const targetingInfo = definition.getTargetingInfo(state, state.selectedHero, state.hoveredAbility);
                fillCircle(context, {...state.selectedHero, r: targetingInfo.hitRadius || 5, color: 'rgba(0, 0, 255, 0.5)'});
            }
        }
        // Render mouse target
        /*const mousePosition = state.mouse.currentPosition;
        const worldPosition = convertToWorldPosition(state, mousePosition);
        fillCircle(context, {...worldPosition, r: 2, color:'blue'});*/

    context.restore();
}
