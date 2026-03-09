// ════════════════════════════════════════════════════════
// СТАТИСТИКА — отслеживание прогресса игры
// ════════════════════════════════════════════════════════

// stats объект объявлен в state.js, здесь просто используем его
function recordKill() {
  stats.zombiesKilled++;
}

function recordDamageDealt(amt) {
  stats.damageDealt += amt;
}

function recordDamageTaken(amt) {
  stats.damageTaken += amt;
}

function recordPoisonDamage(amt) {
  stats.poisonDamageTaken += amt;
}

function getStats() {
  return { ...stats };
}

function resetStats() {
  // перезаписать поля существующего объекта
  Object.assign(stats, {
    zombiesKilled: 0,
    damageDealt: 0,
    damageTaken: 0,
    poisonDamageTaken: 0,
    turnsSurvived: 0,
    battlesPlayed: 0,
  });
}

// Node exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    recordKill,
    recordDamageDealt,
    recordDamageTaken,
    recordPoisonDamage,
    getStats,
    resetStats,
  };
}