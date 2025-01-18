import {ranger, warrior, wizard} from 'app/objects/hero';
import {nexus} from 'app/objects/nexus';

export const state: GameState = {
    nexus,
    heroSlots: [null],
    city: {
        maxPopulation: 10,
        population: 10,
        // Stats from the Palisade upgrade.
        maxWallHealth: 100,
        wallHealth: 100,
        wallReturnDamage: 2,
        archers: 1,
    },
    inventory: {
        wood: 1000,
        hardWood: 0,
        stone: 0,
        ironOre: 0,
        // Wood chopping tools
        woodHatchet: 0,
        stoneHatchet: 0,
        ironHatchet: 0,
        steelHatchet: 0,
        // Building tools
        woodHammer: 0,
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
