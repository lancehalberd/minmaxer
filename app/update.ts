import {gainWallLevel} from 'app/city/cityWall';
import {canvas, frameLength} from 'app/gameConstants'
import {reviveHero, ranger, warrior, wizard} from 'app/objects/hero';
import {checkToAddNewSpawner} from 'app/objects/spawner';
import {state} from 'app/state';
import {updateHudUIElements} from 'app/hud';
import {isGameKeyDown, gameKeys, wasGameKeyPressed, updateKeyboardState} from 'app/keyboard';
import {updateMouseActions} from 'app/mouse';
import {gainEssence} from 'app/utils/essence';
import {gainSkillExperience} from 'app/utils/hero';
import {updateJobs} from 'app/utils/job';
import {summonHero} from 'app/utils/hero';


/*
TODO:
Add job element improvements.
Hero should not repeat assignedJob if the job isn't set to repeat automatically.
Make better tools more useful than base tools.
    Nx multiplier for hero based on best tool.
    Nx multiplier for each tool available to population.
Move debugging code into its own file.

Population jobs:
    The quality of tools can effect the rate or outcome of the job.

    Upgrade Palisade(N Levels):
        X resources, requires hammer, takes N seconds
        Improve the max life of the palisade + return damage
            500 wood -> 300 health, 5 thorns damage
            200 stone+2000 wood -> 1000 health, 20 thorns damage

    Utility structures:
        Market (Allow buying items)
        Houses (increase population)
        Farms
        Armory (crafting armor)
        Workshops (crafting  other tools)
        Refinery (convert raw resources into refined resources like lumber -> planks, ore -> ingots)
*/

function advanceDebugGameState(state: GameState) {
    const mainHero = state.heroSlots[0];
    // If there is no summoned hero, summon one at random.
    if (!mainHero) {
        summonHero(state, [ranger, warrior, wizard][Math.floor(Math.random() * 3)]);
        state.isPaused = false;
        return;
    }
    // If wood is available, but not collected, simulate collecting 200 wood.
    if (state.availableResources.wood && !state.totalResources.wood) {
        state.inventory.wood += 200;
        state.totalResources.wood += 200;
        state.availableResources.wood -= 200;
        gainSkillExperience(state, mainHero, 'logging', 100);
        return;
    }
    // If stone is available, but not collected, simulate collecting 200 stone.
    if (state.availableResources.stone && !state.totalResources.stone) {
        state.inventory.stone += 200;
        state.totalResources.stone += 200;
        state.availableResources.stone -= 200;
        gainSkillExperience(state, mainHero, 'mining', 100);
        return;
    }
    // If the city has people, but no tools, acquire a starter set of tools.
    if (state.city.population && !state.inventory.woodHammer) {
        state.inventory.woodHammer++;
        state.inventory.woodHatchet++;
        state.inventory.shortBow++;
        state.inventory.woodStaff++;
        state.inventory.woodArrow += 10;
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
            gainEssence(state, object.essenceWorth);
            mainHero.experience += object.experienceWorth;
            const objectIndex = state.world.objects.indexOf(object);
            if (objectIndex >= 0) {
                state.world.objects.splice(objectIndex, 1);
            }
            return;
        }
    }
}

function update() {
    // Reset the essence preview every frame so it doesn't get stale.
    // This needs to run before updateMouseActions since it is often set when hovering over elements.
    state.nexus.previewEssenceChange = 0;
    delete state.previewRequiredToolType;
    delete state.previewResourceCost;
    delete state.hoveredAbility;

    updateMouseActions(state);
    // Show the "pointer" cursor when the mouse is over uiButtons.
    // This is often a hand with a pointing index finger that appears over buttons and links
    // in webpages.
    if (state.mouse.mouseHoverTarget?.objectType === 'uiButton') {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'default';
    }
    updateKeyboardState(state);

    if (wasGameKeyPressed(state, gameKeys.pause)) {
        state.isPaused = !state.isPaused;
    }

    // Pressing the debug key[K] allows you to quickly advance your progress for testing purposes.
    if (wasGameKeyPressed(state, gameKeys.debug)) {
        advanceDebugGameState(state);
    }

    // If the nexus is destroyed, stop update function
    // Pan world.camera to nexus, change background color (gray) and return.
    if (state.nexus.essence <= 0) {
        if (state.selectedHero){
            console.log(`Selected hero defeated ${state.selectedHero.enemyDefeatCount} enemies in total`);
            delete state.selectedHero;
        }
    } else if (!state.isPaused){
        const frameCount = isGameKeyDown(state, gameKeys.fastForward) ? 10 : 1;
        for (let i = 0; i < frameCount; i++) {
            computeIdlePopulation(state);
            checkToAddNewSpawner(state);
            // Currently we update effects before objects so that new effects created by objects
            // do not update the frame they are created.
            for (const hero of state.heroSlots) {
                if (hero?.reviveCooldown) {
                    hero.reviveCooldown.remaining -= frameLength / 1000;
                    if (hero.reviveCooldown.remaining <= 0) {
                        reviveHero(state, hero);
                    }
                }
            }
            for (const effect of [...state.world.effects]) {
                effect.update(state);
            }
            for (const object of state.world.objects) {
                object.update(state);
                for (const child of (object.getChildren?.(state) ?? [])) {
                    child.update?.(state);
                }
            }
            updateJobs(state);
            state.world.time += 20;
        }
    }

    updateCamera(state);
    updateHudUIElements(state);

    // Advance state time, game won't render anything new if this timer isn't updated.
    state.time += 20;
}

function computeIdlePopulation(state: GameState): void {
    state.city.idlePopulation = state.city.population;
    for (const job of Object.values(state.city.jobs)) {
        state.city.idlePopulation -= job.workers;
    }
}

//const minScrollSize = 200, maxScrollSize = 50;
function getScrollAmount(state: GameState, distanceFromEdge: number, gameKey: number): number {
    // Use the mouse position if it is over the canvas.
    // This doesn't work well because it causes the screen to scroll when trying to use interactive elements
    // near the edge of the screen. Maybe we should only do this when holding click to move?
    // const p = state.mouse.isOverCanvas ? (minScrollSize - distanceFromEdge) / (minScrollSize - maxScrollSize) : 0;
    // return Math.max(0, Math.min(1, p), (isGameKeyDown(state, gameKey) ? 0.7 : 0));
    return isGameKeyDown(state, gameKey) ? 0.7 : 0;
}
function updateCamera(state: GameState) {
    const camera = state.world.camera;
    // How many pixels the camera moves per frame.
    const pixelsPerFrame = camera.speed * frameLength / 1000;
    // Move the camera so the hero is in the center of the screen:
    if (state.nexus.essence <= 0) {
        camera.speed = 600;
        camera.target.x = state.nexus.x;
        camera.target.y = state.nexus.y;
    } else {
        camera.target.y -= pixelsPerFrame * getScrollAmount(state, state.mouse.currentPosition.y, gameKeys.up);
        camera.target.y += pixelsPerFrame * getScrollAmount(state, canvas.height - state.mouse.currentPosition.y, gameKeys.down);
        camera.target.x -= pixelsPerFrame * getScrollAmount(state, state.mouse.currentPosition.x, gameKeys.left);
        camera.target.x += pixelsPerFrame * getScrollAmount(state, canvas.width - state.mouse.currentPosition.x, gameKeys.right);
    }
    const dx = camera.target.x - camera.x, dy = camera.target.y - camera.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag < pixelsPerFrame) {
        camera.x = camera.target.x;
        camera.y = camera.target.y;
        camera.speed = 400;
    } else {
        camera.x += pixelsPerFrame * dx / mag;
        camera.y += pixelsPerFrame * dy / mag;
    }
}

export function startUpdating() {
    // Run update at 50FPS (once every 20 milliseconds).
    setInterval(update, frameLength);
}
