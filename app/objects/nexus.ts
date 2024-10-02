import {fillCircle, renderLifeBar} from 'app/utils/draw';

export const nexus: Nexus = {
    objectType: 'nexus',
    x: 0,
    y: 0,
    r: 20,
    color: '#0FF',
    level: 1,
    essence: 100,
    health: 10,
    maxHealth: 10,
    render(this: Nexus, context: CanvasRenderingContext2D, state: GameState) {
        fillCircle(context, this);
        renderLifeBar(context, this, this.health, this.maxHealth);
    },
    update(state: GameState) {
    },
};
