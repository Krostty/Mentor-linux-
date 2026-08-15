// Grafo ligero de habilidades. Una sala enseña contenido; una habilidad mide
// si el usuario puede recuperarlo y aplicarlo en contextos distintos.

const CATALOGO = [
  ['terminal', 'Terminal y prompt', 'fundamentos'],
  ['rutas', 'Rutas absolutas y relativas', 'fundamentos'],
  ['errores', 'Lectura de errores', 'fundamentos'],
  ['seguridad-borrado', 'Borrado seguro', 'fundamentos'],
  ['pipes', 'Pipelines', 'texto'],
  ['redirecciones', 'Redirecciones', 'texto'],
  ['permisos', 'Modelo de permisos', 'administracion'],
  ['procesos', 'Procesos y señales', 'administracion'],
  ['servicios', 'Servicios del sistema', 'administracion'],
  ['redes', 'Diagnóstico de red', 'redes'],
  ['bash', 'Sintaxis Bash', 'automatizacion'],
  ['bash-arrays', 'Arrays Bash', 'automatizacion'],
  ['bash-quoting', 'Expansión y quoting Bash', 'automatizacion'],
  ['bash-robustez', 'Errores y robustez Bash', 'automatizacion'],
  ['bash-parsing', 'Parsing de texto con Bash', 'automatizacion'],
  ['bash-automatizacion', 'Diseño de automatizaciones Bash', 'automatizacion'],
  ['python', 'Fundamentos de Python', 'programacion'],
  ['python-tipos', 'Tipos y colecciones Python', 'programacion'],
  ['python-control', 'Control de flujo Python', 'programacion'],
  ['python-funciones', 'Funciones Python', 'programacion'],
  ['python-modulos', 'Módulos y argumentos Python', 'programacion'],
  ['python-archivos', 'Archivos con Python', 'programacion'],
  ['python-excepciones', 'Excepciones Python', 'programacion'],
  ['python-json', 'JSON con Python', 'programacion'],
  ['python-regex', 'Regex con Python', 'programacion'],
  ['python-http', 'HTTP con requests', 'programacion'],
  ['python-sockets', 'Sockets con Python', 'programacion'],
  ['python-parsing', 'Parsing con Python', 'programacion'],
  ['python-automatizacion', 'Automatización con Python', 'programacion'],
  ['web-arquitectura', 'Arquitectura cliente/servidor', 'web'],
  ['web-url', 'URLs y orígenes', 'web'],
  ['html-semantico', 'HTML semántico y DOM', 'web'],
  ['web-formularios', 'Formularios y recursos Web', 'web'],
  ['web-capas', 'Capas de una aplicación Web', 'web'],
  ['http-mensajes', 'Mensajes HTTP', 'web'],
  ['http-metodos', 'Métodos y estados HTTP', 'web'],
  ['http-cabeceras', 'Cabeceras y representaciones HTTP', 'web'],
  ['https-tls', 'HTTPS y confianza TLS', 'web'],
  ['cors-sop', 'Same-origin y CORS', 'web'],
  ['javascript-web', 'JavaScript para Web', 'web'],
  ['javascript-dom', 'DOM y eventos', 'web'],
  ['javascript-fetch', 'Asincronía y fetch', 'web'],
  ['web-validacion', 'Validación de entrada Web', 'web'],
  ['web-frontera-confianza', 'Fronteras de confianza Web', 'web'],
  ['api-rest', 'Recursos y endpoints REST', 'web'],
  ['api-json', 'JSON y contratos de API', 'web'],
  ['api-metodos', 'Operaciones de API', 'web'],
  ['api-errores', 'Errores de API', 'web'],
  ['api-clientes', 'Clientes API reproducibles', 'web'],
  ['web-identidad', 'Autenticación y autorización', 'web'],
  ['web-sesiones', 'Sesiones Web', 'web'],
  ['web-cookies', 'Cookies seguras', 'web'],
  ['web-csrf', 'Peticiones entre sitios', 'web'],
  ['web-tokens', 'Tokens y claims', 'web'],
  ['sql-modelo', 'Modelo relacional', 'datos'],
  ['sql-select', 'SELECT y filtros SQL', 'datos'],
  ['sql-agregacion', 'Agregación SQL', 'datos'],
  ['sql-joins', 'Relaciones y JOIN', 'datos'],
  ['sql-seguro', 'Consultas parametrizadas', 'datos'],
  ['metodologia', 'Metodología de seguridad', 'seguridad'],
  ['hardware-software', 'Hardware y software', 'fundamentos'],
  ['cpu-memoria', 'CPU y memoria', 'fundamentos'],
  ['almacenamiento', 'Almacenamiento', 'fundamentos'],
  ['sistema-operativo', 'Sistema operativo', 'fundamentos'],
  ['datos-binarios', 'Binario y hexadecimal', 'fundamentos'],
  ['virtualizacion', 'Virtualización', 'fundamentos'],
  ['mounts', 'Filesystems y mounts', 'administracion'],
  ['filesystem-virtual', '/proc, /sys y kernel', 'administracion'],
  ['enlace-red', 'Enlace y NIC', 'redes'],
  ['ethernet', 'Ethernet y tramas', 'redes'],
  ['mac-arp', 'MAC y ARP', 'redes'],
  ['dhcp', 'DHCP', 'redes'],
  ['encapsulacion', 'Encapsulación', 'redes'],
  ['transporte-red', 'Puertos y sockets', 'redes'],
  ['icmp', 'ICMP', 'redes'],
  ['tcp', 'TCP', 'redes'],
  ['udp', 'UDP', 'redes'],
  ['ipv6', 'IPv6', 'redes'],
  ['nat', 'NAT y PAT', 'redes'],
  ['tls', 'TLS y certificados', 'redes'],
  ['proxy-vpn', 'Proxies y VPN', 'redes'],
  ['firewall', 'Políticas de firewall', 'seguridad'],
  ...[
    'pwd','ls','cd','whoami','uname','man','help','which','history','echo','date','clear','type',
    'mkdir','touch','cp','mv','rm','ln','tree','file','stat','cat','less','head','tail','wc',
    'grep','find','sort','uniq','cut','tr','sed','awk','xargs','chmod','chown','id','sudo',
    'ps','top','kill','jobs','free','df','du','apt','dpkg','systemctl','journalctl','ssh','scp',
    'ip','ss','ping','dig','curl','wget','nc','nmap','tar','gzip','strings','sha256sum','base64',
    'tmux','vim','git','export','printf','test','for','python3','sqlite3','lsblk','mount','dmesg','traceroute'
  ].map((comando) => [comando, comando, 'comando']),
];

export const HABILIDADES = CATALOGO.map(([id, nombre, area]) => ({ id, nombre, area }));
export const HABILIDAD_POR_ID = Object.fromEntries(HABILIDADES.map((h) => [h.id, h]));

const ALIASES = {
  'apt-get': 'apt', dnf: 'apt', yum: 'apt', pacman: 'apt', rpm: 'dpkg',
  locate: 'find', whereis: 'which', getcap: 'permisos', lsattr: 'permisos', chattr: 'permisos', python: 'python3',
};

function limpiar(token = '') {
  return token.trim().toLowerCase().replace(/^sudo$/, '').replace(/[^a-z0-9_.-]/g, '');
}

function comandosDe(texto = '') {
  const encontrados = [];
  for (const tramo of String(texto).split(/\n|&&|;|\|/)) {
    const partes = tramo.trim().split(/\s+/).filter(Boolean);
    let primero = limpiar(partes[0]);
    if (primero === 'sudo') primero = limpiar(partes[1]);
    if (primero && !primero.includes('=') && !['do', 'done', 'then', 'fi'].includes(primero)) encontrados.push(ALIASES[primero] || primero);
  }
  return encontrados;
}

export function habilidadesDeEjercicio(ejercicio, fallback = []) {
  const explicito = ejercicio.habilidades || [];
  const codigoInline = [...String(`${ejercicio.enunciado || ''} ${ejercicio.explicacion || ''}`).matchAll(/`([^`]+)`/g)].flatMap((m) => comandosDe(m[1]));
  const inferidas = comandosDe(ejercicio.solucion || '');
  const texto = `${ejercicio.enunciado || ''} ${ejercicio.explicacion || ''} ${ejercicio.solucion || ''}`.toLowerCase();
  const transversales = [];
  if (ejercicio.tipo === 'terminal') transversales.push('terminal');
  if (/\b(systemctl|journalctl|servicio|daemon)\b/.test(texto)) transversales.push('servicios');
  if (/\b(ip|ping|dig|ss|nmap|curl|wget|nc|ssh|dns|tcp|udp|puerto|socket|red)\b/.test(texto)) transversales.push('redes');
  if (/\bpython3?\b/.test(texto) || explicito.some((id) => id.startsWith('python-'))) transversales.push('python');
  if (/\b(alcance|autorizaci[oó]n|evidencia|hallazgo|hip[oó]tesis|remediaci[oó]n|auditor[ií]a|metodolog[ií]a)\b/.test(texto)) transversales.push('metodologia');
  // Las etiquetas pedagógicas explícitas no son alias de comandos: `python`
  // mide el fundamento conceptual y `python3`, el uso del intérprete.
  const conceptuales = [...explicito, ...transversales].filter((id) => HABILIDAD_POR_ID[id]);
  const comandos = [...inferidas, ...codigoInline].map((id) => ALIASES[id] || id).filter((id) => HABILIDAD_POR_ID[id]);
  const validas = [...conceptuales, ...comandos];
  const candidatas = validas.length ? validas : fallback.map((id) => ALIASES[id] || id).filter((id) => HABILIDAD_POR_ID[id]).slice(0, 1);
  return [...new Set(candidatas)];
}

export function nombreHabilidad(id) {
  return HABILIDAD_POR_ID[id]?.nombre || id;
}

export const NIVELES_DOMINIO = [
  { nivel: 0, nombre: 'Nuevo', icono: '○' },
  { nivel: 1, nombre: 'Reconoce', icono: '◔' },
  { nivel: 2, nombre: 'Con ayuda', icono: '◑' },
  { nivel: 3, nombre: 'Sin ayuda', icono: '◕' },
  { nivel: 4, nombre: 'Combina', icono: '●' },
  { nivel: 5, nombre: 'Retiene', icono: '◆' },
  { nivel: 6, nombre: 'Dominado', icono: '✦' },
];
