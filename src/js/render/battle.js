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

// Нарисовать юнитов
function _drawUnits() {
  const units = state.getUnits();
  const selected = state.getSelected();
  units.filter(u => u.alive).forEach(u => {
    const el = cell(u.x, u.y);
    if (!el) return;

    if (selected && selected.id === u.id) el.classList.add('selected-unit');

    el.appendChild(_buildUnitEl(u));
  });
}

// Создать элемент юнита
function _buildUnitEl(u) {
  const selected = state.getSelected();
  const div = document.createElement('div');
  div.className = `unit ${u.kind}`;
  if (selected && selected.id === u.id) div.classList.add('selected');
  if ((u.moved || u.attacked) && u.kind === 'survivor') div.classList.add('acted');
  if (u.poisonFlash) div.classList.add('poison-flash');

  // Определяем направление
  const direction = getDirection(u);
  
  // Определяем kind для пути
  const spriteKind = u.kind === 'survivor' ? 'survivor' : u.kind;
  
  // Для зомби — спрайты по состоянию
  if (u.kind === 'zombie') {
    const animState = getZombieAnimState(u);
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
      div.insertBefore(em, div.firstChild);
    };
    div.insertBefore(img, div.firstChild);
  } else {
    // Для игроков — эмодзи
    const em = document.createElement('span');
    em.textContent = u.emoji;
    em.style.cssText = 'font-size:40px;';
    div.insertBefore(em, div.firstChild);
  }

  // Иконка яда
  if (u.poisoned) {
    const si = document.createElement('div');
    si.className = 'status-icon';
    si.textContent = '☠';
    div.appendChild(si);
  }

  // HP-бар
  div.appendChild(_buildHpBar(u));

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'unit-tooltip';
  
  let unitType = u.kind === 'survivor' ? 'Выживший' : 'Зомби';
  let unitName = u.kind === 'survivor' ? (u.name || 'Выживший') : 'Зомби';
  let tooltipHTML = `<span class="tooltip-name">${u.emoji} ${unitName}</span>`;
  tooltipHTML += `<span class="tooltip-type">${unitType}</span>`;
  tooltipHTML += `<span class="tooltip-hp">HP: ${u.hp}/${u.maxHp}</span>`;
  
  if (u.kind === 'survivor') {
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
