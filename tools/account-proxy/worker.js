// Account proxy: a Cloudflare Worker that passes account traffic through to the game's Supabase project,
// so players on networks that block *.supabase.co (school Wi-Fi filters) can still sign in.
//
// Deploy (free plan is enough):
//  1. Cloudflare dashboard > Workers & Pages > Create > Worker, paste this file, Deploy.
//  2. Give it a route on a domain you own (e.g. accounts.yourdomain.com). A *.workers.dev address works too,
//     but many school filters block workers.dev as a whole, so your own domain is the reliable choice.
//  3. Put that address in js/supabase-config.js:  "fallbackUrls": ["https://accounts.yourdomain.com"]
// The game always tries supabase.co first and only uses this when the network refuses it.
const TARGET = "https://bjwjkhkfbismtipworth.supabase.co";
const PATHS = ["/auth/v1/", "/rest/v1/", "/functions/v1/"];
const ORIGINS = ["https://barebonesshooters.github.io", "http://127.0.0.1", "http://localhost"];

export default {
  async fetch(req) {
    const url = new URL(req.url), origin = req.headers.get("origin") || "";
    if (!PATHS.some(p => url.pathname.startsWith(p))) return new Response("Not found", { status: 404 });
    if (origin && !ORIGINS.some(o => origin === o || origin.startsWith(o + ":"))) return new Response("Forbidden", { status: 403 });
    const headers = new Headers(req.headers);
    ["host", "cf-connecting-ip", "x-forwarded-for", "x-real-ip"].forEach(h => headers.delete(h));
    const res = await fetch(TARGET + url.pathname + url.search, {
      method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body, redirect: "manual",
    });
    // Supabase answers CORS itself; pass its headers through unchanged
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers });
  },
};
