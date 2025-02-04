import {canvas} from 'app/gameConstants';
import {fillRect, fillText} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';

export class HeroPanel implements UIContainer {
    objectType = <const>'uiContainer';
    hero?: Hero
    w = 250;
    h = 400;
    x = 0;
    y = (canvas.height - this.h) / 2;
    update(state: GameState) {
    }
    render(context: CanvasRenderingContext2D, state: GameState) {
        const hero = state.selectedHero;
        if (!hero) {
            return;
        }
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, - 2), '#444');
        const lines: string[] = [
            'Lv ' + hero.level + '. ' + hero.definition.name,
            'Max health ' + hero.getMaxHealth(state),
            'Dex ' + hero.getDex(state) + ' Int ' + hero.getInt(state) + ' Str ' + hero.getStr(state),
            'Damage ' + hero.getDamage(state),
            'Critical ' + (hero.getCriticalChance(state) * 100).toFixed(1) + '% x' + (1 + hero.getCriticalMultipler(state)).toFixed(2),
            'Armor Class ' + hero.getArmorClass(state),
            'Max Damage Reduction ' + (hero.getMaxDamageReduction(state) * 100).toFixed(1) + '%',
        ];

        let y = this.y + 5;
        for (const line of lines) {
            fillText(context, {text: line, x: this.x + 5, y, size: 15, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
            y += 20;
        }
    }
    getChildren(state: GameState) {
        const buttons: UIElement[] = [];
        return buttons;
    }
}
