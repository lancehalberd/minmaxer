export function getDistance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x, dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function getDistanceBetweenCircles(c1: Circle, c2: Circle): number {
    const dx = c1.x - c2.x, dy = c1.y - c2.y;
    return Math.sqrt(dx * dx + dy * dy) - c1.r - c2.r;
}

export function pad({x, y, w, h}: Rect, amount: number): Rect {
    return {
        x: x - amount,
        y: y - amount,
        w: w + 2 * amount,
        h: h + 2 * amount,
    };
}

export function rectCenter({x, y, w, h}: Rect): Point {
    return {x: x + w / 2, y: y + h / 2};
}

export function isPointInCircle(circle: Circle, {x, y}: Point) {
    const dx = circle.x - x, dy = circle.y - y;
    const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
    return distanceToCenter <= circle.r;
}

export function doCirclesIntersect(c1: Circle, c2: Circle) {
    const dx = c1.x - c2.x, dy = c1.y - c2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < c1.r + c2.r;
}

export function isPointInRect(rect: Rect, {x, y}: Point) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
