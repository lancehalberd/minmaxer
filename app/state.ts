import {arcticBlast, inferno, healingWind, summonGolems, createNexusAbility} from 'app/definitions/nexusAbilities';
import {bossGauntletZones} from 'app/definitions/zones/bossGauntlet';
import {snakePit} from 'app/definitions/zones/snakePit';
import {Cave} from 'app/objects/structure';
import {addBasicHeroes} from 'app/objects/hero';
import {createNexus} from 'app/objects/nexus';
import {initializeSpawners} from 'app/objects/spawner';


import {getItemKeys} from 'app/definitions/itemDefinitions';

function gainAllItems(state: GameState, amount: number) {
    for (const key of getItemKeys()) {
        state.inventory[key] = (state.inventory[key] ?? 0) + amount;
    }
}

//const testAbility = createNexusAbility(summonGolems);
//testAbility.level = 1;

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
const snakePitCave = new Cave({zone: world, zoneDefinition: snakePit, x: -200, y: 50});
world.objects.push(nexus);
world.objects.push(snakePitCave);
world.objects.push(new Cave({zone: world, zoneDefinition: bossGauntletZones[0], x: 200, y: 50}));

export const state: GameState = {
    nexus,
    maxHeroSkillPoints: 7,
    heroSlots: [undefined],
    maxNexusAbilityLevel: 1,
    nexusAbilities: [
        createNexusAbility(healingWind),
        createNexusAbility(inferno),
        createNexusAbility(arcticBlast),
        createNexusAbility(summonGolems),
    ],
    nexusAbilitySlots: [],
    city: {
        maxPopulation: 5,
        population: 0,
        // This is computed fresh each tick, and manually updated within each tick.
        idlePopulation: 0,
        idleToolCounts: {axe: 0, hammer: 0, pickaxe: 0, bow: 0, staff: 0},
        jobs: {},
        wall: {
            level: 0,
            maxHealth: 0,
            health: 0,
            returnDamage: 0,
        },
    },
    inventory: {},
    craftedWeapons: [],
    craftedArmors: [],
    craftedCharms: [],
    craftingBench: {
        equipmentType: 'weapon',
        maxDecorationSlots: 0,
        baseMaterialSlots: [],
        decorationSlots: [],
    },
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
    openPanels: [],
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

/*
state.craftingBench.baseMaterialSlots.push(undefined);
state.craftingBench.baseMaterialSlots.push(undefined);
state.craftingBench.baseMaterialSlots.push(undefined);
state.craftingBench.baseMaterialSlots.push(undefined);
state.craftingBench.baseMaterialSlots.push(undefined);
state.craftingBench.decorationSlots.push(undefined);
state.craftingBench.decorationSlots.push(undefined);
state.craftingBench.decorationSlots.push(undefined);
state.craftingBench.decorationSlots.push(undefined);
state.craftingBench.decorationSlots.push(undefined);
gainAllItems(state, 5);*/
gainAllItems;//(state, 5);

window.state = state;
