// ════════════════════════════════════════════════════════
// ХЕЛПЕРЫ — чистые утилиты без side-эффектов
// Не должны изменять стейт, только вычислять и возвращать
// ════════════════════════════════════════════════════════

// Юнит на клетке (c, r), или null
function unitAt(c, r) {
  return units.find(u => u.alive && u.x === c && u.y === r) || null;
}

// Манхэттенское расстояние между двумя юнитами/точками
function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// BFS: все клетки куда может переместиться юнит
// Проходит сквозь союзников, останавливается перед врагами
function reachable(u) {
  const visited = new Set([`${u.x},${u.y}`]);
  const queue = [{ x: u.x, y: u.y, steps: 0 }];
  const result = [];

  while (queue.length) {
    const { x, y, steps } = queue.shift();

    // Добавляем в результат если это не стартовая клетка и она свободна
    if (steps > 0 && !unitAt(x, y)) result.push([x, y]);
    if (steps >= u.moveRange) continue;

    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nx = x + dx, ny = y + dy;
      const k = `${nx},${ny}`;

      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (visited.has(k)) continue;

      const here = unitAt(nx, ny);
      // Заблокировано врагом — нельзя проходить насквозь
      if (here && here.kind !== u.kind) continue;

      visited.add(k);
      queue.push({ x: nx, y: ny, steps: steps + 1 });
    }
  }
  return result;
}

// Все живые зомби
function aliveZombies() {
  return units.filter(u => u.alive && u.kind === 'zombie');
}

// Все живые юниты игрока
function alivePlayers() {
  return units.filter(u => u.alive && u.kind === 'player');
}

// Случайные позиции для зомби из ZOMBIE_SPAWN_POSITIONS
function randomZombiePositions(count) {
  const shuffled = [...ZOMBIE_SPAWN_POSITIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Вычисление урона для оружия (с учётом крита)
function calcDamage(weapon) {
  const w = WEAPONS[weapon];
  return Math.random() < w.critChance ? w.critDmg : w.baseDmg;
}
