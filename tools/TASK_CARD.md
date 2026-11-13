# Task card (copy one per work item before handing it to an agent)

**Item:** <plan number and title, e.g. 1.3 Bloom that actually shows>
**Goal:** <one or two sentences: what the player should see or feel when this is done>

**Files you may change:** <list. Anything else is out of scope: report it instead of editing it>
**Files you must not touch:** .claude/, tools/perf-baseline.json, shots/baseline/

**How to edit:** use `python3 tools/patch.py edits.json` for every change to an existing file (keeps CRLF files CRLF,
refuses ambiguous matches, restores the file on a syntax error). New files are LF.
**Tunable numbers:** read them through `Tune.n("area.name", default, min, max)` so they can be adjusted live with `?tune`.

**Done means:**
- [ ] `npm run finish -- --quick` passes (check, smoke, perf). If perf is over budget on Low/Potato, the change is not done.
- [ ] `shots/report.html` shows the intended change on the listed views, and nothing else changed unexpectedly.
- [ ] Low and Potato only get changes that cost no GPU time (see IMPROVEMENT_PLAN.md rule).
- [ ] Report: what changed (files + one line each), the shots that show it, anything left undone. Do not commit.
