import {uiSize} from 'app/gameConstants';
import {drawNumberFillBar, fillRect, fillText} from 'app/utils/draw';
import {getOrCreateJob, updateWorkers} from 'app/utils/job';
import {MinusIconButton, PlusIconButton} from 'app/objects/iconButton';

const buildWallJobDefinition: JobDefinition = {
    key: 'buildWall',
    workerSeconds: 1,
    onComplete(state: GameState) {
        state.city.wall = {
            level: 1,
            maxHealth: 100,
            health: 100,
            returnDamage: 1,
        };
    }
};
export const buildWallElement: UIContainer = {
    objectType: 'uiContainer',
    w: 4 * uiSize, h: 2 * uiSize, x: - 2 * uiSize, y: -uiSize,
    render(context: CanvasRenderingContext2D, state: GameState) {
        const job = getOrCreateJob(state, buildWallJobDefinition);
        fillRect(context, this, '#000');
        fillText(context, {text: 'Build Wall', x: this.x + this. w / 2, y: this.y + uiSize / 2 + 1, size: uiSize - 4, color: '#FFF'});
        drawNumberFillBar(context, {
            x: this.x + uiSize, y: this.y + uiSize, w: this.w - 2 * uiSize, h: uiSize,
            value: job.workers,
            total: Math.min(state.city.population),
        });
        buildWallPlusButton.render(context, state);
        buildWallMinusButton.render(context, state);
        if (job.definition.workerSeconds) {
            const p = job.workerSecondsCompleted / job.definition.workerSeconds;
            fillRect(context, {x: this.x, y: this.y + uiSize - 1, w: Math.floor(this.w * p), h: 2}, '#00F');
        }
    },
    getChildren() {
        return [buildWallPlusButton, buildWallMinusButton];
    }
};
const buildWallPlusButton = new PlusIconButton({
    x: buildWallElement.x + buildWallElement.w - uiSize,
    y: buildWallElement.y + uiSize,
    onClick(state: GameState) {
        updateWorkers(state, getOrCreateJob(state, buildWallJobDefinition), 1);
        return true;
    }
});
const buildWallMinusButton = new MinusIconButton({
    x: buildWallElement.x,
    y: buildWallElement.y + uiSize,
    onClick(state: GameState) {
        updateWorkers(state, getOrCreateJob(state, buildWallJobDefinition), -1);
        return true;
    }
});
