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
  // La portada muestra las academias CERRADAS: el camino de salas vive en la
  // pantalla de cada academia, no amontonado en el inicio.
  comprobar('hay 5 academias en la portada', await pagina.locator('.tarjeta-academia').count() === 5);
  comprobar('la portada no despliega salas', await pagina.locator('.nodo').count() === 0);
  const totalEjercicios = await pagina.evaluate(() => window.__mentor.totales.ejercicios);
  comprobar('el marcador refleja el total de ejercicios',
    (await pagina.locator('.continuar-progreso').innerText()).includes(String(totalEjercicios)), String(totalEjercicios));
  comprobar('no hay desborde horizontal', await pagina.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  await shot('v3-01-aprender');

  // Entrar en una academia abre su pantalla con el camino completo.
  await pagina.locator('[data-academia="linux"]').click();
  comprobar('la academia abre su propia pantalla', await pagina.locator('.academia-detalle').isVisible());
  comprobar('la academia Linux tiene 5 tramos', await pagina.locator('.tramo').count() === 5);
  comprobar('la academia Linux muestra sus 15 salas', await pagina.locator('.nodo').count() === 15);
  comprobar('la primera sala está marcada como actual', await pagina.locator('.nodo[data-estado="curso"]').count() === 1);
  comprobar('el resto queda bloqueado en orden', await pagina.locator('.nodo[data-estado="bloqueada"]').count() === 14);
  await shot('v3-01b-academia');

  await pagina.locator('.nodo[data-sala="cero-absoluto"]').click();
  // La sala ya no vuelca su contenido: enumera lecciones cortas.
  comprobar('la sala lista sus 5 lecciones', await pagina.locator('.nodo[data-leccion]').count() === 5);
  comprobar('la sala no pinta ejercicios', await pagina.locator('.ejercicio').count() === 0);
  comprobar('las lecciones se abren en orden', await pagina.locator('.nodo[data-estado="bloqueada"]').count() === 4);
  await shot('v4-02-sala-lecciones');

  console.log('▸ Lección paso a paso');
  await pagina.locator('[data-leccion="cero-que-es"]').click();
  comprobar('la lección arranca en el paso 1', (await pagina.locator('.leccion-cuenta').innerText()).trim() === '1/9');
  comprobar('la barra tiene un segmento por paso', await pagina.locator('.leccion-progreso span').count() === 9);
  comprobar('solo hay una cosa en pantalla', await pagina.locator('.paso').count() === 1);
  comprobar('las pestañas no roban alto dentro de la lección', await pagina.locator('.pestanas').isVisible() === false);
  comprobar('el pie está visible sin hacer scroll', await pagina.locator('.leccion-pie [data-mover="1"]').isVisible());
  await shot('v4-03-paso-teoria');

  for (let i = 0; i < 3; i++) await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('tras la teoría llega el primer ejercicio', await pagina.locator('#ejercicio-cero-q1').isVisible());
  comprobar('el ejercicio trae la ficha del comando', await pagina.locator('.ficha-comando').count() === 1);

  // Fallar descarta la opción y lo dice; antes solo repetía «aún no».
  await pagina.locator('.opcion[data-opcion="1"]').click();
  comprobar('la opción fallada queda descartada', await pagina.locator('.opcion[data-descartada]').count() === 1);
  comprobar('el fallo dice cuántas opciones quedan', (await pagina.locator('.leccion-pie .feedback').innerText()).includes('Quedan 3'));
  await shot('v4-04-fallo-descarte');

  await pagina.locator('[data-pista]').click();
  comprobar('la pista se genera aunque el ejercicio no traiga ninguna', await pagina.locator('.pista').count() === 1);

  await pagina.locator('.opcion[data-opcion="0"]').click();
  comprobar('acertar pinta el pie de verde', await pagina.locator('.leccion-pie[data-estado="ok"]').count() === 1);
  comprobar('acertar explica el porqué', (await pagina.locator('.leccion-pie .feedback').innerText()).includes('¡Correcto!'));
  comprobar('acertar suma XP', (await pagina.locator('#ficha-xp').innerText()) === '15 XP');
  comprobar('acertar no abre ningún modal', await pagina.locator('.celebracion[data-abierta]').count() === 0);
  await shot('v4-05-acierto');

  // EL BUG que motivó esta versión: no había forma de volver al anterior.
  await pagina.locator('.paso-atras').click();
  comprobar('la flecha vuelve al paso anterior', (await pagina.locator('.leccion-cuenta').innerText()).trim() === '3/9');
  comprobar('el paso anterior se ve entero', await pagina.locator('.paso-teoria').isVisible());
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('avanzar devuelve al ejercicio ya resuelto', await pagina.locator('#ejercicio-cero-q1[data-completo]').isVisible());
  comprobar('el resuelto conserva su explicación', await pagina.locator('.paso-explicacion').count() === 1);

  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  await pagina.locator('.ficha').first().click();
  comprobar('comprobar vive en el pie, bajo el pulgar', await pagina.locator('.leccion-pie [data-comprobar]').count() === 1);
  await pagina.locator('[data-comprobar]').click();
  comprobar('el constructor valida el orden', (await pagina.locator('#ficha-xp').innerText()) === '30 XP');

  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('la terminal recibe foco al llegar a su paso', await pagina.locator('.consola-input').evaluate((e) => e === document.activeElement));
  await comando('ls');
  comprobar('el fallo en terminal orienta al comando que falta', (await pagina.locator('.leccion-pie .feedback').innerText()).includes('pwd'));
  await comando('pwd');
  comprobar('la terminal completa su ejercicio', (await pagina.locator('#ficha-xp').innerText()) === '55 XP');
  await shot('v4-06-paso-terminal');

  // Saltar nunca te deja atascado, y lo saltado vuelve al final.
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('un ejercicio sin resolver ofrece saltar', await pagina.locator('[data-saltar="cero-ruta"]').count() === 1);
  await pagina.locator('[data-saltar="cero-ruta"]').click();
  comprobar('saltar avanza al siguiente', await pagina.locator('#ejercicio-cero-pwd-predice').isVisible());

  await pagina.reload({ waitUntil: 'domcontentloaded' });
  comprobar('la lección sobrevive a recargar', await pagina.locator('.leccion').isVisible());
  comprobar('el XP persiste al recargar', (await pagina.locator('#ficha-xp').innerText()) === '55 XP');
  comprobar('al volver se retoma en lo pendiente', await pagina.locator('#ejercicio-cero-ruta').isVisible());

  await pagina.getByLabel('Tu respuesta').fill('home/user');
  await pagina.locator('[data-comprobar]').click();
  comprobar('el fallo de ruta explica que falta la barra', (await pagina.locator('.leccion-pie .feedback').innerText()).includes('/'));
  await pagina.getByLabel('Tu respuesta').fill('/home/user');
  await pagina.locator('[data-comprobar]').click();
  comprobar('la respuesta corta valida', (await pagina.locator('#ficha-xp').innerText()) === '70 XP');

  // Hasta el cierre de la lección.
  for (let i = 0; i < 12 && await pagina.locator('.paso-fin').count() === 0; i++) {
    const seguir = pagina.locator('.leccion-pie [data-mover="1"]');
    if (await seguir.count() === 0) break;
    await seguir.click();
  }
  comprobar('la lección termina en su pantalla de cierre', await pagina.locator('.paso-fin').isVisible());
  comprobar('el cierre ofrece rematar lo que falta', await pagina.locator('[data-ir-paso]').count() === 1);
  await shot('v4-07-fin-leccion');
  await pagina.locator('.leccion-salir').click();
  comprobar('salir devuelve a la lista de lecciones', await pagina.locator('.nodo[data-leccion]').count() === 5);

  // Terminal de varios comandos: un comando suelto no debe gritar «incompleto».
  // Se abre una sala con reto de terminal multi-paso y se comprueba el silencio.
  await pagina.goto(`${BASE}#leccion/diag-parte`, { waitUntil: 'domcontentloaded' });
  await pagina.waitForSelector('.leccion');
  for (let i = 0; i < 12 && await pagina.locator('.paso-ejercicio .consola-input:visible').count() === 0; i++) {
    await pagina.locator('.leccion-pie [data-mover="1"]').click();
  }
  await comando('ls');
  comprobar('un comando suelto no marca el reto multi-paso como incompleto',
    (await pagina.locator('.leccion-pie .feedback').innerText()).trim() === 'Escribe el comando y pulsa Intro.');
  // Con el teclado abierto, la terminal cabe sin desbordar ni tapar el pie.
  await pagina.evaluate(() => { document.documentElement.toggleAttribute('data-teclado', true); document.documentElement.style.setProperty('--alto-visible', '430px'); });
  await pagina.waitForTimeout(120);
  comprobar('con el teclado la terminal no desborda el cuerpo', await pagina.evaluate(() => {
    const c = document.querySelector('.leccion-cuerpo');
    return c.scrollHeight <= c.clientHeight + 2;
  }));
  comprobar('con el teclado la ficha del comando se retira', await pagina.evaluate(() => !document.querySelector('.ficha-comando')?.offsetHeight));
  await pagina.evaluate(() => { document.documentElement.toggleAttribute('data-teclado', false); document.documentElement.style.removeProperty('--alto-visible'); });
  await pagina.locator('.leccion-salir').click();

  // Los accesos rápidos abren la lección en el ejercicio concreto, no la
  // sala entera: era otra forma de perderse.
  await pagina.locator('[data-pestana="aprender"]').click();
  await pagina.locator('.continuar-hoy .btn').click();
  comprobar('«Continuar» entra directo en la lección', await pagina.locator('.leccion').isVisible());
  comprobar('«Continuar» cae en un ejercicio pendiente', await pagina.locator('.paso-ejercicio:not([data-completo])').count() === 1);
  await pagina.locator('.leccion-salir').click();


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

  comprobar('el panel de puntos débiles existe', await pagina.locator('.debiles, .vacio-suave').count() > 0);

  console.log('▸ Perfil y offline');
  await pagina.locator('[data-pestana="perfil"]').click();
  // La copia de seguridad vive en un bloque plegable al final del perfil: es
  // importante, pero no es lo que vienes a ver al abrir tu perfil. Lo que hay
  // que garantizar es que se pueda llegar a ella y que funcione.
  const copia = pagina.locator('details').filter({ hasText: 'Copia de seguridad' }).first();
  comprobar('la copia de seguridad es accesible', await copia.count() === 1);
  await copia.locator('summary').click();
  comprobar('exportar e importar se despliegan', await pagina.locator('.transferencia [data-exportar]').isVisible());
  comprobar('el mapa cubre todas las salas', await pagina.locator('.dominio-fila').count() === await pagina.evaluate(() => window.__mentor.totales.salas));
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
