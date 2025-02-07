import {gainWallLevel} from 'app/city/cityWall';
import {ranger, warrior, wizard} from 'app/objects/hero';
import {gainEssence} from 'app/utils/essence';
import {gainSkillExperience} from 'app/utils/hero';
import {summonHero} from 'app/utils/hero';

export function advanceDebugGameState(state: GameState) {
    const mainHero = state.heroSlots[0];
    // If there is no summoned hero, summon one at random.
    if (!mainHero) {
        summonHero(state, [ranger, warrior, wizard][Math.floor(Math.random() * 3)]);
        state.isPaused = false;
        return;
    }
    // If wood is available, but not collected, simulate collecting 200 wood.
    if (state.availableResources.wood && !state.discoveredItems.has('wood')) {
        state.inventory.wood = 200;
        state.discoveredItems.add('wood');
        state.availableResources.wood -= 200;
        gainSkillExperience(state, mainHero, 'logging', 100);
        return;
    }
    // If stone is available, but not collected, simulate collecting 200 stone.
    if (state.availableResources.stone && !state.discoveredItems.has('stone')) {
        state.inventory.stone = 200;
        state.discoveredItems.add('stone');
        state.availableResources.stone -= 200;
        gainSkillExperience(state, mainHero, 'mining', 100);
        return;
    }
    // If the city has people, but no tools, acquire a starter set of tools.
    if (state.city.population && !state.inventory.woodHammer) {
        state.inventory.woodHammer = (state.inventory.woodHammer ?? 0) + 1;
        state.inventory.woodHatchet = (state.inventory.woodHatchet ?? 0) + 1;
        state.inventory.shortBow = (state.inventory.shortBow ?? 0) + 1;
        state.inventory.woodStaff = (state.inventory.woodStaff ?? 0) + 1;
        state.inventory.woodArrow = (state.inventory.woodArrow ?? 0) + 10;
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
    for (const object of state.world.objects) {
        if (object.objectType === 'spawner') {
            object.onDeath?.(state);
            gainEssence(state, 10 * object.essenceWorth);
            mainHero.experience += object.experienceWorth;
            const objectIndex = state.world.objects.indexOf(object);
            if (objectIndex >= 0) {
                state.world.objects.splice(objectIndex, 1);
            }
            return;
        }
    }
}
