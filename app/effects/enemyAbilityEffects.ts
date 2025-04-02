import {frameLength} from 'app/gameConstants';
import {applyDamageOverTime, getAllyTargets, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';
import {fillCircle} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';

interface AreaDamageOverTimeEffectProps extends ZoneLocation {
    r: number
    duration: number
    damagePerSecond: number
    maxRadius: number
    targetsAllies?: boolean
    targetsEnemies?: boolean
    source: AttackTarget
    color?: CanvasFill
}
export class AreaDamageOverTimeEffect implements GenericEffect {
    objectType = <const>'effect';
    color = this.props.color ?? 'rgba(255, 0, 0, 0.6)';
    zone = this.props.zone;
    r = this.props.r;
    maxRadius = this.props.maxRadius;
    x = this.props.x;
    y = this.props.y;
    duration = this.props.duration;
    damagePerSecond = this.props.damagePerSecond;
    targetsAllies = this.props.targetsAllies;
    targetsEnemies = this.props.targetsEnemies;
    source = this.props.source;
    constructor(public props: AreaDamageOverTimeEffectProps) {
        this.zone.effects.push(this);
    }
    update(state: GameState) {
        if (this.r < this.maxRadius) {
            this.r = Math.min(this.maxRadius, Math.max(this.r++, this.r *= 1.1));
        }
        this.duration -= frameLength;
        if (this.duration <= 0) {
            removeEffect(state, this);
        }
        if (this.targetsAllies) {
            const targets = getTargetsInCircle(state, getAllyTargets(state, this.zone), this);
            for (const target of targets) {
                applyDamageOverTime(state, target, this.damagePerSecond);
            }
        }
        if (this.targetsEnemies) {
            const targets = getTargetsInCircle(state, getEnemyTargets(state, this.zone), this);
            for (const target of targets) {
                applyDamageOverTime(state, target, this.damagePerSecond);
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this)
    }
}
