// In-page helpers shared by shots and perf: build a map with a fixed seed, place the camera at a named view,
// render one frame (with every post pass) and read it back.
export const VIEWS = {
  // the lobby orbit pose: whole map from above
  overview: "cam.fov=58;cam.position.set(Math.sin(.72)*34,18,Math.cos(.72)*34);cam.lookAt(-3,2,-5);",
  // standing at the player spawn, looking at the middle of the map
  eye: "{const s=freeSpot(0,H-8);const y=floorAt(s.x,s.z,30)||0;cam.fov=75;cam.position.set(s.x,y+1.7,s.z);cam.lookAt(0,y+1.4,0);}",
  // knee height, grazing the ground: catches z-fighting, stripes, shadow acne
  ground: "cam.fov=75;cam.position.set(16,.9,11);cam.lookAt(0,.4,0);",
  // mid-height three-quarter view of the far side
  mid: "cam.fov=70;cam.position.set(-22,7,18);cam.lookAt(6,1.5,-6);",
};

export const MAPS = {
  outdoor: ["meadow", "sunset", "frost", "neon", "desert", "autumn", "toxic", "ruin"],
  levels: ["hollow", "dunes", "corrupt", "spire", "frost", "swamp", "forge", "temple"].map(id => "lv:" + id),
};

// tier numbers: 0 Ultra, 1 High, 2 Medium, 3 Low, 4 Potato
export const TIER_NAMES = ["ultra", "high", "medium", "low", "potato"];

// returns {png (data url), calls, tris, ms}
export async function renderView(page, { map, view, tier, seed = 777, png = true, reps = 1 }) {
  return page.evaluate(({ map, view, tier, seed, png, code, reps }) => {
    if (S.gfx !== tier) Q.set(tier);
    state = "lobby";
    const lv = map.startsWith("lv:") ? map.slice(3) : null;
    const key = lv ? "lv_" + lv : map;
    const hash = str => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
    if (window.__built !== key + seed) {
      window.__reseed(hash(key));
      // the title showreel adds its own actors (bots, runners) that clearEnts does not own; which segment is playing depends on load
      // timing, so stop it first or the numbers and pictures change with how long the page took to boot
      try { Title.end(); } catch (e) {}
      try { clearEnts(); } catch (e) {}
      buildWorld(key, seed, lv ? { waves: true, level: lv } : {});
      window.__built = key + seed;
    }
    cam.aspect = innerWidth / innerHeight;
    window.__reseed(hash(key + view));
    (0, eval)(code);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
    worldFrame(0.016, 12); Light.frame(0.016);
    const draw = () => { rd.shadowMap.needsUpdate = true; Post.frame(); if (Post.on) Post.render(false); else rd.render(sc, cam); };
    draw(); draw();
    rd.info.autoReset = false; rd.info.reset();
    draw();
    const calls = rd.info.render.calls, tris = rd.info.render.triangles;
    rd.getContext().finish();
    const t0 = performance.now();
    for (let i = 0; i < reps; i++) draw();
    rd.getContext().finish();
    const ms = (performance.now() - t0) / reps;
    rd.info.autoReset = true;
    let url = null;
    if (png) { const c = document.createElement("canvas"); c.width = rd.domElement.width; c.height = rd.domElement.height; c.getContext("2d").drawImage(rd.domElement, 0, 0); url = c.toDataURL("image/png"); }
    return { png: url, calls, tris, ms };
  }, { map, view, tier, seed, png, code: VIEWS[view], reps });
}
