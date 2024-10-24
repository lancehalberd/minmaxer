import {canvas} from 'app/gameConstants';

export function getDistance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x, dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function pad({x, y, w, h}: Rect, amount: number): Rect {
    return {
        x: x - amount,
        y: y - amount,
        w: w + 2 * amount,
        h: h + 2 * amount,
    };
}

export function isPointInCircle(circle: Circle, {x, y}: Point) {
    const dx = circle.x - x, dy = circle.y - y;
    const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
    return distanceToCenter <= circle.r;
}

export function isPointInRect(rect: Rect, {x, y}: Point) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function convertToWorldPosition(state: GameState, canvasPoint: Point): Point {
    return {
        x: (canvasPoint.x - canvas.width / 2) / state.world.camera.scale + state.world.camera.x,
        y: (canvasPoint.y - canvas.height / 2) / state.world.camera.scale + state.world.camera.y,
    }
}
