import {uiPadding} from 'app/gameConstants';
import {TextButton} from 'app/ui/textButton';
import {TitlePanel, PanelPadding} from 'app/ui/panel';
import {removeItemFromArray} from 'app/utils/array';
import {fillText} from 'app/utils/draw';


const buttonProps = {
    textProps: {size: 25},
    h: 40,
}


interface ConfirmPanelContentProps extends Partial<UIContainer> {
    textLines?: string[]
    confirmText?: string
    cancelText?: string
    onConfirm: (state: GameState) => void
    onClose: (state: GameState) => void
}
class ConfirmPanelContent implements UIContainer {
    objectType = <const>'uiContainer'
    x = 0;
    y = 0;
    w = this.props.w ?? 400;
    h = this.props.h ?? 150
    textLines = this.props.textLines ?? [];
    confirmText = this.props.confirmText ?? 'Yes';
    cancelText = this.props.confirmText ?? 'No';
    onConfirm = this.props.onConfirm;
    onClose = this.props.onClose;

    confirmButton = new TextButton({
        ...buttonProps,
        text: this.confirmText,
        onClick: (state: GameState) => {
            this.onConfirm(state);
            this.onClose(state);
            return true;
        },
        resize(state: GameState, container: UIContainer) {
            this.x = container.w / 2 - 2 * uiPadding - this.w;
            this.y = container.h - this.h - uiPadding;
        },
    });
    cancelButton = new TextButton({
        ...buttonProps,
        text: this.cancelText,
        onClick: (state: GameState) => {
            this.onClose(state);
            return true;
        },
        resize(state: GameState, container: UIContainer) {
            this.x = container.w / 2 + 2 * uiPadding;
            this.y = container.h - this.h - uiPadding;
        },
    });

    children: UIElement[] = [this.confirmButton, this.cancelButton];
    constructor(public props: ConfirmPanelContentProps) {}

    getChildren(state: GameState) {
        return this.children;
    }
    update(state: GameState) {
        for (const child of this.children) {
            child.resize?.(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            context.translate(this.x, this.y);
            let y = 0;
            for (const line of this.textLines) {
                fillText(context, {text: line, x: this.w / 2, y, textBaseline: 'top', size: 18, color: '#FFF'})
                y += 20;
            }
            for (const child of this.children) {
                child.render(context, state);
            }
        context.restore();
    }
}

interface ShowConfirmPanelProps extends Partial<UIContainer> {
    title: string
    textLines?: string[]
    confirmText?: string
    cancelText?: string
    onConfirm: (state: GameState) => void
}
export function showConfirmPanel(state: GameState, props: ShowConfirmPanelProps) {
    const content = new PanelPadding(new ConfirmPanelContent({
        ...props,
        onClose() {
            removeItemFromArray(state.openPanels, confirmPanel);
        },
    }));
    const titleHeight = 50;
    const confirmPanel = new TitlePanel({
        title: props.title,
        content,
        titleHeight,
    });
    state.openPanels.push(confirmPanel);
}
