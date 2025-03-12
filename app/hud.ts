import {canvas} from 'app/gameConstants';
import {getHeroAbilityButtons, getNexusAbilityButtons} from 'app/ui/abilityButton';
import {CraftingPanel} from 'app/ui/craftingPanel';
import {chooseArmorPanel, chooseCharmPanel, chooseWeaponPanel} from 'app/ui/equipmentPanels';
import {getHeroButtons} from 'app/ui/heroButton';
import {HeroPanel} from 'app/ui/heroPanel';
import {requireFrame, drawFrame} from 'app/utils/animations';
import {waveComponent} from 'app/ui/waveComponent';


const heroPanel = new HeroPanel();
const craftingPanel = new CraftingPanel();

// Get buttons that appear as part of the HUD, fixed relative to the screen and on top of the field elements.
export function updateHudUIElements(state: GameState) {
    state.hudUIElements = getNexusAbilityButtons(state);
    if (state.selectedHero) {
        state.hudUIElements = [...state.hudUIElements, ...getHeroAbilityButtons(state, state.selectedHero)];
    }
    if (state.openCharacterPanel) {
        state.hudUIElements.push(heroPanel);
    }
    if (state.openCraftingPanel) {
        state.hudUIElements.push(craftingPanel);
    }
    if (state.openChooseWeaponPanel) {
        state.hudUIElements.push(chooseWeaponPanel);
    }
    if (state.openChooseArmorPanel) {
        state.hudUIElements.push(chooseArmorPanel);
    }
    if (state.openChooseCharmPanel) {
        state.hudUIElements.push(chooseCharmPanel);
    }
    state.hudUIElements = [...state.hudUIElements, ...getHeroButtons(state)];
    state.hudUIElements.push(playPauseButton);
    state.hudUIElements.push(waveComponent);

    for (const element of state.hudUIElements) {
        if (element.update) {
            element.update(state);
        }
    }
}

const padding = 10;

const playButton = requireFrame('gfx/playButton.png', {x: 0, y: 0, w: 139, h: 138});
const pauseButton = requireFrame('gfx/pauseButton.png', {x: 0, y: 0, w: 139, h: 138});

let scale = 1/3;
export const playPauseButton: UIButton = {
    objectType: 'uiButton',
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
