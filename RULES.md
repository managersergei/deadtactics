# ☣ DEAD TACTICS — RULES FOR AI AGENT

> Этот файл читает AI-агент (Cline/Gemini) перед каждым изменением.
> Подключи его в системный промпт Cline: Settings → Custom Instructions → вставь содержимое.

---

## 1. БЫСТРЫЙ СТАРТ (ОБЯЗАТЕЛЬНО)

- [ ] Прочитай RULES.md и ARCHITECTURE.md перед началом работы
- [ ] Запусти тесты: `node src/js/tests/helpers.test.js`
- [ ] После редактирования — `git diff` для проверки

---

## 2. СТРУКТУРА ПРОЕКТА

```
dead-tactics/
├── index.html              ← только HTML-разметка
├── RULES.md               ← этот файл
├── ARCHITECTURE.md        ← архитектура и антипаттерны
├── package.json
├── src/
│   ├── css/
│   │   ├── styles.css      ← главный (импорты + :root)
│   │   ├── base.css       ← сброс, body, header
│   │   ├── game.css       ← грид, клетки, юниты
│   │   ├── ui.css         ← сайдбар, кнопки, лог
│   │   ├── components.css  ← карточки, карта, анимации
│   │   └── screens.css    ← все экраны
│   ├── js/
│   │   ├── config/
│   │   │   ├── game-config.js   ← константы игры, баланс, UNIT_TYPES, ANIM_STATES
│   │   │   └── ui-constants.js ← UI константы
│   │   ├── core/
│   │   │   ├── state.js        ← глобальный стейт
│   │   │   └── helpers.js      ← утилиты (export для тестов)
│   │   ├── render/
│   │   │   ├── render.js       ← сетка, cell()
│   │   │   └── battle.js       ← рендер боя, анимация
│   │   ├── screens/
│   │   │   ├── screens.js
│   │   │   ├── screenMap.js
│   │   │   ├── screenSquad.js
│   │   │   ├── screenShop.js
│   │   │   ├── screenIntro.js
│   │   │   ├── screenLevel.js
│   │   │   └── screenDetail.js
│   │   ├── tests/
│   │   │   └── helpers.test.js ← тесты
│   │   ├── ai.js              ← AI зомби
│   │   ├── audio.js           ← звуки
│   │   ├── data.js            ← данные игры (статистика, прогресс)
│   │   ├── game.js           ← игровая логика
│   │   ├── main.js           ← точка входа
│   │   ├── ui.js            ← UI (без логики)
│   │   └── units.js         ← фабрики юнитов
│   ├── assets/
│   │   ├── battlefield/       ← фон поля боя
│   │   ├── items/             ← иконки предметов
│   │   ├── sounds/            ← звуки
│   │   └── units/             ← спрайты юнитов
│   │       ├── survivor/      ← выжившие (по типу оружия)
│   │       │   └── pistol/, rifle/, shotgun/, uzi/, rocket/
│   │       └── zombie/        ← зомби (по состоянию)
│   │           └── idle_left/, idle_right/, move_left/, ...
│   └── sounds/
└── src/js/tests/
```

---

## 3. ЗАПРЕЩЕНО

- ❌ Не удаляй существующие функции — только добавляй или точечно правь
- ❌ Не переписывай файл целиком без явного запроса
- ❌ Не меняй сигнатуры функций без обновления всех вызовов
- ❌ Не добавляй inline-стили в JS — только классы через CSS
- ❌ Не вставляй игровую логику в render.js или ui.js
- ❌ Не дублируй константы — всё в config/game-config.js
- ❌ Не используй localStorage, sessionStorage — всё в памяти
- ❌ Не добавляй зависимости без явного запроса

---

## 4. ОБЯЗАТЕЛЬНО

- ✅ Перед изменением прочитай затронутый файл целиком
- ✅ Прочитай ARCHITECTURE.md для понимания архитектуры
- ✅ При добавлении UI‑элемента используй классы, не inline-стили
- ✅ Правь только то, что явно указано в задаче
- ✅ После изменения проверь — не сломал ли вызовы в других файлах
- ✅ Новый тип юнита → добавь фабрику в units.js + параметры в config/game-config.js
- ✅ Новый экран/оверлей → только в ui.js
- ✅ CSS-переменные (цвета, размеры) только в :root в styles.css
- ✅ **После ЛЮБОГО редактирования — git diff**
- ✅ **Перед коммитом — запусти тесты**

---

## 5. КОНСТАНТЫ

### 5.1 Типы юнитов

**В файле: `src/js/config/game-config.js`**

```javascript
const UNIT_TYPES = {
  SURVIVOR: 'survivor',
  ZOMBIE: 'zombie',
};
```

**Правило:** Всегда используй константы:
- `unit.kind === UNIT_TYPES.SURVIVOR` вместо `unit.kind === 'survivor'`
- `kind === UNIT_TYPES.ZOMBIE` вместо `kind === 'zombie'`

### 5.2 Состояния анимации

```javascript
const ANIM_STATES = {
  IDLE:      { folder: 'idle',      frames: 4 },
  MOVE:      { folder: 'move',      frames: 4 },
  ATTACK:    { folder: 'attack',    frames: 3 },
  DAMAGED:   { folder: 'damaged',   frames: 2 },
  CR_DAMAGED:{ folder: 'cr_damaged',frames: 3 },
  DIE:       { folder: 'die',       frames: 4 },
  KILLED:    { folder: 'killed',    frames: 1 },
};
```

---

## 6. АНИМАЦИЯ

### 6.1 Структура папок и файлов

```
zombie/
├── idle_left/      idle_1.png ... idle_4.png
├── idle_right/
├── move_left/      move_1.png ... move_4.png
├── move_right/
├── attack_left/    attack_1.png ... attack_3.png
├── attack_right/
...
```

**Формат:** `{state}_{direction}/{state}_{frame}.png`

### 6.2 Формула кадра

**ПРАВИЛЬНО:**
```javascript
const localFrame = ((globalFrame - 1) % maxFrames) + 1;
```

**НЕПРАВИЛЬНО (НЕ используй):**
```javascript
// Пропускает последний кадр!
const localFrame = (globalFrame % maxFrames) || 1;
```

### 6.3 Смена состояния

При смене анимации меняй ОБА:
```javascript
img.dataset.animated = `src/assets/units/zombie/move_${direction}/`;
img.dataset.animState = 'move';
img.dataset.maxFrames = '4';
```

Подробнее — в ARCHITECTURE.md раздел 2.

---

## 7. СТЕЙТ ИГРЫ (state.js)

```
units[]       — массив всех юнитов
selected      — текущий выбранный юнит
phase         — 'placement' | 'player' | 'zombie' | 'over'
placedCount   — сколько юнитов расставлено
turnNum       — номер текущего хода
turnsSurvived — сколько ходов выжило
highlights    — { move: Set, attack: Set }
```

---

## 8. ТЕСТЫ

### 8.1 Запуск

```bash
node src/js/tests/helpers.test.js
```

### 8.2 Правила

- ✅ Тесты ДОЛЖНЫ проходить перед коммитом
- ✅ Если тесты падают — НЕ ТРОГАЙ код, разберись сначала

### 8.3 Как добавить тест

```javascript
// src/js/tests/helpers.test.js

// МОКИ — создай ДО подключения модулей
global.window = global.window || {};
global.units = [];
global.getUnits = () => global.units;
global.ITEMS = require('../config/game-config.js').ITEMS;
global.COLS = 10;
global.ROWS = 8;

// Подключаем
const helpers = require('../core/helpers.js');

// Тест
const result = helpers.myFunction(arg);
assert.strictEqual(result, expected);
```

---

## 9. GIT-ДИСЦИПЛИНА

**Один файл — один коммит:**
```bash
git add src/js/ai.js && git commit -m "ai: исправить анимацию движения"
git add src/js/render/battle.js && git commit -m "render: добавить состояния анимации"
```

---

## 10. TROUBLESHOOTING

### 10.1 replace_in_file показывает успех но не меняет файл

**Симптомы:** Ты делаешь replace_in_file, получаешь "успех", но git diff пустой.

**Решение:** Всегда используй **write_to_file** для редактирования файлов.

### 10.2 Формула кадра даёт неправильный номер

**Симптомы:** Анимация не показывает последний кадр, или 404 на картинку.

**Правильно:**
```javascript
const localFrame = ((globalFrame - 1) % maxFrames) + 1;
```

### 10.3 При анимации 404 на картинку

**Симптомы:** GET 404 на `idle_left/move_1.png`

**Причина:** Меняется только `animState`, но не `base` (путь к папке).

**Решение:** При смене состояния меняй ОБА:
```javascript
img.dataset.animated = `src/assets/units/zombie/move_${direction}/`;
img.dataset.animState = 'move';
```

### 10.4 CSS transform конфликтует

**Симптомы:** При hover юниты убегают в угол.

**Причина:** `.unit:hover { transform: scale(1.06) }` перезаписывает translateX(-50%).

**Решение:** Все transform должны включать translateX(-50%):
```css
.unit:hover { transform: translateX(-50%) scale(1.06); }
```

### 10.5 Анимация сбрасывается при render()

**Симптомы:** Во время пошагового движения анимация сбрасывается на первый кадр.

**Причина:** Каждый render() вызывает stopAnimation() → startAnimation().

**Решение:** Используй флаг `animationPaused` — подробнее в ARCHITECTURE.md раздел 3.

---

## 11. ЧЕКЛИСТ ПЕРЕД КОММИТОМ

- [ ] Тесты проходят: `node src/js/tests/helpers.test.js`
- [ ] git diff показывает ожидаемые изменения
- [ ] Браузер без ошибок в консоли
- [ ] Один файл — один коммит
- [ ] Прочитал ARCHITECTURE.md для понимания контекста

---

## 12. ПОРЯДОК РАБОТЫ

### 12.1 Всегда

1. Прочитай RULES.md и ARCHITECTURE.md
2. Запусти тесты
3. Сделай изменение (write_to_file)
4. git diff — проверь что применилось
5. Тесты — проверь что не сломалось
6. Коммит

### 12.2 Минимальные изменения

Одно изменение = один коммит. Не делай несколько фич в одном коммите.

---

## 13. ЭКСПОРТ ДЛЯ NODE.JS

### 13.1 Правило

Любой файл который используется в тестах ДОЛЖЕН иметь `module.exports`:

```javascript
// В конце файла:
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    функция1,
    функция2,
    константа1,
  };
}
```

### 13.2 Пример: game-config.js

```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLS, ROWS, ITEMS, WEAPONS,
    UNIT_TYPES, ANIM_STATES,
    // ... все константы
  };
}
```

### 13.3 Пример: helpers.js

```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    manhattan,
    unitAt,
    reachable,
    aliveZombies,
    alivePlayers,
    calcDamage,
    getDirection,
  };
}
```
