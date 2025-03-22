import {applyEffectToTarget} from 'app/utils/ability'
import {fillCircle} from 'app/utils/draw';

interface StackingAllyEffectProps {
    maxStacks?: number
    duration?: number
    getModifiers: (state: GameState, effect: StackingEffect) => StatModifier[]
    renderOver?: (context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) => void
    renderUnder?: (context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) => void
}
export class StackingAllyEffectDefinition {
    maxStacks = this.props.maxStacks;
    duration = this.props.duration ?? 10;
    getModifiers = this.props.getModifiers;
    renderOver = this.props.renderOver;
    renderUnder = this.props.renderUnder;

    constructor(public props: StackingAllyEffectProps) {}
    applyStacks(state: GameState, target: ModifiableTarget, stacks: number, abilityLevel?: number) {
        let effect = target.effects.find(e => e.creator === this);
        if (effect?.effectType === 'stackingEffect') {
            effect.remove(state, target);
            effect.stacks += stacks;
            effect.abilityLevel = abilityLevel;
            if (this.maxStacks) {
                effect.stacks = Math.min(effect.stacks + stacks, this.maxStacks)
            }
            effect.apply(state, target);
            effect.duration = Math.max(effect.duration, this.duration);
            return;
        }
        const definition = this;
        effect = {
            effectType: 'stackingEffect',
            creator: this,
            stacks,
            abilityLevel,
            duration: this.duration,
            apply(this: StackingEffect, state: GameState, target: ModifiableTarget) {
                target.addStatModifiers(definition.getModifiers(state, this))
            },
            remove(this: StackingEffect, state: GameState, target: ModifiableTarget) {
                target.removeStatModifiers(definition.getModifiers(state, this))
            },
            renderOver: this.renderOver,
        }
        if (this.maxStacks) {
            effect.stacks = Math.min(effect.stacks + stacks, this.maxStacks);
        }
        applyEffectToTarget(state, effect, target);
    }
}

interface ModifierEffectDefinitionProps extends Partial<BaseEffect> {
    duration: number
    modifiers: StatModifier[]
}
export class ModifierEffectDefinition {
    effectType = <const>'simpleEffect'
    duration = this.props.duration;
    modifiers = this.props.modifiers;
    renderOver = this.props.renderOver;
    renderUnder = this.props.renderUnder;
    constructor(public props: ModifierEffectDefinitionProps) { }
    apply(state: GameState, target: ModifiableTarget, duration = this.duration) {
        let effect = target.effects.find(e => e.creator === this);
        // If the effect is already present, just update the duration.
        if (effect?.effectType === 'simpleEffect') {
            effect.duration = Math.max(effect.duration, duration);
            return;
        }
        const definition = this;
        effect = {
            effectType: 'simpleEffect',
            creator: this,
            duration: duration,
            apply(this: StackingEffect, state: GameState, target: ModifiableTarget) {
                target.addStatModifiers(definition.modifiers);
            },
            remove(this: StackingEffect, state: GameState, target: ModifiableTarget) {
                target.removeStatModifiers(definition.modifiers);
            },
            renderOver: this.renderOver,
        };
        applyEffectToTarget(state, effect, target);
    }
}

export const invulnerabilityEffect = new ModifierEffectDefinition({
    duration: 10,
    modifiers: [{
        stat: 'incomingDamageMultiplier',
        multiplier: 0,
    }],
    renderUnder(context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) {
        fillCircle(context, {x: target.x, y: target.y, r: target.r + 2, color: 'rgba(255, 255, 128, 0.4)'});
        context.lineWidth = 1;
        context.strokeStyle = '#FF0';
        context.stroke();
    },
});

interface ModifierEffectProps extends Partial<BaseEffect> {
    duration: number
    modifiers: StatModifier[]
}
export class ModifierEffect implements SimpleEffect {
    effectType = <const>'simpleEffect'
    duration = this.props.duration;
    modifiers = this.props.modifiers;
    renderOver = this.props.renderOver;
    renderUnder = this.props.renderUnder;
    constructor(public props: ModifierEffectProps) { }
    apply(state: GameState, target: ModifiableTarget) {
        target.addStatModifiers(this.modifiers)
    }
    remove(state: GameState, target: ModifiableTarget) {
        target.removeStatModifiers(this.modifiers)
    }
}

export const stunEffect = new ModifierEffectDefinition({
    duration: 2,
    modifiers: [{
        stat: 'speed',
        multiplier: 0,
    }],
    renderOver(context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) {
        fillCircle(context, {x: target.x, y: target.y, r: target.r + 2, color: 'rgba(255, 255, 255, 0.4)'});
    },
});
