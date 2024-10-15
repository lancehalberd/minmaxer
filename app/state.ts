import {ranger, warrior, wizard} from 'app/objects/hero';
import {nexus} from 'app/objects/nexus';
import {snakeSpawner} from 'app/objects/spawner';

export const state: GameState = {
    nexus,
    heroSlots: [null],
    lastTimeRendered: 0,
    time : 0,
    world: {
        time: 1000,
        camera: {scale: 2, x: 200, y: -100},
        objects: [nexus, ranger, warrior, wizard, snakeSpawner],
    },
    mouse: {
        currentPosition: {x: 0, y: 0},
    },
};

window.state = state;
