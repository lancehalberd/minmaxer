import { pad } from 'app/utils/geometry';

export function fillCircle(context: CanvasRenderingContext2D, circle: Circle) {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
    if (circle.color) {
        context.fillStyle = circle.color;
        context.fill();
    }
}

export function fillArc(context: CanvasRenderingContext2D, circle: Circle, startTheta: number, endTheta: number) {
    context.beginPath();
    context.moveTo(circle.x, circle.y);
    context.arc(circle.x, circle.y, circle.r, startTheta, endTheta);
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

export function strokeX(context: CanvasRenderingContext2D, {x, y}: Point, size: number, color: CanvasFill) {
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo(x - size / 2, y - size / 2);
    context.lineTo(x + size / 2, y + size / 2);
    context.moveTo(x + size / 2, y - size / 2);
    context.lineTo(x - size / 2, y + size / 2);
    context.stroke();
}

export function renderLifeBar(context: CanvasRenderingContext2D, circle: Circle, health: number, maxHealth: number, borderColor?: CanvasFill) {
    const barHeight = 5;
    const padding = 5;
    const bar: Rect = {
        x: circle.x - circle.r,
        y: circle.y - circle.r - padding - barHeight,
        w: 2 * circle.r,
        h: barHeight,
    }
    // Draw a white box for an outline around the bar.
    fillRect(context, pad(bar, 1), borderColor ?? '#FFF');
    // Draw a black box for the full bar.
    fillRect(context, bar, '#000');
    // Draw a colored box over the black box to indicate percent life left.
    fillRect(context, {
        ...bar,
        w: bar.w * health / maxHealth,
    }, (health >= maxHealth / 2 ? '#080' : '#F80'));
}

export function renderGameStatus(context: CanvasRenderingContext2D, message: string) {
    context.font = "20px serif";
    context.fillStyle = '#8B0000';
    context.fillText(message, -25, -50);
}

export function renderCooldownCircle(context: CanvasRenderingContext2D, {x, y, r}: Circle, p: number, fill: CanvasFill) {
    context.fillStyle = fill;
    const startTheta = p * 2 * Math.PI - Math.PI / 2;
    context.beginPath();
    context.moveTo(x, y);
    context.arc(x, y, r, startTheta, 3 * Math.PI / 2);
    context.fill();
}
