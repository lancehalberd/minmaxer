import {craftingJobDefinitions} from 'app/city/crafting';
import {canvas, uiSize} from 'app/gameConstants';
import {CharacterIconButton, CloseIconButton} from 'app/ui/iconButton';
import {fillRect} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';
import {isJobDiscovered} from 'app/utils/job';


export function toggleCraftingJobsPanel(state: GameState, open = !state.openCraftingJobsPanel) {
    state.openCraftingJobsPanel = open;
    state.openCharacterPanel = false;
    state.openChooseArmorPanel = false;
    state.openChooseWeaponPanel = false;
    state.openChooseCharmPanel = false;
}

const itemsPerPage = 7;
export class CraftingJobsPanel implements UIContainer {
    objectType = <const>'uiContainer';
    w = 250;
    h = 500;
    x = 40;
    y = (canvas.height - this.h) / 2;
    page = 0;
    closeButton = new CloseIconButton({
        x: this.w - 2 * uiSize,
        y: uiSize,
        w: uiSize,
        h: uiSize,
        onPress: (state: GameState) => {
            toggleCraftingJobsPanel(state, false);
            return true;
        },
    });
    craftingElements: UIElement[] = [];
    updateCraftingElements(state: GameState): void {
        this.craftingElements = [];
        for (const craftingJobDefinition of craftingJobDefinitions) {
            if (!craftingJobDefinition.jobDefinition || !craftingJobDefinition.element || !isJobDiscovered(state, craftingJobDefinition.jobDefinition)) {
                continue;
            }
            this.craftingElements.push(craftingJobDefinition.element);
            craftingJobDefinition.element.update?.(state);
        }
    }
    totalPages(state: GameState) {
        return Math.ceil(this.craftingElements.length / itemsPerPage);
    }
    prevButton = new CharacterIconButton({
        x: this.w / 2 - 3 * uiSize,
        y: this.h - 3 * uiSize,
        character: '<',
        onClick: (state: GameState) => {
            this.page = (this.page + this.craftingElements.length - 1) % this.craftingElements.length;
            return true;
        },
    });
    nextButton = new CharacterIconButton({
        x: this.w / 2 + uiSize,
        y: this.h - 3 * uiSize,
        character: '>',
        onClick: (state: GameState) => {
            this.page = (this.page + 1) % this.craftingElements.length;
            return true;
        },
    });
    update(state: GameState) {
        this.updateCraftingElements(state);
        if (this.page * itemsPerPage >= this.craftingElements.length) {
            this.page = 0;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, - 2), '#444');
        context.save();
            context.translate(this.x, this.y);
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getChildren(state: GameState) {
        const children: UIElement[] = [this.closeButton];
        // Just include the current page of crafting options.
        for (let i = 0; i < itemsPerPage; i++) {
            const element = this.craftingElements[this.page * itemsPerPage + i];
            if (!element) {
                break;
            }
            element.parent = this;
            element.x = (this.w - element.w) / 2;
            element.y = (i + 0.5) * 2.5 * uiSize * 2;
            children.push(element);
        }
        if (this.totalPages(state) > 1) {
            children.push(this.prevButton);
            children.push(this.nextButton);
        }
        return children;
    }
}
