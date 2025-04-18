import {registerWallJobs} from 'app/city/cityWall';
import {registerCraftingJobs} from 'app/city/crafting';
import {registerHouseJobs} from 'app/city/houses';
import {getItemKeys} from 'app/definitions/itemDefinitions';
import {arcticBlast, inferno, healingWind, summonGolems, createNexusAbility} from 'app/definitions/nexusAbilities';
import {bossGauntletZones} from 'app/definitions/zones/bossGauntlet';
import {snakePit} from 'app/definitions/zones/snakePit';
import {Cave} from 'app/objects/structure';
import {addBasicHeroes} from 'app/objects/hero';
import {createNexus} from 'app/objects/nexus';
import {initializeSpawners} from 'app/objects/spawner';
import {calculatePrestigeStats} from 'app/utils/prestige';
import {saveGame} from 'app/utils/saveGame';

function gainAllItems(state: GameState, amount: number) {
    for (const key of getItemKeys()) {
        state.inventory[key] = (state.inventory[key] ?? 0) + amount;
    }
}
function testAbility(state: GameState, abilityDefinition: NexusAbilityDefinition<any>) {
    const testAbility = createNexusAbility(abilityDefinition);
    testAbility.level = 1;
    state.nexusAbilitySlots.push(testAbility);
}

export function getNewGameState(): GameState {
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

    const state: GameState = {
        nexus,
        maxHeroSkillPoints: 7,
        heroSlots: [undefined],
        maxNexusAbilityLevel: 0,
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
            archers: {
                level: 0,
                damage: 0,
                attacksPerSecond: 0,
                range: 0,
            },
            mages: {
                level: 0,
                power: 0,
                cooldownSpeed: 0,
                range: 0,
                cooldowns: {},
                globalCooldown: 0,
            },
            houses: {
                maxHouses: 0,
                huts: 0,
                cabins: 0,
                cottages: 0,
                towers: 0,
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
            speed: 400,
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
        autosaveEnabled: true,
        fastForwardSpeed: 10,
        prestige: {
            lootRarityBonus: 0,
            archerExperienceBonus: 0,
            mageExperienceBonus: 0,
            essenceGainBonus: 0,
            heroExperienceBonus: 0,
            skillExperienceBonus: 0,
        },
        highestLevelEnemyDefeated: 0,
    };

    addBasicHeroes(state);
    initializeSpawners(state);
    registerWallJobs(state);
    registerCraftingJobs(state);
    registerHouseJobs(state);

    return state;
}

let state: GameState = getNewGameState();
window.state = state;
export function getState(): GameState {
    return state;
}
window.getState = getState
export function setState(newState: GameState) {
    state = newState;
    window.state = state;
}
window.setState = setState;
export function resetGame(): GameState {
    setState(getNewGameState());
    return state;
}
window.resetGame = resetGame;

export function restartGame(state: GameState) {
    const autosaveEnabled = state.autosaveEnabled;
    const newGameState = getNewGameState();
    newGameState.prestige = calculatePrestigeStats(state);
    setState(newGameState);
    newGameState.autosaveEnabled = autosaveEnabled;
    if (autosaveEnabled) {
        saveGame(newGameState);
    }
}
window.restartGame = restartGame;

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
testAbility//(state, arcticBlast);

