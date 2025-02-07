import {canvas} from 'app/gameConstants';
import {TextButton} from 'app/ui/textButton';
import {fillRect, fillText, renderLifeBar} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';
import {getHeroSkill, getSkillExperienceForNextLevel} from 'app/utils/hero';
import {showArmorTooltip, showCharmTooltip, showWeaponTooltip} from 'app/ui/tooltip';
import {typedKeys} from 'app/utils/types';


export class HeroPanel implements UIContainer {
    objectType = <const>'uiContainer';
    hero?: Hero
    w = 250;
    h = 500;
    x = 0;
    y = (canvas.height - this.h) / 2;
    weaponButton = new TextButton({
        x: this.x + 90,
        y: this.y + 170,
        text(state: GameState) {
            return state.selectedHero?.equipment.weapon?.name ?? 'None';
        },
        onHover(state: GameState) {
            showWeaponTooltip(state, state.selectedHero?.equipment.weapon);
            return true;
        },
        onClick(state: GameState) {
            state.openChooseWeaponPanel = true;
            state.openChooseArmorPanel = false;
            state.openChooseCharmPanel = false;
            return true;
        },
    });
    armorButton = new TextButton({
        x: this.x + 90,
        y: this.y + 200,
        text(state: GameState) {
            return state.selectedHero?.equipment.armor?.name ?? 'None';
        },
        onHover(state: GameState) {
            showArmorTooltip(state, state.selectedHero?.equipment.armor);
            return true;
        },
        onClick(state: GameState) {
            state.openChooseWeaponPanel = false;
            state.openChooseArmorPanel = true;
            state.openChooseCharmPanel = false;
            return true;
        },
    });
    charmButtons = [0,1,2].map(index => new TextButton({
        x: this.x + 90,
        y: this.y + 230 + 30 * index,
        text(state: GameState) {
            return state.selectedHero?.equipment.charms[index]?.name ?? 'None';
        },
        onHover(state: GameState) {
            showCharmTooltip(state, state.selectedHero?.equipment.charms[index]);
            return true;
        },
        onClick(state: GameState) {
            state.selectedCharmIndex = index;
            state.openChooseWeaponPanel = false;
            state.openChooseArmorPanel = false;
            state.openChooseCharmPanel = true;
            return true;
        },
    }));
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
            'Equipment:',
        ];

        let y = this.y + 5;
        for (const line of lines) {
            fillText(context, {text: line, x: this.x + 5, y, size: 15, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
            y += 20;
        }
        y += 10;
        fillText(context, {text: 'Weapon', x: this.x + 80, y, size: 15, textAlign: 'right', textBaseline: 'top', color: '#FFF'});
        y += 30;
        fillText(context, {text: 'Armor', x: this.x + 80, y, size: 15, textAlign: 'right', textBaseline: 'top', color: '#FFF'});
        y += 30;
        fillText(context, {text: 'Charm', x: this.x + 80, y, size: 15, textAlign: 'right', textBaseline: 'top', color: '#FFF'});
        y += 30;
        fillText(context, {text: 'Skills:', x: this.x + 5, y, size: 15, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
        y += 20;
        for (const key of typedKeys(hero.skills)) {
            const skill = getHeroSkill(state, hero, key);
            fillText(context, {text: 'Lv ' + skill.level + ' ' + key, x: this.x + 5, y, size: 15, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
            renderLifeBar(context, {x: this.x + 20, y: y + 18, w: this.w - 40, h: 5}, skill.experience, getSkillExperienceForNextLevel(state, skill), '#FFF', '#F80');
            y += 30;
        }

        const children = this.getChildren?.(state) ?? [];
        for (const child of children) {
            child.render(context, state);
        }
    }
    getChildren(state: GameState) {
        if (!state.selectedHero) {
            return [];
        }
        const buttons: UIElement[] = [
            this.armorButton,
            this.weaponButton,
        ];
        for (let i = 0; i < state.selectedHero.equipment.charms.length && i < 3; i++) {
            buttons.push(this.charmButtons[i]);
        }
        return buttons;
    }
}
