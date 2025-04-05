import {uiPadding} from 'app/gameConstants';
import {resetGame, restartGame} from 'app/state';
import {showConfirmPanel} from 'app/ui/confirmPanel';
import {TextButton} from 'app/ui/textButton';
import {TitlePanel, PanelPadding} from 'app/ui/panel';
import {showPrestigeTooltip, showSimpleTooltip} from 'app/ui/tooltip';


export function toggleOptionsPanel(state: GameState, open = !state.openOptionsPanel) {
    state.openOptionsPanel = open;
}


const buttonProps = {
    textProps: {size: 25},
    h: 40,
}

const autosaveButton = new TextButton({
    ...buttonProps,
    text(state: GameState) {
        return 'Autosave: ' + (state.autosaveEnabled ? 'On' : 'Off')
    },
    onClick(state: GameState) {
        state.autosaveEnabled = !state.autosaveEnabled;
        return true;
    },
});
const cameraLockButton = new TextButton({
    ...buttonProps,
    text(state: GameState) {
        return 'Lock Camera [Y]: ' + (state.camera.isLocked ? 'On' : 'Off')
    },
    onClick(state: GameState) {
        state.camera.isLocked = !state.camera.isLocked;
        return true;
    },
});
const rewindButton = new TextButton({
    ...buttonProps,
    text(state: GameState) {
        return 'Rewind';
    },
    onHover(state: GameState) {
        showPrestigeTooltip(state);
        return true;
    },
    onClick(state: GameState) {
        showConfirmPanel(state, {
            title: 'Rewind to start?',
            textLines: ['Prestige bonuses will apply on your new run.'],
            onConfirm: (state: GameState) => {
                restartGame(state);
            },
        });
        return true;
    },
});
const restartButton = new TextButton({
    ...buttonProps,
    text(state: GameState) {
        return 'Fresh Start';
    },
    onHover(state: GameState) {
        showSimpleTooltip(state, ['Reset all prestige bonuses and restart.']);
        return true;
    },
    onClick(state: GameState) {
        showConfirmPanel(state, {
            title: 'Reset all progress?',
            textLines: ['All prestige bonuses will be lost and', 'you will start over from scratch.'],
            onConfirm: (state: GameState) => {
                state = resetGame();
            },
        });
        return true;
    },
});
 const buttons = [
    autosaveButton,
    cameraLockButton,
    rewindButton,
    restartButton,
];
export class OptionsList implements UIContainer {
    objectType = <const>'uiContainer';
    x = 0;
    y = 0;
    w = 300;
    h = 200;
    children = [...buttons];
    update(state: GameState) {
        for (let i = 0; i < buttons.length; i++) {
            buttons[i].w = this.w;
            buttons[i].y = (buttonProps.h + 2 * uiPadding) * i;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            context.translate(this.x, this.y);
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getChildren(state: GameState) {
        return this.children;
    }
}

export const optionsPanel = new TitlePanel({
    title: 'Options',
    w: 300,
    h: buttons.length * (buttonProps.h + 2 * uiPadding) + 2 * uiPadding + 40,
    content: new PanelPadding(new OptionsList()),
    onClose(state: GameState) {
        toggleOptionsPanel(state, false);
    }
});
