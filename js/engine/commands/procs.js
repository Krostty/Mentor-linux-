// Procesos y recursos: ps, top, kill, killall, pgrep, jobs, free, uptime, nice, nohup
import { parseArgs, ok, err, pad, padEnd } from './util.js';

export const DEFAULT_PROCESSES = [
  { pid: 1, user: 'root', cpu: 0.0, mem: 0.4, vsz: 168404, rss: 12980, tty: '?', stat: 'Ss', start: '09:00', time: '0:03', cmd: '/sbin/init' },
  { pid: 412, user: 'root', cpu: 0.0, mem: 0.2, vsz: 47216, rss: 6120, tty: '?', stat: 'Ss', start: '09:00', time: '0:00', cmd: '/lib/systemd/systemd-journald' },
  { pid: 638, user: 'root', cpu: 0.0, mem: 0.3, vsz: 15852, rss: 9204, tty: '?', stat: 'Ss', start: '09:00', time: '0:00', cmd: '/usr/sbin/sshd -D' },
  { pid: 701, user: 'www-data', cpu: 0.7, mem: 1.1, vsz: 132400, rss: 34112, tty: '?', stat: 'S', start: '09:01', time: '0:12', cmd: 'nginx: worker process' },
  { pid: 702, user: 'root', cpu: 0.0, mem: 0.5, vsz: 131980, rss: 15600, tty: '?', stat: 'Ss', start: '09:01', time: '0:00', cmd: 'nginx: master process /usr/sbin/nginx' },
  { pid: 890, user: 'postgres', cpu: 1.3, mem: 4.2, vsz: 412300, rss: 129800, tty: '?', stat: 'S', start: '09:01', time: '1:24', cmd: '/usr/lib/postgresql/16/bin/postgres' },
  { pid: 1204, user: 'user', cpu: 0.0, mem: 0.2, vsz: 21532, rss: 5480, tty: 'pts/0', stat: 'Ss', start: '10:12', time: '0:00', cmd: '-bash' },
  { pid: 1533, user: 'user', cpu: 94.6, mem: 2.8, vsz: 288120, rss: 86400, tty: '?', stat: 'R', start: '10:20', time: '8:41', cmd: '/opt/render/render-worker --queue=video' },
  { pid: 1601, user: 'user', cpu: 0.0, mem: 0.1, vsz: 11220, rss: 3320, tty: 'pts/0', stat: 'R+', start: '10:31', time: '0:00', cmd: 'ps aux' },
];

function procs(ctx) {
  if (!ctx.shell.state.processes) {
    ctx.shell.state.processes = DEFAULT_PROCESSES.map((p) => ({ ...p }));
  }
  return ctx.shell.state.processes;
}

export const processes = {
  ps: (args, ctx) => {
    const list = procs(ctx);
    const joined = args.join('');
    const wantsAll = joined.includes('a') || joined.includes('e') || joined.includes('A');
    const rows = wantsAll ? list : list.filter((p) => p.user === ctx.user && p.tty !== '?');

    if (joined.includes('u') || joined.includes('f') || wantsAll) {
      const header =
        padEnd('USER', 10) + pad('PID', 5) + pad('%CPU', 6) + pad('%MEM', 6) + pad('VSZ', 8) + pad('RSS', 7) + ' ' + padEnd('TTY', 8) + padEnd('STAT', 6) + padEnd('START', 6) + padEnd('TIME', 6) + 'COMMAND';
      const body = rows.map(
        (p) =>
          padEnd(p.user, 10) + pad(p.pid, 5) + pad(p.cpu.toFixed(1), 6) + pad(p.mem.toFixed(1), 6) + pad(p.vsz, 8) + pad(p.rss, 7) + ' ' + padEnd(p.tty, 8) + padEnd(p.stat, 6) + padEnd(p.start, 6) + padEnd(p.time, 6) + p.cmd
      );
      return ok([header, ...body].join('\n') + '\n');
    }
    const header = pad('PID', 7) + ' ' + padEnd('TTY', 9) + padEnd('TIME', 9) + 'CMD';
    const body = rows.map((p) => pad(p.pid, 7) + ' ' + padEnd(p.tty, 9) + padEnd(p.time, 9) + p.cmd.split(' ')[0]);
    return ok([header, ...body].join('\n') + '\n');
  },

  top: (args, ctx) => {
    const list = [...procs(ctx)].sort((a, b) => b.cpu - a.cpu).slice(0, 10);
    const head =
      'top - 10:31:44 up 1:31,  1 user,  load average: 1.42, 0.98, 0.61\n' +
      `Tasks: ${procs(ctx).length} total,   2 running, ${procs(ctx).length - 2} sleeping,   0 stopped,   0 zombie\n` +
      '%Cpu(s): 96.2 us,  2.1 sy,  0.0 ni,  1.4 id,  0.0 wa,  0.3 hi,  0.0 si,  0.0 st\n' +
      'MiB Mem :   3936.0 total,    412.7 free,   2180.3 used,   1343.0 buff/cache\n' +
      'MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   1520.9 avail Mem\n\n' +
      pad('PID', 6) + ' ' + padEnd('USER', 9) + pad('%CPU', 6) + pad('%MEM', 6) + '  COMMAND\n';
    const body = list.map((p) => pad(p.pid, 6) + ' ' + padEnd(p.user, 9) + pad(p.cpu.toFixed(1), 6) + pad(p.mem.toFixed(1), 6) + '  ' + p.cmd.split(' ')[0]);
    return ok(head + body.join('\n') + '\n');
  },

  htop: (args, ctx) => processes.top(args, ctx),

  kill: (args, ctx) => {
    const { operands, values } = parseArgs(args, { withValue: ['s'] });
    const list = procs(ctx);
    let signal = '15';
    const flagSig = args.find((a) => /^-(\d+|[A-Z]+)$/.test(a));
    if (flagSig) signal = flagSig.slice(1);
    if (values.s) signal = values.s;
    const targets = operands.filter((o) => /^\d+$/.test(o));
    if (!targets.length) return err('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]');
    let errs = '';
    for (const pidStr of targets) {
      const pid = parseInt(pidStr, 10);
      const idx = list.findIndex((p) => p.pid === pid);
      if (idx < 0) {
        errs += `bash: kill: (${pid}) - No such process\n`;
        continue;
      }
      const p = list[idx];
      if (p.user !== ctx.user && ctx.user !== 'root') {
        errs += `bash: kill: (${pid}) - Operation not permitted\n`;
        continue;
      }
      list.splice(idx, 1);
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  killall: (args, ctx) => {
    const { operands } = parseArgs(args);
    const list = procs(ctx);
    let killed = 0;
    for (const name of operands) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].cmd.includes(name)) {
          if (list[i].user !== ctx.user && ctx.user !== 'root') continue;
          list.splice(i, 1);
          killed++;
        }
      }
    }
    return killed ? ok() : err(`${operands[0]}: no process found`);
  },

  pgrep: (args, ctx) => {
    const { operands } = parseArgs(args);
    const re = new RegExp(operands[0] || '.');
    const hits = procs(ctx).filter((p) => re.test(p.cmd));
    return { stdout: hits.map((p) => (args.includes('-l') ? `${p.pid} ${p.cmd.split(' ')[0]}` : p.pid)).join('\n') + (hits.length ? '\n' : ''), code: hits.length ? 0 : 1 };
  },

  jobs: () => ok(''),
  bg: () => ok(''),
  fg: () => err('bash: fg: current: no such job'),

  free: (args, ctx) => {
    const human = args.includes('-h');
    const mb = args.includes('-m');
    const f = (kb) => (human ? (kb >= 1048576 ? (kb / 1048576).toFixed(1) + 'Gi' : Math.round(kb / 1024) + 'Mi') : mb ? Math.round(kb / 1024) : kb);
    const rows = [
      ['               total        used        free      shared  buff/cache   available'],
      ['Mem:   ' + [f(4030464), f(2232627), f(422604), f(23552), f(1375232), f(1557402)].map((v) => pad(v, 12)).join('')],
      ['Swap:  ' + [f(2097152), f(0), f(2097152)].map((v) => pad(v, 12)).join('')],
    ];
    return ok(rows.map((r) => r[0]).join('\n') + '\n');
  },

  uptime: () => ok(' 10:31:44 up  1:31,  1 user,  load average: 1.42, 0.98, 0.61\n'),

  nice: (args, ctx) => {
    const { operands } = parseArgs(args, { withValue: ['n'] });
    if (!operands.length) return ok('0\n');
    const fn = ctx.shell.commands[operands[0]];
    if (!fn) return err(`nice: '${operands[0]}': No such file or directory`, 127);
    return fn(operands.slice(1), ctx, '');
  },

  nohup: (args, ctx) => {
    const { operands } = parseArgs(args);
    const fn = ctx.shell.commands[operands[0]];
    if (!fn) return err(`nohup: failed to run command '${operands[0]}': No such file or directory`, 127);
    const res = fn(operands.slice(1), ctx, '') || {};
    return { ...res, stderr: (res.stderr || '') + "nohup: ignoring input and appending output to 'nohup.out'\n" };
  },

  sleep: () => ok(''),
  wait: () => ok(''),
};
