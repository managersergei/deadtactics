// ════════════════════════════════════════════════════════
// UI — интерфейс: лог, сайдбар, обёртки рендера
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

// ── ЭКРАН ОТРЯДА ─────────────────────────────────────────

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

    card.onclick = () => {
      selectedSquadUnitId = unit.id;
      renderUnitDetailScreen(unit);
      showScreen(SCREENS.UNIT_DETAIL);
    };

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

// ── ЭКРАН ДЕТАЛЕЙ ЮНИТА ──────────────────────────────────

function renderUnitDetailScreen(unit) {
  const nameEl = document.getElementById('unit-detail-name');
  const contentEl = document.getElementById('unit-detail-content');

  if (nameEl) nameEl.textContent = unit.name;

  if (contentEl) {
    const weaponId = getEffectiveStat(unit, 'weapon');
    const weapon = ITEMS[weaponId];
    
    const armorId = unit.equipment?.armor;
    const armor = armorId ? ITEMS[armorId] : null;
    
    const bootsId = unit.equipment?.boots;
    const boots = bootsId ? ITEMS[bootsId] : null;
    
    const effectiveMaxHp = getEffectiveStat(unit, 'maxHp');
    const effectiveMove = getEffectiveStat(unit, 'moveRange');
    
    const weaponText = weapon ? `${weapon.emoji} ${weapon.name}` : 'нет';
    const armorText = armor ? `${armor.name} (+${armor.extraHp} HP)` : 'нет (защита 0)';
    const bootsText = boots ? `${boots.name} (+${boots.moveBonus})` : 'базовые (+0)';
    
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

// ── ЭКРАН ИНТРО ──────────────────────────────────────────

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
    textEl.textContent = LORE_MESSAGES[currentLoreIndex];
    inputContainer.style.display = 'none';
    nextBtn.style.display = 'block';
    nextBtn.textContent = currentLoreIndex === LORE_MESSAGES.length - 1 ? 'ДАЛЕЕ →' : 'ДАЛЕЕ →';
  } else {
    textEl.textContent = '';
    renderIntroKnife();
    inputContainer.style.display = 'flex';
    nextBtn.style.display = 'none';
  }
}

function showNextIntroText() {
  currentLoreIndex++;
  showLoreText();
}

// ── МАГАЗИН ────────────────────────────────────────────

let shopSelectedUnitId = null;

function renderShopScreen() {
  const goldEl = document.getElementById('shop-gold');
  if (goldEl) goldEl.textContent = '💰 ' + (gameData.player.gold || 0);
  
  updateShopUnitSelector();
  renderShopSection('shop-weapons', 'weapon');
  renderShopSection('shop-armors', 'armor');
  renderShopSection('shop-boots', 'boots');
}

function updateShopUnitSelector() {
  const select = document.getElementById('shop-unit-select');
  if (!select) return;
  
  const currentValue = select.value;
  
  select.innerHTML = '<option value="">-- Выберите юнита --</option>';
  
  gameData.squad.forEach(unit => {
    const option = document.createElement('option');
    option.value = unit.id;
    option.textContent = `${unit.emoji} ${unit.name}`;
    select.appendChild(option);
  });
  
  if (currentValue && gameData.squad.some(u => u.id === parseInt(currentValue))) {
    select.value = currentValue;
    shopSelectedUnitId = parseInt(currentValue);
  }
}

function renderShopSection(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const items = Object.entries(ITEMS).filter(([id, item]) => item.type === type);
  
  container.innerHTML = items.map(([id, item]) => {
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
    const minDmg = item.baseDmg;
    const maxDmg = item.critDmg || item.baseDmg + 1;
    stats.push(`⚔️ ${minDmg}-${maxDmg}`);
  }
  if (item.critChance) stats.push(`🎯 ${(item.critChance*100).toFixed(0)}%`);
  if (item.extraHp) stats.push(`❤️ +${item.extraHp}`);
  if (item.moveBonus) stats.push(`👟 +${item.moveBonus}`);
  
  if (item.desc) {
    stats.push(`<br><span style="color:#5a7a5a;font-size:10px">${item.desc}</span>`);
  }
  
  return stats.join(' ');
}

function shopSelectUnit(unitId) {
  shopSelectedUnitId = unitId ? parseInt(unitId) : null;
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
    renderShopScreen();
    if (currentScreen === 'screen-squad') {
      renderSquadScreen();
    }
  } else {
    alert(result.reason || 'Не удалось купить предмет');
  }
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
