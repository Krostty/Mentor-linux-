// systemd y logs: systemctl, journalctl, service, dmesg, crontab, timedatectl, hostnamectl
import { parseArgs, ok, err, padEnd } from './util.js';

const SERVICES = {
  nginx: { desc: 'A high performance web server and a reverse proxy server', active: true, enabled: true, pid: 702, since: 'Wed 2026-01-15 09:01:12 CET' },
  ssh: { desc: 'OpenBSD Secure Shell server', active: true, enabled: true, pid: 638, since: 'Wed 2026-01-15 09:00:41 CET' },
  postgresql: { desc: 'PostgreSQL RDBMS', active: true, enabled: true, pid: 890, since: 'Wed 2026-01-15 09:01:30 CET' },
  cron: { desc: 'Regular background program processing daemon', active: true, enabled: true, pid: 655, since: 'Wed 2026-01-15 09:00:44 CET' },
  'render-worker': {
    desc: 'Cola de renderizado de vídeo',
    active: false,
    enabled: false,
    pid: null,
    since: null,
    failed: true,
    error: "render-worker.service: Failed with result 'exit-code'.",
  },
};

function services(ctx) {
  if (!ctx.shell.state.services) {
    ctx.shell.state.services = JSON.parse(JSON.stringify(SERVICES));
  }
  return ctx.shell.state.services;
}

function unitName(name) {
  return name.replace(/\.service$/, '');
}

const LOGS = [
  'ene 15 09:00:41 mentor-box systemd[1]: Started OpenBSD Secure Shell server.',
  'ene 15 09:01:12 mentor-box systemd[1]: Started A high performance web server and a reverse proxy server.',
  'ene 15 09:01:30 mentor-box systemd[1]: Started PostgreSQL RDBMS.',
  'ene 15 10:18:02 mentor-box render-worker[1533]: WARN cola con 4120 elementos pendientes',
  'ene 15 10:19:44 mentor-box render-worker[1533]: ERROR no se pudo abrir /var/lib/render/cache: Permission denied',
  'ene 15 10:19:45 mentor-box systemd[1]: render-worker.service: Main process exited, code=exited, status=1/FAILURE',
  'ene 15 10:19:45 mentor-box systemd[1]: render-worker.service: Failed with result \'exit-code\'.',
  'ene 15 10:20:01 mentor-box CRON[1540]: (user) CMD (/usr/local/bin/backup.sh)',
  'ene 15 10:25:13 mentor-box sshd[1188]: Accepted publickey for user from 192.168.1.10 port 51422',
  'ene 15 10:29:58 mentor-box kernel: [ 5412.8821] EXT4-fs (sda1): mounted filesystem with ordered data mode',
];

export const sysd = {
  systemctl: (args, ctx) => {
    const { operands, values, has } = parseArgs(args, { longWithValue: ['type'] });
    const sub = operands[0];
    const name = operands[1] ? unitName(operands[1]) : null;
    const svcs = services(ctx);

    if (!sub || sub === 'list-units' || sub === 'list-unit-files') {
      const rows = Object.entries(svcs).map(([n, s]) =>
        padEnd(n + '.service', 22) + padEnd('loaded', 8) + padEnd(s.active ? 'active' : 'failed', 8) + padEnd(s.active ? 'running' : 'failed', 9) + s.desc
      );
      return ok('  UNIT                  LOAD    ACTIVE  SUB      DESCRIPTION\n' + rows.map((r) => '  ' + r).join('\n') + '\n');
    }

    if (sub === 'status') {
      if (!name) return sysd.systemctl(['list-units'], ctx);
      const s = svcs[name];
      if (!s) return err(`Unit ${name}.service could not be found.`, 4);
      const head =
        `● ${name}.service - ${s.desc}\n` +
        `     Loaded: loaded (/lib/systemd/system/${name}.service; ${s.enabled ? 'enabled' : 'disabled'}; preset: enabled)\n` +
        `     Active: ${s.active ? `active (running) since ${s.since}` : 'failed (Result: exit-code)'}\n` +
        (s.pid ? `   Main PID: ${s.pid} (${name})\n      Tasks: 3 (limit: 4611)\n     Memory: 12.4M\n` : '') +
        (s.failed ? `\nene 15 10:19:45 mentor-box systemd[1]: ${s.error}\n` : '');
      return { stdout: head, code: s.active ? 0 : 3 };
    }

    const mutating = ['start', 'stop', 'restart', 'reload', 'enable', 'disable', 'mask', 'unmask'];
    if (mutating.includes(sub)) {
      if (!name) return err(`Too few arguments.`, 1);
      const s = svcs[name];
      if (!s) return err(`Failed to ${sub} ${name}.service: Unit ${name}.service not found.`, 5);
      if (ctx.user !== 'root') {
        return err(`Failed to ${sub} ${name}.service: Interactive authentication required.\nSee system logs and 'systemctl status ${name}.service' for details.`, 1);
      }
      if (sub === 'start' || sub === 'restart' || sub === 'reload') {
        s.active = true;
        s.failed = false;
        s.pid = s.pid || 2100 + Object.keys(svcs).indexOf(name);
        s.since = 'Wed 2026-01-15 10:32:00 CET';
      }
      if (sub === 'stop') {
        s.active = false;
        s.pid = null;
      }
      if (sub === 'enable') s.enabled = true;
      if (sub === 'disable') s.enabled = false;
      const extra = sub === 'enable' ? `Created symlink /etc/systemd/system/multi-user.target.wants/${name}.service → /lib/systemd/system/${name}.service.\n` : '';
      return ok(extra);
    }

    if (sub === 'is-active') {
      const s = svcs[name];
      return { stdout: (s && s.active ? 'active' : 'inactive') + '\n', code: s && s.active ? 0 : 3 };
    }
    if (sub === 'is-enabled') {
      const s = svcs[name];
      return { stdout: (s && s.enabled ? 'enabled' : 'disabled') + '\n', code: s && s.enabled ? 0 : 1 };
    }
    if (sub === 'daemon-reload') return ok('');
    if (sub === 'list-failed' || (sub === 'list-units' && has('--failed'))) {
      const failed = Object.entries(svcs).filter(([, s]) => !s.active);
      if (!failed.length) return ok('0 loaded units listed.\n');
      return ok(failed.map(([n, s]) => `● ${padEnd(n + '.service', 22)} loaded failed failed ${s.desc}`).join('\n') + '\n');
    }
    return err(`Unknown command verb ${sub}.`, 1);
  },

  service: (args, ctx) => {
    const [name, action] = args;
    return sysd.systemctl([action, name], ctx);
  },

  journalctl: (args, ctx) => {
    const { values, has, operands } = parseArgs(args, { withValue: ['u', 'n', 'p'], longWithValue: ['unit', 'since', 'lines', 'priority'] });
    let logs = [...LOGS];
    const unit = values.u || values.unit;
    if (unit) {
      const u = unitName(unit);
      logs = logs.filter((l) => l.includes(u));
      if (!logs.length) return ok(`-- No entries --\n`);
    }
    if (has('-p') || values.p || values.priority) {
      const p = values.p || values.priority;
      if (p === 'err' || p === '3') logs = logs.filter((l) => l.includes('ERROR') || l.includes('Failed') || l.includes('FAILURE'));
    }
    if (has('-k')) logs = logs.filter((l) => l.includes('kernel'));
    const n = parseInt(values.n || values.lines || '0', 10);
    if (n > 0) logs = logs.slice(-n);
    if (has('-r')) logs.reverse();
    const header = '-- Journal begins at Wed 2026-01-15 09:00:38 CET. --\n';
    return ok(header + logs.join('\n') + '\n');
  },

  dmesg: (args, ctx) =>
    ok(
      '[    0.000000] Linux version 6.6.15-amd64 (debian-kernel@lists.debian.org)\n' +
        '[    0.412881] Memory: 3936MB available\n' +
        '[    1.204410] EXT4-fs (sda1): mounted filesystem with ordered data mode\n' +
        '[ 5412.882100] EXT4-fs (sda1): re-mounted. Opts: (null)\n'
    ),

  crontab: (args, ctx) => {
    const { has } = parseArgs(args);
    if (has('-l')) {
      try {
        return ok(ctx.fs.readFile('/var/spool/cron/crontabs/' + ctx.user, ctx));
      } catch {
        return err(`no crontab for ${ctx.user}`, 1);
      }
    }
    if (has('-e')) return ok('crontab: installing new crontab\n(el editor no está disponible en Mentor Linux; usa un archivo y `crontab archivo`)\n');
    if (has('-r')) {
      try {
        ctx.fs.unlink('/var/spool/cron/crontabs/' + ctx.user, ctx);
      } catch {}
      return ok('');
    }
    const file = args.find((a) => !a.startsWith('-'));
    if (file) {
      try {
        const content = ctx.fs.readFile(ctx.shell.resolve(file), ctx);
        ctx.fs.mkdir('/var/spool/cron/crontabs', ctx, { parents: true });
        ctx.fs.writeFile('/var/spool/cron/crontabs/' + ctx.user, content, ctx);
        return ok('');
      } catch (e) {
        return err(`crontab: ${file}: ${e.message}`);
      }
    }
    return err('usage: crontab [-u user] file | crontab [-l | -r | -e]');
  },

  timedatectl: () =>
    ok(
      '               Local time: mié 2026-01-15 10:31:44 CET\n' +
        '           Universal time: mié 2026-01-15 09:31:44 UTC\n' +
        '                 Time zone: Europe/Madrid (CET, +0100)\n' +
        ' System clock synchronized: yes\n' +
        '               NTP service: active\n'
    ),

  hostnamectl: () =>
    ok(
      ' Static hostname: mentor-box\n' +
        '       Icon name: computer-vm\n' +
        '  Operating System: Debian GNU/Linux 12 (bookworm)\n' +
        '            Kernel: Linux 6.6.15-amd64\n' +
        '      Architecture: x86-64\n'
    ),

  lsblk: () =>
    ok(
      'NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\n' +
        'sda      8:0    0   80G  0 disk\n' +
        '├─sda1   8:1    0   20G  0 part /\n' +
        '├─sda2   8:2    0   50G  0 part /home\n' +
        '└─sda3   8:3    0    2G  0 part [SWAP]\n'
    ),

  mount: () =>
    ok(
      '/dev/sda1 on / type ext4 (rw,relatime)\n' +
        '/dev/sda2 on /home type ext4 (rw,relatime)\n' +
        'tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev)\n'
    ),

  uname: (args, ctx) => {
    if (args.includes('-a')) return ok('Linux mentor-box 6.6.15-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.6.15-2 x86_64 GNU/Linux\n');
    if (args.includes('-r')) return ok('6.6.15-amd64\n');
    if (args.includes('-m')) return ok('x86_64\n');
    if (args.includes('-n')) return ok('mentor-box\n');
    return ok('Linux\n');
  },
};

export { SERVICES };
