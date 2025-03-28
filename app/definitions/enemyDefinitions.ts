import {createAnimation, drawFrame} from 'app/utils/animations';
import {createSummonMinionAbility, groupHeal, petrifyingBarrier, petrifyingGaze, poisonSpit, stunningSlam} from 'app/definitions/enemyAbilities';
import {enemyDefinitions} from 'app/definitions/enemyDefinitionsHash';
import {createActiveEnemyAbilityInstance, prepareToUseEnemyAbilityOnTarget} from 'app/utils/ability';
import {standardEnemyLootPool} from 'app/utils/lootPool'

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
    getLootPool: standardEnemyLootPool(['scales'], ['largeScales', 'chippedEmerald'], ['snakeFang', 'hardScales', 'emerald'], ['flawlessEmerald']),
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
    getLootPool: standardEnemyLootPool(['scales'], ['largeScales', 'chippedEmerald'], ['snakeFang', 'hardScales', 'emerald'], ['flawlessEmerald']),
};

enemyDefinitions.kobold = {
    name: 'Kobold',
    color: 'red',
    r: 9,
    getStatsForLevel: getBasicEnemyStatsForLevel,
    aggroRadius: 150,
    getLootPool: standardEnemyLootPool(['leatherStrap'], ['leather', 'chippedRuby'], ['fineLeather', 'ruby'], ['flawlessRuby']),
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
    getLootPool: standardEnemyLootPool(['leatherStrap'], ['leather', 'chippedSapphire'], ['fineLeather', 'sapphire'], ['flawlessSapphire']),
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
    getLootPool: standardEnemyLootPool(
        ['chippedEmerald', 'chippedRuby', 'chippedSapphire'],
        ['emeraldRing', 'rubyRing', 'sapphireRing', 'lionPelt', 'bearSkin'],
        ['emeraldBracelet', 'rubyBracelet', 'sapphireBracelet'],
        [
            'emeraldNecklace', 'rubyNecklace', 'sapphireNecklace',
            'flawlessEmerald', 'flawlessRuby', 'flawlessSapphire'
        ],
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
    getLootPool: standardEnemyLootPool(
        ['largeScales', 'chippedEmerald'],
        ['snakeFang', 'hardScales', 'emeraldRing', 'emerald'],
        ['emeraldBracelet'],
        ['flawlessEmerald', 'emeraldNecklace'],
    ),
    aggroRadius: 200,
    isBoss: true,
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy): void {
        renderSimpleEnemy(context, enemy, stethnoFrame);
    },
};
enemyDefinitions.medusa = medusa;
