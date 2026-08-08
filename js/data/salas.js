// Modelo v2. Conserva todo el currículo v1 y lo normaliza como salas,
// tareas y ejercicios intercalados. Las salas nuevas cubren huecos reales.

import { MODULOS } from './modules.js';
import * as k from './checks.js';
import { habilidadesDeEjercicio } from './habilidades.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';
import { SALAS_REDES } from './salas-redes.js';
import { SALAS_OFENSIVA } from './salas-ofensiva.js';
import { SALAS_DEFENSA } from './salas-defensa.js';
import { REFUERZOS_1 } from './refuerzos-1.js';
import { REFUERZOS_2 } from './refuerzos-2.js';

// Las salas heredadas del currículo v1 solo traían test y terminal. Los
// refuerzos les añaden construir el comando, rellenar huecos y recordar la
// salida, que es lo que de verdad consolida.
const REFUERZOS = { ...REFUERZOS_1, ...REFUERZOS_2 };

function ejercicioRefuerzo(r) {
  if (r.t === 'ordenar') {
    // Las piezas se barajan de forma estable para que el orden no delate
    // la solución, pero sea siempre el mismo entre recargas.
    return ordenar(r.id, r.e, barajar(r.k, r.id), r.r, r.x);
  }
  if (r.t === 'completar') return completar(r.id, r.e, r.p, r.r, r.x);
  if (r.t === 'respuesta') return respuesta(r.id, r.e, r.r, r.x);
  return quiz(r.id, r.e, r.o, r.c, r.x);
}

const dificultadDe = (n) => n <= 4 ? 'Principiante' : n <= 10 ? 'Fácil' : n <= 16 ? 'Intermedio' : 'Avanzado';


function ejercicioReto(reto) {
  return { ...reto, tipo: 'terminal' };
}

function normalizarModulo(modulo) {
  const tareas = [];
  const preguntas = modulo.examen || [];
  const porLeccion = Array.from({ length: modulo.lecciones.length }, () => []);
  preguntas.forEach((p, i) => porLeccion[i % porLeccion.length].push(
    quiz(`q-${modulo.id}-${i + 1}`, p.pregunta, p.opciones, p.correcta, p.explicacion, 15)
  ));

  modulo.lecciones.forEach((leccion, indice) => {
    tareas.push({
      id: `${modulo.id}-${leccion.id}-teoria`,
      titulo: leccion.titulo,
      subtitulo: leccion.subtitulo || 'Concepto y comprobación',
      teoria: leccion.cuerpo,
      practica: porLeccion[indice],
    });

    const retos = leccion.retos || [];
    for (let i = 0; i < retos.length; i += 3) {
      tareas.push({
        id: `${modulo.id}-${leccion.id}-practica-${i / 3 + 1}`,
        titulo: `Práctica · ${leccion.titulo}${retos.length > 3 ? ` ${i / 3 + 1}` : ''}`,
        subtitulo: 'Aplica lo aprendido en un sistema limpio',
        teoria: [{ n: 'Hazlo en la terminal', p: 'El sistema se restaura para cada ejercicio. Puedes explorar y resolverlo por cualquier camino válido.' }],
        practica: retos.slice(i, i + 3).map(ejercicioReto),
      });
    }
  });

  const extra = (REFUERZOS[modulo.id] || []).map(ejercicioRefuerzo);
  if (extra.length) {
    const teoricas = tareas.filter((t) => t.id.endsWith('-teoria'));
    const destinos = teoricas.length ? teoricas : tareas;
    extra.forEach((ejercicio, i) => destinos[i % destinos.length].practica.push(ejercicio));
  }

  return {
    id: modulo.id,
    n: modulo.n,
    nombre: modulo.nombre,
    resumen: modulo.resumen,
    dificultad: dificultadDe(modulo.n),
    minutos: Math.max(20, tareas.length * 5),
    comandos: modulo.comandos || [],
    tareas,
    origen: 'v1-ampliado',
  };
}

const SALA_CERO = {
  id: 'cero-absoluto', n: 0, nombre: 'Sala 0 · Tu primera terminal',
  resumen: 'Aprende a orientarte, mirar y moverte repitiendo cada habilidad hasta poder usarla sin ayuda',
  dificultad: 'Cero absoluto', minutos: 55, comandos: ['pwd', 'ls', 'cd', 'whoami', 'man', 'which', 'uname'], origen: 'v3-dominio',
  tareas: [
    {
      id: 'cero-que-es', titulo: '1. Entiende dónde estás', subtitulo: 'Terminal, shell, prompt y pwd',
      teoria: [
        { t: 'La terminal es la ventana', p: 'La **shell** interpreta lo que escribes. El **prompt** indica que está lista y te muestra usuario, máquina y carpeta actual.' },
        { c: 'user@mentor:~$\nusuario  equipo  carpeta  listo para escribir' },
        { n: 'Objetivo de dominio', p: 'Al terminar podrás reconocer el prompt, ejecutar `pwd` y explicar la ruta obtenida sin mirar la solución.' },
      ],
      practica: [
        quiz('cero-q1', '¿Qué componente interpreta realmente los comandos?', ['La shell', 'El teclado', 'El monitor', 'El filesystem'], 0, 'La terminal muestra; la shell interpreta y ejecuta.'),
        ordenar('cero-pwd-orden', 'Construye el comando que imprime el directorio actual.', ['pwd'], 'pwd', '`pwd` viene de print working directory.', ['pwd']),
        terminal('cero-pwd', 'Ejecuta `pwd` para mostrar la carpeta en la que empiezas.', 'inicio', 'pwd', (c) => k.salidaTiene(c, '/home/user'), ['`pwd` significa print working directory.']),
        respuesta('cero-ruta', '¿Qué ruta imprimió `pwd` en el ejercicio anterior?', ['/home/user'], 'Es la carpeta personal del usuario simulado.'),
        quiz('cero-pwd-predice', 'Si no te mueves y ejecutas `pwd` otra vez, ¿qué salida esperas?', ['/home/user', '/home', '/', 'pwd'], 0, 'La carpeta actual no cambia hasta que usas `cd`.'),
        terminal('cero-pwd-repite', 'Recupera la ruta actual sin usar ninguna pista.', 'inicio', 'pwd', (c) => k.ultimoUsó(c, /^pwd$/) && k.salidaTiene(c, '/home/user'), ['Piensa en “print working directory”.']),
      ],
    },
    {
      id: 'cero-sintaxis', titulo: '2. Mira antes de actuar', subtitulo: 'ls, opciones y archivos ocultos',
      teoria: [
        { c: 'ls -l /etc\n│  │  └─ argumento: sobre qué\n│  └──── opción: cómo\n└─────── comando: qué hacer' },
        { t: 'Una orden, varias preguntas', p: '`ls` muestra nombres, `ls -a` incluye entradas ocultas y `ls -l` añade permisos, propietario, tamaño y fecha.' },
        { n: 'Los nombres distinguen mayúsculas y minúsculas', p: '`ls` existe; `LS` no. Las opciones pueden combinarse: `ls -la`.' },
      ],
      practica: [
        quiz('cero-q2', 'En `ls -l /etc`, ¿qué es `/etc`?', ['El argumento', 'La opción', 'El comando', 'El prompt'], 0, 'Es la ruta sobre la que actúa `ls`.'),
        ordenar('cero-ls-orden', 'Construye una orden para listar `/etc` en formato largo.', ['ls', '-l', '/etc'], 'ls -l /etc', 'Comando, opción y argumento conservan ese orden.', ['ls']),
        terminal('cero-ls-simple', 'Lista el contenido de tu carpeta personal.', 'inicio', 'ls', (c) => k.ultimoUsó(c, /^ls$/) && k.salidaTiene(c, 'documentos', 'notas.txt'), ['El comando tiene dos letras: `ls`.']),
        quiz('cero-ls-predice', '¿Qué opción necesitas para que aparezcan nombres que comienzan por punto?', ['-a', '-l', '-h', '-r'], 0, '`-a` significa all.'),
        terminal('cero-ls-ocultos', 'Muestra también los archivos ocultos de tu carpeta actual.', 'inicio', 'ls -a', (c) => k.ultimoUsó(c, /^ls\s+-(?:a|la|al)$/) && k.salidaTiene(c, '.bashrc'), ['Añade la opción `-a` a `ls`.']),
        completar('cero-ls-completa', 'Completa la opción que muestra detalles: `ls ____ /etc`.', 'ls ____ /etc', ['-l'], '`-l` activa el formato largo.', ['ls']),
        terminal('cero-ls', 'Lista en formato largo el contenido de `/etc` usando `ls` y su opción adecuada.', 'inicio', 'ls -l /etc', (c) => k.ultimoUsó(c, /^ls\s+-l\s+\/etc/) && k.salidaTiene(c, 'passwd'), ['La opción de formato largo es `-l`.']),
        terminal('cero-ls-combina', 'Muestra los elementos ocultos de tu carpeta usando formato largo.', 'inicio', 'ls -la', (c) => k.ultimoUsó(c, /^ls\s+-(?:la|al)/) && k.salidaTiene(c, '.bashrc'), ['Combina `-l` y `-a` en `ls -la`.']),
      ],
    },
    {
      id: 'cero-moverse', titulo: '3. Muévete con cd', subtitulo: 'Rutas absolutas, relativas y comprobación',
      teoria: [
        { t: 'cd cambia tu contexto', p: '`cd` significa change directory. Una ruta absoluta comienza en `/`; una relativa comienza desde tu ubicación actual.' },
        { f: [['cd documentos', 'Entra usando una ruta relativa'], ['cd /var/log', 'Va a una ruta absoluta'], ['cd ..', 'Sube un nivel'], ['cd ~', 'Vuelve a tu carpeta personal'], ['cd -', 'Regresa a la carpeta anterior']] },
        { n: 'Ciclo seguro', p: 'Antes: `pwd` y `ls`. Muévete con `cd`. Después: confirma de nuevo con `pwd`.' },
      ],
      practica: [
        quiz('cero-q3', '¿Qué caracteriza a una ruta absoluta?', ['Empieza en /', 'Termina en .txt', 'Empieza en ~ siempre', 'No contiene carpetas'], 0, 'La barra inicial representa la raíz del sistema.'),
        ordenar('cero-cd-orden', 'Construye la orden que entra en la carpeta `documentos` desde tu home.', ['cd', 'documentos'], 'cd documentos', 'Como `documentos` está dentro de la carpeta actual, basta una ruta relativa.', ['cd','rutas']),
        terminal('cero-cd-relativa', 'Entra en `documentos` usando una ruta relativa y confirma la ubicación.', 'inicio', 'cd documentos\npwd', (c) => k.cwdEs(c, '/home/user/documentos') && k.salidaTiene(c, '/home/user/documentos'), ['Ejecuta `cd documentos` y luego `pwd`.']),
        terminal('cero-cd-anidada', 'Desde tu carpeta personal entra directamente en `documentos/facturas` y confirma la ruta.', 'inicio', 'cd documentos/facturas\npwd', (c) => k.cwdEs(c, '/home/user/documentos/facturas') && k.salidaTiene(c, '/home/user/documentos/facturas'), ['Las carpetas anidadas se separan con `/`.']),
        quiz('cero-cd-padre', 'Estás en `/home/user/documentos`. ¿Qué hace `cd ..`?', ['Va a /home/user', 'Va a /', 'Borra documentos', 'Vuelve a /etc'], 0, '`..` representa el directorio padre.'),
        terminal('cero-cd-sube', 'Entra en `documentos`, sube un nivel con la referencia adecuada y comprueba que regresaste a `/home/user`.', 'inicio', 'cd documentos\ncd ..\npwd', (c) => k.cwdEs(c, '/home/user') && k.salidaTiene(c, '/home/user'), ['Primero `cd documentos`; después `cd ..` y `pwd`.']),
        completar('cero-cd-home', 'Completa el atajo para volver a tu carpeta personal: `cd ____`.', 'cd ____', ['~'], '`~` representa el home del usuario actual.', ['cd','rutas']),
        terminal('cero-cd-tilde', 'Ve a `/etc` y vuelve a tu carpeta personal usando `~`; confirma el resultado.', 'inicio', 'cd /etc\ncd ~\npwd', (c) => k.cwdEs(c, '/home/user') && k.salidaTiene(c, '/home/user'), ['Después de `cd /etc`, usa `cd ~`.']),
        quiz('cero-cd-guion-predice', 'Si partes en `/home/user`, ejecutas `cd /etc` y luego `cd -`, ¿dónde terminas?', ['/home/user', '/etc', '/', '/home'], 0, '`cd -` vuelve al directorio anterior.'),
        terminal('cero-cd-guion', 'Entra en `/var/log`, vuelve a la carpeta anterior con `cd -` y confirma que estás en `/home/user`.', 'inicio', 'cd /var/log\ncd -\npwd', (c) => k.cwdEs(c, '/home/user') && k.salidaTiene(c, '/home/user'), ['`cd -` usa la ubicación anterior guardada por la shell.']),
        terminal('cero-cd-etc', 'Desde cualquier ubicación entra en `/etc` mediante una ruta absoluta y confirma el resultado.', 'inicio', 'cd documentos\ncd /etc\npwd', (c) => k.cwdEs(c, '/etc') && k.salidaTiene(c, '/etc'), ['Las rutas absolutas comienzan con `/`.']),
      ],
    },
    {
      id: 'cero-ayuda', titulo: '4. Aprende a desbloquearte', subtitulo: 'Ayuda, identidad y lectura de errores',
      teoria: [
        { t: 'No memorices todo', p: '`man comando` abre el manual y `comando --help` ofrece un resumen. `which` localiza el ejecutable.' },
        { t: 'El error es información', p: '`command not found`, `No such file` y `Permission denied` describen problemas distintos. Léelos antes de cambiar cosas.' },
      ],
      practica: [
        quiz('cero-q4', '¿Qué herramienta ofrece el manual completo de un comando?', ['man', 'pwd', 'clear', 'echo'], 0, '`man` abre la página de manual.'),
        ordenar('cero-man-orden', 'Construye la orden que abre el manual de `ls`.', ['man', 'ls'], 'man ls', 'La estructura es `man comando`.', ['man']),
        terminal('cero-whoami', 'Pregunta al sistema qué usuario eres.', 'inicio', 'whoami', (c) => k.ultimoUsó(c, /^whoami$/) && k.salidaTiene(c, 'user'), ['El comando se llama literalmente “quién soy” en inglés.']),
        terminal('cero-which', 'Localiza el ejecutable `ls` instalado en el sistema.', 'inicio', 'which ls', (c) => k.salidaTiene(c, '/usr/bin/ls'), ['Usa `which` seguido del nombre del comando.']),
        terminal('cero-uname', 'Muestra kernel, versión y arquitectura en una sola línea.', 'inicio', 'uname -a', (c) => k.salidaTiene(c, 'Linux mentor-box', 'x86_64'), ['`uname` necesita la opción `-a`.']),
        quiz('cero-error-ruta', '`cd carpeta-que-no-existe` devuelve “No such file or directory”. ¿Qué significa?', ['La ruta no existe', 'No tienes Internet', 'La terminal se rompió', 'El comando borró la carpeta'], 0, 'El sistema no encontró la ruta solicitada.'),
        completar('cero-which-completa', 'Completa la orden para localizar `pwd`: `____ pwd`.', '____ pwd', ['which'], '`which` muestra la ubicación del ejecutable.', ['which']),
      ],
    },
    {
      id: 'cero-mision', titulo: '5. Misión de recuperación', subtitulo: 'Combina pwd, ls y cd sin copiar una receta',
      teoria: [
        { t: 'Ahora recupera, no releas', p: 'Resolverás una pequeña navegación combinando habilidades anteriores. Puedes consultar una pista, pero el ejercicio quedará programado para repaso.' },
        { n: 'Plan mental', p: '1) oriéntate; 2) observa; 3) muévete; 4) verifica. Ese ciclo sirve en cualquier sistema Linux.' },
      ],
      practica: [
        quiz('cero-mision-plan', '¿Cuál es el orden más seguro al explorar una carpeta desconocida?', ['pwd → ls → cd → pwd', 'rm → cd → ls', 'cd → rm → pwd', 'ls → shutdown'], 0, 'Primero te orientas y observas; después cambias de contexto y verificas.'),
        terminal('cero-logs', 'Sin moverte de tu home, inspecciona `/var/log` y confirma que contiene `syslog`.', 'inicio', 'ls /var/log', (c) => k.ultimoUsó(c, /^ls\s+\/var\/log/) && k.salidaTiene(c, 'syslog'), ['Usa `ls` con la ruta absoluta `/var/log`.']),
        ordenar('cero-mision-construye', 'Construye una secuencia que entra en `/etc` y luego confirma la ubicación.', ['cd', '/etc', '&&', 'pwd'], 'cd /etc && pwd', '`&&` ejecuta `pwd` solo si `cd` funcionó.', ['cd','pwd','rutas']),
        terminal('cero-mision-vuelta', 'Ve a `documentos/facturas`, comprueba la ruta, vuelve a tu home con `~` y comprueba nuevamente.', 'inicio', 'cd documentos/facturas\npwd\ncd ~\npwd', (c) => k.cwdEs(c, '/home/user') && c.historial.filter((h) => h === 'pwd').length >= 2, ['Usa `cd documentos/facturas`, `pwd`, `cd ~` y `pwd`.']),
        terminal('cero-mision-final', 'Demuestra dominio: identifica usuario y carpeta, lista los archivos ocultos y termina dentro de `/etc`.', 'inicio', 'whoami\npwd\nls -a\ncd /etc\npwd', (c) => k.cwdEs(c, '/etc') && k.usó(c, /^whoami$/) && k.usó(c, /^ls\s+-(?:a|la|al)$/) && k.salidaTiene(c, '/etc'), ['Combina `whoami`, `pwd`, `ls -a`, `cd /etc` y una comprobación final.'], 40),
      ],
    },
  ],
};

const SALA_ARCHIVOS_AVANZADOS = {
  id: 'archivos-avanzados', n: 21, nombre: 'Archivos bajo la superficie',
  resumen: 'Firmas, cadenas, atributos, archivos ocultos y capas comprimidas',
  dificultad: 'Intermedio', minutos: 55, comandos: ['file', 'strings', 'stat', 'lsattr', 'chattr', 'tar', 'gzip'], origen: 'v2',
  tareas: [
    {
      id: 'av-firmas', titulo: 'El contenido importa más que la extensión', subtitulo: 'Firmas, metadatos y cadenas imprimibles',
      teoria: [
        { t: 'Las extensiones pueden mentir', p: '`file` inspecciona la firma del contenido. `strings` rescata secuencias imprimibles de datos binarios y `stat` enseña metadatos.' },
        { n: 'Estas herramientas sirven tanto para administración como para análisis forense inicial.' },
      ],
      practica: [
        quiz('av-q-file', '¿Qué usa principalmente `file` para identificar un formato?', ['La firma del contenido', 'Solo la extensión', 'El nombre del dueño', 'El tamaño del prompt'], 0, 'Las firmas o magic bytes permiten reconocer formatos aunque se renombren.'),
        quiz('av-q-strings', '¿Para qué sirve `strings`?', ['Extraer texto imprimible', 'Cifrar un archivo', 'Cambiar permisos', 'Crear enlaces'], 0, 'Busca secuencias de caracteres legibles dentro de datos.'),
        terminal('av-file', 'Identifica el tipo de `firmas.bin` con el comando apropiado.', 'avanzado', 'file firmas.bin', (c) => k.ultimoUsó(c, /^file\s+firmas\.bin/) && k.salidaTiene(c, 'ELF'), ['Usa `file firmas.bin`.']),
        terminal('av-strings', 'Extrae de `firmas.bin` el token legible escondido entre bytes binarios.', 'avanzado', 'strings firmas.bin', (c) => k.salidaTiene(c, 'TOKEN=LINUX-STRINGS-2026'), ['`strings` muestra las cadenas imprimibles.']),
        respuesta('av-token', 'Escribe solamente el valor encontrado después de `TOKEN=`.', ['LINUX-STRINGS-2026'], 'Separar clave y valor es una operación habitual al analizar salidas.'),
      ],
    },
    {
      id: 'av-atributos', titulo: 'Atributos más allá de rwx', subtitulo: 'El indicador immutable',
      teoria: [
        { t: 'Permisos y atributos son capas distintas', p: '`chmod` cambia permisos POSIX. `chattr +i` marca un archivo como inmutable y `lsattr` muestra ese atributo.' },
        { n: 'Cambiar atributos de protección requiere privilegios administrativos.' },
      ],
      practica: [
        quiz('av-q-hidden', '¿Qué opción de `ls` muestra archivos ocultos?', ['-a', '-h', '-S', '-d'], 0, '`-a` incluye nombres que empiezan por punto.'),
        quiz('av-q-immutable', '¿Qué letra representa el atributo immutable?', ['i', 'x', 'w', 's'], 0, '`i` impide modificaciones hasta retirar el atributo.'),
        terminal('av-ls-hidden', 'Lista todos los archivos, incluidos los ocultos, en formato largo.', 'avanzado', 'ls -la', (c) => k.ultimoUsó(c, /^ls\s+-[a-z]*l[a-z]*a|^ls\s+-[a-z]*a[a-z]*l/) || k.ultimoUsó(c, /^ls\s+-la/), ['Combina `-l` y `-a`.']),
        terminal('av-set-i', 'Marca `inmutable.conf` como inmutable y compruébalo con `lsattr`.', 'avanzado', 'sudo chattr +i inmutable.conf\nlsattr inmutable.conf', (c) => k.usó(c, /chattr\s+\+i\s+inmutable\.conf/) && k.salidaTiene(c, 'i', 'inmutable.conf'), ['Primero `sudo chattr +i`; después `lsattr`.']),
        terminal('av-unset-i', 'Retira el atributo inmutable de `inmutable.conf` y comprueba el resultado.', 'avanzado', 'sudo chattr +i inmutable.conf\nsudo -i\nchattr -i inmutable.conf\nlsattr inmutable.conf', (c) => k.usó(c, /chattr\s+-i\s+inmutable\.conf/) && k.salidaTiene(c, '--------------'), ['Entra en una shell root con `sudo -i` y aplica `chattr -i`.']),
      ],
    },
    {
      id: 'av-archivos', titulo: 'Empaquetar, comprimir e inspeccionar', subtitulo: 'No es lo mismo tar que gzip',
      teoria: [
        { t: 'Dos operaciones', p: '`tar` reúne varios archivos en uno; gzip comprime un flujo. Por eso es común combinar ambos como `.tar.gz`.' },
        { f: [['tar -czf copia.tar.gz carpeta', 'Crear y comprimir'], ['tar -tf copia.tar.gz', 'Listar sin extraer'], ['tar -xzf copia.tar.gz', 'Extraer']] },
      ],
      practica: [
        quiz('av-q-tar', '¿Qué hace principalmente `tar`?', ['Agrupa archivos', 'Cambia dueños', 'Mata procesos', 'Resuelve DNS'], 0, 'El archivador reúne; una capa adicional puede comprimir.'),
        quiz('av-q-gzip', '¿Qué opción de `tar` activa gzip?', ['z', 'p', 'u', 'n'], 0, '`z` conecta el archivo con gzip.'),
        terminal('av-create-tar', 'Crea `copia.tar.gz` con todo el directorio `archivos`.', 'avanzado', 'tar -czf copia.tar.gz archivos', (c) => k.existe(c, 'copia.tar.gz'), ['Usa `tar -czf destino origen`.']),
        terminal('av-list-tar', 'Crea el archivo comprimido y lista su contenido sin extraerlo.', 'avanzado', 'tar -czf copia.tar.gz archivos\ntar -tf copia.tar.gz', (c) => k.salidaTiene(c, 'archivos/uno.txt', 'archivos/dos.txt'), ['La opción `-t` lista el contenido.']),
        terminal('av-gzip-log', 'Comprime `app.log` directamente con gzip.', 'avanzado', 'gzip app.log', (c) => k.existe(c, 'app.log.gz'), ['Ejecuta `gzip` sobre el archivo.']),
      ],
    },
    {
      id: 'av-entorno', titulo: 'Tu entorno de shell', subtitulo: 'Variables, aliases y archivos de inicio',
      teoria: [
        { t: 'La shell también se configura', p: 'Variables como `PATH`, `HOME` y `SHELL` describen el entorno. Los aliases acortan comandos repetitivos.' },
        { t: 'Carga consciente', p: '`source archivo` ejecuta sus líneas en la shell actual. Revisa siempre el contenido antes de cargarlo.' },
      ],
      practica: [
        quiz('av-q-rc', '¿Qué comando carga un archivo en la shell actual?', ['source', 'mount', 'kill', 'diff'], 0, '`source` aplica definiciones sin abrir otra shell.'),
        quiz('av-q-alias', '¿Qué es un alias?', ['Un atajo de comando', 'Un permiso especial', 'Un proceso zombie', 'Un hash'], 0, 'Asocia un nombre corto con otra línea de comandos.'),
        terminal('av-alias', 'Crea el alias `ll` para ejecutar `ls -la` y muestra su definición.', 'avanzado', 'alias ll="ls -la"\nalias ll', (c) => k.salidaTiene(c, "alias ll='ls -la'"), ['Define con `alias nombre="comando"` y consulta con `alias nombre`.']),
        terminal('av-export', 'Crea la variable de entorno `MENTOR` con valor `v2` y muéstrala con `printenv`.', 'avanzado', 'export MENTOR=v2\nprintenv MENTOR', (c) => k.salidaTiene(c, 'v2'), ['Usa `export MENTOR=v2`.']),
        respuesta('av-home', '¿Cuál es la variable estándar que contiene la carpeta personal?', ['HOME', '$HOME'], 'La shell expone la ruta personal mediante `HOME`.'),
      ],
    },
  ],
};

const SALA_PROFESIONAL = {
  id: 'herramientas-profesionales', n: 22, nombre: 'Herramientas de trabajo profesional',
  resumen: 'Vim, Tmux, Git y conexiones remotas desde la terminal',
  dificultad: 'Intermedio', minutos: 65, comandos: ['vim', 'tmux', 'git', 'ssh', 'scp', 'nc'], origen: 'v2',
  tareas: [
    {
      id: 'pro-terminal', titulo: 'Sesiones y edición', subtitulo: 'Trabajar sin perder el contexto',
      teoria: [{ t: 'Herramientas persistentes', p: 'Tmux mantiene sesiones y paneles. Vim permite editar prácticamente en cualquier servidor Unix.' }, { n: 'El simulador enseña sus comandos y estados esenciales; no intenta reproducir toda su interfaz interactiva.' }],
      practica: [
        quiz('pro-q-tmux', '¿Qué ventaja principal aporta Tmux?', ['Sesiones persistentes', 'Cifrado de disco', 'Gestión de paquetes', 'Resolución DNS'], 0, 'La sesión sobrevive a desconexiones y organiza ventanas.'),
        quiz('pro-q-vim', '¿Qué tecla inicia el modo de inserción clásico de Vim?', ['i', 'q', 'z', 'p'], 0, '`i` entra al modo Insert.'),
        terminal('pro-tmux-version', 'Muestra la versión instalada de Tmux.', 'profesional', 'tmux -V', (c) => k.salidaTiene(c, 'tmux 3.3a'), ['Usa `tmux -V`.']),
        terminal('pro-tmux-session', 'Crea una sesión Tmux llamada `mentor` y luego enumera las sesiones.', 'profesional', 'tmux new-session -d -s mentor\ntmux ls', (c) => k.salidaTiene(c, 'mentor: 1 windows'), ['Crea con `new-session -d -s mentor`.']),
        terminal('pro-vim-version', 'Comprueba desde la terminal qué versión de Vim está disponible.', 'profesional', 'vim --version', (c) => k.salidaTiene(c, 'Vi IMproved 9.0'), ['Usa la opción larga `--version`.']),
      ],
    },
    {
      id: 'pro-git-base', titulo: 'Git: repositorio y staging', subtitulo: 'Guardar historia, no copias finales',
      teoria: [{ t: 'Tres zonas', p: 'Git distingue archivos de trabajo, staging y commits. `git add` prepara cambios; `git commit` crea un punto de historia.' }, { c: 'trabajo → git add → staging → git commit → historial' }],
      practica: [
        quiz('pro-q-repo', '¿Qué crea `git init`?', ['Un repositorio local', 'Una cuenta remota', 'Una máquina virtual', 'Un servicio web'], 0, 'Crea la metadata `.git` en el directorio.'),
        quiz('pro-q-stage', '¿Qué comando prepara un archivo para el próximo commit?', ['git add', 'git log', 'git tag', 'git diff --stat'], 0, '`git add` mueve el cambio al staging area.'),
        terminal('pro-git-init', 'Entra en `repo` e inicializa allí un repositorio Git.', 'profesional', 'cd repo && git init', (c) => k.salidaTiene(c, 'Inicializado repositorio Git'), ['Usa `cd repo && git init`.']),
        terminal('pro-git-status', 'Inicializa `repo` y consulta el estado de la rama.', 'profesional', 'cd repo && git init && git status', (c) => k.salidaTiene(c, 'En la rama main'), ['Después de `git init`, usa `git status`.']),
        terminal('pro-git-add', 'Inicializa `repo`, prepara `README.md` y confirma con `git status` que está en staging.', 'profesional', 'cd repo && git init && git add README.md && git status', (c) => k.salidaTiene(c, 'nuevo archivo: README.md'), ['Usa `git add README.md` antes del estado.']),
      ],
    },
    {
      id: 'pro-git-historia', titulo: 'Commits, ramas y etiquetas', subtitulo: 'Una historia que se puede explorar',
      teoria: [{ t: 'Commits pequeños y explicativos', p: 'Un commit debe capturar un cambio coherente. Las ramas aíslan trabajo y las etiquetas nombran versiones importantes.' }],
      practica: [
        quiz('pro-q-commit', '¿Qué debe describir un mensaje de commit?', ['La intención del cambio', 'La contraseña del usuario', 'Todo el historial', 'La IP pública'], 0, 'Un buen mensaje explica qué cambió y, cuando hace falta, por qué.'),
        quiz('pro-q-branch', '¿Para qué sirve una rama?', ['Aislar una línea de trabajo', 'Comprimir archivos', 'Asignar permisos', 'Ver procesos'], 0, 'Permite desarrollar sin alterar inmediatamente la línea principal.'),
        terminal('pro-git-commit', 'Crea un commit de `README.md` con mensaje `documenta el proyecto` y muestra el log corto.', 'profesional', 'cd repo && git init && git add README.md && git commit -m "documenta el proyecto" && git log --oneline', (c) => k.salidaTiene(c, 'documenta el proyecto'), ['Inicializa, añade, confirma con `-m` y consulta `--oneline`.']),
        terminal('pro-git-branch', 'Crea y cambia a una rama llamada `mejora-terminal`; luego lista las ramas.', 'profesional', 'cd repo && git init && git switch -c mejora-terminal && git branch', (c) => k.salidaTiene(c, '* mejora-terminal'), ['`git switch -c` crea y cambia.']),
        terminal('pro-git-tag', 'Crea un commit inicial, etiqueta la versión como `v2.0` y lista las etiquetas.', 'profesional', 'cd repo && git init && git add README.md && git commit -m inicial && git tag v2.0 && git tag', (c) => k.salidaTiene(c, 'v2.0'), ['`git tag nombre` crea; `git tag` lista.']),
      ],
    },
    {
      id: 'pro-remoto', titulo: 'Conexiones y transferencia', subtitulo: 'SSH, SCP y Netcat con propósito',
      teoria: [{ t: 'Canales distintos', p: 'SSH ofrece una sesión cifrada; SCP copia sobre SSH. Netcat ayuda a diagnosticar puertos y flujos, pero no cifra por sí mismo.' }, { n: 'En Mentor Linux todas las conexiones están simuladas y nunca salen del dispositivo.' }],
      practica: [
        quiz('pro-q-ssh', '¿Qué mejora un par de claves SSH frente a contraseñas reutilizadas?', ['Autenticación fuerte y automatizable', 'Desactiva el cifrado', 'Abre todos los puertos', 'Convierte al usuario en root'], 0, 'Las claves evitan reutilizar secretos memorizables y permiten controlar accesos.'),
        quiz('pro-q-nc', '¿Netcat cifra automáticamente el tráfico?', ['No', 'Sí, siempre', 'Solo con ping', 'Solo como root'], 0, 'Netcat transporta datos; para cifrado se necesita otro protocolo o capa.'),
        terminal('pro-ssh', 'Conéctate por SSH a `servidor.local` usando el usuario `user`.', 'profesional', 'ssh user@servidor.local', (c) => k.salidaTiene(c, 'Welcome to Debian'), ['La forma es `ssh usuario@host`.']),
        terminal('pro-nc', 'Comprueba con Netcat el banner del puerto SSH 22 de `servidor.local`.', 'profesional', 'nc servidor.local 22', (c) => k.salidaTiene(c, 'SSH-2.0'), ['Usa `nc host puerto`.']),
        terminal('pro-scp', 'Simula copiar `servidores.txt` al directorio `/tmp` de `servidor.local` mediante SCP.', 'profesional', 'scp servidores.txt user@servidor.local:/tmp/', (c) => k.salidaTiene(c, 'servidores.txt', '100%'), ['La forma es `scp origen usuario@host:destino`.']),
      ],
    },
  ],
};

const SALA_BASH_APLICADO = {
  id: 'bash-aplicado', n: 23, nombre: 'Bash aplicado',
  resumen: 'Scripts robustos para datos, logs y automatización de reconocimiento',
  dificultad: 'Avanzado', minutos: 70, comandos: ['bash', 'test', 'printf', 'awk', 'grep', 'cut', 'sort'], origen: 'v2',
  tareas: [
    {
      id: 'bash-ejecucion', titulo: 'Scripts ejecutables', subtitulo: 'Shebang, permisos y entorno',
      teoria: [{ t: 'Un script es un archivo de texto', p: 'El shebang selecciona el intérprete. El bit ejecutable permite lanzarlo directamente; también puedes invocarlo con `bash archivo`.' }],
      practica: [
        quiz('ba-q-shebang', '¿Qué indica `#!/bin/bash`?', ['El intérprete del script', 'El dueño', 'La contraseña', 'La codificación Base64'], 0, 'El kernel usa esa ruta para ejecutar el archivo.'),
        quiz('ba-q-exec', '¿Qué permiso permite ejecutar un archivo?', ['x', 'r', 'w', 't'], 0, '`x` es execute.'),
        terminal('ba-script', 'Crea `saludo.sh` que imprima `Hola desde Bash` y ejecútalo con Bash.', 'bash-aplicado', 'printf "#!/bin/bash\\necho Hola desde Bash\\n" > saludo.sh\nbash saludo.sh', (c) => k.salidaTiene(c, 'Hola desde Bash'), ['Escribe el archivo con `printf` y ejecútalo con `bash`.']),
        terminal('ba-executable', 'Da permiso de ejecución a `plantilla.sh` y comprueba el modo con `ls -l`.', 'bash-aplicado', 'chmod u+x plantilla.sh\nls -l plantilla.sh', (c) => k.salidaTiene(c, 'rwx'), ['Usa `chmod u+x`.']),
      ],
    },
    {
      id: 'bash-robusto', titulo: 'Fallos controlados', subtitulo: 'Códigos de salida y operadores',
      teoria: [{ t: 'Éxito es código cero', p: '`&&` continúa tras éxito; `||` ofrece una alternativa tras error. `set -euo pipefail` endurece scripts ante fallos silenciosos.' }],
      practica: [
        quiz('ba-q-set', '¿Qué busca evitar `set -euo pipefail`?', ['Fallos silenciosos', 'Archivos ocultos', 'Conexiones cifradas', 'Permisos octales'], 0, 'Hace que variables inexistentes y fallos en pipelines sean visibles.'),
        quiz('ba-q-status', '¿Qué valor suele representar éxito en `$?`?', ['0', '1', '127', '255'], 0, 'En Unix, cero significa éxito.'),
        terminal('ba-fallback', 'Ejecuta un comando que falle y usa `||` para imprimir `recuperado`.', 'bash-aplicado', 'false || echo recuperado', (c) => k.salidaTiene(c, 'recuperado'), ['`false` devuelve error; encadena la alternativa con `||`.']),
        terminal('ba-test', 'Comprueba con `test` que existe `usuarios.csv` y, solo si existe, imprime `datos listos`.', 'bash-aplicado', 'test -f usuarios.csv && echo datos listos', (c) => k.salidaTiene(c, 'datos listos'), ['Usa `test -f archivo && echo ...`.']),
      ],
    },
    {
      id: 'bash-datos', titulo: 'Automatizar datos repetitivos', subtitulo: 'Bucles, filtros y campos',
      teoria: [{ t: 'Combinar herramientas pequeñas', p: 'Bash brilla cuando conecta `grep`, `cut`, `awk`, `sort` y bucles. Cada herramienta resuelve una parte observable.' }],
      practica: [
        quiz('ba-q-loop', '¿Qué estructura recorre una lista conocida?', ['for', 'case solamente', 'alias', 'mount'], 0, '`for` itera sobre elementos.'),
        quiz('ba-q-awk', '¿Qué herramienta trabaja cómodamente con campos y columnas?', ['awk', 'pwd', 'kill', 'chmod'], 0, 'Awk divide registros en campos y aplica reglas.'),
        terminal('ba-loop', 'Usa un bucle `for` para imprimir exactamente `uno`, `dos` y `tres` en líneas sucesivas.', 'bash-aplicado', 'for x in uno dos tres; do echo $x; done', (c) => k.salidaTiene(c, 'uno\ndos\ntres'), ['`for x in ...; do echo $x; done`.']),
        terminal('ba-admins', 'Extrae de `usuarios.csv` los nombres de quienes tienen rol `admin`.', 'bash-aplicado', 'grep ",admin" usuarios.csv | cut -d, -f1', (c) => k.salidaTiene(c, 'ana', 'mar') && !k.ultimaSalida(c).includes('luis'), ['Filtra `,admin` y corta el primer campo.']),
        terminal('ba-count-errors', 'Cuenta cuántas líneas `ERROR` hay en `logs/app.log`.', 'bash-aplicado', 'grep ERROR logs/app.log | wc -l', (c) => k.salidaTiene(c, '2'), ['Conecta `grep` con `wc -l`.']),
      ],
    },
    {
      id: 'bash-recon', titulo: 'Proyecto: inventario de objetivos', subtitulo: 'Automatización segura para un laboratorio',
      teoria: [{ t: 'Primero define el alcance', p: 'Automatizar reconocimiento solo es legítimo sobre sistemas propios o expresamente autorizados. Aquí todos los objetivos son simulados.' }, { n: 'El proyecto final combina entrada, bucles, salida y filtrado sin realizar tráfico real.' }],
      practica: [
        quiz('ba-q-scope', '¿Qué debes confirmar antes de automatizar reconocimiento?', ['Autorización y alcance', 'Que el objetivo sea famoso', 'Que no haya logs', 'Que uses root'], 0, 'La autorización escrita y el alcance son requisitos básicos.'),
        quiz('ba-q-streams', '¿Qué descriptor representa stderr?', ['2', '0', '1', '9'], 0, '0 es stdin, 1 stdout y 2 stderr.'),
        terminal('ba-inventory', 'Recorre cada IP de `hosts.txt` y antepón el texto `objetivo:` a cada una.', 'bash-aplicado', 'for ip in 10.10.10.21 10.10.10.22 10.10.10.23; do echo objetivo:$ip; done', (c) => k.salidaTiene(c, 'objetivo:10.10.10.21', 'objetivo:10.10.10.23'), ['Usa un `for` con las tres IP del archivo.']),
        terminal('ba-report', 'Crea `reporte.txt` con las dos líneas de error de `logs/app.log` y comprueba su contenido.', 'bash-aplicado', 'grep ERROR logs/app.log > reporte.txt\ncat reporte.txt', (c) => k.existe(c, 'reporte.txt') && k.salidaTiene(c, 'timeout', 'denied'), ['Redirige la salida de `grep` y luego usa `cat`.']),
        terminal('ba-summary', 'Genera un resumen único y ordenado de los roles presentes en `usuarios.csv`.', 'bash-aplicado', 'cut -d, -f2 usuarios.csv | sort -u', (c) => k.salidaTiene(c, 'admin', 'user'), ['Extrae la segunda columna, ordena y elimina duplicados.']),
      ],
    },
  ],
};

const NORMALIZADAS = MODULOS.map(normalizarModulo);
const SALAS_BASE = [SALA_CERO, ...NORMALIZADAS, SALA_ARCHIVOS_AVANZADOS, SALA_PROFESIONAL, SALA_BASH_APLICADO, ...SALAS_REDES, ...SALAS_OFENSIVA, ...SALAS_DEFENSA];

export const RUTAS = [
  { id: 'linux-cero', academia: 'linux', nombre: 'Empieza desde cero', descripcion: 'Terminal, identidad y primeros hábitos', nivel: 'Inicial', salas: ['cero-absoluto', 'inicio'] },
  { id: 'linux-esencial', academia: 'linux', nombre: 'Linux Essentials', descripcion: 'Navegación, archivos y lectura de texto', nivel: 'Principiante', salas: ['navegacion', 'archivos', 'texto'] },
  { id: 'linux-filesystem', academia: 'linux', nombre: 'Filesystem y datos', descripcion: 'Permisos, búsquedas, pipelines y formatos', nivel: 'Fácil', salas: ['permisos', 'busqueda', 'pipes', 'archivos-avanzados'] },
  { id: 'linux-admin', academia: 'linux', nombre: 'Administración Linux', descripcion: 'Procesos, paquetes, descriptores y servicios', nivel: 'Intermedio', salas: ['procesos', 'paquetes', 'descriptores', 'especiales', 'systemd'] },
  { id: 'linux-profesional', academia: 'linux', nombre: 'Flujo profesional', descripcion: 'Git, tmux, editor y diagnóstico cotidiano', nivel: 'Intermedio', salas: ['herramientas-profesionales'] },
  { id: 'redes-linux', academia: 'redes', nombre: 'Redes desde Linux', descripcion: 'Interfaces, DNS, servicios y acceso remoto', nivel: 'Fácil', salas: ['redes', 'ssh'] },
  { id: 'redes-servicios', academia: 'redes', nombre: 'Servicios y diagnóstico', descripcion: 'DNS, puertos, HTTP y el método capa a capa', nivel: 'Intermedio', salas: ['dns', 'puertos', 'http', 'diagnostico-red'] },
  { id: 'bash-base', academia: 'bash', nombre: 'Bash fundamental', descripcion: 'Variables, condiciones, bucles y funciones', nivel: 'Fácil', salas: ['bash1', 'bash2'] },
  { id: 'bash-proyectos', academia: 'bash', nombre: 'Automatización aplicada', descripcion: 'Scripts ejecutables y proyectos de operación', nivel: 'Intermedio', salas: ['bash-aplicado'] },
  { id: 'ofensiva-base', academia: 'ofensiva', nombre: 'Hacking ético', descripcion: 'Criptografía práctica y metodología autorizada', nivel: 'Intermedio', salas: ['cifrado', 'etico'] },
  { id: 'ofensiva-metodologia', academia: 'ofensiva', nombre: 'Metodología de auditoría', descripcion: 'Reconocimiento, enumeración, acceso y escalada', nivel: 'Avanzado', salas: ['recon', 'enumeracion', 'acceso', 'escalada'] },
  { id: 'defensa-base', academia: 'defensa', nombre: 'Blue Team y análisis', descripcion: 'Hardening, evidencias y respuesta inicial', nivel: 'Intermedio', salas: ['hardening', 'analisis'] },
  { id: 'defensa-operacion', academia: 'defensa', nombre: 'Operación y respuesta', descripcion: 'Leer registros, cuentas, cortafuegos y respuesta a incidentes', nivel: 'Avanzado', salas: ['logs', 'cuentas', 'firewall', 'respuesta'] },
];

// `objetivo` dice qué sabrás HACER al terminar la academia. Un nombre técnico
// («Filesystem y datos») no orienta a quien empieza; una capacidad sí.
export const ACADEMIAS = [
  { id: 'linux', nombre: 'Linux', descripcion: 'De tu primera terminal a administrar y diagnosticar sistemas', objetivo: 'Sobrevives en cualquier servidor', color: 'lime', icono: '$_', rutas: ['linux-cero', 'linux-esencial', 'linux-filesystem', 'linux-admin', 'linux-profesional'] },
  { id: 'redes', nombre: 'Redes', descripcion: 'Comprende conexiones, servicios, DNS y acceso remoto', objetivo: 'Diagnosticas por qué algo no conecta', color: 'cyan', icono: '<>', rutas: ['redes-linux', 'redes-servicios'] },
  { id: 'bash', nombre: 'Bash y automatización', descripcion: 'Convierte comandos en herramientas repetibles', objetivo: 'Automatizas lo que hacías a mano', color: 'magenta', icono: '{}', rutas: ['bash-base', 'bash-proyectos'] },
  { id: 'ofensiva', nombre: 'Seguridad ofensiva', descripcion: 'Metodología de hacking ético en laboratorios autorizados', objetivo: 'Auditas una máquina de principio a fin', color: 'red', icono: '#!', rutas: ['ofensiva-base', 'ofensiva-metodologia'] },
  { id: 'defensa', nombre: 'Defensa y forense', descripcion: 'Protege, investiga y explica lo ocurrido', objetivo: 'Detectas un ataque y lo explicas', color: 'blue', icono: '[]', rutas: ['defensa-base', 'defensa-operacion'] },
];

export const RUTA_POR_ID = Object.fromEntries(RUTAS.map((r) => [r.id, r]));
export const ACADEMIA_POR_ID = Object.fromEntries(ACADEMIAS.map((a) => [a.id, a]));
// Alias conservado para compatibilidad con logros y exportaciones v2.
export const BLOQUES = ACADEMIAS.map((a) => ({ ...a, salas: a.rutas.flatMap((id) => RUTA_POR_ID[id].salas) }));

export const SALAS = SALAS_BASE.map((sala) => ({
  ...sala,
  tareas: sala.tareas.map((tarea) => ({
    ...tarea,
    practica: tarea.practica.map((ejercicio) => ({
      ...ejercicio,
      habilidades: habilidadesDeEjercicio(ejercicio, sala.comandos || []),
    })),
  })),
}));
export const SALA_POR_ID = Object.fromEntries(SALAS.map((s) => [s.id, s]));
export const TODAS_TAREAS = SALAS.flatMap((s) => s.tareas.map((t, orden) => ({ ...t, salaId: s.id, orden })));
export const TAREA_POR_ID = Object.fromEntries(TODAS_TAREAS.map((t) => [t.id, t]));
export const TODOS_EJERCICIOS = TODAS_TAREAS.flatMap((t) => t.practica.map((e) => ({ ...e, tareaId: t.id, salaId: t.salaId })));
export const EJERCICIO_POR_ID = Object.fromEntries(TODOS_EJERCICIOS.map((e) => [e.id, e]));
export const TOTAL_SALAS = SALAS.length;
export const TOTAL_TAREAS = TODAS_TAREAS.length;
export const TOTAL_EJERCICIOS = TODOS_EJERCICIOS.length;

export function bloqueDeSala(salaId) {
  return BLOQUES.find((b) => b.salas.includes(salaId)) || BLOQUES[0];
}

export function rutaDeSala(salaId) {
  return RUTAS.find((r) => r.salas.includes(salaId)) || RUTAS[0];
}

export function academiaDeSala(salaId) {
  return ACADEMIA_POR_ID[rutaDeSala(salaId).academia] || ACADEMIAS[0];
}

export function siguienteTarea(sala, tareaId) {
  const i = sala.tareas.findIndex((t) => t.id === tareaId);
  return i >= 0 ? sala.tareas[i + 1] || null : sala.tareas[0] || null;
}
