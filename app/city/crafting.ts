import {frameLength, uiSize} from 'app/gameConstants';
import {computeValue} from 'app/utils/computed';
import {gainSkillExperience, getHeroSkill} from 'app/utils/hero';
import {inventoryLabels} from 'app/utils/inventory';
import {createJobElement, progressJob} from 'app/utils/job';

interface CraftingJobDefinition {
    item: InventoryKey
    // Defaults to 1.
    amount?: Computed<number, JobDefinition>
    // Use Computed to allow making these variable.
    resourceCost: ResourceCost<JobDefinition>
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
        item: 'woodStaff',
        resourceCost: {wood: 10},
        workerSeconds: 10,
    },
    {
        item: 'shortBow',
        resourceCost: {wood: 5},
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
    {
        item: 'stonePickaxe',
        resourceCost: {stone: 2},
        workerSeconds: 60,
    },
    {
        item: 'stoneAxe',
        resourceCost: {stone: 2},
        workerSeconds: 60,
    },
    {
        item: 'stoneHammer',
        resourceCost: {stone: 2},
        workerSeconds: 60,
    },
    {
        item: 'flintArrow',
        // TODO: Add upgrades to eventually increase this to 100.
        amount: 10,
        resourceCost: {stone: 1, wood: 2},
        workerSeconds: 20,
        repeat: true,
    },
];


let y = -4 * uiSize, x = 5 * uiSize;
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
            state.inventory[craftingJobDefinition.item] += computeValue(state, jobDefinition, craftingJobDefinition.amount, 1);
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
    craftingJobDefinition.element = createJobElement(jobDefinition, {x, y});
    y += 3 * uiSize;
    if (y >= 11 * uiSize) {
        y = -4 * uiSize;
        x += 8 * uiSize
    }
};

