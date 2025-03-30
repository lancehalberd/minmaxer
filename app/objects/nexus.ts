import {archerJobElement, updateArchers} from 'app/city/archers';
import {healerJobElement} from 'app/city/healer';
import {buildWallElement, repairWallElement, upgradeWallElement} from 'app/city/cityWall';
import {CraftingBench} from 'app/objects/structure';
import {frameLength} from 'app/gameConstants';
import {fillCircle, renderGameStatus} from 'app/utils/draw';
import {gainEssence} from 'app/utils/essence';
import {applyHeroToJob, isJobDiscovered} from 'app/utils/job';

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

        },
        update(state: GameState) {
            if (state.craftingBench.baseMaterialSlots.length) {
                let craftingBench = state.world.objects.find(object => object instanceof CraftingBench);
                if (!craftingBench) {
                    craftingBench = new CraftingBench({zone: this.zone, x: 0, y: 0});
                    craftingBench.y = this.r - craftingBench.r + 10;
                    state.world.objects.push(craftingBench);
                } else {
                    craftingBench.y = this.r - craftingBench.r + 10;
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
        for (const hero of state.availableHeroes) {
            for (const heroElement of (hero.getChildren?.(state) ?? [])) {
                elements.push(heroElement);
            }
        }
    }
    for (const wallElement of [buildWallElement, repairWallElement, upgradeWallElement]) {
        const definition = wallElement.jobDefinition;
         if (!definition.isValid || definition.isValid(state)) {
             elements.push(wallElement);
         }
    }

    // Archers and healers occupy the city wall.
    if (state.city.wall.level && isJobDiscovered(state, archerJobElement.jobDefinition)) {
        elements.push(archerJobElement);
    }
    if (state.city.wall.level && isJobDiscovered(state, healerJobElement.jobDefinition)) {
        elements.push(healerJobElement);
    }
    return elements;
}


