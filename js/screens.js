// ════════════════════════════════════════════════════════
// ЭКРАНЫ — управление видимостью и переключением экранов
// ════════════════════════════════════════════════════════

const SCREENS = {
  START: 'screen-start',
  INTRO: 'screen-intro',
  MAP: 'screen-map',
  SQUAD: 'screen-squad',
  SHOP: 'screen-shop',
  UNIT_DETAIL: 'screen-unit-detail',
  LEVEL_START: 'screen-level-start',
  BATTLE: 'screen-battle'
};

// Тип display для каждого экрана
// screen-battle должен быть block, иначе flex-контекст ломает grid
const SCREEN_DISPLAY = {
  'screen-start':       'flex',
  'screen-intro':      'flex',
  'screen-map':        'flex',
  'screen-squad':      'block',
  'screen-unit-detail':'flex',
  'screen-level-start':'block',
  'screen-battle':     'block',   // КЛЮЧЕВОЕ: block, не flex
};

let currentScreen = SCREENS.START;

// Показать экран
function showScreen(screenName) {
  hideAllScreens();
  const el = document.getElementById(screenName);
  if (el) {
    el.style.display = SCREEN_DISPLAY[screenName] || 'flex';
    currentScreen = screenName;
  }
}

// Скрыть все экраны
function hideAllScreens() {
  Object.values(SCREENS).forEach(screenId => {
    const el = document.getElementById(screenId);
    if (el) el.style.display = 'none';
  });
}

// Получить текущий экран
function getCurrentScreen() {
  return currentScreen;
}

// Вспомогательные функции переходов
function goToMap() {
  showScreen(SCREENS.MAP);
  renderMapScreen();
}

function goToSquad() {
  showScreen(SCREENS.SQUAD);
  renderSquadScreen();
}

function goToBattle(levelNum) {
  showScreen(SCREENS.BATTLE);
  startBattle(levelNum);
}

function goToLevelStart(levelNum) {
  showScreen(SCREENS.LEVEL_START);
  renderLevelStartScreen(levelNum);
}

// Переход на экран интро (ЛОР + имя)
function goToIntro() {
  showScreen(SCREENS.INTRO);
  renderIntroScreen();
}

// Переход в магазин
function goToShop() {
  showScreen(SCREENS.SHOP);
  renderShopScreen();
}
