// Shell: tokeniza, expande y ejecuta líneas de comandos contra el FS virtual.
// Soporta comillas, escapes, $VAR, globs, pipes, redirecciones y operadores ; && ||

import { FileSystem, FSError, joinPath, dirname, basename, normalize, S_DIR } from './fs.js';
import { stripMarks } from './commands/util.js';

export class ParseError extends Error {}

// --- tokenizer ----------------------------------------------------------

const OPERATORS = ['||', '&&', '>>', '2>', ';', '|', '>', '<'];

export function tokenize(line) {
  const tokens = [];
  let i = 0;
  // Una palabra se guarda como lista de trozos porque no todos se tratan igual:
  // lo que venía entre comillas simples no expande variables ni globs.
  let parts = [];
  let curQuoted = false;
  let had = false;

  const add = (text, expand, quoted = false) => {
    if (text === '') return;
    // Se fusionan los trozos contiguos del mismo tipo: si no, `$curso` acabaría
    // troceado carácter a carácter y la variable nunca se reconocería.
    const ultimo = parts[parts.length - 1];
    if (ultimo && ultimo.expand === expand && ultimo.quoted === quoted) ultimo.text += text;
    else parts.push({ text, expand, quoted });
    had = true;
  };

  const flush = () => {
    if (had) {
      tokens.push({
        type: 'word',
        value: parts.map((p) => p.text).join(''),
        parts,
        quoted: curQuoted,
      });
    }
    parts = [];
    curQuoted = false;
    had = false;
  };

  while (i < line.length) {
    const c = line[i];
    if (c === ' ' || c === '\t') {
      flush();
      i++;
      continue;
    }
    if (c === '#' && !had) break; // comentario
    if (c === '\\') {
      if (i + 1 < line.length) {
        add(line[i + 1], false, true);
        curQuoted = true;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (c === "'") {
      const end = line.indexOf("'", i + 1);
      if (end < 0) throw new ParseError('unexpected EOF while looking for matching `\'\'');
      // Comillas simples: literal absoluto, ni variables ni globs.
      add(line.slice(i + 1, end), false, true);
      had = true;
      curQuoted = true;
      i = end + 1;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let out = '';
      let closed = false;
      while (j < line.length) {
        if (line[j] === '\\' && j + 1 < line.length && '"\\$`'.includes(line[j + 1])) {
          out += line[j + 1];
          j += 2;
          continue;
        }
        if (line[j] === '"') {
          closed = true;
          break;
        }
        out += line[j];
        j++;
      }
      if (!closed) throw new ParseError('unexpected EOF while looking for matching `"\'');
      // Comillas dobles: no se expanden globs, pero sí las variables.
      add(out, true, true);
      had = true;
      curQuoted = true;
      i = j + 1;
      continue;
    }
    const op = OPERATORS.find((o) => line.startsWith(o, i));
    if (op) {
      flush();
      tokens.push({ type: 'op', value: op });
      i += op.length;
      continue;
    }
    add(c, true, false);
    i++;
  }
  flush();
  return tokens;
}

// --- parser: lista de pipelines unidas por ; && || ----------------------

export function parse(line) {
  const tokens = tokenize(line);
  const list = []; // [{ op: null|'&&'|'||'|';', pipeline: [cmd, ...] }]
  let pipeline = [];
  let cmd = newCmd();
  let pendingOp = null;

  function newCmd() {
    return { words: [], redirects: [] };
  }
  function endCmd() {
    if (cmd.words.length || cmd.redirects.length) pipeline.push(cmd);
    cmd = newCmd();
  }
  function endPipeline(op) {
    endCmd();
    if (pipeline.length) list.push({ op: pendingOp, pipeline });
    pipeline = [];
    pendingOp = op;
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'word') {
      cmd.words.push(t);
      continue;
    }
    if (t.value === '|') {
      endCmd();
      continue;
    }
    if (t.value === ';' || t.value === '&&' || t.value === '||') {
      endPipeline(t.value);
      continue;
    }
    // redirecciones
    const target = tokens[i + 1];
    if (!target || target.type !== 'word') throw new ParseError('syntax error near unexpected token `newline\'');
    // Se conserva el token completo: las comillas deciden si `~`, variables
    // y globs se expanden también en el destino de una redirección.
    cmd.redirects.push({ op: t.value, target });
    i++;
  }
  endPipeline(null);
  return list;
}

// --- expansiones --------------------------------------------------------

function expandVars(text, env) {
  return text
    .replace(/\$\{#(\w+)\[@\]\}/g, (_, name) => Array.isArray(env[name]) ? String(env[name].length) : '0')
    .replace(/\$\{(\w+)\[(\d+|@|\*)\]\}/g, (_, name, index) => {
      const value = env[name];
      if (!Array.isArray(value)) return '';
      return index === '@' || index === '*' ? value.join(' ') : String(value[Number(index)] ?? '');
    })
    .replace(/\$\{(\w+)\}|\$(\w+)|\$(\?|\$|#)/g, (_, a, b, c) => {
    const key = a || b || c;
    return env[key] != null ? String(env[key]) : '';
  });
}

function homeDe(nombre, ctx) {
  if (!nombre || nombre === ctx.user) return ctx.env.HOME;
  if (nombre === 'root') return '/root';
  const candidata = `/home/${nombre}`;
  try {
    if (ctx.fs.exists(candidata, ctx)) return candidata;
  } catch {}
  return null;
}

function expandTildePrefix(text, ctx, bare = true) {
  if (text === '~' && bare) return ctx.env.HOME;
  if (text === '~+' && bare) return ctx.cwd;
  if (text === '~-' && bare && ctx.env.OLDPWD) return ctx.env.OLDPWD;
  if (text.startsWith('~/')) return ctx.env.HOME + text.slice(1);
  if (text.startsWith('~+/')) return ctx.cwd + text.slice(2);
  if (text.startsWith('~-/') && ctx.env.OLDPWD) return ctx.env.OLDPWD + text.slice(2);

  const usuario = text.match(/^~([^/]+)(\/.*)?$/);
  if (usuario) {
    const home = homeDe(usuario[1], ctx);
    if (home) return home + (usuario[2] || '');
  }
  return text;
}

// Bash solo expande un prefijo de tilde no citado. Se trabaja por partes
// para que `~/"documentos"` expanda el prefijo, mientras `"~/documentos"`
// y `~"documentos"` permanezcan literales. Las asignaciones (`X=~/ruta`)
// usan la misma regla después del signo igual.
function expandTildeParts(parts, ctx) {
  if (!parts.length || parts[0].quoted) return parts;
  const out = parts.map((p) => ({ ...p }));
  const primero = out[0].text;
  const asignacion = primero.match(/^([A-Za-z_]\w*=)(~.*)$/);
  const prefijo = asignacion ? asignacion[1] : '';
  const valor = asignacion ? asignacion[2] : primero;
  const expandido = expandTildePrefix(valor, ctx, out.length === 1);
  out[0].text = prefijo + expandido;
  return out;
}

function globToRegex(pattern) {
  let re = '^';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else if (c === '[') {
      const end = pattern.indexOf(']', i + 1);
      if (end < 0) {
        re += '\\[';
        continue;
      }
      let cls = pattern.slice(i + 1, end);
      if (cls.startsWith('!')) cls = '^' + cls.slice(1);
      re += '[' + cls + ']';
      i = end;
    } else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(re + '$');
}

export function hasGlob(text) {
  return /[*?[]/.test(text);
}

function expandGlob(pattern, ctx) {
  const abs = pattern.startsWith('/');
  const segs = pattern.split('/').filter((s, idx) => !(idx === 0 && s === ''));
  let bases = [abs ? '/' : ctx.cwd];
  let anyGlob = false;

  for (const seg of segs) {
    const next = [];
    if (!hasGlob(seg)) {
      for (const b of bases) next.push(joinPath(b, seg));
    } else {
      anyGlob = true;
      const re = globToRegex(seg);
      for (const b of bases) {
        let entries;
        try {
          entries = ctx.fs.list(b, ctx);
        } catch {
          continue;
        }
        for (const { name } of entries) {
          if (name.startsWith('.') && !seg.startsWith('.')) continue;
          if (re.test(name)) next.push(joinPath(b, name));
        }
      }
    }
    bases = next;
  }
  if (!anyGlob) return null;
  const results = bases.filter((p) => ctx.fs.exists(p, ctx));
  if (!results.length) return null;
  // devolver en la forma que el usuario escribió (relativa si el patrón lo era)
  const rel = results.map((p) => (abs ? p : relativeTo(ctx.cwd, p)));
  return rel.sort((a, b) => a.localeCompare(b, 'en'));
}

function relativeTo(cwd, path) {
  const base = cwd === '/' ? '/' : cwd + '/';
  return path.startsWith(base) ? path.slice(base.length) : path;
}

function expandWords(words, ctx) {
  const out = [];
  for (const w of words) {
    // Cada trozo se expande según de dónde venía: lo entrecomillado con
    // comillas simples se queda literal.
    const parts = expandTildeParts(w.parts || [{ text: w.value, expand: true, quoted: false }], ctx);
    const arrayExacta = parts.length === 1 && parts[0].expand
      ? parts[0].text.match(/^\$\{(\w+)\[@\]\}$/)
      : null;
    if (arrayExacta && Array.isArray(ctx.env[arrayExacta[1]])) {
      out.push(...ctx.env[arrayExacta[1]].map(String));
      continue;
    }
    // Tilde se resuelve antes que variables. Así una variable cuyo valor
    // literal sea `~` no se vuelve a expandir al imprimirla.
    const text = parts.map((p) => (p.expand ? expandVars(p.text, ctx.env) : p.text)).join('');
    if (!w.quoted && hasGlob(text)) {
      const matches = expandGlob(text, ctx);
      if (matches) {
        out.push(...matches);
        continue;
      }
    }
    out.push(text);
  }
  return out;
}

// --- ejecución ----------------------------------------------------------

export class Shell {
  constructor({ fs, commands, user = 'user', env = {}, cwd, now = '2026-01-15 10:30', hostname = 'mentor', groupMap = null, machine = null } = {}) {
    this.fs = fs instanceof FileSystem ? fs : FileSystem.fromJSON(fs);
    this.commands = commands;
    this.hostname = hostname;
    this.groupMap = groupMap;
    this.user = user;
    this.groups = this.groupsFor(user);
    this.cwd = cwd || (user === 'root' ? '/root' : `/home/${user}`);
    this.umask = 0o022;
    this.now = now;
    this.history = [];
    this.aliases = new Map();
    this.env = {
      HOME: user === 'root' ? '/root' : `/home/${user}`,
      USER: user,
      SHELL: '/bin/bash',
      PWD: cwd,
      PATH: '/usr/local/bin:/usr/bin:/bin',
      LANG: 'es_ES.UTF-8',
      ...env,
    };
    this.state = { processes: null, services: null, packages: null, network: null, machine };
  }

  groupsFor(user) {
    if (user === 'root') return ['root'];
    if (this.groupMap && this.groupMap[user]) return [...this.groupMap[user]];
    return [user, 'users', 'sudo'];
  }

  // Cambia el usuario efectivo (lo usan `su` y `sudo`) manteniendo coherentes
  // grupos, HOME y el prompt.
  setUser(user) {
    this.user = user;
    this.groups = this.groupsFor(user);
    this.env.USER = user;
    this.env.HOME = user === 'root' ? '/root' : `/home/${user}`;
  }

  prompt() {
    const home = this.env.HOME;
    const where = this.cwd === home ? '~' : this.cwd.startsWith(home + '/') ? '~' + this.cwd.slice(home.length) : this.cwd;
    return `${this.user}@${this.hostname}:${where}${this.user === 'root' ? '#' : '$'}`;
  }

  get ctx() {
    return {
      fs: this.fs,
      shell: this,
      cwd: this.cwd,
      user: this.user,
      group: this.user === 'root' ? 'root' : this.user,
      groups: this.groups,
      env: this.env,
      umask: this.umask,
      now: this.now,
    };
  }

  resolve(path) {
    // Los argumentos ya llegan expandidos desde `expandWords`. Reexpandir
    // aquí rompería rutas citadas como `cd "~"`.
    return joinPath(this.cwd, path);
  }

  // Ejecuta una línea completa. Devuelve { output, code } donde output ya
  // mezcla stdout y stderr en el orden en que se produjeron.
  run(line) {
    const trimmed = line.trim();
    if (trimmed) this.history.push(trimmed);
    if (!trimmed) return { output: '', code: 0 };

    // Arrays indexados de Bash: `puertos=(22 80 443)`. Se conservan como
    // valores estructurados para `${puertos[@]}`, índices y longitud.
    const arrayAssignment = trimmed.match(/^([A-Za-z_]\w*)=\((.*)\)$/s);
    if (arrayAssignment) {
      try {
        const words = tokenize(arrayAssignment[2]).filter((token) => token.type === 'word');
        this.env[arrayAssignment[1]] = expandWords(words, this.ctx);
        this.env['?'] = '0';
        return { output: '', code: 0 };
      } catch (error) {
        return { output: `bash: ${error.message}\n`, code: 2 };
      }
    }

    if (/^(for|while)\s/.test(trimmed)) {
      const bucle = this.runLoop(trimmed);
      if (bucle) {
        this.env['?'] = String(bucle.code);
        return bucle;
      }
    }

    let list;
    try {
      list = parse(trimmed);
    } catch (e) {
      return { output: `bash: ${e.message}\n`, code: 2 };
    }

    let output = '';
    let code = 0;
    for (const { op, pipeline } of list) {
      if (op === '&&' && code !== 0) continue;
      if (op === '||' && code === 0) continue;
      const res = this.runPipeline(pipeline);
      if (res.clear) output = '';
      output += res.output;
      code = res.code;
      this.env['?'] = String(code);
    }
    return { output, code, clear: list.length === 1 && list[0].pipeline.length === 1 && trimmed === 'clear' };
  }

  // Bucles en una línea: `for x in a b c; do …; done` y `while cond; do …; done`.
  // Se resuelven antes de parsear porque `do`/`done` no son comandos.
  runLoop(line) {
    const forMatch = line.match(/^for\s+(\w+)\s+in\s+(.+?);?\s*do\s+([\s\S]+?);?\s*done\s*$/);
    if (forMatch) {
      const [, variable, listaRaw, cuerpo] = forMatch;
      const lista = expandWords(tokenize(listaRaw).filter((t) => t.type === 'word'), this.ctx);
      let output = '';
      let code = 0;
      for (const valor of lista) {
        this.env[variable] = valor;
        const r = this.run(cuerpo);
        output += r.output;
        code = r.code;
      }
      return { output, code };
    }

    const whileMatch = line.match(/^while\s+(.+?);?\s*do\s+([\s\S]+?);?\s*done\s*$/);
    if (whileMatch) {
      const [, condicion, cuerpo] = whileMatch;
      let output = '';
      let code = 0;
      // Límite de seguridad: en una app no puede haber bucles infinitos.
      for (let vuelta = 0; vuelta < 1000; vuelta++) {
        if (this.run(condicion).code !== 0) break;
        const r = this.run(cuerpo);
        output += r.output;
        code = r.code;
      }
      return { output, code };
    }

    return null;
  }

  runPipeline(pipeline) {
    let stdin = '';
    let output = '';
    let code = 0;
    let clear = false;

    for (let i = 0; i < pipeline.length; i++) {
      const cmd = pipeline[i];
      const isLast = i === pipeline.length - 1;
      const res = this.runCommand(cmd, stdin);
      code = res.code;
      if (res.clear) clear = true;
      if (res.stderr) output += res.stderr;
      if (isLast) {
        if (res.stdout) output += res.redirected ? '' : res.stdout;
      } else {
        // lo que viaja por un pipe es texto plano, sin marcas de color
        stdin = stripMarks(res.stdout);
      }
      if (res.stdout && isLast && res.redirected) stdin = '';
    }
    return { output, code, clear };
  }

  runCommand(cmd, stdin) {
    let argv = expandWords(cmd.words, this.ctx);
    const redirects = cmd.redirects.map((r) => ({
      ...r,
      value: expandWords([r.target], this.ctx)[0] ?? '',
      label: r.target.value,
    }));

    // asignaciones de variables sueltas: FOO=bar
    while (argv.length && /^[A-Za-z_]\w*=/.test(argv[0]) && cmd.words.length) {
      const [k, ...rest] = argv[0].split('=');
      this.env[k] = rest.join('=');
      argv = argv.slice(1);
      if (!argv.length) return { stdout: '', stderr: '', code: 0 };
    }
    if (!argv.length) return { stdout: '', stderr: '', code: 0 };

    // alias (una sola expansión, como bash sin recursión infinita)
    if (this.aliases.has(argv[0])) {
      const expansion = this.aliases.get(argv[0]);
      const extra = argv.slice(1);
      const sub = parse(expansion + (extra.length ? ' ' + extra.map(shellQuote).join(' ') : ''));
      if (sub.length === 1 && sub[0].pipeline.length === 1) {
        argv = expandWords(sub[0].pipeline[0].words, this.ctx);
      }
    }

    const name = argv[0];
    const args = argv.slice(1);

    // redirección de entrada
    let input = stdin;
    const inRedir = redirects.find((r) => r.op === '<');
    if (inRedir) {
      try {
        input = this.fs.readFile(this.resolve(inRedir.value), this.ctx);
      } catch (e) {
        return { stdout: '', stderr: `bash: ${inRedir.label}: ${fsMessage(e)}\n`, code: 1 };
      }
    }

    const fn = this.commands[name];
    if (!fn) {
      return { stdout: '', stderr: `bash: ${name}: command not found\n`, code: 127 };
    }

    let result;
    try {
      result = fn(args, this.ctx, input) || {};
    } catch (e) {
      if (e instanceof FSError) {
        result = { stderr: `${name}: ${e.path}: ${e.message}\n`, code: 1 };
      } else {
        result = { stderr: `${name}: ${e.message}\n`, code: 1 };
      }
    }

    let stdout = result.stdout || '';
    const stderr = result.stderr || '';
    const code = result.code != null ? result.code : 0;

    // Redirección de salida. `2>&1` no es un archivo: significa «manda stderr
    // al mismo destino que tenga stdout en este momento».
    let redirected = false;
    let stderrShown = stderr;
    const mergeStderr = redirects.some((r) => r.op === '2>' && !r.target.quoted && (r.value === '&1' || r.value === '&2'));
    const salidaAArchivo = redirects.some((r) => r.op === '>' || r.op === '>>');

    for (const r of redirects) {
      if (r.op === '2>' && !r.target.quoted && (r.value === '&1' || r.value === '&2')) {
        if (!salidaAArchivo) stdout += stderr;
        stderrShown = '';
        continue;
      }
      if (r.op === '>' || r.op === '>>' || r.op === '2>') {
        let payload = stripMarks(r.op === '2>' ? stderr : stdout);
        if (r.op !== '2>' && mergeStderr) {
          payload += stripMarks(stderr);
          stderrShown = '';
        }
        // /dev/null descarta todo lo que se le escriba.
        if (this.resolve(r.value) !== '/dev/null') {
          try {
            this.fs.writeFile(this.resolve(r.value), payload, this.ctx, { append: r.op === '>>' });
          } catch (e) {
            return { stdout: '', stderr: `bash: ${r.label}: ${fsMessage(e)}\n`, code: 1 };
          }
        }
        if (r.op !== '2>') redirected = true;
        else stderrShown = '';
      }
    }

    return { stdout, stderr: stderrShown, code, redirected, clear: result.clear };
  }
}

export function shellQuote(s) {
  return /[\s'"$*?|<>&;]/.test(s) ? `'${s.replace(/'/g, `'\\''`)}'` : s;
}

export function fsMessage(e) {
  return e && e.message ? e.message : String(e);
}

export { normalize, dirname, basename, joinPath, S_DIR };
