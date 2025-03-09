import {healingWind, createNexusAbility} from 'app/definitions/nexusAbilities';
import {snakePit} from 'app/definitions/zones/snakePit';
import {Cave} from 'app/objects/structure';
import {addBasicHeroes} from 'app/objects/hero';
import {createNexus} from 'app/objects/nexus';
import {initializeSpawners} from 'app/objects/spawner';


const tempAbility = createNexusAbility(healingWind);
tempAbility.level = 1;

const world: World = {
    name: 'World',
    floorColor: '#309A51',
    time: 20,
    nextSpawnerLevel: 1,
    effects: [],
    objects: [],
    zoneEnemyCooldowns: new Map(),
}
const nexus = createNexus(world);
const snakePitCave = new Cave({zone: world, zoneDefinition: snakePit, x: -200, y: 0});
world.objects.push(nexus);
world.objects.push(snakePitCave);

export const state: GameState = {
    nexus,
    heroSlots: [undefined],
    nexusAbilities: [tempAbility],
    nexusAbilitySlots: [tempAbility],
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
    inventory: {},
    discoveredItems: new Set(),
    availableHeroes: [],
    lastTimeRendered: 0,
    time : 0,
    isPaused: true,
    nextWaveIndex: 0,
    waves: [],
    waveScale: 1/3,
    world,
    camera: {
        zone: world,
        scale: 2,
        x: 0,
        y: 0,
        speed: 200,
        target: {x: 0, y: 0},
        isLocked: true,
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

addBasicHeroes(state);
initializeSpawners(state);

window.state = state;
