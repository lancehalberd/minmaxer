interface Point {
    x: number
    y: number
}

interface Circle extends Point {
    r: number
    color?: CanvasFill
}

interface Rect extends Point {
    w: number
    h: number
}
