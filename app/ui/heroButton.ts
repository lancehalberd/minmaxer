import {getReviveCost, reviveHero} from 'app/objects/hero';
import {drawFrameInCircle} from 'app/utils/animations';
import {spendEssence} from 'app/utils/essence';
import {fillArc, fillCircle, renderCooldownCircle} from 'app/utils/draw';

const offset = 40;
const padding = 15;
const heroButtonSize = {
    w: 40,
    h: 40,
};

export function getHeroButtons(state: GameState): UIButton[] {
    const buttons: UIButton[] = [];
    let y = 80;
    for (const hero of state.heroSlots) {
        const heroButton: UIButton = {
            objectType: 'uiButton',
            uniqueId: `hero-${y}`,
            x: offset + padding,
            y,
            ...heroButtonSize,
            render(context: CanvasRenderingContext2D, state: GameState) {
                const r = this.h / 2;
                const circle = {x: this.x + r , y: this.y + r, r};
                fillCircle(context, {...circle, r: circle.r + 12, color: 'rgba(255,255,255,0.6)'});
                if (hero) {
                    // Draw health arc behind first.
                    fillArc(context, {...circle, r: circle.r + 8, color: '#000'}, - Math.PI / 2, Math.PI / 2);
                    const p = hero.health / hero.getMaxHealth(state);
                    fillArc(context, {...circle, r: circle.r + 8, color: p >= 0.6 ? '#080' : '#F80'}, Math.PI / 2 - p * Math.PI, Math.PI / 2);
                }
                fillCircle(context, {...circle, color: '#FFF'});
                fillCircle(context, {...circle, r: circle.r - 2, color: '#000'});
                if (hero) {
                    // Render the hero "portrait".
                    //fillCircle(context, {...hero, ...circle, r: circle.r - 4});
                    drawFrameInCircle(context, {...circle, r: circle.r - 4}, hero.definition.icon);

                    // Render revive cooldown timer
                    if (hero.reviveCooldown) {
                        const p = 1 - hero.reviveCooldown.remaining / hero.reviveCooldown.total;
                        renderCooldownCircle(context, circle, p, 'rgba(255, 255, 255, 0.6)');
                    }

                    // Render level circle on top of everything else.
                    const levelCircle = {x: this.x + 6 , y: this.y + 6, r: 12};
                    fillCircle(context, {...levelCircle, color: '#FFF'});
                    fillCircle(context, {...levelCircle, r: levelCircle.r - 2, color: '#000'});
                    context.font = "16px san-serif";
                    context.textBaseline = 'middle';
                    context.textAlign = 'center';
                    context.fillStyle = '#FFF';
                    context.fillText(`${hero.level}`, levelCircle.x, levelCircle.y + 1);

                } else {
                    // Draw a '+' in an empty circle for an unused hero slot.
                    context.font = "20px san-serif";
                    context.textBaseline = 'middle';
                    context.textAlign = 'center';
                    context.fillStyle = '#FFF';
                    context.fillText('+', circle.x, circle.y);
                }
            },
            onPress(state: GameState) {
                if (hero?.reviveCooldown) {
                    // Click on the button while the hero is dead to spend essence to revive them.
                    const cost = getReviveCost(state, hero);
                    if (spendEssence(state, cost)) {
                        reviveHero(state, hero);
                    }
                }
                if (hero) {
                    state.selectedHero = hero;
                    state.camera.zone = state.selectedHero.zone;
                    state.camera.target.x = state.selectedHero.x;
                    state.camera.target.y = state.selectedHero.y;
                    state.camera.speed = 800;
                } else {
                    state.camera.zone = state.nexus.zone;
                    state.camera.target.x = state.nexus.x;
                    state.camera.target.y = state.nexus.y;
                    state.camera.speed = 800;
                }
                return true;
            },
            onHover(state: GameState) {
                if (hero?.reviveCooldown) {
                    state.nexus.previewEssenceChange = -getReviveCost(state, hero);
                }
                return true;
            }
        }
        buttons.push(heroButton);
        y += heroButtonSize.h + padding;
    }
    return buttons;
}
