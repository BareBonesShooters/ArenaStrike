#!/usr/bin/env node
// node tools/probe-overlap.mjs [maps] [--all]   builds each map and checks every pair of solid boxes that share a rotation for:
//  zfight: two faces in the same plane (within 3 mm) overlapping with different colours, which flickers or stripes as you move
//  sliver: a part poking 1-60 mm out through the face of a bigger part of a different colour, which reads as a glitchy stripe
// Lists the worst spots per map with world position and size, so each one can be traced to the prop that makes it.
import { openGame } from "./lib/browser.mjs";
import { MAPS } from "./lib/scene.mjs";

const a = process.argv.slice(2).filter(x => !x.startsWith("--"));
const maps = (a[0] || [...MAPS.outdoor, ...MAPS.levels].join(",")).split(",");
const g = await openGame({ tier: 0 });
await g.page.evaluate(n => { window.__N = n }, +(process.env.N || 40));
let total = 0;
for (const map of maps) {
  const r = await g.page.evaluate(map => {
    const lv = map.startsWith("lv:") ? map.slice(3) : null, key = lv ? "lv_" + lv : map;
    try { Title.end(); } catch (e) {} try { clearEnts(); } catch (e) {}
    const rec = [], orig = Batch.prototype.add;
    Batch.prototype.add = function (geo, m, col, ...rest) {
      const gt = geo === U.box ? "box" : geo === U.cyl ? "cyl" : null;
      if (!this.__id) this.__id = ++window.__bid || (window.__bid = 1);
      if (gt) { // boxes everywhere; upright cylinders only for their flat tops and bottoms
        const e = m.elements, ax = [[e[0], e[1], e[2]], [e[4], e[5], e[6]], [e[8], e[9], e[10]]];
        const len = ax.map(v => Math.hypot(...v));
        // only boxes rotated about y alone (their local y stays world up)
        if (Math.abs(ax[1][1] / len[1] - 1) < 1e-4) {
          let ry = Math.atan2(-ax[0][2], ax[0][0]); ry = ((ry % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2); if (Math.PI / 2 - ry < 1e-4) ry = 0;
          rec.push({ ry: gt === "cyl" ? 0 : ry, gt, bt: this.__id, cx: e[12], cy: e[13], cz: e[14], ax: gt === "cyl" ? [[len[0], 0, 0], [0, len[1], 0], [0, 0, len[2]]] : ax, len, col: new T.Color(col).getHex() });
        }
      }
      return orig.call(this, geo, m, col, ...rest);
    };
    try { window.__reseed(777); buildWorld(key, 777, lv ? { waves: true, level: lv } : {}); window.__built = null; }
    finally { Batch.prototype.add = orig; }
    // express each box as an interval box in a frame rotated by its ry (mod 90 degrees), so boxes that share it compare axis to axis
    const groups = new Map();
    for (const b of rec) {
      const k = Math.round(b.ry * 1000) % Math.round(Math.PI / 2 * 1000), c = Math.cos(-b.ry), s = Math.sin(-b.ry);
      const u = [c, 0, -s], w = [s, 0, c]; // frame axes in world
      const lo = [0, 0, 0], hi = [0, 0, 0], ctr = [b.cx * u[0] + b.cz * u[2], b.cy, b.cx * w[0] + b.cz * w[2]];
      const ext = [0, 0, 0];
      for (const v of b.ax) { ext[0] += Math.abs(v[0] * u[0] + v[2] * u[2]) / 2; ext[1] += Math.abs(v[1]) / 2; ext[2] += Math.abs(v[0] * w[0] + v[2] * w[2]) / 2; }
      for (let i = 0; i < 3; i++) { lo[i] = ctr[i] - ext[i]; hi[i] = ctr[i] + ext[i]; }
      // skip boxes whose own axes are not aligned with the frame (they would have a fuzzy bound)
      const al = b.ax.every(v => { const n = Math.hypot(...v) || 1, p = [Math.abs(v[0] * u[0] + v[2] * u[2]) / n, Math.abs(v[1]) / n, Math.abs(v[0] * w[0] + v[2] * w[2]) / n]; return Math.max(...p) > .999; });
      if (!al) continue;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push({ lo, hi, col: b.col, gt: b.gt, bt: b.bt, x: b.cx, y: b.cy, z: b.cz, size: ext.map(e => +(e * 2).toFixed(2)) });
    }
    const out = [];
    const covered = (list, pt, A, B) => list.some(C => C !== A && C !== B && pt.every((v, i) => v > C.lo[i] + .001 && v < C.hi[i] - .001));
    const near = (a, b) => (a.col !== b.col || a.bt !== b.bt); // different colour, or different batch (glow vs solid shade differently)
    for (const list of groups.values()) {
      list.sort((p, q) => p.lo[0] - q.lo[0]);
      for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
        const A = list[i], B = list[j]; if (B.lo[0] > A.hi[0] + .01) break;
        if (!near(A, B)) continue;
        const ov = [0, 1, 2].map(d => Math.min(A.hi[d], B.hi[d]) - Math.max(A.lo[d], B.lo[d]));
        if (ov.some(o => o < -.003)) continue;
        // zfight: on some axis a face of A and a face of B coincide (same facing side), and the other two axes overlap with area
        for (let d = 0; d < 3; d++) {
          if ((A.gt === "cyl" || B.gt === "cyl") && d !== 1) continue; // a cylinder only has flat faces top and bottom
          const o1 = (d + 1) % 3, o2 = (d + 2) % 3; if (ov[o1] < .02 || ov[o2] < .02) continue;
          for (const [fa, fb, sg] of [[A.hi[d], B.hi[d], 1], [A.lo[d], B.lo[d], -1]]) if (Math.abs(fa - fb) < .003 && !(d === 1 && fa < .02)) {
            // the shared patch is visible only if the point just outside it is open air (not inside some third solid)
            const pt = [0, 0, 0]; pt[d] = fa + sg * .006; pt[o1] = (Math.max(A.lo[o1], B.lo[o1]) + Math.min(A.hi[o1], B.hi[o1])) / 2; pt[o2] = (Math.max(A.lo[o2], B.lo[o2]) + Math.min(A.hi[o2], B.hi[o2])) / 2;
            if (!covered(list, pt, A, B)) out.push({ kind: "zfight", A, B, area: ov[o1] * ov[o2] });
          }
        }
        // sliver: B pokes out of A's face (or A out of B's) by 1-60 mm while overlapping well on the other axes
        if (A.gt === "box" && B.gt === "box") for (const [X, Y] of [[A, B], [B, A]]) for (let d = 0; d < 3; d++) {
          const o1 = (d + 1) % 3, o2 = (d + 2) % 3; if (ov[o1] < .04 || ov[o2] < .04 || ov[d] < .02) continue;
          for (const [p, sg] of [[Y.hi[d] - X.hi[d], 1], [X.lo[d] - Y.lo[d], -1]]) if (!(sg < 0 && d === 1 && Y.lo[d] < .02) && p > .001 && p < .06 && (Y.hi[d] - Y.lo[d]) > p + .05) {
            const pt = [0, 0, 0]; pt[d] = sg > 0 ? X.hi[d] + p / 2 : X.lo[d] - p / 2; pt[o1] = (Math.max(X.lo[o1], Y.lo[o1]) + Math.min(X.hi[o1], Y.hi[o1])) / 2; pt[o2] = (Math.max(X.lo[o2], Y.lo[o2]) + Math.min(X.hi[o2], Y.hi[o2])) / 2;
            if (!covered(list, pt, X, Y)) out.push({ kind: "sliver", A: X, B: Y, area: ov[o1] * ov[o2], poke: +(p * 1000).toFixed(0), axis: "xyz"[d] });
          }
        }
      }
    }
    out.sort((p, q) => q.area - p.area);
    const f = b => `(${b.x.toFixed(2)},${b.y.toFixed(2)},${b.z.toFixed(2)}) ${b.size.join("x")} #${b.col.toString(16).padStart(6, "0")}`;
    return { boxes: rec.length, n: out.length, zf: out.filter(o => o.kind === "zfight").length, sl: out.filter(o => o.kind === "sliver").length,
      top: out.slice(0, +(window.__N||40)).map(o => `${o.kind}${o.poke ? " " + o.poke + "mm " + o.axis : ""} area ${o.area.toFixed(2)}  ${f(o.A)}  vs  ${f(o.B)}`) };
  }, map);
  total += r.n;
  console.log(`${map.padEnd(10)} ${r.boxes} boxes: ${r.zf} z-fight, ${r.sl} sliver`);
  if (process.argv.includes("--all")) r.top.forEach(t => console.log("   " + t));
}
await g.close();
if (g.errors.length) { console.log("page errors:"); g.errors.slice(0, 5).forEach(e => console.log("  " + e)); }
console.log(`probe-overlap: ${total} spots`);
