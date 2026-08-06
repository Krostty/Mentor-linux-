// Navegación: pwd, cd, ls, tree
import { modeString, S_DIR, S_LINK, joinPath, basename } from '../fs.js';
import { parseArgs, ok, err, fsErr, pad, padEnd, mark } from './util.js';

function sizeOf(node) {
  if (node.type === S_DIR) return 4096;
  if (node.type === S_LINK) return node.target.length;
  return node.content.length;
}

function humanSize(bytes) {
  const units = ['', 'K', 'M', 'G', 'T'];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u++;
  }
  const s = u === 0 ? String(n) : n < 10 ? n.toFixed(1) : String(Math.round(n));
  return s + units[u];
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// '2026-01-15 10:30' -> 'ene 15 10:30', como en un `ls -l` real en español.
function formatDate(mtime) {
  const m = String(mtime).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}:\d{2})/);
  if (!m) return String(mtime);
  return `${MESES[parseInt(m[2], 10) - 1]} ${m[3].replace(/^0/, ' ')} ${m[4]}`;
}

function colorize(name, node) {
  if (node.type === S_DIR) return mark('dir', name);
  if (node.type === S_LINK) return mark('link', name);
  if (node.mode & 0o111) return mark('exe', name);
  return name;
}

export const nav = {
  pwd: (args, ctx) => ok(ctx.cwd + '\n'),

  cd: (args, ctx) => {
    const target = args[0] || ctx.env.HOME;
    const path = target === '-' ? ctx.env.OLDPWD || ctx.cwd : ctx.shell.resolve(target);
    let node;
    try {
      node = ctx.fs.lookup(path, ctx);
    } catch (e) {
      return err(`cd: ${target}: ${e.message}`);
    }
    if (node.type !== S_DIR) return err(`cd: ${target}: Not a directory`);
    if (!ctx.fs.canExec(node, ctx.user, ctx.groups)) return err(`cd: ${target}: Permission denied`);
    ctx.env.OLDPWD = ctx.cwd;
    ctx.shell.cwd = path;
    ctx.env.PWD = path;
    return ok(target === '-' ? path + '\n' : '');
  },

  ls: (args, ctx) => {
    const { flags, operands, has } = parseArgs(args);
    const long = has('-l');
    const all = has('-a', '--all');
    const almostAll = has('-A');
    const human = has('-h');
    const dirOnly = has('-d');
    const reverse = has('-r');
    const byTime = has('-t');
    const bySize = has('-S');
    const recursive = has('-R');
    const one = has('-1');
    const classify = has('-F');
    const inode = has('-i');

    const targets = operands.length ? operands : ['.'];
    const out = [];
    const errs = [];
    const showHeaders = targets.length > 1 || recursive;

    const renderDir = (path, label) => {
      let entries;
      try {
        entries = ctx.fs.list(path, ctx);
      } catch (e) {
        errs.push(`ls: cannot open directory '${label}': ${e.message}`);
        return;
      }
      if (all) {
        const self = ctx.fs.lookup(path, ctx);
        let parent = self;
        try {
          parent = ctx.fs.lookup(joinPath(path, '..'), ctx);
        } catch {}
        entries = [{ name: '.', node: self }, { name: '..', node: parent }, ...entries];
      } else if (!almostAll) {
        entries = entries.filter((e) => !e.name.startsWith('.'));
      }
      if (byTime) entries.sort((a, b) => String(b.node.mtime).localeCompare(String(a.node.mtime)));
      if (bySize) entries.sort((a, b) => sizeOf(b.node) - sizeOf(a.node));
      if (reverse) entries.reverse();

      if (showHeaders) out.push(`${label}:`);
      out.push(...format(entries, path));
      if (showHeaders) out.push('');

      if (recursive) {
        for (const e of entries) {
          if (e.node.type === S_DIR && e.name !== '.' && e.name !== '..') {
            renderDir(joinPath(path, e.name), (label === '.' ? '.' : label) + '/' + e.name);
          }
        }
      }
    };

    const format = (entries, base) => {
      if (!entries.length) return [];
      if (long) {
        const total = entries.reduce((s, e) => s + Math.ceil(sizeOf(e.node) / 1024) * 4, 0);
        const rows = entries.map((e) => {
          const n = e.node;
          const size = human ? humanSize(sizeOf(n)) : String(sizeOf(n));
          let name = colorize(e.name, n);
          if (n.type === S_LINK) name += ` -> ${n.target}`;
          if (classify) name += n.type === S_DIR ? '/' : n.mode & 0o111 ? '*' : '';
          return [
            (inode ? pad(n.inode, 7) + ' ' : '') + modeString(n),
            pad(n.links, 1),
            padEnd(n.owner, 4),
            padEnd(n.group, 4),
            pad(size, 5),
            formatDate(n.mtime),
            name,
          ].join(' ');
        });
        return [`total ${total}`, ...rows];
      }
      const names = entries.map((e) => {
        let n = colorize(e.name, e.node);
        if (classify) n += e.node.type === S_DIR ? '/' : e.node.mode & 0o111 ? '*' : '';
        return n;
      });
      if (one) return names;
      // columnas: en móvil el ancho útil es pequeño, agrupamos de 2 en 2 si caben
      return [names.join('  ')];
    };

    for (const t of targets) {
      const path = ctx.shell.resolve(t);
      let node;
      try {
        // Como el ls real: un enlace se muestra como enlace (con su flecha),
        // salvo que apunte a una carpeta, en cuyo caso se lista su contenido.
        node = ctx.fs.lookup(path, ctx, { followFinal: false });
        if (node.type === S_LINK && !dirOnly) {
          let destino = null;
          try {
            destino = ctx.fs.lookup(path, ctx);
          } catch {}
          if (destino && destino.type === S_DIR) node = destino;
        }
      } catch (e) {
        errs.push(`ls: cannot access '${t}': ${e.message}`);
        continue;
      }
      if (node.type !== S_DIR || dirOnly) {
        out.push(...format([{ name: t, node }], '.'));
      } else {
        renderDir(path, t);
      }
    }
    while (out.length && out[out.length - 1] === '') out.pop();
    return {
      stdout: out.length ? out.join('\n') + '\n' : '',
      stderr: errs.length ? errs.join('\n') + '\n' : '',
      code: errs.length ? 2 : 0,
    };
  },

  tree: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    const all = has('-a');
    const dirsOnly = has('-d');
    const root = ctx.shell.resolve(operands[0] || '.');
    let dirs = 0;
    let files = 0;
    const out = [operands[0] || '.'];

    const walk = (path, prefix) => {
      let entries;
      try {
        entries = ctx.fs.list(path, ctx);
      } catch {
        return;
      }
      if (!all) entries = entries.filter((e) => !e.name.startsWith('.'));
      if (dirsOnly) entries = entries.filter((e) => e.node.type === S_DIR);
      entries.forEach((e, i) => {
        const last = i === entries.length - 1;
        out.push(prefix + (last ? '└── ' : '├── ') + colorize(e.name, e.node));
        if (e.node.type === S_DIR) {
          dirs++;
          walk(joinPath(path, e.name), prefix + (last ? '    ' : '│   '));
        } else files++;
      });
    };

    try {
      const node = ctx.fs.lookup(root, ctx);
      if (node.type !== S_DIR) return err(`tree: ${operands[0]}: Not a directory`);
    } catch (e) {
      return fsErr('tree', operands[0] || '.', e);
    }
    walk(root, '');
    out.push('', `${dirs} directories, ${files} files`);
    return ok(out.join('\n') + '\n');
  },
};

export { humanSize, sizeOf };
