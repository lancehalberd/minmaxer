import {canvas, uiSize} from 'app/gameConstants';
import {isMouseOverTarget} from 'app/mouse';
import {CharacterIconButton, CloseIconButton} from 'app/ui/iconButton';
import {computeValue} from 'app/utils/computed';
import {fillRect, fillText} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';


interface ItemButtonProps<T extends InventoryItem> extends Partial<UIButton> {
    item: T;
    itemLabel: string
    itemQuantity?: number
    onHoverItem?: (state: GameState, item: T) => void
    onSelectItem: (state: GameState, item: T) => void
}
export class ItemButton<T extends InventoryItem> implements UIButton {
    objectType = <const>'uiButton';
    uniqueId = this.props.uniqueId;
    item: T = this.props.item;
    itemLabel = this.props.itemLabel;
    itemQuantity = this.props.itemQuantity;
    onHoverItem = this.props.onHoverItem;
    onSelectItem = this.props.onSelectItem;
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    w = this.props.w ?? 100;
    h = this.props.h ?? 2 * uiSize;
    disabled = this.props.disabled;
    constructor(public props: ItemButtonProps<T>) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (isMouseOverTarget(state, this)) {
            fillRect(context, this, 'rgba(255, 255, 255, 0.3)');
        }
        fillText(context, {text: this.itemLabel, x: this.x + 2, y: this.y + this.h / 2, color: '#FFF', size: 16, textAlign: 'left', textBaseline: 'middle'});
        if (this.itemQuantity !== undefined) {
            fillText(context, {text: 'x' + this.itemQuantity, x: this.x + this.w - 2, y: this.y + this.h / 2, color: '#FFF', size: 16, textAlign: 'right', textBaseline: 'middle'});
        }
    }
    onClick(state: GameState) {
        this.onSelectItem?.(state, this.item);
        return true;
    }
    onHover(state: GameState) {
        this.onHoverItem?.(state, this.item);
        return true;
    }
}


const itemsPerPage = 12;
interface ChooseItemPanelProps<T extends InventoryItem> extends Partial<UIContainer> {
    title: string
    items: Computed<T[], ChooseItemPanel<T>>
    onHoverItem?: (state: GameState, item: T) => void
    onSelectItem: (state: GameState, item: T) => void
    onClose?: (state: GameState) => void
}
export class ChooseItemPanel<T extends InventoryItem> implements UIContainer {
    objectType = <const>'uiContainer';
    uniqueId = this.props.uniqueId;
    hero?: Hero
    title = this.props.title;
    items = this.props.items;
    onHoverItem = this.props.onHoverItem;
    onSelectItem = this.props.onSelectItem;
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
            const pages = this.totalPages(state);
            this.page = (this.page + pages - 1) % pages;
            return true;
        },
    });
    nextButton = new CharacterIconButton({
        x: this.w / 2 + uiSize,
        y: this.h - 3 * uiSize,
        character: '>',
        onClick: (state: GameState) => {
            const pages = this.totalPages(state);
            this.page = (this.page + 1) % pages;
            return true;
        },
    });
    itemButtons: ItemButton<T>[] = [];
    children: UIElement[] = [];
    constructor(public props: ChooseItemPanelProps<T>) {}
    totalPages(state: GameState) {
        return Math.ceil(this.getItems(state).length / itemsPerPage);
    }
    update(state: GameState) {
        this.children = [];
        if (this.onClose) {
            this.children.push(this.closeButton);
        }
        let y = 45;
        const items = this.getItems(state);
        const totalPages = this.totalPages(state);
        this.page = totalPages ? this.page % totalPages : 0;
        for (let i = 0; i < itemsPerPage; i++) {
            const item = items[this.page * itemsPerPage + i];
            if (!item) {
                break;
            }
            const itemLabel = item.name;
            const itemQuantity = item.key ? state.inventory[item.key] ?? 0 : undefined;
            const w = this.w - 2 * uiSize;
            if (!this.itemButtons[i]) {
                this.itemButtons[i] = new ItemButton<T>({
                    x: uiSize,
                    y,
                    w,
                    item,
                    itemLabel,
                    itemQuantity,
                    onHoverItem: this.onHoverItem,
                    onSelectItem: this.onSelectItem,
                });
            } else {
                this.itemButtons[i].item = item;
                this.itemButtons[i].itemLabel = itemLabel
                this.itemButtons[i].itemQuantity = itemQuantity;
                this.itemButtons[i].w = w;
            }
            this.children.push(this.itemButtons[i]);
            y += 2 * uiSize;
        }
        if (totalPages > 1) {
            this.children.push(this.prevButton);
            this.children.push(this.nextButton);
        }
    }
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
        return this.children;
    }
}
