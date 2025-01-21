import {frameLength, uiSize} from 'app/gameConstants';
import {gainSkillExperience, getHeroSkill} from 'app/utils/hero';
import {createJobElement, progressJob} from 'app/utils/job';

interface WallLevelDefinition {
    resourceCost: ComputedResourceCost
    workerSeconds: number
    maxHealth: number
    populationIncrease: number
    nexusSize: number
}
const wallLevels: WallLevelDefinition[] = [
    {resourceCost: {wood: 100}, workerSeconds: 100, maxHealth: 100, populationIncrease: 5, nexusSize: 60},
    {resourceCost: {wood: 500}, workerSeconds: 500, maxHealth: 300, populationIncrease: 10, nexusSize: 70},
    {resourceCost: {wood: 2000, stone: 100}, workerSeconds: 2000, maxHealth: 500, populationIncrease: 10, nexusSize: 80},
    {resourceCost: {wood: 10000, stone: 500}, workerSeconds: 10000, maxHealth: 1000, populationIncrease: 10, nexusSize: 90},
    {resourceCost: {wood: 100000, stone: 2000}, workerSeconds: 100000, maxHealth: 2000, populationIncrease: 20, nexusSize: 100},
];

export function gainWallLevel(state: GameState) {
    const levelDefinition = wallLevels[state.city.wall.level];
    state.city.wall.maxHealth = levelDefinition.maxHealth;
    state.city.maxPopulation += levelDefinition.populationIncrease;
    state.nexus.r = levelDefinition.nexusSize;
    state.city.wall.level++;
    state.city.wall.health = state.city.wall.maxHealth;
}

const buildWallJobDefinition: JobDefinition = {
    key: 'buildWall',
    label: 'Build Wall',
    resourceCost: wallLevels[0].resourceCost,
    requiredToolType: 'hammer',
    workerSeconds: wallLevels[0].workerSeconds,
    onComplete(state: GameState) {
        if (!state.city.wall.level) {
            gainWallLevel(state, )
        }
    },
    applyHeroProgress(state: GameState, job: Job, hero: Hero) {
        const skill = getHeroSkill(state, hero, 'building');
        const progress = (skill.level + 1) * frameLength / 1000;
        if (progressJob(state, job, progress)) {
            gainSkillExperience(state, hero, 'building', frameLength / 1000);
        }
    },
};

export const buildWallElement = createJobElement(buildWallJobDefinition, {x: -3 * uiSize, y: -uiSize}, (state: GameState) => state.nexus);

// Job to repair wall. Initially this takes 1 wood + 1 second to repair 1% of health (1)
// But as the max health of the wall increases the cost in wood+time increase proportional to sqrt(maxWallHealth)
// while the repair % stays the same so it is more efficient the higher the max wall health is.
const repairWallJobDefinition: JobDefinition = {
    key: 'repairWall',
    label: 'Repair Wall',
    resourceCost: {
        // This is 1 at 100 max health, 10 at 10,000 max health
        wood: (state: GameState) => Math.ceil(Math.sqrt(state.city.wall.maxHealth) / 10),
    },
    repeat: true,
    requiredToolType: 'hammer',
    // This is the same value used for the wood cost above.
    workerSeconds: (state: GameState) => Math.ceil(Math.sqrt(state.city.wall.maxHealth) / 10),
    canProgress(state: GameState) {
        return state.city.wall.health < state.city.wall.maxHealth;
    },
    onComplete(state: GameState) {
        state.city.wall.health = state.city.wall.health + Math.ceil(state.city.wall.maxHealth / 100);
        state.city.wall.health = Math.min(state.city.wall.health, state.city.wall.maxHealth);
    },
    applyHeroProgress(state: GameState, job: Job, hero: Hero) {
        const skill = getHeroSkill(state, hero, 'building');
        const progress = (skill.level + 1) * frameLength / 1000;
        if (progressJob(state, job, progress)) {
            gainSkillExperience(state, hero, 'building', frameLength / 1000);
        }
    },
};

export const repairWallElement = createJobElement(repairWallJobDefinition, {x: -3 * uiSize, y: 1.5 * uiSize}, (state: GameState) => state.nexus);

const upgradeWallJobDefinition: JobDefinition = {
    key: 'upgradeWall',
    label: 'Upgrade Wall',
    resourceCost: (state: GameState) => wallLevels[state.city.wall.level].resourceCost,
    requiredToolType: 'hammer',
    workerSeconds: (state: GameState) => wallLevels[state.city.wall.level].workerSeconds,
    canProgress(state: GameState) {
        return !!wallLevels[state.city.wall.level]
    },
    onComplete(state: GameState) {
        gainWallLevel(state);
    },
    applyHeroProgress(state: GameState, job: Job, hero: Hero) {
        const skill = getHeroSkill(state, hero, 'building');
        const progress = (skill.level + 1) * frameLength / 1000;
        if (progressJob(state, job, progress)) {
            gainSkillExperience(state, hero, 'building', frameLength / 1000);
        }
    },
};

export const upgradeWallElement = createJobElement(upgradeWallJobDefinition, {x: -3 * uiSize, y: -uiSize}, (state: GameState) => state.nexus);
