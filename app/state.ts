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
            x: nexus.x,
            y: nexus.y,
            speed: 200,
            target: {x: nexus.x, y: nexus.y},
        },
        nextSpawnerLevel: 1,
        effects: [],
        objects: [nexus, ranger, warrior, wizard],
    },
    hudButtons: [],
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
