import {frameLength, framesPerSecond, heroLevelCap, levelBuffer} from 'app/gameConstants';
import {createPointerButtonForTarget} from 'app/objects/fieldButton';
import {createLoot, pickupLoot} from 'app/objects/loot';
import {gainEssence, loseEssence} from 'app/objects/nexus';
import {damageTarget, isTargetAvailable} from 'app/utils/combat';
import {getDistance} from 'app/utils/geometry';
import {fillCircle, renderLifeBar} from 'app/utils/draw';
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
        getFieldButtons: getHeroFieldButtons,
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

export const warrior: Hero = createHero('warrior', {x: -40, y: 30});
export const ranger: Hero = createHero('ranger', {x: 40, y: 30});
export const wizard: Hero = createHero('wizard', {x: 0, y: -50});

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

function getHeroFieldButtons(this: Hero, state: GameState): CanvasButton[] {
    const buttons: CanvasButton[] = [];
    const firstEmptyIndex = state.heroSlots.indexOf(null);
    // If we can choose this hero as a champion, add a button for selecting them.
    if (firstEmptyIndex >= 0 && !state.heroSlots.includes(this)) {
        const button = createPointerButtonForTarget(this);
        button.disabled = state.nexus.essence <= this.definition.cost;
        button.onPress = (state: GameState) => {
            if (state.nexus.essence <= this.definition.cost) {
                return true;
            }
            loseEssence(state, this.definition.cost);
            state.heroSlots[firstEmptyIndex] = this;
            // Unpause the game automatically if this is the first hero selected.
            if (!state.selectedHero) {
                state.isPaused = false;
            }
            state.selectedHero = this;
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
                // TODO: Automatically use ability if there is a target in range.
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
                damageTarget(state, this.attackTarget, damage);
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
                // Possibly add a drop from the defeated enemy.
                if (Math.random() < 0.1) {
                    const lootType = Math.random() < 0.9 ? 'potion' : 'invincibilityPotion';
                    state.world.objects.push(createLoot(lootType, this.attackTarget));
                }
            }
        }
        return;
    }
    if (this.movementTarget) {
        if (moveHeroTowardsTarget(state, this, this.movementTarget, 0)) {
            if (this.movementTarget.objectType === 'loot') {
                pickupLoot(state, this, this.movementTarget);
            }
            delete this.movementTarget;
        }
    } else {
        // hero.target = {
        //     x: hero.r + Math.floor(Math.random() * (canvas.width - 2 * hero.r)),
        //     y: hero.r + Math.floor(Math.random() * (canvas.height - 2 * hero.r)),
        // };
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
        renderLifeBar(context, this, this.health, this.maxHealth, isInvincible ? '#FF0' : undefined);
    }
    // Draw hero level
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = '#FFF';
    context.font = '10px sans-serif';
    context.fillText(`${this.level}`, this.x, this.y);
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
