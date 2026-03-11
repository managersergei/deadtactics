// ════════════════════════════════════════════════════════
// RENDER BATTLE — рендер боя (грид, юниты, подсветка)
// ════════════════════════════════════════════════════════

// Полная перерисовка сцены (вызывается после каждого действия)
function render() {
  _clearCells();
  _drawPlacementZone();
  _drawHighlights();
  _drawUnits();
  updateSidebar();
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
  if (phase !== 'placement') return;
  for (let r = 0; r < ROWS; r++) {
    for (const c of PLACE_COLS) {
      const el = cell(c, r);
      if (el && !unitAt(c, r)) el.classList.add('placement-zone');
    }
  }
}

// Нарисовать подсветку (движение/атака)
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

// Нарисовать юнитов
function _drawUnits() {
  units.filter(u => u.alive).forEach(u => {
    const el = cell(u.x, u.y);
    if (!el) return;

    if (selected && selected.id === u.id) el.classList.add('selected-unit');

    el.appendChild(_buildUnitEl(u));
  });
}

// Создать элемент юнита
function _buildUnitEl(u) {
  const div = document.createElement('div');
  div.className = `unit ${u.kind}`;
  if (selected && selected.id === u.id) div.classList.add('selected');
  if ((u.moved || u.attacked) && u.kind === 'player') div.classList.add('acted');
  if (u.poisonFlash) div.classList.add('poison-flash');

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
  
  // Определяем имя и тип
  let unitType = u.kind === 'player' ? 'Выживший' : 'Зомби';
  let unitName = u.kind === 'player' ? (u.name || 'Выживший') : 'Зомби';
  let tooltipHTML = `<span class="tooltip-name">${u.emoji} ${unitName}</span>`;
  tooltipHTML += `<span class="tooltip-type">${unitType}</span>`;
  tooltipHTML += `<span class="tooltip-hp">HP: ${u.hp}/${u.maxHp}</span>`;
  
  if (u.kind === 'player') {
    // Статус движения и атаки (только вторая часть)
    const moveStatus = u.moved ? 'Сходил' : 'Может идти';
    const atkStatus = u.attacked ? 'Атаковал' : 'Может атаковать';
    tooltipHTML += `<span class="tooltip-move">Движение: ${moveStatus}</span>`;
    tooltipHTML += `<span class="tooltip-atk">Атака: ${atkStatus}</span>`;
    
    // Эффекты (яд)
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
