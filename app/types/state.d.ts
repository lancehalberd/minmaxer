interface GameState {
    nexus: Nexus
    city: CityStats
    inventory: Inventory
    // Which resources have been discovered this round.
    discoveredItems: Set<InventoryKey>
    // Resources available to harvest currently.
    availableResources: {
        wood: number
        stone: number
    }
    // List of heroes available to summon.
    availableHeroes: Hero[],
    previewRequiredToolType?: ToolType
    previewResourceCost?: ComputedResourceCost
    selectedHero?: Hero
    openCharacterPanel?: boolean
    openChooseArmorPanel?: boolean
    openChooseWeaponPanel?: boolean
    openChooseCharmPanel?: boolean
    // Used for tracking which charm is being updated.
    selectedCharmIndex?: number
    hoveredAbility?: Ability
    hoverToolTip?: UIElement
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
