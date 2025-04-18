
// Each frame is 20 milliseconds.
export const frameLength = 20;

export const framesPerSecond = 1000 / frameLength;

export const canvas: HTMLCanvasElement = document.getElementsByClassName('js-mainCanvas')[0] as HTMLCanvasElement;

export const canvasScale = 1;

export const context: CanvasRenderingContext2D = canvas.getContext('2d')!;

// TODO: Start with this at 10 and increase it at various points in the game.
export const heroLevelCap = 100;

// Level buffer for penalties to experience gain from level disparities.
export const levelBuffer = 2;

// Size the controls how large UI elements are. Represents the size of a small square button and single line of text.
export const uiSize = 12;
export const uiPadding = uiSize;
export const buttonSize = 4 * uiSize;
export const tinyButtonSize = 2 * uiSize;

export const savedGameKey = 'minmaxer-savedGame';
