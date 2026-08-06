// Módulos 1–4: primeros pasos, navegación, archivos y texto.
import * as k from './checks.js';

export const MODULOS_1 = [
  // ======================================================================
  {
    id: 'inicio',
    n: 1,
    nombre: 'Primeros pasos',
    resumen: 'Qué es Linux, qué es la shell y cómo hablarle',
    comandos: ['echo', 'whoami', 'date', 'uname', 'man', 'help', 'clear', 'history'],
    lecciones: [
      {
        id: 'que-es',
        titulo: 'Qué es Linux',
        subtitulo: 'Y por qué está en todas partes sin que lo veas',
        cuerpo: [
          { t: 'Un sistema operativo, como Windows o macOS', p: 'Linux hace el mismo trabajo: gestiona el hardware, los archivos y los programas. La diferencia es que es libre, se puede modificar y se puede ejecutar sin interfaz gráfica, solo con texto.' },
          { t: 'Dónde está', p: 'En la mayoría de servidores web del mundo, en Android, en routers, en el coche, en la Raspberry Pi y en la nube. Si trabajas con servidores, tarde o temprano trabajas con Linux.' },
          { t: 'Distribuciones', p: 'Debian, Ubuntu, Fedora, Arch, Alpine… todas son Linux por dentro. Cambian el instalador, las herramientas de paquetes y las versiones, pero los comandos que aprendas aquí funcionan en todas.' },
          { n: 'En este curso trabajas sobre un Linux simulado dentro de tu móvil. Los comandos, las salidas y los errores son los reales, pero no puedes romper nada.' },
        ],
        retos: [],
      },
      {
        id: 'shell',
        titulo: 'La shell y el prompt',
        subtitulo: 'La línea donde escribes es un programa',
        cuerpo: [
          { t: 'Qué es la shell', p: 'Es el programa que lee lo que escribes, lo interpreta y ejecuta el comando correspondiente. La más común se llama **bash**. La terminal es solo la ventana; la shell es quien trabaja.' },
          { t: 'Leer el prompt', p: 'Antes de tu cursor hay información útil. Aprende a leerla y siempre sabrás dónde estás.' },
          { c: 'user@mentor:~$\n│    │      │ │\n│    │      │ └─ $ = usuario normal, # = root\n│    │      └─── carpeta actual (~ es tu carpeta personal)\n│    └────────── nombre de la máquina\n└─────────────── tu usuario' },
          { t: 'La forma de un comando', p: 'Casi todo sigue el mismo patrón: el nombre del programa, luego las opciones (empiezan por guion) y luego sobre qué actuar.' },
          { c: 'ls -l /etc\n│  │  │\n│  │  └─ el argumento: sobre qué actuar\n│  └──── la opción: cómo hacerlo\n└─────── el comando: qué hacer' },
        ],
        retos: [
          {
            id: 'r1-echo',
            enunciado: 'Usa `echo` para que la terminal escriba exactamente: Hola Linux',
            snapshot: 'inicio',
            xp: 20,
            pistas: ['`echo` repite en pantalla el texto que le des.', 'Se escribe `echo` y detrás el texto: `echo Hola Linux`'],
            solucion: 'echo Hola Linux',
            check: (c) => k.salidaTiene(c, 'Hola Linux'),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /^echo/) && !k.salidaTiene(c, 'Hola'), titulo: 'Usaste echo, pero el texto no coincide', texto: 'Fíjate en las mayúsculas: tiene que ser exactamente `Hola Linux`, con H y L mayúsculas.' },
            ],
          },
          {
            id: 'r1-whoami',
            enunciado: 'Averigua con qué usuario estás trabajando ahora mismo.',
            snapshot: 'inicio',
            xp: 20,
            pistas: ['Hay un comando que se llama literalmente «quién soy» en inglés.', 'Es `whoami`, todo junto y en minúsculas.'],
            solucion: 'whoami',
            check: (c) => k.ultimoUsó(c, /^whoami\b/) && k.salidaTiene(c, 'user'),
          },
        ],
      },
      {
        id: 'ayuda',
        titulo: 'Pedir ayuda: man y --help',
        subtitulo: 'Nadie memoriza todas las opciones',
        cuerpo: [
          { t: 'El manual', p: 'Cada comando trae su propio manual. `man ls` abre la documentación completa de `ls`. Es densa, pero es la fuente de verdad.' },
          { t: 'La versión rápida', p: 'Casi todos los comandos aceptan `--help`, que imprime un resumen corto de las opciones. Es lo que usarás el 90% de las veces.' },
          { f: [['man comando', 'Manual completo, con todos los detalles'], ['comando --help', 'Resumen rápido de las opciones'], ['type comando', 'Te dice si es un programa o un alias'], ['which comando', 'Dónde está instalado el programa']] },
          { n: 'Perderse es normal. Un buen usuario de Linux no es el que se lo sabe todo, es el que sabe buscarlo rápido.' },
        ],
        retos: [
          {
            id: 'r1-which',
            enunciado: 'Descubre en qué ruta del sistema está instalado el programa `ls`.',
            snapshot: 'inicio',
            xp: 25,
            pistas: ['El comando que responde «dónde está» empieza por w.', 'Es `which ls`.'],
            solucion: 'which ls',
            check: (c) => k.salidaTiene(c, '/usr/bin/ls'),
          },
        ],
      },
      {
        id: 'contexto',
        titulo: 'Tu sesión: usuario, máquina y fecha',
        subtitulo: 'Los cuatro comandos que ejecutas al entrar a un servidor',
        cuerpo: [
          { t: 'Orientarse al llegar', p: 'Cuando entras a una máquina que no conoces, lo primero es situarte: quién eres, dónde estás, qué sistema es y desde cuándo funciona.' },
          { f: [['whoami', 'Con qué usuario estás'], ['hostname', 'Cómo se llama esta máquina'], ['uname -a', 'Kernel, versión y arquitectura'], ['uptime', 'Cuánto lleva encendida y su carga'], ['date', 'Fecha y hora del sistema'], ['id', 'Tu identificador y a qué grupos perteneces']] },
          { c: 'user@mentor:~$ uname -a\nLinux mentor-box 6.6.15-amd64 #1 SMP Debian x86_64 GNU/Linux\n\nuser@mentor:~$ uptime\n 10:31:44 up  1:31,  1 user,  load average: 1.42, 0.98, 0.61' },
        ],
        retos: [
          {
            id: 'r1-uname',
            enunciado: 'Muestra toda la información del sistema: kernel, versión y arquitectura, en una sola línea.',
            snapshot: 'inicio',
            xp: 25,
            pistas: ['El comando es `uname`, pero sin opciones solo dice «Linux».', 'La opción que lo muestra todo es `-a` (de *all*): `uname -a`'],
            solucion: 'uname -a',
            check: (c) => k.salidaTiene(c, 'Linux mentor-box', 'x86_64'),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /^uname\s*$/), titulo: 'Te falta la opción', texto: '`uname` a secas solo imprime el nombre del kernel. Añade `-a` para verlo todo.' },
            ],
          },
          {
            id: 'r1-id',
            enunciado: 'Comprueba a qué grupos pertenece tu usuario.',
            snapshot: 'inicio',
            xp: 25,
            pistas: ['Son dos letras.', 'El comando es `id`.'],
            solucion: 'id',
            check: (c) => k.salidaTiene(c, 'uid=', 'groups='),
          },
        ],
      },
      {
        id: 'historial',
        titulo: 'Historial y limpieza',
        subtitulo: 'No vuelvas a escribir lo mismo dos veces',
        cuerpo: [
          { t: 'Todo queda guardado', p: 'La shell recuerda los comandos que escribes. `history` los lista numerados. Con la flecha ↑ recuperas el anterior — en la app tienes ese botón en la barra de teclas.' },
          { t: 'Limpiar la pantalla', p: '`clear` borra lo que se ve. No borra nada del sistema ni del historial: solo deja la pantalla limpia.' },
          { f: [['history', 'Lista los comandos que has escrito'], ['history 5', 'Solo los 5 últimos'], ['clear', 'Limpia la pantalla'], ['↑ ↓', 'Recorrer comandos anteriores']] },
        ],
        retos: [
          {
            id: 'r1-history',
            enunciado: 'Muestra el historial de comandos que llevas escritos en esta sesión.',
            snapshot: 'inicio',
            xp: 20,
            pistas: ['Se llama igual que en inglés.', 'Es `history`.'],
            solucion: 'history',
            check: (c) => k.ultimoUsó(c, /^history\b/) && k.salidaLineas(c).length > 0,
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué indica el símbolo `$` al final del prompt?', opciones: ['Que eres un usuario normal', 'Que eres root', 'Que hay un error', 'Que la shell está ocupada'], correcta: 0, explicacion: '`$` es usuario normal y `#` es root. Ver una almohadilla significa que tienes permisos totales: cuidado con lo que escribes.' },
      { pregunta: '¿Cuál es el orden correcto de un comando?', opciones: ['argumento, opción, comando', 'comando, opción, argumento', 'opción, comando, argumento', 'da igual el orden'], correcta: 1, explicacion: 'Primero qué hacer (el comando), luego cómo (las opciones con guion) y por último sobre qué (los argumentos): `ls -l /etc`.' },
      { pregunta: '¿Qué hace `clear`?', opciones: ['Borra los archivos de la carpeta', 'Borra el historial', 'Limpia la pantalla', 'Cierra la sesión'], correcta: 2, explicacion: 'Solo limpia lo que se ve. Ni los archivos ni el historial se tocan.' },
      { pregunta: 'Quieres ver rápidamente las opciones de un comando. ¿Qué usas?', opciones: ['comando --help', 'comando -x', 'help comando', 'info comando'], correcta: 0, explicacion: '`--help` da el resumen rápido; `man comando` da el manual completo.' },
      { pregunta: '¿Qué significa `~` en el prompt?', opciones: ['La raíz del sistema', 'Tu carpeta personal', 'La carpeta anterior', 'Una carpeta temporal'], correcta: 1, explicacion: '`~` es un atajo para tu carpeta personal, normalmente `/home/tuusuario`.' },
    ],
  },

  // ======================================================================
  {
    id: 'navegacion',
    n: 2,
    nombre: 'Navegación',
    resumen: 'Moverte por el sistema sin perderte',
    comandos: ['pwd', 'ls', 'cd', 'tree', 'file'],
    lecciones: [
      {
        id: 'arbol',
        titulo: 'El árbol de directorios',
        subtitulo: 'En Linux todo cuelga de una sola raíz',
        cuerpo: [
          { t: 'No hay unidades C: ni D:', p: 'Todo el sistema es un único árbol que empieza en `/`, la raíz. Los discos, los USB y hasta los dispositivos aparecen como carpetas dentro de ese árbol.' },
          { t: 'Las carpetas que importan', p: 'No necesitas memorizarlas todas, pero reconocerlas te ahorra mucho tiempo.' },
          { f: [['/home', 'Las carpetas personales de los usuarios'], ['/etc', 'Los archivos de configuración del sistema'], ['/var/log', 'Los registros: aquí se investigan los problemas'], ['/usr/bin', 'Los programas instalados'], ['/tmp', 'Archivos temporales, se borran al reiniciar'], ['/root', 'La carpeta personal del administrador']] },
          { c: '/\n├── etc/      configuración\n├── home/\n│   └── user/  ← tú estás aquí\n├── usr/\n│   └── bin/   programas\n└── var/\n    └── log/   registros' },
        ],
        retos: [
          {
            id: 'r2-pwd',
            enunciado: 'Comprueba en qué carpeta te encuentras ahora mismo.',
            snapshot: 'inicio',
            xp: 20,
            pistas: ['Son tres letras: *print working directory*.', 'Es `pwd`.'],
            solucion: 'pwd',
            check: (c) => k.salidaTiene(c, '/home/user'),
          },
        ],
      },
      {
        id: 'ls',
        titulo: 'ls: ver qué hay',
        subtitulo: 'El comando que más veces vas a escribir en tu vida',
        cuerpo: [
          { t: 'Lo básico', p: '`ls` lista el contenido de la carpeta actual. Con opciones te cuenta mucho más: tamaños, permisos, fechas y archivos ocultos.' },
          { f: [['ls', 'Los nombres, sin más'], ['ls -l', 'Formato largo: permisos, dueño, tamaño y fecha'], ['ls -a', 'Incluye los ocultos (los que empiezan por punto)'], ['ls -h', 'Tamaños legibles (4.0K en vez de 4096)'], ['ls -t', 'Ordena por fecha, lo más nuevo primero'], ['ls -S', 'Ordena por tamaño, lo más grande primero'], ['ls -R', 'Entra también en las subcarpetas']] },
          { t: 'Se combinan', p: 'Las opciones de una letra se pueden juntar. `ls -l -a -h` es exactamente lo mismo que `ls -lah`, y así es como lo escribe todo el mundo.' },
          { c: 'user@mentor:~$ ls -lh\ntotal 24\ndrwxr-xr-x 1 user user 4.0K ene 15 10:30 documentos\n-rw-r--r-- 1 user user   38 ene 15 10:30 notas.txt' },
        ],
        retos: [
          {
            id: 'r2-ls',
            enunciado: 'Lista el contenido de tu carpeta personal en formato largo, para ver permisos y tamaños.',
            snapshot: 'inicio',
            xp: 25,
            pistas: ['El formato largo es una sola letra.', 'Es `ls -l`.'],
            solucion: 'ls -l',
            check: (c) => k.ultimoUsó(c, /\bls\b.*-\w*l/) && k.salidaTiene(c, 'notas.txt', 'rw-'),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /^ls\s*$/), titulo: 'Te falta la opción de formato largo', texto: '`ls` a secas solo muestra los nombres. Necesitas `-l` para ver permisos, dueño, tamaño y fecha.' },
            ],
          },
          {
            id: 'r2-ls-a',
            enunciado: 'Muestra también los archivos ocultos de tu carpeta personal, con sus permisos.',
            snapshot: 'inicio',
            xp: 30,
            pistas: ['Los ocultos empiezan por punto, como `.bashrc`. La opción es `-a`.', 'Combina las dos opciones: `ls -la`'],
            solucion: 'ls -la',
            check: (c) => k.salidaTiene(c, '.bashrc') && k.salidaTiene(c, 'rw-'),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /-\w*a/) && !k.salidaTiene(c, 'rw-'), titulo: 'Ves los ocultos, pero no los permisos', texto: 'Te falta juntar el formato largo: `ls -la`.' },
              { cuando: (c) => k.ultimoUsó(c, /-\w*l/) && !k.salidaTiene(c, '.bashrc'), titulo: 'Ves los permisos, pero no los ocultos', texto: 'Añade la `a`: `ls -la`.' },
            ],
          },
        ],
      },
      {
        id: 'cd',
        titulo: 'cd: moverte',
        subtitulo: 'Rutas absolutas y relativas',
        cuerpo: [
          { t: 'Dos formas de decir dónde', p: 'Una **ruta absoluta** empieza por `/` y describe el camino desde la raíz: siempre significa lo mismo, estés donde estés. Una **ruta relativa** parte de donde estás ahora.' },
          { f: [['cd /etc', 'Absoluta: va a /etc venga de donde venga'], ['cd documentos', 'Relativa: entra en documentos desde aquí'], ['cd ..', 'Sube un nivel'], ['cd ../..', 'Sube dos niveles'], ['cd ~', 'A tu carpeta personal'], ['cd', 'Igual que cd ~'], ['cd -', 'Vuelve a la carpeta anterior']] },
          { c: 'user@mentor:~$ cd documentos\nuser@mentor:~/documentos$ cd ..\nuser@mentor:~$ cd /var/log\nuser@mentor:/var/log$ cd -\n/home/user' },
          { n: 'El truco para no perderse nunca: `pwd` te dice dónde estás y `ls` qué hay ahí. Cuando dudes, escribe los dos.' },
        ],
        retos: [
          {
            id: 'r2-cd',
            enunciado: 'Entra en la carpeta `documentos` que hay en tu carpeta personal.',
            snapshot: 'inicio',
            xp: 25,
            pistas: ['`cd` seguido del nombre de la carpeta.', '`cd documentos`'],
            solucion: 'cd documentos',
            check: (c) => k.cwdEs(c, '/home/user/documentos'),
          },
          {
            id: 'r2-cd-abs',
            enunciado: 'Muévete a `/var/log` usando una ruta absoluta.',
            snapshot: 'inicio',
            xp: 30,
            pistas: ['Una ruta absoluta empieza por `/`.', '`cd /var/log`'],
            solucion: 'cd /var/log',
            check: (c) => k.cwdEs(c, '/var/log'),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /cd\s+var/) && !k.cwdEs(c, '/var/log'), titulo: 'Te falta la barra inicial', texto: 'Sin `/` delante, la shell busca una carpeta llamada `var` dentro de donde estás. Con `/var/log` parte de la raíz.' },
            ],
          },
          {
            id: 'r2-cd-anidado',
            enunciado: 'Llega hasta la carpeta `facturas`, que está dentro de `documentos`, en un solo comando.',
            snapshot: 'inicio',
            xp: 35,
            pistas: ['Puedes encadenar carpetas separándolas con `/`.', '`cd documentos/facturas`'],
            solucion: 'cd documentos/facturas',
            check: (c) => k.cwdEs(c, '/home/user/documentos/facturas'),
          },
        ],
      },
      {
        id: 'tree',
        titulo: 'tree: ver la estructura',
        subtitulo: 'Toda la jerarquía de un vistazo',
        cuerpo: [
          { t: 'Para qué', p: '`ls -R` lista todo lo que hay dentro, pero cuesta leerlo. `tree` dibuja la estructura con líneas y se entiende de un golpe de vista.' },
          { f: [['tree', 'Dibuja el árbol desde aquí'], ['tree carpeta', 'El árbol de esa carpeta'], ['tree -d', 'Solo las carpetas, sin archivos'], ['tree -a', 'Incluye los ocultos']] },
          { c: 'user@mentor:~$ tree proyectos\nproyectos\n├── api\n│   ├── package.json\n│   └── server.js\n└── web\n    ├── estilo.css\n    └── index.html\n\n2 directories, 4 files' },
        ],
        retos: [
          {
            id: 'r2-tree',
            enunciado: 'Dibuja el árbol completo de la carpeta `proyectos`.',
            snapshot: 'inicio',
            xp: 25,
            pistas: ['El comando se llama como «árbol» en inglés.', '`tree proyectos`'],
            solucion: 'tree proyectos',
            check: (c) => k.salidaTiene(c, '├──') && k.salidaTiene(c, 'server.js'),
          },
          {
            id: 'r2-tree-d',
            enunciado: 'Muestra únicamente las carpetas que hay dentro de `proyectos`, sin los archivos.',
            snapshot: 'inicio',
            xp: 30,
            pistas: ['Hay una opción de una letra para «solo directorios».', '`tree -d proyectos`'],
            solucion: 'tree -d proyectos',
            check: (c) => k.salidaTiene(c, 'web') && !k.salidaTiene(c, 'index.html'),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué carpeta contiene la configuración del sistema?', opciones: ['/var', '/etc', '/usr', '/opt'], correcta: 1, explicacion: '`/etc` guarda los archivos de configuración. `/var/log` guarda los registros y `/usr/bin` los programas.' },
      { pregunta: '¿Qué hace `cd ..`?', opciones: ['Va a la raíz', 'Va a tu carpeta personal', 'Sube un nivel', 'Vuelve a la carpeta anterior'], correcta: 2, explicacion: '`..` siempre significa «la carpeta de arriba». Volver a la anterior es `cd -`.' },
      { pregunta: '¿Cuál de estas es una ruta absoluta?', opciones: ['documentos/facturas', './notas.txt', '../var', '/var/log/syslog'], correcta: 3, explicacion: 'Las absolutas empiezan por `/` y funcionan igual desde cualquier sitio.' },
      { pregunta: '¿Qué opción de `ls` muestra los archivos ocultos?', opciones: ['-l', '-a', '-h', '-o'], correcta: 1, explicacion: '`-a` de *all*. Los ocultos son los que empiezan por punto, como `.bashrc`.' },
      { pregunta: 'Estás en /home/user y escribes `cd /etc`. ¿Dónde acabas?', opciones: ['/home/user/etc', '/etc', 'Da error', '/home/etc'], correcta: 1, explicacion: 'Al empezar por `/` es absoluta: ignora dónde estabas y va directa a `/etc`.' },
    ],
  },

  // ======================================================================
  {
    id: 'archivos',
    n: 3,
    nombre: 'Archivos y carpetas',
    resumen: 'Crear, copiar, mover y borrar sin desastres',
    comandos: ['touch', 'mkdir', 'cp', 'mv', 'rm', 'rmdir', 'ln', 'file', 'stat'],
    lecciones: [
      {
        id: 'crear',
        titulo: 'Crear: touch y mkdir',
        subtitulo: 'Archivos vacíos y carpetas nuevas',
        cuerpo: [
          { t: 'touch', p: 'Crea un archivo vacío. Si el archivo ya existe, no lo borra: solo actualiza su fecha de modificación. Por eso se llama «tocar».' },
          { t: 'mkdir', p: 'Crea una carpeta. Con `-p` crea toda la cadena de carpetas que falte, sin quejarse si alguna ya existía.' },
          { f: [['touch archivo.txt', 'Crea un archivo vacío'], ['touch a.txt b.txt', 'Crea varios de golpe'], ['mkdir carpeta', 'Crea una carpeta'], ['mkdir -p a/b/c', 'Crea las tres, aunque no exista ninguna'], ['mkdir -p ruta', 'No da error si ya existe']] },
          { c: 'user@mentor:~$ mkdir proyecto\nuser@mentor:~$ mkdir proyecto/src/utils\nmkdir: cannot create directory: No such file or directory\n\nuser@mentor:~$ mkdir -p proyecto/src/utils\nuser@mentor:~$ ' },
          { n: 'Ese error es el más común al empezar: `mkdir` sin `-p` solo crea el último nivel, y necesita que los de arriba ya existan.' },
        ],
        retos: [
          {
            id: 'r3-touch',
            enunciado: 'Crea un archivo vacío llamado `agenda.txt` en tu carpeta personal.',
            snapshot: 'inicio',
            xp: 25,
            pistas: ['El comando para crear archivos vacíos «toca» el archivo.', '`touch agenda.txt`'],
            solucion: 'touch agenda.txt',
            check: (c) => k.esArchivo(c, '/home/user/agenda.txt'),
          },
          {
            id: 'r3-mkdir-p',
            enunciado: 'Crea de una vez toda la ruta `trabajo/2026/enero` dentro de tu carpeta personal.',
            snapshot: 'inicio',
            xp: 40,
            pistas: ['`mkdir` normal falla porque `trabajo` no existe todavía.', 'La opción `-p` crea todos los niveles: `mkdir -p trabajo/2026/enero`'],
            solucion: 'mkdir -p trabajo/2026/enero',
            check: (c) => k.esDir(c, '/home/user/trabajo/2026/enero'),
            diagnostico: [
              { cuando: (c) => k.esDir(c, '/home/user/trabajo') && !k.esDir(c, '/home/user/trabajo/2026'), titulo: 'Creaste solo el primer nivel', texto: 'Con `-p` no hace falta ir carpeta por carpeta: `mkdir -p trabajo/2026/enero` las crea las tres.' },
            ],
          },
        ],
      },
      {
        id: 'copiar-mover',
        titulo: 'cp y mv',
        subtitulo: 'Copiar, mover y, de paso, renombrar',
        cuerpo: [
          { t: 'cp copia', p: 'El original se queda donde está. Para copiar una carpeta entera hace falta `-r` (recursivo), porque por defecto `cp` solo trabaja con archivos sueltos.' },
          { t: 'mv mueve… y renombra', p: 'No hay comando «rename» en Linux: renombrar es mover un archivo al mismo sitio con otro nombre. `mv viejo.txt nuevo.txt` es un renombrado.' },
          { f: [['cp a.txt b.txt', 'Copia a.txt creando b.txt'], ['cp a.txt carpeta/', 'Copia dentro de la carpeta'], ['cp -r origen destino', 'Copia una carpeta entera'], ['mv a.txt b.txt', 'Renombra a.txt como b.txt'], ['mv a.txt carpeta/', 'Mueve el archivo a la carpeta'], ['mv *.txt carpeta/', 'Mueve todos los .txt']] },
          { n: 'Si el destino ya existe, `cp` y `mv` lo sobrescriben sin preguntar. La opción `-i` hace que pidan confirmación.' },
        ],
        retos: [
          {
            id: 'r3-cp',
            enunciado: 'Haz una copia de seguridad de `notas.txt` llamada `notas.txt.bak`, sin borrar el original.',
            snapshot: 'inicio',
            xp: 30,
            pistas: ['Copiar es `cp origen destino`.', '`cp notas.txt notas.txt.bak`'],
            solucion: 'cp notas.txt notas.txt.bak',
            check: (c) => k.esArchivo(c, '/home/user/notas.txt.bak') && k.esArchivo(c, '/home/user/notas.txt'),
            diagnostico: [
              { cuando: (c) => k.esArchivo(c, '/home/user/notas.txt.bak') && !k.esArchivo(c, '/home/user/notas.txt'), titulo: 'Moviste en vez de copiar', texto: 'Has usado `mv`, que mueve y deja el origen vacío. Para conservar el original hay que usar `cp`.' },
            ],
          },
          {
            id: 'r3-cp-r',
            enunciado: 'Copia la carpeta `documentos` entera con el nombre `documentos-copia`.',
            snapshot: 'inicio',
            xp: 40,
            pistas: ['`cp` a secas se niega a copiar carpetas.', 'Necesitas la opción recursiva: `cp -r documentos documentos-copia`'],
            solucion: 'cp -r documentos documentos-copia',
            check: (c) => k.esDir(c, '/home/user/documentos-copia') && k.esArchivo(c, '/home/user/documentos-copia/cv.txt'),
            diagnostico: [
              { cuando: (c) => k.salidaTiene(c, 'omitting directory'), titulo: 'Falta la opción recursiva', texto: '`cp` avisa de que está «omitiendo el directorio». Añade `-r` para que entre dentro y copie todo el contenido.' },
            ],
          },
          {
            id: 'r3-mv-rename',
            enunciado: 'Renombra `leeme.md` a `README.md`.',
            snapshot: 'inicio',
            xp: 30,
            pistas: ['En Linux renombrar y mover son el mismo comando.', '`mv leeme.md README.md`'],
            solucion: 'mv leeme.md README.md',
            check: (c) => k.esArchivo(c, '/home/user/README.md') && !k.existe(c, '/home/user/leeme.md'),
          },
          {
            id: 'r3-mv-carpeta',
            enunciado: 'Mueve el archivo `notas.txt` dentro de la carpeta `documentos`.',
            snapshot: 'inicio',
            xp: 30,
            pistas: ['Si el destino es una carpeta existente, el archivo entra dentro.', '`mv notas.txt documentos/`'],
            solucion: 'mv notas.txt documentos/',
            check: (c) => k.esArchivo(c, '/home/user/documentos/notas.txt') && !k.existe(c, '/home/user/notas.txt'),
          },
        ],
      },
      {
        id: 'borrar',
        titulo: 'rm: borrar (y no arrepentirse)',
        subtitulo: 'En la terminal no hay papelera',
        cuerpo: [
          { t: 'Lo que borras, desaparece', p: 'No hay papelera de reciclaje. `rm` elimina de verdad. Por eso conviene mirar antes con `ls` lo que vas a borrar.' },
          { f: [['rm archivo', 'Borra un archivo'], ['rm -r carpeta', 'Borra una carpeta y todo lo de dentro'], ['rm -f archivo', 'No protesta si no existe'], ['rmdir carpeta', 'Borra la carpeta solo si está vacía'], ['rm -i archivo', 'Pregunta antes de cada borrado']] },
          { t: 'El comando que nunca debes escribir', p: '`rm -rf /` borraría el sistema entero. Los sistemas modernos lo bloquean, pero la costumbre correcta es otra: mira primero con `ls` la misma ruta que vas a borrar, y solo entonces cambia `ls` por `rm`.' },
          { n: 'Truco profesional: antes de un `rm` con comodines, ejecuta el mismo patrón con `ls`. Si `ls *.tmp` lista lo que esperas, `rm *.tmp` borrará exactamente eso.' },
        ],
        retos: [
          {
            id: 'r3-rm',
            enunciado: 'Borra el archivo `foto.jpg` que hay dentro de la carpeta `descargas`.',
            snapshot: 'inicio',
            xp: 25,
            pistas: ['El comando de borrar son dos letras.', '`rm descargas/foto.jpg`'],
            solucion: 'rm descargas/foto.jpg',
            check: (c) => !k.existe(c, '/home/user/descargas/foto.jpg'),
          },
          {
            id: 'r3-rm-r',
            enunciado: 'Elimina por completo la carpeta `descargas` y todo lo que contiene.',
            snapshot: 'inicio',
            xp: 40,
            pistas: ['`rm` sin opciones se niega a borrar carpetas.', 'Necesitas la recursiva: `rm -r descargas`'],
            solucion: 'rm -r descargas',
            check: (c) => !k.existe(c, '/home/user/descargas'),
            diagnostico: [
              { cuando: (c) => k.salidaTiene(c, 'Is a directory'), titulo: 'Es una carpeta, no un archivo', texto: '`rm` por defecto solo borra archivos. Para una carpeta con contenido necesitas `rm -r`.' },
              { cuando: (c) => k.salidaTiene(c, 'Directory not empty'), titulo: 'rmdir solo vacía', texto: '`rmdir` únicamente borra carpetas vacías. Aquí hay archivos dentro, así que toca `rm -r`.' },
            ],
          },
        ],
      },
      {
        id: 'enlaces',
        titulo: 'Enlaces simbólicos',
        subtitulo: 'Accesos directos que sí funcionan',
        cuerpo: [
          { t: 'Qué es', p: 'Un enlace simbólico es un archivo que apunta a otro sitio. Se usa muchísimo: para tener varias versiones de un programa y cambiar cuál está activa, o para acceder rápido a rutas largas.' },
          { f: [['ln -s destino nombre', 'Crea el enlace'], ['ls -l', 'Los enlaces se ven con una flecha ->'], ['readlink enlace', 'Dice a dónde apunta']] },
          { c: 'user@mentor:~$ ln -s /var/log/syslog registro\nuser@mentor:~$ ls -l registro\nlrwxrwxrwx 1 user user 15 ene 15 10:30 registro -> /var/log/syslog' },
          { n: 'La `l` del principio en `ls -l` significa *link*. Si borras el enlace no pasa nada al original; si borras el original, el enlace queda roto.' },
        ],
        retos: [
          {
            id: 'r3-ln',
            enunciado: 'Crea un enlace simbólico llamado `registro` que apunte a `/var/log/syslog`.',
            snapshot: 'inicio',
            xp: 40,
            pistas: ['El comando es `ln` y la opción de simbólico es `-s`.', 'Primero el destino y luego el nombre: `ln -s /var/log/syslog registro`'],
            solucion: 'ln -s /var/log/syslog registro',
            check: (c) => {
              const n = k.nodo(c, '/home/user/registro');
              return !!n && n.type === k.S_LINK && n.target === '/var/log/syslog';
            },
            diagnostico: [
              { cuando: (c) => k.esArchivo(c, '/home/user/registro'), titulo: 'Creaste un archivo normal, no un enlace', texto: 'Sin la opción `-s`, `ln` hace un enlace duro. Usa `ln -s destino nombre`.' },
              { cuando: (c) => { const n = k.nodo(c, '/home/user/registro'); return !!n && n.type === k.S_LINK && n.target !== '/var/log/syslog'; }, titulo: 'El enlace apunta a otro sitio', texto: 'El orden es `ln -s <a dónde apunta> <cómo se llama>`. Igual los has puesto al revés.' },
            ],
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué hace `mv informe.txt informe-final.txt`?', opciones: ['Copia el archivo', 'Lo renombra', 'Lo borra', 'Crea un enlace'], correcta: 1, explicacion: 'Mover un archivo al mismo sitio con otro nombre es exactamente renombrarlo. En Linux no hay comando `rename`.' },
      { pregunta: 'Quieres copiar una carpeta con todo su contenido. ¿Qué opción necesitas?', opciones: ['-a', '-r', '-c', '-f'], correcta: 1, explicacion: '`cp -r` (recursivo) entra dentro de la carpeta y copia todo. Sin ella, `cp` avisa de que omite el directorio.' },
      { pregunta: '¿Cuál es la diferencia entre `rmdir` y `rm -r`?', opciones: ['Ninguna', 'rmdir solo borra carpetas vacías', 'rm -r solo borra archivos', 'rmdir pide confirmación'], correcta: 1, explicacion: '`rmdir` es la opción segura: falla si queda algo dentro. `rm -r` arrasa con todo el contenido.' },
      { pregunta: '¿Qué hace `touch notas.txt` si el archivo ya existe?', opciones: ['Lo borra', 'Da error', 'Lo vacía', 'Actualiza su fecha'], correcta: 3, explicacion: 'No toca el contenido: solo actualiza la fecha de modificación.' },
      { pregunta: 'En `ls -l`, ¿qué indica una `l` al principio de la línea?', opciones: ['Que está bloqueado', 'Que es un enlace simbólico', 'Que es de solo lectura', 'Que es grande'], correcta: 1, explicacion: 'La primera letra es el tipo: `-` archivo, `d` directorio, `l` enlace.' },
    ],
  },

  // ======================================================================
  {
    id: 'texto',
    n: 4,
    nombre: 'Ver y escribir texto',
    resumen: 'Leer archivos y crear contenido sin editor',
    comandos: ['cat', 'less', 'head', 'tail', 'wc', 'nl', 'echo', 'tee'],
    lecciones: [
      {
        id: 'cat',
        titulo: 'cat: leer un archivo',
        subtitulo: 'Y por qué a veces no debes usarlo',
        cuerpo: [
          { t: 'Vuelca todo a pantalla', p: '`cat` imprime el archivo completo de golpe. Perfecto para archivos cortos: configuraciones, notas, scripts. Terrible para un registro de 200.000 líneas.' },
          { f: [['cat archivo', 'Muestra el contenido'], ['cat -n archivo', 'Con números de línea'], ['cat a.txt b.txt', 'Concatena varios archivos seguidos'], ['less archivo', 'Para archivos largos: se navega']] },
          { t: 'De dónde viene el nombre', p: 'De *concatenate*: su función original era pegar archivos uno detrás de otro. Que sirva para ver uno solo es casi un efecto secundario.' },
        ],
        retos: [
          {
            id: 'r4-cat',
            enunciado: 'Muestra el contenido del archivo `notas.txt`.',
            snapshot: 'inicio',
            xp: 20,
            pistas: ['Tres letras, viene de «concatenar».', '`cat notas.txt`'],
            solucion: 'cat notas.txt',
            check: (c) => k.salidaTiene(c, 'lista de la compra'),
          },
          {
            id: 'r4-cat-n',
            enunciado: 'Muestra `notas.txt` con el número de cada línea delante.',
            snapshot: 'inicio',
            xp: 30,
            pistas: ['Hay una opción para numerar.', '`cat -n notas.txt`'],
            solucion: 'cat -n notas.txt',
            check: (c) => k.salidaTiene(c, 'lista de la compra') && /\s1\s/.test(k.ultimaSalida(c)),
          },
        ],
      },
      {
        id: 'head-tail',
        titulo: 'head y tail',
        subtitulo: 'El principio y el final, que es lo que suele importar',
        cuerpo: [
          { t: 'Para archivos grandes', p: 'Cuando un registro tiene miles de líneas, casi nunca quieres verlas todas: quieres las últimas, que son las recientes. Eso es `tail`.' },
          { f: [['head archivo', 'Las 10 primeras líneas'], ['head -n 5 archivo', 'Las 5 primeras'], ['tail archivo', 'Las 10 últimas'], ['tail -n 20 archivo', 'Las 20 últimas'], ['tail -f archivo', 'Se queda mirando: muestra lo nuevo según llega']] },
          { t: 'tail -f es oro puro', p: 'Es la forma estándar de vigilar un registro en vivo mientras reproduces un error. Lo verás en cualquier equipo de sistemas.' },
        ],
        retos: [
          {
            id: 'r4-head',
            enunciado: 'Muestra solo las 3 primeras líneas de `/etc/passwd`.',
            snapshot: 'inicio',
            xp: 35,
            pistas: ['El comando es `head` y el número se pasa con `-n`.', '`head -n 3 /etc/passwd`'],
            solucion: 'head -n 3 /etc/passwd',
            check: (c) => k.salidaLineas(c).length === 3 && k.salidaTiene(c, 'root:x:0:0'),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /^head/) && k.salidaLineas(c).length > 3, titulo: 'Te salieron más de 3 líneas', texto: '`head` sin opciones muestra 10. Indica cuántas quieres con `-n 3`.' },
            ],
          },
          {
            id: 'r4-tail',
            enunciado: 'Muestra las 2 últimas líneas del registro `/var/log/nginx/access.log`.',
            snapshot: 'inicio',
            xp: 35,
            pistas: ['El final de un archivo es la «cola».', '`tail -n 2 /var/log/nginx/access.log`'],
            solucion: 'tail -n 2 /var/log/nginx/access.log',
            check: (c) => k.salidaLineas(c).length === 2 && k.salidaTiene(c, 'favicon.ico'),
          },
        ],
      },
      {
        id: 'wc',
        titulo: 'wc: contar',
        subtitulo: 'Líneas, palabras y caracteres',
        cuerpo: [
          { t: 'Contar es medir', p: '«¿Cuántos errores hay hoy?» «¿Cuántos usuarios tiene el sistema?» Casi siempre la respuesta acaba en un `wc -l`.' },
          { f: [['wc archivo', 'Líneas, palabras y bytes'], ['wc -l archivo', 'Solo el número de líneas'], ['wc -w archivo', 'Solo las palabras'], ['wc -c archivo', 'Solo los bytes']] },
          { c: 'user@mentor:~$ wc -l /etc/passwd\n7 /etc/passwd' },
        ],
        retos: [
          {
            id: 'r4-wc',
            enunciado: 'Averigua cuántas líneas tiene el archivo `/etc/passwd`, es decir, cuántas cuentas hay definidas.',
            snapshot: 'inicio',
            xp: 30,
            pistas: ['El comando de contar son dos letras: *word count*.', 'La opción de líneas es `-l`: `wc -l /etc/passwd`'],
            solucion: 'wc -l /etc/passwd',
            check: (c) => k.ultimoUsó(c, /wc\b.*-\w*l/) && k.salidaTiene(c, '7'),
          },
        ],
      },
      {
        id: 'redireccion',
        titulo: 'Escribir en archivos con > y >>',
        subtitulo: 'Guardar la salida en vez de verla',
        cuerpo: [
          { t: 'Redirigir la salida', p: 'Por defecto lo que produce un comando va a la pantalla. Con `>` lo mandas a un archivo. Es la forma más rápida de crear archivos sin abrir un editor.' },
          { f: [['echo texto > a.txt', 'Escribe en a.txt, BORRANDO lo que hubiera'], ['echo texto >> a.txt', 'Añade al final, conservando lo anterior'], ['ls -l > listado.txt', 'Guarda la salida de cualquier comando'], ['comando 2> errores.txt', 'Guarda solo los mensajes de error']] },
          { n: 'La diferencia entre `>` y `>>` es la que más disgustos da. Uno sobrescribe, el otro añade. Cuando dudes, usa `>>`.' },
          { c: 'user@mentor:~$ echo "primera" > diario.txt\nuser@mentor:~$ echo "segunda" >> diario.txt\nuser@mentor:~$ cat diario.txt\nprimera\nsegunda' },
        ],
        retos: [
          {
            id: 'r4-redir',
            enunciado: 'Crea un archivo `hola.txt` que contenga exactamente la línea: Hola mundo',
            snapshot: 'inicio',
            xp: 35,
            pistas: ['Combina `echo` con la redirección `>`.', '`echo "Hola mundo" > hola.txt`'],
            solucion: 'echo "Hola mundo" > hola.txt',
            check: (c) => (k.contenido(c, '/home/user/hola.txt') || '').trim() === 'Hola mundo',
            diagnostico: [
              { cuando: (c) => !k.existe(c, '/home/user/hola.txt') && k.salidaTiene(c, 'Hola mundo'), titulo: 'El texto salió por pantalla, no al archivo', texto: 'Te falta redirigir: añade `> hola.txt` al final para que la salida se guarde en vez de mostrarse.' },
            ],
          },
          {
            id: 'r4-append',
            enunciado: 'Añade la línea `café` al final de `notas.txt`, sin borrar lo que ya había.',
            snapshot: 'inicio',
            xp: 40,
            pistas: ['Para añadir sin borrar se usa la doble flecha.', '`echo café >> notas.txt`'],
            solucion: 'echo café >> notas.txt',
            check: (c) => {
              const t = k.contenido(c, '/home/user/notas.txt') || '';
              return t.includes('lista de la compra') && t.trimEnd().endsWith('café');
            },
            diagnostico: [
              { cuando: (c) => { const t = k.contenido(c, '/home/user/notas.txt') || ''; return t.includes('café') && !t.includes('lista de la compra'); }, titulo: 'Borraste el contenido anterior', texto: 'Usaste `>`, que sobrescribe el archivo entero. Para añadir al final hace falta `>>`. Reinicia el reto y prueba otra vez.' },
            ],
          },
          {
            id: 'r4-guardar-ls',
            enunciado: 'Guarda el listado largo de tu carpeta personal en un archivo llamado `listado.txt`.',
            snapshot: 'inicio',
            xp: 40,
            pistas: ['Puedes redirigir la salida de cualquier comando, no solo de `echo`.', '`ls -l > listado.txt`'],
            solucion: 'ls -l > listado.txt',
            check: (c) => {
              const t = k.contenido(c, '/home/user/listado.txt') || '';
              return t.includes('notas.txt') && t.includes('rw-');
            },
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Cuál es la diferencia entre `>` y `>>`?', opciones: ['Ninguna', '> añade y >> sobrescribe', '> sobrescribe y >> añade', '>> solo funciona con echo'], correcta: 2, explicacion: 'Una sola flecha borra el archivo y escribe de cero. La doble conserva lo que había y añade al final.' },
      { pregunta: 'Quieres ver las últimas 20 líneas de un registro. ¿Qué usas?', opciones: ['head -n 20 registro', 'tail -n 20 registro', 'cat -20 registro', 'wc -l registro'], correcta: 1, explicacion: '`tail` muestra el final, que en un registro es lo más reciente.' },
      { pregunta: '¿Qué cuenta `wc -l`?', opciones: ['Letras', 'Palabras', 'Líneas', 'Bytes'], correcta: 2, explicacion: '`-l` de *lines*. `-w` cuenta palabras y `-c` cuenta bytes.' },
      { pregunta: '¿Por qué es mala idea hacer `cat` de un registro enorme?', opciones: ['Borra el archivo', 'Vuelca miles de líneas de golpe', 'Necesita sudo', 'No funciona con .log'], correcta: 1, explicacion: 'Te inunda la pantalla. Para archivos grandes se usa `less`, `head` o `tail`.' },
      { pregunta: '¿Qué hace `ls -l > listado.txt`?', opciones: ['Lista el contenido de listado.txt', 'Guarda el listado en el archivo', 'Compara ambos', 'Da error'], correcta: 1, explicacion: 'La salida de `ls -l`, en vez de ir a la pantalla, se escribe en `listado.txt`.' },
    ],
  },
];
