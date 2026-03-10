// ════════════════════════════════════════════════════════
// SCREEN INTRO — рендер экрана интро (ЛОР + имя)
// ════════════════════════════════════════════════════════

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
