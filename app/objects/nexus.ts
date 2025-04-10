import {archerJobDefinition, updateArchers} from 'app/city/archers';
import {mageJobDefinition, updateMages} from 'app/city/mages';
import {renderRangeCircle} from 'app/draw/renderIndicator';
import {BuildingSite, CraftingBench} from 'app/objects/structure';
import {frameLength} from 'app/gameConstants';
import {drawFrameInCircle} from 'app/utils/animations';
import {fillCircle, fillText, renderGameStatus} from 'app/utils/draw';
import {gainEssence} from 'app/utils/essence';
import {summonHero} from 'app/utils/hero';
import {applyHeroToJob, getOrCreateJob} from 'app/utils/job';
import {getJobMultiplierFromTools} from 'app/utils/inventory';

export function createNexus(zone: ZoneInstance): Nexus {
    return {
        objectType: 'nexus',
        zone,
        x: 0,
        y: 0,
        r: 40,
        color: '#0FF',
        level: 1,
        deathCount: 0,
        essence: 100,
        essenceGrowth: 1,
        lostEssence: 0,
        lostEssenceTime: 0,
        gainedEssence: 0,
        gainedEssenceTime: 0,
        previewEssenceChange: 0,
        render(this: Nexus, context: CanvasRenderingContext2D, state: GameState) {
            fillCircle(context, this);
            if (this.essence <= 0){
                renderGameStatus(context, "nexus destroyed!");
            }
            if (state.city.wall.health > 0) {
                context.save();
                    context.beginPath();
                    context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
                    context.lineWidth = 3;
                    context.setLineDash([3, 3]);
                    context.strokeStyle = '#888';
                    context.stroke();
                context.restore();
            }

            if (state.city.archers.level > 0) {
                const archerJob = getOrCreateJob(state, archerJobDefinition);
                const jobMultiplier = getJobMultiplierFromTools(state, archerJob.workers, archerJob.definition.requiredToolType);
                const range = state.city.archers.range * (1 + jobMultiplier / 100 / 10);
                renderRangeCircle(context, {x: this.x, y: this.y, r: this.r + range, color: 'rgba(255, 255, 255, 0.4)'});
            }
            if (state.city.mages.level > 0) {
                const mageJob = getOrCreateJob(state, mageJobDefinition);
                const jobMultiplier = getJobMultiplierFromTools(state, mageJob.workers, mageJob.definition.requiredToolType);
                const range = state.city.mages.range * (1 + jobMultiplier / 100 / 10);
                renderRangeCircle(context, {x: this.x, y: this.y, r: this.r + range, color: 'rgba(255, 0, 200, 0.4)'});
            }
            if (!state.selectedHero && state.heroSlots.includes(undefined)) {
                fillText(context, {x: this.x, y: this.y - 10, size: 16, text: 'Summon', color: '#FFF'});
                fillText(context, {x: this.x, y: this.y + 10, size: 16, text: 'Champion', color: '#FFF'});
            }
        },
        update(state: GameState) {
            if (state.craftingBench.baseMaterialSlots.length) {
                let craftingBench = state.world.objects.find(object => object instanceof CraftingBench);
                if (!craftingBench) {
                    craftingBench = new CraftingBench({zone: this.zone, x: 0, y: 20});
                    craftingBench.x = -this.r + craftingBench.r;
                    state.world.objects.push(craftingBench);
                } else {
                    craftingBench.x = -this.r + craftingBench.r;
                }
            }
            if (state.discoveredItems.has('wood')) {
                let buildingSite = state.world.objects.find(object => object instanceof BuildingSite);
                if (!buildingSite) {
                    buildingSite = new BuildingSite({zone: this.zone, x: 0, y: 20});
                    buildingSite.x = this.r - buildingSite.r;
                    state.world.objects.push(buildingSite);
                } else {
                    buildingSite.x = this.r - buildingSite.r;
                }

            }
            // If we are tracking gained essence, remove it linearly for 1 second following the last time
            // essence was gained.
            if (this.gainedEssence) {
                const timeLeft = this.gainedEssenceTime + 1000 - state.world.time;
                if (timeLeft > 0) {
                    // Reduce essence by one frame if there is time remaining.
                    this.gainedEssence = this.gainedEssence * (timeLeft - frameLength) / timeLeft;
                } else {
                    // If there is no time remaining, just set gained essence to 0.
                    this.gainedEssence = 0;
                }
            }
            // If we are tracking lost essence, remove it linearly for 0.5 seconds after a second has passed.
            if (this.lostEssence) {
                const timeLeft = this.lostEssenceTime + 600 - state.world.time;
                // There is a short delay before depleting the lost essence section.
                if (timeLeft > 0 && timeLeft < 400) {
                    // Reduce essence by one frame if there is time remaining.
                    this.lostEssence = this.lostEssence * (timeLeft - frameLength) / timeLeft;
                } else if (timeLeft <= 0) {
                    // If there is no time remaining, just set gained essence to 0.
                    this.lostEssence = 0;
                }

            }

            // Since this is gained every frame we don't want to animate this change.
            gainEssence(state, this.essenceGrowth * frameLength / 1000, false);

            updateArchers(state);
            updateMages(state);
        },
        onHeroInteraction(state: GameState, hero: Hero) {
            if (hero.assignedJob) {
                applyHeroToJob(state, hero.assignedJob.definition, hero);
            }
        },
        getChildren: getNexusElements,
    };
}

function getNexusElements(this: Nexus, state: GameState): UIElement[] {
    const elements: UIElement[] = [];
    if (state.heroSlots.includes(undefined)) {
        for (let i = 0; i < state.availableHeroes.length; i++) {
            const hero = state.availableHeroes[i];
            /*for (const heroElement of (hero.getChildren?.(state) ?? [])) {
                elements.push(heroElement);
            }*/
            elements.push({
                objectType: 'uiButton',
                uniqueId: 'summonHero-' + i,
                x: hero.x - 15,
                y: hero.y - 15,
                w: 30,
                h: 30,
                onClick() {
                    summonHero(state, hero);
                    return true;
                },
                render(context: CanvasRenderingContext2D, state: GameState) {
                    const r = 15;
                    const circle = {x: this.x + r, y: this.y + r, r, color: '#000'};
                    fillCircle(context, circle);
                    drawFrameInCircle(context, {...circle, r: r - 2}, hero.definition.icon);
                },
            })
        }
    }
    return elements;
}


