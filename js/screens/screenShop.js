// ════════════════════════════════════════════════════════
// SCREEN SHOP — рендер экрана магазина
// ════════════════════════════════════════════════════════

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
  
  // Используем addEventListener вместо onchange
  select.addEventListener('change', (e) => {
    shopSelectUnit(e.target.value);
  });
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
      <div class="shop-item ${isOwned ? 'owned' : ''}">
        <div class="shop-item-name">${item.emoji} ${item.name}</div>
        <div class="shop-item-price">💰 ${item.price}</div>
        <div class="shop-item-stats">${getItemStatsText(item)}</div>
      </div>
    `;
  }).join('');
  
  // Добавляем event listeners после создания элементов
  container.querySelectorAll('.shop-item').forEach((itemEl, idx) => {
    const itemId = items[idx][0];
    itemEl.addEventListener('click', () => {
      buyItemFromShop(itemId);
    });
  });
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
