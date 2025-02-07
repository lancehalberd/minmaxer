import {canvas, context, uiSize} from 'app/gameConstants';
import {fillBorderedRect, fillText, measureText} from 'app/utils/draw';
import {getModifierLines} from 'app/utils/inventory';

interface TooltipProps extends Partial<UIContainer> {
    lines: (string|number)[]
    textProps?: Partial<FillTextProperties>
    color?: CanvasFill
    backgroundColor?: CanvasFill
    hoverBackgroundColor?: CanvasFill
}
export class ToolTip implements UIButton {
    objectType = <const>'uiButton';
    lines = this.props.lines;
    textProps = this.props.textProps;
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    w = this.props.w ?? 100;
    h = this.props.h ?? 2 * uiSize;
    color = this.props.color ?? '#000';
    backgroundColor = this.props.backgroundColor ?? '#AFA';
    hoverBackgroundColor = this.props.hoverBackgroundColor ?? '#0F0';
    constructor(state: GameState, public props: TooltipProps) {
        this.resize();
        const {x, y} = state.mouse.currentPosition;
        if (x < canvas.width / 2) {
            this.x = Math.min(x + uiSize, canvas.width - this.w - uiSize);
        } else {
            this.x = Math.max(x - this.w - uiSize, uiSize);
        }
        if (y < canvas.height / 2) {
            this.y = Math.min(y + uiSize, canvas.height - this.h - uiSize);
        } else {
            this.y = Math.max(y - this.h - uiSize, uiSize);
        }
    }
    resize() {
        let x = this.x + uiSize / 2;
        let y = this.y + uiSize / 2;
        let w = 0, h = 0;

        for (const line of this.lines) {
            if (!line) {
                h += uiSize / 2;
                continue;
            }
            const measurements = measureText(context, {
                text: line,
                x, y,
                textAlign: 'left', textBaseline: 'top',
                ...this.textProps,
            });
            w = Math.max(w, measurements.width);
            h += measurements.fontBoundingBoxAscent + measurements.fontBoundingBoxDescent + 2;
        }
        this.w = uiSize + w;
        this.h = uiSize + h;
    }
    drawBackground(context: CanvasRenderingContext2D, state: GameState) {
        fillBorderedRect(context, this, {
            borderColor: this.color,
            fillColor: state.mouse.mouseHoverTarget === this ? this.hoverBackgroundColor : this.backgroundColor,
        });
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        this.drawBackground(context, state);
        const x = this.x + uiSize / 2;
        let y = this.y + uiSize / 2;
        for (const line of this.lines) {
            if (!line) {
                y += uiSize / 2;
                continue;
            }
            const measurements = fillText(context, {
                text: line,
                x,
                y,
                textAlign: 'left',
                textBaseline: 'top',
                color: this.color,
                ...this.textProps,
                measure: true,
            });
            if (measurements) {
                y += measurements.fontBoundingBoxAscent + measurements.fontBoundingBoxDescent + 2;
            }
        }
    }
}

const toolTipText: Partial<FillTextProperties> = {
    size: 20,
}

export function showWeaponTooltip(state: GameState, item?: Weapon) {
    if (!item) {
        return;
    }
    state.hoverToolTip = new ToolTip(state, {textProps: toolTipText, lines: [
        item.name,
        '',
        'Damage: ' + item.weaponStats.damage,
        ...getModifierLines(state, item.weaponStats.modifiers),
    ]});
    return true;
}

export function showArmorTooltip(state: GameState, item?: Armor) {
    if (!item) {
        return;
    }
    state.hoverToolTip = new ToolTip(state, {textProps: toolTipText, lines: [
        item.name,
        '',
        'Armor: ' + item.armorStats.armor,
        ...getModifierLines(state, item.armorStats.modifiers),
    ]});
    return true;
}

export function showCharmTooltip(state: GameState, item?: Charm) {
    if (!item) {
        return;
    }
    state.hoverToolTip = new ToolTip(state, {textProps: toolTipText, lines: [
        item.name,
        '',
        ...getModifierLines(state, item.charmStats.modifiers),
    ]});
    return true;
}
