/* Service worker del Metrónomo de RCP.
   - Caché versionada con toda la aplicación y los archivos compartidos que usa.
   - Fuentes de Google: «stale-while-revalidate» en una caché aparte (sin conexión se usa la tipografía de respaldo).
   - Actualización controlada: la versión nueva espera hasta que la página pida SKIP_WAITING.
   - Al activarse, borra las cachés de versiones antiguas.
   IMPORTANTE: al cambiar cualquier archivo de la aplicación, sube VERSION. */
const VERSION = 'rcp-v2';
const FONTS = 'rcp-fonts-v1';
const PRECACHE = [
  './', 'index.html', 'rcp.css', 'modulos.css',
  'kit.js', 'i18n.js', 'engine.js', 'illustrations.js', 'voice.js', 'llamada.js', 'dea.js', 'atragantamiento.js', 'sensor-core.js', 'sensor.js', 'pwa.js', 'app.js',
  'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'manifest.webmanifest',
  '../shared/app.css', '../shared/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = [VERSION, FONTS];
    for (const k of await caches.keys()) if (k.startsWith('rcp-') && !keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  else if (d.type === 'STATUS') {
    e.waitUntil((async () => {
      const c = await caches.open(VERSION), have = [];
      for (const u of PRECACHE) if (await c.match(u)) have.push(u);
      const msg = { type: 'STATUS', version: VERSION, cached: have.length, total: PRECACHE.length, complete: have.length === PRECACHE.length };
      if (e.source) e.source.postMessage(msg);
    })());
  }
});

const isFont = (url) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (isFont(url)) {                                          // stale-while-revalidate
    e.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const hit = await cache.match(req);
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      return (await net) || Response.error();
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {                                // la aplicación: caché primero
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const r = await fetch(req);
      if (r.ok && /\/apps\/(rcp|shared)\//.test(url.pathname)) cache.put(req, r.clone());
      return r;
    } catch (err) {
      if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
      return Response.error();
    }
  })());
});
