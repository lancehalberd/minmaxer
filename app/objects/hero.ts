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


function createHero(heroType: HeroType, {x, y}: Point): Hero {
    const definition = heroDefinitions[heroType]!;
    const level = definition.startingLevel;
    const derivedStats = definition.getStatsForLevel(level);
    return {
        objectType: 'hero',
        definition,
        level,
        ...derivedStats,
        skills: {},
        x,
        y,
        r: definition.radius,
        color: definition.color,
        experience: 0,
        health: derivedStats.maxHealth,
        attacksPerSecond: createModifiableStat(definition.attacksPerSecond),
        incomingDamageMultiplier: createModifiableStat(1),
        getAttacksPerSecond: getHeroAttacksPerSecond,
        getDamageForTarget: getDamageForTarget,
        attackRange: definition.attackRange,
        enemyDefeatCount: 0,
        render: renderHero,
        update: updateHero,
        getChildren: getHeroFieldButtons,
        effects: [],
        onHit: onHitHero,
        abilities: definition.abilities.map(abilityDefinition => {
            if (abilityDefinition.abilityType === 'activeAbility') {
                return {
                    abilityType: 'activeAbility',
                    definition: abilityDefinition,
                    level: 0,
                    cooldown: 0,
                    autocast: true,
                }
            }
            return {
                abilityType: 'passiveAbility',
                definition: abilityDefinition,
                level: 0,
                cooldown: 0,
                autocast: true,
            }
        }),
        totalSkillPoints: 1,
        spentSkillPoints: 0,
    };
}

function getDamageForTarget(this: Hero, state: GameState, target: AbilityTarget): number {
    let damage = this.damage;
    for (const ability of this.abilities) {
        if (ability.level > 0 && ability.abilityType === 'passiveAbility') {
            if (ability.definition.modifyDamage) {
                damage = ability.definition.modifyDamage(state, this, target, ability, damage);
            }
        }
    }
    return damage;
}

export const warrior: Hero = createHero('warrior', {x: -60, y: 45});
export const ranger: Hero = createHero('ranger', {x: 60, y: 45});
export const wizard: Hero = createHero('wizard', {x: 0, y: -75});

function getHeroAttacksPerSecond(this: Hero, state: GameState): number {
    return getModifiableStatValue(this.attacksPerSecond);
}

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
    const pixelsPerFrame = hero.movementSpeed / framesPerSecond;
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
        if (getDistance(hero, object) < hero.r + object.r + targetingInfo.range) {
            ability.definition.onActivate(state, hero, ability, object);
            ability.cooldown = ability.definition.getCooldown(state, hero, ability);
            return;
        }
    }
}

function updateHero(this: Hero, state: GameState) {
    // Calculate Hero level increase
    const newHeroLevel = heroLevel(this.experience, this.level, heroLevelCap)
    if (newHeroLevel > this.level) {
        // Level up hero
        this.level = newHeroLevel;
        // Update hero stats based on level
        updateHeroStats(this);
        // Fully heal hero
        this.health = this.maxHealth;
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
        let closestDistance = this.attackRange;
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
        if (moveHeroTowardsTarget(state, this, this.attackTarget, this.r + this.attackTarget.r + this.attackRange)) {
            // Attack the target if the enemy's attack is not on cooldown.
            const attackCooldown = 1000 / this.getAttacksPerSecond(state);
            if (!this.lastAttackTime || this.lastAttackTime + attackCooldown <= state.world.time) {
                const damage = this.getDamageForTarget(state, this.attackTarget);
                damageTarget(state, this.attackTarget, damage, this);
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

function checkForOnHitTargetAbilities(state: GameState, hero: Hero, target: AttackTarget) {
    for (const ability of hero.abilities) {
        if (ability.level > 0 && ability.definition.abilityType === 'passiveAbility') {
            ability.definition.onHitTarget?.(state, hero, target, ability);
        }
    }
}

function renderHero(this: Hero, context: CanvasRenderingContext2D, state: GameState): void {
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
        const isInvincible = getModifiableStatValue(this.incomingDamageMultiplier) === 0;
        renderLifeBarOverCircle(context, this, this.health, this.maxHealth, isInvincible ? '#FF0' : undefined);
    }
    // Draw hero level
    fillText(context, {size: 10, color: '#FFF', text: this.level, x: this.x, y: this.y});
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

function updateHeroStats(hero: Hero) {
    const {maxHealth, damage, movementSpeed} = hero.definition.getStatsForLevel(hero.level);
    hero.maxHealth = maxHealth;
    hero.damage = damage;
    hero.movementSpeed = movementSpeed;
    hero.totalSkillPoints = Math.min(7, hero.level);
}

export function getReviveCost(state: GameState, hero: Hero): number {
    if (!hero.reviveCooldown) {
        return 0;
    }
    return Math.ceil(hero.reviveCooldown.remaining) * hero.level * 5;
}

export function reviveHero(state: GameState, hero: Hero) {
    hero.health = hero.maxHealth;
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
