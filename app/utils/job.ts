import {frameLength} from 'app/gameConstants';

export function updateJobs(state: GameState) {
    for (const job of Object.values(state.city.jobs)) {
        if (job.workers > 0) {
            if (job.definition.update) {
                job.definition.update(state, job);
            }
            if (job.definition.workerSeconds) {
                job.workerSecondsCompleted += job.workers * frameLength / 1000;
                let completions = 0;
                while (job.workerSecondsCompleted >= job.definition.workerSeconds) {
                    completions++;
                    if (job.definition.repeat) {
                        job.workerSecondsCompleted -= job.definition.workerSeconds;
                    } else {
                        break
                    }
                }
                if (completions > 0) {
                    if (job.definition.onComplete) {
                        job.definition.onComplete(state, job, completions);
                    }
                    if (!job.definition.repeat) {
                        delete state.city.jobs[job.definition.key];
                    }
                }
            }
        }
    }
}

export function getOrCreateJob(state: GameState, definition: JobDefinition): Job {
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

export function updateWorkers(state: GameState, job: Job, delta: number, max?: number) {
    // TODO: Improve performance by tracking state.city.idlePopulation instead of calculating this value.
    let usedWorkers = 0;
    for (const otherJob of Object.values(state.city.jobs)) {
        if (otherJob !== job) {
            usedWorkers += otherJob.workers;
        }
    }
    job.workers = Math.max(0, Math.min(job.workers + delta, state.city.population - usedWorkers));
    if (max) {
        job.workers= Math.min(job.workers, max);
    }
}
