// ════════════════════════════════════════════════════════
// UI — интерфейс: лог, сайдбар, обёртки вызова
// ВНИМАНИЕ: render функции находятся в screens/*.js
// ════════════════════════════════════════════════════════

// Функции state доступны через window.state

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
  const ui = document.getElementById('unit-info');
  const btn = document.getElementById('btn-end-turn');

  if (!ui || !btn) return;

  const phase = state.getPhase();

  if (phase === 'placement') {
    _sidebarPlacement(ui, btn);
  } else if (phase === 'player') {
    _sidebarUnit(ui, btn);
  } else if (phase === 'zombie') {
    _sidebarUnit(ui, btn);
  }
}

function _sidebarPlacement(ui, btn) {
  const maxPlace = Math.min(gameData.player.leadership, gameData.squad.length);
  const placedCount = state.getPlacedCount();
  log('📍 Расстановка. Размести юнита ' + (placedCount + 1) + '/' + maxPlace, 'sys');
  btn.disabled = true;
  ui.innerHTML = '<span class="text-muted">Кликни зелёную клетку</span>';
}

function _sidebarUnit(ui, btn) {
  const phase = state.getPhase();
  // Кнопка в зависимости от фазы
  if (phase === 'player') {
    btn.disabled = false;
  } else if (phase === 'zombie') {
    btn.disabled = true;
  }

  const selected = state.getSelected();
  if (selected && selected.kind === 'survivor') {
    const u = selected;
    
    // Эффекты - унифицированная система
    const effectIcons = getEffectIcons(u);
    const effectBadges = effectIcons.map(e => `<span class="text-poison">${e.icon}</span>`).join(' ');

    // Оружие - берём из equipment
    const weaponId = u.equipment?.weapon || 'pistol';
    const w = ITEMS[weaponId];
    const weaponName = w ? w.name : 'Пистолет';
    const weaponDesc = w ? w.desc : 'Надёжное оружие ближнего боя. 10% крит';
    const weaponDmg = w ? w.baseDmg : 1;
    const weaponRange = w && w.atkRange ? w.atkRange : u.atkRange;
    
    // Айтемы
    let itemsHtml = '';
    if (u.equipment) {
      if (u.equipment.armor) {
        const armor = ITEMS[u.equipment.armor];
        itemsHtml += `<div class="stat-row"><span class="stat-label">Броня</span><span class="stat-val">${armor ? armor.name : '-'}</span></div>`;
      }
      if (u.equipment.boots) {
        const boots = ITEMS[u.equipment.boots];
        itemsHtml += `<div class="stat-row"><span class="stat-label">Обувь</span><span class="stat-val">${boots ? boots.name : '-'}</span></div>`;
      }
    }

    // Тип юнита (из RECRUITS)
    const unitTypeData = RECRUITS.survivor;
    const typeDesc = unitTypeData && unitTypeData.description ? unitTypeData.description : 'Обычный выживший';
    
    ui.innerHTML = `
      <div class="name text-player">🧍 ${u.name || 'Выживший'}</div>
      <div class="stat-row" style="font-size: 9px; color: #4a7a44;">${typeDesc}</div>
      <div class="stat-row">
        <span class="stat-label">HP</span>
        <span class="stat-val">${u.hp}/${u.maxHp}${effectBadges ? ' ' + effectBadges : ''}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Оружие</span>
        <span class="stat-val">${weaponName} (${weaponDmg} урон, ${weaponRange} кл.)</span>
      </div>
      <div class="stat-row" style="font-size: 9px; color: #4a7a44;">${weaponDesc}</div>
      ${itemsHtml}
      ${phase === 'player' ? '<button class="btn-items" onclick="showUnitItemsModal()">🎒 Предметы</button>' : ''}`;
  } else if (selected && selected.kind === 'zombie') {
    // Информация о зомби
    const z = selected;
    const zombieType = ZOMBIE_TYPES[z.type] || ZOMBIE_TYPES.zombie;
    
    ui.innerHTML = `
      <div class="name text-zombie">🧟 Зомби</div>
      <div class="stat-row">
        <span class="stat-label">HP</span>
        <span class="stat-val">${z.hp}/${z.maxHp}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Урон</span>
        <span class="stat-val">${z.atkDmg}</span>
      </div>
      ${zombieType.description ? `<div class="stat-row" style="font-size: 9px; color: #4a7a44;">${zombieType.description}</div>` : ''}
      ${zombieType.atkProperties ? `<div class="stat-row" style="font-size: 9px; color: var(--purple);">${zombieType.atkProperties}</div>` : ''}
      <div class="unit-status text-muted">Враг</div>`;
  } else {
    ui.innerHTML = '<span class="text-muted">Кликни своего юнита</span>';
  }
}


// ── ОВЕРЛЕЙ В КОНЦЕ БОЯ ───────────────────────────────────

function showEndOverlay(win) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const zAlive = aliveZombies().length;
  const playerLosses = state.getUnits().filter(u => !u.alive && u.kind === 'survivor').length;
  const quote = win
    ? '«They mostly come at night... mostly.» — Aliens'
    : '«It\'s not the end of the world... oh wait, it is.»';

  const stats = state.getStats();
  const turnNum = state.getTurnNum();
  const turnsSurvived = state.getTurnsSurvived();
  
  let levelReward = 0;
  if (win && gameData.currentLevel) {
    levelReward = completeLevel(gameData.currentLevel, stats);
    
    // Обновляем статистику
    gameData.squad.forEach(unit => {
      updateUnitStats(unit.id, stats);
    });
    
    // === Сохраняем HP и charges юнитов после боя ===
    // Используем for чтобы можно было удалять элементы во время итерации
    for (let i = gameData.squad.length - 1; i >= 0; i--) {
      const squadUnit = gameData.squad[i];
      const battleUnit = state.getUnits().find(u => u.id === squadUnit.id);
      
      if (!battleUnit) continue;
      
      if (battleUnit.alive) {
        // Живой юнит - сохраняем HP и charges
        squadUnit.hp = battleUnit.hp;
        if (battleUnit.equipment?.charges) {
          squadUnit.equipment.charges = { ...battleUnit.equipment.charges };
        }
      } else {
        // Мёртвый юнит - удаляем из отряда
        gameData.squad.splice(i, 1);
      }
    }
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

// ── МОДАЛКА ПРЕДМЕТОВ ЮНИТА ─────────────────────────────────────────

function showUnitItemsModal() {
  const selected = state.getSelected();
  if (!selected || selected.kind !== 'survivor') return;
  
  const u = selected;
  const inventory = u.inventory || {};
  
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'unit-items-modal';
  
  // Формируем список предметов - универсальный цикл по всем расходникам
  let itemsContent = '';
  
  // Получаем все расходники из ITEMS
  const consumables = Object.entries(ITEMS).filter(([id, item]) => item.type === 'consumable');
  
  consumables.forEach(([itemId, item]) => {
    const count = inventory[itemId] || 0;
    if (count <= 0) return;
    
    // Универсальная ля использования предогика условимета
    let canUse = true;
    let useReason = 'Использовать';
    
    const condition = item.useCondition;
    if (condition === 'hasPoison') {
      canUse = hasEffect(u, 'poison');
      useReason = canUse ? 'Использовать' : 'Нет яда';
    } else if (condition === 'notAttacked') {
      canUse = !u.attacked;
      useReason = canUse ? 'Бросить' : 'Уже атаковал';
    }
    
    // Стиль для разных типов предметов - по useAction
    const isHealing = item.useAction === 'useItem';
    const itemColor = isHealing ? 'rgba(57,255,20,0.1)' : 'rgba(255,140,0,0.1)';
    const btnColor = isHealing ? '' : 'background: orange;';
    const btnDisabled = canUse ? '' : 'opacity: 0.5;';
    
    itemsContent += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: ${itemColor}; border-radius: 4px; margin-bottom: 8px;">
        <div>
          <div style="font-weight: bold;">${item.emoji} ${item.name} (${count})</div>
          <div style="font-size: 10px; color: #888;">${item.desc || ''}</div>
        </div>
        <button class="btn-items" style="margin: 0; width: auto; padding: 4px 12px; ${btnDisabled} ${btnColor}" 
          ${!canUse ? 'disabled' : ''} 
          onclick="useItemFromModal('${itemId}')">
          ${useReason}
        </button>
      </div>
    `;
  });
  
  if (!itemsContent) {
    itemsContent = '<div style="color: #888; text-align: center;">Нет доступных предметов</div>';
  }
  
  overlay.innerHTML = `
    <div class="overlay-box" style="min-width: 250px;">
      <h2 style="margin: 0 0 15px 0; color: var(--green);">🎒 Предметы</h2>
      <div style="margin-bottom: 15px;">
        ${itemsContent}
      </div>
      <button class="recruit-cancel" onclick="this.closest('.overlay').remove()">ЗАКРЫТЬ</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

// Функция для использования предмета из модалки
function useItemFromModal(itemId) {
  const selected = state.getSelected();
  if (!selected || selected.kind !== 'survivor') return;
  
  const item = ITEMS[itemId];
  
  // Универсальная обработка по useAction
  if (item.useAction === 'throw') {
    const modal = document.getElementById('unit-items-modal');
    if (modal) modal.remove();
    activateGrenade(selected);
    return;
  }
  
  const result = useItem(selected, itemId);
  
  if (result.success) {
    // Закрыть модалку и обновить UI
    const modal = document.getElementById('unit-items-modal');
    if (modal) modal.remove();
    render();
    updateSidebar();
  } else {
    alert(result.reason || 'Не удалось использовать предмет');
  }
}
