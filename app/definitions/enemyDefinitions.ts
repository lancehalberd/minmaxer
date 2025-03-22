import {createAnimation, drawFrame} from 'app/utils/animations';
import {createSummonMinionAbility, groupHeal, petrifyingBarrier, petrifyingGaze, poisonSpit, stunningSlam} from 'app/definitions/enemyAbilities';
import {enemyDefinitions} from 'app/definitions/enemyDefinitionsHash';
import {createActiveEnemyAbilityInstance, prepareToUseEnemyAbilityOnTarget} from 'app/utils/ability';

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
    const content = frame.content ?? {x: 0, y: 0, w: frame.w, h: frame.h};
    const scale = 2 * enemy.r / Math.min(content.w, content.h);
    drawFrame(context, frame, {
        x: enemy.x - (content.x + content.w / 2) * scale,
        y: enemy.y - (content.y + content.h / 2) * scale,
        w: frame.w * scale,
        h: frame.h * scale,
    });
}


const [/*snakeGreenLeftFrame*/, /*snakeGreenDownFrame*/, snakeGreenUpFrame] = createAnimation('gfx/enemies/snek.png', {w: 18, h: 18}, {cols: 3}).frames;
const [/*snakeYellowLeftFrame*/, /*snakeYellowDownFrame*/, snakeYellowUpFrame] = createAnimation('gfx/enemies/snekStorm.png', {w: 18, h: 18}, {cols: 3}).frames;


const [stethnoFrame] = createAnimation('gfx/enemies/stethno.png', {w: 96, h: 96, content: {x: 12, y: 7, w: 76, h: 82}}, {cols: 1}).frames;

// This is set to 100 so that increases of 1% effect the chance of dropping the item.
// 10 * 50 * 20 = 10,000, so by default there is roughly a 1 in  10,000 chance of dropping a legendary item.
// By level 100, legendary weight increases to 200 and common weight is reduced to 800,000
// so the chance increase to roughly 1 in 4,000.
const legendaryWeight = 100;
const rareWeight = 10 * legendaryWeight;
const uncommonWeight = 50 * rareWeight;
const commonWeight = 20 * uncommonWeight;

function standardLootPool(
    commonItems: InventoryKey[],
    uncommonItems: InventoryKey[],
    rareItems: InventoryKey[] = [],
    legendaryItems: InventoryKey[] = []
): LootPoolGenerator {
    return (state: GameState, enemy: Enemy) => {
        const weightedDrops: WeightedDrop[] = [];

        if (commonItems.length) {
            // Common items are 20% less likely by level 100.
            const weightAdjustment = 1 - 0.2 * enemy.level / 100;
            weightedDrops.push({keys: commonItems, weight: Math.floor(commonWeight * weightAdjustment)});
        }
        if (uncommonItems.length) {
            const weightAdjustment = 1 + 9 * enemy.level / 100;
            weightedDrops.push({keys: uncommonItems, weight: Math.floor(uncommonWeight * weightAdjustment)});
        }
        if (rareItems.length) {
            const weightAdjustment = 1 + 4 * enemy.level / 100;
            weightedDrops.push({keys: rareItems, weight: Math.floor(rareWeight * weightAdjustment)});
        }
        if (legendaryItems.length) {
            const weightAdjustment = 1 + enemy.level / 100;
            weightedDrops.push({keys: legendaryItems, weight: Math.floor(legendaryWeight * weightAdjustment)});
        }

        return weightedDrops;
    }
}

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
        renderSimpleEnemy(context, enemy, snakeGreenUpFrame);
    },
    aggroRadius: 150,
    getLootPool: standardLootPool(['scales'], ['largeScales'], ['snakeFang', 'hardScales']),
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
        renderSimpleEnemy(context, enemy, snakeYellowUpFrame);
    },
    aggroRadius: 150,
    lootChance: 0.15,
    getLootPool: standardLootPool(['scales'], ['largeScales'], ['snakeFang', 'hardScales']),
};

enemyDefinitions.kobold = {
    name: 'Kobold',
    color: 'red',
    r: 9,
    getStatsForLevel: getBasicEnemyStatsForLevel,
    aggroRadius: 150,
    getLootPool: standardLootPool(['leatherStrap'], ['leather'], ['fineLeather']),
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
    lootChance: 0.15,
    getLootPool: standardLootPool(['leatherStrap'], ['leather'], ['fineLeather']),
    aggroRadius: 150,
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
            damage: (5 * baseStats.damage) | 0,
            attacksPerSecond: 0.5 * baseStats.attacksPerSecond,
            attackRange: 10,
            movementSpeed: 5,
        };
    },
    lootChance: 3.5,
    getLootPool: standardLootPool(
        ['chippedEmerald', 'chippedRuby', 'chippedSapphire'],
        ['lionPelt', 'bearSkin'],
        ['emeraldRing', 'rubyRing', 'sapphireRing']
    ),
    aggroRadius: 200,
    isBoss: true,
};

const summonSnakes = createSummonMinionAbility({
    name: 'Summon Snakes',
    enemyTypes: ['snake', 'snake', 'snake'],
    cooldown: 10000,
    zoneCooldown: 3000,
    color: 'rgba(0, 255, 0, 0.5)',
});
const summonCobras = createSummonMinionAbility({
    name: 'Summon Cobras',
    enemyTypes: ['cobra', 'cobra', 'cobra'],
    cooldown: 10000,
    zoneCooldown: 3000,
    color: 'rgba(0, 255, 0, 0.5)',
});
interface MedusaProps {
    cobrasSummoned: number
}
const medusa: EnemyDefinition<MedusaProps> = {
    name: 'Medusa',
    color: '#8F8',
    r: 20,
    initialProps: {
        cobrasSummoned: 0,
    },
    abilities: [summonSnakes, petrifyingBarrier, petrifyingGaze],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (80 * baseStats.maxHealth) | 0,
            damage: (3 * baseStats.damage) | 0,
            attacksPerSecond: 0.5 * baseStats.attacksPerSecond,
            attackRange: 10,
            movementSpeed: 6,
        };
    },
    afterUpdate(state: GameState, enemy: Enemy<MedusaProps>) {
        if (
            (enemy.props.cobrasSummoned === 0 && enemy.health <= 2 * enemy.getMaxHealth(state) / 3)
            || (enemy.props.cobrasSummoned === 1 && enemy.health <= 1 * enemy.getMaxHealth(state) / 3)
        ) {
            const cobraAbilityInstance = createActiveEnemyAbilityInstance(summonCobras);
            prepareToUseEnemyAbilityOnTarget(state, enemy, cobraAbilityInstance, enemy);
            enemy.props.cobrasSummoned++;
        }
    },
    lootChance: 3.5,
    getLootPool: standardLootPool(
        ['largeScales', 'chippedEmerald'],
        ['snakeFang', 'hardScales'],
        ['emeraldRing']
    ),
    aggroRadius: 200,
    isBoss: true,
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        renderSimpleEnemy(context, enemy, stethnoFrame);
    },
};
enemyDefinitions.medusa = medusa;
