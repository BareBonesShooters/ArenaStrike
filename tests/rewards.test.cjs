const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { boot } = require('./game-harness.cjs');

const uiSource = fs.readFileSync(path.join(__dirname, '../js/10-ui-pages.js'), 'utf8');
const password = process.env.ARENA_TEST_DEV_PASSWORD;

test('DEV rewards are registered, locked initially and normalize case and surrounding spaces', async () => {
  const game = boot();
  assert.equal(game.run('I("s_dev").n'), 'Dev');
  assert.equal(game.run('I("p_dev").n'), 'Dev');
  assert.equal(game.run('!!S.own.s_dev || !!S.own.p_dev'), false);
  assert.equal((await game.redeem('  dev  ')).ok, true);
  assert.equal(game.run('S.own.s_dev === 1 && S.own.p_dev === 1'), true);
  assert.equal(game.run('DevAccess.unlocked'), false);
});

test('invalid, empty and object-property codes cannot grant rewards', async () => {
  const game = boot();
  const before = game.run('JSON.stringify(S)');
  for (const value of ['', ' ', 'missing', '__proto__', 'constructor', '<script>']) {
    assert.equal((await game.redeem(value)).ok, false);
    assert.equal(game.run('JSON.stringify(S)'), before);
  }
});

test('duplicate redemption does not change inventory or grant coins again', async () => {
  const game = boot();
  game.addCode('TEST', { items: ['s_dev'], coins: 50 });
  const initial = game.run('S.coins');
  assert.equal((await game.redeem('test')).ok, true);
  assert.equal(game.run('S.coins'), initial + 50);
  const after = game.run('JSON.stringify(S)');
  assert.equal((await game.redeem(' TEST ')).ok, false);
  assert.equal(game.run('JSON.stringify(S)'), after);
});

test('reward inventory, equipment and redemption history survive a page reload', async () => {
  const first = boot();
  await first.redeem('DEV');
  first.run('eq().s="s_dev"; eq().p="p_dev"; sv()');
  const second = boot(first.storage.get('arena3dv2_device'));
  assert.equal(second.run('S.own.s_dev === 1 && S.own.p_dev === 1'), true);
  assert.equal(second.run('eq().s'), 's_dev');
  assert.equal(second.run('eq().p'), 'p_dev');
  assert.equal((await second.redeem('DEV')).ok, false);
});

test('old saves migrate without resetting coins, existing items or loadouts', async () => {
  const old = { coins: 12345, own: { g1: 1, s3: 1, p2: 1 }, cur: 0, ld: [{ g: 'g1', s: 's3', p: 'p2' }] };
  const game = boot(JSON.stringify(old));
  assert.equal(game.run('S.coins'), 12345);
  assert.equal(game.run('eq().g'), 'g1');
  assert.equal(game.run('eq().s'), 's3');
  assert.equal(game.run('eq().p'), 'p2');
  assert.equal(game.run('S.redeemed.length'), 0);
  assert.equal((await game.redeem('DEV')).ok, true);
});

test('invalid reward configuration is rejected without partial grants', async () => {
  const game = boot();
  const before = game.run('JSON.stringify(S)');
  game.addCode('BROKEN', { items: ['s_dev', 'does-not-exist'], coins: 100 });
  assert.equal((await game.redeem('BROKEN')).ok, false);
  assert.equal(game.run('JSON.stringify(S)'), before);
});

test('old plaintext claims still prevent duplicate rewards', async () => {
  const game = boot(JSON.stringify({ redeemed: ['DEV'], coins: 1234 }));
  const before = game.run('JSON.stringify(S)');
  const result = await game.redeem(' dev ');
  assert.equal(result.ok, false);
  assert.match(result.message, /already redeemed/);
  assert.equal(game.run('JSON.stringify(S)'), before);
});

test('simultaneous submissions award a code once and save only its hash', async () => {
  const game = boot();
  game.addCode('PRIVATE-COIN-REWARD', { items: [], coins: 50 });
  const initial = game.run('S.coins');
  const results = await Promise.all([game.redeem('PRIVATE-COIN-REWARD'), game.redeem('private-coin-reward')]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(game.run('S.coins'), initial + 50);
  assert.match(game.run('S.redeemed[0]'), /^sha256:[a-f0-9]{64}$/);
  assert.equal(game.storage.get('arena3dv2_device').includes('PRIVATE-COIN-REWARD'), false);
});

test('missing registry and unavailable crypto show useful errors without rewards', async () => {
  const game = boot(undefined, '');
  const before = game.run('JSON.stringify(S)');
  assert.match((await game.redeem('DEV')).message, /Refresh/);
  assert.equal(game.run('JSON.stringify(S)'), before);
  const insecure = boot();
  insecure.run('crypto = undefined');
  await assert.rejects(insecure.redeem('DEV'), /HTTPS or localhost/);
});

test('Dev cosmetics are excluded from case rolls and the item shop', () => {
  const game = boot();
  // Execute the actual shop logic without initializing its DOM or WebGL previews.
  game.run(uiSource.slice(uiSource.indexOf('function roll(c)'), uiSource.indexOf('function wonHTML')));
  game.run(uiSource.slice(uiSource.indexOf('const IPM='), uiSource.indexOf('const itemTotal=')));
  for (const name of ['Skin Case', 'Outfit Case', 'Royal Outfit Case']) {
    game.context.caseName = name;
    // Force a Secret roll and choose its last item, where the new Dev items sit.
    assert.equal(game.run('rollRandom.push(0,0.999999); !!roll(CS.find(c=>c.n===caseName)).codeOnly'), false);
  }
  assert.equal(game.run('itemPrice(I("s_dev"))'), 0);
  assert.equal(game.run('itemPrice(I("p_dev"))'), 0);
  assert.equal(game.run('ITC.some(category=>category[2].some(item=>item.codeOnly))'), false);
});

test('saved Grind preferences and fake developer flags cannot unlock Grind mode', () => {
  const game = boot(JSON.stringify({ opt: { grind: true }, developer: true, devUnlocked: true }));
  assert.equal(game.run('DevAccess.unlocked'), false);
  assert.equal(game.run('DevAccess.canGrind("waves",false)'), false);
});

test('wrong passwords and the cosmetic code do not unlock developer access', async () => {
  const game = boot();
  for (const value of ['', 'DEV', 'incorrect']) {
    game.context.input = value;
    assert.equal(await game.run('DevAccess.unlock(input)'), false);
    assert.equal(game.run('DevAccess.unlocked'), false);
  }
});

test('developer password is case-sensitive; access is solo-only, opt-in and session-only', { skip: !password }, async () => {
  const game = boot();
  game.context.input = password.toLowerCase();
  assert.equal(await game.run('DevAccess.unlock(input)'), false);
  game.context.input = password;
  assert.equal(await game.run('DevAccess.unlock(input)'), true);
  assert.equal(game.run('DevAccess.canGrind("waves",false)'), false);
  game.run('S.opt={grind:true}; sv()');
  assert.equal(game.run('DevAccess.canGrind("waves",false)'), true);
  assert.equal(game.run('DevAccess.canGrind("waves",true)'), false);
  assert.equal(game.run('DevAccess.canGrind("duel",false)'), false);
  const reloaded = boot(game.storage.get('arena3dv2_device'));
  assert.equal(reloaded.run('DevAccess.canGrind("waves",false)'), false);
  game.run('DevAccess.lock()');
  assert.equal(game.run('DevAccess.unlocked'), false);
  assert.equal(game.run('S.opt.grind'), false);
});

test('locking cancels a pending developer password check', { skip: !password }, async () => {
  const game = boot();
  game.context.input = password;
  const result = game.run('DevAccess.unlock(input)');
  game.run('DevAccess.lock()');
  assert.equal(await result, false);
  assert.equal(game.run('DevAccess.unlocked'), false);
});
