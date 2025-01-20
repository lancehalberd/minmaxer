import {damageTarget, getEnemyTargets, getTargetsInCircle} from 'app/utils/combat';
import {removeEffect} from 'app/utils/effect';
import {frameLength} from 'app/gameConstants';

export function createProjectile(props: Partial<Projectile>): Projectile {
    const projectile: Projectile = {
        objectType: 'projectile',
        x: 0, y: 0,
        vx: 0, vy: 0,
        r: 10,
        duration: 1000,
        damage: 1,
        update: updateProjectile,
        render: renderProjectile,
        hitTargets: new Set(),
        ...props,
    };
    return projectile;
}
export function addProjectile(state: GameState, props: Partial<Projectile>): Projectile {
    const projectile = createProjectile(props);
    state.world.effects.push(projectile);
    return projectile;
}

function updateProjectile(this: Projectile, state: GameState) {
    this.duration -= frameLength;
    if (this.duration < 0) {
        removeEffect(state, this);
        return;
    }
    this.x += this.vx * frameLength / 1000;
    this.y += this.vy * frameLength  / 1000;
    if (this.hitsEnemies) {
        for (const target of getTargetsInCircle(state, getEnemyTargets(state), this)) {
            if (this.hitTargets.has(target)) {
                continue;
            }
            damageTarget(state, target, this.damage);
            this.hitTargets.add(target);
        }
        if (!this.piercing && this.hitTargets.size) {
            removeEffect(state, this);
        }
    }
}



// Default projectile is just a triangle with a point towards its heading.
function renderProjectile(this: Projectile, context: CanvasRenderingContext2D, state: GameState) {
    const theta = Math.atan2(this.vy, this.vx);
    context.save();
        context.fillStyle = this.color || '#F80';
        context.translate(this.x, this.y);
        context.rotate(theta);
        context.beginPath();
        context.moveTo(this.r, 0);
        context.lineTo(-this.r / 2, Math.sqrt(3) * this.r / 2);
        context.lineTo(-this.r / 2, -Math.sqrt(3) * this.r / 2);
        context.fill();
    context.restore();
}
