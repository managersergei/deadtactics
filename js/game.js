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

  units.push(mkPlayer(c, r));
  placedCount++;
  log(`⬛ Юнит ${placedCount} размещён на [${c+1},${r+1}]`);

  if (placedCount >= PLAYER_UNIT_COUNT) {
    spawnZombies();
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

  // Нельзя действовать если уже ходил или атаковал
  if (u.moved || u.attacked) return;

  // Синяя зона движения
  reachable(u).forEach(([c, r]) => highlights.move.add(`${c},${r}`));

  // Красная зона атаки — зомби в радиусе
  aliveZombies().forEach(e => {
    if (manhattan(u, e) <= u.atkRange) highlights.attack.add(`${e.x},${e.y}`);
  });
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
  const damage = calcDamage(attacker.weapon);
  const isCrit = damage === WEAPONS[attacker.weapon].critDmg;
  target.hp -= damage;
  attacker.attacked = true;
  playShot();
  log(`💥 Атака${isCrit ? ' (КРИТ!)' : ''} → зомби [${target.x+1},${target.y+1}] — ${target.hp}/${target.maxHp}HP`, 'dmg');

  if (target.hp <= 0) {
    target.alive = false;
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

document.getElementById('btn-restart').addEventListener('click', startGame);

function startGame() {
  resetState();
  clearLog();
  document.getElementById('overlay').style.display = 'none';
  buildGrid();
  log('=== НОВАЯ ИГРА ===', 'win');
  log('Расставь юнитов в зелёной зоне слева', 'sys');
  render();
}

// ── Инициализация ────────────────────────────────────────

buildGrid();
render();
