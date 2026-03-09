// ════════════════════════════════════════════════════════
// СТАТИСТИКА — отслеживание прогресса игры
// ════════════════════════════════════════════════════════

let stats = {
  zombiesKilled: 0,
  damageDealt: 0,
  damageTaken: 0,
  poisonDamageTaken: 0,
  turnsSurvived: 0,
  battlesPlayed: 0,
};

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
  stats = {
    zombiesKilled: 0,
    damageDealt: 0,
    damageTaken: 0,
    poisonDamageTaken: 0,
    turnsSurvived: 0,
    battlesPlayed: 0,
  };
}