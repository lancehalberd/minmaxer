import {ModifierEffect} from 'app/definitions/modifierEffects';
import {CircleEffect} from 'app/effects/circleEffect';
import {addHealEffectToTarget} from 'app/effects/healAnimation';
import {AllyObject} from 'app/objects/ally';
import {frameLength} from 'app/gameConstants';
import {applyEffectToTarget} from 'app/utils/ability';
import {applyDamageOverTime, damageTarget, getAllyTargets, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';
import {fillCircle, fillPlus} from 'app/utils/draw';
import {removeEffect} from 'app/utils/effect';
import {removeFieldObject} from 'app/utils/world';

export function createNexusAbility<T extends FieldTarget | undefined>(abilityDefinition: NexusAbilityDefinition<T>): NexusAbility<T> {
    return {
        abilityType: <const>'activeNexusAbility',
        definition: abilityDefinition,
        level: 0,
        cooldown: 0,
    };
}


export function getNexusAbility(state: GameState, definition: NexusAbilityDefinition<any>): NexusAbility<any>|undefined {
    return state.nexusAbilities.find(ability => ability.definition === definition);
}
export function requireNexusAbility(state: GameState, definition: NexusAbilityDefinition<any>): NexusAbility<any> {
    const ability = getNexusAbility(state, definition);
    if (!ability) {
        throw new Error('Could not find nexus ability for definition');
    }
    return ability;
}

// 1.6^11 is ~175, 1.75^11 is ~470
const nexusGrowthFactor = 1.6;
export function getNexusAbilityPower(state: GameState, ability: NexusAbility<any>): number {
    return (nexusGrowthFactor ** (state.nexus.level - 1 + ability.level - 1)) * Math.max(1, state.city.mages.power);
}
// TODO: Allow overhealing heroe's up to 200% health with grey healthbar to represent extra health.
export const healingWind: NexusAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeNexusAbility',
    abilityKey: 'heal',
    name: 'Healing Wind',
    renderIcon(context: CanvasRenderingContext2D, state: GameState, r: Rect) {
        fillPlus(context, {x: r.x + r.w / 2 - r.w / 3, y: r.y + r.h / 2 - r.w / 8, w: r.w / 3, h: r.w / 3}, '#080');
        fillPlus(context, {x: r.x + r.w / 2 - r.w / 5, y: r.y + r.h - 2 - r.w / 4, w: r.w / 4, h: r.w / 4}, '#0F0');
        fillPlus(context, {x: r.x + r.w / 2 - r.w / 4, y: r.y + 2, w: r.w / 2, h: r.w / 2}, '#0F0');
    },
    getTargetingInfo(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return {
            canTargetAlly: true,
            canTargetLocation: true,
            hitRadius: Math.floor([1, 1.5, 2][ability.level - 1] * 50),
            range: 0,
        };
    },
    getCooldown(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return [30000, 25000, 20000][ability.level - 1];
    },
    onActivate(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget) {
        const targetingInfo = this.getTargetingInfo(state, ability);
        const hitCircle = {x: target.x, y: target.y, r: targetingInfo.hitRadius || 0};
        const targets = getTargetsInCircle(state, getAllyTargets(state, state.camera.zone), hitCircle);
        // Heal amount increases by 50% every nexus level.
        const healAmount = Math.floor(30 * getNexusAbilityPower(state, ability));
        for (const target of targets) {
            target.health = Math.min(target.getMaxHealth(state), target.health + healAmount);
            addHealEffectToTarget(state, target);
        }
    },
};
// Mage version of "Healing Wind", 10% cooldown, 10% heal effect.
export const mageHeal = {
    getTargetingInfo(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return ability.definition.getTargetingInfo(state, ability);
    },
    isTargetValid(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget) {
        return (target.objectType === 'hero' || target.objectType === 'ally') && target.health < target.getMaxHealth(state);
    },
    getCooldown(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return ability.definition.getCooldown(state, ability) / 3;
    },
    onActivate(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget, power: number) {
        const targetingInfo = this.getTargetingInfo(state, ability);
        const hitCircle = {x: target.x, y: target.y, r: targetingInfo.hitRadius || 0};
        const targets = getTargetsInCircle(state, getAllyTargets(state, state.camera.zone), hitCircle);
        // Heal amount increases by 50% every nexus level.
        const healAmount = Math.floor(3 * power * getNexusAbilityPower(state, ability));
        for (const target of targets) {
            target.health = Math.min(target.getMaxHealth(state), target.health + healAmount);
            addHealEffectToTarget(state, target);
        }
    },
};

const fireGroundCanvasFill = 'rgba(255, 0, 0, 0.3)';
interface FireGroundEffectProps extends ZoneLocation {
    r: number
    color?: CanvasFill
    duration: number
    damagePerSecond: number
    maxRadius: number
    targetsAllies?: boolean
    targetsEnemies?: boolean
    source: AttackTarget
}
class FireGroundEffect implements GenericEffect {
    objectType = <const>'effect';
    color = this.props.color ?? fireGroundCanvasFill;
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
    constructor(public props: FireGroundEffectProps) {
        this.zone.effects.push(this);
    }
    update(state: GameState) {
        if (this.r < this.maxRadius) {
            this.r++;
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
export const inferno: NexusAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeNexusAbility',
    abilityKey: 'flame',
    name: 'Inferno',
    renderIcon(context: CanvasRenderingContext2D, state: GameState, r: Rect) {
        fillCircle(context, {x: r.x + r.w / 2 - r.w / 3 + r.w / 6, y: r.y + r.h / 2 - r.w / 8 + r.w / 6, r: r.w / 6, color: '#F00'});
        fillCircle(context, {x: r.x + r.w / 2 - r.w / 5 + r.w / 8, y: r.y + r.h - 2 - r.w / 4  +r.w / 8, r: r.w / 8, color: '#F00'});
        fillCircle(context, {x: r.x + r.w / 2 - r.w / 4 + r.w / 4, y: r.y + 2 + r.w / 4, r: r.w / 4, color: '#F00'});
    },
    getTargetingInfo(state: GameState, ability: NexusAbility<AbilityTarget>) {
         return {
             canTargetEnemy: true,
             canTargetLocation: true,
             hitRadius: Math.floor([1, 1.5, 2][ability.level - 1] * 50),
             range: 0,
        };
    },
    getCooldown(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return [30000, 25000, 20000][ability.level - 1];
    },
    onActivate(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget) {
        const targetingInfo = this.getTargetingInfo(state, ability);
        const damagePerSecond = Math.ceil(3 * getNexusAbilityPower(state, ability));

        // FireGroundEffect automatically adds itself to the zone in the constructor.
        const fireGroundEffect = new FireGroundEffect({
            zone: target.zone,
            x: target.x,
            y: target.y,
            r: targetingInfo.hitRadius || 0,
            maxRadius: targetingInfo.hitRadius || 0,
            targetsEnemies: true,
            duration: [4000, 6000, 10000][ability.level - 1],
            damagePerSecond,
            source: state.nexus,
        });

        const targets = getTargetsInCircle(state, getEnemyTargets(state, state.camera.zone), fireGroundEffect);
        const damageAmount = damagePerSecond * 2;
        for (const target of targets) {
            damageTarget(state, target, {damage: damageAmount, source: state.nexus});
        }

    },
};
// Mage version of "Inferno", 10% cooldown, 20% damage, 50% duration, 50% area.
export const mageFlame = {
    getTargetingInfo(state: GameState, ability: NexusAbility<AbilityTarget>) {
        const targetingInfo = ability.definition.getTargetingInfo(state, ability);
        return {
            ...targetingInfo,
            hitRadius: (targetingInfo.hitRadius ?? 50) / 2,
        };
    },
    isTargetValid(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget) {
        return true;
    },
    getCooldown(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return ability.definition.getCooldown(state, ability) / 3;
    },
    onActivate(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget, power: number) {
        const targetingInfo = this.getTargetingInfo(state, ability);
        const damagePerSecond = Math.ceil(0.6 * power * getNexusAbilityPower(state, ability));
        const radius = (targetingInfo.hitRadius || 0);

        // FireGroundEffect automatically adds itself to the zone in the constructor.
        const fireGroundEffect = new FireGroundEffect({
            zone: target.zone,
            color: 'rgba(255, 0, 0, 0.1)',
            x: target.x,
            y: target.y,
            r: radius,
            maxRadius: radius,
            targetsEnemies: true,
            duration: [1000, 2000, 3000][ability.level - 1],
            damagePerSecond,
            source: state.nexus,
        });

        const targets = getTargetsInCircle(state, getEnemyTargets(state, state.camera.zone), fireGroundEffect);
        const damageAmount = damagePerSecond * 2;
        for (const target of targets) {
            damageTarget(state, target, {damage: damageAmount, source: state.nexus});
        }
    },
};


const arcticBlastFill = 'rgba(200, 200, 255, 0.5)';
export const arcticBlast: NexusAbilityDefinition<AbilityTarget> = {
    abilityType: 'activeNexusAbility',
    abilityKey: 'frost',
    name: 'Arctic Blast',
    renderIcon(context: CanvasRenderingContext2D, state: GameState, r: Rect) {
        fillCircle(context, {x: r.x + r.w / 2, y: r.y + r.h / 2, r: r.w / 3, color: '#AAF'});
    },
    getTargetingInfo(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return {
            canTargetEnemy: true,
            canTargetLocation: true,
            hitRadius: Math.floor([1, 1.5, 2][ability.level - 1] * 50),
            range: 0,
        };
    },
    getCooldown(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return [30000, 25000, 20000][ability.level - 1];
    },
    onActivate(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget) {
        const targetingInfo = this.getTargetingInfo(state, ability);

        // CircleEffect automatically adds itself to the zone in the constructor.
        const circleEffect = new CircleEffect({
            zone: target.zone,
            x: target.x,
            y: target.y,
            r: targetingInfo.hitRadius || 0,
            color: arcticBlastFill,
        });

        const targets = getTargetsInCircle(state, getEnemyTargets(state, state.camera.zone), circleEffect);
        const damageAmount = Math.floor(5 * getNexusAbilityPower(state, ability));
        for (const target of targets) {
            if (target.objectType === 'spawner') {
                continue;
            }
            damageTarget(state, target, {damage: damageAmount, source: state.nexus});
            // Short freeze effect.
            const freezeEffect = new ModifierEffect({
                duration: [2, 3, 4][ability.level - 1],
                modifiers: [{
                    stat: 'speed',
                    multiplier: 0,
                }],
                renderOver(context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) {
                    fillCircle(context, {x: target.x, y: target.y, r: target.r + 2, color: 'rgba(255, 255, 255, 0.6)'});
                },
            });
            applyEffectToTarget(state, freezeEffect, target);
            // Followed by a longer slow effect.
            const slowEffect = new ModifierEffect({
                duration: freezeEffect.duration + (3 + state.nexus.level) * (1.5 ** (ability.level - 1)),
                modifiers: [{
                    stat: 'speed',
                    percentBonus: [-60, -70, -80][ability.level - 1],
                }],
                renderOver(context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) {
                    fillCircle(context, {x: target.x, y: target.y, r: target.r + 2, color: 'rgba(255, 255, 255, 0.4)'});
                },
            });
            applyEffectToTarget(state, slowEffect, target);
        }

    },
};
// Mage version of "Arctic Blast", 10% cooldown, 20% damage, 20% duration, 50% area.
export const mageFrost = {
    getTargetingInfo(state: GameState, ability: NexusAbility<AbilityTarget>) {
        const targetingInfo = ability.definition.getTargetingInfo(state, ability);
        return {
            ...targetingInfo,
            hitRadius: (targetingInfo.hitRadius ?? 50) / 2,
        };
    },
    isTargetValid(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget) {
        return true;
    },
    getCooldown(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return ability.definition.getCooldown(state, ability) / 3;
    },
    onActivate(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget, power: number) {
        const targetingInfo = this.getTargetingInfo(state, ability);

        // CircleEffect automatically adds itself to the zone in the constructor.
        const circleEffect = new CircleEffect({
            zone: target.zone,
            x: target.x,
            y: target.y,
            r: targetingInfo.hitRadius || 0,
            color: arcticBlastFill,
        });

        const targets = getTargetsInCircle(state, getEnemyTargets(state, state.camera.zone), circleEffect);
        const damageAmount = Math.floor(power * getNexusAbilityPower(state, ability));
        for (const target of targets) {
            if (target.objectType === 'spawner') {
                continue;
            }
            damageTarget(state, target, {damage: damageAmount, source: state.nexus});
            // Short freeze effect.
            const freezeDuration = 0;//[0.5, 0.75, 1][ability.level - 1];
            /*const freezeEffect = new ModifierEffect({
                duration: freezeDuration,
                modifiers: [{
                    stat: 'speed',
                    multiplier: 0,
                }],
                renderOver(context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) {
                    fillCircle(context, {x: target.x, y: target.y, r: target.r + 2, color: 'rgba(255, 255, 255, 0.6)'});
                },
            });
            applyEffectToTarget(state, freezeEffect, target);*/
            const existingSlowEffect = target.effects.find(effect => effect.creator === 'frost');
            const duration = freezeDuration + 2 * (1.5 ** (ability.level - 1));
            if (existingSlowEffect) {
                existingSlowEffect.duration = Math.max(duration, existingSlowEffect.duration ?? 0);
            } else {
                // Followed by a longer slow effect.
                const slowEffect = new ModifierEffect({
                    duration,
                    modifiers: [{
                        stat: 'speed',
                        percentBonus: [-40, -50, -60][ability.level - 1],
                    }],
                    renderOver(context: CanvasRenderingContext2D, state: GameState, target: ModifiableTarget) {
                        fillCircle(context, {x: target.x, y: target.y, r: target.r + 2, color: 'rgba(255, 255, 255, 0.4)'});
                    },
                    creator: 'frost',
                });
                applyEffectToTarget(state, slowEffect, target);
            }
        }
    },
};


function renderGolem(context: CanvasRenderingContext2D, state: GameState, {x, y, r}: Circle) {
    fillCircle(context, {x, y, r, color: '#888'});
    fillCircle(context, {x, y: y - r / 2, r: r / 3, color: '#000'});
    fillCircle(context, {x: x + r * Math.sqrt(3) / 4, y: y + r / 4, r: r / 3, color: '#000'});
    fillCircle(context, {x: x - r * Math.sqrt(3) / 4, y: y + r / 4, r: r / 3, color: '#000'});
}


export const summonGolems: NexusAbilityDefinition<LocationTarget> = {
    abilityType: 'activeNexusAbility',
    abilityKey: 'summon',
    name: 'Summon Golems',
    renderIcon(context: CanvasRenderingContext2D, state: GameState, r: Rect) {
        renderGolem(context, state, {x: r.x + r.w / 2, y: r.y + r.h / 2, r: 0.45 * r.w});
    },
    getTargetingInfo(state: GameState, ability: NexusAbility<LocationTarget>) {
        return {
            canTargetLocation: true,
            canTargetEnemy: true,
            hitRadius: [30, 40, 50][ability.level - 1],
            range: 0,
        };
    },
    getCooldown(state: GameState, ability: NexusAbility<LocationTarget>) {
        return [30000, 25000, 20000][ability.level - 1];
    },
    onActivate(state: GameState, ability: NexusAbility<LocationTarget>, target: LocationTarget) {
        const targetingInfo = this.getTargetingInfo(state, ability);

        // Summoning new golems replaces any existing golems.
        for (const object of [...target.zone.objects]) {
            if (object.objectType === 'ally' && object.source === ability) {
                removeFieldObject(state, object);
            }
        }

        // CircleEffect automatically adds itself to the zone in the constructor.
        const circleEffect = new CircleEffect({
            zone: target.zone,
            x: target.x,
            y: target.y,
            r: targetingInfo.hitRadius || 0,
            color: arcticBlastFill,
        });

        const r = 8;
        const baseTheta = Math.atan2(target.y, target.x) + Math.PI / 2;
        const damage = Math.floor(2 * getNexusAbilityPower(state, ability));
        const maxHealth = Math.floor(8 * getNexusAbilityPower(state, ability));
        const armor = Math.floor(2 * getNexusAbilityPower(state, ability));
        const count = [2, 3, 5][ability.level - 1];
        for (let i = 0; i < count; i++) {
            const theta = baseTheta + 2 * Math.PI * i / count;
            new AllyObject(state, {
                zone: target.zone,
                x: count > 1 ? circleEffect.x + Math.cos(theta) * (circleEffect.r - r) : circleEffect.x,
                y: count > 1 ? circleEffect.y + Math.sin(theta) * (circleEffect.r - r) : circleEffect.y,
                attackRange: 10,
                damage,
                attacksPerSecond: 1,
                r,
                maxHealth,
                armor,
                aggroRadius: 80,
                movementSpeed: 20,
                renderAlly: renderGolem,
                source: ability,
                level: state.nexus.level,
            });
        }

    },
};
// Mage version of "Summon Golem", 10% cooldown, 25% health, 25% damage.
export const mageSummon = {
    getTargetingInfo(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return ability.definition.getTargetingInfo(state, ability);
    },
    isTargetValid(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget) {
        return true;
    },
    getCooldown(state: GameState, ability: NexusAbility<AbilityTarget>) {
        return ability.definition.getCooldown(state, ability) / 3;
    },
    onActivate(state: GameState, ability: NexusAbility<AbilityTarget>, target: AbilityTarget, power: number) {
        const targetingInfo = this.getTargetingInfo(state, ability);

        // Summoning new golems replaces any existing golems.
        for (const object of [...target.zone.objects]) {
            if (object.objectType === 'ally' && object.source === 'mageSummon') {
                removeFieldObject(state, object);
            }
        }

        // CircleEffect automatically adds itself to the zone in the constructor.
        const circleEffect = new CircleEffect({
            zone: target.zone,
            x: target.x,
            y: target.y,
            r: targetingInfo.hitRadius || 0,
            color: arcticBlastFill,
        });

        const r = 6;
        const totalPower = power * getNexusAbilityPower(state, ability);
        const baseTheta = Math.atan2(target.y, target.x) + Math.PI / 2;
        const damage = Math.floor(totalPower / 2);
        const maxHealth = Math.floor(2 * totalPower);
        const armor = Math.floor(totalPower);
        const count = [1, 2, 3][ability.level - 1];
        for (let i = 0; i < count; i++) {
            const theta =baseTheta + 2 * Math.PI * i / count;
            new AllyObject(state, {
                zone: target.zone,
                x: count > 1 ? circleEffect.x + Math.cos(theta) * (circleEffect.r - r) : circleEffect.x,
                y: count > 1 ? circleEffect.y + Math.sin(theta) * (circleEffect.r - r) : circleEffect.y,
                attackRange: 10,
                damage,
                attacksPerSecond: 1,
                r,
                maxHealth,
                armor,
                aggroRadius: 80,
                movementSpeed: 20,
                renderAlly: renderGolem,
                source: 'mageSummon',
                level: state.nexus.level,
            });
        }
    },
};
