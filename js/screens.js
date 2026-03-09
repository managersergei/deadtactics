// ════════════════════════════════════════════════════════
// ЭКРАНЫ — управление видимостью и переключением экранов
// ════════════════════════════════════════════════════════

const SCREENS = {
  START: 'screen-start',
  INTRO: 'screen-intro',
  MAP: 'screen-map',
  SQUAD: 'screen-squad',
  UNIT_DETAIL: 'screen-unit-detail',
  LEVEL_START: 'screen-level-start',
  BATTLE: 'screen-battle'
};

let currentScreen = SCREENS.START;

// Показать экран
function showScreen(screenName) {
  hideAllScreens();
  const el = document.getElementById(screenName);
  if (el) {
    el.style.display = 'flex';
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
