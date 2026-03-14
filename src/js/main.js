import { uiConstants, gameConfig } from './config/ui-constants.js';
import { state, helpers } from './core/state.js';

// Используйте импортированные объекты напрямую
console.log(uiConstants.SOME_CONSTANT);
console.log(gameConfig.SOME_CONFIG);
console.log(state.someStateVariable);
console.log(helpers.someHelperFunction());
