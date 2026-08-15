// Contrato integral de Mentor Linux v2: volumen, resolubilidad y persistencia.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Shell } from '../js/engine/shell.js';
import { COMMANDS } from '../js/engine/commands/index.js';
import { stripMarks } from '../js/engine/commands/util.js';
import { snapshot } from '../js/data/snapshots.js';
import {
  SALAS, BLOQUES, ACADEMIAS, RUTAS, TODOS_EJERCICIOS,
  TOTAL_SALAS, TOTAL_TAREAS, TOTAL_EJERCICIOS, secuenciaDeTarea, erroresPasosTarea,
} from '../js/data/salas.js';
import { MAQUINAS } from '../js/data/maquinas.js';
import { WARGAME } from '../js/data/wargame.js';
import { respuestaCorrecta } from '../js/data/secretos.js';
import { LOGROS } from '../js/data/logros.js';
import { HABILIDADES } from '../js/data/habilidades.js';
import {
  CAPACIDADES, REQUISITOS_RUTA, evaluarCapacidad, erroresGrafoPrerequisitos,
} from '../js/data/prerrequisitos.js';
import { Store } from '../js/store.js';
import { PORTADA_PNG_POR_ID } from '../js/portadas.js';
import {
  TIPOS_CON_EJERCICIO, TIPOS_CON_TEORIA, opcionesQuizOrdenadas,
  feedbackQuiz, NIVELES_AUTONOMIA, INTERVALOS_REPASO_MINUTOS,
} from '../js/data/pedagogia.js';

let pasadas = 0;
let fallidas = 0;
const fallos = [];

function test(nombre, condicion, detalle = '') {
  if (condicion) pasadas++;
  else { fallidas++; fallos.push(`${nombre}${detalle ? ` — ${detalle}` : ''}`); }
}

function ejecutar({ nombreSnapshot, comandos, user = 'user', cwd, hostname = 'mentor', groupMap, machine }) {
  const shell = new Shell({ fs: snapshot(nombreSnapshot), commands: COMMANDS, user, cwd, hostname, groupMap, machine: machine ? structuredClone(machine) : null });
  const historial = [];
  let ultimo = null;
  const correr = (cmd) => {
    const r = shell.run(cmd);
    historial.push(cmd);
    ultimo = { cmd, salida: stripMarks(r.output), code: r.code };
    return ultimo;
  };
  for (const cmd of comandos) correr(cmd);
  return { shell, fs: shell.fs, historial, get ultimo() { return ultimo; }, correr };
}

console.log('\n▸ Contrato de contenido v3');
test('hay exactamente 6 academias', ACADEMIAS.length === 6, String(ACADEMIAS.length));
test('cada academia tiene al menos una ruta', ACADEMIAS.every((a) => a.rutas.length > 0), String(RUTAS.length));
test('hay al menos 28 salas', TOTAL_SALAS >= 28, String(TOTAL_SALAS));
test('hay al menos 140 tareas', TOTAL_TAREAS >= 140, String(TOTAL_TAREAS));
test('hay al menos 500 ejercicios', TOTAL_EJERCICIOS >= 500, String(TOTAL_EJERCICIOS));
test('hay exactamente 12 máquinas', MAQUINAS.length === 12, String(MAQUINAS.length));
test('hay exactamente 15 niveles Wargame', WARGAME.length === 15, String(WARGAME.length));
test('cada máquina tiene una portada PNG existente', MAQUINAS.every((m) => m.imagen.endsWith('.png') && existsSync(resolve(m.imagen))));
test('cada nivel Wargame tiene una portada PNG existente', WARGAME.every((n) => n.imagen.endsWith('.png') && existsSync(resolve(n.imagen))));
test('las nueve secciones usan sus portadas PNG aprobadas',
  Object.keys(PORTADA_PNG_POR_ID).length === 9 && Object.values(PORTADA_PNG_POR_ID).every((ruta) => ruta.endsWith('.png') && existsSync(resolve(ruta))));
test('hay exactamente 40 logros', LOGROS.length === 40, String(LOGROS.length));
test('existe la Sala 0 absoluta', SALAS.some((s) => s.n === 0 && s.id === 'cero-absoluto'));
const tareasConPasos = SALAS.flatMap((s) => s.tareas).filter((t) => Array.isArray(t.pasos));
test('el piloto V2 migra Linux y Redes', tareasConPasos.some((t) => t.id === 'cero-moverse') && tareasConPasos.some((t) => t.id === 'rc-que-es-red'));
test('los pilotos intercalan teoría y práctica', tareasConPasos.every((t) => {
  const tipos = secuenciaDeTarea(t).map((p) => p.tipo);
  return tipos.findIndex((tipo) => TIPOS_CON_EJERCICIO.has(tipo))
    < tipos.findLastIndex((tipo) => TIPOS_CON_TEORIA.has(tipo));
}));
const pilotosPedagogicos = tareasConPasos.filter((tarea) =>
  tarea.pasos.some((paso) => ['diagnostico', 'prediccion', 'reflexion', 'reporte'].includes(paso.tipo)));
test('TCP y permisos usan el ciclo pedagógico completo',
  ['rt-handshake', 'permisos-chmod-letras-teoria'].every((id) => pilotosPedagogicos.some((tarea) => tarea.id === id)));
test('los pilotos completos diagnostican, predicen, guían, transfieren, explican y reportan',
  pilotosPedagogicos.every((tarea) => ['diagnostico', 'prediccion', 'ejemplo', 'explicacion', 'practica-guiada', 'escenario', 'reflexion', 'reporte']
    .every((tipo) => tarea.pasos.some((paso) => paso.tipo === tipo))));
test('cada imagen pedagógica es PNG local', tareasConPasos.every((t) => t.pasos
  .filter((p) => p.tipo === 'imagen')
  .every((p) => existsSync(resolve(p.src)))));
const salasFase3 = ['fundamentos-informatica', 'linux-internals', 'enlace-red', 'transporte-red']
  .map((id) => SALAS.find((sala) => sala.id === id));
test('Fase 3 añade Fundamentos, internals Linux y protocolos de Red', salasFase3.every(Boolean));
test('las cuatro salas Fase 3 conservan origen de migración', salasFase3.every((sala) => sala.origen === 'v2-fase3'));
test('Fase 3 aporta 24 lecciones con pasos intercalados',
  salasFase3.flatMap((sala) => sala.tareas).length === 24 && salasFase3.flatMap((sala) => sala.tareas).every((tarea) => Array.isArray(tarea.pasos)));
test('Fase 3 cubre más de cien prácticas nuevas', salasFase3.flatMap((sala) => sala.tareas).flatMap((tarea) => tarea.practica).length >= 100);
test('Fase 3 integra sus cuatro diagramas locales', [
  'assets/teoria/fundamentos/arquitectura-computador.png',
  'assets/teoria/linux/almacenamiento-internals.png',
  'assets/teoria/redes/encapsulacion.png',
  'assets/teoria/redes/handshake-tcp.png',
].every((ruta) => existsSync(resolve(ruta))));
const salasFase4 = ['bash-profesional', 'python-fundamentos', 'python-datos', 'python-laboratorios']
  .map((id) => SALAS.find((sala) => sala.id === id));
test('Fase 4 añade Bash profesional y tres salas Python', salasFase4.every(Boolean));
test('las cuatro salas Fase 4 declaran su origen', salasFase4.every((sala) => sala.origen === 'v2-fase4'));
test('Fase 4 aporta 21 lecciones con pasos intercalados',
  salasFase4.flatMap((sala) => sala.tareas).length === 21 && salasFase4.flatMap((sala) => sala.tareas).every((tarea) => Array.isArray(tarea.pasos)));
test('Fase 4 aporta 126 prácticas nuevas', salasFase4.flatMap((sala) => sala.tareas).flatMap((tarea) => tarea.practica).length === 126);
test('la progresión de programación termina en laboratorios',
  ACADEMIAS.find((academia) => academia.id === 'bash').rutas.join(',') === 'bash-base,bash-proyectos,bash-profesional,python-fundamentos,python-datos,python-laboratorios');
test('Python de laboratorios exige Python de datos y servicios de red', ['python-datos', 'redes-servicios'].every((id) =>
  REQUISITOS_RUTA['python-laboratorios'].some((requisito) => requisito.tipo === 'ruta' && requisito.id === id)));
const salasFase5 = ['web-arquitectura', 'http-aplicaciones', 'javascript-web', 'apis-rest', 'identidad-web', 'sql-fundamentos']
  .map((id) => SALAS.find((sala) => sala.id === id));
test('Fase 5 añade seis salas de fundamentos Web y datos', salasFase5.every(Boolean));
test('las seis salas Fase 5 declaran su origen', salasFase5.every((sala) => sala.origen === 'v2-fase5'));
test('Fase 5 aporta 30 lecciones con pasos intercalados',
  salasFase5.flatMap((sala) => sala.tareas).length === 30 && salasFase5.flatMap((sala) => sala.tareas).every((tarea) => Array.isArray(tarea.pasos)));
test('Fase 5 aporta 180 prácticas nuevas', salasFase5.flatMap((sala) => sala.tareas).flatMap((tarea) => tarea.practica).length === 180);
test('Fase 5 integra tres diagramas Web locales', [
  'assets/teoria/web/ciclo-peticion.png',
  'assets/teoria/web/sesion-autenticacion.png',
  'assets/teoria/web/modelo-relacional.png',
].every((ruta) => existsSync(resolve(ruta))));
test('la academia Web conserva sus seis rutas progresivas',
  ACADEMIAS.find((academia) => academia.id === 'web').rutas.join(',') === 'web-arquitectura,web-http,web-javascript,web-apis,web-identidad,web-sql');
test('Web empieza después de Python y servicios de red', ['python-laboratorios', 'redes-servicios'].every((id) =>
  REQUISITOS_RUTA['web-arquitectura'].some((requisito) => requisito.tipo === 'ruta' && requisito.id === id)));
test('Pentesting Web exige identidad y SQL previamente', ['web-identidad', 'web-sql'].every((id) =>
  REQUISITOS_RUTA['ofensiva-aplicaciones'].some((requisito) => requisito.tipo === 'ruta' && requisito.id === id)));
const erroresGrafo = erroresGrafoPrerequisitos(RUTAS, HABILIDADES);
test('el grafo de prerrequisitos es íntegro y acíclico', erroresGrafo.length === 0, erroresGrafo.join('; '));
test('cada ruta declara sus prerrequisitos', Object.keys(REQUISITOS_RUTA).length === RUTAS.length);
test('hay capacidades compuestas para Linux, Redes, Bash, Programación, Web, Datos y Seguridad',
  ['linux', 'redes', 'bash', 'programacion', 'web', 'datos', 'seguridad'].every((area) => CAPACIDADES.some((capacidad) => capacidad.area === area)));
test('cada capacidad combina al menos tres habilidades', CAPACIDADES.every((capacidad) => capacidad.habilidades.length >= 3));
test('Pentesting avanzado exige Linux y Redes', ['linux-admin', 'redes-servicios'].every((id) =>
  REQUISITOS_RUTA['ofensiva-metodologia'].some((requisito) => requisito.tipo === 'ruta' && requisito.id === id)));
test('una capacidad sin evidencia empieza en nivel cero', evaluarCapacidad('terminal-linux', () => 0).nivel === 0);
test('una capacidad con todas sus habilidades dominadas llega a nivel seis', evaluarCapacidad('terminal-linux', () => 6).nivel === 6);
const habilidadesSinPractica = CAPACIDADES.flatMap((capacidad) => capacidad.habilidades
  .filter((habilidad) => !TODOS_EJERCICIOS.some((ejercicio) => ejercicio.habilidades.includes(habilidad)))
  .map((habilidad) => `${capacidad.id}:${habilidad}`));
test('todas las habilidades de capacidades son alcanzables con ejercicios', habilidadesSinPractica.length === 0, habilidadesSinPractica.join(', '));

const quizzes = TODOS_EJERCICIOS.filter((ejercicio) => ejercicio.tipo === 'quiz');
const posicionesCorrectas = quizzes.map((ejercicio) => opcionesQuizOrdenadas(ejercicio).findIndex((opcion) => opcion.correcta));
test('el orden visual de cada quiz es estable', quizzes.every((ejercicio) =>
  JSON.stringify(opcionesQuizOrdenadas(ejercicio)) === JSON.stringify(opcionesQuizOrdenadas(ejercicio))));
test('la respuesta correcta se distribuye por todas las posiciones', new Set(posicionesCorrectas).size >= 4, [...new Set(posicionesCorrectas)].join(','));
test('los fallos explican la alternativa sin descartarla', quizzes.every((ejercicio) => {
  const erronea = ejercicio.opciones.findIndex((_, indice) => indice !== ejercicio.correcta);
  const mensaje = feedbackQuiz(ejercicio, erronea);
  return mensaje.length >= 30 && !mensaje.includes('queda descartada');
}));

const idsSala = new Set();
const idsTarea = new Set();
const idsEjercicio = new Set();
for (const sala of SALAS) {
  test(`sala ${sala.id} tiene id único`, !idsSala.has(sala.id));
  idsSala.add(sala.id);
  test(`sala ${sala.id} tiene metadatos`, !!sala.nombre && !!sala.resumen && !!sala.dificultad && sala.minutos > 0);
  test(`sala ${sala.id} mezcla varias tareas`, sala.tareas.length >= 3, `${sala.tareas.length}`);
  test(`sala ${sala.id} tiene práctica`, sala.tareas.some((t) => t.practica.length > 0));
  for (const tarea of sala.tareas) {
    test(`tarea ${tarea.id} tiene id único`, !idsTarea.has(tarea.id));
    idsTarea.add(tarea.id);
    test(`tarea ${tarea.id} tiene teoría`, Array.isArray(tarea.teoria) && tarea.teoria.length > 0);
    test(`tarea ${tarea.id} tiene práctica`, Array.isArray(tarea.practica) && tarea.practica.length > 0);
    test(`tarea ${tarea.id} cumple schema de pasos V2`, erroresPasosTarea(tarea).length === 0, erroresPasosTarea(tarea).join('; '));
    test(`tarea ${tarea.id} produce una secuencia`, secuenciaDeTarea(tarea).length >= tarea.teoria.length + tarea.practica.length);
    for (const e of tarea.practica) {
      test(`ejercicio ${e.id} tiene id único`, !idsEjercicio.has(e.id));
      idsEjercicio.add(e.id);
      test(`ejercicio ${e.id} es autocontenido`, typeof e.enunciado === 'string' && e.enunciado.length >= 12);
      test(`ejercicio ${e.id} tiene XP`, e.xp > 0);
      test(`ejercicio ${e.id} tiene tipo válido`, ['terminal', 'quiz', 'respuesta', 'ordenar', 'completar'].includes(e.tipo), String(e.tipo));
      test(`ejercicio ${e.id} entrena habilidad`, Array.isArray(e.habilidades) && e.habilidades.length > 0, String(e.habilidades));
    }
  }
}
for (const bloque of BLOQUES) {
  test(`bloque ${bloque.id} referencia salas existentes`, bloque.salas.every((id) => idsSala.has(id)));
}
test('cada sala aparece una vez en los bloques', BLOQUES.flatMap((b) => b.salas).length === new Set(BLOQUES.flatMap((b) => b.salas)).size);

console.log(`▸ Resolviendo los ${TOTAL_EJERCICIOS} ejercicios`);
for (const e of TODOS_EJERCICIOS) {
  if (e.tipo === 'terminal') {
    let ok = false;
    let detalle = '';
    try {
      const ctx = ejecutar({ nombreSnapshot: e.snapshot || 'inicio', comandos: e.solucion.split('\n').filter(Boolean) });
      ok = e.check(ctx) === true;
      detalle = ctx.ultimo?.salida?.slice(0, 100) || '';
    } catch (error) { detalle = error.message; }
    test(`solución terminal ${e.id}`, ok, detalle);
    test(`terminal ${e.id} ofrece pista`, Array.isArray(e.pistas) && e.pistas.length > 0);
  } else if (e.tipo === 'quiz') {
    test(`quiz ${e.id} tiene opciones válidas`, e.opciones.length >= 2 && e.correcta >= 0 && e.correcta < e.opciones.length);
    test(`quiz ${e.id} explica la respuesta`, !!e.explicacion);
  } else if (['respuesta', 'completar'].includes(e.tipo)) {
    test(`respuesta ${e.id} acepta al menos una salida`, Array.isArray(e.respuestas) && e.respuestas.length > 0);
    test(`respuesta ${e.id} explica la salida`, !!e.explicacion);
  } else {
    test(`constructor ${e.id} tiene bloques`, Array.isArray(e.tokens) && e.tokens.length > 0);
    test(`constructor ${e.id} tiene solución`, typeof e.respuestaCorrecta === 'string' && e.respuestaCorrecta.length > 0);
    // La solución tiene que poder armarse usando cada ficha exactamente una
    // vez: si no, el ejercicio es irresoluble o sobran bloques.
    const restantes = [...e.tokens];
    let resto = e.respuestaCorrecta.trim();
    while (resto.length && restantes.length) {
      const orden = [...restantes].sort((a, b) => b.length - a.length);
      const pieza = orden.find((t) => resto.startsWith(t));
      if (!pieza) break;
      restantes.splice(restantes.indexOf(pieza), 1);
      resto = resto.slice(pieza.length).replace(/^\s+/, '');
    }
    test(`constructor ${e.id} usa todas sus fichas`, resto === '' && restantes.length === 0,
      `sobra "${resto}" y quedan ${restantes.length} fichas`);
  }
}

console.log('▸ Resolviendo máquinas completas');
for (const maquina of MAQUINAS) {
  const ctx = ejecutar({ nombreSnapshot: maquina.snapshot, comandos: [], user: 'kali', cwd: '/home/kali', hostname: 'attackbox', groupMap: maquina.groupMap, machine: maquina.profile });
  let fasesOk = true;
  for (const fase of maquina.fases) {
    for (const cmd of fase.solucion.split('\n').filter(Boolean)) ctx.correr(cmd);
    let ok = false;
    try { ok = fase.check(ctx) === true; } catch { ok = false; }
    fasesOk &&= ok;
    if (ok) { try { fase.onComplete?.(ctx); } catch { fasesOk = false; } }
  }
  test(`máquina ${maquina.id} resuelve sus 4 fases`, fasesOk && maquina.fases.length === 4);
  const user = ctx.correr(`cat /home/${maquina.user}/user.txt`).salida.trim();
  const root = ctx.correr('cat /root/root.txt').salida.trim();
  test(`máquina ${maquina.id} entrega user.txt válida`, respuestaCorrecta(user, maquina.userFlagHash), user);
  test(`máquina ${maquina.id} entrega root.txt válida`, respuestaCorrecta(root, maquina.rootFlagHash), root);
  test(`máquina ${maquina.id} tiene writeup`, maquina.writeup.length >= 4);
  test(`máquina ${maquina.id} declara alcance y ROE`, maquina.alcance.length >= 2 && maquina.roe.length >= 4 && maquina.requiereReporte);
}
test('las máquinas ofrecen cinco niveles de autonomía', NIVELES_AUTONOMIA.map((nivel) => nivel.id).join(',') === 'guiada,asistida,independiente,experta,red-team');

console.log('▸ Resolviendo Wargame encadenado');
for (const nivel of WARGAME) {
  const ctx = ejecutar({ nombreSnapshot: nivel.snapshot, comandos: nivel.solucion.split('\n').filter(Boolean), user: 'bandit', cwd: '/home/bandit', hostname: `bandit${nivel.n}`, groupMap: { bandit: ['bandit'] } });
  const candidata = (ctx.ultimo?.salida || '').trim().split(/\s+/).at(-1).replace(/^.*=/, '');
  test(`Wargame ${nivel.n} revela su contraseña`, respuestaCorrecta(candidata, nivel.passwordHash), candidata);
  test(`Wargame ${nivel.n} tiene pistas`, nivel.pistas.length >= 2);
}
test('Wargame está numerado 0..14', WARGAME.every((n, i) => n.n === i));

console.log('▸ Persistencia, migración y PWA');
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => memoria.get(k) ?? null,
  setItem: (k, v) => memoria.set(k, v),
  removeItem: (k) => memoria.delete(k),
};
const persistente = new Store();
test('Fundamentos es la nueva ruta de entrada sin requisitos', persistente.estadoPrerequisitosRuta('fundamentos-informatica').listo);
test('Linux desde cero recomienda Fundamentos sin bloquear su progreso',
  !persistente.estadoPrerequisitosRuta('linux-cero').listo && persistente.salaDesbloqueada('fundamentos-informatica'));
test('una ruta avanzada detecta bases ausentes sin modificar el progreso',
  !persistente.estadoPrerequisitosRuta('ofensiva-metodologia').listo && persistente.estado.ejerciciosCompletados.length === 0);
persistente.contarComando('ls');
persistente.contarBusqueda();
await new Promise((r) => setTimeout(r, 320));
test('contarComando persiste con debounce', JSON.parse(memoria.get('mentor-linux/progreso')).comandosEjecutados === 1);
test('contarBusqueda persiste con debounce', JSON.parse(memoria.get('mentor-linux/progreso')).busquedasChuletario === 1);
const copia = persistente.exportar();
const restaurado = new Store();
restaurado.importar(copia);
test('exportar/importar conserva dominio', restaurado.estado.dominioComandos.ls === 1);
const ejercicioDominio = TODOS_EJERCICIOS.find((e) => e.id === 'cero-pwd-repite');
persistente.completarEjercicio(ejercicioDominio);
persistente.completarEjercicio(ejercicioDominio);
test('dos recuperaciones elevan el dominio de pwd', persistente.nivelHabilidad('pwd') >= 3, String(persistente.nivelHabilidad('pwd')));
const demoraRepaso = new Date(persistente.estado.repaso[ejercicioDominio.id].proxima) - new Date();
test('un acierto programa recuperación a diez minutos', demoraRepaso > 8 * 60000 && demoraRepaso < 12 * 60000, String(demoraRepaso));
test('el calendario usa 10 min, 1, 3, 7 y 21 días', INTERVALOS_REPASO_MINUTOS.join(',') === '10,1440,4320,10080,30240');
persistente.registrarIntento(ejercicioDominio, { correcto: false });
test('un fallo programa repaso inmediato', new Date(persistente.estado.habilidades.pwd.proxima) <= new Date());
test('un fallo entra inmediatamente en la cola de repaso', persistente.retosParaRepasar().includes(ejercicioDominio.id));
persistente.guardarEvidenciaPaso('rt-handshake', 'tcp-prediccion', { respuesta: 'SYN-ACK', confianza: '2', correcto: true });
test('predicción y confianza persisten', persistente.evidenciaPaso('rt-handshake', 'tcp-prediccion').respuesta === 'SYN-ACK'
  && persistente.evidenciaPaso('rt-handshake', 'tcp-prediccion').confianza === '2');
test('la confianza produce una métrica de calibración', persistente.calibracionMetacognitiva().muestras === 1
  && persistente.calibracionMetacognitiva().precision === 1);
const legado = new Store({ version: 1, xp: 99, retosCompletados: ['r1-echo'], leccionesVistas: ['inicio/que-es'], modulosCompletados: ['inicio'] });
test('migración v1 conserva XP', legado.xp === 99);
test('migración v1 conserva retos', legado.estado.ejerciciosCompletados.includes('r1-echo'));
test('migración v1 crea tareas', legado.estado.tareasCompletadas.includes('inicio-que-es-teoria'));
test('un progreso legado obtiene capacidades sin campos nuevos', legado.estadisticas().dominioCapacidades.length === CAPACIDADES.length);

const evidenciaDominada = Object.fromEntries(
  CAPACIDADES.find((capacidad) => capacidad.id === 'terminal-linux').habilidades.map((id) => [id, {
    intentos: 7, aciertos: 7, sinPista: 7, fallos: 0,
    ejercicios: ['uno', 'dos', 'tres'], fechas: ['2026-08-01', '2026-08-02', '2026-08-03'],
    contextos: ['sala-a', 'sala-b', 'sala-c'], recuperaciones: 2,
  }]),
);
const ejerciciosLinuxCero = RUTAS.find((ruta) => ruta.id === 'linux-cero').salas
  .flatMap((salaId) => SALAS.find((sala) => sala.id === salaId).tareas)
  .flatMap((tarea) => tarea.practica.map((ejercicio) => ejercicio.id));
const preparado = new Store({ version: 4, habilidades: evidenciaDominada, ejerciciosCompletados: ejerciciosLinuxCero });
test('el mastery compuesto agrega habilidades atómicas', preparado.nivelCapacidad('terminal-linux') === 6);
test('completar la base y dominar sus habilidades prepara la ruta siguiente', preparado.estadoPrerequisitosRuta('linux-esencial').listo);

const laboratorio = new Store({ version: 4 });
const maquinaPiloto = MAQUINAS[0];
for (const fase of maquinaPiloto.fases) laboratorio.completarFaseMaquina(maquinaPiloto, fase);
laboratorio.registrarFlag(maquinaPiloto, 'user');
laboratorio.registrarFlag(maquinaPiloto, 'root');
test('las flags no sustituyen el reporte', !laboratorio.estadoMaquina(maquinaPiloto.id).completada);
laboratorio.guardarReporteMaquina(maquinaPiloto, {
  observacion: 'Permiso sudo excesivo en el usuario del servicio.',
  evidencia: 'sudo -l permitió verificar el comando autorizado como root.',
  impacto: 'Un usuario local puede conseguir control administrativo completo.',
  remediacion: 'Limitar sudoers al subcomando y argumentos estrictamente necesarios.',
});
test('el reporte completa la máquina', laboratorio.estadoMaquina(maquinaPiloto.id).completada);

const raiz = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const sw = readFileSync(resolve(raiz, 'sw.js'), 'utf8');
const recursos = [...sw.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((x) => /^(?:\.\/|index|manifest|css\/|js\/|assets\/)/.test(x));
for (const recurso of recursos.filter((x) => x !== './')) test(`recurso offline ${recurso} existe`, existsSync(resolve(raiz, recurso)), recurso);
for (const requerido of [
  'js/data/salas.js', 'js/data/habilidades.js', 'js/data/prerrequisitos.js', 'js/data/curriculum-v2.js', 'js/data/pedagogia.js',
  'js/data/salas-fundamentos.js', 'js/data/salas-linux-internals.js', 'js/data/salas-redes-profundas.js',
  'js/data/salas-programacion.js', 'js/data/salas-web.js', 'js/data/maquinas.js', 'js/data/wargame.js',
  'js/engine/commands/advanced.js', 'js/engine/commands/python.js', 'js/engine/commands/web.js',
  'assets/teoria/linux/filesystem-raiz.png', 'assets/teoria/redes/viaje-paquete.png',
  'assets/teoria/fundamentos/arquitectura-computador.png', 'assets/teoria/linux/almacenamiento-internals.png',
  'assets/teoria/redes/encapsulacion.png', 'assets/teoria/redes/handshake-tcp.png',
  'assets/portadas/09-web.png', 'assets/teoria/web/ciclo-peticion.png',
  'assets/teoria/web/sesion-autenticacion.png', 'assets/teoria/web/modelo-relacional.png',
]) test(`PWA precachea ${requerido}`, recursos.includes(requerido));
const manifest = JSON.parse(readFileSync(resolve(raiz, 'manifest.webmanifest'), 'utf8'));
// El manifest pinta la pantalla de arranque: si no coincide con el
// `theme-color` del HTML, la app abre con un destello del color viejo.
const temaHtml = readFileSync(resolve(raiz, 'index.html'), 'utf8').match(/name="theme-color" content="([^"]+)"/)?.[1];
test('manifest y html comparten el color de tema', manifest.theme_color === temaHtml, `${manifest.theme_color} vs ${temaHtml}`);
test('manifest arranca sobre el papel claro', manifest.background_color === '#f1f3f6', manifest.background_color);
test('manifest abre Aprender', manifest.start_url.includes('#aprender'));

console.log(`\n${pasadas} pruebas v3 pasadas, ${fallidas} fallidas`);
if (fallos.length) for (const f of fallos) console.error(`  ✗ ${f}`);
process.exit(fallidas ? 1 : 0);
