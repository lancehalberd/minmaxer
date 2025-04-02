import {fillCircle} from 'app/utils/draw';

export function renderRangeCircle(context: CanvasRenderingContext2D, circle: Circle) {
    context.save();
        fillCircle(context, {x: circle.x, y: circle.y, r: circle.r});
        context.lineWidth = 1;
        context.setLineDash([3, 6]);
        context.strokeStyle = circle.color ?? 'rgba(255, 255, 255, 0.4)';
        context.stroke();
    context.restore();
}


export function renderAbilityWarning(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<any>) {
    if (!ability.target) {
        return;
    }
    if (ability.definition.renderWarning) {
        return ability.definition.renderWarning(context, state, enemy, ability, ability.target);
    }
    const p = ability.warningTime / ability.warningDuration;
    defaultRenderWarning(context, state, p, enemy, ability.definition.getTargetingInfo(state, enemy, ability), ability.target);
}

export function defaultRenderWarning(context: CanvasRenderingContext2D, state: GameState, p: number, enemy: Enemy, targetingInfo: AbilityTargetingInfo, target: ZoneLocation) {
    // Don't show warnings for enemy skills that target their allies.
    if (targetingInfo.canTargetAlly) {
        return;
    }
    if (targetingInfo.hitRadius) {
        // Attacks can hit units barely inside their range, so we increase the range of the warning to make
        // it more obvious that a player might be in range when they are on the very edge of the range.
        const drawnRadius = 10 + targetingInfo.hitRadius;
        // const center: Point = targetingInfo.range > 0 ? {} : {x: enemy.x, y: enemy.y};
        fillCircle(context, {x: target.x, y: target.y, r: drawnRadius});
        context.lineWidth = 2;
        context.strokeStyle = '#F00';
        context.stroke();
        fillCircle(context, {x: target.x, y: target.y, r: p * drawnRadius, color: 'rgba(255, 0, 0, 0.4)'});
    }
    if (targetingInfo.projectileRadius) {
        /*context.strokeStyle = 'rgba(0, 0, 255, 0.5)';
        context.lineWidth = 2 * targetingInfo.projectileRadius;
        const dx = target.x - state.selectedHero.x, dy = target.y - state.selectedHero.y;
        const mag = Math.sqrt(dx*dx + dy*dy);
        context.beginPath();
        context.moveTo(state.selectedHero.x, state.selectedHero.y);
        context.lineTo(
            state.selectedHero.x + targetingInfo.range * dx / mag,
            state.selectedHero.y + targetingInfo.range * dy / mag
        );*/
    }
}
