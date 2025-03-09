import {frameLength} from 'app/gameConstants';
import {drawCanvas} from 'app/utils/canvas';
import {requireImage} from 'app/utils/images';

export function requireFrame(source: string, r?: FrameRectangle): Frame {
    const frame = {
        image: requireImage(source, () => {
            // Use the image dimensions if dimensions were not provided for this frame.
            if (!r) {
                frame.w = frame.image.width;
                frame.h = frame.image.height;
            }
        }),
        x: r?.x ?? 0,
        y: r?.y ?? 0,
        w: r?.w ?? 0,
        h: r?.h ?? 0,
        content: r?.content,
    };
    return frame;
}


// Make a single frame into an FrameAnimation.
export function frameAnimation(frame: Frame): FrameAnimation {
    return {frames: [frame], frameDuration: 1, duration: 1};
}

export function framesAnimation(frames: Frame[], duration = 8, props: ExtraAnimationProperties = {}): FrameAnimation {
    return {frames, frameDuration: duration, ...props, duration: frameLength * frames.length * duration};
}

export function createAnimation(
    source: string | HTMLImageElement | HTMLCanvasElement,
    dimensions: FrameDimensions,
    {x = 0, y = 0, rows = 1, cols = 1, xSpace = 0, ySpace = 0, top = 0, left = 0, duration = 8, frameMap = undefined}: CreateAnimationOptions = {},
    props: ExtraAnimationProperties = {},
): FrameAnimation {
    let frames: Frame[] = [];
    let frame: Frame;
    if (typeof source === 'string') {
        frame = requireFrame(source);
    } else {
        frame = {image: source, x: 0, y: 0, w: 0, h: 0};
    }
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            frames[row * cols + col] = {
                ...dimensions,
                image: frame.image,
                x: frame.x + left + (dimensions.w + xSpace) * (x + col),
                y: frame.y + top + (dimensions.h + ySpace) * (y + row),
            };
        }
    }
    // Say an animation has 3 frames, but you want to order them 0, 1, 2, 1, then pass frameMap = [0, 1, 2, 1],
    // to remap the order of the frames accordingly.
    if (frameMap) {
       frames = frameMap.map((originalIndex: number) => {
           if (!frames[originalIndex]) {
               console.error('Missing frame at index', originalIndex);
               debugger;
           }
           return frames[originalIndex];
       });
    }
    return {frames, frameDuration: duration, ...props, duration: frameLength * frames.length * duration};
};

export function getFrame(animation: FrameAnimation, animationTime: number): Frame {
    if (!animation) {
        const error = new Error('Encountered falsey animation in getFrame');
        console.error(error);
        debugger;
        throw error;
        //return {image: errorCanvas, x: 0, y: 0, w: 16, h: 16};
    }
    animationTime = Math.max(animationTime, 0);
    let frameIndex = Math.floor(animationTime / (frameLength * (animation.frameDuration || 1)));
    if (animation.loop === false) { // You can set this to prevent an animation from looping.
        frameIndex = Math.min(frameIndex, animation.frames.length - 1);
    }
    if (animation.loopFrame && frameIndex >= animation.frames.length) {
        frameIndex -= animation.loopFrame;
        frameIndex %= (animation.frames.length - animation.loopFrame);
        frameIndex += animation.loopFrame;
    }
    return animation.frames[frameIndex % animation.frames.length];
};

export function drawFrame(
    context: CanvasRenderingContext2D,
    {image, x, y, w, h}: Frame,
    {x: tx, y: ty, w: tw, h: th}: Rect
): void {
    // Drawing canvas elements can fail in Safari so we use a special function
    // to avoid this.
    if (image instanceof HTMLCanvasElement) {
        drawCanvas(context, image,
            {x: x | 0, y: y | 0, w: w | 0, h: h | 0},
            {x: tx, y: ty, w: tw, h: th}
        );
        // For unaliased graphics we should always use pixel coordinates.
        /*drawCanvas(context, image,
            {x: x | 0, y: y | 0, w: w | 0, h: h | 0},
            {x: tx | 0, y: ty | 0, w: tw | 0, h: th | 0}
        );*/
        return;
    }
    // (x | 0) is faster than Math.floor(x)
    context.drawImage(image, x | 0, y | 0, w | 0, h | 0, tx, ty, tw, th);
    // For unaliased graphics we should always use pixel coordinates.
    //context.drawImage(image, x | 0, y | 0, w | 0, h | 0, tx | 0, ty | 0, tw | 0, th | 0);
}

export function drawFrameContentAt(
    context: CanvasRenderingContext2D,
    frame: Frame,
    {x, y, z}: {x: number, y: number, z?: number}
): void {
    drawFrame(context, frame, {
        ...frame,
        x: x - (frame.content?.x || 0),
        y: y - (frame.content?.y || 0) - (z || 0),
    });
}
