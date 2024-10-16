import {framesPerSecond} from 'app/gameConstants';
import {damageTarget, isTargetAvailable} from 'app/utils/combat';
import {fillCircle, renderLifeBar} from 'app/utils/draw';

export function updateEnemy(this: Enemy, state: GameState) {
    // Remove the current attack target if it is becomes invalid (it dies, for example).
    if (this.attackTarget && !isTargetAvailable(state, this.attackTarget)) {
        delete this.attackTarget;
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
    } else {
        this.attackTarget = state.nexus;
    }
}

export function renderEnemy(this: Enemy, context: CanvasRenderingContext2D, state: GameState) {
    // TODO: Instead of this, the enemy should aggro when it is hit be any hero if it doesn't
    // have a higher priority target.
    if (state.selectedHero?.attackTarget === this) {
        fillCircle(context, {...this, r: this.r + 2, color: '#FFF'});
    }
    fillCircle(context, this);
    renderLifeBar(context, this, this.health, this.maxHealth);
}
