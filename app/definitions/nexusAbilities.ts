import {addHealEffectToTarget} from 'app/effects/healAnimation';
import {getValidAbilityTargets, getTargetsInCircle} from 'app/utils/combat';
import {fillPlus} from 'app/utils/draw';


export const healingWind: NexusAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeNexusAbility',
    name: 'Healing Wind',
    renderIcon(context: CanvasRenderingContext2D, r: Rect) {
        fillPlus(context, {x: r.x + r.w / 2 - r.w / 3, y: r.y + r.h / 2 - r.w / 8, w: r.w / 3, h: r.w / 3}, '#080');
        fillPlus(context, {x: r.x + r.w / 2 - r.w / 5, y: r.y + r.h - 2 - r.w / 4, w: r.w / 4, h: r.w / 4}, '#0F0');
        fillPlus(context, {x: r.x + r.w / 2 - r.w / 4, y: r.y + 2, w: r.w / 2, h: r.w / 2}, '#0F0');
    },
    getTargetingInfo(state: GameState, ability: NexusAbility<AbilityTarget>) {
        // This skill is used immediately where the hero is standing when activated.
        return {
            canTargetAlly: true,
            canTargetLocation: true,
            // The attack radius is 1.1/1.2/1.3/1.4/1.5x of the base radius.
            hitRadius: Math.floor([1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7][ability.level - 1] * 50),
            range: 0,
        };
    },
    getCooldown(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return Math.floor(30000 - 1000 * [1, 2, 3, 4, 6, 8, 10][ability.level - 1]);
    },
    onActivate(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget) {
        const targetingInfo = this.getTargetingInfo(state, ability);
        const hitCircle = {x: target.x, y: target.y, r: targetingInfo.hitRadius || 0};
        const targets = getTargetsInCircle(state, getValidAbilityTargets(state, state.camera.zone, targetingInfo), hitCircle);
        // This attack does 25/35/45/55/65% increased base damage.
        const healAmount = [30, 100, 200, 500, 1000, 2000, 5000][ability.level - 1];
        for (const target of targets) {
            if (target.objectType === 'nexus') {
                continue;
            }
            target.health = Math.min(target.getMaxHealth(state), target.health + healAmount);
            addHealEffectToTarget(state, target);
        }
    },
};

export function createNexusAbility<T extends FieldTarget | undefined>(abilityDefinition: NexusAbilityDefinition<T>): NexusAbility<T> {
    return {
        abilityType: <const>'activeNexusAbility',
        definition: abilityDefinition,
        level: 0,
        cooldown: 0,
    };
}

// TODO: add "Inferno" area DOT skill
// TODO: add "Arctic Blast" area damage + slow skill
// TODO: add "Summon Ents" skill to summon ally minions
