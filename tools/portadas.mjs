// Generador de las portadas PNG.
//
// Las escenas siguen dibujándose en `js/arte.js` —son la fuente de verdad—
// pero aquí se componen sobre un fondo con profundidad (degradados, rejilla,
// halo y viñeta) y se rasterizan con Chromium a `assets/portadas/*.png`.
//
// Por qué PNG y no solo SVG en línea:
//   · el degradado y el halo se ven igual en todos los navegadores, sin
//     depender de `color-mix` ni de filtros SVG;
//   · el navegador las decodifica una vez y las reutiliza en cada tarjeta,
//     en vez de re-renderizar el mismo SVG decenas de veces al hacer scroll;
//   · se precachean con el service worker, así que siguen offline.
//
// Uso:  node tools/portadas.mjs            (regenera todas)
//       node tools/portadas.mjs --lista    (solo enumera lo que generaría)
//
// El SVG sigue en el código como respaldo: si un PNG falta, la app dibuja.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESCENAS, PORTADAS } from '../js/arte.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'assets', 'portadas');

// Tamaño de render. La portada se ve como mucho a 600 px de ancho, así que
// 800 px cubre el caso normal y deja margen en pantallas densas sin que el
// archivo se dispare: cada PNG pesa lo que pesa por sus degradados.
const ANCHO = 800;
const ALTO = 400;

// Cada acento trae su fondo: no basta con teñir, porque el mismo azul de
// base apaga el ámbar y satura el rojo.
const PALETA = {
  lime: { acento: '#38d68c', fondo: '#06130f', medio: '#0b2a20' },
  cyan: { acento: '#38b6f5', fondo: '#05121d', medio: '#0a2537' },
  magenta: { acento: '#c56ff0', fondo: '#100a1c', medio: '#241338' },
  red: { acento: '#f4685c', fondo: '#170a0b', medio: '#33141a' },
  blue: { acento: '#5f92ff', fondo: '#080e20', medio: '#131f45' },
  amber: { acento: '#f5ad42', fondo: '#150f04', medio: '#33230a' },
};

function documento(escena, color) {
  const { acento, fondo, medio } = PALETA[color] || PALETA.cyan;
  const dibujo = (ESCENAS[escena] || ESCENAS.terminal)()
    .replace(/var\(--acento-academia,\s*#17a7ef\)/g, acento)
    .replace(/var\(--acento-academia\)/g, acento);

  return `<!doctype html>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; }
  body { width: ${ANCHO}px; height: ${ALTO}px; overflow: hidden; background: ${fondo}; }
  .lienzo { position: relative; width: 100%; height: 100%; }
  /* Fondo: dos focos de color, uno arriba a la izquierda y otro abajo. */
  .fondo {
    position: absolute; inset: 0;
    background:
      radial-gradient(120% 95% at 10% 4%, ${medio} 0%, transparent 62%),
      radial-gradient(95% 85% at 94% 100%, ${acento}2e 0%, transparent 58%),
      linear-gradient(160deg, ${fondo} 0%, ${medio} 130%);
  }
  /* Rejilla técnica, muy tenue: da textura sin ensuciar el PNG. */
  .rejilla {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(${acento}14 1px, transparent 1px),
      linear-gradient(90deg, ${acento}14 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(120% 100% at 50% 0%, #000 20%, transparent 78%);
  }
  /* Halo detrás de la escena, para separarla del fondo. */
  .halo {
    position: absolute; left: 50%; top: 52%; width: 74%; height: 78%;
    transform: translate(-50%, -50%);
    background: radial-gradient(closest-side, ${acento}30, transparent 72%);
  }
  .escena { position: absolute; inset: 0; display: grid; place-items: center; }
  .escena svg { width: 100%; height: 100%; display: block; filter: drop-shadow(0 18px 40px rgba(0,0,0,.55)); }
  /* Viñeta: oscurece los bordes para que el rótulo blanco siempre lea. */
  .vineta {
    position: absolute; inset: 0;
    background:
      linear-gradient(to top, rgba(0,0,0,.62) 0%, transparent 42%),
      linear-gradient(to bottom, rgba(0,0,0,.34) 0%, transparent 30%);
  }
</style>
<div class="lienzo">
  <div class="fondo"></div>
  <div class="rejilla"></div>
  <div class="halo"></div>
  <div class="escena">
    <svg viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">${dibujo}</svg>
  </div>
  <div class="vineta"></div>
</div>`;
}

const combinaciones = PORTADAS.map(({ escena, color }) => ({ escena, color, archivo: `${escena}-${color}.png` }));

if (process.argv.includes('--lista')) {
  for (const c of combinaciones) console.log(c.archivo);
  process.exit(0);
}

// Playwright suele estar instalado en global, no en el proyecto: la app no
// tiene dependencias de producción y esto es solo una herramienta de autor.
async function cargarPlaywright() {
  try { return await import('playwright'); }
  catch {
    const candidatos = [
      process.env.PLAYWRIGHT_MODULE,
      '/opt/node22/lib/node_modules/playwright/index.mjs',
      '/usr/lib/node_modules/playwright/index.mjs',
      '/usr/local/lib/node_modules/playwright/index.mjs',
    ].filter(Boolean);
    const { existsSync } = await import('node:fs');
    const { pathToFileURL } = await import('node:url');
    const ruta = candidatos.find(existsSync);
    if (!ruta) throw new Error('No se encontró Playwright. Instálalo o define PLAYWRIGHT_MODULE.');
    return import(pathToFileURL(ruta).href);
  }
}

const { chromium } = await cargarPlaywright();
const navegador = await chromium.launch({ headless: true });
const pagina = await navegador.newPage({ viewport: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1 });

await mkdir(DESTINO, { recursive: true });
for (const { escena, color, archivo } of combinaciones) {
  await pagina.setContent(documento(escena, color), { waitUntil: 'domcontentloaded' });
  const png = await pagina.screenshot({ type: 'png' });
  await writeFile(join(DESTINO, archivo), png);
  console.log(`${archivo.padEnd(28)} ${(png.length / 1024).toFixed(1)} KB`);
}
await navegador.close();
console.log(`\n${combinaciones.length} portadas en assets/portadas/`);
