'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

function compileCodes(raw, validIds) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('Add the GAME_CODES repository secret before deploying. Use {} to disable all reward codes.');
  }
  let codes;
  try { codes = JSON.parse(raw); }
  catch { throw new Error('GAME_CODES must contain valid JSON. Check commas, double quotes and braces.'); }
  if (!codes || typeof codes !== 'object' || Array.isArray(codes)) {
    throw new Error('GAME_CODES must be a JSON object mapping codes to rewards.');
  }
  const rewards = Object.create(null);
  for (const [index, [rawCode, reward]] of Object.entries(codes).entries()) {
    // Errors identify an entry number, never its secret code or contents.
    const invalid = reason => { throw new Error(`GAME_CODES entry ${index + 1}: ${reason}`); };
    const code = rawCode.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9_-]{0,63}$/.test(code)) invalid('use 1–64 letters, numbers, hyphens or underscores, starting with a letter or number.');
    const hash = createHash('sha256').update(code, 'utf8').digest('hex');
    if (Object.hasOwn(rewards, hash)) invalid('duplicates another code after ignoring case and surrounding spaces.');
    if (!reward || typeof reward !== 'object' || Array.isArray(reward)) invalid('reward must be an object.');
    if (Object.keys(reward).some(key => !['items', 'coins'].includes(key))) invalid('only items and coins are supported.');
    const items = reward.items === undefined ? [] : reward.items;
    const coins = reward.coins === undefined ? 0 : reward.coins;
    if (!Array.isArray(items) || items.some(id => typeof id !== 'string' || !validIds.has(id))) invalid('items must be an array of existing game item IDs.');
    if (!Number.isSafeInteger(coins) || coins < 0) invalid('coins must be a nonnegative safe whole number.');
    if (!items.length && !coins) invalid('include at least one item or a positive coin amount.');
    rewards[hash] = { items: [...new Set(items)], coins };
  }
  return { version: 1, rewards };
}

function manifestScript(manifest) {
  return '// Generated reward hashes. Plaintext codes are not included.\n' +
    'globalThis.ARENA_REWARD_CODES = ' + JSON.stringify(manifest, null, 2) + ';\n';
}

function readItemIds(root) {
  // Use the real game catalog, including dynamically registered Battle Pass items.
  const context = vm.createContext({
    THREE: {},
    document: { createElement: () => ({ getContext: () => null }) },
    navigator: { hardwareConcurrency: 4, userAgent: 'build', platform: 'build' },
    screen: { width: 1280, height: 720 }, devicePixelRatio: 1,
    localStorage: { getItem: () => null, setItem: () => {} },
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'js/01-core.js'), 'utf8'), context, { timeout: 3000 });
  return new Set(vm.runInContext('ALL.map(item => item.id)', context, { timeout: 3000 }));
}

function buildSite(root, raw) {
  root = fs.realpathSync(root);
  const manifest = compileCodes(raw, readItemIds(root));
  const output = path.resolve(root, '_site');
  // Only replace the dedicated output folder directly inside this checkout.
  if (path.dirname(output) !== root || path.basename(output) !== '_site') throw new Error('Invalid build output folder.');
  if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('Build output cannot be a symbolic link.');
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(path.join(output, 'js'), { recursive: true });
  fs.mkdirSync(path.join(output, 'css'), { recursive: true });
  // Copy only game assets. Never publish the checkout, tests, workflows or secret input.
  const assets = ['index.html', 'css/style.css'];
  for (const entry of fs.readdirSync(path.join(root, 'js'), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.js') && entry.name !== 'reward-codes.js') assets.push('js/' + entry.name);
  }
  for (const file of assets) fs.copyFileSync(path.join(root, file), path.join(output, file));
  fs.writeFileSync(path.join(output, 'js/reward-codes.js'), manifestScript(manifest));
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  return output;
}

if (require.main === module) {
  try {
    buildSite(path.resolve(__dirname, '..'), process.env.GAME_CODES);
    console.log('Game built in _site with hashed reward codes.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { compileCodes, manifestScript, readItemIds, buildSite };
