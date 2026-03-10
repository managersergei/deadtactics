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

// ── НАЙМ ЮНИТОВ ─────────────────────────────────────────

function showRecruitModal() {
  if (gameData.squad.length >= gameData.player.leadership) {
    alert('Отряд полон! Увеличь лидерство для расширения отряда.');
    return;
  }

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
  
  const modal = document.getElementById('recruit-modal');
  if (modal) modal.remove();
  
  if (result.success) {
    renderSquadScreen();
  } else {
    alert(result.reason || 'Не удалось нанять юнита');
  }
}
