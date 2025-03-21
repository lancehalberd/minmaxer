import {frameLength} from 'app/gameConstants';
import {fillCircle} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';

interface CircleEffectProps extends ZoneLocation {
    r: number
    color: CanvasFill
    duration?: number
}
export class CircleEffect implements GenericEffect {
    objectType = <const>'effect';
    color = this.props.color;
    zone = this.props.zone;
    r = this.props.r;
    x = this.props.x;
    y = this.props.y;
    time = 0;
    duration = this.props.duration ?? 100;
    constructor(public props: CircleEffectProps) {
        this.zone.effects.push(this);
    }
    update(state: GameState) {
        this.time += frameLength
        if (this.time > this.duration) {
            removeEffect(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this)
    }
}
