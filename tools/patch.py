#!/usr/bin/env python3
"""Safe find-and-replace for this repo (use it instead of hand-written Python or sed).

  python3 tools/patch.py edits.json          apply a list of edits
  python3 tools/patch.py - < edits.json      same, from stdin
  python3 tools/patch.py --dry edits.json    check every edit, write nothing
  python3 tools/patch.py --fix-eol FILE...   rewrite files with the line ending tools/eol.json expects

edits.json is a list of {"file": "js/03-world.js", "find": "...", "replace": "...", "count": 1}.
"count" (default 1) is how many times "find" must appear; use "all": true to replace every match.
Write find/replace with plain \\n newlines: they are converted to the file's own line ending (CRLF files stay CRLF).
All edits are checked first. If any "find" is missing or appears the wrong number of times, nothing is written.
After writing, every changed .js file is syntax-checked with node --check and restored if it fails.
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EOL = json.load(open(os.path.join(ROOT, "tools", "eol.json")))
CRLF = set(EOL["crlf"])

def rel(p):
    return os.path.relpath(os.path.abspath(p), ROOT)

def read(p):
    with open(os.path.join(ROOT, p), "r", encoding="utf-8", newline="") as f:
        return f.read()

def write(p, s):
    with open(os.path.join(ROOT, p), "w", encoding="utf-8", newline="") as f:
        f.write(s)

def fix_eol(files):
    for f in files:
        r = rel(f); s = read(r).replace("\r\n", "\n")
        if r in CRLF: s = s.replace("\n", "\r\n")
        write(r, s); print(f"eol: {r} -> {'CRLF' if r in CRLF else 'LF'}")

def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__); return 0
    if argv[0] == "--fix-eol":
        fix_eol(argv[1:]); return 0
    dry = argv[0] == "--dry"
    if dry: argv = argv[1:]
    src = sys.stdin.read() if argv[0] == "-" else open(argv[0], encoding="utf-8").read()
    edits = json.loads(src)
    if isinstance(edits, dict): edits = [edits]
    texts, orig, errors = {}, {}, []
    for i, e in enumerate(edits):
        f = rel(os.path.join(ROOT, e["file"]))
        if f not in texts:
            if not os.path.exists(os.path.join(ROOT, f)):
                errors.append(f"edit {i+1}: {f} does not exist"); continue
            texts[f] = orig[f] = read(f)
        s = texts[f]
        nl = "\r\n" if "\r\n" in s else "\n"
        find = e["find"].replace("\r\n", "\n").replace("\n", nl)
        rep = e["replace"].replace("\r\n", "\n").replace("\n", nl)
        n = s.count(find)
        if not find:
            errors.append(f"edit {i+1} ({f}): empty find"); continue
        if e.get("all"):
            if n == 0: errors.append(f"edit {i+1} ({f}): text not found: {e['find'][:80]!r}"); continue
        elif n != e.get("count", 1):
            errors.append(f"edit {i+1} ({f}): found {n} time(s), expected {e.get('count', 1)}: {e['find'][:80]!r}"); continue
        texts[f] = s.replace(find, rep)
    if errors:
        print("patch: nothing written"); [print("  " + x) for x in errors]; return 1
    changed = [f for f in texts if texts[f] != orig[f]]
    if dry:
        print(f"patch --dry: {len(edits)} edit(s) would change {', '.join(changed) or 'nothing'}"); return 0
    for f in changed: write(f, texts[f])
    bad = []
    for f in changed:
        if f.endswith((".js", ".mjs", ".cjs")):
            r = subprocess.run(["node", "--check", os.path.join(ROOT, f)], capture_output=True, text=True)
            if r.returncode:
                bad.append((f, r.stderr.strip().splitlines()))
    if bad:
        for f in changed: write(f, orig[f])
        print("patch: syntax error after editing, all files restored")
        for f, err in bad: print(f"  {f}:"); [print("    " + l) for l in err[:6]]
        return 1
    print(f"patch: {len(edits)} edit(s) applied to {', '.join(changed) or 'nothing (replacements were identical)'}")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
