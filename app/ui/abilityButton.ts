import {canvas} from 'app/gameConstants';
import {isMouseOverTarget} from 'app/mouse';
import {fillRect, fillText, renderCooldownCircle} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';


const padding = 10;
const abilityButtonSize = 40;
const abilityLevelButtonSize = 16;
const pillSize = 8;

export function getHeroAbilityButtons(state: GameState, hero: Hero): UIButton[] {
    const buttons: UIButton[] = [];
    let x = canvas.width / 2 - abilityButtonSize - padding / 2;
    for (const ability of hero.abilities) {
        const abilityButton: UIButton = {
            objectType: 'uiButton',
            uniqueId: `skill-${x}`,
            x,
            y: canvas.height - padding - abilityButtonSize,
            w: abilityButtonSize,
            h: abilityButtonSize,
            render(context: CanvasRenderingContext2D, state: GameState) {
                fillRect(context, this, '#FFF');
                fillRect(context, pad(this, -2), ability.level > 0 ? '#000' : '#888');
                fillText(context, {
                    size: 20, color: '#FFF',
                    text: ability.definition.abilityType === 'activeAbility' ? 'A' : 'P',
                    x: this.x + this.w / 2 + 3, y: this.y + this.h / 2,
                });
                for (let i = 0; i < 5; i++) {
                    const pillRect = {x: this.x, y: this.y + i * pillSize, w: pillSize, h: pillSize};
                    fillRect(context, pillRect, '#FFF');
                    fillRect(context, pad(pillRect, -1), ability.level > i ? '#080': '#888');
                }
                if (state.selectedAbility === ability) {
                    fillRect(context, this, 'rgba(0,0,255,0.5)');
                }
                if (ability.abilityType === 'activeAbility'
                    && ability.level > 0
                    && ability.cooldown <= 0
                    && isMouseOverTarget(state, this)
                ) {
                    fillRect(context, this, 'rgba(255,255,255,0.5)');
                }
                if (ability.abilityType === 'activeAbility' && ability.cooldown > 0) {
                    const p = 1 - ability.cooldown / ability.definition.getCooldown(state, hero, ability);
                    const circle = {x: this.x + this.w / 2 + 3, y : this.y + this.h / 2, r: this.w / 2 - 6}
                    renderCooldownCircle(context, circle, p, 'rgba(255, 0, 0, 0.6)');
                }
            },
            onPress(state: GameState) {
                if (ability.abilityType !== 'activeAbility') {
                    return true;
                }
                if (ability.level <= 0 || ability.cooldown > 0) {
                    return true;
                }
                const definition = ability.definition;
                if (definition.abilityType === 'activeAbility') {
                    if (definition.canActivate && !definition.canActivate(state, hero, ability)) {
                        return true;
                    }
                    const targetingInfo = definition.getTargetingInfo(state, hero, ability);
                    if (targetingInfo.canTargetEnemy || targetingInfo.canTargetAlly || targetingInfo.canTargetLocation) {
                        // If the ability can target, we selected it to allow the user to choose the target.
                        if (state.selectedAbility === ability) {
                            delete state.selectedAbility;
                        } else {
                            state.selectedAbility = ability;
                        }
                    } else {
                        // If the ability does not target, it is activated immediately.
                        definition.onActivate(state, hero, ability, undefined)
                        ability.cooldown = definition.getCooldown(state, hero, ability);
                    }
                }
                return true;
            },
            onHover(state: GameState) {
                if (ability.abilityType !== 'activeAbility') {
                    return true;;
                }
                if (ability.level > 0 && ability.cooldown <= 0) {
                    state.hoveredAbility = ability;
                }
                return true;
            }
        }
        buttons.push(abilityButton);
        if (ability.level < 5 && hero.totalSkillPoints > hero.spentSkillPoints) {
            const abilityLevelUpButton: UIButton = {
                objectType: 'uiButton',
                uniqueId: `skill-level-${x}`,
                x: abilityButton.x + abilityButton.w - abilityLevelButtonSize + 2,
                y: abilityButton.y + abilityButton.h - abilityLevelButtonSize + 2,
                w: abilityLevelButtonSize,
                h: abilityLevelButtonSize,
                render(context: CanvasRenderingContext2D, state: GameState) {
                    // Draw a red square with a white border and white plus on it.
                    const showHover = isMouseOverTarget(state, this);
                    fillRect(context, this, '#FFF');
                    fillRect(context, pad(this, -1), showHover ? '#F88' : '#F00');
                    fillRect(context, {x: this.x + this.w / 2 - 1, y: this.y + 2, w:2, h: this.h - 4}, '#FFF');
                    fillRect(context, {x: this.x + 2, y: this.y + this.h / 2 - 1, w: this.w - 4, h: 2}, '#FFF');
                },
                onPress(state: GameState) {
                    if (ability.level < 5 && hero.totalSkillPoints > hero.spentSkillPoints) {
                        ability.level++;
                        hero.spentSkillPoints++;
                    }
                    return true;
                }
            }
            buttons.push(abilityLevelUpButton);

        }
        x += abilityButtonSize + padding;
    }
    return buttons;
}
