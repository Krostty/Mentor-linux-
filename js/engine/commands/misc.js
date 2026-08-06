// Varios: find, xargs, tar, gzip, history, alias, env, export, man, date, cal,
// clear, seq, basename, dirname, test, bash, exit, help, locate, watch, yes
import { S_DIR, S_FILE, S_LINK, joinPath, basename as pathBase, dirname as pathDir, modeString } from '../fs.js';
import { parseArgs, ok, err, lines, withNewline, padEnd } from './util.js';
import { sizeOf } from './nav.js';

function walk(ctx, start, label, fn) {
  let node;
  try {
    node = ctx.fs.lookup(start, ctx, { followFinal: false });
  } catch (e) {
    return e;
  }
  fn(node, label, 0);
  const rec = (n, path, lbl, depth) => {
    if (n.type !== S_DIR) return;
    if (!ctx.fs.canRead(n, ctx.user, ctx.groups)) return;
    for (const [name, child] of n.children) {
      const childLabel = lbl === '/' ? '/' + name : lbl + '/' + name;
      fn(child, childLabel, depth + 1);
      rec(child, joinPath(path, name), childLabel, depth + 1);
    }
  };
  rec(node, start, label, 0);
  return null;
}

function nameMatches(pattern, name, insensitive) {
  let re = '^';
  for (const c of pattern) {
    if (c === '*') re += '.*';
    else if (c === '?') re += '.';
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(re + '$', insensitive ? 'i' : '').test(name);
}

export const misc = {
  find: (args, ctx) => {
    const paths = [];
    const tests = [];
    let action = 'print';
    let execCmd = null;
    let maxdepth = Infinity;
    let i = 0;
    while (i < args.length && !args[i].startsWith('-')) paths.push(args[i++]);
    if (!paths.length) paths.push('.');
    for (; i < args.length; i++) {
      const a = args[i];
      switch (a) {
        case '-name': tests.push({ k: 'name', v: args[++i] }); break;
        case '-iname': tests.push({ k: 'iname', v: args[++i] }); break;
        case '-type': tests.push({ k: 'type', v: args[++i] }); break;
        case '-size': tests.push({ k: 'size', v: args[++i] }); break;
        case '-perm': tests.push({ k: 'perm', v: args[++i] }); break;
        case '-user': tests.push({ k: 'user', v: args[++i] }); break;
        case '-group': tests.push({ k: 'group', v: args[++i] }); break;
        case '-empty': tests.push({ k: 'empty' }); break;
        case '-maxdepth': maxdepth = parseInt(args[++i], 10); break;
        case '-mindepth': tests.push({ k: 'mindepth', v: parseInt(args[++i], 10) }); break;
        case '-delete': action = 'delete'; break;
        case '-print': action = 'print'; break;
        case '-ls': action = 'ls'; break;
        case '-exec':
        case '-execdir': {
          action = 'exec';
          execCmd = [];
          while (++i < args.length && args[i] !== ';' && args[i] !== '\\;') execCmd.push(args[i]);
          break;
        }
        default:
          if (a.startsWith('-')) return err(`find: unknown predicate '${a}'`);
      }
    }

    const out = [];
    const toDelete = [];
    let errs = '';

    for (const p of paths) {
      const start = ctx.shell.resolve(p);
      const label = p === '/' ? '' : p.replace(/\/$/, '');
      const e = walk(ctx, start, label || '/', (node, lbl, depth) => {
        if (depth > maxdepth) return;
        const name = pathBase(lbl) === '/' ? '/' : lbl.split('/').pop() || lbl;
        for (const t of tests) {
          if (t.k === 'name' && !nameMatches(t.v, name, false)) return;
          if (t.k === 'iname' && !nameMatches(t.v, name, true)) return;
          if (t.k === 'type') {
            const want = t.v === 'd' ? S_DIR : t.v === 'l' ? S_LINK : S_FILE;
            if (node.type !== want) return;
          }
          if (t.k === 'user' && node.owner !== t.v) return;
          if (t.k === 'group' && node.group !== t.v) return;
          if (t.k === 'mindepth' && depth < t.v) return;
          if (t.k === 'empty') {
            if (node.type === S_DIR ? node.children.size > 0 : node.content !== '') return;
          }
          if (t.k === 'perm') {
            const spec = t.v.replace(/^[-\/]/, '');
            const want = parseInt(spec, 8);
            if (t.v.startsWith('-')) {
              if ((node.mode & want) !== want) return;
            } else if (t.v.startsWith('/')) {
              if ((node.mode & want) === 0) return;
            } else if ((node.mode & 0o777) !== want) return;
          }
          if (t.k === 'size') {
            const m = t.v.match(/^([+-]?)(\d+)([ckMG]?)$/);
            if (!m) return;
            const mult = m[3] === 'c' ? 1 : m[3] === 'M' ? 1048576 : m[3] === 'G' ? 1073741824 : 512;
            const want = parseInt(m[2], 10) * mult;
            const actual = sizeOf(node);
            if (m[1] === '+' && !(actual > want)) return;
            if (m[1] === '-' && !(actual < want)) return;
            if (m[1] === '' && !(Math.ceil(actual / mult) === parseInt(m[2], 10))) return;
          }
        }
        if (action === 'delete') toDelete.push(lbl);
        else if (action === 'ls') out.push(`${node.inode} ${modeString(node)} ${node.owner} ${sizeOf(node)} ${lbl}`);
        else out.push(lbl);
      });
      if (e) errs += `find: '${p}': ${e.message}\n`;
    }

    if (action === 'delete') {
      for (const p of toDelete.reverse()) {
        try {
          ctx.fs.unlink(ctx.shell.resolve(p), ctx, { recursive: true });
        } catch (e) {
          errs += `find: cannot delete '${p}': ${e.message}\n`;
        }
      }
      return errs ? { stderr: errs, code: 1 } : ok();
    }

    if (action === 'exec' && execCmd) {
      let stdout = '';
      for (const p of out) {
        const argv = execCmd.map((a) => (a === '{}' ? p : a));
        const fn = ctx.shell.commands[argv[0]];
        if (!fn) {
          errs += `find: '${argv[0]}': No such file or directory\n`;
          break;
        }
        const r = fn(argv.slice(1), ctx, '') || {};
        stdout += r.stdout || '';
        errs += r.stderr || '';
      }
      return { stdout, stderr: errs, code: errs ? 1 : 0 };
    }

    return { stdout: withNewline(out.join('\n')), stderr: errs, code: errs ? 1 : 0 };
  },

  locate: (args, ctx) => {
    const pattern = args[0] || '';
    const out = [];
    walk(ctx, '/', '', (node, lbl) => {
      if (lbl.includes(pattern)) out.push(lbl || '/');
    });
    return { stdout: withNewline(out.slice(0, 60).join('\n')), code: out.length ? 0 : 1 };
  },

  xargs: (args, ctx, stdin) => {
    const { operands, values, has } = parseArgs(args, { withValue: ['n', 'I'] });
    const items = stdin.split(/\s+/).filter(Boolean);
    if (!items.length) return ok('');
    const base = operands.length ? operands : ['echo'];
    const fn = ctx.shell.commands[base[0]];
    if (!fn) return err(`xargs: ${base[0]}: No such file or directory`, 127);
    let stdout = '';
    let errs = '';
    const placeholder = values.I;
    const perCall = placeholder ? 1 : values.n ? parseInt(values.n, 10) : items.length;
    for (let i = 0; i < items.length; i += perCall) {
      const chunk = items.slice(i, i + perCall);
      const argv = placeholder
        ? base.slice(1).map((a) => a.split(placeholder).join(chunk[0]))
        : [...base.slice(1), ...chunk];
      const r = fn(argv, ctx, '') || {};
      stdout += r.stdout || '';
      errs += r.stderr || '';
    }
    return { stdout, stderr: errs, code: errs ? 1 : 0 };
  },

  tar: (args, ctx) => {
    const { operands, values, has } = parseArgs(args, { withValue: ['f'] });
    const joined = args.filter((a) => a.startsWith('-') || !a.includes('.')).join('');
    const create = joined.includes('c');
    const extract = joined.includes('x');
    const list = joined.includes('t');
    const verbose = joined.includes('v');
    const archive = values.f || operands.find((o) => /\.(tar|tgz|tar\.gz)$/.test(o));
    if (!archive) return err('tar: Refusing to write archive contents to terminal', 2);
    const sources = operands.filter((o) => o !== archive);

    if (create) {
      const entries = [];
      for (const s of sources) {
        const e = walk(ctx, ctx.shell.resolve(s), s, (node, lbl) => {
          entries.push({ path: lbl, type: node.type, content: node.type === S_FILE ? node.content : '', mode: node.mode });
        });
        if (e) return err(`tar: ${s}: Cannot stat: ${e.message}`, 2);
      }
      ctx.fs.writeFile(ctx.shell.resolve(archive), ' TAR' + JSON.stringify(entries), ctx);
      return ok(verbose ? entries.map((e) => e.path + (e.type === S_DIR ? '/' : '')).join('\n') + '\n' : '');
    }

    let payload;
    try {
      payload = ctx.fs.readFile(ctx.shell.resolve(archive), ctx);
    } catch (e) {
      return err(`tar: ${archive}: Cannot open: ${e.message}\ntar: Error is not recoverable: exiting now`, 2);
    }
    if (!payload.startsWith(' TAR')) return err(`tar: This does not look like a tar archive`, 2);
    const entries = JSON.parse(payload.slice(4));

    if (list) return ok(entries.map((e) => e.path + (e.type === S_DIR ? '/' : '')).join('\n') + '\n');

    if (extract) {
      for (const e of entries) {
        const target = ctx.shell.resolve(e.path);
        try {
          if (e.type === S_DIR) ctx.fs.mkdir(target, ctx, { parents: true });
          else {
            ctx.fs.mkdir(pathDir(target), ctx, { parents: true });
            ctx.fs.writeFile(target, e.content, ctx, { mode: e.mode });
          }
        } catch {}
      }
      return ok(verbose ? entries.map((e) => e.path).join('\n') + '\n' : '');
    }
    return err('tar: You must specify one of the -Acdtrux options', 2);
  },

  gzip: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    if (has('-d', '--decompress')) return misc.gunzip(operands, ctx);
    let errs = '';
    for (const t of operands) {
      const path = ctx.shell.resolve(t);
      try {
        const content = ctx.fs.readFile(path, ctx);
        ctx.fs.writeFile(path + '.gz', ' GZ' + content, ctx);
        ctx.fs.unlink(path, ctx);
      } catch (e) {
        errs += `gzip: ${t}: ${e.message}\n`;
      }
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  gunzip: (args, ctx) => {
    const { operands } = parseArgs(args);
    let errs = '';
    for (const t of operands) {
      const path = ctx.shell.resolve(t);
      try {
        const content = ctx.fs.readFile(path, ctx);
        if (!content.startsWith(' GZ')) {
          errs += `gunzip: ${t}: not in gzip format\n`;
          continue;
        }
        ctx.fs.writeFile(path.replace(/\.gz$/, ''), content.slice(3), ctx);
        ctx.fs.unlink(path, ctx);
      } catch (e) {
        errs += `gunzip: ${t}: ${e.message}\n`;
      }
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  zip: (args, ctx) => misc.tar(['-czf', ...args], ctx),

  history: (args, ctx) => {
    const h = ctx.shell.history;
    const n = args[0] && /^\d+$/.test(args[0]) ? parseInt(args[0], 10) : h.length;
    const start = Math.max(0, h.length - n);
    return ok(h.slice(start).map((c, i) => String(start + i + 1).padStart(5) + '  ' + c).join('\n') + (h.length ? '\n' : ''));
  },

  alias: (args, ctx) => {
    if (!args.length) {
      const all = [...ctx.shell.aliases.entries()].map(([k, v]) => `alias ${k}='${v}'`);
      return ok(all.join('\n') + (all.length ? '\n' : ''));
    }
    const joined = args.join(' ');
    const m = joined.match(/^(\w+)=(.*)$/);
    if (!m) {
      const v = ctx.shell.aliases.get(joined);
      return v ? ok(`alias ${joined}='${v}'\n`) : err(`bash: alias: ${joined}: not found`, 1);
    }
    ctx.shell.aliases.set(m[1], m[2].replace(/^['"]|['"]$/g, ''));
    return ok();
  },

  unalias: (args, ctx) => {
    for (const a of args) ctx.shell.aliases.delete(a);
    return ok();
  },

  env: (args, ctx) =>
    ok(
      Object.entries(ctx.env)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n') + '\n'
    ),

  printenv: (args, ctx) => {
    if (!args.length) return misc.env(args, ctx);
    const v = ctx.env[args[0]];
    return v != null ? ok(v + '\n') : { stdout: '', code: 1 };
  },

  export: (args, ctx) => {
    if (!args.length) return misc.env(args, ctx);
    for (const a of args) {
      const m = a.match(/^(\w+)=(.*)$/);
      if (m) ctx.env[m[1]] = m[2];
    }
    return ok();
  },

  unset: (args, ctx) => {
    for (const a of args) delete ctx.env[a];
    return ok();
  },

  set: (args, ctx) => misc.env(args, ctx),

  source: (args, ctx) => {
    const t = args[0];
    if (!t) return err('bash: source: filename argument required', 2);
    try {
      const script = ctx.fs.readFile(ctx.shell.resolve(t), ctx);
      let out = '';
      for (const line of lines(script)) {
        if (!line.trim() || line.trim().startsWith('#')) continue;
        out += ctx.shell.run(line).output;
      }
      return ok(out);
    } catch (e) {
      return err(`bash: ${t}: ${e.message}`, 1);
    }
  },

  bash: (args, ctx) => {
    const { operands, values } = parseArgs(args, { withValue: ['c'] });
    if (values.c) return ok(ctx.shell.run(values.c).output);
    if (!operands.length) return ok('');
    return misc.source(operands, ctx);
  },

  sh: (args, ctx) => misc.bash(args, ctx),

  date: (args, ctx) => {
    const now = ctx.now || '2026-01-15 10:31';
    if (args[0] && args[0].startsWith('+')) {
      const fmt = args[0].slice(1);
      const [d, t] = now.split(' ');
      const [Y, M, D] = d.split('-');
      const [H, Mi] = t.split(':');
      return ok(
        fmt
          .replace(/%Y/g, Y)
          .replace(/%m/g, M)
          .replace(/%d/g, D)
          .replace(/%H/g, H)
          .replace(/%M/g, Mi)
          .replace(/%S/g, '44')
          .replace(/%F/g, d)
          .replace(/%T/g, t + ':44') + '\n'
      );
    }
    return ok('mié ene 15 10:31:44 CET 2026\n');
  },

  cal: () =>
    ok(
      '     enero 2026     \n' +
        'lu ma mi ju vi sá do\n' +
        '          1  2  3  4\n' +
        ' 5  6  7  8  9 10 11\n' +
        '12 13 14 15 16 17 18\n' +
        '19 20 21 22 23 24 25\n' +
        '26 27 28 29 30 31\n'
    ),

  seq: (args) => {
    const nums = args.map(Number).filter((n) => !isNaN(n));
    let from = 1;
    let step = 1;
    let to;
    if (nums.length === 1) to = nums[0];
    else if (nums.length === 2) [from, to] = nums;
    else if (nums.length >= 3) [from, step, to] = nums;
    else return err('seq: missing operand');
    const out = [];
    if (step > 0) for (let i = from; i <= to; i += step) out.push(i);
    else for (let i = from; i >= to; i += step) out.push(i);
    return ok(out.join('\n') + (out.length ? '\n' : ''));
  },

  basename: (args) => {
    if (!args.length) return err('basename: missing operand');
    let b = pathBase(args[0]);
    if (args[1] && b.endsWith(args[1])) b = b.slice(0, -args[1].length);
    return ok(b + '\n');
  },

  dirname: (args) => (args.length ? ok(pathDir(args[0]) + '\n') : err('dirname: missing operand')),

  realpath: (args, ctx) => (args.length ? ok(ctx.shell.resolve(args[0]) + '\n') : err('realpath: missing operand')),

  readlink: (args, ctx) => {
    try {
      const node = ctx.fs.lookup(ctx.shell.resolve(args[0]), ctx, { followFinal: false });
      if (node.type !== S_LINK) return { stdout: '', code: 1 };
      return ok(node.target + '\n');
    } catch {
      return { stdout: '', code: 1 };
    }
  },

  test: (args, ctx) => {
    const a = args[0] === '[' ? args.slice(1, -1) : args;
    const [flag, target] = a;
    const path = target ? ctx.shell.resolve(target) : null;
    let node = null;
    try {
      node = path ? ctx.fs.lookup(path, ctx, { followFinal: false }) : null;
    } catch {}
    const map = {
      '-e': () => !!node,
      '-f': () => node && node.type === S_FILE,
      '-d': () => node && node.type === S_DIR,
      '-L': () => node && node.type === S_LINK,
      '-r': () => node && ctx.fs.canRead(node, ctx.user, ctx.groups),
      '-w': () => node && ctx.fs.canWrite(node, ctx.user, ctx.groups),
      '-x': () => node && (node.mode & 0o111) !== 0,
      '-s': () => node && sizeOf(node) > 0,
      '-z': () => !a[1],
      '-n': () => !!a[1],
    };
    if (map[flag]) return { stdout: '', code: map[flag]() ? 0 : 1 };
    if (a[1] === '=' || a[1] === '==') return { stdout: '', code: a[0] === a[2] ? 0 : 1 };
    if (a[1] === '!=') return { stdout: '', code: a[0] !== a[2] ? 0 : 1 };
    if (a[1] === '-eq') return { stdout: '', code: Number(a[0]) === Number(a[2]) ? 0 : 1 };
    if (a[1] === '-ne') return { stdout: '', code: Number(a[0]) !== Number(a[2]) ? 0 : 1 };
    if (a[1] === '-gt') return { stdout: '', code: Number(a[0]) > Number(a[2]) ? 0 : 1 };
    if (a[1] === '-lt') return { stdout: '', code: Number(a[0]) < Number(a[2]) ? 0 : 1 };
    return { stdout: '', code: 1 };
  },

  '[': (args, ctx) => misc.test(['[', ...args], ctx),

  true: () => ok(''),
  false: () => ({ stdout: '', code: 1 }),
  clear: () => ({ stdout: '', code: 0, clear: true }),
  exit: () => ok(''),
  watch: (args, ctx) => {
    const fn = ctx.shell.commands[args[0]];
    if (!fn) return err(`watch: ${args[0]}: command not found`, 127);
    return fn(args.slice(1), ctx, '');
  },
  yes: (args) => ok(((args[0] || 'y') + '\n').repeat(5)),

  man: (args, ctx) => {
    const name = args[0];
    if (!name) return err('What manual page do you want?', 1);
    const page = ctx.shell.manPages && ctx.shell.manPages[name];
    if (!page) return err(`No manual entry for ${name}`, 16);
    return ok(page);
  },

  help: (args, ctx) => {
    const names = Object.keys(ctx.shell.commands).sort();
    const out = [];
    for (let i = 0; i < names.length; i += 4) out.push(names.slice(i, i + 4).map((n) => padEnd(n, 14)).join(''));
    return ok('Comandos disponibles en Mentor Linux:\n\n' + out.join('\n') + '\n');
  },
};
