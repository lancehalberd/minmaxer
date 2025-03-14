import {frameLength, uiSize} from 'app/gameConstants';
import {computeValue} from 'app/utils/computed';
import {gainSkillExperience, getHeroSkill} from 'app/utils/hero';
import {getItemLabel} from 'app/utils/inventory';
import {progressJob} from 'app/utils/job';
import {createJobComponent} from 'app/ui/jobComponent';

interface CraftingJobDefinition {
    item: InventoryKey
    // Defaults to 1.
    amount?: Computed<number, JobDefinition>
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
    // We used to have arrows in the game, but it didn't really add much beyond toil.
    /*{
        item: 'woodArrow',
        // TODO: Add upgrades to eventually increase this to 100.
        amount: 10,
        resourceCost: {wood: 1},
        workerSeconds: 10,
        repeat: true,
    },*/
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
];


let y = -4 * uiSize, x = 5 * uiSize, scale = 2;
for (const craftingJobDefinition of craftingJobDefinitions) {
    const label = getItemLabel(craftingJobDefinition.item);
    const jobDefinition: JobDefinition = {
        key: 'craft-' + craftingJobDefinition.item,
        label: 'Make ' + label,
        resourceCost: craftingJobDefinition.resourceCost,
        essenceCost: craftingJobDefinition.essenceCost,
        workerSeconds: craftingJobDefinition.workerSeconds,
        repeat: craftingJobDefinition.repeat,
        onComplete(state: GameState) {
            state.inventory[craftingJobDefinition.item] = (state.inventory[craftingJobDefinition.item] ?? 0 )
                + computeValue(state, jobDefinition, craftingJobDefinition.amount, 1);
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
    craftingJobDefinition.element = createJobComponent({jobDefinition, scale, x, y});
    y += 2.5 * uiSize * scale;
    if (y >= 8 * uiSize * scale) {
        y = -4 * uiSize * scale;
        x += 8 * uiSize * scale;
    }
};

