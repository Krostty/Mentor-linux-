// Service worker: precachea toda la app para que funcione sin conexión.
// Estrategia: cache-first para los recursos propios, con actualización en
// segundo plano. Como todo es estático, no hay nada que pedir a la red.

const VERSION = 'mentor-linux-v7-scripting-portadas-png';

const RECURSOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/base.css',
  'css/ui.css',
  'css/tema.css',
  'css/terminal.css',
  'js/app.js',
  'js/ui.js',
  'js/arte.js',
  'js/sonido.js',
  'js/store.js',
  'js/engine/fs.js',
  'js/engine/shell.js',
  'js/engine/terminal.js',
  'js/engine/commands/index.js',
  'js/engine/commands/util.js',
  'js/engine/commands/nav.js',
  'js/engine/commands/files.js',
  'js/engine/commands/perms.js',
  'js/engine/commands/text.js',
  'js/engine/commands/procs.js',
  'js/engine/commands/net.js',
  'js/engine/commands/pkg.js',
  'js/engine/commands/sysd.js',
  'js/engine/commands/misc.js',
  'js/engine/commands/sec.js',
  'js/engine/commands/advanced.js',
  'js/engine/commands/scripts.js',
  'js/engine/scripting.js',
  'js/data/modules.js',
  'js/data/modulos-1.js',
  'js/data/modulos-2.js',
  'js/data/modulos-3.js',
  'js/data/modulos-4.js',
  'js/data/checks.js',
  'js/data/snapshots.js',
  'js/data/comandos.js',
  'js/data/incidentes.js',
  'js/data/logros.js',
  'js/data/salas.js',
  'js/data/piezas.js',
  'js/data/salas-redes.js',
  'js/data/salas-redes-cero.js',
  'js/data/salas-pentesting.js',
  'js/data/salas-ofensiva.js',
  'js/data/salas-defensa.js',
  'js/data/salas-scripting.js',
  'js/data/refuerzos-2.js',
  'js/data/refuerzos-1.js',
  'js/data/habilidades.js',
  'js/data/maquinas.js',
  'js/data/wargame.js',
  'js/data/secretos.js',
  'assets/icons/icono-180.png',
  'assets/icons/icono-192.png',
  'assets/icons/icono-512.png',
  'assets/icons/icono-maskable-512.png',
  // Portadas rasterizadas: pesan, pero son parte de la app y tienen que
  // estar disponibles sin conexión igual que el resto.
  'assets/portadas/terminal-lime.png',
  'assets/portadas/red-cyan.png',
  'assets/portadas/script-magenta.png',
  'assets/portadas/codigo-amber.png',
  'assets/portadas/encapuchado-red.png',
  'assets/portadas/escudo-blue.png',
  'assets/portadas/servidor-cyan.png',
  'assets/portadas/banderas-magenta.png',
  'assets/portadas/laboratorio-lime.png',
  'assets/portadas/acceso-red.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSION).then(async (cache) => {
      // addAll falla entero si un solo recurso falla, así que se añaden de uno
      // en uno: la app debe poder instalarse aunque falte un icono.
      await Promise.all(
        RECURSOS.map((url) => cache.add(url).catch(() => {}))
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const claves = await caches.keys();
      await Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  evento.respondWith(
    (async () => {
      const cacheada = await caches.match(peticion, { ignoreSearch: true });
      if (cacheada) {
        // Se refresca en segundo plano para la próxima visita.
        evento.waitUntil(
          fetch(peticion)
            .then(async (respuesta) => {
              if (respuesta && respuesta.ok) {
                const cache = await caches.open(VERSION);
                await cache.put(peticion, respuesta.clone());
              }
            })
            .catch(() => {})
        );
        return cacheada;
      }

      try {
        const respuesta = await fetch(peticion);
        if (respuesta && respuesta.ok) {
          const cache = await caches.open(VERSION);
          cache.put(peticion, respuesta.clone());
        }
        return respuesta;
      } catch {
        // Sin red y sin caché: si pedían una página, se sirve la app.
        if (peticion.mode === 'navigate') {
          const inicio = await caches.match('index.html');
          if (inicio) return inicio;
        }
        return new Response('Sin conexión', { status: 503, statusText: 'Sin conexión' });
      }
    })()
  );
});
