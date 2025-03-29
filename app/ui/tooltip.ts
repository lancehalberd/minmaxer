import {canvas, context, uiSize} from 'app/gameConstants';
import {drawFrame} from 'app/utils/animations';
import {fillBorderedRect, fillText, measureText} from 'app/utils/draw';
import {getAvailableToolCount, getItemLabel, getToolIcon, toolTypeLabels} from 'app/utils/inventory';
import {statModifierStrings} from 'app/utils/modifiableStat';
import {typedKeys} from 'app/utils/types';


interface TooltipProps extends Partial<UIContainer> {
    lines: ToolTipLine[]
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
        let w = 0, h = 0;

        for (const line of this.lines) {
            if (!line) {
                h += uiSize / 2;
                continue;
            }
            if (typeof line === 'number' || typeof line === 'string') {
                const measurements = measureText(context, {
                    text: line,
                    textAlign: 'left', textBaseline: 'top',
                    ...this.textProps,
                });
                w = Math.max(w, measurements.width);
                h += measurements.fontBoundingBoxAscent + measurements.fontBoundingBoxDescent + 2;
            } else {
                const measurements = measureText(context, {
                    ...this.textProps,
                    ...line,
                    textAlign: 'left', textBaseline: 'top',
                });
                w = Math.max(w, measurements.width + (line.icon ? line.icon.w + 2 : 0));
                h += measurements.fontBoundingBoxAscent + measurements.fontBoundingBoxDescent + 2;
            }
        }
        this.w = uiSize + w;
        this.h = uiSize + h;
    }
    drawBackground(context: CanvasRenderingContext2D, state: GameState) {
        fillBorderedRect(context, this, {
            borderColor: this.color,
            fillColor: this.backgroundColor,
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
            if (typeof line === 'number' || typeof line === 'string') {
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
            } else {
                const measurements = fillText(context, {
                    x, y,
                    textAlign: 'left', textBaseline: 'top',
                    color: this.color,
                    ...this.textProps,
                    ...line,
                    measure: true,
                });
                if (measurements) {
                    const height = measurements.fontBoundingBoxAscent + measurements.fontBoundingBoxDescent;
                    if (line.icon) {
                        drawFrame(context, line.icon, {...line.icon, x: x + measurements.width + 2, y: y + (height - line.icon.h) / 2 - 2});
                    }
                    y += height + 2;
                }
            }
        }
    }
}

export const toolTipText: Partial<FillTextProperties> = {
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
        ...statModifierStrings(item.weaponStats.modifiers),
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
        ...statModifierStrings(item.armorStats.modifiers),
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
        ...statModifierStrings(item.charmStats.modifiers),
    ]});
    return true;
}

export function showSimpleTooltip(state: GameState, lines: ToolTipLine[]) {
    state.hoverToolTip = new ToolTip(state, {textProps: toolTipText, lines});
    return true;
}


export function showRequirementsTooltip(state: GameState, {essenceCost, toolType, resourceCost}: Requirements) {
    const requirementLines: ToolTipLine[] = [];
    if (toolType) {
        const hasTool = !!getAvailableToolCount(state, toolType)
        const color = hasTool ? '#0F0' : '#F00';
        const label = toolTypeLabels[toolType] ?? toolType;
        requirementLines.push({bold: true, color, text: 'Need ' + label, icon: getToolIcon(toolType)});
    }
    for (const key of typedKeys(resourceCost ?? {})) {
        const value = state.inventory[key] ?? 0;
        const previewCost = resourceCost?.[key];
        if (!previewCost) {
            continue;
        }
        const label = getItemLabel(key);
        requirementLines.push({text: label + ': ' + value, strikeColor: 'red'});
        const result = value - previewCost;
        const color = result < 0 ? '#F00' : '#FF0';
        requirementLines.push({text: label + ': ' + result, color});

        // TODO: Add strike color to FillTextProperties and use that to add red line through this text.
        /*
        const metrics = fillText(context, {...text, measure: !!previewCost, text: label + ': ' + value});
        context.save();
            context.globalAlpha *= 0.5;
            context.beginPath();
            context.moveTo(x, y + 7);
            context.lineTo(x + metrics.width, y + 7);
            context.lineWidth = 6;
            context.strokeStyle = '#F00';
            context.stroke();
        context.restore();*/
    }
    if (!requirementLines.length) {
        return;
    }
    state.hoverToolTip = new ToolTip(state, {textProps: toolTipText, lines: requirementLines});
    return true;
}
