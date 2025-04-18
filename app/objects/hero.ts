import {heroDefinitions} from 'app/definitions/heroDefinitions';
import {renderRangeCircle} from 'app/draw/renderIndicator';
import {frameLength, heroLevelCap} from 'app/gameConstants';
import {createPointerButtonForTarget} from 'app/ui/fieldButton';
import {drawFrameInCircle} from 'app/utils/animations';
import {removeEffectFromTarget, useHeroAbility} from 'app/utils/ability';
import {damageTarget, isTargetAvailable} from 'app/utils/combat';
import {computeValue} from 'app/utils/computed';
import {fillCircle, fillRect, fillRing, renderLifeBarOverCircle} from 'app/utils/draw';
import {checkToAutocastAbility, getClosestAttackTargetInRange, moveAllyTowardsTarget, onHitAlly, summonHero} from 'app/utils/hero';
import {applyHeroToJob} from 'app/utils/job';
import {createModifiableStat, getModifiableStatValue} from 'app/utils/modifiableStat';
import {followCameraTarget} from 'app/utils/world';

class HeroObject implements Hero {
    objectType = <const>'hero';
    definition = heroDefinitions[this.heroType]!;
    level = this.definition.startingLevel;
    skills = {};
    totalSkillLevels = 0;
    x = 0;
    y = 0;
    r = this.definition.radius;
    color = this.definition.color;
    experience = 0;
    health = 0;

    lastAttackTime?: number;
    lastTimeDamageTaken?: number;
    movementTarget?: FieldTarget;
    assignedJob?: Job;
    selectedAttackTarget?: EnemyTarget;
    attackTarget?: EnemyTarget;
    selectedAbility?: ActiveAbility;
    abilityTarget?: AbilityTarget;
    reviveCooldown?: Cooldown;

    equipment: HeroEquipment = {
        charms: [undefined]
    };
    zone: ZoneInstance | World
    movementWasBlocked = false;

    equipArmor(state: GameState, armor: Armor): boolean {
        if (this.equipment.armor) {
            return false;
        }
        this.equipment.armor = armor;
        this.stats.armor.isDirty = true;
        this.addStatModifiers(armor.armorStats.modifiers);
        return true;
    }

    unequipArmor(state: GameState): Armor|undefined {
        if (!this.equipment.armor) {
            return;
        }
        const armor = this.equipment.armor;
        this.stats.armor.isDirty = true;
        this.removeStatModifiers(armor.armorStats.modifiers);
        delete this.equipment.armor;
        return armor;
    }

    equipWeapon(state: GameState, weapon: Weapon): boolean {
        if (this.equipment.weapon) {
            return false;
        }
        this.equipment.weapon = weapon;
        this.stats.damage.isDirty = true;
        this.addStatModifiers(weapon.weaponStats.modifiers);
        return true;
    }

    unequipWeapon(state: GameState): Weapon|undefined {
        if (!this.equipment.weapon) {
            return;
        }
        const weapon = this.equipment.weapon;
        this.stats.damage.isDirty = true;
        this.removeStatModifiers(weapon.weaponStats.modifiers);
        delete this.equipment.weapon;
        return weapon;
    }

    equipCharm(state: GameState, charm: Charm, index: number): boolean {
        if (index >= this.equipment.charms.length || this.equipment.charms[index]) {
            return false;
        }
        this.equipment.charms[index] = charm;
        this.addStatModifiers(charm.charmStats.modifiers);
        return true;
    }

    unequipCharm(state: GameState, index: number): Charm|undefined {
        const charm = this.equipment.charms[index];
        if (index >= this.equipment.charms.length || !charm) {
            return;
        }
        this.removeStatModifiers(charm.charmStats.modifiers);
        delete this.equipment.charms[index];
        return charm;
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
        this.markStatsDirty();
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
        return Math.max(0, getModifiableStatValue(state, this, this.stats.attacksPerSecond) * getModifiableStatValue(state, this, this.stats.speed));
    }
    getAttackRange(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.attackRange);
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
    getChildren = getHeroFieldButtons;
    effects: ObjectEffect[] = [];
    onHit(state: GameState, attacker: Enemy) {
        onHitAlly(state, this, attacker);
    }
    autocastCooldown = 0;
    abilities: Ability[] = this.definition.abilities.map(abilityDefinition => {
        if (abilityDefinition.abilityType === 'activeAbility') {
            return {
                abilityType: <const>'activeAbility',
                definition: abilityDefinition,
                level: 0,
                cooldown: 0,
                charges: 0,
                autocast: true,
            }
        }
        return {
            abilityType: <const>'passiveAbility',
            definition: abilityDefinition,
            level: 0,
            cooldown: 0,
            autocast: true,
        }
    });
    totalSkillPoints = 1;
    spentSkillPoints = 0;
    stats: ModifiableHeroStats = {
        dex: createModifiableStat<Hero>((state: GameState) => {
            return (this.definition.coreState === 'dex') ? (2 * this.level) : this.level;
        }),
        int: createModifiableStat<Hero>((state: GameState) => {
            return (this.definition.coreState === 'int') ? (2 * this.level) : this.level;
        }),
        str: createModifiableStat<Hero>((state: GameState) => {
            return (this.definition.coreState === 'str') ? (2 * this.level) : this.level;
        }),
        maxHealth: createModifiableStat<Hero>((state: GameState) => 15 + this.level * 5 + 2 * this.getStr(state)),
        regenPerSecond: createModifiableStat<Hero>((state: GameState) => 0),
        movementSpeed: createModifiableStat<Hero>((state: GameState) => this.level * 2.5 + 97.5),
        damage: createModifiableStat<Hero>((state: GameState) => {
            const weaponDamage = this.equipment.weapon?.weaponStats.damage ?? 0;
            return weaponDamage + this.getPrimaryStat(state);
        }),
        attacksPerSecond: createModifiableStat<Hero>(this.definition.attacksPerSecond),
        attackRange: createModifiableStat<Hero>(this.definition.attackRange),
        extraHitChance: createModifiableStat<Hero>((state: GameState) => this.getDex(state) / 100),
        criticalChance: createModifiableStat<Hero>((state: GameState) => this.getInt(state) / 100),
        criticalMultiplier: createModifiableStat<Hero>((state: GameState) => 0.5),
        cooldownSpeed: createModifiableStat<Hero>((state: GameState) => 1 + this.getInt(state) / 100),
        armor: createModifiableStat<Hero>((state: GameState) => this.equipment.armor?.armorStats.armor ?? 0),
        maxDamageReduction: createModifiableStat<Hero>((state: GameState) => {
            const n = (4 * this.getArmor(state) + this.getDex(state)) / 100;
            return 0.6 + 0.4 * (1 - 1 / (1 + n));
        }),
        incomingDamageMultiplier: createModifiableStat<Hero>(1),
        speed: createModifiableStat<Hero>(1, {minValue: 0}),
    };
    // derivedStats = this.definition.getStatsForLevel(this.level);
    constructor(public heroType: HeroType, {zone, x, y}: ZoneLocation) {
        this.zone = zone;
        this.x = x;
        this.y = y;
    }
    markStatsDirty() {
        for (const stat of Object.values(this.stats)) {
            stat.isDirty = true;
        }
    }
    getMaxHealth(state: GameState): number {
        return Math.floor(getModifiableStatValue(state, this, this.stats.maxHealth));
    }
    getMovementSpeed(state: GameState): number {
        return Math.max(0, getModifiableStatValue(state, this, this.stats.movementSpeed) * getModifiableStatValue(state, this, this.stats.speed));
    }
    getDamage(state: GameState): number {
        return Math.floor(getModifiableStatValue(state, this, this.stats.damage));
    }
    getDex(state: GameState): number {
        return Math.floor(getModifiableStatValue(state, this, this.stats.dex));
    }
    getStr(state: GameState): number {
        return Math.floor(getModifiableStatValue(state, this, this.stats.str));
    }
    getInt(state: GameState): number {
        return Math.floor(getModifiableStatValue(state, this, this.stats.int));
    }
    getPrimaryStat(state: GameState) {
        if (this.definition.coreState === 'dex') {
            return this.getDex(state);
        } else if (this.definition.coreState === 'str') {
            return this.getStr(state);
        } else {
            return this.getInt(state);
        }
    }
    getArmor(state: GameState): number {
        return Math.floor(getModifiableStatValue(state, this, this.stats.armor));
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
        return Math.max(0, getModifiableStatValue(state, this, this.stats.cooldownSpeed) * getModifiableStatValue(state, this, this.stats.speed));
    }
    getMaxAbilityCharges(state: GameState): number {
        // Generating charge N takes N*baseCooldown seconds.
        // Max charges is set so that the highest charge takes at most 2 * baseCooldown seconds
        // after the hero's cooldown speed is applied.
        return Math.floor(2 * getModifiableStatValue(state, this, this.stats.cooldownSpeed));
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
    getRegenPerSecond(state: GameState): number {
        return getModifiableStatValue(state, this, this.stats.regenPerSecond);
    }

    update(state: GameState) {
        // Prevent health from exceeding max health.
        const maxHealth = this.getMaxHealth(state);
        this.health = Math.min(
            // Health regen won't take health over maxHealth.
            Math.min(this.health + this.getRegenPerSecond(state) * frameLength / 1000, maxHealth),
            // Health is allowed to be up to 2*maxHealth from certain sources like healing wind.
            2 * maxHealth
        );
        // Calculate Hero level increase
        const newHeroLevel = heroLevel(this.experience, this.level, heroLevelCap)
        if (newHeroLevel > this.level) {
            if (newHeroLevel >= 15 && this.equipment.charms.length < 2) {
                this.equipment.charms.push(undefined);
            }
            if (newHeroLevel >= 45 && this.equipment.charms.length < 3) {
                this.equipment.charms.push(undefined);
            }
            // Level up hero
            this.level = newHeroLevel;
            // Update hero stats based on level
            this.markStatsDirty();
            // Fully heal hero
            this.health = this.getMaxHealth(state);
        }
        this.totalSkillPoints = Math.min(state.maxHeroSkillPoints, this.level);
        // Prevent autocasting skills too frequently. This also serves as cap for
        // how often abilities can be cast when cooldown speed gets very high.
        if (this.autocastCooldown > 0) {
            this.autocastCooldown -= frameLength;
        }

        // Update ability cooldown and autocast any abilities that make sense.
        const cooldownDelta = frameLength * this.getCooldownSpeed(state);
        const maxCharges = this.getMaxAbilityCharges(state);
        for (const ability of this.abilities) {
            if (ability.level > 0 && ability.abilityType === 'activeAbility') {
                if (ability.charges < maxCharges) {
                    ability.cooldown -= cooldownDelta;
                    if (ability.cooldown <= 0) {
                        ability.charges++;
                        ability.cooldown += ability.definition.getCooldown(state, this, ability) * (ability.charges + 1);
                    }
                }
                if (this.autocastCooldown <= 0 && ability.charges > 0 ) {
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
                    removeEffectFromTarget(state, this.effects[i--], this);
                }
            }
        }

        if (this.selectedAbility) {
            if (this.abilityTarget && !isTargetAvailable(state, this.abilityTarget)) {
                delete this.abilityTarget;
            }
            if (!this.abilityTarget) {
                delete this.selectedAbility;
            } else {
                const targetingInfo = this.selectedAbility.definition.getTargetingInfo(state, this, this.selectedAbility);
                if (moveAllyTowardsTarget(state, this, this.abilityTarget, this.r + (this.abilityTarget.r ?? 0) + targetingInfo.range)) {
                    useHeroAbility(state, this, this.selectedAbility, this.abilityTarget);
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
        if (this.attackTarget && !isTargetAvailable(state, this.attackTarget)) {
            this.attackTarget = this.selectedAttackTarget
        }
        const attackRange = this.getAttackRange(state);
        const priorityTarget = this.attackTarget || this.movementTarget;
        // The hero will automatically attack an enemy within its range if it is idle.
        if (!this.attackTarget && !this.movementTarget) {
            this.attackTarget = getClosestAttackTargetInRange(state, this, attackRange);
        }
        let targetToAttack: EnemyTarget|undefined;
        if (this.attackTarget) {
            // Attack the target when it is in range.
            if (moveAllyTowardsTarget(state, this, this.attackTarget, this.r + this.attackTarget.r + attackRange)) {
                targetToAttack = this.attackTarget;
            }
        }
        // The hero will attack a random nearby target in two circumstances:
        // 1) They are not currently moving/attacking anything
        // 2) Their movement was blocked and their primary target is not in range.
        if (!targetToAttack && (!priorityTarget || this.movementWasBlocked)) {
            // If no other attack target is in range, just try attacking the nearest target.
            targetToAttack = getClosestAttackTargetInRange(state, this, attackRange);
        }
        if (targetToAttack) {
            // Attack the target if the enemy's attack is not on cooldown.
            // Note that this could be `Infinity` so don't use this in any assignments.
            const attackCooldown = 1000 / this.getAttacksPerSecond(state);
            if (!this.lastAttackTime || this.lastAttackTime + attackCooldown <= this.zone.time) {
                let hitCount = 1;
                const strengthDamageBonus = 1 + this.getStr(state) / 100;
                const extraHitChance = this.getExtraHitChance(state);
                while (Math.random() < extraHitChance / hitCount) {
                    hitCount++;
                }
                for (let i = 0; i < hitCount; i++) {
                    let damage = this.getDamageForTarget(state, targetToAttack);
                    damage *= strengthDamageBonus;
                    // TODO: Replace with this.rollCriticalMultiplier that supports multi crit.
                    const critChance = this.getCriticalChance(state);
                    const isCrit = Math.random() < critChance;
                    if (isCrit) {
                        damage *= (1 + this.getCriticalMultipler(state));
                    }
                    // floor damage value.
                    damage = damage | 0;
                    damageTarget(state, targetToAttack, {damage, isCrit, source: this, delayDamageNumber: 200 * i});
                    checkForOnHitTargetAbilities(state, this, targetToAttack);
                }
                targetToAttack.onHit?.(state, this);
                this.lastAttackTime = this.zone.time;
                if (targetToAttack.objectType === 'enemy') {
                    targetToAttack.attackTarget = this;
                }
            }
        }
        if (this.assignedJob) {
            this.movementTarget = this.assignedJob.getHeroTarget?.(state);
            // If there is not target associated with the job, the hero should attempt to start the job
            // immediately.
            if (!this.movementTarget) {
                applyHeroToJob(state, this.assignedJob.definition, this);
            }
        }
        if (this.movementTarget) {
            const distance = this.movementTarget.objectType === 'point' ? 0 : this.r + this.movementTarget.r;
            if (moveAllyTowardsTarget(state, this, this.movementTarget, distance)) {
                if (this.movementTarget.objectType === 'structure' || this.movementTarget.objectType === 'nexus') {
                    this.movementTarget.onHeroInteraction?.(state, this);
                } else {
                    delete this.movementTarget;
                }
            }
        }
    }

    render(context: CanvasRenderingContext2D, state: GameState): void {
        // Draw a small dot indicating where the hero is currently moving towards.
        if (this.movementTarget) {
            fillCircle(context, {
                ...this.movementTarget,
                r: 2,
                color: 'blue',
            });
        }
        // Debug code to render a ring at the hero's attack range.
        //fillRing(context, {...this, r: this.r + this.getAttackRange(state) - 1, r2: this.r + this.getAttackRange(state), color: '#FFF'});
        if (this.attackTarget) {
            fillRing(context, {...this.attackTarget, r: this.attackTarget.r + 2, r2: this.attackTarget.r - 2, color: '#FFF'});
        }

        for (const ability of this.abilities) {
            if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
                ability.definition.renderUnder?.(context, state, this, ability);
            }
        }
        for (const effect of this.effects) {
            effect.renderUnder?.(context, state, this);
        }

        // Draw a circle for the hero centered at their location, with their radius and color.
        fillCircle(context, this);

        // Render a pie chart that fills in as the player approaches their next level.
        // This just looks like a light ring over their color since the middle is covered up by the black circle.
        const totalExperienceForCurrentLevel = totalExperienceForLevel(this.level);
        const totalExperienceForNextLevel = totalExperienceForLevel(this.level + 1);
        const xpProgressForNextLevel = this.experience - totalExperienceForCurrentLevel;
        const xpRequiredForNextLevel = totalExperienceForNextLevel - totalExperienceForCurrentLevel;
        const p = xpProgressForNextLevel / xpRequiredForNextLevel;
        context.save();
            context.globalAlpha *= 0.6;
            context.fillStyle = '#FFF';
            const r = this.r;
            const endTheta = p * 2 * Math.PI - Math.PI / 2;
            context.beginPath();
            context.moveTo(this.x, this.y);
            context.arc(this.x, this.y, r, -Math.PI / 2, endTheta);
            context.fill();
        context.restore();

        // Render the black circle
        fillCircle(context, {...this, r: this.r - 2, color: 'black'});
        // Draw hero level
        //fillText(context, {size: 10, color: '#FFF', text: this.level, x: this.x, y: this.y});
        // Draw hero icon
        drawFrameInCircle(context, {...this, r: r - 2}, this.definition.icon);


        for (const ability of this.abilities) {
            if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
                ability.definition.renderOver?.(context, state, this, ability);
            }
        }
        for (const effect of this.effects) {
            effect.renderOver?.(context, state, this);
        }

        const isInvincible = this.getIncomingDamageMultiplier(state) === 0;
        renderLifeBarOverCircle(context, this, this.health, this.getMaxHealth(state), isInvincible ? '#FF0' : undefined);
        if (this.assignedJob) {
            const job = this.assignedJob;
            const totalSeconds = computeValue(state, job.definition, job.definition.workerSeconds, 0);
            // If the job doesn't have a completiong time, just render the bar filling up so we can still see the
            // hero is assigned a job.
            const p = totalSeconds ? job.workerSecondsCompleted / totalSeconds : (this.zone.time % 1000) / 1000;
            const r = {x: this.x - this.r, y: this.y - this.r - 5, w: Math.floor(2 * this.r * p), h: 2};
            fillRect(context, r, '#0AF');
            fillRect(context, {...r, x: r.x + r.w - 1, w: 1}, '#8FF');
        }
        renderRangeCircle(context, {x: this.x, y: this.y, r: this.r + this.getAttackRange(state), color: 'rgba(255, 255, 255, 0.4)'});
    }
}

export function addBasicHeroes(state: GameState) {
    const warrior: Hero = new HeroObject('warrior', {zone: state.world, x: -100, y: 75});
    const ranger: Hero = new HeroObject('ranger', {zone: state.world, x: 100, y: 75});
    const wizard: Hero = new HeroObject('wizard', {zone: state.world, x: 0, y: -125});
    state.availableHeroes.push(warrior);
    state.availableHeroes.push(ranger);
    state.availableHeroes.push(wizard);
}


function getHeroFieldButtons(this: Hero, state: GameState): UIButton[] {
    const buttons: UIButton[] = [];
    const firstEmptyIndex = state.heroSlots.indexOf(undefined);
    // If we can choose this hero as a champion, add a button for selecting them.
    if (firstEmptyIndex >= 0 && !state.heroSlots.includes(this)) {
        const button = createPointerButtonForTarget(this);
        button.y += 2 * this.r;
        button.disabled = state.nexus.essence <= this.definition.cost;
        button.onPress = (state: GameState) => {
            summonHero(state, this);
            return true;
        }
        button.onHover = (state: GameState) => {
            state.nexus.previewEssenceChange = -this.definition.cost;
            return true;
        }
        buttons.push(button);
    }
    return buttons;
}


function checkForOnHitTargetAbilities(state: GameState, hero: Hero, target: AttackTarget) {
    for (const ability of hero.abilities) {
        if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
            ability.definition.onHitTarget?.(state, hero, ability, target);
        }
    }
}

function totalExperienceForLevel(level: number) {
    return 10 * (level - 1) * level * (2 * (level - 1) + 1) / 6;
}

function heroLevel(exp: number, currentLevel: number, levelCap: number): number {
    let level = currentLevel;
    // Find level using 10x sum of first n squares = 10*n*(n+1)*(2n+1)/6
    while (level < levelCap && exp >= totalExperienceForLevel(level + 1)) {
        level++;
    }
    return level;
}

export function getReviveCost(state: GameState, hero: Hero): number {
    if (!hero.reviveCooldown) {
        return 0;
    }
    return Math.ceil(hero.reviveCooldown.remaining) * (3 + 2 * hero.level);
}

export function reviveHero(state: GameState, hero: Hero) {
    hero.health = hero.getMaxHealth(state);
    hero.zone = state.nexus.zone;
    hero.x = state.nexus.x;
    hero.y = state.nexus.y;
    delete hero.reviveCooldown;
    delete hero.attackTarget;
    delete hero.abilityTarget;
    delete hero.selectedAttackTarget;
    delete hero.selectedAbility;
    delete hero.movementTarget;
    for (let i = 0; i < hero.effects.length; i++) {
        const effect = hero.effects[i];
        hero.effects.splice(i--, 1);
        effect.remove(state, hero);
    }
    if (!state.selectedHero || (state.selectedHero === hero && state.camera.zone !== hero.zone)) {
        state.selectedHero = hero;
        followCameraTarget(state, hero);
    }
    state.world.objects.push(hero);
}
