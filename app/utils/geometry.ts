
export function pad({x, y, w, h}: Rect, amount: number): Rect {
    return {
        x: x - amount,
        y: y - amount,
        w: w + 2 * amount,
        h: h + 2 * amount,
    };
}

export function isPointInCircle(this: void, circle: Circle, {x, y}: Point) {
    const dx = circle.x - x, dy = circle.y - y;
    const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
    return distanceToCenter <= circle.r;
}
