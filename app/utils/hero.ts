import {framesPerSecond} from 'app/gameConstants';
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
    skill.experience += experience * Math.pow(0.98, hero.totalSkillLevels);
    let experienceForLevel = getSkillExperienceForNextLevel(state, skill);
    while (skill.experience >= experienceForLevel) {
        skill.level++;
        hero.totalSkillLevels++;
        // console.log(skillType + ' is now level ' + skill.level);
        skill.experience -= experienceForLevel;
        experienceForLevel = getSkillExperienceForNextLevel(state, skill);
    }
}

export function getSkillExperienceForNextLevel(state: GameState, skill: HeroSkill) {
    return 10 * Math.pow(1.2, skill.level);
}

export function summonHero(state: GameState, hero: Hero): boolean {
    const firstEmptyIndex = state.heroSlots.indexOf(undefined);
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
    hero.health = hero.getMaxHealth(state);
    state.world.objects.push(hero);
    state.availableHeroes.splice(availableHeroIndex, 1);
    // Unpause the game automatically if hero is the first hero selected.
    if (!state.selectedHero) {
        state.isPaused = false;
    }
    state.selectedHero = hero;
    return true;
}

export function activateHeroAbility(state: GameState, hero: Hero, ability: Ability) {
    if (ability.abilityType !== 'activeAbility') {
        return;
    }
    if (ability.level <= 0 || ability.cooldown > 0) {
        return;
    }
    const definition = ability.definition;
    if (definition.canActivate && !definition.canActivate(state, hero, ability)) {
        return;
    }
    const targetingInfo = definition.getTargetingInfo(state, hero, ability);
    if (targetingInfo.canTargetEnemy || targetingInfo.canTargetAlly || targetingInfo.canTargetLocation) {
        // If the ability can target, we selected it to allow the user to choose the target.
        if (state.selectedAbility === ability) {
            delete state.selectedAbility;
        } else {
            state.selectedAbility = ability;
        }
    } else {
        // If the ability does not target, it is activated immediately.
        definition.onActivate(state, hero, ability, undefined)
        ability.cooldown = definition.getCooldown(state, hero, ability);
    }
}

export function activateNexusAbility(state: GameState, ability: NexusAbility<any>) {
    if (ability.level <= 0 || ability.cooldown > 0) {
        return;
    }
    const definition = ability.definition;
    if (definition.canActivate && !definition.canActivate(state, ability)) {
        return;
    }
    const targetingInfo = definition.getTargetingInfo(state, ability);
    if (targetingInfo.canTargetEnemy || targetingInfo.canTargetAlly || targetingInfo.canTargetLocation) {
        // If the ability can target, we selected it to allow the user to choose the target.
        if (state.selectedAbility === ability) {
            delete state.selectedAbility;
        } else {
            state.selectedAbility = ability;
        }
    } else {
        // If the ability does not target, it is activated immediately.
        definition.onActivate(state, ability, undefined)
        ability.cooldown = definition.getCooldown(state, ability);
    }
}


export function moveAllyTowardsTarget(state: GameState, ally: Hero|Ally, target: AbilityTarget, distance = 0): boolean {
    const pixelsPerFrame = ally.getMovementSpeed(state) / framesPerSecond;
    // Move this until it reaches the target.
    const dx = target.x - ally.x, dy = target.y - ally.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    // Attack the target when it is in range.
    if (mag <= distance) {
        return true;
    }
    if (pixelsPerFrame <= 0) {
        return false;
    }
    if (mag < pixelsPerFrame) {
        ally.x = target.x;
        ally.y = target.y;
    } else {
        ally.x += pixelsPerFrame * dx / mag;
        ally.y += pixelsPerFrame * dy / mag;
    }
    // Push the ally away from any objects they get too close to.
    for (const object of ally.zone.objects) {
        if (object === ally) {
            continue;
        }
        let minDistance = ally.r + object.r - 8;
        // This will make the min distance slightly smaller than it is for bosses,
        // to prevent pushing them around.
        if (object.objectType === 'enemy' && object.isBoss) {
            minDistance += 4;
        }
        if (minDistance <= 0) {
            continue;
        }
        //if (object.objectType === 'ally') {
        //    minDistance = ally.r + object.r - 10;
        //} else if (object.objectType === '')
        const dx = ally.x - object.x, dy = ally.y - object.y;
        if (!dx && !dy) {
            continue;
        }
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag < minDistance) {
            ally.x = object.x + dx * minDistance / mag;
            ally.y = object.y + dy * minDistance / mag;
        }
    }
    return false;
}
