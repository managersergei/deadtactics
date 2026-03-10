// ════════════════════════════════════════════════════════
// SCREEN DETAIL — рендер экрана деталей юнита
// ════════════════════════════════════════════════════════

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
