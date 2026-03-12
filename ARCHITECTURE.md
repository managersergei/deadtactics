# DEAD TACTICS — Architecture & Anti-Patterns

> Архитектурные решения и типичные ошибки, которых следует избегать.

---

## 1.ТИПЫ ЮНИТОВ

### 1.1 Константы типов

**В файле: `src/js/config/game-config.js`**

```javascript
const UNIT_TYPES = {
  SURVIVOR: 'survivor',
  ZOMBIE: 'zombie',
};
```

**Правило:** Всегда используй константы, НЕ хардкодь строки 'survivor', 'zombie'.

**Где использовать:**
- `unit.kind === 'survivor'` → `unit.kind === UNIT_TYPES.SURVIVOR`
- `kind === 'zombie'` → `kind === UNIT_TYPES.ZOMBIE`

---

## 2. АНИМАЦИЯ

### 2.1 Состояния анимации

**В файле: `src/js/config/game-config.js`**

```javascript
const ANIM_STATES = {
  IDLE:     { folder: 'idle',      frames: 4 },
  MOVE:     { folder: 'move',      frames: 4 },
  ATTACK:   { folder: 'attack',    frames: 3 },
  DAMAGED:  { folder: 'damaged',   frames: 2 },
  CR_DAMAGED:{ folder: 'cr_damaged',frames: 3 },
  DIE:      { folder: 'die',       frames: 4 },
  KILLED:   { folder: 'killed',     frames: 1 },
};
```

### 2.2 Структура папок спрайтов

```
zombie/
├── idle_left/      idle_1.png, idle_2.png, idle_3.png, idle_4.png
├── idle_right/     idle_1.png, idle_2.png, idle_3.png, idle_4.png
├── move_left/     move_1.png, move_2.png, move_3.png, move_4.png
├── move_right/    move_1.png, move_2.png, move_3.png, move_4.png
├── attack_left/   attack_1.png, attack_2.png, attack_3.png
├── attack_right/  attack_1.png, attack_2.png, attack_3.png
...
```

### 2.3 Формула кадра

**ПРАВИЛЬНО:**
```javascript
const frame = ((globalFrame - 1) % maxFrames) + 1;
// frame=1, maxFrames=4 → 1
// frame=2, maxFrames=4 → 2
// frame=3, maxFrames=4 → 3
// frame=4, maxFrames=4 → 4
```

**НЕПРАВИЛЬНО (не используй):**
```javascript
// ПРОПУСКАЕТ последний кадр!
const frame = (globalFrame % maxFrames) || 1;
```

### 2.4 Как работает анимация в battle.js

```javascript
// В startAnimation()
animationFrame = (animationFrame || 0) + 1;
const maxFrames = parseInt(img.dataset.maxFrames) || 4;
const localFrame = ((animationFrame - 1) % maxFrames) + 1;

// img.dataset содержит:
// - animated: 'src/assets/units/zombie/idle_left/'
// - animState: 'idle'
// - maxFrames: '4'

// Итоговый путь: animated + animState + '_' + localFrame + '.png'
// Пример: 'src/assets/units/zombie/idle_left/' + 'idle' + '_' + '1' + '.png'
// = 'src/assets/units/zombie/idle_left/idle_1.png'
```

### 2.5 Смена состояния анимации

**При пошаговом движении (ai.js → zombieMove):**

ОШИБКА: Менять только animState
```javascript
// ❌ НЕПРАВИЛЬНО — 404 на картинку
moveImg.dataset.animState = 'move';
// Будет искать idle_left/move_1.png — такого файла нет
```

ПРАВИЛЬНО: Менять И animated (папку), И animState
```javascript
// ✅ ПРАВИЛЬНО
const direction = getDirection(z); // 'left' или 'right'
moveImg.dataset.animated = `src/assets/units/zombie/move_${direction}/`;
moveImg.dataset.animState = 'move';
moveImg.dataset.maxFrames = '4';
// Будет искать move_left/move_1.png — правильный путь
```

После завершения движения — вернуть обратно:
```javascript
moveImg.dataset.animated = `src/assets/units/zombie/idle_${direction}/`;
moveImg.dataset.animState = 'idle';
```

---

## 3. СИНХРОНИЗАЦИЯ RENDER И AI

### 3.1 Проблема

При пошаговом движении зомби каждый вызов `render()` сбрасывает `animationFrame` в 1.

### 3.2 Решение: animationPaused

**В battle.js:**
```javascript
let animationPaused = false;

function render() {
  if (!animationPaused) {
    stopAnimation();
    // ... рисуем ...
    startAnimation();
  }
}
```

**В ai.js, при движении:**
```javascript
async function zombieMove(z, target) {
  animationPaused = true; // Остановить циклическую анимацию
  
  for (const pos of path) {
    z.x = pos.x;
    z.y = pos.y;
    _moveZombieImage(z, oldUnit); // Перемещаем без полного render()
    await sleep(ZOMBIE_STEP_DELAY);
  }
  
  animationPaused = false; // Возобновить анимацию
  render(); // Полный рендер
}
```

---

## 4. CSS: TRANSFORM

### 4.1 Проблема

`.unit:hover { transform: scale(1.06); }` перезаписывает `translateX(-50%)`, юниты убегают в угол.

### 4.2 Решение

Всегда включай `translateX(-50%)`:
```css
.unit {
  position: absolute;
  transform: translateX(-50%);
}

.unit:hover {
  transform: translateX(-50%) scale(1.06);
}

.unit.selected {
  transform: translateX(-50%) scale(1.1);
}
```

---

## 5. ТЕСТЫ

### 5.1 Запуск

```bash
node src/js/tests/helpers.test.js
```

### 5.2 Что тестируется

- manhattan() — расстояние между клетками
- unitAt() — юнит на клетке
- reachable() — клетки куда может переместиться
- calcDamage() — расчёт урона оружия
- alivePlayers() / aliveZombies() — живые юниты
- getDirection() — направление взгляда

### 5.3 Как добавить тест

1. Создай моки ДО подключения модулей:
```javascript
global.window = global.window || {};
global.units = [];
global.getUnits = () => global.units;
global.ITEMS = require('../config/game-config.js').ITEMS;
global.COLS = 10;
global.ROWS = 8;
```

2. Добавь тест:
```javascript
// test
const result = helpers.myFunction(arg);
assert.strictEqual(result, expected);
```

---

## 6. ИНСТРУМЕНТЫ РЕДАКТИРОВАНИЯ

### 6.1 replace_in_file vs write_to_file

**Проблема:** replace_in_file может показывать "успех", но не применять изменения.

**Решение:** Всегда используй **write_to_file**.

### 6.2 Проверка после edit

После ЛЮБОГО редактирования:
```bash
git diff src/js/имяфайла.js
```

Если изменений нет — используй write_to_file.

---

## 7. КАК ИЗБЕЖАТЬ ОШИБОК

### 7.1 Чеклист перед коммитом

- [ ] Тесты: `node src/js/tests/helpers.test.js`
- [ ] git diff — проверить что изменения применились
- [ ] Браузер — проверить без ошибок

### 7.2 Типичные грабли

| Грабля | Симптом | Решение |
|--------|---------|---------|
| replace_in_file не меняет файл | git diff пустой | Используй write_to_file |
| Пропускается кадр анимации | Последний кадр не показывается | `((frame-1)%maxFrames)+1` |
| 404 на картинку при move | idle_left/move_1.png | Меняй И base, И animState |
| CSS transform перезаписывается | Юниты убегают при hover | Включай translateX(-50%) |
| render() сбрасывает анимацию | Анимация дёргается | Используй animationPaused |
| 'player' vs 'survivor' | Не работает фильтрация | Используй константы |

---

## 8. ФАЙЛОВАЯ СТРУКТУРА

```
src/js/
├── config/
│   ├── game-config.js    ← константы, баланс, module.exports
│   └── ui-constants.js   ← UI константы
├── core/
│   ├── state.js          ← стейт игры
│   └── helpers.js        ← утилиты (export для тестов)
├── render/
│   ├── render.js         ← сетка, cell()
│   └── battle.js         ← рендер боя, анимация
├── ai.js                 ← AI зомби
├── game.js               ← игровая логика
├── units.js              ← фабрики юнитов
├── ui.js                 ← UI
├── audio.js              ← звуки
├── data.js               ← данные игры
├── main.js               ← точка входа
└── tests/
    └── helpers.test.js   ← тесты
```

---

## 9. ИМЕНОВАНИЕ

### 9.1 Файлы

- snake_case: `game_config.js` (НЕТ)
- camelCase: `gameConfig.js` (ДА)

### 9.2 Константы

- UPPER_CASE: `const COLS = 10;`
- Конфиги объектами: `const CONFIG = { COLS: 10, ROWS: 8 };`

### 9.3 Функции

- camelCase: `function getDirection()`
- Глагол: `function calculateDamage()`, `function findTarget()`

---

## 10. ЧТО ДЕЛАТЬ ПРИ БАГАХ

### 10.1 Не паникуй

1. Запусти тесты: `node src/js/tests/helpers.test.js`
2. Проверь git diff — какие файлы изменились
3. Открой браузер с консолью (F12)

### 10.2 Частые причины

- **404 на картинку**: Проверь путь в img.dataset.animated + animState
- **Анимация не работает**: Проверь animationPaused
- **CSS глючит**: Проверь transform — есть translateX(-50%)?
- **Функция не найдена**: Проверь imports/exports

### 10.3 Откат

Если всё сломалось:
```bash
git checkout -- .
git status
```
