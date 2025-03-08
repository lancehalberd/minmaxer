import {createEnemy} from 'app/objects/enemy';
import {Cave, HealingPool} from 'app/objects/structure';

const spawns = <const>[
    {type: 'snake', level: 1},
    {type: 'snake', level: 2},
    {type: 'cobra', level: 4},
    {type: 'snake', level: 8}
];

export const snakePit: ZoneDefinition = {
    name: 'Snake Pit',
    floorColor: '#666',
    initialize(state: GameState, zone: ZoneInstance) {
        // Add the exit to the zone.
        zone.objects.push(new Cave({zone, x: 0, y: 0}));
        zone.objects.push(new HealingPool({zone, x: 0, y: -300}));
        let r = 180;
        for (const {type, level} of spawns) {
            for (let i = 0; i < 8; i++) {
                const theta = 2 * Math.PI * i / 8 + Math.PI / 16 * (i % 2);
                const enemy: Enemy = createEnemy(type, level, {zone, x: r * Math.cos(theta), y: r * Math.sin(theta)});
                zone.objects.push(enemy);
            }
            r += 90;
        }
    }
} 
