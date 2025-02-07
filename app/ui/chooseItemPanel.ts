import {canvas, uiSize} from 'app/gameConstants';
import {TextButton} from 'app/ui/textButton';
import {computeValue} from 'app/utils/computed';
import {fillRect} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';

interface ChooseItemPanelProps<T extends InventoryItem> extends Partial<UIContainer> {
    items: Computed<T[], ChooseItemPanel<T>>
    onHoverItem?: (state: GameState, item: T) => void
    onSelectItem: (state: GameState, item: T) => void
}
export class ChooseItemPanel<T extends InventoryItem> implements UIContainer {
    objectType = <const>'uiContainer';
    hero?: Hero
    items = this.props.items;
    onHoverItem = this.props.onHoverItem;
    onSelectItem = this.props.onSelectItem;
    w = this.props.w ?? 250;
    h = this.props.h ?? 400;
    x = this.props.x ?? 300;
    y = this.props.y ?? (canvas.height - this.h) / 2;
    constructor(public props: ChooseItemPanelProps<T>) {}
    update(state: GameState) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        const hero = state.selectedHero;
        if (!hero) {
            return;
        }
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, - 2), '#444');

        const children = this.getChildren?.(state) ?? [];
        for (const child of children) {
            child.render(context, state);
        }
    }
    getChildren(state: GameState) {
        const buttons: UIElement[] = [];
        let y = this.y + 5;
        for (const item of computeValue(state, this, this.items, [])) {
            const itemButton = new TextButton({
                x: this.x + 5,
                y,
                uniqueId: 'choose-item-' + y,
                text(state: GameState) {
                    return item.name;
                },
                onHover: (state: GameState) => {
                    this.onHoverItem?.(state, item);
                    return true;
                },
                onClick: (state: GameState) => {
                    this.onSelectItem(state, item);
                    return true;
                },
            });
            buttons.push(itemButton);
            y += 2.5 * uiSize;
        }
        return buttons;
    }
}
