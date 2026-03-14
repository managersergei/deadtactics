// ════════════════════════════════════════════════════════
// RENDER BATTLE — рендер боя (грид, юниты, подсветка)
// ════════════════════════════════════════════════════════

// Функции state доступны через window.state

let animationInterval = null;
let animationFrame = 0;
let animationPaused = false;
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
  idle: 3,
  move: 3,
  attack: 2,
  poisoned: 2,
  reload: 3,
  die: 4
};

// Анимации которые играют один раз и замирают на последнем кадре
const ONE_SHOT_ANIMS = new Set(['attack', 'damaged', 'cr_damaged', 'die', 'killed', 'reload', 'poisoned']);

// Индивидуальные счётчики для one-shot анимаций { unitId: frame }
const animFrameCounters = {};

function getZombieAnimState(u) {
  // Приоритет: die > killed > raged > cr_damaged > damaged > attack > move > idle
  if (u.dying)        return 'die';
  if (!u.alive)       return 'killed';
  if (u.raged)        return 'raged';
  if (u.critFlash)    return 'cr_damaged';
  if (u.damagedFlash) return 'damaged';
  if (u.attacking)    return 'attack';
  if (u.moving)       return 'move';
  return 'idle';
}

function getSurvivorAnimState(u) {
  if (u.dying)       return 'die';
  if (u.reloading)   return 'reload';
  if (u.poisonFlash) return 'poisoned';
  if (u.attacking)   return 'attack';
  if (u.moving)      return 'move';
  return 'idle';
}

function startAnimation() {
  if (animationPaused) return;
  if (animationInterval) clearInterval(animationInterval);
  animationInterval = setInterval(() => {
    animationFrame++;

    document.querySelectorAll('img[data-animated]').forEach(img => {
      const animState = img.dataset.animState;
      const maxFrames = parseInt(img.dataset.maxFrames) || 1;
      const unitId = img.dataset.unitId;
      const base = img.dataset.animated;
      if (!base || !animState) return;

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

    // Вычислить путь к папке спрайтов
    let base, maxFrames;
    if (u.kind === UNIT_TYPES.ZOMBIE) {
      const dir = getDirection(u);
      base = `src/assets/units/zombie/${newState}_${dir}/`;
      maxFrames = ZOMBIE_FRAMES[newState] || 1;
    } else {
      const dir = u.direction || 'right';
      const weaponId = u.weapon || u.equipment?.weapon || 'pistol';
      const folder = newState === 'die' ? 'die/' : `${newState}_${dir}/`;
      base = `src/assets/units/survivor/${weaponId}/${folder}`;
      maxFrames = SURVIVOR_FRAMES[newState] || 1;
    }

    img.dataset.animated = base;
    img.dataset.animState = newState;
    img.dataset.maxFrames = maxFrames;
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

  const direction = isDead ? 'left' : (u.direction || 'right');

  if (u.kind === UNIT_TYPES.ZOMBIE || u.kind === UNIT_TYPES.SURVIVOR) {
    const img = document.createElement('img');

    // Начальный спрайт — первый кадр idle
    let base, animState, maxFrames;
    if (u.kind === UNIT_TYPES.ZOMBIE) {
      animState = isDead ? 'killed' : 'idle';
      maxFrames = ZOMBIE_FRAMES[animState] || 1;
      base = `src/assets/units/zombie/${animState}_${direction}/`;
    } else {
      animState = 'idle';
      maxFrames = SURVIVOR_FRAMES.idle;
      const weaponId = u.weapon || u.equipment?.weapon || 'pistol';
      base = `src/assets/units/survivor/${weaponId}/idle_${direction}/`;
    }

    img.src = `${base}${animState}_1.png`;
    img.dataset.animated = base;
    img.dataset.animState = animState;
    img.dataset.maxFrames = maxFrames;
    img.dataset.unitId = u.id;
    img.style.cssText = 'width:100px;height:100px;object-fit:contain;pointer-events:none;display:block;';
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
