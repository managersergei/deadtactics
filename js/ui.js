// ════════════════════════════════════════════════════════
// UI — лог, сайдбар, оверлей
// Только отображение. Никакой игровой логики здесь.
// ════════════════════════════════════════════════════════

// Добавить строку в лог боя
// cls: 'sys' | 'move' | 'dmg' | 'poison' | 'zombie-act' | 'win'
function log(text, cls = 'sys') {
  const div = document.getElementById('log');
  const line = document.createElement('div');
  line.className = `log-line ${cls}`;
  line.textContent = text;
  div.appendChild(line);
  div.scrollTop = div.scrollHeight;
}

// Очистить лог
function clearLog() {
  document.getElementById('log').innerHTML = '';
}

// Обновить сайдбар (статус, инфо о юните)
function updateSidebar() {
  const td = document.getElementById('turn-display');
  const ps = document.getElementById('phase-sub');
  const ui = document.getElementById('unit-info');
  const btn = document.getElementById('btn-end-turn');

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
  ps.textContent = `Размести юнита ${placedCount + 1}/${PLAYER_UNIT_COUNT}`;
  btn.disabled = true;
  ui.innerHTML = '<span style="color:#2a5a24">Кликни зелёную клетку</span>';
}

function _sidebarPlayer(td, ps, ui, btn) {
  td.textContent = `ХОД ${turnNum} — ВЫ`;
  td.classList.add('player-turn');
  ps.textContent = 'Управляй выжившими';
  btn.disabled = false;

  if (selected && selected.kind === 'player') {
    const u = selected;
    const canMove = !u.moved && !u.attacked;
    const canAtk  = !u.attacked && !u.moved;
    const poisonBadge = u.poisoned ? ' <span style="color:var(--purple)">☠</span>' : '';

    ui.innerHTML = `
      <div class="name" style="color:#4a9ae4">🧍 Выживший</div>
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
      <div style="color:#2a5a24;font-size:10px;margin-top:4px">
        ${u.moved ? 'Переместился' : u.attacked ? 'Атаковал' : 'Готов'}
      </div>`;
  } else {
    ui.innerHTML = '<span style="color:#2a5a24">Кликни своего юнита</span>';
  }
}

function _sidebarZombie(td, ps, ui, btn) {
  td.textContent = `ХОД ${turnNum} — ЗОМБИ`;
  td.classList.add('zombie-turn');
  ps.textContent = 'Зомби атакуют...';
  btn.disabled = true;
  ui.innerHTML = '<span style="color:#e67e22">🧟 Зомби идут на вас...</span>';
}

// Показать финальный оверлей (победа / поражение)
function showEndOverlay(win) {
  const overlay = document.getElementById('overlay');
  const zAlive = aliveZombies().length;
  const playerLosses = units.filter(u => !u.alive && u.kind === 'player').length;

  const quote = win
    ? '«They mostly come at night... mostly.» — Aliens'
    : '«It\'s not the end of the world... oh wait, it is.»';

  overlay.innerHTML = `
    <div class="overlay-title ${win ? 'green' : 'red'}">${win ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}</div>
    <p style="color:${win ? '#3a7a34' : '#7a2a24'};letter-spacing:2px;font-size:13px;margin-bottom:12px">
      ${win ? '✔ ВСЕ ЗОМБИ УНИЧТОЖЕНЫ' : '✘ ВЫЖИВШИЕ ПАЛИ'}
    </p>
    <div class="overlay-box">
      <div>Ход финала: <b>${turnNum}</b></div>
      <div>Зомби осталось: <b>${zAlive}</b></div>
      <div>Потери: <b>${playerLosses} / ${PLAYER_UNIT_COUNT}</b></div>
      <div style="color:${win ? '#2ecc71' : 'var(--red)'};margin-top:8px">${quote}</div>
    </div>
    <button id="overlay-btn" onclick="startGame()">↺ ИГРАТЬ СНОВА</button>
  `;
  overlay.style.display = 'flex';
}
