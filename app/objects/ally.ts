import {frameLength} from 'app/gameConstants';
import {checkForOnHitTargetAbilities, removeEffectFromAlly} from 'app/utils/ability';
import {damageTarget, isAbilityTargetValid, isTargetAvailable} from 'app/utils/combat';
import {fillCircle, renderLifeBarOverCircle} from 'app/utils/draw';
import {getDistance} from 'app/utils/geometry';
import {moveAllyTowardsTarget} from 'app/utils/hero';
import {createModifiableStat, getModifiableStatValue} from 'app/utils/modifiableStat';

interface AllyObjectProps extends Partial<Ally> {
    zone: ZoneInstance
    x: number
    y: number
    attackRange: number
    attacksPerSecond: number
    maxHealth: number
    damage: number
    armor: number
    aggroRadius: number
    movementSpeed: number
    renderAlly?: (context: CanvasRenderingContext2D, state: GameState, ally: Ally) => void
    source?: any
}
export class AllyObject implements Ally {
    objectType = <const>'ally';
    level = this.props.level ?? 1;
    skills = {};
    totalSkillLevels = 0;
    x = this.props.x;
    y = this.props.y;
    r = this.props.r ?? 10;
    color = this.props.color ?? 'blue';
    maxHealth = this.props.maxHealth ?? 20;
    // This needs to be assigned in the constructor using the current game state.
    health: number;
    attackRange = this.props.attackRange ?? 10;
    attacksPerSecond = this.props.attacksPerSecond ?? 1;
    damage = this.props.damage ?? 1;
    armor = this.props.armor ?? 0;
    aggroRadius = this.props.aggroRadius ?? 100;
    movementSpeed = this.props.movementSpeed ?? 20;
    renderAlly = this.props.renderAlly;

    lastAttackTime?: number;
    movementTarget?: FieldTarget;
    selectedAttackTarget?: EnemyTarget;
    attackTarget?: EnemyTarget;
    selectedAbility?: ActiveAbility;
    abilityTarget?: AbilityTarget;
    reviveCooldown?: Cooldown;
    source = this.props.source;

    zone = this.props.zone;

    constructor(state: GameState, public props: AllyObjectProps) {
        this.zone.objects.push(this);
        this.health = this.getMaxHealth(state);
    }


    addStatModifiers(modifiers?: StatModifier[]) {
        if (!modifiers) {
            return;
        }
        // TODO: remove this once we correctly mark derived stats as dirty.
        // for example, updating primary stats should mark damage as dirty.
        // updating dex should mark armor Class and bonus hit chance as dirty, etc.
        this.markStatsDirty();
        for (const modifier of modifiers) {
            const stat = this.stats[modifier.stat];
            if (modifier.flatBonus) {
                stat.addedBonus += modifier.flatBonus;
                stat.isDirty = true;
            }
            if (modifier.percentBonus) {
                stat.percentBonus += modifier.percentBonus;
                stat.isDirty = true;
            }
            if (modifier.multiplier !== undefined && modifier.multiplier !== 1) {
                stat.multipliers.push(modifier.multiplier);
                stat.isDirty = true;
            }
        }
    }

    removeStatModifiers(modifiers?: StatModifier[]) {
        if (!modifiers) {
            return;
        }
        for (const modifier of modifiers) {
            const stat = this.stats[modifier.stat];
            if (modifier.flatBonus) {
                stat.addedBonus -= modifier.flatBonus;
                stat.isDirty = true;
            }
            if (modifier.percentBonus) {
                stat.percentBonus -= modifier.percentBonus;
                stat.isDirty = true;
            }
            if (modifier.multiplier !== undefined && modifier.multiplier !== 1) {
                const index = stat.multipliers.indexOf(modifier.multiplier);
                if (index >= 0) {
                    stat.multipliers.splice(index, 1);
                    stat.isDirty = true;
                } else {
                    console.error('Failed to remove multiplier', stat, modifier);
                }
            }
        }
    }

    getAttacksPerSecond(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.attacksPerSecond);
    }
    getAttackRange(state: GameState): number {
        return this.attackRange;
    }
    getDamageForTarget(state: GameState, target: AbilityTarget): number {
        let damage = this.getDamage(state);
        for (const ability of this.abilities) {
            if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
                if (ability.definition.modifyDamage) {
                    damage = ability.definition.modifyDamage(state, this, ability, target, damage);
                }
            }
        }
        return damage;
    }
    enemyDefeatCount = 0;
    effects: ObjectEffect<Hero|Ally>[] = [];
    onHit = onHitAlly;
    abilities = this.props.abilities ?? [];
    stats: ModifiableAllyStats = {
        dex: createModifiableStat<Ally>((state: GameState) => {
            return this.level;
        }),
        int: createModifiableStat<Ally>((state: GameState) => {
            return this.level;
        }),
        str: createModifiableStat<Ally>((state: GameState) => {
            return this.level;
        }),
        maxHealth: createModifiableStat<Ally>((state: GameState) => this.maxHealth + 2 * this.getStr(state)),
        movementSpeed: createModifiableStat<Ally>(this.movementSpeed),
        damage: createModifiableStat<Ally>((state: GameState) => this.damage),
        attacksPerSecond: createModifiableStat<Ally>(this.attacksPerSecond),
        extraHitChance: createModifiableStat<Ally>((state: GameState) => this.getDex(state) / 100),
        criticalChance: createModifiableStat<Ally>((state: GameState) => this.getInt(state) / 100),
        criticalMultiplier: createModifiableStat<Ally>((state: GameState) => 0.5),
        cooldownSpeed: createModifiableStat<Ally>((state: GameState) => this.getInt(state) / 100),
        armor: createModifiableStat<Ally>((state: GameState) => this.armor),
        maxDamageReduction: createModifiableStat<Ally>((state: GameState) => {
            const n = (4 * this.getArmor(state) + this.getDex(state)) / 100;
            return 0.6 + 0.4 * (1 - 1 / (1 + n));
        }),
        incomingDamageMultiplier: createModifiableStat<Ally>(1),
    };
    markStatsDirty() {
        for (const stat of Object.values(this.stats)) {
            stat.isDirty = true;
        }
    }
    getMaxHealth(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.maxHealth);
    }
    getMovementSpeed(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.movementSpeed);
    }
    getDamage(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.damage);
    }
    getDex(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.dex);
    }
    getStr(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.str);
    }
    getInt(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.int);
    }
    getArmor(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.armor);
    }
    getArmorClass(state: GameState): number {
        const dex = this.getDex(state);
        const armor = this.getArmor(state);
        if (armor > dex) {
            return armor + (dex / 2) | 0;
        }
        return dex + (armor / 2) | 0;
    }
    getExtraHitChance(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.extraHitChance);
    }
    getCriticalChance(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.criticalChance);
    }
    getCooldownSpeed(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.cooldownSpeed);
    }
    getCriticalMultipler(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.criticalMultiplier);
    }
    getMaxDamageReduction(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.maxDamageReduction);
    }
    getIncomingDamageMultiplier(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.incomingDamageMultiplier);
    }

    update(state: GameState) {
        // Prevent health from exceeding max health.
        const maxHealth = this.getMaxHealth(state);
        this.health = Math.min(this.health, maxHealth);
        // Update ability cooldown and autocast any abilities that make sense.
        for (const ability of this.abilities) {
            if (ability.level > 0 && ability.abilityType === 'activeAbility') {
                if (ability.cooldown > 0) {
                    ability.cooldown -= frameLength;
                } else if (ability.autocast) {
                    checkToAutocastAbility(state, this, ability);
                }
            }
            if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
                ability.definition.update?.(state, this, ability);
            }
        }

        // Update any effects being applied to this hero and remove them if their duration elapses.
        for (let i = 0; i < this.effects.length; i++) {
            const effect = this.effects[i];
            if (effect.duration) {
                effect.duration -= frameLength / 1000;
                if (effect.duration <= 0) {
                    removeEffectFromAlly(state, this.effects[i--], this);
                }
            }
        }

        // TODO: Handle moving to use an ability on a selected target.
        if (this.selectedAbility) {
            if (this.abilityTarget && !isTargetAvailable(state, this.abilityTarget)) {
                delete this.abilityTarget;
            }
            if (!this.abilityTarget) {
                delete this.selectedAbility;
            } else {
                const targetingInfo = this.selectedAbility.definition.getTargetingInfo(state, this, this.selectedAbility);
                if (moveAllyTowardsTarget(state, this, this.abilityTarget, this.r + (this.abilityTarget.r ?? 0) + targetingInfo.range)) {
                    const definition = this.selectedAbility.definition;
                    definition.onActivate(state, this, this.selectedAbility, this.abilityTarget);
                    this.selectedAbility.cooldown = definition.getCooldown(state, this, this.selectedAbility);
                    delete this.selectedAbility;
                    delete this.abilityTarget;
                }
                return;
            }
        }

        // Remove the selected attack target if it is becomes invalid (it dies, for example).
        if (this.selectedAttackTarget && !isTargetAvailable(state, this.selectedAttackTarget)) {
            delete this.selectedAttackTarget;
        }
        // Replace the current attack target with the selected attack taret(if any)
        // if it is becomes invalid (it dies, for example).
        if (this.attackTarget && (
            !isTargetAvailable(state, this.attackTarget)
            // Cancel targeting an enemy outside of attack range each frame so that we potentially can choose
            // a new closer target.
            || getDistance(this, this.attackTarget) - this.r - this.attackTarget.r > this.attackRange
        )) {
            this.attackTarget = this.selectedAttackTarget
        }
        // The hero will automatically attack an enemy within its range if it is idle.
        if (!this.attackTarget && !this.movementTarget) {
            // Choose the closest valid target within the aggro radius as an attack target.
            let closestDistance = Math.max(this.aggroRadius, this.getAttackRange(state));
            for (const object of this.zone.objects) {
                if (object.objectType === 'enemy') {
                    const distance = getDistance(this, object) - this.r - object.r;
                    if (distance < closestDistance) {
                        this.attackTarget = object;
                        closestDistance = distance;
                    }
                }
            }
        }
        if (this.attackTarget) {
            // Attack the target when it is in range.
            if (moveAllyTowardsTarget(state, this, this.attackTarget, this.r + this.attackTarget.r + this.getAttackRange(state))) {
                // Attack the target if the enemy's attack is not on cooldown.
                const attackCooldown = 1000 / this.getAttacksPerSecond(state);
                if (!this.lastAttackTime || this.lastAttackTime + attackCooldown <= this.zone.time) {
                    let hitCount = 1;
                    const strengthDamageBonus = 1 + this.getStr(state) / 100;
                    const extraHitChance = this.getExtraHitChance(state);
                    while (Math.random() < extraHitChance / hitCount) {
                        hitCount++;
                    }
                    for (let i = 0; i < hitCount; i++) {
                        let damage = this.getDamageForTarget(state, this.attackTarget);
                        damage *= strengthDamageBonus;
                        // TODO: Replace with this.rollCriticalMultiplier that supports multi crit.
                        const critChance = this.getCriticalChance(state);
                        const isCrit = Math.random() < critChance;
                        if (isCrit) {
                            damage *= (1 + this.getCriticalMultipler(state));
                        }
                        // floor damage value.
                        damage = damage | 0;
                        damageTarget(state, this.attackTarget, {damage, isCrit, source: this, delayDamageNumber: 200 * i});
                        checkForOnHitTargetAbilities(state, this, this.attackTarget);
                    }
                    this.attackTarget.onHit?.(state, this);
                    this.lastAttackTime = this.zone.time;
                    if (this.attackTarget.objectType === 'enemy') {
                        this.attackTarget.attackTarget = this;
                    }
                }

            }
            return;
        }
        if (this.movementTarget) {
            const distance = this.movementTarget.objectType === 'point' ? 0 : this.r + this.movementTarget.r;
            if (moveAllyTowardsTarget(state, this, this.movementTarget, distance)) {
                delete this.movementTarget;
            }
        }
    }

    render(context: CanvasRenderingContext2D, state: GameState): void {
        // Debug code to render a ring at the ally's attack range.
        //fillRing(context, {...this, r: this.r + this.getAttackRange(state) - 1, r2: this.r + this.getAttackRange(state), color: '#FFF'});
        for (const ability of this.abilities) {
            if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
                ability.definition.renderUnder?.(context, state, this, ability);
            }
        }

        if (this.renderAlly) {
            this.renderAlly(context, state, this);
        } else {
            // Draw a circle for the hero centered at their location, with their radius and color.
            fillCircle(context, this);
            // Render the black circle
            fillCircle(context, {...this, r: this.r - 2, color: 'black'});
        }

        const isInvincible = this.getIncomingDamageMultiplier(state) === 0;
        renderLifeBarOverCircle(context, this, this.health, this.getMaxHealth(state), isInvincible ? '#FF0' : undefined);
    }
}


function onHitAlly(this: Ally, state: GameState, attacker: Enemy) {
    this.lastTimeDamageTaken = this.zone.time;
    for (const ability of this.abilities) {
        if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
            ability.definition.onHit?.(state, this, ability, attacker);
        }
    }
    // Ally will ignore being attacked if they are completing a movement command.
    if (this.movementTarget) {
        return;
    }
    // Allyes will prioritize attacking an enemy over an enemy spawner or other targets.
    if (this.attackTarget?.objectType !== 'enemy') {
        this.attackTarget = attacker;
    }
}



// Automatically use ability if there is a target in range.
function checkToAutocastAbility(state: GameState, hero: Ally, ability: ActiveAbility) {
    const targetingInfo = ability.definition.getTargetingInfo(state, hero, ability);
    // prioritize the current attack target over other targets.
    // TODO: prioritize the closest target out of other targets.
    for (const object of [hero.attackTarget, ...hero.zone.objects]) {
        if (!object) {
            continue;
        }
        // Skip this object if the ability doesn't target this type of object.
        if (!isAbilityTargetValid(state, targetingInfo, object)) {
            continue;
        }
        // Use the ability on the target if it is in range.
        if (getDistance(hero, object) < hero.r + object.r + targetingInfo.range + (targetingInfo.hitRadius ?? 0)) {
            ability.definition.onActivate(state, hero, ability, object);
            ability.cooldown = ability.definition.getCooldown(state, hero, ability);
            return;
        }
    }
}
