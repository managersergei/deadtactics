// ════════════════════════════════════════════════════════
// SCREEN INTRO — рендер экрана интро (ЛОР + имя)
// ════════════════════════════════════════════════════════

// ── ГЛАВНОЕ МЕНЮ ──────────────────────────────────────

const MENU_BACKGROUND_FRAMES = [
  'src/assets/menu/back-menu1.png',
  'src/assets/menu/back-menu2.png',
  'src/assets/menu/back-menu3.png',
  'src/assets/menu/back-menu4.png'
];

const MENU_ANIMATION_SPEED = 250; // ms per frame

let menuAnimationInterval = null;
let currentMenuFrame = 0;

// Добавить звук наведения на кнопки меню
function addMenuHoverSound() {
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('mouseenter', playMenuSelect);
  });
}

function startMenuBackgroundAnimation() {
  const container = document.getElementById('menu-background');
  if (!container) return;
  
  // Добавить звук наведения на кнопки
  addMenuHoverSound();
  
  // Создать img элементы для каждого кадра
  container.innerHTML = '';
  MENU_BACKGROUND_FRAMES.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.className = index === 0 ? 'active' : '';
    container.appendChild(img);
  });
  
  // Запустить цикл анимации
  menuAnimationInterval = setInterval(() => {
    const images = container.querySelectorAll('img');
    if (images.length === 0) return;
    
    // Скрыть текущий кадр
    images[currentMenuFrame].classList.remove('active');
    
    // Перейти к следующему
    currentMenuFrame = (currentMenuFrame + 1) % MENU_BACKGROUND_FRAMES.length;
    
    // Показать следующий кадр
    images[currentMenuFrame].classList.add('active');
  }, MENU_ANIMATION_SPEED);
}

function stopMenuBackgroundAnimation() {
  if (menuAnimationInterval) {
    clearInterval(menuAnimationInterval);
    menuAnimationInterval = null;
  }
  currentMenuFrame = 0;
}

// ── ОБРАБОТЧИКИ КНОПОК МЕНЮ ───────────────────────────

function newGame() {
  // Сбросить данные игры
  resetGameData();
  initializeNewGame();
  // Перейти к вводу имени
  goToIntro();
}

function continueGame() {
  // Пока не реализовано — остаёмся на месте
  console.log('Continue: not implemented yet');
}

function openSettings() {
  // Пока не реализовано
  console.log('Settings: not implemented yet');
}

// ── ЭКРАН ИНТРО (ЛОР + ИМЯ) ───────────────────────────

let currentLoreIndex = 0;

function renderIntroScreen() {
  currentLoreIndex = 0;
  showLoreText();
}

function showLoreText() {
  const textEl = document.getElementById('intro-text');
  const inputContainer = document.getElementById('intro-input-container');
  const nextBtn = document.getElementById('intro-next-btn');

  if (!textEl || !inputContainer || !nextBtn) return;

  if (currentLoreIndex < LORE_MESSAGES.length) {
    textEl.textContent = LORE_MESSAGES[currentLoreIndex];
    inputContainer.style.display = 'none';
    nextBtn.style.display = 'block';
    nextBtn.textContent = currentLoreIndex === LORE_MESSAGES.length - 1 ? 'ДАЛЕЕ →' : 'ДАЛЕЕ →';
  } else {
    textEl.textContent = '';
    renderIntroKnife();
    inputContainer.style.display = 'flex';
    nextBtn.style.display = 'none';
  }
}

function showNextIntroText() {
  currentLoreIndex++;
  showLoreText();
}

// ── РЕНДЕР НОЖА С ГРАВИРОВКОЙ ───────────────────────────

function renderIntroKnife() {
  const container = document.getElementById('knife-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const name = gameData.player.name || '';
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 400 120');
  svg.setAttribute('width', '400');
  svg.setAttribute('height', '120');
  svg.style.cssText = 'display:block; margin: 0 auto;';
  
  svg.innerHTML = `
    <defs>
      <linearGradient id="knife-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#555"/>
        <stop offset="25%" stop-color="#ccc"/>
        <stop offset="50%" stop-color="#fff"/>
        <stop offset="75%" stop-color="#ccc"/>
        <stop offset="100%" stop-color="#444"/>
      </linearGradient>
      <linearGradient id="handle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#5a4030"/>
        <stop offset="50%" stop-color="#2a1810"/>
        <stop offset="100%" stop-color="#1a0a00"/>
      </linearGradient>
    </defs>
    
    <path d="M 10 60 L 200 60 L 200 90 L 15 90 L 10 60" fill="url(#knife-grad)" stroke="#333" stroke-width="2"/>
    <path d="M 15 65 L 60 65 L 60 75 L 20 75 L 15 65" fill="#fff" opacity="0.4"/>
    
    <rect x="200" y="50" width="140" height="30" rx="6" fill="url(#handle-grad)" stroke="#1a0a00" stroke-width="3"/>
    <ellipse cx="210" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="240" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="270" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="300" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    <ellipse cx="330" cy="65" rx="6" ry="12" fill="#6a5040" stroke="#1a0a00" stroke-width="1"/>
    
    <text x="105" y="80" font-family="monospace" font-size="18" font-weight="bold" fill="#1a1a1a" text-anchor="middle">${name}</text>
  `;
  
  container.appendChild(svg);
  
  // Обновить гравировку при вводе - используем addEventListener
  const input = document.getElementById('player-name-input');
  if (input) {
    input.oninput = function() {
      gameData.player.name = this.value;
      renderIntroKnife();
    };
  }
}
