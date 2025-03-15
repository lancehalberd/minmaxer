import {createEnemy} from 'app/objects/enemy';
import {Cave, HealingPool} from 'app/objects/structure';

const spawns = <const>[
    {type: 'snake', level: 1},
    {type: 'snake', level: 2},
    {type: 'cobra', level: 4},
    {type: 'snake', level: 6},
    {type: 'snake', level: 8},
    {type: 'cobra', level: 10},
];

const bigRadius = 300, smallRadius = 60, packSize = 5;
export const snakePit: ZoneDefinition = {
    name: 'Snake Pit',
    floorColor: '#666',
    initialize(state: GameState, zone: ZoneInstance) {
        // Add the exit to the zone.
        zone.objects.push(new Cave({zone, x: 0, y: 0}));
        zone.objects.push(new HealingPool({zone, x: 0, y: -bigRadius}));
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
                zone.objects.push(enemy);
            }
        }
    }
} 
