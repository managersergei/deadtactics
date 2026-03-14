// ════════════════════════════════════════════════════════
// ИГРА — главная логика, обработчики, управление ходами
// Точка входа для всех игровых действий
// ════════════════════════════════════════════════════════

// Функции state доступны через window.state

// ── Обработчик клика по клетке ────────────────────────────

function onCellClick(c, r) {
  if (animationPaused) return; // Блокируем клики во время движения
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

// ── ГРАНАТА ───────────────────────────────────────────────

// Активировать режим броска гранаты
function activateGrenade(u) {
  state.clearHighlights();
  const h = state.getHighlights();
  const grenade = ITEMS.grenade;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (manhattan(u, {x:c, y:r}) <= grenade.throwRange) {
        h.throw.add(`${c},${r}`);
      }
    }
  }
  render();
  // Закрыть модалку
  const modal = document.getElementById('unit-items-modal');
  if (modal) modal.remove();
}

// Бросок гранаты
function doGrenade(attacker, targetX, targetY) {
  const grenade = ITEMS.grenade;
  aliveZombies().forEach(z => {
    if (manhattan({x:targetX,y:targetY}, z) <= grenade.splashRange) {
      z.hp -= grenade.damage;
      state.recordDamageDealt(grenade.damage);
      log(`💣 Граната → зомби [${z.x+1},${z.y+1}] −${grenade.damage}HP`, 'dmg');
      if (z.hp <= 0) {
        z.dying = true;
        setTimeout(() => { z.alive = false; z.dying = false; resetAnimFrame(z.id); render(); checkEnd(); }, 600);
        state.recordKill();
        log(`💀 Зомби уничтожен!`, 'dmg');
      }
    }
  });
  attacker.inventory.grenade--;
  attacker.attacked = true;
  state.clearHighlights();
  state.setSelected(null);
  render();
  checkEnd();
}

// ── ХОД ИГРОКА ─────────────────────────────────────────

function handlePlayer(c, r) {
  const clicked = unitAt(c, r);
  const key = `${c},${r}`;
  const selected = state.getSelected();
  const highlights = state.getHighlights();

  // 0. Бросок гранаты
  if (highlights.throw.has(key)) {
    doGrenade(selected, c, r);
    return;
  }

  // 1. Клик на своего юнита → выбрать
  if (clicked && clicked.kind === 'survivor') {
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
  if (selected && selected.kind === 'survivor') {
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
  if (!selected || selected.kind !== 'survivor') return;
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

// Задержка между шагами движения (мс)
const SURVIVOR_STEP_DELAY = SURVIVOR_FRAMES.move * ANIMATION_SPEED; // 3 * 150 = 450

// Функция ожидания
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Плавное перемещение выжившего по клеткам
async function doMove(u, c, r) {
  const oldX = u.x, oldY = u.y;
  if (oldX === c && oldY === r) return;

  const path = [];
  let cx = oldX, cy = oldY;
  while (cx !== c) { cx += (c > cx) ? 1 : -1; path.push({ x: cx, y: cy }); }
  while (cy !== r) { cy += (r > cy) ? 1 : -1; path.push({ x: cx, y: cy }); }

  const actualPath = path.slice(0, u.moveRange || 4);
  if (actualPath.length === 0) {
    u.x = c; u.y = r; u.moved = true;
    render();
    return;
  }

  animationPaused = true;  // блокируем клики и перезапуск интервала
  u.moving = true;
  playFootstep();

  // Запустить анимацию вручную — один раз, не перезапускаем в цикле
  startAnimation();

  for (const pos of actualPath) {
    u.x = pos.x;
    u.y = pos.y;
    u.direction = pos.x > oldX ? 'right' : pos.x < oldX ? 'left' : u.direction;
    log(`▶ → [${pos.x+1},${pos.y+1}]`, 'move');

    // Только перемещаем div — не трогаем интервал
    syncUnitsWithDOM();
    _drawHighlights();

    await sleep(SURVIVOR_STEP_DELAY);
  }

  u.moving = false;
  u.moved = true;
  animationPaused = false;

  state.clearHighlights();
  render();  // финальный рендер — переключает на idle
  checkEnd();
}

function doAttack(attacker, target) {
  // Получаем эффективное оружие из снаряжения
  const weaponId = getEffectiveStat(attacker, 'weapon');
  const damageArr = calcDamage(weaponId);
  const damage = damageArr ? damageArr[0] : 0;
  const isCrit = damage === ITEMS[weaponId]?.critDmg;
  
  // Анимация атаки выжившего
  if (attacker.kind === 'survivor') {
    attacker.attacking = true;
    animationPaused = true;
    render();
  }
  
  // Наносим урон после небольшой задержки для анимации
  setTimeout(() => {
    target.hp -= damage;
    state.recordDamageDealt(damage);
    attacker.attacked = true;
    
    // Логика перезарядки (для выживших)
    if (attacker.kind === 'survivor') {
      attacker.attacking = false;
      attacker.shotsFired = (attacker.shotsFired || 0) + 1;
      if (attacker.shotsFired >= 3) {
        attacker.reloading = true;
        attacker.shotsFired = 0;
        log(`🔄 Перезарядка...`, 'sys');
        // Анимация перезарядки - пауза на 1 секунду
        animationPaused = true;
        render();
        setTimeout(() => {
          attacker.reloading = false;
          animationPaused = false;
          render();
        }, 450); // 3 кадра × 150ms
      } else {
        animationPaused = false;
      }
    }
    
    // Анимация: если крит - cr_damaged, иначе damaged
    if (target.hp > 0) {
      target.damagedFlash = true;
      if (isCrit) {
        target.critFlash = true;
        setTimeout(() => { target.critFlash = false; render(); }, 300);
      }
      setTimeout(() => { target.damagedFlash = false; render(); }, 300);
    } else {
      // Зомби умирает
      target.dying = true;
      setTimeout(() => {
        target.alive = false;
        target.dying = false;
        render();
        checkEnd();
      }, 600);
      log(`💀 Зомби уничтожен!`, 'dmg');
      state.recordKill();
    }
    
    playShot();
    log(`💥 Атака${isCrit ? ' (КРИТ!)' : ''} → зомби [${target.x+1},${target.y+1}] — ${target.hp}/${target.maxHp}HP`, 'dmg');

    state.clearHighlights();
    state.setSelected(null);
    render();
  }, 200);
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

// Ход игрока: сбросить флаги, применить эффекты
function startPlayerTurn() {
  state.incrementTurnsSurvived();
  if (state.getPhase() === 'over') return;
  state.nextTurn();

  // Сбросить флаги действий
  state.getUnits().filter(u => u.alive).forEach(u => {
    u.moved = false;
    u.attacked = false;
    u.skippedTurn = false; // сброс флага пропуска хода
  });

  // Обработка эффектов в начале хода (используем новую систему)
  const affectedUnits = alivePlayers().filter(u => u.effects && Object.keys(u.effects).length > 0);
  
  if (affectedUnits.length > 0) {
    // Применяем эффекты для каждого юнита
    const unitsWithDamage = [];
    
    affectedUnits.forEach(u => {
      const oldHp = u.hp;
      // Обрабатываем все эффекты
      for (const effectId in u.effects) {
        const effect = u.effects[effectId];
        const effectDef = EFFECTS[effectId];
        
        if (!effectDef || !effectDef.onTurnStart) continue;
        
        const handler = EFFECT_HANDLERS[effectDef.onTurnStart];
        if (handler) {
          handler(u, effect);
        }
        
        // Уменьшаем длительность
        if (effect.duration !== null) {
          effect.duration--;
          if (effect.duration <= 0) {
            delete u.effects[effectId];
          }
        }
      }
      
      // Проверяем изменился ли HP (был нанесён урон)
      if (u.hp < oldHp) {
        unitsWithDamage.push(u);
      }
      
      // Проверяем смерть
      if (u.hp <= 0) {
        u.alive = false;
        log(`💀 ${u.name} погиб от эффекта!`, 'dmg');
      }
    });

    if (checkEnd()) return;

    // Анимация для юнитов с уроном от эффектов
    if (unitsWithDamage.length > 0) {
      animationPaused = true;
      unitsWithDamage.forEach(u => {
        u.poisonFlash = true; // используем poisonFlash для анимации (универсально)
      });
      playPoison();
      render();

      // Через 300ms выключаем анимацию
      setTimeout(() => {
        unitsWithDamage.forEach(u => {
          u.poisonFlash = false;
        });
        animationPaused = false;
        state.setPhase('player');
        log(`════ Ход ${state.getTurnNum()} · Ваши действия ════`, 'sys');
        render();
      }, 300);
    } else {
      // Есть эффекты но без урона (например заморозка) - сразу продолжаем
      state.setPhase('player');
      log(`════ Ход ${state.getTurnNum()} · Ваши действия ════`, 'sys');
      render();
    }
  } else {
    // Нет эффектов - сразу продолжаем
    state.setPhase('player');
    log(`════ Ход ${state.getTurnNum()} · Ваши действия ════`, 'sys');
    render();
  }
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

// ── ИСПОЛЬЗОВАНИЕ ПРЕДМЕТОВ ───────────────────────────────

function useItem(unit, itemId) {
  if (!unit || !unit.alive) return { success: false, reason: 'Юнит не найден' };
  if (unit.attacked) return { success: false, reason: 'Уже атаковал' };
  
  const item = ITEMS[itemId];
  if (!item) return { success: false, reason: 'Предмет не найден' };
  
  // Проверяем наличие в инвентаре
  const inventory = unit.inventory || {};
  if (!inventory[itemId] || inventory[itemId] <= 0) {
    return { success: false, reason: 'Нет предмета в инвентаре' };
  }
  
  // Антидот — снимает отравление
  if (item.removesPoison) {
    const hadPoison = hasEffect(unit, 'poison');
    if (hadPoison) {
      removeEffect(unit, 'poison');
      log(`💉 ${unit.name} использовал антидот — яд снят!`, 'sys');
    } else {
      return { success: false, reason: 'Нет отравления' };
    }
  }
  
  // Уменьшаем количество в инвентаре
  inventory[itemId]--;
  
  // Использование предмета тратит возможность атаковать
  unit.attacked = true;
  
  return { success: true };
}

// ── Инициализация ────────────────────────────────────────

// Инициализировать при загрузке страницы
window.addEventListener('load', () => {
  showScreen(SCREENS.START);
});

buildGrid();
render();
