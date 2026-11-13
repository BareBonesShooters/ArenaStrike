#!/usr/bin/env node
// npm run shots                     render every map x view x tier into shots/current and compare with shots/baseline
// npm run shots -- --approve        accept the current pictures as the new baseline
// npm run shots -- --maps meadow,lv:hollow --views eye,ground --tiers 0,4    render a subset
// npm run shots -- --quick          one view per map (eye), Ultra and Potato only
// Writes shots/report.html (baseline | current | difference, most-changed first). Exit code 1 when a picture changed
// more than the threshold (default 1.5% of pixels) or the page logged an error.
import fs from "node:fs";
import path from "node:path";
import { openGame, freezeLoop, ROOT } from "./lib/browser.mjs";
import { VIEWS, MAPS, TIER_NAMES, renderView } from "./lib/scene.mjs";

const argv = process.argv.slice(2);
const opt = k => { const i = argv.indexOf("--" + k); return i < 0 ? null : argv[i + 1]; };
const has = k => argv.includes("--" + k);
const quick = has("quick");
const maps = (opt("maps") || [...MAPS.outdoor, ...MAPS.levels].join(",")).split(",");
const views = (opt("views") || (quick ? "eye" : Object.keys(VIEWS).join(","))).split(",");
const tiers = (opt("tiers") || "0,4").split(",").map(Number);
const threshold = +(opt("threshold") || 1.5);
const DIR = path.join(ROOT, "shots"), CUR = path.join(DIR, "current"), BASE = path.join(DIR, "baseline");

if (has("approve")) {
  if (!fs.existsSync(CUR)) { console.error("No shots/current yet. Run npm run shots first."); process.exit(1); }
  fs.mkdirSync(BASE, { recursive: true });
  let n = 0; for (const f of fs.readdirSync(CUR)) { fs.copyFileSync(path.join(CUR, f), path.join(BASE, f)); n++; }
  console.log(`Approved ${n} pictures as the new baseline.`); process.exit(0);
}

fs.mkdirSync(CUR, { recursive: true });
const t0 = Date.now();
const names = [];
const errors = [];
for (const tier of tiers) {
  const g = await openGame({ tier });
  await freezeLoop(g.page);
  for (const map of maps) for (const view of views) {
    const name = `${map.replace(":", "-")}_${view}_${TIER_NAMES[tier]}.png`;
    try {
      const r = await renderView(g.page, { map, view, tier });
      fs.writeFileSync(path.join(CUR, name), Buffer.from(r.png.split(",")[1], "base64"));
      names.push(name);
    } catch (e) { errors.push(`${name}: ${e.message.split("\n")[0]}`); }
  }
  errors.push(...g.errors.map(e => `[${TIER_NAMES[tier]}] ${e}`));
  await g.close();
}

// compare with baseline inside a blank browser page (no image library needed)
const rows = [];
const haveBase = fs.existsSync(BASE);
if (haveBase) {
  const { chromium } = await import("playwright-core");
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  for (const name of names) {
    const bf = path.join(BASE, name);
    if (!fs.existsSync(bf)) { rows.push({ name, pct: null }); continue; }
    const a = "data:image/png;base64," + fs.readFileSync(bf).toString("base64");
    const c = "data:image/png;base64," + fs.readFileSync(path.join(CUR, name)).toString("base64");
    const r = await p.evaluate(async ({ a, c }) => {
      const load = s => new Promise(k => { const i = new Image(); i.onload = () => k(i); i.src = s; });
      const [ia, ic] = await Promise.all([load(a), load(c)]);
      const w = ic.width, h = ic.height, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const x = cv.getContext("2d"); x.drawImage(ia, 0, 0, w, h); const da = x.getImageData(0, 0, w, h);
      x.clearRect(0, 0, w, h); x.drawImage(ic, 0, 0); const dc = x.getImageData(0, 0, w, h);
      const out = x.createImageData(w, h); let n = 0;
      for (let i = 0; i < da.data.length; i += 4) {
        const d = Math.abs(da.data[i] - dc.data[i]) + Math.abs(da.data[i + 1] - dc.data[i + 1]) + Math.abs(da.data[i + 2] - dc.data[i + 2]);
        const g = dc.data[i] * .3 + dc.data[i + 1] * .59 + dc.data[i + 2] * .11;
        if (d > 48) { n++; out.data[i] = 255; out.data[i + 1] = 40; out.data[i + 2] = 90; } else { out.data[i] = out.data[i + 1] = out.data[i + 2] = g * .35; }
        out.data[i + 3] = 255;
      }
      x.putImageData(out, 0, 0);
      return { pct: n / (w * h) * 100, diff: cv.toDataURL("image/png") };
    }, { a, c });
    fs.mkdirSync(path.join(DIR, "diff"), { recursive: true });
    fs.writeFileSync(path.join(DIR, "diff", name), Buffer.from(r.diff.split(",")[1], "base64"));
    rows.push({ name, pct: r.pct });
  }
  await b.close();
} else rows.push(...names.map(name => ({ name, pct: null })));

rows.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
const changed = rows.filter(r => r.pct != null && r.pct > threshold);
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const html = `<!doctype html><meta charset="utf-8"><title>Arena Strike shots</title>
<style>body{font:14px system-ui;background:#111;color:#ddd;margin:16px}h1{font-size:18px}.r{margin:18px 0}.r h2{font-size:14px;margin:4px 0}
.r.bad h2{color:#ff6b8a}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}img{width:100%;display:block;background:#000}
.l{font-size:11px;color:#888}.err{color:#ff6b8a;white-space:pre-wrap}</style>
<h1>${rows.length} pictures, ${changed.length} changed more than ${threshold}% ${haveBase ? "" : "(no baseline yet: run npm run shots -- --approve)"}</h1>
${errors.length ? `<div class="err">${esc(errors.join("\n"))}</div>` : ""}
${rows.map(r => `<div class="r ${r.pct > threshold ? "bad" : ""}"><h2>${r.name} ${r.pct == null ? "(new)" : r.pct.toFixed(2) + "% changed"}</h2>
<div class="g"><div><div class="l">baseline</div>${r.pct == null ? "" : `<img src="baseline/${r.name}">`}</div><div><div class="l">current</div><img src="current/${r.name}"></div>
<div><div class="l">difference</div>${r.pct == null ? "" : `<img src="diff/${r.name}">`}</div></div></div>`).join("")}`;
fs.writeFileSync(path.join(DIR, "report.html"), html);

console.log(`shots: ${names.length} pictures in ${((Date.now() - t0) / 1000).toFixed(1)}s -> shots/report.html`);
if (!haveBase) console.log("  no baseline yet; approve with: npm run shots -- --approve");
for (const r of changed) console.log(`  CHANGED ${r.pct.toFixed(2)}%  ${r.name}`);
for (const e of errors) console.log("  ERROR " + e);
process.exit(changed.length || errors.length ? 1 : 0);
