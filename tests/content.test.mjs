// Valida el currículum entero: estructura, unicidad y que CADA reto se resuelve
// con su solución de referencia y pasa su propio check().
import { Shell } from '../js/engine/shell.js';
import { COMMANDS, COMMAND_NAMES } from '../js/engine/commands/index.js';
import { stripMarks } from '../js/engine/commands/util.js';
import { MODULOS, RUTAS, TODOS_LOS_RETOS, TOTAL_RETOS, TOTAL_LECCIONES, TOTAL_XP } from '../js/data/modules.js';
import { INCIDENTES } from '../js/data/incidentes.js';
import { TODOS_COMANDOS } from '../js/data/comandos.js';
import { LOGROS, NIVELES, TEMAS } from '../js/data/logros.js';
import { snapshot } from '../js/data/snapshots.js';

let fallos = 0;
let pasados = 0;

function comprobar(nombre, condicion, detalle = '') {
  if (condicion) {
    pasados++;
  } else {
    fallos++;
    console.error(`  ✗ ${nombre}${detalle ? '\n      ' + detalle : ''}`);
  }
}

// Crea una shell nueva sobre un snapshot limpio y ejecuta una serie de comandos,
// devolviendo el contexto que reciben los check() de los retos.
function ejecutar(nombreSnapshot, comandos) {
  const sh = new Shell({ fs: snapshot(nombreSnapshot), commands: COMMANDS, user: 'user' });
  const historial = [];
  let ultimo = null;
  for (const cmd of comandos) {
    const r = sh.run(cmd);
    historial.push(cmd);
    ultimo = { cmd, salida: stripMarks(r.output), code: r.code };
  }
  return { fs: sh.fs, shell: sh, historial, ultimo };
}

// --- 1. estructura ---------------------------------------------------------

console.log('\n▸ Estructura del currículum');

comprobar('hay 20 módulos', MODULOS.length === 20, `hay ${MODULOS.length}`);

const idsModulos = new Set();
const idsLecciones = new Set();
const idsRetos = new Set();

for (const m of MODULOS) {
  comprobar(`módulo ${m.n} tiene id único`, !idsModulos.has(m.id), m.id);
  idsModulos.add(m.id);
  comprobar(`módulo ${m.id} tiene nombre y resumen`, !!m.nombre && !!m.resumen);
  comprobar(`módulo ${m.id} tiene lecciones`, m.lecciones.length > 0);
  comprobar(`módulo ${m.id} tiene examen de 5 preguntas`, m.examen && m.examen.length === 5, `tiene ${m.examen ? m.examen.length : 0}`);

  for (const p of m.examen || []) {
    comprobar(`examen ${m.id}: 4 opciones`, p.opciones.length === 4);
    comprobar(`examen ${m.id}: índice correcto válido`, p.correcta >= 0 && p.correcta < p.opciones.length);
    comprobar(`examen ${m.id}: tiene explicación`, !!p.explicacion);
  }

  for (const l of m.lecciones) {
    const clave = m.id + '/' + l.id;
    comprobar(`lección ${clave} tiene id único`, !idsLecciones.has(clave));
    idsLecciones.add(clave);
    comprobar(`lección ${clave} tiene cuerpo`, l.cuerpo && l.cuerpo.length > 0);

    for (const r of l.retos || []) {
      comprobar(`reto ${r.id} tiene id único`, !idsRetos.has(r.id), r.id);
      idsRetos.add(r.id);
      comprobar(`reto ${r.id} tiene enunciado`, !!r.enunciado);
      comprobar(`reto ${r.id} tiene solución`, !!r.solucion);
      comprobar(`reto ${r.id} tiene check`, typeof r.check === 'function');
      comprobar(`reto ${r.id} tiene xp`, typeof r.xp === 'number' && r.xp > 0);
      comprobar(`reto ${r.id} tiene al menos una pista`, (r.pistas || []).length >= 1);
    }
  }
}

// Los módulos deben estar numerados del 1 al 20 sin huecos.
const numeros = MODULOS.map((m) => m.n).sort((a, b) => a - b);
comprobar('numeración correlativa 1..20', numeros.every((n, i) => n === i + 1), numeros.join(','));

// Cada módulo pertenece exactamente a una ruta.
for (const m of MODULOS) {
  const rutas = RUTAS.filter((r) => r.modulos.includes(m.n));
  comprobar(`módulo ${m.n} pertenece a una sola ruta`, rutas.length === 1, `${rutas.length} rutas`);
}

// --- 2. cada reto se resuelve con su solución ------------------------------

console.log('▸ Resolviendo cada reto con su solución de referencia');

const rotos = [];
for (const reto of TODOS_LOS_RETOS) {
  let ok = false;
  let motivo = '';
  try {
    const comandos = reto.solucion.split('\n').filter(Boolean);
    const ctx = ejecutar(reto.snapshot, comandos);
    ok = reto.check(ctx) === true;
    if (!ok) motivo = `salida: ${JSON.stringify((ctx.ultimo.salida || '').slice(0, 160))}`;
  } catch (e) {
    motivo = 'excepción: ' + e.message;
  }
  if (!ok) rotos.push(`${reto.id} (${reto.moduloId}) — ${reto.solucion}\n      ${motivo}`);
  comprobar(`reto ${reto.id} se resuelve con su solución`, ok, ok ? '' : rotos[rotos.length - 1]);
}

// --- 3. los diagnósticos no revientan --------------------------------------

console.log('▸ Diagnósticos de error');

for (const reto of TODOS_LOS_RETOS) {
  for (const d of reto.diagnostico || []) {
    comprobar(`diagnóstico de ${reto.id} tiene título y texto`, !!d.titulo && !!d.texto);
    let lanza = false;
    try {
      // Se evalúa contra un estado inicial sin tocar: no debe lanzar nunca.
      const ctx = ejecutar(reto.snapshot, ['pwd']);
      d.cuando(ctx);
    } catch (e) {
      lanza = true;
    }
    comprobar(`diagnóstico de ${reto.id} no lanza excepciones`, !lanza);
  }
}

// --- 4. incidentes ---------------------------------------------------------

console.log('▸ Modo Incidente');

comprobar('hay al menos 5 incidentes', INCIDENTES.length >= 5);
for (const inc of INCIDENTES) {
  comprobar(`incidente ${inc.id} tiene aviso y conclusión`, !!inc.aviso && !!inc.conclusion);
  comprobar(`incidente ${inc.id} tiene objetivos`, inc.objetivos.length >= 3);
  comprobar(`incidente ${inc.id} tiene tiempo y xp`, inc.minutos > 0 && inc.xp > 0);
  for (const o of inc.objetivos) {
    comprobar(`objetivo ${inc.id}/${o.id} tiene texto y ayuda`, !!o.texto && !!o.ayuda);
    let lanza = false;
    try {
      o.check(ejecutar(inc.snapshot, ['pwd']));
    } catch {
      lanza = true;
    }
    comprobar(`objetivo ${inc.id}/${o.id} no lanza`, !lanza);
  }
}

// --- 5. chuletario ---------------------------------------------------------

console.log('▸ Chuletario');

const sintaxisNoComando = new Set(['>', '>>', '2>', '2>&1', '/dev/null', '|', '&&', '||', '#!/bin/bash', 'set -euo pipefail', 'var=valor', '$1 $@ $#', '$?', '$( )', 'if', 'for', 'while']);

for (const c of TODOS_COMANDOS) {
  comprobar(`chuleta ${c.n} tiene descripción y sintaxis`, !!c.q && !!c.s);
  comprobar(`chuleta ${c.n} tiene ejemplo`, !!c.e);
  if (!sintaxisNoComando.has(c.n)) {
    comprobar(`chuleta ${c.n} existe en el motor`, COMMAND_NAMES.includes(c.n), `no implementado`);
  }
}

// --- 6. logros y niveles ---------------------------------------------------

console.log('▸ Logros y progresión');

const progresoVacio = {
  comandosEjecutados: 0, retosCompletados: [], modulosCompletados: [], rutasCompletadas: [],
  modulosSinPistas: [], incidentesResueltos: [], mejorCombo: 0, mejorRacha: 0,
  examenesPerfectos: 0, busquedasChuletario: 0, incidenteRapido: false,
};

for (const l of LOGROS) {
  comprobar(`logro ${l.id} tiene nombre, desc e icono`, !!l.nombre && !!l.desc && !!l.icono);
  let lanza = false;
  try {
    l.check(progresoVacio);
  } catch {
    lanza = true;
  }
  comprobar(`logro ${l.id} no lanza con progreso vacío`, !lanza);
}

comprobar('los niveles son crecientes', NIVELES.every((n, i) => i === 0 || n.xp > NIVELES[i - 1].xp));
comprobar('hay temas desbloqueables', TEMAS.length >= 5);
comprobar('el primer tema está disponible desde el inicio', TEMAS[0].requiere === 0);

// --- resumen ---------------------------------------------------------------

console.log('\n─────────────────────────────────────────');
console.log(`Módulos: ${MODULOS.length}   Lecciones: ${TOTAL_LECCIONES}   Retos: ${TOTAL_RETOS}   XP total: ${TOTAL_XP}`);
console.log(`Incidentes: ${INCIDENTES.length}   Comandos en el chuletario: ${TODOS_COMANDOS.length}   Logros: ${LOGROS.length}`);
console.log(`Comandos implementados en el motor: ${COMMAND_NAMES.length}`);
console.log('─────────────────────────────────────────');
console.log(`${pasados} comprobaciones pasadas, ${fallos} fallidas`);

if (rotos.length) {
  console.error('\nRetos que no se resuelven con su solución:');
  for (const r of rotos) console.error('  • ' + r);
}

process.exit(fallos ? 1 : 0);
