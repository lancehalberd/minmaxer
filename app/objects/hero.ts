import {framesPerSecond, heroLevelCap, levelBuffer} from 'app/gameConstants';
import {createPointerButtonForTarget} from 'app/objects/fieldButton';
import {gainEssence, loseEssence} from 'app/objects/nexus';
import {damageTarget, isTargetAvailable} from 'app/utils/combat';
import {fillCircle, renderLifeBar} from 'app/utils/draw';
import {heroDefinitions} from 'app/definitions/heroDefinitions';

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
        attacksPerSecond: definition.attacksPerSecond,
        attackRange: definition.attackRange,
        enemyDefeatCount: 0,
        render: renderHero,
        update: updateHero,
        getFieldButtons: getHeroFieldButtons,
        onHit: onHitHero,
    };
}

export const warrior: Hero = createHero('warrior', {x: -40, y: 30});
export const ranger: Hero = createHero('ranger', {x: 40, y: 30});
export const wizard: Hero = createHero('wizard', {x: 0, y: -50});


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
    // Remove the selected attack target if it is becomes invalid (it dies, for example).
    if (this.selectedAttackTarget && !isTargetAvailable(state, this.selectedAttackTarget)) {
        delete this.selectedAttackTarget;
    }
    // Replace the current attack target with the selected attack taret(if any)
    // if it is becomes invalid (it dies, for example).
    if (this.attackTarget && !isTargetAvailable(state, this.attackTarget)) {
        this.attackTarget = this.selectedAttackTarget
    }
    if (this.attackTarget) {
        const pixelsPerFrame = this.movementSpeed / framesPerSecond;
        // Move this until it reaches the target.
        const dx = this.attackTarget.x - this.x, dy = this.attackTarget.y - this.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        // Attack the target when it is in range.
        if (mag <= this.r + this.attackTarget.r + this.attackRange) {
            // Attack the target if the enemy's attack is not on cooldown.
            const attackCooldown = 1000 / this.attacksPerSecond;
            if (!this.lastAttackTime || this.lastAttackTime + attackCooldown <= state.world.time) {
                damageTarget(state, this.attackTarget, this.damage);
                this.attackTarget.onHit?.(state, this);
                this.lastAttackTime = state.world.time;
                if (this.attackTarget.objectType === 'enemy') {
                    this.attackTarget.attackTarget = this;
                }
            }

            // Remove the attack target when it is dead.
            // Update hero experience.
            if (this.attackTarget.health <= 0) {
                const levelDisparity = this.level - (this.attackTarget.level + levelBuffer);
                const experiencePenalty = 1 - 0.1 * Math.max(levelDisparity, 0);
                this.experience += Math.max(this.attackTarget.experienceWorth * experiencePenalty, 0);
                this.enemyDefeatCount += 1;
                gainEssence(state, this.attackTarget.essenceWorth);
            }
            return;
        }

        if (mag < pixelsPerFrame) {
            this.x = this.attackTarget.x;
            this.y = this.attackTarget.y;
        } else {
            this.x += pixelsPerFrame * dx / mag;
            this.y += pixelsPerFrame * dy / mag;
        }
        return;
    }
    if (this.movementTarget) {
        // Move hero until it reaches the target.
        const pixelsPerFrame = this.movementSpeed / framesPerSecond;
        const dx = this.movementTarget.x - this.x, dy = this.movementTarget.y - this.y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag < pixelsPerFrame) {
            this.x = this.movementTarget.x;
            this.y = this.movementTarget.y;
        } else {
            this.x += pixelsPerFrame * dx / mag;
            this.y += pixelsPerFrame * dy / mag;
        }

        // Remove the target once they reach their destination.
        if (this.x === this.movementTarget.x && this.y === this.movementTarget.y) {
            delete this.movementTarget;
        }
    } else {
        // hero.target = {
        //     x: hero.r + Math.floor(Math.random() * (canvas.width - 2 * hero.r)),
        //     y: hero.r + Math.floor(Math.random() * (canvas.height - 2 * hero.r)),
        // };
    }
}

function renderHero(this: Hero, context: CanvasRenderingContext2D, state: GameState): void {
    // Draw a circle for the hero centered at their location, with their radius and color.
    fillCircle(context, this);
    fillCircle(context, {...this, r: this.r - 2, color: 'black'});

    if (this.movementTarget) {
        fillCircle(context, {
            ...this.movementTarget,
            r: 2,
            color: 'blue',
        });
    }
    if (state.heroSlots.includes(this)) {
        renderLifeBar(context, this, this.health, this.maxHealth);
    }
    // Draw hero level
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = '#FFF';
    context.font = '10px sans-serif';
    context.fillText(`${this.level}`, this.x, this.y);
}

function heroLevel(exp: number, currentLevel: number, levelCap: number): number {
    let level = currentLevel;
    // Find level using 10x sum of first n squares = 10*n*(n+1)*(2n+1)/6
    while (level < levelCap && exp >= 10 * level * (level + 1) * (2 * level + 1) / 6) {
        level++;
    }
    return level;
}

function updateHeroStats(hero: Hero) {
    const {maxHealth, damage, movementSpeed} = hero.definition.getStatsForLevel(hero.level);
    hero.maxHealth = maxHealth;
    hero.damage = damage;
    hero.movementSpeed = movementSpeed;
}
