import {context} from 'app/gameConstants';
import {fillRect} from 'app/utils/draw';
import {convertToWorldPosition, isPointInRect, pad} from 'app/utils/geometry';
import {createAnimation, drawFrameContentAt} from 'app/utils/animations';


export function createFieldButtonForTarget(target: Circle, text: string, callback: (state: GameState) => boolean): CanvasButton {
    const measurements = context.measureText(text);
    return {
        objectType: 'button',
        x: target.x + 5,
        y: target.y + 5,
        w: measurements.width,
        h: 16,
        text,
        onClick: callback,
        render: renderFieldButton,
    };
}

function renderFieldButton(this: CanvasButton, context: CanvasRenderingContext2D, state: GameState) {
    const mouseWorldPoint = convertToWorldPosition(state, state.mouse.currentPosition)
    if (!state.mouse.mouseDownTarget && isPointInRect(this, mouseWorldPoint)) {
        fillRect(context, this, '#0F0');
    } else {
        fillRect(context, this, '#000');
    }
    fillRect(context, pad(this, -1), '#FFF');
    context.font = "12px serif";
    context.fillStyle = '#000';
    context.textBaseline = 'top';
    context.textAlign = 'center';
    if (this.text) {
        context.fillText(this.text, this.x + this.w / 2, this.y);
    }
}

const [
    downPointerNormal,
    downPointerHover,
    downPointerPress,
    downPointerDisabled,
] = createAnimation('gfx/downPointer.png', {w: 16, h:16}, {cols: 4}).frames;

export function createPointerButtonForTarget(target: Circle): CanvasButton {
    return {
        objectType: 'button',
        x: target.x - downPointerNormal.w / 2,
        y: target.y - target.r - downPointerNormal.h - 2,
        w: downPointerNormal.w,
        h: downPointerNormal.h,
        render(context: CanvasRenderingContext2D, state: GameState) {
            let frame = downPointerNormal;
            if (this.disabled) {
                frame = downPointerDisabled;
            } else if (state.mouse.mouseDownPosition) {
                const mouseWorldPoint = convertToWorldPosition(state, state.mouse.mouseDownPosition);
                if (isPointInRect(this, mouseWorldPoint)) {
                    frame = downPointerPress;
                }
            } else {
                const mouseWorldPoint = convertToWorldPosition(state, state.mouse.currentPosition);
                if (isPointInRect(this, mouseWorldPoint)) {
                    frame = downPointerHover;
                }
            }
            drawFrameContentAt(context, frame, this);
        }
    };
}