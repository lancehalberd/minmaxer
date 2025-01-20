
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
        console.log(skillType + ' is now level ' + skill.level);
        skill.experience -= experienceForLevel;
        experienceForLevel = 10 * Math.pow(1.2, skill.level);
    }
}
