#!/usr/bin/env node
// npm run perf: measures draw calls, triangles and GPU frame time per quality tier on fixed camera views,
// and compares with tools/perf-baseline.json (committed, so every session shares the same budget).
//   fails when draw calls or triangles grow more than 10% on any tier,
//   or frame time grows more than 25% (and over 0.5 ms) on Low or Potato.
// npm run perf -- --approve    record the current numbers as the new baseline (do this when a cost increase is intended)
// Frame times come from this Mac's GPU, so they are only compared against a baseline made on the same machine.
import fs from "node:fs";
import path from "node:path";
import { openGame, freezeLoop, ROOT } from "./lib/browser.mjs";
import { TIER_NAMES, renderView } from "./lib/scene.mjs";

const argv = process.argv.slice(2);
const approve = argv.includes("--approve");
const MAPS = ["meadow", "ruin", "lv:hollow", "lv:forge"], VIEWS = ["eye", "overview"], RUNS = 5;
const FILE = path.join(ROOT, "tools", "perf-baseline.json");
const t0 = Date.now();
const cur = {};
for (let tier = 0; tier < 5; tier++) {
  const g = await openGame({ tier });
  await freezeLoop(g.page);
  for (const map of MAPS) for (const view of VIEWS) {
    const ms = []; let r;
    for (let i = 0; i < RUNS; i++) { r = await renderView(g.page, { map, view, tier, png: false, reps: 20 }); ms.push(r.ms); }
    ms.sort((a, b) => a - b);
    cur[`${TIER_NAMES[tier]} ${map} ${view}`] = { calls: r.calls, tris: r.tris, ms: +ms[RUNS >> 1].toFixed(2) };
  }
  if (g.errors.length) { console.log("perf: page errors on " + TIER_NAMES[tier]); g.errors.forEach(e => console.log("  " + e)); }
  await g.close();
}

const pad = (s, n) => String(s).padEnd(n);
if (approve || !fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, JSON.stringify({ note: "Made by npm run perf -- --approve. Frame times are from the machine that recorded them.", made: new Date().toISOString().slice(0, 10), data: cur }, null, 1) + "\n");
  console.log(`perf: baseline written to tools/perf-baseline.json (${Object.keys(cur).length} views)`);
  process.exit(0);
}
const base = JSON.parse(fs.readFileSync(FILE, "utf8")).data;
const fails = [], lines = [];
for (const [k, c] of Object.entries(cur)) {
  const b = base[k]; if (!b) { lines.push(`  new   ${k}`); continue; }
  const pc = (a, z) => z ? ((a - z) / z * 100) : 0;
  const dc = pc(c.calls, b.calls), dt = pc(c.tris, b.tris), dm = pc(c.ms, b.ms);
  const cheap = k.startsWith("low") || k.startsWith("potato");
  const why = [];
  if (dc > 10) why.push(`draw calls +${dc.toFixed(0)}%`);
  if (dt > 10) why.push(`triangles +${dt.toFixed(0)}%`);
  if (cheap && dm > 25 && c.ms - b.ms > .5) why.push(`frame time +${dm.toFixed(0)}%`);
  if (why.length) fails.push(`${k}: ${why.join(", ")}`);
  lines.push(`  ${why.length ? "OVER" : "ok  "}  ${pad(k, 28)} calls ${pad(c.calls + ` (${dc >= 0 ? "+" : ""}${dc.toFixed(0)}%)`, 12)} tris ${pad(c.tris + ` (${dt >= 0 ? "+" : ""}${dt.toFixed(0)}%)`, 16)} ${c.ms} ms (${dm >= 0 ? "+" : ""}${dm.toFixed(0)}%)`);
}
console.log(`perf: ${Object.keys(cur).length} views in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${fails.length} over budget`);
if (argv.includes("--all") || fails.length) lines.forEach(l => console.log(l));
process.exit(fails.length ? 1 : 0);
