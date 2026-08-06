// Módulos 5–8: permisos, búsqueda, pipes y procesos.
import * as k from './checks.js';

export const MODULOS_2 = [
  // ======================================================================
  {
    id: 'permisos',
    n: 5,
    nombre: 'Permisos y usuarios',
    resumen: 'Quién puede hacer qué, y cómo pedir permiso',
    comandos: ['chmod', 'chown', 'chgrp', 'umask', 'id', 'whoami', 'groups', 'sudo', 'su'],
    lecciones: [
      {
        id: 'leer-permisos',
        titulo: 'Leer los permisos',
        subtitulo: 'Descifrar esa fila de guiones y letras',
        cuerpo: [
          { t: 'Diez caracteres con toda la información', p: 'Lo primero que muestra `ls -l` es el tipo y los permisos. Una vez sabes leerlo, entiendes de un vistazo quién puede tocar el archivo.' },
          { c: '-rwxr-xr--\n│└┬┘└┬┘└┬┘\n│ │  │  └── otros: solo leer\n│ │  └───── grupo: leer y ejecutar\n│ └──────── dueño: leer, escribir y ejecutar\n└────────── tipo: - archivo, d carpeta, l enlace' },
          { t: 'Tres permisos', p: '**r** (read) leer, **w** (write) modificar o borrar, **x** (execute) ejecutar como programa. En una carpeta significan cosas ligeramente distintas: `r` listar su contenido, `w` crear o borrar dentro, `x` poder entrar en ella.' },
          { t: 'Tres destinatarios', p: '**u** (user) el dueño, **g** (group) su grupo, **o** (others) todos los demás. Y **a** (all) para los tres a la vez.' },
          { n: 'Que una carpeta tenga `x` pero no `r` es habitual: puedes entrar y acceder a archivos concretos, pero no listar lo que hay dentro.' },
        ],
        retos: [
          {
            id: 'r5-ver',
            enunciado: 'Muestra los permisos del archivo `deploy.sh` en formato largo.',
            snapshot: 'permisos',
            xp: 20,
            pistas: ['El formato largo de `ls` es `-l`.', '`ls -l deploy.sh`'],
            solucion: 'ls -l deploy.sh',
            check: (c) => k.salidaTiene(c, 'deploy.sh', 'rw-'),
          },
        ],
      },
      {
        id: 'chmod-letras',
        titulo: 'chmod con letras',
        subtitulo: 'La forma más legible de cambiar permisos',
        cuerpo: [
          { t: 'Quién, qué operación, qué permiso', p: 'Se escribe pegado: primero a quién afecta, luego `+` para añadir, `-` para quitar o `=` para dejar exactamente eso, y por último los permisos.' },
          { f: [['chmod u+x script.sh', 'Da ejecución al dueño'], ['chmod g-w archivo', 'Quita escritura al grupo'], ['chmod o=r archivo', 'Otros solo pueden leer, nada más'], ['chmod a+r archivo', 'Todos pueden leer'], ['chmod u+x,g+x s.sh', 'Varios cambios separados por coma'], ['chmod -R g+w carpeta', 'Aplica a todo lo que hay dentro']] },
          { c: 'user@mentor:~$ ./deploy.sh\nbash: ./deploy.sh: Permission denied\n\nuser@mentor:~$ chmod u+x deploy.sh\nuser@mentor:~$ ls -l deploy.sh\n-rwxr--r-- 1 user user 92 ene 15 10:30 deploy.sh' },
        ],
        retos: [
          {
            id: 'r5-chmod-ux',
            enunciado: 'Haz que `deploy.sh` lo pueda ejecutar su dueño, sin dar permisos de más a nadie.',
            snapshot: 'permisos',
            xp: 40,
            pistas: ['El dueño es `u` y ejecutar es `x`. Se añade con `+`.', '`chmod u+x deploy.sh`'],
            solucion: 'chmod u+x deploy.sh',
            check: (c) => k.tieneBits(c, 'deploy.sh', k.bits.dueñoEjecuta) && k.sinBits(c, 'deploy.sh', k.bits.grupoEjecuta | k.bits.otrosEjecuta),
            diagnostico: [
              { cuando: (c) => k.tieneBits(c, 'deploy.sh', k.bits.dueñoEjecuta) && !k.sinBits(c, 'deploy.sh', k.bits.grupoEjecuta | k.bits.otrosEjecuta), titulo: 'Diste ejecución de más', texto: 'El dueño ya puede ejecutarlo, pero también el grupo o los demás. Usaste `a+x` o `755`; el enunciado pide solo para el dueño: `chmod u+x`.' },
              { cuando: (c) => k.modo(c, 'deploy.sh') === 0o644, titulo: 'Los permisos siguen igual', texto: 'El archivo continúa en `-rw-r--r--`. Comprueba que escribiste bien el nombre del archivo y que el comando no dio error.' },
            ],
          },
          {
            id: 'r5-chmod-privado',
            enunciado: 'El archivo `notas-privadas.txt` tiene una contraseña dentro. Haz que solo su dueño pueda leerlo y escribirlo, y que nadie más pueda ni leerlo.',
            snapshot: 'permisos',
            xp: 50,
            pistas: ['Necesitas quitar todos los permisos a grupo y otros.', 'Con letras: `chmod go-rwx notas-privadas.txt`. Con números sería `chmod 600`.'],
            solucion: 'chmod 600 notas-privadas.txt',
            check: (c) => k.modo(c, 'notas-privadas.txt') === 0o600,
            diagnostico: [
              { cuando: (c) => { const m = k.modo(c, 'notas-privadas.txt'); return m != null && (m & 0o077) !== 0; }, titulo: 'Grupo u otros todavía pueden algo', texto: 'Los últimos seis bits tienen que quedar a cero. Comprueba con `ls -l`: debe verse `-rw-------`.' },
              { cuando: (c) => { const m = k.modo(c, 'notas-privadas.txt'); return m != null && (m & 0o600) !== 0o600; }, titulo: 'Te quedaste sin acceso tú mismo', texto: 'Le quitaste permisos también al dueño. Debe quedar `rw` para ti: `chmod 600`.' },
            ],
          },
        ],
      },
      {
        id: 'chmod-numeros',
        titulo: 'chmod con números',
        subtitulo: 'La forma corta que usan los profesionales',
        cuerpo: [
          { t: 'Cada permiso vale un número', p: 'r = 4, w = 2, x = 1. Se suman para cada grupo y salen tres cifras: dueño, grupo y otros.' },
          { c: 'rwx = 4+2+1 = 7    r-x = 4+0+1 = 5\nrw- = 4+2+0 = 6    r-- = 4+0+0 = 4\n--- = 0+0+0 = 0    -wx = 0+2+1 = 3' },
          { f: [['chmod 755 script.sh', 'Dueño todo, resto leer y ejecutar'], ['chmod 644 archivo', 'Dueño lee y escribe, resto solo lee'], ['chmod 600 secreto', 'Solo el dueño, y nadie más'], ['chmod 700 carpeta', 'Carpeta privada del dueño'], ['chmod 777 archivo', 'Todos pueden todo — casi nunca es buena idea']] },
          { t: 'Los tres que verás siempre', p: '**644** para archivos normales, **755** para scripts y carpetas, **600** para cosas privadas como claves. Con esos tres cubres el 90% de los casos.' },
        ],
        retos: [
          {
            id: 'r5-755',
            enunciado: 'Deja `backup.sh` con permisos 755: el dueño puede todo, y el grupo y los demás pueden leer y ejecutar.',
            snapshot: 'permisos',
            xp: 45,
            pistas: ['Ya te dan el número en el enunciado.', '`chmod 755 backup.sh`'],
            solucion: 'chmod 755 backup.sh',
            check: (c) => k.modo(c, 'backup.sh') === 0o755,
          },
          {
            id: 'r5-informe',
            enunciado: 'El archivo `informe.txt` tiene permisos raros (604). Déjalo en el estándar para archivos normales: 644.',
            snapshot: 'permisos',
            xp: 40,
            pistas: ['644 significa rw- r-- r--.', '`chmod 644 informe.txt`'],
            solucion: 'chmod 644 informe.txt',
            check: (c) => k.modo(c, 'informe.txt') === 0o644,
          },
          {
            id: 'r5-recursivo',
            enunciado: 'Haz que todo el contenido de la carpeta `compartido` sea escribible por el grupo, aplicándolo también a los archivos de dentro.',
            snapshot: 'permisos',
            xp: 50,
            pistas: ['Necesitas la opción recursiva de chmod.', '`chmod -R g+w compartido`'],
            solucion: 'chmod -R g+w compartido',
            check: (c) => k.tieneBits(c, 'compartido', k.bits.grupoEscribe) && k.tieneBits(c, 'compartido/equipo.txt', k.bits.grupoEscribe),
            diagnostico: [
              { cuando: (c) => k.tieneBits(c, 'compartido', k.bits.grupoEscribe) && !k.tieneBits(c, 'compartido/equipo.txt', k.bits.grupoEscribe), titulo: 'Cambiaste la carpeta pero no su contenido', texto: 'Los archivos de dentro conservan sus permisos. Añade `-R` para que baje por todo el árbol.' },
            ],
          },
        ],
      },
      {
        id: 'dueños',
        titulo: 'Dueños y grupos',
        subtitulo: 'chown, chgrp y por qué necesitan root',
        cuerpo: [
          { t: 'Cada archivo tiene dueño y grupo', p: 'Se ven en las columnas 3 y 4 de `ls -l`. Los permisos se aplican según si eres el dueño, si estás en el grupo, o si no eres ninguno de los dos.' },
          { f: [['chown ana archivo', 'Cambia el dueño'], ['chown ana:desarrollo archivo', 'Dueño y grupo a la vez'], ['chgrp desarrollo archivo', 'Solo el grupo'], ['chown -R ana carpeta', 'Aplica a todo el contenido']] },
          { t: 'Solo root puede regalar archivos', p: 'Si pudieras poner tus archivos a nombre de otro, podrías saltarte las cuotas de disco o culpar a otro de tus archivos. Por eso `chown` requiere `sudo`.' },
        ],
        retos: [
          {
            id: 'r5-chown',
            enunciado: 'Cambia el dueño del archivo `ajeno.conf` para que pase a ser tuyo (usuario `user`). Necesitarás privilegios de administrador.',
            snapshot: 'permisos',
            xp: 55,
            pistas: ['`chown` solo lo puede ejecutar root.', 'Pon `sudo` delante: `sudo chown user ajeno.conf`'],
            solucion: 'sudo chown user ajeno.conf',
            check: (c) => k.dueño(c, 'ajeno.conf') === 'user',
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /^chown/) && k.salidaTiene(c, 'Operation not permitted'), titulo: 'Te falta sudo', texto: 'Cambiar el dueño de un archivo es una operación reservada al administrador. Repite el comando con `sudo` delante.' },
            ],
          },
        ],
      },
      {
        id: 'sudo',
        titulo: 'sudo: hacer de administrador',
        subtitulo: 'Con cuidado, solo para lo que hace falta',
        cuerpo: [
          { t: 'Qué es root', p: 'Es el usuario administrador: puede hacer absolutamente todo, incluido destrozar el sistema. Por eso nadie trabaja como root todo el día.' },
          { t: 'sudo eleva un solo comando', p: 'Ejecuta ese comando concreto como root y vuelve a tu usuario normal. Es la forma correcta de administrar: privilegios solo cuando hacen falta.' },
          { f: [['sudo comando', 'Ejecuta ese comando como root'], ['sudo -i', 'Abre una sesión de root (usar poco)'], ['su - usuario', 'Cambia a otro usuario'], ['id', 'Comprueba con qué usuario estás'], ['exit', 'Sale de la sesión elevada']] },
          { n: 'Regla práctica: si un comando falla con «Permission denied» o «are you root?», normalmente la solución es repetirlo con `sudo`. Si falla con «No such file», sudo no arregla nada: es que la ruta está mal.' },
        ],
        retos: [
          {
            id: 'r5-sudo-log',
            enunciado: 'Lee el archivo `/var/log/syslog`. Tu usuario no tiene permiso, así que tendrás que elevar privilegios.',
            snapshot: 'permisos',
            xp: 45,
            pistas: ['Primero prueba `cat /var/log/syslog` y lee el error.', 'Añade sudo: `sudo cat /var/log/syslog`'],
            solucion: 'sudo cat /var/log/syslog',
            check: (c) => k.salidaTiene(c, 'render-worker') && !k.salidaTiene(c, 'Permission denied'),
            diagnostico: [
              { cuando: (c) => k.salidaTiene(c, 'Permission denied'), titulo: 'Sin permiso para leerlo', texto: 'Los registros del sistema están restringidos: el archivo es `-rw-r-----` y pertenece a root. Repite el comando con `sudo` delante.' },
            ],
          },
          {
            id: 'r5-id-root',
            enunciado: 'Comprueba con qué identidad se ejecutan los comandos cuando usas sudo: lanza `whoami` como administrador.',
            snapshot: 'permisos',
            xp: 35,
            pistas: ['Puedes poner sudo delante de cualquier comando.', '`sudo whoami`'],
            solucion: 'sudo whoami',
            check: (c) => k.ultimoUsó(c, /sudo\s+whoami/) && k.salidaTiene(c, 'root'),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué significa `-rwxr-xr--`?', opciones: ['Todos pueden todo', 'Dueño todo, grupo leer/ejecutar, otros solo leer', 'Es una carpeta', 'Nadie puede escribir'], correcta: 1, explicacion: 'El primer guion es el tipo (archivo). Luego rwx para el dueño, r-x para el grupo y r-- para el resto.' },
      { pregunta: '¿A qué equivale `chmod 640`?', opciones: ['rw-r-----', 'rwxr-x---', 'rw-rw----', 'r--r--r--'], correcta: 0, explicacion: '6 = rw, 4 = r, 0 = nada. Típico de archivos de registro.' },
      { pregunta: 'Un script da «Permission denied» al ejecutarlo. ¿Qué falta?', opciones: ['Permiso de lectura', 'Permiso de ejecución', 'Ser root', 'Que sea .sh'], correcta: 1, explicacion: 'Falta el bit `x`. Se arregla con `chmod +x script.sh`.' },
      { pregunta: '¿Por qué `chown` necesita sudo?', opciones: ['Por costumbre', 'Porque regalar archivos permitiría saltarse cuotas y responsabilidades', 'Porque es lento', 'No lo necesita'], correcta: 1, explicacion: 'Solo root puede cambiar la propiedad, para que nadie pueda endosar sus archivos a otro usuario.' },
      { pregunta: '¿Qué permiso necesita una carpeta para poder entrar en ella con `cd`?', opciones: ['r', 'w', 'x', 'ninguno'], correcta: 2, explicacion: 'En carpetas, `x` significa poder atravesarla. Sin `r` puedes entrar pero no listar su contenido.' },
    ],
  },

  // ======================================================================
  {
    id: 'busqueda',
    n: 6,
    nombre: 'Buscar',
    resumen: 'Encontrar archivos y encontrar texto dentro de ellos',
    comandos: ['find', 'grep', 'locate', 'which', 'xargs'],
    lecciones: [
      {
        id: 'find-basico',
        titulo: 'find: buscar archivos',
        subtitulo: 'Por nombre, por tipo, por tamaño, por lo que sea',
        cuerpo: [
          { t: 'La estructura', p: 'Siempre igual: `find <dónde buscar> <qué condición>`. Si no dices dónde, busca desde la carpeta actual.' },
          { f: [['find . -name "*.txt"', 'Archivos .txt desde aquí hacia abajo'], ['find /etc -name "*.conf"', 'Configuraciones en /etc'], ['find . -iname "*.TXT"', 'Igual pero sin distinguir mayúsculas'], ['find . -type d', 'Solo carpetas'], ['find . -type f', 'Solo archivos'], ['find . -size +1M', 'De más de 1 megabyte'], ['find . -empty', 'Archivos o carpetas vacías']] },
          { n: 'Pon el patrón entre comillas: `find . -name "*.txt"`. Sin ellas, la shell expande el `*` antes de que `find` lo vea y el resultado es distinto.' },
        ],
        retos: [
          {
            id: 'r6-find-name',
            enunciado: 'Encuentra todos los archivos con extensión `.json` que hay dentro de la carpeta `proyectos`.',
            snapshot: 'busqueda',
            xp: 40,
            pistas: ['La condición de nombre es `-name` y acepta comodines.', '`find proyectos -name "*.json"`'],
            solucion: 'find proyectos -name "*.json"',
            check: (c) => k.salidaTiene(c, 'web/config.json') && k.salidaTiene(c, 'api/config.json'),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /find/) && k.salidaLineas(c).length === 0, titulo: 'La búsqueda no devolvió nada', texto: 'Revisa el patrón: para «todo lo que acabe en .json» hace falta el comodín, `"*.json"`, y entre comillas.' },
            ],
          },
          {
            id: 'r6-find-type',
            enunciado: 'Lista solo las carpetas que hay dentro de `proyectos` (sin archivos).',
            snapshot: 'busqueda',
            xp: 45,
            pistas: ['La condición de tipo es `-type`, y las carpetas son `d`.', '`find proyectos -type d`'],
            solucion: 'find proyectos -type d',
            check: (c) => k.salidaTiene(c, 'proyectos/web') && !k.salidaTiene(c, '.js'),
          },
          {
            id: 'r6-find-tmp',
            enunciado: 'Busca en toda tu carpeta personal los archivos temporales que acaban en `.tmp`.',
            snapshot: 'busqueda',
            xp: 45,
            pistas: ['Puedes usar `.` como punto de partida si estás en tu carpeta.', '`find . -name "*.tmp"`'],
            solucion: 'find . -name "*.tmp"',
            check: (c) => k.salidaTiene(c, 'temporal.tmp') && k.salidaTiene(c, 'basura.tmp'),
          },
        ],
      },
      {
        id: 'find-avanzado',
        titulo: 'find con acciones',
        subtitulo: 'Encontrar y hacer algo con lo encontrado',
        cuerpo: [
          { t: 'No solo listar', p: '`find` puede ejecutar un comando sobre cada resultado. Es la forma estándar de limpiar, cambiar permisos en masa o procesar muchos archivos.' },
          { f: [['find . -name "*.tmp" -delete', 'Borra lo encontrado'], ['find . -name "*.sh" -exec chmod +x {} ;', 'Ejecuta un comando por resultado'], ['find . -type f -perm 777', 'Archivos con permisos peligrosos'], ['find . -user ana', 'Archivos de un usuario concreto'], ['find . -maxdepth 1', 'No baja a las subcarpetas']] },
          { t: 'El {} y el ;', p: 'En `-exec`, `{}` se sustituye por cada archivo encontrado y el `;` marca dónde acaba el comando.' },
          { n: 'Antes de un `-delete`, ejecuta la misma búsqueda sin él. Si la lista es la que esperas, entonces añade el `-delete`.' },
        ],
        retos: [
          {
            id: 'r6-find-delete',
            enunciado: 'Borra todos los archivos `.tmp` que hay bajo tu carpeta personal, usando find.',
            snapshot: 'busqueda',
            xp: 55,
            pistas: ['Primero búscalos con `find . -name "*.tmp"` y comprueba la lista.', 'Añade la acción al final: `find . -name "*.tmp" -delete`'],
            solucion: 'find . -name "*.tmp" -delete',
            check: (c) => !k.existe(c, 'proyectos/viejo/temporal.tmp') && !k.existe(c, 'proyectos/viejo/basura.tmp') && k.existe(c, 'proyectos/viejo/notas.txt'),
            diagnostico: [
              { cuando: (c) => !k.existe(c, 'proyectos/viejo/notas.txt'), titulo: 'Borraste de más', texto: 'También desapareció `notas.txt`, que no es un `.tmp`. El patrón debe ser exactamente `"*.tmp"`. Reinicia el reto.' },
            ],
          },
          {
            id: 'r6-find-perm',
            enunciado: 'Busca en la carpeta `proyectos` todos los archivos (no carpetas) cuyo nombre acabe en `.js`, pero sin entrar en la carpeta `vendor`… primero simplemente encuéntralos todos con `-type f`.',
            snapshot: 'busqueda',
            xp: 45,
            pistas: ['Combina dos condiciones: `-type f` y `-name`.', '`find proyectos -type f -name "*.js"`'],
            solucion: 'find proyectos -type f -name "*.js"',
            check: (c) => k.salidaTiene(c, 'server.js') && k.salidaTiene(c, 'app.js'),
          },
        ],
      },
      {
        id: 'grep',
        titulo: 'grep: buscar texto dentro',
        subtitulo: 'Probablemente el comando más útil de Linux',
        cuerpo: [
          { t: 'Filtrar líneas', p: '`grep` muestra las líneas que contienen lo que buscas. Sirve para leer registros, buscar en código y filtrar la salida de otros comandos.' },
          { f: [['grep error archivo.log', 'Líneas que contienen «error»'], ['grep -i error archivo', 'Sin distinguir mayúsculas'], ['grep -n error archivo', 'Con el número de línea'], ['grep -r TODO .', 'Busca dentro de todos los archivos, recursivo'], ['grep -v error archivo', 'Al revés: líneas que NO lo contienen'], ['grep -c error archivo', 'Solo cuenta cuántas hay'], ['grep -l error *.log', 'Solo los nombres de archivo con coincidencias'], ['grep -w red archivo', 'La palabra exacta, no «redondo»']] },
          { c: 'user@mentor:~$ grep -n ERROR registros/app.log\n2:ERROR fallo al conectar\n4:ERROR timeout' },
        ],
        retos: [
          {
            id: 'r6-grep',
            enunciado: 'Encuentra en `registros/app.log` todas las líneas que contengan la palabra ERROR.',
            snapshot: 'busqueda',
            xp: 35,
            pistas: ['`grep patrón archivo`.', '`grep ERROR registros/app.log`'],
            solucion: 'grep ERROR registros/app.log',
            check: (c) => k.salidaTiene(c, 'fallo al conectar', 'timeout') && !k.salidaTiene(c, 'arranque ok'),
          },
          {
            id: 'r6-grep-n',
            enunciado: 'Busca las líneas con ERROR en `registros/app.log`, pero mostrando el número de línea de cada una.',
            snapshot: 'busqueda',
            xp: 40,
            pistas: ['La opción de numerar líneas es `-n`.', '`grep -n ERROR registros/app.log`'],
            solucion: 'grep -n ERROR registros/app.log',
            check: (c) => /^\s*2:/m.test(k.ultimaSalida(c)) && k.salidaTiene(c, 'timeout'),
          },
          {
            id: 'r6-grep-r',
            enunciado: 'Busca la palabra TODO dentro de todos los archivos de la carpeta `proyectos`, entrando en las subcarpetas.',
            snapshot: 'busqueda',
            xp: 50,
            pistas: ['La opción recursiva de grep es `-r`.', '`grep -r TODO proyectos`'],
            solucion: 'grep -r TODO proyectos',
            check: (c) => k.salidaTiene(c, 'cambiar el título') && k.salidaTiene(c, 'añadir logs'),
            diagnostico: [
              { cuando: (c) => k.salidaTiene(c, 'Is a directory'), titulo: 'grep necesita la opción recursiva', texto: 'Le has dado una carpeta pero sin `-r`, así que no sabe qué hacer con ella. Usa `grep -r TODO proyectos`.' },
            ],
          },
          {
            id: 'r6-grep-c',
            enunciado: 'Cuenta cuántas peticiones a `/api/orders` hay en `registros/acceso.log`.',
            snapshot: 'busqueda',
            xp: 45,
            pistas: ['La opción de contar es `-c`.', '`grep -c "/api/orders" registros/acceso.log`'],
            solucion: 'grep -c "/api/orders" registros/acceso.log',
            check: (c) => k.ultimaSalida(c).trim() === '2',
          },
          {
            id: 'r6-grep-v',
            enunciado: 'Muestra las líneas de `registros/app.log` que NO son de tipo INFO.',
            snapshot: 'busqueda',
            xp: 45,
            pistas: ['La opción que invierte la búsqueda es `-v`.', '`grep -v INFO registros/app.log`'],
            solucion: 'grep -v INFO registros/app.log',
            check: (c) => k.salidaTiene(c, 'ERROR') && !k.salidaTiene(c, 'arranque ok'),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué hace `find . -type d -name "log*"`?', opciones: ['Busca archivos que empiecen por log', 'Busca carpetas que empiecen por log', 'Borra las carpetas log', 'Busca en /log'], correcta: 1, explicacion: '`-type d` restringe a directorios y `-name "log*"` a los que empiezan por log.' },
      { pregunta: '¿Para qué sirve `grep -v`?', opciones: ['Modo detallado', 'Mostrar la versión', 'Invertir: líneas que NO coinciden', 'Buscar solo palabras'], correcta: 2, explicacion: '`-v` invierte el filtro. Muy útil para descartar ruido: `grep -v INFO registro`.' },
      { pregunta: 'Quieres buscar «error» sin importar mayúsculas. ¿Qué opción usas?', opciones: ['-r', '-i', '-n', '-c'], correcta: 1, explicacion: '`-i` de *ignore case*. Encuentra error, Error y ERROR.' },
      { pregunta: '¿Por qué se pone `"*.txt"` entre comillas en find?', opciones: ['Por estética', 'Para que la shell no expanda el asterisco antes', 'Porque find lo exige', 'Para buscar más rápido'], correcta: 1, explicacion: 'Sin comillas, la shell sustituye el `*` por los archivos de la carpeta actual y find recibe algo distinto de lo que querías.' },
      { pregunta: '¿Qué hace `grep -r TODO .`?', opciones: ['Busca TODO solo en la carpeta actual', 'Busca TODO en todos los archivos, entrando en subcarpetas', 'Borra las líneas TODO', 'Cuenta los TODO'], correcta: 1, explicacion: '`-r` recorre el árbol completo desde el punto indicado.' },
    ],
  },

  // ======================================================================
  {
    id: 'pipes',
    n: 7,
    nombre: 'Pipes y filtros',
    resumen: 'Encadenar comandos: donde Linux se vuelve potente',
    comandos: ['grep', 'sort', 'uniq', 'cut', 'wc', 'head', 'tail', 'tee', 'awk', 'sed', 'tr'],
    lecciones: [
      {
        id: 'pipe',
        titulo: 'El pipe |',
        subtitulo: 'La salida de uno es la entrada del siguiente',
        cuerpo: [
          { t: 'La idea que lo cambia todo', p: 'Cada comando de Linux hace una cosa pequeña. El `|` conecta la salida de uno con la entrada del siguiente, y encadenándolos resuelves problemas que ningún comando resuelve solo.' },
          { c: 'cat acceso.log | grep 404 | wc -l\n     │              │           │\n     │              │           └─ cuenta las líneas\n     │              └───────────── deja solo las de 404\n     └──────────────────────────── vuelca el archivo' },
          { t: 'Se lee de izquierda a derecha', p: 'Cada tramo recibe lo que produjo el anterior. Construye la cadena por partes: ejecuta el primer tramo, mira la salida, y añade el siguiente.' },
          { n: 'Truco para depurar una cadena larga: quita el último tramo y ejecútala. Si la salida intermedia no es la que esperabas, el problema está antes.' },
        ],
        retos: [
          {
            id: 'r7-pipe-wc',
            enunciado: 'Cuenta cuántas líneas de `registros/acceso.log` devolvieron un error 404, encadenando grep y wc.',
            snapshot: 'datos',
            xp: 50,
            pistas: ['Primero filtra con `grep 404` y luego cuenta con `wc -l`.', '`grep 404 registros/acceso.log | wc -l`'],
            solucion: 'grep 404 registros/acceso.log | wc -l',
            check: (c) => k.ultimoUsó(c, /\|/) && k.ultimaSalida(c).trim() === '3',
            diagnostico: [
              { cuando: (c) => !k.ultimoUsó(c, /\|/), titulo: 'Falta encadenar', texto: 'El reto pide unir dos comandos con `|`: primero filtras las líneas y luego las cuentas.' },
            ],
          },
          {
            id: 'r7-pipe-head',
            enunciado: 'Muestra solo las 3 primeras líneas del archivo `ventas.csv` usando cat y head unidos por un pipe.',
            snapshot: 'datos',
            xp: 40,
            pistas: ['`cat archivo | head -n 3`', 'Es exactamente eso: `cat ventas.csv | head -n 3`'],
            solucion: 'cat ventas.csv | head -n 3',
            check: (c) => k.ultimoUsó(c, /\|/) && k.salidaLineas(c).length === 3 && k.salidaTiene(c, 'fecha,producto'),
          },
        ],
      },
      {
        id: 'sort-uniq',
        titulo: 'sort y uniq',
        subtitulo: 'Ordenar y quitar repetidos',
        cuerpo: [
          { t: 'sort ordena', p: 'Por defecto alfabéticamente. Con `-n` ordena como números (importante: alfabéticamente el 10 va antes que el 9).' },
          { f: [['sort archivo', 'Orden alfabético'], ['sort -n archivo', 'Orden numérico'], ['sort -r archivo', 'Al revés'], ['sort -u archivo', 'Ordena y quita duplicados'], ['sort -k2 archivo', 'Ordena por la segunda columna']] },
          { t: 'uniq necesita orden previo', p: '`uniq` solo elimina líneas repetidas que están **seguidas**. Por eso casi siempre va detrás de un `sort`: `sort archivo | uniq`.' },
          { f: [['uniq', 'Colapsa repetidos consecutivos'], ['uniq -c', 'Cuenta cuántas veces se repite cada uno'], ['uniq -d', 'Solo los que están repetidos']] },
          { c: 'user@mentor:~$ sort palabras.txt | uniq -c | sort -rn\n      3 pera\n      2 manzana\n      1 uva\n      1 kiwi' },
        ],
        retos: [
          {
            id: 'r7-sort',
            enunciado: 'Ordena numéricamente el contenido de `numeros.txt`, de menor a mayor.',
            snapshot: 'datos',
            xp: 40,
            pistas: ['Sin `-n`, sort ordena como texto y el 108 quedaría antes que el 3.', '`sort -n numeros.txt`'],
            solucion: 'sort -n numeros.txt',
            check: (c) => {
              const l = k.salidaLineas(c).map((x) => x.trim());
              return l[0] === '3' && l[l.length - 1] === '108';
            },
            diagnostico: [
              { cuando: (c) => { const l = k.salidaLineas(c).map((x) => x.trim()); return l[0] === '108' || l[1] === '108'; }, titulo: 'Ordenó como texto, no como números', texto: 'Alfabéticamente «108» va antes que «3» porque compara carácter a carácter. Añade `-n` para que compare valores numéricos.' },
            ],
          },
          {
            id: 'r7-uniq',
            enunciado: 'Averigua cuántas veces aparece cada palabra en `palabras.txt`, sin repetidos y con su cuenta delante.',
            snapshot: 'datos',
            xp: 60,
            pistas: ['`uniq` solo agrupa líneas iguales que estén seguidas, así que ordena antes.', '`sort palabras.txt | uniq -c`'],
            solucion: 'sort palabras.txt | uniq -c',
            check: (c) => /3\s+pera/.test(k.ultimaSalida(c)) && /2\s+manzana/.test(k.ultimaSalida(c)),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /uniq/) && !k.ultimoUsó(c, /sort/), titulo: 'Falta ordenar antes', texto: '`uniq` solo colapsa repeticiones consecutivas. Si las «pera» están separadas en el archivo, no las agrupa. Encadena `sort archivo | uniq -c`.' },
            ],
          },
          {
            id: 'r7-top',
            enunciado: 'Saca el ranking de palabras de `palabras.txt`: la más repetida arriba.',
            snapshot: 'datos',
            xp: 70,
            pistas: ['Ya sabes contar con `sort | uniq -c`. Ahora ordena ese resultado por número, al revés.', '`sort palabras.txt | uniq -c | sort -rn`'],
            solucion: 'sort palabras.txt | uniq -c | sort -rn',
            check: (c) => {
              const l = k.salidaLineas(c);
              return l.length >= 2 && /pera/.test(l[0]) && /manzana/.test(l[1]);
            },
          },
        ],
      },
      {
        id: 'cut',
        titulo: 'cut: quedarse con columnas',
        subtitulo: 'Extraer campos de datos separados',
        cuerpo: [
          { t: 'Para archivos con separador', p: 'CSV separados por comas, `/etc/passwd` separado por dos puntos, salidas separadas por tabuladores. `cut` se queda con las columnas que le pidas.' },
          { f: [['cut -d: -f1 /etc/passwd', 'Campo 1, separando por :'], ['cut -d, -f2,4 datos.csv', 'Campos 2 y 4, separando por coma'], ['cut -d, -f2-4 datos.csv', 'Del 2 al 4'], ['cut -c1-10 archivo', 'Por caracteres, no por campos']] },
          { c: 'user@mentor:~$ cut -d: -f1 /etc/passwd | head -3\nroot\ndaemon\nwww-data' },
        ],
        retos: [
          {
            id: 'r7-cut',
            enunciado: 'Saca la lista de nombres de usuario del sistema: el primer campo de `/etc/passwd`, que usa `:` como separador.',
            snapshot: 'datos',
            xp: 50,
            pistas: ['El separador se indica con `-d` y el campo con `-f`.', '`cut -d: -f1 /etc/passwd`'],
            solucion: 'cut -d: -f1 /etc/passwd',
            check: (c) => k.salidaTiene(c, 'root') && k.salidaTiene(c, 'ana') && !k.salidaTiene(c, '/bin/bash'),
            diagnostico: [
              { cuando: (c) => k.salidaTiene(c, '/bin/bash'), titulo: 'Sigues viendo la línea entera', texto: 'El separador por defecto de `cut` es el tabulador, y este archivo usa `:`. Indícalo con `-d:`.' },
            ],
          },
          {
            id: 'r7-cut-csv',
            enunciado: 'Del archivo `ventas.csv`, extrae solo la columna del producto (la segunda).',
            snapshot: 'datos',
            xp: 50,
            pistas: ['El separador de un CSV es la coma.', '`cut -d, -f2 ventas.csv`'],
            solucion: 'cut -d, -f2 ventas.csv',
            check: (c) => k.salidaTiene(c, 'producto') && k.salidaTiene(c, 'teclado') && !k.salidaTiene(c, 'norte'),
          },
          {
            id: 'r7-cut-pipe',
            enunciado: 'Lista los productos distintos que aparecen en `ventas.csv`, sin repetir ninguno.',
            snapshot: 'datos',
            xp: 70,
            pistas: ['Extrae la columna con `cut`, ordénala y quita duplicados.', '`cut -d, -f2 ventas.csv | sort -u`'],
            solucion: 'cut -d, -f2 ventas.csv | sort -u',
            check: (c) => {
              const l = k.salidaLineas(c).map((x) => x.trim());
              return l.includes('teclado') && l.includes('monitor') && l.includes('raton') && l.filter((x) => x === 'teclado').length === 1;
            },
          },
        ],
      },
      {
        id: 'awk-sed',
        titulo: 'awk y sed',
        subtitulo: 'Los dos pesos pesados del procesado de texto',
        cuerpo: [
          { t: 'awk trabaja por columnas', p: 'Parte cada línea en campos (`$1`, `$2`…) y te deja imprimir, filtrar y calcular. Es como un mini lenguaje de programación para texto tabulado.' },
          { f: [["awk '{print $1}' archivo", 'Imprime la primera columna'], ["awk '{print $1, $3}' archivo", 'Varias columnas'], ["awk -F, '{print $2}' datos.csv", 'Cambia el separador a coma'], ["awk '$3 > 100' archivo", 'Solo las líneas donde la columna 3 pase de 100'], ["awk '{s+=$4} END {print s}'", 'Suma una columna entera']] },
          { t: 'sed sustituye', p: 'Su uso más común es buscar y reemplazar: `sed s/viejo/nuevo/g`. La `g` al final significa «todas las apariciones de la línea», no solo la primera.' },
          { f: [["sed 's/error/ERROR/g' log", 'Sustituye en la salida'], ["sed -i 's/a/b/g' archivo", 'Modifica el archivo directamente'], ["sed '3d' archivo", 'Borra la línea 3'], ["sed -n '2,5p' archivo", 'Muestra solo las líneas 2 a 5']] },
          { n: '`sed -i` cambia el archivo sin preguntar y sin copia de seguridad. Prueba siempre sin `-i` primero, y cuando la salida sea la correcta, añádelo.' },
        ],
        retos: [
          {
            id: 'r7-awk',
            enunciado: 'Del archivo `usuarios.txt` (campos separados por `:`), imprime solo los nombres, que están en el primer campo.',
            snapshot: 'datos',
            xp: 55,
            pistas: ['El separador se cambia con `-F` y el primer campo es `$1`.', `awk -F: '{print $1}' usuarios.txt`],
            solucion: "awk -F: '{print $1}' usuarios.txt",
            check: (c) => k.salidaTiene(c, 'ana') && k.salidaTiene(c, 'luis') && !k.salidaTiene(c, 'madrid'),
          },
          {
            id: 'r7-awk-suma',
            enunciado: 'Suma el total de unidades vendidas en `ventas.csv` (la cuarta columna, separada por comas).',
            snapshot: 'datos',
            xp: 75,
            pistas: ['Acumula en una variable y muestra el total al final con el bloque `END`.', `awk -F, 'NR>1 {s+=$4} END {print s}' ventas.csv`],
            solucion: "awk -F, 'NR>1 {s+=$4} END {print s}' ventas.csv",
            check: (c) => k.ultimaSalida(c).includes('106'),
            diagnostico: [
              { cuando: (c) => k.ultimaSalida(c).trim() === '0', titulo: 'La suma dio cero', texto: 'Probablemente falta indicar el separador. Un CSV usa comas: añade `-F,` para que `$4` sea realmente la cuarta columna.' },
            ],
          },
          {
            id: 'r7-sed',
            enunciado: 'Muestra el contenido de `usuarios.txt` cambiando todos los `:` por ` - ` (espacio, guion, espacio). No modifiques el archivo.',
            snapshot: 'datos',
            xp: 60,
            pistas: ['La sustitución de sed es `s/lo-viejo/lo-nuevo/g`.', `sed 's/:/ - /g' usuarios.txt`],
            solucion: "sed 's/:/ - /g' usuarios.txt",
            check: (c) => k.salidaTiene(c, 'ana - 28 - madrid'),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué hace el símbolo `|`?', opciones: ['Guarda en un archivo', 'Conecta la salida de un comando con la entrada del siguiente', 'Ejecuta dos comandos a la vez', 'Comenta la línea'], correcta: 1, explicacion: 'Es la tubería: encadena comandos pasando el texto de uno a otro.' },
      { pregunta: '¿Por qué `uniq` casi siempre va después de `sort`?', opciones: ['Por costumbre', 'Porque uniq solo agrupa repetidos consecutivos', 'Porque sort es más rápido', 'No es necesario'], correcta: 1, explicacion: 'Si las líneas iguales están separadas, `uniq` no las ve como repetidas. Ordenar primero las junta.' },
      { pregunta: '¿Qué imprime `awk \'{print $2}\'`?', opciones: ['La segunda línea', 'La segunda columna', 'Dos columnas', 'El segundo archivo'], correcta: 1, explicacion: '`$2` es el segundo campo de cada línea. `$0` sería la línea entera.' },
      { pregunta: '¿Qué hace `sort -n` que no hace `sort`?', opciones: ['Ordena al revés', 'Ordena por valor numérico', 'Elimina duplicados', 'Ignora mayúsculas'], correcta: 1, explicacion: 'Sin `-n` compara como texto, y así «10» queda antes que «9».' },
      { pregunta: '¿Qué tiene de peligroso `sed -i`?', opciones: ['Es muy lento', 'Modifica el archivo original sin copia de seguridad', 'Solo funciona como root', 'Borra el archivo'], correcta: 1, explicacion: 'Escribe los cambios en el propio archivo. Conviene probar sin `-i` antes de aplicarlo.' },
    ],
  },

  // ======================================================================
  {
    id: 'procesos',
    n: 8,
    nombre: 'Procesos y recursos',
    resumen: 'Ver qué se está ejecutando y por qué va lento',
    comandos: ['ps', 'top', 'kill', 'killall', 'pgrep', 'free', 'df', 'du', 'uptime'],
    lecciones: [
      {
        id: 'ps',
        titulo: 'ps: qué se está ejecutando',
        subtitulo: 'La foto fija del sistema',
        cuerpo: [
          { t: 'Cada programa es un proceso', p: 'Todo lo que corre tiene un número, el **PID**, un dueño y un consumo. `ps` los lista.' },
          { f: [['ps', 'Solo tus procesos de esta terminal'], ['ps aux', 'Todos los del sistema, con detalle'], ['ps aux | grep nginx', 'Buscar un proceso concreto'], ['pgrep nginx', 'Solo los PID que coinciden']] },
          { t: 'Leer las columnas de ps aux', p: 'USER quién lo ejecuta, PID su número, %CPU y %MEM lo que consume, STAT su estado (R corriendo, S durmiendo, Z zombi) y COMMAND qué es.' },
          { c: 'user@mentor:~$ ps aux | grep render\nuser  1533  94.6  2.8  288120  86400 ?  R  10:20  8:41  /opt/render/render-worker' },
        ],
        retos: [
          {
            id: 'r8-ps',
            enunciado: 'Lista todos los procesos del sistema con detalle.',
            snapshot: 'diagnostico',
            xp: 30,
            pistas: ['La combinación clásica son tres letras juntas después de ps.', '`ps aux`'],
            solucion: 'ps aux',
            check: (c) => k.salidaTiene(c, 'PID', 'nginx', 'postgres'),
          },
          {
            id: 'r8-ps-grep',
            enunciado: 'Encuentra el proceso que tiene que ver con `render` filtrando la salida de ps.',
            snapshot: 'diagnostico',
            xp: 45,
            pistas: ['Encadena `ps aux` con un `grep`.', '`ps aux | grep render`'],
            solucion: 'ps aux | grep render',
            check: (c) => k.ultimoUsó(c, /\|/) && k.salidaTiene(c, 'render-worker') && !k.salidaTiene(c, 'postgres'),
          },
        ],
      },
      {
        id: 'top',
        titulo: 'top: el monitor en vivo',
        subtitulo: 'Quién se está comiendo la máquina',
        cuerpo: [
          { t: 'Actualiza solo', p: '`top` muestra los procesos ordenados por consumo de CPU y se refresca cada pocos segundos. Es lo primero que se abre cuando un servidor va lento.' },
          { t: 'Cómo leer la cabecera', p: '**load average** son tres números: la carga media del último minuto, de los 5 y de los 15. Como referencia, en una máquina de 4 núcleos un valor por encima de 4 significa que hay cola.' },
          { f: [['top', 'Monitor interactivo'], ['htop', 'Igual pero más bonito (hay que instalarlo)'], ['uptime', 'Solo la carga media, sin entrar'], ['free -h', 'Memoria usada y libre'], ['df -h', 'Espacio en disco por partición'], ['du -sh carpeta', 'Cuánto ocupa una carpeta']] },
          { n: 'Confusión clásica: en `free`, la memoria «usada» incluye la caché, que el sistema libera cuando hace falta. Mira la columna **available**, no la «free».' },
        ],
        retos: [
          {
            id: 'r8-top',
            enunciado: 'Abre el monitor de procesos para ver quién consume más CPU.',
            snapshot: 'diagnostico',
            xp: 35,
            pistas: ['Tres letras.', '`top`'],
            solucion: 'top',
            check: (c) => k.salidaTiene(c, 'load average', '%Cpu'),
          },
          {
            id: 'r8-free',
            enunciado: 'Comprueba cuánta memoria RAM está usando el sistema, en unidades legibles.',
            snapshot: 'diagnostico',
            xp: 40,
            pistas: ['El comando es `free` y la opción de legible es `-h`.', '`free -h`'],
            solucion: 'free -h',
            check: (c) => k.salidaTiene(c, 'Mem:') && k.ultimoUsó(c, /-h/),
          },
          {
            id: 'r8-df',
            enunciado: 'Averigua cuánto espacio libre queda en el disco, con tamaños legibles.',
            snapshot: 'diagnostico',
            xp: 40,
            pistas: ['*disk free*, y otra vez `-h`.', '`df -h`'],
            solucion: 'df -h',
            check: (c) => k.salidaTiene(c, 'Filesystem', '/dev/sda1') && k.ultimoUsó(c, /-h/),
          },
        ],
      },
      {
        id: 'kill',
        titulo: 'kill: terminar procesos',
        subtitulo: 'Pedir por favor antes de forzar',
        cuerpo: [
          { t: 'Se envían señales, no golpes', p: '`kill` manda una señal al proceso. La de por defecto (15, TERM) le pide que se cierre ordenadamente: guarda lo que tenga y sale.' },
          { f: [['kill PID', 'Pide que termine (señal 15)'], ['kill -9 PID', 'Lo mata sin contemplaciones'], ['killall nombre', 'Termina todos los que se llamen así'], ['pkill nombre', 'Igual, por patrón']] },
          { t: 'Por qué el -9 es el último recurso', p: 'Con `-9` el proceso no puede reaccionar: no guarda nada, no cierra archivos, no limpia. Puede dejar datos corruptos. Prueba siempre primero sin él.' },
          { n: 'Solo puedes matar tus propios procesos. Para los de otro usuario o del sistema hace falta `sudo`.' },
        ],
        retos: [
          {
            id: 'r8-kill',
            enunciado: 'El proceso `render-worker` (PID 1533) está consumiendo el 94% de la CPU. Termínalo de forma ordenada.',
            snapshot: 'diagnostico',
            xp: 60,
            pistas: ['Primero localiza su PID con `ps aux | grep render`.', 'Luego mándale la señal por defecto: `kill 1533`'],
            solucion: 'kill 1533',
            check: (c) => {
              const p = c.shell.state.processes;
              return !!p && !p.some((x) => x.pid === 1533);
            },
            diagnostico: [
              { cuando: (c) => k.salidaTiene(c, 'No such process'), titulo: 'Ese PID no existe', texto: 'Comprueba el número real con `ps aux | grep render`. El PID es la segunda columna.' },
              { cuando: (c) => k.ultimoUsó(c, /kill\s+render/), titulo: 'kill necesita el número, no el nombre', texto: '`kill` espera un PID. Si quieres usar el nombre, el comando es `killall render-worker`.' },
            ],
          },
          {
            id: 'r8-du',
            enunciado: 'Averigua cuánto ocupa en total tu carpeta personal, con un único número legible.',
            snapshot: 'diagnostico',
            xp: 50,
            pistas: ['`du` mide carpetas. `-s` da solo el total y `-h` lo hace legible.', '`du -sh .`'],
            solucion: 'du -sh .',
            check: (c) => k.ultimoUsó(c, /du\b.*-\w*s/) && k.salidaLineas(c).length === 1,
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué es un PID?', opciones: ['El nombre del programa', 'El número que identifica al proceso', 'El usuario que lo lanzó', 'La prioridad'], correcta: 1, explicacion: '*Process ID*: el número único con el que el sistema identifica cada proceso.' },
      { pregunta: '¿Por qué se recomienda `kill` antes que `kill -9`?', opciones: ['Es más rápido', 'Permite al proceso cerrar ordenadamente', '-9 no funciona siempre', 'No hay diferencia'], correcta: 1, explicacion: 'La señal por defecto le da la oportunidad de guardar y limpiar. `-9` lo corta en seco y puede dejar datos a medias.' },
      { pregunta: 'En `free -h`, ¿qué columna indica la memoria realmente disponible?', opciones: ['free', 'used', 'available', 'shared'], correcta: 2, explicacion: '«free» excluye la caché, que el sistema puede liberar. «available» es la cifra útil.' },
      { pregunta: '¿Qué muestra `df -h`?', opciones: ['Los procesos', 'La memoria RAM', 'El espacio en disco por partición', 'Los usuarios conectados'], correcta: 2, explicacion: '*disk free*. Para saber qué carpeta ocupa mucho se usa `du`.' },
      { pregunta: 'El load average marca 8.0 en una máquina de 2 núcleos. ¿Qué significa?', opciones: ['Todo va bien', 'Hay mucha más cola de trabajo que capacidad', 'Faltan 8 GB de RAM', 'Hay 8 usuarios'], correcta: 1, explicacion: 'Como referencia, la carga se compara con el número de núcleos. 8 en 2 núcleos indica saturación clara.' },
    ],
  },
];
