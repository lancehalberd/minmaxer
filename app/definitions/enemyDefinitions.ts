export const enemyDefinitions: {[key in EnemyType]?: EnemyDefinition} = {};

enemyDefinitions.snake = {
    name: 'Snake',
    color: 'red',
    r: 10, x: 0, y: 0,
    level: 1,
    health: 4,
    maxHealth: 4,
    damage: 1,
    attacksPerSecond: 1,
    attackRange: 5,
    experienceWorth: 2,
    essence: 1,
    movementSpeed: 50,
    aggroRadius: 200,
};
