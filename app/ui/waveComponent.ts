import {canvas} from 'app/gameConstants';
import {drawFrame, requireFrame} from 'app/utils/animations';
import {fillRect, fillText} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';
import {millisecondsToTime} from 'app/utils/time';

const skullFrame = requireFrame('gfx/militaryIcons.png', {x: 120, y: 23, w: 14, h: 16});

// This UI value updates independent of the world time.
function updateWaveScale(state: GameState) {
    // We should zoom out on the wave HUD until we can see at least the next two wave stones.
    const waveToDisplay = state.waves[Math.min(state.waves.length - 1, state.nextWaveIndex + 1)];
    if (!waveToDisplay) {
        return;
    }
    const endYValue = (waveToDisplay.actualStartTime + waveToDisplay.duration - state.world.time) / 1000 / state.waveScale;
    if (endYValue > canvas.height && waveToDisplay.duration / 1000 / state.waveScale > 80) {
        state.waveScale *= 1.01;
    }
}

export const waveComponent: UIContainer = {
    objectType: 'uiContainer',
    w: 40, h: canvas.height, x: 0, y: 0,
    update(state: GameState) {
        updateWaveScale(state);
    },
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillRect(context, this, '#000');
        const children = this.getChildren?.(state) ?? [];
        for (const child of children) {
            child.render(context, state);
        }
    },
    getChildren(state: GameState) {
        const buttons: UIButton[] = []
        for (let i = state.nextWaveIndex - 1; i < state.waves.length; i++) {
            if (!state.waves[i]) {
                continue;
            }
            const waveButton = new WaveStone(state, this, state.waves[i]);
            if (waveButton.y >= canvas.height) {
                break;
            }
            buttons.push(waveButton);
        }
        return buttons;
    }
};

const fadeDuration = 500;
class WaveStone implements UIButton {
    objectType = <const>'uiButton';
    x: number;
    y: number;
    w: number;
    h: number;
    wave: Wave;
    isFinalWave: boolean;
    constructor(state: GameState, container: Rect, wave: Wave) {
        this.wave = wave;
        this.x = container.x;
        this.y = (wave.actualStartTime - state.world.time) / 1000 / state.waveScale;
        this.w = container.w;
        this.h = wave.duration / 1000 / state.waveScale;
        this.isFinalWave = !!wave.spawners.find(spawner => spawner.isFinalWave);
    }
    onClick(state: GameState): boolean {
        if (this.wave.summonEarlySpeed) {
            this.wave.summonEarlySpeed = 0;
        } else {
            this.wave.summonEarlySpeed = 100;
        }
        return true;
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const delta = this.wave.actualStartTime - state.world.time;
        if (delta <= -fadeDuration) {
            return;
        }
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, -2), '#888');
        if (this.isFinalWave) {
            const w = 2 * skullFrame.w, h = 2 * skullFrame.h;
            drawFrame(context, skullFrame, {x: this.x + (this.w - w) / 2, y: this.y + this.h - h - 10, w, h});
        }
        context.save();
            context.translate(this.x + this.w / 2, this.y + 10);
            context.rotate(-Math.PI / 2);
            fillText(context, {
                size: 20, color:'#FFF', textAlign: 'right',
                x: 0, y: 0, text: millisecondsToTime(this.wave.actualStartTime),
            });
        context.restore();
        if (delta < 0) {
            context.save();
                context.globalAlpha *= -delta / fadeDuration;
                fillRect(context, this, '#000');
            context.restore();
        }
    }
}


