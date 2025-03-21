import {buttonSize, canvas, tinyButtonSize, uiPadding, uiSize} from 'app/gameConstants';
import {isMouseOverTarget} from 'app/mouse';
import {CloseIconButton, PlusButton} from 'app/ui/iconButton';
import {ToolTip, toolTipText} from 'app/ui/tooltip';
import {fillPlus, fillRect, fillText, renderCooldownCircle} from 'app/utils/draw';
import {spendEssence} from 'app/utils/essence';
import {pad} from 'app/utils/geometry';
import {activateNexusAbility} from 'app/utils/hero';


interface NexusAbilityButtonProps extends UIContainer {
    ability?: NexusAbility<any>
    onPressLevelUpButton: (state: GameState) => boolean
    showCooldown?: boolean
    showLevelUpButton?: boolean
}
class NexusAbilityButton implements UIContainer {
    objectType = <const>'uiContainer';
    ability = this.props.ability;
    uniqueId = this.props.uniqueId;
    x = this.props.x ?? canvas.width - 100;
    y = this.props.y ?? canvas.height - uiPadding - buttonSize;
    w = this.props.w ?? buttonSize;
    h = this.props.h ?? buttonSize;
    onPress = this.props.onPress;
    onHover = this.props.onHover;
    onPressLevelUpButton = this.props.onPressLevelUpButton;
    showLevelUpButton = this.props.showLevelUpButton;
    showCooldown = this.props.showCooldown;
    levelUpButton = new PlusButton({
        uniqueId: this.uniqueId + '-level-up',
        x: this.w - 3/4 * tinyButtonSize,
        y: this.h - 3/4 * tinyButtonSize,
        onPress: (state: GameState) => {
            return this.onPressLevelUpButton?.(state) ?? true;
        },
    });
    constructor(public props: Partial<NexusAbilityButtonProps>) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        const isHovered = isMouseOverTarget(state, this);
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, -2), '#000');
        if (this.ability) {
            this.ability.definition.renderIcon(context, state, pad(this, - 2));
            if (this.ability.level === 0 && !isHovered) {
                fillRect(context, this, 'rgba(128,128,128,0.8)');
            }
        } else {
            fillPlus(context, pad(this, -10), '#FFF');
        }
        if (isHovered && this.ability?.level !== 0) {
            fillRect(context, this, 'rgba(255,255,255,0.5)');
        }
        if (!this.ability) {
            return;
        }
        if (state.selectedAbility === this.ability) {
            fillRect(context, this, 'rgba(0,0,255,0.5)');
        }
        if (this.showCooldown && this.ability.cooldown > 0) {
            const p = 1 - this.ability.cooldown / this.ability.definition.getCooldown(state, this.ability);
            const circle = {x: this.x + this.w / 2, y : this.y + this.h / 2, r: this.w / 2 - 6}
            renderCooldownCircle(context, circle, p, 'rgba(0, 0, 0, 0.6)');
        }
        context.save();
            context.translate(this.x, this.y);
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getChildren(state: GameState) {
        return this.showLevelUpButton ? [this.levelUpButton] : [];
    }
}

function toggleSelectNexusAbility(state: GameState, index: number) {
    if (state.selectedNexusAbilitySlot === index) {
        delete state.selectedNexusAbilitySlot;
    } else {
        state.selectedNexusAbilitySlot = index;
    }
}
function assignNexusAbility(state: GameState, ability: NexusAbility<any>, index?: number) {
    if (index === undefined || index >= state.nexusAbilitySlots.length) {
        return;
    }
    // If this ability was already equipped, just swap it to the new slot.
    const currentIndex = state.nexusAbilitySlots.indexOf(ability);
    if (currentIndex >= 0) {
        state.nexusAbilitySlots[currentIndex] = state.nexusAbilitySlots[index];
        state.nexusAbilitySlots[index] = ability;
        return;
    }
    if (state.nexusAbilitySlots[index] !== ability) {
        // If a different skill was already equipped here, put this skill on cooldown.
        if (state.nexusAbilitySlots[index]) {
            ability.cooldown = ability.definition.getCooldown(state, ability);
        }
        state.nexusAbilitySlots[index] = ability;
    }
}
function levelNexusAbility(state: GameState, ability: NexusAbility<any>) {
    if (ability.level >= state.maxNexusAbilityLevel) {
        return;
    }
    const cost = getLevelNexusAbilityCost(state, ability);
    if (cost && spendEssence(state, getLevelNexusAbilityCost(state, ability))) {
        ability.level++;
    }
}
function getLevelNexusAbilityCost(state: GameState, ability: NexusAbility<any>): number {
    return [50, 7500, 100000][ability.level];
}
function previewLevelNexusAbilityCost(state: GameState, ability: NexusAbility<any>) {
    if (ability.level >= state.maxNexusAbilityLevel) {
        return;
    }
    state.nexus.previewEssenceChange = -getLevelNexusAbilityCost(state, ability);
}


export function getNexusAbilityButtons(state: GameState): UIContainer[] {
    const buttons: UIContainer[] = [];
    let x = canvas.width - uiPadding - buttonSize;
    for (let i = 0; i < state.nexusAbilitySlots.length; i++) {
        const ability = state.nexusAbilitySlots[i];
        const newButton = new NexusAbilityButton({
            ability,
            uniqueId: 'nexus-ability-' + i, x,
            onPress() {
                if (ability) {
                    activateNexusAbility(state, ability);
                } else {
                    toggleSelectNexusAbility(state, i);
                }
                return true;
            },
            onHover(state: GameState) {
                if (ability && ability.level > 0 && ability.cooldown <= 0) {
                    // state.hoveredAbility = this.ability;
                }
                return true;
            },
            onPressLevelUpButton(state: GameState) {
                toggleSelectNexusAbility(state, i);
                return true;
            },
            showCooldown: true,
            showLevelUpButton: !!ability,
        });
        buttons.push(newButton);
        x -= newButton.w + uiPadding;
    }
    return buttons;
}


const abilityColumns = 3;
const abilityRows = 2;
const headerSize = 3 * uiSize;
interface NexusAbilityPanelProps extends Partial<UIContainer> {
}
export class NexusAbilityPanel implements UIContainer {
    objectType = <const>'uiContainer';
    w = (buttonSize + uiPadding) * abilityColumns + uiPadding;
    h = (buttonSize + uiPadding) * abilityRows + uiPadding + headerSize + uiPadding;
    x = canvas.width - uiPadding - this.w;
    y = canvas.height - 2 * uiPadding - buttonSize - this.h;
    closeButton = new CloseIconButton({
        x: this.w - uiSize - uiPadding,
        y: uiPadding,
        w: uiSize,
        h: uiSize,
        onPress: (state: GameState) => {
            delete state.selectedNexusAbilitySlot;
            return true;
        },
    });
    abilityButtons: NexusAbilityButton[] = [];
    children: UIElement[] = [];
    constructor(public props: NexusAbilityPanelProps) {}
    update(state: GameState) {
        this.children = [this.closeButton];
        let column = 0, row = 0, i = 0;;
        for (const ability of state.nexusAbilities) {
            const x = uiPadding + (buttonSize + uiPadding) * column;
            const y = headerSize + uiPadding + (buttonSize + uiPadding) * row;
            const showLevelUpButton = ability.level > 0 && ability.level < state.maxNexusAbilityLevel;
            if (!this.abilityButtons[i]) {
                this.abilityButtons[i] = new NexusAbilityButton({
                    ability, x, y,
                    onPress() {
                        if (this.ability?.level) {
                            assignNexusAbility(state, this.ability, state.selectedNexusAbilitySlot);
                            delete state.selectedNexusAbilitySlot;
                        } else if (this.ability) {
                            levelNexusAbility(state, this.ability);
                            const index = state.selectedNexusAbilitySlot;
                            // If this was an unassigned slot and we just leveled the ability to 1, go ahead and assign it to that slot.
                            if (index !== undefined && ability.level === 1 && !state.nexusAbilitySlots[index]) {
                                assignNexusAbility(state, ability, index);
                                delete state.selectedNexusAbilitySlot;
                            }
                        }
                        return true;
                    },
                    onHover(state: GameState) {
                        if (this.ability?.level === 0) {
                            previewLevelNexusAbilityCost(state, this.ability);
                        }
                        if (this.ability?.definition.name) {
                            const text = this.ability?.level === 0
                                ? 'Learn ' +  this.ability?.definition.name
                                : 'Lv ' + this.ability.level + ' ' + this.ability?.definition.name;
                            state.hoverToolTip = new ToolTip(state, {textProps: toolTipText, lines: [text]});
                        }
                        return true;
                    },
                    onPressLevelUpButton(state: GameState) {
                        if (this.ability) {
                            levelNexusAbility(state, this.ability);
                        }
                        return true;
                    },
                    showLevelUpButton,
                });
            } else {
                this.abilityButtons[i].ability = ability;
                this.abilityButtons[i].x = x;
                this.abilityButtons[i].y = y;
                this.abilityButtons[i].showLevelUpButton = showLevelUpButton;
            }
            this.children.push(this.abilityButtons[i]);

            i++;
            column++;
            if (column >= abilityColumns) {
                row++;
                column = 0;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, - 2), '#444');
        context.save();
            context.translate(this.x, this.y);
            fillText(context, {text: 'Spells', x: this.w / 2, y: 10, size: 20, textAlign: 'center', textBaseline: 'top', color: '#FFF'});
            fillRect(context, {x: 0, y: headerSize, w: this.w, h: 2}, '#FFF');
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
