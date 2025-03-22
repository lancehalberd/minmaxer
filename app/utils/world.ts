import {canvas} from 'app/gameConstants';


export function followCameraTarget(state: GameState, target: FieldObject) {
    if (state.camera.zone !== target.zone) {
        state.camera.zone = target.zone;
        state.camera.x = target.x;
        state.camera.y = target.y;
    }
    state.camera.target = {x: target.x, y: target.y};
}

export function removeFieldObject(state: GameState, object: FieldObject) {
    const objectIndex = object.zone.objects.indexOf(object);
    if (objectIndex >= 0) {
        object.zone.objects.splice(objectIndex, 1);
        // Peform any cleanup associated with removing this object, such as removing related effects/projectiles.
        if (object.objectType === 'enemy') {
            object.cleanup(state);
        }
    }
}

export function convertToZoneLocation(state: GameState, canvasPoint: Point): ZoneLocation {
    return {
        zone: state.camera.zone,
        x: (canvasPoint.x - canvas.width / 2) / state.camera.scale + state.camera.x,
        y: (canvasPoint.y - canvas.height / 2) / state.camera.scale + state.camera.y,
    };
}
