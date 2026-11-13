#!/usr/bin/env node
// npm run smoke: plays every offline mode for a few seconds in headless Chromium and checks that nothing breaks.
//  per mode: starts and reaches "play", loop runs with no errors, player/camera/enemy numbers stay finite,
//            pause -> resume works, quit cleans up overlays.
//  Monster Rush extra: power-up picker opens, Escape pauses over it, resume keeps it open, picking closes it,
//            nextWave advances the wave.
// npm run smoke -- --modes waves,duel   only some modes.   --secs 4   seconds of play per mode (default 2.5)
import { openGame, sleep } from "./lib/browser.mjs";

const argv = process.argv.slice(2);
const opt = k => { const i = argv.indexOf("--" + k); return i < 0 ? null : argv[i + 1]; };
const MODES = (opt("modes") || "duel,gg,waves,range,tut,parkour,duel1").split(",");
const SECS = +(opt("secs") || 2.5);
const t0 = Date.now();
const g = await openGame({ tier: 2 });
const { page } = g;
const results = [];

const health = () => page.evaluate(() => {
  const bad = [];
  const fin = (v, n) => { if (!Number.isFinite(v)) bad.push(n + "=" + v); };
  fin(P.x, "P.x"); fin(P.y, "P.y"); fin(P.z, "P.z"); fin(P.hp, "P.hp"); fin(P.yaw, "P.yaw");
  fin(cam.position.x, "cam.x"); fin(cam.position.y, "cam.y"); fin(cam.position.z, "cam.z"); fin(cam.fov, "cam.fov");
  if (P.y < -40 || P.y > 400) bad.push("P.y out of range " + P.y.toFixed(1));
  if (P.hp > P.max + 1e-6) bad.push(`P.hp ${P.hp} > max ${P.max}`);
  for (const e of E) { const p = e.g && e.g.position; if (p && !(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z))) bad.push("enemy position NaN"); if (e.hp != null && !Number.isFinite(e.hp)) bad.push("enemy hp NaN"); }
  return { bad, loopErr: typeof loopErr === "string" ? loopErr : "", state, fr, enemies: E.length, wave };
});

async function step(name, fn) {
  try { const r = await fn(); return r; } catch (e) { throw new Error(`${name}: ${e.message.split("\n")[0]}`); }
}

for (const m of MODES) {
  const errBefore = g.errors.length;
  const fails = [];
  try {
    await step("start", () => page.evaluate(m => {
      if (state !== "lobby" && state !== "title") { try { quit(); } catch (e) {} }
      if (typeof Title === "object" && state === "title") { try { Title.end && Title.end(); } catch (e) {} state = "lobby"; }
      if (m === "parkour") pkPicked = true;
      startGame0(m);
    }, m));
    await sleep(300);
    let h = await health();
    if (h.state !== "play") fails.push(`did not reach play (state=${h.state})`);
    const fr0 = h.fr;
    await page.keyboard.down("KeyW"); await sleep(SECS * 500); await page.keyboard.up("KeyW");
    await page.keyboard.down("KeyD"); await sleep(SECS * 500); await page.keyboard.up("KeyD");
    h = await health();
    const fps = (h.fr - fr0) / SECS;
    if (fps < 10) fails.push(`loop barely ran (${fps.toFixed(0)} frames/s)`);
    if (h.loopErr) fails.push("main loop error: " + h.loopErr);
    fails.push(...h.bad);

    const pr = await page.evaluate(() => { pauseGame(); const a = state; resume(); return [a, state]; });
    if (pr[0] !== "pause" || pr[1] !== "play") fails.push(`pause/resume went ${pr.join(" -> ")}`);

    if (m === "waves") {
      const w0 = h.wave;
      const r = await page.evaluate(() => { offerPU(); return { ov: !!document.getElementById("puov"), menuOpen }; });
      if (!r.ov || !r.menuOpen) fails.push("power-up picker did not open");
      await page.keyboard.press("Escape"); await sleep(120);
      const r2 = await page.evaluate(() => ({ state, ov: !!document.getElementById("puov") }));
      if (r2.state !== "pause") fails.push(`Escape over picker gave state=${r2.state}, expected pause`);
      const r3 = await page.evaluate(() => { resume(); return { state, menuOpen, ov: !!document.getElementById("puov") }; });
      if (r3.state !== "play" || !r3.menuOpen || !r3.ov) fails.push(`resume over picker: ${JSON.stringify(r3)}`);
      const r4 = await page.evaluate(() => { const b = document.querySelector("#puov .puc"); if (b) b.click(); return { ov: !!document.getElementById("puov"), menuOpen }; });
      if (r4.ov || r4.menuOpen) fails.push("picking a power-up did not close the picker");
      const w1 = await page.evaluate(() => { nextWave(); return wave; });
      if (!(w1 > w0)) fails.push(`nextWave did not advance (wave ${w0} -> ${w1})`);
      await sleep(600);
      const h2 = await health(); fails.push(...h2.bad); if (h2.loopErr) fails.push("main loop error after wave: " + h2.loopErr);
    }

    const q = await page.evaluate(() => { quit(); return { state, ov: !!document.getElementById("puov"), playing: document.body.classList.contains("playing") }; });
    if (q.state === "play") fails.push("quit left state=play");
    if (q.ov) fails.push("quit left the power-up picker on screen");
    if (q.playing) fails.push("quit left body.playing");
    results.push({ m, fps, enemies: h.enemies });
  } catch (e) { fails.push(e.message); }
  fails.push(...g.errors.slice(errBefore));
  results[results.length - 1] && results[results.length - 1].m === m ? results[results.length - 1].fails = fails : results.push({ m, fails });
  await sleep(200);
}
await g.close();

const bad = results.filter(r => r.fails.length);
console.log(`smoke: ${results.length - bad.length}/${results.length} modes passed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
for (const r of results) {
  console.log(`  ${r.fails.length ? "FAIL" : "ok  "} ${r.m.padEnd(8)}${r.fps != null ? ` ${r.fps.toFixed(0)} fps, ${r.enemies} enemies` : ""}`);
  for (const f of r.fails) console.log("         " + f.slice(0, 300));
}
process.exit(bad.length ? 1 : 0);
