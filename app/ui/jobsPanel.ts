import {archerJobElement} from 'app/city/archers';
import {craftingJobDefinitions} from 'app/city/crafting';
import {buildWallElement, repairWallElement, upgradeWallElement} from 'app/city/cityWall';
import {healerJobElement} from 'app/city/healer';
import {canvas, uiPadding, uiSize} from 'app/gameConstants';
import {CharacterIconButton} from 'app/ui/iconButton';
import {PanelPadding, TabbedPanel} from 'app/ui/panel';
import {computeValue} from 'app/utils/computed';
import {isJobDiscovered} from 'app/utils/job';


export function toggleJobsPanel(state: GameState, open = !state.openJobsPanel) {
    state.openJobsPanel = open;
    state.openCharacterPanel = false;
    state.openChooseArmorPanel = false;
    state.openChooseWeaponPanel = false;
    state.openChooseCharmPanel = false;
}

export class JobsList implements UIContainer {
    objectType = <const>'uiContainer';
    w = 250;
    h = 500;
    x = 40;
    y = (canvas.height - this.h) / 2;
    page = 0;
    jobElements: UIElement[] = [];
    children: UIElement[] = [];
    prevButton = new CharacterIconButton({
        character: '<',
        onClick: (state: GameState) => {
            const pages = this.totalPages(state);
            this.page = (this.page + pages - 1) % pages;
            return true;
        },
        resize(state: GameState, container: UIContainer) {
            this.x = container.w / 2 - 3 * uiPadding - this.w;
            this.y = container.h - this.h;
        },
    });
    nextButton = new CharacterIconButton({
        character: '>',
        onClick: (state: GameState) => {
            const pages = this.totalPages(state);
            this.page = (this.page + 1) % pages;
            return true;
        },
        resize(state: GameState, container: UIContainer) {
            this.x = container.w / 2 + 3 * uiPadding;
            this.y = container.h - this.h;
        },
    });
    constructor(public computableJobElements: Computed<JobUIElement[], undefined>) { }
    getItemsPerPage(state: GameState) {
        return Math.floor((this.h - 2 * uiPadding - uiSize) / (5 * uiSize));
    }
    totalPages(state: GameState) {
        return Math.ceil(this.jobElements.length / this.getItemsPerPage(state));
    }
    update(state: GameState) {
        this.jobElements = computeValue(state, undefined, this.computableJobElements, []);
        const itemsPerPage = this.getItemsPerPage(state);
        // this.updateCraftingElements(state);
        if (this.page * itemsPerPage >= this.jobElements.length) {
            this.page = 0;
        }

        this.children = [];
        // Just include the current page of crafting options.
        for (let i = 0; i < itemsPerPage; i++) {
            const element = this.jobElements[this.page * itemsPerPage + i];
            if (!element) {
                break;
            }
            element.parent = this;
            element.x = (this.w - element.w) / 2;
            element.y = i * 5 * uiSize;
            this.children.push(element);
        }
        if (this.totalPages(state) > 1) {
            this.children.push(this.prevButton);
            this.children.push(this.nextButton);
        }
        for (const child of this.children) {
            child.update?.(state);
            child.resize?.(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            context.translate(this.x, this.y);
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

function getCraftingJobElements(state: GameState): JobUIElement[] {
    const jobElements: JobUIElement[] = [];
    for (const craftingJobDefinition of craftingJobDefinitions) {
        if (!craftingJobDefinition.jobDefinition || !craftingJobDefinition.element || !isJobDiscovered(state, craftingJobDefinition.jobDefinition)) {
            continue;
        }
        jobElements.push(craftingJobDefinition.element);
    }
    return jobElements;
}

function getBuildingJobElements(state: GameState): JobUIElement[] {
    const jobElements: JobUIElement[] = [];
    for (const wallElement of [buildWallElement, repairWallElement, upgradeWallElement]) {
        const definition = wallElement.jobDefinition;
         if (!definition.isValid || definition.isValid(state)) {
             jobElements.push(wallElement);
         }
    }
    return jobElements;
}

function getTrainingJobElements(state: GameState): JobUIElement[] {
    const jobElements: JobUIElement[] = [];
    for (const wallElement of [archerJobElement, healerJobElement]) {
        const definition = wallElement.jobDefinition;
         if (!definition.isValid || definition.isValid(state)) {
             jobElements.push(wallElement);
         }
    }
    return jobElements;
}

function getAllJobElements(state: GameState): JobUIElement[] {
    return [
        ...getCraftingJobElements(state),
        ...getBuildingJobElements(state),
        ...getTrainingJobElements(state),
    ]
}

const allJobsList = new JobsList(getAllJobElements);
const craftingJobsList = new JobsList(getCraftingJobElements);
const buildingJobsList = new JobsList(getBuildingJobElements);
const trainingJobsList = new JobsList(getTrainingJobElements);

export const jobsPanel = new TabbedPanel({
    tabs(state: GameState) {
        const tabs = [{
            title: 'Building',
            content: new PanelPadding(buildingJobsList),
        },{
            title: 'Manufacture',
            content: new PanelPadding(craftingJobsList),
        },];
        if (state.city.wall.level) {
            tabs.push({
                title: 'Training',
                content: new PanelPadding(trainingJobsList),
            });
        }
        tabs.push({
            title: 'All Jobs',
            content: new PanelPadding(allJobsList),
        });
        return tabs;
    },
    onClose(state: GameState) {
        toggleJobsPanel(state, false);
    }
});
