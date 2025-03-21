import {buttonSize, canvas, uiPadding, tinyButtonSize} from 'app/gameConstants';
import {isMouseOverTarget} from 'app/mouse';
import {PlusButton, RepeatToggle} from 'app/ui/iconButton';
import {fillRect, fillText, renderCooldownCircle} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';
import {activateHeroAbility} from 'app/utils/hero';

const pillSize = buttonSize / 5;

interface HeroAbilityButtonProps extends Partial<UIContainer> {
    hero: Hero
    ability: Ability
}
class HeroAbilityButton implements UIContainer {
    objectType = <const>'uiContainer';
    hero = this.props.hero;
    ability = this.props.ability;
    x = this.props.x ?? canvas.width - 100;
    y = this.props.y ?? canvas.height - uiPadding - buttonSize;
    w = this.props.w ?? buttonSize;
    h = this.props.h ?? buttonSize;
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
        context.save();
            context.translate(this.x, this.y);
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
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
                x: this.w - 3/4 * tinyButtonSize,
                y: this.h - 3/4 * tinyButtonSize,
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
                x: this.w - 3/4 * tinyButtonSize,
                y: -1/4 * tinyButtonSize,
                w: tinyButtonSize, h: tinyButtonSize,
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
    let x = canvas.width / 2 - buttonSize - uiPadding / 2;
    for (const ability of hero.abilities) {
        const abilityButton = new HeroAbilityButton({ability, hero, uniqueId: `skill-${x}`, x});
        buttons.push(abilityButton);
        x += buttonSize + uiPadding;
    }
    return buttons;
}

