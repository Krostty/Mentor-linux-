// Contrato integral de Mentor Linux v2: volumen, resolubilidad y persistencia.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Shell } from '../js/engine/shell.js';
import { COMMANDS } from '../js/engine/commands/index.js';
import { stripMarks } from '../js/engine/commands/util.js';
import { snapshot } from '../js/data/snapshots.js';
import {
  SALAS, BLOQUES, ACADEMIAS, RUTAS, TODOS_EJERCICIOS,
  TOTAL_SALAS, TOTAL_TAREAS, TOTAL_EJERCICIOS,
} from '../js/data/salas.js';
import { MAQUINAS } from '../js/data/maquinas.js';
import { WARGAME } from '../js/data/wargame.js';
import { respuestaCorrecta } from '../js/data/secretos.js';
import { LOGROS } from '../js/data/logros.js';
import { Store } from '../js/store.js';

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
test('hay exactamente 5 academias', ACADEMIAS.length === 5, String(ACADEMIAS.length));
test('hay exactamente 10 rutas', RUTAS.length === 10, String(RUTAS.length));
test('hay exactamente 24 salas', TOTAL_SALAS === 24, String(TOTAL_SALAS));
test('hay al menos 140 tareas', TOTAL_TAREAS >= 140, String(TOTAL_TAREAS));
test('hay exactamente 325 ejercicios', TOTAL_EJERCICIOS === 325, String(TOTAL_EJERCICIOS));
test('hay exactamente 12 máquinas', MAQUINAS.length === 12, String(MAQUINAS.length));
test('hay exactamente 15 niveles Wargame', WARGAME.length === 15, String(WARGAME.length));
test('hay exactamente 40 logros', LOGROS.length === 40, String(LOGROS.length));
test('existe la Sala 0 absoluta', SALAS.some((s) => s.n === 0 && s.id === 'cero-absoluto'));

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

console.log('▸ Resolviendo los 325 ejercicios');
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
}

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
persistente.registrarIntento(ejercicioDominio, { correcto: false });
test('un fallo programa repaso inmediato', persistente.estado.habilidades.pwd.proxima <= new Date().toISOString().slice(0, 10));
const legado = new Store({ version: 1, xp: 99, retosCompletados: ['r1-echo'], leccionesVistas: ['inicio/que-es'], modulosCompletados: ['inicio'] });
test('migración v1 conserva XP', legado.xp === 99);
test('migración v1 conserva retos', legado.estado.ejerciciosCompletados.includes('r1-echo'));
test('migración v1 crea tareas', legado.estado.tareasCompletadas.includes('inicio-que-es-teoria'));

const raiz = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const sw = readFileSync(resolve(raiz, 'sw.js'), 'utf8');
const recursos = [...sw.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((x) => /^(?:\.\/|index|manifest|css\/|js\/|assets\/)/.test(x));
for (const recurso of recursos.filter((x) => x !== './')) test(`recurso offline ${recurso} existe`, existsSync(resolve(raiz, recurso)), recurso);
for (const requerido of ['js/data/salas.js', 'js/data/habilidades.js', 'js/data/maquinas.js', 'js/data/wargame.js', 'js/engine/commands/advanced.js']) test(`PWA precachea ${requerido}`, recursos.includes(requerido));
const manifest = JSON.parse(readFileSync(resolve(raiz, 'manifest.webmanifest'), 'utf8'));
test('manifest usa la paleta v3', manifest.theme_color === '#080b19' && manifest.background_color === '#080b19');
test('manifest abre Aprender', manifest.start_url.includes('#aprender'));

console.log(`\n${pasadas} pruebas v3 pasadas, ${fallidas} fallidas`);
if (fallos.length) for (const f of fallos) console.error(`  ✗ ${f}`);
process.exit(fallidas ? 1 : 0);
