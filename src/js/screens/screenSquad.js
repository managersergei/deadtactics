// ════════════════════════════════════════════════════════
// SCREEN SQUAD — рендер экрана отряда
// ════════════════════════════════════════════════════════

function renderSquadScreen() {
  const unitsContainer = document.getElementById('squad-units');
  if (!unitsContainer) return;
  
  unitsContainer.innerHTML = '';

  gameData.squad.forEach(unit => {
    const card = document.createElement('div');
    card.className = 'squad-unit-card';

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

    // Используем addEventListener вместо onclick
    card.addEventListener('click', () => {
      selectedSquadUnitId = unit.id;
      renderUnitDetailScreen(unit);
      showScreen(SCREENS.UNIT_DETAIL);
    });

    unitsContainer.appendChild(card);
  });
  
  renderSquadStats();
}

function renderSquadStats() {
  const container = document.getElementById('squad-stats');
  if (!container) return;

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
