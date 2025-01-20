import {frameLength, uiSize} from 'app/gameConstants';
import {CircleIconButton, MinusIconButton, PlusIconButton} from 'app/objects/iconButton';
import {computeResourceCost, computeValue} from 'app/utils/computed';
import {drawNumberFillBar, fillRect, fillText} from 'app/utils/draw';
import {spendEssence} from 'app/utils/essence';
import {getAvailableToolCount} from 'app/utils/inventory';


export function updateJobs(state: GameState) {
    for (const job of Object.values(state.city.jobs)) {
        if (job.workers > 0) {
            if (job.definition.update) {
                job.definition.update(state, job);
            }
            if (job.definition.workerSeconds) {
                progressJob(state, job, job.workers * frameLength / 1000);
            }
        }
    }
}

// TODO: Add option to reveal jobs from previous play throughs before they are discovered in the current playthrough.
export function isJobDiscovered(state: GameState, job: JobDefinition): boolean {
    if (job.resourceCost) {
        for (const key of Object.keys(job.resourceCost) as ResourceKey[]) {
            if (!state.totalResources[key]) {
                return false;
            }
        }
    }
    // Currently jobs the hero can do never require tools, so they are revealed regardless of tool status.
    if (job.applyHeroProgress) {
        return true;
    }
    // Any job that the hero cannot progress is hidden until the city has population to assign to the job.
    if (!state.city.population) {
        return false;
    }
    // For population only jobs, hide them until the required tool type is created.
    if (job.requiredToolType) {
        return getAvailableToolCount(state, job.requiredToolType) > 0;
    }
    return true;
}

export function progressJob(state: GameState, job: Job, workerSeconds: number): boolean {
    if (!job.definition.workerSeconds) {
        return false;
    }
    if (job.definition.canProgress && !job.definition.canProgress(state, job)) {
        return false;
    }
    job.workerSecondsCompleted += workerSeconds;
    while (job.workerSecondsCompleted >= job.definition.workerSeconds) {
        if (job.definition.onComplete) {
            job.definition.onComplete(state, job);
        }
        if (job.definition.repeat) {
            job.workerSecondsCompleted -= job.definition.workerSeconds;
            if (!payForJob(state, job)) {
                // Cancel repeated jobs the player cannot afford.
                // TODO: Consider freezing the job at zero progress instead.
                stopJob(state, job);
                break;
            }
        } else {
            delete state.city.jobs[job.definition.key];
            break
        }
        // Reset to progress 0 on repeat if the job cannot progress.
        if (job.definition.canProgress && !job.definition.canProgress(state, job)) {
            job.workerSecondsCompleted = 0;
            break;
        }
    }
    return true;
}

export function stopJob(state: GameState, job: Job) {
    job.workerSecondsCompleted = 0;
    job.workers = 0;
    // Remove any heroes assigned to this job as well.
    for (const hero of state.heroSlots) {
        if (!hero) {
            continue;
        }
        if (hero.assignedJob === job) {
            delete hero.assignedJob;
        }
        const jobHeroTarget = job.getHeroTarget?.(state);
        if (hero.movementTarget === jobHeroTarget) {
            delete hero.movementTarget
        }
    }
}

export function applyHeroToJob(state: GameState, definition: JobDefinition, hero: Hero) {
    if (!definition.applyHeroProgress) {
        return;
    }
    const job = getOrCreateJob(state, definition);
    if (!job.isPaidFor) {
        if (!payForJob(state, job)) {
            return;
        }
    }
    definition.applyHeroProgress(state, job, hero);
}

function getOrCreateJob(state: GameState, definition: JobDefinition): Job {
    let job = state.city.jobs[definition.key];
    if (job) {
        return job;
    }
    job = {
        definition,
        workers: 0,
        workerSecondsCompleted: 0,
    };
    return state.city.jobs[definition.key] = job;
}


function getMaxWorkersForJob(state: GameState, jobDefinition: JobDefinition) {
    let max = state.city.population;
    if (jobDefinition.requiredToolType) {
        max = Math.min(max ?? 0, getAvailableToolCount(state, jobDefinition.requiredToolType));
    }
    return max;
}

function updateWorkers(state: GameState, job: Job, delta: number) {
    job.workers = Math.max(0, Math.min(job.workers + delta, availableWorkersForJob(state, job)));
    job.workers = Math.min(job.workers, getMaxWorkersForJob(state, job.definition));
}

function availableWorkersForJob(state: GameState, job: Job): number {
    // TODO: Improve performance by tracking state.city.idlePopulation instead of calculating this value.
    /*let usedWorkers = 0;
    for (const otherJob of Object.values(state.city.jobs)) {
        if (otherJob !== job) {
            usedWorkers += otherJob.workers;
        }
    }*/
    return state.city.idlePopulation + job.workers;
}

function payForJob(state: GameState, job: Job): boolean {
    const jobDefinition = job.definition;
    // Return false if we cannot pay for the job.
    if (jobDefinition.resourceCost) {
        for (const [key, value] of Object.entries(jobDefinition.resourceCost) as [ResourceKey, number][]) {
            const computedValue = computeValue(state, jobDefinition, value, 0);
            if (state.inventory[key] < computedValue) {
                return false;
            }
        }
    }
    const essenceCost = computeValue(state, jobDefinition, jobDefinition.essenceCost, 0);
    if (essenceCost > state.nexus.essence) {
        return false;
    }
    // Pay for the job and return true.
    if (jobDefinition.resourceCost) {
        for (const [key, value] of Object.entries(jobDefinition.resourceCost) as [ResourceKey, number][]) {
            const computedValue = computeValue(state, jobDefinition, value, 0);
            state.inventory[key] -= computedValue;
        }
    }
    if (essenceCost) {
        spendEssence(state, essenceCost);
    }
    job.isPaidFor = true;
    return true;
}

export function createJobElement(jobDefinition: JobDefinition, {x, y}: Point, getHeroTarget?: (state: GameState) => FieldTarget): JobUIElement {
    const w = 6 * uiSize;
    // TODO: Turn the label into a button for the Hero.
    // TODO: Add max/empty buttons
    // TODO: Add repeat toggle button.
    const plusButton = new PlusIconButton({
        x: x + w - uiSize,
        y: y + uiSize,
        onClick(state: GameState) {
            // Action fails if max workers is 0 (for example, if the required tools for the job are not available).
            if (!getMaxWorkersForJob(state, jobDefinition)) {
                return true;
            }
            const job = getOrCreateJob(state, jobDefinition);
            if (!job.isPaidFor) {
                // When starting a job, pay all the costs up front.
                const availableWorkers = availableWorkersForJob(state, job);
                if (availableWorkers && payForJob(state, job)) {
                    updateWorkers(state, job, 1);
                }
            } else {
                updateWorkers(state, job, 1);
            }
            return true;
        },
        onHover(state: GameState) {
            const job = getOrCreateJob(state, jobDefinition);
            // Always show job resource cost for repeated jobs.
            if (!job.isPaidFor || jobDefinition.repeat) {
                if (jobDefinition.essenceCost) {
                    state.nexus.previewEssenceChange = -jobDefinition.essenceCost;
                }
                if (jobDefinition.resourceCost) {
                    state.previewResourceCost = computeResourceCost(state, jobDefinition, jobDefinition.resourceCost);
                }
            }
            if (jobDefinition.requiredToolType) {
                state.previewRequiredToolType = jobDefinition.requiredToolType;
            }
            return true;
        }
    });
    const minusButton = new MinusIconButton({
        x,
        y: y + uiSize,
        onClick(state: GameState) {
            updateWorkers(state, getOrCreateJob(state, jobDefinition), -1);
            return true;
        }
    });
    const heroButton = new CircleIconButton({
        x: x - uiSize,
        y,
        onClick(state: GameState) {
            if (state.selectedHero) {
                const job = getOrCreateJob(state, jobDefinition);
                state.selectedHero.assignedJob = job;
            }
            return true;
        },
        onHover(state: GameState) {
            const job = getOrCreateJob(state, jobDefinition);
            // Always show job resource cost for repeated jobs.
            if (!job.isPaidFor || jobDefinition.repeat) {
                if (jobDefinition.essenceCost) {
                    state.nexus.previewEssenceChange = -jobDefinition.essenceCost;
                }
                if (jobDefinition.resourceCost) {
                    state.previewResourceCost = computeResourceCost(state, jobDefinition, jobDefinition.resourceCost);
                }
                // Currently heroes do not require tools.
                //if (jobDefinition.requiredToolType) {
                //    state.previewRequiredToolType = jobDefinition.requiredToolType;
                //}
            }
            return true;
        }
    });
    return {
        objectType: 'uiContainer',
        jobDefinition,
        w, h: 2 * uiSize, x, y,
        update(state: GameState) {
            if (getHeroTarget) {
                const job = getOrCreateJob(state, jobDefinition);
                job.getHeroTarget = getHeroTarget;
            }
        },
        render(context: CanvasRenderingContext2D, state: GameState) {
            const job = getOrCreateJob(state, jobDefinition);
            fillRect(context, {...this, h: uiSize}, '#000');
            fillText(context, {text: jobDefinition.label, x: this.x + this. w / 2, y: this.y + uiSize / 2 + 1, size: uiSize - 4, color: '#FFF'});

            // Draw population controls only once the city has a population.
            if (state.city.population > 0) {
                const totalSpots = getMaxWorkersForJob(state, jobDefinition);
                // This is the number of spots that cannot be filled because workers are busy in other jobs.
                // We display this so that it is easy to see the limit of what can be assigned based on the available population
                // while still showing the total possible if all workers could be assigned ot this job.
                const reservedWorkers = Math.max(0, totalSpots - state.city.idlePopulation - job.workers);
                drawNumberFillBar(context, {
                    x: this.x + uiSize, y: this.y + uiSize, w: this.w - 2 * uiSize, h: uiSize,
                    value: job.workers,
                    // Draw the whole bar as reserved if there are 0 total spots currently.
                    total: totalSpots ? totalSpots : 1,
                    reserved: totalSpots ? reservedWorkers : 1,
                });
                //plusButton.render(context, state);
                //minusButton.render(context, state);
            }
            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
            if (jobDefinition.workerSeconds && job.workerSecondsCompleted) {
                const p = job.workerSecondsCompleted / jobDefinition.workerSeconds;
                fillRect(context, {x: this.x, y: this.y + uiSize - 1, w: Math.floor(this.w * p), h: 2}, '#0AF');
                fillRect(context, {x: this.x + Math.ceil(this.w * p) - 1, y: this.y + uiSize - 1, w: 1, h: 2}, '#8FF');
            }
        },
        getChildren(state: GameState) {
            const buttons: UIElement[] = [];
            if (state.city.population) {
                buttons.push(plusButton);
                buttons.push(minusButton);
            }
            if (state.selectedHero && jobDefinition.applyHeroProgress) {
                buttons.push(heroButton);
            }
            return buttons;
        }
    };
}
