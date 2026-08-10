import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

async function cargarPlaywright() {
  try { return await import('playwright'); }
  catch {
    const candidatos = [
      process.env.PLAYWRIGHT_MODULE,
      process.env.USERPROFILE && join(process.env.USERPROFILE, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright', 'index.mjs'),
    ].filter(Boolean);
    const ruta = candidatos.find(existsSync);
    if (!ruta) throw new Error('No se encontró Playwright.');
    return import(pathToFileURL(ruta).href);
  }
}

const BASE = process.env.MENTOR_URL || 'http://127.0.0.1:8137';
const salida = process.argv[2];
if (!salida) throw new Error('Indica el directorio de salida.');
mkdirSync(salida, { recursive: true });

const portadas = [
  ['01-linux', 'terminal', '#21d18c'],
  ['02-redes', 'red', '#17a7ef'],
  ['03-bash', 'script', '#bf7cff'],
  ['04-ofensiva', 'encapuchado', '#ff5470'],
  ['05-defensa', 'escudo', '#55c6ff'],
  ['06-maquinas', 'servidor', '#ff5470'],
  ['07-wargame', 'banderas', '#bf7cff'],
  ['08-laboratorio', 'laboratorio', '#21d18c'],
  ['09-misiones', 'acceso', '#ffd166'],
];

const { chromium } = await cargarPlaywright();
const ejecutables = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);
const executablePath = ejecutables.find(existsSync);
const navegador = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const contexto = await navegador.newContext({ viewport: { width: 1760, height: 1500 }, deviceScaleFactor: 1 });
const pagina = await contexto.newPage();
await pagina.goto(BASE, { waitUntil: 'domcontentloaded' });

await pagina.evaluate(async (datos) => {
  const { ilustracion } = await import('/js/arte.js');
  document.head.innerHTML = `<style>
    *{box-sizing:border-box} body{margin:0;padding:40px;background:#070b18;color:white;font-family:system-ui}
    main{display:grid;grid-template-columns:repeat(2,800px);gap:32px}
    figure{position:relative;width:800px;height:400px;margin:0;overflow:hidden;border-radius:24px;background:#080d1c;--acento-academia:var(--acento)}
    svg{display:block;width:100%;height:100%}
    figcaption{position:absolute;left:28px;bottom:22px;padding:8px 12px;border-radius:9px;background:rgba(3,7,18,.78);font-weight:800;letter-spacing:.08em;text-transform:uppercase}
  </style>`;
  document.body.innerHTML = `<main>${datos.map(([nombre, escena, color]) =>
    `<figure data-portada="${nombre}" style="--acento:${color}">${ilustracion(escena)}<figcaption>${nombre.slice(3)}</figcaption></figure>`
  ).join('')}</main>`;
}, portadas);

for (const [nombre] of portadas) {
  await pagina.locator(`[data-portada="${nombre}"]`).screenshot({ path: join(salida, `${nombre}.png`) });
}
await pagina.locator('main').screenshot({ path: join(salida, '00-todas-las-portadas.png') });
await navegador.close();
console.log(`Exportadas ${portadas.length} portadas en ${salida}`);
