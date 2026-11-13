#!/usr/bin/env node
// npm run finish: the one command to run before a commit.
//   check (syntax, tests, line endings, script tags, added lines) -> smoke (every mode) -> perf (budget) -> shots (visual diff)
// Stops at the first hard failure. Visual changes are not failures: they are listed for review in shots/report.html,
// then accepted with `npm run shots -- --approve`. Ends with the changed files and a draft commit message.
// npm run finish -- --quick   shots use one view per map
import { spawnSync, execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(ROOT);
const quick = process.argv.includes("--quick");
const t0 = Date.now();
const run = (name, args) => {
  process.stdout.write(`\n== ${name} ==\n`);
  const r = spawnSync(process.execPath, args, { stdio: "inherit" });
  return r.status;
};
const steps = [["check", ["tools/check.mjs"]], ["smoke", ["tools/smoke.mjs"]], ["perf", ["tools/perf.mjs"]]];
for (const [n, a] of steps) if (run(n, a)) { console.log(`\nfinish: STOPPED at ${n}. Fix the problems above and run npm run finish again.`); process.exit(1); }
const shots = run("shots", ["tools/shots.mjs", ...(quick ? ["--quick"] : [])]);

let files = [];
try { files = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).split("\n").filter(Boolean).map(l => l.slice(3)).filter(f => !f.startsWith(".claude")); } catch (e) {}
console.log(`\nfinish: all gates passed in ${((Date.now() - t0) / 1000).toFixed(0)}s.`);
if (shots) console.log("  Pictures changed or errored: open shots/report.html. If the changes are intended: npm run shots -- --approve");
console.log("  Changed files:\n" + files.map(f => "    " + f).join("\n"));
console.log(`  Draft commit (add only the files above that you changed):\n    git add ${files.map(f => JSON.stringify(f)).join(" ")}\n    git commit -m "<what changed, in plain words>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"`);
