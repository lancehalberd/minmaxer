import {canvas, uiPadding, uiSize} from 'app/gameConstants';
import {CloseIconButton} from 'app/ui/iconButton';
import {computeValue} from 'app/utils/computed';
import {fillRect, fillText} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';


const titleHeight = 2 * uiPadding + uiSize;
const dividerThickness = 2;
interface TitlePanelProps extends Partial<UIContainer> {
    title: Computed<string, undefined>
    content: UIElement
    onClose?: (state: GameState) => void
}
export class TitlePanel implements UIContainer {
    objectType = <const>'uiContainer';
    title = this.props.title;
    w = this.props.w ?? 250;
    h = this.props.h ?? 400;
    x = this.props.x ?? 300;
    y = this.props.y ?? (canvas.height - this.h) / 2;
    onClose = this.props.onClose;
    content = this.props.content;
    closeButton = new CloseIconButton({
        x: this.w - uiPadding - uiSize,
        y: uiPadding,
        w: uiSize,
        h: uiSize,
        onPress: (state: GameState) => {
            this.onClose?.(state);
            return true;
        },
    });
    children: UIElement[] = [this.closeButton, this.content];
    constructor(public props: TitlePanelProps) {}
    update(state: GameState) {
        this.content.x = uiPadding;
        this.content.y = titleHeight + dividerThickness + uiPadding;
        this.content.w = this.w - 2 * uiPadding;
        this.content.h = this.h - (titleHeight + dividerThickness + 2 * uiPadding);
        this.content.update?.(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, - 2), '#444');
        context.save();
            context.translate(this.x, this.y);
            const title = computeValue(state, undefined, this.title, '');
            fillText(context, {text: title, x: this.w / 2, y: titleHeight / 2, size: 20, textAlign: 'center', textBaseline: 'middle', color: '#FFF'});
            fillRect(context, {x: 0, y: titleHeight, w: this.w, h: dividerThickness}, '#FFF');
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getChildren(state: GameState) {
        return this.children;
    }
}

interface PanelTab {
    title: Computed<string, undefined>
    content: UIElement
}
interface TabbedPanelProps extends Partial<UIContainer> {
    tabs: PanelTab[]
    selectedTabIndex?: number
    onSelectTab: (state: GameState, index: number) => void
    onClose?: (state: GameState) => void
}
const tabWidth = 150;
const shadedBorderFill = '#AAA';
export class TabbedPanel implements UIContainer {
    objectType = <const>'uiContainer';
    tabs = this.props.tabs;
    selectedTabIndex = this.props.selectedTabIndex ?? 0;
    onSelectTab = this.props.onSelectTab;
    w = this.props.w ?? 250;
    h = this.props.h ?? 400;
    x = this.props.x ?? 300;
    y = this.props.y ?? (canvas.height - this.h) / 2;
    onClose = this.props.onClose;
    closeButton = new CloseIconButton({
        x: this.w - uiPadding - uiSize,
        y: uiPadding,
        w: uiSize,
        h: uiSize,
        onPress: (state: GameState) => {
            this.onClose?.(state);
            return true;
        },
    });
    tabButtons: UIElement[] = [];
    children: UIElement[] = [];
    constructor(public props: TabbedPanelProps) {}
    update(state: GameState) {
        const content = this.tabs[this.selectedTabIndex].content;
        this.children = [this.closeButton, content];
        const tabbedPanel = this;
        for (let i = 0; i < this.tabs.length; i++) {
            if (!this.tabButtons[i]) {
                this.tabButtons[i] = {
                    objectType: 'uiContainer',
                    w: tabWidth,
                    h: titleHeight,
                    y: 0,
                    x: (tabWidth + 5) * i,
                    onClick: (state: GameState) => {
                        this.selectedTabIndex = i;
                        this.onSelectTab(state, i);
                        return true;
                    },
                    render(context: CanvasRenderingContext2D, state: GameState) {
                        context.save();
                            context.translate(this.x, this.y);
                            if (tabbedPanel.selectedTabIndex === i) {
                                fillRect(context, {x: 0, y: 0, w: this.w, h: this.h}, '#FFF');
                                // If this is selected, render the background over the horizontal rule.
                                fillRect(context, {x: 2, y: 2, w: this.w - 4, h: this.h - 2 + dividerThickness}, '#444');
                            } else {
                                fillRect(context, {x: 0, y: 0, w: this.w, h: this.h}, shadedBorderFill);
                                fillRect(context, {x: 2, y: 2, w: this.w - 4, h: this.h - 2}, '#222');
                            }
                            const title = computeValue(state, undefined, tabbedPanel.tabs[i].title, '');
                            fillText(context, {text: title, x: this.w / 2, y: this.h / 2, size: 20, textAlign: 'center', textBaseline: 'middle', color: '#FFF'});
                        context.restore();
                    }
                }
            }
            this.children.push(this.tabButtons[i]);
        }
        content.x = uiPadding;
        content.y = titleHeight + dividerThickness + uiPadding;
        content.w = this.w - 2 * uiPadding;
        content.h = this.h - (titleHeight + dividerThickness + 2 * uiPadding);
        content.update?.(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillRect(context, this, '#222');
        context.save();
            context.translate(this.x, this.y);
            fillRect(context, {x: 0, y: titleHeight, w: this.w, h: dividerThickness}, '#FFF');
            fillRect(context, {x: 2, y: titleHeight + dividerThickness, w: this.w - 4, h: this.h - 4 - titleHeight - dividerThickness}, '#444');
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getChildren(state: GameState) {
        return this.children;
    }
}
