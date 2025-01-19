type CanvasFill = string | CanvasGradient | CanvasPattern;

interface ExtraAnimationProperties {
    // The animation will loop unless this is explicitly set to false.
    loop?: boolean
    // Frame to start from after looping.
    loopFrame?: number
}
type FrameAnimation = {
    frames: Frame[]
    frameDuration: number
    duration: number
} & ExtraAnimationProperties

interface FrameDimensions {
    w: number
    h: number
    // When a frame does not perfectly fit the size of the content, this content rectangle can be
    // set to specify the portion of the image that is functionally part of the object in the frame.
    // For example, a character with a long tail may have the content around the character's body and
    // exclude the tail when looking at the width/height of the character.
    content?: Rect
}
interface FrameRectangle extends Rect {
    // When a frame does not perfectly fit the size of the content, this content rectangle can be
    // set to specify the portion of the image that is functionally part of the object in the frame.
    // For example, a character with a long tail may have the content around the character's body and
    // exclude the tail when looking at the width/height of the character.
    content?: Rect
}

interface Frame extends FrameRectangle {
    image: HTMLCanvasElement | HTMLImageElement
    // Additional property that may be used in some cases to indicate a frame should be flipped
    // horizontally about the center of its content. Only some contexts respect this.
    flipped?: boolean
}

interface FrameWithPattern extends Frame {
    pattern?: CanvasPattern
}

interface CreateAnimationOptions {
    x?: number, y?: number
    xSpace?: number
    ySpace?: number
    rows?: number, cols?: number
    top?: number, left?: number
    duration?: number
    frameMap?: number[]
}

interface FillTextProperties extends Point {
    text: number|string
    textBaseline?: 'top' | 'middle' | 'bottom'
    textAlign?: 'left' | 'center' | 'right'
    size?: number
    font?: 'san-serif'
    color?: CanvasFill
    bold?: boolean
    measure?: boolean
}
