import {frameLength} from 'app/gameConstants';
import {fillRect} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';


interface HealEffectProps extends ZoneLocation {
    target?: FieldTarget
}
class HealEffect implements FieldAnimationEffect {
    objectType = <const>'animation';
    zone = this.props.zone;
    x = this.props.x;
    y = this.props.y;
    target = this.props.target;
    duration = 500;
    time = 0;
    constructor(public props: HealEffectProps) {
    }
    update(state: GameState) {
        // Fast at the start and end, slow in the middle.
        this.y -= Math.cos(this.time / this.duration * Math.PI);
        this.time += frameLength;
        if (this.time >= this.duration) {
            removeEffect(state, this);
            return;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        // Small at the start and end, large in the middle.
        const size = 6 + 6 * Math.sin(this.time / this.duration * Math.PI);
        let {x, y} = this;
        if (this.target){
            x += this.target.x;
            y += this.target.y;
        }
        fillRect(context, {x: x - size / 6, y: y - size / 2, w: size / 3, h: size}, '#0F0');
        fillRect(context, {x: x - size / 2, y: y - size / 6, w: size, h: size / 3}, '#0F0');
    }
    
}
export function addHealEffectToTarget(state: GameState, target: FieldTarget, props?: HealEffectProps): FieldAnimationEffect {
    const healEffect = new HealEffect({target, x: 0, y: 0, zone: target.zone, ...props});
    healEffect.zone.effects.push(healEffect);
    return healEffect;
}
export function addHealEffect(state: GameState, props: HealEffectProps): FieldAnimationEffect {
    const healEffect = new HealEffect(props);
    healEffect.zone.effects.push(healEffect);
    return healEffect;
}
