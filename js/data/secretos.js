// Hash rápido para no dejar banderas y respuestas directamente en el modelo UI.
// No es una frontera de seguridad: toda la aplicación es offline y auditable.
export function hashRespuesta(valor) {
  let h = 0x811c9dc5;
  const normalizado = String(valor ?? '').trim();
  for (let i = 0; i < normalizado.length; i++) {
    h ^= normalizado.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function respuestaCorrecta(valor, hash) {
  return hashRespuesta(valor) === hash;
}
