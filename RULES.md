# ☣ DEAD TACTICS — RULES FOR AI AGENT

> Этот файл читает AI-агент (Cline/Gemini) перед каждым изменением.
> Подключи его в системный промпт Cline: Settings → Custom Instructions → вставь содержимое.

---

## 1. БЫСТРЫЙ СТАРТ (ОБЯЗАТЕЛЬНО)

- [ ] Прочитай RULES.md перед началом работы
- [ ] Запусти тесты: `node js/tests/helpers.test.js`
- [ ] После редактирования — `git diff` для проверки

---

## 2. СТРУКТУРА ПРОЕКТА

```
dead-tactics/
├── index.html        ← только HTML-разметка
├── RULES.md          ← этот файл
├── css/
│   ├── styles.css      ← главный (импорты + :root)
│   ├── base.css       ← сброс, body, header
│   ├── game.css       ← грид, клетки, юниты
│   ├── ui.css         ← сайдбар, кнопки, лог
│   ├── components.css  ← карточки, карта, анимации
│   └── screens.css    ← все экраны
└── js/
    ├── config/game-config.js ← константы игры
    ├── config/ui-constants.js ← константы UI
    ├── core/state.js       ← глобальный стейт
    ├── core/helpers.js     ← утилиты
    ├── units.js           ← фабрики юнитов
    ├── ui.js             ← UI без логики
    ├── ai.js             ← AI зомби
    ├── audio.js          ← звуки
    ├── game.js           ← игровая логика
    ├── data.js           ← данные игры
    ├── main.js           ← точка входа
    ├── screens/          ← роутинг экранов
    │   ├── screens.js
    │   ├── screenMap.js
    │   ├── screenSquad.js
    │   ├── screenShop.js
    │   ├── screenIntro.js
    │   ├── screenLevel.js
    │   └── screenDetail.js
    └── render/            ← рендер боя
        ├── render.js
        └── battle.js
```

---

## 3. ЗАПРЕЩЕНО

- ❌ Не удаляй существующие функции — только добавляй или точечно правь
- ❌ Не переписывай файл целиком без явного запроса
- ❌ Не меняй сигнатуры функций без обновления всех вызовов
- ❌ Не добавляй inline-стили в JS — только классы через CSS
- ❌ Не вставляй игровую логику в render.js или ui.js
- ❌ Не дублируй константы — всё в config.js
- ❌ Не используй localStorage, sessionStorage — всё в памяти
- ❌ Не добавляй зависимости без явного запроса

---

## 4. ОБЯЗАТЕЛЬНО

- ✅ Перед изменением прочитай затронутый файл целиком
- ✅ При добавлении UI‑элемента используй классы, не inline-стили
- ✅ Правь только то, что явно указано в задаче
- ✅ После изменения проверь — не сломал ли вызовы в других файлах
- ✅ Новый тип юнита → добавь фабрику в units.js + параметры в config.js
- ✅ Новый экран/оверлей → только в ui.js
- ✅ CSS-переменные (цвета, размеры) только в :root в styles.css
- ✅ **После ЛЮБОГО редактирования — git diff**
- ✅ **Перед коммитом — запусти тесты**

---

## 5. АНИМАЦИЯ ЗОМБИ

### 5.1 Состояния анимации

```javascript
const ZOMBIE_ANIM_STATES = {
  idle:      { folder: 'idle',      frames: 4 },
  move:      { folder: 'move',      frames: 4 },
  attack:    { folder: 'attack',    frames: 3 },
  damaged:   { folder: 'damaged',   frames: 2 },
  cr_damaged:{ folder: 'cr_damaged',frames: 3 },
  die:       { folder: 'die',       frames: 4 },
  killed:    { folder: 'killed',    frames: 1 },
};
```

### 5.2 Структура папок и файлов

```
zombie/
├── idle_left/
│   └── idle_1.png, idle_2.png, idle_3.png, idle_4.png
├── idle_right/
├── move_left/
│   └── move_1.png, move_2.png, move_3.png, move_4.png
├── move_right/
...
```

**Формат:** `{state}_{direction}/{state}_{frame}.png`
- Папка: `idle_left/`, `move_right/`
- Файл: `idle_1.png`, `move_3.png`

### 5.3 Правила работы с анимацией

**Формула кадра (ПРАВИЛЬНО):**
```javascript
const localFrame = ((globalFrame - 1) % maxFrames) + 1;
// Пример: frame=1, maxFrames=4 → 1
//        frame=2, maxFrames=4 → 2
//        frame=3, maxFrames=4 → 3
//        frame=4, maxFrames=4 → 4
```

**Формула кадра (НЕПРАВИЛЬНО):**
```javascript
// ❌ ЭТО НЕПРАВИЛЬНО - пропускает последний кадр!
const localFrame = (globalFrame % maxFrames) || 1;
```

**При пошаговом движении:**
- Меняй И `img.dataset.animated` (папка)
- И `img.dataset.animState` (состояние)
- И `img.dataset.maxFrames` (кол-во кадров)

---

## 6. СТЕЙТ ИГРЫ (state.js)

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

## 7. ПАРАМЕТРЫ ЮНИТОВ

| Параметр     | Выживший | Зомби |
|-------------|---------|-------|
| hp / maxHp  | 5       | 3     |
| moveRange   | 4       | 3     |
| atkRange    | —       | 1     |

---

## 8. ИГРОВОЙ ЦИКЛ

```
startGame()
  └── phase = 'placement'
        └── игрок расставляет юнитов
              └── spawnZombies() → phase = 'player'
                    └── handlePlayer() / btn-end-turn
                          └── phase = 'zombie'
                                └── runZombies() → startPlayerTurn()
                                      └── phase = 'player' (или 'over')
```

---

## 9. GIT-ДИСЦИПЛИНА

**Один файл — один коммит:**
```bash
git add src/js/ai.js && git commit -m "ai: исправить анимацию движения"
git add src/js/render/battle.js && git commit -m "render: добавить состояния анимации"
```

---

## 10. ТЕСТЫ

### 10.1 Запуск

```bash
node js/tests/helpers.test.js
```

### 10.2 Правила

- ✅ Тесты ДОЛЖНЫ проходить перед коммитом
- ✅ Если тесты падают — НЕ ТРОГАЙ код, разберись сначала

---

## 11. TROUBLESHOOTING

### 11.1 replace_in_file показывает успех но не меняет файл

**Симптомы:** Ты делаешь replace_in_file, получаешь "успех", но git diff пустой.

**Решение:** Всегда используй **write_to_file** для редактирования файлов.

---

### 11.2 Формула кадра даёт неправильный номер

**Симптомы:** Анимация не показывает последний кадр, или 404 на картинку.

**Правильно:**
```javascript
const localFrame = ((globalFrame - 1) % maxFrames) + 1;
```

**Неправильно:**
```javascript
const localFrame = (globalFrame % maxFrames) || 1;
```

---

### 11.3 При анимации 404 на картинку

**Симптомы:** GET 404 на `idle_left/move_1.png`

**Причина:** Меняется только `animState`, но не `base` (путь к папке).

**Решение:** При смене состояния меняй ОБА:
```javascript
img.dataset.animated = `src/assets/units/zombie/move_${direction}/`;
img.dataset.animState = 'move';
```

---

### 11.4 CSS transform конфликтует

**Симптомы:** При hover юниты убегают в угол.

**Причина:** `.unit:hover { transform: scale(1.06) }` перезаписывает translateX(-50%).

**Решение:** Все transform должны включать translateX(-50%):
```css
.unit:hover { transform: translateX(-50%) scale(1.06); }
```

---

### 11.5 Анимация сбрасывается при render()

**Симптомы:** Во время пошагового движения анимация сбрасывается на первый кадр.

**Причина:** Каждый render() вызывает stopAnimation() → startAnimation().

**Решение:** Используй флаг `animationPaused`:
```javascript
// В battle.js
let animationPaused = false;

function render() {
  if (!animationPaused) {
    stopAnimation();
    // ... рисуем ...
    startAnimation();
  }
}

// В ai.js, перед движением:
animationPaused = true;
// ... перемещение ...
animationPaused = false;
render();
```

---

## 12. ЧЕКЛИСТ ПЕРЕД КОММИТОМ

- [ ] Тесты проходят: `node js/tests/helpers.test.js`
- [ ] git diff показывает ожидаемые изменения
- [ ] Браузер без ошибок в консоли
- [ ] Один файл — один коммит

---

## 13. ПОРЯДОК РАБОТЫ

### 13.1 Всегда

1. Прочитай RULES.md
2. Запусти тесты
3. Сделай изменение (write_to_file)
4. git diff — проверь что применилось
5. Тесты — проверь что не сломалось
6. Коммит

### 13.2 Минимальные изменения

Одно изменение = один коммит. Не делай несколько фич в одном коммите.
