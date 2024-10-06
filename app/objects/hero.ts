import {framesPerSecond, heroLevelCap, levelBuffer} from 'app/gameConstants';
import {damageTarget} from 'app/utils/combat';
import {fillCircle, renderLifeBar} from 'app/utils/draw';

export const hero: Hero = {
    objectType: 'hero',
    x: 50,
    y: 50,
    r: 10,
    movementSpeed: 100,
    color: 'blue',
    level: 1,
    experience: 0,
    health: 20,
    maxHealth: 20,
    damage: 1,
    attacksPerSecond: 2,
    attackRange: 10,
    render(this: Hero, context: CanvasRenderingContext2D, state: GameState) {
        // Draw a circle for the hero centered at their location, with their radius and color.
        fillCircle(context, this);

        if (this.target) {
            fillCircle(context, {
                ...this.target,
                r: 2,
                color: 'blue',
            });
        }
        renderLifeBar(context, this, this.health, this.maxHealth);
        // Draw hero level
        context.fillText(`${this.level}`, this.x - this.r/3, this.y + this.r/3);
    },
    update(this: Hero, state: GameState) {
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
                    delete this.attackTarget;
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
        if (this.target) {
            // Move hero until it reaches the target.
            const pixelsPerFrame = this.movementSpeed / framesPerSecond;
            const dx = this.target.x - this.x, dy = this.target.y - this.y;
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag < pixelsPerFrame) {
                this.x = this.target.x;
                this.y = this.target.y;
            } else {
                this.x += pixelsPerFrame * dx / mag;
                this.y += pixelsPerFrame * dy / mag;
            }

            // Remove the target once they reach their destination.
            if (this.x === this.target.x && this.y === this.target.y) {
                delete this.target;
            }
        } else {
            // hero.target = {
            //     x: hero.r + Math.floor(Math.random() * (canvas.width - 2 * hero.r)),
            //     y: hero.r + Math.floor(Math.random() * (canvas.height - 2 * hero.r)),
            // };
        }
    }
};

function heroLevel(exp: number, currentLevel: number, levelCap: number): number {
    let level = currentLevel;
    // Find level using 10x sum of first n squares = 10*n*(n+1)*(2n+1)/6
    while (level < levelCap && exp >= 10 * level * (level + 1) * (2 * level + 1) / 6) {
        level++;
    }
    return level;
}

function updateHeroStats(hero: Hero) {
    hero.maxHealth = hero.level*20;
    hero.damage = hero.level*2;
    hero.movementSpeed = hero.level*2.5 + 97.5;
}
updateHeroStats(hero);
