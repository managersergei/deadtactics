// ════════════════════════════════════════════════════════
// GENERATE FRAMES — генерирует ZOMBIE_FRAMES и SURVIVOR_FRAMES
// Запустить: node src/js/config/generate-frames.js
// ════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', '..', 'assets', 'units');

// Карта псевдонимов состояний (разные имена папок → каноничные)
const STATE_ALIASES = {
  'poison_damage': 'poisoned',
  'poison': 'poisoned'
};

// ── ZOMBIE ─────────────────────────────────────────────

function scanZombieFrames() {
  const zombiePath = path.join(ASSETS_DIR, 'zombie');
  const frames = {};

  if (!fs.existsSync(zombiePath)) {
    console.error('Папка зомби не найдена:', zombiePath);
    return frames;
  }

  const dirs = fs.readdirSync(zombiePath);

  // Только папки с _left — они представляют состояние
  const leftDirs = dirs.filter(d => d.endsWith('_left'));

  for (const dir of leftDirs) {
    // Состояние = имя папки без суффикса _left
    let state = dir.replace('_left', '');
    state = STATE_ALIASES[state] || state;

    const fullPath = path.join(zombiePath, dir);
    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.png'));
    frames[state] = files.length;
    console.log(`  ${state}: ${files.length} кадров`);
  }

  return frames;
}

// Определить состояние из имени папки (учитываем разные naming conventions)
function extractStateFromFolder(dirName) {
  // Вариант 1: attack_right, idle_left, move_right
  if (dirName.endsWith('_right') || dirName.endsWith('_left')) {
    let state = dirName.replace(/_(right|left)$/, '');
    return STATE_ALIASES[state] || state;
  }
  // Вариант 2: attack, move, die (без направления)
  return STATE_ALIASES[dirName] || dirName;
}

// Проверить является ли папка направленной (имеет _right или _left)
function isDirectionalFolder(dirName) {
  return dirName.endsWith('_right') || dirName.endsWith('_left');
}

// ── SURVIVOR ────────────────────────────────────────────

function scanSurvivorFrames() {
  const survivorPath = path.join(ASSETS_DIR, 'survivor');
  const weaponsFrames = {};

  if (!fs.existsSync(survivorPath)) {
    console.error('Папка survivor не найдена:', survivorPath);
    return {};
  }

  const weapons = fs.readdirSync(survivorPath);

  for (const weapon of weapons) {
    const weaponPath = path.join(survivorPath, weapon);
    if (!fs.statSync(weaponPath).isDirectory()) continue;

    const weaponFrames = {};
    const dirs = fs.readdirSync(weaponPath);

    // Группируем папки по состоянию
    const stateMap = {}; // { attack: ['attack_left', 'attack_right'] }

    for (const dir of dirs) {
      const fullPath = path.join(weaponPath, dir);
      if (!fs.statSync(fullPath).isDirectory()) continue;

      const state = extractStateFromFolder(dir);
      if (!stateMap[state]) stateMap[state] = [];
      stateMap[state].push(dir);
    }

    // Для каждого состояния берём кадры из _right папки (чаще всего она заполнена)
    // или из _left, или без направления
    for (const [state, folderNames] of Object.entries(stateMap)) {
      const rightFolder = folderNames.find(f => f.endsWith('_right'));
      const leftFolder = folderNames.find(f => f.endsWith('_left'));
      const noDirection = folderNames.find(f => !isDirectionalFolder(f));

      let count = 0;
      let usedFolder = null;

      // Пробуем в порядке: _right -> _left -> без направления
      if (rightFolder) {
        const fullPath = path.join(weaponPath, rightFolder);
        const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.png'));
        if (files.length > 0) {
          count = files.length;
          usedFolder = rightFolder;
        }
      }
      if (count === 0 && leftFolder) {
        const fullPath = path.join(weaponPath, leftFolder);
        const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.png'));
        if (files.length > 0) {
          count = files.length;
          usedFolder = leftFolder;
        }
      }
      if (count === 0 && noDirection) {
        const fullPath = path.join(weaponPath, noDirection);
        const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.png'));
        if (files.length > 0) {
          count = files.length;
          usedFolder = noDirection;
        }
      }

      weaponFrames[state] = count;
      console.log(`  ${weapon}/${state}: ${count} кадров (from ${usedFolder || 'none'})`);
    }

    weaponsFrames[weapon] = weaponFrames;
  }

  return weaponsFrames;
}

function mergeSurvivorFrames(weaponsFrames) {
  const merged = {};
  const warnings = [];

  const weaponNames = Object.keys(weaponsFrames);
  if (weaponNames.length === 0) return {};

  // Берём первое оружие как референс
  const referenceWeapon = weaponNames[0];
  const referenceFrames = weaponsFrames[referenceWeapon];

  // Копируем референс
  Object.assign(merged, referenceFrames);

  // Проверяем остальные оружия
  for (let i = 1; i < weaponNames.length; i++) {
    const weapon = weaponNames[i];
    const frames = weaponsFrames[weapon];

    for (const state of Object.keys(referenceFrames)) {
      const refCount = referenceFrames[state];
      const count = frames[state];

      if (count !== refCount) {
        warnings.push(`WARNING: ${weapon} имеет ${count} кадров ${state}, отличается от ${referenceWeapon} (${refCount})`);
      }
    }

    // Проверяем отсутствующие состояния
    for (const state of Object.keys(frames)) {
      if (!referenceFrames[state]) {
        warnings.push(`WARNING: ${weapon} имеет состояние ${state}, которого нет в ${referenceWeapon}`);
      }
    }
  }

  // Выводим предупреждения
  warnings.forEach(w => console.log(w));

  return merged;
}

// ── MAIN ────────────────────────────────────────────────

console.log('\n=== Сканирование спрайтов ===\n');

console.log('ZOMBIE:');
const zombieFrames = scanZombieFrames();

console.log('\nSURVIVOR:');
const weaponsFrames = scanSurvivorFrames();
const survivorFrames = mergeSurvivorFrames(weaponsFrames);

console.log('\n=== Результат ===\n');

console.log('ZOMBIE_FRAMES = ' + JSON.stringify(zombieFrames, null, 2).replace(/\n/g, '').replace(/\s+/g, ' '));
console.log('');
console.log('SURVIVOR_FRAMES = ' + JSON.stringify(survivorFrames, null, 2).replace(/\n/g, '').replace(/\s+/g, ' '));

console.log('\n=== Готово ===\n');
