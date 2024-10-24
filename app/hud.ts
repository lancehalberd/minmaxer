import {canvas} from 'app/gameConstants';
import {requireFrame, drawFrame} from 'app/utils/animations';


// Get buttons that appear as part of the HUD, fixed relative to the screen and on top of the field elements.
export function getHUDButtons(state: GameState): CanvasButton[] {
    return [playPauseButton];
}

const padding = 10;
const playButton = requireFrame('gfx/playButton.png', {x: 0, y: 0, w: 139, h: 138});
const pauseButton = requireFrame('gfx/pauseButton.png', {x: 0, y: 0, w: 139, h: 138});

let scale = 1/3;
const playPauseButton: CanvasButton = {
    objectType: 'button',
    x: canvas.width - playButton.w * scale - padding,
    y: padding,
    w: playButton.w * scale,
    h: playButton.h * scale,
    render(context: CanvasRenderingContext2D, state: GameState) {
        let frame = state.isPaused ? playButton : pauseButton;
        drawFrame(context, frame, this);
    },
    onPress(state: GameState) {
        state.isPaused = !state.isPaused;
        return true;
    }
}
