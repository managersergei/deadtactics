// ════════════════════════════════════════════════════════
// ХЕЛПЕРЫ — чистые утилиты без side-эффектов
// Не должны изменять стейт, только вычислять и возвращать
// ════════════════════════════════════════════════════════

// Получаем units из state (глобальная функция)
function getAllUnits() {
  return typeof getUnits === 'function' ? getUnits() : window.state?.units || [];
}

// Юнит на клетке (c, r), или null
function unitAt(c, r) {
  const units = getAllUnits();
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
  const units = getAllUnits();
  return units.filter(u => u.alive && u.kind === UNIT_TYPES.ZOMBIE);
}

// Все живые юниты игрока
function alivePlayers() {
  const units = getAllUnits();
  return units.filter(u => u.alive && u.kind === UNIT_TYPES.SURVIVOR);
}

// Генерация случайных позиций для зомби в правой части карты
// Зомби появляются в колонках 6-9 (справа от игрока)
function randomZombiePositions(count) {
  const positions = [];
  const maxAttempts = 100;
  
  // Зомби появляются в правой части поля
  const minX = 6;   //COLS - 4 (COLS = 10)
  const maxX = 9;   //COLS - 1
  const minY = 1;   // не на самом краю
  const maxY = ROWS - 2;
  
  for (let i = 0; i < count; i++) {
    let x, y, attempts = 0;
    let found = false;
    
    // Пытаемся найти уникальную позицию
    do {
      x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
      y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
      attempts++;
      
      // Проверяем, что позиция уникальна
      const isUnique = !positions.some(p => p[0] === x && p[1] === y);
      if (isUnique) {
        found = true;
        positions.push([x, y]);
      }
    } while (!found && attempts < maxAttempts);
    
    // Если не нашли уникальную позицию за maxAttempts — добавляем всё равно
    if (!found) {
      positions.push([x, y]);
    }
  }
  
  return positions;
}

// Вычисление урона для оружия (с учётом крита)
// Возвращает массив уронов [dmg1, dmg2] для совместимости с автоматом
function calcDamage(weaponId) {
  // Получаем предмет из ITEMS (с запасным для пистолета)
  const w = ITEMS[weaponId] || ITEMS.pistol;
  
  // Для автомата (shots: 2) - массив двух выстрелов
  if (w.shots && w.shots > 1) {
    const dmg1 = Math.random() < w.critChance ? w.critDmg : w.baseDmg;
    const dmg2 = Math.random() < w.critChance ? w.critDmg : w.baseDmg;
    return [dmg1, dmg2];
  }
  
  // Узи имеет midDmg/midChance
  if (w.midChance) {
    const roll = Math.random();
    if (roll < w.critChance) return [w.critDmg];
    if (roll < w.critChance + w.midChance) return [w.midDmg];
    return [w.baseDmg];
  }
  
  // Обычное оружие (пистолет)
  const isCrit = Math.random() < w.critChance;
  return [isCrit ? w.critDmg : w.baseDmg];
}

// Получить эффективное значение стата с учётом снаряжения
function getEffectiveStat(unit, stat) {
  const eq = unit.equipment || {};
  
  // weapon → возвращает id оружия
  if (stat === 'weapon') {
    return eq.weapon || 'pistol';
  }
  
  let value = unit[stat];
  
  // maxHp: +extraHp от брони
  if (stat === 'maxHp' && eq.armor && ITEMS[eq.armor]) {
    value += ITEMS[eq.armor].extraHp || 0;
  }
  
  // moveRange: +moveBonus от обуви
  if (stat === 'moveRange' && eq.boots && ITEMS[eq.boots]) {
    value += ITEMS[eq.boots].moveBonus || 0;
  }
  
  return value;
}

// Определить направление взгляда юнита
// Если есть target - смотрим на него
// Если нет: зомби → ближайший игрок, выживший → ближайший зомби
function getDirection(unit, target) {
  // Если есть конкретная цель - смотрим на неё
  if (target) {
    return (target.x < unit.x) ? 'left' : 'right';
  }
  
  // Для зомби - ближайший игрок
  if (unit.kind === UNIT_TYPES.ZOMBIE) {
    const players = alivePlayers();
    if (players.length > 0) {
      // Находим ближайшего игрока
      const nearest = players.reduce((a, b) => 
        manhattan(unit, a) < manhattan(unit, b) ? a : b
      );
      return (nearest.x < unit.x) ? 'left' : 'right';
    }
  }
  
  // Для выжившего - ближайший зомби
  if (unit.kind === UNIT_TYPES.SURVIVOR) {
    // Во время движения - смотрим куда движемся
    if (unit.moving) {
      return unit.direction || 'right';
    }
    // Иначе - ближайший зомби
    const zombies = aliveZombies();
    if (zombies.length > 0) {
      const nearest = zombies.reduce((a, b) => 
        manhattan(unit, a) < manhattan(unit, b) ? a : b
      );
      return (nearest.x < unit.x) ? 'left' : 'right';
    }
  }
  
  // Иначе - 'right' по умолчанию
  return 'right';
}

// экспорт для тестов (Node environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    manhattan,
    unitAt,
    reachable,
    aliveZombies,
    alivePlayers,
    calcDamage,
    getEffectiveStat,
    getDirection,
  };
}
