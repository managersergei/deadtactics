// ════════════════════════════════════════════════════════
// КОНФИГ — все константы и параметры юнитов
// Меняй баланс только здесь, не хардкодь числа в логике
// ════════════════════════════════════════════════════════

const COLS = 10;
const ROWS = 8;

// Колонки доступные для расстановки игрока (левая половина)
// при ширине 10 → первые 2 столбцов (0‑1)
const PLACE_COLS = [0, 1];

// Сколько юнитов игрок расставляет перед боем
const PLAYER_UNIT_COUNT = 2;

// Стартовые позиции зомби [x, y]
const ZOMBIE_SPAWN_POSITIONS = [[7, 0], [7, 3], [6, 5]];

// Параметры выжившего
const PLAYER_STATS = {
  hp: 5,
  maxHp: 5,
  moveRange: 5,
  atkRange: 4,
  emoji: '🧍',
};

// Оружие и его параметры
const WEAPONS = {
  pistol: {
    baseDmg: 1,
    critDmg: 2,
    critChance: 0.10,
  },
};

// Параметры зомби
const ZOMBIE_STATS = {
  hp: 3,
  maxHp: 3,
  moveRange: 3,
  atkRange: 1,
  atkDmg: 1,
  poisonDmg: 1,   // урон яда в начале каждого хода игрока
  emoji: '🧟',
};

// Задержка между действиями зомби в мс (анимационная пауза)
const ZOMBIE_ACTION_DELAY = 550;
const ZOMBIE_TURN_END_DELAY = 200;

// Тексты ЛОРа для интро
const LORE_MESSAGES = [
  '2073 год. Нам удалось избежать третью мировую, и была даже надежда на спасение человечества.',
  'Все планы были уничтожены из-за вырвавшейся из под контроля бактерии, которая мутировала и превратила 99% людей в опасных агрессивных существ.',
  'Я выжил, потому что это единственное, что я умею.',
  'Мне всегда казалось, что мы рано или поздно уничтожим сами себя. Но чтобы вот сказки стали реальностью...',
  'Надо идти дальше. Я убираю нож в свой именной чехол, который мне подарили еще 10 лет назад.'
];

// Конфигурация уровней (10 уровней)
// position: {x, y} - позиция на карте в процентах (0-100)
const LEVELS = {
  1: {
    id: 1,
    name: 'Скверы',
    description: 'Первая встреча с зомби',
    enemyCount: 2,
    baseReward: 10,
    difficulty: 1,
    position: { x: 10, y: 80 }
  },
  2: {
    id: 2,
    name: 'Супермаркет',
    description: 'Магазин с припасами',
    enemyCount: 2,
    baseReward: 12,
    difficulty: 1,
    position: { x: 20, y: 60 }
  },
  3: {
    id: 3,
    name: 'Шоссе',
    description: 'Дорога полна опасностей',
    enemyCount: 3,
    baseReward: 15,
    difficulty: 2,
    position: { x: 30, y: 75 }
  },
  4: {
    id: 4,
    name: 'Автосервис',
    description: 'Заброшенная станция',
    enemyCount: 3,
    baseReward: 15,
    difficulty: 2,
    position: { x: 40, y: 50 }
  },
  5: {
    id: 5,
    name: 'Метро',
    description: 'Подземные туннели',
    enemyCount: 4,
    baseReward: 20,
    difficulty: 2,
    position: { x: 50, y: 70 }
  },
  6: {
    id: 6,
    name: 'Больница',
    description: 'Зараженное здание',
    enemyCount: 4,
    baseReward: 20,
    difficulty: 3,
    position: { x: 60, y: 45 }
  },
  7: {
    id: 7,
    name: 'Полицейский участок',
    description: 'Оружие и зомби',
    enemyCount: 5,
    baseReward: 25,
    difficulty: 3,
    position: { x: 70, y: 65 }
  },
  8: {
    id: 8,
    name: 'Военная база',
    description: 'Последний рубеж обороны',
    enemyCount: 5,
    baseReward: 30,
    difficulty: 3,
    position: { x: 80, y: 40 }
  },
  9: {
    id: 9,
    name: 'Аэропорт',
    description: 'Путь к спасению близок',
    enemyCount: 6,
    baseReward: 35,
    difficulty: 4,
    position: { x: 75, y: 20 }
  },
  10: {
    id: 10,
    name: 'Бункер',
    description: 'Финальная битва',
    enemyCount: 8,
    baseReward: 50,
    difficulty: 5,
    position: { x: 90, y: 10 }
  }
};
