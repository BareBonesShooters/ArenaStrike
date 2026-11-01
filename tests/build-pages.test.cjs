const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { compileCodes, manifestScript, readItemIds, buildSite } = require('../scripts/build-pages.cjs');
const { boot } = require('./game-harness.cjs');
const root = path.join(__dirname, '..');
const ids = readItemIds(root);

test('secret configuration produces redeemable hashes, items and coins without plaintext', async () => {
  const script = manifestScript(compileCodes(JSON.stringify({
    '  secret-gift_529  ': { items: ['s_dev', 'p_dev'], coins: 250 },
    'Coins-only': { coins: 5000 },
  }), ids));
  assert.equal(script.toUpperCase().includes('SECRET-GIFT_529'), false);
  assert.equal(script.toUpperCase().includes('COINS-ONLY'), false);
  const game = boot(undefined, script);
  const initial = game.run('S.coins');
  assert.equal((await game.redeem('Secret-Gift_529')).ok, true);
  assert.equal(game.run('S.own.s_dev && S.own.p_dev'), 1);
  assert.equal((await game.redeem('coins-only')).ok, true);
  assert.equal(game.run('S.coins'), initial + 5250);
  const nextDeployment = boot(game.storage.get('arena3dv2_device'), script);
  assert.equal((await nextDeployment.redeem('coins-only')).ok, false);
});

test('invalid secrets fail without echoing codes or secret contents', () => {
  const secret = 'PRIVATE-VALUE-579';
  const invalid = [
    '', '{"' + secret + '":', 'null', '[]',
    JSON.stringify({ [secret]: { coins: -1 } }),
    JSON.stringify({ [secret]: { coins: 1.5 } }),
    JSON.stringify({ [secret]: { coins: '50' } }),
    JSON.stringify({ [secret]: { coins: Number.MAX_SAFE_INTEGER + 1 } }),
    JSON.stringify({ [secret]: { items: ['unknown-item'] } }),
    JSON.stringify({ [secret]: { items: 's_dev' } }),
    JSON.stringify({ [secret]: { items: null } }),
    JSON.stringify({ [secret]: { coin: 100 } }),
    JSON.stringify({ [secret]: {} }),
    JSON.stringify({ [secret]: null }),
    JSON.stringify({ [secret + '!']: { coins: 50 } }),
    JSON.stringify({ ['A'.repeat(65)]: { coins: 50 } }),
    JSON.stringify({ [secret]: { coins: 10 }, [secret.toLowerCase()]: { coins: 20 } }),
  ];
  for (const raw of invalid) {
    assert.throws(() => compileCodes(raw, ids), error => {
      assert.match(error.message, /GAME_CODES/);
      assert.equal(error.message.includes(secret), false);
      return true;
    });
  }
});

test('empty secret object explicitly removes all codes', async () => {
  const game = boot(undefined, manifestScript(compileCodes('{}', ids)));
  assert.equal((await game.redeem('DEV')).ok, false);
});

test('deployment copies only game assets and preserves the previous build on invalid configuration', async t => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'arena-codes-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  for (const name of ['index.html', 'css', 'js']) fs.cpSync(path.join(root, name), path.join(fixture, name), { recursive: true });
  fs.writeFileSync(path.join(fixture, 'secret.txt'), 'DO-NOT-PUBLISH');
  const secret = 'HIDDEN-GIFT-972';
  const output = buildSite(fixture, JSON.stringify({ [secret]: { coins: 999 } }));
  assert.deepEqual(fs.readdirSync(output).sort(), ['.nojekyll', 'css', 'index.html', 'js']);
  const index = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
  assert.ok(index.indexOf('js/reward-codes.js') < index.indexOf('js/01-core.js'));
  for (const [, file] of index.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)"/g)) assert.ok(fs.existsSync(path.join(output, file)), file);
  const registry = fs.readFileSync(path.join(output, 'js/reward-codes.js'), 'utf8');
  for (const file of ['index.html', 'css/style.css', ...fs.readdirSync(path.join(output, 'js')).map(name => 'js/' + name)]) {
    assert.equal(fs.readFileSync(path.join(output, file), 'utf8').includes(secret), false, file);
  }
  assert.equal((await boot(undefined, registry).redeem(secret)).coins, 999);
  assert.throws(() => buildSite(fixture, ''), /GAME_CODES/);
  assert.equal(fs.readFileSync(path.join(output, 'js/reward-codes.js'), 'utf8'), registry);
});

test('CLI fails cleanly on malformed secret JSON without disclosing its content', () => {
  const secret = 'DO-NOT-PRINT-THIS-PRIVATE-VALUE';
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/build-pages.cjs')], {
    encoding: 'utf8', env: { ...process.env, GAME_CODES: '{"' + secret + '":' },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /valid JSON/);
  assert.equal((result.stdout + result.stderr).includes(secret), false);
});
