import {ranger, warrior, wizard} from 'app/objects/hero';
import {nexus} from 'app/objects/nexus';

export const state: GameState = {
    nexus,
    heroSlots: [null],
    lastTimeRendered: 0,
    time : 0,
    isPaused: true,
    world: {
        time: 20,
        camera: {
            scale: 2,
            x: 200,
            y: -100,
            speed: 200,
            target: {x: 200, y: -100},
        },
        nextSpawnerLevel: 1,
        effects: [],
        objects: [nexus, ranger, warrior, wizard],
    },
    hudButtons: [],
    mouse: {
        currentPosition: {x: 0, y: 0},
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
