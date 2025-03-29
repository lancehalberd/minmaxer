interface Point {
    x: number
    y: number
}

interface Circle extends Point {
    r: number
    color?: CanvasFill
    theta?: number
}

interface Rect extends Point {
    w: number
    h: number
}

interface Ring extends Circle {
    r2: number
}

interface Ray {
    x1: number
    y1: number
    x2: number
    y2: number
    r: number
}
