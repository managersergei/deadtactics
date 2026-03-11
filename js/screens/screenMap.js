// ════════════════════════════════════════════════════════
// SCREEN MAP — рендер экрана карты
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

  // Используем глобальные константы из constants.js
  // (они экспортируются в window через constants.js)
  const SVG_W = window.SVG_W;
  const SVG_H = window.SVG_H;
  const MAP_POSITIONS = window.MAP_POSITIONS;
  const MAP_COLORS = window.MAP_COLORS;
  const MAP_MARKER = window.MAP_MARKER;
  const MAP_ZOMBIE_BACKGROUND = window.MAP_ZOMBIE_BACKGROUND;

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

    const color = isCompleted ? MAP_COLORS.completed
                : isCurrent   ? MAP_COLORS.current
                : isAvailable ? MAP_COLORS.available
                :               MAP_COLORS.locked;
    const stroke = isCompleted ? MAP_COLORS.strokeCompleted
                 : isCurrent   ? MAP_COLORS.strokeCurrent
                 : isAvailable ? MAP_COLORS.strokeAvailable
                 :               MAP_COLORS.strokeLocked;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.style.cursor = isAvailable ? 'pointer' : 'default';

    // Пульсирующее кольцо для текущего уровня
    if (isCurrent) {
      const pulseRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulseRing.setAttribute('cx', pos.x);
      pulseRing.setAttribute('cy', pos.y);
      pulseRing.setAttribute('r', '32');
      pulseRing.setAttribute('fill', 'none');
      pulseRing.setAttribute('stroke', MAP_COLORS.current);
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
    circle.setAttribute('r', MAP_MARKER.r);
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', isCurrent ? MAP_MARKER.currentStrokeWidth : MAP_MARKER.strokeWidth);
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
