import {registerMouseEventHandlers} from 'app/mouse';
import {registerKeyboardEventHandlers} from 'app/keyboard';
import {startRendering} from 'app/render';
import {startUpdating} from 'app/update';

// Begin updating the game state.
startUpdating();

// Begin rendering the game to the canvas.
startRendering();

// Register event handlers for the mouse.
registerMouseEventHandlers();
// Register event handlers for the mouse.
registerKeyboardEventHandlers();
