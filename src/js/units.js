// ════════════════════════════════════════════════════════
// ЮНИТЫ — фабрики для создания объектов юнитов
// Новый тип юнита → добавь фабрику здесь + параметры в config.js
// ════════════════════════════════════════════════════════

function mkPlayer(x, y, squadUnit) {
  // Получаем equipment из squadUnit или используем по умолчанию
  const eq = squadUnit?.equipment || { weapon: 'pistol', armor: null, boots: null };
  
  // Рассчитываем эффективные статы с учётом снаряжения
  const effectiveMaxHp = getEffectiveStat(squadUnit, 'maxHp') || PLAYER_STATS.maxHp;
  const effectiveMoveRange = getEffectiveStat(squadUnit, 'moveRange') || PLAYER_STATS.moveRange;
  
  return {
    id: uid(),
    name: squadUnit?.name || 'Выживший',
    kind: UNIT_TYPES.SURVIVOR,
    emoji: squadUnit?.emoji || PLAYER_STATS.emoji,
    x, y,
    hp: effectiveMaxHp,           // HP полный в начале боя
    maxHp: effectiveMaxHp,        // Макс. HP с учётом брони
    moveRange: effectiveMoveRange, // Диапазон движения с учётом ботинок
    atkRange: PLAYER_STATS.atkRange,
    weapon: 'pistol',             // Base weapon (actual used is in equipment)
    equipment: eq,                 // Снаряжение из squad
    poisoned: false,              // заражён укусом зомби
    moved: false,                 // уже переместился в этот ход
    attacked: false,              // уже атаковал в этот ход
    shotsFired: 0,               // количество выстрелов (для перезарядки)
    reloading: false,             // идёт перезарядка
    alive: true,
    direction: 'right',           // направление взгляда
  };
}

function mkZombie(x, y) {
  return {
    id: uid(),
    kind: UNIT_TYPES.ZOMBIE,
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
    direction: 'left',  // зомби обычно появляются справа и смотрят влево
  };
}
