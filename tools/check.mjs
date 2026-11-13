#!/usr/bin/env node
// npm run check: the fast gate run before every commit (a few seconds).
//  1. syntax of every JS file          4. index.html loads every js/*.js once, and nothing missing
//  2. node --test tests/               5. lines added since HEAD: no console.log, no unguarded localStorage, no debugger
//  3. line endings match tools/eol.json, no mixed files
// Prints one line per failure and exits 1, or "check: all passed".
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);
const fails = [];
const t0 = Date.now();
const list = d => fs.existsSync(d) ? fs.readdirSync(d).map(f => path.join(d, f)) : [];

// 1. syntax
const jsFiles = [...list("js"), ...list("tools"), ...list("tools/lib"), ...list("tests")].filter(f => /\.(js|mjs|cjs)$/.test(f));
for (const f of jsFiles) {
  const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
  if (r.status) fails.push(`syntax  ${f}: ${(r.stderr.split("\n").find(l => /Error/.test(l)) || r.stderr).trim()}  (${(r.stderr.match(/:(\d+)\n/) || [])[1] ? "line " + r.stderr.match(/:(\d+)\n/)[1] : ""})`);
}

// 2. tests
const tr = spawnSync(process.execPath, ["--test", "tests/"], { encoding: "utf8" });
if (tr.status) {
  const lines = (tr.stdout + tr.stderr).split("\n").filter(l => /^not ok|AssertionError|Error:|expected|actual/.test(l.trim())).slice(0, 12);
  fails.push("tests   node --test tests/ failed:\n          " + lines.join("\n          "));
}

// 3. line endings
const eol = JSON.parse(fs.readFileSync("tools/eol.json", "utf8"));
const crlfSet = new Set(eol.crlf);
for (const f of [...list("js"), ...list("css"), ...list("tests"), ...list("tools"), ...list("tools/lib"), "index.html"].filter(f => /\.(js|mjs|cjs|css|html|json|py|md)$/.test(f) && fs.statSync(f).isFile())) {
  const b = fs.readFileSync(f), s = b.toString("latin1");
  const crlf = (s.match(/\r\n/g) || []).length, lf = (s.match(/\n/g) || []).length - crlf;
  if (crlf && lf) fails.push(`eol     ${f}: mixed line endings (${crlf} CRLF, ${lf} LF). Fix with: python3 tools/patch.py --fix-eol ${f}`);
  else if (crlfSet.has(f) && lf) fails.push(`eol     ${f}: must be CRLF but is LF. Fix with: python3 tools/patch.py --fix-eol ${f}`);
  else if (!crlfSet.has(f) && crlf) fails.push(`eol     ${f}: must be LF but is CRLF. Fix with: python3 tools/patch.py --fix-eol ${f}`);
}

// 4. index.html script tags
const html = fs.readFileSync("index.html", "utf8");
const tags = [...html.matchAll(/<script[^>]*src="(js\/[^"?]+)/g)].map(m => m[1]);
for (const f of list("js").filter(f => f.endsWith(".js"))) {
  const n = tags.filter(t => t === f).length;
  if (n === 0) fails.push(`index   ${f} is not loaded by index.html`);
  if (n > 1) fails.push(`index   ${f} is loaded ${n} times`);
}
for (const t of tags) if (!fs.existsSync(t)) fails.push(`index   index.html loads ${t}, which does not exist`);

// 5. added lines since HEAD (staged + unstaged + new files)
let diff = "";
try {
  diff = execFileSync("git", ["diff", "HEAD", "-U0", "--", "js", "css", "index.html"], { encoding: "utf8", maxBuffer: 64 << 20 });
  const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "js", "css"], { encoding: "utf8" }).split("\n").filter(Boolean);
  for (const f of untracked) diff += `+++ b/${f}\n` + fs.readFileSync(f, "utf8").split("\n").map(l => "+" + l).join("\n") + "\n";
} catch (e) {}
let file = "";
for (const line of diff.split("\n")) {
  if (line.startsWith("+++ ")) { file = line.slice(6); continue; }
  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  const l = line.slice(1);
  if (/\bconsole\.log\(/.test(l)) fails.push(`added   ${file}: console.log left in: ${l.trim().slice(0, 100)}`);
  if (/\bdebugger\b/.test(l)) fails.push(`added   ${file}: debugger statement`);
  if (/localStorage\.(get|set|remove)Item/.test(l) && !/try\s*\{/.test(l)) fails.push(`added   ${file}: localStorage used outside try{} (throws in private mode): ${l.trim().slice(0, 100)}`);
}

const secs = ((Date.now() - t0) / 1000).toFixed(1);
if (fails.length) { console.log(`check: ${fails.length} problem(s) in ${secs}s`); for (const f of fails) console.log("  " + f); process.exit(1); }
console.log(`check: all passed (${jsFiles.length} files, tests, line endings, script tags, added lines) in ${secs}s`);
