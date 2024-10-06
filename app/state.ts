import {hero} from 'app/objects/hero';
import {nexus} from 'app/objects/nexus';
import {snakeSpawner} from 'app/objects/spawner';

export const state: GameState = {
    hero,
    world: {
        time: 1000,
        camera: {x: 0, y: 0},
        objects: [nexus, hero, snakeSpawner],
    },
    mouse: {
        currentPosition: {x: 0, y: 0},
    },
};

window.state = state;
