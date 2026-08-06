// Utilidades para escribir validaciones de retos y explicar por qué fallaste.
//
// Cada reto recibe un contexto:
//   { fs, shell, ultimo: {cmd, salida, code}, historial: [cmd...], salidas: [...] }
// y devuelve true cuando el objetivo está cumplido. Se valida por RESULTADO,
// así que cualquier camino correcto vale.

import { S_DIR, S_FILE, S_LINK } from '../engine/fs.js';
import { COMMAND_NAMES } from '../engine/commands/index.js';

// --- lectura cómoda del filesystem -----------------------------------------

export function nodo(ctx, path) {
  try {
    return ctx.fs.lookup(ctx.shell.resolve(path), ctx.shell.ctx, { followFinal: false });
  } catch {
    return null;
  }
}

export function existe(ctx, path) {
  return nodo(ctx, path) != null;
}

export function esDir(ctx, path) {
  const n = nodo(ctx, path);
  return !!n && n.type === S_DIR;
}

export function esArchivo(ctx, path) {
  const n = nodo(ctx, path);
  return !!n && n.type === S_FILE;
}

export function contenido(ctx, path) {
  try {
    return ctx.fs.readFile(ctx.shell.resolve(path), ctx.shell.ctx);
  } catch {
    return null;
  }
}

export function modo(ctx, path) {
  const n = nodo(ctx, path);
  return n ? n.mode & 0o777 : null;
}

export function dueño(ctx, path) {
  const n = nodo(ctx, path);
  return n ? n.owner : null;
}

export function hijos(ctx, path) {
  const n = nodo(ctx, path);
  if (!n || n.type !== S_DIR) return [];
  return [...n.children.keys()];
}

// --- lectura del historial y de la salida ----------------------------------

export function ultimaSalida(ctx) {
  return ctx.ultimo ? ctx.ultimo.salida : '';
}

export function usó(ctx, patron) {
  const re = patron instanceof RegExp ? patron : new RegExp(patron);
  return ctx.historial.some((c) => re.test(c));
}

export function ultimoUsó(ctx, patron) {
  const re = patron instanceof RegExp ? patron : new RegExp(patron);
  return !!ctx.ultimo && re.test(ctx.ultimo.cmd);
}

// La salida del último comando contiene todas estas cosas.
export function salidaTiene(ctx, ...trozos) {
  const s = ultimaSalida(ctx);
  return trozos.every((t) => (t instanceof RegExp ? t.test(s) : s.includes(t)));
}

export function salidaLineas(ctx) {
  return ultimaSalida(ctx)
    .split('\n')
    .filter((l) => l.trim() !== '');
}

export function cwdEs(ctx, path) {
  return ctx.shell.cwd === path;
}

// --- permisos --------------------------------------------------------------

export const bits = {
  dueñoLee: 0o400, dueñoEscribe: 0o200, dueñoEjecuta: 0o100,
  grupoLee: 0o040, grupoEscribe: 0o020, grupoEjecuta: 0o010,
  otrosLee: 0o004, otrosEscribe: 0o002, otrosEjecuta: 0o001,
};

export function tieneBits(ctx, path, mask) {
  const m = modo(ctx, path);
  return m != null && (m & mask) === mask;
}

export function sinBits(ctx, path, mask) {
  const m = modo(ctx, path);
  return m != null && (m & mask) === 0;
}

// --- diagnóstico automático -------------------------------------------------

// Distancia de edición, para sugerir el comando que probablemente querías.
function distancia(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

export function comandoParecido(nombre) {
  let mejor = null;
  let mejorD = Infinity;
  for (const c of COMMAND_NAMES) {
    const d = distancia(nombre, c);
    if (d < mejorD) {
      mejorD = d;
      mejor = c;
    }
  }
  return mejorD <= 2 ? mejor : null;
}

// Explicaciones genéricas que se aplican a cualquier reto, leídas del error
// que devolvió la shell. Se muestran antes que las pistas del reto.
export const DIAGNOSTICOS_GENERALES = [
  {
    detecta: /bash: (\S+): command not found/,
    explica: (m) => {
      const sugerencia = comandoParecido(m[1]);
      return {
        titulo: `«${m[1]}» no existe como comando`,
        texto: sugerencia
          ? `La shell no encontró ningún programa con ese nombre. ¿Querías escribir **${sugerencia}**? Revisa la ortografía: en Linux todo distingue mayúsculas y minúsculas.`
          : `La shell buscó «${m[1]}» en el PATH y no lo encontró. Comprueba que lo has escrito bien, o que el paquete está instalado.`,
      };
    },
  },
  {
    detecta: /No such file or directory/,
    explica: () => ({
      titulo: 'La ruta que escribiste no existe',
      texto:
        'Puede ser un nombre mal escrito, o que estés en otra carpeta de la que crees. Usa **pwd** para ver dónde estás y **ls** para ver qué hay ahí.',
    }),
  },
  {
    detecta: /Permission denied/,
    explica: () => ({
      titulo: 'No tienes permiso para eso',
      texto:
        'El archivo existe, pero tu usuario no tiene el permiso necesario. Mira los permisos con **ls -l**. Si es una tarea de administración, prueba con **sudo** delante.',
    }),
  },
  {
    detecta: /Is a directory/,
    explica: () => ({
      titulo: 'Eso es una carpeta, no un archivo',
      texto: 'El comando esperaba un archivo. Para carpetas suele hacer falta la opción **-r** (recursivo), o usar **ls** en vez de **cat**.',
    }),
  },
  {
    detecta: /Not a directory/,
    explica: () => ({
      titulo: 'Eso es un archivo, no una carpeta',
      texto: 'Estás tratando un archivo como si fuera un directorio. Revisa la ruta: quizá sobra un tramo al final.',
    }),
  },
  {
    detecta: /Directory not empty/,
    explica: () => ({
      titulo: 'La carpeta no está vacía',
      texto: '**rmdir** solo borra carpetas vacías. Para borrar una carpeta con cosas dentro se usa **rm -r**.',
    }),
  },
  {
    detecta: /missing operand|missing file operand/,
    explica: () => ({
      titulo: 'Te falta decirle sobre qué actuar',
      texto: 'Escribiste el comando pero no el archivo o carpeta a la que aplicarlo. La forma general es `comando [opciones] destino`.',
    }),
  },
  {
    detecta: /Operation not permitted/,
    explica: () => ({
      titulo: 'Esa operación es solo para el administrador',
      texto: 'Cambiar el dueño de un archivo, o los permisos de algo que no es tuyo, requiere ser root. Prueba con **sudo** delante.',
    }),
  },
  {
    detecta: /are you root\?|Interactive authentication required|not in the sudoers/,
    explica: () => ({
      titulo: 'Hace falta ser administrador',
      texto: 'Instalar paquetes o tocar servicios del sistema requiere privilegios. Repite el comando poniendo **sudo** delante.',
    }),
  },
  {
    detecta: /syntax error|unexpected EOF/,
    explica: () => ({
      titulo: 'La línea está mal formada',
      texto: 'Suele ser una comilla sin cerrar, o un `|` o `>` al final sin nada detrás. Revisa que cada comilla tenga su pareja.',
    }),
  },
  {
    detecta: /invalid mode/,
    explica: () => ({
      titulo: 'Ese modo de permisos no es válido',
      texto:
        'chmod acepta o tres números octales (`chmod 750 archivo`) o letras (`chmod u+x archivo`). No mezcles las dos formas.',
    }),
  },
  {
    detecta: /Unable to locate package|target not found|Unable to find a match/,
    explica: () => ({
      titulo: 'Ese paquete no está en los repositorios',
      texto: 'O el nombre está mal escrito, o falta actualizar la lista de paquetes con `sudo apt update` antes de instalar.',
    }),
  },
];

// Devuelve la primera explicación que encaje con la salida del último comando.
export function diagnosticar(ctx, reglasDelReto = []) {
  const salida = ultimaSalida(ctx);

  // Las reglas del propio reto van primero: son más específicas.
  for (const regla of reglasDelReto) {
    try {
      if (regla.cuando(ctx)) return { titulo: regla.titulo, texto: regla.texto };
    } catch {}
  }

  for (const d of DIAGNOSTICOS_GENERALES) {
    const m = salida.match(d.detecta);
    if (m) return d.explica(m);
  }

  if (ctx.ultimo && ctx.ultimo.code === 0 && salida.trim() === '') {
    return {
      titulo: 'El comando funcionó, pero aún no es lo que pide el reto',
      texto: 'No hubo ningún error: simplemente el estado del sistema todavía no cumple el objetivo. Vuelve a leer el enunciado y comprueba con **ls -l** cómo están las cosas ahora.',
    };
  }

  return {
    titulo: 'Todavía no',
    texto: 'El comando se ejecutó pero el objetivo sigue sin cumplirse. Lee la pista si te has quedado atascado.',
  };
}

export { S_DIR, S_FILE, S_LINK };
