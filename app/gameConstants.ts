
// Each frame is 20 milliseconds.
export const frameLength = 20;

export const framesPerSecond = 1000 / frameLength;

export const canvas: HTMLCanvasElement = document.getElementsByClassName('js-mainCanvas')[0] as HTMLCanvasElement;

export const context = canvas.getContext('2d');
