import {canvas} from 'app/gameConstants';
import {isMouseOverTarget} from 'app/mouse';
import {RepeatToggle} from 'app/ui/iconButton';
import {fillPlus, fillRect, fillText, renderCooldownCircle} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';
import {activateHeroAbility, activateNexusAbility} from 'app/utils/hero';

const padding = 10;
const abilityButtonSize = 50;
const abilityLevelButtonSize = 20;
const pillSize = 10;


interface HeroAbilityButtonProps extends Partial<UIContainer> {
    hero: Hero
    ability: Ability
}
class HeroAbilityButton implements UIContainer {
    objectType = <const>'uiContainer';
    hero = this.props.hero;
    ability = this.props.ability;
    x = this.props.x ?? canvas.width - 100;
    y = this.props.y ?? canvas.height - padding - abilityButtonSize;
    w = this.props.w ?? abilityButtonSize;
    h = this.props.h ?? abilityButtonSize;
    constructor(public props: HeroAbilityButtonProps) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, -2), this.ability.level > 0 ? '#000' : '#888');
        fillText(context, {
            size: 20, color: '#FFF',
            text: this.ability.definition.abilityType === 'activeAbility' ? 'A' : 'P',
            x: this.x + this.w / 2 + 3, y: this.y + this.h / 2,
        });
        for (let i = 0; i < 5; i++) {
            const pillRect = {x: this.x, y: this.y + i * pillSize, w: pillSize, h: pillSize};
            fillRect(context, pillRect, '#FFF');
            fillRect(context, pad(pillRect, -1), this.ability.level > i ? '#080': '#888');
        }
        if (state.selectedAbility === this.ability) {
            fillRect(context, this, 'rgba(0,0,255,0.5)');
        }
        if (this.ability.abilityType === 'activeAbility'
            && this.ability.level > 0
            && this.ability.cooldown <= 0
            && isMouseOverTarget(state, this)
        ) {
            fillRect(context, this, 'rgba(255,255,255,0.5)');
        }
        if (this.ability.abilityType === 'activeAbility' && this.ability.cooldown > 0) {
            const p = 1 - this.ability.cooldown / this.ability.definition.getCooldown(state, this.hero, this.ability);
            const circle = {x: this.x + this.w / 2 + 3, y : this.y + this.h / 2, r: this.w / 2 - 6}
            renderCooldownCircle(context, circle, p, 'rgba(255, 0, 0, 0.6)');
        }
        const children = this.getChildren?.(state) ?? [];
        for (const child of children) {
            child.render(context, state);
        }
    }
    onPress(state: GameState) {
        activateHeroAbility(state, this.hero, this.ability);
        return true;
    }
    onHover(state: GameState) {
        if (this.ability.abilityType !== 'activeAbility') {
            return true;
        }
        if (this.ability.level > 0 && this.ability.cooldown <= 0) {
            state.hoveredAbility = this.ability;
        }
        return true;
    }
    getChildren(state: GameState) {
        const children: UIElement[] = [];
        const ability = this.ability;
        if (ability.level < 5 && this.hero.totalSkillPoints > this.hero.spentSkillPoints) {
            const abilityLevelUpButton = new PlusButton({
                x: this.x + this.w - 3/4 * abilityLevelButtonSize,
                y: this.y + this.h - 3/4 * abilityLevelButtonSize,
                uniqueId: `skill-level-${this.x}`,
                onPress: (state: GameState) => {
                    if (ability.level < 5 && this.hero.totalSkillPoints > this.hero.spentSkillPoints) {
                        ability.level++;
                        this.hero.spentSkillPoints++;
                    }
                    return true;
                }
            });
            children.push(abilityLevelUpButton);
        }
        if (ability.level && ability.abilityType === 'activeAbility') {
            const autoCastToggle = new RepeatToggle({
                uniqueId: `skill-autocast-${this.x}`,
                x: this.x + this.w - 3/4 * abilityLevelButtonSize,
                y: this.y - 1/4 * abilityLevelButtonSize,
                w: abilityLevelButtonSize, h: abilityLevelButtonSize,
                isActive: (state: GameState) => {
                    return ability.autocast;
                },
                onClick: (state: GameState) => {
                    ability.autocast = !ability.autocast;
                    return true;
                },
            });
            children.push(autoCastToggle);
        }
        return children;
    }
}

export function getHeroAbilityButtons(state: GameState, hero: Hero): UIElement[] {
    const buttons: UIElement[] = [];
    let x = canvas.width / 2 - abilityButtonSize - padding / 2;
    for (const ability of hero.abilities) {
        const abilityButton = new HeroAbilityButton({ability, hero, uniqueId: `skill-${x}`, x});
        buttons.push(abilityButton);
        x += abilityButtonSize + padding;
    }
    return buttons;
}

class PlusButton implements UIButton {
    objectType = <const>'uiButton';
    uniqueId = this.props.uniqueId;
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    w = this.props.w ?? abilityLevelButtonSize;
    h = this.props.h ?? abilityLevelButtonSize;
    onPress = this.props.onPress;
    constructor(public props: Partial<UIButton>) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Draw a red square with a white border and white plus on it.
        const showHover = isMouseOverTarget(state, this);
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, -1), showHover ? '#F88' : '#F00');
        fillPlus(context, pad(this, -4), '#FFF');
    }
}

interface NexusAbilityButtonProps extends UIContainer {
    ability?: NexusAbility<any>
}
class NexusAbilityButton implements UIContainer {
    objectType = <const>'uiContainer';
    ability = this.props.ability;
    x = this.props.x ?? canvas.width - 100;
    y = this.props.y ?? canvas.height - padding - abilityButtonSize;
    w = this.props.w ?? abilityButtonSize;
    h = this.props.h ?? abilityButtonSize;
    constructor(public props: Partial<NexusAbilityButtonProps>) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, -2), '#000');
        if (this.ability) {
            this.ability.definition.renderIcon(context, pad(this, - 2));
        } else {
            fillPlus(context, pad(this, -10), '#FFF');
        }
        if (isMouseOverTarget(state, this)) {
            fillRect(context, this, 'rgba(255,255,255,0.5)');
        }
        if (!this.ability) {
            return;
        }
        if (state.selectedAbility === this.ability) {
            fillRect(context, this, 'rgba(0,0,255,0.5)');
        }
        if (this.ability.cooldown > 0) {
            const p = 1 - this.ability.cooldown / this.ability.definition.getCooldown(state, this.ability);
            const circle = {x: this.x + this.w / 2 + 3, y : this.y + this.h / 2, r: this.w / 2 - 6}
            renderCooldownCircle(context, circle, p, 'rgba(255, 0, 0, 0.6)');
        }
        const children = this.getChildren?.(state) ?? [];
        for (const child of children) {
            child.render(context, state);
        }
    }
    onPress(state: GameState) {
        if (this.ability) {
            activateNexusAbility(state, this.ability);
        } else {
            // TODO: Open select skill panel.
        }
        return true;
    }
    /*onHover(state: GameState) {

        if (this.ability.level > 0 && this.ability.cooldown <= 0) {
            state.hoveredAbility = this.ability;
        }
        return true;
    }*/
    getChildren(state: GameState) {
        const selectSkillButton = new PlusButton({
            x: this.x + this.w - 3/4 * abilityLevelButtonSize,
            y: this.y + this.h - 3/4 * abilityLevelButtonSize,
            onPress(state: GameState) {
                // TODO: Open select skill panel.
                return true;
            }
        });
        return [selectSkillButton];
    }
}

export function getNexusAbilityButtons(state: GameState): UIContainer[] {
    const buttons: UIContainer[] = [];
    let x = canvas.width - 100;
    for (const ability of state.nexusAbilitySlots) {
        const newButton = new NexusAbilityButton({ability, x});
        buttons.push(newButton);
        x += newButton.w + padding;
    }
    return buttons;
}
