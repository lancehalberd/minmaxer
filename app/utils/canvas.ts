export function createCanvas(width: number, height: number, classes = ''): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = classes;
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

export function createCanvasAndContext(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Could not get canvas context 2d');
    }
    context.imageSmoothingEnabled = false;
    return [canvas, context];
}

/**
 * Safari (and possibly other browsers) will not draw canvases if the source
 * rectangle has any parts outside the dimensions of the actual canvas, so this
 * method takes arbitrary rectangles and then modifies them to only draw the
 * part that overlaps with the canvas.
 */
export function drawCanvas(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    {x, y, w, h}: Rect,
    {x: tx, y: ty, w: tw, h: th}:Rect
): void {
    // Render nothing if the source is entirely
    // outside of the canvas rect.
    if (x + w < 0
        || y + h < 0
        || x > canvas.width
        || y > canvas.height
    ) {
        return;
    }
    if (w > canvas.width - x) {
        const dx = (canvas.width - x) - w;
        w += dx;
        tw += dx;
    }
    if (h > canvas.height - y) {
        const dy = (canvas.height - y) - h;
        h += dy;
        th += dy;
    }
    if (x < 0) {
        tx -= x;
        tw += x
        w += x;
        x = 0;
    }
    if (y < 0) {
        ty -= y;
        th += y;
        h += y;
        y = 0;
    }
    if (w > 0 && h > 0) {
        if (x < 0 || y < 0 || x + w > canvas.width || y + h > canvas.height) {
            console.log('Attempted to render from outside canvas bounds');
            console.log({x, y, w, h}, {width: canvas.width, height: canvas.height});
            debugger;
        }
        context.drawImage(
            canvas,
            x, y,
            w, h,
            tx, ty, tw, th,
        );
    }
}
