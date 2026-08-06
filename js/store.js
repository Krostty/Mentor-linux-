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

const CLAVE = 'mentor-linux/progreso';
const VERSION = 3;
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
    creado: hoy(),
    avisoSafariVisto: false,
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
    if ((h.ejercicios || []).length < 3) return 3;
    if ((h.fechas || []).length < 2) return 4;
    if (h.sinPista < 7 || (h.fechas || []).length < 3) return 5;
    return 6;
  }

  registrarIntento(ejercicio, { correcto, usoPista = false, contexto = '' } = {}) {
    const fecha = hoy();
    const intento = this.estado.intentosEjercicio[ejercicio.id] || { intentos: 0, errores: 0, aciertos: 0, ultima: null };
    intento.intentos++;
    intento.ultima = new Date().toISOString();
    if (correcto) intento.aciertos++;
    else intento.errores++;
    this.estado.intentosEjercicio[ejercicio.id] = intento;

    for (const id of ejercicio.habilidades || []) {
      const h = this.estado.habilidades[id] || { intentos: 0, aciertos: 0, sinPista: 0, fallos: 0, ejercicios: [], fechas: [], contextos: [], proxima: fecha, intervalo: 0 };
      h.intentos++;
      if (correcto) {
        h.aciertos++;
        if (!h.ejercicios.includes(ejercicio.id)) h.ejercicios.push(ejercicio.id);
        if (contexto && !h.contextos.includes(contexto)) h.contextos.push(contexto);
        if (!usoPista) {
          h.sinPista++;
          if (!h.fechas.includes(fecha)) h.fechas.push(fecha);
        }
        const intervalos = [1, 1, 3, 7, 14, 30];
        h.intervalo = usoPista ? 1 : intervalos[Math.min(h.fechas.length, intervalos.length - 1)];
        h.proxima = this.fechaEnDias(h.intervalo);
      } else {
        h.fallos++;
        h.intervalo = 0;
        h.proxima = fecha;
      }
      this.estado.habilidades[id] = h;
      h.nivel = this.nivelHabilidad(id);
    }
    this.programarGuardado();
    return (ejercicio.habilidades || []).map((id) => ({ id, nivel: this.nivelHabilidad(id) }));
  }

  completarEjercicio(ejercicio, { usoPista = false } = {}) {
    const habilidades = this.registrarIntento(ejercicio, { correcto: true, usoPista, contexto: ejercicio.salaId || '' });
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
      this.estado.repaso[ejercicio.id] = { fecha: this.fechaEnDias(2), veces: 0 };
    } else {
      this.estado.combo++;
      this.estado.mejorCombo = Math.max(this.estado.mejorCombo, this.estado.combo);
      delete this.estado.repaso[ejercicio.id];
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

  salaDesbloqueada(salaId) {
    const ruta = RUTAS.find((r) => r.salas.includes(salaId));
    if (!ruta) return true;
    const i = ruta.salas.indexOf(salaId);
    return i <= 0 || this.salaCompletada(ruta.salas[i - 1]);
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

  estadoMaquina(id) {
    if (!this.estado.maquinas[id]) this.estado.maquinas[id] = { fases: [], userFlag: false, rootFlag: false, completada: false };
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

  registrarFlag(maquina, tipo) {
    const estado = this.estadoMaquina(maquina.id);
    const clave = tipo === 'root' ? 'rootFlag' : 'userFlag';
    if (estado[clave]) return false;
    estado[clave] = true;
    if (tipo === 'root') this.estado.flagsRoot++;
    else this.estado.flagsUser++;
    this.estado.xp += tipo === 'root' ? 120 : 70;
    if (estado.userFlag && estado.rootFlag && maquina.fases.every((f) => estado.fases.includes(f.id))) {
      estado.completada = true;
      if (!this.estado.maquinasCompletadas.includes(maquina.id)) {
        this.estado.maquinasCompletadas.push(maquina.id);
        this.estado.xp += maquina.xp || 300;
      }
    }
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
    const fecha = hoy();
    const antiguos = Object.entries(this.estado.repaso).filter(([, r]) => r.fecha <= fecha).map(([id]) => id);
    const habilidades = Object.entries(this.estado.habilidades).filter(([, h]) => h.proxima <= fecha).map(([id]) => id);
    const porHabilidad = TODOS_EJERCICIOS.filter((e) => this.ejercicioHecho(e.id) && e.habilidades?.some((id) => habilidades.includes(id))).map((e) => e.id);
    return [...new Set([...antiguos, ...porHabilidad])];
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
      dominio: SALAS.map((s) => ({ id: s.id, nombre: s.nombre, progreso: this.progresoSala(s.id), completado: this.salaCompletada(s.id) })),
    };
  }
}

export const store = new Store();
