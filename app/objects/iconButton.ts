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
