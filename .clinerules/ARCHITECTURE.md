# ARCHITECTURE — Dead Tactics

---

## 1. Файловая структура

```
dead-tactics/
├── index.html                        ← единственный HTML, точка входа
├── .clinerules/                      ← документация проекта
│   ├── RULES.md
│   ├── ARCHITECTURE.md
│   ├── GAMEPLAY.md
│   └── RENDERING.md
└── src/
    ├── assets/
    │   ├── battlefield/road/         ← фоновые изображения боя
    │   ├── menu/                     ← спрайты главного меню (4 кадра анимации)
    │   ├── items/                    ← иконки предметов
    │   └── units/
    │       ├── survivor/{оружия}/     ← спрайты survivor по оружию
    │       └── zombie/               ← спрайты зомби
    ├── css/
    │   ├── base.css                  ← сброс, типографика, CSS-переменные
    │   ├── game.css                  ← поле боя, клетки, юниты
    │   ├── ui.css                   ← сайдбар, кнопки, лог
    │   ├── components.css            ← переиспользуемые компоненты
    │   └── screens.css               ← экраны (карта, отряд, магазин, меню)
    ├── sounds/
    └── js/
        ├── config/
        │   ├── game-config.js        ← константы, баланс, UNIT_TYPES, ITEMS, LEVELS
        │   ├── ui-constants.js       ← константы карты мира
        │   └── generate-frames.js    ← генерация кадров спрайтов
        ├── core/
        │   ├── state.js              ← стейт боя (единственный источник правды)
        │   ├── helpers.js            ← чистые утилиты (sleep, manhattan, unitAt, etc.), экспортируются для тестов
        │   └── effects.js            ← система эффектов
        ├── render/
        │   ├── render.js             ← построение грида, функция cell()
        │   └── battle.js             ← рендер боя, анимация, syncUnitsWithDOM
        ├── screens/
        │   ├── screenIntro.js        ← главное меню + интро и ввод имени
        │   ├── screens.js            ← роутинг между экранами, showScreen()
        │   ├── screenMap.js          ← карта мира
        │   ├── screenSquad.js        ← экран отряда
        │   ├── screenShop.js         ← магазин
        │   ├── screenLevel.js        ← экран перед боем
        │   └── screenDetail.js       ← детали юнита
        ├── ai.js                     ← ИИ зомби
        ├── audio.js                  ← звуки
        ├── data.js                   ← стейт кампании, gameData, buyItem, recruitUnit
        ├── game.js                   ← боевая логика, обработчики кликов
        ├── ui.js                     ← сайдбар, модалки, оверлеи
        ├── units.js                  ← фабрики mkPlayer(), mkZombie()
        └── tests/
            └── helpers.test.js       ← тесты утилит
```

---

## 2. Порядок подключения скриптов

Порядок в `index.html` критичен — каждый следующий файл зависит от предыдущих:

```
game-config.js      ← UNIT_TYPES, ITEMS, LEVELS, WEAPONS
ui-constants.js     ← MAP_POSITIONS, MAP_COLORS
core/effects.js     ← EFFECTS, addEffect, removeEffect
state.js            ← state, uid()
data.js             ← gameData, buyItem, recruitUnit

screenIntro.js      ← функции меню (startMenuBackgroundAnimation, newGame, etc.)
screens.js          ← showScreen(), SCREENS (зависит от screenIntro.js!)
screenMap.js
screenSquad.js
screenShop.js
screenLevel.js
screenDetail.js

units.js            ← mkPlayer(), mkZombie()
helpers.js          ← unitAt(), manhattan(), reachable(), calcDamage()

render.js           ← buildGrid(), cell()
battle.js           ← render(), syncUnitsWithDOM(), startAnimation()

ui.js               ← updateSidebar(), showUnitItemsModal()
audio.js            ← playShot(), playBite()
ai.js               ← runZombies(), zombieMove()
game.js             ← onCellClick(), doMove(), doAttack()
```

**Важно:** `screenIntro.js` должен быть загружен до `screens.js`, так как `showScreen()` вызывает `startMenuBackgroundAnimation()`.

---

## 3. Главное меню

### Структура HTML
```html
<div id="screen-start" class="screen">
  <div id="menu-background" class="menu-background"></div>
  <div class="menu-container">
    <h1 class="menu-title">☣ DEAD TACTICS</h1>
    <div class="menu-buttons">
      <button onclick="newGame()" class="menu-btn">▶ НОВАЯ ИГРА</button>
      <button onclick="continueGame()" class="menu-btn">▶ ПРОДОЛЖИТЬ</button>
      <button onclick="openSettings()" class="menu-btn">⚙ НАСТРОЙКИ</button>
    </div>
  </div>
</div>
```

### CSS классы
| Класс | Назначение |
|-------|-----------|
| `.menu-background` | Контейнер для анимированного фона |
| `.menu-container` | Центрированный контент |
| `.menu-title` | Заголовок игры |
| `.menu-subtitle` | Подзаголовок |
| `.menu-buttons` | Контейнер кнопок |
| `.menu-btn` | Кнопка меню |

### JavaScript функции (screenIntro.js)
| Функция | Назначение |
|---------|-----------|
| `startMenuBackgroundAnimation()` | Запустить анимацию фона (4 кадра) |
| `stopMenuBackgroundAnimation()` | Остановить анимацию |
| `newGame()` | Сбросить данные и перейти к вводу имени |
| `continueGame()` | Заглушка для продолжения |
| `openSettings()` | Заглушка для настроек |

### Параметры анимации
```javascript
const MENU_BACKGROUND_FRAMES = [
  'src/assets/menu/back-menu1.png',
  'src/assets/menu/back-menu2.png',
  'src/assets/menu/back-menu3.png',
  'src/assets/menu/back-menu4.png'
];
const MENU_ANIMATION_SPEED = 250; // ms per frame
```

---

## 4. Разделение стейта

**Стейт боя** — только в `state.js`:
- юниты на поле, фаза, ход, подсветка, выбранный юнит, статистика боя

**Стейт кампании** — только в `data.js`:
- `gameData`: игрок, отряд, прогресс уровней, золото

Никогда не хранить боевые данные в `data.js` и кампанейские в `state.js`.

---

## 5. CSS-переменные и специфичность

### CSS-переменные
Все CSS-переменные определены в `base.css`. Файл `styles.css` существует в папке но **не подключён** в `index.html` — не использовать его.

### CSS Specificity для кнопок
Глобальные стили кнопок определены в `ui.css`:
```css
button:hover:not(:disabled) {
  background: #102210;
  border-color: var(--green);
  box-shadow: 0 0 10px rgba(57,255,20,0.15);
}
```

**При добавлении новых кнопок** с кастомными стилями:
1. Используйте более специфичный селектор: `#screen-start .menu-btn:hover`
2. Добавьте `!important` для перебития глобальных стилей
3. Обнулите `box-shadow` если не нужен

---

## 6. Как добавить новый экран

1. Добавить `<div id="screen-{name}">` в `index.html`
2. Добавить константу в `SCREENS` в `screens.js`
3. Создать файл `src/js/screens/screen{Name}.js` с функцией `render{Name}Screen()`
4. Подключить скрипт в `index.html` в группе screens
5. Добавить стили в `screens.css`
6. Все `id` элементов экрана должны иметь префикс экрана: `map-*`, `shop-*`, `squad-*`, `battle-*`

---

## 7. Как добавить новый тип юнита

1. Добавить константу в `UNIT_TYPES` в `game-config.js`
2. Добавить параметры в `game-config.js` (по аналогии с `PLAYER_STATS`, `ZOMBIE_STATS`)
3. Создать фабрику `mk{Type}()` в `units.js`
4. Добавить папки спрайтов в `src/assets/units/{type}/`
5. Добавить в `ZOMBIE_FRAMES` или создать аналогичный объект в `battle.js`
6. Добавить `get{Type}AnimState()` в `battle.js`
7. Добавить ИИ-логику в `ai.js` если враждебный

---

## 8. Именование

**Файлы:** camelCase — `screenShop.js`, `gameConfig.js`

**Константы:** UPPER_CASE — `const COLS = 10`, `const UNIT_TYPES = {}`

**Функции:** camelCase с глаголом — `calcDamage()`, `getDirection()`, `buildGrid()`

**ID в DOM:** префикс экрана — `shop-weapons`, `battle-grid`, `squad-units`

**Никогда:** `player` вместо `survivor`, `game_config` вместо `gameConfig`

---

## 9. Тесты

```bash
node src/js/tests/helpers.test.js
```

Тестируется: `manhattan`, `unitAt`, `reachable`, `calcDamage`, `alivePlayers`, `aliveZombies`, `getDirection`.

При добавлении новой утилиты в `helpers.js` — добавить тест. Моки создаются до подключения модулей.


---

## 10. Side Effects функций data.js

| Функция | Side Effects |
|---------|--------------|
| `buyItem()` | Изменяет gold, equipment, HP |
| `recruitUnit()` | Изменяет gold, добавляет в squad |
| `syncSquadWithBattleState()` | Удаляет мёртвых юнитов из squad |
| `completeLevel()` | Изменяет gold, levelProgress |

---

## 11. Важное правило: maxHp — только для чтения

**ЗАПРЕЩЕНО** записывать бонусы от предметов в `unit.maxHp`.

**ПРАВИЛЬНО:**
- `maxHp` = базовое значение из RECRUITS (константа)
- Бонусы считаются **на лету** через `getEffectiveStat()` в helpers.js

**ПРИЧИНА:** Иначе происходит двойное начисление (баг 7/9 вместо 7/7).

---

## 12. Сохранение прогресса между боями

### Функции

| Функция | Файл | Назначение |
|---------|------|------------|
| `syncSquadWithBattleState()` | data.js | Сохраняет HP, charges после боя |
| `mkPlayer()` | units.js | Читает HP из squad при старте боя |
| `getEffectiveStat()` | helpers.js | Вычисляет maxHp с учётом брони |

### Поток данных

1. **Конец боя:** `syncSquadWithBattleState()` копирует HP в `gameData.squad`
2. **Удаление трупов:** мёртвые юниты удаляются из squad
3. **Старт боя:** `mkPlayer()` берёт `squadUnit.hp` для нового боевого юнита
4. **maxHp:** вычисляется через `getEffectiveStat()` — не хранится в БД
