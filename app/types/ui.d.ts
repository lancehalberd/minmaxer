
interface BaseUIElement extends Rect {
    render: (context: CanvasRenderingContext2D, state: GameState) => void
    // Unique id for this button that can be used to check if different instances of a button
    // are for the same button. For example, we recreate an instance of many buttons each frame,
    // but they are effectively the same button.
    uniqueId?: string
    disabled?: boolean
    update?: (state: GameState) => void
    getChildren?: (state: GameState) => UIElement[]
}

interface UIContainer extends BaseUIElement {
    objectType: 'uiContainer'
}

interface UIButton extends BaseUIElement {
    objectType: 'uiButton'
    onHover?: (state: GameState) => boolean
    onPress?: (state: GameState) => boolean
    onClick?: (state: GameState) => boolean
}

type UIElement = UIContainer | UIButton;
