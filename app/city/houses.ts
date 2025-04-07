import {uiSize} from 'app/gameConstants';
import {createJobComponent} from 'app/ui/jobComponent';
import {getOrCreateJob} from 'app/utils/job';


export function buildHut(state: GameState) {
    state.city.maxPopulation += 2;
    state.city.houses.huts++;
}
export const buildHutJobDefinition: JobDefinition = {
    key: 'buildHut',
    label: (state: GameState) => 'Build Hut',
    requiredToolType: 'hammer',
    resourceCost: {wood: 200},
    onComplete: (state: GameState) => {
        buildHut(state);
    },
    isValid(state: GameState) {
        return state.city.houses.huts < state.city.houses.maxHouses;
    },
    workerSeconds: (state: GameState) => 200,
};
export const buildHutJobElement = createJobComponent({jobDefinition: buildHutJobDefinition, scale: 2, x: -6.5 * uiSize, y: -3.5 * uiSize});

export function buildCabin(state: GameState) {
    state.city.maxPopulation += 3;
    state.city.houses.cabins++;
}
export const buildCabinJobDefinition: JobDefinition = {
    key: 'buildCabin',
    label: (state: GameState) => 'Build Cabin',
    requiredToolType: 'hammer',
    resourceCost: {hardwood: 100},
    onComplete: (state: GameState) => {
        buildCabin(state);
    },
    isValid(state: GameState) {
        return state.city.houses.cabins < state.city.houses.huts && state.discoveredItems.has('hardwood');
    },
    workerSeconds: (state: GameState) => 1000,
};
export const buildCabinJobElement = createJobComponent({jobDefinition: buildCabinJobDefinition, scale: 2, x: -6.5 * uiSize, y: -3.5 * uiSize});

export function buildCottage(state: GameState) {
    state.city.maxPopulation += 5;
    state.city.houses.cottages++;
}
export const buildCottageJobDefinition: JobDefinition = {
    key: 'buildCottage',
    label: (state: GameState) => 'Build Cottage',
    requiredToolType: 'hammer',
    resourceCost: {hardwood: 20, stone: 200},
    onComplete: (state: GameState) => {
        buildCottage(state);
    },
    isValid(state: GameState) {
        return state.city.houses.cottages < state.city.houses.cabins && state.discoveredItems.has('stone');
    },
    workerSeconds: (state: GameState) => 5000,
};
export const buildCottageJobElement = createJobComponent({jobDefinition: buildCottageJobDefinition, scale: 2, x: -6.5 * uiSize, y: -3.5 * uiSize});

export function buildTower(state: GameState) {
    state.city.maxPopulation += 10;
    state.city.houses.towers++;
}
export const buildTowerJobDefinition: JobDefinition = {
    key: 'buildTower',
    label: (state: GameState) => 'Build Tower',
    requiredToolType: 'hammer',
    resourceCost: {steel: 20, stone: 1000},
    onComplete: (state: GameState) => {
        buildTower(state);
    },
    isValid(state: GameState) {
        return state.city.houses.towers < state.city.houses.cottages && state.discoveredItems.has('steel');
    },
    workerSeconds: (state: GameState) => 20000,
};
export const buildTowerJobElement = createJobComponent({jobDefinition: buildTowerJobDefinition, scale: 2, x: -6.5 * uiSize, y: -3.5 * uiSize});

export function registerHouseJobs(state: GameState) {
    getOrCreateJob(state, buildHutJobDefinition);
    getOrCreateJob(state, buildCabinJobDefinition);
    getOrCreateJob(state, buildCottageJobDefinition);
    getOrCreateJob(state, buildTowerJobDefinition);
}
