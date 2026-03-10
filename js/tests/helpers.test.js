// Простые unit-тесты для утилит helpers.js и stats.js
// Запускаются через Node (node js/tests/helpers.test.js)

const assert = require('assert');
const helpers = require('../helpers.js');
const statsMod = require('../stats.js');
const config = require('../config.js');

// Мок-нужные глобальные переменные
global.units = [];
global.COLS = config.COLS;
global.ROWS = config.ROWS;
global.WEAPONS = config.WEAPONS;
global.ITEMS = config.ITEMS;
global.stats = { zombiesKilled:0, damageDealt:0, damageTaken:0, poisonDamageTaken:0, turnsSurvived:0, battlesPlayed:0 };

function run() {
  console.log('=== Running helpers tests ===');

  // manhattan
  assert.strictEqual(helpers.manhattan({x:0,y:0},{x:3,y:4}), 7);
  assert.strictEqual(helpers.manhattan({x:5,y:5},{x:5,y:5}), 0);

  // unitAt и reachable
  global.units = [{alive:true, x:1, y:1, kind:'player'}];
  assert.deepStrictEqual(helpers.unitAt(1,1), global.units[0]);
  assert.strictEqual(helpers.unitAt(0,0), null);

  // reachable: player with moveRange 2, no obstacles
  const unit = {x:1,y:1,moveRange:2,kind:'player',hp:0,maxHp:0,atkRange:0,weapon:'',poisoned:false,moved:false,attacked:false,alive:true};
  global.units = [unit];
  const cells = helpers.reachable(unit);
  // should include 4 neighbors at distance1 and some distance2
  assert(cells.some(c=>c[0]===1&&c[1]===2));
  assert(cells.every(([c,r])=>Math.abs(c-1)+Math.abs(r-1)<=2));

  // calcDamage randomness - run many times to ensure within bounds
  // Теперь возвращает массив [dmg]
  for (let i=0;i<100;i++) {
    const dmgArr = helpers.calcDamage('pistol');
    const dmg = dmgArr[0];
    assert(dmg === 1 || dmg === 2);
  }

  // stats module
  statsMod.resetStats();
  let st = statsMod.getStats();
  assert.deepStrictEqual(st, {zombiesKilled:0,damageDealt:0,damageTaken:0,poisonDamageTaken:0,turnsSurvived:0,battlesPlayed:0});
  statsMod.recordKill();
  statsMod.recordDamageDealt(5);
  statsMod.recordDamageTaken(2);
  statsMod.recordPoisonDamage(1);
  st = statsMod.getStats();
  assert.strictEqual(st.zombiesKilled,1);
  assert.strictEqual(st.damageDealt,5);
  assert.strictEqual(st.damageTaken,2);
  assert.strictEqual(st.poisonDamageTaken,1);

  console.log('Helpers tests passed.');
}

if (require.main === module) {
  run();
}
