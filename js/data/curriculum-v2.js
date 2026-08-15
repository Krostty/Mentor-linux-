// Constructores mínimos para las unidades migradas. Mantienen el contrato
// legado (`teoria` + `practica`) y generan una secuencia V2 intercalada.

export function entrena(ejercicio, ...habilidades) {
  return { ...ejercicio, habilidades: [...new Set([...(ejercicio.habilidades || []), ...habilidades])] };
}

export function tareaV2({
  id, titulo, subtitulo = '', teoria, practica, imagen = null,
  objetivo = '', prerrequisitos = [], pasos: pasosDeclarados = null,
}) {
  if (Array.isArray(pasosDeclarados) && pasosDeclarados.length) {
    return { id, titulo, subtitulo, objetivo, prerrequisitos, teoria, practica, pasos: pasosDeclarados };
  }
  const grupos = Array.from({ length: teoria.length }, () => []);
  practica.forEach((ejercicio, indice) => {
    const grupo = Math.min(teoria.length - 1, Math.floor(indice * teoria.length / practica.length));
    grupos[grupo].push(ejercicio);
  });
  const pasos = [];
  teoria.forEach((bloque, indice) => {
    pasos.push({ tipo: 'teoria', indice });
    if (imagen && (imagen.despuesDe ?? 0) === indice) {
      const { despuesDe, ...datosImagen } = imagen;
      pasos.push({ tipo: 'imagen', ...datosImagen });
    }
    for (const ejercicio of grupos[indice]) pasos.push({ tipo: 'ejercicio', ejercicioId: ejercicio.id });
  });
  return { id, titulo, subtitulo, objetivo, prerrequisitos, teoria, practica, pasos };
}
