import {archerJobDefinition} from 'app/city/archers';
import {mageJobDefinition} from 'app/city/mages';
import {savedGameKey} from 'app/gameConstants';
import {clearCraftingBench} from 'app/ui/craftingBenchPanel';
import {getOrCreateJob} from 'app/utils/job';
import {isCraftedWeapon, isCraftedArmor, isCraftedCharm, typedKeys} from 'app/utils/types';


function exportSavedJobsData(state: GameState): SavedJobData[] {
    const savedJobs: SavedJobData[] = []

    for (const job of Object.values(state.city.jobs)) {
        savedJobs.push({
            jobKey: job.definition.key,
            isPaidFor: job.isPaidFor,
            shouldRepeatJob: job.shouldRepeatJob,
            workers: job.workers,
            workerSecondsCompleted: job.workerSecondsCompleted,
        })
    }
    return savedJobs;
}

function exportSavedWorldData(state: GameState): SavedWorldData {
    const savedWorldData: SavedWorldData = {
        structureData: {},
    };
    for (const object of state.world.objects) {
        if (object.objectType === 'structure' && object.structureId) {
            const exportedData = object.exportData?.(state);
            if (exportedData) {
                savedWorldData.structureData[object.structureId] = exportedData;
            }
        }
    }
    return savedWorldData;
}

function exportSavedNexusData(state: GameState): SavedNexusData {
    const abilityLevels: {[key in NexusAbilityKey]?: number} = {};
    for (const ability of state.nexusAbilities) {
        abilityLevels[ability.definition.abilityKey] = ability.level;
    }
    const nexus: SavedNexusData = {
        essence: state.nexus.essence,
        abilityLevels,
        abilitySlots: state.nexusAbilitySlots.map(ability => ability?.definition.abilityKey),
    };
    return nexus;
}

function exportSavedCityData(state: GameState): SavedCityData {
    const cityData: SavedCityData = {
        population: state.city.population,
        wall: {
            level: state.city.wall.level,
            health: state.city.wall.health,
        },
        archers: {
            level: state.city.archers.level,
            jobProgress: getOrCreateJob(state, archerJobDefinition).workerSecondsCompleted,
        },
        mages: {
            level: state.city.mages.level,
            jobProgress: getOrCreateJob(state, mageJobDefinition).workerSecondsCompleted,
        },
        houses: {
            huts: state.city.houses.huts,
            cabins: state.city.houses.cabins,
            cottages: state.city.houses.cottages,
            towers: state.city.houses.towers,
        },
    };
    return cityData;
}

function exportSavedHeroData(hero: Hero|undefined): SavedHeroData|undefined {
    if (!hero) {
        return undefined;
    }
    const skills: {[key in HeroSkillType]?: HeroSkill} = {};
    for (const key of typedKeys(hero.skills)){
        const skill = hero.skills[key];
        if (skill) {
            skills[key] = {...skill};
        }
    }
    return {
        heroType: hero.definition.heroType,
        level: hero.level,
        experience: hero.experience,
        abilityLevels: hero.abilities.map(ability => ability.level),
        weapon: exportEquipment(hero.equipment.weapon),
        armor: exportEquipment(hero.equipment.armor),
        charms: hero.equipment.charms.map(charm => exportEquipment(charm)),
        skills,
    };
}

function exportEquipment(item: GenericItem|undefined): SavedEquipment  {
    if (!item) {
        return undefined;
    }
    if (isCraftedWeapon(item) || isCraftedArmor(item) || isCraftedCharm(item)) {
        return exportSavedCraftedItem(item);
    }
    return item.key;
}


function exportSavedCraftedItem(item: CraftedItem): SavedCraftedItem {
    return {
        equipmentType: item.equipmentType,
        materials: [...item.materials],
        decorations: [...item.decorations],
    };
}

function exportSavedGameState(state: GameState): SavedGameState {
    // Rather than save the crafting bench state, we just return items to the inventory before saving.
    clearCraftingBench(state);
    return {
        nexus: exportSavedNexusData(state),
        city: exportSavedCityData(state),
        heroSlots: state.heroSlots.map(hero => exportSavedHeroData(hero)),
        craftedItems: [
            ...state.craftedWeapons.map(item => exportSavedCraftedItem(item)),
            ...state.craftedArmors.map(item => exportSavedCraftedItem(item)),
            ...state.craftedCharms.map(item => exportSavedCraftedItem(item)),
        ],
        inventory: {...state.inventory},
        worldTime: state.world.time,
        nextWaveIndex: state.nextWaveIndex,
        prestige: {...state.prestige},
        world: exportSavedWorldData(state),
        jobs: exportSavedJobsData(state),
    };
}



function saveGameToLocalStorage(data: SavedGameState): void {
    try {
        console.log('Saving game', data);
        window.localStorage.setItem(savedGameKey, JSON.stringify(data));
    } catch (e) {
        console.error(e);
        debugger;
    }
}

export function saveGame(state: GameState): void {
    state.lastSavedState = exportSavedGameState(state);
    saveGameToLocalStorage(state.lastSavedState);
}
window.saveGame = saveGame;
function exportGameToClipboard(state: GameState): void {
    const savedGameState = exportSavedGameState(state);
    const jsonString = JSON.stringify(savedGameState);
    console.log('Writing saved game to clipboard');
    console.log(jsonString);
    navigator.clipboard.writeText(jsonString);
}
window.exportGameToClipboard = exportGameToClipboard;

export function checkToAutosave(state: GameState) {
    if (!state.autosaveEnabled) {
        return;
    }
    // Only autosave once per wave.
    if ((state.lastSavedState?.nextWaveIndex ?? 0) >= state.nextWaveIndex) {
        return;
    }
    for (const object of state.world.objects) {
        // Cannot save while any enemies are alive in the overworld.
        if (object.objectType === 'enemy') {
            return;
        }
        // Cannot save while a wave spawner is active.
        if (object.objectType === 'waveSpawner' && object.scheduledSpawns.length) {
            return;
        }
    }
    saveGame(state);
}
