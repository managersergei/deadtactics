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

// Конфигурация уровней (3 уровня)
const LEVELS = {
  1: {
    id: 1,
    name: 'Скверы города',
    description: 'Первая встреча с зомби. Несколько слабых врагов на открытом месте.',
    enemyCount: 2,
    baseReward: 10,
    difficulty: 1
  },
  2: {
    id: 2,
    name: 'Метро',
    description: 'Подземные ходы метро. Враги становятся сильнее.',
    enemyCount: 3,
    baseReward: 10,
    difficulty: 2
  },
  3: {
    id: 3,
    name: 'Подземелье',
    description: 'Глубокие катакомбы под городом. Финальное испытание.',
    enemyCount: 4,
    baseReward: 10,
    difficulty: 3
  }
};
