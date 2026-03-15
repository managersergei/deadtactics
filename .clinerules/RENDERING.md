# RENDERING — Dead Tactics

---

## 1. Два типа анимаций

### Loop (циклические)
Воспроизводятся бесконечно. Используют глобальный счётчик `animationFrame`.

| Состояние | Юнит   | Триггер |
|-----------|--------|---------|
| `idle`    | все    | нет активных флагов — состояние по умолчанию |
| `raged`   | zombie | `u.raged === true` и юнит не двигается и не атакует |

### One-shot (разовые)
Воспроизводятся от кадра 1 до последнего, затем **замирают на последнем кадре** до снятия флага. Используют индивидуальный счётчик `animFrameCounters[unitId]`.

| Состояние    | Юнит     | Триггер           |
|--------------|----------|-------------------|
| `move`       | все      | `u.moving`        |
| `attack`     | все      | `u.attacking`     |
| `damaged`    | все     | `u.damagedFlash`  |
| `cr_damaged` | zombie   | `u.critFlash`     |
| `reload`     | survivor | `u.reloading`     |
| `poisoned`   | survivor | `u.poisonFlash`   |
| `antidote`   | survivor | `u.usingAntidote` |
| `grenade`    | survivor | `u.usingGrenade`  |
| `die`        | все      | `u.dying`         |
| `killed`     | survivor | `u.dyingAnim`     |
| `killed`     | zombie   | `!u.alive`        |

---

## 2. Приоритеты состояний

Активно только одно состояние — с наивысшим приоритетом.

**Survivor:** `die > killed > reload > poisoned > antidote > grenade > damaged > attack > move > idle`

**Zombie:** `die > killed > cr_damaged > damaged > attack > raged > move > idle`

`idle` — фолбэк. Явно устанавливать не нужно — возвращается автоматически когда нет других флагов.

---

## 2a. Функции определения состояния анимации

Функции `getZombieAnimState(u)` и `getSurvivorAnimState(u)` в `battle.js` определяют какую анимацию показывать на основе флагов юнита.

### Правило: Action > State

При определении приоритета применяется правило:

```
Состояния с активным действием (attack, damaged, move, reloading)
имеют приоритет над пассивными состояниями (raged, idle)
```

**Почему:** Когда юнит атакует или получает урон — это важнее, чем его текущее состояние (ярость/отдых).

### Пример проблемы (и как её избежать)

❌ **Неправильно:**
```javascript
if (u.raged) return 'raged';
if (u.attacking) return 'attack';  // АТАКА НЕ БУДЕТ ВИДНА!
```

✅ **Правильно:**
```javascript
if (u.attacking) return 'attack';   // СНАЧАЛА action
if (u.raged) return 'raged';        // Потом state
```

### Чеклист при добавлении нового состояния

При добавлении нового состояния в `getZombieAnimState()` или `getSurvivorAnimState()`:

1. **Определите** — может ли это состояние быть одновременно с другими?
2. **Примените правило** Action > State: состояния-действия (attack, damaged, move) проверяются до состояний-состояний (raged, idle)
3. **Проверьте сценарии:**
   - Зомби raged и атакует → что показывать? (ответ: attack)
   - Survivor poisoned и атакует → что важнее? (ответ: attack)
   - Survivor reloading и получает урон → что важнее? (ответ: damaged)

---

## 3. Количество кадров

Хранится в `ZOMBIE_FRAMES` и `SURVIVOR_FRAMES` в `battle.js`. Это единственный источник правды о кадрах. Значения задаются вручную и должны совпадать с реальным количеством файлов в папке спрайтов.

**Как обновить при добавлении спрайтов:**
```bash
node src/js/config/generate-frames.js
```
Скрипт выведет актуальные значения — скопируй их в `battle.js`.

---

## 4. Пути к спрайтам

```
zombie:   src/assets/units/zombie/{состояние}_{направление}/
survivor: src/assets/units/survivor/{оружие}/{состояние}_{направление}/

Исключение — survivor die:
          src/assets/units/survivor/{оружие}/die/   (без суффикса направления)
```

Имя файла: `{состояние}_{номер_кадра}.png` — например `idle_1.png`, `move_3.png`.

Если файл не найден (`onerror`) — показывается emoji юнита.

---

## 5. Направления и отзеркаливание

### Унифицированные функции (battle.js)

Логика отзеркаливания вынесена в отдельные функции:

```js
// Получить базовое направление спрайтов для типа юнита
getBaseDir(kind) // zombie → 'left', survivor → 'right'

// Универсальная функция определения визуального направления
// Все юниты динамически смотрят на ближайшего врага через getDirection(u)
getVisualDirection(u) 

// Вычислить путь к спрайтам и необходимость зеркаливания
computeSpritePath(u, state, direction) // → { base, needsMirror }
```

### Базовые направления спрайтов

Важно знать какое направление является "базовым" — изначально нарисованным:

| Тип | Базовый спрайт | Папка с файлами |
|-----|-----------------|-----------------|
| **Zombie** | Смотрит НАЛЕВО | `*_left/` |
| **Survivor** | Смотрит НАПРАВО | `*_right/` |

### Логика определения визуального направления

**Приоритет состояний в `getDirection()`:**

| Приоритет | Состояние | Откуда берётся направление |
|-----------|-----------|---------------------------|
| 1 | Передан `target` аргументом | `target.x` |
| 2 | `u.attacking && u.target` | `u.target.x` (цель атаки) |
| 3 | `u.moving && u.direction` | `u.direction` (куда движется) |
| 4 | Зомби | Ближайший игрок |
| 4 | Выживший | Ближайший зомби |

**Важно:** Флаги `attacking` и `moving` должны быть установлены **до** вызова `render()`, иначе направление не обновится.

**Zombie:**
- Всегда использует папку `*_left/` (где есть файлы спрайтов)
- Смотрит на ближайшего игрока
- Если игрок справа от зомби → `needsMirror = true` → `transform: scaleX(-1)`

**Survivor:**
- Всегда использует папку `*_right/` (где есть файлы спрайтов)
- Смотрит на ближайшего зомби (через `getDirection()`)
- Если зомби справа от выжившего → `needsMirror = true` → `transform: scaleX(-1)`

### Fallback логика (onerror)

Это **крайний случай** — когда нужного спрайта вообще нет в обеих папках:

1. **Zombie:** всегда использует `*_left/`, зеркалит когда нужно смотреть вправо
2. **Survivor:** использует `*_right/` (базовые спрайты), зеркалит когда нужно смотреть влево

Логика в `computeSpritePath()`:
- Всегда использует `baseDir` в пути (left для зомби, right для выжившего)
- `needsMirror = true` → применяется `transform: scaleX(-1)`
- Если файл не найден (`onerror`) — показывается emoji юнита

### Пример работы

Если зомби находится слева от игрока (игрок справа):
- `getVisualDirection(zombie)` → `'right'` (через `getDirection()`)
- `getBaseDir('zombie')` → `'left'`
- `needsMirror = 'right' !== 'left'` → `true`
- Результат: `base = zombie/idle_left/` + `transform = 'scaleX(-1)'`
- Визуально: зомби смотрит направо (на игрока)

---

## 6. Сброс счётчика one-shot анимации

При смене состояния индивидуальный счётчик сбрасывается автоматически в `syncUnitsWithDOM()`: если `oldState !== newState` → `resetAnimCounter(u.id)`.

Это обязательно: если survivor атакует дважды подряд и счётчик не сбросить — второй раз анимация начнётся с последнего кадра.

---

## 7. Движение юнита — правильная последовательность

Для каждой клетки пути:
1. Анимация `move` проигрывает **полный цикл** всех кадров
2. Только после этого юнит перемещается на следующую клетку

Задержка между шагами = `количество_кадров_move × ANIMATION_SPEED`:
```js
// Вычислить путь к спрайтам и необходимость зеркаливания
computeSpritePath(u, state, direction) // → { base, needsMirror }

// Универсальная функция определения направления взгляда
// Используется для любых анимаций с направлением (attack, move, grenade и т.д.)
getDirection(unit, target) // → 'left' | 'right'
```

После достижения финальной клетки: `u.moving = false` → юнит автоматически возвращается в `idle`.

---

## 8. `render()` vs `syncUnitsWithDOM()`

| Функция | Что делает | Когда вызывать |
|---------|-----------|----------------|
| `render()` | Очищает классы клеток, вызывает `syncUnitsWithDOM`, перезапускает интервал анимации | После завершения действия, при смене фазы |
| `syncUnitsWithDOM()` | Перемещает div-элементы, обновляет dataset для аниматора | Внутри цикла движения — без остановки интервала |

**`render()` внутри цикла движения — запрещено.** Перезапускает интервал и сбрасывает анимацию на первый кадр.

---

## 8. Блокировка: `animationPaused` vs `clicksBlocked`

Две разные переменные для разных целей:

| Переменная | Назначение | Где используется |
|-----------|-----------|----------------|
| `animationPaused` | Остановка интервала анимации | `render()`, `startAnimation()` |
| `clicksBlocked` | Блокировка кликов игрока | `onCellClick()` |

**Правило:** `startAnimation()` должен крутиться всегда. Блокировка кликов — через `clicksBlocked`.

### Использование

```js
// В game.js — блокируем клики, но анимация работает
clicksBlocked = true;
// ... действие ...
clicksBlocked = false;
```

**Важно:** Никогда не используй `animationPaused` для блокировки кликов — это остановит анимацию!

---

## 8a. Правила анимаций (уроки бага)

### Render != Logic
Никогда не останавливай цикл рендеринга (`startAnimation`) ради того, чтобы остановить логику (`onCellClick`). Это разные системы!

- `startAnimation()` — должен крутиться всегда
- Блокировка кликов — через отдельную переменную (`clicksBlocked`)

### Sequentiality (Последовательность)
Если два действия идут друг за другом (атака → перезарядка), между ними **обязательно** должен быть `await` на время анимации первого:

```js
attacker.attacking = true;
render();
await sleep(SURVIVOR_FRAMES.attack * ANIMATION_SPEED);
// Теперь можно следующее действие
attacker.reloading = true;
render();
await sleep(SURVIVOR_FRAMES.reload * ANIMATION_SPEED);
attacker.reloading = false;
clicksBlocked = false;
```

Без `await` второе действие "съест" первое — игрок не увидит анимацию.

### Status Visibility
Логи типа `[ANIM] frame X/Y` — лучший способ понять, что видит игрок. Используй для отладки, но убирай из продакшена.

---

## 9. Правильная реализация движения

```js
// game.js — doMove / ai.js — zombieMove
clicksBlocked = true;
u.moving = true;
startAnimation(); // один раз — запускает move анимацию

for (const pos of path) {
  await sleep(STEP_DELAY); // сначала анимация проигрывает полный цикл
  u.x = pos.x;             // только потом перемещение
  u.y = pos.y;
  syncUnitsWithDOM();       // перемещает div в новую клетку
  _drawHighlights();        // обновляет подсветку
}

u.moving = false;
clicksBlocked = false;
render(); // один раз в конце
```

---

## 10. DOM-структура юнита

Каждый юнит — один постоянный DOM-элемент `id="unit-{u.id}"`. Создаётся один раз в `_buildUnitEl()`, живёт до конца боя. При движении перемещается через `appendChild` — не пересоздаётся.

```
div.unit.{kind}#unit-{id}
  div.unit-visual
    img[data-animated][data-anim-state][data-max-frames][data-unit-id]
  div.unit-status        ← только у живых
    div.hp-bar
      div.hp-fill        ← ширина = HP%
    div.status-icon      ← иконка эффекта (по одной на каждый)
  div.unit-tooltip       ← только у живых
```

---

## 11. Позиционирование на клетке

```css
.unit {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.unit:hover {
  transform: translateX(-50%) scale(1.06); /* translateX обязателен! */
}
.unit.dead:hover {
  transform: translateX(-50%); /* мёртвые не увеличиваются */
}
```

Контейнер 100×100px, клетка 71×71px. Персонаж может визуально выходить за пределы клетки — это намеренно, спрайты нарисованы с учётом этого.

---

## 12. HP-бар

| HP% | Класс | Цвет |
|-----|-------|------|
| > 67% | — | зелёный |
| 34–67% | `med` | жёлтый |
| < 34% | `low` | красный |

---

## 13. Тултип при наведении

**Survivor:** имя, тип ("Выживший"), статус движения ("Сходил" / "Может идти"), статус атаки ("Атаковал" / "Может атаковать"). Без слов "Движение:" и "Атака:" перед статусом.

**Zombie (живой):** только описание типа из `ZOMBIE_TYPES[z.type].description`.

**Мёртвые:** тултип отсутствует.

---

## 14. Добавление нового состояния анимации

**Для Zombie:**
1. Добавить папки спрайтов: `{состояние}_left/` и `{состояние}_right/`
2. Добавить количество кадров в `ZOMBIE_FRAMES` в `battle.js`

**Для Survivor:**
1. Добавить папки спрайтов: `{состояние}_right/` (только right — left получается зеркалированием)
2. Добавить количество кадров в `SURVIVOR_FRAMES` в `battle.js`

3. Если one-shot — добавить в `ONE_SHOT_ANIMS` в `battle.js`
4. Добавить флаг в объект юнита в `units.js`
5. Добавить проверку в `getZombieAnimState()` или `getSurvivorAnimState()` с нужным приоритетом
6. **Применить правило Action > State** — см. раздел 2a
7. Добавить логику включения/выключения флага в `game.js` или `ai.js`

### Чеклист проверки приоритетов

После добавления нового состояния ответьте на вопросы:

1. **Это состояние-действие или состояние-состояние?**
   - Action (attack, damaged, move, reloading) → проверять ДО
   - State (raged, idle) → проверять ПОСЛЕ

2. **Может ли это состояние быть одновременно с другими?**
   - Да → проверить все возможные комбинации
   - Нет → просто добавить в нужное место

3. **Примеры проверки:**
   - Зомби в ярости (raged) и атакует → что важнее? → **attack**
   - Выживший травится (poisoned) и атакует → что важнее? → **attack**
   - Выживший перезаряжается (reloading) и получает урон → что важнее? → **damaged**

---

## 15. Обновление HP bar

При изменении HP юнита (атака, граната, эффекты) визуализация обновляется через цепочку вызовов:

```
doAttack() / doGrenade() / processEffectsOnTurnStart()
    ↓
render()
    ↓
syncUnitsWithDOM()
    ↓
updateUnitVisuals(u, el)
```

### Функция `updateUnitVisuals(u, el)`

Находится в `battle.js`. Обновляет визуальные элементы юнита без пересоздания DOM:

```javascript
function updateUnitVisuals(u, el) {
  if (!u.alive) return;
  
  const statusEl = el.querySelector('.unit-status');
  if (!statusEl) return;
  
  const hpFill = statusEl.querySelector('.hp-fill');
  if (!hpFill) return;
  
  // Обновить ширину
  const pct = Math.max(0, u.hp / u.maxHp);
  hpFill.style.width = (pct * 100) + '%';
  
  // Обновить класс цвета
  hpFill.className = 'hp-fill';
  if (pct <= 0.34) hpFill.classList.add('low');
  else if (pct <= 0.67) hpFill.classList.add('med');
}
```

### Почему это важно

- HP bar создаётся один раз в `_buildUnitEl()` при появлении юнита
- При каждом `render()` вызывается `syncUnitsWithDOM()`, который вызывает `updateUnitVisuals()`
- Это гарантирует что HP bar всегда отражает актуальное значение `u.hp / u.maxHp`
- Обновление только стилей (без пересоздания DOM) избегает визуального мигания

### Принцип Single Responsibility

Обновление визуализации вынесено в отдельную функцию `updateUnitVisuals()`, а не находится внутри `syncUnitsWithDOM()`. Это:
- Упрощает поддержку кода
- Позволяет легко добавить другие визуальные обновления
- Сохраняет `syncUnitsWithDOM()` чистой (только перемещение элементов)

---

## 16. Анимация повреждения (damaged)

### Принцип Атомарности Урона

`takeDamage()` только меняет цифры и включает флаг анимации. Она **не имеет права знать о времени**.

```js
function takeDamage(target, amount, source) {
  target.hp -= amount;
  target.damagedFlash = true;  // ВКЛЮЧАЕМ анимацию
  render();                      // СРАЗУ запускаем
  return { died: ... };
}
```

### Принцип Вычисляемых Таймингов

**Запрещено использовать магические числа вроде `500ms`.**

Правило:
```
Задержка = Количество_кадров * ANIMATION_SPEED
```

Пример:
```js
const delay = SURVIVOR_FRAMES.damaged * ANIMATION_SPEED; // 5 * 150 = 750ms
```

Если кто-то впишет число вручную — это **баг**.

### Золотое Правило Кадра

> Никогда не используйте `await` сразу после изменения визуального флага без вызова `render()`, если флаг должен быть снят в конце этой же функции.

❌ **Неправильно:**
```js
target.damagedFlash = true;
await new Promise(r => setTimeout(r, 500)); // render() не вызван!
target.damagedFlash = false; // Анимация не успела отобразиться
```

✅ **Правильно:**
```js
target.damagedFlash = true;
render(); // СРАЗУ запускаем анимацию
await new Promise(r => setTimeout(r, delay));
target.damagedFlash = false;
```

### Правильная последовательность вызовов

```js
// В doAttack(), doGrenade(), zombieAttack():
takeDamage(target, damage, source);      // 1. Нанесение урона + запуск анимации
await waitForDamageAnimation(target);    // 2. Ожидание окончания анимации
```

### Функция waitForDamageAnimation()

```js
async function waitForDamageAnimation(target) {
  if (!target.damagedFlash) return;  // Если нет анимации - не ждём
  
  const frames = target.kind === UNIT_TYPES.ZOMBIE 
    ? ZOMBIE_FRAMES.damaged 
    : SURVIVOR_FRAMES.damaged;
  const delay = frames * ANIMATION_SPEED;
  
  await sleep(delay);
  
  target.damagedFlash = false;
  render();
}
```

### Правило Группового Урона

При нанесении урона нескольким целям (граната):

❌ **Неправильно:** await для каждого врага по очереди
```js
for (const z of targets) {
  await takeDamage(z, dmg, 'grenade');      // Ждём 750ms
  await waitForDamageAnimation(z);           // Ещё 750ms
}
```

✅ **Правильно:** Запустить урон для всех, дождаться одной общей анимации
```js
for (const z of targets) {
  takeDamage(z, dmg, 'grenade');  // Запускаем для всех сразу
}
await waitForDamageAnimation(target[0]); // Ждём одну анимацию
```
