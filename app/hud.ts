import {buttonSize, canvas, uiPadding, uiSize} from 'app/gameConstants';
import {restartGame} from 'app/state';
import {getHeroAbilityButtons} from 'app/ui/abilityButton';
import {craftingBenchPanel} from 'app/ui/craftingBenchPanel';
import {jobsPanel, toggleJobsPanel} from 'app/ui/jobsPanel';
import {chooseArmorPanel, chooseCharmPanel, chooseWeaponPanel} from 'app/ui/equipmentPanels';
import {getHeroButtons} from 'app/ui/heroButton';
import {HeroPanel, toggleHeroPanel} from 'app/ui/heroPanel';
import {inventoryPanel, toggleInventoryPanel} from 'app/ui/inventoryPanel';
import {CharacterIconButton} from 'app/ui/iconButton';
import {getNexusAbilityButtons, NexusAbilityPanel} from 'app/ui/nexusAbilityPanel';
import {optionsPanel} from 'app/ui/optionsPanel';
import {TextButton} from 'app/ui/textButton';
import {showPrestigeTooltip} from 'app/ui/tooltip';
import {requireFrame, drawFrame} from 'app/utils/animations';
import {fillText} from 'app/utils/draw';
import {waveComponent} from 'app/ui/waveComponent';

const leftEdge = 100;

const restartButton = new TextButton({
    x: (canvas.width - 150) / 2,
    y: (canvas.height - 4 * uiSize) / 2,
    h: 4 * uiSize,
    w: 150,
    textProps: {size: 30,},
    text: 'Rewind',
    onHover(state: GameState) {
        showPrestigeTooltip(state);
        return true;
    },
    onClick(state: GameState)  {
        restartGame(state);
        return true;
    },
});

const characterPanelButton = new CharacterIconButton({
    x: 40 + uiPadding,
    y: canvas.height - buttonSize - uiSize,
    w: buttonSize, h: buttonSize,
    character: 'C',
    onClick: (state: GameState) => {
        toggleHeroPanel(state);
        return true;
    },
});

const inventoryPanelButton = new CharacterIconButton({
    x: leftEdge + 1 * (buttonSize + uiSize),
    y: canvas.height - buttonSize - uiSize,
    w: buttonSize, h: buttonSize,
    character: 'I',
    onClick: (state: GameState) => {
        toggleInventoryPanel(state);
        return true;
    },
});

const jobsPanelButton = new CharacterIconButton({
    x: leftEdge + 2 * (buttonSize + uiSize),
    y: canvas.height - buttonSize - uiSize,
    w: buttonSize, h: buttonSize,
    character: 'J',
    onClick: (state: GameState) => {
        toggleJobsPanel(state);
        return true;
    },
});


const heroPanel = new HeroPanel();
const nexusAbilityPanel = new NexusAbilityPanel({});

// Get buttons that appear as part of the HUD, fixed relative to the screen and on top of the field elements.
export function updateHudUIElements(state: GameState) {
    let leftAlignedPanels: UIElement[] = [];
    let rightAlignedPanels: UIElement[] = [];
    let centeredPanels: UIElement[] = [];
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
    if (state.discoveredItems.has('wood')) {
        panelButtons.push(jobsPanelButton);
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
    if (state.openJobsPanel) {
        leftAlignedPanels.push(jobsPanel);
    }
    if (state.openCraftingBenchPanel) {
        leftAlignedPanels.push(craftingBenchPanel);
    }
    if (state.openInventoryPanel) {
        rightAlignedPanels.push(inventoryPanel);
    }
    if (state.openOptionsPanel) {
        centeredPanels.push(optionsPanel);
    }
    leftAlignedPanels = [...leftAlignedPanels];
    state.hudUIElements = [...state.hudUIElements, ...getHeroButtons(state)];

    if (state.selectedNexusAbilitySlot !== undefined) {
        state.hudUIElements.push(nexusAbilityPanel);
    }

    state.hudUIElements.push(menuButton);
    state.hudUIElements.push(playPauseButton);
    state.hudUIElements.push(waveComponent);

    let x = leftEdge;// waveComponent.x + waveComponent.w;
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
    for (const openPanel of centeredPanels) {
        openPanel.x = (canvas.width - openPanel.w ) / 2;
        openPanel.y = (canvas.height - openPanel.h) / 2;
        state.hudUIElements.push(openPanel);
    }
    for (const openPanel of state.openPanels) {
        state.hudUIElements.push(openPanel);
    }
    x = 40 + uiPadding;
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

    if (state.nexus.essence <= 0) {
        state.hudUIElements.push(restartButton);
    }
}

const playButtonFrame = requireFrame('gfx/playButton.png', {x: 0, y: 0, w: 139, h: 138});
const pauseButtonFrame = requireFrame('gfx/pauseButton.png', {x: 0, y: 0, w: 139, h: 138});
const menuButtonFrame = requireFrame('gfx/menuButton.png', {x: 0, y: 0, w: 139, h: 138});

let scale = 1/3;
export const menuButton: UIButton = {
    objectType: 'uiButton',
    x: canvas.width - menuButtonFrame.w * scale - uiPadding,
    y: uiPadding,
    w: menuButtonFrame.w * scale,
    h: menuButtonFrame.h * scale,
    render(context: CanvasRenderingContext2D, state: GameState) {
        drawFrame(context, menuButtonFrame, this);
    },
    onPress(state: GameState) {
        state.openOptionsPanel = !state.openOptionsPanel;
        return true;
    }
};
export const playPauseButton: UIButton = {
    objectType: 'uiButton',
    x: menuButton.x - playButtonFrame.w * scale - uiPadding,
    y: uiPadding,
    w: playButtonFrame.w * scale,
    h: playButtonFrame.h * scale,
    render(context: CanvasRenderingContext2D, state: GameState) {
        let frame = state.isPaused ? playButtonFrame : pauseButtonFrame;
        drawFrame(context, frame, this);
    },
    onPress(state: GameState) {
        state.isPaused = !state.isPaused;
        return true;
    }
};

const personFrame = requireFrame('gfx/militaryIcons.png', {x: 173, y: 159, w: 10, h: 16});
const populationDisplay: UIContainer = {
    objectType: 'uiContainer',
    w: 100,
    h: 32,
    y: uiPadding + 2,
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
                x: scale * personFrame.w + uiPadding,
                y: this.h / 2,
                text,
            });
        context.restore();
    },
};
