// Mentor Linux — arranque, navegación y vistas.

import { store } from './store.js';
import { Terminal } from './engine/terminal.js';
import { MODULOS, RUTAS, MODULO_POR_ID, RETO_POR_ID, retosDe, TOTAL_RETOS } from './data/modules.js';
import { INCIDENTES, INCIDENTE_POR_ID } from './data/incidentes.js';
import { CATEGORIAS, buscarComandos } from './data/comandos.js';
import { LOGROS, TEMAS } from './data/logros.js';
import { diagnosticar } from './data/checks.js';
import { escapar, formato, $, $$, brindis, limpiarBrindis, celebrar, porcentaje, vibrar, tiempo } from './ui.js';

// ==========================================================================
// Navegación
// ==========================================================================

const PESTANA_DE_VISTA = {
  inicio: 'inicio', modulo: 'inicio', leccion: 'inicio', reto: 'inicio', examen: 'inicio',
  terminal: 'terminal',
  incidentes: 'incidentes', incidente: 'incidentes',
  chuletas: 'chuletas',
  perfil: 'perfil',
};

let vistaActual = 'inicio';

function ir(vista, datos = {}) {
  // Al salir de un incidente hay que parar su cronómetro pase lo que pase.
  if (vistaActual === 'incidente' && vista !== 'incidente') pararCronometro();
  limpiarBrindis();
  vistaActual = vista;
  $$('.vista').forEach((v) => v.toggleAttribute('data-activa', v.dataset.vista === vista));
  $$('.pestana').forEach((p) => p.toggleAttribute('data-activa', p.dataset.pestana === PESTANA_DE_VISTA[vista]));

  const contenido = $(`.vista[data-vista="${vista}"] .contenido`);
  if (contenido) contenido.scrollTop = 0;

  const pintores = {
    inicio: pintarInicio,
    modulo: () => pintarModulo(datos.moduloId),
    leccion: () => pintarLeccion(datos.moduloId, datos.leccionId),
    reto: () => abrirReto(datos.retoId),
    examen: () => pintarExamen(datos.moduloId),
    terminal: pintarTerminalLibre,
    incidentes: pintarIncidentes,
    incidente: () => abrirIncidente(datos.incidenteId),
    chuletas: pintarChuletas,
    perfil: pintarPerfil,
  };
  if (pintores[vista]) pintores[vista]();
  actualizarCabecera();
}

// ==========================================================================
// Cabecera y tema
// ==========================================================================

function actualizarCabecera() {
  const n = store.nivel;
  $('#ficha-nivel').textContent = `Nv ${n.nivel}`;
  $('#ficha-xp').textContent = store.xp.toLocaleString('es-ES');
  $('#ficha-racha').textContent = `🔥 ${store.estado.racha}`;
}

function aplicarTema() {
  const t = store.temaActual();
  const raiz = document.documentElement;
  raiz.style.setProperty('--term-fondo', t.colores.fondo);
  raiz.style.setProperty('--term-acento', t.colores.acento);
  raiz.style.setProperty('--term-prompt', t.colores.prompt);
}

// ==========================================================================
// Vista: inicio (la ruta de aprendizaje)
// ==========================================================================

function pintarInicio() {
  const cont = $('#contenido-inicio');
  const siguiente = store.siguientePaso();
  const repasos = store.retosParaRepasar();

  let html = '';

  if (siguiente) {
    const { modulo } = siguiente;
    const etiqueta =
      siguiente.tipo === 'leccion' ? `Módulo ${modulo.n} · lección`
      : siguiente.tipo === 'reto' ? `Módulo ${modulo.n} · reto`
      : `Módulo ${modulo.n} · examen`;
    const titulo =
      siguiente.tipo === 'examen' ? `Examen de ${modulo.nombre}` : siguiente.leccion.titulo;
    const meta =
      siguiente.tipo === 'reto' ? siguiente.reto.enunciado.slice(0, 90)
      : siguiente.tipo === 'examen' ? '5 preguntas para cerrar el módulo'
      : siguiente.leccion.subtitulo;

    html += `
      <h1 class="h1">${store.xp === 0 ? 'Empieza por aquí' : 'Sigue donde lo dejaste'}</h1>
      <p class="sub">${escapar(modulo.resumen)}.</p>
      <button class="continuar" data-continuar>
        <div class="continuar-etiqueta">${escapar(etiqueta)}</div>
        <div class="continuar-titulo">${escapar(titulo)}</div>
        <div class="continuar-meta">${escapar(meta)}</div>
        ${porcentaje(store.progresoModulo(modulo.id)) > 0
          ? `<span class="barra" style="margin-bottom:14px"><i style="width:${porcentaje(store.progresoModulo(modulo.id))}%"></i></span>`
          : ''}
        <span class="continuar-cta">Continuar →</span>
      </button>`;
  } else {
    html += `
      <h1 class="h1">Lo has completado todo</h1>
      <p class="sub">Los 20 módulos, cerrados. Ahora toca mantener el filo: prueba el Modo Incidente o repasa lo que se resista.</p>`;
  }

  if (repasos.length) {
    html += `<p class="eyebrow">Repaso de hoy</p>
      <button class="tarjeta" style="width:100%;text-align:left;color:inherit" data-repaso>
        <h3>Tienes ${repasos.length} ${repasos.length === 1 ? 'reto' : 'retos'} para repasar</h3>
        <p>Los que en su día costaron vuelven a los 2, 7 y 21 días. Es lo que hace que se queden.</p>
      </button>`;
  }

  for (const ruta of RUTAS) {
    const prog = store.progresoRuta(ruta.id);
    html += `
      <div class="ruta-cabecera">
        <h3>${escapar(ruta.nombre)}</h3>
        <span class="pct">${porcentaje(prog)}%</span>
      </div>
      <p class="ruta-desc">${escapar(ruta.descripcion)}</p>
      <span class="barra" data-tono="${ruta.color === 'lime' ? '' : ruta.color}" style="margin-bottom:12px"><i style="width:${porcentaje(prog)}%"></i></span>
      <div class="lista">`;

    for (const n of ruta.modulos) {
      const m = MODULOS.find((x) => x.n === n);
      if (!m) continue;
      const desbloqueado = store.moduloDesbloqueado(m.n);
      const completado = store.moduloCompletado(m.id);
      const prog = store.progresoModulo(m.id);
      const estado = completado ? 'hecho' : !desbloqueado ? 'bloqueado' : prog > 0 ? 'actual' : 'actual';
      const hechos = retosDe(m.id).filter((r) => store.retoHecho(r.id)).length;

      html += `
        <button class="modulo" data-estado="${estado}" data-modulo="${escapar(m.id)}" ${desbloqueado ? '' : 'disabled'}>
          <span class="modulo-num">${String(m.n).padStart(2, '0')}</span>
          <span class="modulo-cuerpo">
            <span class="modulo-nombre">${escapar(m.nombre)}</span>
            <span class="modulo-meta">${escapar(m.resumen)}</span>
            ${desbloqueado && !completado && prog > 0 ? `<span class="barra modulo-barra"><i style="width:${porcentaje(prog)}%"></i></span>` : ''}
            ${completado ? `<span class="modulo-meta">${hechos}/${retosDe(m.id).length} retos · completado</span>` : ''}
          </span>
          <span class="modulo-flecha">${completado ? '✓' : desbloqueado ? '▸' : '🔒'}</span>
        </button>`;
    }
    html += '</div>';
  }

  cont.innerHTML = html;

  const btnContinuar = cont.querySelector('[data-continuar]');
  if (btnContinuar) {
    btnContinuar.addEventListener('click', () => {
      const s = store.siguientePaso();
      if (!s) return;
      if (s.tipo === 'leccion') ir('leccion', { moduloId: s.modulo.id, leccionId: s.leccion.id });
      else if (s.tipo === 'reto') ir('reto', { retoId: s.reto.id });
      else ir('examen', { moduloId: s.modulo.id });
    });
  }

  const btnRepaso = cont.querySelector('[data-repaso]');
  if (btnRepaso) {
    btnRepaso.addEventListener('click', () => {
      const id = store.retosParaRepasar()[0];
      if (id && RETO_POR_ID[id]) ir('reto', { retoId: id });
    });
  }

  cont.querySelectorAll('[data-modulo]').forEach((b) => {
    b.addEventListener('click', () => ir('modulo', { moduloId: b.dataset.modulo }));
  });
}

// ==========================================================================
// Vista: módulo
// ==========================================================================

function pintarModulo(moduloId) {
  const m = MODULO_POR_ID[moduloId];
  const cont = $('#contenido-modulo');
  if (!m) {
    cont.innerHTML = '<p class="vacio">Ese módulo no existe.</p>';
    return;
  }

  const prog = store.progresoModulo(m.id);
  let html = `
    <button class="volver" data-volver>← <span>Aprender</span></button>
    <h1 class="h1">${escapar(m.nombre)}</h1>
    <p class="sub">${escapar(m.resumen)}</p>
    <span class="barra" style="margin-bottom:6px"><i style="width:${porcentaje(prog)}%"></i></span>
    <p class="ruta-desc">${porcentaje(prog)}% completado · ${m.lecciones.length} lecciones · ${retosDe(m.id).length} retos</p>

    <p class="eyebrow">Comandos que verás</p>
    <div class="tarjeta"><p class="mono" style="color:var(--term-acento);font-size:14px;line-height:1.9">${m.comandos.map(escapar).join('  ·  ')}</p></div>

    <p class="eyebrow">Lecciones</p>
    <div class="lista">`;

  for (const l of m.lecciones) {
    const vista = store.leccionVista(m.id, l.id);
    const retos = l.retos || [];
    const hechos = retos.filter((r) => store.retoHecho(r.id)).length;
    html += `
      <button class="modulo" data-estado="${vista && hechos === retos.length ? 'hecho' : 'actual'}" data-leccion="${escapar(l.id)}">
        <span class="modulo-num">${vista ? '✓' : '·'}</span>
        <span class="modulo-cuerpo">
          <span class="modulo-nombre">${escapar(l.titulo)}</span>
          <span class="modulo-meta">${escapar(l.subtitulo)}${retos.length ? ` · ${hechos}/${retos.length} retos` : ''}</span>
        </span>
        <span class="modulo-flecha">▸</span>
      </button>`;
  }

  const nota = store.estado.examenesAprobados[m.id];
  html += `</div>
    <p class="eyebrow">Examen</p>
    <button class="modulo" data-estado="${nota >= 3 ? 'hecho' : 'actual'}" data-examen>
      <span class="modulo-num">${nota != null ? nota : '?'}</span>
      <span class="modulo-cuerpo">
        <span class="modulo-nombre">Examen del módulo</span>
        <span class="modulo-meta">${nota != null ? `Tu mejor resultado: ${nota}/5` : '5 preguntas · hacen falta 3 para aprobar'}</span>
      </span>
      <span class="modulo-flecha">▸</span>
    </button>`;

  cont.innerHTML = html;
  cont.querySelector('[data-volver]').addEventListener('click', () => ir('inicio'));
  cont.querySelectorAll('[data-leccion]').forEach((b) => {
    b.addEventListener('click', () => ir('leccion', { moduloId: m.id, leccionId: b.dataset.leccion }));
  });
  cont.querySelector('[data-examen]').addEventListener('click', () => ir('examen', { moduloId: m.id }));
}

// ==========================================================================
// Vista: lección
// ==========================================================================

function pintarLeccion(moduloId, leccionId) {
  const m = MODULO_POR_ID[moduloId];
  const l = m && m.lecciones.find((x) => x.id === leccionId);
  const cont = $('#contenido-leccion');
  if (!l) {
    cont.innerHTML = '<p class="vacio">Esa lección no existe.</p>';
    return;
  }

  let html = `
    <button class="volver" data-volver>← <span>${escapar(m.nombre)}</span></button>
    <div class="cmd-hero">${escapar(l.titulo)}</div>
    <p class="sub">${escapar(l.subtitulo)}</p>`;

  for (const bloque of l.cuerpo) {
    if (bloque.t) {
      html += `<div class="tarjeta"><h3>${escapar(bloque.t)}</h3><p>${formato(bloque.p)}</p></div>`;
    } else if (bloque.f) {
      html += `<div class="tarjeta"><div class="flags">${bloque.f
        .map(([c, d]) => `<div class="flag"><code>${escapar(c)}</code><span>${formato(d)}</span></div>`)
        .join('')}</div></div>`;
    } else if (bloque.c) {
      html += `<pre class="bloque">${escapar(bloque.c)}</pre>`;
    } else if (bloque.n) {
      html += `<div class="tarjeta aviso"><h3>💡 Consejo</h3><p>${formato(bloque.n)}</p></div>`;
    }
  }

  const retos = l.retos || [];
  const pendiente = retos.find((r) => !store.retoHecho(r.id));
  const indice = m.lecciones.findIndex((x) => x.id === l.id);
  const siguienteLeccion = m.lecciones[indice + 1];

  if (pendiente) {
    html += `<button class="btn btn-bloque" data-practicar>Practicarlo ahora →</button>`;
  } else if (retos.length) {
    html += `<div class="tarjeta" style="margin-top:16px;border-color:rgba(124,255,79,.3)"><h3>✓ Retos completados</h3><p>Ya has resuelto los ${retos.length} retos de esta lección.</p></div>
      <button class="btn btn-bloque" data-siguiente>${siguienteLeccion ? 'Siguiente lección →' : 'Ir al examen →'}</button>`;
  } else {
    html += `<button class="btn btn-bloque" data-siguiente>${siguienteLeccion ? 'Siguiente lección →' : 'Ir al examen →'}</button>`;
  }

  cont.innerHTML = html;
  store.verLeccion(m.id, l.id);
  actualizarCabecera();

  cont.querySelector('[data-volver]').addEventListener('click', () => ir('modulo', { moduloId: m.id }));
  const practicar = cont.querySelector('[data-practicar]');
  if (practicar) practicar.addEventListener('click', () => ir('reto', { retoId: pendiente.id }));
  const siguiente = cont.querySelector('[data-siguiente]');
  if (siguiente) {
    siguiente.addEventListener('click', () => {
      if (siguienteLeccion) ir('leccion', { moduloId: m.id, leccionId: siguienteLeccion.id });
      else ir('examen', { moduloId: m.id });
    });
  }
}

// ==========================================================================
// Vista: reto
// ==========================================================================

let terminalReto = null;
let retoEnCurso = null;
let pistasUsadas = 0;
let resuelto = false;

function abrirReto(retoId) {
  const reto = RETO_POR_ID[retoId];
  if (!reto) return;
  const m = MODULO_POR_ID[reto.moduloId];

  retoEnCurso = reto;
  pistasUsadas = 0;
  resuelto = false;

  const yaHecho = store.retoHecho(reto.id);

  $('#reto-cabecera').innerHTML = `
    <button class="volver" data-volver>← <span>${escapar(m.nombre)}</span></button>
    <div class="enunciado">
      <p class="eyebrow">Reto · ${reto.xp} XP${yaHecho ? ' · repaso' : ''}</p>
      <p>${formato(reto.enunciado)}</p>
    </div>`;

  $('#reto-cabecera').querySelector('[data-volver]').addEventListener('click', () => {
    ir('leccion', { moduloId: reto.moduloId, leccionId: reto.leccionId });
  });

  $('#reto-ayuda').innerHTML = '';

  terminalReto = new Terminal($('#reto-terminal'), {
    snapshot: reto.snapshot,
    bienvenida: false,
    teclasEn: $('#reto-teclas'),
    alEjecutar: (ctx) => comprobarReto(ctx),
  });
  terminalReto.escribir('Escribe comandos de verdad. Puedes explorar y equivocarte: `Reiniciar` deja el sistema como estaba.', 'nota');

  pintarAccionesReto();
}

function pintarAccionesReto() {
  const acciones = $('#reto-acciones');
  const quedan = (retoEnCurso.pistas || []).length - pistasUsadas;
  acciones.innerHTML = `
    <button class="btn-fantasma" data-pista ${quedan <= 0 ? 'disabled' : ''}>💡 Pista${quedan > 0 ? ` ${quedan}` : ''}</button>
    <button class="btn-fantasma" data-solucion>Solución</button>
    <button class="btn-fantasma" data-reiniciar aria-label="Reiniciar el sistema">↺ Reiniciar</button>`;

  const pista = acciones.querySelector('[data-pista]');
  if (pista) {
    pista.addEventListener('click', () => {
      const texto = retoEnCurso.pistas[pistasUsadas];
      if (!texto) return;
      pistasUsadas++;
      const div = document.createElement('div');
      div.className = 'pista';
      div.innerHTML = `💡 ${formato(texto)}`;
      $('#reto-ayuda').appendChild(div);
      $('#reto-ayuda').scrollTop = $('#reto-ayuda').scrollHeight;
      pintarAccionesReto();
    });
  }

  acciones.querySelector('[data-solucion]').addEventListener('click', () => {
    pistasUsadas = Math.max(pistasUsadas, (retoEnCurso.pistas || []).length);
    const div = document.createElement('div');
    div.className = 'pista';
    div.innerHTML = `Solución: <code>${escapar(retoEnCurso.solucion)}</code>`;
    $('#reto-ayuda').appendChild(div);
    $('#reto-ayuda').scrollTop = $('#reto-ayuda').scrollHeight;
    pintarAccionesReto();
  });

  acciones.querySelector('[data-reiniciar]').addEventListener('click', () => {
    terminalReto.reiniciar();
    $('#reto-ayuda').innerHTML = '';
  });
}

function comprobarReto(ctx) {
  if (resuelto || !retoEnCurso) return;
  store.contarComando();

  let cumplido = false;
  try {
    cumplido = retoEnCurso.check(ctx) === true;
  } catch {
    cumplido = false;
  }

  if (cumplido) {
    resuelto = true;
    vibrar(18);
    const resultado = store.completarReto(retoEnCurso, { usoPista: pistasUsadas > 0 });
    actualizarCabecera();
    mostrarVictoriaReto(resultado);
    return;
  }

  // Solo se diagnostica si el comando produjo algo: no molestamos mientras
  // el usuario explora con `ls` o `pwd`.
  if (!ctx.ultimo || !ctx.ultimo.cmd) return;
  const explicacion = diagnosticar(ctx, retoEnCurso.diagnostico || []);
  if (!explicacion) return;
  if (ctx.ultimo.code === 0 && !ctx.ultimo.salida.trim() === false && esComandoDeExploracion(ctx.ultimo.cmd)) return;

  const zona = $('#reto-ayuda');
  const previo = zona.querySelector('.diagnostico');
  if (previo) previo.remove();
  const div = document.createElement('div');
  div.className = 'diagnostico';
  div.innerHTML = `<h4>${escapar(explicacion.titulo)}</h4><p>${formato(explicacion.texto)}</p>`;
  zona.appendChild(div);
  zona.scrollTop = zona.scrollHeight;
  store.fallarReto(retoEnCurso.id);
}

// Mirar alrededor no cuenta como intento fallido.
function esComandoDeExploracion(cmd) {
  return /^(ls|pwd|cd|cat|tree|whoami|id|help|clear|history|man|file|stat)\b/.test(cmd.trim());
}

function mostrarVictoriaReto({ ganado, combo, nuevosLogros }) {
  const reto = retoEnCurso;
  const m = MODULO_POR_ID[reto.moduloId];
  const l = m.lecciones.find((x) => x.id === reto.leccionId);
  const retos = l.retos || [];
  const indiceReto = retos.findIndex((r) => r.id === reto.id);
  const siguienteReto = retos[indiceReto + 1];
  const indiceLeccion = m.lecciones.findIndex((x) => x.id === l.id);
  const siguienteLeccion = m.lecciones[indiceLeccion + 1];

  const botones = [];
  if (siguienteReto) {
    botones.push({ texto: 'Siguiente reto →', accion: () => ir('reto', { retoId: siguienteReto.id }) });
  } else if (siguienteLeccion) {
    botones.push({ texto: 'Siguiente lección →', accion: () => ir('leccion', { moduloId: m.id, leccionId: siguienteLeccion.id }) });
  } else {
    botones.push({ texto: 'Ir al examen →', accion: () => ir('examen', { moduloId: m.id }) });
  }
  botones.push({ texto: 'Volver al módulo', principal: false, accion: () => ir('modulo', { moduloId: m.id }) });

  celebrar({
    marca: '🎉',
    titulo: '¡Reto superado!',
    texto: pistasUsadas > 0 ? 'Resuelto con ayuda. Volverá en unos días para que se te quede.' : 'Sin pistas. Así se hace.',
    xp: ganado,
    combo,
    logros: nuevosLogros,
    botones,
  });

  for (const logro of nuevosLogros) brindis(`${logro.icono} Logro: **${logro.nombre}**`, 'logro');
}

// ==========================================================================
// Vista: examen
// ==========================================================================

let examenEstado = null;

function pintarExamen(moduloId) {
  const m = MODULO_POR_ID[moduloId];
  const cont = $('#contenido-examen');
  if (!m) return;

  examenEstado = { modulo: m, indice: 0, aciertos: 0, respondida: false };
  pintarPregunta();

  function pintarPregunta() {
    const { indice, aciertos } = examenEstado;
    const p = m.examen[indice];

    cont.innerHTML = `
      <button class="volver" data-volver>← <span>${escapar(m.nombre)}</span></button>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin:8px 0 4px">
        <p class="eyebrow" style="margin:0">Examen · ${escapar(m.nombre)}</p>
        <span class="contador-preguntas">${indice + 1}/${m.examen.length} · ${aciertos} ✓</span>
      </div>
      <h2 class="h2" style="margin:10px 0 16px">${formato(p.pregunta)}</h2>
      <div id="opciones">
        ${p.opciones.map((o, i) => `<button class="opcion" data-opcion="${i}">${formato(o)}</button>`).join('')}
      </div>
      <div id="explicacion"></div>`;

    cont.querySelector('[data-volver]').addEventListener('click', () => ir('modulo', { moduloId: m.id }));
    cont.querySelectorAll('[data-opcion]').forEach((b) => {
      b.addEventListener('click', () => responder(Number(b.dataset.opcion)));
    });
  }

  function responder(elegida) {
    if (examenEstado.respondida) return;
    examenEstado.respondida = true;
    const p = m.examen[examenEstado.indice];
    const acierto = elegida === p.correcta;
    if (acierto) {
      examenEstado.aciertos++;
      vibrar(14);
    }

    cont.querySelectorAll('[data-opcion]').forEach((b) => {
      const i = Number(b.dataset.opcion);
      b.disabled = true;
      if (i === p.correcta) b.dataset.estado = 'bien';
      else if (i === elegida) b.dataset.estado = 'mal';
    });

    const ultima = examenEstado.indice === m.examen.length - 1;
    $('#explicacion').innerHTML = `
      <div class="explicacion">${acierto ? '✓ Correcto. ' : '✗ '}${formato(p.explicacion)}</div>
      <button class="btn btn-bloque" data-siguiente>${ultima ? 'Ver resultado →' : 'Siguiente pregunta →'}</button>`;

    $('#explicacion').querySelector('[data-siguiente]').addEventListener('click', () => {
      if (ultima) terminar();
      else {
        examenEstado.indice++;
        examenEstado.respondida = false;
        pintarPregunta();
      }
    });
  }

  function terminar() {
    const { aciertos } = examenEstado;
    const total = m.examen.length;
    const antes = store.moduloCompletado(m.id);
    const nuevosLogros = store.registrarExamen(m.id, aciertos, total);
    actualizarCabecera();
    const ahora = store.moduloCompletado(m.id);

    const aprobado = aciertos >= 3;
    const moduloCerrado = !antes && ahora;

    celebrar({
      marca: aciertos === total ? '💯' : aprobado ? '✅' : '📖',
      titulo: aciertos === total ? '¡Examen perfecto!' : aprobado ? 'Aprobado' : 'Casi',
      texto: moduloCerrado
        ? `Módulo **${m.nombre}** completado. Se ha desbloqueado el siguiente.`
        : aprobado
          ? `${aciertos} de ${total} correctas.`
          : `${aciertos} de ${total}. Hacen falta 3 para aprobar: repasa las lecciones y vuelve a intentarlo.`,
      xp: aciertos === total ? 100 : aciertos * 15,
      logros: nuevosLogros,
      botones: [
        { texto: aprobado ? 'Seguir aprendiendo →' : 'Repetir examen', accion: () => (aprobado ? ir('inicio') : ir('examen', { moduloId: m.id })) },
        { texto: 'Volver al módulo', principal: false, accion: () => ir('modulo', { moduloId: m.id }) },
      ],
    });

    for (const logro of nuevosLogros) brindis(`${logro.icono} Logro: **${logro.nombre}**`, 'logro');
    if (moduloCerrado) {
      const temasAntes = store.temasDisponibles.length;
      if (temasAntes > 1) brindis('🎨 Nuevo tema de terminal disponible en Perfil', 'xp');
    }
  }
}

// ==========================================================================
// Vista: terminal libre
// ==========================================================================

let terminalLibre = null;

function pintarTerminalLibre() {
  if (!terminalLibre) {
    terminalLibre = new Terminal($('#terminal-libre'), {
      snapshot: 'inicio',
      alEjecutar: () => store.contarComando(),
    });
    $('#terminal-reiniciar').addEventListener('click', () => terminalLibre.reiniciar());
  }
}

// ==========================================================================
// Vista: incidentes
// ==========================================================================

function pintarIncidentes() {
  const cont = $('#contenido-incidentes');
  let html = `
    <h1 class="h1">Modo Incidente</h1>
    <p class="sub">Escenarios reales con el reloj corriendo. Un aviso, una terminal y una máquina con un problema de verdad.</p>`;

  for (const inc of INCIDENTES) {
    const resuelto = store.estado.incidentesResueltos.includes(inc.id);
    html += `
      <button class="incidente" data-incidente="${escapar(inc.id)}">
        <div class="incidente-fila">
          <span class="gravedad" data-nivel="${escapar(inc.gravedad)}">${escapar(inc.gravedad)}</span>
          <span class="mono" style="font-size:12px;color:var(--muted)">${inc.minutos} min · ${inc.xp} XP</span>
          ${resuelto ? '<span style="margin-left:auto;color:var(--lime)">✓</span>' : ''}
        </div>
        <div class="incidente-titulo">${escapar(inc.titulo)}</div>
        <div class="incidente-meta">${escapar(inc.objetivos.length)} objetivos · ${escapar(inc.aviso.slice(0, 80))}…</div>
      </button>`;
  }

  cont.innerHTML = html;
  cont.querySelectorAll('[data-incidente]').forEach((b) => {
    b.addEventListener('click', () => ir('incidente', { incidenteId: b.dataset.incidente }));
  });
}

let terminalIncidente = null;
let incidenteEnCurso = null;
let cronometro = null;
let segundosRestantes = 0;
let objetivosHechos = new Set();

function abrirIncidente(incidenteId) {
  const inc = INCIDENTE_POR_ID[incidenteId];
  if (!inc) return;

  incidenteEnCurso = inc;
  objetivosHechos = new Set();
  segundosRestantes = inc.minutos * 60;

  $('#incidente-cabecera').innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin:4px 0 2px">
      <button class="volver" data-salir style="margin:0">← <span>Salir</span></button>
      <span class="reloj" id="reloj">${tiempo(segundosRestantes)}</span>
    </div>
    <div class="enunciado">
      <p class="eyebrow">${escapar(inc.titulo)}</p>
      <p style="font-weight:500;font-size:15px">${formato(inc.aviso)}</p>
    </div>`;

  $('#incidente-cabecera').querySelector('[data-salir]').addEventListener('click', () => {
    pararCronometro();
    ir('incidentes');
  });

  terminalIncidente = new Terminal($('#incidente-terminal'), {
    snapshot: inc.snapshot,
    bienvenida: false,
    teclasEn: $('#incidente-teclas'),
    alEjecutar: (ctx) => comprobarIncidente(ctx),
  });
  terminalIncidente.escribir('Conectado. Resuelve el incidente antes de que se acabe el tiempo.', 'nota');

  pintarObjetivos();

  $('#incidente-acciones').innerHTML = `
    <button class="btn-fantasma" data-ayuda title="Cuesta 30 segundos">💡 Ayuda (−30 s)</button>
    <button class="btn-fantasma" data-reiniciar>↺ Reiniciar</button>`;

  $('#incidente-acciones').querySelector('[data-ayuda]').addEventListener('click', () => {
    const pendiente = inc.objetivos.find((o) => !objetivosHechos.has(o.id));
    if (!pendiente) return;
    terminalIncidente.escribir(`💡 ${pendiente.ayuda}`, 'nota');
    segundosRestantes = Math.max(10, segundosRestantes - 30);
    actualizarReloj();
  });

  $('#incidente-acciones').querySelector('[data-reiniciar]').addEventListener('click', () => {
    terminalIncidente.reiniciar();
    objetivosHechos = new Set();
    pintarObjetivos();
  });

  arrancarCronometro();
}

function pintarObjetivos() {
  const inc = incidenteEnCurso;
  $('#incidente-objetivos').innerHTML = `<div class="objetivos">${inc.objetivos
    .map(
      (o) => `<div class="objetivo" ${objetivosHechos.has(o.id) ? 'data-hecho' : ''}>
        <span class="objetivo-marca">${objetivosHechos.has(o.id) ? '✓' : ''}</span>
        <span class="objetivo-texto">${escapar(o.texto)}</span>
      </div>`
    )
    .join('')}</div>`;
}

function comprobarIncidente(ctx) {
  if (!incidenteEnCurso) return;
  store.contarComando();

  let hayNuevo = false;
  for (const o of incidenteEnCurso.objetivos) {
    if (objetivosHechos.has(o.id)) continue;
    let cumplido = false;
    try {
      cumplido = o.check(ctx) === true;
    } catch {
      cumplido = false;
    }
    if (cumplido) {
      objetivosHechos.add(o.id);
      hayNuevo = true;
      brindis(`✓ ${o.texto}`, 'xp', 1800);
      vibrar(12);
    }
  }

  if (hayNuevo) pintarObjetivos();

  if (objetivosHechos.size === incidenteEnCurso.objetivos.length) {
    terminarIncidente(true);
  }
}

function arrancarCronometro() {
  pararCronometro();
  cronometro = setInterval(() => {
    segundosRestantes--;
    actualizarReloj();
    if (segundosRestantes <= 0) terminarIncidente(false);
  }, 1000);
}

function pararCronometro() {
  if (cronometro) clearInterval(cronometro);
  cronometro = null;
}

function actualizarReloj() {
  const el = $('#reloj');
  if (!el) return;
  el.textContent = tiempo(segundosRestantes);
  el.toggleAttribute('data-urgente', segundosRestantes <= 60);
}

function terminarIncidente(exito) {
  pararCronometro();
  const inc = incidenteEnCurso;
  if (!inc) return;
  incidenteEnCurso = null;

  let nuevosLogros = [];
  if (exito) {
    nuevosLogros = store.completarIncidente(inc, { tiempoRestante: segundosRestantes });
    actualizarCabecera();
  }

  celebrar({
    marca: exito ? '🚨' : '⏱️',
    titulo: exito ? 'Incidente resuelto' : 'Se acabó el tiempo',
    texto: exito
      ? inc.conclusion
      : `Completaste ${objetivosHechos.size} de ${inc.objetivos.length} objetivos. No pasa nada: en un incidente real también se aprende repitiendo.`,
    xp: exito ? inc.xp : 0,
    logros: nuevosLogros,
    botones: [
      { texto: exito ? 'Otro incidente →' : 'Reintentar', accion: () => (exito ? ir('incidentes') : ir('incidente', { incidenteId: inc.id })) },
      { texto: 'Volver a la lista', principal: false, accion: () => ir('incidentes') },
    ],
  });

  for (const logro of nuevosLogros) brindis(`${logro.icono} Logro: **${logro.nombre}**`, 'logro');
}

// ==========================================================================
// Vista: chuletas
// ==========================================================================

let abiertaChuleta = null;

function pintarChuletas(consulta = '') {
  const cont = $('#contenido-chuletas');
  const resultados = consulta ? buscarComandos(consulta) : null;

  let html = `
    <h1 class="h1">Todos los comandos</h1>
    <p class="sub">Consultable sin conexión, en cualquier momento.</p>
    <div class="buscador">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6B649B" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="buscar-chuleta" placeholder="Buscar comando…" value="${escapar(consulta)}" aria-label="Buscar comando o acción">
    </div>`;

  if (resultados) {
    html += resultados.length
      ? `<p class="eyebrow">${resultados.length} resultado${resultados.length === 1 ? '' : 's'}</p><div>${resultados.map(chuletaHtml).join('')}</div>`
      : `<p class="vacio">Nada coincide con «${escapar(consulta)}».<br>Prueba con el nombre del comando o con lo que quieres conseguir.</p>`;
  } else {
    for (const cat of CATEGORIAS) {
      html += `<p class="eyebrow">${escapar(cat.nombre)}</p><div>${cat.comandos.map(chuletaHtml).join('')}</div>`;
    }
  }

  cont.innerHTML = html;

  const input = $('#buscar-chuleta');
  input.addEventListener('input', () => {
    const v = input.value;
    if (v.trim()) store.contarBusqueda();
    const pos = input.selectionStart;
    pintarChuletas(v);
    const nuevo = $('#buscar-chuleta');
    nuevo.focus();
    nuevo.setSelectionRange(pos, pos);
  });

  cont.querySelectorAll('[data-chuleta]').forEach((b) => {
    b.addEventListener('click', () => {
      abiertaChuleta = abiertaChuleta === b.dataset.chuleta ? null : b.dataset.chuleta;
      pintarChuletas(input.value);
    });
  });
}

function chuletaHtml(c) {
  const abierta = abiertaChuleta === c.n;
  return `<button class="chuleta" data-chuleta="${escapar(c.n)}">
    <b>${escapar(c.n)}</b>
    <span>${escapar(c.q)}</span>
    ${abierta ? `<div class="chuleta-detalle">
      <p class="eyebrow" style="margin:0 0 6px">Sintaxis</p>
      <pre class="bloque" style="margin-bottom:10px">${escapar(c.s)}</pre>
      ${c.o.length ? `<p class="eyebrow" style="margin:0 0 6px">Opciones</p><div class="flags" style="margin-bottom:10px">${c.o.map(([f, d]) => `<div class="flag"><code>${escapar(f)}</code><span>${escapar(d)}</span></div>`).join('')}</div>` : ''}
      <p class="eyebrow" style="margin:0 0 6px">Ejemplo</p>
      <pre class="bloque">${escapar(c.e)}</pre>
    </div>` : ''}
  </button>`;
}

// ==========================================================================
// Vista: perfil
// ==========================================================================

function pintarPerfil() {
  const cont = $('#contenido-perfil');
  const e = store.estadisticas();
  const n = e.nivel;

  let html = `
    <div class="rango">
      <div class="rango-insignia">${n.nivel}</div>
      <div class="rango-datos">
        <div style="font-size:19px;font-weight:800">Nivel ${n.nivel} · ${escapar(n.titulo)}</div>
        <div style="color:var(--muted);font-size:14px;margin:4px 0 7px">${n.siguiente ? `${n.faltan} XP para el nivel ${n.siguiente.nivel}` : 'Nivel máximo alcanzado'}</div>
        <span class="barra" style="width:170px"><i style="width:${porcentaje(n.progreso)}%"></i></span>
      </div>
    </div>

    <div class="estadisticas">
      <div class="estadistica" data-tono="xp"><b>${e.xp.toLocaleString('es-ES')}</b><span>XP total</span></div>
      <div class="estadistica" data-tono="fuego"><b>${e.racha}</b><span>días seguidos</span></div>
      <div class="estadistica" data-tono="ok"><b>${e.retos}<span style="font-size:14px;color:var(--dim)">/${e.totalRetos}</span></b><span>retos resueltos</span></div>
      <div class="estadistica" data-tono="cyan"><b>${e.modulos}<span style="font-size:14px;color:var(--dim)">/${e.totalModulos}</span></b><span>módulos</span></div>
      <div class="estadistica" data-tono="cyan"><b>${e.comandos}</b><span>comandos ejecutados</span></div>
      <div class="estadistica" data-tono="fuego"><b>×${e.mejorCombo}</b><span>mejor combo</span></div>
    </div>`;

  if (e.repasosPendientes) {
    html += `<p style="margin-top:14px"><span class="contador-repaso">↻ ${e.repasosPendientes} para repasar hoy</span></p>`;
  }

  html += `<p class="eyebrow">Dominio por módulo</p>
    <div class="dominio">
      ${e.dominio
        .map(
          (d) => `<div class="dominio-celda" data-nivel="${d.completado ? 'completo' : d.progreso > 0 ? 'parcial' : ''}" title="${escapar(d.nombre)}">${d.n}</div>`
        )
        .join('')}
    </div>
    <p class="ruta-desc" style="margin-top:8px">Verde: completado · Cian: empezado · Gris: pendiente</p>`;

  html += `<p class="eyebrow">Logros · ${e.logros}/${e.totalLogros}</p>
    <div class="logros">
      ${LOGROS.map(
        (l) => `<div class="logro" ${store.estado.logros.includes(l.id) ? '' : 'data-bloqueado'}>
          <div class="logro-icono">${escapar(l.icono)}</div>
          <b class="logro-nombre">${escapar(l.nombre)}</b>
          <span class="logro-desc">${escapar(l.desc)}</span>
        </div>`
      ).join('')}
    </div>`;

  const disponibles = store.temasDisponibles;
  html += `<p class="eyebrow">Tema de la terminal</p><div class="temas">
    ${TEMAS.map((t) => {
      const abierto = disponibles.some((d) => d.id === t.id);
      return `<button class="tema" data-tema="${escapar(t.id)}" ${store.estado.tema === t.id ? 'data-elegido' : ''} ${abierto ? '' : 'data-bloqueado disabled'}>
        <span class="tema-muestra" style="background:${t.colores.fondo};box-shadow:inset 0 0 0 2px ${t.colores.acento}"></span>
        <span>
          <span class="tema-nombre">${escapar(t.nombre)}</span>
          <span class="tema-desc">${abierto ? escapar(t.desc) : `Se desbloquea con ${t.requiere} módulos`}</span>
        </span>
        <span class="modulo-flecha">${store.estado.tema === t.id ? '✓' : abierto ? '' : '🔒'}</span>
      </button>`;
    }).join('')}
  </div>`;

  html += `<p class="eyebrow">Tu progreso</p>
    <div class="tarjeta">
      <h3>Guardado en este dispositivo</h3>
      <p>Todo tu avance vive solo en este teléfono. Expórtalo si vas a cambiar de móvil o a borrar los datos de Safari.</p>
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn-fantasma" data-exportar style="flex:1">Exportar</button>
      <button class="btn-fantasma" data-importar style="flex:1">Importar</button>
    </div>
    <button class="btn-fantasma" data-reiniciar style="width:100%;margin-top:8px;color:var(--rojo);border-color:rgba(255,92,92,.3)">Borrar todo mi progreso</button>
    <input type="file" id="archivo-importar" accept="application/json,.json" class="sr-only">`;

  cont.innerHTML = html;

  cont.querySelectorAll('[data-tema]').forEach((b) => {
    b.addEventListener('click', () => {
      store.elegirTema(b.dataset.tema);
      aplicarTema();
      pintarPerfil();
      brindis('🎨 Tema aplicado');
    });
  });

  cont.querySelector('[data-exportar]').addEventListener('click', () => {
    const blob = new Blob([store.exportar()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mentor-linux-progreso.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    brindis('Progreso exportado');
  });

  const archivo = cont.querySelector('#archivo-importar');
  cont.querySelector('[data-importar]').addEventListener('click', () => archivo.click());
  archivo.addEventListener('change', async () => {
    const f = archivo.files[0];
    if (!f) return;
    try {
      store.importar(await f.text());
      aplicarTema();
      pintarPerfil();
      actualizarCabecera();
      brindis('Progreso importado');
    } catch (err) {
      brindis('No se pudo leer ese archivo');
    }
  });

  cont.querySelector('[data-reiniciar]').addEventListener('click', () => {
    celebrar({
      marca: '⚠️',
      titulo: '¿Borrar todo?',
      texto: 'Se perderán tu XP, tus retos resueltos y tus logros. Esto no se puede deshacer.',
      botones: [
        { texto: 'Sí, borrar todo', accion: () => { store.reiniciar(); aplicarTema(); ir('inicio'); brindis('Progreso borrado'); } },
        { texto: 'Cancelar', principal: false, accion: () => {} },
      ],
    });
  });
}

// ==========================================================================
// Arranque
// ==========================================================================

$$('.pestana').forEach((p) => {
  p.addEventListener('click', () => ir(p.dataset.pestana));
});

aplicarTema();
store.registrarActividad();
ir('inicio');

// Registro del service worker: sin él la app no funcionaría sin conexión.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Sin service worker la app sigue funcionando, solo que necesita red.
    });
  });
}

// Se guarda el contador de comandos al salir, que no se vuelca en cada tecla.
window.addEventListener('pagehide', () => store.guardar());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') store.guardar();
});

// Para las pruebas automáticas.
window.__mentor = { store, ir, MODULOS, TOTAL_RETOS };
