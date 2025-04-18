import {frameLength} from 'app/gameConstants';
import {computeResourceCost, computeValue} from 'app/utils/computed';
import {spendEssence} from 'app/utils/essence';
import {getAvailableToolCount, getJobMultiplierFromTools} from 'app/utils/inventory';


export function updateJobs(state: GameState) {
    for (const job of Object.values(state.city.jobs)) {
        if (job.workers > 0) {
            if (job.definition.update) {
                job.definition.update(state, job);
            }
            if (job.definition.workerSeconds) {
                let jobMultiplier = job.workers;
                // If the job uses a tool, a bonus is applied assuming the workers are using the best tools available
                // to them.
                if (job.definition.requiredToolType) {
                    jobMultiplier = getJobMultiplierFromTools(state, job.workers, job.definition.requiredToolType);
                }
                progressJob(state, job, jobMultiplier * frameLength / 1000);
            }
        }
    }
}

// TODO: Add option to reveal jobs from previous play throughs before they are discovered in the current playthrough.
export function isJobDiscovered(state: GameState, job: JobDefinition): boolean {
    if (job.resourceCost) {
        for (const key of Object.keys(job.resourceCost) as InventoryKey[]) {
            if (!state.discoveredItems.has(key)) {
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
    if (job.definition.isValid && !job.definition.isValid(state)) {
        return false;
    }
    if (job.definition.canProgress && !job.definition.canProgress(state, job)) {
        return false;
    }
    job.workerSecondsCompleted += workerSeconds;
    let workerSecondsToCompletJob = computeValue(state, job.definition, job.definition.workerSeconds, 0);
    while (job.workerSecondsCompleted >= workerSecondsToCompletJob) {
    // while (job.workerSecondsCompleted >= job.definition.workerSeconds) { // This line did not correctly give a TS error on old versions of TS.
        if (job.definition.onComplete) {
            job.definition.onComplete(state, job);
        }
        job.isPaidFor = false;
        // Check if a job is invalid after completing it
        if (job.definition.isValid && !job.definition.isValid(state)) {
            stopJob(state, job);
            break;
        }
        if (job.shouldRepeatJob) {
            job.workerSecondsCompleted -= workerSecondsToCompletJob;
            if (!payForJob(state, job)) {
                // Cancel repeated jobs the player cannot afford.
                // TODO: Consider freezing the job at zero progress instead.
                stopJob(state, job);
                break;
            }
        } else {
            stopJob(state, job);
            break
        }
        // Reset to progress 0 on repeat if the job cannot progress.
        if (job.definition.canProgress && !job.definition.canProgress(state, job)) {
            job.workerSecondsCompleted = 0;
            break;
        }
        workerSecondsToCompletJob = computeValue(state, job.definition, job.definition.workerSeconds, 0);
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
    // Make sure the hero is assigned the job if they aren't.
    // This can happen when a hero clicks on a structure that applies a job on interaction,
    // like a forest or quary.
    hero.assignedJob = job;
    if (!job.isPaidFor) {
        if (!payForJob(state, job)) {
            return;
        }
    }
    definition.applyHeroProgress(state, job, hero);
}

export function getOrCreateJob(state: GameState, definition: JobDefinition): Job {
    let job = state.city.jobs[definition.key];
    if (job?.definition === definition) {
        return job;
    }
    job = {
        definition,
        workers: 0,
        workerSecondsCompleted: 0,
        isPaidFor: false,
        shouldRepeatJob: !!definition.repeat,
    };
    return state.city.jobs[definition.key] = job;
}
export function getJob(state: GameState, key: string): Job|undefined {
    return state.city.jobs[key];
}


export function getMaxWorkersForJob(state: GameState, job: Job) {
    let max = state.city.population;
    return max;
}


export function availableWorkersForJob(state: GameState, job: Job): number {
    let max = state.city.idlePopulation + job.workers;
    if (job.definition.requiredToolType) {
        max = Math.min(max, state.city.idleToolCounts[job.definition.requiredToolType] + job.workers);
    }
    return max;
}


export function updateAssignedWorkers(state: GameState, jobDefinition: JobDefinition, delta: number) {
    const job = getOrCreateJob(state, jobDefinition);
    const availableWorkers = availableWorkersForJob(state, job);
    if (delta > 0) {
        // Action fails if max workers is 0 (for example, if the required tools for the job are not available).
        if (!getMaxWorkersForJob(state, job)) {
            return;
        }
        if (!job.isPaidFor) {
            // When starting a job, pay all the costs up front.
            if (!availableWorkers || !payForJob(state, job)) {
                return;
            }
        }
    }
    job.workers = Math.max(0, Math.min(job.workers + delta, availableWorkersForJob(state, job)));
    job.workers = Math.min(job.workers, getMaxWorkersForJob(state, job));
}

function payForJob(state: GameState, job: Job): boolean {
    const jobDefinition = job.definition;
    // Return false if we cannot pay for the job.
    const computedResourceCost =  jobDefinition.resourceCost ? computeResourceCost(state, jobDefinition, jobDefinition.resourceCost) : undefined;
    if (computedResourceCost) {
        for (const [key, value] of Object.entries(computedResourceCost)) {
            const computedValue = computeValue(state, jobDefinition, value, 0);
            if ((state.inventory[key as InventoryKey] ?? 0) < computedValue) {
                return false;
            }
        }
    }
    const essenceCost = computeValue(state, jobDefinition, jobDefinition.essenceCost, 0);
    if (essenceCost > state.nexus.essence) {
        return false;
    }
    // Pay for the job and return true.
    if (computedResourceCost) {
        for (const [key, value] of Object.entries(computedResourceCost)) {
            const computedValue = computeValue(state, jobDefinition, value, 0);
            state.inventory[key as InventoryKey] = (state.inventory[key as InventoryKey] ?? 0) - computedValue;
        }
    }
    if (essenceCost) {
        spendEssence(state, essenceCost);
    }
    job.isPaidFor = true;
    return true;
}


