import {archerJobDefinition, gainArcherLevel} from 'app/city/archers';
import {mageJobDefinition, gainMageLevel} from 'app/city/mages';
import {gainWallLevel} from 'app/city/cityWall';
import {requireItem} from 'app/definitions/itemDefinitions';
import {savedGameKey} from 'app/gameConstants';
import {checkToAddNewSpawner} from 'app/objects/spawner';
import {getNewGameState, setState} from 'app/state';
import {createCraftedItem} from 'app/ui/craftingBenchPanel';
import {updateWaveScale} from 'app/ui/waveComponent';
import {gainEssence} from 'app/utils/essence';
import {getJob, getOrCreateJob} from 'app/utils/job';
import {isWeapon, isArmor, isCharm, typedKeys} from 'app/utils/types';

function applySavedJobsDataToState(state: GameState, jobsData?: Partial<SavedJobData>[]) {
    if (!jobsData?.length) {
        return;
    }
    for (const jobData of jobsData) {
        if (!jobData.jobKey) {
            continue;
        }
        const job = getJob(state, jobData.jobKey);
        if (!job) {
            console.error('Could not find job for ' + jobData.jobKey);
            continue;
        }
        job.workerSecondsCompleted = jobData.workerSecondsCompleted ?? 0;
        job.isPaidFor = jobData.isPaidFor || job.workerSecondsCompleted > 0;
        job.shouldRepeatJob = jobData.shouldRepeatJob ?? job.definition.repeat ?? false;
        job.workers = jobData.workers ?? 0;
    }
}

function applySavedWorldDataToState(state: GameState, worldData?: Partial<SavedWorldData>) {
    if (!worldData?.structureData) {
        return;
    }
    for (const object of state.world.objects) {
        if (object.objectType === 'structure' && object.structureId && worldData.structureData[object.structureId]) {
            object.importData?.(state, worldData.structureData[object.structureId]);
        }
    }
}

function applySavedNexusDataToState(state: GameState, nexusData?: Partial<SavedNexusData>) {
    if (!nexusData) {
        return;
    }
    // This will cause the nexus to level up appropriately.
    state.nexus.essence = 0;
    gainEssence(state, nexusData.essence ?? 0, false);
    for (const ability of state.nexusAbilities) {
        ability.level = nexusData.abilityLevels?.[ability.definition.abilityKey] ?? 0;
    }
    if (nexusData.abilitySlots) {
        state.nexusAbilitySlots = nexusData.abilitySlots.map(key => state.nexusAbilities.find(ability => ability?.definition.abilityKey === key));
    }
    // We don't save cooldown state, so start all nexus abilities at max cooldown on load.
    for (const ability of state.nexusAbilitySlots) {
        if (!ability) {
            continue;
        }
        ability.cooldown = ability.definition.getCooldown(state, ability);
    }
}

function applySavedCityDataToState(state: GameState, cityData?: Partial<SavedCityData>) {
    if (!cityData) {
        return;
    }
    state.city.population = cityData.population ?? 0;
    let safety = 0;
    while (state.city.wall.level < (cityData.wall?.level ?? 0) && safety++ < 1000) {
        gainWallLevel(state);
    }
    state.city.wall.health = Math.min(state.city.wall.maxHealth, cityData.wall?.health ?? state.city.wall.maxHealth);
    for (let i = 0; i < (cityData.archers?.level ?? 0); i++) {
        gainArcherLevel(state);
    }
    getOrCreateJob(state, archerJobDefinition).workerSecondsCompleted = cityData.archers?.jobProgress ?? 0;
    for (let i = 0; i < (cityData.mages?.level ?? 0); i++) {
        gainMageLevel(state);
    }
    getOrCreateJob(state, mageJobDefinition).workerSecondsCompleted = cityData.mages?.jobProgress ?? 0;
    state.city.houses = {
        ...state.city.houses,
        ...cityData.houses,
    };
}

function importSavedHero(state: GameState, savedHeroData: undefined|Partial<SavedHeroData>): Hero|undefined {
    if (!savedHeroData) {
        return undefined;
    }
    for (let i = 0; i < state.availableHeroes.length; i++) {
        const hero = state.availableHeroes[i];
        if (hero.definition.heroType !== savedHeroData.heroType) {
            continue;
        }
        state.availableHeroes.splice(i--, 1);
        hero.level = savedHeroData.level ?? 1;
        hero.experience = savedHeroData.experience ?? 0 ;
        for (let i = 0; i < hero.abilities.length; i++) {
            hero.abilities[i].level = savedHeroData.abilityLevels?.[i] ?? 0;
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
        for (let i = 0; i < (savedHeroData.charms?.length ?? 0); i++) {
            const savedCharm = savedHeroData.charms?.[i];
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
            const skill = savedHeroData.skills?.[key];
            if (skill) {
                hero.skills[key] = {...skill};
                hero.totalSkillLevels += skill.level;
            }
        }
        hero.health = hero.getMaxHealth(state);
        state.world.objects.push(hero);
        return hero;
    }
}


function importSavedCraftedItem(state: GameState, savedItem: SavedCraftedItem): CraftedItem {
    return createCraftedItem(state, savedItem.equipmentType,
        savedItem.materials.map(key => requireItem(key)),
        savedItem.decorations.map(key => requireItem(key)),
    );
}

function importSavedGameFromJson(jsonString: string): void {
    const savedGameState = JSON.parse(jsonString) as SavedGameState;
    setState(importStateFromSavedGameState(savedGameState));
}
window.importSavedGameFromJson = importSavedGameFromJson;

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

function importStateFromSavedGameState(loadedGameState: SavedGameState): GameState {
    let state = getNewGameState();
    state.lastSavedState = loadedGameState;
    // When loading the game, mark the value as partial just to help catch additional errors from the definition
    // of the saved game state changing over time.
    const savedGameState: Partial<SavedGameState> = loadedGameState;
    applySavedNexusDataToState(state, savedGameState.nexus);
    applySavedCityDataToState(state, savedGameState.city);
    if (savedGameState.heroSlots) {
        state.heroSlots = savedGameState.heroSlots.map(savedHeroData => importSavedHero(state, savedHeroData));
    }
    for (const craftedItem of (savedGameState.craftedItems?.map(item => importSavedCraftedItem(state, item)) ?? [])) {
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
    state.world.time = savedGameState.worldTime ?? 0;
    state.nextWaveIndex = savedGameState.nextWaveIndex ?? 0;
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
    applySavedWorldDataToState(state, savedGameState.world);
    applySavedJobsDataToState(state, savedGameState.jobs);
    // Add the crafting bench/jobs on load.
    state.nexus.update(state);
    state.prestige = {
        ...state.prestige,
        ...savedGameState.prestige,
    };
    if (state.selectedHero) {
        state.camera.x = state.selectedHero.x;
        state.camera.y = state.selectedHero.y;
    }
    return state;
}
