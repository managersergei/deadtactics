// ════════════════════════════════════════════════════════
// РЕНДЕР — отрисовка грида и юнитов
// Чистая функция: читает стейт, обновляет DOM. Без логики.
// Константы вынесены в constants.js
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
  
  let tooltipHTML = `<span class="tooltip-name">${u.emoji} ${u.kind === 'player' ? 'Выживший' : 'Зомби'}</span><span class="tooltip-hp">HP: ${u.hp}/${u.maxHp}</span>`;
  
  if (u.kind === 'player') {
    const w = WEAPONS[u.weapon];
    tooltipHTML += `<span class="tooltip-atk">Атака: дальность ${u.atkRange}, урон ${w.baseDmg}-${w.critDmg} (крит ${Math.round(w.critChance * 100)}%)</span>`;
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

// ════════════════════════════════════════════════════════
// РЕНДЕР КАРТЫ (SVG)
// ════════════════════════════════════════════════════════

function renderMapScreen() {
  // Обновить верхнюю панель
  const nameEl  = document.getElementById('top-bar-name');
  const levelEl = document.getElementById('top-bar-level');
  const goldEl  = document.getElementById('top-bar-gold');
  if (nameEl)  nameEl.textContent  = gameData.player.name  || '—';
  if (levelEl) levelEl.textContent = gameData.player.level || 1;
  if (goldEl)  goldEl.textContent  = gameData.player.gold  || 0;

  const container = document.getElementById('map-levels');
  if (!container) return;
  container.innerHTML = '';

  // Найти текущий доступный уровень
  let currentLevel = 0;
  for (let i = 1; i <= 10; i++) {
    const info = getLevelInfo(i);
    if (info.status === 'available' && !info.completed) {
      currentLevel = i;
      break;
    }
  }

  // Используем константы из constants.js
  const { SVG_W, SVG_H, MAP_POSITIONS, MAP_COLORS, MAP_MARKER, MAP_ZOMBIE_BACKGROUND } = constants;

  // SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.setAttribute('width',  '100%');
  svg.setAttribute('height', '100%');
  svg.style.cssText = 'display:block; max-height: calc(100vh - 140px);';

  // Defs: patterns, filters, gradients
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f2510" stroke-width="0.5"/>
    </pattern>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="blood-glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="blood-spot" cx="100%" cy="100%" r="60%">
      <stop offset="0%" stop-color="#4a0a0a" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#2a0505" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#0a0202" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fog" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1a3a1a" stop-opacity="0.3"/>
      <stop offset="70%" stop-color="#0a1a0a" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#050a05" stop-opacity="0"/>
    </radialGradient>
  `;
  svg.appendChild(defs);

  // Фон с сеткой
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', SVG_W);
  bgRect.setAttribute('height', SVG_H);
  bgRect.setAttribute('fill', 'url(#map-grid)');
  svg.appendChild(bgRect);

  // Пятно крови
  const bloodSpot = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  bloodSpot.setAttribute('cx', '750');
  bloodSpot.setAttribute('cy', '480');
  bloodSpot.setAttribute('rx', '200');
  bloodSpot.setAttribute('ry', '150');
  bloodSpot.setAttribute('fill', 'url(#blood-spot)');
  svg.appendChild(bloodSpot);

  // Туман
  const fog = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  fog.setAttribute('cx', '400');
  fog.setAttribute('cy', '250');
  fog.setAttribute('rx', '250');
  fog.setAttribute('ry', '180');
  fog.setAttribute('fill', 'url(#fog)');
  svg.appendChild(fog);

  // Декоративные зомби (из constants.js)
  MAP_ZOMBIE_BACKGROUND.forEach(z => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', z.x);
    t.setAttribute('y', z.y);
    t.setAttribute('font-size', '18');
    t.setAttribute('opacity', '0.12');
    t.setAttribute('pointer-events', 'none');
    t.textContent = '🧟';
    svg.appendChild(t);
  });

  // Линии маршрута
  for (let i = 1; i < 10; i++) {
    const a = MAP_POSITIONS[i], b = MAP_POSITIONS[i + 1];
    const info = getLevelInfo(i);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.setAttribute('stroke', info.completed ? MAP_COLORS.completed : MAP_COLORS.locked);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '6,4');
    line.setAttribute('pointer-events', 'none');
    svg.appendChild(line);
  }

  // Тултип
  const tooltipG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  tooltipG.setAttribute('id', 'map-tooltip');
  tooltipG.setAttribute('opacity', '0');
  tooltipG.setAttribute('pointer-events', 'none');
  tooltipG.style.transition = 'opacity 0.2s';

  const ttBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  ttBg.setAttribute('id', 'tt-bg');
  ttBg.setAttribute('rx', '4');
  ttBg.setAttribute('fill', '#080f07');
  ttBg.setAttribute('stroke', '#1f4d14');
  ttBg.setAttribute('stroke-width', '1');
  tooltipG.appendChild(ttBg);

  ['tt-name','tt-desc','tt-enemies','tt-reward'].forEach((id, idx) => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('id', id);
    t.setAttribute('font-family', "'Share Tech Mono', monospace");
    t.setAttribute('font-size', idx === 0 ? '13' : '11');
    t.setAttribute('fill', idx === 0 ? '#39ff14' : '#a8d4a0');
    tooltipG.appendChild(t);
  });
  svg.appendChild(tooltipG);

  // Маркеры уровней
  for (let i = 1; i <= 10; i++) {
    const pos  = MAP_POSITIONS[i];
    const info = getLevelInfo(i);
    const cfg  = LEVELS[i];
    if (!cfg) continue;

    const isCompleted = info.completed;
    const isAvailable = info.status === 'available';
    const isLocked    = !isAvailable && !isCompleted;
    const isCurrent   = isAvailable && !isCompleted && i === currentLevel;

    const color = isCompleted ? '#1f4d14'
                : isCurrent   ? '#39ff14'
                : isAvailable ? '#2a7a20'
                :               '#1a2a1a';
    const stroke = isCompleted ? '#2a6a20'
                 : isCurrent   ? '#39ff14'
                 : isAvailable ? '#2a7a20'
                 :               '#0f2510';

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = isAvailable ? 'pointer' : 'default';

    // Пульсирующее кольцо для текущего уровня
    if (isCurrent) {
      const pulseRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulseRing.setAttribute('cx', pos.x);
      pulseRing.setAttribute('cy', pos.y);
      pulseRing.setAttribute('r', '32');
      pulseRing.setAttribute('fill', 'none');
      pulseRing.setAttribute('stroke', '#39ff14');
      pulseRing.setAttribute('stroke-width', '2');
      pulseRing.setAttribute('opacity', '0.6');
      
      const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animate.setAttribute('attributeName', 'r');
      animate.setAttribute('values', '32;40;32');
      animate.setAttribute('dur', '1.5s');
      animate.setAttribute('repeatCount', 'indefinite');
      pulseRing.appendChild(animate);
      
      const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      animateOpacity.setAttribute('attributeName', 'opacity');
      animateOpacity.setAttribute('values', '0.6;0.2;0.6');
      animateOpacity.setAttribute('dur', '1.5s');
      animateOpacity.setAttribute('repeatCount', 'indefinite');
      pulseRing.appendChild(animateOpacity);
      
      g.appendChild(pulseRing);
      
      // Красная точка
      const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      centerDot.setAttribute('cx', pos.x);
      centerDot.setAttribute('cy', pos.y);
      centerDot.setAttribute('r', '6');
      centerDot.setAttribute('fill', '#ff2222');
      centerDot.setAttribute('filter', 'url(#blood-glow)');
      g.appendChild(centerDot);
      
      // Подпись "► ЗДЕСЬ"
      const hereLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      hereLabel.setAttribute('x', pos.x);
      hereLabel.setAttribute('y', pos.y - 30);
      hereLabel.setAttribute('text-anchor', 'middle');
      hereLabel.setAttribute('font-family', "'Share Tech Mono', monospace");
      hereLabel.setAttribute('font-size', '10');
      hereLabel.setAttribute('font-weight', 'bold');
      hereLabel.setAttribute('fill', '#ff2222');
      hereLabel.setAttribute('pointer-events', 'none');
      hereLabel.textContent = '► ЗДЕСЬ';
      g.appendChild(hereLabel);
    }

    // Основной круг
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', '22');
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', isCurrent ? '2.5' : '1.5');
    g.appendChild(circle);

    // Текст
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', pos.x); label.setAttribute('y', pos.y + 5);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-family', "'Oswald', sans-serif");
    label.setAttribute('font-size', '14');
    label.setAttribute('font-weight', '700');
    label.setAttribute('fill', isLocked ? '#2a4a28' : isCompleted ? '#39ff14' : '#ffffff');
    label.setAttribute('pointer-events', 'none');
    label.textContent = isCompleted ? '✓' : isLocked ? '🔒' : String(i);
    g.appendChild(label);

    // Подпись уровня
    const sublabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sublabel.setAttribute('x', pos.x); sublabel.setAttribute('y', pos.y + 38);
    sublabel.setAttribute('text-anchor', 'middle');
    sublabel.setAttribute('font-family', "'Share Tech Mono', monospace");
    sublabel.setAttribute('font-size', '9');
    sublabel.setAttribute('fill', isLocked ? '#1a3a18' : '#4a8a44');
    sublabel.setAttribute('pointer-events', 'none');
    sublabel.textContent = isLocked ? '???' : cfg.name;
    g.appendChild(sublabel);

    // Hover — показать тултип
    if (!isLocked) {
      g.addEventListener('mouseenter', () => {
        const tt   = document.getElementById('map-tooltip');
        const bg   = document.getElementById('tt-bg');
        const name = document.getElementById('tt-name');
        const desc = document.getElementById('tt-desc');
        const ene  = document.getElementById('tt-enemies');
        const rew  = document.getElementById('tt-reward');

        const tx = pos.x + 35 > SVG_W - 160 ? pos.x - 175 : pos.x + 35;
        const ty = Math.max(10, pos.y - 55);

        bg.setAttribute('x', tx); bg.setAttribute('y', ty);
        bg.setAttribute('width', '155'); bg.setAttribute('height', '75');

        name.setAttribute('x', tx + 8); name.setAttribute('y', ty + 18);
        name.textContent = `${i}. ${cfg.name}`;

        desc.setAttribute('x', tx + 8); desc.setAttribute('y', ty + 34);
        desc.textContent = cfg.description;

        ene.setAttribute('x', tx + 8); ene.setAttribute('y', ty + 50);
        ene.textContent = `🧟 Зомби: ${cfg.enemyCount}`;

        rew.setAttribute('x', tx + 8); rew.setAttribute('y', ty + 64);
        rew.setAttribute('fill', '#ffcc00');
        rew.textContent = `💰 Награда: ${cfg.baseReward}`;

        tt.setAttribute('opacity', '1');
      });

      g.addEventListener('mouseleave', () => {
        document.getElementById('map-tooltip').setAttribute('opacity', '0');
      });
    }

    // Клик
    if (isAvailable) {
      g.addEventListener('click', () => {
        gameData.currentLevel = i;
        goToLevelStart(i);
      });
    }

    svg.appendChild(g);
  }

  container.appendChild(svg);
}

// ════════════════════════════════════════════════════════
// РЕНДЕР ИНТРО (НОЖ С ГРАВИРОВКОЙ)
// ════════════════════════════════════════════════════════

function renderIntroKnife() {
  const container = document.getElementById('knife-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const name = gameData.player.name || '';
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 120');
  svg.setAttribute('width', '400');
  svg.setAttribute('height', '120');
  svg.style.cssText = 'display:block; margin: 0 auto;';
  
  svg.innerHTML = `
    <defs>
      <linearGradient id="knife-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#555"/>
        <stop offset="25%" stop-color="#ccc"/>
        <stop offset="50%" stop-color="#fff"/>
        <stop offset="75%" stop-color="#ccc"/>
        <stop offset="100%" stop-color="#444"/>
      </linearGradient>
      <linearGradient id="handle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#5a4030"/>
        <stop offset="50%" stop-color="#2a1810"/>
        <stop offset="100%" stop-color="#1a0a00"/>
      </linearGradient>
    </defs>
    
    <path d="M 10 60 L 200 60 L 200 90 L 15 90 L 10 60" fill="url(#knife-grad)" stroke="#333" stroke-width="2"/>
    <path d="M 15 65 L 60 65 L 60 75 L 20 75 L 15 65" fill="#fff" opacity="0.4"/>
    
    <rect x="200" y="50" width="140" height="30" rx="6" fill="url(#handle-grad)" stroke="#1a0a00" stroke-width="3"/>
    <ellipse cx="210" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="240" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="270" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="300" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="330" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    
    <text x="105" y="80" font-family="monospace" font-size="18" font-weight="bold" fill="#1a1a1a" text-anchor="middle">${name}</text>
  `;
  
  container.appendChild(svg);
  
  // Обновить гравировку при вводе
  const input = document.getElementById('player-name-input');
  if (input) {
    input.oninput = function() {
      gameData.player.name = this.value;
      renderIntroKnife();
    };
  }
}
