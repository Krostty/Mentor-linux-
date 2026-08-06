// Utilidades compartidas por las familias de comandos.

// Separa flags de operandos. `withValue` lista flags cortos que consumen el
// siguiente argumento (p. ej. -n 5). Soporta agrupación (-la) y --largos.
export function parseArgs(args, { withValue = [], longWithValue = [], stopAtFirstOperand = false } = {}) {
  const flags = new Set();
  const values = {};
  const operands = [];
  let noMoreFlags = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (noMoreFlags || a === '-' || !a.startsWith('-')) {
      operands.push(a);
      if (stopAtFirstOperand) {
        operands.push(...args.slice(i + 1));
        break;
      }
      continue;
    }
    if (a === '--') {
      noMoreFlags = true;
      continue;
    }
    if (a.startsWith('--')) {
      const [name, inline] = a.slice(2).split(/=(.*)/);
      if (longWithValue.includes(name)) {
        values[name] = inline != null ? inline : args[++i];
      } else {
        flags.add('--' + name);
      }
      continue;
    }
    const chars = a.slice(1);
    for (let j = 0; j < chars.length; j++) {
      const c = chars[j];
      if (withValue.includes(c)) {
        const rest = chars.slice(j + 1);
        values[c] = rest !== '' ? rest : args[++i];
        break;
      }
      // -5 estilo head/tail
      if (/\d/.test(c) && (chars === chars.replace(/\D/g, ''))) {
        values['#'] = chars;
        break;
      }
      flags.add('-' + c);
    }
  }
  return { flags, values, operands, has: (...f) => f.some((x) => flags.has(x)) };
}

export function ok(stdout = '') {
  return { stdout, code: 0 };
}

export function err(message, code = 1) {
  return { stderr: message.endsWith('\n') ? message : message + '\n', code };
}

export function lines(text) {
  if (text === '') return [];
  const l = text.split('\n');
  if (l[l.length - 1] === '') l.pop();
  return l;
}

export function withNewline(text) {
  if (text === '') return '';
  return text.endsWith('\n') ? text : text + '\n';
}

export function fsErr(cmd, path, e) {
  const msg = e && e.message ? e.message : String(e);
  return err(`${cmd}: ${path}: ${msg}`);
}

// Marcas invisibles de color. La terminal las convierte en <span>; cualquier
// otro consumidor (tests, pipes, redirecciones a archivo) las elimina, así que
// el texto real que ve el usuario es exactamente el de Linux.
export const MARK = '\u0001';

export function mark(kind, textValue) {
  return MARK + kind + ':' + textValue + MARK;
}

export function stripMarks(s) {
  return typeof s === 'string' ? s.replace(/\u0001(\w+):([^\u0001]*)\u0001/g, '$2') : s;
}

export function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : ' '.repeat(n - s.length) + s;
}

export function padEnd(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}
