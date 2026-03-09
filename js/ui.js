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
  const playerInfo = document.getElementById('map-player-info');
  if (playerInfo) {
    playerInfo.innerHTML = `💰 ${gameData.player.gold} монет | ${gameData.player.name}`;
  }

  const levelsContainer = document.getElementById('map-levels');
  if (!levelsContainer) return;
  levelsContainer.innerHTML = '';

  for (let i = 1; i <= 3; i++) {
    const levelInfo = getLevelInfo(i);
    const isCompleted = levelInfo.completed;
    const isAvailable = levelInfo.status === 'available';
    const isLocked = levelInfo.status === 'locked';

    const card = document.createElement('div');
    card.className = `level-card ${isCompleted ? 'completed' : isAvailable ? 'available' : 'locked'}`;

    if (isAvailable) {
      card.onclick = () => {
        gameData.currentLevel = i;
        goToLevelStart(i);
      };
    }

    if (isCompleted) {
      card.innerHTML = `
        <div class="flex-between" style="margin-bottom: 0.5rem;">
          <span class="level-completed-icon text-completed">✓</span>
          <h3 class="text-completed" style="margin: 0;">Уровень ${i}</h3>
        </div>
        <p class="level-desc">${levelInfo.name}</p>
        <p class="text-secondary" style="font-size: 12px; margin: 0;">Пройден</p>
      `;
    } else if (isAvailable) {
      card.innerHTML = `
        <h3 class="text-completed" style="margin: 0 0 0.5rem 0;">Уровень ${i}</h3>
        <p class="level-desc">${levelInfo.name}</p>
        <p style="font-size: 12px; margin: 0.5rem 0;">📍 ${levelInfo.description}</p>
        <p class="level-enemy-count text-completed">🧟 Враг: ${levelInfo.enemyCount}</p>
        <p class="level-reward" style="color: var(--yellow);">💰 Награда: ${levelInfo.reward} монет</p>
      `;
      card.onclick = () => {
        gameData.currentLevel = i;
        goToLevelStart(i);
      };
    } else {
      card.innerHTML = `
        <div class="flex-center">
          <span class="level-locked-icon">🔒</span>
          <h3 class="text-locked" style="margin: 0;">Уровень ${i}</h3>
        </div>
        <p class="level-desc text-locked">${levelInfo.name}</p>
        <p class="text-locked" style="font-size: 12px; margin: 0;">Закрыто</p>
      `;
    }

    levelsContainer.appendChild(card);
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
