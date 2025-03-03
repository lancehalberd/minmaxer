export const enemyDefinitions: {[key in EnemyType]?: EnemyDefinition} = {};

function getBasicEnemyStatsForLevel(level: number): EnemyLevelDerivedStats {
    return {
        maxHealth: (level * 5 * (1.1 ** level)) | 0,
        damage: (level * (1.1 ** level)) | 0,
        attacksPerSecond: 1,
        attackRange: 5,
        experienceWorth: 2 * level,
        essenceWorth: level,
        movementSpeed: 50,
    };
}

enemyDefinitions.snake = {
    name: 'Snake',
    color: 'green',
    r: 6,
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (baseStats.maxHealth * 0.8) | 0,
            attacksPerSecond: baseStats.attacksPerSecond * 1.2,
        };
    },
    aggroRadius: 150,
};

enemyDefinitions.cobra = {
    name: 'Cobra',
    color: '#0F0',
    r: 6,
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            attacksPerSecond: baseStats.attacksPerSecond * 1.2,
            attackRange: 30,
        };
    },
    aggroRadius: 150,
};

enemyDefinitions.kobold = {
    name: 'Kobold',
    color: 'red',
    r: 10,
    getStatsForLevel: getBasicEnemyStatsForLevel,
    aggroRadius: 150,
};

enemyDefinitions.mummy = {
    name: 'The Mummy',
    color: 'white',
    r: 20,
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (100 * baseStats.maxHealth) | 0,
            damage: (10 * baseStats.damage) | 0,
            attacksPerSecond: 0.5 * baseStats.attacksPerSecond,
            attackRange: 10,
            movementSpeed: 5,
        };
    },
    aggroRadius: 200,
    isBoss: true,
};

/*
Add first boss encounter
    Maybe AOE attacks with warnings on 10s cooldown. (hurts heroe(s))
*/
