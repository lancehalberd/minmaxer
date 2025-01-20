import {spendEssence} from 'app/utils/essence';

export function getHeroSkill(state: GameState, hero: Hero, skillType: HeroSkillType): HeroSkill {
    let heroSkill = hero.skills[skillType];
    if (heroSkill) {
        return heroSkill;
    }
    heroSkill = {
        level: 0,
        experience: 0,
    };
    return hero.skills[skillType] = heroSkill;
}

export function gainSkillExperience(state: GameState, hero: Hero, skillType: HeroSkillType, experience: number) {
    const skill = getHeroSkill(state, hero, skillType);
    skill.experience += experience;
    let experienceForLevel = 10 * Math.pow(1.2, skill.level);
    while (skill.experience >= experienceForLevel) {
        skill.level++;
        // console.log(skillType + ' is now level ' + skill.level);
        skill.experience -= experienceForLevel;
        experienceForLevel = 10 * Math.pow(1.2, skill.level);
    }
}

export function summonHero(state: GameState, hero: Hero): boolean {
    const firstEmptyIndex = state.heroSlots.indexOf(null);
    if (firstEmptyIndex < 0) {
        // No room to summon a new hero.
        return false;
    }
    const availableHeroIndex = state.availableHeroes.indexOf(hero);
    if (availableHeroIndex < 0) {
        // The requested hero is not available to summon currently.
        return false;
    }
    if (!spendEssence(state, hero.definition.cost)) {
        // Cannot afford the cost of summoning this hero.
        return false;
    }
    state.heroSlots[firstEmptyIndex] = hero;
    state.world.objects.push(hero);
    state.availableHeroes.splice(availableHeroIndex);
    // Unpause the game automatically if hero is the first hero selected.
    if (!state.selectedHero) {
        state.isPaused = false;
    }
    state.selectedHero = hero;
    return true;
}
