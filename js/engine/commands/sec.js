// Seguridad y criptografía: sha256sum, md5sum, base64, gpg, openssl,
// getcap, setcap, ufw, iptables, last, who, w, lastb, sudo -l
import { S_DIR, S_FILE, joinPath } from '../fs.js';
import { parseArgs, ok, err, lines, padEnd } from './util.js';

// Hash determinista (FNV-1a extendido). No es criptográfico de verdad, pero se
// comporta como uno para lo que enseña la app: misma entrada, mismo digest;
// cambia un byte y cambia entero.
function digest(text, size) {
  const out = [];
  for (let seed = 0; out.length < size; seed++) {
    let h = 0x811c9dc5 ^ (seed * 0x01000193);
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    for (let b = 0; b < 4 && out.length < size; b++) out.push((h >>> (b * 8)) & 0xff);
  }
  return out.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64encode(s) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80) bytes.push(cp);
    else if (cp < 0x800) bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
  }
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += chars[b0 >> 2];
    out += chars[((b0 & 3) << 4) | ((b1 || 0) >> 4)];
    out += b1 === undefined ? '=' : chars[((b1 & 15) << 2) | ((b2 || 0) >> 6)];
    out += b2 === undefined ? '=' : chars[b2 & 63];
  }
  return out;
}

function b64decode(s) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = s.replace(/[^A-Za-z0-9+/=]/g, '').replace(/=+$/, '');
  const bytes = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    const v = chars.indexOf(ch);
    if (v < 0) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  // decodificar UTF-8
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b < 0x80) out += String.fromCharCode(b);
    else if ((b & 0xe0) === 0xc0) out += String.fromCharCode(((b & 31) << 6) | (bytes[++i] & 63));
    else out += String.fromCharCode(((b & 15) << 12) | ((bytes[++i] & 63) << 6) | (bytes[++i] & 63));
  }
  return out;
}

function hashCmd(name, size) {
  return (args, ctx, stdin) => {
    const { operands, has } = parseArgs(args);

    // -c: verificar contra un archivo de sumas
    if (has('-c', '--check')) {
      let list;
      try {
        list = ctx.fs.readFile(ctx.shell.resolve(operands[0]), ctx);
      } catch (e) {
        return err(`${name}: ${operands[0]}: ${e.message}`);
      }
      let out = '';
      let bad = 0;
      for (const line of lines(list)) {
        const m = line.match(/^([0-9a-f]+)\s+\*?(.+)$/);
        if (!m) continue;
        let actual;
        try {
          actual = digest(ctx.fs.readFile(ctx.shell.resolve(m[2]), ctx), size);
        } catch {
          out += `${m[2]}: FAILED open or read\n`;
          bad++;
          continue;
        }
        if (actual === m[1]) out += `${m[2]}: OK\n`;
        else {
          out += `${m[2]}: FAILED\n`;
          bad++;
        }
      }
      return { stdout: out, stderr: bad ? `${name}: WARNING: ${bad} computed checksum did NOT match\n` : '', code: bad ? 1 : 0 };
    }

    if (!operands.length) return ok(`${digest(stdin, size)}  -\n`);
    let out = '';
    let errs = '';
    for (const t of operands) {
      try {
        out += `${digest(ctx.fs.readFile(ctx.shell.resolve(t), ctx), size)}  ${t}\n`;
      } catch (e) {
        errs += `${name}: ${t}: ${e.message}\n`;
      }
    }
    return { stdout: out, stderr: errs, code: errs ? 1 : 0 };
  };
}

// Binarios con SUID y capabilities predefinidos, para que las auditorías
// devuelvan lo que devolvería un sistema real.
const SUID_BINARIES = [
  '/usr/bin/passwd',
  '/usr/bin/sudo',
  '/usr/bin/su',
  '/usr/bin/mount',
  '/usr/bin/umount',
  '/usr/bin/chsh',
  '/usr/bin/newgrp',
];

const CAPABILITIES = {
  '/usr/bin/ping': 'cap_net_raw=ep',
  '/usr/bin/traceroute': 'cap_net_raw+ep',
  '/usr/sbin/nginx': 'cap_net_bind_service=ep',
};

function firewall(ctx) {
  if (!ctx.shell.state.firewall) {
    ctx.shell.state.firewall = { enabled: false, defaultIn: 'allow', defaultOut: 'allow', rules: [] };
  }
  return ctx.shell.state.firewall;
}

export const sec = {
  sha256sum: hashCmd('sha256sum', 32),
  sha1sum: hashCmd('sha1sum', 20),
  sha512sum: hashCmd('sha512sum', 64),
  md5sum: hashCmd('md5sum', 16),

  base64: (args, ctx, stdin) => {
    const { operands, has } = parseArgs(args);
    let input = stdin;
    if (operands.length) {
      try {
        input = ctx.fs.readFile(ctx.shell.resolve(operands[0]), ctx);
      } catch (e) {
        return err(`base64: ${operands[0]}: ${e.message}`);
      }
    }
    if (has('-d', '--decode')) return ok(b64decode(input));
    return ok(b64encode(input) + '\n');
  },

  gpg: (args, ctx, stdin) => {
    const { operands, has, values } = parseArgs(args, { withValue: ['r', 'o'], longWithValue: ['output', 'recipient'] });

    if (has('--gen-key', '--full-generate-key')) {
      return ok('gpg: clave generada (simulada)\npub   ed25519 2026-01-15 [SC]\nuid   user <user@mentor-box>\n');
    }
    if (has('--list-keys', '-k')) {
      return ok('/home/user/.gnupg/pubring.kbx\n-----------------------------\npub   ed25519 2026-01-15 [SC]\nuid   [ultimate] user <user@mentor-box>\n');
    }

    const target = operands[0];
    if (!target) return err('gpg: no se ha indicado ningún archivo', 2);
    const path = ctx.shell.resolve(target);

    if (has('-c', '--symmetric') || has('-e', '--encrypt')) {
      let content;
      try {
        content = ctx.fs.readFile(path, ctx);
      } catch (e) {
        return err(`gpg: can't open '${target}': ${e.message}`, 2);
      }
      const out = values.o || values.output || target + '.gpg';
      ctx.fs.writeFile(ctx.shell.resolve(out), '-----BEGIN PGP MESSAGE-----\n' + b64encode(content) + '\n-----END PGP MESSAGE-----\n', ctx);
      return { stderr: `gpg: cifrado en '${out}'\n`, code: 0 };
    }

    if (has('-d', '--decrypt')) {
      let content;
      try {
        content = ctx.fs.readFile(path, ctx);
      } catch (e) {
        return err(`gpg: can't open '${target}': ${e.message}`, 2);
      }
      const m = content.match(/-----BEGIN PGP MESSAGE-----\n([\s\S]*?)\n-----END PGP MESSAGE-----/);
      if (!m) return err(`gpg: no se encontró ningún dato PGP válido en '${target}'`, 2);
      return { stdout: b64decode(m[1]), stderr: 'gpg: cifrado con clave simétrica\n', code: 0 };
    }

    return err('gpg: falta una operación (-c, -e, -d)', 2);
  },

  openssl: (args, ctx, stdin) => {
    const sub = args[0];
    if (sub === 'version') return ok('OpenSSL 3.0.11 19 Sep 2023\n');
    if (sub === 'rand') {
      const n = parseInt(args[args.length - 1], 10) || 16;
      return ok(digest('rand' + n, Math.min(n, 64)) + '\n');
    }
    if (sub === 'dgst') {
      const file = args[args.length - 1];
      try {
        const content = ctx.fs.readFile(ctx.shell.resolve(file), ctx);
        return ok(`SHA2-256(${file})= ${digest(content, 32)}\n`);
      } catch (e) {
        return err(`openssl: ${file}: ${e.message}`);
      }
    }
    if (sub === 'enc') {
      const { values } = parseArgs(args.slice(1), { withValue: ['in', 'out'], longWithValue: ['in', 'out'] });
      const inFile = values.in;
      const outFile = values.out;
      if (!inFile || !outFile) return err('openssl: hacen falta -in y -out', 1);
      try {
        const content = ctx.fs.readFile(ctx.shell.resolve(inFile), ctx);
        ctx.fs.writeFile(ctx.shell.resolve(outFile), 'Salted__' + b64encode(content), ctx);
        return ok('');
      } catch (e) {
        return err(`openssl: ${inFile}: ${e.message}`);
      }
    }
    return err(`openssl: comando no reconocido: ${sub || ''}`, 1);
  },

  getcap: (args, ctx) => {
    const { operands, has } = parseArgs(args);
    if (has('-r', '--recursive')) {
      const out = Object.entries(CAPABILITIES)
        .map(([p, c]) => `${p} ${c}`)
        .join('\n');
      return ok(out + '\n');
    }
    const t = operands[0];
    if (!t) return err('usage: getcap [-r] <filename>', 1);
    const path = ctx.shell.resolve(t);
    const cap = CAPABILITIES[path];
    return ok(cap ? `${path} ${cap}\n` : '');
  },

  setcap: (args, ctx) => {
    if (ctx.user !== 'root') return err('unable to set CAP_SETFCAP effective capability: Operation not permitted', 1);
    const cap = args[0];
    const file = args[1];
    if (!cap || !file) return err('usage: setcap <caps> <filename>', 1);
    CAPABILITIES[ctx.shell.resolve(file)] = cap;
    return ok('');
  },

  ufw: (args, ctx) => {
    const f = firewall(ctx);
    const sub = args[0];
    if (ctx.user !== 'root' && sub !== 'status') {
      return err('ERROR: You need to be root to run this script', 1);
    }
    if (sub === 'default') {
      const accion = args[1];
      const direccion = args[2] || 'incoming';
      if (!['allow', 'deny', 'reject'].includes(accion)) return err(`ERROR: Unsupported policy '${accion || ''}'`, 1);
      if (direccion === 'incoming') f.defaultIn = accion;
      else f.defaultOut = accion;
      return ok(`Default ${direccion} policy changed to '${accion}'\n(be sure to update your rules accordingly)\n`);
    }
    if (sub === 'allow' || sub === 'deny' || sub === 'limit') {
      const spec = args[1];
      if (!spec) return err('ERROR: Wrong number of arguments', 1);
      const [port, proto] = spec.split('/');
      f.rules.push({ action: sub, port, proto: proto || 'tcp' });
      return ok('Rule added\nRule added (v6)\n');
    }
    if (sub === 'delete') {
      const spec = args[2];
      f.rules = f.rules.filter((r) => String(r.port) !== String((spec || '').split('/')[0]));
      return ok('Rule deleted\n');
    }
    if (sub === 'enable') {
      f.enabled = true;
      return ok('Firewall is active and enabled on system startup\n');
    }
    if (sub === 'disable') {
      f.enabled = false;
      return ok('Firewall stopped and disabled on system startup\n');
    }
    if (sub === 'status' || !sub) {
      if (!f.enabled) return ok('Status: inactive\n');
      const head = `Status: active\n\nDefault: ${f.defaultIn} (incoming), ${f.defaultOut} (outgoing)\n\nTo                         Action      From\n--                         ------      ----\n`;
      const body = f.rules.map((r) => padEnd(`${r.port}/${r.proto}`, 27) + padEnd(r.action.toUpperCase(), 12) + 'Anywhere').join('\n');
      return ok(head + body + '\n');
    }
    return err(`ERROR: Invalid syntax`, 1);
  },

  iptables: (args, ctx) => {
    if (ctx.user !== 'root') return err('iptables v1.8.9 (nf_tables): Permission denied (you must be root).', 4);
    const { has } = parseArgs(args);
    if (has('-L') || has('--list')) {
      const f = firewall(ctx);
      return ok(
        `Chain INPUT (policy ${f.defaultIn === 'deny' ? 'DROP' : 'ACCEPT'})\n` +
          'target     prot opt source               destination\n' +
          f.rules.map((r) => `${r.action === 'allow' ? 'ACCEPT' : 'DROP'}     ${r.proto}  --  anywhere             anywhere             ${r.proto} dpt:${r.port}`).join('\n') +
          '\n\nChain FORWARD (policy DROP)\nChain OUTPUT (policy ACCEPT)\n'
      );
    }
    return ok('');
  },

  last: (args, ctx) =>
    ok(
      'user     pts/0        192.168.1.10     mié ene 15 10:25   still logged in\n' +
        'user     pts/0        192.168.1.10     mar ene 14 18:02 - 19:44  (01:42)\n' +
        'ana      pts/1        192.168.1.22     mar ene 14 09:14 - 17:30  (08:16)\n' +
        'reboot   system boot  6.6.15-amd64     mié ene 15 09:00   still running\n\nwtmp begins mar ene 14 09:14:02 2026\n'
    ),

  lastb: (args, ctx) => {
    if (ctx.user !== 'root') return err('lastb: /var/log/btmp: Permission denied', 1);
    return ok(
      'admin    ssh:notty    45.12.9.3        mié ene 15 10:26 - 10:26  (00:00)\n' +
        'root     ssh:notty    45.12.9.3        mié ene 15 10:26 - 10:26  (00:00)\n' +
        'test     ssh:notty    45.12.9.3        mié ene 15 10:26 - 10:26  (00:00)\n\nbtmp begins mié ene 15 10:26:02 2026\n'
    );
  },

  who: (args, ctx) => ok(`${ctx.user}     pts/0        2026-01-15 10:25 (192.168.1.10)\n`),

  w: (args, ctx) =>
    ok(
      ' 10:31:44 up  1:31,  1 user,  load average: 1.42, 0.98, 0.61\n' +
        'USER     TTY      FROM             LOGIN@   IDLE   WHAT\n' +
        `${padEnd(ctx.user, 9)}pts/0    192.168.1.10     10:25    0.00s  -bash\n`
    ),

  users: (args, ctx) => ok(ctx.user + '\n'),

  // sudo -l muestra qué puede ejecutar el usuario como root. Es la primera
  // comprobación de cualquier enumeración local.
  // `sudo -l` lee la política real de /etc/sudoers cuando el snapshot la
  // define. Sin eso, toda máquina contestaría «(ALL : ALL) ALL» y no habría
  // nada que enumerar: el permiso concreto ES el hallazgo.
  sudoList: (ctx) => {
    const cabecera =
      `Matching Defaults entries for ${ctx.user} on ${ctx.shell.hostname || 'mentor-box'}:\n` +
      '    env_reset, mail_badpass, secure_path=/usr/local/sbin\\:/usr/local/bin\\:/usr/sbin\\:/usr/bin\\:/sbin\\:/bin\n\n';
    let reglas = [];
    try {
      // `sudo -l` consulta la política con privilegios: no requiere que el
      // usuario pueda leer /etc/sudoers (que suele ser modo 440).
      const sudoers = ctx.fs.readFile('/etc/sudoers', { ...ctx, user: 'root', groups: ['root'] });
      for (const linea of sudoers.split('\n')) {
        const limpia = linea.replace(/#.*/, '').trim();
        if (!limpia || limpia.startsWith('Defaults')) continue;
        const quien = limpia.split(/\s+/)[0];
        const esGrupo = quien.startsWith('%') && ctx.groups.includes(quien.slice(1));
        if (quien !== ctx.user && !esGrupo) continue;
        // «deploy ALL=(root) NOPASSWD: /usr/bin/find» → «(root) NOPASSWD: /usr/bin/find»
        reglas.push('    ' + limpia.slice(quien.length).replace(/^\s*ALL\s*=\s*/, '').trim());
      }
    } catch {}
    if (!reglas.length) reglas = ['    (ALL : ALL) ALL'];
    return ok(cabecera + `User ${ctx.user} may run the following commands on ${ctx.shell.hostname || 'mentor-box'}:\n` + reglas.join('\n') + '\n');
  },
};

export { SUID_BINARIES, CAPABILITIES, digest, b64encode, b64decode };
