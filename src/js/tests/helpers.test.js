// Простые unit-тесты для утилит helpers.js
// Запускаются через Node: node src/js/tests/helpers.test.js

const assert = require('assert');

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

  console.log('\n✅ All tests passed!');
}

if (require.main === module) {
  run();
}
