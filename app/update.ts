import {canvas, frameLength} from 'app/gameConstants'
import {reviveHero} from 'app/objects/hero';
import {checkToAddNewSpawner} from 'app/objects/spawner';
import {state} from 'app/state';
import {updateHudUIElements} from 'app/hud';
import {isGameKeyDown, gameKeys, wasGameKeyPressed, updateKeyboardState} from 'app/keyboard';
import {updateMouseActions} from 'app/mouse';
import {activateHeroAbility} from 'app/utils/hero';
import {updateJobs} from 'app/utils/job';
import {advanceDebugGameState} from 'app/utils/debug';

/*
TODO:
Add instance events for farming certain enemy types and resource points/loot drops/chests

Add first boss encounter
    Lots of health
    Aggros at X minutes or when attacked?
    Only autoattacks nexus
    Slow movement speeds
    Maybe AOE attacks with warnings on 10s cooldown. (hurts heroe(s))

Training grounds:
    Break increasingly challenging waves of targets to get +1 core stat per wave
    Different variations for int/dex/str that are designed around the abilities of that hero.

Change spawners to have events you must complete to disable the spawner
    Some spwaners unlock repetable events after disabling them.


Add a way to farm materials from enemies/content:
    Add drop pools to enemies + more enemy types?
    Include rare resources
    Add rare drop chance for harvesting actions:
        1% chance to get hardwood instead of wood
        Only from hero? Or we could have bonuses on heroes to increase chance of rare items.


Add crafting


Craft Armor:
    1-5x material slots that add armor and raise armor cap.
    1-10x decoration slots that add additional stats
    (room to expand further for example 1-4 enchantment slots)

Gear recipes with generic requirements, ingredients that give special bonuses when used.
    Leather boots requires 2 leather, but using normal leather vs cured leather vs magic leather gives different results.

Make assignments based on total tool power instead of population.
    Total tool power for a job is the sum of the best N tools used by N people where N is min(number of tools, population).
    reserved tool power assumes the worst tools will not be used.
    Assigned population will assume the best tools are being used.
Add job element improvements.
Allow equipping a tool to a hero for Nx boost to any jobs using the tool.
    But while equipped the tool is removed from inventory and cannot be used by the population.

Population jobs:
    Utility structures:
        Market (Allow buying items)
        Houses (increase population)
        Farms
        Armory (crafting armor)
        Workshops (crafting  other tools)
        Refinery (convert raw resources into refined resources like lumber -> planks, ore -> ingots)
*/

function update() {
    // Reset the essence preview every frame so it doesn't get stale.
    // This needs to run before updateMouseActions since it is often set when hovering over elements.
    state.nexus.previewEssenceChange = 0;
    delete state.previewRequiredToolType;
    delete state.previewResourceCost;
    delete state.hoveredAbility;
    delete state.hoverToolTip;

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

    // Pressing the key[R] allows you to use the selected hero's active ability.
    if (wasGameKeyPressed(state, gameKeys.ability)) {
        const hero = state.selectedHero;
        if (hero) {
            const activeAbilities = hero.abilities.filter(({abilityType}) => abilityType === 'activeAbility');
            // Currently there is only one active ability per Hero.
            // In the future this could change to select a specific ability.
            activateHeroAbility(state, hero, activeAbilities[0]);
        }
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
