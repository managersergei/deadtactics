// ════════════════════════════════════════════════════════
// CONSTANTS — константы рендера и UI
// Вынесены из render.js для чистоты кода
// ════════════════════════════════════════════════════════

// ── РАЗМЕРЫ SVG КАРТЫ ───────────────────────────────────
const SVG_W = 800;
const SVG_H = 500;

// ── ПОЗИЦИИ УРОВНЕЙ НА КАРТЕ ────────────────────────────
const MAP_POSITIONS = [
  null,
  { x: 80,  y: 400 }, // 1
  { x: 180, y: 300 }, // 2
  { x: 280, y: 380 }, // 3
  { x: 360, y: 240 }, // 4
  { x: 460, y: 320 }, // 5
  { x: 520, y: 180 }, // 6
  { x: 610, y: 280 }, // 7
  { x: 670, y: 140 }, // 8
  { x: 740, y: 220 }, // 9
  { x: 760, y: 80  }, // 10
];

// ── ЦВЕТА КАРТЫ ────────────────────────────────────────
const MAP_COLORS = {
  // Заливка маркеров
  completed: '#1f4d14',
  current:   '#39ff14',
  available: '#2a7a20',
  locked:    '#1a2a1a',
  // Обводка маркеров
  strokeCompleted: '#2a6a20',
  strokeCurrent:   '#39ff14',
  strokeAvailable: '#2a7a20',
  strokeLocked:    '#0f2510',
};

// ── РАЗМЕРЫ МАРКЕРОВ ───────────────────────────────────
const MAP_MARKER = {
  r: 22,              // радиус круга
  strokeWidth: 1.5,  // толщина обводки
  currentStrokeWidth: 2.5,
};

// ── ДЕКОРАТИВНЫЕ ЗОМБИ НА ФОНЕ ────────────────────────
const MAP_ZOMBIE_BACKGROUND = [
  {x: 130, y: 450},
  {x: 320, y: 120},
  {x: 500, y: 420},
  {x: 650, y: 350},
  {x: 200, y: 200},
];

// Экспорт в глобальную область видимости для браузера
if (typeof window !== 'undefined') {
  window.SVG_W = SVG_W;
  window.SVG_H = SVG_H;
  window.MAP_POSITIONS = MAP_POSITIONS;
  window.MAP_COLORS = MAP_COLORS;
  window.MAP_MARKER = MAP_MARKER;
  window.MAP_ZOMBIE_BACKGROUND = MAP_ZOMBIE_BACKGROUND;
}
