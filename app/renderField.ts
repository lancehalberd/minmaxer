import {canvas} from 'app/gameConstants';
//import {fillCircle} from 'app/utils/draw';
//import {convertToWorldPosition} from 'app/utils/geometry';

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
        // Render mouse target
        /*const mousePosition = state.mouse.currentPosition;
        const worldPosition = convertToWorldPosition(state, mousePosition);
        fillCircle(context, {...worldPosition, r: 2, color:'blue'});*/

    context.restore();
}
