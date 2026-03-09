// ════════════════════════════════════════════════════════
// СТЕЙТ — единственное место где живёт состояние игры
// Никогда не создавай отдельный стейт в других файлах
// ════════════════════════════════════════════════════════

let units = [];           // все юниты (живые и мёртвые)
let selected = null;      // выбранный юнит игрока (null если нет)
let phase = 'placement';  // 'placement' | 'player' | 'zombie' | 'over'
let placedCount = 0;      // сколько юнитов расставлено
let turnNum = 1;          // номер текущего хода

// Подсвеченные клетки { move: Set<"x,y">, attack: Set<"x,y"> }
let highlights = { move: new Set(), attack: new Set() };

// Счётчик для уникальных ID юнитов
let _uid = 0;
function uid() { return ++_uid; }

// Сброс стейта в начальное состояние
function resetState() {
  units = [];
  selected = null;
  phase = 'placement';
  placedCount = 0;
  turnNum = 1;
  highlights = { move: new Set(), attack: new Set() };
  _uid = 0;
}
