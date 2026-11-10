/* Derisa's Last Card: service worker.
   - the app files are saved on the phone, so the app opens fast and Quick match works offline
   - card pictures are saved the first time they are loaded
   - Supabase (login, matches, invitations) is NEVER cached: it always goes to the internet
   Change VERSION when you publish new files so phones pick them up. */
const VERSION = 'dlc-v2';
const SHELL = [
  './', 'index.html', 'Home.html', 'Game.html', 'Pvp.html', 'config.js', 'app.js',
  'manifest.json', 'offline.html',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-32.png', 'icons/apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(SHELL.map(u => c.add(u).catch(() => {})));   // one missing file must not stop the install
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const c = await caches.open(VERSION);
  try {
    const r = await fetch(req);
    if (r && r.ok) c.put(req, r.clone());
    return r;
  } catch (err) {
    return (await c.match(req, { ignoreSearch: true })) || (await c.match('offline.html')) || Response.error();
  }
}
async function staleWhileRevalidate(req) {
  const c = await caches.open(VERSION);
  const hit = await c.match(req, { ignoreSearch: true });
  const fresh = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
  return hit || (await fresh) || Response.error();
}
async function cacheFirst(req) {
  const c = await caches.open(VERSION);
  const hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
  return r;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(req.mode === 'navigate' ? networkFirst(req) : staleWhileRevalidate(req));
    return;
  }
  // card pictures and game art from the Supabase buckets (versioned folders, so cache-first is safe)
  if (url.hostname.endsWith('.supabase.co') &&
      (url.pathname.indexOf('/storage/v1/object/public/cards/') === 0 || url.pathname.indexOf('/storage/v1/object/public/game-assets/') === 0)) {
    e.respondWith(cacheFirst(req)); return;
  }
  // libraries and fonts
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(req)); return;
  }
  // everything else (Supabase database, login, realtime, profile pictures) is never cached
});
