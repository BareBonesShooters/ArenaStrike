# Arena Strike tools

No build step: the game is still plain scripts loaded by `index.html`. These tools only check, test and picture it.
First time: `npm install` (only `playwright-core`; it uses the Chromium already cached by Playwright) and `npm run hooks`.

| Command | What it does | Time |
|---|---|---|
| `npm run check` | Syntax of every JS file, `node --test tests/`, line endings vs `tools/eol.json`, every `js/*.js` loaded once by `index.html`, and lines added since HEAD (no `console.log`, `debugger`, or `localStorage` outside `try`). Also runs as the git pre-commit hook. | ~4 s |
| `npm run smoke` | Plays duel, gun game, Monster Rush, range, tutorial, parkour and 1v1 headless for a few seconds each: reaches play, no errors, finite numbers, pause/resume, quit cleans up. Monster Rush also tests the power-up picker with Escape and `nextWave`. | ~25 s |
| `npm run perf` | Draw calls, triangles and frame time for 4 maps x 2 views x 5 tiers vs `tools/perf-baseline.json`. Fails on +10% calls/triangles, or +25% frame time on Low/Potato. `-- --approve` records new numbers when a cost increase is intended. | ~12 s |
| `npm run shots` | Renders 16 maps x 4 views (overview, eye, ground, mid) on Ultra and Potato into `shots/current`, diffs against `shots/baseline`, writes `shots/report.html` (baseline / current / difference, most changed first). `-- --quick` one view per map. `-- --maps meadow,lv:hollow --views ground --tiers 0,3,4` subsets. `-- --approve` accepts the current pictures. | ~30 s (quick ~8 s) |
| `npm run finish` | check, smoke, perf, then shots; stops at the first failure; lists picture changes for review; prints changed files and a draft commit command. `-- --quick` for faster shots. | ~1 min |
| `python3 tools/patch.py edits.json` | Safe find/replace: exact match count required, converts newlines to the file's own ending, checks all edits before writing any, restores files if `node --check` fails. `--dry` to test, `--fix-eol FILE` to repair endings. | instant |
| `npm run new-level -- reef "Sunken Reef"` | New Monster Rush level from the Hollow template: file, script tag, `LV_ORDER`. | instant |
| `index.html?tune` | Live tuning panel. Game code reads numbers with `Tune.n("name", default, min, max)`; sliders change them while playing; "Copy changed" gives the numbers to write back as defaults. Backquote hides it. Without `?tune` it returns the default and shows nothing. | |

`shots/` and `node_modules/` are not committed. `tools/perf-baseline.json` is.

## Working with agents

1. Split a phase into items and fill one `tools/TASK_CARD.md` per item (files allowed, what done looks like).
2. Items that touch different files can run at the same time, each agent in its own git worktree.
3. Every agent must pass `npm run finish -- --quick` before reporting, and points at the views in `shots/report.html` that show its change.
4. The reviewer reads the diff and the report page, not raw logs, then merges, runs `npm run finish`, approves shots and commits.
