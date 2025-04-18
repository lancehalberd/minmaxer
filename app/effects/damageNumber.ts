import {frameLength} from 'app/gameConstants';
import {fillText} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';


interface DamageNumberEffectProps {
    target: FieldTarget
    damage: number
    delay?: number
    isCrit?: boolean
}
class DamageNumberEffect implements FieldAnimationEffect {
    objectType = <const>'animation';
    zone = this.props.target.zone;
    x = Math.random() * 16 - 8;
    y = 0;
    damage = this.props.damage;
    target = this.props.target;
    isCrit = this.props.isCrit;
    duration = 500;
    delay = this.props.delay ?? 0;
    time = 0;
    constructor(public props: DamageNumberEffectProps) {}
    update(state: GameState) {
        if (this.delay > 0) {
            this.delay -= frameLength;
            return;
        }
        // Fast at the start and end, slow in the middle.
        this.y -= 2 * (1 - Math.sin(this.time / this.duration * Math.PI));
        this.time += frameLength;
        if (this.time >= this.duration) {
            removeEffect(state, this);
            return;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        if (this.delay > 0) {
            return;
        }
        // Small at the start and end, large in the middle.
        let size = 6 + 6 * Math.sin(this.time / this.duration * Math.PI);
        if (this.isCrit) {
            size = 1.5 * size;
        }
        size = size | 0;
        let {x, y} = this;
        if (this.target){
            x += this.target.x;
            y += this.target.y;
        }
        fillText(context, {text: this.damage, size, x, y, color: this.isCrit ? '#FF0' : '#F00'});
    }
    
}
export function addDamageNumber(state: GameState, props: DamageNumberEffectProps): FieldAnimationEffect {
    const damageNumberEffect = new DamageNumberEffect(props);
    damageNumberEffect.zone.effects.push(damageNumberEffect);
    return damageNumberEffect;
}
