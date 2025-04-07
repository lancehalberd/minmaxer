import {createEnemy} from 'app/objects/enemy';
import {Cave, Forest} from 'app/objects/structure';
import {forestLootPool} from 'app/utils/lootPool';


// TODO: Fix loot pool rarity:
// Update loot pool to have a set 1e9 weight, and consume weight using rarest items first.
// Once a set of items would exceed the weight limit, they are assigned as a single pool to the remaining weight (so slightly reduced chance).
// This means at high rarity multipliers, the most common items may be eliminated from the pool, but the chance for the rarest items will always be
// as close as possible to baseRarity * rarityMultiplier.

const spawns = <const>[
    {type: 'snake', level: 1},
    {type: 'snake', level: 1},
    {type: 'snake', level: 2},
    {type: 'snake', level: 2},
    {type: 'cobra', level: 2},
];

const bigRadius = 300, smallRadius = 60, packSize = 5;
export const snakeWoods: ZoneDefinition = {
    name: 'Woods',
    floorColor: '#4A4',
    initialize(state: GameState, zone: ZoneInstance) {
        // Add the exit to the zone.
        zone.objects.push(new Cave({zone, x: 0, y: 0}));
        // zone.objects.push(new HealingPool({zone, x: 0, y: -bigRadius}));
        for (let j = 0; j < spawns.length; j++) {
            const {type, level} = spawns[j];
            const bigTheta = -Math.PI / 6 + 1.5 * Math.PI * j / spawns.length;
            const cx = bigRadius * Math.cos(bigTheta);
            const cy = -bigRadius * Math.sin(bigTheta) - bigRadius;
            const aggroPack: Enemy[] = [];
            for (let i = 0; i < packSize; i++) {
                const theta = 2 * Math.PI * i / packSize + Math.PI / 16 * (j % 2);
                const enemy: Enemy = createEnemy(type, level, {zone, x: cx + smallRadius * Math.cos(theta), y: cy + smallRadius * Math.sin(theta)});
                enemy.aggroPack = aggroPack;
                aggroPack.push(enemy);
            }
            if (j === spawns.length - 1) {
                const boss: Enemy = createEnemy('medusa', level, {zone, x: cx, y: cy});
                boss.aggroPack = aggroPack;
                aggroPack.push(boss);
            } else {
                let rarity = 1 + Math.floor(Math.random() * 10);
                while (Math.random() < 0.5) {
                    rarity += 10;
                }
                const wood = Math.max(1, Math.floor(100 / rarity));
                const forest = new Forest({
                    structureId: 'snakeForest-' + j,
                    r: 40, wood,
                    drops: forestLootPool(state, level, rarity),
                    zone, x: cx, y: cy,
                    difficulty: rarity,
                    canUsePopulation: false,
                });
                zone.objects.push(forest);
            }
        }
    }
} 
