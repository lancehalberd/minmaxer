import {canvas, frameLength} from 'app/gameConstants'
import {reviveHero} from 'app/objects/hero';
import {checkToAddNewSpawner} from 'app/objects/spawner';
import {state} from 'app/state';
import {updateHudButtons} from 'app/hud';
import {isGameKeyDown, gameKeys, wasGameKeyPressed, updateKeyboardState} from 'app/keyboard';
import {updateMouseActions} from 'app/mouse';

function update() {
    // Reset the essence preview every frame so it doesn't get stale.
    // This needs to run before updateMouseActions since it is often set when hovering over elements.
    state.nexus.previewEssenceChange = 0;
    delete state.hoveredAbility;

    updateMouseActions(state);
    updateKeyboardState(state);

    if (wasGameKeyPressed(state, gameKeys.pause)) {
        state.isPaused = !state.isPaused;
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
            }
            state.world.time += 20;
        }
    }


    updateCamera(state);
    updateHudButtons(state);

    // Advance state time, game won't render anything new if this timer isn't updated.
    state.time += 20;
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
        camera.speed = 400;
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
        camera.speed = 200;
    } else {
        camera.x += pixelsPerFrame * dx / mag;
        camera.y += pixelsPerFrame * dy / mag;
    }
}

export function startUpdating() {
    // Run update at 50FPS (once every 20 milliseconds).
    setInterval(update, frameLength);
}
