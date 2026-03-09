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

// ── ЭКРАН КАРТЫ ──────────────────────────────────────────

function renderMapScreen() {
  // Обновить панель статуса
  const nameEl = document.getElementById('top-bar-name');
  const levelEl = document.getElementById('top-bar-level');
  const goldEl = document.getElementById('top-bar-gold');
  
  if (nameEl) nameEl.textContent = gameData.player.name || '—';
  if (levelEl) levelEl.textContent = gameData.player.level || 1;
  if (goldEl) goldEl.textContent = gameData.player.gold || 0;

  const levelsContainer = document.getElementById('map-levels');
  const svgContainer = document.getElementById('map-route-svg');
  if (!levelsContainer) return;
  levelsContainer.innerHTML = '';
  if (svgContainer) svgContainer.innerHTML = '';

  // Найти текущий активный уровень (первый доступный)
  let currentLevel = 0;
  for (let i = 1; i <= 10; i++) {
    if (gameData.levelProgress[i]?.status === 'available' && !gameData.levelProgress[i]?.completed) {
      currentLevel = i;
      break;
    }
  }

  // Сначала рисуем линии маршрута
  for (let i = 1; i < 10; i++) {
    const lvl1 = LEVELS[i];
    const lvl2 = LEVELS[i + 1];
    if (!lvl1 || !lvl2) continue;
    
    const isCompleted = gameData.levelProgress[i]?.completed;
    
    if (svgContainer) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', lvl1.position.x + '%');
      line.setAttribute('y1', lvl1.position.y + '%');
      line.setAttribute('x2', lvl2.position.x + '%');
      line.setAttribute('y2', lvl2.position.y + '%');
      if (isCompleted) line.classList.add('completed');
      svgContainer.appendChild(line);
    }
  }

  // Теперь создаем маркеры уровней
  for (let i = 1; i <= 10; i++) {
    const levelInfo = getLevelInfo(i);
    const levelConfig = LEVELS[i];
    const isCompleted = levelInfo.completed;
    const isAvailable = levelInfo.status === 'available';
    const isLocked = levelInfo.status === 'locked';
    const isCurrent = isAvailable && !isCompleted && i === currentLevel;

    if (!levelConfig) continue;

    const marker = document.createElement('div');
    // Классы: marker + state + (current для анимации)
    let classes = 'level-marker';
    if (isCompleted) classes += ' completed';
    else if (isCurrent) classes += ' available current';
    else if (isAvailable) classes += ' available';
    else classes += ' locked';
    marker.className = classes;

    // Позиционирование на карте
    marker.style.left = levelConfig.position.x + '%';
    marker.style.top = levelConfig.position.y + '%';

    // Содержимое маркера
    let markerContent = '';
    if (isCompleted) {
      markerContent = `
        <span class="level-marker-number">✓</span>
        <span class="level-marker-name">${levelInfo.name}</span>
      `;
    } else if (isLocked) {
      markerContent = `
        <span class="level-marker-number">🔒</span>
        <span class="level-marker-name">—</span>
      `;
    } else {
      markerContent = `
        <span class="level-marker-number">${i}</span>
        <span class="level-marker-name">${levelInfo.name}</span>
      `;
    }
    
    marker.innerHTML = markerContent;

    // Клик только по доступным уровням
    if (isAvailable) {
      marker.onclick = () => {
        gameData.currentLevel = i;
        goToLevelStart(i);
      };
    }

    levelsContainer.appendChild(marker);
  }
}

// ── ЭКРАН ОТРЯДА ─────────────────────────────────────────

function renderSquadScreen() {
  const unitsContainer = document.getElementById('squad-units');
  if (!unitsContainer) return;
  
  unitsContainer.innerHTML = '';

  gameData.squad.forEach(unit => {
    const card = document.createElement('div');
    card.className = 'squad-unit-card';

    card.innerHTML = `
      <div class="unit-emoji">${unit.emoji}</div>
      <div class="unit-name">${unit.name}</div>
      <div class="unit-stats">
        ❤ HP: ${unit.hp}/${unit.maxHp}<br>
        ⚡ Боёв: ${unit.personalStats.battlesPlayed}
      </div>
    `;

    card.onclick = () => {
      selectedSquadUnitId = unit.id;
      renderUnitDetailScreen(unit);
      showScreen(SCREENS.UNIT_DETAIL);
    };

    unitsContainer.appendChild(card);
  });
}

// ── ЭКРАН ДЕТАЛЕЙ ЮНИТА ──────────────────────────────────

function renderUnitDetailScreen(unit) {
  const nameEl = document.getElementById('unit-detail-name');
  const contentEl = document.getElementById('unit-detail-content');

  if (nameEl) nameEl.textContent = unit.name;

  if (contentEl) {
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
            <span style="color: var(--green);">❤ HP:</span> ${unit.hp}/${unit.maxHp}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🚶 Движение:</span> ${unit.moveRange}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🎯 Дальность:</span> ${unit.atkRange}
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">🔫 Оружие:</span> Пистолет
          </div>
          <div style="margin: 0.5rem 0; color: var(--text);">
            <span style="color: var(--green);">💥 Урон:</span> 1-2 (крит 10%)
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
    // Показываем ввод имени
    textEl.textContent = '';
    inputContainer.style.display = 'flex';
    nextBtn.style.display = 'none';
  }
}

function showNextIntroText() {
  currentLoreIndex++;
  showLoreText();
}
