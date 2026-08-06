import {
  SALAS, SALA_POR_ID, BLOQUES, ACADEMIAS, RUTAS, RUTA_POR_ID, ACADEMIA_POR_ID, EJERCICIO_POR_ID,
  TOTAL_SALAS, TOTAL_TAREAS, TOTAL_EJERCICIOS,
} from './data/salas.js';
import { nombreHabilidad, NIVELES_DOMINIO } from './data/habilidades.js';
import { MAQUINAS, MAQUINA_POR_ID } from './data/maquinas.js';
import { WARGAME, NIVEL_WARGAME_POR_ID } from './data/wargame.js';
import { respuestaCorrecta } from './data/secretos.js';
import { TODOS_COMANDOS, buscarComandos } from './data/comandos.js';
import { LOGROS } from './data/logros.js';
import { Terminal } from './engine/terminal.js';
import { store } from './store.js';
import { escapar, formato, brindis, celebrar, porcentaje } from './ui.js';

const vista = document.getElementById('vista');
const pistasMostradas = new Map();
let rutaActual = { nombre: 'aprender', datos: {} };
let ejercicioActivo = null;
let terminalActiva = null;
let progresoPrevioDetectado = false;
let modoRepaso = false;

const MISIONES = [
  { id: 'lab-orientacion', nombre: 'Orientación exprés', dificultad: 'Inicial', snapshot: 'inicio', objetivo: 'Averigua usuario, carpeta y kernel con tres comandos.', solucion: 'whoami; pwd; uname -a', check: (c) => ['whoami', 'pwd'].every((x) => c.historial.some((h) => h === x)) && c.historial.some((h) => /^uname\s+-a$/.test(h)), xp: 35 },
  { id: 'lab-ocultos', nombre: 'Nada que ocultar', dificultad: 'Inicial', snapshot: 'navegacion', objetivo: 'Lista también los archivos ocultos de tu carpeta actual.', solucion: 'ls -la', check: (c) => c.historial.some((h) => /^ls\s+-(?:l?a|al)(?:\s|$)/.test(h)), xp: 35 },
  { id: 'lab-logs', nombre: 'Cazador de errores', dificultad: 'Fácil', snapshot: 'busqueda', objetivo: 'Busca de forma recursiva la palabra ERROR sin distinguir mayúsculas.', solucion: 'grep -ri ERROR .', check: (c) => c.historial.some((h) => /^grep\s+-(?:ri|ir)\s+error\s+\.$/i.test(h)), xp: 45 },
  { id: 'lab-pipes', nombre: 'Tubería limpia', dificultad: 'Fácil', snapshot: 'pipes', objetivo: 'Cuenta cuántos usuarios únicos aparecen en `/etc/passwd` usando una tubería.', solucion: "cut -d: -f1 /etc/passwd | sort -u | wc -l", check: (c) => c.historial.some((h) => h.includes('cut ') && h.includes('| sort -u') && h.includes('| wc -l')), xp: 55 },
  { id: 'lab-permisos', nombre: 'Permiso mínimo', dificultad: 'Media', snapshot: 'permisos', objetivo: 'Deja `script.sh` ejecutable solo para su dueño con modo numérico.', solucion: 'chmod 700 script.sh', check: (c) => c.historial.some((h) => /^chmod\s+700\s+script\.sh$/.test(h)), xp: 55 },
  { id: 'lab-procesos', nombre: 'Proceso rebelde', dificultad: 'Media', snapshot: 'procesos', objetivo: 'Localiza procesos de nginx y envía SIGTERM al PID 1533.', solucion: 'ps aux | grep nginx; kill -15 1533', check: (c) => c.historial.some((h) => h.includes('ps ') && h.includes('grep nginx')) && c.historial.some((h) => /^kill\s+(?:-15\s+)?1533$/.test(h)), xp: 65 },
  { id: 'lab-binario', nombre: 'Forense de bolsillo', dificultad: 'Media', snapshot: 'avanzado', objetivo: 'Identifica el tipo de `firmas.bin` y extrae sus cadenas legibles.', solucion: 'file firmas.bin; strings firmas.bin', check: (c) => c.historial.some((h) => /^file\s+firmas\.bin$/.test(h)) && c.historial.some((h) => /^strings\s+firmas\.bin$/.test(h)), xp: 70 },
  { id: 'lab-red', nombre: 'Servicio a la vista', dificultad: 'Avanzada', snapshot: 'profesional', objetivo: 'Escanea versiones en `10.10.10.50` y consulta su servicio web.', solucion: 'nmap -sV 10.10.10.50; curl http://10.10.10.50', check: (c) => c.historial.some((h) => /^nmap\s+-sV\s+10\.10\.10\.50$/.test(h)) && c.historial.some((h) => /^curl\s+http:\/\/10\.10\.10\.50\/?$/.test(h)), xp: 80 },
];

function htmlSeguro(texto) { return formato(texto || ''); }
function tipoEjercicio(tipo) {
  return { quiz: 'Decide', respuesta: 'Recuerda', completar: 'Completa', ordenar: 'Construye', terminal: 'Terminal' }[tipo] || 'Práctica';
}
function comandoDe(linea = '') { return linea.trim().split(/\s+/)[0] || ''; }
function normalizar(texto) { return String(texto).trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function nivelDificultad(d) { return /media/i.test(d) ? 'media' : /dif|avanz/i.test(d) ? 'dificil' : 'facil'; }
function numeroSalas(bloque) { return bloque.salas.map((id) => SALA_POR_ID[id]).filter(Boolean); }
function ejerciciosSala(sala) { return sala.tareas.reduce((n, tarea) => n + tarea.practica.length, 0); }
function ejerciciosHechosSala(sala) { return sala.tareas.reduce((n, tarea) => n + tarea.practica.filter((e) => store.ejercicioHecho(e.id)).length, 0); }
function ejercicioPorId(id) { return EJERCICIO_POR_ID[id]; }
function abrirRepaso(id) {
  const ejercicio = ejercicioPorId(id);
  if (!ejercicio) return ir('aprender');
  ejercicioActivo = ejercicio.id;
  return ir('sala', { id: ejercicio.salaId, ejercicio: ejercicio.id, repaso: true });
}

function marcarProgresoCompartible() {
  if (store.xp > 0) document.cookie = 'mentor_linux_progress=1; max-age=31536000; path=/; SameSite=Lax';
}

function actualizarCabecera() {
  const stats = store.estadisticas();
  document.getElementById('ficha-nivel').textContent = `Nv ${stats.nivel.nivel}`;
  document.getElementById('ficha-xp').textContent = `${stats.xp} XP`;
  document.getElementById('ficha-racha').textContent = `🔥 ${stats.racha}`;
  marcarProgresoCompartible();
}

function rutaHash(nombre, datos = {}) {
  if (nombre === 'sala') return `#sala/${datos.id}`;
  if (nombre === 'maquina') return `#maquina/${datos.id}`;
  if (nombre === 'wargame') return `#wargame/${datos.id}`;
  if (nombre === 'laboratorio') return `#laboratorio/${datos.id || 'libre'}`;
  return `#${nombre}`;
}

function ir(nombre, datos = {}, guardarHistorial = true) {
  rutaActual = { nombre, datos };
  ejercicioActivo = datos.ejercicio || (nombre === 'sala' ? ejercicioActivo : null);
  modoRepaso = nombre === 'sala' && datos.repaso === true;
  terminalActiva = null;
  const principal = ['sala', 'academia'].includes(nombre) ? 'aprender' : nombre === 'maquina' ? 'maquinas' : ['wargame', 'laboratorio'].includes(nombre) ? 'practicar' : nombre;
  document.querySelectorAll('[data-pestana]').forEach((b) => b.toggleAttribute('data-activa', b.dataset.pestana === principal));
  if (guardarHistorial && location.hash !== rutaHash(nombre, datos)) history.pushState({ nombre, datos }, '', rutaHash(nombre, datos));
  render();
  vista.scrollTop = 0;
  actualizarCabecera();
}

function render() {
  if (rutaActual.nombre === 'academia') return renderAcademiaDetalle(rutaActual.datos.id);
  if (rutaActual.nombre === 'sala') return renderSala(rutaActual.datos.id);
  if (rutaActual.nombre === 'maquina') return renderMaquina(rutaActual.datos.id);
  if (rutaActual.nombre === 'wargame') return renderWargame(rutaActual.datos.id);
  if (rutaActual.nombre === 'laboratorio') return renderLaboratorio(rutaActual.datos.id);
  if (rutaActual.nombre === 'maquinas') return renderMaquinas();
  if (rutaActual.nombre === 'practicar') return renderPracticar();
  if (rutaActual.nombre === 'perfil') return renderPerfil();
  return renderAprender();
}

function renderAvisoInstalacion() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone;
  if ((!ios || store.estado.avisoSafariVisto) && !progresoPrevioDetectado) return '';
  return `<aside class="aviso-safari" data-aviso-instalacion>
    <b>${progresoPrevioDetectado ? 'Detectamos progreso en otro contexto' : '¿Usas Safari en iPhone o iPad?'}</b>
    <p>${progresoPrevioDetectado
      ? 'Safari y el icono instalado pueden mantener almacenamientos separados. Importa tu copia para recuperar el avance.'
      : 'Antes de añadir Mentor Linux a la pantalla de inicio, copia tu progreso. iOS puede separar los datos de Safari de los de la app instalada.'}</p>
    <div class="acciones">
      <button class="btn btn-mini" data-preparar-instalacion>Copiar progreso</button>
      <button class="btn-fantasma btn-mini" data-cerrar-aviso>Entendido</button>
    </div>
  </aside>`;
}

function renderAprender() {
  const stats = store.estadisticas();
  const siguiente = store.siguientePaso();
  const repasos = store.ejerciciosParaRepasar(3);
  const salaActual = store.salaActual();
  const academiaActual = salaActual ? ACADEMIAS.find((a) =>
    a.rutas.some((r) => (RUTA_POR_ID[r]?.salas || []).includes(salaActual))) : null;

  // La portada muestra SOLO una cosa que hacer y la lista de academias
  // cerradas. Antes desplegaba la primera academia entera con todas sus salas,
  // más la sesión del día y el marcador: demasiado para una pantalla de móvil.
  vista.innerHTML = `<div class="pagina">
    ${renderAvisoInstalacion()}

    <section class="continuar-hoy">
      <span class="eyebrow">${repasos.length ? 'Toca repasar' : siguiente ? 'Continuar donde lo dejaste' : 'Todo completado'}</span>
      <h1>${escapar(repasos.length ? `${repasos.length} ${repasos.length === 1 ? 'habilidad' : 'habilidades'} para refrescar`
        : siguiente ? siguiente.sala.nombre : '¡Has terminado el currículo!')}</h1>
      ${siguiente && !repasos.length ? `<p>${escapar(siguiente.tarea.titulo)}</p>` : ''}
      <div class="acciones">
        ${repasos.length
          ? `<button class="btn" data-repasar="${escapar(repasos[0].id)}">Repasar ahora</button>`
          : siguiente
            ? `<button class="btn" data-sala="${escapar(siguiente.sala.id)}" data-ejercicio="${escapar(siguiente.ejercicio.id)}">Continuar</button>`
            : '<button class="btn" data-ir="maquinas">Ir a las máquinas</button>'}
        <button class="btn-secundario" data-ir="practicar">Practicar libre</button>
      </div>
      <span class="continuar-progreso">
        <span class="barra"><i style="width:${porcentaje(stats.ejercicios / TOTAL_EJERCICIOS)}%"></i></span>
        <small>${stats.ejercicios} de ${TOTAL_EJERCICIOS} ejercicios · racha de ${stats.racha} ${stats.racha === 1 ? 'día' : 'días'}</small>
      </span>
    </section>

    <div class="seccion-titulo"><div><h2>Academias</h2><p>Toca una para ver sus salas</p></div></div>
    <div class="academias">${ACADEMIAS.map((a) => renderTarjetaAcademia(a, a.id === academiaActual?.id)).join('')}</div>
  </div>`;
}

// Tarjeta cerrada: identidad, avance y nada más. Al tocarla se entra en la
// pantalla de la academia, donde ya sí está el camino completo de salas.
function renderTarjetaAcademia(academia, esActual) {
  const salas = academia.rutas.flatMap((id) => numeroSalas(RUTA_POR_ID[id] || { salas: [] }));
  const hechas = salas.filter((s) => store.salaCompletada(s.id)).length;
  const avance = store.progresoAcademia(academia);
  const ejercicios = salas.reduce((t, s) => t + ejerciciosSala(s), 0);
  const abierta = salas.some((s) => store.salaDesbloqueada(s.id));

  return `<button class="tarjeta-academia" data-color="${academia.color}" data-academia="${escapar(academia.id)}"
      ${esActual ? 'data-actual' : ''} ${abierta ? '' : 'disabled'}>
    <span class="academia-icono">${escapar(academia.icono)}</span>
    <span class="academia-cuerpo">
      <b>${escapar(academia.nombre)}</b>
      <small>${escapar(academia.objetivo || academia.descripcion)}</small>
      <span class="academia-datos">${salas.length} salas · ${ejercicios} ejercicios</span>
      <span class="barra"><i style="width:${porcentaje(avance)}%"></i></span>
    </span>
    <span class="academia-avance">
      <b>${porcentaje(avance)}%</b>
      <small>${hechas}/${salas.length}</small>
    </span>
  </button>`;
}

// Pantalla propia de una academia: el camino completo de sus salas.
function renderAcademiaDetalle(id) {
  const academia = ACADEMIA_POR_ID[id];
  if (!academia) return ir('aprender');
  const rutas = academia.rutas.map((r) => RUTA_POR_ID[r]).filter(Boolean);
  const salas = rutas.flatMap((r) => numeroSalas(r));
  const hechas = salas.filter((s) => store.salaCompletada(s.id)).length;
  const avance = store.progresoAcademia(academia);
  const ejercicios = salas.reduce((t, s) => t + ejerciciosSala(s), 0);
  const minutos = salas.filter((s) => !store.salaCompletada(s.id)).reduce((t, s) => t + s.minutos, 0);
  const horas = minutos >= 60 ? `~${(minutos / 60).toFixed(minutos >= 600 ? 0 : 1).replace('.0', '')} h` : `${minutos} min`;
  const actual = store.salaActual();

  let indice = 0;
  const camino = rutas.map((ruta) => {
    const suyas = numeroSalas(ruta);
    const filas = suyas.map((sala) => renderNodoSala(sala, ++indice, salas.length, actual)).join('');
    return `<div class="tramo"><span class="tramo-nombre">${escapar(ruta.nombre)}</span>${filas}</div>`;
  }).join('');

  vista.innerHTML = `<div class="pagina pagina-estrecha academia-detalle" data-color="${academia.color}">
    <button class="enlace-volver" data-ir="aprender">← Academias</button>
    <header class="cabecera-academia">
      <span class="academia-icono grande">${escapar(academia.icono)}</span>
      <div>
        <h1>${escapar(academia.nombre)}</h1>
        <p>${escapar(academia.objetivo || academia.descripcion)}</p>
      </div>
    </header>
    <div class="chips">
      <span class="chip">${salas.length} salas</span>
      <span class="chip">${ejercicios} ejercicios</span>
      <span class="chip">${minutos ? `quedan ${horas}` : 'completada'}</span>
    </div>
    <div class="barra" style="margin:12px 0 4px"><i style="width:${porcentaje(avance)}%"></i></div>
    <p class="ruta-desc">${hechas} de ${salas.length} salas completadas · ${porcentaje(avance)}%</p>
    <div class="camino">${camino}</div>
  </div>`;
}

// Una sala como nodo de un camino: la línea vertical que las une la dibuja el
// CSS, y el estado (hecha, en curso, bloqueada) se lee por color y por forma.
function renderNodoSala(sala, indice, total, actual) {
  const desbloqueada = store.salaDesbloqueada(sala.id);
  const completada = store.salaCompletada(sala.id);
  const hechos = ejerciciosHechosSala(sala);
  const totalEj = ejerciciosSala(sala);
  // «En curso» es la sala por la que toca seguir, la hayas empezado o no: sin
  // esto ningún nodo indicaba dónde continuar hasta hacer el primer ejercicio.
  const esActual = sala.id === actual;
  const estado = completada ? 'hecha' : !desbloqueada ? 'bloqueada' : esActual ? 'curso' : 'lista';
  const marca = completada ? '✓' : esActual ? '▶' : desbloqueada ? String(indice).padStart(2, '0') : '🔒';

  return `<button class="nodo" data-estado="${estado}" data-sala="${escapar(sala.id)}" ${desbloqueada ? '' : 'disabled'}
      ${indice === total ? 'data-ultimo' : ''}>
    <span class="nodo-punto">${marca}</span>
    <span class="nodo-info">
      <b>${escapar(sala.nombre)}</b>
      <small>${sala.tareas.length} tareas · ${totalEj} ejercicios · ${sala.minutos} min</small>
      ${desbloqueada && !completada ? `<span class="mini-barra"><i style="width:${porcentaje(hechos / totalEj)}%"></i></span>` : ''}
    </span>
    <span class="nodo-estado">${completada ? 'Completada' : esActual ? 'Continuar' : desbloqueada ? `${hechos}/${totalEj}` : ''}</span>
  </button>`;
}

function renderTeoria(bloques = []) {
  return `<div class="teoria">${bloques.map((b) => {
    if (b.c) return `<pre class="teoria-codigo"><code>${escapar(b.c)}</code></pre>`;
    if (b.n) return `<aside class="teoria-nota"><b>${escapar(b.n)}</b>${b.p ? `<br>${htmlSeguro(b.p)}` : ''}</aside>`;
    if (b.f) return `<div class="teoria-bloque"><table class="teoria-tabla"><tbody>${b.f.map(([a, z]) => `<tr><td>${htmlSeguro(a)}</td><td>${htmlSeguro(z)}</td></tr>`).join('')}</tbody></table></div>`;
    return `<article class="teoria-bloque">${b.t ? `<h3>${escapar(b.t)}</h3>` : ''}${b.p ? `<p>${htmlSeguro(b.p)}</p>` : ''}</article>`;
  }).join('')}</div>`;
}

function siguienteEjercicio(sala, idActual) {
  const lista = sala.tareas.flatMap((t) => t.practica);
  const pos = lista.findIndex((e) => e.id === idActual);
  return lista.slice(pos + 1).find((e) => !store.ejercicioHecho(e.id)) || lista.find((e) => !store.ejercicioHecho(e.id)) || null;
}

function renderSala(id) {
  const sala = SALA_POR_ID[id];
  if (!sala) return ir('aprender');
  const ruta = RUTAS.find((r) => r.salas.includes(id));
  const academia = ACADEMIAS.find((a) => a.id === ruta?.academia);
  const hechos = ejerciciosHechosSala(sala);
  const total = ejerciciosSala(sala);
  const habilidades = [...new Set(sala.tareas.flatMap((t) => t.practica.flatMap((e) => e.habilidades || [])))];
  const primeraPendiente = sala.tareas.find((t) => t.practica.some((e) => !store.ejercicioHecho(e.id)))?.id;
  const tareaActiva = ejercicioActivo ? sala.tareas.find((t) => t.practica.some((e) => e.id === ejercicioActivo))?.id : primeraPendiente;
  vista.innerHTML = `<div class="pagina pagina-estrecha">
    <button class="enlace-volver" data-ir="aprender">← Volver a la ruta</button>
    <header class="detalle-cabecera">
      <div class="migas"><span>${escapar(academia?.nombre || 'Aprender')}</span><i>›</i><span>${escapar(ruta?.nombre || 'Ruta')}</span><i>›</i><b>Sala ${sala.n}</b></div>
      ${modoRepaso ? '<span class="modo-repaso">↻ Repaso de memoria</span>' : ''}
      <h1>${escapar(sala.nombre)}</h1><p>${escapar(sala.resumen)}</p>
      <div class="chips"><span class="chip chip-dificultad">${escapar(sala.dificultad)}</span><span class="chip">◷ ${sala.minutos} min</span><span class="chip">${sala.tareas.length} tareas</span><span class="chip">${total} ejercicios</span></div>
      <div class="barra"><i style="width:${porcentaje(hechos / total)}%"></i></div>
      <div class="habilidades-sala">${habilidades.slice(0, 8).map((id) => `<span>${NIVELES_DOMINIO[store.nivelHabilidad(id)].icono} ${escapar(nombreHabilidad(id))}</span>`).join('')}</div>
    </header>
    <div class="lista-tareas">
      ${sala.tareas.map((tarea, i) => renderTarea(tarea, i, tarea.id === tareaActiva)).join('')}
    </div>
  </div>`;
  conectarEjercicios(sala);
}

function renderTarea(tarea, indice, abierta) {
  const hechos = tarea.practica.filter((e) => store.ejercicioHecho(e.id)).length;
  const completa = store.tareaHecha(tarea.id);
  return `<details class="tarea" data-tarea="${escapar(tarea.id)}" ${completa ? 'data-completa' : ''} ${abierta ? 'open' : ''}>
    <summary><span class="tarea-num">${completa ? '✓' : indice + 1}</span><span class="tarea-titulo"><b>${escapar(tarea.titulo)}</b><small>${escapar(tarea.subtitulo || 'Teoría y práctica guiada')}</small></span><span class="tarea-progreso">${hechos}/${tarea.practica.length}</span></summary>
    <div class="tarea-cuerpo">${renderTeoria(tarea.teoria)}<div class="practica-titulo"><span>Ponlo en práctica</span><small>${tarea.practica.length} interacciones</small></div><div class="ejercicios">${tarea.practica.map(renderEjercicio).join('')}</div></div>
  </details>`;
}

function renderEjercicio(ejercicio) {
  const completo = store.ejercicioHecho(ejercicio.id);
  const activo = ejercicioActivo === ejercicio.id;
  const enRepaso = modoRepaso && activo;
  const pistas = pistasMostradas.get(ejercicio.id) || 0;
  const habilidades = (ejercicio.habilidades || []).map((id) => {
    const nivel = store.nivelHabilidad(id);
    return `<span class="skill-chip" data-nivel="${nivel}">${NIVELES_DOMINIO[nivel].icono} ${escapar(nombreHabilidad(id))}</span>`;
  }).join('');
  let controles = '';
  if (completo && !enRepaso) controles = '<div class="feedback feedback-completo" data-ok>✓ Completado · volverá cuando toque repasarlo</div>';
  else if (ejercicio.tipo === 'quiz') controles = `<div class="opciones">${ejercicio.opciones.map((o, i) => `<button class="opcion" data-quiz="${escapar(ejercicio.id)}" data-opcion="${i}"><span>${String.fromCharCode(65 + i)}</span>${escapar(o)}</button>`).join('')}</div><div class="feedback" data-feedback="${escapar(ejercicio.id)}"></div>`;
  else if (ejercicio.tipo === 'respuesta' || ejercicio.tipo === 'completar') controles = `${ejercicio.plantilla ? `<div class="plantilla-comando">${htmlSeguro(ejercicio.plantilla)}</div>` : ''}<form class="respuesta-form" data-respuesta="${escapar(ejercicio.id)}"><input class="campo" name="respuesta" autocomplete="off" placeholder="${ejercicio.tipo === 'completar' ? 'Escribe solo lo que falta' : 'Escribe la salida exacta'}" aria-label="Tu respuesta"><button class="btn btn-mini">Comprobar</button></form><div class="feedback" data-feedback="${escapar(ejercicio.id)}"></div>`;
  else if (ejercicio.tipo === 'ordenar') controles = `<div class="constructor" data-constructor="${escapar(ejercicio.id)}"><div class="constructor-salida" data-constructor-salida><span>Toca los bloques en orden</span></div><div class="fichas">${ejercicio.tokens.map((token, i) => `<button class="ficha" data-token="${i}" type="button">${escapar(token)}</button>`).join('')}</div><div class="acciones"><button class="btn btn-mini" data-validar-constructor type="button">Comprobar</button><button class="btn-fantasma btn-mini" data-limpiar-constructor type="button">Reiniciar</button></div></div><div class="feedback" data-feedback="${escapar(ejercicio.id)}"></div>`;
  else controles = activo
    ? `<div class="ejercicio-terminal"><div class="terminal-zona" id="terminal-ejercicio"></div><div class="acciones"><button class="btn-fantasma btn-mini" data-pista="${escapar(ejercicio.id)}">Pista ${Math.min(pistas + 1, ejercicio.pistas?.length || 1)}</button><button class="btn-fantasma btn-mini" data-reiniciar-terminal>Restaurar</button></div>${renderPistas(ejercicio, pistas)}<div class="feedback" data-feedback="${escapar(ejercicio.id)}">Escribe el comando y pulsa Intro.</div></div>`
    : `<button class="btn-secundario btn-mini" data-abrir-ejercicio="${escapar(ejercicio.id)}">Abrir terminal</button>`;
  return `<article class="ejercicio" id="ejercicio-${escapar(ejercicio.id)}" ${completo ? 'data-completo' : ''} ${enRepaso ? 'data-repaso' : ''}><div class="ejercicio-cabecera"><span class="ejercicio-tipo">${tipoEjercicio(ejercicio.tipo)}</span><span class="ejercicio-xp">${enRepaso ? 'REPASO' : `+${ejercicio.xp || 15} XP`}</span></div><p>${htmlSeguro(ejercicio.enunciado)}</p>${habilidades ? `<div class="skill-chips">${habilidades}</div>` : ''}${controles}</article>`;
}

function renderPistas(ejercicio, cantidad) {
  if (!cantidad) return '';
  return `<div class="pistas">${(ejercicio.pistas || []).slice(0, cantidad).map((p, i) => `<div class="pista"><b>Pista ${i + 1}:</b> ${htmlSeguro(p)}</div>`).join('')}</div>`;
}

function feedback(id, mensaje, ok = false) {
  const el = vista.querySelector(`[data-feedback="${CSS.escape(id)}"]`);
  if (!el) return;
  el.innerHTML = htmlSeguro(mensaje);
  el.toggleAttribute('data-ok', ok);
  el.toggleAttribute('data-error', !ok);
}

function completarEjercicio(sala, ejercicio) {
  const resultado = store.completarEjercicio(ejercicio, { usoPista: (pistasMostradas.get(ejercicio.id) || 0) > 0 });
  actualizarCabecera();
  if (resultado.repaso) {
    const siguienteRepaso = store.ejerciciosParaRepasar(1)[0];
    celebrar({
      marca: '↻', titulo: 'Repaso superado', texto: 'La habilidad quedó reforzada y volverá en un intervalo mayor.', xp: 0,
      botones: [{ texto: siguienteRepaso ? 'Siguiente repaso' : 'Volver a Aprender', accion: () => siguienteRepaso ? abrirRepaso(siguienteRepaso.id) : ir('aprender') }],
    });
    return;
  }
  if (!resultado.ganado) return;
  const siguiente = siguienteEjercicio(sala, ejercicio.id);
  celebrar({
    marca: '✓', titulo: 'Ejercicio completado', texto: ejercicio.explicacion || 'La terminal confirmó el estado correcto.', xp: resultado.ganado,
    combo: store.estado.combo, logros: resultado.nuevosLogros,
    botones: [{ texto: siguiente ? 'Siguiente ejercicio' : 'Ver progreso de la sala', accion: () => { ejercicioActivo = siguiente?.id || null; renderSala(sala.id); } }],
  });
}

function conectarEjercicios(sala) {
  vista.querySelectorAll('[data-abrir-ejercicio]').forEach((b) => b.addEventListener('click', () => { ejercicioActivo = b.dataset.abrirEjercicio; renderSala(sala.id); }));
  vista.querySelectorAll('[data-quiz]').forEach((b) => b.addEventListener('click', () => {
    const e = ejercicioPorId(b.dataset.quiz);
    if (Number(b.dataset.opcion) !== e.correcta) { store.registrarIntento(e, { correcto: false }); return feedback(e.id, 'Aún no. Lee la explicación, descarta una opción y vuelve a intentarlo.'); }
    completarEjercicio(sala, e);
  }));
  vista.querySelectorAll('[data-respuesta]').forEach((form) => form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const e = ejercicioPorId(form.dataset.respuesta);
    const valor = new FormData(form).get('respuesta');
    if (!(e.respuestas || []).some((r) => normalizar(r) === normalizar(valor))) { store.registrarIntento(e, { correcto: false }); return feedback(e.id, 'Todavía no coincide. Revisa la ruta, la opción o la salida y prueba otra vez.'); }
    completarEjercicio(sala, e);
  }));
  vista.querySelectorAll('[data-constructor]').forEach((constructor) => {
    const salida = constructor.querySelector('[data-constructor-salida]');
    const pintar = () => {
      const seleccion = JSON.parse(constructor.dataset.valor || '[]');
      salida.innerHTML = seleccion.length ? seleccion.map((i) => `<code>${escapar(ejercicioPorId(constructor.dataset.constructor).tokens[i])}</code>`).join('<span> </span>') : '<span>Toca los bloques en orden</span>';
      constructor.querySelectorAll('[data-token]').forEach((b) => { b.disabled = seleccion.includes(Number(b.dataset.token)); });
    };
    constructor.querySelectorAll('[data-token]').forEach((b) => b.addEventListener('click', () => {
      const seleccion = JSON.parse(constructor.dataset.valor || '[]');
      seleccion.push(Number(b.dataset.token));
      constructor.dataset.valor = JSON.stringify(seleccion);
      pintar();
    }));
    constructor.querySelector('[data-limpiar-constructor]').addEventListener('click', () => { constructor.dataset.valor = '[]'; pintar(); });
    constructor.querySelector('[data-validar-constructor]').addEventListener('click', () => {
      const e = ejercicioPorId(constructor.dataset.constructor);
      const seleccion = JSON.parse(constructor.dataset.valor || '[]');
      const valor = seleccion.map((i) => e.tokens[i]).join(' ');
      if (normalizar(valor) !== normalizar(e.respuestaCorrecta)) { store.registrarIntento(e, { correcto: false }); return feedback(e.id, 'El orden aún no construye una orden válida. Reinicia y piensa en comando → opción → argumento.'); }
      completarEjercicio(sala, e);
    });
  });
  vista.querySelectorAll('[data-pista]').forEach((b) => b.addEventListener('click', () => {
    const e = ejercicioPorId(b.dataset.pista);
    pistasMostradas.set(e.id, Math.min((pistasMostradas.get(e.id) || 0) + 1, e.pistas?.length || 1));
    renderSala(sala.id);
  }));
  const reiniciar = vista.querySelector('[data-reiniciar-terminal]');
  if (reiniciar) reiniciar.addEventListener('click', () => terminalActiva?.reiniciar());
  if (ejercicioActivo) iniciarTerminalEjercicio(sala, ejercicioPorId(ejercicioActivo));
}

function iniciarTerminalEjercicio(sala, ejercicio) {
  const contenedor = document.getElementById('terminal-ejercicio');
  if (!contenedor || !ejercicio || ejercicio.tipo !== 'terminal') return;
  terminalActiva = new Terminal(contenedor, {
    snapshot: ejercicio.snapshot || sala.snapshot || 'inicio', autoFocus: true,
    alEjecutar: (ctx) => {
      store.contarComando(comandoDe(ctx.ultimo?.cmd));
      let correcto = false;
      try { correcto = ejercicio.check(ctx) === true; } catch { correcto = false; }
      if (correcto) return completarEjercicio(sala, ejercicio);
      const diagnostico = (ejercicio.diagnostico || []).find((d) => { try { return d.cuando(ctx); } catch { return false; } });
      feedback(ejercicio.id, diagnostico ? `**${diagnostico.titulo}.** ${diagnostico.texto}` : 'El sistema aún no está en el estado pedido. Puedes seguir explorando.', false);
    },
  });
}

function progresoMaquina(maquina) {
  const e = store.estadoMaquina(maquina.id);
  return (e.fases.length + Number(e.userFlag) + Number(e.rootFlag)) / (maquina.fases.length + 2);
}

function renderMaquinas() {
  vista.innerHTML = `<div class="pagina">
    <section class="hero"><span class="eyebrow">Laboratorio ofensivo · 100% simulado</span><h1>Máquinas vulnerables.<br>Entornos seguros.</h1><p>Practica una metodología completa: reconocimiento, enumeración, acceso y escalada. Todos los objetivos viven dentro del simulador; nunca se contactan sistemas reales.</p><div class="chips"><span class="chip">12 máquinas</span><span class="chip">48 fases</span><span class="chip">24 flags</span><span class="chip">writeups desbloqueables</span></div></section>
    <div class="seccion-titulo"><div><h2>Selecciona un objetivo</h2><p>De tu primer escaneo a cadenas de explotación avanzadas</p></div></div>
    <div class="rejilla">${MAQUINAS.map((m) => {
      const estado = store.estadoMaquina(m.id);
      return `<button class="tarjeta maquina-card" data-maquina="${escapar(m.id)}"><div class="tarjeta-top"><span class="eyebrow">${escapar(m.so)}</span><span class="dificultad" data-nivel="${nivelDificultad(m.dificultad)}">${escapar(m.dificultad)}</span></div><h3>${escapar(m.nombre)} ${estado.completada ? '✓' : ''}</h3><div class="maquina-host">${escapar(m.ip)} · ${escapar(m.host)}</div><p>${m.habilidades.map(escapar).join(' · ')}</p><div class="barra" style="margin-top:13px"><i style="width:${porcentaje(progresoMaquina(m))}%"></i></div></button>`;
    }).join('')}</div>
  </div>`;
}

function faseDisponible(maquina, indice) {
  return indice === 0 || store.faseMaquinaHecha(maquina.id, maquina.fases[indice - 1].id);
}

function renderFasesMaquina(maquina) {
  return maquina.fases.map((fase, i) => {
    const hecha = store.faseMaquinaHecha(maquina.id, fase.id);
    const disponible = faseDisponible(maquina, i);
    const pistas = pistasMostradas.get(`${maquina.id}/${fase.id}`) || 0;
    return `<article class="fase" data-fase="${escapar(fase.id)}" ${hecha ? 'data-hecha' : disponible ? 'data-activa' : ''}>
      <div class="fase-cabecera"><span class="fase-num">${hecha ? '✓' : disponible ? i + 1 : '🔒'}</span><b>${escapar(fase.nombre)}</b></div>
      <p>${disponible ? htmlSeguro(fase.objetivo) : 'Completa la fase anterior para desbloquearla.'}</p>
      ${disponible && !hecha ? `<button class="btn-fantasma btn-mini" style="margin-top:9px" data-pista-fase="${escapar(fase.id)}">Ver pista</button>${renderPistas(fase, pistas)}` : ''}
    </article>`;
  }).join('');
}

function renderMaquina(id) {
  const maquina = MAQUINA_POR_ID[id];
  if (!maquina) return ir('maquinas');
  const estado = store.estadoMaquina(id);
  vista.innerHTML = `<div class="pagina pagina-terminal">
    <button class="enlace-volver" data-ir="maquinas">← Todas las máquinas</button>
    <header class="detalle-cabecera"><span class="eyebrow">Máquina simulada · ${escapar(maquina.so)}</span><h1>${escapar(maquina.nombre)}</h1><p>${escapar(maquina.ip)} · ${escapar(maquina.host)}</p><div class="chips"><span class="dificultad" data-nivel="${nivelDificultad(maquina.dificultad)}">${escapar(maquina.dificultad)}</span><span class="chip">◷ ${maquina.minutos} min</span>${maquina.habilidades.map((h) => `<span class="chip">${escapar(h)}</span>`).join('')}</div><div class="barra"><i style="width:${porcentaje(progresoMaquina(maquina))}%"></i></div></header>
    <div class="laboratorio-layout">
      <div><aside class="etica"><b>Entorno autorizado.</b> Esta máquina, sus IP y sus servicios son ficción local. La terminal no realiza conexiones de red.</aside><div class="fases" id="fases-maquina">${renderFasesMaquina(maquina)}</div></div>
      <div class="panel-lab"><h2>AttackBox</h2><p class="muted">Empieza enumerando el objetivo. Toca cualquier parte de la consola para escribir.</p><div class="terminal-zona" id="terminal-maquina"></div><div class="flags">
        <form class="flag-form" data-flag="user"><input class="campo mono" placeholder="Pega user.txt" aria-label="Bandera user.txt" ${estado.userFlag ? 'disabled value="Capturada ✓"' : ''}><button class="btn btn-mini" ${estado.userFlag ? 'disabled' : ''}>Validar user</button></form>
        <form class="flag-form" data-flag="root"><input class="campo mono" placeholder="Pega root.txt" aria-label="Bandera root.txt" ${estado.rootFlag ? 'disabled value="Capturada ✓"' : ''}><button class="btn btn-mini" ${estado.rootFlag ? 'disabled' : ''}>Validar root</button></form>
      </div><div class="feedback" data-feedback-maquina></div></div>
    </div>
    ${estado.completada ? `<section class="writeup"><span class="eyebrow">Writeup desbloqueado</span><h2>Camino de resolución</h2><ol>${maquina.writeup.map((p) => `<li>${escapar(p)}</li>`).join('')}</ol></section>` : ''}
  </div>`;
  conectarMaquina(maquina);
}

function conectarMaquina(maquina) {
  document.getElementById('fases-maquina').addEventListener('click', (evento) => {
    const b = evento.target.closest('[data-pista-fase]');
    if (!b) return;
    const fase = maquina.fases.find((f) => f.id === b.dataset.pistaFase);
    const clave = `${maquina.id}/${fase.id}`;
    pistasMostradas.set(clave, Math.min((pistasMostradas.get(clave) || 0) + 1, fase.pistas.length));
    renderMaquina(maquina.id);
  });
  const estadoGuardado = store.estadoMaquina(maquina.id);
  const profile = structuredClone(maquina.profile);
  if (estadoGuardado.fases.includes('enum')) profile.accessUnlocked = true;
  const escaladaHecha = estadoGuardado.fases.includes('privesc');
  const accesoHecho = estadoGuardado.fases.includes('access');
  terminalActiva = new Terminal(document.getElementById('terminal-maquina'), {
    snapshot: maquina.snapshot,
    usuario: escaladaHecha ? 'root' : accesoHecho ? maquina.user : 'kali',
    cwd: escaladaHecha ? '/root' : accesoHecho ? `/home/${maquina.user}` : '/home/kali',
    hostname: accesoHecho || escaladaHecha ? maquina.host : 'attackbox',
    groupMap: maquina.groupMap, machine: profile, autoFocus: true,
    alEjecutar: (ctx) => {
      store.contarComando(comandoDe(ctx.ultimo?.cmd));
      const fase = maquina.fases.find((f, i) => !store.faseMaquinaHecha(maquina.id, f.id) && faseDisponible(maquina, i));
      if (!fase) return;
      let ok = false;
      try { ok = fase.check(ctx) === true; } catch { ok = false; }
      if (!ok) return;
      try { fase.onComplete?.(ctx); } catch {}
      store.completarFaseMaquina(maquina, fase);
      document.getElementById('fases-maquina').innerHTML = renderFasesMaquina(maquina);
      actualizarCabecera();
      brindis(`✓ Fase completada: **${fase.nombre}**`);
    },
  });
  vista.querySelectorAll('[data-flag]').forEach((form) => form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const tipo = form.dataset.flag;
    const valor = form.querySelector('input').value;
    const hash = tipo === 'root' ? maquina.rootFlagHash : maquina.userFlagHash;
    const mensaje = vista.querySelector('[data-feedback-maquina]');
    if (!respuestaCorrecta(valor, hash)) { mensaje.textContent = 'Esa bandera no es válida para esta máquina.'; mensaje.dataset.error = ''; return; }
    store.registrarFlag(maquina, tipo);
    brindis(`🚩 ${tipo}.txt capturada`);
    renderMaquina(maquina.id);
    actualizarCabecera();
  }));
}

function renderPracticar() {
  const hechas = store.estado.misionesCompletadas || [];
  const repasos = store.ejerciciosParaRepasar(6);
  const debiles = store.puntosDebiles(6);
  vista.innerHTML = `<div class="pagina">
    <section class="hero"><span class="eyebrow">Práctica deliberada</span><h1>Repite. Experimenta.<br>Domina.</h1><p>Elige una misión corta, entra al Wargame encadenado o abre un sistema libre. Todo se restaura y funciona sin conexión.</p><div class="acciones"><button class="btn" data-laboratorio="libre">Abrir modo libre</button><button class="btn-secundario" data-wargame="bandit-0">Empezar Wargame</button></div></section>
    <div class="seccion-titulo"><div><h2>Tus puntos débiles</h2><p>Lo que más te está costando, ordenado por dificultad</p></div>${debiles.length ? `<span class="contador">${debiles.length}</span>` : ''}</div>
    ${debiles.length
      ? `<div class="debiles">${debiles.map((d) => {
          const ejercicio = store.ejercicioParaHabilidad(d.id);
          const acierto = d.intentos ? Math.round((d.aciertos / d.intentos) * 100) : 0;
          return `<div class="debil" data-nivel="${d.nivel}">
            <span class="debil-icono">${NIVELES_DOMINIO[d.nivel].icono}</span>
            <span class="debil-info">
              <b>${escapar(nombreHabilidad(d.id))}</b>
              <small>${d.fallos} ${d.fallos === 1 ? 'fallo' : 'fallos'} en ${d.intentos} ${d.intentos === 1 ? 'intento' : 'intentos'} · ${acierto}% de acierto</small>
              <span class="debil-barra"><i style="width:${acierto}%"></i></span>
            </span>
            ${ejercicio ? `<button class="btn-secundario btn-mini" data-sala="${escapar(ejercicio.salaId)}" data-ejercicio="${escapar(ejercicio.id)}">Entrenar</button>` : ''}
          </div>`;
        }).join('')}</div>`
      : '<p class="vacio-suave">Aún no hay datos suficientes. Cuando falles algún ejercicio aparecerá aquí, con un botón para entrenarlo directamente.</p>'}

    <div class="seccion-titulo"><div><h2>Repaso inteligente</h2><p>Habilidades que toca recuperar hoy</p></div><span class="contador">${repasos.length ? `${store.retosParaRepasar().length} pendientes` : 'al día ✓'}</span></div>
    ${repasos.length ? `<div class="repasos-grid">${repasos.map((e) => `<button class="tarjeta repaso-card" data-repasar="${escapar(e.id)}"><div class="tarjeta-top"><span class="ejercicio-tipo">${tipoEjercicio(e.tipo)}</span><span class="modo-repaso">↻ toca hoy</span></div><h3>${escapar(SALA_POR_ID[e.salaId]?.nombre || 'Repaso')}</h3><p>${htmlSeguro(e.enunciado)}</p><div class="skill-chips">${(e.habilidades || []).map((id) => `<span class="skill-chip">${escapar(nombreHabilidad(id))}</span>`).join('')}</div></button>`).join('')}</div>` : '<div class="estado-vacio"><b>Memoria al día</b><span>Los ejercicios volverán cuando el intervalo de repaso termine.</span></div>'}
    <div class="seccion-titulo"><div><h2>Misiones rápidas</h2><p>Objetivos de 2–5 minutos para ganar soltura</p></div><span class="contador">${hechas.length}/${MISIONES.length}</span></div>
    <div class="rejilla">${MISIONES.map((m) => `<button class="tarjeta" data-laboratorio="${escapar(m.id)}"><div class="tarjeta-top"><span class="eyebrow">${escapar(m.dificultad)}</span><span class="ejercicio-xp">+${m.xp} XP</span></div><h3>${escapar(m.nombre)} ${hechas.includes(m.id) ? '✓' : ''}</h3><p>${htmlSeguro(m.objetivo)}</p></button>`).join('')}</div>
    <div class="seccion-titulo"><div><h2>Wargame</h2><p>15 niveles; cada contraseña abre el siguiente</p></div><span class="contador">${store.estado.wargameCompletados.length}/15</span></div>
    <div class="wargame-lista">${WARGAME.map((n) => {
      const abierto = store.nivelWargameDesbloqueado(n.n);
      const hecho = store.estado.wargameCompletados.includes(n.n);
      return `<button class="nivel-wargame" data-wargame="${escapar(n.id)}" ${abierto ? '' : 'disabled'} ${hecho ? 'data-hecho' : ''}><b>${hecho ? '✓' : String(n.n).padStart(2, '0')}</b><small>${abierto ? escapar(n.nombre) : 'Bloqueado'}</small></button>`;
    }).join('')}</div>
    <div class="seccion-titulo"><div><h2>Chuletario de comandos</h2><p>Busca sintaxis y ejemplos sin salir del laboratorio</p></div><span class="contador">${TODOS_COMANDOS.length} comandos</span></div>
    <div class="buscador"><input class="campo" id="buscar-comando" type="search" placeholder="Buscar: permisos, grep, red…" aria-label="Buscar comandos"></div><div class="comandos-grid" id="lista-comandos">${renderComandos(TODOS_COMANDOS.slice(0, 18))}</div>
  </div>`;
  const buscador = document.getElementById('buscar-comando');
  buscador.addEventListener('input', () => { store.contarBusqueda(); const lista = buscador.value.trim() ? buscarComandos(buscador.value).slice(0, 30) : TODOS_COMANDOS.slice(0, 18); document.getElementById('lista-comandos').innerHTML = renderComandos(lista); });
}

function renderComandos(lista) {
  return lista.map((c) => `<article class="comando"><b>${escapar(c.n)}</b><p>${escapar(c.q)}</p><pre>${escapar(c.s)}\n${escapar(c.e)}</pre></article>`).join('') || '<p class="muted">No encontramos ese comando.</p>';
}

function renderLaboratorio(id = 'libre') {
  const mision = MISIONES.find((m) => m.id === id);
  vista.innerHTML = `<div class="pagina pagina-terminal"><button class="enlace-volver" data-ir="practicar">← Volver a Practicar</button><header class="detalle-cabecera"><span class="eyebrow">${mision ? `Misión rápida · ${escapar(mision.dificultad)}` : 'Modo libre · sistema restaurable'}</span><h1>${escapar(mision?.nombre || 'Laboratorio Linux')}</h1><p>${mision ? htmlSeguro(mision.objetivo) : 'Explora la terminal sin objetivo ni riesgo. Escribe `help` para ver los comandos disponibles.'}</p>${mision ? `<div class="chips"><span class="chip">+${mision.xp} XP</span><span class="chip">Solución por estado, no por texto</span></div>` : ''}</header><section class="panel-lab" style="margin-top:15px"><div class="terminal-zona" id="terminal-laboratorio"></div><div class="acciones"><button class="btn-fantasma btn-mini" data-reiniciar-lab>Restaurar sistema</button>${mision ? '<button class="btn-fantasma btn-mini" data-solucion-lab>Ver solución</button>' : ''}</div><div class="feedback" data-feedback-lab></div></section></div>`;
  terminalActiva = new Terminal(document.getElementById('terminal-laboratorio'), {
    snapshot: mision?.snapshot || 'profesional', autoFocus: true,
    alEjecutar: (ctx) => {
      store.contarComando(comandoDe(ctx.ultimo?.cmd));
      if (!mision || store.misionHecha(mision.id)) return;
      let ok = false;
      try { ok = mision.check(ctx) === true; } catch { ok = false; }
      if (!ok) return;
      const ganado = store.completarMision(mision);
      actualizarCabecera();
      celebrar({ marca: '⚡', titulo: 'Misión completada', texto: 'Objetivo verificado en el sistema simulado.', xp: ganado, botones: [{ texto: 'Más misiones', accion: () => ir('practicar') }, { texto: 'Seguir explorando', principal: false, accion: () => {} }] });
    },
  });
  vista.querySelector('[data-reiniciar-lab]').addEventListener('click', () => terminalActiva.reiniciar());
  vista.querySelector('[data-solucion-lab]')?.addEventListener('click', () => { const f = vista.querySelector('[data-feedback-lab]'); f.innerHTML = `Ruta de referencia: <code>${escapar(mision.solucion)}</code>`; });
}

function renderWargame(id) {
  const nivel = NIVEL_WARGAME_POR_ID[id];
  if (!nivel || !store.nivelWargameDesbloqueado(nivel.n)) return ir('practicar');
  const hecho = store.estado.wargameCompletados.includes(nivel.n);
  const pistas = pistasMostradas.get(nivel.id) || 0;
  vista.innerHTML = `<div class="pagina pagina-terminal"><button class="enlace-volver" data-ir="practicar">← Todos los niveles</button><header class="detalle-cabecera"><span class="eyebrow">Wargame · Nivel ${String(nivel.n).padStart(2, '0')} de 14</span><h1>${escapar(nivel.nombre)}</h1><p>${htmlSeguro(nivel.objetivo)}</p><div class="chips"><span class="chip">+${nivel.xp} XP</span><span class="chip">snapshot independiente</span><span class="chip">${hecho ? 'Completado ✓' : 'En curso'}</span></div></header><section class="panel-lab" style="margin-top:15px"><div class="terminal-zona" id="terminal-wargame"></div><div class="acciones"><button class="btn-fantasma btn-mini" data-pista-wargame>Mostrar pista</button><button class="btn-fantasma btn-mini" data-reiniciar-wargame>Restaurar nivel</button></div>${renderPistas(nivel, pistas)}<form class="respuesta-form" data-password style="margin-top:12px"><input class="campo mono" autocomplete="off" placeholder="Contraseña encontrada" aria-label="Contraseña del siguiente nivel" ${hecho ? 'disabled value="Nivel superado ✓"' : ''}><button class="btn btn-mini" ${hecho ? 'disabled' : ''}>Desbloquear</button></form><div class="feedback" data-feedback-wargame></div></section></div>`;
  terminalActiva = new Terminal(document.getElementById('terminal-wargame'), { snapshot: nivel.snapshot, usuario: 'bandit', cwd: '/home/bandit', hostname: `bandit${nivel.n}`, groupMap: { bandit: ['bandit'] }, autoFocus: true, alEjecutar: (ctx) => store.contarComando(comandoDe(ctx.ultimo?.cmd)) });
  vista.querySelector('[data-reiniciar-wargame]').addEventListener('click', () => terminalActiva.reiniciar());
  vista.querySelector('[data-pista-wargame]').addEventListener('click', () => { pistasMostradas.set(nivel.id, Math.min(pistas + 1, nivel.pistas.length)); renderWargame(nivel.id); });
  vista.querySelector('[data-password]').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const valor = evento.currentTarget.querySelector('input').value;
    const f = vista.querySelector('[data-feedback-wargame]');
    if (!respuestaCorrecta(valor, nivel.passwordHash)) { f.textContent = 'Contraseña incorrecta. Comprueba que no copiaste espacios.'; f.dataset.error = ''; return; }
    store.completarNivelWargame(nivel);
    const siguiente = WARGAME[nivel.n + 1];
    actualizarCabecera();
    celebrar({ marca: '🔑', titulo: `Nivel ${nivel.n} superado`, texto: siguiente ? `Has desbloqueado **${siguiente.nombre}**.` : 'Completaste los 15 niveles del Wargame.', xp: nivel.xp, botones: [{ texto: siguiente ? 'Entrar al siguiente nivel' : 'Volver a Practicar', accion: () => siguiente ? ir('wargame', { id: siguiente.id }) : ir('practicar') }] });
  });
}

function emojiNivel(nivel) {
  if (nivel >= 15) return '👑';
  if (nivel >= 12) return '🛡️';
  if (nivel >= 9) return '🧠';
  if (nivel >= 6) return '🧰';
  if (nivel >= 3) return '🐧';
  return '🌱';
}

function renderPerfil() {
  const s = store.estadisticas();
  const tema = store.temaActual();
  const dominioComandos = TODOS_COMANDOS.map((c) => ({ ...c, usos: store.estado.dominioComandos[c.n] || 0 })).sort((a, b) => b.usos - a.usos || a.n.localeCompare(b.n));
  const habilidades = Object.keys(store.estado.habilidades).map((id) => ({ id, nivel: store.nivelHabilidad(id), datos: store.estado.habilidades[id] })).sort((a, b) => b.nivel - a.nivel || b.datos.aciertos - a.datos.aciertos);
  vista.innerHTML = `<div class="pagina">
    ${renderAvisoInstalacion()}
    <section class="tarjeta perfil-hero"><div class="avatar">${emojiNivel(s.nivel.nivel)}</div><div><span class="eyebrow">Nivel ${s.nivel.nivel}</span><h1>${escapar(s.nivel.titulo)}</h1><p>${s.nivel.siguiente ? `${s.nivel.faltan} XP para ${escapar(s.nivel.siguiente.titulo)}` : 'Rango máximo alcanzado'}</p><div class="barra" style="margin-top:9px"><i style="width:${porcentaje(s.nivel.progreso)}%"></i></div></div></section>
    <div class="metricas"><div class="metrica"><b>${s.xp}</b><span>XP total</span></div><div class="metrica"><b>${s.racha}</b><span>racha actual</span></div><div class="metrica"><b>${s.maquinas}/${s.totalMaquinas}</b><span>máquinas</span></div><div class="metrica"><b>${s.logros}/${s.totalLogros}</b><span>logros</span></div></div>
    <div class="seccion-titulo"><div><h2>Memoria de habilidades</h2><p>El dominio exige aciertos sin pista, contextos diferentes y repasos en días distintos</p></div><span class="contador">${s.habilidadesDominadas}/${s.habilidades} dominadas</span></div>
    <section class="tarjeta mapa-habilidades">${habilidades.length ? habilidades.map((h) => `<div class="habilidad-fila"><span class="habilidad-icono" data-nivel="${h.nivel}">${NIVELES_DOMINIO[h.nivel].icono}</span><div><b>${escapar(nombreHabilidad(h.id))}</b><small>${NIVELES_DOMINIO[h.nivel].nombre} · ${h.datos.sinPista || 0} aciertos sin pista · ${(h.datos.fechas || []).length} días</small></div><span class="contador">Nv ${h.nivel}/6</span></div>`).join('') : '<p class="muted">Completa tu primera práctica para empezar el mapa.</p>'}</section>
    <div class="seccion-titulo"><div><h2>Mapa de dominio</h2><p>Avance sala por sala</p></div></div><section class="tarjeta dominio">${s.dominio.map((d) => `<div class="dominio-fila"><span>${escapar(d.nombre)}</span><span class="barra"><i style="width:${porcentaje(d.progreso)}%"></i></span><span class="contador">${porcentaje(d.progreso)}%</span></div>`).join('')}</section>
    <div class="seccion-titulo"><div><h2>Comando a comando</h2><p>Frecuencia real en tus terminales</p></div><span class="contador">${s.comandos} ejecuciones</span></div><details class="bloque"><summary><span class="bloque-icono">$_</span><span class="bloque-titulo"><b>Ver los ${dominioComandos.length} comandos</b><small>Ordenados por uso</small></span><span class="chevron">⌄</span></summary><div class="comandos-grid" style="padding:0 12px 14px">${dominioComandos.map((c) => `<div class="comando"><b>${escapar(c.n)}</b><p>${escapar(c.q)}</p><span class="contador">${c.usos} usos</span></div>`).join('')}</div></details>
    <div class="seccion-titulo"><div><h2>Temas de terminal</h2><p>El actual es ${escapar(tema.nombre)}</p></div></div><div class="rejilla">${store.temasDisponibles.map((t) => `<button class="tarjeta" data-tema="${escapar(t.id)}"><div class="tarjeta-top"><h3>${escapar(t.nombre)}</h3><span style="width:17px;height:17px;border-radius:50%;background:${t.colores.acento}"></span></div><p>${escapar(t.desc)}</p>${t.id === tema.id ? '<span class="chip chip-dificultad">Activo</span>' : ''}</button>`).join('')}</div>
    <details class="bloque"><summary><span class="bloque-icono">💾</span><span class="bloque-titulo"><b>Copia de seguridad</b><small>Expórtala antes de instalar la app o cambiar de navegador</small></span><span class="chevron">⌄</span></summary><div class="transferencia" style="padding:0 12px 14px"><button class="btn" data-exportar>Exportar progreso</button><button class="btn-secundario" data-importar>Importar copia</button><button class="btn-fantasma" data-copiar>Copia al portapapeles</button><input class="oculto" id="archivo-importar" type="file" accept="application/json,.json"></div></details>
    <div class="seccion-titulo"><div><h2>Logros</h2><p>40 hitos de aprendizaje y práctica</p></div><span class="contador">${s.logros}/${LOGROS.length}</span></div><div class="logros">${LOGROS.map((l) => { const conseguido = store.estado.logros.includes(l.id); return `<article class="logro" ${conseguido ? '' : 'data-bloqueado'}><span class="logro-icono">${conseguido ? escapar(l.icono) : '◌'}</span><b>${escapar(l.nombre)}</b><small>${escapar(l.desc)}</small></article>`; }).join('')}</div>
    <div class="seccion-titulo"><div><h2>Zona de datos</h2><p>La cuenta es local: tú controlas la copia</p></div></div><button class="btn-fantasma btn-peligro" data-reiniciar-progreso>Reiniciar todo el progreso</button>
  </div>`;
  conectarPerfil();
}

function descargarProgreso() {
  const blob = new Blob([store.exportar()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `mentor-linux-progreso-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  brindis('Copia de progreso descargada');
}

async function copiarProgreso() {
  try { await navigator.clipboard.writeText(store.exportar()); brindis('Progreso copiado. Abre la app instalada y usa Importar copia.'); }
  catch { descargarProgreso(); brindis('El navegador bloqueó el portapapeles; descargamos la copia.'); }
}

function aplicarTema() {
  const t = store.temaActual();
  document.documentElement.style.setProperty('--term-acento', t.colores.acento);
  document.documentElement.style.setProperty('--term-prompt', t.colores.prompt);
  document.documentElement.style.setProperty('--term-fondo', t.colores.fondo);
}

function conectarPerfil() {
  vista.querySelector('[data-exportar]').addEventListener('click', descargarProgreso);
  vista.querySelector('[data-copiar]').addEventListener('click', copiarProgreso);
  const archivo = document.getElementById('archivo-importar');
  vista.querySelector('[data-importar]').addEventListener('click', () => archivo.click());
  archivo.addEventListener('change', async () => {
    const f = archivo.files[0]; if (!f) return;
    try { store.importar(await f.text()); aplicarTema(); actualizarCabecera(); renderPerfil(); brindis('Progreso importado correctamente'); }
    catch (e) { brindis(e.message || 'No se pudo importar ese archivo'); }
  });
  vista.querySelectorAll('[data-tema]').forEach((b) => b.addEventListener('click', () => { if (store.elegirTema(b.dataset.tema)) { aplicarTema(); renderPerfil(); brindis('Tema aplicado'); } }));
  vista.querySelector('[data-reiniciar-progreso]').addEventListener('click', () => {
    if (!confirm('¿Borrar todo el progreso local? Esta acción no se puede deshacer.')) return;
    store.reiniciar(); aplicarTema(); actualizarCabecera(); ir('aprender'); brindis('Progreso local reiniciado');
  });
}

document.addEventListener('click', (evento) => {
  const volver = evento.target.closest('[data-ir]');
  if (volver) return ir(volver.dataset.ir);
  const repaso = evento.target.closest('[data-repasar]');
  if (repaso) return abrirRepaso(repaso.dataset.repasar);
  const academia = evento.target.closest('[data-academia]');
  if (academia) return ir('academia', { id: academia.dataset.academia });
  const sala = evento.target.closest('[data-sala]');
  if (sala && !sala.disabled) { ejercicioActivo = sala.dataset.ejercicio || null; return ir('sala', { id: sala.dataset.sala, ejercicio: ejercicioActivo }); }
  const maquina = evento.target.closest('[data-maquina]');
  if (maquina) return ir('maquina', { id: maquina.dataset.maquina });
  const nivel = evento.target.closest('[data-wargame]');
  if (nivel && !nivel.disabled) return ir('wargame', { id: nivel.dataset.wargame });
  const lab = evento.target.closest('[data-laboratorio]');
  if (lab) return ir('laboratorio', { id: lab.dataset.laboratorio });
  const cerrar = evento.target.closest('[data-cerrar-aviso]');
  if (cerrar) { store.marcarAvisoSafari(); progresoPrevioDetectado = false; return render(); }
  if (evento.target.closest('[data-preparar-instalacion]')) return copiarProgreso();
});

document.querySelectorAll('[data-pestana]').forEach((b) => b.addEventListener('click', () => ir(b.dataset.pestana)));
window.addEventListener('popstate', () => cargarRuta(false));
window.addEventListener('pagehide', () => store.flush());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') store.flush(); });

function cargarRuta(guardar = false) {
  const [nombreCrudo, id] = location.hash.replace(/^#/, '').split('/');
  const nombre = ['aprender', 'maquinas', 'practicar', 'perfil', 'academia', 'sala', 'maquina', 'wargame', 'laboratorio'].includes(nombreCrudo) ? nombreCrudo : 'aprender';
  ir(nombre, id ? { id } : {}, guardar);
}

progresoPrevioDetectado = document.cookie.includes('mentor_linux_progress=1') && store.xp === 0;
store.registrarActividad();
aplicarTema();
cargarRuta(false);

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

// =====================================================================
// El teclado del móvil
// En iOS el viewport de diseño NO encoge al abrir el teclado: la mitad
// inferior de la app queda debajo, y con ella la línea donde escribes y
// la salida de la consola. Aquí se mide el viewport VISIBLE y se ajusta
// la altura de la app a lo que de verdad se ve.
// =====================================================================

function vigilarTeclado() {
  const vv = window.visualViewport;
  if (!vv) return;
  const raiz = document.documentElement;

  const ajustar = () => {
    // Lo que tapa el teclado es la diferencia entre la ventana y lo visible.
    const tapado = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const abierto = tapado > 120;

    raiz.style.setProperty('--alto-visible', `${Math.round(vv.height)}px`);
    raiz.style.setProperty('--teclado', `${Math.round(tapado)}px`);
    raiz.toggleAttribute('data-teclado', abierto);

    // Con el teclado abierto la salida de la consola debe seguir a la vista.
    if (abierto) {
      const salida = document.querySelector('.consola-salida');
      if (salida) salida.scrollTop = salida.scrollHeight;
    }
  };

  vv.addEventListener('resize', ajustar);
  vv.addEventListener('scroll', ajustar);
  ajustar();

  // Al enfocar la línea de comandos, asegurar que queda por encima del teclado.
  document.addEventListener('focusin', (e) => {
    if (!e.target.classList?.contains('consola-input')) return;
    setTimeout(() => {
      e.target.closest('.consola')?.scrollIntoView({ block: 'end', behavior: 'smooth' });
      const salida = document.querySelector('.consola-salida');
      if (salida) salida.scrollTop = salida.scrollHeight;
    }, 260);
  });
}

vigilarTeclado();

window.__mentor = { store, ir, SALAS, BLOQUES, MAQUINAS, WARGAME, MISIONES, totales: { salas: TOTAL_SALAS, tareas: TOTAL_TAREAS, ejercicios: TOTAL_EJERCICIOS } };
