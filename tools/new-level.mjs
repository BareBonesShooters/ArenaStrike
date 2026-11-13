#!/usr/bin/env node
// npm run new-level -- <id> "<Name>"   e.g.  npm run new-level -- reef "Sunken Reef"
// Copies js/06h-lv-hollow.js (the reference level) to js/06h-lv-<id>.js with the id and name swapped,
// adds its <script> tag to index.html after the last level, and appends it to LV_ORDER in js/06g-levels.js.
// Then edit the new file's theme, monsters, boss and props. The level test needs props of 150+ parts and 15+ solids
// and unique names/skies/ground colours, and tests/levels.test.cjs expects the level count it checks for.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [id, name] = process.argv.slice(2);
if (!id || !/^[a-z][a-z0-9]{1,15}$/.test(id) || !name) { console.error('usage: npm run new-level -- <id lowercase> "<Name>"'); process.exit(1); }
const dst = path.join(ROOT, "js", `06h-lv-${id}.js`);
if (fs.existsSync(dst)) { console.error(`${dst} already exists`); process.exit(1); }
const ref = fs.readFileSync(path.join(ROOT, "js", "06h-lv-hollow.js"), "utf8");
const refName = (ref.match(/\bn:\s*"([^"]+)"/) || [])[1];
let out = ref.replace(/(["'`])hollow\1/g, `$1${id}$1`).replace(/\blv_hollow\b/g, `lv_${id}`);
if (refName) out = out.split(`"${refName}"`).join(`"${name}"`);
out = `// ${name}: generated from the Hollow level by npm run new-level. Replace the theme, monsters, boss and props.\n` + out;
fs.writeFileSync(dst, out);
const ip = path.join(ROOT, "index.html"); let html = fs.readFileSync(ip, "utf8");
const tags = [...html.matchAll(/<script[^>]*src="js\/06h-lv-[^"]+"[^>]*><\/script>/g)]; const last = tags[tags.length - 1];
html = html.slice(0, last.index + last[0].length) + `\n<script src="js/06h-lv-${id}.js"></script>` + html.slice(last.index + last[0].length);
fs.writeFileSync(ip, html);
const lp = path.join(ROOT, "js", "06g-levels.js"); const lv = fs.readFileSync(lp, "utf8");
const m = lv.match(/LV_ORDER\s*=\s*\[([^\]]*)\]/);
if (m) fs.writeFileSync(lp, lv.replace(m[0], m[0].replace(/\]$/, `,"${id}"]`)));
console.log(`new level: js/06h-lv-${id}.js, script tag added${m ? ", LV_ORDER updated" : " (LV_ORDER not found: add it by hand)"}.`);
console.log("Next: make the theme colours, monster names, boss name and sky unique, then npm run check.");
