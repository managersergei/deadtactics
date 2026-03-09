// ════════════════════════════════════════════════════════
// ДАННЫЕ — данные игрока и отряда (в памяти)
// ════════════════════════════════════════════════════════

const PLAYER_NAMES = [
  'Алекс', 'Белла', 'Виктор', 'Дарья', 'Егор',
  'Жанна', 'Запад', 'Ирина', 'Йосиф', 'Карл'
];

// Инициализация данных игры
let gameData = {
  player: {
    name: '',
    gold: 0,
    avatar: '🧍',
    level: 1,
    leadership: 1  // определяет максимум юнитов в отряде (1 в начале)
  },
  
  squad: [],  // массив юнитов { id, name, emoji, stats... }
  
  levelProgress: {
    1: { status: 'available', completed: false, reward: 10, enemyCount: 2 },
    2: { status: 'locked', completed: false, reward: 10, enemyCount: 3 },
    3: { status: 'locked', completed: false, reward: 10, enemyCount: 4 }
  },
  
  currentLevel: null  // выбранный уровень для боя
};

// Инициализировать новую игру
function initializeNewGame() {
  gameData.player.name = PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
  gameData.player.gold = 0;
  
  // Создать первого юнита для отряда
  const startingUnit = {
    id: 1,
    name: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
    emoji: '🧍',
    // копируем параметры из конфига, чтобы не дублировать числа
    hp: PLAYER_STATS.hp,
    maxHp: PLAYER_STATS.maxHp,
    moveRange: PLAYER_STATS.moveRange,
    atkRange: PLAYER_STATS.atkRange,
    weapon: 'pistol',
    equipment: { armor: null, special: null, consumable: null },
    personalStats: {  // статистика конкретного юнита
      zombiesKilled: 0,
      damageTaken: 0,
      totalDamageDealt: 0,
      battlesPlayed: 0
    }
  };
  
  gameData.squad.push(startingUnit);
  gameData.levelProgress[1].status = 'available';
}

// Добавить золото игроку
function addGold(amount) {
  gameData.player.gold += amount;
}

// Завершить уровень
function completeLevel(levelNum, stats) {
  if (gameData.levelProgress[levelNum]) {
    gameData.levelProgress[levelNum].completed = true;
    gameData.levelProgress[levelNum].status = 'completed';
    
    // Начисление награды: базовая + 5 за каждого убитого зомби
    const levelReward = gameData.levelProgress[levelNum].reward;
    const killBonus = stats.zombiesKilled * 5;
    const totalReward = levelReward + killBonus;
    
    addGold(totalReward);
    
    // Открыть следующий уровень если есть
    if (levelNum < 3 && gameData.levelProgress[levelNum + 1]) {
      gameData.levelProgress[levelNum + 1].status = 'available';
    }
    
    return totalReward;
  }
  return 0;
}

// Получить юнита по ID
function getUnitById(unitId) {
  return gameData.squad.find(u => u.id === unitId);
}

// Обновить статистику юнита после боя
function updateUnitStats(unitId, battleStats) {
  const unit = getUnitById(unitId);
  if (unit && unit.personalStats) {
    unit.personalStats.zombiesKilled += battleStats.zombiesKilled || 0;
    unit.personalStats.damageTaken += battleStats.damageTaken || 0;
    unit.personalStats.totalDamageDealt += battleStats.damageDealt || 0;
    unit.personalStats.battlesPlayed += 1;
  }
}

// Получить информацию о уровне
function getLevelInfo(levelNum) {
  return {
    id: levelNum,
    name: LEVELS[levelNum].name,
    description: LEVELS[levelNum].description,
    status: gameData.levelProgress[levelNum]?.status || 'locked',
    completed: gameData.levelProgress[levelNum]?.completed || false,
    enemyCount: gameData.levelProgress[levelNum]?.enemyCount || 0,
    reward: gameData.levelProgress[levelNum]?.reward || 0
  };
}

// Сбросить всё (для разработки/тестирования)
function resetGameData() {
  gameData = {
    player: { name: '', gold: 0, avatar: '🧍', level: 1, leadership: 1 },
    squad: [],
    levelProgress: {
      1: { status: 'available', completed: false, reward: 10, enemyCount: 2 },
      2: { status: 'locked', completed: false, reward: 10, enemyCount: 3 },
      3: { status: 'locked', completed: false, reward: 10, enemyCount: 4 }
    },
    currentLevel: null
  };
  initializeNewGame();
}

// Инициализировать данные при запуске
initializeNewGame();