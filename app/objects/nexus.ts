import {addProjectile} from 'app/effects/projectile';
import {frameLength} from 'app/gameConstants';
import {isTargetAvailable} from 'app/utils/combat';
import {fillCircle, renderGameStatus} from 'app/utils/draw';
import {gainEssence} from 'app/utils/essence';
import {getDistance} from 'app/utils/geometry';

export const nexus: Nexus = {
    objectType: 'nexus',
    x: 0,
    y: 0,
    r: 40,
    color: '#0FF',
    level: 1,
    deathCount: 0,
    essence: 100,
    essenceGrowth: 1,
    lostEssence: 0,
    lostEssenceTime: 0,
    gainedEssence: 0,
    gainedEssenceTime: 0,
    previewEssenceChange: 0,
    render(this: Nexus, context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        if (this.essence <= 0){
            renderGameStatus(context, "nexus destroyed!");
        }
        if (state.city.wallHealth > 0) {
            context.save();
                context.beginPath();
                context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
                context.lineWidth = 3;
                context.setLineDash([3, 3]);
                context.strokeStyle = '#888';
                context.stroke();
            context.restore();
        }
      
    },
    update(state: GameState) {
        // If we are tracking gained essence, remove it linearly for 1 second following the last time
        // essence was gained.
        if (this.gainedEssence) {
            const timeLeft = this.gainedEssenceTime + 1000 - state.world.time;
            if (timeLeft > 0) {
                // Reduce essence by one frame if there is time remaining.
                this.gainedEssence = this.gainedEssence * (timeLeft - frameLength) / timeLeft;
            } else {
                // If there is no time remaining, just set gained essence to 0.
                this.gainedEssence = 0;
            }
        }
        // If we are tracking lost essence, remove it linearly for 0.5 seconds after a second has passed.
        if (this.lostEssence) {
            const timeLeft = this.lostEssenceTime + 600 - state.world.time;
            // There is a short delay before depleting the lost essence section.
            if (timeLeft > 0 && timeLeft < 400) {
                // Reduce essence by one frame if there is time remaining.
                this.lostEssence = this.lostEssence * (timeLeft - frameLength) / timeLeft;
            } else if (timeLeft <= 0) {
                // If there is no time remaining, just set gained essence to 0.
                this.lostEssence = 0;
            }

        }
        // Update archers
        const maxArchers = Math.min(state.city.population, state.inventory.shortBow + state.inventory.longBow + state.inventory.crossBow);
        const arrows = state.inventory.woodArrow; // + flintArrows etc.
        // Distance is measured from the center of the nexus, so add the radius of the nexus.
        const archerRange = this.r + 40;
        state.city.archers = Math.min(state.city.archers, maxArchers);
        if (state.city.archers > 0 && arrows > 0) {
            if (state.city.archersTarget && !isTargetAvailable(state, state.city.archersTarget)) {
                delete state.city.archersTarget
            }
            // Remove the target if it goes out of range since the archers cannot chase it.
            if (state.city.archersTarget && getDistance(this, state.city.archersTarget)) {
                delete state.city.archersTarget
            }
            // The archers will automatically attack an enemy within its range if it is idle.
            if (!state.city.archersTarget) {
                // Choose the closest valid target within the aggro radius as an attack target.
                let closestDistance = archerRange;
                for (const object of state.world.objects) {
                    if (object.objectType === 'enemy') {
                        const distance = getDistance(this, object);
                        if (distance < closestDistance) {
                            state.city.archersTarget = object;
                            closestDistance = distance;
                        }
                    }
                }
            }
            if (state.city.archersTarget) {
                const attackTarget = state.city.archersTarget;
                const attacksPerSecond = state.city.archers;
                const attackCooldown = 1000 / attacksPerSecond;
                if (!state.city.archersLastAttackTime || state.city.archersLastAttackTime + attackCooldown <= state.world.time) {
                    // TODO: This should be calculated from various factors.
                    const damage = 1;
                    const speed = 100;
                    const dx = attackTarget.x - this.x, dy = attackTarget.y - this.y;
                    const mag = Math.sqrt(dx*dx + dy*dy);
                    state.inventory.woodArrow--;
                    addProjectile(state, {
                        x: this.x + dx * this.r / mag,
                        y: this.y + dy * this.r / mag,
                        hitsEnemies: true,
                        vx: dx * speed / mag,
                        vy: dy * speed / mag,
                        color: '#AAA',
                        r: 3,
                        duration: 1000 * archerRange / speed,
                        damage,
                    });
                    //damageTarget(state, attackTarget, damage, this);
                    //attackTarget.onHit?.(state, this);
                    state.city.archersLastAttackTime = state.world.time;
                }

                // Remove the attack target when it is dead.
                // Update hero experience.
                if (attackTarget.health <= 0) {
                    gainEssence(state, attackTarget.essenceWorth);
                    // Don't drop items from enemies killed by the Nexus to prevent them from
                    // stacking up too much.
                }

            }
        }


        // Since this is gained every frame we don't want to animate this change.
        gainEssence(state, this.essenceGrowth * frameLength / 1000, false);
    },
};


