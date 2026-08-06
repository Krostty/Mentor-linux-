// Currículum completo: 20 módulos en 3 rutas.
import { MODULOS_1 } from './modulos-1.js';
import { MODULOS_2 } from './modulos-2.js';
import { MODULOS_3 } from './modulos-3.js';
import { MODULOS_4 } from './modulos-4.js';

export const MODULOS = [...MODULOS_1, ...MODULOS_2, ...MODULOS_3, ...MODULOS_4];

export const RUTAS = [
  {
    id: 'fundamentos',
    nombre: 'Fundamentos',
    descripcion: 'Manejarte con soltura en cualquier terminal',
    modulos: [1, 2, 3, 4, 5, 6, 7, 8],
    color: 'lime',
  },
  {
    id: 'administracion',
    nombre: 'Administración',
    descripcion: 'Gestionar un sistema de verdad',
    modulos: [9, 10, 11, 12, 13, 14],
    color: 'cyan',
  },
  {
    id: 'seguridad',
    nombre: 'Scripting y seguridad',
    descripcion: 'Automatizar y proteger',
    modulos: [15, 16, 17, 18, 19, 20],
    color: 'magenta',
  },
];

// --- índices de acceso rápido ---------------------------------------------

export const MODULO_POR_ID = Object.fromEntries(MODULOS.map((m) => [m.id, m]));

export const TODOS_LOS_RETOS = MODULOS.flatMap((m) =>
  m.lecciones.flatMap((l) =>
    (l.retos || []).map((r) => ({ ...r, moduloId: m.id, leccionId: l.id, moduloN: m.n }))
  )
);

export const RETO_POR_ID = Object.fromEntries(TODOS_LOS_RETOS.map((r) => [r.id, r]));

export function leccionesDe(moduloId) {
  const m = MODULO_POR_ID[moduloId];
  return m ? m.lecciones : [];
}

export function retosDe(moduloId) {
  return TODOS_LOS_RETOS.filter((r) => r.moduloId === moduloId);
}

export function rutaDe(moduloN) {
  return RUTAS.find((r) => r.modulos.includes(moduloN));
}

// Total de pasos de un módulo: cada lección cuenta y cada reto cuenta.
export function pasosDe(moduloId) {
  const m = MODULO_POR_ID[moduloId];
  if (!m) return 0;
  return m.lecciones.length + retosDe(moduloId).length;
}

export const TOTAL_RETOS = TODOS_LOS_RETOS.length;
export const TOTAL_LECCIONES = MODULOS.reduce((s, m) => s + m.lecciones.length, 0);
export const TOTAL_XP = TODOS_LOS_RETOS.reduce((s, r) => s + (r.xp || 0), 0);
