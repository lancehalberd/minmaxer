
import {groupHeal, piercingShot, poisonSpit, stunningSlam} from 'app/definitions/enemyAbilities';
import {enemyDefinitions} from 'app/definitions/enemyDefinitionsHash';
import {createAnimation, drawFrameInCircle, getFrame} from 'app/utils/animations';
import {commonLegendaryItems, enemyLootPoolfFromKeys} from 'app/utils/lootPool'

export function getBasicEnemyStatsForLevel(level: number): EnemyLevelDerivedStats {
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

const [/*snakeGreenLeftFrame*/, /*snakeGreenDownFrame*/, snakeGreenUpFrame] = createAnimation('gfx/enemies/snek.png', {w: 18, h: 18}, {cols: 3}).frames;
const [/*snakeYellowLeftFrame*/, /*snakeYellowDownFrame*/, snakeYellowUpFrame] = createAnimation('gfx/enemies/snekStorm.png', {w: 18, h: 18}, {cols: 3}).frames;



const baseAggroRadius = 150;

enemyDefinitions.snake = {
    name: 'Snake',
    color: 'green',
    r: 8,
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (baseStats.maxHealth * 0.8) | 0,
            attacksPerSecond: baseStats.attacksPerSecond * 1.2,
        };
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        drawFrameInCircle(context, enemy, snakeGreenUpFrame);
    },
    aggroRadius: baseAggroRadius,
    getLootPool: enemyLootPoolfFromKeys(['scales', 'largeScales', 'chippedEmerald', 'fang', 'snakeFang', 'hardScales', 'emerald', 'flawlessEmerald', ...commonLegendaryItems]),
};

enemyDefinitions.cobra = {
    name: 'Cobra',
    color: '#0F0',
    r: 8,
    abilities: [poisonSpit],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            attacksPerSecond: baseStats.attacksPerSecond * 1.2,
        };
    },
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        drawFrameInCircle(context, enemy, snakeYellowUpFrame);
    },
    aggroRadius: baseAggroRadius,
    lootChance: 0.15,
    getLootPool: enemyLootPoolfFromKeys(['scales', 'largeScales', 'chippedEmerald', 'fang', 'snakeFang', 'hardScales', 'emerald', 'flawlessEmerald', ...commonLegendaryItems]),
};

enemyDefinitions.kobold = {
    name: 'Kobold',
    color: 'red',
    r: 9,
    getStatsForLevel: getBasicEnemyStatsForLevel,
    aggroRadius: baseAggroRadius,
    getLootPool: enemyLootPoolfFromKeys([
        'leatherStrap', 'leather', 'fineLeather',
        'woodHammer','stoneHammer',
        'woodHatchet','stoneAxe',
        'chippedRuby', 'ruby', 'flawlessRuby',
        ...commonLegendaryItems,
    ],[
        'ironHammer', 'ironHatchet',
        'steelHammer', 'steelAxe',
    ]),
};


enemyDefinitions.koboldArcher = {
    name: 'Kobold Archer',
    color: 'orange',
    r: 9,
    abilities: [piercingShot],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (baseStats.maxHealth * 0.8) | 0,
            attacksPerSecond: baseStats.attacksPerSecond * 0.8,
            attackRange: 40,
        };
    },
    lootChance: 0.15,
    getLootPool: enemyLootPoolfFromKeys([
        'leatherStrap', 'leather', 'fineLeather',
        'shortBow', 'longBow',
        'chippedEmerald', 'emerald', 'flawlessEmerald',
        ...commonLegendaryItems,
    ],[
         'crossbow',

    ]),
    aggroRadius: baseAggroRadius,
};

enemyDefinitions.koboldCleric = {
    name: 'Kobold Cleric',
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
    lootChance: 0.15,
    getLootPool: enemyLootPoolfFromKeys([
        'leatherStrap', 'leather','fineLeather',
        'woodStaff',
        'chippedSapphire', 'sapphire', 'flawlessSapphire',
        ...commonLegendaryItems,
    ],[
        'bronzeStaff', 'steelStaff',
    ]),
    aggroRadius: baseAggroRadius,
};

enemyDefinitions.mummy = {
    name: 'The Mummy',
    color: 'white',
    r: 20,
    abilities: [stunningSlam],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (100 * baseStats.maxHealth) | 0,
            attacksPerSecond: 0.5 * baseStats.attacksPerSecond,
            attackRange: 10,
            movementSpeed: 5,
        };
    },
    lootChance: 3.5,
    getLootPool: enemyLootPoolfFromKeys([
        'chippedEmerald', 'chippedRuby', 'chippedSapphire',
        'emeraldRing', 'rubyRing', 'sapphireRing', 'lionPelt', 'bearSkin',
        'emeraldBracelet', 'rubyBracelet', 'sapphireBracelet',
        'emeraldNecklace', 'rubyNecklace', 'sapphireNecklace',
        'flawlessEmerald', 'flawlessRuby', 'flawlessSapphire',
    ], ['ankh']),
    aggroRadius: 200,
    isBoss: true,
};


const flyingBeetleAnimation = createAnimation('gfx/enemies/flyingBeetle.png', {w: 22, h: 18}, {cols: 4});
enemyDefinitions.flyingBeetle = {
    name: 'Flying Beetle',
    r: 12,
    abilities: [],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (baseStats.maxHealth * 0.8) | 0,
            attacksPerSecond: baseStats.attacksPerSecond * 1.25,
            damage: (baseStats.damage * 0.8) | 0,
            movementSpeed: baseStats.movementSpeed * 1.5,
        };
    },
    lootChance: 0.1,
    getLootPool: enemyLootPoolfFromKeys(['claw', 'brokenShell', 'fang', 'carapace', 'horn']),
    aggroRadius: baseAggroRadius,
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        const frame = getFrame(flyingBeetleAnimation, enemy.animationTime);
        drawFrameInCircle(context, enemy, frame);
    },
};

