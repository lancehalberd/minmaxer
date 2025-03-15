export function applyEffectToHero(state: GameState, effect: ObjectEffect<Hero>, hero: Hero) {
    hero.effects.push(effect);
    effect.apply(state, hero);
}

export function removeEffectFromHero(state: GameState, effect: ObjectEffect<Hero>, hero: Hero) {
    const index = hero.effects.indexOf(effect);
    if (index < 0) {
        return;
    }
    hero.effects.splice(index, 1);
    effect.remove(state, hero);
}
