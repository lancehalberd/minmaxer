import {addHealEffectToTarget} from 'app/effects/healAnimation';
import {frameLength, uiSize} from 'app/gameConstants';
import {toggleCraftingBenchPanel} from 'app/ui/craftingBenchPanel';
import {createJobComponent} from 'app/ui/jobComponent';
import {drawFrame, requireFrame} from 'app/utils/animations';
import {fillCircle, fillText} from 'app/utils/draw';
import {gainSkillExperience, getHeroSkill} from 'app/utils/hero';
import {applyHeroToJob, progressJob} from 'app/utils/job'
import {gainLoot, rollLoot} from 'app/utils/lootPool'
import {followCameraTarget, removeFieldObject} from 'app/utils/world';


const treeFrame = requireFrame('gfx/world/tree.png', {x: 0, y: 0, w: 80, h: 76});

interface StructureProps extends Partial<Structure> {
    x: number
    y: number
    zone: ZoneInstance
}

interface ForestProps extends StructureProps {
    jobKey: string
    wood: number
    drops: WeightedDrop[]
}
export class Forest implements Structure {
    objectType = <const>'structure';
    zone = this.props.zone;
    x = this.props.x;
    y = this.props.y;
    r = this.props.r ?? 40;
    color = this.props.color ?? '#080';
    drops = this.props.drops;
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
            gainLoot(state, rollLoot(this.drops), this);
            this.wood--;
            //state.discoveredItems.add('wood');
            //state.inventory.wood = (state.inventory.wood ?? 0) + 1;
        },
        applyHeroProgress(state: GameState, job: Job, hero: Hero) {
            const skill = getHeroSkill(state, hero, 'logging');
            const progress = (skill.level + 1) * frameLength / 1000;
            if (progressJob(state, job, progress)) {
                gainSkillExperience(state, hero, 'logging', frameLength / 1000);
            }
        },
    };
    jobElement = createJobComponent({jobDefinition: this.jobDefinition, x: this.x - 2 * uiSize, y: this.y, getHeroTarget: () => this});


    constructor(public props: ForestProps) {}
    update(state: GameState) {
        this.jobElement.zone = this.zone;
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

interface QuaryProps extends StructureProps {
    jobKey: string
    stone: number
    drops: WeightedDrop[]
}
export class Quary implements Structure {
    objectType = <const>'structure';
    zone = this.props.zone;
    x = this.props.x;
    y = this.props.y;
    r = this.props.r ?? 40;
    jobKey = this.props.jobKey;
    color = this.props.color ?? '#888';
    drops = this.props.drops;
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
        isValid: (state: GameState) => {
            return this.stone > 0
        },
        onComplete: (state: GameState) => {
            gainLoot(state, rollLoot(this.drops), this);
            this.stone--;
            //state.discoveredItems.add('stone');
            //state.inventory.stone = (state.inventory.stone ?? 0) + 1;
        },
        applyHeroProgress(state: GameState, job: Job, hero: Hero) {
            const skill = getHeroSkill(state, hero, 'mining');
            const progress = (skill.level + 1) * frameLength / 1000;
            if (progressJob(state, job, progress)) {
                gainSkillExperience(state, hero, 'mining', frameLength / 1000);
            }
        },
    };
    jobElement = createJobComponent({jobDefinition: this.jobDefinition, x: this.x - 2 * uiSize, y: this.y, getHeroTarget: () => this});

    constructor(public props: QuaryProps) {}
    update(state: GameState) {}
    onHeroInteraction(state: GameState, hero: Hero) {
        applyHeroToJob(state, this.jobDefinition, hero);
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
    }
    getChildren(state: GameState): UIElement[] {
        return this.stone > 0 ? [this.jobElement] : [];
    }
}

interface VillageProps extends StructureProps {
    population: number
}
export class Village implements Structure {
    objectType = <const>'structure';
    zone = this.props.zone;
    x = this.props.x;
    y = this.props.y;
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

interface CaveProps extends StructureProps {
    // If this is not set it functions as an exit, returning the
    // hero to the containing zone/overworld.
    zoneDefinition?: ZoneDefinition
    exitToOverworld?: boolean
}
export class Cave implements Structure {
    objectType = <const>'structure';
    zone = this.props.zone;
    x = this.props.x;
    y = this.props.y;
    r = this.props.r ?? 20;
    color = this.props.color ?? '#999';
    zoneDefinition = this.props.zoneDefinition;
    exitToOverworld = this.props.exitToOverworld;

    constructor(public props: CaveProps) {}
    onHeroInteraction(state: GameState, hero: Hero) {
        if (this.exitToOverworld && hero.zone.overworldExit) {
            enterZone(state, hero.zone.overworldExit, hero);
        } else if (!this.zoneDefinition && hero.zone.exit) {
            enterZone(state, hero.zone.exit, hero);
        } else if (this.zoneDefinition) {
           enterNewZoneInstance(state, this.zoneDefinition, {x: hero.x, y: hero.y, zone: hero.zone}, hero);
        }
    }
    update(state: GameState) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        fillCircle(context, {...this, r: this.r -5, color: '#000'});
        const text = this.zoneDefinition?.name ?? 'Exit';
        fillText(context, {x: this.x, y: this.y + this.r - 16, size: 16, text, color: '#FFF'});
    }
}

function enterNewZoneInstance(state: GameState, definition: ZoneDefinition, exit: ZoneLocation, hero: Hero) {
    const newZone: ZoneInstance = {
        name: definition.name,
        floorColor: definition.floorColor,
        definition,
        time: 0,
        effects: [],
        objects: [],
        zoneEnemyCooldowns: new Map(),
        exit,
        overworldExit: hero.zone.overworldExit ?? exit,
    };
    definition.initialize(state, newZone);
    enterZone(state, {x: 0, y: 25, zone: newZone}, hero);
}

function enterZone(state: GameState, {zone, x, y}: ZoneLocation, hero: Hero) {
    removeFieldObject(state, hero);
    // TODO: Cleanup sub-zones with no heroes to avoid possible memory leaks by removing all objects from the zones.
    hero.zone = zone;
    hero.x = x;
    hero.y = y;
    hero.zone.objects.push(hero);
    delete hero.movementTarget;
    delete hero.attackTarget;
    // Each zone has its own timer so make sure lastAttackTime is set to a reasonable value for the zone.
    hero.lastAttackTime = zone.time;
    hero.lastTimeDamageTaken = zone.time;
    if (hero === state.selectedHero) {
        followCameraTarget(state, hero);
    }
}

export class HealingPool implements Structure {
    objectType = <const>'structure';
    zone = this.props.zone;
    x = this.props.x;
    y = this.props.y;
    r = this.props.r ?? 20;
    color = 'rgba(0, 0, 0, 0.5)';
    zoneDefinition = this.props.zoneDefinition;
    cooldown = 0;

    constructor(public props: CaveProps) {}
    onHeroInteraction(state: GameState, hero: Hero) {
       if (this.cooldown <= 0 && hero.health < hero.getMaxHealth(state)) {
           hero.health = hero.getMaxHealth(state);
           addHealEffectToTarget(state, hero);
           this.cooldown = 30000;
       }
       delete hero.movementTarget;
    }
    update(state: GameState) {
        if (this.cooldown > 0) {
            this.cooldown -= frameLength;
        }
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        if (this.cooldown <= 0) {
            fillCircle(context, {...this, r: this.r -5, color: '#08F'});
            fillText(context, {x: this.x, y: this.y + this.r - 16, size: 16, text: 'Heal', color: '#FFF'});
        }
    }
}

export class CraftingBench implements Structure {
    objectType = <const>'structure';
    zone = this.props.zone;
    x = this.props.x;
    y = this.props.y;
    r = this.props.r ?? 20;
    color = this.props.color ?? '#999';

    constructor(public props: StructureProps) {}
    onHeroInteraction(state: GameState, hero: Hero) {
        toggleCraftingBenchPanel(state, true);
        delete hero.movementTarget;
    }
    onClick(state: GameState) {
        toggleCraftingBenchPanel(state, true);
        return true;
    }
    update(state: GameState) {}
    render(context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        fillCircle(context, {...this, r: this.r -5, color: '#000'});
        fillText(context, {x: this.x, y: this.y + this.r - 16, size: 16, text: 'Craft', color: '#FFF'});
    }
}
