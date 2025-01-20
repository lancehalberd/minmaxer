import {frameLength, uiSize} from 'app/gameConstants';
import {fillCircle, fillText} from 'app/utils/draw';
import {gainSkillExperience, getHeroSkill} from 'app/utils/hero';
import {createJobElement, applyHeroToJob, progressJob} from 'app/utils/job'

const loggingJobDefinition: JobDefinition = {
    key: 'harvestWood',
    label: 'Chop Wood',
    requiredToolType: 'axe',
    workerSeconds: 1,
    repeat: true,
    canProgress(state: GameState) {
        return state.availableResources.wood > 0
    },
    onComplete(state: GameState) {
        state.availableResources.wood--;
        state.totalResources.wood++;
        state.inventory.wood++;
    },
    applyHeroProgress(state: GameState, job: Job, hero: Hero) {
        const skill = getHeroSkill(state, hero, 'logging');
        const progress = (skill.level + 1) * frameLength / 1000;
        if (progressJob(state, job, progress)) {
            gainSkillExperience(state, hero, 'logging', frameLength / 1000);
        }
    },
};

interface ForestProps extends Partial<Structure> {
    wood: number
}
export class Forest implements Structure {
    objectType = <const>'structure';
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    r = this.props.r ?? 40;
    color = this.props.color ?? '#080';
    wood = this.props.wood;
    harvestJobElement = createJobElement(loggingJobDefinition, { x: this.x -2 * uiSize, y: this.y}, () => this);

    constructor(public props: ForestProps) {}
    update(state: GameState) {

    }
    onDiscover(state: GameState) {
        state.availableResources.wood += this.wood;
    }
    onHeroInteraction(state: GameState, hero: Hero) {
        applyHeroToJob(state, loggingJobDefinition, hero);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        fillText(context, {x: this.x, y: this.y - uiSize, size: 16, text: state.availableResources.wood, color: '#FFF'});
    }
    getChildren(state: GameState): UIElement[] {
        return [this.harvestJobElement];
    }
}

interface VillageProps extends Partial<Structure> {
    population: number
}
export class Village implements Structure {
    objectType = <const>'structure';
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    r = this.props.r ?? 30;
    color = this.props.color ?? '#888';
    originalPopulation = this.props.population;
    population = this.props.population;

    constructor(public props: VillageProps) {}
    update(state: GameState) {
        if (this.population && state.city.population < state.city.maxPopulation) {
            const chance = (1 - state.city.population / state.city.maxPopulation) * this.population / this.originalPopulation / 100;
            if (Math.random() < chance) {
                this.population--;
                state.city.population++;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        fillText(context, {x: this.x, y: this.y - uiSize, size: 16, text: this.population, color: '#FFF'});
    }
}
