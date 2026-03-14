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
    │   ├── items/                    ← иконки предметов
    │   └── units/
    │       ├── survivor/{оружие}/    ← спрайты survivor по оружию
    │       └── zombie/               ← спрайты зомби
    ├── css/
    │   ├── base.css                  ← сброс, типографика, CSS-переменные
    │   ├── game.css                  ← поле боя, клетки, юниты
    │   ├── ui.css                    ← сайдбар, кнопки, лог
    │   ├── components.css            ← переиспользуемые компоненты
    │   └── screens.css               ← экраны (карта, отряд, магазин)
    ├── sounds/
    └── js/
        ├── config/
        │   ├── game-config.js        ← константы, баланс, UNIT_TYPES, ITEMS, LEVELS
        │   └── ui-constants.js       ← константы карты мира
        ├── core/
        │   ├── state.js              ← стейт боя (единственный источник правды)
        │   └── helpers.js            ← чистые утилиты, экспортируются для тестов
        │   └── effects.js            ← система эффектов (планируется → core/)
        ├── render/
        │   ├── render.js             ← построение грида, функция cell()
        │   └── battle.js             ← рендер боя, анимация, syncUnitsWithDOM
        ├── screens/
        │   ├── screens.js            ← роутинг между экранами, showScreen()
        │   ├── screenMap.js          ← карта мира
        │   ├── screenSquad.js        ← экран отряда
        │   ├── screenShop.js         ← магазин
        │   ├── screenIntro.js        ← интро и ввод имени
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
effects.js          ← EFFECTS, addEffect, removeEffect
state.js            ← state, uid()
data.js             ← gameData, buyItem, recruitUnit

screens.js          ← showScreen(), SCREENS
screenMap.js
screenSquad.js
screenShop.js
screenIntro.js
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

Новый скрипт всегда добавляется в конец своей группы. Нарушение порядка = "функция не определена" в консоли.

---

## 3. Разделение стейта

**Стейт боя** — только в `state.js`:
- юниты на поле, фаза, ход, подсветка, выбранный юнит, статистика боя

**Стейт кампании** — только в `data.js`:
- `gameData`: игрок, отряд, прогресс уровней, золото

Никогда не хранить боевые данные в `data.js` и кампанейские в `state.js`.

---

## 4. CSS-переменные

Все CSS-переменные определены в `base.css`. Файл `styles.css` существует в папке но **не подключён** в `index.html` — не использовать его. При добавлении новой переменной — добавлять в `base.css`.

---

## 5. Как добавить новый экран

1. Добавить `<div id="screen-{name}">` в `index.html`
2. Добавить константу в `SCREENS` в `screens.js`
3. Создать файл `src/js/screens/screen{Name}.js` с функцией `render{Name}Screen()`
4. Подключить скрипт в `index.html` в группе screens
5. Добавить стили в `screens.css`
6. Все `id` элементов экрана должны иметь префикс экрана: `map-*`, `shop-*`, `squad-*`, `battle-*`

---

## 6. Как добавить новый тип юнита

1. Добавить константу в `UNIT_TYPES` в `game-config.js`
2. Добавить параметры в `game-config.js` (по аналогии с `PLAYER_STATS`, `ZOMBIE_STATS`)
3. Создать фабрику `mk{Type}()` в `units.js`
4. Добавить папки спрайтов в `src/assets/units/{type}/`
5. Добавить в `ZOMBIE_FRAMES` или создать аналогичный объект в `battle.js`
6. Добавить `get{Type}AnimState()` в `battle.js`
7. Добавить ИИ-логику в `ai.js` если враждебный

---

## 7. Именование

**Файлы:** camelCase — `screenShop.js`, `gameConfig.js`

**Константы:** UPPER_CASE — `const COLS = 10`, `const UNIT_TYPES = {}`

**Функции:** camelCase с глаголом — `calcDamage()`, `getDirection()`, `buildGrid()`

**ID в DOM:** префикс экрана — `shop-weapons`, `battle-grid`, `squad-units`

**Никогда:** `player` вместо `survivor`, `game_config` вместо `gameConfig`

---

## 8. Тесты

```bash
node src/js/tests/helpers.test.js
```

Тестируется: `manhattan`, `unitAt`, `reachable`, `calcDamage`, `alivePlayers`, `aliveZombies`, `getDirection`.

При добавлении новой утилиты в `helpers.js` — добавить тест. Моки создаются до подключения модулей.
