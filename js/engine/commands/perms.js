// Permisos e identidad: chmod, chown, chgrp, umask, id, whoami, groups, su, sudo, passwd, useradd
import { applyMode, modeString, S_DIR, joinPath } from '../fs.js';
import { parseArgs, ok, err, fsErr } from './util.js';
import { sec } from './sec.js';

const sudoList = (ctx) => sec.sudoList(ctx);

function walkNodes(fs, path, ctx, fn) {
  let node;
  try {
    node = fs.lookup(path, ctx);
  } catch (e) {
    throw e;
  }
  fn(node, path);
  if (node.type === S_DIR) {
    for (const [name] of node.children) walkNodes(fs, joinPath(path, name), ctx, fn);
  }
}

export const perms = {
  chmod: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    if (operands.length < 2) return err('chmod: missing operand');
    const [spec, ...targets] = operands;
    const recursive = has('-R', '--recursive');
    const verbose = has('-v');
    let out = '';
    let errs = '';
    for (const t of targets) {
      const path = ctx.shell.resolve(t);
      try {
        const apply = (node, p) => {
          if (ctx.user !== 'root' && node.owner !== ctx.user) {
            errs += `chmod: changing permissions of '${t}': Operation not permitted\n`;
            return;
          }
          node.mode = applyMode(node.mode, spec);
          if (verbose) out += `mode of '${p}' changed to ${(node.mode & 0o777).toString(8)} (${modeString(node).slice(1)})\n`;
        };
        if (recursive) walkNodes(ctx.fs, path, ctx, apply);
        else apply(ctx.fs.lookup(path, ctx), t);
      } catch (e) {
        errs += `chmod: cannot access '${t}': ${e.message}\n`;
      }
    }
    return { stdout: out, stderr: errs, code: errs ? 1 : 0 };
  },

  chown: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    if (operands.length < 2) return err('chown: missing operand');
    const [spec, ...targets] = operands;
    const [owner, group] = spec.split(':');
    if (ctx.user !== 'root') return err(`chown: changing ownership of '${targets[0]}': Operation not permitted`);
    let errs = '';
    for (const t of targets) {
      const path = ctx.shell.resolve(t);
      try {
        const apply = (node) => {
          if (owner) node.owner = owner;
          if (group) node.group = group;
        };
        if (has('-R', '--recursive')) walkNodes(ctx.fs, path, ctx, apply);
        else apply(ctx.fs.lookup(path, ctx));
      } catch (e) {
        errs += `chown: cannot access '${t}': ${e.message}\n`;
      }
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  chgrp: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    if (operands.length < 2) return err('chgrp: missing operand');
    const [group, ...targets] = operands;
    let errs = '';
    for (const t of targets) {
      try {
        const node = ctx.fs.lookup(ctx.shell.resolve(t), ctx);
        if (ctx.user !== 'root' && node.owner !== ctx.user) {
          errs += `chgrp: changing group of '${t}': Operation not permitted\n`;
          continue;
        }
        const apply = (n) => (n.group = group);
        if (has('-R')) walkNodes(ctx.fs, ctx.shell.resolve(t), ctx, apply);
        else apply(node);
      } catch (e) {
        errs += `chgrp: cannot access '${t}': ${e.message}\n`;
      }
    }
    return errs ? { stderr: errs, code: 1 } : ok();
  },

  umask: (args, ctx) => {
    if (!args.length) return ok('0' + ctx.shell.umask.toString(8).padStart(3, '0') + '\n');
    const v = parseInt(args[0], 8);
    if (isNaN(v)) return err(`umask: ${args[0]}: invalid number`);
    ctx.shell.umask = v;
    return ok();
  },

  whoami: (args, ctx) => ok(ctx.user + '\n'),

  id: (args, ctx) => {
    const uid = ctx.user === 'root' ? 0 : 1000;
    const gid = uid;
    if (args.includes('-u')) return ok(uid + '\n');
    if (args.includes('-g')) return ok(gid + '\n');
    if (args.includes('-n')) return ok(ctx.user + '\n');
    const extra = ctx.user === 'root' ? '' : ',27(sudo),100(users)';
    return ok(`uid=${uid}(${ctx.user}) gid=${gid}(${ctx.user}) groups=${gid}(${ctx.user})${extra}\n`);
  },

  groups: (args, ctx) => ok(ctx.groups.join(' ') + '\n'),

  su: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    const target = operands[0] || 'root';
    if (ctx.user !== 'root' && target === 'root' && !ctx.shell.allowRootSwitch) {
      return err('su: Authentication failure');
    }
    ctx.shell.setUser(target);
    return ok();
  },

  sudo: (args, ctx) => {
    const { operands, has } = parseArgs(args, { withValue: ['u'] });
    // `sudo -l` lista qué puedes ejecutar como root: primera parada de
    // cualquier enumeración local.
    if (has('-l', '--list')) return sudoList(ctx);
    if (has('-i', '-s') || !operands.length) {
      ctx.shell.setUser('root');
      return ok();
    }
    if (!ctx.groups.includes('sudo') && ctx.user !== 'root') {
      return err(`${ctx.user} is not in the sudoers file.  This incident will be reported.`);
    }
    const prev = ctx.shell.user;
    ctx.shell.setUser('root');
    try {
      const cmdName = operands[0];
      const fn = ctx.shell.commands[cmdName];
      if (!fn) return err(`sudo: ${cmdName}: command not found`, 127);
      return fn(operands.slice(1), ctx.shell.ctx, '') || ok();
    } finally {
      ctx.shell.setUser(prev);
    }
  },

  passwd: (args, ctx) => {
    const target = args.find((a) => !a.startsWith('-')) || ctx.user;
    if (ctx.user !== 'root' && target !== ctx.user) return err('passwd: You may not view or modify password information for ' + target + '.');
    return ok(`Changing password for ${target}.\npasswd: password updated successfully\n`);
  },

  useradd: (args, ctx) => {
    const { operands } = parseArgs(args, { withValue: ['m', 'g', 'G', 's'] });
    if (ctx.user !== 'root') return err('useradd: Permission denied.');
    const name = operands[0];
    if (!name) return err('useradd: missing operand');
    try {
      ctx.fs.mkdir('/home/' + name, ctx, { parents: true });
      const passwd = ctx.fs.readFile('/etc/passwd', ctx);
      ctx.fs.writeFile('/etc/passwd', passwd + `${name}:x:1001:1001::/home/${name}:/bin/bash\n`, ctx);
    } catch {}
    return ok();
  },
};
