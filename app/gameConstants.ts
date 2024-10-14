
// Each frame is 20 milliseconds.
export const frameLength = 20;

export const framesPerSecond = 1000 / frameLength;

export const canvas: HTMLCanvasElement = document.getElementsByClassName('js-mainCanvas')[0] as HTMLCanvasElement;

export const canvasScale = 1;

export const context: CanvasRenderingContext2D = canvas.getContext('2d')!;

export const heroLevelCap = 20;

// Level buffer for penalties to experience gain from level disparities.
export const levelBuffer = 2;
