import { MACHINE_SEEDS } from './snapshots.js';
import { hashRespuesta } from './secretos.js';
import * as k from './checks.js';

const NOMBRES = ['Lumen', 'Forge', 'Pulse', 'Archive', 'Signal', 'Bastion', 'Mirage', 'Ledger', 'Vector', 'Citadel', 'Kernel', 'Eclipse'];
const DIFICULTADES = ['Fácil', 'Fácil', 'Fácil', 'Fácil', 'Fácil', 'Media', 'Media', 'Media', 'Media', 'Difícil', 'Difícil', 'Difícil'];
const SISTEMAS = ['Debian 12', 'Ubuntu 24.04', 'Alpine 3.20', 'Debian 11', 'Ubuntu 22.04', 'Rocky Linux 9', 'Debian 12', 'Ubuntu 24.04', 'Alpine 3.20', 'Rocky Linux 9', 'Debian 12', 'Ubuntu 24.04'];
const TECNICAS = ['sudo', 'suid', 'capabilities', 'cron', 'path', 'groups', 'sudo', 'suid', 'cron', 'capabilities', 'path', 'groups'];
const SERVICIOS = [
  [[22, 'ssh', 'OpenSSH 9.2p1'], [80, 'http', 'nginx 1.22.1']],
  [[22, 'ssh', 'OpenSSH 8.9p1'], [3000, 'http', 'Node.js Express']],
  [[21, 'ftp', 'vsftpd 3.0.5'], [22, 'ssh', 'OpenSSH 9.6p1']],
  [[22, 'ssh', 'OpenSSH 8.4p1'], [8000, 'http', 'Python http.server']],
  [[22, 'ssh', 'OpenSSH 8.9p1'], [31337, 'unknown', 'Mentor telemetry']],
  [[22, 'ssh', 'OpenSSH 8.7p1'], [443, 'https', 'Apache 2.4.57']],
  [[22, 'ssh', 'OpenSSH 9.2p1'], [80, 'http', 'nginx 1.22.1'], [8080, 'http-proxy', 'Squid']],
  [[22, 'ssh', 'OpenSSH 9.6p1'], [5432, 'postgresql', 'PostgreSQL 15']],
  [[22, 'ssh', 'OpenSSH 9.6p1'], [9000, 'http', 'PHP-FPM']],
  [[22, 'ssh', 'OpenSSH 8.7p1'], [8443, 'https-alt', 'Jetty 11']],
  [[22, 'ssh', 'OpenSSH 9.2p1'], [5000, 'http', 'Werkzeug']],
  [[22, 'ssh', 'OpenSSH 9.6p1'], [8080, 'http', 'Tomcat 10']],
];

function profile(seed, i) {
  const [id, user] = seed;
  const ip = `10.10.10.${21 + i}`;
  const host = `${id}.box`;
  const token = `ACCESS-${id.toUpperCase()}-${user}`;
  const ports = SERVICIOS[i].map(([port, service, version]) => ({
    port, service, version,
    banner: port === 31337 ? `Mentor telemetry\n${token}\n` : `${service.toUpperCase()} ${version}\n`,
  }));
  return {
    id, ip, host, user, os: SISTEMAS[i], ports, token,
    pages: {
      [`http://${host}`]: `<h1>${NOMBRES[i]}</h1>\n<!-- ${token} -->`,
      [`http://${host}/robots.txt`]: `Disallow: /backup-${id}\n# ${token}`,
      [`http://${host}:3000`]: `{"service":"forge","debug":"${token}"}`,
      [`http://${host}:8000`]: `index of /backup\n${token}`,
      [`http://${host}:8080`]: `proxy diagnostic: ${token}`,
    },
  };
}

function enumeracionDe(p, i) {
  if (p.ports.some((x) => x.port === 31337)) return `nc ${p.host} 31337`;
  if (p.ports.some((x) => x.port === 3000)) return `curl http://${p.host}:3000`;
  if (p.ports.some((x) => x.port === 8000)) return `curl http://${p.host}:8000`;
  if (p.ports.some((x) => x.port === 8080)) return `curl http://${p.host}:8080`;
  return `curl http://${p.host}/robots.txt`;
}

function escaladaDe(tecnica) {
  if (tecnica === 'sudo') return ['sudo -l\nsudo -i', (c) => c.shell.user === 'root'];
  if (tecnica === 'suid') return ['find / -perm -4000 2>/dev/null', (c) => k.salidaTiene(c, '/usr/bin/find')];
  if (tecnica === 'capabilities') return ['getcap -r / 2>/dev/null', (c) => k.salidaTiene(c, 'cap_net_raw')];
  if (tecnica === 'cron') return ['cat /etc/crontab', (c) => k.salidaTiene(c, 'run-parts')];
  if (tecnica === 'path') return ['echo $PATH && ls -l /usr/local/bin/backup.sh', (c) => k.salidaTiene(c, '/usr/local/bin', 'backup.sh')];
  return ['id', (c) => k.salidaTiene(c, 'groups=')];
}

export const MAQUINAS = MACHINE_SEEDS.map((seed, i) => {
  const [id, user, userFlag, rootFlag] = seed;
  const p = profile(seed, i);
  const tecnica = TECNICAS[i];
  const enumSolution = enumeracionDe(p, i);
  const [privSolution, privCheck] = escaladaDe(tecnica);
  return {
    id, nombre: NOMBRES[i], dificultad: DIFICULTADES[i], so: SISTEMAS[i],
    minutos: 35 + i * 8, snapshot: `machine-${id}`, ip: p.ip, host: p.host, user,
    habilidades: ['reconocimiento', p.ports[1]?.service || p.ports[0].service, tecnica],
    profile: p,
    groupMap: { kali: ['kali'], [user]: tecnica === 'sudo' ? [user, 'users', 'sudo'] : [user, 'users'] },
    userFlagHash: hashRespuesta(userFlag), rootFlagHash: hashRespuesta(rootFlag),
    fases: [
      {
        id: 'recon', nombre: 'Reconocimiento', objetivo: `Identifica los puertos y versiones de ${p.ip}.`,
        pistas: ['Empieza por un escaneo de servicios.', `Prueba con \`nmap -sV ${p.ip}\`.`],
        solucion: `nmap -sV ${p.ip}`,
        check: (c) => k.usó(c, /^nmap\b/) && k.usó(c, new RegExp(p.ip.replace(/\./g, '\\.'))),
      },
      {
        id: 'enum', nombre: 'Enumeración', objetivo: 'Investiga el servicio expuesto y encuentra el token de acceso.',
        pistas: ['Observa los servicios y puertos del escaneo.', `La ruta de referencia usa: \`${enumSolution}\`.`],
        solucion: enumSolution,
        check: (c) => k.salidaTiene(c, p.token),
        onComplete: (c) => { c.shell.state.machine.accessUnlocked = true; },
      },
      {
        id: 'access', nombre: 'Acceso inicial', objetivo: `Usa la información encontrada para entrar como ${user}.`,
        pistas: ['El acceso simulado se realiza mediante SSH.', `Ejecuta \`ssh ${user}@${p.host}\` después de enumerar.`],
        solucion: `ssh ${user}@${p.host}`,
        check: (c) => c.shell.user === user,
      },
      {
        id: 'privesc', nombre: 'Escalada', objetivo: `Enumera la vía de escalada relacionada con ${tecnica} y consigue una shell root.`,
        pistas: ['Enumera antes de explotar.', `La comprobación de referencia comienza con \`${privSolution.split('\n')[0]}\`.`],
        solucion: privSolution,
        check: privCheck,
        onComplete: (c) => c.shell.setUser('root'),
      },
    ],
    writeup: [
      `El escaneo de versiones reveló ${p.ports.map((x) => `${x.port}/${x.service}`).join(', ')}.`,
      `La enumeración del servicio expuso un token de laboratorio que habilitó el acceso de ${user}.`,
      `La enumeración local señaló una configuración insegura de ${tecnica}; en el simulador se utilizó para cambiar a root.`,
      'En un informe real se documentarían evidencia, impacto, reproducción y mitigación sin atacar sistemas fuera del alcance.',
    ],
    xp: 350 + i * 45,
  };
});

export const MAQUINA_POR_ID = Object.fromEntries(MAQUINAS.map((m) => [m.id, m]));
