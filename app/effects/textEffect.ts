import {frameLength} from 'app/gameConstants';
import {fillText} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';

interface TextEffectProps {
    target: FieldTarget
    text: string
    color?: CanvasFill
    delay?: number
}
class TextEffect implements FieldAnimationEffect {
    objectType = <const>'animation';
    zone = this.props.target.zone;
    x = Math.random() * 16 - 8;
    y = 0;
    text = this.props.text;
    target = this.props.target;
    color = this.props.color ?? '#FFF';
    delay = this.props.delay ?? 0;
    duration = 500;
    time = 0;
    constructor(public props: TextEffectProps) {
        this.zone.effects.push(this);
    }
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
        size = size | 0;
        let {x, y} = this;
        if (this.target){
            x += this.target.x;
            y += this.target.y;
        }
        fillText(context, {text: this.text, size, x, y, color: this.color});
    }
    
}
export function addTextEffect(state: GameState, props: TextEffectProps): FieldAnimationEffect {
    return new TextEffect(props);
}
