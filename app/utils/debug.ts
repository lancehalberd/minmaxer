import {gainWallLevel} from 'app/city/cityWall';
import {createEnemy} from 'app/objects/enemy';
import {gainEssence} from 'app/utils/essence';
import {gainSkillExperience} from 'app/utils/hero';
import {summonHero} from 'app/utils/hero';

export function advanceDebugGameState(state: GameState) {
    const mainHero = state.heroSlots[0];
    // If there is no summoned hero, summon one at random.
    if (!mainHero) {
        summonHero(state, state.availableHeroes[Math.floor(Math.random() * state.availableHeroes.length)]);
        state.isPaused = false;
        return;
    }
    // If wood is available, but not collected, simulate collecting 200 wood.
    if (state.nextWaveIndex > 4 && !state.discoveredItems.has('wood')) {
        state.inventory.wood = 200;
        state.discoveredItems.add('wood');
        gainSkillExperience(state, mainHero, 'logging', 100);
        return;
    }
    // If stone is available, but not collected, simulate collecting 200 stone.
    if (state.nextWaveIndex > 10 && !state.discoveredItems.has('stone')) {
        state.inventory.stone = 200;
        state.discoveredItems.add('stone');
        gainSkillExperience(state, mainHero, 'mining', 100);
        return;
    }
    // If the city has people, but no tools, acquire a starter set of tools.
    if (state.city.population && !state.inventory.woodHammer) {
        state.inventory.woodHammer = (state.inventory.woodHammer ?? 0) + 1;
        state.inventory.woodHatchet = (state.inventory.woodHatchet ?? 0) + 1;
        state.inventory.shortBow = (state.inventory.shortBow ?? 0) + 1;
        state.inventory.woodStaff = (state.inventory.woodStaff ?? 0) + 1;
        gainSkillExperience(state, mainHero, 'crafting', 100);
        return;
    }
    // If the city has people, wood and tools, simulate building a wall if it is missing.
    if (state.city.population && state.inventory.wood && !state.city.wall.level) {
        gainWallLevel(state);
        gainSkillExperience(state, mainHero, 'building', 100);
        return;
    }

    // If there is nothing else interesting to do, destroy the next spawner.
    const nextWave = state.waves[state.nextWaveIndex];
    if (nextWave) {
        nextWave.actualStartTime = state.world.time;
        for (const spawnerSchedule of nextWave.spawners) {
            const spawner = spawnerSchedule.spawner;
            spawner.startNewWave(state, spawnerSchedule);
            for (const spawn of spawner.scheduledSpawns) {
                const enemy = createEnemy(spawn.enemyType, spawn.level, {zone: state.world, x: 0, y: 0});
                gainEssence(state, 10 * enemy.essenceWorth);
                mainHero.experience += enemy.experienceWorth;
            }
            spawner.scheduledSpawns = [];
        }
        state.nextWaveIndex++;
    }
}
