// ════════════════════════════════════════════════════════
// АУДИО — звуки через HTML Audio из папки sounds/
// Каждый вызов создаёт новый Audio для перекрытия звуков
// ════════════════════════════════════════════════════════

// Функция для проигрывания звука с обработкой ошибок
function playSound(filename) {
  try {
    const audio = new Audio(`src/sounds/${filename}`);
    audio.play().catch(() => {}); // Тихо игнорировать ошибки
  } catch (e) {
    // Тихо игнорировать
  }
}

// Выстрел из пистолета
function playShot() {
  playSound('man_gun_pistol_shot_01.mp3');
}

// Укус зомби (2 варианта рандомно)
function playBite() {
  const variant = Math.random() < 0.5 ? '01' : '02';
  playSound(`zombie_bite_${variant}.mp3`);
}

// Перемещение человека
function playFootstep() {
  playSound('man_move_01.mp3');
}

// Эффект отравления (2 варианта рандомно)
function playPoison() {
  const variant = Math.random() < 0.5 ? '01' : '02';
  playSound(`man_effects_poisoned_${variant}.mp3`);
}

// Перемещение зомби (2 варианта рандомно)
function playZombieMove() {
  const variant = Math.random() < 0.5 ? '01' : '02';
  playSound(`zombie_move_${variant}.mp3`);
}

// Победа (пока пусто, можно добавить позже)
function playVictory() {
  // TODO: добавить звук победы
}

// Поражение (пока пусто, можно добавить позже)
function playDefeat() {
  // TODO: добавить звук поражения
}