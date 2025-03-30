import {gainWallLevel} from 'app/city/cityWall';
import {requireItem} from 'app/definitions/itemDefinitions';
import {checkToAddNewSpawner} from 'app/objects/spawner';
import {getNewGameState} from 'app/state';
import {clearCraftingBench, createCraftedItem} from 'app/ui/craftingBenchPanel';
import {updateWaveScale} from 'app/ui/waveComponent';
import {gainEssence} from 'app/utils/essence';
import {isWeapon, isArmor, isCharm, isCraftedWeapon, isCraftedArmor, isCraftedCharm, typedKeys} from 'app/utils/types';

// TDDO
// jobs, assigned workers, job progress,
// waves + structures

interface SavedNexusData {
    essence: number
    abilityLevels: {[key in NexusAbilityKey]?: number}
    abilitySlots: (NexusAbilityKey|undefined)[]
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
function applySavedNexusDataToState(state: GameState, nexusData: SavedNexusData) {
    // This will cause the nexus to level up appropriately.
    gainEssence(state, nexusData.essence, false);
    for (const ability of state.nexusAbilities) {
        ability.level = nexusData.abilityLevels[ability.definition.abilityKey] ?? 0;
    }
    state.nexusAbilitySlots = nexusData.abilitySlots.map(key => state.nexusAbilities.find(ability => ability?.definition.abilityKey === key));
    // We don't save cooldown state, so start all nexus abilities at max cooldown on load.
    for (const ability of state.nexusAbilitySlots) {
        if (!ability) {
            continue;
        }
        ability.cooldown = ability.definition.getCooldown(state, ability);
    }

}

interface SavedCityData {
    population: number
    wallLevel: number
    wallHealth: number
}
function exportSavedCityData(state: GameState): SavedCityData {
    const cityData: SavedCityData = {
        population: state.city.population,
        wallLevel: state.city.wall.level,
        wallHealth: state.city.wall.health,
    };
    return cityData;
}
function applySavedCityDataToState(state: GameState, cityData: SavedCityData) {
    if (!cityData) {
        return;
    }
    state.city.population = cityData.population;
    let safety = 0;
    while (state.city.wall.level < cityData.wallLevel && safety++ < 1000) {
        gainWallLevel(state);
    }
    state.city.wall.health = Math.min(state.city.wall.maxHealth, cityData.wallHealth);
}

type SavedEquipment = SavedCraftedItem|InventoryKey|undefined
interface SavedHeroData {
    heroType: HeroType
    level: number
    experience: number
    abilityLevels: number[]
    weapon: SavedEquipment
    armor: SavedEquipment
    charms: (SavedEquipment)[]
    skills: {
        [key in HeroSkillType]?: HeroSkill
    }
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
function importSavedHero(state: GameState, savedHeroData: undefined|SavedHeroData): Hero|undefined {
    if (!savedHeroData) {
        return undefined;
    }
    for (let i = 0; i < state.availableHeroes.length; i++) {
        const hero = state.availableHeroes[i];
        if (hero.definition.heroType !== savedHeroData.heroType) {
            continue;
        }
        state.availableHeroes.splice(i--, 1);
        hero.level = savedHeroData.level;
        hero.experience = savedHeroData.experience;
        for (let i = 0; i < hero.abilities.length; i++) {
            hero.abilities[i].level = savedHeroData.abilityLevels[i] ?? 0;
            hero.spentSkillPoints += hero.abilities[i].level;
        }
        if (savedHeroData.weapon) {
            let item: GenericItem;
            if (typeof savedHeroData.weapon === 'string') {
                item = requireItem(savedHeroData.weapon);
            } else {
                item = importSavedCraftedItem(state, savedHeroData.weapon);
            }
            if (isWeapon(item)) {
                hero.equipment.weapon = item;
            }
        }
        if (savedHeroData.armor) {
            let item: GenericItem;
            if (typeof savedHeroData.armor === 'string') {
                item = requireItem(savedHeroData.armor);
            } else {
                item = importSavedCraftedItem(state, savedHeroData.armor);
            }
            if (isArmor(item)) {
                hero.equipment.armor = item;
            }
        }
        for (let i = 0; i < savedHeroData.charms.length; i++) {
            const savedCharm = savedHeroData.charms[i];
            if (!savedCharm) {
                hero.equipment.charms[i] = undefined;
                continue;
            }
            let item: GenericItem;
            if (typeof savedCharm === 'string') {
                item = requireItem(savedCharm);
            } else {
                item = importSavedCraftedItem(state, savedCharm);
            }
            if (isCharm(item)) {
                hero.equipment.charms[i] = item;
            }
        }
        for (const key of typedKeys(savedHeroData.skills ?? {})){
            const skill = savedHeroData.skills[key];
            if (skill) {
                hero.skills[key] = {...skill};
            }
        }
        hero.health = hero.getMaxHealth(state);
        state.world.objects.push(hero);
        return hero;
    }
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


interface SavedCraftedItem {
    equipmentType: EquipmentType
    materials: InventoryKey[]
    decorations: InventoryKey[]
}
function exportSavedCraftedItem(item: CraftedItem): SavedCraftedItem {
    return {
        equipmentType: item.equipmentType,
        materials: [...item.materials],
        decorations: [...item.decorations],
    };
}
function importSavedCraftedItem(state: GameState, savedItem: SavedCraftedItem): CraftedItem {
    return createCraftedItem(state, savedItem.equipmentType,
        savedItem.materials.map(key => requireItem(key)),
        savedItem.decorations.map(key => requireItem(key)),
    );
}

interface SavedGameState {
    nexus: SavedNexusData
    city: SavedCityData
    heroSlots: (SavedHeroData|undefined)[]
    craftedItems: SavedCraftedItem[]
    inventory: {[key in InventoryKey]?: number}
    worldTime: number
    nextWaveIndex: number
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
    };
}

function importStateFromSavedGameState(savedGameState: SavedGameState): GameState {
    let state = getNewGameState();
    applySavedNexusDataToState(state, savedGameState.nexus);
    applySavedCityDataToState(state, savedGameState.city);
    state.heroSlots = savedGameState.heroSlots.map(savedHeroData => importSavedHero(state, savedHeroData));
    for (const craftedItem of savedGameState.craftedItems.map(item => importSavedCraftedItem(state, item))) {
        if (craftedItem.equipmentType === 'weapon') {
            state.craftedWeapons.push(craftedItem);
        } else if (craftedItem.equipmentType === 'armor') {
            state.craftedArmors.push(craftedItem);
        }else if (craftedItem.equipmentType === 'charm') {
            state.craftedCharms.push(craftedItem);
        }
    }
    state.inventory = {...savedGameState.inventory};
    for (const key of typedKeys(state.inventory)) {
        state.discoveredItems.add(key);
    }
    state.world.time = savedGameState.worldTime;
    state.nextWaveIndex = savedGameState.nextWaveIndex;
    state.selectedHero = state.heroSlots[0];
    // For now just simulate the world to catch up to the approximate state they saved in.
    let safety = 0;
    while (checkToAddNewSpawner(state) && safety++ < 1000) {
    }
    for (let i = 0; i < state.nextWaveIndex; i++) {
        const wave = state.waves[i];
        wave.actualStartTime = state.world.time - 10000;
        for (const spawnerSchedule of wave.spawners) {
            const spawner = spawnerSchedule.spawner;
            spawner.startNewWave(state, spawnerSchedule);
            spawner.scheduledSpawns = [];
            spawner.checkToRemove(state, true);
        }
    }
    updateWaveScale(state, true);
    // Add the crafting bench/jobs on load.
    state.nexus.update(state);
    return state;
}

const savedGameKey = 'minmaxer-savedGame';
function saveGameToLocalStorage(data: SavedGameState): void {
    try {
        window.localStorage.setItem(savedGameKey, JSON.stringify(data));
    } catch (e) {
        console.error(e);
        debugger;
    }
}

export function saveGame(state: GameState): void {
    saveGameToLocalStorage(exportSavedGameState(state));
}
window.saveGame = saveGame;

export function loadGame(): GameState {
    try {
        const jsonString = window.localStorage.getItem(savedGameKey);
        if (jsonString) {
            const savedGameState = JSON.parse(jsonString) as SavedGameState;
            console.log('Loaded game');
            console.log(savedGameState)
            return importStateFromSavedGameState(savedGameState);
        }
        return getNewGameState();
    } catch (e) {
        console.error(e);
        debugger;
    }
    // Create a blank state with autosave disabled when we encounter an error during loading.
    // This will protect the old saved data from being overwritten when there are loading bugs.
    const defaultState = getNewGameState();
    defaultState.autosaveEnabled = false;
    return defaultState;
}
window.loadGame = loadGame;
