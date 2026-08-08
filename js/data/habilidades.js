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
  ['algoritmia', 'Lógica y algoritmos', 'automatizacion'],
  ['estructuras', 'Listas, diccionarios y tablas', 'automatizacion'],
  ['metodologia', 'Metodología de seguridad', 'seguridad'],
  ...[
    'pwd','ls','cd','whoami','uname','man','help','which','history','echo','date','clear','type',
    'mkdir','touch','cp','mv','rm','ln','tree','file','stat','cat','less','head','tail','wc',
    'grep','find','sort','uniq','cut','tr','sed','awk','xargs','chmod','chown','id','sudo',
    'ps','top','kill','jobs','free','df','du','apt','dpkg','systemctl','journalctl','ssh','scp',
    'ip','ss','ping','dig','curl','wget','nc','nmap','tar','gzip','strings','sha256sum','base64',
    'tmux','vim','git','export','printf','test','for','python3','lua'
  ].map((comando) => [comando, comando, 'comando']),
];

export const HABILIDADES = CATALOGO.map(([id, nombre, area]) => ({ id, nombre, area }));
export const HABILIDAD_POR_ID = Object.fromEntries(HABILIDADES.map((h) => [h.id, h]));

const ALIASES = {
  'apt-get': 'apt', dnf: 'apt', yum: 'apt', pacman: 'apt', rpm: 'dpkg',
  locate: 'find', whereis: 'which', getcap: 'permisos', lsattr: 'permisos', chattr: 'permisos',
  python: 'python3', luac: 'lua', lua5: 'lua',
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
  const base = [...explicito, ...inferidas, ...codigoInline];
  const validas = base.map((id) => ALIASES[id] || id).filter((id) => HABILIDAD_POR_ID[id]);
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
