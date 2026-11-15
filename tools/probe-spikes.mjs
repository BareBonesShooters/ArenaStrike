#!/usr/bin/env node
// node tools/probe-spikes.mjs [modes] [tier] [secs]   plays each mode actively (holding fire, killing enemies,
// running waves back to back) with the real game loop, counts long frames (>25 ms, a visible hitch at 60 Hz),
// and lists the functions that were on the CPU during those long frames, so a lag spike points at its cause.
import { openGame, sleep } from "./lib/browser.mjs";

const a = process.argv.slice(2).filter(x => !x.startsWith("--"));
const modes = (a[0] || "waves,duel,gg").split(","), tier = +(a[1] ?? 2), secs = +(a[2] || 10);
const g = await openGame({ tier });
// --nochecks: run as players do, without three.js shader error checks (the harness turns them on)
if (process.argv.includes("--nochecks")) await g.page.evaluate(() => { rd.debug.checkShaderErrors = false; });
const cdp = await g.page.context().newCDPSession(g.page);
await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 250 });
let total = 0;
for (const m of modes) {
  await g.page.evaluate(m => { state = "lobby"; startGame0(m); P.fz = 0; }, m);
  await sleep(1200);
  await cdp.send("Profiler.start");
  const r = await g.page.evaluate(async secs => {
    const raf = window.requestAnimationFrame.bind(window), longs = []; let last = performance.now(), n = 0;
    const t0 = performance.now(); let k = 0;
    await new Promise(done => {
      const tick = now => {
        const dt = now - last; if (dt > 25 && n > 3) longs.push([last - t0, now - t0, +dt.toFixed(1)]); last = now; n++;
        try { // play: stay alive, hold fire, kill something every ~0.4 s, start the next wave as soon as one clears
          P.hp = P.max; P.prot = 99; firing = true; if (menuOpen) document.querySelector("#puov .puc")?.click();
          if (++k % 24 === 0) { const e = E.find(e => !e.boss && !(e.em > 0)); if (e) killE(e, k % 48 === 0); }
          if (mode === "waves" && !E.length && wq <= 0 && wn > 0 && wn < 1e8) wn = .01;
        } catch (e) {}
        if (now - t0 < secs * 1000) raf(tick); else done();
      };
      raf(tick);
    });
    firing = false;
    return { frames: n, longs, wave: typeof wave !== "undefined" ? wave : 0 };
  }, secs);
  const { profile: pr } = await cdp.send("Profiler.stop");
  // attribute samples to long frames (profile time is relative to its start, which is within a few ms of t0)
  const byId = new Map(pr.nodes.map(n => [n.id, n])), parent = new Map();
  for (const n of pr.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const hot = new Map(); let t = 0;
  pr.samples.forEach((id, i) => {
    t += (pr.timeDeltas[i] || 0) / 1000; const d = (pr.timeDeltas[i] || 0) / 1000;
    if (!r.longs.some(([s, e]) => t >= s - 2 && t <= e + 2)) return;
    // credit the leaf and the nearest game-code frame above it
    let x = id, leaf = byId.get(id).callFrame, game = null;
    while (x != null) { const cf = byId.get(x).callFrame; if (!game && /\/js\/\d/.test(cf.url)) game = cf; x = parent.get(x); }
    const lk = `${leaf.functionName || "(" + (leaf.url ? "anon" : leaf.functionName || "native") + ")"} ${leaf.url.split("/").pop()}:${leaf.lineNumber + 1}`;
    const gk = game ? `${game.functionName || "(anon)"} ${game.url.split("/").pop()}:${game.lineNumber + 1}` : "-";
    const key = lk + "  <=  " + gk; hot.set(key, (hot.get(key) || 0) + d);
  });
  total += r.longs.length;
  console.log(`${m.padEnd(6)} ${r.frames} frames, ${r.longs.length} long (>25ms)${m === "waves" ? ", reached wave " + r.wave : ""}: ${r.longs.slice(0, 12).map(l => l[2]).join(" ")}`);
  [...hot].filter(([k]) => !k.startsWith("(idle)")).sort((x, y) => y[1] - x[1]).slice(0, 12).forEach(([k, ms]) => console.log(`   ${ms.toFixed(1).padStart(7)}ms  ${k}`));
}
await g.close();
if (g.errors.length) { console.log("page errors:"); g.errors.slice(0, 5).forEach(e => console.log("  " + e)); }
console.log(`probe-spikes: ${total} long frames`);
