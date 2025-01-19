import {ranger, warrior, wizard} from 'app/objects/hero';
import {nexus} from 'app/objects/nexus';

export const state: GameState = {
    nexus,
    heroSlots: [null],
    city: {
        maxPopulation: 10,
        population: 10,
        jobs: {

        },
        wall: {
            level: 0,
            maxHealth: 0,
            health: 0,
            returnDamage: 0,
        },
    },
    inventory: {
        wood: 1000,
        hardWood: 0,
        stone: 0,
        ironOre: 0,
        // Wood chopping tools
        woodHatchet: 0,
        woodAxe: 0,
        stoneAxe: 0,
        ironHatchet: 0,
        steelAxe: 0,
        // Building tools
        woodHammer: 10,
        stoneHammer: 0,
        ironHammer: 0,
        steelHammer: 0,
        // Archery weapons
        shortBow: 5,
        longBow: 0,
        crossBow: 0,
        // Archery ammunition
        woodArrow: 100,
        flintArrow: 0,
        ironArrow: 0,
        steelArrow: 0,
    },
    lastTimeRendered: 0,
    time : 0,
    isPaused: true,
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
        objects: [nexus, ranger, warrior, wizard],
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
