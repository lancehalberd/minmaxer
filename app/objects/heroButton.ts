import {getReviveCost, reviveHero} from 'app/objects/hero';
import {spendEssence} from 'app/objects/nexus';
import {fillArc, fillCircle, renderCooldownCircle} from 'app/utils/draw';

const padding = 15;
const heroButtonSize = {
    w: 40,
    h: 40,
};

export function getHeroButtons(state: GameState): CanvasButton[] {
    const buttons: CanvasButton[] = [];
    let y = 80;
    for (const hero of state.heroSlots) {
        const heroButton: CanvasButton = {
            objectType: 'button',
            uniqueId: `hero-${y}`,
            x: padding,
            y,
            ...heroButtonSize,
            render(context: CanvasRenderingContext2D, state: GameState) {
                const r = this.h / 2;
                const circle = {x: this.x + r , y: this.y + r, r};
                fillCircle(context, {...circle, r: circle.r + 12, color: 'rgba(255,255,255,0.6)'});
                if (hero) {
                    // Draw health arc behind first.
                    fillArc(context, {...circle, r: circle.r + 8, color: '#000'}, - Math.PI / 2, Math.PI / 2);
                    const p = hero.health / hero.maxHealth;
                    fillArc(context, {...circle, r: circle.r + 8, color: p >= 0.6 ? '#080' : '#F80'}, Math.PI / 2 - p * Math.PI, Math.PI / 2);
                }
                fillCircle(context, {...circle, color: '#FFF'});
                fillCircle(context, {...circle, r: circle.r - 2, color: '#000'});
                if (hero) {
                    // Render the hero "portrait".
                    fillCircle(context, {...hero, ...circle, r: circle.r - 4});

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
                    context.fillText(`${hero.level}`, levelCircle.x, levelCircle.y);

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
                } else {
                    state.world.camera.target.x = state.nexus.x;
                    state.world.camera.target.y = state.nexus.y;
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
