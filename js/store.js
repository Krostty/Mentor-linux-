// Persistencia v2: currículo, máquinas, Wargame, racha, XP y migración v1.
// Todo continúa siendo local y offline. Safari y una PWA instalada pueden usar
// almacenes aislados, por eso exportar/importar es una operación de primer nivel.

import {
  SALAS, SALA_POR_ID, BLOQUES, RUTAS, ACADEMIAS, RUTA_POR_ID,
  TODOS_EJERCICIOS, TOTAL_EJERCICIOS,
} from './data/salas.js';
import { MAQUINAS } from './data/maquinas.js';
import { WARGAME } from './data/wargame.js';
import { LOGROS, nivelDe, TEMAS } from './data/logros.js';
import {
  CAPACIDADES, CAPACIDAD_POR_ID, requisitosDeRuta, evaluarCapacidad,
} from './data/prerrequisitos.js';
import {
  AUTONOMIA_POR_ID, proximaRevision, revisionVencida,
} from './data/pedagogia.js';

const CLAVE = 'mentor-linux/progreso';
const VERSION = 4;
const DEBOUNCE_MS = 250;

export function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function diasEntre(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function estadoInicial() {
  return {
    version: VERSION,
    xp: 0,
    ejerciciosCompletados: [],
    ejerciciosConPista: [],
    tareasCompletadas: [],
    salasCompletadas: [],
    maquinas: {},
    maquinasCompletadas: [],
    flagsUser: 0,
    flagsRoot: 0,
    wargameCompletados: [],
    wargameDesbloqueados: [0],
    misionesCompletadas: [],
    logros: [],
    tema: 'fosforo',
    racha: 0,
    mejorRacha: 0,
    ultimoDia: null,
    combo: 0,
    mejorCombo: 0,
    comandosEjecutados: 0,
    busquedasChuletario: 0,
    dominioComandos: {},
    habilidades: {},
    intentosEjercicio: {},
    repaso: {},
    evidenciasPaso: {},
    creado: hoy(),
    avisoSafariVisto: false,
    // Ajustes del dispositivo. Van en el progreso para que sobrevivan a la
    // reinstalación igual que todo lo demás.
    sonidos: true,
    vibracion: true,
    // Campos legados conservados para importaciones y logros v1.
    retosCompletados: [],
    retosConPista: [],
    leccionesVistas: [],
    modulosCompletados: [],
    examenesAprobados: {},
    examenesPerfectos: 0,
    incidentesResueltos: [],
    incidenteRapido: false,
  };
}

function arraysSeguros(estado) {
  const base = estadoInicial();
  for (const [clave, valor] of Object.entries(base)) {
    if (Array.isArray(valor) && !Array.isArray(estado[clave])) estado[clave] = [];
  }
  if (!estado.maquinas || typeof estado.maquinas !== 'object') estado.maquinas = {};
  if (!estado.dominioComandos || typeof estado.dominioComandos !== 'object') estado.dominioComandos = {};
  if (!estado.habilidades || typeof estado.habilidades !== 'object') estado.habilidades = {};
  if (!estado.intentosEjercicio || typeof estado.intentosEjercicio !== 'object') estado.intentosEjercicio = {};
  if (!estado.repaso || typeof estado.repaso !== 'object') estado.repaso = {};
  if (!estado.evidenciasPaso || typeof estado.evidenciasPaso !== 'object') estado.evidenciasPaso = {};
  return estado;
}

function migrar(datos) {
  const limpio = arraysSeguros({ ...estadoInicial(), ...datos, version: VERSION });
  if ((datos.version || 1) < 2) {
    limpio.ejerciciosCompletados = [...new Set([...(datos.retosCompletados || [])])];
    limpio.ejerciciosConPista = [...new Set([...(datos.retosConPista || [])])];
    limpio.salasCompletadas = [...new Set([...(datos.modulosCompletados || [])])];
    limpio.tareasCompletadas = [...new Set((datos.leccionesVistas || []).map((clave) => {
      const [sala, leccion] = String(clave).split('/');
      return `${sala}-${leccion}-teoria`;
    }))];
  }
  limpio.retosCompletados = [...new Set([...limpio.retosCompletados, ...limpio.ejerciciosCompletados])];
  limpio.retosConPista = [...new Set([...limpio.retosConPista, ...limpio.ejerciciosConPista])];
  limpio.modulosCompletados = [...new Set([...limpio.modulosCompletados, ...limpio.salasCompletadas.filter((id) => SALA_POR_ID[id]?.origen === 'v1-ampliado')])];
  return limpio;
}

function cargar() {
  try {
    const bruto = localStorage.getItem(CLAVE);
    if (!bruto) return estadoInicial();
    return migrar(JSON.parse(bruto));
  } catch {
    return estadoInicial();
  }
}

export class Store {
  constructor(datos = null) {
    this.estado = datos ? migrar(datos) : cargar();
    this.oyentes = new Set();
    this.temporizador = null;
    this.storageOk = true;
  }

  get xp() { return this.estado.xp; }
  get nivel() { return nivelDe(this.estado.xp); }

  suscribir(fn) {
    this.oyentes.add(fn);
    return () => this.oyentes.delete(fn);
  }

  notificar() {
    for (const fn of this.oyentes) fn(this.estado);
  }

  guardar() {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = null;
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.estado));
      this.storageOk = true;
    } catch {
      this.storageOk = false;
    }
    this.notificar();
  }

  programarGuardado() {
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.guardar(), DEBOUNCE_MS);
  }

  flush() { this.guardar(); }

  registrarActividad() {
    const fecha = hoy();
    if (this.estado.ultimoDia === fecha) return;
    if (!this.estado.ultimoDia) this.estado.racha = 1;
    else this.estado.racha = diasEntre(this.estado.ultimoDia, fecha) === 1 ? this.estado.racha + 1 : 1;
    this.estado.ultimoDia = fecha;
    this.estado.mejorRacha = Math.max(this.estado.mejorRacha, this.estado.racha);
  }

  contarComando(nombre = '') {
    this.estado.comandosEjecutados++;
    if (nombre) this.estado.dominioComandos[nombre] = (this.estado.dominioComandos[nombre] || 0) + 1;
    this.registrarActividad();
    this.programarGuardado();
  }

  contarBusqueda() {
    this.estado.busquedasChuletario++;
    this.programarGuardado();
  }

  ejercicioHecho(id) { return this.estado.ejerciciosCompletados.includes(id); }
  tareaHecha(id) { return this.estado.tareasCompletadas.includes(id); }
  salaCompletada(id) { return this.estado.salasCompletadas.includes(id); }

  multiplicador() {
    if (this.estado.combo >= 15) return 3;
    if (this.estado.combo >= 8) return 2;
    if (this.estado.combo >= 4) return 1.5;
    return 1;
  }

  nivelHabilidad(id) {
    const h = this.estado.habilidades[id];
    if (!h?.aciertos) return 0;
    if (!h.sinPista) return 1;
    if (h.sinPista === 1) return 2;
    if (h.sinPista < 3) return 3;
    if ((h.ejercicios || []).length < 3 || (h.contextos || []).length < 2) return 3;
    if ((h.fechas || []).length < 2 || (h.recuperaciones || 0) < 1) return 4;
    if (h.sinPista < 7 || (h.fechas || []).length < 3 || (h.contextos || []).length < 3 || (h.recuperaciones || 0) < 2) return 5;
    return 6;
  }

  registrarIntento(ejercicio, { correcto, usoPista = false, contexto = '', confianza = 0, esRepaso = false } = {}) {
    const fecha = hoy();
    const ahora = new Date();
    const intento = this.estado.intentosEjercicio[ejercicio.id] || { intentos: 0, errores: 0, aciertos: 0, ultima: null, confianzas: [] };
    intento.intentos++;
    intento.ultima = ahora.toISOString();
    if (confianza) intento.confianzas = [...(intento.confianzas || []), { valor: confianza, correcto, fecha: intento.ultima }].slice(-20);
    if (correcto) intento.aciertos++;
    else intento.errores++;
    this.estado.intentosEjercicio[ejercicio.id] = intento;

    for (const id of ejercicio.habilidades || []) {
      const h = this.estado.habilidades[id] || { intentos: 0, aciertos: 0, sinPista: 0, fallos: 0, ejercicios: [], fechas: [], contextos: [], proxima: null, etapa: 0, recuperaciones: 0 };
      const recuperacionDemorada = h.aciertos > 0 && (esRepaso || revisionVencida(h.proxima, ahora));
      h.intentos++;
      if (correcto) {
        h.aciertos++;
        if (!h.ejercicios.includes(ejercicio.id)) h.ejercicios.push(ejercicio.id);
        if (contexto && !h.contextos.includes(contexto)) h.contextos.push(contexto);
        if (!usoPista) {
          h.sinPista++;
          if (!h.fechas.includes(fecha)) h.fechas.push(fecha);
          if (recuperacionDemorada) h.recuperaciones = (h.recuperaciones || 0) + 1;
        }
        h.etapa = usoPista ? 0 : Math.min((h.etapa || 0) + Number(recuperacionDemorada), 4);
        h.proxima = proximaRevision(h.etapa, ahora);
      } else {
        h.fallos++;
        h.etapa = 0;
        h.proxima = ahora.toISOString();
      }
      this.estado.habilidades[id] = h;
      h.nivel = this.nivelHabilidad(id);
    }
    if (!correcto) {
      this.estado.repaso[ejercicio.id] = {
        proxima: ahora.toISOString(), etapa: 0,
        veces: this.estado.repaso[ejercicio.id]?.veces || 0, motivo: 'error',
      };
    }
    this.programarGuardado();
    return (ejercicio.habilidades || []).map((id) => ({ id, nivel: this.nivelHabilidad(id) }));
  }

  completarEjercicio(ejercicio, { usoPista = false, esRepaso = false, confianza = 0 } = {}) {
    const habilidades = this.registrarIntento(ejercicio, {
      correcto: true, usoPista, contexto: ejercicio.salaId || ejercicio.tareaId || '', confianza, esRepaso,
    });
    const anterior = this.estado.repaso[ejercicio.id] || { etapa: 0, veces: 0 };
    const etapa = usoPista ? 0 : esRepaso ? Math.min((anterior.etapa || 0) + 1, 4) : 0;
    this.estado.repaso[ejercicio.id] = {
      proxima: proximaRevision(etapa), etapa,
      veces: (anterior.veces || 0) + Number(esRepaso),
      motivo: usoPista ? 'pista' : esRepaso ? 'recuperacion' : 'consolidacion',
    };
    if (this.ejercicioHecho(ejercicio.id)) {
      this.guardar();
      return { ganado: 0, nuevosLogros: [], repaso: true, habilidades };
    }
    this.estado.ejerciciosCompletados.push(ejercicio.id);
    if (String(ejercicio.id).startsWith('r')) this.estado.retosCompletados.push(ejercicio.id);
    if (usoPista) {
      this.estado.combo = 0;
      this.estado.ejerciciosConPista.push(ejercicio.id);
      if (String(ejercicio.id).startsWith('r')) this.estado.retosConPista.push(ejercicio.id);
    } else {
      this.estado.combo++;
      this.estado.mejorCombo = Math.max(this.estado.mejorCombo, this.estado.combo);
    }
    const ganado = Math.round((ejercicio.xp || 15) * this.multiplicador());
    this.estado.xp += ganado;
    this.registrarActividad();
    this.revisarJerarquia();
    const nuevosLogros = this.revisarLogros();
    this.guardar();
    return { ganado, nuevosLogros, repaso: false, habilidades };
  }

  fechaEnDias(dias) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  }

  revisarJerarquia() {
    for (const sala of SALAS) {
      for (const tarea of sala.tareas) {
        const completa = tarea.practica.length > 0 && tarea.practica.every((e) => this.ejercicioHecho(e.id));
        if (completa && !this.estado.tareasCompletadas.includes(tarea.id)) this.estado.tareasCompletadas.push(tarea.id);
      }
      const completa = sala.tareas.every((t) => this.tareaHecha(t.id));
      if (completa && !this.estado.salasCompletadas.includes(sala.id)) {
        this.estado.salasCompletadas.push(sala.id);
        if (sala.origen === 'v1-ampliado') this.estado.modulosCompletados.push(sala.id);
      }
    }
  }

  progresoTarea(tarea) {
    if (!tarea.practica.length) return this.tareaHecha(tarea.id) ? 1 : 0;
    return tarea.practica.filter((e) => this.ejercicioHecho(e.id)).length / tarea.practica.length;
  }

  progresoSala(salaId) {
    const sala = SALA_POR_ID[salaId];
    if (!sala) return 0;
    const total = sala.tareas.reduce((n, t) => n + t.practica.length, 0);
    const hechos = sala.tareas.reduce((n, t) => n + t.practica.filter((e) => this.ejercicioHecho(e.id)).length, 0);
    return total ? hechos / total : 0;
  }

  // Todas las salas de una academia forman una única secuencia. Antes se
  // abría la primera de cada tramo, y el camino parecía roto: salas 1, 3 y 6
  // abiertas con la 2 bloqueada en medio. Cada academia empieza abierta; una
  // vez dentro, se avanza en orden.
  salasDeAcademia(salaId) {
    const academia = ACADEMIAS.find((a) =>
      a.rutas.some((rutaId) => (RUTA_POR_ID[rutaId]?.salas || []).includes(salaId)));
    if (!academia) return null;
    return academia.rutas.flatMap((rutaId) => RUTA_POR_ID[rutaId]?.salas || []);
  }

  // Dentro de una sala las lecciones se abren en orden. Una lección ya
  // empezada nunca se vuelve a cerrar, aunque el progreso venga de una
  // versión anterior donde el orden no importaba.
  tareaDesbloqueada(tareaId) {
    const sala = SALAS.find((s) => s.tareas.some((t) => t.id === tareaId));
    if (!sala) return true;
    const i = sala.tareas.findIndex((t) => t.id === tareaId);
    if (i <= 0) return true;
    if (this.tareaHecha(sala.tareas[i - 1].id)) return true;
    return sala.tareas[i].practica.some((e) => this.ejercicioHecho(e.id));
  }

  salaDesbloqueada(salaId) {
    const secuencia = this.salasDeAcademia(salaId);
    if (!secuencia) return true;
    const i = secuencia.indexOf(salaId);
    return i <= 0 || this.salaCompletada(secuencia[i - 1]);
  }

  // La sala por la que toca seguir: la primera abierta y sin terminar de la
  // academia en la que estés más avanzado.
  salaActual() {
    for (const academia of ACADEMIAS) {
      const salas = academia.rutas.flatMap((rutaId) => RUTA_POR_ID[rutaId]?.salas || []);
      for (const salaId of salas) {
        if (!this.salaDesbloqueada(salaId)) break;
        if (!this.salaCompletada(salaId)) return salaId;
      }
    }
    return null;
  }

  siguientePaso() {
    for (const academia of ACADEMIAS) {
      for (const rutaId of academia.rutas) {
        const ruta = RUTA_POR_ID[rutaId];
        for (const salaId of ruta.salas) {
          if (!this.salaDesbloqueada(salaId)) break;
          const sala = SALA_POR_ID[salaId];
          for (const tarea of sala.tareas) {
            const ejercicio = tarea.practica.find((e) => !this.ejercicioHecho(e.id));
            if (ejercicio) return { academia, ruta, sala, tarea, ejercicio };
          }
        }
      }
    }
    return null;
  }

  progresoBloque(bloque) {
    const salas = bloque.salas.map((id) => SALA_POR_ID[id]).filter(Boolean);
    return salas.length ? salas.reduce((n, s) => n + this.progresoSala(s.id), 0) / salas.length : 0;
  }

  progresoRuta(ruta) {
    const salas = ruta.salas.map((id) => SALA_POR_ID[id]).filter(Boolean);
    return salas.length ? salas.reduce((n, s) => n + this.progresoSala(s.id), 0) / salas.length : 0;
  }

  progresoAcademia(academia) {
    const rutas = academia.rutas.map((id) => RUTA_POR_ID[id]).filter(Boolean);
    return rutas.length ? rutas.reduce((n, r) => n + this.progresoRuta(r), 0) / rutas.length : 0;
  }

  evidenciaPaso(tareaId, pasoId) {
    return this.estado.evidenciasPaso[`${tareaId}/${pasoId}`] || null;
  }

  guardarEvidenciaPaso(tareaId, pasoId, datos = {}) {
    const clave = `${tareaId}/${pasoId}`;
    this.estado.evidenciasPaso[clave] = { ...datos, fecha: new Date().toISOString() };
    this.registrarActividad();
    this.guardar();
    return this.estado.evidenciasPaso[clave];
  }

  calibracionMetacognitiva() {
    const muestras = Object.values(this.estado.evidenciasPaso).filter((item) =>
      [1, 2, 3].includes(Number(item.confianza)) && typeof item.correcto === 'boolean');
    if (!muestras.length) return { muestras: 0, precision: 0, error: 0, etiqueta: 'Sin datos todavía' };
    const aciertos = muestras.filter((item) => item.correcto).length;
    const error = muestras.reduce((total, item) =>
      total + Math.abs(Number(item.confianza) / 3 - Number(item.correcto)), 0) / muestras.length;
    return {
      muestras: muestras.length,
      precision: aciertos / muestras.length,
      error,
      etiqueta: error <= 0.2 ? 'Bien calibrada' : error <= 0.4 ? 'En ajuste' : 'Conviene contrastar más',
    };
  }

  detalleCapacidad(id) {
    return evaluarCapacidad(id, (habilidadId) => this.nivelHabilidad(habilidadId));
  }

  nivelCapacidad(id) {
    return this.detalleCapacidad(id)?.nivel || 0;
  }

  // Los prerrequisitos son una radiografía, no un candado. Una persona con
  // experiencia previa puede entrar igualmente y Mentor señalará qué base le
  // conviene reforzar según evidencia real de ejercicios y rutas.
  estadoPrerequisitosRuta(rutaId) {
    const ruta = RUTA_POR_ID[rutaId];
    if (!ruta) return { rutaId, listo: true, avance: 1, requisitos: [], faltantes: [] };
    const requisitos = requisitosDeRuta(rutaId).map((requisito) => {
      if (requisito.tipo === 'ruta') {
        const requerida = RUTA_POR_ID[requisito.id];
        const actual = requerida ? this.progresoRuta(requerida) : 0;
        return {
          ...requisito,
          nombre: requerida?.nombre || requisito.id,
          actual,
          objetivo: requisito.avance,
          cumple: actual >= requisito.avance,
          avance: Math.min(1, actual / requisito.avance),
          rutaReferencia: requisito.id,
        };
      }
      const capacidad = CAPACIDAD_POR_ID[requisito.id];
      const detalle = this.detalleCapacidad(requisito.id);
      const actual = detalle?.nivel || 0;
      return {
        ...requisito,
        nombre: capacidad?.nombre || requisito.id,
        actual,
        objetivo: requisito.nivel,
        cumple: actual >= requisito.nivel,
        avance: requisito.nivel ? Math.min(1, actual / requisito.nivel) : 1,
        rutaReferencia: capacidad?.rutaReferencia || '',
      };
    });
    const faltantes = requisitos.filter((requisito) => !requisito.cumple);
    return {
      rutaId,
      listo: faltantes.length === 0,
      avance: requisitos.length ? requisitos.reduce((total, requisito) => total + requisito.avance, 0) / requisitos.length : 1,
      requisitos,
      faltantes,
    };
  }

  estadoMaquina(id) {
    const base = {
      fases: [], userFlag: false, rootFlag: false, completada: false,
      autonomia: 'guiada', roeAceptadas: false, evidencias: [], reporte: null,
    };
    this.estado.maquinas[id] = { ...base, ...(this.estado.maquinas[id] || {}) };
    return this.estado.maquinas[id];
  }

  faseMaquinaHecha(id, faseId) { return this.estadoMaquina(id).fases.includes(faseId); }

  completarFaseMaquina(maquina, fase) {
    const estado = this.estadoMaquina(maquina.id);
    if (!estado.fases.includes(fase.id)) {
      estado.fases.push(fase.id);
      this.estado.xp += 40;
      this.registrarActividad();
      this.guardar();
    }
    return estado;
  }

  cambiarAutonomiaMaquina(id, autonomia) {
    if (!AUTONOMIA_POR_ID[autonomia]) return false;
    const estado = this.estadoMaquina(id);
    estado.autonomia = autonomia;
    if (autonomia !== 'red-team') estado.roeAceptadas = false;
    this.guardar();
    return true;
  }

  aceptarRoeMaquina(id, aceptadas = true) {
    this.estadoMaquina(id).roeAceptadas = !!aceptadas;
    this.guardar();
  }

  registrarEvidenciaMaquina(id, faseId, evidencia) {
    const estado = this.estadoMaquina(id);
    const texto = String(evidencia || '').trim();
    if (!texto) return false;
    estado.evidencias = [...(estado.evidencias || []).filter((item) => item.faseId !== faseId), {
      faseId, texto, fecha: new Date().toISOString(),
    }];
    this.guardar();
    return true;
  }

  guardarReporteMaquina(maquina, reporte) {
    const campos = ['observacion', 'evidencia', 'impacto', 'remediacion'];
    if (!campos.every((campo) => String(reporte?.[campo] || '').trim().length >= 12)) return false;
    const estado = this.estadoMaquina(maquina.id);
    estado.reporte = { ...reporte, fecha: new Date().toISOString() };
    this.finalizarMaquinaSiLista(maquina);
    this.guardar();
    return true;
  }

  finalizarMaquinaSiLista(maquina) {
    const estado = this.estadoMaquina(maquina.id);
    const nivel = AUTONOMIA_POR_ID[estado.autonomia] || AUTONOMIA_POR_ID.guiada;
    const lista = estado.userFlag && estado.rootFlag
      && maquina.fases.every((fase) => estado.fases.includes(fase.id))
      && !!estado.reporte && (!nivel.requiereRoe || estado.roeAceptadas);
    if (!lista || estado.completada) return false;
    estado.completada = true;
    if (!this.estado.maquinasCompletadas.includes(maquina.id)) {
      this.estado.maquinasCompletadas.push(maquina.id);
      this.estado.xp += maquina.xp || 300;
    }
    this.revisarLogros();
    return true;
  }

  registrarFlag(maquina, tipo) {
    const estado = this.estadoMaquina(maquina.id);
    const clave = tipo === 'root' ? 'rootFlag' : 'userFlag';
    if (estado[clave]) return false;
    estado[clave] = true;
    if (tipo === 'root') this.estado.flagsRoot++;
    else this.estado.flagsUser++;
    this.estado.xp += tipo === 'root' ? 120 : 70;
    this.finalizarMaquinaSiLista(maquina);
    this.revisarLogros();
    this.guardar();
    return true;
  }

  nivelWargameDesbloqueado(n) { return this.estado.wargameDesbloqueados.includes(n); }

  completarNivelWargame(nivel) {
    if (this.estado.wargameCompletados.includes(nivel.n)) return false;
    this.estado.wargameCompletados.push(nivel.n);
    if (nivel.n + 1 < WARGAME.length && !this.estado.wargameDesbloqueados.includes(nivel.n + 1)) this.estado.wargameDesbloqueados.push(nivel.n + 1);
    this.estado.xp += nivel.xp || 60;
    this.registrarActividad();
    this.revisarLogros();
    this.guardar();
    return true;
  }

  misionHecha(id) { return this.estado.misionesCompletadas.includes(id); }

  completarMision(mision) {
    if (this.misionHecha(mision.id)) return 0;
    this.estado.misionesCompletadas.push(mision.id);
    const ganado = mision.xp || 40;
    this.estado.xp += ganado;
    this.registrarActividad();
    this.revisarLogros();
    this.guardar();
    return ganado;
  }

  // Interruptores de Perfil. `!== false` para que un progreso antiguo, que no
  // tenía estos campos, arranque con ambos encendidos.
  get sonidosActivos() { return this.estado.sonidos !== false; }
  get vibracionActiva() { return this.estado.vibracion !== false; }

  alternarAjuste(nombre) {
    const clave = nombre === 'sonidos' ? 'sonidos' : 'vibracion';
    this.estado[clave] = this.estado[clave] === false;
    this.guardar();
    return this.estado[clave];
  }

  elegirTema(id) {
    if (!this.temasDisponibles.some((t) => t.id === id)) return false;
    this.estado.tema = id;
    this.guardar();
    return true;
  }

  get temasDisponibles() {
    return TEMAS.filter((t) => this.estado.salasCompletadas.length >= t.requiere);
  }

  temaActual() { return TEMAS.find((t) => t.id === this.estado.tema) || TEMAS[0]; }

  resumenParaLogros() {
    const bloquesCompletados = BLOQUES.filter((b) => b.salas.every((id) => this.salaCompletada(id))).map((b) => b.id);
    const modulosSinPistas = this.estado.salasCompletadas.filter((id) => {
      const sala = SALA_POR_ID[id];
      return sala && !sala.tareas.some((t) => t.practica.some((e) => this.estado.ejerciciosConPista.includes(e.id)));
    });
    return {
      ...this.estado,
      rutasCompletadas: bloquesCompletados,
      bloquesCompletados,
      modulosSinPistas,
    };
  }

  revisarLogros() {
    const resumen = this.resumenParaLogros();
    const nuevos = [];
    for (const logro of LOGROS) {
      if (!this.estado.logros.includes(logro.id) && logro.check(resumen)) {
        this.estado.logros.push(logro.id);
        nuevos.push(logro);
      }
    }
    return nuevos;
  }

  retosParaRepasar() {
    const ahora = new Date();
    const antiguos = Object.entries(this.estado.repaso)
      .filter(([, r]) => revisionVencida(r.proxima || r.fecha, ahora)).map(([id]) => id);
    const habilidades = Object.entries(this.estado.habilidades)
      .filter(([, h]) => revisionVencida(h.proxima, ahora)).map(([id]) => id);
    const porHabilidad = TODOS_EJERCICIOS.filter((e) => this.ejercicioHecho(e.id) && e.habilidades?.some((id) => habilidades.includes(id))).map((e) => e.id);
    return [...new Set([...antiguos, ...porHabilidad])];
  }

  // Las habilidades que peor llevas, ordenadas por cuánto te cuestan.
  // El dato ya existía dentro del modelo de maestría pero no se veía en
  // ninguna pantalla, y es la información más útil que guarda la app.
  puntosDebiles(limite = 6) {
    const debiles = [];
    for (const [id, h] of Object.entries(this.estado.habilidades)) {
      if (!h.intentos) continue;
      const nivel = this.nivelHabilidad(id);
      const tasaFallo = h.fallos / h.intentos;
      // Cuesta más lo que fallas mucho y lo que sigue en nivel bajo pese a
      // haberlo intentado varias veces.
      const dificultad = tasaFallo * 2 + (6 - nivel) / 6 + (h.intentos > 3 && nivel < 3 ? 0.5 : 0);
      if (h.fallos === 0 && nivel >= 4) continue;
      debiles.push({ id, nivel, fallos: h.fallos, intentos: h.intentos, aciertos: h.aciertos, sinPista: h.sinPista || 0, dificultad });
    }
    return debiles.sort((a, b) => b.dificultad - a.dificultad).slice(0, limite);
  }

  // Un ejercicio con el que entrenar una habilidad concreta: se prefiere uno
  // que ya hayas fallado, y si no, cualquiera que la practique.
  ejercicioParaHabilidad(habilidadId) {
    const candidatos = TODOS_EJERCICIOS.filter((e) => (e.habilidades || []).includes(habilidadId));
    if (!candidatos.length) return null;
    const fallado = candidatos.find((e) => (this.estado.intentosEjercicio[e.id]?.errores || 0) > 0);
    return fallado || candidatos.find((e) => !this.ejercicioHecho(e.id)) || candidatos[0];
  }

  ejerciciosParaRepasar(limite = 6) {
    const ids = new Set(this.retosParaRepasar());
    return TODOS_EJERCICIOS.filter((e) => ids.has(e.id)).sort((a, b) => {
      const ai = this.estado.intentosEjercicio[a.id]?.ultima || '';
      const bi = this.estado.intentosEjercicio[b.id]?.ultima || '';
      return ai.localeCompare(bi);
    }).slice(0, limite);
  }

  marcarAvisoSafari() {
    this.estado.avisoSafariVisto = true;
    this.guardar();
  }

  exportar() {
    return JSON.stringify({ app: 'mentor-linux', version: VERSION, exportado: new Date().toISOString(), datos: this.estado }, null, 2);
  }

  importar(texto) {
    const bruto = JSON.parse(texto);
    const datos = bruto?.app === 'mentor-linux' ? bruto.datos : bruto;
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) throw new Error('El archivo no contiene un progreso válido de Mentor Linux.');
    this.estado = migrar(datos);
    this.revisarJerarquia();
    this.guardar();
  }

  reiniciar() {
    this.estado = estadoInicial();
    this.guardar();
  }

  estadisticas() {
    const niveles = Object.fromEntries(Object.keys(this.estado.habilidades).map((id) => [id, this.nivelHabilidad(id)]));
    const capacidades = CAPACIDADES.map((capacidad) => this.detalleCapacidad(capacidad.id));
    return {
      xp: this.estado.xp,
      nivel: this.nivel,
      racha: this.estado.racha,
      mejorRacha: this.estado.mejorRacha,
      ejercicios: this.estado.ejerciciosCompletados.length,
      totalEjercicios: TOTAL_EJERCICIOS,
      tareas: this.estado.tareasCompletadas.length,
      salas: this.estado.salasCompletadas.length,
      totalSalas: SALAS.length,
      maquinas: this.estado.maquinasCompletadas.length,
      totalMaquinas: MAQUINAS.length,
      wargame: this.estado.wargameCompletados.length,
      totalWargame: WARGAME.length,
      misiones: this.estado.misionesCompletadas.length,
      logros: this.estado.logros.length,
      totalLogros: LOGROS.length,
      comandos: this.estado.comandosEjecutados,
      mejorCombo: this.estado.mejorCombo,
      repasosPendientes: this.retosParaRepasar().length,
      habilidades: Object.keys(this.estado.habilidades).length,
      habilidadesDominadas: Object.values(niveles).filter((n) => n >= 6).length,
      nivelesHabilidad: niveles,
      capacidades: capacidades.length,
      capacidadesDominadas: capacidades.filter((capacidad) => capacidad.nivel >= 4).length,
      dominioCapacidades: capacidades,
      dominio: SALAS.map((s) => ({ id: s.id, nombre: s.nombre, progreso: this.progresoSala(s.id), completado: this.salaCompletada(s.id) })),
    };
  }
}

export const store = new Store();
