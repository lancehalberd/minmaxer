import {ranger, warrior, wizard} from 'app/objects/hero';
import {nexus} from 'app/objects/nexus';

export const state: GameState = {
    nexus,
    heroSlots: [null],
    lastTimeRendered: 0,
    time : 0,
    world: {
        time: 1000,
        camera: {
            scale: 2,
            x: 200,
            y: -100,
            speed: 200,
            target: {x: 200, y: -100},
        },
        objects: [nexus, ranger, warrior, wizard],
    },
    mouse: {
        currentPosition: {x: 0, y: 0},
    },
};

window.state = state;
