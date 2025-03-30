import {battleRager, criticalShot, fireball, fortress, spinStrike, piercingShot} from 'app/definitions/heroAbilities';

export const heroDefinitions: {[key in HeroType]?: HeroDefinition} = {};

heroDefinitions.warrior = {
    name: 'Aragorn',
    heroType: 'warrior',
    coreState: 'str',
    startingLevel: 1,
    /*getStatsForLevel(level: number): HeroLevelDerivedStats {
        return {
            maxHealth: level * 20,
            damage: level * 2,
            movementSpeed: level * 2.5 + 97.5,
        };
    },*/
    attacksPerSecond: 2,
    attackRange: 10,
    color: 'red',
    radius: 10,
    cost: 50,
    abilities: [spinStrike, battleRager],
};

heroDefinitions.ranger = {
    name: 'Legolas',
    heroType: 'ranger',
    coreState: 'dex',
    startingLevel: 1,
    /*getStatsForLevel(level: number): HeroLevelDerivedStats {
        return {
            maxHealth: level * 18,
            damage: Math.floor(level * 2.1),
            movementSpeed: 1.1 * (level * 2.5 + 97.5),
        };
    },*/
    attacksPerSecond: 1.8,
    attackRange: 50,
    color: 'green',
    radius: 10,
    cost: 50,
    abilities: [piercingShot, criticalShot],
};

heroDefinitions.wizard = {
    name: 'Gandalf',
    heroType: 'wizard',
    coreState: 'int',
    startingLevel: 1,
    /*getStatsForLevel(level: number): HeroLevelDerivedStats {
        return {
            maxHealth: level * 15,
            damage: Math.floor(level * 4),
            movementSpeed: 0.9 * (level * 2.5 + 97.5),
        };
    },*/
    attacksPerSecond: 1.2,
    attackRange: 35,
    color: 'blue',
    radius: 10,
    cost: 50,
    abilities: [fireball, fortress],
};
