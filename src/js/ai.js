// ════════════════════════════════════════════════════════
// AI ЗОМБИ — поведение зомби в их ход
// Стратегия: двигаться к ближайшему игроку, атаковать при возможности
// ════════════════════════════════════════════════════════

// Функции state доступны через window.state

// Запустить ход всех зомби (с анимационными задержками)
function runZombies() {
  const zs = aliveZombies();
  let delay = 0;

  zs.forEach(z => {
    setTimeout(() => {
      if (!z.alive) return;
      const players = alivePlayers();
      if (!players.length) return;

      const target = _findNearestPlayer(z, players);
      const dist = manhattan(z, target);

      if (dist <= z.atkRange) {
        // Враг в зоне атаки — сразу кусаем
        zombieAttack(z, target);
      } else {
        // Идём к цели, потом пробуем атаковать
        zombieMove(z, target);
        if (manhattan(z, target) <= z.atkRange) {
          zombieAttack(z, target);
        }
      }
      render();
    }, delay);
    delay += ZOMBIE_ACTION_DELAY;
  });

  // После всех зомби — передать ход игроку
  setTimeout(() => {
    if (state.getPhase() === 'over') return;
    startPlayerTurn();
  }, delay + ZOMBIE_TURN_END_DELAY);
}

// Передвинуть зомби к цели (жадный алгоритм по Manhattan)
function zombieMove(z, target) {
  const units = state.getUnits();
  const occupied = new Set(
    units.filter(u => u.alive && u.id !== z.id).map(u => `${u.x},${u.y}`)
  );
  let cx = z.x, cy = z.y;

  for (let step = 0; step < z.moveRange; step++) {
    if (manhattan({ x: cx, y: cy }, target) <= 1) break;

    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    // Сортируем направления по близости к цели
    dirs.sort((a, b) =>
      manhattan({ x: cx+a[0], y: cy+a[1] }, target) -
      manhattan({ x: cx+b[0], y: cy+b[1] }, target)
    );

    let moved = false;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (occupied.has(`${nx},${ny}`)) continue;

      occupied.delete(`${cx},${cy}`);
      cx = nx; cy = ny;
      occupied.add(`${cx},${cy}`);
      moved = true;
      break;
    }
    if (!moved) break;
  }

  if (cx !== z.x || cy !== z.y) {
    log(`🧟 Зомби → [${cx+1},${cy+1}]`, 'zombie-act');
    z.x = cx; z.y = cy;
    playZombieMove();
  }
}

// Зомби атакует игрока: урон + заражение
function zombieAttack(z, target) {
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
