import {buildWallElement} from 'app/city/cityWall';
import {addProjectile} from 'app/effects/projectile';
import {frameLength, uiSize} from 'app/gameConstants';
import {MinusIconButton, PlusIconButton} from 'app/objects/iconButton';
import {isTargetAvailable} from 'app/utils/combat';
import {drawNumberFillBar, fillCircle, fillRect, fillText, renderGameStatus} from 'app/utils/draw';
import {gainEssence} from 'app/utils/essence';
import {getDistance} from 'app/utils/geometry';
import {getOrCreateJob, updateJobs, updateWorkers} from 'app/utils/job';

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
        if (state.city.wall.health > 0) {
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
        updateJobs(state);

        // Since this is gained every frame we don't want to animate this change.
        gainEssence(state, this.essenceGrowth * frameLength / 1000, false);
    },
    getChildren: getNexusElements,
};

const archerJobDefinition: JobDefinition = {
    key: 'archer',
    update: updateArchers,
    //workerSeconds: 1,
    //repeat: true,
};

function updateArchers(state: GameState, archerJob: Job) {

    // Update archers
    const maxArchers = Math.min(state.city.population, state.inventory.shortBow + state.inventory.longBow + state.inventory.crossBow);
    const arrows = state.inventory.woodArrow; // + flintArrows etc.
    // Distance is measured from the center of the nexus, so add the radius of the nexus.
    const archerRange = state.nexus.r + 40;
    const archers = archerJob.workers = Math.min(archerJob.workers ?? 0, maxArchers);
    if (archers > 0 && arrows > 0) {
        if (state.city.archersTarget && !isTargetAvailable(state, state.city.archersTarget)) {
            delete state.city.archersTarget
        }
        // Remove the target if it goes out of range since the archers cannot chase it.
        if (state.city.archersTarget && getDistance(state.nexus, state.city.archersTarget)) {
            delete state.city.archersTarget
        }
        // The archers will automatically attack an enemy within its range if it is idle.
        if (!state.city.archersTarget) {
            // Choose the closest valid target within the aggro radius as an attack target.
            let closestDistance = archerRange;
            for (const object of state.world.objects) {
                if (object.objectType === 'enemy') {
                    const distance = getDistance(state.nexus, object);
                    if (distance < closestDistance) {
                        state.city.archersTarget = object;
                        closestDistance = distance;
                    }
                }
            }
        }
        if (state.city.archersTarget) {
            const attackTarget = state.city.archersTarget;
            const attacksPerSecond = archers;
            const attackCooldown = 1000 / attacksPerSecond;
            if (!state.city.archersLastAttackTime || state.city.archersLastAttackTime + attackCooldown <= state.world.time) {
                // TODO: This should be calculated from various factors.
                const damage = 1;
                const speed = 100;
                const dx = attackTarget.x - state.nexus.x, dy = attackTarget.y - state.nexus.y;
                const mag = Math.sqrt(dx*dx + dy*dy);
                state.inventory.woodArrow--;
                addProjectile(state, {
                    x: state.nexus.x + dx * state.nexus.r / mag,
                    y: state.nexus.y + dy * state.nexus.r / mag,
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
}


const archerElement: UIContainer = {
    objectType: 'uiContainer',
    w: 4 * uiSize, h: 2 * uiSize, x: - 2 * uiSize, y: -uiSize,
    render(context: CanvasRenderingContext2D, state: GameState) {
        const archerJob = getOrCreateJob(state, archerJobDefinition);
        fillRect(context, this, '#000');
        fillText(context, {text: 'Archers', x: this.x + this. w / 2, y: this.y + uiSize / 2 + 1, size: uiSize - 4, color: '#FFF'});
        drawNumberFillBar(context, {
            x: this.x + uiSize, y: this.y + uiSize, w: this.w - 2 * uiSize, h: uiSize,
            value: archerJob.workers,
            total: Math.min(state.inventory.shortBow, state.city.population),
        });
        archerPlusButton.render(context, state);
        archerMinusButton.render(context, state);
    },
    getChildren() {
        return [archerPlusButton, archerMinusButton];
    }
};
const archerPlusButton = new PlusIconButton({
    x: archerElement.x + archerElement.w - uiSize,
    y: archerElement.y + uiSize,
    onClick(state: GameState) {
        const archerJob = getOrCreateJob(state, archerJobDefinition);
        updateWorkers(state, archerJob, 1, state.inventory.shortBow);
        return true;
    }
});
const archerMinusButton = new MinusIconButton({
    x: archerElement.x,
    y: archerElement.y + uiSize,
    onClick(state: GameState) {
        const archerJob = getOrCreateJob(state, archerJobDefinition);
        updateWorkers(state, archerJob, -1, state.inventory.shortBow);
        return true;
    }
});




function getNexusElements(this: Nexus, state: GameState): UIElement[] {
    const elements: UIElement[] = [];
    if (state.city.population && !state.city.wall.level) {
        elements.push(buildWallElement);
    }
    if (state.city.population && state.city.wall.level) {
        elements.push(archerElement);
    }

    return elements;
}


