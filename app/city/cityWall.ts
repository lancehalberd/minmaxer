import {uiSize} from 'app/gameConstants';
import {createJobElement} from 'app/utils/job';

const buildWallJobDefinition: JobDefinition = {
    key: 'buildWall',
    label: 'Build Wall',
    resourceCost: {
        wood: 100
    },
    requiredToolType: 'hammer',
    workerSeconds: 100,
    onComplete(state: GameState) {
        state.city.wall = {
            level: 1,
            maxHealth: 100,
            health: 100,
            returnDamage: 1,
        };
        state.nexus.r = 60;
    }
};

export const buildWallElement = createJobElement(buildWallJobDefinition, {x: - 2 * uiSize, y: -uiSize});

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
    }
};

export const repairWallElement = createJobElement(repairWallJobDefinition, {x: (-4.5) * uiSize, y: 1.5 * uiSize});
