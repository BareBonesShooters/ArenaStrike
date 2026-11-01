const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const source = fs.readFileSync(path.join(__dirname, '../js/01-core.js'), 'utf8');
const uiSource = fs.readFileSync(path.join(__dirname, '../js/10-ui-pages.js'), 'utf8');
const password = process.env.ARENA_TEST_DEV_PASSWORD;

function boot(saved) {
  const storage = new Map(saved ? [['arena3dv2_device', saved]] : []);
  const rollRandom = [];
  const context = vm.createContext({
    THREE: {}, crypto: webcrypto, TextEncoder,
    rollRandom, Math: Object.assign(Object.create(Math), { random: () => rollRandom.length ? rollRandom.shift() : 0.5 }),
    document: { createElement: () => ({ getContext: () => null }) },
    navigator: { hardwareConcurrency: 4, userAgent: 'test', platform: 'test' },
    screen: { width: 1280, height: 720 }, devicePixelRatio: 1,
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  });
  vm.runInContext(source, context);
  return { run: code => vm.runInContext(code, context), storage, context };
}

test('DEV rewards are registered, locked initially and normalize case and surrounding spaces', () => {
  const game = boot();
  assert.equal(game.run('I("s_dev").n'), 'Dev');
  assert.equal(game.run('I("p_dev").n'), 'Dev');
  assert.equal(game.run('!!S.own.s_dev || !!S.own.p_dev'), false);
  assert.equal(game.run('redeemCode("  dev  ").ok'), true);
  assert.equal(game.run('S.own.s_dev === 1 && S.own.p_dev === 1'), true);
  assert.equal(game.run('DevAccess.unlocked'), false);
});

test('invalid, empty and object-property codes cannot grant rewards', () => {
  const game = boot();
  const before = game.run('JSON.stringify(S)');
  for (const value of ['', ' ', 'missing', '__proto__', 'constructor', '<script>']) {
    game.context.input = value;
    assert.equal(game.run('redeemCode(input).ok'), false);
    assert.equal(game.run('JSON.stringify(S)'), before);
  }
});

test('duplicate redemption does not change inventory or grant coins again', () => {
  const game = boot();
  game.run('REDEEM_CODES.TEST = {items:["s_dev"],coins:50}');
  const initial = game.run('S.coins');
  assert.equal(game.run('redeemCode("test").ok'), true);
  assert.equal(game.run('S.coins'), initial + 50);
  const after = game.run('JSON.stringify(S)');
  assert.equal(game.run('redeemCode(" TEST ").ok'), false);
  assert.equal(game.run('JSON.stringify(S)'), after);
});

test('reward inventory, equipment and redemption history survive a page reload', () => {
  const first = boot();
  first.run('redeemCode("DEV"); eq().s="s_dev"; eq().p="p_dev"; sv()');
  const second = boot(first.storage.get('arena3dv2_device'));
  assert.equal(second.run('S.own.s_dev === 1 && S.own.p_dev === 1'), true);
  assert.equal(second.run('eq().s'), 's_dev');
  assert.equal(second.run('eq().p'), 'p_dev');
  assert.equal(second.run('redeemCode("DEV").ok'), false);
});

test('old saves migrate without resetting coins, existing items or loadouts', () => {
  const old = { coins: 12345, own: { g1: 1, s3: 1, p2: 1 }, cur: 0, ld: [{ g: 'g1', s: 's3', p: 'p2' }] };
  const game = boot(JSON.stringify(old));
  assert.equal(game.run('S.coins'), 12345);
  assert.equal(game.run('eq().g'), 'g1');
  assert.equal(game.run('eq().s'), 's3');
  assert.equal(game.run('eq().p'), 'p2');
  assert.equal(game.run('S.redeemed.length'), 0);
  assert.equal(game.run('redeemCode("DEV").ok'), true);
});

test('invalid reward configuration is rejected without partial grants', () => {
  const game = boot();
  const before = game.run('JSON.stringify(S)');
  game.run('REDEEM_CODES.BROKEN = {items:["s_dev","does-not-exist"],coins:100}');
  assert.equal(game.run('redeemCode("BROKEN").ok'), false);
  assert.equal(game.run('JSON.stringify(S)'), before);
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
