import {createEnemy} from 'app/objects/enemy';
import {Cave, HealingPool} from 'app/objects/structure';


const bigRadius = 100, smallRadius = 60;
interface BossGauntletZoneDefinitionProps extends Partial<ZoneDefinition> {
    enemies: {type: EnemyType, level: number}[]
    floor: number
}
class BossGauntletZoneDefinition implements ZoneDefinition {
    name = 'Gauntlet';
    floorColor = this.props.floorColor ?? '#BF4';
    enemies = this.props.enemies;
    floor = this.props.floor;
    constructor(public props: BossGauntletZoneDefinitionProps) {}
    initialize(state: GameState, zone: ZoneInstance) {
        // Add the exit to the zone.
        zone.objects.push(new Cave({zone, exitToOverworld: true, x: 0, y: 0}));
        zone.objects.push(new HealingPool({zone, x: 0, y: -bigRadius}));
        const cx = 0;
        const cy = -2 * bigRadius;
        const aggroPack: Enemy[] = [];
        for (let i = 0; i < this.enemies.length; i++) {
            const {type, level} = this.enemies[i];
            const theta = 2 * Math.PI * i / this.enemies.length;
            const enemy: Enemy = createEnemy(type, level, {zone, x: cx + smallRadius * Math.cos(theta), y: cy + smallRadius * Math.sin(theta)});
            enemy.aggroPack = aggroPack;
            aggroPack.push(enemy);
            zone.objects.push(enemy);
        }
        const nextZoneDefinition = bossGauntletZones[this.floor + 1];
        if (nextZoneDefinition) {
            zone.objects.push(new Cave({zone, zoneDefinition: nextZoneDefinition, x: 0, y: 100}));
        }
    }
}

export const bossGauntletZones = [
    new BossGauntletZoneDefinition({floor: 0, enemies: [{type: 'mummy', level: 5}]}),
    new BossGauntletZoneDefinition({floor: 1, enemies: [{type: 'medusa', level: 10}]}),
    new BossGauntletZoneDefinition({floor: 2, enemies: [{type: 'mummy', level: 15}, {type: 'medusa', level: 15}]}),
    new BossGauntletZoneDefinition({floor: 3, enemies: [{type: 'mummy', level: 20}]}),
    new BossGauntletZoneDefinition({floor: 4, enemies: [{type: 'medusa', level: 30}]}),
    new BossGauntletZoneDefinition({floor: 5, enemies: [{type: 'mummy', level: 50}, {type: 'medusa', level: 50}]}),
];
