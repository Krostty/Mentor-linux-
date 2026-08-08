import {
  SALAS, SALA_POR_ID, BLOQUES, ACADEMIAS, RUTAS, RUTA_POR_ID, ACADEMIA_POR_ID,
  EJERCICIO_POR_ID, TAREA_POR_ID, siguienteTarea,
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
import { escapar, formato, brindis, celebrar, porcentaje, vibrar } from './ui.js';

const vista = document.getElementById('vista');
const pistasMostradas = new Map();
let rutaActual = { nombre: 'aprender', datos: {} };
let ejercicioActivo = null;
let terminalActiva = null;
let progresoPrevioDetectado = false;
let modoRepaso = false;

// Estado del reproductor de lecciones (no se persiste: al volver a entrar se
// recalcula el primer paso pendiente).
let pasoActual = 0;
let saltados = [];
let ultimoAcierto = null;

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

// Abrir un ejercicio suelto (continuar, entrenar un punto débil, repasar) es
// abrir su lección posicionada en ese paso, no la sala entera.
function irAEjercicio(id, repaso = false) {
  const ejercicio = ejercicioPorId(id);
  if (!ejercicio) return ir('aprender');
  return ir('leccion', { id: ejercicio.tareaId, ejercicio: id, repaso });
}
function abrirRepaso(id) { return irAEjercicio(id, true); }

function marcarProgresoCompartible() {
  if (store.xp > 0) document.cookie = 'mentor_linux_progress=1; max-age=31536000; path=/; SameSite=Lax';
}

let xpPrevio = 0;
function actualizarCabecera() {
  const stats = store.estadisticas();
  document.getElementById('ficha-nivel').textContent = `Nv ${stats.nivel.nivel}`;
  const chipXp = document.getElementById('ficha-xp');
  chipXp.textContent = `${stats.xp} XP`;
  // El contador de XP salta cuando sube: recompensa visual al acertar.
  if (stats.xp > xpPrevio) {
    chipXp.removeAttribute('data-sube'); void chipXp.offsetWidth; chipXp.setAttribute('data-sube', '');
  }
  xpPrevio = stats.xp;
  document.getElementById('ficha-racha').textContent = `🔥 ${stats.racha}`;
  marcarProgresoCompartible();
}

function rutaHash(nombre, datos = {}) {
  if (nombre === 'leccion') return `#leccion/${datos.id}`;
  if (nombre === 'academia') return `#academia/${datos.id}`;
  if (nombre === 'sala') return `#sala/${datos.id}`;
  if (nombre === 'maquina') return `#maquina/${datos.id}`;
  if (nombre === 'wargame') return `#wargame/${datos.id}`;
  if (nombre === 'laboratorio') return `#laboratorio/${datos.id || 'libre'}`;
  return `#${nombre}`;
}

function ir(nombre, datos = {}, guardarHistorial = true) {
  rutaActual = { nombre, datos };
  ejercicioActivo = datos.ejercicio || null;
  modoRepaso = datos.repaso === true;
  terminalActiva = null;
  if (nombre === 'leccion') {
    saltados = [];
    ultimoAcierto = null;
    const tarea = TAREA_POR_ID[datos.id];
    pasoActual = tarea ? pasoInicial(tarea, pasosDeTarea(tarea), datos.ejercicio) : 0;
  }
  // Dentro de una lección la barra de pestañas estorba: son 90 px de alto en
  // una pantalla que solo tiene que mostrar una cosa.
  document.documentElement.toggleAttribute('data-en-leccion', nombre === 'leccion');
  const principal = ['sala', 'academia', 'leccion'].includes(nombre) ? 'aprender' : nombre === 'maquina' ? 'maquinas' : ['wargame', 'laboratorio'].includes(nombre) ? 'practicar' : nombre;
  document.querySelectorAll('[data-pestana]').forEach((b) => b.toggleAttribute('data-activa', b.dataset.pestana === principal));
  if (guardarHistorial && location.hash !== rutaHash(nombre, datos)) history.pushState({ nombre, datos }, '', rutaHash(nombre, datos));
  render();
  // Animación de entrada solo al cambiar de pantalla (no en los re-render
  // internos de una lección o una máquina, que rehacen el mismo nodo sin
  // pasar por aquí): así cada sección «entra» una vez, sin parpadear al
  // avanzar de paso.
  const raiz = vista.firstElementChild;
  if (raiz) { raiz.classList.remove('entra'); void raiz.offsetWidth; raiz.classList.add('entra'); }
  vista.scrollTop = 0;
  actualizarCabecera();
}

function render() {
  if (rutaActual.nombre === 'academia') return renderAcademiaDetalle(rutaActual.datos.id);
  if (rutaActual.nombre === 'sala') return renderSala(rutaActual.datos.id);
  if (rutaActual.nombre === 'leccion') return renderLeccion(rutaActual.datos.id);
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

// =====================================================================
// Pantalla de sala: la lista de sus lecciones
// Antes esta pantalla pintaba las 3-7 tareas desplegadas con toda su
// teoría y hasta 37 ejercicios en columna. Ahora solo enumera lecciones
// cortas; el contenido vive dentro del reproductor.
// =====================================================================

function renderSala(id) {
  const sala = SALA_POR_ID[id];
  if (!sala) return ir('aprender');
  const ruta = RUTAS.find((r) => r.salas.includes(id));
  const academia = ACADEMIAS.find((a) => a.id === ruta?.academia);
  const hechos = ejerciciosHechosSala(sala);
  const total = ejerciciosSala(sala);
  const habilidades = [...new Set(sala.tareas.flatMap((t) => t.practica.flatMap((e) => e.habilidades || [])))];
  const actual = sala.tareas.find((t) => store.tareaDesbloqueada(t.id) && !store.tareaHecha(t.id))?.id;

  vista.innerHTML = `<div class="pagina pagina-estrecha">
    <button class="enlace-volver" ${academia ? `data-academia="${escapar(academia.id)}"` : 'data-ir="aprender"'}>← ${escapar(academia?.nombre || 'Aprender')}</button>
    <header class="detalle-cabecera">
      <div class="migas"><span>${escapar(academia?.nombre || 'Aprender')}</span><i>›</i><b>${escapar(ruta?.nombre || 'Ruta')}</b></div>
      <h1>${escapar(sala.nombre)}</h1><p>${escapar(sala.resumen)}</p>
      <div class="chips"><span class="chip chip-dificultad">${escapar(sala.dificultad)}</span><span class="chip">◷ ${sala.minutos} min</span><span class="chip">${total} ejercicios</span></div>
      <div class="barra"><i style="width:${porcentaje(hechos / total)}%"></i></div>
      <div class="habilidades-sala">${habilidades.slice(0, 8).map((h) => `<span>${NIVELES_DOMINIO[store.nivelHabilidad(h)].icono} ${escapar(nombreHabilidad(h))}</span>`).join('')}</div>
    </header>
    <div class="seccion-titulo"><div><h2>Lecciones</h2><p>Una cosa por pantalla, paso a paso</p></div><span class="contador">${hechos}/${total}</span></div>
    <div class="camino"><div class="tramo">${sala.tareas.map((t, i) => renderNodoTarea(t, i, sala, actual)).join('')}</div></div>
  </div>`;
}

function renderNodoTarea(tarea, indice, sala, actual) {
  const hechos = tarea.practica.filter((e) => store.ejercicioHecho(e.id)).length;
  const total = tarea.practica.length;
  const completa = total > 0 && hechos === total;
  const abierta = store.tareaDesbloqueada(tarea.id);
  const esActual = tarea.id === actual;
  const estado = completa ? 'hecha' : !abierta ? 'bloqueada' : esActual ? 'curso' : 'lista';
  const marca = completa ? '✓' : esActual ? '▶' : abierta ? String(indice + 1).padStart(2, '0') : '🔒';
  const pasos = (tarea.teoria || []).length + total;

  return `<button class="nodo" data-estado="${estado}" data-leccion="${escapar(tarea.id)}" ${abierta ? '' : 'disabled'}
      ${indice === sala.tareas.length - 1 ? 'data-ultimo' : ''}>
    <span class="nodo-punto">${marca}</span>
    <span class="nodo-info">
      <b>${escapar(tarea.titulo)}</b>
      <small>${pasos} pantallas · ${total} ${total === 1 ? 'ejercicio' : 'ejercicios'}</small>
      ${abierta && !completa && total ? `<span class="mini-barra"><i style="width:${porcentaje(hechos / total)}%"></i></span>` : ''}
    </span>
    <span class="nodo-estado">${completa ? 'Hecha' : esActual ? 'Continuar' : abierta ? `${hechos}/${total}` : ''}</span>
  </button>`;
}

// =====================================================================
// Reproductor de lecciones
// Una tarea = una lección. Cada bloque de teoría y cada ejercicio ocupan
// su propia pantalla, con avance y retroceso siempre disponibles: el
// problema real de la versión anterior era que, una vez acertabas, no
// existía ninguna forma de volver a leer la pregunta anterior.
// =====================================================================

function pasosDeTarea(tarea) {
  const pasos = (tarea.teoria || []).map((bloque) => ({ tipo: 'teoria', bloque }));
  tarea.practica.forEach((ejercicio) => pasos.push({ tipo: 'ejercicio', ejercicio }));
  // Lo que saltas vuelve al final de la lección, antes del cierre.
  saltados.forEach((id) => {
    const ejercicio = tarea.practica.find((e) => e.id === id);
    if (ejercicio) pasos.push({ tipo: 'ejercicio', ejercicio, reintento: true });
  });
  pasos.push({ tipo: 'fin' });
  return pasos;
}

function pasoInicial(tarea, pasos, ejercicioId) {
  if (ejercicioId) {
    const i = pasos.findIndex((p) => p.tipo === 'ejercicio' && p.ejercicio.id === ejercicioId);
    if (i >= 0) return i;
  }
  // Si nunca la has tocado, empiezas por la teoría; si la retomas, por el
  // primer ejercicio que te falta.
  if (!tarea.practica.some((e) => store.ejercicioHecho(e.id))) return 0;
  const pendiente = pasos.findIndex((p) => p.tipo === 'ejercicio' && !store.ejercicioHecho(p.ejercicio.id));
  return pendiente >= 0 ? pendiente : 0;
}

function ejercicioResuelto(ejercicio) {
  return store.ejercicioHecho(ejercicio.id) && !modoRepaso;
}

function renderLeccion(id) {
  const tarea = TAREA_POR_ID[id];
  if (!tarea) return ir('aprender');
  const sala = SALA_POR_ID[tarea.salaId];
  const pasos = pasosDeTarea(tarea);
  pasoActual = Math.max(0, Math.min(pasoActual, pasos.length - 1));
  const paso = pasos[pasoActual];
  // Los reintentos (lo que saltaste) no engordan la barra: la lección sigue
  // teniendo los pasos que anunció, y los repescados se marcan aparte.
  const visibles = pasos.filter((p) => !p.reintento).length - 1;
  ejercicioActivo = paso.tipo === 'ejercicio' ? paso.ejercicio.id : null;

  vista.innerHTML = `<div class="leccion" data-paso="${paso.tipo}">
    <header class="leccion-top">
      <button class="leccion-salir" data-sala="${escapar(sala.id)}" aria-label="Salir de la lección">✕</button>
      <div class="leccion-progreso" role="progressbar" aria-valuemin="0" aria-valuemax="${visibles}" aria-valuenow="${Math.min(pasoActual, visibles)}">
        ${pasos.slice(0, visibles).map((p, i) => `<span data-estado="${estadoSegmento(p, i)}"></span>`).join('')}
      </div>
      <span class="leccion-cuenta">${paso.reintento ? '↻ repesca' : `${Math.min(pasoActual + 1, visibles)}/${visibles}`}</span>
    </header>
    <div class="leccion-cuerpo" id="leccion-cuerpo">${cuerpoPaso(paso, tarea, sala)}</div>
    ${piePaso(paso, pasos, tarea, sala)}
  </div>`;

  conectarLeccion(tarea, sala, paso);
  document.getElementById('leccion-cuerpo').scrollTop = 0;
}

// Verde = resuelto de verdad; ámbar = pasaste por encima sin resolverlo.
// Una barra que se pone verde solo por avanzar no dice nada.
function estadoSegmento(paso, indice) {
  if (indice === pasoActual) return 'aqui';
  if (indice > pasoActual) return 'pendiente';
  if (paso.tipo === 'ejercicio') return store.ejercicioHecho(paso.ejercicio.id) ? 'hecho' : 'saltado';
  return 'hecho';
}

function cuerpoPaso(paso, tarea, sala) {
  if (paso.tipo === 'fin') return cuerpoFin(tarea, sala);
  if (paso.tipo === 'teoria') {
    const primero = pasoActual === 0;
    return `<div class="paso paso-teoria">
      ${primero ? `<span class="eyebrow">${escapar(sala.nombre)}</span>
        <h1 class="paso-titulo">${escapar(tarea.titulo)}</h1>
        ${tarea.subtitulo ? `<p class="paso-sub">${escapar(tarea.subtitulo)}</p>` : ''}` : ''}
      ${renderTeoria([paso.bloque])}
    </div>`;
  }
  return cuerpoEjercicio(paso.ejercicio);
}

function cuerpoEjercicio(ejercicio) {
  const resuelto = ejercicioResuelto(ejercicio);
  const pistas = pistasMostradas.get(ejercicio.id) || 0;
  const habilidades = (ejercicio.habilidades || []).map((id) => {
    const nivel = store.nivelHabilidad(id);
    return `<span class="skill-chip" data-nivel="${nivel}">${NIVELES_DOMINIO[nivel].icono} ${escapar(nombreHabilidad(id))}</span>`;
  }).join('');

  return `<article class="paso paso-ejercicio ejercicio" id="ejercicio-${escapar(ejercicio.id)}"
      ${resuelto ? 'data-completo' : ''} ${modoRepaso ? 'data-repaso' : ''}>
    <div class="ejercicio-cabecera">
      <span class="ejercicio-tipo">${tipoEjercicio(ejercicio.tipo)}</span>
      <span class="ejercicio-xp">${modoRepaso ? 'REPASO' : `+${ejercicio.xp || 15} XP`}</span>
    </div>
    <p class="paso-enunciado">${htmlSeguro(ejercicio.enunciado)}</p>
    ${habilidades ? `<div class="skill-chips">${habilidades}</div>` : ''}
    ${fichaComando(ejercicio)}
    ${controlesEjercicio(ejercicio, resuelto)}
    ${renderPistas({ pistas: pistasDe(ejercicio) }, pistas)}
  </article>`;
}

function controlesEjercicio(ejercicio, resuelto) {
  if (resuelto) {
    return `<div class="feedback feedback-completo" data-ok>✓ Ya lo resolviste</div>
      ${ejercicio.explicacion ? `<div class="paso-explicacion"><b>Por qué</b>${htmlSeguro(ejercicio.explicacion)}</div>` : ''}`;
  }
  if (ejercicio.tipo === 'quiz') {
    return `<div class="opciones">${ejercicio.opciones.map((o, i) =>
      `<button class="opcion" data-quiz="${escapar(ejercicio.id)}" data-opcion="${i}"><span>${String.fromCharCode(65 + i)}</span>${escapar(o)}</button>`).join('')}</div>`;
  }
  if (ejercicio.tipo === 'respuesta' || ejercicio.tipo === 'completar') {
    // Si el enunciado ya enseña la plantilla, repetirla debajo solo añade ruido.
    const repetida = ejercicio.plantilla && normalizar(ejercicio.enunciado).includes(normalizar(ejercicio.plantilla));
    return `${ejercicio.plantilla && !repetida ? `<div class="plantilla-comando">${htmlSeguro(ejercicio.plantilla)}</div>` : ''}
      <form class="respuesta-form" data-respuesta="${escapar(ejercicio.id)}">
        <input class="campo" name="respuesta" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
          placeholder="${ejercicio.tipo === 'completar' ? 'Escribe solo lo que falta' : 'Escribe la respuesta'}" aria-label="Tu respuesta">
        <button class="sr-only" type="submit">Comprobar</button>
      </form>`;
  }
  if (ejercicio.tipo === 'ordenar') {
    return `<div class="constructor" data-constructor="${escapar(ejercicio.id)}">
      <div class="constructor-salida" data-constructor-salida><span>Toca los bloques en orden</span></div>
      <div class="fichas">${ejercicio.tokens.map((token, i) => `<button class="ficha" data-token="${i}" type="button">${escapar(token)}</button>`).join('')}</div>
      <div class="acciones"><button class="btn-fantasma btn-mini" data-limpiar-constructor type="button">Reiniciar</button></div>
    </div>`;
  }
  return `<div class="ejercicio-terminal">
    <div class="terminal-zona" id="terminal-ejercicio"></div>
    <div class="acciones"><button class="btn-fantasma btn-mini" data-reiniciar-terminal type="button">Restaurar sistema</button></div>
  </div>`;
}

function cuerpoFin(tarea, sala) {
  const hechos = tarea.practica.filter((e) => store.ejercicioHecho(e.id));
  const pendientes = tarea.practica.length - hechos.length;
  const xp = hechos.reduce((n, e) => n + (e.xp || 15), 0);
  const completa = pendientes === 0;
  const siguiente = siguienteTarea(sala, tarea.id);
  const comandos = [...new Set(tarea.practica.flatMap((e) => e.habilidades || []).filter((h) => COMANDO_POR_NOMBRE[h]))];

  return `<div class="paso paso-fin" ${completa ? 'data-completa' : ''}>
    <div class="fin-marca">${completa ? '✓' : '↻'}</div>
    <h1>${completa ? '¡Lección completada!' : 'Casi lo tienes'}</h1>
    <p>${completa ? escapar(tarea.titulo) : `Te faltan ${pendientes} ${pendientes === 1 ? 'ejercicio' : 'ejercicios'} de esta lección.`}</p>
    <div class="fin-datos">
      <div><b>${hechos.length}/${tarea.practica.length}</b><small>ejercicios</small></div>
      <div><b>${xp}</b><small>XP</small></div>
      <div><b>${porcentaje(store.progresoSala(sala.id))}%</b><small>de la sala</small></div>
    </div>
    ${comandos.length ? `<div class="fin-comandos"><span class="eyebrow">Has practicado</span>${comandos.map((c) => `<code>${escapar(c)}</code>`).join('')}</div>` : ''}
    <p class="fin-siguiente">${siguiente ? `Siguiente: <b>${escapar(siguiente.titulo)}</b>` : `Has terminado <b>${escapar(sala.nombre)}</b>`}</p>
  </div>`;
}

function piePaso(paso, pasos, tarea, sala) {
  const atras = `<button class="icon-btn paso-atras" data-mover="-1" ${pasoActual === 0 ? 'disabled' : ''} aria-label="Paso anterior">←</button>`;

  if (paso.tipo === 'fin') {
    // Si quedan ejercicios sin resolver, lo útil es volver al primero de
    // ellos, no salir de la lección.
    const pendiente = pasos.findIndex((p) => p.tipo === 'ejercicio' && !store.ejercicioHecho(p.ejercicio.id));
    if (pendiente >= 0) {
      return `<footer class="leccion-pie"><div class="leccion-botones">${atras}
        <button class="btn" data-ir-paso="${pendiente}">Rematar lo que falta</button>
      </div></footer>`;
    }
    const siguiente = siguienteTarea(sala, tarea.id);
    const abierta = siguiente && store.tareaDesbloqueada(siguiente.id);
    return `<footer class="leccion-pie"><div class="leccion-botones">${atras}
      ${abierta
        ? `<button class="btn" data-leccion="${escapar(siguiente.id)}">Siguiente lección</button>`
        : `<button class="btn" data-sala="${escapar(sala.id)}">Volver a la sala</button>`}
    </div></footer>`;
  }

  if (paso.tipo === 'teoria') {
    return `<footer class="leccion-pie"><div class="leccion-botones">${atras}
      <button class="btn" data-mover="1">Continuar</button>
    </div></footer>`;
  }

  const ejercicio = paso.ejercicio;
  const resuelto = ejercicioResuelto(ejercicio);
  const acierto = ultimoAcierto && ultimoAcierto.id === ejercicio.id;
  const ultimo = pasoActual >= pasos.length - 2;
  const mensaje = acierto
    ? `**${acierto && ultimoAcierto.repaso ? '↻ Repaso superado.' : '¡Correcto!'}** ${ejercicio.explicacion || ''}`
    : resuelto ? '' : ejercicio.tipo === 'terminal' ? 'Escribe el comando y pulsa Intro.' : '';
  const hayPistas = !resuelto && pistasDe(ejercicio).length > (pistasMostradas.get(ejercicio.id) || 0);
  // El botón grande del pie es el que se usa: comprobar cuando hay algo que
  // comprobar, continuar cuando ya está resuelto. Saltar queda pequeño, a
  // mano pero sin invitar a saltárselo todo.
  const seComprueba = !resuelto && ['respuesta', 'completar', 'ordenar'].includes(ejercicio.tipo);
  const principal = resuelto
    ? `<button class="btn" data-mover="1">${ultimo ? 'Terminar' : 'Continuar'}</button>`
    : seComprueba
      ? '<button class="btn" data-comprobar type="button">Comprobar</button>'
      : `<button class="btn-fantasma" data-mover="1" data-saltar="${escapar(ejercicio.id)}">Saltar</button>`;

  return `<footer class="leccion-pie" ${acierto ? 'data-estado="ok"' : ''}>
    ${acierto && ultimoAcierto.xp ? `<span class="leccion-xp">+${ultimoAcierto.xp} XP</span>` : ''}
    <div class="feedback" data-feedback="${escapar(ejercicio.id)}" ${acierto ? 'data-ok' : ''}>${mensaje ? htmlSeguro(mensaje) : ''}</div>
    <div class="leccion-botones">
      ${atras}
      ${hayPistas ? `<button class="btn-fantasma btn-mini" data-pista="${escapar(ejercicio.id)}">Pista</button>` : ''}
      ${seComprueba ? `<button class="btn-fantasma btn-mini" data-mover="1" data-saltar="${escapar(ejercicio.id)}">Saltar</button>` : ''}
      ${principal}
    </div>
  </footer>`;
}

function moverPaso(tarea, delta, saltar) {
  if (saltar && !saltados.includes(saltar)) saltados.push(saltar);
  ultimoAcierto = null;
  modoRepaso = false;
  pasoActual += delta;
  renderLeccion(tarea.id);
}

function conectarLeccion(tarea, sala, paso) {
  vista.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () =>
    moverPaso(tarea, Number(b.dataset.mover), b.dataset.saltar)));

  vista.querySelectorAll('[data-ir-paso]').forEach((b) => b.addEventListener('click', () =>
    moverPaso(tarea, Number(b.dataset.irPaso) - pasoActual)));

  vista.querySelectorAll('[data-pista]').forEach((b) => b.addEventListener('click', () => {
    const e = ejercicioPorId(b.dataset.pista);
    pistasMostradas.set(e.id, Math.min((pistasMostradas.get(e.id) || 0) + 1, pistasDe(e).length));
    renderLeccion(tarea.id);
  }));

  if (paso.tipo !== 'ejercicio') return;
  const ejercicio = paso.ejercicio;

  vista.querySelectorAll('[data-quiz]').forEach((b) => b.addEventListener('click', () => {
    const elegida = Number(b.dataset.opcion);
    if (elegida !== ejercicio.correcta) {
      store.registrarIntento(ejercicio, { correcto: false });
      b.disabled = true;
      b.setAttribute('data-descartada', '');
      const quedan = [...vista.querySelectorAll('[data-quiz]')].filter((o) => !o.disabled).length;
      return feedback(ejercicio.id, `Esa no; queda descartada. ${quedan === 1 ? 'Solo queda una opción posible.' : `Quedan ${quedan} opciones.`}`);
    }
    completarEjercicio(tarea, ejercicio);
  }));

  // Comprobar vive en el pie, bajo el pulgar; el formulario sigue aceptando
  // Intro y el constructor ya no necesita su propio botón.
  let comprobar = null;

  const form = vista.querySelector('[data-respuesta]');
  if (form) {
    comprobar = () => {
      const valor = String(new FormData(form).get('respuesta') || '');
      if (!(ejercicio.respuestas || []).some((r) => normalizar(r) === normalizar(valor))) {
        store.registrarIntento(ejercicio, { correcto: false });
        return feedback(ejercicio.id, diagnosticar(ejercicio, valor));
      }
      completarEjercicio(tarea, ejercicio);
    };
    form.addEventListener('submit', (evento) => { evento.preventDefault(); comprobar(); });
  }

  const constructor = vista.querySelector('[data-constructor]');
  if (constructor) {
    const salida = constructor.querySelector('[data-constructor-salida]');
    const pintar = () => {
      const seleccion = JSON.parse(constructor.dataset.valor || '[]');
      salida.innerHTML = seleccion.length
        ? seleccion.map((i) => `<code>${escapar(ejercicio.tokens[i])}</code>`).join('<span> </span>')
        : '<span>Toca los bloques en orden</span>';
      constructor.querySelectorAll('[data-token]').forEach((b) => { b.disabled = seleccion.includes(Number(b.dataset.token)); });
    };
    constructor.querySelectorAll('[data-token]').forEach((b) => b.addEventListener('click', () => {
      const seleccion = JSON.parse(constructor.dataset.valor || '[]');
      seleccion.push(Number(b.dataset.token));
      constructor.dataset.valor = JSON.stringify(seleccion);
      pintar();
    }));
    constructor.querySelector('[data-limpiar-constructor]').addEventListener('click', () => { constructor.dataset.valor = '[]'; pintar(); });
    comprobar = () => {
      const seleccion = JSON.parse(constructor.dataset.valor || '[]');
      const puestos = seleccion.map((i) => ejercicio.tokens[i]);
      if (normalizar(puestos.join(' ')) !== normalizar(ejercicio.respuestaCorrecta)) {
        store.registrarIntento(ejercicio, { correcto: false });
        return feedback(ejercicio.id, diagnosticar(ejercicio, puestos));
      }
      completarEjercicio(tarea, ejercicio);
    };
  }

  const botonComprobar = vista.querySelector('[data-comprobar]');
  if (botonComprobar && comprobar) botonComprobar.addEventListener('click', () => comprobar());

  const reiniciar = vista.querySelector('[data-reiniciar-terminal]');
  if (reiniciar) reiniciar.addEventListener('click', () => terminalActiva?.reiniciar());
  iniciarTerminalEjercicio(tarea, sala, ejercicio);
}

function completarEjercicio(tarea, ejercicio) {
  const resultado = store.completarEjercicio(ejercicio, { usoPista: (pistasMostradas.get(ejercicio.id) || 0) > 0 });
  actualizarCabecera();
  vibrar(18);
  (resultado.nuevosLogros || []).forEach((l) => brindis(`${l.icono} **${l.nombre}** — ${l.desc}`));
  modoRepaso = false;
  ultimoAcierto = { id: ejercicio.id, xp: resultado.ganado || 0, repaso: !!resultado.repaso };
  renderLeccion(tarea.id);
}

function iniciarTerminalEjercicio(tarea, sala, ejercicio) {
  const contenedor = document.getElementById('terminal-ejercicio');
  if (!contenedor || ejercicio.tipo !== 'terminal') return;
  // Cuántos comandos pide la solución. En los retos de varios pasos, cada
  // comando intermedio NO debe gritar «incompleto»: se calla hasta que el
  // usuario ha escrito al menos tantos comandos como la solución necesita.
  const pasosSolucion = String(ejercicio.solucion || '').split('\n').filter(Boolean).length || 1;
  let ejecutados = 0;
  terminalActiva = new Terminal(contenedor, {
    snapshot: ejercicio.snapshot || sala.snapshot || 'inicio', autoFocus: true,
    alEjecutar: (ctx) => {
      store.contarComando(comandoDe(ctx.ultimo?.cmd));
      let correcto = false;
      try { correcto = ejercicio.check(ctx) === true; } catch { correcto = false; }
      if (correcto) return completarEjercicio(tarea, ejercicio);
      ejecutados++;
      // Antes de completar los pasos: silencio. La propia salida de la
      // terminal (un error, un «not found») ya orienta; para más ayuda está
      // el botón de pista. Solo cuando ya escribió suficientes comandos y aún
      // no cuadra el estado, se ofrece un diagnóstico concreto.
      if (ejecutados < pasosSolucion) return;
      feedback(ejercicio.id, diagnosticoTerminal(ejercicio, ctx), false);
    },
  });
}

// =====================================================================
// Ayudas: ficha del comando, pistas y diagnóstico del fallo
// El contenido trae pistas en 180 de los 563 ejercicios y diagnóstico en
// 43. Para el resto se derivan de la propia solución, para que ningún
// ejercicio te deje con un «todavía no coincide» y nada más.
// =====================================================================

const COMANDO_POR_NOMBRE = Object.fromEntries(TODOS_COMANDOS.map((c) => [c.n, c]));

function solucionDe(ejercicio) {
  return String(ejercicio.respuestaCorrecta || (ejercicio.respuestas || [])[0] || ejercicio.solucion || '');
}

function comandoDeEjercicio(ejercicio) {
  const candidatos = [
    ...(ejercicio.habilidades || []),
    comandoDe(solucionDe(ejercicio)),
    comandoDe(ejercicio.plantilla || ''),
  ];
  return candidatos.map((c) => COMANDO_POR_NOMBRE[c]).find(Boolean) || null;
}

function fichaComando(ejercicio) {
  const c = comandoDeEjercicio(ejercicio);
  if (!c) return '';
  return `<details class="ficha-comando">
    <summary>¿Qué hace <code>${escapar(c.n)}</code>?</summary>
    <div class="ficha-cuerpo">
      <p>${escapar(c.q)}</p>
      <pre><code>${escapar(c.s)}</code></pre>
      ${(c.o || []).length ? `<ul class="ficha-opciones">${c.o.slice(0, 6).map(([o, d]) => `<li><code>${escapar(o)}</code><span>${escapar(d)}</span></li>`).join('')}</ul>` : ''}
      <pre><code>${escapar(c.e)}</code></pre>
    </div>
  </details>`;
}

function pistasDe(ejercicio) {
  if (ejercicio.pistas?.length) return ejercicio.pistas;
  if (ejercicio.tipo === 'quiz') {
    const malas = ejercicio.opciones.map((_, i) => i).filter((i) => i !== ejercicio.correcta);
    return malas.slice(0, 2).map((i) => `Descarta esta: «${ejercicio.opciones[i]}».`);
  }
  const objetivo = solucionDe(ejercicio);
  if (!objetivo) return [];
  if (ejercicio.tipo === 'completar') {
    return [
      `Lo que falta tiene ${objetivo.length} ${objetivo.length === 1 ? 'carácter' : 'caracteres'}.`,
      `Empieza por \`${objetivo.slice(0, 1)}\`.`,
      `Es \`${objetivo}\`.`,
    ];
  }
  const partes = objetivo.trim().split(/\s+/);
  const pistas = [`El comando es \`${partes[0]}\`.`];
  if (partes.length > 1) pistas.push(`Se completa con ${partes.length - 1} ${partes.length === 2 ? 'parte más' : 'partes más'}; la siguiente es \`${partes[1]}\`.`);
  pistas.push(`La respuesta completa es \`${objetivo}\`.`);
  return pistas;
}

// Reconstruye la solución de un ejercicio «ordenar» como lista de fichas,
// consumiendo la respuesta correcta con las fichas disponibles (la más larga
// primero, para que «done» gane a «do»).
function bloquesSolucion(ejercicio) {
  const objetivo = String(ejercicio.respuestaCorrecta || '').trim();
  const piezas = [...(ejercicio.tokens || [])].sort((a, b) => b.length - a.length);
  const salida = [];
  let resto = objetivo;
  while (resto.length) {
    const pieza = piezas.find((t) => t && resto.startsWith(t));
    if (!pieza) return objetivo.split(/\s+/);
    salida.push(pieza);
    resto = resto.slice(pieza.length).replace(/^\s+/, '');
  }
  return salida;
}

function distancia(a, b) {
  const s = String(a), t = String(b);
  const fila = Array.from({ length: t.length + 1 }, (_, i) => i);
  for (let i = 1; i <= s.length; i++) {
    let previo = fila[0];
    fila[0] = i;
    for (let j = 1; j <= t.length; j++) {
      const temp = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (s[i - 1] === t[j - 1] ? 0 : 1));
      previo = temp;
    }
  }
  return fila[t.length];
}

function opcionConocida(ejercicio, texto) {
  const c = comandoDeEjercicio(ejercicio);
  const limpio = String(texto).trim();
  return (c?.o || []).find(([o]) => o === limpio || o === `-${limpio}`) || null;
}

// Diagnóstico concreto para ordenar / completar / respuesta.
function diagnosticar(ejercicio, dado) {
  const escrito = String(dado).trim();

  if (ejercicio.tipo === 'ordenar') {
    // Se compara bloque a bloque, no palabra a palabra: hay fichas con
    // espacios dentro («1 2 3;», «"Failed password"») y contar palabras
    // daba mensajes falsos sobre cuántos bloques faltaban.
    const correcto = bloquesSolucion(ejercicio);
    const puestos = Array.isArray(dado) ? dado : escrito.split(/\s+/).filter(Boolean);
    if (!puestos.length) return 'Toca los bloques para construir la orden.';
    if (puestos.length !== correcto.length) {
      const diferencia = Math.abs(correcto.length - puestos.length);
      return `La orden se construye con ${correcto.length} bloques y pusiste ${puestos.length}: ${puestos.length < correcto.length ? 'falta' : 'sobra'}n ${diferencia}.`;
    }
    if ([...puestos].sort().join(' ') === [...correcto].sort().join(' ')) {
      return 'Los bloques son los correctos, pero no el orden: **comando → opción → sobre qué actúa**.';
    }
    if (puestos[0] !== correcto[0]) return `El primer bloque tiene que ser el comando: \`${correcto[0]}\`.`;
    return 'Alguno de los bloques no encaja ahí. Reinicia y piensa qué aporta cada uno.';
  }

  const validas = (ejercicio.respuestas || []).map(String);
  if (!escrito) return 'Escribe una respuesta antes de comprobar.';

  if (ejercicio.tipo === 'completar') {
    if (validas.some((r) => r.toLowerCase() === escrito.toLowerCase())) return 'Es eso, pero Linux distingue mayúsculas de minúsculas.';
    if (validas.some((r) => r.replace(/^-+/, '') === escrito.replace(/^-+/, ''))) {
      return escrito.startsWith('-') ? 'Ahí no hace falta el guion.' : 'Las opciones cortas se escriben con guion delante: `-x`.';
    }
    const opcion = opcionConocida(ejercicio, escrito);
    if (opcion) return `\`${opcion[0]}\` existe, pero hace otra cosa: ${opcion[1]}.`;
    if (validas.some((r) => distancia(r, escrito) <= 1)) return 'Casi. Revisa la respuesta carácter a carácter.';
    return 'Todavía no. Mira la plantilla: solo falta ese trozo, no el comando entero.';
  }

  if (validas.some((r) => normalizar(r) === normalizar(escrito.replace(/\/+$/, '')))) return 'Es eso, pero sin la barra final.';
  if (validas.every((r) => r.startsWith('/')) && !escrito.startsWith('/')) return 'Se espera la ruta completa, la que empieza por `/`.';
  if (validas.every((r) => /^\d+$/.test(r)) && !/^\d+$/.test(escrito)) return 'La respuesta es un número, sin texto alrededor.';
  if (validas.some((r) => distancia(normalizar(r), normalizar(escrito)) <= 2)) return 'Casi. Revisa la ortografía y los separadores.';
  return 'Todavía no coincide. Vuelve atrás con la flecha si necesitas releer el ejercicio anterior.';
}

function diagnosticoTerminal(ejercicio, ctx) {
  const propio = (ejercicio.diagnostico || []).find((d) => { try { return d.cuando(ctx); } catch { return false; } });
  if (propio) return `**${propio.titulo}.** ${propio.texto}`;
  const esperado = comandoDeEjercicio(ejercicio)?.n;
  if (esperado && !(ctx.historial || []).some((h) => comandoDe(h) === esperado)) {
    return `Todavía no has usado \`${esperado}\`, que es el comando de este ejercicio.`;
  }
  if (ctx.ultimo?.code) return 'El último comando terminó con error. Lee el mensaje: suele decir si la ruta no existe o si falta un permiso.';
  return 'El sistema aún no está en el estado que pide el enunciado. Prueba otra opción del comando.';
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

// =====================================================================
// Reproductor de máquina guiado
// Antes la máquina volcaba las 4 fases, la terminal y las banderas en una
// sola pantalla larga. Ahora se recorre como una lección: una fase a la
// vez, con su explicación, la terminal integrada, pistas escaladas y un
// botón «Ver desarrollo» que revela el comando y por qué funciona. La
// terminal se crea UNA vez y persiste entre fases (el acceso cambia de
// usuario y no debe reiniciarse); solo se repinta el panel de la fase.
// =====================================================================

function faseDisponible(maquina, indice) {
  return indice === 0 || store.faseMaquinaHecha(maquina.id, maquina.fases[indice - 1].id);
}

function faseActualMaquina(maquina) {
  return maquina.fases.findIndex((f, i) => !store.faseMaquinaHecha(maquina.id, f.id) && faseDisponible(maquina, i));
}

function renderMaquina(id) {
  const maquina = MAQUINA_POR_ID[id];
  if (!maquina) return ir('maquinas');
  document.documentElement.toggleAttribute('data-en-leccion', true);
  vista.innerHTML = `<div class="leccion maquina-guia" data-color="red">
    <header class="leccion-top">
      <button class="leccion-salir" data-ir="maquinas" aria-label="Salir de la máquina">✕</button>
      <div class="leccion-progreso" id="maq-progreso"></div>
      <span class="leccion-cuenta" id="maq-cuenta"></span>
    </header>
    <div class="leccion-cuerpo" id="maq-cuerpo">
      <div id="maq-panel"></div>
      <div class="ejercicio-terminal maquina-terminal">
        <div class="terminal-zona" id="terminal-maquina"></div>
        <div class="acciones"><button class="btn-fantasma btn-mini" data-reiniciar-maquina type="button">Restaurar máquina</button></div>
      </div>
    </div>
    <footer class="leccion-pie" id="maq-pie"></footer>
  </div>`;
  conectarMaquina(maquina);
}

function panelFase(maquina, fase, indice) {
  const pistas = pistasMostradas.get(`${maquina.id}/${fase.id}`) || 0;
  const desarrollo = pistasMostradas.get(`${maquina.id}/${fase.id}/dev`);
  return `<article class="maquina-fase paso" data-fase="${escapar(fase.id)}">
    <div class="ejercicio-cabecera"><span class="ejercicio-tipo">Fase ${indice + 1} · ${escapar(fase.nombre)}</span><span class="ejercicio-xp">Máquina ${escapar(maquina.nombre)}</span></div>
    <p class="paso-enunciado">${htmlSeguro(fase.objetivo)}</p>
    ${fase.guia ? `<div class="maquina-guia-texto">${htmlSeguro(fase.guia)}</div>` : ''}
    ${renderPistas(fase, pistas)}
    ${desarrollo ? `<div class="maquina-desarrollo"><b>Desarrollo</b><pre><code>${escapar(fase.solucion)}</code></pre><p>${htmlSeguro(fase.desarrollo || '')}</p></div>` : ''}
  </article>`;
}

function panelBanderas(maquina) {
  const estado = store.estadoMaquina(maquina.id);
  return `<article class="maquina-fase paso" data-banderas>
    <div class="ejercicio-cabecera"><span class="ejercicio-tipo">Banderas</span><span class="ejercicio-xp">${escapar(maquina.nombre)}</span></div>
    <p class="paso-enunciado">Ya tienes root. Lee las banderas en la terminal y pégalas aquí.</p>
    <div class="maquina-guia-texto">La bandera de usuario está en <code>/home/${escapar(maquina.user)}/user.txt</code> y la de root en <code>/root/root.txt</code>. Muéstralas con <code>cat</code> y copia el valor.</div>
    <form class="flag-form" data-flag="user"><input class="campo mono" placeholder="Pega user.txt" aria-label="Bandera user.txt" ${estado.userFlag ? 'disabled value="Capturada ✓"' : ''}><button class="btn btn-mini" ${estado.userFlag ? 'disabled' : ''}>Validar user</button></form>
    <form class="flag-form" data-flag="root"><input class="campo mono" placeholder="Pega root.txt" aria-label="Bandera root.txt" ${estado.rootFlag ? 'disabled value="Capturada ✓"' : ''}><button class="btn btn-mini" ${estado.rootFlag ? 'disabled' : ''}>Validar root</button></form>
    <div class="feedback" data-feedback-maquina></div>
  </article>`;
}

function panelWriteup(maquina) {
  return `<article class="maquina-fase paso paso-fin" data-completa>
    <div class="fin-marca">✓</div>
    <h1>Máquina comprometida</h1>
    <p>Has recorrido ${escapar(maquina.nombre)} de principio a fin.</p>
    <section class="writeup"><span class="eyebrow">Writeup</span><ol>${maquina.writeup.map((p) => `<li>${escapar(p)}</li>`).join('')}</ol></section>
  </article>`;
}

// Repinta el panel de la fase, el progreso y el pie sin tocar la terminal.
function pintarMaquina(maquina) {
  const panel = document.getElementById('maq-panel');
  const pie = document.getElementById('maq-pie');
  const progreso = document.getElementById('maq-progreso');
  const cuenta = document.getElementById('maq-cuenta');
  if (!panel) return;
  const estado = store.estadoMaquina(maquina.id);
  const idxFase = faseActualMaquina(maquina);
  const total = maquina.fases.length + 2; // fases + 2 banderas
  const hechas = maquina.fases.filter((f) => store.faseMaquinaHecha(maquina.id, f.id)).length;
  const flags = Number(estado.userFlag) + Number(estado.rootFlag);
  const hechos = hechas + flags;

  // Progreso segmentado: una marca por fase y una por bandera.
  const segs = [];
  for (let i = 0; i < maquina.fases.length; i++) segs.push(store.faseMaquinaHecha(maquina.id, maquina.fases[i].id) ? 'hecho' : i === idxFase ? 'aqui' : 'pendiente');
  segs.push(estado.userFlag ? 'hecho' : idxFase < 0 ? 'aqui' : 'pendiente');
  segs.push(estado.rootFlag ? 'hecho' : 'pendiente');
  progreso.innerHTML = segs.map((s) => `<span data-estado="${s}"></span>`).join('');
  cuenta.textContent = idxFase >= 0 ? `Fase ${idxFase + 1}/${maquina.fases.length}` : `${hechos}/${total}`;

  const terminalVisible = document.querySelector('.maquina-terminal');
  if (idxFase >= 0) {
    const fase = maquina.fases[idxFase];
    panel.innerHTML = panelFase(maquina, fase, idxFase);
    if (terminalVisible) terminalVisible.style.display = '';
    const pistas = pistasMostradas.get(`${maquina.id}/${fase.id}`) || 0;
    const hayPistas = pistas < fase.pistas.length;
    const verDev = pistasMostradas.get(`${maquina.id}/${fase.id}/dev`);
    pie.removeAttribute('data-estado');
    pie.innerHTML = `<div class="feedback" data-feedback-maquina>Escribe los comandos en la terminal. La fase se valida sola cuando el sistema queda en el estado correcto.</div>
      <div class="leccion-botones">
        ${hayPistas ? `<button class="btn-fantasma btn-mini" data-pista-fase="${escapar(fase.id)}">Pista</button>` : ''}
        ${verDev ? '' : `<button class="btn-fantasma btn-mini" data-dev-fase="${escapar(fase.id)}">Ver desarrollo</button>`}
      </div>`;
  } else if (flags < 2) {
    panel.innerHTML = panelBanderas(maquina);
    if (terminalVisible) terminalVisible.style.display = '';
    pie.removeAttribute('data-estado');
    pie.innerHTML = `<div class="feedback" data-feedback-maquina>Lee las banderas con <code>cat</code> y pégalas arriba.</div>`;
  } else {
    panel.innerHTML = panelWriteup(maquina);
    if (terminalVisible) terminalVisible.style.display = 'none';
    pie.setAttribute('data-estado', 'ok');
    pie.innerHTML = `<div class="leccion-botones"><button class="btn" data-ir="maquinas">Volver a las máquinas</button></div>`;
  }
  conectarPanelMaquina(maquina);
}

function conectarPanelMaquina(maquina) {
  vista.querySelectorAll('[data-pista-fase]').forEach((b) => b.addEventListener('click', () => {
    const fase = maquina.fases.find((f) => f.id === b.dataset.pistaFase);
    const clave = `${maquina.id}/${fase.id}`;
    pistasMostradas.set(clave, Math.min((pistasMostradas.get(clave) || 0) + 1, fase.pistas.length));
    pintarMaquina(maquina);
  }));
  vista.querySelectorAll('[data-dev-fase]').forEach((b) => b.addEventListener('click', () => {
    pistasMostradas.set(`${maquina.id}/${b.dataset.devFase}/dev`, true);
    pintarMaquina(maquina);
  }));
  vista.querySelectorAll('[data-flag]').forEach((form) => form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const tipo = form.dataset.flag;
    const valor = form.querySelector('input').value;
    const hash = tipo === 'root' ? maquina.rootFlagHash : maquina.userFlagHash;
    const mensaje = vista.querySelector('[data-feedback-maquina]');
    if (!respuestaCorrecta(valor, hash)) { if (mensaje) { mensaje.textContent = 'Esa bandera no es válida para esta máquina.'; mensaje.dataset.error = ''; } return; }
    store.registrarFlag(maquina, tipo);
    actualizarCabecera();
    if (store.estadoMaquina(maquina.id).completada) {
      celebrar({ marca: '🏴', titulo: 'Máquina comprometida', texto: `Has completado ${maquina.nombre} con las dos banderas.`, xp: 0, botones: [{ texto: 'Ver writeup', accion: () => pintarMaquina(maquina) }, { texto: 'Volver a las máquinas', principal: false, accion: () => ir('maquinas') }] });
    } else {
      brindis(`🚩 ${tipo}.txt capturada`);
      pintarMaquina(maquina);
    }
  }));
}

function conectarMaquina(maquina) {
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
      const idx = faseActualMaquina(maquina);
      if (idx < 0) return;
      const fase = maquina.fases[idx];
      let ok = false;
      try { ok = fase.check(ctx) === true; } catch { ok = false; }
      if (!ok) return;
      try { fase.onComplete?.(ctx); } catch {}
      store.completarFaseMaquina(maquina, fase);
      actualizarCabecera();
      vibrar(18);
      brindis(`✓ Fase superada: **${fase.nombre}**`);
      pintarMaquina(maquina);
    },
  });
  const reiniciar = vista.querySelector('[data-reiniciar-maquina]');
  if (reiniciar) reiniciar.addEventListener('click', () => terminalActiva?.reiniciar());
  pintarMaquina(maquina);
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
  const leccion = evento.target.closest('[data-leccion]');
  if (leccion && !leccion.disabled) return ir('leccion', { id: leccion.dataset.leccion });
  const sala = evento.target.closest('[data-sala]');
  if (sala && !sala.disabled) {
    // Con ejercicio concreto (continuar, entrenar) se entra directo a su
    // lección; sin él, a la lista de lecciones de la sala.
    if (sala.dataset.ejercicio) return irAEjercicio(sala.dataset.ejercicio);
    return ir('sala', { id: sala.dataset.sala });
  }
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
  // El navegador escapa el hash, y hay ids con eñe («permisos-dueños-teoria»):
  // sin decodificar, recargar en esa pantalla te echaba al inicio.
  const [nombreCrudo, idCrudo] = location.hash.replace(/^#/, '').split('/');
  let id = idCrudo;
  try { id = idCrudo ? decodeURIComponent(idCrudo) : idCrudo; } catch {}
  const nombre = ['aprender', 'maquinas', 'practicar', 'perfil', 'academia', 'sala', 'leccion', 'maquina', 'wargame', 'laboratorio'].includes(nombreCrudo) ? nombreCrudo : 'aprender';
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
