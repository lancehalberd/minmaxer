import {frameLength, uiSize} from 'app/gameConstants';
import {drawFrame, requireFrame} from 'app/utils/animations';
import {fillCircle, fillText} from 'app/utils/draw';
import {gainSkillExperience, getHeroSkill} from 'app/utils/hero';
import {applyHeroToJob, progressJob} from 'app/utils/job'
import {createJobComponent} from 'app/ui/jobComponent';

const treeFrame = requireFrame('gfx/world/tree.png', {x: 0, y: 0, w: 80, h: 76});

interface ForestProps extends Partial<Structure> {
    jobKey: string
    wood: number
}
export class Forest implements Structure {
    objectType = <const>'structure';
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    r = this.props.r ?? 40;
    color = this.props.color ?? '#080';
    wood = this.props.wood;
    jobDefinition: JobDefinition = {
        key: this.props.jobKey,
        label: () => 'Wood: ' + this.wood,
        requiredToolType: 'axe',
        workerSeconds: 1,
        repeat: true,
        canProgress: (state: GameState) => {
            return this.wood > 0
        },
        isValid: (state: GameState) => {
            return this.wood > 0
        },
        onComplete: (state: GameState) => {
            this.wood--;
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
    jobElement = createJobComponent(this.jobDefinition, { x: this.x -2 * uiSize, y: this.y}, () => this);

    constructor(public props: ForestProps) {}
    update(state: GameState) {

    }
    onHeroInteraction(state: GameState, hero: Hero) {
        applyHeroToJob(state, this.jobDefinition, hero);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        //fillCircle(context, this);
        if (2 * this.r > treeFrame.w) {
            const scale = Math.floor(2 * this.r / treeFrame.w)
            const w = scale * treeFrame.w, h = scale * treeFrame.h;
            drawFrame(context, treeFrame, {w, h, x: this.x - w / 2, y: this.y - h / 2});
        } else {
            const scale = Math.ceil(treeFrame.w / 2 / this.r);
            const w = treeFrame.w / scale, h = treeFrame.h / scale;
            drawFrame(context, treeFrame, {w, h, x: this.x - w / 2, y: this.y - h / 2});
        }
    }
    getChildren(state: GameState): UIElement[] {
        return this.wood > 0 ? [this.jobElement] : [];
    }
}

interface QuaryProps extends Partial<Structure> {
    jobKey: string
    stone: number
}
export class Quary implements Structure {
    objectType = <const>'structure';
    x = this.props.x ?? 0;
    y = this.props.y ?? 0;
    r = this.props.r ?? 40;
    jobKey = this.props.jobKey;
    color = this.props.color ?? '#888';
    stone = this.props.stone;
    jobDefinition: JobDefinition = {
        key: this.jobKey,
        label: () => 'Stone: ' + this.stone,
        requiredToolType: 'pickaxe',
        workerSeconds: 5,
        repeat: true,
        canProgress: (state: GameState) => {
            return this.stone > 0;
        },
        onComplete: (state: GameState) => {
            this.stone--;
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
    harvestJobElement = createJobComponent(this.jobDefinition, { x: this.x -2 * uiSize, y: this.y}, () => this);

    constructor(public props: QuaryProps) {}
    update(state: GameState) {

    }
    onHeroInteraction(state: GameState, hero: Hero) {
        applyHeroToJob(state, this.jobDefinition, hero);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
    }
    getChildren(state: GameState): UIElement[] {
        return this.stone > 0 ? [this.harvestJobElement] : [];
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
