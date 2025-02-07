import { pad, rectCenter } from 'app/utils/geometry';

export function fillCircle(context: CanvasRenderingContext2D, circle: Circle) {
    context.beginPath();
    context.arc(circle.x, circle.y, circle.r, 0, 2 * Math.PI);
    if (circle.color) {
        context.fillStyle = circle.color;
        context.fill();
    }
}

export function fillRing(context: CanvasRenderingContext2D, ring: Ring) {
    context.beginPath();
    context.arc(ring.x, ring.y, ring.r, 0, 2 * Math.PI);
    context.arc(ring.x, ring.y, ring.r2, 0, 2 * Math.PI, true);
    if (ring.color) {
        context.fillStyle = ring.color;
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

export function fillBorderedRect(context: CanvasRenderingContext2D, {x, y, w, h}: Rect, props: {
    borderColor?: CanvasFill
    fillColor?: CanvasFill
    borderSize?: number
} = {}) {
    context.fillStyle = props.borderColor ?? '#000';
    context.fillRect(x, y, w, h);
    context.fillStyle = props.fillColor ?? '#FFF';
    const s = props.borderSize ?? 1;
    context.fillRect(x + s, y + s, w - 2 * s, h - 2 * s);
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

export function fillText(context: CanvasRenderingContext2D, props: FillTextProperties): TextMetrics|null {
    const {
        x, y, text,
        size = 12,
        bold = false,
        font = 'san-serif',
        color = '#000',
        measure = false,
        textBaseline = 'middle',
        textAlign = 'center',
    } = props;
    context.save();
        context.font = `${bold ? 'bold ' : ''}${size}px ${font}`;
        context.textBaseline = textBaseline;
        context.textAlign = textAlign;
        context.fillStyle = color;
        context.fillText('' + text, x, y);
        const textMeasure = measure ? context.measureText('' + text) : null;
    context.restore();
    return textMeasure
}
// This should match the logic above exactly so the text measurement is accurate.
export function measureText(context: CanvasRenderingContext2D, props: FillTextProperties): TextMetrics {
    const {
        x, y, text,
        size = 12,
        bold = false,
        font = 'san-serif',
        color = '#000',
        textBaseline = 'middle',
        textAlign = 'center',
    } = props;
    context.save();
        context.font = `${bold ? 'bold ' : ''}${size}px ${font}`;
        context.textBaseline = textBaseline;
        context.textAlign = textAlign;
        context.fillStyle = color;
        context.fillText('' + text, x, y);
        const textMeasure = context.measureText('' + text);
    context.restore();
    return textMeasure
}

export function renderLifeBarOverCircle(context: CanvasRenderingContext2D, circle: Circle, health: number, maxHealth: number, borderColor?: CanvasFill) {
    const barHeight = 5;
    const padding = 5;
    renderLifeBar(context, {
        x: circle.x - circle.r,
        y: circle.y - circle.r - padding - barHeight,
        w: 2 * circle.r,
        h: barHeight,
    }, health, maxHealth, borderColor);
}

export function renderLifeBar(context: CanvasRenderingContext2D, bar: Rect, health: number, maxHealth: number,
    borderColor?: CanvasFill, fillColor?: CanvasFill) {
    // Draw a white box for an outline around the bar.
    fillRect(context, pad(bar, 1), borderColor ?? '#FFF');
    // Draw a black box for the full bar.
    fillRect(context, bar, '#000');
    // Draw a colored box over the black box to indicate percent life left.
    fillRect(context, {
        ...bar,
        w: bar.w * Math.min(1, health / maxHealth),
    }, fillColor ?? (health >= maxHealth / 2 ? '#080' : '#F80'));
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


interface NumberFillBar extends Rect {
    value: number
    total: number
    // If specified, this portion of the bar will be filled with the reservedColor.
    reserved?: number
    fontColor?: CanvasFill
    borderColor?: CanvasFill
    borderSize?: number
    backgroundColor?: CanvasFill
    fillColor?: CanvasFill
    reservedColor?: CanvasFill
}
export function drawNumberFillBar(context: CanvasRenderingContext2D, numberFillBar: NumberFillBar) {
    const {
        value, total, reserved = 0,
        fontColor = '#000', borderColor = '#000', borderSize = 1, backgroundColor = '#FFF', fillColor = '#F80',
        reservedColor = '#AAA',
    } = numberFillBar;
    fillBorderedRect(context, numberFillBar, {borderColor, fillColor: backgroundColor, borderSize});
    const insideRect = pad(numberFillBar, -borderSize);
    fillRect(context, {...insideRect, w: Math.ceil(insideRect.w * value / total)}, fillColor);
    if (reserved) {
        const w = Math.ceil(insideRect.w * reserved / total);
        fillRect(context, {...insideRect, x: insideRect.x + insideRect.w - w, w}, reservedColor);
    }
    const center = rectCenter(insideRect);
    // For some reason the text doesn't appear centered, so we have to move it down slightly.
    fillText(context, {x: center.x, y: center.y + 1, text: value, size: numberFillBar.h - 4, color: fontColor});
}
