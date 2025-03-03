import {ranger, warrior, wizard} from 'app/objects/hero';
import {nexus} from 'app/objects/nexus';

export const state: GameState = {
    nexus,
    heroSlots: [null],
    city: {
        maxPopulation: 5,
        population: 0,
        // This is computed fresh each tick, and manually updated within each tick.
        idlePopulation: 0,
        jobs: {},
        wall: {
            level: 0,
            maxHealth: 0,
            health: 0,
            returnDamage: 0,
        },
    },
    inventory: {
        hideScraps: 5,
        hide: 3,
        largeHide: 2,
        fur: 2,
        lionPelt: 1,
        bearSkin: 1,
        wood: 20,
        stone: 1,
        iron: 1,
        steel: 1,
    },
    discoveredItems: new Set(),
    availableResources: {
        wood: 0,
        stone: 0,
    },
    availableHeroes: [ranger, warrior, wizard],
    lastTimeRendered: 0,
    time : 0,
    isPaused: true,
    nextWaveIndex: 0,
    waveScale: 1/3,
    world: {
        time: 20,
        camera: {
            scale: 2,
            x: nexus.x,
            y: nexus.y,
            speed: 200,
            target: {x: nexus.x, y: nexus.y},
        },
        nextSpawnerLevel: 1,
        effects: [],
        objects: [nexus],
    },
    hudUIElements: [],
    mouse: {
        currentPosition: {x: 300, y: 300},
    },
    keyboard: {
        gameKeyValues: [],
        gameKeysDown: new Set(),
        gameKeysPressed: new Set(),
        gameKeysReleased: new Set(),
        mostRecentKeysPressed: new Set(),
    },
};

window.state = state;
