import {fillBorderedRect, fillCircle, fillRect} from 'app/utils/draw';
import {uiSize} from 'app/gameConstants';

interface IconButtonProps extends Partial<UIButton> {
    color?: CanvasFill
    backgroundColor?: CanvasFill
    hoverBackgroundColor?: CanvasFill
}

export class IconButton implements UIButton {
    objectType = <const>'uiButton';
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    w = this.props.w ?? uiSize;
    h = this.props.h ?? uiSize;
    color = this.props.color ?? '#000';
    backgroundColor = this.props.backgroundColor ?? '#AFA';
    hoverBackgroundColor = this.props.hoverBackgroundColor ?? '#0F0';
    disabled = this.props.disabled;
    onHover = this.props.onHover;
    onPress = this.props.onPress;
    onClick = this.props.onClick;
    uniqueId = this.props.uniqueId;
    constructor(public props: IconButtonProps) {}
    drawBackground(context: CanvasRenderingContext2D, state: GameState) {
        fillBorderedRect(context, this, {
            borderColor: this.color,
            fillColor: state.mouse.mouseHoverTarget === this ? this.hoverBackgroundColor : this.backgroundColor,
        });
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        this.drawBackground(context, state);
    }
}
export class PlusIconButton extends IconButton {
    render(context: CanvasRenderingContext2D, state: GameState) {
        this.drawBackground(context, state);
        fillRect(context, {x: this.x + this.w / 2 - 1, y: this.y + 2, w:2, h: this.h - 4}, this.color);
        fillRect(context, {x: this.x + 2, y: this.y + this.h / 2 - 1, w: this.w - 4, h: 2}, this.color);
    }
}
export class MinusIconButton extends IconButton {
    render(context: CanvasRenderingContext2D, state: GameState) {
        this.drawBackground(context, state);
        fillRect(context, {x: this.x + 2, y: this.y + this.h / 2 - 1, w: this.w - 4, h: 2}, this.color);
    }
}
export class CircleIconButton extends IconButton {
    render(context: CanvasRenderingContext2D, state: GameState) {
        this.drawBackground(context, state);
        const r = Math.min(0.3 * this.w, 0.3 * this.h);
        fillCircle(context, {x: this.x + this.w / 2, y: this.y + this.h / 2, r, color: this.color});
    }
}


interface RepeatButtonProps extends IconButtonProps {
    color?: CanvasFill
    backgroundColor?: CanvasFill
    hoverBackgroundColor?: CanvasFill
    isActive: (state: GameState) => boolean
}
export class RepeatToggle extends IconButton {
    isActive = this.props.isActive;
    constructor(public props: RepeatButtonProps) {
        super(props);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const isActive = this.isActive(state);
        fillBorderedRect(context, this, {
            borderColor: this.color,
            fillColor: (state.mouse.mouseHoverTarget === this || isActive) ? this.hoverBackgroundColor : this.backgroundColor,
        });
        const iconColor = isActive ? this.color : '#888';
        const circle = {x: this.x + this.w / 2, y: this.y + this.h / 2, r: uiSize / 2 - 3};

        context.beginPath();
        context.arc(circle.x, circle.y, circle.r, -Math.PI / 3, 4 * Math.PI / 3);
        context.lineWidth = 1;
        context.strokeStyle = iconColor;
        context.stroke();
        context.beginPath();
        const size = 3;
        const dx = Math.cos(-Math.PI / 3), dy = Math.sin(-Math.PI / 3);
        const x = circle.x + dx * circle.r, y = circle.y + dy * circle.r;
        const h = size * Math.sqrt(3) / 2;
        context.moveTo(x + dx * size / 2, y + dy * size / 2);
        context.lineTo(x - dx * size / 2, y - dy * size / 2);
        context.lineTo(x + dy * h, y  - dx * h);
        context.fillStyle = iconColor;
        context.fill();
    }
}
