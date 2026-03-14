// ════════════════════════════════════════════════════════
// STATE MANAGER — Единственный источник правды о состоянии игры
// ════════════════════════════════════════════════════════

// Начальное состояние
const initialState = {
  units: [],
  selected: null,
  phase: 'placement', // 'placement' | 'player' | 'zombie' | 'over'
  placedCount: 0,
  turnNum: 1,
  turnsSurvived: 0,
  highlights: { move: new Set(), attack: new Set(), throw: new Set() },
  selectedSquadUnitId: null,
  stats: {
    zombiesKilled: 0,
    damageDealt: 0,
    damageTaken: 0,
    poisonDamageTaken: 0,
    turnsSurvived: 0,
    battlesPlayed: 0,
  },
  _uid: 0,
};

// Текущее состояние (Singleton)
const state = { ...initialState };

// ──────────────────────────────────────────────────────────
// ГЕТТЕРЫ И СЕТТЕРЫ

const getState = () => state;

const getUnits = () => state.units;
const setUnits = (units) => { state.units = units; };
const addUnit = (unit) => { state.units.push(unit); };

const getSelected = () => state.selected;
const setSelected = (unit) => { state.selected = unit; };

const getPhase = () => state.phase;
const setPhase = (phase) => { state.phase = phase; };

const getPlacedCount = () => state.placedCount;
const setPlacedCount = (count) => { state.placedCount = count; };
const incrementPlacedCount = () => { state.placedCount++; };

const getTurnNum = () => state.turnNum;
const setTurnNum = (n) => { state.turnNum = n; };
const nextTurn = () => { state.turnNum++; };

const getTurnsSurvived = () => state.turnsSurvived;
const setTurnsSurvived = (n) => { state.turnsSurvived = n; };
const incrementTurnsSurvived = () => { state.turnsSurvived++; };

const getHighlights = () => state.highlights;
const setHighlights = (h) => { state.highlights = h; };
const clearHighlights = () => { state.highlights = { move: new Set(), attack: new Set(), throw: new Set() }; };

const getStats = () => state.stats;

// Функции для статистики
const recordKill = () => { state.stats.zombiesKilled++; };
const recordDamageDealt = (amt) => { state.stats.damageDealt += amt; };
const recordDamageTaken = (amt) => { state.stats.damageTaken += amt; };
const recordPoisonDamage = (amt) => { state.stats.poisonDamageTaken += amt; };
const incrementBattlesPlayed = () => { state.stats.battlesPlayed++; };

// UID Generator
const uid = () => { return ++state._uid; };

// ──────────────────────────────────────────────────────────
// СБРОС СОСТОЯНИЯ
const resetState = () => {
  state.units = [];
  state.selected = null;
  state.phase = 'placement';
  state.placedCount = 0;
  state.turnNum = 1;
  state.turnsSurvived = 0;
  state.highlights = { move: new Set(), attack: new Set(), throw: new Set() };
  state.selectedSquadUnitId = null;
  state.stats = { ...initialState.stats };
  state._uid = 0;
};

const resetStats = () => {
  state.stats = { ...initialState.stats };
};

// ──────────────────────────────────────────────────────────
// ДЕЛАЕМ ВСЕ ГЛОБАЛЬНЫМИ ДЛЯ БРАУЗЕРА
if (typeof window !== 'undefined') {
  // Добавляем методы прямо на внутренний state объект
  state.getState = getState;
  state.getUnits = getUnits;
  state.setUnits = setUnits;
  state.addUnit = addUnit;
  state.getSelected = getSelected;
  state.setSelected = setSelected;
  state.getPhase = getPhase;
  state.setPhase = setPhase;
  state.getPlacedCount = getPlacedCount;
  state.setPlacedCount = setPlacedCount;
  state.incrementPlacedCount = incrementPlacedCount;
  state.getTurnNum = getTurnNum;
  state.setTurnNum = setTurnNum;
  state.nextTurn = nextTurn;
  state.getTurnsSurvived = getTurnsSurvived;
  state.setTurnsSurvived = setTurnsSurvived;
  state.incrementTurnsSurvived = incrementTurnsSurvived;
  state.getHighlights = getHighlights;
  state.setHighlights = setHighlights;
  state.clearHighlights = clearHighlights;
  state.getStats = getStats;
  state.recordKill = recordKill;
  state.recordDamageDealt = recordDamageDealt;
  state.recordDamageTaken = recordDamageTaken;
  state.recordPoisonDamage = recordPoisonDamage;
  state.incrementBattlesPlayed = incrementBattlesPlayed;
  state.uid = uid;
  state.resetState = resetState;
  state.resetStats = resetStats;

  // Теперь window.state — это сам state, а не копия
  window.state = state;
}
