import {framesPerSecond} from 'app/gameConstants';
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
    },
    update(this: Hero, state: GameState) {
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
                if (this.attackTarget.health <= 0) {
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
