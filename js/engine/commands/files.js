// Archivos: cat, echo, touch, mkdir, rmdir, rm, cp, mv, ln, head, tail, wc, file, stat, du, df
import { makeNode, S_DIR, S_FILE, S_LINK, joinPath, basename, dirname, modeString } from '../fs.js';
import { parseArgs, ok, err, fsErr, lines, withNewline, pad, padEnd } from './util.js';
import { humanSize, sizeOf } from './nav.js';

export const files = {
  cat: (args, ctx, stdin) => {
    const { operands, has } = parseArgs(args);
    const number = has('-n');
    const showEnds = has('-E');
    let out = '';
    let errs = '';
    let code = 0;
    const sources = operands.length ? operands : ['-'];
    for (const t of sources) {
      if (t === '-') {
        out += stdin;
        continue;
      }
      try {
        out += ctx.fs.readFile(ctx.shell.resolve(t), ctx);
      } catch (e) {
        errs += `cat: ${t}: ${e.message}\n`;
        code = 1;
      }
    }
    if (showEnds) out = lines(out).map((l) => l + '$').join('\n') + (out ? '\n' : '');
    if (number) {
      out = lines(out)
        .map((l, i) => pad(i + 1, 6) + '\t' + l)
        .join('\n') + (out ? '\n' : '');
    }
    return { stdout: out, stderr: errs, code };
  },

  echo: (args, ctx) => {
    const noNewline = args[0] === '-n';
    const rest = noNewline ? args.slice(1) : args;
    const interpret = rest[0] === '-e';
    let text = (interpret ? rest.slice(1) : rest).join(' ');
    if (interpret) text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    return ok(text + (noNewline ? '' : '\n'));
  },

  printf: (args, ctx) => {
    const [formato, ...resto] = args;
    if (formato == null) return err('printf: usage: printf format [arguments]');
    let i = 0;
    const texto = formato
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\')
      .replace(/%[sd]/g, () => (resto[i] != null ? resto[i++] : ''))
      .replace(/%%/g, '%');
    return ok(texto);
  },

  touch: (args, ctx) => {
    const { operands } = parseArgs(args);
    if (!operands.length) return err('touch: missing file operand');
    let errs = '';
    for (const t of operands) {
      const path = ctx.shell.resolve(t);
      try {
        if (ctx.fs.exists(path, ctx)) {
          ctx.fs.lookup(path, ctx).mtime = ctx.now;
        } else {
          ctx.fs.writeFile(path, '', ctx);
        }
      } catch (e) {
        errs += `touch: cannot touch '${t}': ${e.message}\n`;
      }
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  mkdir: (args, ctx) => {
    const { operands, values, has } = parseArgs(args, { withValue: ['m'] });
    if (!operands.length) return err('mkdir: missing operand');
    const mode = values.m ? parseInt(values.m, 8) : undefined;
    let errs = '';
    for (const t of operands) {
      try {
        ctx.fs.mkdir(ctx.shell.resolve(t), ctx, { parents: has('-p', '--parents'), mode });
      } catch (e) {
        if (has('-p', '--parents') && e.code === 'EEXIST') continue;
        errs += `mkdir: cannot create directory '${t}': ${e.message}\n`;
      }
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  rmdir: (args, ctx) => {
    const { operands } = parseArgs(args);
    if (!operands.length) return err('rmdir: missing operand');
    let errs = '';
    for (const t of operands) {
      try {
        ctx.fs.unlink(ctx.shell.resolve(t), ctx, { dirOk: true });
      } catch (e) {
        errs += `rmdir: failed to remove '${t}': ${e.message}\n`;
      }
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  rm: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    const recursive = has('-r', '-R', '--recursive');
    const force = has('-f', '--force');
    const verbose = has('-v');
    if (!operands.length) return force ? ok() : err('rm: missing operand');
    let errs = '';
    let out = '';
    for (const t of operands) {
      const path = ctx.shell.resolve(t);
      try {
        const node = ctx.fs.lookup(path, ctx, { followFinal: false });
        if (node.type === S_DIR && !recursive) {
          errs += `rm: cannot remove '${t}': Is a directory\n`;
          continue;
        }
        ctx.fs.unlink(path, ctx, { recursive });
        if (verbose) out += `removed '${t}'\n`;
      } catch (e) {
        if (!force) errs += `rm: cannot remove '${t}': ${e.message}\n`;
      }
    }
    return { stdout: out, stderr: errs, code: errs ? 1 : 0 };
  },

  cp: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    const recursive = has('-r', '-R', '-a', '--recursive');
    if (operands.length < 2) return err('cp: missing destination file operand');
    const dest = operands.pop();
    const destPath = ctx.shell.resolve(dest);
    const destIsDir = ctx.fs.exists(destPath, ctx) && ctx.fs.lookup(destPath, ctx).type === S_DIR;
    if (operands.length > 1 && !destIsDir) return err(`cp: target '${dest}' is not a directory`);
    let errs = '';
    for (const src of operands) {
      const srcPath = ctx.shell.resolve(src);
      try {
        const node = ctx.fs.lookup(srcPath, ctx);
        if (node.type === S_DIR && !recursive) {
          errs += `cp: -r not specified; omitting directory '${src}'\n`;
          continue;
        }
        if (!ctx.fs.canRead(node, ctx.user, ctx.groups)) {
          errs += `cp: cannot open '${src}' for reading: Permission denied\n`;
          continue;
        }
        const target = destIsDir ? joinPath(destPath, basename(srcPath)) : destPath;
        const copy = ctx.fs.cloneNode(node, ctx);
        copy.mode = node.mode;
        ctx.fs.link(target, copy, ctx);
      } catch (e) {
        errs += `cp: cannot stat '${src}': ${e.message}\n`;
      }
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  mv: (args, ctx) => {
    const { operands } = parseArgs(args);
    if (operands.length < 2) return err('mv: missing destination file operand');
    const dest = operands.pop();
    const destPath = ctx.shell.resolve(dest);
    const destIsDir = ctx.fs.exists(destPath, ctx) && ctx.fs.lookup(destPath, ctx).type === S_DIR;
    let errs = '';
    for (const src of operands) {
      const srcPath = ctx.shell.resolve(src);
      try {
        const node = ctx.fs.lookup(srcPath, ctx, { followFinal: false });
        const target = destIsDir ? joinPath(destPath, basename(srcPath)) : destPath;
        ctx.fs.link(target, node, ctx);
        ctx.fs.unlink(srcPath, ctx, { recursive: true });
      } catch (e) {
        errs += `mv: cannot move '${src}': ${e.message}\n`;
      }
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  ln: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    if (operands.length < 1) return err('ln: missing file operand');
    const [src, dst] = operands;
    const target = dst || basename(src);
    const destPath = ctx.shell.resolve(target);
    try {
      if (has('-s', '--symbolic')) {
        ctx.fs.link(destPath, makeNode(S_LINK, { target: src, owner: ctx.user, group: ctx.user, mtime: ctx.now }), ctx);
      } else {
        const node = ctx.fs.lookup(ctx.shell.resolve(src), ctx);
        if (node.type === S_DIR) return err(`ln: ${src}: hard link not allowed for directory`);
        node.links++;
        ctx.fs.link(destPath, node, ctx);
      }
    } catch (e) {
      return fsErr('ln', src, e);
    }
    return ok();
  },

  head: (args, ctx, stdin) => {
    const { operands, values } = parseArgs(args, { withValue: ['n', 'c'] });
    const n = parseInt(values.n || values['#'] || '10', 10);
    return headTail(operands, ctx, stdin, 'head', (ls) => ls.slice(0, n));
  },

  tail: (args, ctx, stdin) => {
    const { operands, values } = parseArgs(args, { withValue: ['n', 'c'] });
    const raw = values.n || values['#'] || '10';
    const fromStart = String(raw).startsWith('+');
    const n = parseInt(String(raw).replace('+', ''), 10);
    return headTail(operands, ctx, stdin, 'tail', (ls) => (fromStart ? ls.slice(n - 1) : ls.slice(-n)));
  },

  wc: (args, ctx, stdin) => {
    const { operands, has } = parseArgs(args);
    const only = has('-l') || has('-w') || has('-c') || has('-m');
    const fmt = (text, name) => {
      const l = text === '' ? 0 : text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
      const w = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
      const c = text.length;
      const parts = [];
      if (!only || has('-l')) parts.push(pad(l, only ? 0 : 7));
      if (!only || has('-w')) parts.push(pad(w, only ? 0 : 7));
      if (!only || has('-c') || has('-m')) parts.push(pad(c, only ? 0 : 7));
      return parts.join(only ? ' ' : '') + (name ? ' ' + name : '');
    };
    if (!operands.length) return ok(fmt(stdin, '') + '\n');
    let out = '';
    let errs = '';
    for (const t of operands) {
      try {
        out += fmt(ctx.fs.readFile(ctx.shell.resolve(t), ctx), t) + '\n';
      } catch (e) {
        errs += `wc: ${t}: ${e.message}\n`;
      }
    }
    return { stdout: out, stderr: errs, code: errs ? 1 : 0 };
  },

  file: (args, ctx) => {
    const { operands } = parseArgs(args);
    let out = '';
    for (const t of operands) {
      try {
        const node = ctx.fs.lookup(ctx.shell.resolve(t), ctx, { followFinal: false });
        let desc;
        if (node.type === S_DIR) desc = 'directory';
        else if (node.type === S_LINK) desc = `symbolic link to ${node.target}`;
        else if (node.content.startsWith('#!')) desc = `${node.content.split('\n')[0].includes('bash') ? 'Bourne-Again shell script' : 'script'}, ASCII text executable`;
        else if (node.content === '') desc = 'empty';
        else desc = 'ASCII text';
        out += `${t}: ${desc}\n`;
      } catch (e) {
        out += `${t}: cannot open (${e.message})\n`;
      }
    }
    return ok(out);
  },

  stat: (args, ctx) => {
    const { operands } = parseArgs(args);
    let out = '';
    let errs = '';
    for (const t of operands) {
      try {
        const node = ctx.fs.lookup(ctx.shell.resolve(t), ctx, { followFinal: false });
        const octal = (node.mode & 0o777).toString(8).padStart(4, '0');
        out +=
          `  File: ${t}\n` +
          `  Size: ${sizeOf(node)}\tBlocks: 8\tIO Block: 4096   ${node.type === S_DIR ? 'directory' : node.type === S_LINK ? 'symbolic link' : 'regular file'}\n` +
          `Device: 8,1\tInode: ${node.inode}\tLinks: ${node.links}\n` +
          `Access: (${octal}/${modeString(node)})  Uid: ( 1000/${padEnd(node.owner, 8)})   Gid: ( 1000/${padEnd(node.group, 8)})\n` +
          `Modify: ${node.mtime}\n`;
      } catch (e) {
        errs += `stat: cannot statx '${t}': ${e.message}\n`;
      }
    }
    return { stdout: out, stderr: errs, code: errs ? 1 : 0 };
  },

  du: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    const human = has('-h');
    const summary = has('-s');
    const root = ctx.shell.resolve(operands[0] || '.');
    const label = operands[0] || '.';
    const out = [];
    const walk = (path, name) => {
      let total = 0;
      let node;
      try {
        node = ctx.fs.lookup(path, ctx);
      } catch (e) {
        return 0;
      }
      if (node.type === S_DIR) {
        total = 4;
        for (const [child, cn] of node.children) {
          total += walk(joinPath(path, child), name === '.' ? './' + child : name + '/' + child);
        }
        if (!summary) out.push(`${human ? humanSize(total * 1024) : total}\t${name}`);
      } else {
        total = Math.max(4, Math.ceil(sizeOf(node) / 1024) * 4);
      }
      return total;
    };
    const total = walk(root, label);
    if (summary) out.push(`${human ? humanSize(total * 1024) : total}\t${label}`);
    else out.push(`${human ? humanSize(total * 1024) : total}\t${label}`);
    return ok(out.join('\n') + '\n');
  },

  df: (args, ctx) => {
    const human = args.includes('-h');
    const rows = [
      ['Filesystem', 'Size', 'Used', 'Avail', 'Use%', 'Mounted on'],
      ['/dev/sda1', human ? '20G' : '20971520', human ? '8.4G' : '8808038', human ? '11G' : '11534336', '44%', '/'],
      ['tmpfs', human ? '2.0G' : '2097152', '0', human ? '2.0G' : '2097152', '0%', '/dev/shm'],
      ['/dev/sda2', human ? '50G' : '52428800', human ? '12G' : '12582912', human ? '38G' : '39845888', '24%', '/home'],
    ];
    return ok(
      rows
        .map((r) => padEnd(r[0], 15) + pad(r[1], 9) + pad(r[2], 9) + pad(r[3], 9) + pad(r[4], 6) + ' ' + r[5])
        .join('\n') + '\n'
    );
  },
};

function headTail(operands, ctx, stdin, name, pick) {
  if (!operands.length) return ok(withNewline(pick(lines(stdin)).join('\n')));
  let out = '';
  let errs = '';
  const many = operands.length > 1;
  for (const t of operands) {
    try {
      const text = ctx.fs.readFile(ctx.shell.resolve(t), ctx);
      if (many) out += `==> ${t} <==\n`;
      out += withNewline(pick(lines(text)).join('\n'));
      if (many) out += '\n';
    } catch (e) {
      errs += `${name}: cannot open '${t}' for reading: ${e.message}\n`;
    }
  }
  return { stdout: out, stderr: errs, code: errs ? 1 : 0 };
}
