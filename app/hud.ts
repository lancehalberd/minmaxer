import {buttonSize, canvas, uiSize} from 'app/gameConstants';
import {getHeroAbilityButtons} from 'app/ui/abilityButton';
import {craftingBenchPanel} from 'app/ui/craftingBenchPanel';
import {CraftingJobsPanel, toggleCraftingJobsPanel} from 'app/ui/craftingJobsPanel';
import {chooseArmorPanel, chooseCharmPanel, chooseWeaponPanel} from 'app/ui/equipmentPanels';
import {getHeroButtons} from 'app/ui/heroButton';
import {HeroPanel, toggleHeroPanel} from 'app/ui/heroPanel';
import {inventoryPanel, toggleInventoryPanel} from 'app/ui/inventoryPanel';
import {CharacterIconButton} from 'app/ui/iconButton';
import {getNexusAbilityButtons, NexusAbilityPanel} from 'app/ui/nexusAbilityPanel';
import {requireFrame, drawFrame} from 'app/utils/animations';
import {waveComponent} from 'app/ui/waveComponent';
import {fillText} from 'app/utils/draw';



const characterPanelButton = new CharacterIconButton({
    x: 40 + uiSize,
    y: canvas.height - buttonSize - uiSize,
    w: buttonSize, h: buttonSize,
    character: 'C',
    onClick: (state: GameState) => {
        toggleHeroPanel(state);
        return true;
    },
});

const inventoryPanelButton = new CharacterIconButton({
    x: 40 + uiSize + 1 * (buttonSize + uiSize),
    y: canvas.height - buttonSize - uiSize,
    w: buttonSize, h: buttonSize,
    character: 'I',
    onClick: (state: GameState) => {
        toggleInventoryPanel(state);
        return true;
    },
});

const craftingJobsPanelButton = new CharacterIconButton({
    x: 40 + uiSize + 2 * (buttonSize + uiSize),
    y: canvas.height - buttonSize - uiSize,
    w: buttonSize, h: buttonSize,
    character: 'M',
    onClick: (state: GameState) => {
        toggleCraftingJobsPanel(state);
        return true;
    },
});


const heroPanel = new HeroPanel();
const craftingJobsPanel = new CraftingJobsPanel();
const nexusAbilityPanel = new NexusAbilityPanel({});

// Get buttons that appear as part of the HUD, fixed relative to the screen and on top of the field elements.
export function updateHudUIElements(state: GameState) {
    let leftAlignedPanels: UIElement[] = [];
    let rightAlignedPanels: UIElement[] = [];
    const panelButtons: UIElement[] = [];
    state.hudUIElements = getNexusAbilityButtons(state);
    if (state.selectedHero) {
        state.hudUIElements = [...state.hudUIElements, ...getHeroAbilityButtons(state, state.selectedHero)];
        panelButtons.push(characterPanelButton);
    }
    if (Object.keys(state.inventory).length) {
        panelButtons.push(inventoryPanelButton);
    }
    if (state.city.population) {
        state.hudUIElements.push(populationDisplay);
    }
    craftingJobsPanel.updateCraftingElements(state);
    if (craftingJobsPanel.craftingElements.length) {
        panelButtons.push(craftingJobsPanelButton);
    }
    if (state.openCharacterPanel) {
        leftAlignedPanels.push(heroPanel);
    }
    if (state.openChooseWeaponPanel) {
        leftAlignedPanels.push(chooseWeaponPanel);
    }
    if (state.openChooseArmorPanel) {
        leftAlignedPanels.push(chooseArmorPanel);
    }
    if (state.openChooseCharmPanel) {
        leftAlignedPanels.push(chooseCharmPanel);
    }
    if (state.openCraftingJobsPanel) {
        leftAlignedPanels.push(craftingJobsPanel);
    }
    if (state.openCraftingBenchPanel) {
        leftAlignedPanels.push(craftingBenchPanel);
    }
    if (state.openInventoryPanel) {
        rightAlignedPanels.push(inventoryPanel);
    }
    leftAlignedPanels = [...leftAlignedPanels, ...state.openPanels];
    state.hudUIElements = [...state.hudUIElements, ...getHeroButtons(state)];

    if (state.selectedNexusAbilitySlot !== undefined) {
        state.hudUIElements.push(nexusAbilityPanel);
    }

    state.hudUIElements.push(playPauseButton);
    state.hudUIElements.push(waveComponent);

    let x = waveComponent.x + waveComponent.w;
    for (const openPanel of leftAlignedPanels) {
        openPanel.x = x;
        x += openPanel.w + 5;
        state.hudUIElements.push(openPanel);
    }
    x = canvas.width;
    for (const openPanel of rightAlignedPanels) {
        openPanel.x = x - openPanel.w;
        x -= (openPanel.w + 5);
        state.hudUIElements.push(openPanel);
    }
    x = 50;
    for (const panelButton of panelButtons) {
        panelButton.x = x;
        x += panelButton.w + 5;
        state.hudUIElements.push(panelButton);
    }

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

const personFrame = requireFrame('gfx/militaryIcons.png', {x: 173, y: 159, w: 10, h: 16});
const populationDisplay: UIContainer = {
    objectType: 'uiContainer',
    w: 100,
    h: 32,
    y: padding + 2,
    x: canvas.width / 2,
    render(context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            context.translate(this.x, this.y);
            const scale = this.h / personFrame.h;
            drawFrame(context, personFrame, {x: 0, y: 0, h: scale * personFrame.h, w: scale * personFrame.w});
            let text = state.city.idlePopulation + '/' + state.city.population + ' (' + state.city.maxPopulation + ')';
            fillText(context, {
                textAlign: 'left',
                size: 32,
                color: '#FFF',
                x: scale * personFrame.w + padding,
                y: this.h / 2,
                text,
            });
        context.restore();
    },
};
