// Logros, títulos por nivel y temas desbloqueables.
// Cada logro recibe el estado del progreso y decide si está conseguido.

const cantidad = (valor) => Array.isArray(valor) ? valor.length : 0;

export const LOGROS = [
  { id: 'primer-comando', nombre: 'Primer contacto', desc: 'Ejecutaste tu primer comando', icono: '🌱', check: (p) => p.comandosEjecutados >= 1 },
  { id: 'diez-retos', nombre: 'Cogiendo el ritmo', desc: '10 retos resueltos', icono: '⚡', check: (p) => p.retosCompletados.length >= 10 },
  { id: 'cincuenta-retos', nombre: 'Manos en la terminal', desc: '50 retos resueltos', icono: '🔧', check: (p) => p.retosCompletados.length >= 50 },
  { id: 'cien-retos', nombre: 'Veterano', desc: '100 retos resueltos', icono: '🏔️', check: (p) => p.retosCompletados.length >= 100 },

  { id: 'sin-pistas-10', nombre: 'Por mi cuenta', desc: '10 retos seguidos sin usar pistas', icono: '🎯', check: (p) => p.mejorCombo >= 10 },
  { id: 'combo-20', nombre: 'Imparable', desc: 'Combo de 20 aciertos seguidos', icono: '🔥', check: (p) => p.mejorCombo >= 20 },

  { id: 'racha-3', nombre: 'Constancia', desc: '3 días seguidos practicando', icono: '📅', check: (p) => p.mejorRacha >= 3 },
  { id: 'racha-7', nombre: 'Una semana entera', desc: '7 días seguidos', icono: '🗓️', check: (p) => p.mejorRacha >= 7 },
  { id: 'racha-30', nombre: 'Disciplina', desc: '30 días seguidos', icono: '💎', check: (p) => p.mejorRacha >= 30 },

  { id: 'modulo-1', nombre: 'Primeros pasos', desc: 'Completaste tu primer módulo', icono: '🚪', check: (p) => p.modulosCompletados.length >= 1 },
  { id: 'ruta-fundamentos', nombre: 'Base sólida', desc: 'Completaste la ruta de Fundamentos', icono: '🧱', check: (p) => p.rutasCompletadas.includes('fundamentos') },
  { id: 'ruta-admin', nombre: 'Administrador', desc: 'Completaste la ruta de Administración', icono: '⚙️', check: (p) => p.rutasCompletadas.includes('administracion') },
  { id: 'ruta-seguridad', nombre: 'Guardián', desc: 'Completaste la ruta de Scripting y seguridad', icono: '🛡️', check: (p) => p.rutasCompletadas.includes('seguridad') },
  { id: 'todo', nombre: 'Mentor Linux', desc: 'Completaste los 20 módulos', icono: '👑', check: (p) => p.modulosCompletados.length >= 20 },

  { id: 'permisos', nombre: 'Domador de permisos', desc: 'Superaste el módulo de permisos sin pistas', icono: '🔐', check: (p) => p.modulosSinPistas.includes('permisos') },
  { id: 'grep', nombre: 'Maestro de grep', desc: 'Superaste el módulo de búsqueda sin pistas', icono: '🔎', check: (p) => p.modulosSinPistas.includes('busqueda') },
  { id: 'pipes', nombre: 'Fontanero', desc: 'Superaste el módulo de pipes sin pistas', icono: '🔗', check: (p) => p.modulosSinPistas.includes('pipes') },

  { id: 'incidente-1', nombre: 'Primera guardia', desc: 'Resolviste tu primer incidente', icono: '🚨', check: (p) => p.incidentesResueltos.length >= 1 },
  { id: 'incidente-todos', nombre: 'Equipo de crisis', desc: 'Resolviste todos los incidentes', icono: '🎖️', check: (p) => p.incidentesResueltos.length >= 5 },
  { id: 'incidente-rapido', nombre: 'Reflejos', desc: 'Resolviste un incidente con más de la mitad del tiempo restante', icono: '⏱️', check: (p) => p.incidenteRapido },

  { id: 'examen-perfecto', nombre: 'Sobresaliente', desc: 'Sacaste un examen perfecto', icono: '💯', check: (p) => p.examenesPerfectos >= 1 },
  { id: 'examenes-5', nombre: 'Buen expediente', desc: '5 exámenes perfectos', icono: '🎓', check: (p) => p.examenesPerfectos >= 5 },

  { id: 'explorador', nombre: 'Explorador', desc: 'Ejecutaste 500 comandos', icono: '🧭', check: (p) => p.comandosEjecutados >= 500 },
  { id: 'chuletas', nombre: 'Consulta rápida', desc: 'Buscaste 25 veces en el chuletario', icono: '📖', check: (p) => p.busquedasChuletario >= 25 },

  // v2: salas, máquinas y Wargame.
  { id: 'ejercicio-1', nombre: 'Aprender haciendo', desc: 'Completaste tu primer ejercicio', icono: '✅', check: (p) => cantidad(p.ejerciciosCompletados) >= 1 },
  { id: 'ejercicios-150', nombre: 'Media travesía', desc: '150 ejercicios completados', icono: '🧗', check: (p) => cantidad(p.ejerciciosCompletados) >= 150 },
  { id: 'ejercicios-300', nombre: 'Dominio práctico', desc: 'Completaste los 300 ejercicios', icono: '🏆', check: (p) => cantidad(p.ejerciciosCompletados) >= 300 },
  { id: 'sala-1', nombre: 'Primera sala', desc: 'Completaste una sala', icono: '🚪', check: (p) => cantidad(p.salasCompletadas) >= 1 },
  { id: 'salas-10', nombre: 'Ruta en marcha', desc: 'Completaste 10 salas', icono: '🗺️', check: (p) => cantidad(p.salasCompletadas) >= 10 },
  { id: 'salas-24', nombre: 'Currículo completo', desc: 'Completaste las 24 salas', icono: '🐧', check: (p) => cantidad(p.salasCompletadas) >= 24 },
  { id: 'maquina-1', nombre: 'Primer foothold', desc: 'Completaste tu primera máquina simulada', icono: '🖥️', check: (p) => cantidad(p.maquinasCompletadas) >= 1 },
  { id: 'maquinas-5', nombre: 'Operador', desc: 'Completaste 5 máquinas', icono: '🥷', check: (p) => cantidad(p.maquinasCompletadas) >= 5 },
  { id: 'maquinas-12', nombre: 'Laboratorio dominado', desc: 'Completaste las 12 máquinas', icono: '👑', check: (p) => cantidad(p.maquinasCompletadas) >= 12 },
  { id: 'primera-user-flag', nombre: 'User owned', desc: 'Capturaste tu primera user.txt', icono: '🚩', check: (p) => p.flagsUser >= 1 },
  { id: 'primera-root-flag', nombre: 'Root owned', desc: 'Capturaste tu primera root.txt', icono: '🏴', check: (p) => p.flagsRoot >= 1 },
  { id: 'wargame-1', nombre: 'Primera contraseña', desc: 'Superaste un nivel Wargame', icono: '🔑', check: (p) => cantidad(p.wargameCompletados) >= 1 },
  { id: 'wargame-5', nombre: 'Cazador de secretos', desc: 'Superaste 5 niveles Wargame', icono: '🕵️', check: (p) => cantidad(p.wargameCompletados) >= 5 },
  { id: 'wargame-15', nombre: 'Bandit de Mentor', desc: 'Superaste los 15 niveles Wargame', icono: '🗝️', check: (p) => cantidad(p.wargameCompletados) >= 15 },
  { id: 'sin-pistas-50', nombre: 'Mente afilada', desc: 'Combo de 50 ejercicios sin pistas', icono: '🧠', check: (p) => p.mejorCombo >= 50 },
  { id: 'seis-bloques', nombre: 'Linux integral', desc: 'Completaste los seis bloques de contenido', icono: '🌐', check: (p) => cantidad(p.bloquesCompletados) >= 6 },
];

// Nivel a partir del XP. Cada nivel cuesta un poco más que el anterior.
export const NIVELES = [
  { nivel: 1, xp: 0, titulo: 'Novato' },
  { nivel: 2, xp: 150, titulo: 'Curioso' },
  { nivel: 3, xp: 400, titulo: 'Aprendiz' },
  { nivel: 4, xp: 800, titulo: 'Practicante' },
  { nivel: 5, xp: 1400, titulo: 'Usuario' },
  { nivel: 6, xp: 2200, titulo: 'Usuario avanzado' },
  { nivel: 7, xp: 3200, titulo: 'Operador' },
  { nivel: 8, xp: 4500, titulo: 'Técnico' },
  { nivel: 9, xp: 6000, titulo: 'Administrador' },
  { nivel: 10, xp: 8000, titulo: 'Administrador senior' },
  { nivel: 11, xp: 10500, titulo: 'Ingeniero de sistemas' },
  { nivel: 12, xp: 13500, titulo: 'Especialista' },
  { nivel: 13, xp: 17000, titulo: 'Analista de seguridad' },
  { nivel: 14, xp: 21000, titulo: 'Arquitecto' },
  { nivel: 15, xp: 26000, titulo: 'Mentor Linux' },
];

export function nivelDe(xp) {
  let actual = NIVELES[0];
  for (const n of NIVELES) if (xp >= n.xp) actual = n;
  const siguiente = NIVELES.find((n) => n.xp > xp) || null;
  const base = actual.xp;
  const techo = siguiente ? siguiente.xp : actual.xp;
  const progreso = siguiente ? (xp - base) / (techo - base) : 1;
  return { ...actual, siguiente, progreso, faltan: siguiente ? siguiente.xp - xp : 0 };
}

// Temas de terminal que se desbloquean al completar módulos.
export const TEMAS = [
  { id: 'fosforo', nombre: 'Fósforo', desc: 'El de siempre: verde sobre índigo', requiere: 0, colores: { acento: '#7CFF4F', prompt: '#7CFF4F', fondo: '#08061A' } },
  { id: 'ambar', nombre: 'Ámbar', desc: 'Terminal de los 80', requiere: 2, colores: { acento: '#FFC24B', prompt: '#FFB020', fondo: '#120C02' } },
  { id: 'hielo', nombre: 'Hielo', desc: 'Cian sobre azul profundo', requiere: 5, colores: { acento: '#26E6FF', prompt: '#26E6FF', fondo: '#04121C' } },
  { id: 'neon', nombre: 'Neón', desc: 'Magenta eléctrico', requiere: 9, colores: { acento: '#FF3D9A', prompt: '#FF6FB5', fondo: '#150418' } },
  { id: 'matrix', nombre: 'Matrix', desc: 'Verde puro sobre negro', requiere: 14, colores: { acento: '#00FF41', prompt: '#00FF41', fondo: '#000000' } },
  { id: 'root', nombre: 'Root', desc: 'Rojo de administrador. Solo al terminarlo todo', requiere: 20, colores: { acento: '#FF4B4B', prompt: '#FF6B6B', fondo: '#180404' } },
];

export function temasDesbloqueados(modulosCompletados) {
  return TEMAS.filter((t) => modulosCompletados >= t.requiere);
}
