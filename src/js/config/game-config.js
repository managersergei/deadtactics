// ════════════════════════════════════════════════════════
// КОНФИГ — все константы и параметры юнитов
// Меняй баланс только здесь, не хардкодь числа в логике
// ════════════════════════════════════════════════════════

// Типы юнитов — используй константы, НЕ хардкодь строки
const UNIT_TYPES = {
  SURVIVOR: 'survivor',
  ZOMBIE: 'zombie',
};

// Делаем переменные глобальными для браузера
if (typeof window !== 'undefined') {
  window.CONFIG = {};
}

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
  moveRange : 4,
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

// ════════════════════════════════════════════════════════
// ПРЕДМЕТЫ МАГАЗИНА
// ════════════════════════════════════════════════════════

const ITEM_TYPES = {
  WEAPON: 'weapon',
  ARMOR:  'armor',
  BOOTS:  'boots',
};

const ITEMS = {
  // ОРУЖИЕ
  pistol:  { id: 'pistol',  name: 'Пистолет',  type: 'weapon', price: 0,   baseDmg: 1, critDmg: 2, critChance: 0.10, shots: 1, isRanged: true,  atkRange: 4, desc: 'Надёжное оружие ближнего боя. 10% крит' },
  uzi:     { id: 'uzi',     name: 'Узи',       type: 'weapon', price: 80,  baseDmg: 1, critDmg: 3, critChance: 0.10, midDmg: 2, midChance: 0.40, shots: 1, isRanged: true,  atkRange: 4, desc: 'Автоматический огонь' },
  rifle:   { id: 'rifle',   name: 'Автомат',   type: 'weapon', price: 120, baseDmg: 2, critDmg: 3, critChance: 0.30, shots: 2, isRanged: true,  atkRange: 5, desc: 'Два выстрела за ход' },
  rocket:  { id: 'rocket',  name: 'Ракетница', type: 'weapon', price: 200, baseDmg: 3, critDmg: 5, critChance: 0.20, splashRange: 1, shots: 1, isRanged: true,  atkRange: 3, desc: 'Урон по площади' },
  
  // БРОНЯ
  vest:    { id: 'vest',    name: 'Броник',    type: 'armor',  price: 60,  extraHp: 2, blockPoison: true, isRanged: false, desc: 'Защита +2 HP, блокирует яд 2 хода' },
  
  // ОБУВЬ
  shoes:   { id: 'shoes',   name: 'Кроссовки', type: 'boots',  price: 40,  moveBonus: 1, isRanged: false, desc: '+1 клетка движения' },
};

// РЕКРУТЫ
const RECRUITS = {
  survivor: { 
    id: 'survivor', 
    name: 'Выживший', 
    type: 'survivor',
    description: 'Обычный выживший. Не имеет особых навыков, но может использовать любое оружие.',
    price: 150, 
    emoji: '🧍', 
    hp: 5, maxHp: 5, moveRange: 4, atkRange: 4 
  },
};

// ТИПЫ ЗОМБИ
const ZOMBIE_TYPES = {
  zombie: {
    id: 'zombie',
    name: 'Зомби',
    type: 'zombie',
    description: 'Безмозглое существо, не знающее боли и страха. Наносит укус и заражает ядом.',
    atkProperties: 'Отравление: -1 HP каждый ход до конца игры',
  }
};

// Параметры зомби (используем дефолтный тип)
const ZOMBIE_STATS = {
  hp: 3,
  maxHp: 3,
  moveRange: 3,
  atkRange: 1,
  atkDmg: 1,
  poisonDmg: 1,   // урон яда в начале каждого хода игрока
  emoji: '🧟',
  type: 'zombie',  // ссылка на тип зомби
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

// Делаем все переменные глобальными для браузера
if (typeof window !== 'undefined') {
  // Индивидуальные переменные
  window.COLS = COLS;
  window.ROWS = ROWS;
  window.PLACE_COLS = PLACE_COLS;
  window.PLAYER_UNIT_COUNT = PLAYER_UNIT_COUNT;
  window.ZOMBIE_SPAWN_POSITIONS = ZOMBIE_SPAWN_POSITIONS;
  window.PLAYER_STATS = PLAYER_STATS;
  window.WEAPONS = WEAPONS;
  window.ITEM_TYPES = ITEM_TYPES;
  window.ITEMS = ITEMS;
  window.RECRUITS = RECRUITS;
  window.ZOMBIE_TYPES = ZOMBIE_TYPES;
  window.ZOMBIE_STATS = ZOMBIE_STATS;
  window.ZOMBIE_ACTION_DELAY = ZOMBIE_ACTION_DELAY;
  window.ZOMBIE_TURN_END_DELAY = ZOMBIE_TURN_END_DELAY;
  window.LORE_MESSAGES = LORE_MESSAGES;
  window.LEVELS = LEVELS;
  
  // Объект-конфиг (для совместимости)
  window.CONFIG = {
    COLS, ROWS, PLACE_COLS, PLAYER_UNIT_COUNT, ZOMBIE_SPAWN_POSITIONS,
    PLAYER_STATS, WEAPONS, ITEM_TYPES, ITEMS, RECRUITS, ZOMBIE_TYPES,
    ZOMBIE_STATS, ZOMBIE_ACTION_DELAY, ZOMBIE_TURN_END_DELAY, LORE_MESSAGES, LEVELS,
    UNIT_TYPES,
  };
  
  // Константы типов — в глобальную видимость
  window.UNIT_TYPES = UNIT_TYPES;
}

// Экспорт для Node.js (тесты)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLS, ROWS, PLACE_COLS, PLAYER_UNIT_COUNT, ZOMBIE_SPAWN_POSITIONS,
    PLAYER_STATS, WEAPONS, ITEM_TYPES, ITEMS, RECRUITS, ZOMBIE_TYPES,
    ZOMBIE_STATS, ZOMBIE_ACTION_DELAY, ZOMBIE_TURN_END_DELAY, LORE_MESSAGES, LEVELS,
    UNIT_TYPES,
  };
}
