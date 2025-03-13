import {createAnimation, drawFrame} from 'app/utils/animations';
import {groupHeal, poisonSpit, slam} from 'app/definitions/enemyAbilities';

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

function renderSimpleEnemy(context: CanvasRenderingContext2D, enemy: Enemy, frame: Frame) {
    drawFrame(context, frame, {...frame, x: enemy.x - frame.w / 2, y: enemy.y - frame.h / 2});
}


const [/*snakeGreenLeftFrame*/, /*snakeGreenDownFrame*/, snakeGreenUpFrame] = createAnimation('gfx/enemies/snek.png', {w: 18, h: 18}, {cols: 3}).frames;
const [/*snakeYellowLeftFrame*/, /*snakeYellowDownFrame*/, snakeYellowUpFrame] = createAnimation('gfx/enemies/snekStorm.png', {w: 18, h: 18}, {cols: 3}).frames;

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
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        renderSimpleEnemy(context, enemy, snakeGreenUpFrame);
    },
    aggroRadius: 150,
};

enemyDefinitions.cobra = {
    name: 'Cobra',
    color: '#0F0',
    r: 6,
    abilities: [poisonSpit],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            attacksPerSecond: baseStats.attacksPerSecond * 1.2,
        };
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        renderSimpleEnemy(context, enemy, snakeYellowUpFrame);
    },
    aggroRadius: 150,
};

enemyDefinitions.kobold = {
    name: 'Kobold',
    color: 'red',
    r: 9,
    getStatsForLevel: getBasicEnemyStatsForLevel,
    aggroRadius: 150,
};

enemyDefinitions.koboldCleric = {
    name: 'Kobold',
    color: 'purple',
    r: 12,
    abilities: [groupHeal],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (baseStats.maxHealth * 1.2) | 0,
            attacksPerSecond: baseStats.attacksPerSecond * 0.8,
        };
    },
    aggroRadius: 150,
};

enemyDefinitions.mummy = {
    name: 'The Mummy',
    color: 'white',
    r: 20,
    abilities: [slam],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (100 * baseStats.maxHealth) | 0,
            damage: (5 * baseStats.damage) | 0,
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
