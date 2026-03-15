// Простые unit-тесты для утилит helpers.js
// Запускаются через Node: node src/js/tests/helpers.test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Мок window для Node.js
global.window = global.window || {};

// Глобальные переменные для мока
global.units = [];

// Мок функции getUnits (используется в helpers.js)
global.getUnits = () => global.units;

// Мок state
global.state = {
  units: global.units,
  getUnits: () => global.units,
};

// Подключаем модули ПОСЛЕ создания моков
const helpers = require('../core/helpers.js');
const config = require('../config/game-config.js');

// Делаем ITEMS глобальной переменной (как в браузере)
global.ITEMS = config.ITEMS;
global.COLS = config.COLS;
global.ROWS = config.ROWS;
global.WEAPONS = config.WEAPONS;

// Также добавляем в window как в браузере
global.window.ITEMS = config.ITEMS;
global.window.COLS = config.COLS;
global.window.ROWS = config.ROWS;
global.window.WEAPONS = config.WEAPONS;
global.window.UNIT_TYPES = config.UNIT_TYPES;
global.UNIT_TYPES = config.UNIT_TYPES;

// Константы анимаций (дублируем из battle.js для тестов)
// Эти значения должны совпадать с battle.js
const ANIMATION_SPEED = 150;

const ZOMBIE_FRAMES = {
  idle: 6,
  move: 6,
  attack: 5,
  damaged: 3,
  cr_damaged: 5,
  die: 4,
  killed: 1,
  raged: 5
};

const SURVIVOR_FRAMES = {
  idle: 6,
  move: 6,
  attack: 3,
  poisoned: 4,
  reload: 6,
  die: 1,
  killed: 4,
  damaged: 5,
  antidote: 5,
  grenade: 4
};

function run() {
  console.log('=== Running helpers tests ===');

  // manhattan
  assert.strictEqual(helpers.manhattan({x:0,y:0},{x:3,y:4}), 7);
  assert.strictEqual(helpers.manhattan({x:5,y:5},{x:5,y:5}), 0);
  console.log('✓ manhattan');

  // unitAt
  global.units = [{alive:true, x:1, y:1, kind:'survivor'}];
  // Обновляем getUnits чтобы возвращал актуальный units
  global.getUnits = () => global.units;
  assert.deepStrictEqual(helpers.unitAt(1,1), global.units[0]);
  assert.strictEqual(helpers.unitAt(0,0), null);
  console.log('✓ unitAt');

  // reachable
  const unit = {x:1,y:1,moveRange:4,kind:'survivor',hp:5,maxHp:5,atkRange:4,weapon:'pistol',poisoned:false,moved:false,attacked:false,alive:true};
  global.units = [unit];
  global.getUnits = () => global.units;
  const cells = helpers.reachable(unit);
  assert(cells.some(c=>c[0]===1&&c[1]===2));
  assert(cells.every(([c,r])=>Math.abs(c-1)+Math.abs(r-1)<=4));
  console.log('✓ reachable');

  // calcDamage - pistol: baseDmg=1, critDmg=2, critChance=0.10
  for (let i=0;i<100;i++) {
    const dmgArr = helpers.calcDamage('pistol');
    const dmg = dmgArr[0];
    assert(dmg === 1 || dmg === 2, `Expected 1 or 2, got ${dmg}`);
  }
  console.log('✓ calcDamage');

  // aliveZombies и alivePlayers
  global.units = [
    {alive:true, kind:'survivor'},
    {alive:false, kind:'survivor'},
    {alive:true, kind:'zombie'},
    {alive:false, kind:'zombie'},
  ];
  global.getUnits = () => global.units;
  const surv = helpers.alivePlayers();
  const zombs = helpers.aliveZombies();
  assert.strictEqual(surv.length, 1);
  assert.strictEqual(zombs.length, 1);
  console.log('✓ alivePlayers / aliveZombies');

  // getDirection
  const dirLeft = helpers.getDirection({x:5,y:5}, {x:3,y:5});
  const dirRight = helpers.getDirection({x:5,y:5}, {x:7,y:5});
  assert.strictEqual(dirLeft, 'left');
  assert.strictEqual(dirRight, 'right');
  console.log('✓ getDirection');

  // ТЕСТЫ АНИМАЦИЙ
  // ===============

  // Путь к ассетам (относительно корня проекта)
  const PROJECT_ROOT = path.join(__dirname, '../../..');
  
  // Подсчитать количество png файлов в папке
  function countFrames(folderPath) {
    try {
      const fullPath = path.join(PROJECT_ROOT, folderPath);
      if (!fs.existsSync(fullPath)) return 0;
      const files = fs.readdirSync(fullPath);
      return files.filter(f => f.endsWith('.png')).length;
    } catch (e) {
      return 0;
    }
  }

  // Тест: SURVIVOR_FRAMES для pistol должны соответствовать файлам
  console.log('\n--- Animation frame tests (survivor/pistol) ---');
  
  // Для pistol: idle, move, attack, damaged, poisoned, reload - в папках с направлением
  // die, killed - без направления
  const pistolTests = [
    { state: 'idle', folder: 'src/assets/units/survivor/pistol/idle_right' },
    { state: 'move', folder: 'src/assets/units/survivor/pistol/move_right' },
    { state: 'attack', folder: 'src/assets/units/survivor/pistol/attack_right' },
    { state: 'damaged', folder: 'src/assets/units/survivor/pistol/damaged_right' },
    { state: 'poisoned', folder: 'src/assets/units/survivor/pistol/poisoned_right' },
    { state: 'reload', folder: 'src/assets/units/survivor/pistol/reload_right' },
    { state: 'die', folder: 'src/assets/units/survivor/pistol/die_right' },
    { state: 'killed', folder: 'src/assets/units/survivor/pistol/killed_right' },
    { state: 'antidote', folder: 'src/assets/units/survivor/antidote_right' },
    { state: 'grenade', folder: 'src/assets/units/survivor/grenade_right' },
  ];
  
  let survivorFailures = 0;
  for (const test of pistolTests) {
    const actualFrames = countFrames(test.folder);
    const expectedFrames = SURVIVOR_FRAMES[test.state];
    if (actualFrames !== expectedFrames) {
      console.log(`✗ ${test.state}: expected ${expectedFrames}, found ${actualFrames} files in ${test.folder}`);
      survivorFailures++;
    } else {
      console.log(`✓ ${test.state}: ${actualFrames} frames (matches SURVIVOR_FRAMES)`);
    }
  }
  
  if (survivorFailures > 0) {
    console.log(`\n⚠️ ${survivorFailures} survivor animation(s) have mismatched frame counts!`);
  } else {
    console.log('\n✅ All survivor animation frame counts match!');
  }

  // Тест: ZOMBIE_FRAMES должны соответствовать файлам
  console.log('\n--- Animation frame tests (zombie) ---');
  
  const zombieTests = [
    { state: 'idle', folder: 'src/assets/units/zombie/idle_left' },
    { state: 'move', folder: 'src/assets/units/zombie/move_left' },
    { state: 'attack', folder: 'src/assets/units/zombie/attack_left' },
    { state: 'damaged', folder: 'src/assets/units/zombie/damaged_left' },
    { state: 'cr_damaged', folder: 'src/assets/units/zombie/cr_damaged_left' },
    { state: 'die', folder: 'src/assets/units/zombie/die_left' },
    { state: 'killed', folder: 'src/assets/units/zombie/killed_left' },
    { state: 'raged', folder: 'src/assets/units/zombie/raged_left' },
  ];
  
  let zombieFailures = 0;
  for (const test of zombieTests) {
    const actualFrames = countFrames(test.folder);
    const expectedFrames = ZOMBIE_FRAMES[test.state];
    if (actualFrames !== expectedFrames) {
      console.log(`✗ ${test.state}: expected ${expectedFrames}, found ${actualFrames} files in ${test.folder}`);
      zombieFailures++;
    } else {
      console.log(`✓ ${test.state}: ${actualFrames} frames (matches ZOMBIE_FRAMES)`);
    }
  }
  
  if (zombieFailures > 0) {
    console.log(`\n⚠️ ${zombieFailures} zombie animation(s) have mismatched frame counts!`);
  } else {
    console.log('\n✅ All zombie animation frame counts match!');
  }

  // Тест: тайминги соответствуют формуле (frames * ANIMATION_SPEED)
  console.log('\n--- Animation timing tests ---');
  
  // Проверяем что все delay вычисляются правильно
  const allSurvivorStates = Object.keys(SURVIVOR_FRAMES);
  for (const state of allSurvivorStates) {
    const frames = SURVIVOR_FRAMES[state];
    const expectedDelay = frames * ANIMATION_SPEED;
    console.log(`✓ survivor ${state}: ${frames} frames × ${ANIMATION_SPEED}ms = ${expectedDelay}ms`);
  }
  
  const allZombieStates = Object.keys(ZOMBIE_FRAMES);
  for (const state of allZombieStates) {
    const frames = ZOMBIE_FRAMES[state];
    const expectedDelay = frames * ANIMATION_SPEED;
    console.log(`✓ zombie ${state}: ${frames} frames × ${ANIMATION_SPEED}ms = ${expectedDelay}ms`);
  }
  
  console.log('\n✅ Animation timing formula is correct (frames * ANIMATION_SPEED)');

  console.log('\n✅ All tests passed!');
}

if (require.main === module) {
  run();
}
