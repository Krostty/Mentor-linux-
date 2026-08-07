// Herramientas avanzadas usadas por las salas v2, el Wargame y las máquinas.
// Son simulaciones deterministas: nunca realizan conexiones ni tocan el equipo real.

import { parseArgs, ok, err } from './util.js';

function printable(content, min = 4) {
  const chunks = String(content).match(new RegExp(`[\\x20-\\x7e]{${min},}`, 'g')) || [];
  return chunks.join('\n') + (chunks.length ? '\n' : '');
}

function attrs(ctx) {
  if (!ctx.shell.state.attributes) ctx.shell.state.attributes = new Map();
  return ctx.shell.state.attributes;
}

function gitRepos(ctx) {
  if (!ctx.shell.state.gitRepos) ctx.shell.state.gitRepos = new Map();
  return ctx.shell.state.gitRepos;
}

function repo(ctx) {
  return gitRepos(ctx).get(ctx.cwd) || null;
}

function git(args, ctx) {
  const sub = args[0];
  if (!sub || sub === '--help') return ok('uso: git <init|status|add|commit|log|branch|switch|tag|diff>\n');
  if (sub === '--version') return ok('git version 2.43.0\n');

  if (sub === 'init') {
    gitRepos(ctx).set(ctx.cwd, { branch: 'main', branches: new Set(['main']), staged: new Set(), commits: [], tags: new Set() });
    return ok(`Inicializado repositorio Git vacío en ${ctx.cwd}/.git/\n`);
  }

  const r = repo(ctx);
  if (!r) return err('fatal: no es un repositorio git (ni ninguno de los directorios superiores): .git', 128);

  if (sub === 'status') {
    const staged = [...r.staged];
    return ok(`En la rama ${r.branch}\n${staged.length ? `Cambios a ser confirmados:\n  nuevo archivo: ${staged.join('\n  nuevo archivo: ')}\n` : 'nada para hacer commit, el árbol de trabajo está limpio\n'}`);
  }
  if (sub === 'add') {
    const files = args.slice(1);
    if (!files.length) return err('No se especificó nada, no se añadió nada.', 1);
    files.forEach((f) => r.staged.add(f));
    return ok();
  }
  if (sub === 'commit') {
    const i = args.findIndex((a) => a === '-m' || a === '--message');
    const message = i >= 0 ? args[i + 1] : '';
    if (!message) return err('error: la opción -m requiere un mensaje', 1);
    if (!r.staged.size) return ok(`En la rama ${r.branch}\nnada para hacer commit\n`);
    const hash = (0x8f12ac0 + r.commits.length * 0x10231).toString(16).slice(0, 7);
    r.commits.unshift({ hash, message, branch: r.branch, files: [...r.staged] });
    r.staged.clear();
    return ok(`[${r.branch} ${hash}] ${message}\n`);
  }
  if (sub === 'log') {
    if (!r.commits.length) return err(`fatal: tu rama actual '${r.branch}' no tiene ningún commit todavía`, 128);
    const oneline = args.includes('--oneline');
    return ok(r.commits.map((c) => oneline ? `${c.hash} ${c.message}` : `commit ${c.hash}\n    ${c.message}`).join('\n') + '\n');
  }
  if (sub === 'branch') {
    const name = args[1];
    if (name) {
      r.branches.add(name);
      return ok();
    }
    return ok([...r.branches].map((b) => `${b === r.branch ? '*' : ' '} ${b}`).join('\n') + '\n');
  }
  if (sub === 'switch' || sub === 'checkout') {
    const create = args.includes('-c') || args.includes('-b');
    const name = args.find((a, i) => i > 0 && !a.startsWith('-'));
    if (!name) return err(`fatal: falta el nombre de la rama`, 128);
    if (create) r.branches.add(name);
    if (!r.branches.has(name)) return err(`fatal: referencia no válida: ${name}`, 128);
    r.branch = name;
    return ok(`Cambiado a rama '${name}'\n`);
  }
  if (sub === 'tag') {
    const name = args[1];
    if (name) r.tags.add(name);
    return ok(name ? '' : [...r.tags].join('\n') + (r.tags.size ? '\n' : ''));
  }
  if (sub === 'diff') return ok(r.staged.size ? [...r.staged].map((f) => `diff --git a/${f} b/${f}`).join('\n') + '\n' : '');
  return err(`git: '${sub}' no es un comando de git.`, 1);
}

// Puertos del host de prácticas cuando no hay una máquina cargada: los
// mismos que anuncia `ss`, para que ambas herramientas cuenten lo mismo.
const PUERTOS_LOCALES = [
  { port: 22, service: 'ssh', version: 'OpenSSH 9.2p1' },
  { port: 80, service: 'http', version: 'nginx 1.22.1' },
  { port: 443, service: 'https', version: 'nginx 1.22.1' },
  { port: 5432, service: 'postgresql', version: 'PostgreSQL 15.4' },
];

// -p 22,80 · -p 20-25 · -p- (todos los conocidos)
function puertosPedidos(args) {
  const i = args.findIndex((a) => a === '-p' || a.startsWith('-p'));
  if (i < 0) return null;
  const spec = args[i] === '-p' ? args[i + 1] : args[i].slice(2);
  if (!spec || spec === '-') return null;
  const pedidos = new Set();
  for (const trozo of spec.split(',')) {
    const rango = trozo.match(/^(\d+)-(\d+)$/);
    if (rango) for (let p = Number(rango[1]); p <= Number(rango[2]); p++) pedidos.add(p);
    else if (/^\d+$/.test(trozo)) pedidos.add(Number(trozo));
  }
  return pedidos;
}

function nmap(args, ctx) {
  const target = [...args].reverse().find((a) => !a.startsWith('-') && !/^\d+([,-]\d+)*$/.test(a)) || '10.10.10.10';
  const profile = ctx.shell.state.machine || {};
  const ports = profile.ports || PUERTOS_LOCALES;
  if (profile.ip && target !== profile.ip && target !== profile.host) {
    return ok(`Starting Nmap 7.94\nNote: Host seems down.\nNmap done: 1 IP address (0 hosts up) scanned\n`);
  }
  // -sn solo descubre hosts vivos, sin tocar puertos.
  if (args.includes('-sn')) {
    return ok(`Starting Nmap 7.94\nNmap scan report for ${profile.host || target} (${profile.ip || target})\nHost is up (0.00042s latency).\nNmap done: 1 IP address (1 host up) scanned\n`);
  }
  const pedidos = puertosPedidos(args);
  const detail = args.some((a) => a === '-sV' || a === '-A' || a === '-sC');
  const visibles = pedidos ? ports.filter((p) => pedidos.has(p.port)) : ports;
  const cerrados = pedidos ? [...pedidos].filter((p) => !ports.some((x) => x.port === p)) : [];
  const filas = [
    ...visibles.map((p) => `${p.port}/tcp\topen\t${p.service}${detail ? `\t${p.version || ''}` : ''}`),
    ...cerrados.map((p) => `${p}/tcp\tclosed\tunknown`),
  ].sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).join('\n');
  return ok(`Starting Nmap 7.94\nNmap scan report for ${profile.host || target} (${profile.ip || target})\nHost is up.\nPORT\tSTATE\tSERVICE${detail ? '\tVERSION' : ''}\n${filas}\nNmap done: 1 IP address (1 host up) scanned\n`);
}

function nc(args, ctx, stdin = '') {
  if (args.includes('-h') || args.includes('--help')) return ok('OpenBSD netcat: nc [-lvz] [host] [port]\n');
  const profile = ctx.shell.state.machine || {};
  const port = Number([...args].reverse().find((a) => /^\d+$/.test(a)) || 0);
  const host = args.filter((a) => !a.startsWith('-') && !/^\d+$/.test(a)).pop() || 'localhost';
  const puertos = profile.ports || PUERTOS_LOCALES;
  const service = puertos.find((p) => p.port === port);
  if (args.some((a) => /^-[a-z]*l[a-z]*$/i.test(a))) return ok('Listening on 0.0.0.0\n');
  // -z solo comprueba si el puerto acepta conexión; no envía nada.
  if (args.some((a) => /^-[a-z]*z[a-z]*$/i.test(a))) {
    return service
      ? { stderr: `Connection to ${host} ${port} port [tcp/${service.service}] succeeded!\n`, code: 0 }
      : err(`nc: connect to ${host} port ${port} (tcp) failed: Connection refused`, 1);
  }
  if (!service) return err('nc: connect to host port tcp failed: Connection refused', 1);
  if (service.banner) return ok(service.banner);
  const banners = { ssh: 'SSH-2.0-OpenSSH_9.2p1 Debian-2\n', http: 'HTTP/1.1 400 Bad Request\nServer: nginx/1.22.1\n', https: 'HTTP/1.1 400 Bad Request\nServer: nginx/1.22.1\n' };
  return ok(banners[service.service] || `${service.service} service ready\n${stdin}`);
}

export const advanced = {
  strings: (args, ctx) => {
    const { operands, values } = parseArgs(args, { withValue: ['n'] });
    const min = Number(values.n || 4);
    if (!operands.length) return err('strings: missing file operand', 1);
    let out = '';
    for (const file of operands) {
      try { out += printable(ctx.fs.readFile(ctx.shell.resolve(file), ctx), min); }
      catch (e) { return err(`strings: '${file}': ${e.message}`, 1); }
    }
    return ok(out);
  },

  lsattr: (args, ctx) => {
    const files = args.filter((a) => !a.startsWith('-'));
    if (!files.length) return err('lsattr: No such file or directory', 1);
    return ok(files.map((f) => `${attrs(ctx).get(ctx.shell.resolve(f))?.has('i') ? '----i---------' : '--------------'} ${f}`).join('\n') + '\n');
  },

  chattr: (args, ctx) => {
    const mode = args.find((a) => /^[+-][a-z]+$/i.test(a));
    const files = args.filter((a) => !a.startsWith('+') && !a.startsWith('-'));
    if (!mode || !files.length) return err('Uso: chattr [-+=aAcCdDeijPsStTuFx] archivos...', 1);
    if (ctx.user !== 'root') return err('chattr: Operation not permitted while setting flags', 1);
    for (const f of files) {
      const path = ctx.shell.resolve(f);
      const set = attrs(ctx).get(path) || new Set();
      for (const flag of mode.slice(1)) mode[0] === '+' ? set.add(flag) : set.delete(flag);
      attrs(ctx).set(path, set);
    }
    return ok();
  },

  git,
  nmap,
  nc,
  netcat: nc,

  tmux: (args, ctx) => {
    if (!ctx.shell.state.tmux) ctx.shell.state.tmux = new Set();
    const sessions = ctx.shell.state.tmux;
    if (args[0] === '-V') return ok('tmux 3.3a\n');
    if (args[0] === 'ls' || args[0] === 'list-sessions') {
      return sessions.size ? ok([...sessions].map((s) => `${s}: 1 windows`).join('\n') + '\n') : err('no server running on /tmp/tmux-1000/default', 1);
    }
    if (args[0] === 'new' || args[0] === 'new-session') {
      const i = args.findIndex((a) => a === '-s');
      sessions.add(i >= 0 ? args[i + 1] : '0');
      return ok();
    }
    if (args[0] === 'attach' || args[0] === 'attach-session') return sessions.size ? ok('attached to tmux session\n') : err('no sessions', 1);
    return ok('tmux: usa new-session, ls o attach-session\n');
  },

  vim: (args) => args.includes('--version')
    ? ok('VIM - Vi IMproved 9.0\nHuge version without GUI.\n')
    : ok('Mentor Linux simula Vim: usa redirecciones, sed o printf para editar durante los retos.\n'),
};
