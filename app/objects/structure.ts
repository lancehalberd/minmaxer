import {frameLength, uiSize} from 'app/gameConstants';
import {fillCircle, fillText} from 'app/utils/draw';
import {gainSkillExperience, getHeroSkill} from 'app/utils/hero';
import {applyHeroToJob, progressJob} from 'app/utils/job'
import {createJobComponent} from 'app/ui/jobComponent';

const loggingJobDefinition: JobDefinition = {
    key: 'harvestWood',
    label: 'Chop Wood',
    requiredToolType: 'axe',
    workerSeconds: 1,
    repeat: true,
    canProgress(state: GameState) {
        return (state.availableResources.wood ?? 0) > 0
    },
    onComplete(state: GameState) {
        state.availableResources.wood--;
        state.discoveredItems.add('wood');
        state.inventory.wood = (state.inventory.wood ?? 0) + 1;
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
    harvestJobElement = createJobComponent(loggingJobDefinition, { x: this.x -2 * uiSize, y: this.y}, () => this);

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
        // Currently all forests let you harvest all wood, so when they are freed we show all avaiable wood,
        // but before they are freed it is interesting to see how much wood will be added on freeing them.
        const value = state.world.objects.includes(this) ? state.availableResources.wood : this.wood;
        fillText(context, {x: this.x, y: this.y - uiSize, size: 16, text: value, color: '#FFF'});
    }
    getChildren(state: GameState): UIElement[] {
        return [this.harvestJobElement];
    }
}

const quaryJobDefinition: JobDefinition = {
    key: 'harvestStone',
    label: 'Mine Stone',
    requiredToolType: 'pickaxe',
    workerSeconds: 5,
    repeat: true,
    canProgress(state: GameState) {
        return state.availableResources.stone > 0;
    },
    onComplete(state: GameState) {
        state.availableResources.stone--;
        state.discoveredItems.add('stone');
        state.inventory.stone = (state.inventory.stone ?? 0) + 1;
    },
    applyHeroProgress(state: GameState, job: Job, hero: Hero) {
        const skill = getHeroSkill(state, hero, 'mining');
        const progress = (skill.level + 1) * frameLength / 1000;
        if (progressJob(state, job, progress)) {
            gainSkillExperience(state, hero, 'mining', frameLength / 1000);
        }
    },
};

interface QuaryProps extends Partial<Structure> {
    stone: number
}
export class Quary implements Structure {
    objectType = <const>'structure';
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    r = this.props.r ?? 40;
    color = this.props.color ?? '#888';
    stone = this.props.stone;
    harvestJobElement = createJobComponent(quaryJobDefinition, { x: this.x -2 * uiSize, y: this.y}, () => this);

    constructor(public props: QuaryProps) {}
    update(state: GameState) {

    }
    onDiscover(state: GameState) {
        state.availableResources.stone += this.stone;
    }
    onHeroInteraction(state: GameState, hero: Hero) {
        applyHeroToJob(state, quaryJobDefinition, hero);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        // Currently all forests let you harvest all wood, so when they are freed we show all avaiable wood,
        // but before they are freed it is interesting to see how much wood will be added on freeing them.
        const value = state.world.objects.includes(this) ? state.availableResources.stone : this.stone;
        fillText(context, {x: this.x, y: this.y - uiSize, size: 16, text: value, color: '#FFF'});
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
    color = this.props.color ?? '#860';
    originalPopulation = this.props.population;
    population = this.props.population;

    constructor(public props: VillageProps) {}
    update(state: GameState) {
        if (this.population && state.city.population < state.city.maxPopulation) {
            const chance = (1 - state.city.population / state.city.maxPopulation) * this.population / this.originalPopulation / 100;
            if (Math.random() < chance) {
                this.population--;
                state.city.population++;
                state.city.idlePopulation++;
            }
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        fillText(context, {x: this.x, y: this.y - uiSize, size: 16, text: this.population, color: '#FFF'});
    }
}
