// ════════════════════════════════════════════════════════
// ИГРА — главная логика, обработчики, управление ходами
// Точка входа для всех игровых действий
// ════════════════════════════════════════════════════════

// Функции state доступны через window.state

// ── Обработчик клика по клетке ────────────────────────────

function onCellClick(c, r) {
  const phase = state.getPhase();
  if (phase === 'placement') handlePlacement(c, r);
  else if (phase === 'player') handlePlayer(c, r);
}

// ── Фаза расстановки ──────────────────────────────────────

function handlePlacement(c, r) {
  if (!PLACE_COLS.includes(c)) return;
  if (unitAt(c, r)) return;

  const currentPlacedCount = state.getPlacedCount();
  // Получаем юнита из отряда для передачи его снаряжения
  const squadUnit = gameData.squad[currentPlacedCount];
  const newUnit = mkPlayer(c, r, squadUnit);
  state.addUnit(newUnit);
  state.incrementPlacedCount();
  log(`⬛ Юнит размещён на [${c+1},${r+1}]`);

  // игрок может расставить не больше leadership или размера отряда
  const maxPlace = Math.min(gameData.player.leadership, gameData.squad.length);
  if (state.getPlacedCount() >= maxPlace) {
    // Спауним зомби для текущего уровня
    spawnZombiesForLevel(gameData.currentLevel);
    state.setPhase('player');
    log('════ БОЙ НАЧАЛСЯ ════', 'win');
    log(`Ход ${state.getTurnNum()} · Ваши действия`, 'sys');
  }
  render();
}

function spawnZombies() {
  // определяем сколько зомби нужно разместить (раньше было по константе)
  const count = ZOMBIE_SPAWN_POSITIONS.length;
  randomZombiePositions(count).forEach(([x, y]) => state.addUnit(mkZombie(x, y)));
  log('🧟🧟🧟 Зомби появились!', 'zombie-act');
}

// Создать зомби для конкретного уровня
function spawnZombiesForLevel(levelNum) {
  const levelInfo = LEVELS[levelNum];
  if (!levelInfo) return;
  
  // Расставить зомби-врагов (НЕ очищаем units, потому что там уже есть игроки)
  const enemyCount = levelInfo.enemyCount || 2;
  const positions = randomZombiePositions(enemyCount);
  
  positions.forEach(([x, y]) => {
    state.addUnit(mkZombie(x, y));
  });
  
  log(`🧟 На этом уровне ${enemyCount} врагов!`, 'zombie-act');
}

// ── Ход игрока ────────────────────────────────────────────

function handlePlayer(c, r) {
  const clicked = unitAt(c, r);
  const key = `${c},${r}`;
  const selected = state.getSelected();
  const highlights = state.getHighlights();

  // 1. Клик на своего юнита → выбрать
  if (clicked && clicked.kind === 'player') {
    // Отмена выбора при повторном клике на того же юнита
    if (selected && clicked.id === selected.id) {
      state.setSelected(null);
      state.clearHighlights();
      render();
      return;
    }

    state.setSelected(clicked);
    recalcHighlights();
    render();
    return;
  }

  // 2. Если игрок ВЫБРАН - проверяем атаку и движение
  if (selected && selected.kind === 'player') {
    // Атаковать врага (в зоне поражения)
    if (highlights.attack.has(key) && clicked && clicked.kind === 'zombie') {
      doAttack(selected, clicked);
      return;
    }

    // Переместиться (в зоне движения)
    if (highlights.move.has(key)) {
      doMove(selected, c, r);
      return;
    }

    // Клик на зомби НЕ в зоне → показать инфу о зомби
    if (clicked && clicked.kind === 'zombie') {
      state.setSelected(clicked);
      render();
      return;
    }

    // Клик на пустую клетку → снять выбор
    state.setSelected(null);
    state.clearHighlights();
    render();
    return;
  }

  // 3. Если игрок НЕ выбран - клик на зомби для инфы
  if (clicked && clicked.kind === 'zombie') {
    state.setSelected(clicked);
    render();
    return;
  }
  
  render();
}

// Пересчитать подсвеченные клетки для выбранного юнита
function recalcHighlights() {
  state.clearHighlights();
  const selected = state.getSelected();
  if (!selected || selected.kind !== 'player') return;
  const u = selected;

  // Синяя зона движения — если ещё не переместился
  if (!u.moved) {
    reachable(u).forEach(([c, r]) => {
      const highlights = state.getHighlights();
      highlights.move.add(`${c},${r}`);
    });
  }

  // Красная зона атаки — если ещё не атаковал
  if (!u.attacked) {
    aliveZombies().forEach(e => {
      const highlights = state.getHighlights();
      if (manhattan(u, e) <= u.atkRange) highlights.attack.add(`${e.x},${e.y}`);
    });
  }
}

function doMove(u, c, r) {
  log(`▶ Переместился на [${c+1},${r+1}]`, 'move');
  u.x = c; u.y = r;
  u.moved = true;
  playFootstep();
  state.clearHighlights(); // после движения атаки нет
  render();
  checkEnd();
}

function doAttack(attacker, target) {
  // Получаем эффективное оружие из снаряжения
  const weaponId = getEffectiveStat(attacker, 'weapon');
  const damageArr = calcDamage(weaponId);
  const damage = damageArr[0];
  const isCrit = damage === ITEMS[weaponId].critDmg;
  target.hp -= damage;
  state.recordDamageDealt(damage);
  attacker.attacked = true;
  playShot();
  log(`💥 Атака${isCrit ? ' (КРИТ!)' : ''} → зомби [${target.x+1},${target.y+1}] — ${target.hp}/${target.maxHp}HP`, 'dmg');

  if (target.hp <= 0) {
    target.alive = false;
    state.recordKill();
    log(`💀 Зомби уничтожен!`, 'dmg');
  }

  state.clearHighlights();
  state.setSelected(null);
  render();
  checkEnd();
}

// ── Смена хода ────────────────────────────────────────────

// Кнопка "Завершить ход"
document.getElementById('btn-end-turn').addEventListener('click', () => {
  if (state.getPhase() !== 'player') return;
  state.setSelected(null);
  state.clearHighlights();
  state.setPhase('zombie');
  render();
  setTimeout(runZombies, 400);
});

// Ход игрока: сбросить флаги, применить яд
function startPlayerTurn() {
  state.incrementTurnsSurvived();
  if (state.getPhase() === 'over') return;
  state.nextTurn();

  // Сбросить флаги действий
  state.getUnits().filter(u => u.alive).forEach(u => {
    u.moved = false;
    u.attacked = false;
  });

  // Урон от яда в начале хода
  alivePlayers().filter(u => u.poisoned).forEach(u => {
    u.hp -= ZOMBIE_STATS.poisonDmg;
    playPoison();
    u.poisonFlash = true;
    setTimeout(() => u.poisonFlash = false, 1500);
    state.recordPoisonDamage(ZOMBIE_STATS.poisonDmg);
    log(`☠ Яд: Выживший −${ZOMBIE_STATS.poisonDmg}HP → ${u.hp}/${u.maxHp}HP`, 'poison');
    if (u.hp <= 0) {
      u.alive = false;
      log(`💀 Выживший погиб от заражения!`, 'dmg');
    }
  });

  if (checkEnd()) return;

  state.setPhase('player');
  log(`════ Ход ${state.getTurnNum()} · Ваши действия ════`, 'sys');
  render();
}

// ── Конец боя ────────────────────────────────────────────

function checkEnd() {
  if (aliveZombies().length === 0) {
    state.setPhase('over');
    setTimeout(() => showEndOverlay(true), 250);
    return true;
  }
  if (alivePlayers().length === 0) {
    state.setPhase('over');
    setTimeout(() => showEndOverlay(false), 250);
    return true;
  }
  return false;
}

// ── Рестарт ───────────────────────────────────────────────

document.getElementById('btn-restart').addEventListener('click', () => goToMap());

function startGame() {
  state.resetState();
  state.resetStats();
  clearLog();
  goToMap();
}

// Начать бой на уровне
function startBattle(levelNum) {
  gameData.currentLevel = levelNum;
  state.resetState();
  state.resetStats();
  clearLog();
  buildGrid();
  log('=== БОЙ НАЧИНАЕТСЯ ===', 'win');
  log('Расставь своего юнита', 'sys');
  render();
}

// ── ИГРОК И ИНТРО ────────────────────────────────────────

function savePlayerName() {
  const input = document.getElementById('player-name-input');
  if (!input) return;
  
  const name = input.value.trim();
  if (name) {
    gameData.player.name = name;
    // Также обновить имя первого юнита в отряде
    if (gameData.squad.length > 0) {
      gameData.squad[0].name = name;
    }
  }
  
  goToMap();
}

// ── Инициализация ────────────────────────────────────────

// Инициализировать при загрузке страницы
window.addEventListener('load', () => {
  showScreen(SCREENS.START);
});

buildGrid();
render();
