// Grafo curricular V2. Las rutas expresan dependencias pedagógicas y las
// capacidades reúnen varias habilidades atómicas ya medidas por el Store.
// Los requisitos son diagnósticos: orientan y recomiendan, nunca bloquean.

export const CAPACIDADES = [
  {
    id: 'fundamentos-sistemas',
    nombre: 'Fundamentos de sistemas',
    area: 'fundamentos',
    descripcion: 'Relaciona hardware, datos, sistema operativo, identidad y virtualización.',
    habilidades: ['hardware-software', 'cpu-memoria', 'almacenamiento', 'sistema-operativo', 'datos-binarios', 'virtualizacion'],
    rutaReferencia: 'fundamentos-informatica',
  },
  {
    id: 'terminal-linux',
    nombre: 'Orientación en terminal',
    area: 'linux',
    descripcion: 'Interpreta el prompt, se ubica y navega sin perder contexto.',
    habilidades: ['terminal', 'pwd', 'ls', 'cd', 'rutas', 'errores'],
    rutaReferencia: 'linux-cero',
  },
  {
    id: 'archivos-texto',
    nombre: 'Archivos y texto',
    area: 'linux',
    descripcion: 'Crea, transforma, busca y conecta datos de forma segura.',
    habilidades: ['mkdir', 'touch', 'cp', 'mv', 'rm', 'cat', 'grep', 'find', 'pipes', 'redirecciones'],
    rutaReferencia: 'linux-esencial',
  },
  {
    id: 'administracion-linux',
    nombre: 'Administración Linux',
    area: 'linux',
    descripcion: 'Razona sobre permisos, procesos, privilegios y servicios.',
    habilidades: ['permisos', 'chmod', 'chown', 'sudo', 'procesos', 'servicios', 'systemctl', 'journalctl'],
    rutaReferencia: 'linux-admin',
  },
  {
    id: 'internals-linux',
    nombre: 'Internals y recursos Linux',
    area: 'linux',
    descripcion: 'Distingue almacenamiento, memoria, mounts, kernel y filesystems virtuales.',
    habilidades: ['almacenamiento', 'mounts', 'cpu-memoria', 'filesystem-virtual', 'df', 'du', 'free'],
    rutaReferencia: 'linux-internals',
  },
  {
    id: 'fundamentos-red',
    nombre: 'Fundamentos de red',
    area: 'redes',
    descripcion: 'Relaciona direcciones, conectividad, nombres y rutas.',
    habilidades: ['redes', 'ip', 'ping', 'dig'],
    rutaReferencia: 'redes-cimientos',
  },
  {
    id: 'servicios-red',
    nombre: 'Servicios de red',
    area: 'redes',
    descripcion: 'Enumera y comprueba puertos, protocolos y servicios.',
    habilidades: ['ss', 'curl', 'ssh', 'nc', 'nmap'],
    rutaReferencia: 'redes-linux',
  },
  {
    id: 'enlace-local',
    nombre: 'Enlace y encapsulación',
    area: 'redes',
    descripcion: 'Explica NIC, Ethernet, MAC, ARP, DHCP y encapsulación por capas.',
    habilidades: ['enlace-red', 'ethernet', 'mac-arp', 'dhcp', 'encapsulacion'],
    rutaReferencia: 'redes-protocolos',
  },
  {
    id: 'transporte-seguro',
    nombre: 'Transporte e Internet seguro',
    area: 'redes',
    descripcion: 'Razona sobre ICMP, TCP, UDP, IPv6, NAT, TLS e intermediarios.',
    habilidades: ['transporte-red', 'icmp', 'tcp', 'udp', 'ipv6', 'nat', 'tls', 'proxy-vpn', 'firewall'],
    rutaReferencia: 'redes-protocolos',
  },
  {
    id: 'automatizacion-bash',
    nombre: 'Automatización Bash',
    area: 'bash',
    descripcion: 'Convierte una secuencia manual en una herramienta repetible.',
    habilidades: ['bash', 'export', 'printf', 'test', 'for'],
    rutaReferencia: 'bash-base',
  },
  {
    id: 'bash-profesional',
    nombre: 'Bash profesional',
    area: 'bash',
    descripcion: 'Controla expansión, arrays, errores, parsing e idempotencia.',
    habilidades: ['bash', 'bash-arrays', 'bash-quoting', 'bash-robustez', 'bash-parsing', 'bash-automatizacion'],
    rutaReferencia: 'bash-profesional',
  },
  {
    id: 'python-fundamentos',
    nombre: 'Fundamentos de Python',
    area: 'programacion',
    descripcion: 'Modela datos y resuelve problemas con control de flujo y funciones.',
    habilidades: ['python', 'python-tipos', 'python-control', 'python-funciones', 'python-modulos'],
    rutaReferencia: 'python-fundamentos',
  },
  {
    id: 'python-datos',
    nombre: 'Datos con Python',
    area: 'programacion',
    descripcion: 'Lee, valida y transforma archivos, JSON y texto estructurado.',
    habilidades: ['python-archivos', 'python-excepciones', 'python-json', 'python-regex', 'python-parsing'],
    rutaReferencia: 'python-datos',
  },
  {
    id: 'python-laboratorios',
    nombre: 'Python para laboratorios',
    area: 'programacion',
    descripcion: 'Automatiza HTTP y sockets sobre objetivos locales autorizados.',
    habilidades: ['python-modulos', 'python-http', 'python-sockets', 'python-automatizacion', 'python-parsing'],
    rutaReferencia: 'python-laboratorios',
  },
  {
    id: 'arquitectura-web',
    nombre: 'Arquitectura Web',
    area: 'web',
    descripcion: 'Sigue una petición entre URL, navegador, servidor, aplicación y datos.',
    habilidades: ['web-arquitectura', 'web-url', 'html-semantico', 'web-formularios', 'web-capas'],
    rutaReferencia: 'web-arquitectura',
  },
  {
    id: 'protocolo-http',
    nombre: 'HTTP y HTTPS',
    area: 'web',
    descripcion: 'Interpreta mensajes, métodos, estados, cabeceras, TLS y CORS.',
    habilidades: ['http-mensajes', 'http-metodos', 'http-cabeceras', 'https-tls', 'cors-sop'],
    rutaReferencia: 'web-http',
  },
  {
    id: 'frontend-web',
    nombre: 'Frontend y navegador',
    area: 'web',
    descripcion: 'Razona sobre DOM, eventos, fetch, validación y fronteras de confianza.',
    habilidades: ['javascript-web', 'javascript-dom', 'javascript-fetch', 'web-validacion', 'web-frontera-confianza'],
    rutaReferencia: 'web-javascript',
  },
  {
    id: 'apis-web',
    nombre: 'APIs y contratos',
    area: 'web',
    descripcion: 'Consume recursos REST, valida JSON y trata operaciones y errores.',
    habilidades: ['api-rest', 'api-json', 'api-metodos', 'api-errores', 'api-clientes'],
    rutaReferencia: 'web-apis',
  },
  {
    id: 'identidad-web',
    nombre: 'Identidad Web',
    area: 'web',
    descripcion: 'Distingue autenticación, autorización, cookies, sesiones y tokens.',
    habilidades: ['web-identidad', 'web-sesiones', 'web-cookies', 'web-csrf', 'web-tokens'],
    rutaReferencia: 'web-identidad',
  },
  {
    id: 'datos-sql',
    nombre: 'Datos relacionales y SQL',
    area: 'datos',
    descripcion: 'Modela, consulta, agrega y relaciona datos usando parámetros.',
    habilidades: ['sql-modelo', 'sql-select', 'sql-agregacion', 'sql-joins', 'sql-seguro'],
    rutaReferencia: 'web-sql',
  },
  {
    id: 'metodologia-auditoria',
    nombre: 'Metodología de auditoría',
    area: 'seguridad',
    descripcion: 'Trabaja con alcance, hipótesis, evidencia y remediación.',
    habilidades: ['metodologia', 'nmap', 'strings', 'sha256sum'],
    rutaReferencia: 'ofensiva-cimientos',
  },
  {
    id: 'credenciales-criptografia',
    nombre: 'Credenciales y criptografía',
    area: 'seguridad',
    descripcion: 'Distingue codificación, hashes, secretos y evidencia.',
    habilidades: ['sha256sum', 'base64', 'strings'],
    rutaReferencia: 'ofensiva-base',
  },
  {
    id: 'diagnostico-sistemas',
    nombre: 'Diagnóstico de sistemas',
    area: 'operacion',
    descripcion: 'Aísla fallos usando errores, procesos, registros y red.',
    habilidades: ['errores', 'grep', 'procesos', 'servicios', 'redes', 'journalctl'],
    rutaReferencia: 'redes-diagnostico',
  },
  {
    id: 'flujo-profesional',
    nombre: 'Flujo profesional',
    area: 'operacion',
    descripcion: 'Conserva contexto, cambios y sesiones de trabajo reproducibles.',
    habilidades: ['git', 'tmux', 'vim', 'ssh'],
    rutaReferencia: 'linux-profesional',
  },
];

export const CAPACIDAD_POR_ID = Object.fromEntries(CAPACIDADES.map((capacidad) => [capacidad.id, capacidad]));

// `avance` usa 1 para una ruta terminada. `nivel` comparte la escala 0..6 de
// las habilidades. Ambos son recomendaciones, no cerrojos de navegación.
export const REQUISITOS_RUTA = {
  'fundamentos-informatica': [],
  'linux-cero': [
    { tipo: 'ruta', id: 'fundamentos-informatica', avance: 1 },
    { tipo: 'capacidad', id: 'fundamentos-sistemas', nivel: 1 },
  ],
  'linux-esencial': [
    { tipo: 'ruta', id: 'linux-cero', avance: 1 },
    { tipo: 'capacidad', id: 'terminal-linux', nivel: 1 },
  ],
  'linux-filesystem': [
    { tipo: 'ruta', id: 'linux-esencial', avance: 1 },
    { tipo: 'capacidad', id: 'archivos-texto', nivel: 1 },
  ],
  'linux-admin': [
    { tipo: 'ruta', id: 'linux-filesystem', avance: 1 },
    { tipo: 'capacidad', id: 'terminal-linux', nivel: 2 },
    { tipo: 'capacidad', id: 'archivos-texto', nivel: 2 },
  ],
  'linux-internals': [
    { tipo: 'ruta', id: 'linux-admin', avance: 1 },
    { tipo: 'capacidad', id: 'administracion-linux', nivel: 2 },
  ],
  'linux-profesional': [
    { tipo: 'ruta', id: 'linux-internals', avance: 1 },
    { tipo: 'capacidad', id: 'internals-linux', nivel: 1 },
  ],
  'redes-cimientos': [
    { tipo: 'ruta', id: 'fundamentos-informatica', avance: 1 },
    { tipo: 'capacidad', id: 'fundamentos-sistemas', nivel: 1 },
  ],
  'redes-protocolos': [
    { tipo: 'ruta', id: 'redes-cimientos', avance: 1 },
    { tipo: 'capacidad', id: 'fundamentos-red', nivel: 1 },
  ],
  'redes-linux': [
    { tipo: 'ruta', id: 'redes-protocolos', avance: 1 },
    { tipo: 'ruta', id: 'linux-esencial', avance: 1 },
    { tipo: 'capacidad', id: 'transporte-seguro', nivel: 1 },
  ],
  'redes-servicios': [
    { tipo: 'ruta', id: 'redes-linux', avance: 1 },
    { tipo: 'capacidad', id: 'fundamentos-red', nivel: 2 },
  ],
  'redes-diagnostico': [
    { tipo: 'ruta', id: 'redes-servicios', avance: 1 },
    { tipo: 'capacidad', id: 'servicios-red', nivel: 2 },
  ],
  'bash-base': [
    { tipo: 'ruta', id: 'linux-esencial', avance: 1 },
    { tipo: 'capacidad', id: 'terminal-linux', nivel: 2 },
    { tipo: 'capacidad', id: 'archivos-texto', nivel: 1 },
  ],
  'bash-proyectos': [
    { tipo: 'ruta', id: 'bash-base', avance: 1 },
    { tipo: 'capacidad', id: 'automatizacion-bash', nivel: 2 },
    { tipo: 'capacidad', id: 'archivos-texto', nivel: 2 },
  ],
  'bash-profesional': [
    { tipo: 'ruta', id: 'bash-proyectos', avance: 1 },
    { tipo: 'capacidad', id: 'automatizacion-bash', nivel: 2 },
  ],
  'python-fundamentos': [
    { tipo: 'ruta', id: 'bash-profesional', avance: 1 },
    { tipo: 'capacidad', id: 'bash-profesional', nivel: 1 },
  ],
  'python-datos': [
    { tipo: 'ruta', id: 'python-fundamentos', avance: 1 },
    { tipo: 'capacidad', id: 'python-fundamentos', nivel: 2 },
  ],
  'python-laboratorios': [
    { tipo: 'ruta', id: 'python-datos', avance: 1 },
    { tipo: 'ruta', id: 'redes-servicios', avance: 1 },
    { tipo: 'capacidad', id: 'python-datos', nivel: 2 },
  ],
  'web-arquitectura': [
    { tipo: 'ruta', id: 'python-laboratorios', avance: 1 },
    { tipo: 'ruta', id: 'redes-servicios', avance: 1 },
    { tipo: 'capacidad', id: 'python-laboratorios', nivel: 1 },
  ],
  'web-http': [
    { tipo: 'ruta', id: 'web-arquitectura', avance: 1 },
    { tipo: 'capacidad', id: 'arquitectura-web', nivel: 2 },
    { tipo: 'capacidad', id: 'transporte-seguro', nivel: 2 },
  ],
  'web-javascript': [
    { tipo: 'ruta', id: 'web-http', avance: 1 },
    { tipo: 'ruta', id: 'python-fundamentos', avance: 1 },
    { tipo: 'capacidad', id: 'protocolo-http', nivel: 2 },
  ],
  'web-apis': [
    { tipo: 'ruta', id: 'web-javascript', avance: 1 },
    { tipo: 'ruta', id: 'python-datos', avance: 1 },
    { tipo: 'capacidad', id: 'frontend-web', nivel: 2 },
  ],
  'web-identidad': [
    { tipo: 'ruta', id: 'web-apis', avance: 1 },
    { tipo: 'capacidad', id: 'apis-web', nivel: 2 },
    { tipo: 'capacidad', id: 'protocolo-http', nivel: 2 },
  ],
  'web-sql': [
    { tipo: 'ruta', id: 'web-identidad', avance: 1 },
    { tipo: 'capacidad', id: 'identidad-web', nivel: 1 },
    { tipo: 'capacidad', id: 'python-datos', nivel: 1 },
  ],
  'ofensiva-cimientos': [
    { tipo: 'ruta', id: 'web-sql', avance: 1 },
    { tipo: 'capacidad', id: 'datos-sql', nivel: 1 },
  ],
  'ofensiva-base': [
    { tipo: 'ruta', id: 'ofensiva-cimientos', avance: 1 },
    { tipo: 'ruta', id: 'linux-esencial', avance: 1 },
    { tipo: 'ruta', id: 'redes-cimientos', avance: 1 },
    { tipo: 'capacidad', id: 'metodologia-auditoria', nivel: 1 },
  ],
  'ofensiva-metodologia': [
    { tipo: 'ruta', id: 'ofensiva-base', avance: 1 },
    { tipo: 'ruta', id: 'linux-admin', avance: 1 },
    { tipo: 'ruta', id: 'redes-servicios', avance: 1 },
    { tipo: 'capacidad', id: 'administracion-linux', nivel: 2 },
    { tipo: 'capacidad', id: 'servicios-red', nivel: 2 },
  ],
  'ofensiva-aplicaciones': [
    { tipo: 'ruta', id: 'ofensiva-base', avance: 1 },
    { tipo: 'ruta', id: 'linux-filesystem', avance: 1 },
    { tipo: 'ruta', id: 'python-datos', avance: 1 },
    { tipo: 'ruta', id: 'web-identidad', avance: 1 },
    { tipo: 'ruta', id: 'web-sql', avance: 1 },
    { tipo: 'capacidad', id: 'credenciales-criptografia', nivel: 2 },
    { tipo: 'capacidad', id: 'protocolo-http', nivel: 2 },
    { tipo: 'capacidad', id: 'datos-sql', nivel: 2 },
  ],
  'defensa-base': [
    { tipo: 'ruta', id: 'linux-admin', avance: 1 },
    { tipo: 'ruta', id: 'redes-linux', avance: 1 },
    { tipo: 'capacidad', id: 'administracion-linux', nivel: 2 },
    { tipo: 'capacidad', id: 'fundamentos-red', nivel: 1 },
  ],
  'defensa-operacion': [
    { tipo: 'ruta', id: 'defensa-base', avance: 1 },
    { tipo: 'ruta', id: 'redes-servicios', avance: 1 },
    { tipo: 'capacidad', id: 'diagnostico-sistemas', nivel: 2 },
  ],
};

export function requisitosDeRuta(rutaId) {
  return REQUISITOS_RUTA[rutaId] || [];
}

export function evaluarCapacidad(capacidadId, nivelDeHabilidad) {
  const capacidad = CAPACIDAD_POR_ID[capacidadId];
  if (!capacidad) return null;
  const niveles = capacidad.habilidades.map((id) => Math.max(0, Math.min(6, Number(nivelDeHabilidad(id)) || 0)));
  const suma = niveles.reduce((total, nivel) => total + nivel, 0);
  const practicadas = niveles.filter((nivel) => nivel > 0).length;
  return {
    ...capacidad,
    nivel: Math.min(6, Math.floor(suma / niveles.length)),
    avance: suma / (niveles.length * 6),
    cobertura: practicadas / niveles.length,
    practicadas,
    total: niveles.length,
    niveles: Object.fromEntries(capacidad.habilidades.map((id, indice) => [id, niveles[indice]])),
  };
}

export function erroresGrafoPrerequisitos(rutas = [], habilidades = []) {
  const errores = [];
  const rutasValidas = new Set(rutas.map((ruta) => ruta.id));
  const habilidadesValidas = new Set(habilidades.map((habilidad) => habilidad.id));
  const capacidadesValidas = new Set(CAPACIDADES.map((capacidad) => capacidad.id));

  for (const ruta of rutas) {
    if (!Object.hasOwn(REQUISITOS_RUTA, ruta.id)) errores.push(`Falta declarar la ruta ${ruta.id}`);
  }
  for (const capacidad of CAPACIDADES) {
    if (!capacidad.habilidades.length) errores.push(`La capacidad ${capacidad.id} no tiene habilidades`);
    for (const habilidad of capacidad.habilidades) {
      if (!habilidadesValidas.has(habilidad)) errores.push(`La capacidad ${capacidad.id} referencia ${habilidad}`);
    }
    if (!rutasValidas.has(capacidad.rutaReferencia)) errores.push(`La capacidad ${capacidad.id} recomienda ${capacidad.rutaReferencia}`);
  }
  for (const [rutaId, requisitos] of Object.entries(REQUISITOS_RUTA)) {
    if (!rutasValidas.has(rutaId)) errores.push(`Requisitos para ruta desconocida ${rutaId}`);
    for (const requisito of requisitos) {
      if (requisito.tipo === 'ruta') {
        if (!rutasValidas.has(requisito.id)) errores.push(`${rutaId} depende de ruta desconocida ${requisito.id}`);
        if (requisito.id === rutaId) errores.push(`${rutaId} depende de sí misma`);
        if (!(requisito.avance > 0 && requisito.avance <= 1)) errores.push(`${rutaId} tiene avance inválido`);
      } else if (requisito.tipo === 'capacidad') {
        if (!capacidadesValidas.has(requisito.id)) errores.push(`${rutaId} depende de capacidad desconocida ${requisito.id}`);
        if (!(requisito.nivel >= 0 && requisito.nivel <= 6)) errores.push(`${rutaId} tiene nivel inválido`);
      } else errores.push(`${rutaId} tiene requisito de tipo ${requisito.tipo}`);
    }
  }

  const visitando = new Set();
  const visitadas = new Set();
  function visitar(rutaId) {
    if (visitando.has(rutaId)) { errores.push(`Ciclo de prerrequisitos en ${rutaId}`); return; }
    if (visitadas.has(rutaId)) return;
    visitando.add(rutaId);
    for (const requisito of requisitosDeRuta(rutaId).filter((item) => item.tipo === 'ruta')) visitar(requisito.id);
    visitando.delete(rutaId);
    visitadas.add(rutaId);
  }
  for (const ruta of rutas) visitar(ruta.id);
  return [...new Set(errores)];
}
