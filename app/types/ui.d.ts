
interface BaseUIElement extends Rect {
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    // Unique id for this button that can be used to check if different instances of a button
    // are for the same button. For example, we recreate an instance of many buttons each frame,
    // but they are effectively the same button.
    uniqueId?: string
    disabled?: boolean
    update?: (state: GameState) => void
    getChildren?: (state: GameState) => UIElement[]
    // Set this when an element is rendered as a child of another element and uses the parent
    // elements x/y as its origin.
    parent?: UIElement
    // Update the size and position of the element.
    // This is useful to define on child elements that have size and position based on parent elements that might change.
    resize?: (this: BaseUIElement, state: GameState, container: UIContainer) => void
    // If this is set, this element will only be rendered as part of a particular zone and will
    // only trigger events when the camera is viewing that zone.
    zone?: ZoneInstance
}

interface UIContainer extends BaseUIElement {
    objectType: 'uiContainer'
    onHover?: (state: GameState) => boolean
    onPress?: (state: GameState) => boolean
    onClick?: (state: GameState) => boolean
}

interface UIButton extends BaseUIElement {
    objectType: 'uiButton'
    onHover?: (state: GameState) => boolean
    onPress?: (state: GameState) => boolean
    onClick?: (state: GameState) => boolean
}

type UIElement = UIContainer | UIButton;

type ToolTipLine = string|number|FillTextProperties&{icon?: Frame};
