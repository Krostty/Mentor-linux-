// Red: ip, ifconfig, ping, curl, wget, ss, netstat, ssh, scp, dig, host, traceroute, hostname
import { parseArgs, ok, err, padEnd, pad } from './util.js';

const HOSTS = {
  'localhost': '127.0.0.1',
  '127.0.0.1': '127.0.0.1',
  'servidor.local': '192.168.1.50',
  'google.com': '142.250.185.46',
  'github.com': '140.82.121.4',
  'example.com': '93.184.216.34',
  'debian.org': '151.101.66.132',
  'api.local': '192.168.1.60',
  'intranet.local': '192.168.1.70',
  'correo.local': '192.168.1.80',
  'mentor.dev': '10.30.0.15',
};

// Zonas DNS: un dominio no solo tiene dirección. Sin MX, TXT y NS no se puede
// enseñar por qué `dig dominio` «no devuelve nada» cuando preguntas mal.
const ZONAS = {
  'mentor.dev': {
    A: ['10.30.0.15'],
    MX: ['10 correo.mentor.dev.'],
    TXT: ['"v=spf1 ip4:10.30.0.15 -all"'],
    NS: ['ns1.mentor.dev.', 'ns2.mentor.dev.'],
  },
  'api.local': { A: ['192.168.1.60'], TXT: ['"entorno=pruebas"'], NS: ['ns1.local.'] },
  'correo.local': { A: ['192.168.1.80'], MX: ['5 correo.local.'], NS: ['ns1.local.'] },
  'intranet.local': { A: ['192.168.1.70'], CNAME: [], NS: ['ns1.local.'] },
  'example.com': { A: ['93.184.216.34'], NS: ['a.iana-servers.net.'], TXT: ['"v=spf1 -all"'] },
  'github.com': { A: ['140.82.121.4'], MX: ['1 aspmx.l.google.com.'], NS: ['dns1.p08.nsone.net.'] },
  'google.com': { A: ['142.250.185.46'], MX: ['10 smtp.google.com.'], NS: ['ns1.google.com.'] },
  'debian.org': { A: ['151.101.66.132'], NS: ['nsp.dnsnode.net.'] },
  'servidor.local': { A: ['192.168.1.50'], NS: ['ns1.local.'] },
};

const TIPOS_DNS = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'PTR', 'SOA', 'ANY'];

// Un servidor DNS que no conoce la zona responde, pero sin respuesta: es el
// caso que confunde a todo el mundo la primera vez.
const RESOLUTORES = { '192.168.1.1': true, '1.1.1.1': true, '8.8.8.8': true, '192.168.1.99': false };

// Las páginas ya no son solo cuerpo: llevan código y cabeceras, para poder
// enseñar 200 frente a 301 y 404.
const PAGES = {
  'http://example.com': { code: 200, body: '<!doctype html>\n<html><head><title>Example Domain</title></head>\n<body><h1>Example Domain</h1></body></html>' },
  'http://localhost': { code: 200, body: '<!doctype html>\n<html><body><h1>Welcome to nginx!</h1></body></html>' },
  'http://localhost:8080/health': { code: 200, tipo: 'application/json', body: '{"status":"ok","uptime":5412}' },
  'http://api.local/status': { code: 200, tipo: 'application/json', body: '{"service":"api","state":"degraded","errors":17}' },
  'http://api.local': { code: 301, location: 'http://api.local/status', body: '' },
  'http://api.local/salud': { code: 404, body: 'Not Found' },
  'http://api.local/version': { code: 200, tipo: 'application/json', body: '{"version":"2.4.1"}' },
  'http://intranet.local': { code: 301, location: 'http://intranet.local/inicio', body: '' },
  'http://intranet.local/inicio': { code: 200, body: '<!doctype html>\n<html><body><h1>Intranet Mentor</h1></body></html>' },
  'http://intranet.local/robots.txt': { code: 200, tipo: 'text/plain', body: 'User-agent: *\nDisallow: /admin\nDisallow: /copias' },
  'http://intranet.local/admin': { code: 403, body: 'Forbidden' },
  'http://mentor.dev': { code: 200, body: '<!doctype html>\n<html><body><h1>Mentor Dev</h1></body></html>' },
};

function paginaDe(url, ctx) {
  const key = String(url || '').replace(/\/$/, '');
  const propias = ctx.shell.state.machine?.pages || {};
  const enMaquina = propias[key] ?? propias[key.replace('https://', 'http://')];
  if (enMaquina != null) return typeof enMaquina === 'string' ? { code: 200, body: enMaquina } : enMaquina;
  return PAGES[key] || PAGES[key.replace('https://', 'http://')] || null;
}

const ESTADOS = { 200: 'OK', 301: 'Moved Permanently', 302: 'Found', 403: 'Forbidden', 404: 'Not Found', 500: 'Internal Server Error' };

function seccionDig(host, tipo, registros, servidor = '') {
  return `; <<>> DiG 9.18.24 <<>>${servidor ? ` @${servidor}` : ''} ${tipo === 'A' ? '' : tipo + ' '}${host}\n` +
    `;; ->>HEADER<<- opcode: QUERY, status: NOERROR\n;; ANSWER: ${registros.length}\n\n` +
    `;; QUESTION SECTION:\n;${host}.\t\tIN\t${tipo}\n\n` +
    `;; ANSWER SECTION:\n${registros.map(([t, v]) => `${host}.\t\t300\tIN\t${t}\t${v}`).join('\n')}\n`;
}

// El nombre se resuelve primero por /etc/hosts, como hace el sistema real.
function resolver(host, ctx) {
  if (!host) return null;
  // Una dirección numérica no necesita resolución.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return host;
  try {
    const hosts = ctx.fs.readFile('/etc/hosts', ctx);
    for (const linea of hosts.split('\n')) {
      const limpia = linea.replace(/#.*/, '').trim();
      if (!limpia) continue;
      const [ip, ...nombres] = limpia.split(/\s+/);
      if (nombres.includes(host)) return ip;
    }
  } catch {}
  return HOSTS[host] || null;
}

export const net = {
  hostname: (args, ctx) => ok(args.includes('-I') ? `${ctx.shell.state.machine?.ip || '192.168.1.50'} \n` : `${ctx.shell.hostname || 'mentor-box'}\n`),

  ip: (args, ctx) => {
    const sub = args[0];
    if (sub === 'a' || sub === 'addr' || sub === 'address' || !sub) {
      return ok(
        '1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n' +
          '    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00\n' +
          '    inet 127.0.0.1/8 scope host lo\n' +
          '2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000\n' +
          '    link/ether 52:54:00:a1:b2:c3 brd ff:ff:ff:ff:ff:ff\n' +
          '    inet 192.168.1.50/24 brd 192.168.1.255 scope global dynamic eth0\n'
      );
    }
    if (sub === 'r' || sub === 'route') {
      return ok('default via 192.168.1.1 dev eth0 proto dhcp metric 100\n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.50\n');
    }
    if (sub === 'l' || sub === 'link') {
      return ok('1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN\n2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP\n');
    }
    return err(`Object "${sub}" is unknown, try "ip help".`);
  },

  ifconfig: (args, ctx) =>
    ok(
      'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n' +
        '        inet 192.168.1.50  netmask 255.255.255.0  broadcast 192.168.1.255\n' +
        '        ether 52:54:00:a1:b2:c3  txqueuelen 1000  (Ethernet)\n' +
        '        RX packets 184203  bytes 210443122 (200.6 MiB)\n' +
        '        TX packets 91442  bytes 12044210 (11.4 MiB)\n\n' +
        'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n' +
        '        inet 127.0.0.1  netmask 255.0.0.0\n'
    ),

  ping: (args, ctx) => {
    const { operands, values } = parseArgs(args, { withValue: ['c'] });
    const host = operands[0];
    if (!host) return err('ping: usage error: Destination address required', 2);
    const machine = ctx.shell.state.machine;
    const ip = machine && (host === machine.host || host === machine.ip) ? machine.ip : resolver(host, ctx);
    if (!ip) return err(`ping: ${host}: Name or service not known`, 2);
    const count = parseInt(values.c || '4', 10);
    const out = [`PING ${host} (${ip}) 56(84) bytes of data.`];
    let sum = 0;
    for (let i = 1; i <= count; i++) {
      const t = (12.4 + i * 0.7).toFixed(1);
      sum += parseFloat(t);
      out.push(`64 bytes from ${ip}: icmp_seq=${i} ttl=56 time=${t} ms`);
    }
    const avg = (sum / count).toFixed(3);
    out.push('', `--- ${host} ping statistics ---`, `${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 1000}ms`, `rtt min/avg/max/mdev = 12.400/${avg}/18.700/1.902 ms`);
    return ok(out.join('\n') + '\n');
  },

  curl: (args, ctx) => {
    const { operands, has, values } = parseArgs(args, { withValue: ['o', 'X', 'H', 'd', 'w'] });
    const url = operands[0];
    if (!url) return err('curl: try \'curl --help\' for more information', 2);

    let pagina = paginaDe(url, ctx);
    if (!pagina) {
      const dominio = url.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
      // Si el nombre resuelve pero la ruta no existe, el error es 404, no DNS.
      if (resolver(dominio, ctx)) pagina = { code: 404, body: 'Not Found' };
      else return err(`curl: (6) Could not resolve host: ${dominio}`, 6);
    }

    // -L sigue la redirección hasta la página final.
    let saltos = 0;
    while (has('-L') && pagina.location && saltos++ < 5) {
      pagina = paginaDe(pagina.location, ctx) || { code: 404, body: 'Not Found' };
    }

    const cuerpo = pagina.body || '';
    const cabeceras = [
      `HTTP/1.1 ${pagina.code} ${ESTADOS[pagina.code] || 'OK'}`,
      'Server: nginx/1.24.0',
      `Content-Type: ${pagina.tipo || 'text/html'}`,
      `Content-Length: ${cuerpo.length}`,
      ...(pagina.location ? [`Location: ${pagina.location}`] : []),
    ].join('\n');

    if (has('-I')) return ok(cabeceras + '\n\n');
    if (values.w) return ok(values.w.replace(/%\{http_code\}/g, String(pagina.code)).replace(/\\n/g, '\n'));
    if (values.o) {
      ctx.fs.writeFile(ctx.shell.resolve(values.o), cuerpo + '\n', ctx);
      return ok('');
    }
    // Sin -L, una redirección devuelve el cuerpo vacío: es lo que despista.
    if (pagina.location && !has('-L')) return ok('');
    return ok(cuerpo + '\n');
  },

  wget: (args, ctx) => {
    const { operands } = parseArgs(args, { withValue: ['O'] });
    const url = operands[0];
    const pagina = paginaDe(url, ctx);
    if (!pagina) return err(`wget: unable to resolve host address '${(url || '').replace(/^https?:\/\//, '')}'`, 4);
    const cuerpo = pagina.body || '';
    const name = url.split('/').pop() || 'index.html';
    ctx.fs.writeFile(ctx.shell.resolve(name), cuerpo + '\n', ctx);
    return { stderr: `Saving to: '${name}'\n\n'${name}' saved [${cuerpo.length}]\n`, code: 0 };
  },

  // `ss` sin filtros lo lista todo; con -t, -u o -l enseña a acotar, que es
  // justo la habilidad que se practica.
  ss: (args, ctx) => {
    const { has } = parseArgs(args);
    const filas = [
      { netid: 'tcp', estado: 'LISTEN', local: '0.0.0.0:22', par: '0.0.0.0:*', proc: 'users:(("sshd",pid=638))' },
      { netid: 'tcp', estado: 'LISTEN', local: '0.0.0.0:80', par: '0.0.0.0:*', proc: 'users:(("nginx",pid=702))' },
      { netid: 'tcp', estado: 'LISTEN', local: '0.0.0.0:443', par: '0.0.0.0:*', proc: 'users:(("nginx",pid=702))' },
      { netid: 'tcp', estado: 'LISTEN', local: '127.0.0.1:5432', par: '0.0.0.0:*', proc: 'users:(("postgres",pid=890))' },
      { netid: 'tcp', estado: 'ESTAB', local: '192.168.1.50:22', par: '192.168.1.10:51422', proc: 'users:(("sshd",pid=1188))' },
      { netid: 'tcp', estado: 'ESTAB', local: '192.168.1.50:443', par: '192.168.1.23:44120', proc: 'users:(("nginx",pid=702))' },
      { netid: 'udp', estado: 'UNCONN', local: '0.0.0.0:53', par: '0.0.0.0:*', proc: 'users:(("systemd-resolve",pid=410))' },
      { netid: 'udp', estado: 'UNCONN', local: '0.0.0.0:123', par: '0.0.0.0:*', proc: 'users:(("chronyd",pid=522))' },
    ];
    const soloTcp = has('-t');
    const soloUdp = has('-u');
    let vistas = filas;
    if (soloTcp && !soloUdp) vistas = vistas.filter((f) => f.netid === 'tcp');
    if (soloUdp && !soloTcp) vistas = vistas.filter((f) => f.netid === 'udp');
    // -l son las que escuchan; -a las incluye todas.
    if (has('-l') && !has('-a')) vistas = vistas.filter((f) => f.estado === 'LISTEN' || f.estado === 'UNCONN');
    const conProceso = has('-p');
    const cabecera = ['Netid', 'State', 'Local Address:Port', 'Peer Address:Port', ...(conProceso ? ['Process'] : [])];
    const lineas = [cabecera, ...vistas.map((f) => [f.netid, f.estado, f.local, f.par, ...(conProceso ? [f.proc] : [])])];
    return ok(lineas.map((r) => padEnd(r[0], 7) + padEnd(r[1], 8) + padEnd(r[2], 22) + padEnd(r[3], 20) + (r[4] || '')).join('\n') + '\n');
  },

  netstat: (args, ctx) => net.ss(args, ctx),

  ssh: (args, ctx) => {
    const { operands } = parseArgs(args, { withValue: ['p', 'i'] });
    const target = operands[0];
    if (!target) return err('usage: ssh [-p port] destination', 255);
    const host = target.includes('@') ? target.split('@')[1] : target;
    const user = target.includes('@') ? target.split('@')[0] : ctx.user;
    const machine = ctx.shell.state.machine;
    if (machine && (host === machine.host || host === machine.ip)) {
      if (!machine.accessUnlocked) return err(`Permission denied (publickey,password).`, 255);
      const allowed = machine.user || 'operator';
      if (user !== allowed) return err(`Permission denied (publickey,password).`, 255);
      ctx.shell.setUser(allowed);
      ctx.shell.hostname = machine.host;
      ctx.shell.cwd = `/home/${allowed}`;
      ctx.shell.env.PWD = ctx.shell.cwd;
      return ok(`Welcome to ${machine.os || 'Linux'}\nLast login: Wed Jan 15 10:12:03 2026 from 10.10.14.2\n`);
    }
    if (!resolver(host, ctx)) return err(`ssh: Could not resolve hostname ${host}: Name or service not known`, 255);
    return ok(`Welcome to Debian GNU/Linux 12 (bookworm)\nLast login: Wed Jan 15 09:12:03 2026 from 192.168.1.10\n(sesión simulada: en Mentor Linux la conexión no sale del dispositivo)\n`);
  },

  scp: (args, ctx) => {
    const { operands } = parseArgs(args);
    if (operands.length < 2) return err('usage: scp source ... target', 1);
    return ok(`${operands[0].split('/').pop()}          100%  4096    1.2MB/s   00:00\n`);
  },

  // dig dominio | dig MX dominio | dig -t TXT dominio | dig @servidor dominio
  dig: (args, ctx) => {
    const { operands, values } = parseArgs(args, { withValue: ['t'] });
    const servidor = (args.find((a) => a.startsWith('@')) || '').slice(1);
    const sueltos = operands.filter((o) => !o.startsWith('+') && !o.startsWith('@'));
    const tipoSuelto = sueltos.find((o) => TIPOS_DNS.includes(o.toUpperCase()));
    const tipo = (values.t || tipoSuelto || 'A').toUpperCase();
    const host = sueltos.find((o) => o !== tipoSuelto) || '';
    const corto = args.includes('+short');

    // Preguntar a un resolutor que no conoce la zona no es NXDOMAIN: es una
    // respuesta vacía, y saber distinguirlo es medio diagnóstico de DNS.
    if (servidor && RESOLUTORES[servidor] === false) {
      return corto ? ok('') : ok(`; <<>> DiG 9.18.24 <<>> @${servidor} ${host}\n;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL\n`);
    }

    const zona = ZONAS[host];
    const registros = tipo === 'ANY'
      ? Object.entries(zona || {}).flatMap(([t, vs]) => vs.map((v) => [t, v]))
      : (zona?.[tipo] || []).map((v) => [tipo, v]);

    if (!zona && !resolver(host, ctx)) {
      return corto ? ok('') : ok(`; <<>> DiG 9.18.24 <<>> ${host}\n;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN\n\n;; QUESTION SECTION:\n;${host}.\t\tIN\t${tipo}\n`);
    }
    // El dominio existe pero no tiene ese tipo de registro: NOERROR y 0 respuestas.
    if (!registros.length) {
      const ip = resolver(host, ctx);
      if (tipo === 'A' && ip) return corto ? ok(ip + '\n') : ok(seccionDig(host, tipo, [['A', ip]]));
      return corto ? ok('') : ok(`; <<>> DiG 9.18.24 <<>> ${host}\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR\n;; ANSWER: 0\n\n;; QUESTION SECTION:\n;${host}.\t\tIN\t${tipo}\n`);
    }
    if (corto) return ok(registros.map(([, v]) => v).join('\n') + '\n');
    return ok(seccionDig(host, tipo, registros, servidor));
  },

  host: (args, ctx) => {
    const { operands, values } = parseArgs(args, { withValue: ['t'] });
    const h = operands[0];
    const tipo = (values.t || 'A').toUpperCase();
    const zona = ZONAS[h];
    if (tipo !== 'A' && zona?.[tipo]?.length) {
      const etiqueta = { MX: 'mail is handled by', TXT: 'descriptive text', NS: 'name server' }[tipo] || 'has record';
      return ok(zona[tipo].map((v) => `${h} ${etiqueta} ${v}`).join('\n') + '\n');
    }
    const ip = resolver(h, ctx);
    return ip ? ok(`${h} has address ${ip}\n`) : err(`Host ${h} not found: 3(NXDOMAIN)`);
  },

  traceroute: (args, ctx) => {
    const h = args[0];
    const ip = resolver(h, ctx);
    if (!ip) return err(`traceroute: unknown host ${h}`, 2);
    return ok(
      `traceroute to ${h} (${ip}), 30 hops max, 60 byte packets\n` +
        ' 1  _gateway (192.168.1.1)  1.204 ms  1.180 ms\n' +
        ' 2  10.20.0.1 (10.20.0.1)  8.412 ms  8.390 ms\n' +
        ` 3  ${ip} (${ip})  14.201 ms  14.188 ms\n`
    );
  },
};
