import {frameLength, uiSize} from 'app/gameConstants';
import {drawNumberFillBar, fillRect, fillText} from 'app/utils/draw';
import {spendEssence} from 'app/utils/essence';
import {MinusIconButton, PlusIconButton} from 'app/objects/iconButton';


export function updateJobs(state: GameState) {
    for (const job of Object.values(state.city.jobs)) {
        if (job.workers > 0) {
            if (job.definition.update) {
                job.definition.update(state, job);
            }
            if (job.definition.workerSeconds) {
                if (job.definition.canProgress && !job.definition.canProgress(state, job)) {
                    continue;
                }
                job.workerSecondsCompleted += job.workers * frameLength / 1000;
                while (job.workerSecondsCompleted >= job.definition.workerSeconds) {
                    if (job.definition.onComplete) {
                        job.definition.onComplete(state, job);
                    }
                    if (job.definition.repeat) {
                        job.workerSecondsCompleted -= job.definition.workerSeconds;
                        if (!payForJob(state, job.definition)) {
                            // Cancel repeated jobs the player cannot afford.
                            // TODO: Consider freezing the job at zero progress instead.
                            job.workerSecondsCompleted = 0;
                            job.workers = 0;
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
            }
        }
    }
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

export function getAvailableToolCount(state: GameState, toolType: ToolType): number {
    if (toolType === 'axe') {
        return state.inventory.woodHatchet + state.inventory.woodAxe + state.inventory.stoneAxe
            + state.inventory.ironHatchet + state.inventory.steelAxe;
    }
    if (toolType === 'hammer') {
        return state.inventory.woodHammer + state.inventory.stoneHammer + state.inventory.ironHammer + state.inventory.steelHammer;
    }
    if (toolType === 'bow') {
        return state.inventory.shortBow + state.inventory.longBow + state.inventory.crossBow;
    }
    // This will cause a compiler failure if a toolType is not handled above.
    const never: never = toolType;
    return never;
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
    let usedWorkers = 0;
    for (const otherJob of Object.values(state.city.jobs)) {
        if (otherJob !== job) {
            usedWorkers += otherJob.workers;
        }
    }
    return state.city.population - usedWorkers;
}

function payForJob(state: GameState, jobDefinition: JobDefinition): boolean {
    // Return false if we cannot pay for the job.
    if (jobDefinition.resourceCost) {
        for (const [key, value] of Object.entries(jobDefinition.resourceCost) as [ResourceKey, number][]) {
            if (state.inventory[key] < value) {
                return false;
            }
        }
    }
    if ((jobDefinition.essenceCost ?? 0) > state.nexus.essence) {
        return false;
    }
    // Pay for the job and return true.
    if (jobDefinition.resourceCost) {
        for (const [key, value] of Object.entries(jobDefinition.resourceCost) as [ResourceKey, number][]) {
            state.inventory[key] -= value;
        }
    }
    if (jobDefinition.essenceCost) {
        spendEssence(state, jobDefinition.essenceCost);
    }

    return true;
}

export function createJobElement(jobDefinition: JobDefinition, {x, y}: Point): UIContainer {
    const w = 4 * uiSize;
    const plusButton = new PlusIconButton({
        x: x + w - uiSize,
        y: y + uiSize,
        onClick(state: GameState) {
            // Action fails if max workers is 0 (for example, if the required tools for the job are not available).
            if (!getMaxWorkersForJob(state, jobDefinition)) {
                return true;
            }
            const job = getOrCreateJob(state, jobDefinition);
            if (!job.workers && !job.workerSecondsCompleted) {
                // When starting a job, pay all the costs up front, then assign all
                // idle workers to the new job.
                const availableWorkers = availableWorkersForJob(state, job);
                if (availableWorkers && payForJob(state, jobDefinition)) {
                    updateWorkers(state, job, availableWorkers);
                }
            } else {
                updateWorkers(state, job, 1);
            }
            return true;
        },
        onHover(state: GameState) {
            const job = getOrCreateJob(state, jobDefinition);
            const isJobStarted = job.workers > 0 || job.workerSecondsCompleted > 0;
            // Always show job resource cost for repeated jobs.
            if (!isJobStarted || jobDefinition.repeat) {
                if (jobDefinition.essenceCost) {
                    state.nexus.previewEssenceChange = -jobDefinition.essenceCost;
                }
                if (jobDefinition.resourceCost) {
                    state.previewResourceCost = jobDefinition.resourceCost;
                }
                if (jobDefinition.requiredToolType) {
                    state.previewRequiredToolType = jobDefinition.requiredToolType;
                }
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
    return {
        objectType: 'uiContainer',
        w, h: 2 * uiSize, x, y,
        render(context: CanvasRenderingContext2D, state: GameState) {
            const job = getOrCreateJob(state, jobDefinition);
            fillRect(context, this, '#000');
            fillText(context, {text: jobDefinition.label, x: this.x + this. w / 2, y: this.y + uiSize / 2 + 1, size: uiSize - 4, color: '#FFF'});
            drawNumberFillBar(context, {
                x: this.x + uiSize, y: this.y + uiSize, w: this.w - 2 * uiSize, h: uiSize,
                value: job.workers,
                total: getMaxWorkersForJob(state, jobDefinition),
            });
            plusButton.render(context, state);
            minusButton.render(context, state);
            if (jobDefinition.workerSeconds && job.workerSecondsCompleted) {
                const p = job.workerSecondsCompleted / jobDefinition.workerSeconds;
                fillRect(context, {x: this.x, y: this.y + uiSize - 1, w: Math.floor(this.w * p), h: 2}, '#0AF');
                fillRect(context, {x: this.x + Math.ceil(this.w * p) - 1, y: this.y + uiSize - 1, w: 1, h: 2}, '#8FF');
            }
        },
        getChildren() {
            return [plusButton, minusButton];
        }
    };
}
