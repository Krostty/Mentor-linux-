// Flujo E2E de Mentor Linux v3 sobre un viewport móvil real.
// Requiere un servidor local, por ejemplo: python -m http.server 8123
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

async function cargarPlaywright() {
  try { return await import('playwright'); }
  catch {
    const candidatos = [
      process.env.PLAYWRIGHT_MODULE,
      process.env.USERPROFILE && join(process.env.USERPROFILE, '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'playwright', 'index.mjs'),
    ].filter(Boolean);
    const ruta = candidatos.find(existsSync);
    if (!ruta) throw new Error('No se encontró Playwright. Instálalo o define PLAYWRIGHT_MODULE.');
    return import(pathToFileURL(ruta).href);
  }
}

const { chromium } = await cargarPlaywright();
const BASE = process.env.MENTOR_URL || 'http://127.0.0.1:8123';
const capturas = fileURLToPath(new URL('../.capturas/', import.meta.url));
mkdirSync(capturas, { recursive: true });

const ejecutables = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = ejecutables.find(existsSync);

let pasadas = 0;
let fallidas = 0;
const errores = [];
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { pasadas++; console.log(`  ✓ ${nombre}`); }
  else { fallidas++; console.error(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`); }
}

const navegador = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const contexto = await navegador.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-ES',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
});
const pagina = await contexto.newPage();
pagina.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errores.push(`[${m.type()}] ${m.text()}`); });
pagina.on('pageerror', (e) => errores.push(`[pageerror] ${e.message}`));

async function shot(nombre) { await pagina.screenshot({ path: join(capturas, `${nombre}.png`) }); }
async function comando(texto) {
  const input = pagina.locator('.consola-input:visible');
  await input.fill(texto);
  await pagina.locator('.consola-ejecutar:visible').click();
}

try {
  console.log(`\n▸ Cargando ${BASE}`);
  await pagina.goto(BASE, { waitUntil: 'domcontentloaded' });
  await pagina.evaluate(() => localStorage.clear());
  await pagina.reload({ waitUntil: 'domcontentloaded' });

  console.log('▸ Aprender');
  comprobar('la app arranca', await pagina.locator('.app').isVisible());
  comprobar('hay 5 academias', await pagina.locator('.academia').count() === 5);
  comprobar('hay 10 tramos de ruta', await pagina.locator('.tramo').count() === 10);
  comprobar('las 24 salas están renderizadas', await pagina.locator('.nodo').count() === 24);
  const totalEjercicios = await pagina.evaluate(() => window.__mentor.totales.ejercicios);
  comprobar('el marcador refleja el total de ejercicios',
    (await pagina.locator('.metrica').first().innerText()).includes(`/${totalEjercicios}`), String(totalEjercicios));
  comprobar('no hay desborde horizontal', await pagina.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  await shot('v3-01-aprender');

  await pagina.locator('.nodo[data-sala="cero-absoluto"]').click();
  comprobar('sala muestra 5 tareas', await pagina.locator('.tarea').count() === 5);
  comprobar('Sala 0 ofrece 37 interacciones', await pagina.locator('.ejercicio').count() === 37);
  comprobar('teoría y práctica comparten pantalla', await pagina.locator('.teoria').count() > 0 && await pagina.locator('.ejercicios').count() > 0);
  await pagina.locator('[data-abrir-ejercicio="cero-pwd"]').click();
  comprobar('terminal recibe foco al abrir', await pagina.locator('.consola-input').evaluate((e) => e === document.activeElement));
  await pagina.locator('[data-reiniciar-terminal]').click();
  await pagina.locator('.consola').click({ position: { x: 80, y: 120 } });
  comprobar('tocar la consola recupera el foco', await pagina.locator('.consola-input').evaluate((e) => e === document.activeElement));
  comprobar('el chip inline tiene fondo propio', await pagina.locator('#ejercicio-cero-pwd p code').evaluate((e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)'));
  await comando('pwd');
  comprobar('resolver abre celebración', await pagina.locator('.celebracion[data-abierta]').isVisible());
  comprobar('resolver suma XP', (await pagina.locator('#ficha-xp').innerText()) === '25 XP');
  await shot('v3-02-reto-terminal');
  await pagina.locator('.celebracion [data-boton="0"]').click();
  await pagina.reload({ waitUntil: 'domcontentloaded' });
  comprobar('el ejercicio persiste al recargar', await pagina.locator('#ejercicio-cero-pwd [data-ok]').isVisible());
  comprobar('el XP persiste al recargar', (await pagina.locator('#ficha-xp').innerText()) === '25 XP');

  await pagina.locator('[data-tarea="cero-moverse"] summary').click();
  comprobar('existe práctica de construcción de comandos', await pagina.locator('[data-constructor="cero-cd-orden"]').isVisible());
  await pagina.locator('[data-constructor="cero-cd-orden"] [data-token="0"]').click();
  await pagina.locator('[data-constructor="cero-cd-orden"] [data-token="1"]').click();
  await pagina.locator('[data-constructor="cero-cd-orden"] [data-validar-constructor]').click();
  comprobar('el constructor valida el orden correcto', await pagina.locator('.celebracion[data-abierta]').isVisible());
  comprobar('el constructor suma XP', (await pagina.locator('#ficha-xp').innerText()) === '40 XP');
  await pagina.locator('.celebracion [data-boton="0"]').click();

  console.log('▸ Máquina completa');
  await pagina.locator('[data-pestana="maquinas"]').click();
  comprobar('hay 12 máquinas', await pagina.locator('[data-maquina]').count() === 12);
  await pagina.locator('[data-maquina="lumen"]').click();
  comprobar('terminal de máquina enfoca sola', await pagina.locator('.consola-input').evaluate((e) => e === document.activeElement));
  await comando('nmap -sV 10.10.10.21');
  await pagina.reload({ waitUntil: 'domcontentloaded' });
  comprobar('la máquina conserva la fase tras recargar', await pagina.locator('.fase[data-hecha]').count() === 1);
  for (const cmd of ['curl http://lumen.box/robots.txt', 'ssh alex@lumen.box', 'sudo -l', 'sudo -i']) await comando(cmd);
  comprobar('se completan las 4 fases', await pagina.locator('.fase[data-hecha]').count() === 4);
  await comando('cat /home/alex/user.txt');
  await comando('cat /root/root.txt');
  const salida = await pagina.locator('.consola-salida').innerText();
  const flags = salida.match(/ML\{[^}]+\}/g) || [];
  comprobar('la máquina entrega dos flags', flags.length >= 2, flags.join(', '));
  await pagina.getByLabel('Bandera user.txt').fill(flags.at(-2) || '');
  await pagina.getByRole('button', { name: 'Validar user', exact: true }).click();
  await pagina.getByLabel('Bandera root.txt').fill(flags.at(-1) || '');
  await pagina.getByRole('button', { name: 'Validar root', exact: true }).click();
  comprobar('el writeup se desbloquea', await pagina.locator('.writeup').isVisible());
  await shot('v3-03-maquina-completa');

  console.log('▸ Wargame y laboratorio');
  await pagina.locator('[data-pestana="practicar"]').click();
  comprobar('hay 8 misiones rápidas', await pagina.locator('[data-laboratorio]:not([data-laboratorio="libre"])').count() === 8);
  comprobar('hay 15 niveles Wargame', await pagina.locator('[data-wargame]').count() === 16); // 15 niveles + CTA hero
  await pagina.locator('[data-wargame="bandit-0"]').last().click();
  await comando('cat README');
  await pagina.getByLabel('Contraseña del siguiente nivel').fill('linux-opens-the-door');
  await pagina.getByRole('button', { name: 'Desbloquear', exact: true }).click();
  comprobar('Wargame desbloquea el nivel siguiente', await pagina.getByText('Has desbloqueado').isVisible());
  await pagina.locator('.celebracion [data-boton="0"]').click();
  comprobar('se abre Bandit 1', await pagina.getByText('Wargame · Nivel 01 de 14').isVisible());
  await pagina.locator('[data-pestana="practicar"]').click();
  await pagina.locator('[data-laboratorio="lab-orientacion"]').click();
  for (const cmd of ['whoami', 'pwd', 'uname -a']) await comando(cmd);
  comprobar('misión rápida valida el estado', await pagina.getByRole('heading', { name: 'Misión completada', exact: true }).isVisible());
  await shot('v3-04-laboratorio');
  await pagina.getByRole('button', { name: 'Más misiones', exact: true }).click();

  console.log('▸ Perfil y offline');
  await pagina.locator('[data-pestana="perfil"]').click();
  // La copia de seguridad vive en un bloque plegable al final del perfil: es
  // importante, pero no es lo que vienes a ver al abrir tu perfil. Lo que hay
  // que garantizar es que se pueda llegar a ella y que funcione.
  const copia = pagina.locator('details').filter({ hasText: 'Copia de seguridad' }).first();
  comprobar('la copia de seguridad es accesible', await copia.count() === 1);
  await copia.locator('summary').click();
  comprobar('exportar e importar se despliegan', await pagina.locator('.transferencia [data-exportar]').isVisible());
  comprobar('el mapa contiene 24 salas', await pagina.locator('.dominio-fila').count() === 24);
  comprobar('hay 40 tarjetas de logro', await pagina.locator('.logro').count() === 40);
  comprobar('existe el dominio comando a comando', await pagina.getByText('Ver los 107 comandos').isVisible());
  await shot('v3-05-perfil');

  await pagina.evaluate(() => navigator.serviceWorker.ready);
  await contexto.setOffline(true);
  await pagina.reload({ waitUntil: 'domcontentloaded' });
  comprobar('la app abre offline', await pagina.locator('.app').isVisible());
  comprobar('el progreso sigue offline', (await pagina.locator('#ficha-xp').innerText()) !== '0 XP');
  await contexto.setOffline(false);

  comprobar('no hubo errores de consola', errores.length === 0, errores.join(' | '));
} finally {
  await contexto.setOffline(false).catch(() => {});
  await navegador.close();
}

console.log(`\n${pasadas} comprobaciones E2E pasadas, ${fallidas} fallidas`);
if (errores.length) errores.forEach((e) => console.error(`  ${e}`));
process.exit(fallidas ? 1 : 0);
