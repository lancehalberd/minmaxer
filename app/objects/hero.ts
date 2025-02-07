import {frameLength, framesPerSecond, heroLevelCap, levelBuffer} from 'app/gameConstants';
import {createLoot, pickupLoot} from 'app/objects/loot';
import {createPointerButtonForTarget} from 'app/ui/fieldButton';
import {gainEssence} from 'app/utils/essence';
import {damageTarget, isAbilityTargetValid, isTargetAvailable} from 'app/utils/combat';
import {getDistance} from 'app/utils/geometry';
import {fillCircle, fillRing, fillText, renderLifeBarOverCircle} from 'app/utils/draw';
import {summonHero} from 'app/utils/hero';
import {applyHeroToJob} from 'app/utils/job';
import {getModifiableStatValue} from 'app/utils/modifiableStat';
import {heroDefinitions} from 'app/definitions/heroDefinitions';
import {createModifiableStat} from 'app/utils/modifiableStat';


class HeroObject implements Hero {
    objectType = <const>'hero';
    definition = heroDefinitions[this.heroType]!;
    level = this.definition.startingLevel;
    skills = {};
    x = 0;
    y = 0;
    r = this.definition.radius;
    color = this.definition.color;
    experience = 0;
    health = 0;

    lastAttackTime?: number;
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
        return this.definition.attackRange;
    }
    getDamageForTarget(state: GameState, target: AbilityTarget): number {
        let damage = this.getDamage(state);
        for (const ability of this.abilities) {
            if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
                if (ability.definition.modifyDamage) {
                    damage = ability.definition.modifyDamage(state, this, target, ability, damage);
                }
            }
        }
        return damage;
    }
    enemyDefeatCount = 0;
    getChildren = getHeroFieldButtons;
    effects: ObjectEffect<Hero>[] = [];
    onHit = onHitHero;
    abilities = this.definition.abilities.map(abilityDefinition => {
        if (abilityDefinition.abilityType === 'activeAbility') {
            return {
                abilityType: <const>'activeAbility',
                definition: abilityDefinition,
                level: 0,
                cooldown: 0,
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
        maxHealth: createModifiableStat<Hero>((state: GameState) => 5 + this.level * 5 + 2 * this.getStr(state)),
        movementSpeed: createModifiableStat<Hero>((state: GameState) => this.level * 2.5 + 97.5),
        damage: createModifiableStat<Hero>((state: GameState) => {
            const weaponDamage = this.equipment.weapon?.weaponStats.damage ?? 0;
            return weaponDamage + this.getPrimaryStat(state);
        }),
        attacksPerSecond: createModifiableStat<Hero>(this.definition.attacksPerSecond),
        extraHitChance: createModifiableStat<Hero>((state: GameState) => this.getDex(state) / 100),
        criticalChance: createModifiableStat<Hero>((state: GameState) => this.getInt(state) / 100),
        criticalMultiplier: createModifiableStat<Hero>((state: GameState) => 0.5),
        cooldownSpeed: createModifiableStat<Hero>((state: GameState) => this.getInt(state) / 100),
        armor: createModifiableStat<Hero>((state: GameState) => this.equipment.armor?.armorStats.armor ?? 0),
        maxDamageReduction: createModifiableStat<Hero>((state: GameState) => {
            const n = (4 * this.getArmor(state) + this.getDex(state)) / 100;
            return 0.6 + 0.4 * (1 - 1 / (1 + n));
        }),
        incomingDamageMultiplier: createModifiableStat<Hero>(1),
    };
    // derivedStats = this.definition.getStatsForLevel(this.level);
    constructor(public heroType: HeroType, {x, y}: Point) {
        this.x = x;
        this.y = y;
    }
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
        // Calculate Hero level increase
        const newHeroLevel = heroLevel(this.experience, this.level, heroLevelCap)
        if (newHeroLevel > this.level) {
            // Level up hero
            this.level = newHeroLevel;
            // Update hero stats based on level
            this.markStatsDirty();
            // Fully heal hero
            this.health = this.getMaxHealth(state);
            this.totalSkillPoints = Math.min(7, this.level);
        }

        // Update ability cooldown and autocast any abilities that make sense.
        for (const ability of this.abilities) {
            if (ability.abilityType === 'activeAbility') {
                if (ability.cooldown > 0) {
                    ability.cooldown -= frameLength;
                } else if (ability.autocast) {
                    checkToAutocastAbility(state, this, ability);
                }
            }
        }

        // Update any effects being applied to this hero and remove them if their duration elapses.
        for (let i = 0; i < this.effects.length; i++) {
            const effect = this.effects[i];
            if (effect.duration) {
                effect.duration -= frameLength / 1000;
                if (effect.duration <= 0) {
                    this.effects.splice(i--, 1);
                    effect.remove(state, this);
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
                if (moveHeroTowardsTarget(state, this, this.abilityTarget, this.r + this.abilityTarget.r + targetingInfo.range)) {
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
        if (this.attackTarget && !isTargetAvailable(state, this.attackTarget)) {
            this.attackTarget = this.selectedAttackTarget
        }
        // The hero will automatically attack an enemy within its range if it is idle.
        if (!this.attackTarget && !this.movementTarget) {
            // Choose the closest valid target within the aggro radius as an attack target.
            let closestDistance = this.getAttackRange(state);
            for (const object of state.world.objects) {
                if (object.objectType === 'enemy') {
                    const distance = getDistance(this, object);
                    if (distance < closestDistance) {
                        this.attackTarget = object;
                        closestDistance = distance;
                    }
                }
            }
        }
        if (this.attackTarget) {
            // Attack the target when it is in range.
            if (moveHeroTowardsTarget(state, this, this.attackTarget, this.r + this.attackTarget.r + this.getAttackRange(state))) {
                // Attack the target if the enemy's attack is not on cooldown.
                const attackCooldown = 1000 / this.getAttacksPerSecond(state);
                if (!this.lastAttackTime || this.lastAttackTime + attackCooldown <= state.world.time) {
                    let damage = this.getDamageForTarget(state, this.attackTarget);
                    // TODO: Support multiple hits here.
                    // TODO: Replace with this.rollCriticalMultiplier that supports multi crit.
                    const critChance = this.getCriticalChance(state);
                    const isCrit = Math.random() < critChance;
                    if (isCrit) {
                        damage = (damage * (1 + this.getCriticalMultipler(state))) | 0;
                    }
                    damageTarget(state, this.attackTarget, {damage, isCrit, source: this});
                    this.attackTarget.onHit?.(state, this);
                    this.lastAttackTime = state.world.time;
                    if (this.attackTarget.objectType === 'enemy') {
                        this.attackTarget.attackTarget = this;
                    }
                    checkForOnHitTargetAbilities(state, this, this.attackTarget);
                }

                // Remove the attack target when it is dead.
                // Update hero experience.
                if (this.attackTarget.health <= 0) {
                    const levelDisparity = this.level - (this.attackTarget.level + levelBuffer);
                    const experiencePenalty = 1 - 0.1 * Math.max(levelDisparity, 0);
                    this.experience += Math.max(this.attackTarget.experienceWorth * experiencePenalty, 0);
                    this.enemyDefeatCount += 1;
                    gainEssence(state, this.attackTarget.essenceWorth);
                    // Loot creation
                    if (Math.random() < 0.1) {
                        const lootType = Math.random() < 0.9 ? 'potion' : 'invincibilityPotion';
                        // Auto-pickup loot
                        pickupLoot(state, this, createLoot(lootType, this.attackTarget));
                    }
                }
            }
            return;
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
            if (moveHeroTowardsTarget(state, this, this.movementTarget, this.r + this.movementTarget.r)) {
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
        if (this.attackTarget) {
            fillRing(context, {...this.attackTarget, r: this.attackTarget.r + 2, r2: this.attackTarget.r - 2, color: '#FFF'});
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

        if (state.heroSlots.includes(this)) {
            const isInvincible = this.getIncomingDamageMultiplier(state) === 0;
            renderLifeBarOverCircle(context, this, this.health, this.getMaxHealth(state), isInvincible ? '#FF0' : undefined);
        }
        // Draw hero level
        fillText(context, {size: 10, color: '#FFF', text: this.level, x: this.x, y: this.y});
    }
}


export const warrior: Hero = new HeroObject('warrior', {x: -60, y: 45});
export const ranger: Hero = new HeroObject('ranger', {x: 60, y: 45});
export const wizard: Hero = new HeroObject('wizard', {x: 0, y: -75});

function onHitHero(this: Hero, state: GameState, attacker: Enemy) {
    // Hero will ignore being attacked if they are completing a movement command.
    if (this.movementTarget) {
        return;
    }
    // Heroes will prioritize attacking an enemy over an enemy spawner or other targets.
    if (this.attackTarget?.objectType !== 'enemy') {
        this.attackTarget = attacker;
    }
}

function getHeroFieldButtons(this: Hero, state: GameState): UIButton[] {
    const buttons: UIButton[] = [];
    const firstEmptyIndex = state.heroSlots.indexOf(null);
    // If we can choose this hero as a champion, add a button for selecting them.
    if (firstEmptyIndex >= 0 && !state.heroSlots.includes(this)) {
        const button = createPointerButtonForTarget(this);
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

function moveHeroTowardsTarget(state: GameState, hero: Hero, target: AbilityTarget, distance = 0): boolean {
    const pixelsPerFrame = hero.getMovementSpeed(state) / framesPerSecond;
    // Move this until it reaches the target.
    const dx = target.x - hero.x, dy = target.y - hero.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    // Attack the target when it is in range.
    if (mag <= distance) {
        return true;
    }
    if (mag < pixelsPerFrame) {
        hero.x = target.x;
        hero.y = target.y;
    } else {
        hero.x += pixelsPerFrame * dx / mag;
        hero.y += pixelsPerFrame * dy / mag;
    }
    return false;
}

// Automatically use ability if there is a target in range.
function checkToAutocastAbility(state: GameState, hero: Hero, ability: ActiveAbility) {
    const targetingInfo = ability.definition.getTargetingInfo(state, hero, ability);
    for (const object of state.world.objects) {
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

function checkForOnHitTargetAbilities(state: GameState, hero: Hero, target: AttackTarget) {
    for (const ability of hero.abilities) {
        if (ability.level > 0 && ability.definition.abilityType === 'passiveAbility') {
            ability.definition.onHitTarget?.(state, hero, target, ability);
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
    return Math.ceil(hero.reviveCooldown.remaining) * hero.level * 5;
}

export function reviveHero(state: GameState, hero: Hero) {
    hero.health = hero.getMaxHealth(state);
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
    if (!state.selectedHero) {
        state.selectedHero = hero;
    }
    state.world.objects.push(hero);
}
