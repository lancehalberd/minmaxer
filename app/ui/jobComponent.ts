import {uiSize} from 'app/gameConstants';
import {CircleIconButton, MinusIconButton, PlusIconButton, RepeatToggle} from 'app/ui/iconButton';
import {computeResourceCost, computeValue} from 'app/utils/computed';
import {drawNumberFillBar, fillRect, fillText} from 'app/utils/draw';
import {getMaxWorkersForJob, getOrCreateJob, updateAssignedWorkers} from 'app/utils/job';

export function createJobComponent(jobDefinition: JobDefinition, {x, y}: Point, getHeroTarget?: (state: GameState) => FieldTarget): JobUIElement {
    const w = 6 * uiSize;
    // TODO: Turn the label into a button for the Hero.
    // TODO: Turn fill bar into histogram based on the quality of the Tool, full saturation for best tool, in increments down to half saturation for worst tool.
    // TODO: Try turning the population UI into a slider
    // Draw a line at the current level
    // On hover show the population cost, and show updated histogram on the bottom half of the bar
    const emptyButton = new MinusIconButton({
        x,
        y: y + uiSize,
        onClick(state: GameState) {
            const job = getOrCreateJob(state, jobDefinition);
            job.workers = 0;
            return true;
        }
    });
    const minusButton = new MinusIconButton({
        x: x + uiSize,
        y: y + uiSize,
        onClick(state: GameState) {
            updateAssignedWorkers(state, jobDefinition, -1);
            return true;
        }
    });
    const plusButton = new PlusIconButton({
        x: x + w - 2 * uiSize,
        y: y + uiSize,
        onClick(state: GameState) {
            updateAssignedWorkers(state, jobDefinition, 1);
            return true;
        },
        onHover(state: GameState) {
            showJobPreviewForPopulation(state, jobDefinition);
            return true;
        }
    });
    const maxButton = new PlusIconButton({
        x: x + w - uiSize,
        y: y + uiSize,
        onClick(state: GameState) {
            updateAssignedWorkers(state, jobDefinition, state.city.population);
            return true;
        },
        onHover(state: GameState) {
            showJobPreviewForPopulation(state, jobDefinition);
            return true;
        }
    });
    const heroButton = new CircleIconButton({
        x: x - uiSize,
        y,
        onClick(state: GameState) {
            if (state.selectedHero) {
                state.selectedHero.assignedJob = getOrCreateJob(state, jobDefinition);
            }
            return true;
        },
        onHover(state: GameState) {
            showJobPreviewForHero(state, jobDefinition);
            return true;
        }
    });
    const repeatToggle = new RepeatToggle({
        x: x + w, y,
        w: uiSize, h: uiSize,
        isActive(state: GameState) {
            return getOrCreateJob(state, jobDefinition).shouldRepeatJob;
        },
        onClick(state: GameState): boolean {
            const job = getOrCreateJob(state, jobDefinition);
            job.shouldRepeatJob = !job.shouldRepeatJob;
            return true;
        },
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
                    x: this.x + 2 * uiSize, y: this.y + uiSize, w: this.w - 4 * uiSize, h: uiSize,
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
                const p = job.workerSecondsCompleted / computeValue(state, job.definition, job.definition.workerSeconds, 0);
                fillRect(context, {x: this.x, y: this.y + uiSize - 1, w: Math.floor(this.w * p), h: 2}, '#0AF');
                fillRect(context, {x: this.x + Math.ceil(this.w * p) - 1, y: this.y + uiSize - 1, w: 1, h: 2}, '#8FF');
            }
        },
        getChildren(state: GameState) {
            const buttons: UIElement[] = [repeatToggle];
            if (state.city.population) {
                buttons.push(emptyButton);
                buttons.push(minusButton);
                buttons.push(plusButton);
                buttons.push(maxButton);
            }
            if (state.selectedHero && jobDefinition.applyHeroProgress) {
                buttons.push(heroButton);
            }
            return buttons;
        }
    };
}

function showJobPreviewForPopulation(state: GameState, jobDefinition: JobDefinition) {
    const job = getOrCreateJob(state, jobDefinition);
    // Always show job resource cost for repeated jobs.
    if (!job.isPaidFor || job.shouldRepeatJob) {
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
}

function showJobPreviewForHero(state: GameState, jobDefinition: JobDefinition) {
    const job = getOrCreateJob(state, jobDefinition);
    // Always show job resource cost for repeated jobs.
    if (!job.isPaidFor || job.shouldRepeatJob) {
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
}

