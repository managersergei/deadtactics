import * as uiConstants from './config/ui-constants.js';
import * as gameConfig from './config/game-config.js';
import * as state from './core/state.js';
import * as helpers from './core/helpers.js';

Object.assign(window, uiConstants, gameConfig, state, helpers);
