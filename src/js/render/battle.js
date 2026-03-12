// ════════════════════════════════════════════════════════
// RENDER BATTLE — рендер боя (грид, юниты, подсветка)
// ════════════════════════════════════════════════════════

// Функции state доступны через window.state

// Анимация — меняем только src у img
let animationInterval = null;
let animationFrame = 1;
let animationPaused = false; // Пауза во время пошагового движения
const ANIMATION_SPEED = 150;

// Количество кадров для каждого состояния
const ZOMBIE_FRAMES = {
  idle: 4,
  move: 4,
  attack: 3,
  damaged: 2,
  cr_damaged: 3,
  die: 4,
  killed: 1
};

// Количество кадров для выживших (по типу оружия)
const SURVIVOR_FRAMES = {
  idle: 3,
  move: 3,
  attack: 2,
  poisoned: 2,
  reload: 3,
  die: 4
};

function getZombieAnimState(u) {
  // Приоритет: die > killed > cr_damaged > damaged > attack > move > idle
  if (u.dying) return 'die';
  if (!u.alive) return 'killed';
  if (u.critFlash) return 'cr_damaged';
  if (u.damagedFlash) return 'damaged';
  if (u.attacking) return 'attack';
  if (u.moving) return 'move';
  return 'idle';
}

// Определить состояние анимации для выжившего
function getSurvivorAnimState(u) {
  // Приоритет: die > reload > attack > move > poisoned > idle
  if (u.dying) return 'die';
  if (u.reloading) return 'reload';
  if (u.poisonFlash) return 'poisoned'; // только временный флаг
  if (u.attacking) return 'attack';
  if (u.moving) return 'move';
  return 'idle';
}

function startAnimation() {
  if (animationPaused) return; // Не запускать если на паузе
  if (animationInterval) clearInterval(animationInterval);
  animationInterval = setInterval(() => {
    // Глобальный счётчик кадров (один для всех)
    animationFrame = (animationFrame % 4) + 1;
    
    // Для каждого img обновляем кадр с учётом лимита кадров состояния
    document.querySelectorAll('img[data-animated]').forEach(img => {
      const base = img.dataset.animated; // напр. "src/assets/units/zombie/idle_left/"
      const animState = img.dataset.animState; // напр. "idle"
      const maxFrames = parseInt(img.dataset.maxFrames) || 4;
      // Локальный кадр с учётом maxFrames
      const localFrame = ((animationFrame - 1) % maxFrames) + 1;
      img.src = `${base}${animState}_${localFrame}.png`;
    });
  }, ANIMATION_SPEED);
}

function stopAnimation() {
  if (animationInterval) clearInterval(animationInterval);
  animationInterval = null;
}

// Полная перерисовка сцены
function render() {
  // Не останавливать анимацию если идёт пошаговое движение
  if (!animationPaused) {
    stopAnimation();
  }
  
  _clearCells();
  _drawPlacementZone();
  _drawHighlights();
  _drawUnits();
  updateSidebar();
  
  // Запустить анимацию (только не в фазе placement и не на паузе)
  if (state.getPhase() !== 'placement' && !animationPaused) {
    startAnimation();
  }
}

// Очистить все клетки
function _clearCells() {
  document.querySelectorAll('.cell').forEach(el => {
    el.className = 'cell';
    el.innerHTML = '';
  });
}

// Нарисовать зону расстановки
function _drawPlacementZone() {
  if (state.getPhase() !== 'placement') return;
  for (let r = 0; r < ROWS; r++) {
    for (const c of PLACE_COLS) {
      const el = cell(c, r);
      if (el && !unitAt(c, r)) el.classList.add('placement-zone');
    }
  }
}

// Нарисовать подсветку
function _drawHighlights() {
  const highlights = state.getHighlights();
  highlights.move.forEach(k => {
    const [c, r] = k.split(',').map(Number);
    const el = cell(c, r);
    if (el) el.classList.add('move-range');
  });
  highlights.attack.forEach(k => {
    const [c, r] = k.split(',').map(Number);
    const el = cell(c, r);
    if (el) el.classList.add('attack-range');
  });
}

// Нарисовать юнитов (включая мёртвых зомби)
function _drawUnits() {
  const units = state.getUnits();
  const selected = state.getSelected();
  
  // Рисуем живых
  units.filter(u => u.alive).forEach(u => {
    const el = cell(u.x, u.y);
    if (!el) return;
    if (selected && selected.id === u.id) el.classList.add('selected-unit');
    el.appendChild(_buildUnitEl(u));
  });
  
  // Рисуем мёртвых зомби (трупы остаются до конца боя)
  units.filter(u => !u.alive && u.kind === UNIT_TYPES.ZOMBIE).forEach(u => {
    const el = cell(u.x, u.y);
    if (!el) return;
    // Для мёртвых зомби создаём элемент без кликов
    el.appendChild(_buildUnitEl(u, true));
  });
}

// Создать элемент юнита
// isDead - если true, создаём упрощённый элемент без кликов/tooltip
function _buildUnitEl(u, isDead = false) {
  const selected = state.getSelected();
  
  // Основной контейнер .unit
  const div = document.createElement('div');
  div.className = `unit ${u.kind}`;
  if (!isDead && selected && selected.id === u.id) div.classList.add('selected');
  if (!isDead && (u.moved || u.attacked) && u.kind === UNIT_TYPES.SURVIVOR) div.classList.add('acted');
  if (u.poisonFlash) div.classList.add('poison-flash');
  if (isDead) div.classList.add('dead');

  // === unit-visual — визуальная часть (спрайт/эмодзи) ===
  const visual = document.createElement('div');
  visual.className = 'unit-visual';
  
  const direction = isDead ? 'left' : getDirection(u);
  const spriteKind = u.kind === UNIT_TYPES.SURVIVOR ? 'survivor' : u.kind;
  
  if (u.kind === UNIT_TYPES.ZOMBIE) {
    const animState = isDead ? 'killed' : getZombieAnimState(u);
    const frameCount = ZOMBIE_FRAMES[animState] || 4;
    const base = `src/assets/units/${spriteKind}/${animState}_${direction}/`;
    const img = document.createElement('img');
    img.src = `${base}${animState}_1.png`;
    img.dataset.animated = base;
    img.dataset.animState = animState;
    img.dataset.maxFrames = frameCount;
    img.style.cssText = 'width:auto;height:auto;max-width:100px;max-height:100px;';
    img.onerror = function() {
      this.style.display = 'none';
      const em = document.createElement('span');
      em.textContent = u.emoji;
      em.style.cssText = 'font-size:40px;';
      visual.appendChild(em);
    };
    visual.appendChild(img);
  } else if (u.kind === UNIT_TYPES.SURVIVOR) {
    // Для выживших — спрайты по оружию и состоянию
    const animState = getSurvivorAnimState(u);
    const weaponId = u.weapon || u.equipment?.weapon || 'pistol';
    // Для die - папка без _right
    const dir = direction === 'left' ? 'right' : direction;
    const frameCount = SURVIVOR_FRAMES[animState] || 3;
    // die -> 'die/', остальные -> 'idle_right/', 'move_right/' и т.д.
    const folder = animState === 'die' ? 'die/' : `${animState}_${dir}/`;
    const base = `src/assets/units/${spriteKind}/${weaponId}/${folder}`;
    const img = document.createElement('img');
    img.src = `${base}${animState}_1.png`;
    img.dataset.animated = base;
    img.dataset.animState = animState;
    img.dataset.maxFrames = frameCount;
    img.style.cssText = 'width:auto;height:auto;max-width:100px;max-height:100px;';
    img.onerror = function() {
      this.style.display = 'none';
      const em = document.createElement('span');
      em.textContent = u.emoji;
      em.style.cssText = 'font-size:40px;';
      visual.appendChild(em);
    };
    visual.appendChild(img);
  } else {
    // Для игроков — эмодзи
    const em = document.createElement('span');
    em.textContent = u.emoji;
    em.style.cssText = 'font-size:40px;';
    visual.appendChild(em);
  }
  div.appendChild(visual);

  // === unit-status — статус бар (hp + иконки) ===
  if (!isDead) {
    const status = document.createElement('div');
    status.className = 'unit-status';
    
    // HP-бар
    status.appendChild(_buildHpBar(u));
    
    // Иконка яда (справа от HP-бара)
    if (u.poisoned) {
      const si = document.createElement('div');
      si.className = 'status-icon';
      si.textContent = '☠';
      status.appendChild(si);
    }
    
    div.appendChild(status);
  }

  // === unit-tooltip — всплывающая подсказка ===
  if (!isDead) {
    const tooltip = document.createElement('div');
    tooltip.className = 'unit-tooltip';
    
    let unitType = u.kind === UNIT_TYPES.SURVIVOR ? 'Выживший' : 'Зомби';
    let unitName = u.kind === UNIT_TYPES.SURVIVOR ? (u.name || 'Выживший') : 'Зомби';
    let tooltipHTML = `<span class="tooltip-name">${u.emoji} ${unitName}</span>`;
    tooltipHTML += `<span class="tooltip-type">${unitType}</span>`;
    tooltipHTML += `<span class="tooltip-hp">HP: ${u.hp}/${u.maxHp}</span>`;
    
    if (u.kind === UNIT_TYPES.SURVIVOR) {
      const moveStatus = u.moved ? 'Сходил' : 'Может идти';
      const atkStatus = u.attacked ? 'Атаковал' : 'Может атаковать';
      tooltipHTML += `<span class="tooltip-move">Движение: ${moveStatus}</span>`;
      tooltipHTML += `<span class="tooltip-atk">Атака: ${atkStatus}</span>`;
      if (u.poisoned) {
        tooltipHTML += `<span class="tooltip-effect">☠ Отравлен</span>`;
      }
    }
    
    tooltip.innerHTML = tooltipHTML;
    div.appendChild(tooltip);
  }

  return div;
}

// Создать HP-бар
function _buildHpBar(u) {
  const bar = document.createElement('div');
  bar.className = 'hp-bar';

  const fill = document.createElement('div');
  fill.className = 'hp-fill';
  const pct = u.hp / u.maxHp;
  fill.style.width = (pct * 100) + '%';

  if (pct <= 0.34) fill.classList.add('low');
  else if (pct <= 0.67) fill.classList.add('med');

  bar.appendChild(fill);
  return bar;
}
