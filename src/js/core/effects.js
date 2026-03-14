// ════════════════════════════════════════════════════════
// ЭФФЕКТЫ — система статусных эффектов для юнитов
// Добавляй новые эффекты здесь, они будут работать везде
// ════════════════════════════════════════════════════════

// Доступные эффекты и их параметры
const EFFECTS = {
  poison: {
    id: 'poison',
    icon: '☠',
    name: 'Отравление',
    description: 'Получает урон в начале каждого хода',
    damagePerTurn: 1,
    onTurnStart: 'applyDamage',  // функция вызывается в начале хода игрока
    color: '#8b00ff',           // фиолетовый для CSS
  },
  // Примеры для будущих эффектов:
  // burning: {
  //   id: 'burning',
  //   icon: '🔥',
  //   name: 'Горение',
  //   description: 'Получает урон каждый ход',
  //   damagePerTurn: 2,
  //   onTurnStart: 'applyDamage',
  //   color: '#ff4400',
  // },
  // frozen: {
  //   id: 'frozen',
  //   icon: '❄',
  //   name: 'Заморозка',
  //   description: 'Пропускает ход',
  //   onTurnStart: 'skipTurn',
  //   color: '#00bfff',
  // },
};

// Функции обработки эффектов
const EFFECT_HANDLERS = {
  // Применение урона в начале хода
  applyDamage: (unit, effect) => {
    const effectDef = EFFECTS[effect.id];
    if (!effectDef) return 0;
    
    const damage = effectDef.damagePerTurn || 1;
    unit.hp -= damage;
    
    // Записываем урон
    if (typeof state !== 'undefined' && state.recordPoisonDamage) {
      state.recordPoisonDamage(damage);
    }
    
    return damage;
  },
  
  // Пропуск хода (для эффектов вроде заморозки)
  skipTurn: (unit, effect) => {
    unit.skippedTurn = true;
  },
};

// Добавить эффект к юниту
function addEffect(unit, effectId, duration = null) {
  if (!EFFECTS[effectId]) {
    console.warn(`Эффект ${effectId} не найден в конфиге`);
    return false;
  }
  
  // Инициализируем массив эффектов если его нет
  if (!unit.effects) {
    unit.effects = {};
  }
  
  // Проверяем существующий эффект
  if (unit.effects[effectId]) {
    // Увеличиваем длительность или stacks
    if (duration) {
      unit.effects[effectId].duration = Math.max(unit.effects[effectId].duration, duration);
    }
    unit.effects[effectId].stacks = (unit.effects[effectId].stacks || 1) + 1;
  } else {
    // Новый эффект
    unit.effects[effectId] = {
      id: effectId,
      duration: duration, // null = бесконечно
      stacks: 1,
      applied: true,
    };
  }
  
  return true;
}

// Удалить эффект с юнита
function removeEffect(unit, effectId) {
  if (!unit.effects || !unit.effects[effectId]) return false;
  
  delete unit.effects[effectId];
  return true;
}

// Проверить есть ли эффект
function hasEffect(unit, effectId) {
  return unit.effects && unit.effects[effectId] !== undefined;
}

// Обработать все эффекты в начале хода
function processEffectsOnTurnStart(unit) {
  if (!unit.effects || !unit.alive) return;
  
  for (const effectId in unit.effects) {
    const effect = unit.effects[effectId];
    const effectDef = EFFECTS[effectId];
    
    if (!effectDef || !effectDef.onTurnStart) continue;
    
    const handler = EFFECT_HANDLERS[effectDef.onTurnStart];
    if (handler) {
      handler(unit, effect);
    }
    
    // Уменьшаем длительность
    if (effect.duration !== null) {
      effect.duration--;
      if (effect.duration <= 0) {
        removeEffect(unit, effectId);
      }
    }
  }
}

// Получить все иконки эффектов для отображения
function getEffectIcons(unit) {
  if (!unit.effects) return [];
  
  return Object.keys(unit.effects).map(effectId => {
    const effect = unit.effects[effectId];
    const effectDef = EFFECTS[effectId];
    return {
      id: effectId,
      icon: effectDef?.icon || '?',
      name: effectDef?.name || effectId,
      stacks: effect.stacks || 1,
      duration: effect.duration,
    };
  });
}

// Глобальный экспорт
if (typeof window !== 'undefined') {
  window.EFFECTS = EFFECTS;
  window.EFFECT_HANDLERS = EFFECT_HANDLERS;
  window.addEffect = addEffect;
  window.removeEffect = removeEffect;
  window.hasEffect = hasEffect;
  window.processEffectsOnTurnStart = processEffectsOnTurnStart;
  window.getEffectIcons = getEffectIcons;
}
