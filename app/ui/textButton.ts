import {uiSize} from 'app/gameConstants';
import {isMouseOverTarget} from 'app/mouse';
import {computeValue} from 'app/utils/computed';
import {fillBorderedRect, fillText} from 'app/utils/draw';

interface TextButtonProps extends Partial<UIButton> {
    text: Computed<string, TextButton>
    textProps?: FillTextProperties
    color?: CanvasFill
    backgroundColor?: CanvasFill
    hoverBackgroundColor?: CanvasFill
}
export class TextButton implements UIButton {
    objectType = <const>'uiButton';
    text = this.props.text;
    textProps = this.props.textProps;
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    w = this.props.w ?? 100;
    h = this.props.h ?? 2 * uiSize;
    color = this.props.color ?? '#000';
    backgroundColor = this.props.backgroundColor ?? '#AFA';
    hoverBackgroundColor = this.props.hoverBackgroundColor ?? '#0F0';
    disabled = this.props.disabled;
    onHover = this.props.onHover;
    onPress = this.props.onPress;
    onClick = this.props.onClick;
    uniqueId = this.props.uniqueId;
    constructor(public props: TextButtonProps) {}
    drawBackground(context: CanvasRenderingContext2D, state: GameState) {
        fillBorderedRect(context, this, {
            borderColor: this.color,
            fillColor: isMouseOverTarget(state, this) ? this.hoverBackgroundColor : this.backgroundColor,
        });
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        this.drawBackground(context, state);
        const text = computeValue(state, this, this.text, '');
        if (text) {
            fillText(context, {text, x: this.x + this.w / 2, y: this.y + this.h / 2, color: this.color, ...(this.textProps)});
        }
    }
}
