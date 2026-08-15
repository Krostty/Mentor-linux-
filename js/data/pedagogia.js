// Contratos pedagógicos compartidos por contenido, reproductor y persistencia.
// Todo es determinista y local: no requiere cuentas, red ni servicios externos.

export const TIPOS_PASO = new Set([
  'teoria', 'imagen', 'ejercicio',
  'diagnostico', 'prediccion', 'ejemplo', 'explicacion',
  'practica-guiada', 'escenario', 'reflexion', 'reporte', 'repaso',
]);

export const TIPOS_CON_EJERCICIO = new Set(['ejercicio', 'practica-guiada', 'escenario', 'repaso']);
export const TIPOS_CON_TEORIA = new Set(['teoria', 'ejemplo', 'explicacion']);
export const TIPOS_EVIDENCIA = new Set(['diagnostico', 'prediccion', 'reflexion', 'reporte']);

export const INTERVALOS_REPASO_MINUTOS = [10, 1440, 4320, 10080, 30240];

export const NIVELES_AUTONOMIA = [
  {
    id: 'guiada', nombre: 'Guiada', descripcion: 'Explicación, pistas progresivas y desarrollo.',
    muestraGuia: true, permitePistas: true, permiteDesarrollo: true,
  },
  {
    id: 'asistida', nombre: 'Asistida', descripcion: 'Objetivo y pistas bajo demanda, sin receta completa.',
    muestraGuia: false, permitePistas: true, permiteDesarrollo: false,
  },
  {
    id: 'independiente', nombre: 'Independiente', descripcion: 'Solo objetivo, alcance y terminal.',
    muestraGuia: false, permitePistas: false, permiteDesarrollo: false,
  },
  {
    id: 'experta', nombre: 'Experta', descripcion: 'Información incompleta y reporte técnico obligatorio.',
    muestraGuia: false, permitePistas: false, permiteDesarrollo: false, requiereReporte: true,
  },
  {
    id: 'red-team', nombre: 'Red Team', descripcion: 'Camino libre dentro de ROE; evidencia y reporte obligatorios.',
    muestraGuia: false, permitePistas: false, permiteDesarrollo: false, requiereReporte: true, requiereRoe: true,
  },
];

export const AUTONOMIA_POR_ID = Object.fromEntries(NIVELES_AUTONOMIA.map((nivel) => [nivel.id, nivel]));

function hash(texto = '') {
  let valor = 2166136261;
  for (const caracter of String(texto)) {
    valor ^= caracter.charCodeAt(0);
    valor = Math.imul(valor, 16777619);
  }
  return valor >>> 0;
}

function siguienteAleatorio(estado) {
  let valor = estado.valor += 0x6D2B79F5;
  valor = Math.imul(valor ^ valor >>> 15, valor | 1);
  valor ^= valor + Math.imul(valor ^ valor >>> 7, valor | 61);
  return ((valor ^ valor >>> 14) >>> 0) / 4294967296;
}

// El índice correcto del contenido nunca se usa como posición visual. La
// posición se distribuye de forma estable con el ID, así una recarga no mueve
// las respuestas mientras el currículo deja de enseñar que A suele acertar.
export function opcionesQuizOrdenadas(ejercicio) {
  const opciones = ejercicio.opciones || [];
  const indices = opciones.map((_, indice) => indice);
  const estado = { valor: hash(ejercicio.id) };
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(siguienteAleatorio(estado) * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  if (indices.length > 1) {
    const objetivo = hash(`${ejercicio.id}/correcta`) % indices.length;
    const actual = indices.indexOf(ejercicio.correcta);
    [indices[actual], indices[objetivo]] = [indices[objetivo], indices[actual]];
  }
  return indices.map((indiceOriginal) => ({
    indiceOriginal,
    texto: opciones[indiceOriginal],
    correcta: indiceOriginal === ejercicio.correcta,
  }));
}

export function feedbackQuiz(ejercicio, indiceElegido) {
  const personalizado = Array.isArray(ejercicio.feedbackOpciones)
    ? ejercicio.feedbackOpciones[indiceElegido]
    : ejercicio.feedbackOpciones?.[indiceElegido];
  if (personalizado) return personalizado;
  const elegida = ejercicio.opciones?.[indiceElegido] || 'esa alternativa';
  const correcta = ejercicio.opciones?.[ejercicio.correcta] || 'la alternativa correcta';
  return `Elegiste «${elegida}». ${ejercicio.explicacion || `Compárala con «${correcta}».`} Revisa la diferencia y vuelve a decidir; el intento no se descarta.`;
}

export function fechaEnMinutos(minutos, base = new Date()) {
  return new Date(base.getTime() + minutos * 60000).toISOString();
}

export function revisionVencida(valor, base = new Date()) {
  if (!valor) return false;
  const normalizado = String(valor).length === 10 ? `${valor}T23:59:59.999Z` : valor;
  const fecha = new Date(normalizado);
  return !Number.isNaN(fecha.getTime()) && fecha <= base;
}

export function proximaRevision(etapa = 0, base = new Date()) {
  const indice = Math.max(0, Math.min(Number(etapa) || 0, INTERVALOS_REPASO_MINUTOS.length - 1));
  return fechaEnMinutos(INTERVALOS_REPASO_MINUTOS[indice], base);
}
