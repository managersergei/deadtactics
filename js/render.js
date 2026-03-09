// ════════════════════════════════════════════════════════
// РЕНДЕР — отрисовка грида и юнитов
// Чистая функция: читает стейт, обновляет DOM. Без логики.
// ════════════════════════════════════════════════════════

// Получить DOM-элемент клетки по координатам
function cell(c, r) {
  return document.getElementById(`c${c}_${r}`);
}

// Создать грид (вызывается один раз при старте)
function buildGrid() {
  const g = document.getElementById('grid');
  g.innerHTML = '';
  // гарантируем, что CSS‑грид соответствует текущим константам
  g.style.gridTemplateColumns = `repeat(${COLS}, 68px)`;
  g.style.gridTemplateRows = `repeat(${ROWS}, 68px)`;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const el = document.createElement('div');
      el.className = 'cell';
      el.id = `c${c}_${r}`;
      el.dataset.c = c;
      el.dataset.r = r;
      el.addEventListener('click', () => onCellClick(c, r));
      g.appendChild(el);
    }
  }
}

// Полная перерисовка сцены (вызывается после каждого действия)
function render() {
  _clearCells();
  _drawPlacementZone();
  _drawHighlights();
  _drawUnits();
  updateSidebar();
}

// ── Вспомогательные функции рендера ──────────────────────

function _clearCells() {
  document.querySelectorAll('.cell').forEach(el => {
    el.className = 'cell';
    el.innerHTML = '';
  });
}

function _drawPlacementZone() {
  if (phase !== 'placement') return;
  for (let r = 0; r < ROWS; r++) {
    for (const c of PLACE_COLS) {
      const el = cell(c, r);
      if (el && !unitAt(c, r)) el.classList.add('placement-zone');
    }
  }
}

function _drawHighlights() {
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

function _drawUnits() {
  units.filter(u => u.alive).forEach(u => {
    const el = cell(u.x, u.y);
    if (!el) return;

    if (selected && selected.id === u.id) el.classList.add('selected-unit');

    el.appendChild(_buildUnitEl(u));
  });
}

function _buildUnitEl(u) {
  const div = document.createElement('div');
  div.className = `unit ${u.kind}`;
  if (selected && selected.id === u.id) div.classList.add('selected');
  if ((u.moved || u.attacked) && u.kind === 'player') div.classList.add('acted');

  // Эмодзи
  const em = document.createElement('span');
  em.textContent = u.emoji;
  div.appendChild(em);

  // Иконка яда
  if (u.poisoned) {
    const si = document.createElement('div');
    si.className = 'status-icon';
    si.textContent = '☠';
    div.appendChild(si);
  }

  // HP-бар
  div.appendChild(_buildHpBar(u));

  // Tooltip с информацией о юните
  const tooltip = document.createElement('div');
  tooltip.className = 'unit-tooltip';
  
  let tooltipHTML = `<span class="tooltip-name">${u.emoji} ${u.kind === 'player' ? 'Выживший' : 'Зомби'}</span><span class="tooltip-hp">HP: ${u.hp}/${u.maxHp}</span>`;
  
  if (u.kind === 'player') {
    tooltipHTML += `<span class="tooltip-atk">Атака: дальность ${u.atkRange}, урон ${u.atkDmg}</span>`;
  }
  
  tooltip.innerHTML = tooltipHTML;
  div.appendChild(tooltip);

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
