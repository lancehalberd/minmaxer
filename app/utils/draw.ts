import { pad } from 'app/utils/geometry';

export function fillCircle(context: CanvasRenderingContext2D, circle: Circle) {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
    if (circle.color) {
        context.fillStyle = circle.color;
        context.fill();
    }
}

export function fillRect(context: CanvasRenderingContext2D, {x, y, w, h}: Rect, color?: CanvasFill) {
    if (color) {
        context.fillStyle = color;
    }
    context.fillRect(x, y, w, h);
}

export function renderLifeBar(context: CanvasRenderingContext2D, circle: Circle, health: number, maxHealth: number) {
    const barHeight = 5;
    const padding = 5;
    const bar: Rect = {
        x: circle.x - circle.r,
        y: circle.y - circle.r - padding - barHeight,
        w: 2 * circle.r,
        h: barHeight,
    }
    // Draw a white box for an outline around the bar.
    fillRect(context, pad(bar, 1), '#FFF');
    // Draw a black box for the full bar.
    fillRect(context, bar, '#000');
    // Draw a colored box over the black box to indicate percent life left.
    fillRect(context, {
        ...bar,
        w: bar.w * health / maxHealth,
    }, health >= maxHealth / 2 ? '#080' : '#F80');
}

export function renderGameStatus(context: CanvasRenderingContext2D, message: string) {
    context.font = "20px serif";
    context.fillStyle = '#8B0000';
    context.fillText(message, -25, -50);
}
