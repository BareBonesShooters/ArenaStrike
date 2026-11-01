const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto, createHash } = require('node:crypto');
const root = path.join(__dirname, '..');

function boot(saved, registry = fs.readFileSync(path.join(root, 'js/reward-codes.js'), 'utf8')) {
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
  vm.runInContext(registry, context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/01-core.js'), 'utf8'), context);
  const run = code => vm.runInContext(code, context);
  return {
    run, storage, context,
    redeem(code) { context.input = code; return run('redeemCode(input)'); },
    addCode(code, reward) {
      const hash = createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
      context.ARENA_REWARD_CODES.rewards[hash] = reward;
    },
  };
}
module.exports = { boot };
