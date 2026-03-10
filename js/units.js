// ════════════════════════════════════════════════════════
// ЮНИТЫ — фабрики для создания объектов юнитов
// Новый тип юнита → добавь фабрику здесь + параметры в config.js
// ════════════════════════════════════════════════════════

function mkPlayer(x, y) {
  return {
    id: uid(),
    kind: 'player',
    emoji: PLAYER_STATS.emoji,
    x, y,
    hp: PLAYER_STATS.hp,
    maxHp: PLAYER_STATS.maxHp,
    moveRange: PLAYER_STATS.moveRange,
    atkRange: PLAYER_STATS.atkRange,
    weapon: 'pistol',
    equipment: { weapon: 'pistol', armor: null, boots: null },
    poisoned: false,  // заражён укусом зомби
    moved: false,     // уже переместился в этот ход
    attacked: false,  // уже атаковал в этот ход
    alive: true,
  };
}

function mkZombie(x, y) {
  return {
    id: uid(),
    kind: 'zombie',
    emoji: ZOMBIE_STATS.emoji,
    x, y,
    hp: ZOMBIE_STATS.hp,
    maxHp: ZOMBIE_STATS.maxHp,
    moveRange: ZOMBIE_STATS.moveRange,
    atkRange: ZOMBIE_STATS.atkRange,
    atkDmg: ZOMBIE_STATS.atkDmg,
    poisonDmg: ZOMBIE_STATS.poisonDmg,
    moved: false,
    attacked: false,
    alive: true,
  };
}
