// Progreso del usuario: XP, nivel, racha, combos, logros, temas y repaso
// espaciado. Todo vive en localStorage, en un único objeto versionado.

import { MODULOS, RUTAS, TOTAL_RETOS, retosDe, pasosDe, MODULO_POR_ID } from './data/modules.js';
import { LOGROS, nivelDe, TEMAS } from './data/logros.js';

const CLAVE = 'mentor-linux/progreso';
const VERSION = 1;

// Intervalos de repaso espaciado, en días.
const REPASO_DIAS = [2, 7, 21];

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function diasEntre(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}

function estadoInicial() {
  return {
    version: VERSION,
    xp: 0,
    retosCompletados: [],      // ids
    retosConPista: [],         // ids resueltos usando pista
    leccionesVistas: [],       // "modulo/leccion"
    modulosCompletados: [],    // ids
    examenesAprobados: {},     // moduloId -> aciertos
    examenesPerfectos: 0,
    incidentesResueltos: [],   // ids
    incidenteRapido: false,
    logros: [],                // ids desbloqueados
    tema: 'fosforo',
    racha: 0,
    mejorRacha: 0,
    ultimoDia: null,
    combo: 0,
    mejorCombo: 0,
    comandosEjecutados: 0,
    busquedasChuletario: 0,
    repaso: {},                // retoId -> { fecha, veces }
    creado: hoy(),
  };
}

function cargar() {
  try {
    const bruto = localStorage.getItem(CLAVE);
    if (!bruto) return estadoInicial();
    const datos = JSON.parse(bruto);
    if (datos.version !== VERSION) return { ...estadoInicial(), ...datos, version: VERSION };
    return { ...estadoInicial(), ...datos };
  } catch {
    return estadoInicial();
  }
}

class Store {
  constructor() {
    this.estado = cargar();
    this.oyentes = new Set();
  }

  guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(this.estado));
    } catch {
      // Si no hay espacio o el almacenamiento está bloqueado, la app sigue
      // funcionando: solo se pierde el progreso al cerrar.
    }
    for (const fn of this.oyentes) fn(this.estado);
  }

  suscribir(fn) {
    this.oyentes.add(fn);
    return () => this.oyentes.delete(fn);
  }

  // --- consultas ---------------------------------------------------------

  get xp() {
    return this.estado.xp;
  }

  get nivel() {
    return nivelDe(this.estado.xp);
  }

  retoHecho(id) {
    return this.estado.retosCompletados.includes(id);
  }

  leccionVista(moduloId, leccionId) {
    return this.estado.leccionesVistas.includes(`${moduloId}/${leccionId}`);
  }

  // Un módulo está desbloqueado si es el primero de su ruta o si el anterior
  // se completó. La primera ruta empieza abierta.
  moduloDesbloqueado(moduloN) {
    if (moduloN === 1) return true;
    const anterior = MODULOS.find((m) => m.n === moduloN - 1);
    return anterior ? this.moduloCompletado(anterior.id) : true;
  }

  moduloCompletado(moduloId) {
    return this.estado.modulosCompletados.includes(moduloId);
  }

  // Progreso de un módulo entre 0 y 1, contando lecciones vistas y retos hechos.
  progresoModulo(moduloId) {
    const total = pasosDe(moduloId);
    if (!total) return 0;
    const m = MODULO_POR_ID[moduloId];
    const lecciones = m.lecciones.filter((l) => this.leccionVista(moduloId, l.id)).length;
    const retos = retosDe(moduloId).filter((r) => this.retoHecho(r.id)).length;
    return Math.min(1, (lecciones + retos) / total);
  }

  progresoRuta(rutaId) {
    const ruta = RUTAS.find((r) => r.id === rutaId);
    if (!ruta) return 0;
    const mods = MODULOS.filter((m) => ruta.modulos.includes(m.n));
    return mods.reduce((s, m) => s + this.progresoModulo(m.id), 0) / mods.length;
  }

  // Siguiente cosa que hacer: la primera lección o reto pendiente.
  siguientePaso() {
    for (const m of MODULOS) {
      if (!this.moduloDesbloqueado(m.n)) break;
      for (const l of m.lecciones) {
        if (!this.leccionVista(m.id, l.id)) return { tipo: 'leccion', modulo: m, leccion: l };
        for (const r of l.retos || []) {
          if (!this.retoHecho(r.id)) return { tipo: 'reto', modulo: m, leccion: l, reto: r };
        }
      }
      if (!this.moduloCompletado(m.id)) return { tipo: 'examen', modulo: m };
    }
    return null;
  }

  // Retos que toca repasar hoy porque en su día costaron.
  retosParaRepasar() {
    const h = hoy();
    return Object.entries(this.estado.repaso)
      .filter(([, r]) => r.fecha <= h)
      .map(([id]) => id);
  }

  get temasDisponibles() {
    const n = this.estado.modulosCompletados.length;
    return TEMAS.filter((t) => n >= t.requiere);
  }

  temaActual() {
    return TEMAS.find((t) => t.id === this.estado.tema) || TEMAS[0];
  }

  // --- acciones ----------------------------------------------------------

  registrarActividad() {
    const h = hoy();
    const ultimo = this.estado.ultimoDia;
    if (ultimo === h) return;
    if (!ultimo) this.estado.racha = 1;
    else {
      const dias = diasEntre(ultimo, h);
      this.estado.racha = dias === 1 ? this.estado.racha + 1 : 1;
    }
    this.estado.ultimoDia = h;
    this.estado.mejorRacha = Math.max(this.estado.mejorRacha, this.estado.racha);
    this.guardar();
  }

  contarComando() {
    this.estado.comandosEjecutados++;
    // No se guarda en cada tecla: se vuelca al completar algo o al salir.
  }

  contarBusqueda() {
    this.estado.busquedasChuletario++;
  }

  verLeccion(moduloId, leccionId) {
    const clave = `${moduloId}/${leccionId}`;
    if (!this.estado.leccionesVistas.includes(clave)) {
      this.estado.leccionesVistas.push(clave);
      this.registrarActividad();
      this.revisarModulo(moduloId);
      this.guardar();
    }
  }

  // El multiplicador de combo premia encadenar aciertos sin pista.
  multiplicador() {
    const c = this.estado.combo;
    if (c >= 15) return 3;
    if (c >= 8) return 2;
    if (c >= 4) return 1.5;
    return 1;
  }

  completarReto(reto, { usoPista = false } = {}) {
    const yaEstaba = this.retoHecho(reto.id);

    if (usoPista) {
      this.estado.combo = 0;
      if (!this.estado.retosConPista.includes(reto.id)) this.estado.retosConPista.push(reto.id);
      // Lo que costó vuelve para repaso.
      this.programarRepaso(reto.id);
    } else {
      this.estado.combo++;
      this.estado.mejorCombo = Math.max(this.estado.mejorCombo, this.estado.combo);
      this.avanzarRepaso(reto.id);
    }

    let ganado = 0;
    if (!yaEstaba) {
      this.estado.retosCompletados.push(reto.id);
      const base = usoPista ? Math.round(reto.xp * 0.6) : reto.xp;
      ganado = Math.round(base * (usoPista ? 1 : this.multiplicador()));
      this.estado.xp += ganado;
    }

    this.registrarActividad();
    this.revisarModulo(reto.moduloId);
    const nuevos = this.revisarLogros();
    this.guardar();
    return { ganado, multiplicador: this.multiplicador(), combo: this.estado.combo, nuevosLogros: nuevos };
  }

  fallarReto(retoId) {
    this.estado.combo = 0;
    this.programarRepaso(retoId);
    this.guardar();
  }

  programarRepaso(retoId) {
    const previo = this.estado.repaso[retoId];
    const veces = previo ? 0 : 0; // al fallar se vuelve al primer intervalo
    const dias = REPASO_DIAS[veces];
    const fecha = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
    this.estado.repaso[retoId] = { fecha, veces };
  }

  avanzarRepaso(retoId) {
    const previo = this.estado.repaso[retoId];
    if (!previo) return;
    const veces = previo.veces + 1;
    if (veces >= REPASO_DIAS.length) {
      delete this.estado.repaso[retoId];
      return;
    }
    const fecha = new Date(Date.now() + REPASO_DIAS[veces] * 86400000).toISOString().slice(0, 10);
    this.estado.repaso[retoId] = { fecha, veces };
  }

  registrarExamen(moduloId, aciertos, total) {
    const previo = this.estado.examenesAprobados[moduloId] || 0;
    if (aciertos > previo) this.estado.examenesAprobados[moduloId] = aciertos;
    if (aciertos === total) {
      this.estado.examenesPerfectos++;
      this.estado.xp += 100;
    } else {
      this.estado.xp += aciertos * 15;
    }
    this.registrarActividad();
    this.revisarModulo(moduloId);
    const nuevos = this.revisarLogros();
    this.guardar();
    return nuevos;
  }

  completarIncidente(incidente, { tiempoRestante = 0 } = {}) {
    if (!this.estado.incidentesResueltos.includes(incidente.id)) {
      this.estado.incidentesResueltos.push(incidente.id);
      this.estado.xp += incidente.xp;
    }
    if (tiempoRestante > incidente.minutos * 30) this.estado.incidenteRapido = true;
    this.registrarActividad();
    const nuevos = this.revisarLogros();
    this.guardar();
    return nuevos;
  }

  elegirTema(id) {
    if (this.temasDisponibles.some((t) => t.id === id)) {
      this.estado.tema = id;
      this.guardar();
    }
  }

  // Un módulo se da por completado cuando se han visto todas sus lecciones,
  // resuelto todos sus retos y aprobado su examen con al menos 3 de 5.
  revisarModulo(moduloId) {
    if (this.moduloCompletado(moduloId)) return;
    const m = MODULO_POR_ID[moduloId];
    if (!m) return;
    const lecciones = m.lecciones.every((l) => this.leccionVista(moduloId, l.id));
    const retos = retosDe(moduloId).every((r) => this.retoHecho(r.id));
    const examen = (this.estado.examenesAprobados[moduloId] || 0) >= 3;
    if (lecciones && retos && examen) this.estado.modulosCompletados.push(moduloId);
  }

  // Instantánea del progreso con la forma que esperan los checks de los logros.
  resumenParaLogros() {
    const rutasCompletadas = RUTAS.filter((r) =>
      MODULOS.filter((m) => r.modulos.includes(m.n)).every((m) => this.moduloCompletado(m.id))
    ).map((r) => r.id);

    const modulosSinPistas = this.estado.modulosCompletados.filter((id) =>
      retosDe(id).every((r) => !this.estado.retosConPista.includes(r.id))
    );

    return {
      ...this.estado,
      rutasCompletadas,
      modulosSinPistas,
    };
  }

  revisarLogros() {
    const resumen = this.resumenParaLogros();
    const nuevos = [];
    for (const l of LOGROS) {
      if (this.estado.logros.includes(l.id)) continue;
      let conseguido = false;
      try {
        conseguido = l.check(resumen) === true;
      } catch {
        conseguido = false;
      }
      if (conseguido) {
        this.estado.logros.push(l.id);
        nuevos.push(l);
      }
    }
    return nuevos;
  }

  // --- exportar e importar ----------------------------------------------

  exportar() {
    return JSON.stringify(this.estado, null, 2);
  }

  importar(texto) {
    const datos = JSON.parse(texto);
    if (typeof datos !== 'object' || datos === null) throw new Error('El archivo no tiene el formato esperado');
    this.estado = { ...estadoInicial(), ...datos, version: VERSION };
    this.guardar();
  }

  reiniciar() {
    this.estado = estadoInicial();
    this.guardar();
  }

  // --- estadísticas para el perfil --------------------------------------

  estadisticas() {
    const dominio = MODULOS.map((m) => ({
      id: m.id,
      n: m.n,
      nombre: m.nombre,
      progreso: this.progresoModulo(m.id),
      completado: this.moduloCompletado(m.id),
    }));
    return {
      xp: this.estado.xp,
      nivel: this.nivel,
      racha: this.estado.racha,
      mejorRacha: this.estado.mejorRacha,
      retos: this.estado.retosCompletados.length,
      totalRetos: TOTAL_RETOS,
      modulos: this.estado.modulosCompletados.length,
      totalModulos: MODULOS.length,
      logros: this.estado.logros.length,
      totalLogros: LOGROS.length,
      comandos: this.estado.comandosEjecutados,
      incidentes: this.estado.incidentesResueltos.length,
      mejorCombo: this.estado.mejorCombo,
      repasosPendientes: this.retosParaRepasar().length,
      dominio,
    };
  }
}

export const store = new Store();
export { hoy };
