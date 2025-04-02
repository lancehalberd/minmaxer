import {AreaDamageOverTimeEffect} from 'app/effects/enemyAbilityEffects';

import {groupHeal, EnemyAreaHitAbility, EnemyProjectileAbility} from 'app/definitions/enemyAbilities';
import {enemyDefinitions} from 'app/definitions/enemyDefinitionsHash';
import {getBasicEnemyStatsForLevel} from 'app/definitions/enemyDefinitions';
import {getEnemyDamageForTarget} from 'app/objects/enemy';
import {createActiveEnemyAbilityInstance, prepareToUseEnemyAbilityOnTarget} from 'app/utils/ability';
import {createAnimation, drawFrameInCircle, drawRotatedFrameInCircle, getFrame} from 'app/utils/animations';
import {enemyLootPoolfFromKeys} from 'app/utils/lootPool'


export const phoenixFireball = new EnemyProjectileAbility({
    name: 'Phoenix Fire',
    getProjectile: (state: GameState, enemy: Enemy) => ({
        r: 8,
        speed: 100,
        render: renderPhoenixFire,
        onExpire(this: Projectile, state: GameState) {
            // PoisonPoolEffect automatically adds itself to the zone in the constructor.
            new AreaDamageOverTimeEffect({
                zone: this.zone,
                color: 'rgba(255, 0 , 0, 0.6)',
                x: this.x,
                y: this.y,
                r: this.r,
                targetsAllies: true,
                maxRadius: 25,
                duration: 2000,
                damagePerSecond: getEnemyDamageForTarget(state, enemy, undefined),
                source: enemy,
            });
        }
    }),
})
function renderPhoenixFire(this: Projectile, context: CanvasRenderingContext2D, state: GameState) {
    const frame = getFrame(phoenixFlameAnimation, this.zone.time);
    drawFrameInCircle(context, this, frame);
}


const rebirthTime = 20000;
export const phoenixRebirth = new EnemyAreaHitAbility({
    name: 'Phoenix Rebirth',
    r: 80,
    cooldown: 0,
    initialCharges: 0,
    zoneCooldown: 0,
    // The hit doesn't do any damage, only the damage over time effect deals damage.
    damageMultiplier: 0,
    warningTime: rebirthTime,
    afterActivate(state: GameState, enemy: Enemy, ability: ActiveEnemyAbility<undefined>) {
        new AreaDamageOverTimeEffect({
            zone: enemy.zone,
            color: 'rgba(255, 0 , 0, 0.6)',
            x: enemy.x,
            y: enemy.y,
            r: 20,
            targetsAllies: true,
            maxRadius: enemy.r + this.r,
            duration: 4000,
            damagePerSecond: 10 * getEnemyDamageForTarget(state, enemy, undefined),
            source: enemy,
        });
    },
});

const phoenixAnimation = createAnimation('gfx/enemies/stormbeast1.png', {w: 156, h: 121}, {cols: 3});
const phoenixFlameAnimation = createAnimation('gfx/enemies/flame.png', {w: 32, h: 48, content: {x: 8, y: 32, w: 16, h: 16}}, {cols: 4});
interface PhoenixProps {
    eggTimer: number
}
const phoenix: EnemyDefinition<PhoenixProps> = {
    name: 'Phoenix',
    color: '#8F8',
    r: 40,
    initialProps: {
        eggTimer: 0,
    },
    abilities: [groupHeal, phoenixFireball],
    getStatsForLevel(level: number): EnemyLevelDerivedStats {
        const baseStats = getBasicEnemyStatsForLevel(level);
        return {
            ...baseStats,
            maxHealth: (60 * baseStats.maxHealth) | 0,
            damage: Math.ceil(0.8 * baseStats.damage),
            attacksPerSecond: 0.5 * baseStats.attacksPerSecond,
            attackRange: 30,
            movementSpeed: 6,
        };
    },
    onDeath(state: GameState, enemy: Enemy<PhoenixProps>) {
        // When the pheonix reaches 0 health normally, it turns into an
        // egg with 10% reduced max health. After 20s, the phoenix will be reborn
        // with the reduced max health. The player may have to defeat the phoenix several
        // times if they have low DPS relative to the enemy.
        if (!enemy.props.eggTimer) {
            enemy.maxHealth = Math.ceil(0.9 * enemy.maxHealth);
            enemy.health = enemy.maxHealth;
            enemy.props.eggTimer = enemy.zone.time;
            const rebirthAbilityInstance = createActiveEnemyAbilityInstance(phoenixRebirth);
            prepareToUseEnemyAbilityOnTarget(state, enemy, rebirthAbilityInstance, enemy);
            return false;
        }
        return true;
    },
    afterUpdate(state: GameState, enemy: Enemy<PhoenixProps>) {
        // At the end of the egg timer, the phoenix is reborn with full health.
        if (enemy.props.eggTimer && (enemy.zone.time - enemy.props.eggTimer) >= rebirthTime) {
            enemy.props.eggTimer = 0;
            enemy.health = enemy.maxHealth;
        }
    },
    lootChance: 3.5,
    getLootPool: enemyLootPoolfFromKeys([
        'phoenixFeather', 'phoenixPlume', 'phoenixPinion','phoenixCrown',
        'chippedRuby', 'ruby', 'flawlessRuby',
        'rubyRing', 'rubyBracelet', 'rubyNecklace',
    ]),
    isBoss: true,
    render(context: CanvasRenderingContext2D, state: GameState, enemy: Enemy<PhoenixProps>): void {
        if (enemy.props.eggTimer) {
            const p = (enemy.zone.time - enemy.props.eggTimer) / rebirthTime;
            //defaultRenderWarning(context, state, p, enemy, {range: 0, hitRadius: 100}, enemy);
            const frame = getFrame(phoenixFlameAnimation, enemy.animationTime);
            drawFrameInCircle(context, {x: enemy.x, y: enemy.y, r: enemy.r * (0.2 + 0.6 * p)}, frame);
            return;
        }
        const frame = getFrame(phoenixAnimation, enemy.animationTime);
        // The animation faces south by default, which corresponds to PI / 2 in screen coordinates, so subtract PI / 2 from the theta value.
        drawRotatedFrameInCircle(context, {x: enemy.x, y: enemy.y, r: enemy.r, theta: enemy.theta - Math.PI / 2}, frame);
    },
};
enemyDefinitions.phoenix = phoenix;
