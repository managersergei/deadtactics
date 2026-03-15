// ════════════════════════════════════════════════════════
// ИГРА — главная логика, обработчики, управление ходами
// Точка входа для всех игровых действий
// ════════════════════════════════════════════════════════

// Функции state доступны через window.state

// ── Обработчик клика по клетке ────────────────────────────

// Обработчик наведения мыши на клетку (для preview гранаты)
function onCellHover(c, r) {
  const grenadeAttackerId = state.getGrenadeAttackerId();
  
  // Если не в режиме гранаты — сбрасываем preview
  if (!grenadeAttackerId) {
    if (state.getGrenadePreview()) {
      state.setGrenadePreview(null);
      render();  // Полный цикл Clear → Draw
    }
    return;
  }
  
  const highlights = state.getHighlights();
  
  // Если передана клетка и она в throw-зоне — показываем splash preview
  if (c !== null && r !== null) {
    const key = `${c},${r}`;
    if (highlights.throw.has(key)) {
      state.setGrenadePreview({x: c, y: r});
    } else {
      state.setGrenadePreview(null);
    }
  } else {
    // mouseleave — жёсткий сброс
    state.setGrenadePreview(null);
  }
  
  render();  // Полный цикл Clear → Draw
}

function onCellClick(c, r) {
  if (clicksBlocked) return; // Блокируем клики во время движения/атаки
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
  state.setGrenadeAttackerId(u.id); // Сохраняем ID юнита который бросает гранату
  const h = state.getHighlights();
  const grenade = ITEMS.grenade;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      // throwRange использует manhattan (только горизонталь/вертикаль)
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
async function doGrenade(attacker, targetX, targetY) {
  // Валидация: проверяем что attacker - это тот же survivor который активировал гранату
  const grenadeAttackerId = state.getGrenadeAttackerId();
  if (!attacker || attacker.kind !== 'survivor' || attacker.id !== grenadeAttackerId) {
    log('Выбери юнита который бросает гранату', 'sys');
    state.setGrenadeAttackerId(null);
    state.setGrenadePreview(null);
    state.clearHighlights();
    state.setSelected(null);
    render();
    return;
  }
  
  // Проверяем что граната есть в инвентаре
  if (!attacker.inventory || !attacker.inventory.grenade || attacker.inventory.grenade <= 0) {
    log('Нет гранат!', 'sys');
    state.setGrenadeAttackerId(null);
    state.setGrenadePreview(null);
    state.clearHighlights();
    state.setSelected(null);
    render();
    return;
  }
  
  // Анимация броска гранаты — устанавливаем направление
  attacker.direction = getDirection(attacker, {x: targetX, y: targetY});
  attacker.usingGrenade = true;
  attacker.target = { x: targetX, y: targetY };
  animationPaused = true;
  render();
  
  // Ждём окончания анимации grenade (4 кадра × 150ms = 600ms)
  await new Promise(resolve => setTimeout(resolve, SURVIVOR_FRAMES.grenade * ANIMATION_SPEED));
  attacker.usingGrenade = false;
  
  const grenade = ITEMS.grenade;
  
  // АТАКА ПО ЗОМБИ (chessboard distance)
  for (const z of aliveZombies()) {
    const dist = Math.max(Math.abs(targetX - z.x), Math.abs(targetY - z.y));
    if (dist <= grenade.splashRange) {
      const result = takeDamage(z, grenade.damage, 'grenade');
      await waitForDamageAnimation(z);
      
      log(`💣 Граната → зомби [${z.x+1},${z.y+1}] −${grenade.damage}HP`, 'dmg');
      if (result.died) {
        state.recordKill();
        log(`💀 Зомби уничтожен!`, 'dmg');
      }
    }
  }
  
  // FRIENDLY FIRE — атака по союзникам (без исключений, chessboard distance)
  for (const p of alivePlayers()) {
    const dist = Math.max(Math.abs(targetX - p.x), Math.abs(targetY - p.y));
    if (dist <= grenade.splashRange) {
      const result = takeDamage(p, grenade.damage, 'grenade');
      await waitForDamageAnimation(p);
      
      log(`💣 Граната → союзник [${p.x+1},${p.y+1}] −${grenade.damage}HP`, 'dmg');
      if (result.died) {
        log(`💀 ${p.name} погиб от гранаты!`, 'dmg');
      }
    }
  }
  
  attacker.inventory.grenade--;
  attacker.attacked = true;
  animationPaused = false;
  state.setGrenadeAttackerId(null); // Сбрасываем ID после использования
  state.setGrenadePreview(null);
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
  const grenadeAttackerId = state.getGrenadeAttackerId(); // ID юнита который активировал гранату

  // === РЕЖИМ ГРАНАТЫ АКТИВЕН ===
  if (grenadeAttackerId) {
    // 0. Бросок на подсвеченную клетку (throw-зона)
    if (highlights.throw.has(key)) {
      // Проверяем что выбран правильный survivor
      if (!selected || selected.id !== grenadeAttackerId) {
        log('Выбери юнита который бросает гранату', 'sys');
        state.setGrenadeAttackerId(null);
        state.setGrenadePreview(null);
        state.clearHighlights();
        state.setSelected(null);
        render();
        return;
      }
      
      // НЕЛЬЗЯ бросать на СЕБЯ - это отмена
      if (clicked && clicked.kind === 'survivor' && clicked.id === grenadeAttackerId) {
        state.setGrenadeAttackerId(null);
        state.setGrenadePreview(null);
        state.clearHighlights();
        state.setSelected(null);
        log('Бросок гранаты отменён', 'sys');
        render();
        return;
      }
      
      // Блокировка броска в союзников (только лог, НЕ блокируем)
      if (clicked && clicked.kind === 'survivor') {
        log('⚠️ Опасно! Бросок прямо в союзника!', 'sys');
        // НЕ return — позволяем doGrenade выполниться!
      }
      
      doGrenade(selected, c, r);
      return;
    }

    // 1. Клик на СВОЕГО (того же) survivor → ОТМЕНА гранаты
    if (clicked && clicked.kind === 'survivor' && clicked.id === grenadeAttackerId) {
      state.setGrenadeAttackerId(null);
      state.setGrenadePreview(null);
      state.clearHighlights();
      state.setSelected(null);
      log('Бросок гранаты отменён', 'sys');
      render();
      return;
    }

    // 2. Клик на ДРУГОГО survivor → ОТМЕНА + выбор нового
    if (clicked && clicked.kind === 'survivor' && clicked.id !== grenadeAttackerId) {
      state.setGrenadeAttackerId(null);
      state.setGrenadePreview(null);
      state.clearHighlights();
      state.setSelected(clicked);
      recalcHighlights();
      log('Бросок гранаты отменён', 'sys');
      render();
      return;
    }

    // 3. Клик на ЗОМБИ (вне throw-зоны) → ОТМЕНА + выбрать зомби (инфа в сайдбар)
    if (clicked && clicked.kind === 'zombie') {
      state.setGrenadeAttackerId(null);
      state.setGrenadePreview(null);
      state.clearHighlights();
      state.setSelected(clicked);
      log('Бросок гранаты отменён', 'sys');
      render();
      return;
    }

    // 4. Клик на ПУСТУЮ клетку (вне throw-зоны) → ОТМЕНА
    if (!clicked) {
      state.setGrenadeAttackerId(null);
      state.setGrenadePreview(null);
      state.clearHighlights();
      state.setSelected(null);
      log('Бросок гранаты отменён', 'sys');
      render();
      return;
    }
  }

  // === ОБЫЧНЫЙ РЕЖИМ (grenadeAttackerId === null) ===

  // 0. Бросок гранаты (еслиthrow-зона активна, ноgrenadeAttackerId сброшен)
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
const SURVIVOR_STEP_DELAY = SURVIVOR_FRAMES.move * ANIMATION_SPEED; // 6 * 150 = 900

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

  clicksBlocked = true;  // блокируем клики
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
  clicksBlocked = false;

  state.clearHighlights();
  render();  // финальный рендер — переключает на idle
  checkEnd();
}

async function doAttack(attacker, target) {
  // Получаем эффективное оружие из снаряжения
  const weaponId = getEffectiveStat(attacker, 'weapon');
  const damageArr = calcDamage(weaponId);
  const damage = damageArr ? damageArr[0] : 0;
  const isCrit = damage >= 2; // крит = 2+ урона
  
  // Анимация атаки выжившего - блокируем клики но НЕ анимацию
  if (attacker.kind === 'survivor') {
    attacker.attacking = true;
    attacker.target = target; // сохраняем цель для поворота
    clicksBlocked = true;
    render();
  }
  
  // Ждём окончания анимации атаки (3 кадра × 150ms = 450ms)
  await new Promise(resolve => setTimeout(resolve, SURVIVOR_FRAMES.attack * ANIMATION_SPEED));
  
  // Используем централизованную функцию — она сама поставит damagedFlash
  const result = takeDamage(target, damage, 'player');
  
  // Ждём окончания анимации повреждения
  await waitForDamageAnimation(target);
  
  attacker.attacked = true;
  
  // Логика перезарядки (для выживших)
  if (attacker.kind === 'survivor') {
    attacker.attacking = false;
    attacker.shotsFired = (attacker.shotsFired || 0) + 1;
    if (attacker.shotsFired >= 3) {
      attacker.reloading = true;
      attacker.shotsFired = 0;
      log(`🔄 Перезарядка...`, 'sys');
      render();
      // Анимация перезарядки - ждём 6 кадров
      await new Promise(resolve => setTimeout(resolve, SURVIVOR_FRAMES.reload * ANIMATION_SPEED));
      attacker.reloading = false;
      clicksBlocked = false;
      render();
    } else {
      clicksBlocked = false;
    }
  }
  
  playShot();
  
  // Лог результата
  if (result.died) {
    log(`💀 Зомби уничтожен!`, 'dmg');
    state.recordKill();
  } else {
    log(`💥 Атака${isCrit ? ' (КРИТ!)' : ''} → зомби [${target.x+1},${target.y+1}] — ${target.hp}/${target.maxHp}HP`, 'dmg');
  }

  state.clearHighlights();
  state.setSelected(null);
  render();
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

      // Вычисляем длительность анимации poisoned: 4 кадра × 150ms = 600ms
      const poisonFrames = window.SURVIVOR_FRAMES?.poisoned || 4;
      const poisonDelay = poisonFrames * ANIMATION_SPEED;
      
      // Выключаем анимацию после её окончания
      setTimeout(() => {
        unitsWithDamage.forEach(u => {
          u.poisonFlash = false;
        });
        animationPaused = false;
        state.setPhase('player');
        log(`════ Ход ${state.getTurnNum()} · Ваши действия ════`, 'sys');
        render();
      }, poisonDelay);
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

// ── ЦЕНТРАЛИЗОВАННАЯ СИСТЕМА УРОНА ─────────────────────

// Функция ожидания для анимации
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Единая функция для нанесения урона — ставит флаги анимаций сама
// Включает damagedFlash, но НЕ ждёт окончания анимации
// target: юнит которому наносим урон
// amount: количество урона
// source: 'player' | 'zombie' | 'grenade' | 'effect'
// returns: { died: boolean }
function takeDamage(target, amount, source) {
  const oldHp = target.hp;
  target.hp -= amount;
  
  // Записываем урон в статистику
  if (source === 'player' || source === 'grenade') {
    state.recordDamageDealt(amount);
  } else if (source === 'zombie') {
    recordDamageTaken(amount);
  }
  
  // Анимация повреждения (только если юнит выжил)
  if (target.hp > 0) {
    target.damagedFlash = true;
    render();  // СРАЗУ запускаем анимацию
    
    // Для критического урона от игрока
    if (source === 'player' && amount >= 2) {
      target.critFlash = true;
    }
  }
  
  // Проверка смерти
  if (target.hp <= 0) {
    if (target.kind === UNIT_TYPES.SURVIVOR) {
      // Survivor — анимация падения (killed)
      target.dyingAnim = true;
      setTimeout(() => {
        target.alive = false;
        target.dyingAnim = false;
        render();
        checkEnd();
      }, 600);
    } else {
      // Zombie — анимация смерти
      target.dying = true;
      setTimeout(() => {
        target.alive = false;
        target.dying = false;
        resetAnimCounter(target.id);
        render();
        checkEnd();
      }, 600);
    }
    return { died: true };
  }
  
  // Проверка ярости для зомби (HP = 1)
  if (target.kind === UNIT_TYPES.ZOMBIE && target.hp === 1 && !target.raged) {
    target.raged = true;
    log(`⚡ Зомби в ярости!`, 'zombie-act');
  }
  
  return { died: false };
}

// Отдельная функция для ожидания окончания анимации повреждения
// Вызывается ПОСЛЕ takeDamage() когда нужно дождаться окончания анимации
async function waitForDamageAnimation(target) {
  if (!target.damagedFlash) return;  // Если нет анимации - не ждём
  
  // Вычисляем длительность анимации на основе кадров
  const frames = target.kind === UNIT_TYPES.ZOMBIE 
    ? (window.ZOMBIE_FRAMES?.damaged || 3) 
    : (window.SURVIVOR_FRAMES?.damaged || 5);
  const delay = frames * ANIMATION_SPEED;
  
  await sleep(delay);
  
  target.damagedFlash = false;
  if (target.critFlash) {
    target.critFlash = false;
  }
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
      // Анимация использования антидота
      unit.usingAntidote = true;
      render();
      setTimeout(() => {
        unit.usingAntidote = false;
        log(`💉 ${unit.name} использовал антидот — яд снят!`, 'sys');
        render();
      }, 5 * 150); // 5 кадров анимации
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
