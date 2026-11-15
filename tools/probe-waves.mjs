#!/usr/bin/env node
// node tools/probe-waves.mjs   plays Monster Rush waves 1-4 on Haunted Hollow (the "rise" level) in headless Chromium,
// killing every monster the moment it appears, and checks two things the HUD promises:
//  1. no monster appears after its wave was announced as cleared (a dead monster rising late used to leak into the break / next wave)
//  2. the "monsters left" counter never goes up mid-wave (it used to drop on a kill, then jump back when that monster rose)
// Exit code 1 on any violation. Deterministic: the harness seeds Math.random.
import { openGame, sleep } from "./lib/browser.mjs";

const RUNS = +(process.argv[2] || 5);
const g = await openGame({ tier: 4 });
const bad = [];
let clears = 0, risers = 0;
for (let run = 0; run < RUNS; run++) {
  await g.page.evaluate(seed => { window.__reseed(seed); state = "lobby"; startGame0("waves"); P.fz = 0; }, 1000 + run);
  const r = await g.page.evaluate(async () => {
    const out = { bad: [], clears: 0, risers: 0 }, seen = new WeakSet();
    let lastLeft = -1, lastWave = wave;
    const t0 = performance.now();
    while (performance.now() - t0 < 30000 && wave <= 4 && state === "play") {
      P.hp = P.max; P.prot = 99; menuOpen && document.querySelector("#puov .puc")?.click();
      const left = E.length + wq + (typeof wPend !== "undefined" ? wPend.size : 0);
      for (const e of E) if (!seen.has(e)) {
        seen.add(e); if (e.lvRisen) out.risers++;
        if (wn > 0 && !e.boss) out.bad.push(`wave ${wave}: a ${e.lvRisen ? "risen " : ""}monster appeared after the wave was cleared (break timer ${wn.toFixed(2)})`);
      }
      if (wave === lastWave && wn === 0 && lastLeft >= 0 && left > lastLeft && !E.some(e => e.champion)) out.bad.push(`wave ${wave}: counter went up ${lastLeft} -> ${left}`);
      if (wave !== lastWave) { lastWave = wave; lastLeft = -1 } else lastLeft = wn > 0 ? -1 : left;
      if (wn > 0 && wn < 1e8 && !out._c) { out.clears++; out._c = 1 } if (wn === 0) out._c = 0;
      for (const e of E.slice()) if (!e.boss && !(e.em > 0)) killE(e, false);
      await new Promise(r => setTimeout(r, 50));
    }
    return out;
  });
  clears += r.clears; risers += r.risers; bad.push(...r.bad.map(b => `run ${run}: ${b}`));
}
await g.close();
for (const b of bad) console.log("  FAIL " + b);
console.log(`probe-waves: ${clears} wave clears, ${risers} risen monsters, ${bad.length} problems${g.errors.length ? ", page errors: " + g.errors.length : ""}`);
for (const e of g.errors.slice(0, 5)) console.log("  " + e);
process.exit(bad.length || g.errors.length ? 1 : 0);
