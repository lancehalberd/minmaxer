import {canvas} from 'app/gameConstants';
import {TextButton} from 'app/ui/textButton';
import {fillRect, fillText, renderLifeBar} from 'app/utils/draw';
import {pad} from 'app/utils/geometry';
import {getHeroSkill, getSkillExperienceForNextLevel} from 'app/utils/hero';
import {showArmorTooltip, showCharmTooltip, showWeaponTooltip} from 'app/ui/tooltip';
import {typedKeys} from 'app/utils/types';


export class EquipHeroPanel implements UIContainer {
    objectType = <const>'uiContainer';
    x = 0;
    y = 0;
    w = 200;
    h = 150;
    weaponButton = new TextButton({
        x: 60,
        y: 0,
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
        x: 60,
        y: 30,
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
        x: 60,
        y: 60 + 30 * index,
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
        context.save();
            context.translate(this.x, this.y);
            fillText(context, {text: 'Weapon', x: 50, y: this.weaponButton.y + this.weaponButton.h / 2, size: 15, textAlign: 'right', textBaseline: 'middle', color: '#FFF'});
            fillText(context, {text: 'Armor', x: 50, y: this.armorButton.y + this.armorButton.h / 2, size: 15, textAlign: 'right', textBaseline: 'middle', color: '#FFF'});
            fillText(context, {text: 'Charm', x: 50, y: this.charmButtons[0].y + this.charmButtons[0].h / 2, size: 15, textAlign: 'right', textBaseline: 'middle', color: '#FFF'});

            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
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

export class HeroPanel implements UIContainer {
    objectType = <const>'uiContainer';
    w = 250;
    h = 500;
    x = 40;
    y = (canvas.height - this.h) / 2;
    equipHeroPanel = new EquipHeroPanel();

    getTextLines(state: GameState): string[] {
        const hero = state.selectedHero;
        if (!hero) {
            return [];
        }
        return [
            'Lv ' + hero.level + '. ' + hero.definition.name,
            'Max health ' + hero.getMaxHealth(state),
            'Dex ' + hero.getDex(state) + ' Int ' + hero.getInt(state) + ' Str ' + hero.getStr(state),
            'Damage ' + (hero.getDamage(state) * (1 + hero.getStr(state) / 100) | 0),
            'Critical ' + (hero.getCriticalChance(state) * 100).toFixed(1) + '% x' + (1 + hero.getCriticalMultipler(state)).toFixed(2),
            'Extra Hit ' + (hero.getExtraHitChance(state) * 100).toFixed(1) + '%',
            'Armor Class ' + hero.getArmorClass(state),
            'Max Damage Reduction ' + (hero.getMaxDamageReduction(state) * 100).toFixed(1) + '%',
        ];
    }

    render(context: CanvasRenderingContext2D, state: GameState) {
        const hero = state.selectedHero;
        if (!hero) {
            return;
        }
        fillRect(context, this, '#FFF');
        fillRect(context, pad(this, - 2), '#444');
        context.save();
            context.translate(this.x, this.y);
            const lines: string[] = this.getTextLines(state);

            let y = 5;
            for (const line of lines) {
                fillText(context, {text: line, x: 5, y, size: 15, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
                y += 20;
            }

            y = this.equipHeroPanel.y + this.equipHeroPanel.h + 20;
            fillText(context, {text: 'Skills:', x: 5, y, size: 15, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
            y += 20;
            for (const key of typedKeys(hero.skills)) {
                const skill = getHeroSkill(state, hero, key);
                fillText(context, {text: 'Lv ' + skill.level + ' ' + key, x: 5, y, size: 15, textAlign: 'left', textBaseline: 'top', color: '#FFF'});
                renderLifeBar(context, {x: 20, y: y + 18, w: this.w - 40, h: 5}, skill.experience, getSkillExperienceForNextLevel(state, skill), '#FFF', '#F80');
                y += 30;
            }

            const children = this.getChildren?.(state) ?? [];
            for (const child of children) {
                child.render(context, state);
            }
        context.restore();
    }
    getChildren(state: GameState) {
        this.equipHeroPanel.x = (this.w - this.equipHeroPanel.w) / 2;
        this.equipHeroPanel.y = 25 + this.getTextLines(state).length * 20;
        return [this.equipHeroPanel];
    }
}
