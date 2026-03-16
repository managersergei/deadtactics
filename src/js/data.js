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
    leadership: 2  // определяет максимум юнитов в отряде (2 в начале)
  },
  
  squad: [],  // массив юнитов { id, name, emoji, stats... }
  
  levelProgress: {
    1: { status: 'available', completed: false, reward: 10, enemyCount: 2 },
    2: { status: 'locked', completed: false, reward: 12, enemyCount: 2 },
    3: { status: 'locked', completed: false, reward: 15, enemyCount: 3 },
    4: { status: 'locked', completed: false, reward: 15, enemyCount: 3 },
    5: { status: 'locked', completed: false, reward: 20, enemyCount: 4 },
    6: { status: 'locked', completed: false, reward: 20, enemyCount: 4 },
    7: { status: 'locked', completed: false, reward: 25, enemyCount: 5 },
    8: { status: 'locked', completed: false, reward: 30, enemyCount: 5 },
    9: { status: 'locked', completed: false, reward: 35, enemyCount: 6 },
    10: { status: 'locked', completed: false, reward: 50, enemyCount: 8 }
  },
  
  currentLevel: null  // выбранный уровень для боя
};

// Обновить лидерство = максимум юнитов в отряде (минимум 2)
function updateLeadership() {
  gameData.player.leadership = Math.max(2, gameData.squad.length);
}

// Инициализировать новую игру
function initializeNewGame() {
  // Не перезаписывать имя если игрок уже ввёл его в интро
  if (!gameData.player.name) {
    gameData.player.name = PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
  }
  gameData.player.gold = 1000;
  
  // Создать первого юнита для отряда (лидер отряда)
  const startingUnit = {
    id: 1,
    name: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
    emoji: '🧍',
    role: 'leader',  // лидер отряда
    // копируем параметры из конфига, чтобы не дублировать числа
    hp: PLAYER_STATS.hp,
    maxHp: PLAYER_STATS.maxHp,
    moveRange: PLAYER_STATS.moveRange,
    atkRange: PLAYER_STATS.atkRange,
    weapon: 'pistol',
    equipment: { armor: null, special: null, consumable: null, charges: {} },
    personalStats: {  // статистика конкретного юнита
      zombiesKilled: 0,
      damageTaken: 0,
      totalDamageDealt: 0,
      battlesPlayed: 0
    }
  };
  
  gameData.squad.push(startingUnit);
  // Лидерство = макс. юнитов в отряде, но минимум 2
  gameData.player.leadership = Math.max(2, gameData.squad.length);
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
    if (levelNum < 10 && gameData.levelProgress[levelNum + 1]) {
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

// Купить предмет для юнита
function buyItem(unitId, itemId) {
  const item = ITEMS[itemId];
  const unit = getUnitById(unitId);
  
  // Проверки
  if (!item) return { success: false, reason: 'Предмет не найден' };
  if (!unit) return { success: false, reason: 'Юнит не найден' };
  if (gameData.player.gold < item.price) return { success: false, reason: 'Недостаточно золота' };
  
  // Списать золото
  gameData.player.gold -= item.price;
  
  // Экипировать предмет (создать equipment если нет)
  if (!unit.equipment) {
    unit.equipment = { weapon: 'pistol', armor: null, boots: null, charges: {} };
  }
  
  // Инициализировать charges если его нет (для старых сохранений)
  if (!unit.equipment.charges) {
    unit.equipment.charges = {};
  }
  
  // Расходники - не экипируются, а добавляются в inventory
  if (item.type === 'consumable') {
    if (!unit.inventory) unit.inventory = {};
    unit.inventory[itemId] = (unit.inventory[itemId] || 0) + 1;
  } else {
    // Обычные предметы - экипируем
    if (item.type === 'weapon') {
      unit.equipment.weapon = itemId;
    } else {
      // === Синхронизация HP при изменении лимита здоровья через экипировку ===
      // maxHp вычисляется в getEffectiveStat() в helpers.js - здесь только обновляем текущий HP
      if (item.type === 'armor' && item.extraHp) {
        const oldArmorId = unit.equipment.armor;
        const oldArmor = oldArmorId ? ITEMS[oldArmorId] : null;
        const oldExtraHp = oldArmor?.extraHp || 0;
        const newExtraHp = item.extraHp || 0;
        const diff = newExtraHp - oldExtraHp;
        
        // Применяем разницу к HP (может быть +2, +1, 0, -1)
        if (diff !== 0) {
          // maxHp НЕ обновляем - оно вычисляется в getEffectiveStat()!
          unit.hp = (unit.hp || PLAYER_STATS.hp) + diff;
        }
      }
      
      // Записываем новую броню
      unit.equipment[item.type] = itemId;
    }
    
    // Если предмет имеет blockPoison и maxCharges - инициализировать charges
    // Используем расширение объекта чтобы не затереть другие charges
    if (item.blockPoison && item.maxCharges) {
      unit.equipment.charges = {
        ...unit.equipment.charges,
        [item.id]: item.maxCharges
      };
    }
  }
  
  return { success: true };
}

// Нанять нового юнита в отряд
function recruitUnit(type) {
  const recruit = RECRUITS[type];
  
  // Проверки
  if (!recruit) return { success: false, reason: 'Тип юнита не найден' };
  if (gameData.player.gold < recruit.price) return { success: false, reason: 'Недостаточно золота' };
  if (gameData.squad.length >= gameData.player.leadership) return { success: false, reason: 'Отряд полон' };
  
  // Списать золото
  gameData.player.gold -= recruit.price;
  
  // Создать нового юнита (член отряда)
  const newUnit = {
    id: Date.now(),  // уникальный ID
    name: PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)],
    emoji: recruit.emoji,
    role: 'member',  // член отряда (не лидер)
    hp: recruit.hp,
    maxHp: recruit.maxHp,
    moveRange: recruit.moveRange,
    atkRange: recruit.atkRange,
    equipment: { weapon: 'pistol', armor: null, boots: null, charges: {} },
    personalStats: {
      zombiesKilled: 0,
      damageTaken: 0,
      totalDamageDealt: 0,
      battlesPlayed: 0
    }
  };
  
  gameData.squad.push(newUnit);
  updateLeadership();  // обновить лидерство после найма
  return { success: true, unit: newUnit };
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

// Синхронизировать HP и charges юнитов после боя
function syncSquadWithBattleState(battleUnits) {
  // Итерируем с конца чтобы можно было удалять элементы
  for (let i = gameData.squad.length - 1; i >= 0; i--) {
    const squadUnit = gameData.squad[i];
    const battleUnit = battleUnits.find(u => u.id === squadUnit.id);
    
    if (!battleUnit) continue; // юнит не был в бою
    
    if (battleUnit.alive) {
      // Живой юнит - сохраняем HP и charges
      squadUnit.hp = battleUnit.hp;
      if (battleUnit.equipment?.charges) {
        squadUnit.equipment.charges = { ...battleUnit.equipment.charges };
      }
    } else {
      // Мёртвый юнит - удаляем из отряда
      gameData.squad.splice(i, 1);
    }
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
