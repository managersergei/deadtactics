// ════════════════════════════════════════════════════════
// AI ЗОМБИ — поведение зомби в их ход
// Стратегия: двигаться к ближайшему игроку, атаковать при возможности
// ════════════════════════════════════════════════════════

// Функции state доступны через window.state

// Задержка между шагами движения (мс)
const ZOMBIE_STEP_DELAY = ZOMBIE_FRAMES.move * ANIMATION_SPEED; // 6 * 150 = 900

// Функция ожидания
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Запустить ход всех зомби (с анимационными задержками)
async function runZombies() {
  const zs = aliveZombies();

  for (const z of zs) {
    if (!z.alive) continue;
    const players = alivePlayers();
    if (!players.length) break;

    const target = _findNearestPlayer(z, players);
    const dist = manhattan(z, target);

    if (dist <= z.atkRange) {
      // Враг в зоне атаки — сразу кусаем
      if (z.hp <= 1) {
        // Rage: атакуем 2 раза подряд (после анимации первой атаки)
        zombieAttack(z, target);
        if (checkEnd()) break;
        await sleep(750); // ждём окончания анимации атаки (5 кадров × 150ms)
        zombieAttack(z, target);
      } else {
        zombieAttack(z, target);
      }
    } else {
      // Идём к цели, потом пробуем атаковать
      await zombieMove(z, target);
      if (manhattan(z, target) <= z.atkRange) {
        if (z.hp <= 1) {
          // Rage: атакуем 2 раза подряд (после анимации первой атаки)
          zombieAttack(z, target);
          if (checkEnd()) break;
          await sleep(750); // ждём окончания анимации атаки (5 кадров × 150ms)
          zombieAttack(z, target);
        } else {
          zombieAttack(z, target);
        }
      }
    }
    render();
    
    // Задержка между зомби
    await sleep(ZOMBIE_ACTION_DELAY);
  }

  // После всех зомби — передать ход игроку
  if (state.getPhase() !== 'over') {
    startPlayerTurn();
  }
}

// Передвинуть зомби к цели по одной клетке (async)
async function zombieMove(z, target) {
  const units = state.getUnits();
  const occupied = new Set(
    units.filter(u => u.alive && u.id !== z.id).map(u => `${u.x},${u.y}`)
  );
  let cx = z.x, cy = z.y;

  const path = [];
  for (let step = 0; step < z.moveRange; step++) {
    if (manhattan({ x: cx, y: cy }, target) <= 1) break;

    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    dirs.sort((a, b) =>
      manhattan({ x: cx+a[0], y: cy+a[1] }, target) -
      manhattan({ x: cx+b[0], y: cy+b[1] }, target)
    );

    let moved = false;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (occupied.has(`${nx},${ny}`)) continue;

      path.push({ x: nx, y: ny });
      occupied.delete(`${cx},${cy}`);
      cx = nx; cy = ny;
      occupied.add(`${cx},${cy}`);
      moved = true;
      break;
    }
    if (!moved) break;
  }

  if (path.length > 0) {
    animationPaused = true;
    z.moving = true;
    playZombieMove();

    // Запустить анимацию один раз
    startAnimation();

    for (const pos of path) {
      z.x = pos.x;
      z.y = pos.y;
      z.direction = pos.x > z.x ? 'right' : 'left';
      log(`🧟 Зомби → [${pos.x+1},${pos.y+1}]`, 'zombie-act');

      syncUnitsWithDOM();
      _drawHighlights();

      await sleep(ZOMBIE_STEP_DELAY);
    }

    z.moving = false;
    animationPaused = false;
    render();
  }
}

// Зомби атакует игрока: урон + заражение
function zombieAttack(z, target) {
  // Анимация атаки
  z.attacking = true;
  render();
  setTimeout(() => { z.attacking = false; render(); }, 300);
  
  target.hp -= z.atkDmg;
  recordDamageTaken(z.atkDmg);
  
  // Проверить есть ли броня с защитой от яда
  const armorId = target.equipment?.armor;
  const armor = armorId ? ITEMS[armorId] : null;
  const hasPoisonBlock = armor?.blockPoison === true;
  
  // Заражаем только если нет защиты от яда
  const wasPoison = target.poisoned;
  if (!hasPoisonBlock) {
    target.poisoned = true;
  }
  playBite();

  if (!wasPoison) {
    if (hasPoisonBlock) {
      log(`🧟 Укус! Выживший → ${target.hp}/${target.maxHp}HP (броня защитила от яда!)`, 'zombie-act');
    } else {
      log(`🧟 Укус! ☠ Выживший заражён — яд будет жечь каждый ход`, 'poison');
    }
  } else {
    log(`🧟 Укус! Выживший → ${target.hp}/${target.maxHp}HP`, 'zombie-act');
  }

  if (target.hp <= 0) {
    target.alive = false;
    log(`💀 Выживший пал!`, 'dmg');
  }
  checkEnd();
}

// Найти ближайшего игрока к зомби
function _findNearestPlayer(zombie, players) {
  return players.reduce((best, p) =>
    manhattan(zombie, p) < manhattan(zombie, best) ? p : best,
    players[0]
  );
}
