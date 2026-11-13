// Shared headless-browser harness for shots, smoke and perf.
// Serves the repo on a free localhost port, opens the game in headless Chromium with a seeded Math.random,
// and collects console errors so every script can fail on them.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".woff2": "font/woff2" };

export function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (p.endsWith("/")) p += "index.html";
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-store" });
      fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, "127.0.0.1", () => res({ srv, url: `http://127.0.0.1:${srv.address().port}/` }));
  });
}

// settings written into the save before the game loads: no tutorial prompt, fixed tier, Auto off
export async function openGame({ tier = 1, width = 1280, height = 720, seed = 1234, extra = {} } = {}) {
  const { srv, url } = await serve();
  const browser = await chromium.launch({ headless: true, args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + (e.stack || e.message || e)));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.addInitScript(({ tier, seed, extra }) => {
    let s = seed >>> 0;
    Math.random = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.__reseed = v => { s = v >>> 0; };
    try {
      const cur = JSON.parse(localStorage.getItem("arena3dv2") || "{}");
      localStorage.setItem("arena3dv2", JSON.stringify(Object.assign(cur, { gfx: tier, auto: 0, tut: 1, name: "Tester" }, extra)));
    } catch (e) {}
    window.__HARNESS = true;
  }, { tier, seed, extra });
  await page.goto(url + "index.html");
  await page.waitForFunction(() => typeof startGame0 === "function" && typeof Q === "object" && typeof rd === "object", null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const close = async () => { await browser.close(); srv.close(); };
  return { page, errors, close, url };
}

// stop the game's own animation loop so frames are rendered only when a script asks (deterministic pictures)
export async function freezeLoop(page) {
  await page.evaluate(() => { window.__rafReal = window.__rafReal || window.requestAnimationFrame; window.requestAnimationFrame = () => 0; });
  await page.waitForTimeout(60);
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
