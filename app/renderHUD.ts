import {canvas} from 'app/gameConstants';
import {playPauseButton} from 'app/hud';
import {getNextEssenceGoal} from 'app/utils/essence';
import {fillCircle, fillRect, fillText, renderLifeBar} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';
import {millisecondsToTime} from 'app/utils/time';


export function renderHUD(context: CanvasRenderingContext2D, state: GameState) {
    renderEssenceBar(context, state, {x:10, y: 10, w: 500, h: 40});
    if (state.city.maxWallHealth) {
        renderLifeBar(context, {x: 30, y: 45, w: 460, h: 10}, state.city.wallHealth, state.city.maxWallHealth, '#FFF', '#888');
    }
    const time = millisecondsToTime(state.world.time);

    context.font = "30px san-serif";
    context.textBaseline = 'middle';
    context.textAlign = 'right';
    context.fillStyle = '#000';
    context.fillText(time, playPauseButton.x - 10 + 1, playPauseButton.y + playPauseButton.h / 2 + 1);
    context.fillStyle = '#FFF';
    context.fillText(time, playPauseButton.x - 10, playPauseButton.y + playPauseButton.h / 2);

    for (const element of state.hudUIElements) {
        element.render(context, state);
    }

    const inventorySize = {w: 200, h: 200};
    renderInventory(context, state, {...inventorySize, x: canvas.width - inventorySize.w, y: 70});
}

export function renderInventory(context: CanvasRenderingContext2D, state: GameState, container: Rect) {
    fillRect(context, container, '#FFF');
    fillRect(context, pad(container, -2), '#666');
    const text: Partial<FillTextProperties> = {
        size: 15,
        color: '#FFF',
        textAlign: 'left',
        textBaseline: 'top',
    };
    let y = container.y + 10, x = container.x + 5;
    for (const key of Object.keys(state.inventory) as Array<keyof(Inventory)>) {
        const value = state.inventory[key];
        if (value > 0) {
            fillText(context, {...text, text: key + ': ' + value, x, y});
            y += 20;
        }
        if (y + 20 >= container.y + container.h) {
            break;
        }
    }
    for (const [key, value] of [['population', state.city.population]]) {
        if (value > 0) {
            fillText(context, {...text, text: key + ': ' + value, x, y});
        }
        if (y + 20 >= container.y + container.h) {
            break;
        }
    }
}


export function renderEssenceBar(context: CanvasRenderingContext2D, state: GameState, bar: Rect) {
    const essence = state.nexus.essence | 0;
    const gainedEssence = state.nexus.gainedEssence | 0;
    const lostEssence = state.nexus.lostEssence | 0;
    const previewEssenceChange = state.nexus.previewEssenceChange | 0;
    let displayedEssence = essence - gainedEssence;
    //const essence = (99 + 99 * Math.sin(state.world.time / 1000)) | 0;
    const goal = getNextEssenceGoal(state) ?? essence;
    const p = displayedEssence / goal;
    let gradient: CanvasFill;

    // Bar background
    drawPill(context, bar, '#FFF');
    drawPill(context, pad(bar, -1), '#888');
    drawPill(context, pad(bar, -2), '#000');
    // Don't draw any of the fill effects if essence is not greater than 0.
    if (state.nexus.essence > 0) {
        // Draw gained/lost indicators underneath the main fill indicator.
        context.save();
            context.globalAlpha *= 0.6
            if (gainedEssence && gainedEssence >= lostEssence) {
                drawPillFill(context, pad(bar, -3), Math.min(1, (gainedEssence + displayedEssence) / goal), '#0F0');
                if (lostEssence) {
                    drawPillFill(context, pad(bar, -3), Math.min(1, (lostEssence + displayedEssence) / goal), '#F00');
                }
            } else if (lostEssence) {
                drawPillFill(context, pad(bar, -3), Math.min(1, (lostEssence + displayedEssence) / goal), '#F00');
                if (gainedEssence) {
                    drawPillFill(context, pad(bar, -3), Math.min(1, (gainedEssence + displayedEssence) / goal), '#0F0');
                }
            }
        context.restore();
        // Bar fill
        const gradientWidth = bar.w * Math.min(1, (displayedEssence + lostEssence) / goal);
        gradient = context.createLinearGradient(bar.x + gradientWidth, bar.y + bar.h, bar.x + gradientWidth + 8, bar.y);
        gradient.addColorStop(0, 'rgba(196, 0, 128, 1)');
        gradient.addColorStop(0.8 + p * 0.2 * Math.sin(state.time / 200), 'rgba(255, 196, 0, 1)');
        if (previewEssenceChange < 0) {
            const canAffordEssenceCost = displayedEssence + previewEssenceChange > 0;
            drawPillFill(context, pad(bar, -3), Math.min(1, (displayedEssence) / goal), canAffordEssenceCost ? '#F80' : '#F00');
            if (canAffordEssenceCost) {
                drawPillFill(context, pad(bar, -3), (displayedEssence + previewEssenceChange) / goal, gradient);
            }
        } else  if (previewEssenceChange > 0) {
            drawPillFill(context, pad(bar, -3), Math.min(1, (displayedEssence + previewEssenceChange) / goal), '#0F0');
            drawPillFill(context, pad(bar, -3), p, gradient);
        } else {
            drawPillFill(context, pad(bar, -3), p, gradient);
        }
    }
    // Bar overlay
    gradient = context.createLinearGradient(bar.x, bar.y + 3, bar.x, bar.y + bar.h - 3);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    drawPill(context, pad(bar, -2), gradient);
    const left = bar.x + bar.h / 2 + 4, right = bar.x + bar.w - bar.h / 2 - 4;
    gradient = context.createLinearGradient(left, bar.y, right, bar.y);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    fillRect(context, {x: left, y: bar.y + 3, h: 1, w: right - left}, gradient);

    const circle: Circle = {x: bar.x + bar.h / 3, y: bar.y + bar.h / 3, r: bar.h / 5};
    gradient = context.createRadialGradient(circle.x, circle.y, 0, circle.x, circle.y, circle.r);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    circle.color = gradient;
    fillCircle(context, circle);

    context.font = "20px san-serif";
    context.fillStyle = '#FFF';
    context.textBaseline = 'middle';
    context.textAlign = 'left';
    context.fillText(goal ? (essence + '/' + goal) : '' + essence, bar.x + bar.h / 2, bar.y + bar.h / 2 + 1);
    if (previewEssenceChange) {
        const symbol = (previewEssenceChange > 0) ? '+ ' : '- ';
        let w = (bar.w * Math.min(1, Math.max(essence, displayedEssence + previewEssenceChange) / goal) | 0) - bar.h / 2;
        w = Math.max(w, bar.h / 2 + 100);
        context.textAlign = 'right';
        context.fillText(symbol + Math.abs(previewEssenceChange), bar.x + w, bar.y + bar.h / 2 + 1);
    }
}

export function drawPill(context: CanvasRenderingContext2D, r: Rect, color: CanvasFill) {
    const radius = r.h / 2;
    context.fillStyle = color;
    context.beginPath();
    context.arc(r.x + radius, r.y + radius, radius, Math.PI / 2, 3 * Math.PI / 2);
    context.lineTo(r.x + r.w - radius, r.y);
    context.arc(r.x + r.w - radius, r.y + radius, radius, 3 * Math.PI / 2, 5 * Math.PI / 2);
    context.lineTo(r.x + radius, r.y + r.h);
    context.fill();
}

export function drawPillFill(context: CanvasRenderingContext2D, r: Rect, p: number, color: CanvasFill) {
    const w = (r.w * p) | 0;
    const radius = r.h / 2;
    if (w < 2 * radius) {
        context.fillStyle = color;
        context.beginPath();
        context.arc(r.x + w / 2, r.y + radius, w / 2, 0, 2 * Math.PI);
        context.fill();
    } else {
        drawPill(context, {...r, w}, color);
    }
}

