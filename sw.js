// Service worker do 2048 Astros: guarda o jogo no aparelho para ele abrir sem internet e mais rápido, e deixa a página
// ser instalada como app. Montado pelo build.py, que põe aqui a versão e a lista de arquivos (o sw.js da raiz é gerado: não
// edite lá). Cada versão nova do jogo muda este arquivo, e o navegador instala o service worker novo, que guarda a versão nova.
const VERSAO = '64631f7c7a', CACHE = 'astros-' + VERSAO, FONTES_CACHE = 'astros-fontes';
const ARQUIVOS = ["./", "manifest.webmanifest", "icones/icone-192.png", "icones/icone-512.png", "icones/icone-mascara-512.png", "icones/apple-touch-icon.png", "musica/armorial.js", "musica/bossa.js", "musica/eletronica.js", "musica/estacao.js", "musica/frenesi.js", "musica/lofi-espera.js", "musica/lofi-prorroga.js", "musica/lofi-segredo.js", "musica/orbita.js", "musica/pulsar.js", "musica/sofrencia-lofi.js"];
const ESCOPO = new URL(self.registration.scope).pathname;
const RAIZ = new URL('./', self.registration.scope).href;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS.map(a => new Request(a, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('astros-') && k !== CACHE && k !== FONTES_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const FONTES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
// a página do jogo (com ou sem ?frenesi, ?fps...): a mesma chave no cache
const ehJogo = u => u.pathname === ESCOPO || u.pathname === ESCOPO + 'index.html';

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // fontes do Google: guardadas na primeira vez (o jogo fica com a cara certa sem internet)
  if (FONTES.test(r.url)) {
    e.respondWith(caches.open(FONTES_CACHE).then(async c => {
      const m = await c.match(r); if (m) return m;
      const n = await fetch(r); if (n.ok || n.type === 'opaque') c.put(r, n.clone()); return n;
    }));
    return;
  }
  if (u.origin !== location.origin || !u.pathname.startsWith(ESCOPO)) return;
  if (ehJogo(u)) {
    // a página do jogo: a da rede quando chega logo (versão nova na hora); com rede lenta ou sem rede, a guardada
    e.respondWith((async () => {
      const guardada = await caches.match(RAIZ, {cacheName: CACHE}) || await caches.match(RAIZ);
      const rede = fetch(r).then(n => { if (n.ok) { const cp = n.clone(); caches.open(CACHE).then(c => c.put(RAIZ, cp)); } return n; });
      if (!guardada) return rede;
      const espera = new Promise(ok => setTimeout(() => ok(null), 3000));
      try { return (await Promise.race([rede, espera])) || guardada; } catch (_) { return guardada; }
    })());
    return;
  }
  // o resto que o jogo guardou (músicas, ícones): o guardado na hora, atualizado por trás; o que não é do jogo (rascunhos,
  // bastidores) vai direto para a rede
  const nome = u.pathname.slice(ESCOPO.length);
  if (!ARQUIVOS.includes(nome)) return;
  e.respondWith((async () => {
    // pedido de um rascunho (pulsar.html, som.html...): sempre da rede, senão ele recebe a música guardada, que pode ser velha
    const quem = e.clientId && await self.clients.get(e.clientId);
    if (quem && !ehJogo(new URL(quem.url))) { try { return await fetch(r, {cache: 'no-store'}); } catch (_) {} }
    return guardado(r);
  })());
});
function guardado(r) {
  return caches.match(r, {ignoreSearch: true}).then(m => {
    const n = fetch(r).then(x => { if (x.ok) { const cp = x.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return x; }).catch(() => m);
    return m || n;
  });
}
