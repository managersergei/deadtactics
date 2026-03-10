// ════════════════════════════════════════════════════════
// ИГРА — главная логика, обработчики, управление ходами
// Точка входа для всех игровых действий
// ════════════════════════════════════════════════════════

// ── Обработчик клика по клетке ────────────────────────────

function onCellClick(c, r) {
  if (phase === 'placement') handlePlacement(c, r);
  else if (phase === 'player') handlePlayer(c, r);
}

// ── Фаза расстановки ──────────────────────────────────────

function handlePlacement(c, r) {
  if (!PLACE_COLS.includes(c)) return;
  if (unitAt(c, r)) return;

  // Получаем юнита из отряда для передачи его снаряжения
  const squadUnit = gameData.squad[placedCount];
  units.push(mkPlayer(c, r, squadUnit));
  placedCount++;
  log(`⬛ Юнит размещён на [${c+1},${r+1}]`);

  // игрок может расставить не больше leadership или размера отряда
  const maxPlace = Math.min(gameData.player.leadership, gameData.squad.length);
  if (placedCount >= maxPlace) {
    // Спауним зомби для текущего уровня
    spawnZombiesForLevel(gameData.currentLevel);
    phase = 'player';
    log('════ БОЙ НАЧАЛСЯ ════', 'win');
    log(`Ход ${turnNum} · Ваши действия`, 'sys');
  }
  render();
}

function spawnZombies() {
  // определяем сколько зомби нужно разместить (раньше было по константе)
  const count = ZOMBIE_SPAWN_POSITIONS.length;
  randomZombiePositions(count).forEach(([x, y]) => units.push(mkZombie(x, y)));
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
    units.push(mkZombie(x, y));
  });
  
  log(`🧟 На этом уровне ${enemyCount} врагов!`, 'zombie-act');
}

// ── Ход игрока ────────────────────────────────────────────

function handlePlayer(c, r) {
  const clicked = unitAt(c, r);

  // Выбрать своего юнита
  if (clicked && clicked.kind === 'player') {
    // Отмена выбора при повторном клике на того же юнита
    if (selected && clicked.id === selected.id) {
      selected = null;
      clearHL();
      render();
      return;
    }

    selected = clicked;
    recalcHighlights();
    render();
    return;
  }

  if (!selected) return;

  const key = `${c},${r}`;

  // Переместиться
  if (highlights.move.has(key)) {
    doMove(selected, c, r);
    return;
  }

  // Атаковать врага
  if (highlights.attack.has(key) && clicked && clicked.kind === 'zombie') {
    doAttack(selected, clicked);
    return;
  }

  // Клик на пустое место — снять выделение
  selected = null;
  clearHL();
  render();
}

// Пересчитать подсвеченные клетки для выбранного юнита
function recalcHighlights() {
  clearHL();
  if (!selected || selected.kind !== 'player') return;
  const u = selected;

  // Синяя зона движения — если ещё не переместился
  if (!u.moved) {
    reachable(u).forEach(([c, r]) => highlights.move.add(`${c},${r}`));
  }

  // Красная зона атаки — если ещё не атаковал
  if (!u.attacked) {
    aliveZombies().forEach(e => {
      if (manhattan(u, e) <= u.atkRange) highlights.attack.add(`${e.x},${e.y}`);
    });
  }
}

function clearHL() {
  highlights = { move: new Set(), attack: new Set() };
}

function doMove(u, c, r) {
  log(`▶ Переместился на [${c+1},${r+1}]`, 'move');
  u.x = c; u.y = r;
  u.moved = true;
  playFootstep();
  clearHL(); // после движения атаки нет
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
  recordDamageDealt(damage);
  attacker.attacked = true;
  playShot();
  log(`💥 Атака${isCrit ? ' (КРИТ!)' : ''} → зомби [${target.x+1},${target.y+1}] — ${target.hp}/${target.maxHp}HP`, 'dmg');

  if (target.hp <= 0) {
    target.alive = false;
    recordKill();
    log(`💀 Зомби уничтожен!`, 'dmg');
  }

  clearHL();
  selected = null;
  render();
  checkEnd();
}

// ── Смена хода ────────────────────────────────────────────

// Кнопка "Завершить ход"
document.getElementById('btn-end-turn').addEventListener('click', () => {
  if (phase !== 'player') return;
  selected = null;
  clearHL();
  phase = 'zombie';
  render();
  setTimeout(runZombies, 400);
});

// Ход игрока: сбросить флаги, применить яд
function startPlayerTurn() {
  turnsSurvived++;
  if (phase === 'over') return;
  turnNum++;

  // Сбросить флаги действий
  units.filter(u => u.alive).forEach(u => {
    u.moved = false;
    u.attacked = false;
  });

  // Урон от яда в начале хода
  alivePlayers().filter(u => u.poisoned).forEach(u => {
    u.hp -= ZOMBIE_STATS.poisonDmg;
    playPoison();
    u.poisonFlash = true;
    setTimeout(() => u.poisonFlash = false, 1500);
    recordPoisonDamage(ZOMBIE_STATS.poisonDmg);
    log(`☠ Яд: Выживший −${ZOMBIE_STATS.poisonDmg}HP → ${u.hp}/${u.maxHp}HP`, 'poison');
    if (u.hp <= 0) {
      u.alive = false;
      log(`💀 Выживший погиб от заражения!`, 'dmg');
    }
  });

  if (checkEnd()) return;

  phase = 'player';
  log(`════ Ход ${turnNum} · Ваши действия ════`, 'sys');
  render();
}

// ── Конец боя ────────────────────────────────────────────

function checkEnd() {
  if (aliveZombies().length === 0) {
    phase = 'over';
    setTimeout(() => showEndOverlay(true), 250);
    return true;
  }
  if (alivePlayers().length === 0) {
    phase = 'over';
    setTimeout(() => showEndOverlay(false), 250);
    return true;
  }
  return false;
}

// ── Рестарт ───────────────────────────────────────────────

document.getElementById('btn-restart').addEventListener('click', () => goToMap());

function startGame() {
  resetState();
  resetStats();
  clearLog();
  goToMap();
}

// Начать бой на уровне
function startBattle(levelNum) {
  gameData.currentLevel = levelNum;
  resetState();
  resetStats();
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
