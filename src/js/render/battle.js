// ════════════════════════════════════════════════════════
// RENDER BATTLE — рендер боя (грид, юниты, подсветка)
// ════════════════════════════════════════════════════════

// Функции state доступны через window.state

let animationInterval = null;
let animationFrame = 0;
let animationPaused = false;
let clicksBlocked = false;
const ANIMATION_SPEED = 150;

// Количество кадров для каждого состояния (ЗОМБИ)
const ZOMBIE_FRAMES = {
  idle: 6,
  move: 6,
  attack: 5,
  damaged: 3,
  cr_damaged: 5,
  die: 4,
  killed: 1,
  raged: 5
};

// Количество кадров для выживших
const SURVIVOR_FRAMES = {
  idle: 6,
  move: 6,
  attack: 3,  // 3 animation frames
  poisoned: 4,
  reload: 6,
  die: 1,
  killed: 4,
  damaged: 5,
  antidote: 5,
  grenade: 4
};

// Анимации которые играют один раз и замирают на последнем кадре
const ONE_SHOT_ANIMS = new Set(['attack', 'damaged', 'cr_damaged', 'die', 'killed', 'reload', 'poisoned', 'antidote', 'grenade']);

// Индивидуальные счётчики для one-shot анимаций { unitId: frame }
const animFrameCounters = {};

function getZombieAnimState(u) {
  // Приоритет: die > killed > cr_damaged > attack > damaged > raged > move > idle
  // ПРАВИЛО: Action > State — состояния с действиями (attack, damaged) важнее чем passive (raged)
  if (u.dying)        return 'die';
  if (!u.alive)       return 'killed';
  if (u.critFlash)    return 'cr_damaged';
  if (u.attacking)    return 'attack';     // Action важнее чем State
  if (u.damagedFlash) return 'damaged';
  if (u.raged)        return 'raged';
  if (u.moving)       return 'move';
  return 'idle';
}

function getSurvivorAnimState(u) {
  // Приоритет: die > killed > reload > poisoned > antidote > grenade > attack > damaged > move > idle
  // ПРАВИЛО: Action > State — атака важнее чем получение урона
  if (u.dying)          return 'die';       // статика — труп лежит
  if (u.dyingAnim)     return 'killed';    // анимация падения
  if (u.reloading)     return 'reload';
  if (u.poisonFlash)  return 'poisoned';
  if (u.usingAntidote) return 'antidote'; // использование антидота
  if (u.usingGrenade) return 'grenade';   // бросок гранаты
  if (u.attacking)     return 'attack';    // Action важнее чем State
  if (u.damagedFlash)  return 'damaged';   // получение урона
  if (u.moving)        return 'move';
  return 'idle';
}

function startAnimation() {
  // Анимация крутится всегда - клики блокируются через clicksBlocked
  if (animationInterval) clearInterval(animationInterval);
  animationInterval = setInterval(() => {
    animationFrame++;

    document.querySelectorAll('img[data-animated]').forEach(img => {
      const animState = img.dataset.animState;
      const maxFrames = parseInt(img.dataset.maxFrames) || 1;
      const unitId = img.dataset.unitId;
      const base = img.dataset.animated;
      const direction = img.dataset.direction || 'right';
      const baseDir = img.dataset.baseDir || 'right';
      if (!base || !animState) return;

      // Пересчитываем отзеркаливание при каждом кадре
      const needsMirror = direction !== baseDir;
      img.style.transform = needsMirror ? 'scaleX(-1)' : '';

      let frame;
      if (ONE_SHOT_ANIMS.has(animState)) {
        // One-shot: индивидуальный счётчик, замирает на последнем кадре
        if (animFrameCounters[unitId] === undefined) {
          animFrameCounters[unitId] = 1;
        }
        frame = animFrameCounters[unitId];
        if (animFrameCounters[unitId] < maxFrames) {
          animFrameCounters[unitId]++;
        }
      } else {
        // Loop (idle, move): глобальный счётчик
        frame = (animationFrame % maxFrames) + 1;
      }

      // Fallback для left-спрайтов — зеркаливаем right
      if (base.includes('_left_')) {
        img.onerror = function() {
          this.src = this.src.replace('_left_', '_right_');
          this.style.transform = 'scaleX(-1)';
        };
      }
      
      img.src = `${base}${animState}_${frame}.png`;
    });
  }, ANIMATION_SPEED);
}

function stopAnimation() {
  if (animationInterval) clearInterval(animationInterval);
  animationInterval = null;
}

function resetAnimCounter(unitId) {
  delete animFrameCounters[unitId];
}

// УНИФИКАЦИЯ ОТЗЕРКАЛИВАНИЯ
// ==========================

// Получить базовое направление спрайтов для типа юнита
function getBaseDir(kind) {
  return kind === UNIT_TYPES.ZOMBIE ? 'left' : 'right';
}

// Универсальная функция определения визуального направления
// Все юниты динамически смотрят на ближайшего врага через getDirection(u)
function getVisualDirection(u) {
  return getDirection(u);
}

// Применить отзеркаливание на основе визуального направления
// Возвращает: { base, needsMirror }
function computeSpritePath(u, state, direction) {
  const baseDir = getBaseDir(u.kind);
  const needsMirror = direction !== baseDir;
  
  let base;
  if (u.kind === UNIT_TYPES.ZOMBIE) {
    // Зомби: всегда используем baseDir (left), зеркаливаем если нужно
    base = `src/assets/units/zombie/${state}_${baseDir}/`;
  } else {
    // Выживший: всегда используем baseDir (right), зеркаливаем если нужно
    
    // Antidote и grenade — общие папки (без оружия)
    if (state === 'antidote' || state === 'grenade') {
      base = `src/assets/units/survivor/${state}_${baseDir}/`;
    } else {
      // Обычное оружие
      const weaponId = u.weapon || u.equipment?.weapon || 'pistol';
      // die и killed — папки без направления
      const folder = (state === 'die' || state === 'killed') ? `${state}/` : `${state}_${baseDir}/`;
      base = `src/assets/units/survivor/${weaponId}/${folder}`;
    }
  }
  
  return { base, needsMirror };
}

// ── РЕНДЕР ────────────────────────────────────────────────

function render() {
  if (!animationPaused) stopAnimation();

  _clearCells();
  _drawPlacementZone();
  _drawHighlights();
  syncUnitsWithDOM();
  updateSidebar();

  if (state.getPhase() !== 'placement' && !animationPaused) {
    startAnimation();
  }
}

// Очищаем только классы клеток — юниты НЕ трогаем
function _clearCells() {
  document.querySelectorAll('.cell').forEach(el => {
    el.className = 'cell';
  });
}

function _drawPlacementZone() {
  if (state.getPhase() !== 'placement') return;
  for (let r = 0; r < ROWS; r++) {
    for (const c of PLACE_COLS) {
      const el = cell(c, r);
      if (el && !unitAt(c, r)) el.classList.add('placement-zone');
    }
  }
}

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
  highlights.throw.forEach(k => {
    const [c, r] = k.split(',').map(Number);
    const el = cell(c, r);
    if (el) el.classList.add('throw-range');
  });
}

// Обновить визуальные элементы юнита (HP bar) без пересоздания DOM
function updateUnitVisuals(u, el) {
  const statusEl = el.querySelector('.unit-status');
  
  // Если юнит мёртв — удаляем status элемент полностью
  if (!u.alive) {
    if (statusEl) statusEl.remove();
    return;
  }
  
  if (!statusEl) return;
  
  // Найти HP bar
  const hpFill = statusEl.querySelector('.hp-fill');
  if (!hpFill) return;
  
  // Обновить ширину
  const pct = Math.max(0, u.hp / u.maxHp);
  hpFill.style.width = (pct * 100) + '%';
  
  // Обновить класс цвета
  hpFill.className = 'hp-fill';
  if (pct <= 0.34) hpFill.classList.add('low');
  else if (pct <= 0.67) hpFill.classList.add('med');

  // Обновить иконки эффектов - удалить старые и добавить новые
  const existingIcons = statusEl.querySelectorAll('.status-icon');
  existingIcons.forEach(icon => icon.remove());

  const effectIcons = getEffectIcons(u);
  effectIcons.forEach(effect => {
    const si = document.createElement('div');
    si.className = 'status-icon';
    si.textContent = effect.icon;
    si.title = effect.name + (effect.duration !== null ? ` (${effect.duration} ход.)` : '');
    statusEl.appendChild(si);
  });
}

// Синхронизировать DOM с state — перемещает элементы, не пересоздаёт
function syncUnitsWithDOM() {
  const units = state.getUnits();
  const selected = state.getSelected();

  units.forEach(u => {
    // Мёртвых не-зомби убираем
    if (!u.alive && u.kind !== UNIT_TYPES.ZOMBIE) {
      const dead = document.getElementById(`unit-${u.id}`);
      if (dead) dead.remove();
      return;
    }

    // Найти или создать элемент
    let el = document.getElementById(`unit-${u.id}`);
    if (!el) {
      el = _buildUnitEl(u, !u.alive);
    }

    // Переместить в правильную клетку (appendChild перемещает, не копирует)
    const targetCell = cell(u.x, u.y);
    if (targetCell && el.parentElement !== targetCell) {
      targetCell.appendChild(el);
    }

    // Обновить классы
    el.classList.toggle('selected-unit', !!(selected && selected.id === u.id));
    el.classList.toggle('dead', !u.alive);
    
    // Режим гранаты — добавляем класс для запрещающего курсора
    const grenadeActive = state.getGrenadeAttackerId();
    el.classList.toggle('grenade-target', !!(grenadeActive && u.kind === UNIT_TYPES.SURVIVOR));

    // Обновить визуальные элементы (HP bar)
    updateUnitVisuals(u, el);

    // Обновить анимацию через dataset — аниматор подхватит на следующем тике
    const img = el.querySelector('img[data-animated]');
    if (!img) return;

    const newState = u.kind === UNIT_TYPES.ZOMBIE
      ? getZombieAnimState(u)
      : getSurvivorAnimState(u);

    const oldState = img.dataset.animState;

    // Если состояние изменилось — сбросить one-shot счётчик
    if (oldState !== newState) {
      resetAnimCounter(u.id);
    }

    // Унифицированное вычисление пути к спрайтам
    const dir = getVisualDirection(u);
    const { base, needsMirror } = computeSpritePath(u, newState, dir);
    const maxFrames = u.kind === UNIT_TYPES.ZOMBIE 
      ? ZOMBIE_FRAMES[newState] || 1 
      : SURVIVOR_FRAMES[newState] || 1;

    // Применить отзеркаливание если нужно
    img.style.transform = needsMirror ? 'scaleX(-1)' : '';

    img.dataset.animated = base;
    img.dataset.animState = newState;
    img.dataset.maxFrames = maxFrames;
    img.dataset.direction = dir; // сохраняем направление для аниматора
    img.dataset.baseDir = getBaseDir(u.kind); // базовое направление для спрайтов
  });

  // Убрать из DOM тех кого нет в state
  document.querySelectorAll('.unit[id^="unit-"]').forEach(el => {
    const id = parseInt(el.id.replace('unit-', ''));
    if (!units.find(u => u.id === id)) el.remove();
  });
}

// Создать элемент юнита (вызывается один раз при первом появлении)
function _buildUnitEl(u, isDead = false) {
  const div = document.createElement('div');
  div.id = `unit-${u.id}`;
  div.className = `unit ${u.kind}`;
  div.dataset.unitId = u.id;
  if (isDead) div.classList.add('dead');

  const visual = document.createElement('div');
  visual.className = 'unit-visual';

  if (u.kind === UNIT_TYPES.ZOMBIE || u.kind === UNIT_TYPES.SURVIVOR) {
    const img = document.createElement('img');

    // Начальный спрайт — первый кадр idle
    const animState = isDead ? (u.kind === UNIT_TYPES.ZOMBIE ? 'killed' : 'die') : 'idle';
    const direction = isDead ? 'left' : getVisualDirection(u);
    const { base, needsMirror } = computeSpritePath(u, animState, direction);
    const maxFrames = u.kind === UNIT_TYPES.ZOMBIE 
      ? ZOMBIE_FRAMES[animState] || 1 
      : SURVIVOR_FRAMES[animState] || 1;

    img.src = `${base}${animState}_1.png`;
    img.dataset.animated = base;
    img.dataset.animState = animState;
    img.dataset.maxFrames = maxFrames;
    img.dataset.unitId = u.id;
    img.style.cssText = 'width:100px;height:100px;object-fit:contain;pointer-events:none;display:block;';
    // Применить отзеркаливание
    img.style.transform = needsMirror ? 'scaleX(-1)' : '';
    
    // Fallback: если нет спрайта — показываем emoji
    img.onerror = function() {
      this.style.display = 'none';
      const em = document.createElement('span');
      em.textContent = u.emoji;
      em.style.cssText = 'font-size:40px;';
      visual.appendChild(em);
    };
    visual.appendChild(img);
  } else {
    const em = document.createElement('span');
    em.textContent = u.emoji;
    em.style.cssText = 'font-size:40px;';
    visual.appendChild(em);
  }

  div.appendChild(visual);

  if (!isDead) {
    const status = document.createElement('div');
    status.className = 'unit-status';
    status.appendChild(_buildHpBar(u));

    const effectIcons = getEffectIcons(u);
    effectIcons.forEach(effect => {
      const si = document.createElement('div');
      si.className = 'status-icon';
      si.textContent = effect.icon;
      si.title = effect.name + (effect.duration !== null ? ` (${effect.duration} ход.)` : '');
      status.appendChild(si);
    });
    div.appendChild(status);

    const tooltip = document.createElement('div');
    tooltip.className = 'unit-tooltip';
    let unitName = u.kind === UNIT_TYPES.SURVIVOR ? (u.name || 'Выживший') : 'Зомби';
    let tooltipHTML = `<span class="tooltip-name">${u.emoji} ${unitName}</span>`;
    if (u.kind === UNIT_TYPES.SURVIVOR) {
      const moveStatus = u.moved ? 'Сходил' : 'Может идти';
      const atkStatus = u.attacked ? 'Атаковал' : 'Может атаковать';
      tooltipHTML += `<span class="tooltip-type">Выживший</span>`;
      
      // Если режим гранаты активен — показываем предупреждение
      if (state.getGrenadeAttackerId()) {
        tooltipHTML += `<span class="tooltip-warning">[ЦЕЛЬ ЗАБЛОКИРОВАНА]</span>`;
      }
      
      tooltipHTML += `<span class="tooltip-move">${moveStatus}</span>`;
      tooltipHTML += `<span class="tooltip-atk">${atkStatus}</span>`;
    }
    tooltip.innerHTML = tooltipHTML;
    div.appendChild(tooltip);
  }

  return div;
}

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

// Экспорт констант для тестов
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ANIMATION_SPEED,
    ZOMBIE_FRAMES,
    SURVIVOR_FRAMES,
    ONE_SHOT_ANIMS,
  };
}
