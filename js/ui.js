// ════════════════════════════════════════════════════════
// UI — интерфейс: лог, сайдбар, обёртки вызова
// ВНИМАНИЕ: render функции находятся в screens/*.js
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

// ── ОВЕРЛЕЙ В КОНЦЕ БОЯ ───────────────────────────────────

function showEndOverlay(win) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const zAlive = aliveZombies().length;
  const playerLosses = units.filter(u => !u.alive && u.kind === 'player').length;
  const quote = win
    ? '«They mostly come at night... mostly.» — Aliens'
    : '«It\'s not the end of the world... oh wait, it is.»';

  const stats = getStats();
  let levelReward = 0;
  if (win && gameData.currentLevel) {
    levelReward = completeLevel(gameData.currentLevel, stats);
    
    gameData.squad.forEach(unit => {
      updateUnitStats(unit.id, stats);
    });
  }

  const winClass = win ? 'win' : 'lose';
  
  overlay.innerHTML = `
    <div class="overlay-box overlay-end ${winClass}">
      <div class="overlay-end-title">
        ${win ? '🎉 ПОБЕДА' : '💀 ПОРАЖЕНИЕ'}
      </div>
      <p class="overlay-end-status">
        ${win ? '✔ ВСЕ ЗОМБИ УНИЧТОЖЕНЫ' : '✘ ВЫЖИВШИЕ ПАЛИ'}
      </p>

      <div class="overlay-end-stats">
        <div class="overlay-end-stat">Ход: <span>${turnNum}</span></div>
        <div class="overlay-end-stat">Выжито ходов: <span>${turnsSurvived}</span></div>
        <div class="overlay-end-stat">Зомби осталось: <span>${zAlive}</span></div>
        <div class="overlay-end-stat">Потери: <span>${playerLosses} / ${gameData.squad.length}</span></div>
        <div class="overlay-end-stat">Убито: <span>${stats.zombiesKilled}</span></div>
        <div class="overlay-end-stat">Урон нанесён: <span>${stats.damageDealt}</span></div>
        ${win && levelReward > 0 ? `<div class="overlay-end-reward">+${levelReward} монет!</div>` : ''}
      </div>

      <p class="overlay-end-quote">${quote}</p>

      <button class="overlay-end-btn" onclick="this.parentElement.parentElement.remove(); goToMap();">← НА КАРТУ</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

// ── НАЙМ ЮНИТОВ ─────────────────────────────────────────

function showRecruitModal() {
  if (gameData.squad.length >= gameData.player.leadership) {
    alert('Отряд полон! Увеличь лидерство для расширения отряда.');
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'recruit-modal';

  const recruitsHtml = Object.entries(RECRUITS).map(([id, r]) => `
    <div class="recruit-option" onclick="recruitFromUI('${id}')">
      <div class="recruit-emoji">${r.emoji}</div>
      <div class="recruit-name">${r.name}</div>
      <div class="recruit-price">💰 ${r.price}</div>
      <div class="recruit-stats">HP:${r.hp} MOV:${r.moveRange} ATK:${r.atkRange}</div>
    </div>
  `).join('');

  overlay.innerHTML = `
    <div class="overlay-box recruit-overlay">
      <h2 class="recruit-title">👥 НАНЯТЬ В ОТРЯД</h2>
      <div class="recruit-grid">
        ${recruitsHtml}
      </div>
      <button class="recruit-cancel" onclick="document.getElementById('recruit-modal').remove()">ОТМЕНА</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function recruitFromUI(type) {
  const result = recruitUnit(type);
  
  const modal = document.getElementById('recruit-modal');
  if (modal) modal.remove();
  
  if (result.success) {
    renderSquadScreen();
  } else {
    alert(result.reason || 'Не удалось нанять юнита');
  }
}