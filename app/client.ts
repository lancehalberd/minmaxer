// Make sure this is imported before anythign that references items.
import 'app/definitions/itemDefinitions';
// This file must be imported to initialize all enemy definitions.
import 'app/definitions/enemyDefinitions';
import 'app/definitions/bosses/medusa';
import 'app/definitions/bosses/phoenix';

import {registerMouseEventHandlers} from 'app/mouse';
import {registerKeyboardEventHandlers} from 'app/keyboard';
import {startRendering} from 'app/render';
import {startUpdating} from 'app/update';
import {setState} from 'app/state';
import {loadGame} from 'app/utils/loadGame';


setState(loadGame());

// Begin updating the game state.
startUpdating();

// Begin rendering the game to the canvas.
startRendering();

// Register event handlers for the mouse.
registerMouseEventHandlers();
// Register event handlers for the mouse.
registerKeyboardEventHandlers();
