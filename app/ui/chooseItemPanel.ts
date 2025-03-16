import {canvas, uiSize} from 'app/gameConstants';
import {CharacterIconButton, CloseIconButton} from 'app/ui/iconButton';
import {TextButton} from 'app/ui/textButton';
import {computeValue} from 'app/utils/computed';
import {fillRect, fillText} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';

const itemsPerPage = 15;
interface ChooseItemPanelProps<T extends InventoryItem> extends Partial<UIContainer> {
    title: string
    items: Computed<T[], ChooseItemPanel<T>>
    showQuantity?: boolean
    onHoverItem?: (state: GameState, item: T) => void
    onSelectItem: (state: GameState, item: T) => void
    onClose?: (state: GameState) => void
}
export class ChooseItemPanel<T extends InventoryItem> implements UIContainer {
    objectType = <const>'uiContainer';
    hero?: Hero
    title = this.props.title;
    items = this.props.items;
    onHoverItem = this.props.onHoverItem;
    onSelectItem = this.props.onSelectItem;
    showQuantity = this.props.showQuantity ?? true;
    w = this.props.w ?? 250;
    h = this.props.h ?? 400;
    x = this.props.x ?? 300;
    y = this.props.y ?? (canvas.height - this.h) / 2;
    page = 0;
    onClose = this.props.onClose;
    closeButton = new CloseIconButton({
        x: this.w - 2 * uiSize,
        y: uiSize,
        w: uiSize,
        h: uiSize,
        onPress: (state: GameState) => {
            this.onClose?.(state);
            return true;
        },
    });
    prevButton = new CharacterIconButton({
        x: this.w / 2 - 3 * uiSize,
        y: this.h - 3 * uiSize,
        character: '<',
        onClick: (state: GameState) => {
            const items = this.getItems(state);
            this.page = (this.page + items.length - 1) % items.length;
            return true;
        },
    });
    nextButton = new CharacterIconButton({
        x: this.w / 2 + uiSize,
        y: this.h - 3 * uiSize,
        character: '>',
        onClick: (state: GameState) => {
            const items = this.getItems(state);
            this.page = (this.page + 1) % items.length;
            return true;
        },
    });
    constructor(public props: ChooseItemPanelProps<T>) {}
    totalPages(state: GameState) {
        return Math.ceil(this.getItems(state).length / itemsPerPage);
    }
    update(state: GameState) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        const hero = state.selectedHero;
        if (!hero) {
            return;
        }
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, - 2), '#444');
        context.save();
            context.translate(this.x, this.y);
            fillText(context, {text: this.title, x: this.w / 2, y: 10, size: 20, textAlign: 'center', textBaseline: 'top', color: '#FFF'});
            fillRect(context, {x: 0, y: 35, w: this.w, h: 2}, '#FFF');
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getItems(state: GameState): T[] {
        return computeValue(state, this, this.items, []);
    }
    getChildren(state: GameState) {
        const children: UIElement[] = [];
        if (this.onClose) {
            children.push(this.closeButton);
        }
        let y = 45;
        for (const item of this.getItems(state)) {
            const itemButton = new TextButton({
                y,
                uniqueId: 'choose-item-' + this.title + y,
                text: (state: GameState) => {
                    if (this.showQuantity && item.key && state.inventory[item.key]) {
                        return state.inventory[item.key] + ' ' + item.name;
                    }
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
            itemButton.x = (this.w - itemButton.w) / 2;
            children.push(itemButton);
            y += 2.5 * uiSize;
        }
        if (this.totalPages(state) > 1) {
            children.push(this.prevButton);
            children.push(this.nextButton);
        }
        return children;
    }
}
