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
};

const PAGES = {
  'http://example.com': '<!doctype html>\n<html><head><title>Example Domain</title></head>\n<body><h1>Example Domain</h1></body></html>',
  'http://localhost': '<!doctype html>\n<html><body><h1>Welcome to nginx!</h1></body></html>',
  'http://localhost:8080/health': '{"status":"ok","uptime":5412}',
  'http://api.local/status': '{"service":"api","state":"degraded","errors":17}',
};

export const net = {
  hostname: (args, ctx) => ok(args.includes('-I') ? '192.168.1.50 \n' : 'mentor-box\n'),

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
    const ip = HOSTS[host];
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
    const { operands, has, values } = parseArgs(args, { withValue: ['o', 'X', 'H', 'd'] });
    const url = operands[0];
    if (!url) return err('curl: try \'curl --help\' for more information', 2);
    const key = url.replace(/\/$/, '');
    const body = PAGES[key] || PAGES[key.replace('https://', 'http://')];
    if (!body) return err(`curl: (6) Could not resolve host: ${url.replace(/^https?:\/\//, '').split('/')[0]}`, 6);
    if (has('-I')) return ok('HTTP/1.1 200 OK\nServer: nginx/1.24.0\nContent-Type: text/html\nContent-Length: ' + body.length + '\n\n');
    if (values.o) {
      ctx.fs.writeFile(ctx.shell.resolve(values.o), body + '\n', ctx);
      return ok('');
    }
    return ok(body + '\n');
  },

  wget: (args, ctx) => {
    const { operands } = parseArgs(args);
    const url = operands[0];
    const key = (url || '').replace(/\/$/, '');
    const body = PAGES[key] || PAGES[key.replace('https://', 'http://')];
    if (!body) return err(`wget: unable to resolve host address '${(url || '').replace(/^https?:\/\//, '')}'`, 4);
    const name = url.split('/').pop() || 'index.html';
    ctx.fs.writeFile(ctx.shell.resolve(name), body + '\n', ctx);
    return { stderr: `Saving to: '${name}'\n\n'${name}' saved [${body.length}]\n`, code: 0 };
  },

  ss: (args, ctx) => {
    const rows = [
      ['Netid', 'State', 'Local Address:Port', 'Peer Address:Port', 'Process'],
      ['tcp', 'LISTEN', '0.0.0.0:22', '0.0.0.0:*', 'users:(("sshd",pid=638))'],
      ['tcp', 'LISTEN', '0.0.0.0:80', '0.0.0.0:*', 'users:(("nginx",pid=702))'],
      ['tcp', 'LISTEN', '127.0.0.1:5432', '0.0.0.0:*', 'users:(("postgres",pid=890))'],
      ['tcp', 'ESTAB', '192.168.1.50:22', '192.168.1.10:51422', 'users:(("sshd",pid=1188))'],
    ];
    return ok(rows.map((r) => padEnd(r[0], 7) + padEnd(r[1], 8) + padEnd(r[2], 22) + padEnd(r[3], 20) + r[4]).join('\n') + '\n');
  },

  netstat: (args, ctx) => net.ss(args, ctx),

  ssh: (args, ctx) => {
    const { operands } = parseArgs(args, { withValue: ['p', 'i'] });
    const target = operands[0];
    if (!target) return err('usage: ssh [-p port] destination', 255);
    const host = target.includes('@') ? target.split('@')[1] : target;
    if (!HOSTS[host]) return err(`ssh: Could not resolve hostname ${host}: Name or service not known`, 255);
    return ok(`Welcome to Debian GNU/Linux 12 (bookworm)\nLast login: Wed Jan 15 09:12:03 2026 from 192.168.1.10\n(sesión simulada: en Mentor Linux la conexión no sale del dispositivo)\n`);
  },

  scp: (args, ctx) => {
    const { operands } = parseArgs(args);
    if (operands.length < 2) return err('usage: scp source ... target', 1);
    return ok(`${operands[0].split('/').pop()}          100%  4096    1.2MB/s   00:00\n`);
  },

  dig: (args, ctx) => {
    const { operands } = parseArgs(args);
    const host = operands.find((o) => !o.startsWith('+')) || '';
    const ip = HOSTS[host];
    if (args.includes('+short')) return ip ? ok(ip + '\n') : ok('');
    if (!ip) return ok(`; <<>> DiG 9.18.24 <<>> ${host}\n;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN\n`);
    return ok(`; <<>> DiG 9.18.24 <<>> ${host}\n;; ->>HEADER<<- opcode: QUERY, status: NOERROR\n\n;; ANSWER SECTION:\n${host}.\t\t300\tIN\tA\t${ip}\n`);
  },

  host: (args, ctx) => {
    const h = args[0];
    const ip = HOSTS[h];
    return ip ? ok(`${h} has address ${ip}\n`) : err(`Host ${h} not found: 3(NXDOMAIN)`);
  },

  traceroute: (args, ctx) => {
    const h = args[0];
    const ip = HOSTS[h];
    if (!ip) return err(`traceroute: unknown host ${h}`, 2);
    return ok(
      `traceroute to ${h} (${ip}), 30 hops max, 60 byte packets\n` +
        ' 1  _gateway (192.168.1.1)  1.204 ms  1.180 ms\n' +
        ' 2  10.20.0.1 (10.20.0.1)  8.412 ms  8.390 ms\n' +
        ` 3  ${ip} (${ip})  14.201 ms  14.188 ms\n`
    );
  },
};
