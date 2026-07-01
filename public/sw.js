const CACHE_NAME = 'frota-shell-v1';
const SHELL_URLS = ['/abastecer', '/style.css', '/app.js', '/offline-queue.js', '/manifest.json'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((nome) => nome !== CACHE_NAME).map((nome) => caches.delete(nome)))
    )
  );
  self.clients.claim();
});

// Network-first para o ecra de abastecer (para ter dados atualizados quando
// ha rede), com fallback para a copia em cache quando esta offline.
self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  if (evento.request.method !== 'GET') return; // POSTs de sync nunca passam pela cache
  if (!SHELL_URLS.includes(url.pathname)) return;

  evento.respondWith(
    fetch(evento.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(evento.request, copia));
        return resposta;
      })
      .catch(() => caches.match(evento.request))
  );
});
