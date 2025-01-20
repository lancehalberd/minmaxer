import {frameLength, uiSize} from 'app/gameConstants';
import {gainSkillExperience, getHeroSkill} from 'app/utils/hero';
import {inventoryLabels} from 'app/utils/inventory';
import {createJobElement, progressJob} from 'app/utils/job';

interface CraftingJobDefinition {
    item: InventoryKey
    // Defaults to 1.
    amount?: Computed<number, CraftingJobDefinition>
    // Use Computed to allow making these variable.
    //resourceCost: Computed<ResourceCost, CraftingJobDefinition>
    resourceCost?: ResourceCost
    essenceCost?: number
    workerSeconds: number
    jobDefinition?: JobDefinition
    element?: UIElement
    repeat?: boolean
}

export const craftingJobDefinitions: CraftingJobDefinition[] = [
    {
        item: 'woodHatchet',
        resourceCost: {wood: 2},
        workerSeconds: 10,
    },
    {
        item: 'woodHammer',
        resourceCost: {wood: 2},
        workerSeconds: 10,
    },
    {
        item: 'shortBow',
        resourceCost: {wood: 1},
        workerSeconds: 10,
    },
    {
        item: 'woodArrow',
        // TODO: Add upgrades to eventually increase this to 100.
        amount: 10,
        resourceCost: {wood: 1},
        workerSeconds: 10,
        repeat: true,
    },
];

function computedIsFunction<T, U>(computed: Computed<T, U>): computed is (state: GameState, object: U) => T {
    return (typeof computed === 'function');
}

function computeValue<T, U>(state: GameState, object: U, computed: Computed<T, U>|undefined, defaultValue: T): T {
    if (computedIsFunction(computed)) {
        return computed(state, object);
    }
    return computed ?? defaultValue;
}

let y = -4 * uiSize;
for (const craftingJobDefinition of craftingJobDefinitions) {
    const label = inventoryLabels[craftingJobDefinition.item] ?? craftingJobDefinition.item;
    const jobDefinition: JobDefinition = {
        key: 'craft-' + craftingJobDefinition.item,
        // TODO: Add item key -> item label mapping here and to inventory.
        label: 'Make ' + label,
        resourceCost: craftingJobDefinition.resourceCost,
        essenceCost: craftingJobDefinition.essenceCost,
        workerSeconds: craftingJobDefinition.workerSeconds,
        repeat:craftingJobDefinition.repeat,
        onComplete(state: GameState) {
            state.inventory[craftingJobDefinition.item] += computeValue(state, craftingJobDefinition, craftingJobDefinition.amount, 1);
        },
        applyHeroProgress(state: GameState, job: Job, hero: Hero) {
            const skill = getHeroSkill(state, hero, 'crafting');
            const progress = (skill.level + 1) * frameLength / 1000;
            if (progressJob(state, job, progress)) {
                gainSkillExperience(state, hero, 'crafting', frameLength / 1000);
            }
        },
    }
    craftingJobDefinition.jobDefinition = jobDefinition;
    craftingJobDefinition.element = createJobElement(jobDefinition, {x: 5 * uiSize, y});
    y += 3 * uiSize;
};

