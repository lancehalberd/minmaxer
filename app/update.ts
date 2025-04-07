import {canvas, frameLength} from 'app/gameConstants'
import {reviveHero} from 'app/objects/hero';
import {checkToAddNewSpawner, updateWaves} from 'app/objects/spawner';
import {getState} from 'app/state';
import {updateHudUIElements} from 'app/hud';
import {isGameKeyDown, gameKeys, wasGameKeyPressed, updateKeyboardState} from 'app/keyboard';
import {updateMouseActions} from 'app/mouse';
import {toggleCraftingBenchPanel} from 'app/ui/craftingBenchPanel';
import {toggleJobsPanel} from 'app/ui/jobsPanel';
import {toggleHeroPanel} from 'app/ui/heroPanel';
import {toggleInventoryPanel} from 'app/ui/inventoryPanel';
import {toggleOptionsPanel} from 'app/ui/optionsPanel';
import {activateHeroAbility} from 'app/utils/hero';
import {computeIdleToolCounts} from 'app/utils/inventory';
import {updateJobs} from 'app/utils/job';
import {advanceDebugGameState} from 'app/utils/debug';
import {checkToAutosave} from 'app/utils/saveGame';

/*
TODO:
Why do Kobold clerics seem to heal entire lines of undamaged enemies.

Replace healer job with train mages that works similar to train archers.
    Mages use weaker versions of nexus spells

Add Job Queue
    Free Jobs are automatically included in the job queue (mining/logging/train archers/train healers)
    Paid Jobs can be manually added to queue by clicking a [+] button on the job to add it to the queue.
    Queue can be opened in a large panel that can show 40+ queued jobs.
    Queued jobs can be re-ordered by dragging and dropping them.
        Game is paused while dragging jobs to avoid issues with them completing while they are dragging.
    Completed jobs are removed from the queue.
    Idle population automatically work on the highest priority valid job
    There is a "job queue" job that a hero can select to also work on highest priority job.

Add Forge Level to crafted gear
    Items can be broken down into Forge Power.
    For X Forge Power, crafted gear can increase forge level and gain a modifier:
        %1 more attack speed, %1 more damage, +1% critical damage multiplier
        %1 more health, %1 more armor, 1% more cooldown speed
    Cost and benefit increases linearly with Forge Level. So at level 1, 1% more attack speed costs 100 FP, at level 10 10% more attack speed costs 1000FP
    Common items are worth 1FP, uncommon 10FP, rare 100FP, legendary 1000FP

Minigames for improving stats/experience.

Basic Crafting Improvements
    Add crafting bench structure to open crafting panel on interaction.
    Allow viewing but not using crafting panel when away from the crafting bench.
    Later add job to build crafting bench for 10 wood (revealed on obtaining 1 wood)
    Upgrade crafting bench with 50 wood to unlock some behavior
    Upgrade the crafting bench with 5 stone to unlock stone crafting, etc.

Nexus button:
    At top of hero, click to return camera to the nexus.

Wave previews:
    By default show details for next wave over the field, including pointers to active spawners.
    When mousing over a wave, show details for that wave instead.
    Show spawns as ??? for waves the player hasn't seen before.

Spawners:
    Spawners may have an instance event to clear the spawner and prevent all future spawns and unlock any associated resource.
    Spawners may have an action to summon all remaining spawns immediately to clear them once all spawned enemies are defeated.

Training grounds:
    Break increasingly challenging waves of targets to get +1 core stat per wave
    Different variations for int/dex/str that are designed around the abilities of that hero.

Make assignments based on total tool power instead of population.
    Total tool power for a job is the sum of the best N tools used by N people where N is min(number of tools, population).
    reserved tool power assumes the worst tools will not be used.
    Assigned population will assume the best tools are being used.
Add job element improvements.

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
    const state = getState();
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
    if (state.mouse.mouseHoverTarget?.objectType === 'uiButton' ||
        (
            state.mouse.mouseHoverTarget?.objectType === 'uiContainer'
            && (state.mouse.mouseHoverTarget.onPress || state.mouse.mouseHoverTarget.onClick)
        )
    ) {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'default';
    }
    updateKeyboardState(state);

    if (wasGameKeyPressed(state, gameKeys.pause)) {
        state.isPaused = !state.isPaused;
    }
    if (wasGameKeyPressed(state, gameKeys.optionsPanel)) {
        toggleOptionsPanel(state);
    }
    if (wasGameKeyPressed(state, gameKeys.characterPanel)) {
        toggleHeroPanel(state);
    }
    if (wasGameKeyPressed(state, gameKeys.jobsPanel)) {
        toggleJobsPanel(state);
    }
    if (wasGameKeyPressed(state, gameKeys.inventoryPanel)) {
        toggleInventoryPanel(state);
    }
    if (wasGameKeyPressed(state, gameKeys.closeAll)) {
        // If something can be cancled/close, do that first.
        if (state.openCharacterPanel
            || state.openInventoryPanel
            || state.openJobsPanel
            || state.openCraftingBenchPanel
            || state.openOptionsPanel
            || state.selectedNexusAbilitySlot
            || state.selectedAbility
            || state.openPanels.length
        ) {
            toggleOptionsPanel(state, false);
            toggleHeroPanel(state, false);
            toggleJobsPanel(state, false);
            toggleInventoryPanel(state, false);
            toggleCraftingBenchPanel(state, false);
            state.openPanels = [];
            // Also cancel any ability targeting.
            delete state.selectedNexusAbilitySlot;
            delete state.selectedAbility;
        } else {
            // If there is nothing to be cancled, open the options menu.
            toggleOptionsPanel(state, true);
        }
    }

    if (wasGameKeyPressed(state, gameKeys.cameraLock)) {
        state.camera.isLocked = !state.camera.isLocked;
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

    const gameIsPaused = state.isPaused || state.openOptionsPanel || !state.heroSlots[0];

    // If the nexus is destroyed, stop update function
    // Pan world.camera to nexus, change background color (gray) and return.
    if (state.nexus.essence <= 0) {
        if (state.selectedHero){
            delete state.selectedHero;
        }
    } else if (!gameIsPaused){
        const frameCount = isGameKeyDown(state, gameKeys.fastForward) ? state.fastForwardSpeed : 1;
        for (let i = 0; i < frameCount; i++) {
            computeIdlePopulation(state);
            computeIdleToolCounts(state);
            checkToAddNewSpawner(state);
            updateWaves(state);
            updateJobs(state);
            for (let ability of state.nexusAbilitySlots) {
                if (!ability) {
                    continue;
                }
                if (ability.cooldown > 0) {
                    ability.cooldown -= frameLength;
                }
            }
            // Currently we update effects before objects so that new effects created by objects
            // do not update the frame they are created.
            for (const hero of state.heroSlots) {
                if (hero?.reviveCooldown) {
                    hero.reviveCooldown.remaining -= frameLength / 1000;
                    if (hero.reviveCooldown.remaining <= 0) {
                        reviveHero(state, hero);
                    }
                }
                if (hero?.zone && hero.zone !== state.world) {
                    updateZone(state, hero.zone);
                }
            }
            updateZone(state, state.world);
        }
        checkToAutosave(state);
    } else {
        computeIdlePopulation(state);
        computeIdleToolCounts(state);
    }

    updateCamera(state);
    updateHudUIElements(state);

    // Advance state time, game won't render anything new if this timer isn't updated.
    state.time += frameLength;
}

function updateZone(state: GameState, zone: ZoneInstance) {
    for (const key of zone.zoneEnemyCooldowns.keys()) {
        const value = (zone.zoneEnemyCooldowns.get(key) ?? 0) - frameLength;
        zone.zoneEnemyCooldowns.set(key, value);
    }
    for (const effect of [...zone.effects]) {
        effect.update(state);
    }
    for (const object of [...zone.objects]) {
        object.update(state);
        for (const child of (object.getChildren?.(state) ?? [])) {
            child.update?.(state);
        }
    }
    zone.time += frameLength;
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
    const camera = state.camera;
    // How many pixels the camera moves per frame.
    const pixelsPerFrame = camera.speed * frameLength / 1000;
    if (camera.isLocked) {
        const target = state.selectedHero ?? state.nexus;
        camera.zone = target.zone;
        camera.target.x = target.x;
        camera.target.y = target.y;
    } else {
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
