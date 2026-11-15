#!/usr/bin/env node
// node tools/probe-lag.mjs [modes] [tier]   plays each mode for a few seconds with the real game loop and reports
// frame-time percentiles, long frames, draw calls, and (with --profile) the hottest JS functions by self time.
// Used to find mode-specific lag (the tutorial was much slower than other modes).
import { openGame, sleep } from "./lib/browser.mjs";

const argv = process.argv.slice(2).filter(a => !a.startsWith("--"));
const modes = (argv[0] || "tut,duel,waves").split(",");
const tier = +(argv[1] ?? 2);
const profile = process.argv.includes("--profile");
const g = await openGame({ tier });
const cdp = await g.page.context().newCDPSession(g.page);
for (const m of modes) {
  await g.page.evaluate(m => { state = "lobby"; startGame0(m); P.fz = 0; }, m);
  await sleep(1500);
  if (profile) { await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 200 }); await cdp.send("Profiler.start"); }
  const r = await g.page.evaluate(async () => {
    const dts = [], cpu = []; let last = performance.now(), calls = 0, tris = 0, n = 0;
    const raf = window.requestAnimationFrame.bind(window);
    await new Promise(done => {
      const t0 = performance.now();
      const tick = now => { dts.push(now - last); last = now; try { calls += rd.info.render.calls; tris += rd.info.render.triangles; n++ } catch (e) {} if (now - t0 < 5000) raf(tick); else done() };
      raf(tick);
    });
    dts.sort((a, b) => a - b); const q = p => +dts[Math.floor(dts.length * p)].toFixed(1);
    return { frames: dts.length, p50: q(.5), p95: q(.95), max: +dts[dts.length - 1].toFixed(1), long: dts.filter(d => d > 25).length, calls: Math.round(calls / Math.max(1, n)), tris: Math.round(tris / Math.max(1, n)), ents: (typeof E !== "undefined" ? E.length : -1), state };
  });
  console.log(`${m.padEnd(7)} frames ${r.frames}  p50 ${r.p50}ms  p95 ${r.p95}ms  max ${r.max}ms  long>25ms ${r.long}  calls ${r.calls}  tris ${r.tris}  ents ${r.ents} ${r.state}`);
  if (profile) {
    const { profile: pr } = await cdp.send("Profiler.stop");
    const self = new Map(), byId = new Map(pr.nodes.map(n => [n.id, n]));
    const dt = pr.timeDeltas; const counts = new Map();
    pr.samples.forEach((id, i) => counts.set(id, (counts.get(id) || 0) + (dt[i] || 0)));
    for (const [id, us] of counts) { const n = byId.get(id), cf = n.callFrame, k = `${cf.functionName || "(anon)"} ${cf.url.split("/").pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + us); }
    const tot = [...self.values()].reduce((a, b) => a + b, 0);
    [...self].sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, us]) => console.log(`   ${(us / 1000).toFixed(0).padStart(6)}ms ${(100 * us / tot).toFixed(1).padStart(5)}%  ${k}`));
  }
}
await g.close();
if (g.errors.length) { console.log("page errors:"); g.errors.slice(0, 5).forEach(e => console.log("  " + e)); }
