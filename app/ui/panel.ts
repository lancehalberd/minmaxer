import {canvas, uiPadding, uiSize} from 'app/gameConstants';
import {CharacterIconButton, CloseIconButton} from 'app/ui/iconButton';
import {computeValue} from 'app/utils/computed';
import {fillRect, fillText} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';

const smallTitleHeight = 2 * uiPadding + uiSize;
const borderSize = 2;
interface TitlePanelProps extends Partial<UIContainer> {
    title: Computed<string, undefined>
    titleHeight?: number
    content: UIElement
    onClose?: (state: GameState) => void
}
export class TitlePanel implements UIContainer {
    objectType = <const>'uiContainer';
    title = this.props.title;
    titleHeight = this.props.titleHeight ?? smallTitleHeight;
    onClose = this.props.onClose;
    content = this.props.content;
    w = this.props.w ?? this.content.w;
    h = this.props.h ?? this.content.h + this.titleHeight;
    x = this.props.x ?? (canvas.width - this.w) / 2;
    y = this.props.y ?? (canvas.height - this.h) / 2;
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
    children: UIElement[] = [this.content];
    constructor(public props: TitlePanelProps) {}
    update(state: GameState) {
        this.children = [this.content];
        if (this.onClose) {
            this.children.push(this.closeButton);
        }
        this.content.x = uiPadding;
        this.content.y = this.titleHeight + borderSize + uiPadding;
        this.content.w = this.w - 2 * uiPadding;
        this.content.h = this.h - (this.titleHeight + borderSize + 2 * uiPadding);
        this.content.update?.(state);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, - 2), '#444');
        context.save();
            context.translate(this.x, this.y);
            const title = computeValue(state, undefined, this.title, '');
            fillText(context, {text: title, x: this.w / 2, y: 10, size: this.titleHeight - 16, textAlign: 'center', textBaseline: 'top', color: '#FFF'});
            fillRect(context, {x: 0, y: this.titleHeight - borderSize, w: this.w, h: borderSize}, '#FFF');
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

type TabStyle = 'top'|'left'|'collapsed';
interface PanelTab {
    title: Computed<string, undefined>
    content: UIElement
}
interface TabbedPanelProps extends Partial<UIContainer> {
    tabs: Computed<PanelTab[], undefined>
    tabWidth?: number
    titleHeight?: number
    selectedTabIndex?: number
    tabStyle?: TabStyle
    onSelectTab?: (state: GameState, index: number) => void
    onClose?: (state: GameState) => void
}
const shadedBorderFill = '#AAA';
export class TabbedPanel implements UIContainer {
    objectType = <const>'uiContainer';
    computableTabs = this.props.tabs;
    selectedTabIndex = this.props.selectedTabIndex ?? 0;
    onSelectTab = this.props.onSelectTab;
    titleHeight = this.props.titleHeight ?? smallTitleHeight;
    tabWidth = this.props.tabWidth ?? 150;
    tabStyle = this.props.tabStyle;
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
            const tabs = computeValue(state, undefined, this.computableTabs, []);
            const newIndex = (this.selectedTabIndex + tabs.length - 1) % tabs.length;
            this.selectTabIndex(state, newIndex);
            return true;
        },
        resize: (state: GameState, container: UIContainer) => {
            this.prevButton.x = 3 * uiPadding;
            this.prevButton.y = (this.titleHeight - this.prevButton.h) / 2;
        },
    });
    nextButton = new CharacterIconButton({
        character: '>',
        onClick: (state: GameState) => {
            const tabs = computeValue(state, undefined, this.computableTabs, []);
            const newIndex = (this.selectedTabIndex + 1) % tabs.length;
            this.selectTabIndex(state, newIndex);
            return true;
        },
        resize: (state: GameState, container: UIContainer) => {
            this.nextButton.x = container.w - this.nextButton.w - 3 * uiPadding;
            this.nextButton.y = (this.titleHeight - this.nextButton.h) / 2;
        },
    });
    tabButtons: UIElement[] = [];
    children: UIElement[] = [];
    constructor(public props: TabbedPanelProps) {}
    update(state: GameState) {
        const tabStyle = this.getTabStyle(state);
        const tabs = computeValue(state, undefined, this.computableTabs, []);
        this.selectedTabIndex %= tabs.length;
        const content = tabs[this.selectedTabIndex].content;
        this.children = [content];
        if (this.onClose) {
            this.children.push(this.closeButton);
        }
        if (tabStyle === 'collapsed') {
            this.children.push(this.prevButton);
            this.children.push(this.nextButton);
        } else {
            const tabbedPanel = this;
            for (let i = 0; i < tabs.length; i++) {
                if (!this.tabButtons[i]) {
                    this.tabButtons[i] = {
                        objectType: 'uiContainer',
                        w: this.tabWidth,
                        h: this.titleHeight,
                        y: tabStyle === 'top' ? 0 : (this.titleHeight + 5) * i,
                        x: tabStyle === 'top' ? (this.tabWidth + 5) * i : 0,
                        onClick: (state: GameState) => {
                            this.selectTabIndex(state, i);
                            return true;
                        },
                        render(context: CanvasRenderingContext2D, state: GameState) {
                            context.save();
                                context.translate(this.x, this.y);
                                if (tabbedPanel.selectedTabIndex === i) {
                                    fillRect(context, {x: 0, y: 0, w: this.w, h: this.h}, '#FFF');
                                    // If this is selected, render the background over the divider.
                                    if (tabbedPanel.getTabStyle(state) === 'top') {
                                        fillRect(context, {x: borderSize, y: borderSize, w: this.w - 2 * borderSize, h: this.h}, '#444');
                                    } else {
                                        fillRect(context, {x: borderSize, y: borderSize, w: this.w - borderSize, h: this.h - 2 * borderSize}, '#444');
                                    }
                                } else {
                                    fillRect(context, {x: 0, y: 0, w: this.w, h: this.h}, shadedBorderFill);
                                    if (tabbedPanel.getTabStyle(state) === 'top') {
                                        fillRect(context, {x: borderSize, y: borderSize, w: this.w - 2 * borderSize, h: this.h - borderSize}, '#222');
                                    } else {
                                        fillRect(context, {x: borderSize, y: borderSize, w: this.w - borderSize, h: this.h - 2 * borderSize}, '#222');
                                    }
                                }
                                const title = computeValue(state, undefined, tabs[i].title, '');

                                fillText(context, {text: title, x: this.w / 2, y: 10, size: tabbedPanel.titleHeight - 16, textAlign: 'center', textBaseline: 'top', color: '#FFF'});
                            context.restore();
                        }
                    }
                }
                this.children.push(this.tabButtons[i]);
            }
        }
        if (tabStyle === 'left') {
            const topPadding = (uiPadding + this.closeButton.h);
            content.x = this.tabWidth + borderSize;
            content.y = topPadding;
            content.w = this.w - (this.tabWidth + borderSize);
            content.h = this.h - topPadding;
        } else {
            content.x = 0;
            content.y = this.titleHeight + borderSize;
            content.w = this.w;
            content.h = this.h - (this.titleHeight + borderSize);
        }
        for (const child of this.children) {
            child.resize?.(state, this);
            child.update?.(state);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const tabStyle = this.getTabStyle(state);
        fillRect(context, this, '#222');
        context.save();
            context.translate(this.x, this.y);
            if (tabStyle === 'left') {
                fillRect(context, {x: this.tabWidth, y: 0, w: this.w - this.tabWidth, h: this.h}, '#FFF');
                fillRect(context, {x: this.tabWidth + borderSize, y: borderSize, w: this.w - this.tabWidth - 2 * borderSize, h: this.h - 4}, '#444');
            } else {
                fillRect(context, {x: 0, y: this.titleHeight, w: this.w, h: this.h - this.titleHeight}, '#FFF');
                fillRect(context, {x: borderSize, y: this.titleHeight + borderSize, w: this.w - 2 * borderSize, h: this.h - this.titleHeight - 2 * borderSize}, '#444');
            }
            if (tabStyle === 'collapsed') {
                const tabs = computeValue(state, undefined, this.computableTabs, []);
                // Narrow view just shows the title of the current tab with prev/next arrow buttons on the left and right of it.
                const selectedTab = tabs[this.selectedTabIndex];
                if (selectedTab) {
                    const title = computeValue(state, undefined, selectedTab.title, '');
                    // Draw the standard panel background instead of the darker background that normally goes behind tabs.
                    fillRect(context, {x: borderSize, y: borderSize, w: this.w - 2 *  borderSize, h: this.titleHeight - 2 * borderSize}, '#444');
                    fillText(context, {text: title, x: this.w / 2, y: 10, size: this.titleHeight - 16, textAlign: 'center', textBaseline: 'top', color: '#FFF'});
                    //fillText(context, {text: title, x: this.w / 2, y: this.titleHeight / 2, size: 20, textAlign: 'center', textBaseline: 'middle', color: '#FFF'});
                }
            }
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getTabStyle(state: GameState): 'top'|'left'|'collapsed' {
        if (this.tabStyle) {
            return this.tabStyle;
        }
        // When very narrow, tabs appear collapsed at the top of the panel with
        // arrow buttons to cycle through the tabs one at a time.
        if (this.w < 250 + this.tabWidth) {
            return 'collapsed';
        }
        // When the panel is wide enough, each tab is displayed along the top.
        const tabs = computeValue(state, undefined, this.computableTabs, []);
        if (this.w >= (this.tabWidth + 5) * tabs.length) {
            return 'top';
        }
        // Tabs can be displayed to the left of the panel if it is wide enough
        // to show the tabs stacked vertically to the left of the panel.
        return 'left';
    }
    selectTabIndex(state: GameState, index: number) {
        const tabs = computeValue(state, undefined, this.computableTabs, []);
        this.selectedTabIndex = index % tabs.length;
        this.onSelectTab?.(state, index);
    }
    getChildren(state: GameState) {
        return this.children;
    }
}
