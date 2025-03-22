import {frameLength} from 'app/gameConstants';
import {fillCircle} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';

interface CircleEffectProps extends ZoneLocation {
    r: number
    color?: CanvasFill
    duration?: number
    fadeDuration?: number
    render?: (context: CanvasRenderingContext2D, state: GameState, effect: CircleEffect) => void
}
export class CircleEffect implements GenericEffect {
    objectType = <const>'effect';
    color = this.props.color ?? '#F00';
    zone = this.props.zone;
    r = this.props.r;
    x = this.props.x;
    y = this.props.y;
    time = 0;
    duration = this.props.duration ?? 100;
    fadeDuration = this.props.fadeDuration ?? 60;
    constructor(public props: CircleEffectProps) {
        this.zone.effects.push(this);
    }
    update(state: GameState) {
        this.time += frameLength
        let time = this.time;
        if (time > this.duration) {
            time -= this.duration;
            if (time > this.fadeDuration) {
                removeEffect(state, this);
            }
        }
    }
    render(this: CircleEffect, context: CanvasRenderingContext2D, state: GameState) {
        context.save();
            let time = this.time;
            if (time > this.duration) {
                time -= this.duration;
                context.globalAlpha *= Math.max(0, 1 - time / this.fadeDuration);
            }
            if (this.props.render) {
                this.props.render(context, state, this);
            } else {
                fillCircle(context, this);
            }
        context.restore();
    }
}

