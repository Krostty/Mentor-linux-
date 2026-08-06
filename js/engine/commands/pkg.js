// Gestión de paquetes: apt, apt-get, dpkg, dnf, yum, rpm, pacman, snap
import { parseArgs, ok, err, padEnd } from './util.js';

const CATALOG = {
  nginx: { version: '1.24.0-2', size: 620, desc: 'small, powerful, scalable web/proxy server' },
  htop: { version: '3.2.2-2', size: 380, desc: 'interactive processes viewer' },
  git: { version: '2.43.0-1', size: 22400, desc: 'fast, scalable, distributed revision control system' },
  curl: { version: '8.5.0-2', size: 480, desc: 'command line tool for transferring data with URL syntax' },
  vim: { version: '9.1.0016-1', size: 3600, desc: 'Vi IMproved - enhanced vi editor' },
  tree: { version: '2.1.1-2', size: 110, desc: 'displays an indented directory tree' },
  python3: { version: '3.11.8-1', size: 5200, desc: 'interactive high-level object-oriented language' },
  docker: { version: '24.0.7-1', size: 42800, desc: 'Linux container runtime' },
};

function installed(ctx) {
  if (!ctx.shell.state.packages) {
    ctx.shell.state.packages = new Set(['curl', 'git', 'python3']);
  }
  return ctx.shell.state.packages;
}

function needRoot(ctx, tool) {
  if (ctx.user !== 'root') {
    return err(
      tool === 'apt'
        ? 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock, are you root?'
        : `error: you cannot perform this operation unless you are root.`,
      100
    );
  }
  return null;
}

function aptLike(tool) {
  return (args, ctx) => {
    const { operands, has } = parseArgs(args);
    const sub = operands[0];
    const names = operands.slice(1);
    const pkgs = installed(ctx);

    if (sub === 'update') {
      const guard = needRoot(ctx, 'apt');
      if (guard) return guard;
      return ok('Hit:1 http://deb.debian.org/debian bookworm InRelease\nGet:2 http://security.debian.org bookworm-security InRelease [48.0 kB]\nFetched 48.0 kB in 1s (42.1 kB/s)\nReading package lists... Done\n');
    }
    if (sub === 'install' || sub === 'reinstall') {
      const guard = needRoot(ctx, 'apt');
      if (guard) return guard;
      if (!names.length) return err('E: Missing package name', 100);
      let out = 'Reading package lists... Done\nBuilding dependency tree... Done\n';
      for (const n of names) {
        if (!CATALOG[n]) return err(`E: Unable to locate package ${n}`, 100);
        pkgs.add(n);
        out += `The following NEW packages will be installed:\n  ${n}\nSetting up ${n} (${CATALOG[n].version}) ...\n`;
      }
      return ok(out);
    }
    if (sub === 'remove' || sub === 'purge') {
      const guard = needRoot(ctx, 'apt');
      if (guard) return guard;
      let out = '';
      for (const n of names) {
        if (!pkgs.has(n)) return err(`E: Package '${n}' is not installed, so not removed`, 100);
        pkgs.delete(n);
        out += `Removing ${n} (${CATALOG[n].version}) ...\n`;
      }
      return ok(out);
    }
    if (sub === 'upgrade' || sub === 'full-upgrade' || sub === 'dist-upgrade') {
      const guard = needRoot(ctx, 'apt');
      if (guard) return guard;
      return ok('Reading package lists... Done\nCalculating upgrade... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n');
    }
    if (sub === 'search') {
      const q = names[0] || '';
      const hits = Object.entries(CATALOG).filter(([n, p]) => n.includes(q) || p.desc.includes(q));
      return ok(hits.map(([n, p]) => `${n}/stable ${p.version} amd64\n  ${p.desc}\n`).join('\n'));
    }
    if (sub === 'show' || sub === 'info') {
      const n = names[0];
      if (!CATALOG[n]) return err(`E: No packages found`, 100);
      const p = CATALOG[n];
      return ok(`Package: ${n}\nVersion: ${p.version}\nPriority: optional\nInstalled-Size: ${p.size} kB\nDescription: ${p.desc}\n`);
    }
    if (sub === 'list') {
      const onlyInstalled = has('--installed');
      const entries = Object.entries(CATALOG).filter(([n]) => !onlyInstalled || pkgs.has(n));
      return ok('Listing...\n' + entries.map(([n, p]) => `${n}/stable ${p.version} amd64${pkgs.has(n) ? ' [installed]' : ''}`).join('\n') + '\n');
    }
    return err(`E: Invalid operation ${sub || ''}`, 100);
  };
}

export const pkg = {
  apt: aptLike('apt'),
  'apt-get': aptLike('apt'),

  dpkg: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    const pkgs = installed(ctx);
    if (has('-l', '--list')) {
      const rows = [...pkgs].sort().map((n) => `ii  ${padEnd(n, 20)}${padEnd(CATALOG[n].version, 18)}amd64        ${CATALOG[n].desc}`);
      return ok('Desired=Unknown/Install/Remove/Purge/Hold\n| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst\n||/ Name                Version           Architecture Description\n+++-===================-=================-============-=================\n' + rows.join('\n') + '\n');
    }
    if (has('-L')) {
      const n = operands[0];
      if (!pkgs.has(n)) return err(`dpkg-query: package '${n}' is not installed`);
      return ok(`/usr/bin/${n}\n/usr/share/doc/${n}\n/usr/share/man/man1/${n}.1.gz\n`);
    }
    if (has('-s')) {
      const n = operands[0];
      if (!pkgs.has(n)) return err(`dpkg-query: package '${n}' is not installed and no information is available`);
      return ok(`Package: ${n}\nStatus: install ok installed\nVersion: ${CATALOG[n].version}\n`);
    }
    return err('dpkg: need an action option');
  },

  dnf: (args, ctx) => {
    const { operands } = parseArgs(args);
    const sub = operands[0];
    const pkgs = installed(ctx);
    if (sub === 'install') {
      const guard = needRoot(ctx, 'dnf');
      if (guard) return guard;
      const n = operands[1];
      if (!CATALOG[n]) return err(`No match for argument: ${n}\nError: Unable to find a match: ${n}`);
      pkgs.add(n);
      return ok(`Dependencies resolved.\nInstalling:\n ${n}    x86_64    ${CATALOG[n].version}\n\nComplete!\n`);
    }
    if (sub === 'remove') {
      const guard = needRoot(ctx, 'dnf');
      if (guard) return guard;
      pkgs.delete(operands[1]);
      return ok('Complete!\n');
    }
    if (sub === 'search') return pkg.apt(['search', operands[1] || ''], ctx);
    if (sub === 'list') return ok([...pkgs].map((n) => `${n}.x86_64    ${CATALOG[n].version}    @System`).join('\n') + '\n');
    return err(`No such command: ${sub}`);
  },

  yum: (args, ctx) => pkg.dnf(args, ctx),

  rpm: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    const pkgs = installed(ctx);
    if (has('-q') && has('-a')) return ok([...pkgs].map((n) => `${n}-${CATALOG[n].version}.x86_64`).join('\n') + '\n');
    if (has('-q')) {
      const n = operands[0];
      return pkgs.has(n) ? ok(`${n}-${CATALOG[n].version}.x86_64\n`) : ok(`package ${n} is not installed\n`);
    }
    return err('rpm: no arguments given for query');
  },

  pacman: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    const pkgs = installed(ctx);
    if (has('-S') && !has('-Ss') && !has('-Sy')) {
      const guard = needRoot(ctx, 'pacman');
      if (guard) return guard;
      const n = operands[0];
      if (!CATALOG[n]) return err(`error: target not found: ${n}`);
      pkgs.add(n);
      return ok(`resolving dependencies...\n(1/1) installing ${n}    [######################] 100%\n`);
    }
    if (has('-R')) {
      const guard = needRoot(ctx, 'pacman');
      if (guard) return guard;
      pkgs.delete(operands[0]);
      return ok(`(1/1) removing ${operands[0]}    [######################] 100%\n`);
    }
    if (has('-Q')) return ok([...pkgs].map((n) => `${n} ${CATALOG[n].version}`).join('\n') + '\n');
    return err('error: no operation specified (use -h for help)');
  },

  snap: (args, ctx) => {
    const { operands } = parseArgs(args);
    if (operands[0] === 'list') return ok('Name    Version   Rev    Tracking       Publisher   Notes\ncore22  20240111  1122   latest/stable  canonical✓  base\n');
    return ok('');
  },

  which: (args, ctx) => {
    const name = args[0];
    if (!name) return err('', 1);
    if (ctx.shell.commands[name]) return ok(`/usr/bin/${name}\n`);
    return { stdout: '', code: 1 };
  },

  whereis: (args, ctx) => {
    const name = args[0];
    if (!ctx.shell.commands[name]) return ok(`${name}:\n`);
    return ok(`${name}: /usr/bin/${name} /usr/share/man/man1/${name}.1.gz\n`);
  },

  type: (args, ctx) => {
    const name = args[0];
    if (ctx.shell.aliases.has(name)) return ok(`${name} is aliased to \`${ctx.shell.aliases.get(name)}'\n`);
    if (ctx.shell.commands[name]) return ok(`${name} is /usr/bin/${name}\n`);
    return err(`bash: type: ${name}: not found`, 1);
  },
};

export { CATALOG };
