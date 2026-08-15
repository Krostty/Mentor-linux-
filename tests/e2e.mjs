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

async function shot(nombre) {
  await pagina.waitForTimeout(420);
  await pagina.screenshot({ path: join(capturas, `${nombre}.png`) });
}
async function imagenCargada(selector, ancho = 0) {
  const img = pagina.locator(selector);
  await img.scrollIntoViewIfNeeded();
  try {
    await pagina.waitForFunction(({ selector, ancho }) => {
      const node = document.querySelector(selector);
      return !!node && node.complete && node.naturalWidth > 0 && (!ancho || node.naturalWidth === ancho);
    }, { selector, ancho }, { timeout: 5000 });
    return true;
  } catch { return false; }
}
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
  // La portada muestra las academias como fichas de catálogo: los módulos
  // viven en la pantalla de cada academia, no amontonados en el inicio.
  comprobar('hay 6 academias en la portada', await pagina.locator('.tarjeta-academia').count() === 6);
  comprobar('cada academia lleva su cubierta', await pagina.locator('.tarjeta-academia .cubierta').count() === 6);
  comprobar('las seis academias usan las portadas PNG aprobadas',
    await pagina.locator('.tarjeta-academia .cubierta[data-portada-png] img[src$=".png"]').count() === 6);
  comprobar('la portada no despliega módulos', await pagina.locator('.modulo').count() === 0);
  comprobar('la portada muestra el nivel y la ruta de rangos', await pagina.locator('.rango').count() === 6);
  comprobar('la portada muestra las tres métricas', await pagina.locator('.metrica-inicio').count() === 3);
  const totalEjercicios = await pagina.evaluate(() => window.__mentor.totales.ejercicios);
  comprobar('el marcador refleja el total de ejercicios',
    (await pagina.locator('.continuar-progreso').innerText()).includes(String(totalEjercicios)), String(totalEjercicios));
  comprobar('no hay desborde horizontal', await pagina.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  await shot('v3-01-aprender');

  // Entrar en una academia abre su pantalla con todos sus módulos.
  await pagina.locator('.tarjeta-academia .cubierta-boton[data-academia="linux"]').click();
  comprobar('la academia abre su propia pantalla', await pagina.locator('.academia-detalle').isVisible());
  comprobar('la academia Linux agrupa sus 7 rutas', await pagina.locator('.grupo-ruta').count() === 7);
  comprobar('cada ruta Linux muestra su preparación', await pagina.locator('[data-prerrequisitos-ruta]').count() === 7);
  comprobar('la ruta inicial se presenta como punto de entrada',
    await pagina.locator('[data-prerrequisitos-ruta="fundamentos-informatica"][data-estado="lista"]').count() === 1);
  comprobar('las rutas posteriores recomiendan bases sin ocultarse',
    await pagina.locator('[data-prerrequisitos-ruta][data-estado="refuerzo"]').count() >= 1);
  comprobar('la academia Linux muestra sus 17 módulos', await pagina.locator('.modulo').count() === 17);
  comprobar('solo el módulo en curso viene abierto', await pagina.locator('.modulo[open]').count() === 1);
  comprobar('el resto queda cerrado en orden', await pagina.locator('.modulo-etiqueta[data-estado="cerrado"]').count() === 16);
  await shot('v3-01b-academia');

  await pagina.locator('.modulo[open] .btn-secundario[data-sala="fundamentos-informatica"]').click();
  comprobar('Fundamentos abre seis lecciones desde cero', await pagina.locator('.fila-leccion[data-leccion]').count() === 6);
  comprobar('Fundamentos se identifica como punto de entrada',
    (await pagina.locator('.preparacion-ruta').innerText()).includes('Punto de entrada'));
  await pagina.evaluate(() => window.__mentor.ir('sala', { id: 'cero-absoluto' }));
  // La sala ya no vuelca su contenido: enumera lecciones cortas.
  comprobar('la sala lista sus 5 lecciones', await pagina.locator('.fila-leccion[data-leccion]').count() === 5);
  comprobar('la sala no pinta ejercicios', await pagina.locator('.ejercicio').count() === 0);
  comprobar('la sala explica que los prerrequisitos no bloquean el acceso directo',
    (await pagina.locator('.preparacion-ruta').innerText()).includes('Mentor no bloquea'));
  comprobar('las lecciones se abren en orden', await pagina.locator('.fila-leccion[data-estado="bloqueada"]').count() === 4);
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

  // Fallar explica la diferencia y deja volver a decidir sin convertir el
  // quiz en descarte por eliminación.
  await pagina.locator('.opcion[data-opcion="1"]').click();
  comprobar('la opción fallada queda marcada pero disponible',
    await pagina.locator('.opcion[data-incorrecta]:not(:disabled)').count() === 1);
  const feedbackQuiz = await pagina.locator('.leccion-pie .feedback').innerText();
  comprobar('el fallo explica la elección sin eliminar alternativas',
    feedbackQuiz.includes('Elegiste') && !feedbackQuiz.includes('Quedan'));
  await shot('v4-04-fallo-correctivo');

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
  comprobar('salir devuelve a la lista de lecciones', await pagina.locator('.fila-leccion[data-leccion]').count() === 5);

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

  console.log('▸ Motor pedagógico V2');
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'cero-moverse' }));
  comprobar('el piloto Linux empieza con teoría', await pagina.locator('.paso-teoria').isVisible());
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('Linux intercala una imagen pedagógica', await pagina.locator('.paso-imagen img[src$="filesystem-raiz.png"]').isVisible());
  comprobar('la imagen Linux tiene alt descriptivo', (await pagina.locator('.paso-imagen img').getAttribute('alt')).includes('filesystem Linux'));
  comprobar('la imagen Linux carga y conserva proporción', await imagenCargada('.paso-imagen img', 960)
    && await pagina.locator('.paso-imagen img').evaluate((img) => img.naturalHeight === 640));
  comprobar('el bloque visual no desborda en móvil', await pagina.locator('.paso-imagen').evaluate((el) => el.scrollWidth <= el.clientWidth + 1));
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('después de la imagen llega práctica', await pagina.locator('#ejercicio-cero-q3').isVisible());

  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'rc-que-es-red' }));
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('Redes intercala su PNG pedagógico', await pagina.locator('.paso-imagen img[src$="viaje-paquete.png"]').isVisible());
  comprobar('el caption explica el gateway', (await pagina.locator('.paso-imagen figcaption').innerText()).includes('192.168.1.1'));
  comprobar('la imagen de Redes carga', await imagenCargada('.paso-imagen img', 960));
  await pagina.locator('.leccion-salir').click();

  // El piloto completo empieza pidiendo recuperar y predecir, antes de
  // revelar el modelo. La confianza se guarda junto con la respuesta.
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'rt-handshake' }));
  comprobar('TCP empieza con diagnóstico, no con lectura pasiva',
    await pagina.locator('[data-tipo-pedagogico="diagnostico"]').isVisible());
  await shot('v6-01-tcp-diagnostico');
  await pagina.locator('[data-evidencia-paso] textarea').fill('El cliente envió SYN y todavía falta SYN-ACK.');
  await pagina.locator('.confianza label').nth(1).click();
  await pagina.getByRole('button', { name: 'Guardar y continuar' }).click();
  comprobar('el segundo paso pide predecir', await pagina.locator('[data-tipo-pedagogico="prediccion"]').isVisible());
  await shot('v6-02-tcp-prediccion');
  await pagina.locator('.opciones-prediccion .opcion').filter({ hasText: 'SYN-ACK' }).click();
  await pagina.locator('.confianza label').nth(2).click();
  await pagina.getByRole('button', { name: 'Guardar y continuar' }).click();
  comprobar('después de predecir aparece un ejemplo resuelto',
    await pagina.locator('.paso-teoria .ejemplo-pasos').isVisible());
  await shot('v6-03-tcp-ejemplo');
  await pagina.locator('.leccion-salir').click();

  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'permisos-chmod-letras-teoria' }));
  comprobar('Permisos también usa diagnóstico y confianza',
    await pagina.locator('[data-tipo-pedagogico="diagnostico"] .confianza').isVisible());
  await pagina.locator('.leccion-salir').click();

  console.log('▸ Currículo Fases 3, 4 y 5');
  comprobar('el currículo suma 56 salas y 1.547 ejercicios', await pagina.evaluate(() => {
    const { salas, ejercicios } = window.__mentor.totales;
    return salas === 56 && ejercicios === 1547;
  }));
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'fi-cpu-memoria' }));
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('Fundamentos integra el diagrama de arquitectura',
    await pagina.locator('.paso-imagen img[src$="arquitectura-computador.png"]').isVisible());
  comprobar('el diagrama de arquitectura carga', await imagenCargada('.paso-imagen img', 960));
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'li-stack-almacenamiento' }));
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('Linux integra el diagrama de almacenamiento',
    await pagina.locator('.paso-imagen img[src$="almacenamiento-internals.png"]').isVisible());
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 're-encapsulacion' }));
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('Redes integra encapsulación por capas',
    await pagina.locator('.paso-imagen img[src$="encapsulacion.png"]').isVisible());
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'rt-handshake' }));
  await pagina.getByRole('button', { name: 'Guardar y continuar' }).click();
  await pagina.getByRole('button', { name: 'Guardar y continuar' }).click();
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('Redes integra el handshake TCP',
    await pagina.locator('.paso-imagen img[src$="handshake-tcp.png"]').isVisible());
  comprobar('las nuevas lecciones visuales no desbordan',
    await pagina.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  await pagina.locator('.leccion-salir').click();

  await pagina.evaluate(() => window.__mentor.ir('academia', { id: 'bash' }));
  comprobar('Bash y Python agrupa sus 6 rutas progresivas', await pagina.locator('.grupo-ruta').count() === 6);
  comprobar('la academia de programación muestra sus 7 módulos', await pagina.locator('.modulo').count() === 7);
  comprobar('Python aparece después de Bash profesional',
    (await pagina.locator('.academia-detalle').innerText()).includes('Python desde cero'));
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'py-ejecucion', ejercicio: 'py-run-t2' }));
  comprobar('la práctica Python abre una terminal real del laboratorio', await pagina.locator('#ejercicio-py-run-t2 .consola-input').isVisible());
  await comando("python3 -c 'print(7 * 6)'");
  comprobar('Python ejecuta y valida el resultado en la lección',
    await pagina.locator('#ejercicio-py-run-t2[data-completo] .feedback-completo').getByText('Ya lo resolviste').isVisible());
  await pagina.locator('.leccion-salir').click();

  await pagina.evaluate(() => window.__mentor.ir('academia', { id: 'web' }));
  comprobar('Web usa su portada PNG propia', await pagina.locator('.academia-detalle img[src$="09-web.png"]').count() === 1);
  comprobar('Web agrupa sus 6 rutas progresivas', await pagina.locator('.grupo-ruta').count() === 6);
  comprobar('la academia Web muestra sus 6 módulos', await pagina.locator('.modulo').count() === 6);
  const nombresRutasWeb = await pagina.locator('.grupo-ruta > span:first-child').allTextContents();
  comprobar('Web llega desde arquitectura hasta SQL',
    nombresRutasWeb[0] === 'Cómo funciona la Web' && nombresRutasWeb.at(-1) === 'SQL y datos relacionales');
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'wa-viaje', ejercicio: 'wa-viaje-c1' }));
  await pagina.locator('.leccion-pie [data-mover="-1"]').click();
  comprobar('Web intercala el ciclo visual de una petición', await pagina.locator('.paso-imagen img[src$="ciclo-peticion.png"]').isVisible());
  comprobar('el diagrama Web carga y explica el regreso de la respuesta',
    await imagenCargada('.paso-imagen img', 1774) && (await pagina.locator('.paso-imagen figcaption').innerText()).includes('respuesta vuelve'));
  comprobar('el diagrama Web no desborda en móvil', await pagina.locator('.paso-imagen').evaluate((el) => el.scrollWidth <= el.clientWidth + 1));
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'sf-select', ejercicio: 'sf-select-t2' }));
  comprobar('SQL abre un laboratorio real de solo lectura', await pagina.locator('#ejercicio-sf-select-t2 .consola-input').isVisible());
  await comando('sqlite3 tienda.db "SELECT nombre, precio FROM productos WHERE precio < 50 ORDER BY precio"');
  comprobar('SQL ejecuta y valida filtros y orden',
    await pagina.locator('#ejercicio-sf-select-t2[data-completo] .feedback-completo').getByText('Ya lo resolviste').isVisible());
  await pagina.locator('.leccion-salir').click();


  console.log('▸ Máquina completa');
  await pagina.locator('[data-pestana="maquinas"]').click();
  comprobar('Máquinas usa su portada general PNG', await pagina.locator('.portada-seccion[data-seccion="maquinas"] img[src$=".png"]').count() === 1);
  comprobar('hay 12 máquinas', await pagina.locator('[data-maquina]').count() === 12);
  await pagina.locator('[data-maquina="lumen"]').click();
  // La máquina se recorre guiada: una fase por pantalla, con la terminal
  // integrada y su explicación.
  comprobar('la máquina abre en modo guiado', await pagina.locator('.maquina-guia').isVisible());
  comprobar('arranca en la fase 1', (await pagina.locator('#maq-cuenta').innerText()).trim() === 'Fase 1/4');
  comprobar('la fase trae su guía didáctica', await pagina.locator('.maquina-guia-texto').count() === 1);
  comprobar('la máquina ofrece cinco niveles de autonomía', await pagina.locator('[data-autonomia]').count() === 5);
  await pagina.locator('[data-autonomia="asistida"]').click();
  comprobar('modo asistido retira la explicación completa', await pagina.locator('.maquina-guia-texto').count() === 0);
  await pagina.locator('[data-autonomia="guiada"]').click();
  comprobar('se puede volver al modo guiado', await pagina.locator('.maquina-guia-texto').count() === 1);
  comprobar('terminal de máquina enfoca sola', await pagina.locator('.consola-input').evaluate((e) => e === document.activeElement));
  // «Ver desarrollo» revela el comando de la fase.
  await pagina.locator('[data-dev-fase]').click();
  comprobar('«Ver desarrollo» muestra el comando', (await pagina.locator('.maquina-desarrollo').innerText()).includes('nmap -sV'));
  await shot('v4-08-maquina-fase');
  await comando('nmap -sV 10.10.10.21');
  comprobar('la fase 1 se supera y avanza a la 2', (await pagina.locator('#maq-cuenta').innerText()).trim() === 'Fase 2/4');
  await pagina.reload({ waitUntil: 'domcontentloaded' });
  comprobar('la máquina conserva el avance tras recargar', (await pagina.locator('#maq-cuenta').innerText()).trim() === 'Fase 2/4');
  for (const cmd of ['curl http://lumen.box/robots.txt', 'ssh alex@lumen.box', 'sudo -l', 'sudo -i']) await comando(cmd);
  comprobar('se completan las 4 fases y aparecen las banderas', await pagina.locator('[data-banderas]').count() === 1);
  await comando('cat /home/alex/user.txt');
  await comando('cat /root/root.txt');
  const salida = await pagina.locator('.consola-salida').innerText();
  const flags = salida.match(/ML\{[^}]+\}/g) || [];
  comprobar('la máquina entrega dos flags', flags.length >= 2, flags.join(', '));
  await pagina.getByLabel('Bandera user.txt').fill(flags.at(-2) || '');
  await pagina.getByRole('button', { name: 'Validar user', exact: true }).click();
  await pagina.getByLabel('Bandera root.txt').fill(flags.at(-1) || '');
  await pagina.getByRole('button', { name: 'Validar root', exact: true }).click();
  comprobar('las flags abren el reporte, no completan solas la máquina', await pagina.locator('[data-reporte-maquina]').isVisible());
  await pagina.waitForTimeout(2700);
  await shot('v6-04-maquina-reporte');
  await pagina.locator('textarea[name="observacion"]').fill('La regla sudo permite elevar privilegios sin control suficiente.');
  await pagina.locator('textarea[name="evidencia"]').fill('sudo -l y sudo -i demostraron una shell root reproducible.');
  await pagina.locator('textarea[name="impacto"]').fill('El usuario local puede obtener control administrativo completo.');
  await pagina.locator('textarea[name="remediacion"]').fill('Restringir sudoers al comando y los argumentos mínimos necesarios.');
  await pagina.getByRole('button', { name: 'Entregar reporte' }).click();
  const celebMaquina = pagina.locator('.celebracion [data-boton="0"]');
  if (await celebMaquina.count()) await celebMaquina.click();
  comprobar('el writeup se desbloquea después del reporte', await pagina.locator('.writeup').isVisible());
  await shot('v3-03-maquina-completa');
  await pagina.locator('.maquina-guia .leccion-pie [data-ir="maquinas"]').click();
  comprobar('la máquina completada se marca en la lista', await pagina.locator('[data-maquina="lumen"] h3').innerText().then((t) => t.includes('✓')));

  console.log('▸ Wargame y laboratorio');
  await pagina.locator('[data-pestana="practicar"]').click();
  comprobar('hay 8 tarjetas de reto', await pagina.locator('.tarjeta-reto').count() === 8);
  comprobar('cada reto lleva su portada ilustrada', await pagina.locator('.tarjeta-reto .cubierta-arte').count() === 8);
  comprobar('cada reto lleva su insignia de dificultad', await pagina.locator('.insignia-dificultad').count() === 8);
  comprobar('los accesos rápidos son tres filas', await pagina.locator('.fila-acceso').count() === 3);
  comprobar('Wargame usa su portada general PNG', await pagina.locator('.panel-wargame .portada-seccion[data-seccion="wargame"] img[src$=".png"]').count() === 1);
  comprobar('hay 15 niveles Wargame', await pagina.locator('.wargame-lista [data-wargame]').count() === 15);
  await pagina.locator('[data-wargame="bandit-0"] .btn').click();
  await comando('cat README');
  await pagina.getByLabel('Contraseña del siguiente nivel').fill('linux-opens-the-door');
  await pagina.getByRole('button', { name: 'Desbloquear', exact: true }).click();
  comprobar('Wargame desbloquea el nivel siguiente', await pagina.getByText('Has desbloqueado').isVisible());
  await pagina.locator('.celebracion [data-boton="0"]').click();
  comprobar('se abre Bandit 1', await pagina.getByText('Wargame · Nivel 01 de 14').isVisible());
  await pagina.locator('[data-pestana="practicar"]').click();
  await pagina.locator('.tarjeta-reto .btn[data-laboratorio="lab-orientacion"]').click();
  for (const cmd of ['whoami', 'pwd', 'uname -a']) await comando(cmd);
  comprobar('misión rápida valida el estado', await pagina.getByRole('heading', { name: 'Misión completada', exact: true }).isVisible());
  await shot('v3-04-laboratorio');
  await pagina.getByRole('button', { name: 'Más retos', exact: true }).click();

  comprobar('el panel de puntos débiles existe', await pagina.locator('.debiles, .vacio-suave').count() > 0);
  comprobar('el contenido auxiliar queda plegado y Wargame conserva su panel visible',
    await pagina.locator('details.plegable').count() === 3 && await pagina.locator('.panel-wargame').isVisible());

  console.log('▸ Perfil y offline');
  await pagina.locator('[data-pestana="perfil"]').click();
  // La copia de seguridad vive en un bloque plegable al final del perfil: es
  // importante, pero no es lo que vienes a ver al abrir tu perfil. Lo que hay
  // que garantizar es que se pueda llegar a ella y que funcione.
  const copia = pagina.locator('details').filter({ hasText: 'Copia de seguridad' }).first();
  comprobar('la copia de seguridad es accesible', await copia.count() === 1);
  await copia.locator('summary').click();
  comprobar('exportar e importar se despliegan', await pagina.locator('.transferencia [data-exportar]').isVisible());
  comprobar('el perfil muestra las 24 capacidades compuestas', await pagina.locator('[data-mapa-capacidades] .capacidad-fila').count() === 24);
  comprobar('cada capacidad conserva su medidor de mastery', await pagina.locator('.capacidad-fila .barra').count() === 24);
  await pagina.locator('[data-mapa-capacidades]').scrollIntoViewIfNeeded();
  comprobar('el mapa de capacidades no desborda en móvil', await pagina.locator('[data-mapa-capacidades]').evaluate((nodo) => nodo.scrollWidth <= nodo.clientWidth + 1));
  await shot('v2-05-capacidades');
  comprobar('el mapa cubre todas las salas', await pagina.locator('.dominio-fila').count() === await pagina.evaluate(() => window.__mentor.totales.salas));
  comprobar('hay 40 fichas de logro', await pagina.locator('.logro-ficha').count() === 40);
  comprobar('los ajustes traen vibración y sonidos', await pagina.locator('.fila-opcion[data-ajuste]').count() === 2);
  const interruptor = pagina.locator('.fila-opcion[data-ajuste="sonidos"]');
  comprobar('los sonidos vienen encendidos', await interruptor.getAttribute('aria-pressed') === 'true');
  await interruptor.click();
  comprobar('el interruptor de sonidos se apaga', await interruptor.getAttribute('aria-pressed') === 'false');
  comprobar('el ajuste queda guardado', await pagina.evaluate(() => window.__mentor.store.sonidosActivos === false));
  await interruptor.click();
  comprobar('existe el dominio comando a comando', await pagina.getByText('Ver los 109 comandos').isVisible());
  await shot('v3-05-perfil');

  await pagina.evaluate(() => navigator.serviceWorker.ready);
  await contexto.setOffline(true);
  await pagina.reload({ waitUntil: 'domcontentloaded' });
  comprobar('la app abre offline', await pagina.locator('.app').isVisible());
  comprobar('el progreso sigue offline', (await pagina.locator('#ficha-xp').innerText()) !== '0 XP');
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'rc-que-es-red' }));
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('la imagen pedagógica abre offline', await imagenCargada('.paso-imagen img', 960));
  await pagina.evaluate(() => window.__mentor.ir('leccion', { id: 'rt-handshake' }));
  await pagina.locator('[data-evidencia-paso] textarea').fill('SYN enviado; falta respuesta.');
  await pagina.locator('.confianza label').first().click();
  await pagina.getByRole('button', { name: 'Guardar y continuar' }).click();
  await pagina.locator('.opciones-prediccion .opcion').first().click();
  await pagina.locator('.confianza label').first().click();
  await pagina.getByRole('button', { name: 'Guardar y continuar' }).click();
  await pagina.locator('.leccion-pie [data-mover="1"]').click();
  comprobar('el diagrama Fase 3 abre offline', await imagenCargada('.paso-imagen img', 960));
  await contexto.setOffline(false);

  comprobar('no hubo errores de consola', errores.length === 0, errores.join(' | '));
} finally {
  await contexto.setOffline(false).catch(() => {});
  await navegador.close();
}

console.log(`\n${pasadas} comprobaciones E2E pasadas, ${fallidas} fallidas`);
if (errores.length) errores.forEach((e) => console.error(`  ${e}`));
process.exit(fallidas ? 1 : 0);
