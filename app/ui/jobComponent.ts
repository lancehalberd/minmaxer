import {uiSize} from 'app/gameConstants';
import {isMouseOverTarget} from 'app/mouse';
import {MinusIconButton, PlusIconButton, RepeatToggle} from 'app/ui/iconButton';
import {showRequirementsTooltip} from 'app/ui/tooltip';
import {drawFrame} from 'app/utils/animations';
import {computeResourceCost, computeValue} from 'app/utils/computed';
import {drawNumberFillBar, fillRect, fillText} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';
import {availableWorkersForJob, getMaxWorkersForJob, getOrCreateJob, updateAssignedWorkers} from 'app/utils/job';

interface JobComponentProps {
    jobDefinition: JobDefinition
    x?: number
    y?: number
    scale?: number
    getHeroTarget?: (state: GameState) => FieldTarget
}
export function createJobComponent({jobDefinition, x = 0, y = 0, scale = 1, getHeroTarget}: JobComponentProps): JobUIElement {
    const scaledSize = scale * uiSize;
    const w = 6 * scaledSize;
    // TODO: Turn fill bar into histogram based on the quality of the Tool, full saturation for best tool, in increments down to half saturation for worst tool.
    // TODO: Try turning the population UI into a slider
    // Draw a line at the current level
    // On hover show the population cost, and show updated histogram on the bottom half of the bar
    const emptyButton = new MinusIconButton({
        x: 0,
        y: scaledSize,
        w: scaledSize, h: scaledSize,
        onClick(state: GameState) {
            const job = getOrCreateJob(state, jobDefinition);
            job.workers = 0;
            return true;
        }
    });
    const minusButton = new MinusIconButton({
        x: scaledSize,
        y: scaledSize,
        w: scaledSize, h: scaledSize,
        onClick(state: GameState) {
            updateAssignedWorkers(state, jobDefinition, -1);
            return true;
        }
    });
    const plusButton = new PlusIconButton({
        x: w - 2 * scaledSize,
        y: scaledSize,
        w: scaledSize, h: scaledSize,
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
        x: w - scaledSize,
        y: scaledSize,
        w: scaledSize, h: scaledSize,
        onClick(state: GameState) {
            updateAssignedWorkers(state, jobDefinition, state.city.population);
            return true;
        },
        onHover(state: GameState) {
            showJobPreviewForPopulation(state, jobDefinition);
            return true;
        }
    });
    const repeatToggle = new RepeatToggle({
        x: w - 3 * scaledSize / 4, y: -scaledSize / 4,
        w: scaledSize, h: scaledSize,
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
        w, h: 2 * scaledSize, x, y,
        update(state: GameState) {
            if (getHeroTarget) {
                const job = getOrCreateJob(state, jobDefinition);
                job.getHeroTarget = getHeroTarget;
            }
            if (state.city.population) {
                this.h = 2 * scaledSize
            } else {
                this.h = scaledSize;
            }
        },
        render(context: CanvasRenderingContext2D, state: GameState) {
            context.save();
                context.translate(this.x, this.y);
                const job = getOrCreateJob(state, jobDefinition);
                if (isMouseOverTarget(state, this)) {
                    fillRect(context, pad({...this, x:0, y: 0, h: scaledSize}, 1 * scale), '#FFF');
                }
                fillRect(context, {...this, x:0, y: 0, h: scaledSize}, '#000');
                const label = computeValue(state, jobDefinition, jobDefinition.label, '???');
                const y = scaledSize / 2;
                const measurements = fillText(context, {text: label, x: this.w / 2, y: y + 1 * scale, size: scaledSize - 4 * scale, color: '#FFF', measure: true});
                if (measurements && jobDefinition.labelIcon) {
                    const x = this.w / 2 - measurements.width / 2 - 2 - jobDefinition.labelIcon.w;
                    drawFrame(context, jobDefinition.labelIcon, {...jobDefinition.labelIcon, x, y: y - jobDefinition.labelIcon.h / 2});
                }

                // Draw population controls only once the city has a population.
                if (state.city.population > 0) {
                    const totalSpots = getMaxWorkersForJob(state, job);
                    const availableWorkers = availableWorkersForJob(state, job);
                    // This is the number of spots that cannot be filled because workers or tools are busy in other jobs.
                    // We display this so that it is easy to see the limit of what can be assigned based on the available population
                    // while still showing the total possible if all workers could be assigned ot this job.
                    const reservedWorkers = Math.max(0, totalSpots - availableWorkers);
                    drawNumberFillBar(context, {
                        x: 2 * scaledSize, y: scaledSize, w: this.w - 4 * scaledSize, h: scaledSize,
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
                    fillRect(context, {x: 0, y: scaledSize - 1, w: Math.floor(this.w * p), h: 2}, '#0AF');
                    fillRect(context, {x: Math.ceil(this.w * p) - 1, y: scaledSize - 1, w: 1, h: 2}, '#8FF');
                }
            context.restore();
        },
        getChildren(state: GameState) {
            const buttons: UIElement[] = [repeatToggle];
            if (state.city.population) {
                buttons.push(emptyButton);
                buttons.push(minusButton);
                buttons.push(plusButton);
                buttons.push(maxButton);
            }
            return buttons;
        },
        onClick(state: GameState) {
            if (state.selectedHero && jobDefinition.applyHeroProgress) {
                state.selectedHero.assignedJob = getOrCreateJob(state, jobDefinition);
            }
            return true;
        },
        onHover(state: GameState) {
            showJobPreviewForHero(state, jobDefinition);
            return true;
        }
    };
}

function showJobPreviewForPopulation(state: GameState, jobDefinition: JobDefinition) {
    const job = getOrCreateJob(state, jobDefinition);
    const requirements: Requirements = {};
    // Always show job resource cost for repeated jobs.
    if (!job.isPaidFor || job.shouldRepeatJob) {
        if (jobDefinition.essenceCost) {
            const essenceCost = computeValue(state, jobDefinition, jobDefinition.essenceCost, 0);
            state.nexus.previewEssenceChange = -essenceCost;
            requirements.essenceCost = essenceCost;
        }
        if (jobDefinition.resourceCost) {
            requirements.resourceCost = computeResourceCost(state, jobDefinition, jobDefinition.resourceCost);
        }
    }
    if (jobDefinition.requiredToolType) {
        requirements.toolType = jobDefinition.requiredToolType;
    }
    showRequirementsTooltip(state, requirements);
}

function showJobPreviewForHero(state: GameState, jobDefinition: JobDefinition) {
    const job = getOrCreateJob(state, jobDefinition);
    const requirements: Requirements = {};
    // Always show job resource cost for repeated jobs.
    if (!job.isPaidFor || job.shouldRepeatJob) {
        if (jobDefinition.essenceCost) {
            const essenceCost = computeValue(state, jobDefinition, jobDefinition.essenceCost, 0);
            state.nexus.previewEssenceChange = -essenceCost;
            requirements.essenceCost = essenceCost;
        }
        if (jobDefinition.resourceCost) {
            requirements.resourceCost = computeResourceCost(state, jobDefinition, jobDefinition.resourceCost);
        }
    }
    showRequirementsTooltip(state, requirements);
}

