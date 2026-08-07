// Constructores de ejercicios. Viven aparte para que los ficheros de salas
// nuevos los usen sin duplicar la forma de cada tipo.

export function quiz(id, pregunta, opciones, correcta, explicacion, xp = 15) {
  return { id, tipo: 'quiz', enunciado: pregunta, opciones, correcta, explicacion, xp };
}

export function respuesta(id, enunciado, respuestas, explicacion, xp = 15) {
  return { id, tipo: 'respuesta', enunciado, respuestas, explicacion, xp };
}

export function terminal(id, enunciado, snapshot, solucion, check, pistas, xp = 25) {
  return { id, tipo: 'terminal', enunciado, snapshot, solucion, check, pistas, xp };
}

export function ordenar(id, enunciado, tokens, respuestaCorrecta, explicacion, habilidades = [], xp = 15) {
  return { id, tipo: 'ordenar', enunciado, tokens, respuestaCorrecta, explicacion, habilidades, xp };
}

export function completar(id, enunciado, plantilla, respuestas, explicacion, habilidades = [], xp = 15) {
  return { id, tipo: 'completar', enunciado, plantilla, respuestas, explicacion, habilidades, xp };
}

// Las piezas de un «ordenar» se barajan de forma estable: el orden nunca
// delata la solución, pero es el mismo entre recargas.
export function barajar(tokens, semilla = '') {
  return [...tokens].sort((a, b) => (a + semilla).localeCompare(b + semilla, 'es'));
}
