export const enemyDefinitions: {[key in EnemyType]?: EnemyDefinition} = {};

function createEnemyDefinition(name: string, level: number): EnemyDefinition {
    return {
        name,
        level,
        color: 'red',
        r: 10, x: 0, y: 0,
        maxHealth: (4 * level * (1.1 ** level)) | 0,
        damage: 3 * (level * (1.1 ** level)) | 0,
        attacksPerSecond: 1 + level / 100,
        attackRange: 5,
        experienceWorth: 2 * level,
        essenceWorth: level,
        movementSpeed: 50,
        aggroRadius: 200,
    };
}

enemyDefinitions.snake = {
    name: 'Snake',
    color: 'red',
    r: 10, x: 0, y: 0,
    level: 1,
    maxHealth: 4,
    damage: 1,
    attacksPerSecond: 1,
    attackRange: 5,
    experienceWorth: 2,
    essenceWorth: 1,
    movementSpeed: 50,
    aggroRadius: 200,
};

enemyDefinitions.kobold = createEnemyDefinition('Kobold', 2);
