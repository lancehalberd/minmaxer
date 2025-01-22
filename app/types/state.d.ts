interface GameState {
    nexus: Nexus
    city: CityStats
    inventory: Inventory
    // Total resources harvested this round.
    totalResources: {
        [key in ResourceKey]: number
    }
    // Resources available to harvest currently.
    availableResources: {
        [key in ResourceKey]: number
    }
    // List of heroes available to summon.
    availableHeroes: Hero[],
    previewRequiredToolType?: ToolType
    previewResourceCost?: ComputedResourceCost
    selectedHero?: Hero
    hoveredAbility?: Ability
    selectedAbility?: ActiveAbility
    heroSlots: (Hero | null)[]
    hudUIElements: UIElement[]
    world: World
    isPaused: boolean
    lastTimeRendered: number
    time: number
    mouse: {
        currentPosition: Point
        mouseDownPosition?: Point
        mouseDownTarget?: MouseTarget
        mouseHoverTarget?: MouseTarget
        isOverCanvas?: boolean
        // This can be set to indicate the current mouse press has been handled and should not trigger
        // any further actions, such as drag to move.
        pressHandled?: boolean
    },
    keyboard: {
        gameKeyValues: number[]
        gameKeysDown: Set<number>
        gameKeysPressed: Set<number>
        // The set of most recent keys pressed, which is recalculated any time
        // a new key is pressed to be those keys pressed in that same frame.
        mostRecentKeysPressed: Set<number>
        gameKeysReleased: Set<number>
    },
}
