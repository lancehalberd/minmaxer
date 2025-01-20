import {frameLength, uiSize} from 'app/gameConstants';
import {gainSkillExperience, getHeroSkill} from 'app/utils/hero';
import {createJobElement, progressJob} from 'app/utils/job';


export function gainWallLevel(state: GameState) {
    state.city.wall.level++;
    if (state.city.wall.level === 1) {
        state.city.wall.maxHealth = 100;
        state.city.maxPopulation += 5;
        state.nexus.r = 60;
    }
    if (state.city.wall.level === 2) {
        state.city.wall.maxHealth = 300;
        state.city.maxPopulation += 10;
        state.nexus.r = 70;
    }
    state.city.wall.health = state.city.wall.maxHealth;
}

const buildWallJobDefinition: JobDefinition = {
    key: 'buildWall',
    label: 'Build Wall',
    resourceCost: {
        wood: 100
    },
    requiredToolType: 'hammer',
    workerSeconds: 100,
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

const repairWallJobDefinition: JobDefinition = {
    key: 'repairWall',
    label: 'Repair Wall',
    resourceCost: {
        // TODO: Make this a function with return value: Math.ceil(sqrt(state.city.wall.maxHealth) / 10).
        wood: 1
    },
    repeat: true,
    requiredToolType: 'hammer',
    // TODO: Make this a function with return value: Math.ceil(sqrt(state.city.wall.maxHealth) / 10).
    workerSeconds: 1,
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


// TODO: Make a list of upgrade definitions and apply the current one for the current level adding Computed<> where necessary to job definition.
const upgradeWallJobDefinition: JobDefinition = {
    key: 'upgradeWall',
    label: 'Repair Wall',
    resourceCost: {
        // TODO: Make this a function with return value: Math.ceil(sqrt(state.city.wall.maxHealth) / 10).
        wood: 1
    },
    repeat: true,
    requiredToolType: 'hammer',
    // TODO: Make this a function with return value: Math.ceil(sqrt(state.city.wall.maxHealth) / 10).
    workerSeconds: 1,
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

export const upgradeWallElement = createJobElement(upgradeWallJobDefinition, {x: -3 * uiSize, y: 1.5 * uiSize}, (state: GameState) => state.nexus);
