import {frameLength} from 'app/gameConstants';
import {renderLightningCircle, renderLightningRay} from 'app/draw/renderLightning'
import {removeEffect} from 'app/utils/effect';


interface Props extends Partial<FieldAnimationEffect> {
    zone: ZoneInstance
    ray?: Ray
    circle?: Circle
    duration?: number
}

export class LightningAnimationEffect implements FieldAnimationEffect, Props {
    objectType = <const>'animation';
    zone = this.props.zone;
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    ray = this.props.ray;
    circle = this.props.circle;
    duration = this.props.duration ?? 400;
    animationTime = 0;
    constructor(public props: Props) {}
    update(state: GameState) {
        this.animationTime += frameLength;
        if (this.animationTime >= this.duration) {
            removeEffect(state, this);
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.circle) {
            renderLightningCircle(context, this.circle, 4, Math.min(100, Math.max(40, this.circle.r | 0)));
        } else if (this.ray) {
            renderLightningRay(context, this.ray, {strength: 4});
        }
    }
}
