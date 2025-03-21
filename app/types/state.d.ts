interface GameState {
    nexus: Nexus
    city: CityStats
    inventory: Inventory
    // Which resources have been discovered this round.
    discoveredItems: Set<InventoryKey>
    // List of heroes available to summon.
    availableHeroes: Hero[],
    previewRequiredToolType?: ToolType
    previewResourceCost?: ComputedResourceCost
    selectedHero?: Hero
    openCharacterPanel?: boolean
    openChooseArmorPanel?: boolean
    openChooseWeaponPanel?: boolean
    openChooseCharmPanel?: boolean
    openInventoryPanel?: boolean
    openCraftingPanel?: boolean
    // Used for tracking which charm is being updated.
    selectedCharmIndex?: number
    hoveredAbility?: Ability
    hoverToolTip?: UIElement
    maxHeroSkillPoints: number
    selectedAbility?: ActiveAbility | NexusAbility<any>
    heroSlots: (Hero | undefined)[]
    maxNexusAbilityLevel: number
    nexusAbilities: NexusAbility<any>[]
    nexusAbilitySlots: (NexusAbility<any> | undefined)[]
    // This is set when the user clicks the button on a Nexus ability slot to assign an ability to it.
    // The Nexus Ability Panel is displayed while this is set.
    selectedNexusAbilitySlot?: number
    hudUIElements: UIElement[]
    camera: Camera
    world: World
    waves: Wave[]
    nextWaveIndex: number
    // How many pixels are drawn per second for the wave bar currently.
    // The larger this number becomes, the smaller wave stones are drawn and the more waves can bee seen.
    waveScale: number
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
