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

// ════════════════════════════════════════════════════════
// ФОНОВАЯ МУЗЫКА
// ════════════════════════════════════════════════════════

let bgMusic = null; // Текущий Audio-объект фоновой музыки

// Запустить фоновую музыку (loop)
function playBgMusic(filename, volume = 1.0) {
  stopBgMusic();
  bgMusic = new Audio(`src/sounds/${filename}`);
  bgMusic.loop = true;
  bgMusic.volume = volume;
  bgMusic.play().catch(() => {});
}

// Остановить фоновую музыку
function stopBgMusic() {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
    bgMusic = null;
  }
}

// Фоновые мелодии для разных экранов
function startMenuMusic() {
  playBgMusic('system/menu.mp3', 1.0);
}

function startGameMusic() {
  playBgMusic('system/game.mp3', 0.35); // Тише чем меню
}

function startBattleMusic() {
  playBgMusic('system/battle.mp3', 0.35); // Тише чем меню
}

// Остановить любую фоновую музыку
function stopMusic() {
  stopBgMusic();
}

// ════════════════════════════════════════════════════════
// СИСТЕМНЫЕ ЗВУКИ
// ════════════════════════════════════════════════════════

// Звук наведения на кнопки меню
function playMenuSelect() {
  playSound('system/menu_select.mp3');
}

// Звук любых кликов
function playClick() {
  playSound('system/click.mp3');
}

// Поражение (пока пусто, можно добавить позже)
function playDefeat() {
  // TODO: добавить звук поражения
}
