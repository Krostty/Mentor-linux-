// Intérpretes de la línea de órdenes: python3 y lua.
//
// Ejecutan el subconjunto implementado en `../scripting.js` contra el
// filesystem simulado: leen el archivo, lo interpretan y devuelven la salida
// estándar y el error igual que haría el intérprete real.

import { ejecutarScript } from '../scripting.js';
import { parseArgs, ok } from './util.js';

const VERSION_PY = 'Python 3.11.8';
const VERSION_LUA = 'Lua 5.4.6  Copyright (C) 1994-2023 Lua.org, PUC-Rio';

// Puente entre el intérprete y el FS virtual: solo lectura y escritura de
// archivos por ruta, nada más. El script del alumno no puede tocar el resto.
function puente(ctx) {
  return {
    leer(camino) {
      try {
        return ctx.fs.readFile(ctx.shell.resolve(camino), ctx);
      } catch {
        return null;
      }
    },
    escribir(camino, contenido) {
      try {
        ctx.fs.writeFile(ctx.shell.resolve(camino), contenido, ctx);
        return true;
      } catch {
        return false;
      }
    },
    cwd: () => ctx.cwd,
    env: (nombre) => (ctx.env && ctx.env[nombre] != null ? ctx.env[nombre] : null),
  };
}

function correr(lang, args, ctx, { flagCodigo, version, binario }) {
  const { operands, values, has } = parseArgs(args, { withValue: [flagCodigo] });

  if (has('-v', '--version', '-V')) return ok(version + '\n');

  const io = puente(ctx);

  if (values[flagCodigo] !== undefined) {
    const r = ejecutarScript(lang, values[flagCodigo], { io, argv: [lang === 'py' ? '-c' : '-e'], nombre: lang === 'py' ? '<string>' : '(command line)' });
    return { stdout: r.salida, stderr: r.error, code: r.codigo };
  }

  const archivo = operands[0];
  if (!archivo) {
    // Sin argumentos, el intérprete real abriría una sesión interactiva; aquí
    // se dice claramente en vez de fingir un REPL que no existe.
    return {
      stdout: '',
      stderr: `${binario}: esta terminal no tiene modo interactivo. Escribe tu código en un archivo y ejecútalo con \`${binario} ${lang === 'py' ? 'archivo.py' : 'archivo.lua'}\`, o usa \`${binario} ${flagCodigo === 'c' ? '-c' : '-e'} '...'\`.\n`,
      code: 1,
    };
  }

  let fuente;
  try {
    fuente = ctx.fs.readFile(ctx.shell.resolve(archivo), ctx);
  } catch (e) {
    const motivo = e && e.message ? e.message : 'No such file or directory';
    return {
      stdout: '',
      stderr: lang === 'py'
        ? `${binario}: can't open file '${archivo}': [Errno 2] ${motivo}\n`
        : `lua: cannot open ${archivo} (${motivo})\n`,
      code: lang === 'py' ? 2 : 1,
    };
  }

  const r = ejecutarScript(lang, fuente, { io, argv: [archivo, ...operands.slice(1)], nombre: archivo });
  return { stdout: r.salida, stderr: r.error, code: r.codigo };
}

export const scripts = {
  python3: (args, ctx) => correr('py', args, ctx, { flagCodigo: 'c', version: VERSION_PY, binario: 'python3' }),
  python: (args, ctx) => scripts.python3(args, ctx),
  lua: (args, ctx) => correr('lua', args, ctx, { flagCodigo: 'e', version: VERSION_LUA, binario: 'lua' }),
  lua5: (args, ctx) => scripts.lua(args, ctx),
};
