// ════════════════════════════════════════════════════════
// РЕНДЕР — базовые функции для работы с гридом
// Используются battle.js и game.js
// ════════════════════════════════════════════════════════

// Получить DOM-элемент клетки по координатам
function cell(c, r) {
  return document.getElementById(`c${c}_${r}`);
}

// Создать грид (вызывается один раз при старте)
function buildGrid() {
  const g = document.getElementById('grid');
  g.innerHTML = '';
  // гарантируем, что CSS‑грид соответствует текущим константам
  g.style.gridTemplateColumns = `repeat(${COLS}, 68px)`;
  g.style.gridTemplateRows = `repeat(${ROWS}, 68px)`;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const el = document.createElement('div');
      el.className = 'cell';
      el.id = `c${c}_${r}`;
      el.dataset.c = c;
      el.dataset.r = r;
      el.addEventListener('click', () => onCellClick(c, r));
      g.appendChild(el);
    }
  }
}
