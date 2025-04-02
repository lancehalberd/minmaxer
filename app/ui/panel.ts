import {canvas, uiPadding, uiSize} from 'app/gameConstants';
import {CharacterIconButton, CloseIconButton} from 'app/ui/iconButton';
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

export class PanelPadding implements UIContainer {
    objectType = <const>'uiContainer';
    x = this.content.x - this.padding;
    y = this.content.y - this.padding;
    w = this.content.w + 2 * this.padding;
    h = this.content.h + 2 * this.padding;
    constructor(public content: UIElement, public padding: number = uiPadding) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            context.translate(this.x, this.y);
            this.content.render?.(context, state);
        context.restore();
    }
    update(state: GameState) {
        this.content.x = this.padding;
        this.content.y = this.padding;
        this.content.w = this.w - 2 * this.padding;
        this.content.h = this.h - 2 * this.padding;
        this.content.update?.(state);
    }
    getChildren(): UIElement[] {
        return [this.content];
    }
}

interface PanelTab {
    title: Computed<string, undefined>
    content: UIElement
}
interface TabbedPanelProps extends Partial<UIContainer> {
    tabs: Computed<PanelTab[], undefined>
    selectedTabIndex?: number
    onSelectTab?: (state: GameState, index: number) => void
    onClose?: (state: GameState) => void
}
const tabWidth = 150;
const shadedBorderFill = '#AAA';
export class TabbedPanel implements UIContainer {
    objectType = <const>'uiContainer';
    comutableTabs = this.props.tabs;
    selectedTabIndex = this.props.selectedTabIndex ?? 0;
    onSelectTab = this.props.onSelectTab;
    w = this.props.w ?? 250;
    h = this.props.h ?? 400;
    x = this.props.x ?? 300;
    y = this.props.y ?? (canvas.height - this.h) / 2;
    onClose = this.props.onClose;
    closeButton = new CloseIconButton({
        w: uiSize,
        h: uiSize,
        onPress: (state: GameState) => {
            this.onClose?.(state);
            return true;
        },
        resize(state: GameState, container: UIContainer) {
            this.x = container.w - uiPadding - this.w;
            this.y = uiPadding;
        },
    });
    prevButton = new CharacterIconButton({
        character: '<',
        onClick: (state: GameState) => {
            const tabs = computeValue(state, undefined, this.comutableTabs, []);
            const newIndex = (this.selectedTabIndex + tabs.length - 1) % tabs.length;
            this.selectTabIndex(state, newIndex);
            return true;
        },
        resize(state: GameState, container: UIContainer) {
            this.x = 3 * uiPadding;
            this.y = (titleHeight - this.h) / 2;
        },
    });
    nextButton = new CharacterIconButton({
        character: '>',
        onClick: (state: GameState) => {
            const tabs = computeValue(state, undefined, this.comutableTabs, []);
            const newIndex = (this.selectedTabIndex + 1) % tabs.length;
            this.selectTabIndex(state, newIndex);
            return true;
        },
        resize(state: GameState, container: UIContainer) {
            this.x = container.w - this.w - 3 * uiPadding;
            this.y = (titleHeight - this.h) / 2;
        },
    });
    tabButtons: UIElement[] = [];
    children: UIElement[] = [];
    constructor(public props: TabbedPanelProps) {}
    update(state: GameState) {
        const tabs = computeValue(state, undefined, this.comutableTabs, []);
        const content = tabs[this.selectedTabIndex].content;
        this.children = [content];
        if (this.onClose) {
            this.children.push(this.closeButton);
        }
        if (!this.isNarrow(state)) {
            // Wide view shows a clickable tab for each tab.
            const tabbedPanel = this;
            for (let i = 0; i < tabs.length; i++) {
                if (!this.tabButtons[i]) {
                    this.tabButtons[i] = {
                        objectType: 'uiContainer',
                        w: tabWidth,
                        h: titleHeight,
                        y: 0,
                        x: (tabWidth + 5) * i,
                        onClick: (state: GameState) => {
                            this.selectTabIndex(state, i);
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
                                const title = computeValue(state, undefined, tabs[i].title, '');
                                fillText(context, {text: title, x: this.w / 2, y: this.h / 2, size: 20, textAlign: 'center', textBaseline: 'middle', color: '#FFF'});
                            context.restore();
                        }
                    }
                }
                this.children.push(this.tabButtons[i]);
            }
        } else {
            this.children.push(this.prevButton);
            this.children.push(this.nextButton);
        }
        content.x = 0;
        content.y = titleHeight + dividerThickness;
        content.w = this.w;
        content.h = this.h - (titleHeight + dividerThickness);
        for (const child of this.children) {
            child.resize?.(state, this);
            child.update?.(state);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillRect(context, this, '#222');
        context.save();
            context.translate(this.x, this.y);
            fillRect(context, {x: 0, y: titleHeight, w: this.w, h: dividerThickness}, '#FFF');
            fillRect(context, {x: 2, y: titleHeight + dividerThickness, w: this.w - 4, h: this.h - 4 - titleHeight - dividerThickness}, '#444');
            if (this.isNarrow(state)) {
                const tabs = computeValue(state, undefined, this.comutableTabs, []);
                // Narrow view just shows the title of the current tab with prev/next arrow buttons on the left and right of it.
                const selectedTab = tabs[this.selectedTabIndex];
                if (selectedTab) {
                    const title = computeValue(state, undefined, selectedTab.title, '');
                    // Draw the standard panel background instead of the darker background that normally goes behind tabs.
                    fillRect(context, {x: 2, y: 2, w: this.w - 4, h: titleHeight - dividerThickness - 2}, '#444');
                    fillText(context, {text: title, x: this.w / 2, y: titleHeight / 2, size: 20, textAlign: 'center', textBaseline: 'middle', color: '#FFF'});
                }
            }
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    isNarrow(state: GameState): boolean {
        const tabs = computeValue(state, undefined, this.comutableTabs, []);
        return this.w > tabWidth + 5 * tabs.length;
    }
    selectTabIndex(state: GameState, index: number) {
        const tabs = computeValue(state, undefined, this.comutableTabs, []);
        this.selectedTabIndex = index % tabs.length;
        this.onSelectTab?.(state, index);
    }
    getChildren(state: GameState) {
        return this.children;
    }
}
