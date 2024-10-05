import {enemyDefinitions} from 'app/definitions/enemyDefinitions';
import {renderEnemy, updateEnemy} from 'app/objects/enemy';
import {fillCircle, renderLifeBar} from 'app/utils/draw';

export const snakeSpawner: Spawner = {
    objectType: 'spawner',
    x: 300,
    y: 300,
    r: 20,
    color: 'purple',
    enemyType: 'snake',
    spawnCooldown: 2000,
    spawnLimit: 3,
    spawnedEnemies: [],
    health: 50,
    maxHealth: 50,
    experienceWorth: 0,
    level: 0,
    render(this: Spawner, context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        renderLifeBar(context, this, this.health, this.maxHealth);
    },
    update(this: Spawner, state: GameState) {
        // Set spawner experience worth = 50x the enemy it spawns' worth
        if (this.experienceWorth === 0) {
            this.experienceWorth = enemyDefinitions[this.enemyType].experienceWorth*50;
        }
        // Set spawner level = 5x level of enemy it spawns
        if (this.level === 0) {
            this.level = enemyDefinitions[this.enemyType].level*5;
        }
        // Remove any dead enemies from the array of spawned enemies this spawner is tracking.
        this.spawnedEnemies = this.spawnedEnemies.filter(enemy => enemy.health > 0);
        if (this.spawnedEnemies.length >= this.spawnLimit) {
            return;
        }
        // If we have no spawn time or it has been longer than the spawn cooldown, spawn a new enemy.
        if (!this.lastSpawnTime || state.world.time - this.lastSpawnTime >= this.spawnCooldown) {
            const enemy: Enemy = {
                objectType: 'enemy',
                ...enemyDefinitions[this.enemyType],
                update: updateEnemy,
                render: renderEnemy,
                x: this.x,
                y: this.y,
            };
            this.spawnedEnemies.push(enemy);
            state.world.objects.push(enemy);
            this.lastSpawnTime = state.world.time;
        }
    },
};
