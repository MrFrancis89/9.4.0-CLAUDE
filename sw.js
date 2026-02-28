// sw.js — StockFlow Pro Service Worker v9.4.0
const CACHE_NAME = 'stockflow-v9-4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icone.png',
  './fundo-pizza.jpg',
  './main.js',
  './store.js',
  './storage.js',
  './listafacil.js',
  './navegacao.js',
  './ui.js',
  './tabela.js',
  './eventos.js',
  './compras.js',
  './categorias.js',
  './calculadora.js',
  './teclado.js',
  './parser.js',
  './alerta.js',
  './swipe.js',
  './toast.js',
  './confirm.js',
  './utils.js',
  './dropdown.js',
  './produtos.js',
  './calendario.js',
  './massa.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
