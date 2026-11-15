// Network first, so a new build always wins; the cache is only a fallback for offline play
// and lets phones install Arena Strike 3D as an app.
const C = "as3d-v2";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== C).map(n => caches.delete(n)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok && res.type === "basic") { const c = res.clone(); caches.open(C).then(x => x.put(r, c)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || Response.error())));
});
