#!/usr/bin/env node
// node tools/probe-blocked-signin.mjs   acts like a school network that blocks *.supabase.co, then tries to sign in.
//  blocked:  supabase.co refused, no fallback set      -> sign-in must fail with the plain "network blocks" message
//  fallback: supabase.co refused, fallback host set     -> sign-in must reach the fallback host (a canned reply here)
// Nothing here touches the real account server.
import { chromium } from "playwright-core";
import { serve } from "./lib/browser.mjs";

const FALLBACK = "https://accounts.example.test";
const { srv, url } = await serve();
const browser = await chromium.launch({ headless: true });
let fail = 0;
for (const mode of ["blocked", "fallback"]) {
  const page = await browser.newPage();
  const hits = [];
  await page.route(/supabase\.co/, r => r.abort("blockedbyclient"));
  await page.route(u => u.href.startsWith(FALLBACK), r => { hits.push(new URL(r.request().url()).pathname);
    r.fulfill({ status: 400, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" }) }); });
  if (mode === "fallback") await page.route(/supabase-config\.js/, async r => { const res = await r.fetch(); const body = (await res.text()).replace('"siteUrl"', `"fallbackUrls": ["${FALLBACK}"],\n  "siteUrl"`); r.fulfill({ response: res, body }); });
  await page.addInitScript(() => { window.__HARNESS = true; });
  await page.goto(url + "index.html");
  await page.waitForFunction(() => window.ArenaAccount && window.ArenaAccount.client, null, { timeout: 30000 });
  const msg = await page.evaluate(async () => { try { const r = await ArenaAccount.client.auth.signInWithPassword({ email: "probe@example.test", password: "not-a-real-password" }); return r.error ? r.error.message : "no error"; } catch (e) { return "threw: " + e.message; } });
  const ok = mode === "blocked" ? /blocked|can't reach|cannot reach/i.test(msg) : hits.some(p => p.startsWith("/auth/v1/token")) && /Invalid login/.test(msg);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${mode.padEnd(8)} ${msg}${hits.length ? "  (fallback got " + hits.join(", ") + ")" : ""}`);
  await page.close();
}
await browser.close(); srv.close();
process.exit(fail ? 1 : 0);
