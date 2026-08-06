// Filesystem virtual en memoria.
// Modela lo justo de un FS POSIX para que los comandos y los retos se comporten
// como en Linux de verdad: tipos de nodo, permisos octales, dueño/grupo y symlinks.

export const S_DIR = 'dir';
export const S_FILE = 'file';
export const S_LINK = 'link';

let nextInode = 1;

export function makeNode(type, opts = {}) {
  const node = {
    inode: nextInode++,
    type,
    // Los enlaces simbólicos siempre son lrwxrwxrwx: los permisos que cuentan
    // son los del archivo al que apuntan.
    mode: opts.mode != null ? opts.mode : type === S_DIR ? 0o755 : type === S_LINK ? 0o777 : 0o644,
    owner: opts.owner || 'root',
    group: opts.group || 'root',
    mtime: opts.mtime || '2026-01-15 10:30',
    links: 1,
  };
  if (type === S_DIR) node.children = new Map();
  else if (type === S_FILE) node.content = opts.content != null ? opts.content : '';
  else if (type === S_LINK) node.target = opts.target || '/';
  return node;
}

export class FSError extends Error {
  constructor(code, path, message) {
    super(message);
    this.code = code;
    this.path = path;
  }
}

const ENOENT = (p) => new FSError('ENOENT', p, 'No such file or directory');
const ENOTDIR = (p) => new FSError('ENOTDIR', p, 'Not a directory');
const EISDIR = (p) => new FSError('EISDIR', p, 'Is a directory');
const EACCES = (p) => new FSError('EACCES', p, 'Permission denied');
const EEXIST = (p) => new FSError('EEXIST', p, 'File exists');
const ENOTEMPTY = (p) => new FSError('ENOTEMPTY', p, 'Directory not empty');

// --- utilidades de rutas -----------------------------------------------

export function normalize(path) {
  const absolute = path.startsWith('/');
  const parts = [];
  for (const seg of path.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (parts.length && parts[parts.length - 1] !== '..') parts.pop();
      else if (!absolute) parts.push('..');
      continue;
    }
    parts.push(seg);
  }
  const joined = parts.join('/');
  if (absolute) return '/' + joined;
  return joined || '.';
}

export function joinPath(base, path) {
  if (path.startsWith('/')) return normalize(path);
  return normalize((base === '/' ? '' : base) + '/' + path);
}

export function dirname(path) {
  const norm = normalize(path);
  if (norm === '/') return '/';
  const idx = norm.lastIndexOf('/');
  if (idx < 0) return '.';
  if (idx === 0) return '/';
  return norm.slice(0, idx);
}

export function basename(path) {
  const norm = normalize(path);
  if (norm === '/') return '/';
  const idx = norm.lastIndexOf('/');
  return idx < 0 ? norm : norm.slice(idx + 1);
}

// --- filesystem ---------------------------------------------------------

export class FileSystem {
  constructor(root) {
    this.root = root || makeNode(S_DIR, { mode: 0o755 });
  }

  // Devuelve el nodo en `path`. Sigue symlinks salvo que followFinal sea false.
  // Se llama como lookup(ruta, ctx) o lookup(ruta, ctx, { followFinal: false }).
  lookup(path, ctx = {}, opts = {}) {
    const { followFinal = true, user = 'root', groups = ['root'] } = { ...ctx, ...opts };
    const norm = normalize(path);
    if (norm === '/') return this.root;
    const segs = norm.split('/').filter(Boolean);
    let node = this.root;
    let sofar = '';
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      sofar += '/' + seg;
      if (node.type === S_LINK) {
        node = this.resolveLink(node, dirname(sofar), { user, groups });
      }
      if (node.type !== S_DIR) throw ENOTDIR(sofar);
      if (!this.canExec(node, user, groups)) throw EACCES(sofar);
      const child = node.children.get(seg);
      if (!child) throw ENOENT(norm);
      node = child;
      const isFinal = i === segs.length - 1;
      if (node.type === S_LINK && (!isFinal || followFinal)) {
        node = this.resolveLink(node, dirname(sofar), { user, groups });
      }
    }
    return node;
  }

  resolveLink(link, fromDir, ctx, depth = 0) {
    if (depth > 16) throw new FSError('ELOOP', link.target, 'Too many levels of symbolic links');
    const target = joinPath(fromDir, link.target);
    return this.lookup(target, ctx);
  }

  exists(path, ctx) {
    try {
      this.lookup(path, ctx);
      return true;
    } catch {
      return false;
    }
  }

  // --- permisos ---------------------------------------------------------

  permBits(node, user, groups) {
    if (user === 'root') return 0o7;
    if (node.owner === user) return (node.mode >> 6) & 0o7;
    if (groups.includes(node.group)) return (node.mode >> 3) & 0o7;
    return node.mode & 0o7;
  }

  canRead(node, user, groups) {
    return (this.permBits(node, user, groups) & 0o4) !== 0;
  }
  canWrite(node, user, groups) {
    return (this.permBits(node, user, groups) & 0o2) !== 0;
  }
  canExec(node, user, groups) {
    // root puede atravesar directorios aunque no tengan bit x
    if (user === 'root') return node.type !== S_DIR ? (node.mode & 0o111) !== 0 : true;
    return (this.permBits(node, user, groups) & 0o1) !== 0;
  }

  // --- operaciones ------------------------------------------------------

  readFile(path, ctx) {
    const node = this.lookup(path, ctx);
    if (node.type === S_DIR) throw EISDIR(path);
    if (!this.canRead(node, ctx.user, ctx.groups)) throw EACCES(path);
    return node.content;
  }

  writeFile(path, content, ctx, { append = false, mode } = {}) {
    const parentPath = dirname(path);
    const name = basename(path);
    const parent = this.lookup(parentPath, ctx);
    if (parent.type !== S_DIR) throw ENOTDIR(parentPath);
    const existing = parent.children.get(name);
    if (existing) {
      let target = existing;
      if (target.type === S_LINK) target = this.lookup(path, ctx);
      if (target.type === S_DIR) throw EISDIR(path);
      if (!this.canWrite(target, ctx.user, ctx.groups)) throw EACCES(path);
      target.content = append ? target.content + content : content;
      target.mtime = ctx.now || target.mtime;
      return target;
    }
    if (!this.canWrite(parent, ctx.user, ctx.groups)) throw EACCES(path);
    const node = makeNode(S_FILE, {
      content,
      mode: mode != null ? mode : 0o644 & ~(ctx.umask || 0o022),
      owner: ctx.user,
      group: ctx.user === 'root' ? 'root' : ctx.group || ctx.user,
      mtime: ctx.now,
    });
    parent.children.set(name, node);
    return node;
  }

  mkdir(path, ctx, { parents = false, mode } = {}) {
    const norm = normalize(path);
    if (parents) {
      const segs = norm.split('/').filter(Boolean);
      let cur = norm.startsWith('/') ? '' : '.';
      for (const seg of segs) {
        cur = cur === '' ? '/' + seg : cur + '/' + seg;
        if (!this.exists(cur, ctx)) this.mkdir(cur, ctx, { mode });
      }
      return this.lookup(norm, ctx);
    }
    const parent = this.lookup(dirname(norm), ctx);
    if (parent.type !== S_DIR) throw ENOTDIR(dirname(norm));
    if (parent.children.has(basename(norm))) throw EEXIST(norm);
    if (!this.canWrite(parent, ctx.user, ctx.groups)) throw EACCES(norm);
    const node = makeNode(S_DIR, {
      mode: mode != null ? mode : 0o777 & ~(ctx.umask || 0o022),
      owner: ctx.user,
      group: ctx.user === 'root' ? 'root' : ctx.group || ctx.user,
      mtime: ctx.now,
    });
    parent.children.set(basename(norm), node);
    return node;
  }

  unlink(path, ctx, { recursive = false, dirOk = false } = {}) {
    const norm = normalize(path);
    if (norm === '/') throw EACCES('/');
    const parent = this.lookup(dirname(norm), ctx);
    const name = basename(norm);
    const node = parent.children && parent.children.get(name);
    if (!node) throw ENOENT(norm);
    if (node.type === S_DIR) {
      if (!recursive && !dirOk) throw EISDIR(norm);
      if (dirOk && !recursive && node.children.size > 0) throw ENOTEMPTY(norm);
    }
    if (!this.canWrite(parent, ctx.user, ctx.groups)) throw EACCES(norm);
    parent.children.delete(name);
    return node;
  }

  // Copia profunda de un nodo (para cp -r).
  cloneNode(node, ctx) {
    const copy = makeNode(node.type, {
      mode: node.mode,
      owner: ctx ? ctx.user : node.owner,
      group: ctx ? ctx.group || ctx.user : node.group,
      mtime: ctx ? ctx.now : node.mtime,
      content: node.content,
      target: node.target,
    });
    if (node.type === S_DIR) {
      for (const [name, child] of node.children) copy.children.set(name, this.cloneNode(child, ctx));
    }
    return copy;
  }

  link(path, node, ctx) {
    const parent = this.lookup(dirname(path), ctx);
    if (parent.type !== S_DIR) throw ENOTDIR(dirname(path));
    if (!this.canWrite(parent, ctx.user, ctx.groups)) throw EACCES(path);
    parent.children.set(basename(path), node);
    return node;
  }

  list(path, ctx) {
    const node = this.lookup(path, ctx);
    if (node.type !== S_DIR) return [{ name: basename(path), node }];
    if (!this.canRead(node, ctx.user, ctx.groups)) throw EACCES(path);
    return [...node.children.entries()]
      .map(([name, n]) => ({ name, node: n }))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));
  }

  // --- serialización ----------------------------------------------------

  static fromJSON(spec) {
    const build = (s, defaults) => {
      if (typeof s === 'string') {
        return makeNode(S_FILE, { content: s, ...defaults });
      }
      if (s.type === S_LINK || s.link) {
        return makeNode(S_LINK, { target: s.link || s.target, ...defaults, ...s });
      }
      if (s.type === S_FILE || typeof s.content === 'string') {
        return makeNode(S_FILE, { ...defaults, ...s });
      }
      const dir = makeNode(S_DIR, {
        mode: s.mode,
        owner: s.owner || defaults.owner,
        group: s.group || defaults.group,
        mtime: s.mtime || defaults.mtime,
      });
      const kids = s.children || {};
      for (const [name, childSpec] of Object.entries(kids)) {
        dir.children.set(
          name,
          build(childSpec, {
            owner: s.owner || defaults.owner,
            group: s.group || defaults.group,
            mtime: defaults.mtime,
          })
        );
      }
      return dir;
    };
    const root = build(spec, { owner: 'root', group: 'root', mtime: '2026-01-15 10:30' });
    return new FileSystem(root);
  }

  toJSON(node = this.root) {
    if (node.type === S_FILE) return { type: S_FILE, content: node.content, mode: node.mode, owner: node.owner, group: node.group };
    if (node.type === S_LINK) return { type: S_LINK, target: node.target, mode: node.mode, owner: node.owner, group: node.group };
    const children = {};
    for (const [name, child] of node.children) children[name] = this.toJSON(child);
    return { type: S_DIR, mode: node.mode, owner: node.owner, group: node.group, children };
  }
}

// --- formato de permisos ------------------------------------------------

export function modeString(node) {
  const t = node.type === S_DIR ? 'd' : node.type === S_LINK ? 'l' : '-';
  const rwx = (bits) => ((bits & 4) ? 'r' : '-') + ((bits & 2) ? 'w' : '-') + ((bits & 1) ? 'x' : '-');
  return t + rwx((node.mode >> 6) & 7) + rwx((node.mode >> 3) & 7) + rwx(node.mode & 7);
}

// Aplica un modo simbólico (u+x, go-w, a=r, u=rw,g=r) o numérico sobre un modo actual.
export function applyMode(current, spec) {
  if (/^[0-7]{1,4}$/.test(spec)) return parseInt(spec, 8) & 0o7777;
  let mode = current;
  for (const clause of spec.split(',')) {
    // `s` es SUID/SGID según a quién se aplique y `t` es el sticky bit.
    const m = clause.match(/^([ugoa]*)([+\-=])([rwxXst]*)$/);
    if (!m) throw new Error(`invalid mode: '${spec}'`);
    let [, who, op, perms] = m;
    const whoOriginal = who;
    if (!who || who === 'a') who = 'ugo';

    let bits = 0;
    if (perms.includes('r')) bits |= 4;
    if (perms.includes('w')) bits |= 2;
    if (perms.includes('x') || perms.includes('X')) bits |= 1;

    for (const w of who) {
      const shift = w === 'u' ? 6 : w === 'g' ? 3 : 0;
      if (op === '+') mode |= bits << shift;
      else if (op === '-') mode &= ~(bits << shift);
      else mode = (mode & ~(0o7 << shift)) | (bits << shift);
    }

    // Bits especiales: 4000 SUID, 2000 SGID, 1000 sticky.
    if (perms.includes('s')) {
      let especiales = 0;
      if (whoOriginal.includes('u') || !whoOriginal || whoOriginal === 'a') especiales |= 0o4000;
      if (whoOriginal.includes('g') || !whoOriginal || whoOriginal === 'a') especiales |= 0o2000;
      if (op === '-') mode &= ~especiales;
      else mode |= especiales;
    }
    if (perms.includes('t')) {
      if (op === '-') mode &= ~0o1000;
      else mode |= 0o1000;
    }
  }
  return mode & 0o7777;
}
