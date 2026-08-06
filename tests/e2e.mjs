// Pruebas end-to-end sobre Chromium emulando un iPhone.
// Recorre los flujos reales de la app, comprueba que no hay errores de consola
// y captura cada vista para revisar la estética.
//
//   node tests/e2e.mjs            → pruebas + capturas
//   node tests/e2e.mjs --shots    → solo capturas

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.MENTOR_URL || 'http://localhost:8123';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CAPTURAS = new URL('../.capturas/', import.meta.url).pathname;

mkdirSync(CAPTURAS, { recursive: true });

let fallos = 0;
let pasados = 0;
const errores = [];

function comprobar(nombre, condicion, detalle = '') {
  if (condicion) {
    pasados++;
    console.log(`  ✓ ${nombre}`);
  } else {
    fallos++;
    console.error(`  ✗ ${nombre}${detalle ? '\n      ' + detalle : ''}`);
  }
}

const navegador = await chromium.launch({ executablePath: CHROME });
const contexto = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'es-ES',
});
const pagina = await contexto.newPage();

pagina.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errores.push(`[${m.type()}] ${m.text()}`);
});
pagina.on('pageerror', (e) => errores.push(`[pageerror] ${e.message}`));

async function captura(nombre) {
  await pagina.screenshot({ path: `${CAPTURAS}${nombre}.png` });
}

// Escribe un comando en la terminal visible y espera a que se procese.
async function comando(texto) {
  const input = pagina.locator('.vista[data-activa] .consola-input');
  await input.fill(texto);
  await input.press('Enter');
  await pagina.waitForTimeout(140);
}

async function salidaTerminal() {
  return pagina.locator('.vista[data-activa] .consola-salida').innerText();
}

console.log(`\n▸ Cargando ${BASE}`);
await pagina.goto(BASE, { waitUntil: 'networkidle' });
await pagina.waitForTimeout(500);

// ---------------------------------------------------------------- inicio
console.log('\n▸ Pantalla de inicio');
comprobar('la app arranca', await pagina.locator('.app').isVisible());
comprobar('se ve la ruta de módulos', (await pagina.locator('.modulo').count()) >= 20, `${await pagina.locator('.modulo').count()} módulos`);
comprobar('hay tarjeta de continuar', await pagina.locator('[data-continuar]').isVisible());
comprobar('las tres rutas están', (await pagina.locator('.ruta-cabecera').count()) === 3);
comprobar('el módulo 2 empieza bloqueado', (await pagina.locator('.modulo[data-estado="bloqueado"]').count()) > 0);
await captura('01-inicio');

// El cuerpo nunca debe poder desplazarse en horizontal.
const desbordaX = await pagina.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
comprobar('no hay desbordamiento horizontal', !desbordaX);

// ---------------------------------------------------------------- lección
console.log('\n▸ Lección');
await pagina.locator('[data-continuar]').click();
await pagina.waitForTimeout(300);
comprobar('se abre una lección', await pagina.locator('.vista[data-vista="leccion"][data-activa]').isVisible());
comprobar('la lección tiene contenido', (await pagina.locator('.vista[data-vista="leccion"] .tarjeta').count()) > 0);
await captura('02-leccion');

// ---------------------------------------------------------------- reto
console.log('\n▸ Reto con terminal');
// Avanzamos por las lecciones hasta encontrar la primera con reto.
for (let i = 0; i < 6; i++) {
  const practicar = pagina.locator('[data-practicar]');
  if (await practicar.count()) {
    await practicar.click();
    break;
  }
  const siguiente = pagina.locator('[data-siguiente]');
  if (await siguiente.count()) {
    await siguiente.click();
    await pagina.waitForTimeout(250);
  }
}
await pagina.waitForTimeout(350);
comprobar('se abre el reto', await pagina.locator('.vista[data-vista="reto"][data-activa]').isVisible());
comprobar('hay enunciado', await pagina.locator('.enunciado').isVisible());
comprobar('hay terminal', await pagina.locator('.vista[data-activa] .consola-input').isVisible());
comprobar('hay barra de teclas de Linux', (await pagina.locator('.vista[data-activa] .tecla').count()) >= 10);

// La terminal debe ejecutar de verdad.
await comando('ls -l');
let salida = await salidaTerminal();
comprobar('ls -l funciona en el reto', salida.includes('rw-'), salida.slice(-160));
await captura('03-reto');

// Un comando erróneo debe producir un diagnóstico explicativo.
await comando('comandoinventado');
await pagina.waitForTimeout(200);
comprobar('un error produce diagnóstico', await pagina.locator('.diagnostico').isVisible());
const textoDiag = await pagina.locator('.diagnostico').innerText();
comprobar('el diagnóstico explica el error', /no existe como comando|command/i.test(textoDiag), textoDiag);
await captura('04-diagnostico');

// La pista debe mostrarse.
await pagina.locator('[data-pista]').click();
await pagina.waitForTimeout(200);
comprobar('la pista aparece', await pagina.locator('.pista').first().isVisible());

// Resolver el reto con su solución debe celebrar y dar XP.
const xpAntes = await pagina.evaluate(() => window.__mentor.store.xp);
const solucion = await pagina.evaluate(() => {
  const id = document.querySelector('.vista[data-vista="reto"][data-activa]') ? null : null;
  return null;
});
// Se toma la solución del propio reto en curso a través del estado de la app.
await pagina.locator('[data-solucion]').click();
await pagina.waitForTimeout(200);
const textoSolucion = await pagina.locator('.pista').last().innerText();
const cmdSolucion = textoSolucion.replace(/^Solución:\s*/, '').trim();
await comando(cmdSolucion);
await pagina.waitForTimeout(600);

comprobar('se celebra al resolver', await pagina.locator('.celebracion[data-abierta]').isVisible());
const xpDespues = await pagina.evaluate(() => window.__mentor.store.xp);
comprobar('el XP sube', xpDespues > xpAntes, `${xpAntes} → ${xpDespues}`);
await captura('05-victoria');

await pagina.locator('.celebracion [data-boton]').last().click();
await pagina.waitForTimeout(300);

// ---------------------------------------------------------------- examen
console.log('\n▸ Examen');
await pagina.evaluate(() => window.__mentor.ir('examen', { moduloId: 'inicio' }));
await pagina.waitForTimeout(300);
comprobar('se abre el examen', await pagina.locator('.opcion').first().isVisible());
comprobar('hay 4 opciones', (await pagina.locator('.opcion').count()) === 4);
await captura('06-examen');
await pagina.locator('.opcion').first().click();
await pagina.waitForTimeout(250);
comprobar('la respuesta se explica', await pagina.locator('.explicacion').isVisible());
comprobar('se marca la correcta', (await pagina.locator('.opcion[data-estado="bien"]').count()) === 1);

// ---------------------------------------------------------------- terminal libre
console.log('\n▸ Terminal libre');
await pagina.locator('.pestana[data-pestana="terminal"]').click();
await pagina.waitForTimeout(400);
comprobar('se abre la terminal libre', await pagina.locator('.vista[data-vista="terminal"][data-activa]').isVisible());

await comando('pwd');
salida = await salidaTerminal();
comprobar('pwd responde', salida.includes('/home/user'), salida.slice(-120));

await comando('echo hola > prueba.txt && cat prueba.txt');
salida = await salidaTerminal();
comprobar('redirección y && funcionan', salida.includes('hola'), salida.slice(-120));

await comando('ps aux | grep nginx');
salida = await salidaTerminal();
comprobar('pipes funcionan', salida.includes('nginx'), salida.slice(-120));

await comando('cat /var/log/syslog');
salida = await salidaTerminal();
comprobar('los permisos se respetan', salida.includes('Permission denied'), salida.slice(-120));

await comando('sudo cat /var/log/syslog');
salida = await salidaTerminal();
comprobar('sudo eleva privilegios', salida.includes('render-worker'), salida.slice(-120));

await comando('find / -perm -4000 2>/dev/null');
salida = await salidaTerminal();
comprobar('la auditoría SUID encuentra binarios', salida.includes('/usr/bin/passwd'), salida.slice(-160));
await captura('07-terminal');

// La barra de teclas debe insertar en el campo.
await pagina.locator('.vista[data-activa] .tecla', { hasText: '|' }).first().click();
const valorInput = await pagina.locator('.vista[data-activa] .consola-input').inputValue();
comprobar('la barra de teclas inserta', valorInput.includes('|'), `valor: "${valorInput}"`);
await pagina.locator('.vista[data-activa] .consola-input').fill('');

// ---------------------------------------------------------------- incidentes
console.log('\n▸ Modo Incidente');
await pagina.locator('.pestana[data-pestana="incidentes"]').click();
await pagina.waitForTimeout(300);
comprobar('hay incidentes listados', (await pagina.locator('[data-incidente]').count()) >= 5);
await captura('08-incidentes');

await pagina.locator('[data-incidente]').first().click();
await pagina.waitForTimeout(400);
comprobar('el incidente arranca', await pagina.locator('#reloj').isVisible());
comprobar('se ven los objetivos', (await pagina.locator('.objetivo').count()) >= 3);
const reloj1 = await pagina.locator('#reloj').innerText();
await pagina.waitForTimeout(1400);
const reloj2 = await pagina.locator('#reloj').innerText();
comprobar('el cronómetro corre', reloj1 !== reloj2, `${reloj1} → ${reloj2}`);

await comando('systemctl list-failed');
await pagina.waitForTimeout(300);
comprobar('un objetivo se marca al cumplirlo', (await pagina.locator('.objetivo[data-hecho]').count()) >= 1);
await captura('09-incidente');

await pagina.locator('[data-salir]').click();
await pagina.waitForTimeout(300);

// ---------------------------------------------------------------- chuletas
console.log('\n▸ Chuletario');
await pagina.locator('.pestana[data-pestana="chuletas"]').click();
await pagina.waitForTimeout(300);
comprobar('hay chuletas', (await pagina.locator('.chuleta').count()) > 40);
await captura('10-chuletas');

await pagina.locator('#buscar-chuleta').fill('permisos');
await pagina.waitForTimeout(300);
const resultados = await pagina.locator('.chuleta').count();
comprobar('el buscador filtra', resultados > 0 && resultados < 90, `${resultados} resultados`);

await pagina.locator('#buscar-chuleta').fill('chmod');
await pagina.waitForTimeout(300);
await pagina.locator('.chuleta').first().click();
await pagina.waitForTimeout(250);
comprobar('la chuleta se despliega', await pagina.locator('.chuleta-detalle').first().isVisible());
await captura('11-chuleta-detalle');

// ---------------------------------------------------------------- perfil
console.log('\n▸ Perfil');
await pagina.locator('.pestana[data-pestana="perfil"]').click();
await pagina.waitForTimeout(300);
comprobar('se ve el nivel', await pagina.locator('.rango-insignia').isVisible());
comprobar('hay estadísticas', (await pagina.locator('.estadistica').count()) >= 6);
comprobar('hay mapa de dominio', (await pagina.locator('.dominio-celda').count()) === 20);
comprobar('hay logros', (await pagina.locator('.logro').count()) >= 20);
comprobar('hay temas', (await pagina.locator('.tema').count()) >= 5);
comprobar('los temas avanzados están bloqueados', (await pagina.locator('.tema[data-bloqueado]').count()) >= 4);
await captura('12-perfil');

// ---------------------------------------------------------------- persistencia
console.log('\n▸ Persistencia');
const xpGuardado = await pagina.evaluate(() => window.__mentor.store.xp);
await pagina.reload({ waitUntil: 'networkidle' });
await pagina.waitForTimeout(600);
const xpTrasRecarga = await pagina.evaluate(() => window.__mentor.store.xp);
comprobar('el progreso sobrevive a la recarga', xpTrasRecarga === xpGuardado, `${xpGuardado} → ${xpTrasRecarga}`);

// ---------------------------------------------------------------- offline
console.log('\n▸ Sin conexión');
const registrado = await pagina.evaluate(async () => {
  const r = await navigator.serviceWorker.getRegistration();
  return !!r;
});
comprobar('el service worker se registra', registrado);

if (registrado) {
  // Se espera a que el precache termine antes de cortar la red.
  await pagina.evaluate(() => navigator.serviceWorker.ready);
  await pagina.waitForTimeout(1200);
  await contexto.setOffline(true);
  try {
    await pagina.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
    await pagina.waitForTimeout(900);
    const funcionaSinRed = await pagina.locator('.modulo').count();
    comprobar('la app funciona sin conexión', funcionaSinRed >= 20, `${funcionaSinRed} módulos tras cortar la red`);
    await captura('13-offline');
  } catch (e) {
    comprobar('la app funciona sin conexión', false, e.message);
  }
  await contexto.setOffline(false);
}

// ---------------------------------------------------------------- consola
console.log('\n▸ Consola del navegador');
comprobar('sin errores ni avisos en consola', errores.length === 0, errores.slice(0, 8).join('\n      '));

// ---------------------------------------------------------------- resumen
console.log('\n─────────────────────────────────────────');
console.log(`${pasados} comprobaciones pasadas, ${fallos} fallidas`);
console.log(`Capturas en .capturas/`);

await navegador.close();
process.exit(fallos ? 1 : 0);
