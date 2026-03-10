// ════════════════════════════════════════════════════════
// UI — интерфейс для всех экранов
// ════════════════════════════════════════════════════════

// ── ЛОГ БОЯ ──────────────────────────────────────────────

function log(text, cls = 'sys') {
  const div = document.getElementById('log');
  if (!div) return;
  const line = document.createElement('div');
  line.className = `log-line ${cls}`;
  line.textContent = text;
  div.appendChild(line);
  div.scrollTop = div.scrollHeight;
}

function clearLog() {
  const logEl = document.getElementById('log');
  if (logEl) logEl.innerHTML = '';
}

// ── САЙДБАР БОЯ ───────────────────────────────────────────

function updateSidebar() {
  const td = document.getElementById('turn-display');
  const ps = document.getElementById('phase-sub');
  const ui = document.getElementById('unit-info');
  const btn = document.getElementById('btn-end-turn');

  if (!td || !ps || !ui || !btn) return;

  td.className = '';

  if (phase === 'placement') {
    _sidebarPlacement(td, ps, ui, btn);
  } else if (phase === 'player') {
    _sidebarPlayer(td, ps, ui, btn);
  } else if (phase === 'zombie') {
    _sidebarZombie(td, ps, ui, btn);
  }
}

function _sidebarPlacement(td, ps, ui, btn) {
  td.textContent = 'РАССТАНОВКА';
  td.className = 'placement';
  const maxPlace = Math.min(gameData.player.leadership, gameData.squad.length);
  ps.textContent = `Размести юнита ${placedCount + 1}/${maxPlace}`;
  btn.disabled = true;
  ui.innerHTML = '<span class="text-muted">Кликни зелёную клетку</span>';
}

function _sidebarPlayer(td, ps, ui, btn) {
  td.textContent = `ХОД ${turnNum} — ВЫ`;
  td.classList.add('player-turn');
  ps.textContent = `Выжито ходов: ${turnsSurvived}`;
  btn.disabled = false;

  if (selected && selected.kind === 'player') {
    const u = selected;
    const canMove = !u.moved;
    const canAtk  = !u.attacked;
    const poisonBadge = u.poisoned ? ' <span class="text-poison">☠</span>' : '';

    ui.innerHTML = `
      <div class="name text-player">🧍 Выживший</div>
      <div class="stat-row">
        <span class="stat-label">HP</span>
        <span class="stat-val">${u.hp}/${u.maxHp}${poisonBadge}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Движение</span>
        <span class="stat-val">${canMove ? '✅' : '❌'}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Атака</span>
        <span class="stat-val">${canAtk ? '✅' : '❌'}</span>
      </div>
      <div class="unit-status text-muted">
        ${u.moved ? 'Переместился' : u.attacked ? 'Атаковал' : 'Готов'}
      </div>`;
  } else {
    ui.innerHTML = '<span class="text-muted">Кликни своего юнита</span>';
  }
}

function _sidebarZombie(td, ps, ui, btn) {
  td.textContent = 'ХОД ВРАГА';
  td.classList.add('zombie-turn');
  ps.textContent = `Выжито ходов: ${turnsSurvived}`;
  btn.disabled = true;
  ui.innerHTML = '<span class="text-zombie">🧟 Враг атакует...</span>';
}

// ── ЭКРАН КАРТЫ (SVG-версия) ─────────────────────────────

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

  // ── Координаты уровней в SVG-пространстве (800×500) ────
  const SVG_W = 800, SVG_H = 500;
  const positions = [
    null,               // индекс 0 не используется
    { x: 80,  y: 400 }, // 1
    { x: 180, y: 300 }, // 2
    { x: 280, y: 380 }, // 3
    { x: 360, y: 240 }, // 4
    { x: 460, y: 320 }, // 5
    { x: 520, y: 180 }, // 6
    { x: 610, y: 280 }, // 7
    { x: 670, y: 140 }, // 8
    { x: 740, y: 220 }, // 9
    { x: 760, y: 80  }, // 10
  ];

  // Найти текущий доступный уровень
  let currentLevel = 0;
  for (let i = 1; i <= 10; i++) {
    const info = getLevelInfo(i);
    if (info.status === 'available' && !info.completed) {
      currentLevel = i;
      break;
    }
  }

  // ── SVG ────────────────────────────────────────────────
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.setAttribute('width',  '100%');
  svg.setAttribute('height', '100%');
  svg.style.cssText = 'display:block; max-height: calc(100vh - 140px);';

  // Фон сетки + туман войны + пятна крови
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

  // Заливка фоном с сеткой
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', SVG_W);
  bgRect.setAttribute('height', SVG_H);
  bgRect.setAttribute('fill', 'url(#map-grid)');
  svg.appendChild(bgRect);

  // Пятно крови в правом нижнем углу
  const bloodSpot = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  bloodSpot.setAttribute('cx', '750');
  bloodSpot.setAttribute('cy', '480');
  bloodSpot.setAttribute('rx', '200');
  bloodSpot.setAttribute('ry', '150');
  bloodSpot.setAttribute('fill', 'url(#blood-spot)');
  svg.appendChild(bloodSpot);

  // Туман посередине
  const fog = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  fog.setAttribute('cx', '400');
  fog.setAttribute('cy', '250');
  fog.setAttribute('rx', '250');
  fog.setAttribute('ry', '180');
  fog.setAttribute('fill', 'url(#fog)');
  svg.appendChild(fog);

  // Декоративные зомби на фоне
  const zombiePositions = [
    {x:130,y:450},{x:320,y:120},{x:500,y:420},{x:650,y:350},{x:200,y:200}
  ];
  zombiePositions.forEach(z => {
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', z.x);
    t.setAttribute('y', z.y);
    t.setAttribute('font-size', '18');
    t.setAttribute('opacity', '0.12');
    t.setAttribute('pointer-events', 'none');
    t.textContent = '🧟';
    svg.appendChild(t);
  });

  // ── Линии маршрута ─────────────────────────────────────
  for (let i = 1; i < 10; i++) {
    const a = positions[i], b = positions[i + 1];
    const info = getLevelInfo(i);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.setAttribute('stroke',           info.completed ? '#1f4d14' : '#0f2510');
    line.setAttribute('stroke-width',     '2');
    line.setAttribute('stroke-dasharray', '6,4');
    line.setAttribute('pointer-events',   'none');
    svg.appendChild(line);
  }

  // ── Тултип (один общий) ───────────────────────────────
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

  // ── Маркеры уровней ────────────────────────────────────
  for (let i = 1; i <= 10; i++) {
    const pos  = positions[i];
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

    // Свечение для текущего уровня - БОЛЬШОЕ ПУЛЬСИРУЮЩЕЕ КОЛЬЦО
    if (isCurrent) {
      // Внешнее пульсирующее кольцо
      const pulseRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulseRing.setAttribute('cx', pos.x);
      pulseRing.setAttribute('cy', pos.y);
      pulseRing.setAttribute('r', '32');
      pulseRing.setAttribute('fill', 'none');
      pulseRing.setAttribute('stroke', '#39ff14');
      pulseRing.setAttribute('stroke-width', '2');
      pulseRing.setAttribute('opacity', '0.6');
      
      // Анимация пульсации
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
      
      // Красная точка в центре
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

    // Текст внутри маркера
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

    // Подпись уровня снизу
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

        // Позиция тултипа: справа или слева от маркера
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

    // Клик — начать уровень
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

// ── ЭКРАН ОТРЯДА ─────────────────────────────────────────

function renderSquadScreen() {
  const unitsContainer = document.getElementById('squad-units');
  if (!unitsContainer) return;
  
  unitsContainer.innerHTML = '';

  gameData.squad.forEach(unit => {
    const card = document.createElement('div');
    card.className = 'squad-unit-card';

    // Fallback значения для защиты от undefined
    const name = unit.name || 'Выживший';
    const emoji = unit.emoji || '🧍';
    const hp = unit.hp ?? 0;
    const maxHp = unit.maxHp ?? 5;
    const battles = unit.personalStats?.battlesPlayed ?? 0;

    card.innerHTML = `
      <div class="unit-emoji">${emoji}</div>
      <div class="unit-name">${name}</div>
      <div class="unit-stats">
        ❤ HP: ${hp}/${maxHp}<br>
        ⚡ Боёв: ${battles}
      </div>
    `;

    card.onclick = () => {
      selectedSquadUnitId = unit.id;
      renderUnitDetailScreen(unit);
      showScreen(SCREENS.UNIT_DETAIL);
    };

    unitsContainer.appendChild(card);
  });
  
  // Рендер статистики отряда
  renderSquadStats();
}

function renderSquadStats() {
  const container = document.getElementById('squad-stats');
  if (!container) return;

  // Посчитать статистику
  let totalKills = 0;
  let totalDamage = 0;
  let totalBattles = 0;
  
  gameData.squad.forEach(unit => {
    totalKills += unit.personalStats.zombiesKilled;
    totalDamage += unit.personalStats.totalDamageDealt;
    totalBattles += unit.personalStats.battlesPlayed;
  });

  container.innerHTML = `
    <div class="squad-stat-row">
      <span class="squad-stat-label">🧟 Всего убито</span>
      <span class="squad-stat-value">${totalKills}</span>
    </div>
    <div class="squad-stat-row">
      <span class="squad-stat-label">⚔️ Нанесено урона</span>
      <span class="squad-stat-value">${totalDamage}</span>
    </div>
    <div class="squad-stat-row">
      <span class="squad-stat-label">🎮 Сыграно боёв</span>
      <span class="squad-stat-value">${totalBattles}</span>
    </div>
    <div class="squad-stat-row">
      <span class="squad-stat-label">👥 Юнитов</span>
      <span class="squad-stat-value">${gameData.squad.length}</span>
    </div>
  `;
}

// ── ЭКРАН ДЕТАЛЕЙ ЮНИТА ──────────────────────────────────

function renderUnitDetailScreen(unit) {
  const nameEl = document.getElementById('unit-detail-name');
  const contentEl = document.getElementById('unit-detail-content');

  if (nameEl) nameEl.textContent = unit.name;

  if (contentEl) {
    // Получаем данные о снаряжении
    const weaponId = getEffectiveStat(unit, 'weapon');
    const weapon = ITEMS[weaponId];
    
    const armorId = unit.equipment?.armor;
    const armor = armorId ? ITEMS[armorId] : null;
    
    const bootsId = unit.equipment?.boots;
    const boots = bootsId ? ITEMS[bootsId] : null;
    
    // Эффективные статы
    const effectiveMaxHp = getEffectiveStat(unit, 'maxHp');
    const effectiveMove = getEffectiveStat(unit, 'moveRange');
    
    // Текстовые представления
    const weaponText = weapon ? `${weapon.emoji} ${weapon.name}` : 'нет';
    const armorText = armor ? `${armor.name} (+${armor.extraHp} HP)` : 'нет (защита 0)';
    const bootsText = boots ? `${boots.name} (+${boots.moveBonus})` : 'базовые (+0)';
    
    // Урон
    const dmgMin = weapon?.baseDmg || 1;
    const dmgMax = weapon?.critDmg || 2;
    const critChance = weapon ? (weapon.critChance * 100).toFixed(0) : '10';
    const defense = armor?.extraHp || 0;
    
    contentEl.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div style="text-align: center;">
          <div style="font-size: 100px;">${unit.emoji}</div>
          <div style="color: var(--green); font-weight: bold; margin-top: 1rem; font-size: 18px;">${unit.name}</div>
          <div style="color: var(--text); font-size: 12px; margin-top: 0.25rem;">Уровень 1</div>
        </div>

        <div style="border-left: 1px solid var(--border); padding-left: 1rem;">
          <div style="color: var(--yellow); font-weight: bold; margin-bottom: 0.5rem;">📊 ХАРАКТЕРИСТИКИ</div>
          
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">❤ HP:</span> ${unit.hp}/${effectiveMaxHp}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🚶 Движение:</span> ${effectiveMove}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🎯 Дальность:</span> ${unit.atkRange}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">⚔️ Атака:</span> ${dmgMin}-${dmgMax} (крит ${critChance}%)
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🛡️ Защита:</span> ${defense}
          </div>

          <div style="border-top: 1px solid var(--border); margin-top: 1rem; padding-top: 1rem; color: var(--yellow); font-weight: bold;">🎒 СНАРЯЖЕНИЕ</div>
          
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🔫 Оружие:</span> ${weaponText}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🛡️ Броня:</span> ${armorText}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">👟 Ботинки:</span> ${bootsText}
          </div>

          <div style="border-top: 1px solid var(--border); margin-top: 1rem; padding-top: 1rem; color: var(--yellow); font-weight: bold;">📈 СТАТИСТИКА</div>
          
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🧟 Убито:</span> ${unit.personalStats.zombiesKilled}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🩸 Получено урона:</span> ${unit.personalStats.damageTaken}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">⚔ Всего урона:</span> ${unit.personalStats.totalDamageDealt}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🎮 Боёв сыграно:</span> ${unit.personalStats.battlesPlayed}
          </div>
        </div>
      </div>
    `;
  }
}

// ── ЭКРАН ПЕРЕД БОЕМ ──────────────────────────────────────

function renderLevelStartScreen(levelNum) {
  const levelInfo = getLevelInfo(levelNum);

  const titleEl = document.getElementById('level-start-title');
  const descEl = document.getElementById('level-start-desc');
  const statsEl = document.getElementById('level-start-stats');

  if (titleEl) titleEl.textContent = `Уровень ${levelNum}: ${levelInfo.name}`;
  if (descEl) descEl.textContent = levelInfo.description;

  if (statsEl) {
    statsEl.innerHTML = `
      <div class="row">
        <span class="emoji">🧟</span>
        <div>Враги: <b>${levelInfo.enemyCount} зомби</b></div>
      </div>
      <div class="row" style="margin-top: 0.5rem;">
        <span class="emoji">💰</span>
        <div>Награда: <b>${levelInfo.reward} монет</b> + <b>5 за каждого убитого</b></div>
      </div>
      <div class="row" style="margin-top: 0.5rem;">
        <span class="emoji">👥</span>
        <div>Твой отряд: <b>${gameData.squad.length} юнит</b></div>
      </div>
    `;
  }
}

// ── ОВЕРЛЕЙ В КОНЦЕ БОЯ ───────────────────────────────────

function showEndOverlay(win) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.9); 
    z-index: 2000; display: flex; align-items: center; justify-content: center;
  `;

  const zAlive = aliveZombies().length;
  const playerLosses = units.filter(u => !u.alive && u.kind === 'player').length;
  const quote = win
    ? '«They mostly come at night... mostly.» — Aliens'
    : '«It\'s not the end of the world... oh wait, it is.»';

  const stats = getStats();
  let levelReward = 0;
  if (win && gameData.currentLevel) {
    levelReward = completeLevel(gameData.currentLevel, stats);
    
    // Синхронизировать статистику боя с отрядом
    gameData.squad.forEach(unit => {
      updateUnitStats(unit.id, stats);
    });
  }

  overlay.innerHTML = `
    <div style="background: var(--panel); border: 3px solid ${win ? 'var(--green)' : 'var(--red)'}; padding: 2rem; border-radius: 8px; text-align: center; max-width: 500px;">
      <div style="font-size: 48px; color: ${win ? 'var(--green)' : 'var(--red)'}; margin-bottom: 0.5rem;">
        ${win ? '🎉 ПОБЕДА' : '💀 ПОРАЖЕНИЕ'}
      </div>
      <p style="color:${win ? '#3a7a34' : '#7a2a24'};letter-spacing:2px;font-size:13px;margin-bottom:12px">
        ${win ? '✔ ВСЕ ЗОМБИ УНИЧТОЖЕНЫ' : '✘ ВЫЖИВШИЕ ПАЛИ'}
      </p>

      <div style="background: rgba(100,100,100,0.2); padding: 1rem; border-radius: 4px; margin: 1rem 0; text-align: left;">
        <div style="margin: 0.5rem 0; color: var(--text);">Ход: <span style="color: var(--green);">${turnNum}</span></div>
        <div style="margin: 0.5rem 0; color: var(--text);">Выжито ходов: <span style="color: var(--green);">${turnsSurvived}</span></div>
        <div style="margin: 0.5rem 0; color: var(--text);">Зомби осталось: <span style="color: var(--green);">${zAlive}</span></div>
        <div style="margin: 0.5rem 0; color: var(--text);">Потери: <span style="color: var(--green);">${playerLosses} / ${gameData.squad.length}</span></div>
        <div style="margin: 0.5rem 0; color: var(--text);">Убито: <span style="color: var(--green);">${stats.zombiesKilled}</span></div>
        <div style="margin: 0.5rem 0; color: var(--text);">Урон нанесён: <span style="color: var(--green);">${stats.damageDealt}</span></div>
        ${win && levelReward > 0 ? `<div style="margin: 0.5rem 0; color: var(--green); font-weight: bold;">+${levelReward} монет!</div>` : ''}
      </div>

      <p style="color:${win ? '#2ecc71' : 'var(--red)'};margin-top:1rem;font-size:12px">${quote}</p>

      <button onclick="this.parentElement.parentElement.remove(); goToMap();" style="margin-top: 1.5rem; padding: 10px 20px; background: var(--green); color: var(--bg); border: none; font-weight: bold; cursor: pointer; border-radius: 4px;">← НА КАРТУ</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

// ── ЭКРАН ИНТРО (ЛОГ + ИМЯ) ────────────────────────────

let currentLoreIndex = 0;

function renderIntroScreen() {
  currentLoreIndex = 0;
  showLoreText();
}

function showLoreText() {
  const textEl = document.getElementById('intro-text');
  const inputContainer = document.getElementById('intro-input-container');
  const nextBtn = document.getElementById('intro-next-btn');

  if (!textEl || !inputContainer || !nextBtn) return;

  if (currentLoreIndex < LORE_MESSAGES.length) {
    // Показываем текст
    textEl.textContent = LORE_MESSAGES[currentLoreIndex];
    inputContainer.style.display = 'none';
    nextBtn.style.display = 'block';
    nextBtn.textContent = currentLoreIndex === LORE_MESSAGES.length - 1 ? 'ДАЛЕЕ →' : 'ДАЛЕЕ →';
  } else {
    // Показываем ввод имени + нож с гравировкой
    textEl.textContent = '';
    renderIntroKnife();
    inputContainer.style.display = 'flex';
    nextBtn.style.display = 'none';
  }
}

// Отрендерить SVG-нож с гравировкой
function renderIntroKnife() {
  const container = document.getElementById('knife-container');
  if (!container) return;
  
  // Очистить контейнер для перерисовки
  container.innerHTML = '';
  
  const name = gameData.player.name || '';
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 120');
  svg.setAttribute('width', '400');
  svg.setAttribute('height', '120');
  svg.style.cssText = 'display:block; margin: 0 auto;';
  
  // Нож - очень толстый и большой
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
    
    <!-- Лезвие ножа - очень толстое (30px высота) -->
    <path d="M 10 60 L 200 60 L 200 90 L 15 90 L 10 60" fill="url(#knife-grad)" stroke="#333" stroke-width="2"/>
    <!-- Блик на лезвии -->
    <path d="M 15 65 L 60 65 L 60 75 L 20 75 L 15 65" fill="#fff" opacity="0.4"/>
    
    <!-- Рукоятка - толстая -->
    <rect x="200" y="50" width="140" height="30" rx="6" fill="url(#handle-grad)" stroke="#1a0a00" stroke-width="3"/>
    <!-- Кольца на рукоятке -->
    <ellipse cx="210" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="240" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="270" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="300" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="330" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    
    <!-- Гравировка на лезвии - большая -->
    <text x="105" y="80" font-family="monospace" font-size="18" font-weight="bold" fill="#1a1a1a" text-anchor="middle">${name}</text>
  `;
  
  container.appendChild(svg);
  
  // Добавить обработчик ввода для обновления гравировки
  const input = document.getElementById('player-name-input');
  if (input) {
    input.oninput = function() {
      gameData.player.name = this.value;
      renderIntroKnife();
    };
  }
}

function showNextIntroText() {
  currentLoreIndex++;
  showLoreText();
}

// ── МАГАЗИН ────────────────────────────────────────────

// Глобальная переменная для выбранного юнита в магазине
let shopSelectedUnitId = null;

function renderShopScreen() {
  // Обновить золото
  const goldEl = document.getElementById('shop-gold');
  if (goldEl) goldEl.textContent = '💰 ' + (gameData.player.gold || 0);
  
  // Обновить селектор юнитов
  updateShopUnitSelector();
  
  // Рендер секций
  renderShopSection('shop-weapons', 'weapon');
  renderShopSection('shop-armors', 'armor');
  renderShopSection('shop-boots', 'boots');
}

function updateShopUnitSelector() {
  const select = document.getElementById('shop-unit-select');
  if (!select) return;
  
  // Сохранить текущее значение
  const currentValue = select.value;
  
  // Заполнить список юнитов
  select.innerHTML = '<option value="">-- Выберите юнита --</option>';
  
  gameData.squad.forEach(unit => {
    const option = document.createElement('option');
    option.value = unit.id;
    option.textContent = `${unit.emoji} ${unit.name}`;
    select.appendChild(option);
  });
  
  // Восстановить выбор
  if (currentValue && gameData.squad.some(u => u.id === parseInt(currentValue))) {
    select.value = currentValue;
    shopSelectedUnitId = parseInt(currentValue);
  }
}

function renderShopSection(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Найти предметы этого типа
  const items = Object.entries(ITEMS).filter(([id, item]) => item.type === type);
  
  container.innerHTML = items.map(([id, item]) => {
    // Проверить, экипирован ли предмет у выбранного юнита
    let isOwned = false;
    if (shopSelectedUnitId) {
      const unit = getUnitById(shopSelectedUnitId);
      if (unit && unit.equipment && unit.equipment[type] === id) {
        isOwned = true;
      }
    }
    
    return `
      <div class="shop-item ${isOwned ? 'owned' : ''}" 
           onclick="buyItemFromShop('${id}')">
        <div class="shop-item-name">${item.emoji} ${item.name}</div>
        <div class="shop-item-price">💰 ${item.price}</div>
        <div class="shop-item-stats">${getItemStatsText(item)}</div>
      </div>
    `;
  }).join('');
}

function getItemStatsText(item) {
  const stats = [];
  if (item.baseDmg) {
    // Показать диапазон урона
    const minDmg = item.baseDmg;
    const maxDmg = item.critDmg || item.baseDmg + 1;
    stats.push(`⚔️ ${minDmg}-${maxDmg}`);
  }
  if (item.critChance) stats.push(`🎯 ${(item.critChance*100).toFixed(0)}%`);
  if (item.extraHp) stats.push(`❤️ +${item.extraHp}`);
  if (item.moveBonus) stats.push(`👟 +${item.moveBonus}`);
  
  // Добавить описание предмета
  if (item.desc) {
    stats.push(`<br><span style="color:#5a7a5a;font-size:10px">${item.desc}</span>`);
  }
  
  return stats.join(' ');
}

function shopSelectUnit(unitId) {
  shopSelectedUnitId = unitId ? parseInt(unitId) : null;
  // Перерисовать секции чтобы обновить статус "экипировано"
  renderShopSection('shop-weapons', 'weapon');
  renderShopSection('shop-armors', 'armor');
  renderShopSection('shop-boots', 'boots');
}

function buyItemFromShop(itemId) {
  if (!shopSelectedUnitId) {
    alert('Сначала выберите юнита в выпадающем списке!');
    return;
  }
  
  const result = buyItem(shopSelectedUnitId, itemId);
  if (result.success) {
    // Обновить UI
    renderShopScreen();
    // Также обновить отряд если открыт
    if (currentScreen === 'screen-squad') {
      renderSquadScreen();
    }
  } else {
    alert(result.reason || 'Не удалось купить предмет');
  }
}

// ── НАЙМ ЮНИТОВ ─────────────────────────────────────────

function showRecruitModal() {
  // Проверить, есть ли место в отряде
  if (gameData.squad.length >= gameData.player.leadership) {
    alert('Отряд полон! Увеличь лидерство для расширения отряда.');
    return;
  }

  // Создать модалку
  const overlay = document.createElement('div');
  overlay.id = 'recruit-modal';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.9);
    z-index: 2000; display: flex; align-items: center; justify-content: center;
  `;

  const recruitsHtml = Object.entries(RECRUITS).map(([id, r]) => `
    <div class="recruit-option" onclick="recruitFromUI('${id}')" style="
      background: var(--panel);
      border: 2px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    " onmouseover="this.style.borderColor='var(--green)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="font-size: 48px;">${r.emoji}</div>
      <div style="color: var(--green); font-weight: bold; margin: 0.5rem 0;">${r.name}</div>
      <div style="color: var(--yellow); font-weight: bold;">💰 ${r.price}</div>
      <div style="color: var(--text); font-size: 11px; margin-top: 0.5rem;">
        HP:${r.hp} MOV:${r.moveRange} ATK:${r.atkRange}
      </div>
    </div>
  `).join('');

  overlay.innerHTML = `
    <div style="background: var(--panel); border: 2px solid var(--green); padding: 2rem; border-radius: 8px; text-align: center; max-width: 500px; width: 90%;">
      <h2 style="color: var(--green); margin-bottom: 1rem;">👥 НАНЯТЬ В ОТРЯД</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        ${recruitsHtml}
      </div>
      <button onclick="document.getElementById('recruit-modal').remove()" style="padding: 10px 20px; background: var(--border); color: var(--text); border: none; border-radius: 4px; cursor: pointer;">ОТМЕНА</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function recruitFromUI(type) {
  const result = recruitUnit(type);
  
  // Закрыть модалку
  const modal = document.getElementById('recruit-modal');
  if (modal) modal.remove();
  
  if (result.success) {
    // Обновить экран отряда
    renderSquadScreen();
  } else {
    alert(result.reason || 'Не удалось нанять юнита');
  }
}
