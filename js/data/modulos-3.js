// Módulos 9–14: administración del sistema.
// Ruta inspirada en el temario de Introducción a Linux de Hack4u: descriptores
// de archivo, permisos especiales y SSH, además de paquetes, red y systemd.
import * as k from './checks.js';

export const MODULOS_3 = [
  // ======================================================================
  {
    id: 'paquetes',
    n: 9,
    nombre: 'Paquetes y software',
    resumen: 'Instalar, actualizar y quitar programas',
    comandos: ['apt', 'dpkg', 'dnf', 'pacman', 'rpm', 'which', 'whereis'],
    lecciones: [
      {
        id: 'gestores',
        titulo: 'Cada familia, su gestor',
        subtitulo: 'apt, dnf y pacman hacen lo mismo con otros nombres',
        cuerpo: [
          { t: 'No se instala bajando archivos', p: 'En Linux el software viene de repositorios: catálogos firmados que el sistema conoce. Pides un nombre y el gestor descarga el paquete, comprueba la firma y resuelve las dependencias.' },
          { f: [['Debian, Ubuntu, Kali', '`apt`'], ['Fedora, RHEL, Rocky', '`dnf`'], ['Arch, Manjaro', '`pacman`'], ['Alpine', '`apk`']] },
          { t: 'Los verbos son los mismos', p: 'Cambia la palabra, no la idea: actualizar la lista, instalar, quitar, buscar. Si sabes uno, los otros son traducción directa.' },
          { c: 'Debian/Ubuntu     Fedora            Arch\n───────────────   ───────────────   ──────────────\napt update        dnf check-update  pacman -Sy\napt install X     dnf install X     pacman -S X\napt remove X      dnf remove X      pacman -R X\napt search X      dnf search X      pacman -Ss X' },
        ],
        retos: [
          {
            id: 'r9-update',
            enunciado: 'Actualiza la lista de paquetes disponibles del sistema. Recuerda que tocar el sistema requiere privilegios.',
            snapshot: 'base',
            xp: 40,
            pistas: ['El verbo es `update` y el gestor de esta máquina Debian es `apt`.', 'Y necesita administrador: `sudo apt update`'],
            solucion: 'sudo apt update',
            check: (c) => k.salidaTiene(c, 'Reading package lists'),
            diagnostico: [
              { cuando: (c) => k.salidaTiene(c, 'are you root'), titulo: 'Falta sudo', texto: 'Modificar la base de datos de paquetes es una operación de administrador. Pon `sudo` delante.' },
            ],
          },
          {
            id: 'r9-install',
            enunciado: 'Instala el paquete `htop`, el monitor de procesos.',
            snapshot: 'base',
            xp: 45,
            pistas: ['`apt install nombre`, como administrador.', '`sudo apt install htop`'],
            solucion: 'sudo apt install htop',
            check: (c) => !!c.shell.state.packages && c.shell.state.packages.has('htop'),
          },
          {
            id: 'r9-search',
            enunciado: 'Busca en los repositorios qué paquetes tienen que ver con `nginx`.',
            snapshot: 'base',
            xp: 35,
            pistas: ['Buscar no necesita permisos de administrador.', '`apt search nginx`'],
            solucion: 'apt search nginx',
            check: (c) => k.salidaTiene(c, 'nginx'),
          },
        ],
      },
      {
        id: 'consultar',
        titulo: 'Saber qué hay instalado',
        subtitulo: 'Inventario y rastreo de archivos',
        cuerpo: [
          { t: 'Preguntas habituales', p: '«¿Está instalado esto?» «¿Qué versión?» «¿De qué paquete salió este archivo?» Cada gestor trae herramientas de consulta que no modifican nada.' },
          { f: [['dpkg -l', 'Lista todo lo instalado (Debian)'], ['dpkg -L paquete', 'Qué archivos instaló ese paquete'], ['dpkg -s paquete', 'Su estado y versión'], ['apt list --installed', 'Lo mismo, más moderno'], ['which programa', 'Dónde está el ejecutable'], ['whereis programa', 'Ejecutable, fuentes y manual']] },
        ],
        retos: [
          {
            id: 'r9-dpkg',
            enunciado: 'Lista todos los paquetes instalados en el sistema con dpkg.',
            snapshot: 'base',
            xp: 40,
            pistas: ['La opción de listar es `-l`.', '`dpkg -l`'],
            solucion: 'dpkg -l',
            check: (c) => k.salidaTiene(c, 'ii') && k.salidaTiene(c, 'curl'),
          },
          {
            id: 'r9-instalado',
            enunciado: 'Instala `tree` y comprueba después que aparece en la lista de paquetes instalados.',
            snapshot: 'base',
            xp: 55,
            pistas: ['Son dos pasos: primero `sudo apt install tree`.', 'Después `dpkg -l` y busca tree en la lista.'],
            solucion: 'sudo apt install tree && dpkg -l',
            check: (c) => !!c.shell.state.packages && c.shell.state.packages.has('tree') && k.usó(c, /dpkg\s+-l|apt list/),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué hace `apt update`?', opciones: ['Actualiza los programas instalados', 'Actualiza la lista de paquetes disponibles', 'Instala todo', 'Borra la caché'], correcta: 1, explicacion: 'Solo refresca el catálogo. Actualizar los programas es `apt upgrade`.' },
      { pregunta: '¿Cuál es el equivalente de `apt install` en Arch?', opciones: ['pacman -R', 'pacman -Q', 'pacman -S', 'pacman -U'], correcta: 2, explicacion: '`-S` de *sync*: instala desde los repositorios.' },
      { pregunta: '¿Por qué instalar requiere sudo?', opciones: ['Por licencias', 'Porque escribe en directorios del sistema', 'Porque descarga de internet', 'No lo requiere'], correcta: 1, explicacion: 'Los paquetes escriben en `/usr`, `/etc` y otros sitios protegidos.' },
      { pregunta: '¿Qué comando dice qué archivos instaló un paquete en Debian?', opciones: ['dpkg -l', 'dpkg -L paquete', 'apt show', 'which'], correcta: 1, explicacion: '`-L` en mayúscula lista los archivos; `-l` en minúscula lista los paquetes.' },
      { pregunta: 'Instalar desde repositorio en vez de bajar un .deb suelto es mejor porque…', opciones: ['Es más rápido', 'Resuelve dependencias y verifica firmas', 'Ocupa menos', 'No hay diferencia'], correcta: 1, explicacion: 'El gestor comprueba la firma criptográfica y arrastra todo lo que el programa necesita.' },
    ],
  },

  // ======================================================================
  {
    id: 'descriptores',
    n: 10,
    nombre: 'Descriptores y flujos',
    resumen: 'Entender de verdad la entrada, la salida y los errores',
    comandos: ['echo', 'cat', 'tee', 'grep', 'find'],
    lecciones: [
      {
        id: 'los-tres',
        titulo: 'Los tres descriptores',
        subtitulo: '0, 1 y 2: la base de toda la redirección',
        cuerpo: [
          { t: 'Todo proceso nace con tres canales', p: 'No son «la pantalla» y ya está: son tres flujos numerados, y saber distinguirlos es lo que te permite separar resultados de errores.' },
          { f: [['0 · stdin', 'La entrada: de dónde lee'], ['1 · stdout', 'La salida normal: los resultados'], ['2 · stderr', 'Los errores: los mensajes de fallo']] },
          { t: 'Por qué están separados', p: 'Para que puedas guardar los resultados en un archivo y seguir viendo los errores en pantalla. Si fueran el mismo flujo, los errores contaminarían tus datos.' },
          { c: 'user@mentor:~$ ls existe.txt noexiste.txt > salida.txt\nls: cannot access \'noexiste.txt\': No such file or directory\n                    ↑ esto es stderr, sigue en pantalla\n\nuser@mentor:~$ cat salida.txt\nexiste.txt          ← esto era stdout, sí se guardó' },
        ],
        retos: [
          {
            id: 'r10-stdout',
            enunciado: 'Ejecuta `ls notas.txt noexiste.txt` guardando SOLO la salida correcta en `bien.txt`. Los errores deben seguir apareciendo en pantalla.',
            snapshot: 'inicio',
            xp: 50,
            pistas: ['`>` redirige el descriptor 1 (stdout) y deja el 2 (stderr) en la pantalla.', '`ls notas.txt noexiste.txt > bien.txt`'],
            solucion: 'ls notas.txt noexiste.txt > bien.txt',
            check: (c) => {
              const t = k.contenido(c, '/home/user/bien.txt') || '';
              return t.includes('notas.txt') && !t.includes('No such file');
            },
            diagnostico: [
              { cuando: (c) => (k.contenido(c, '/home/user/bien.txt') || '').includes('No such file'), titulo: 'También guardaste los errores', texto: 'Has redirigido los dos flujos. Con `>` a secas solo se guarda stdout; el error debe quedarse en la pantalla.' },
            ],
          },
          {
            id: 'r10-stderr',
            enunciado: 'Ahora al revés: guarda solo los ERRORES de `ls notas.txt noexiste.txt` en un archivo llamado `errores.txt`.',
            snapshot: 'inicio',
            xp: 55,
            pistas: ['El descriptor de errores es el 2. Se redirige poniendo el número delante de la flecha.', '`ls notas.txt noexiste.txt 2> errores.txt`'],
            solucion: 'ls notas.txt noexiste.txt 2> errores.txt',
            check: (c) => {
              const t = k.contenido(c, '/home/user/errores.txt') || '';
              return t.includes('No such file') && !t.includes('notas.txt\n');
            },
            diagnostico: [
              { cuando: (c) => k.existe(c, '/home/user/errores.txt') && (k.contenido(c, '/home/user/errores.txt') || '').trim() === '', titulo: 'El archivo salió vacío', texto: 'Guardaste stdout en vez de stderr. Hay que poner el número del descriptor pegado a la flecha: `2>`.' },
            ],
          },
        ],
      },
      {
        id: 'combinar',
        titulo: 'Combinar y descartar flujos',
        subtitulo: '2>&1 y el agujero negro /dev/null',
        cuerpo: [
          { t: 'Juntar los dos', p: '`2>&1` significa «manda el descriptor 2 al mismo sitio al que va ahora el 1». Se usa cuando quieres un registro completo con resultados y errores mezclados.' },
          { f: [['comando > todo.log 2>&1', 'Todo al mismo archivo'], ['comando &> todo.log', 'Atajo moderno, lo mismo'], ['comando 2>/dev/null', 'Tira los errores a la basura'], ['comando >/dev/null 2>&1', 'Silencio absoluto'], ['comando | tee salida.log', 'Ver en pantalla Y guardar']] },
          { t: 'El orden importa', p: '`> f 2>&1` funciona: primero manda stdout al archivo, luego stderr donde esté stdout. `2>&1 > f` NO hace lo mismo: copia el destino actual de stdout (la pantalla) antes de cambiarlo.' },
          { t: '/dev/null', p: 'Es un archivo especial que descarta todo lo que le escribas. Se usa para silenciar el ruido: `find / -name x 2>/dev/null` esconde los cientos de «Permission denied».' },
          { n: '`tee` es la excepción útil: parte el flujo en dos y te deja ver la salida mientras la guardas.' },
        ],
        retos: [
          {
            id: 'r10-null',
            enunciado: 'Busca con find todos los archivos llamados `passwd` desde la raíz `/`, descartando los mensajes de error de permisos.',
            snapshot: 'inicio',
            xp: 60,
            pistas: ['Los errores van por el descriptor 2 y se tiran a `/dev/null`.', '`find / -name passwd 2>/dev/null`'],
            solucion: 'find / -name passwd 2>/dev/null',
            check: (c) => k.ultimoUsó(c, /2\s*>\s*\/dev\/null/) && k.salidaTiene(c, '/etc/passwd'),
          },
          {
            id: 'r10-todo',
            enunciado: 'Guarda en `completo.log` tanto la salida como los errores de `ls notas.txt noexiste.txt`.',
            snapshot: 'inicio',
            xp: 65,
            pistas: ['Primero rediriges stdout y luego mandas stderr al mismo sitio.', '`ls notas.txt noexiste.txt > completo.log 2>&1`'],
            solucion: 'ls notas.txt noexiste.txt > completo.log 2>&1',
            check: (c) => {
              const t = k.contenido(c, '/home/user/completo.log') || '';
              return t.includes('notas.txt') && t.includes('No such file');
            },
            diagnostico: [
              { cuando: (c) => { const t = k.contenido(c, '/home/user/completo.log') || ''; return t.includes('notas.txt') && !t.includes('No such file'); }, titulo: 'Falta traer los errores', texto: 'Solo guardaste stdout. Añade `2>&1` **después** de la redirección para que stderr siga al mismo destino.' },
            ],
          },
          {
            id: 'r10-tee',
            enunciado: 'Muestra por pantalla el contenido de `notas.txt` y, al mismo tiempo, guárdalo en `copia.txt`.',
            snapshot: 'inicio',
            xp: 55,
            pistas: ['Hay un comando que parte el flujo en dos, como una T de fontanería.', '`cat notas.txt | tee copia.txt`'],
            solucion: 'cat notas.txt | tee copia.txt',
            check: (c) => (k.contenido(c, '/home/user/copia.txt') || '').includes('lista de la compra') && k.salidaTiene(c, 'lista de la compra'),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué número corresponde a stderr?', opciones: ['0', '1', '2', '3'], correcta: 2, explicacion: '0 es stdin, 1 stdout y 2 stderr.' },
      { pregunta: '¿Qué hace `comando 2>/dev/null`?', opciones: ['Guarda todo en null', 'Descarta los mensajes de error', 'Silencia toda la salida', 'Da error'], correcta: 1, explicacion: 'Manda el descriptor 2 al dispositivo nulo. La salida normal se sigue viendo.' },
      { pregunta: '¿Para qué sirve `2>&1`?', opciones: ['Ejecutar dos comandos', 'Mandar stderr al mismo sitio que stdout', 'Duplicar la salida', 'Contar errores'], correcta: 1, explicacion: 'El `&1` significa «el destino actual del descriptor 1», no un archivo llamado 1.' },
      { pregunta: '¿Por qué `> f 2>&1` y `2>&1 > f` no son lo mismo?', opciones: ['Sí son lo mismo', 'Porque el orden decide a dónde apunta cada flujo cuando se copia', 'Porque el segundo da error', 'Por el espacio'], correcta: 1, explicacion: 'En el segundo caso stderr copia el destino de stdout *antes* de que este cambie, así que se queda en la pantalla.' },
      { pregunta: '¿Qué hace `tee`?', opciones: ['Borra la salida', 'La muestra y la guarda a la vez', 'Ordena', 'Cuenta líneas'], correcta: 1, explicacion: 'Parte el flujo: sigue por el pipe y además se escribe en el archivo.' },
    ],
  },

  // ======================================================================
  {
    id: 'especiales',
    n: 11,
    nombre: 'Permisos especiales',
    resumen: 'SUID, SGID, sticky bit y capabilities',
    comandos: ['chmod', 'find', 'ls', 'getcap', 'stat'],
    lecciones: [
      {
        id: 'suid',
        titulo: 'SUID: ejecutar con los permisos del dueño',
        subtitulo: 'La pieza clave de la escalada de privilegios',
        cuerpo: [
          { t: 'El problema que resuelve', p: 'Cambiar tu contraseña implica escribir en `/etc/shadow`, que solo puede tocar root. Y aun así, `passwd` te funciona como usuario normal. ¿Cómo? Porque el binario tiene el bit **SUID**: mientras se ejecuta, corre con los permisos de su dueño (root), no con los tuyos.' },
          { t: 'Cómo se ve', p: 'En `ls -l` aparece una **s** donde iría la `x` del dueño. En octal es un 4 delante: `4755`.' },
          { c: '-rwsr-xr-x 1 root root 68208 /usr/bin/passwd\n   ↑\n   la s significa SUID: se ejecuta como root' },
          { f: [['chmod u+s archivo', 'Activa SUID'], ['chmod 4755 archivo', 'Lo mismo en octal'], ['chmod u-s archivo', 'Lo quita'], ['find / -perm -4000 2>/dev/null', 'Busca todos los binarios SUID']] },
          { t: 'Por qué importa en seguridad', p: 'Un binario SUID mal elegido es una puerta a root. Si un programa con SUID permite ejecutar otros comandos o leer archivos arbitrarios, cualquiera puede aprovecharlo para convertirse en administrador. Auditar la lista de binarios SUID es de las primeras cosas que se hacen al revisar una máquina.' },
          { n: 'Regla de oro: nunca pongas SUID a un script ni a un intérprete como `bash`, `find`, `vim` o `python`. Equivale a regalar root.' },
        ],
        retos: [
          {
            id: 'r11-find-suid',
            enunciado: 'Audita el sistema: busca desde la raíz todos los archivos con el bit SUID activado, descartando los errores de permisos.',
            snapshot: 'base',
            xp: 70,
            pistas: ['SUID en octal es 4000, y `-perm -4000` significa «que tenga al menos ese bit».', '`find / -perm -4000 2>/dev/null`'],
            solucion: 'find / -perm -4000 2>/dev/null',
            check: (c) => k.ultimoUsó(c, /-perm\s+-?\/?4000/),
          },
          {
            id: 'r11-suid-set',
            enunciado: 'Activa el bit SUID en el archivo `informe.txt` para ver cómo cambia su representación en `ls -l`.',
            snapshot: 'permisos',
            xp: 55,
            pistas: ['El dueño es `u` y el bit especial es `s`.', '`chmod u+s informe.txt`'],
            solucion: 'chmod u+s informe.txt',
            check: (c) => {
              const n = k.nodo(c, 'informe.txt');
              return !!n && (n.mode & 0o4000) !== 0;
            },
          },
        ],
      },
      {
        id: 'sgid-sticky',
        titulo: 'SGID y sticky bit',
        subtitulo: 'Carpetas compartidas que funcionan',
        cuerpo: [
          { t: 'SGID en carpetas', p: 'Todo lo que se cree dentro hereda el grupo de la carpeta, no el del usuario que lo crea. Es la forma correcta de montar una carpeta de equipo: da igual quién suba el archivo, el grupo siempre será el correcto.' },
          { t: 'Sticky bit', p: 'En una carpeta con sticky bit, solo el dueño de cada archivo puede borrarlo, aunque la carpeta sea escribible por todos. Es exactamente lo que hace `/tmp`: todos pueden crear ahí, pero nadie puede borrar lo de otro.' },
          { c: 'drwxrwsr-x  equipo/   ← SGID: la s en el grupo\ndrwxrwxrwt  /tmp      ← sticky: la t al final' },
          { f: [['chmod g+s carpeta', 'Activa SGID'], ['chmod 2775 carpeta', 'SGID en octal (el 2 delante)'], ['chmod +t carpeta', 'Activa el sticky bit'], ['chmod 1777 carpeta', 'Sticky en octal (el 1 delante)']] },
          { t: 'Resumen del dígito extra', p: 'El cuarto dígito de chmod son los bits especiales: **4** SUID, **2** SGID, **1** sticky. Se suman como los demás: `chmod 6755` sería SUID + SGID.' },
        ],
        retos: [
          {
            id: 'r11-sgid',
            enunciado: 'Prepara la carpeta `compartido` como carpeta de equipo: activa el SGID para que todo lo que se cree dentro herede su grupo.',
            snapshot: 'permisos',
            xp: 60,
            pistas: ['El grupo es `g` y el bit especial es `s`.', '`chmod g+s compartido`'],
            solucion: 'chmod g+s compartido',
            check: (c) => {
              const n = k.nodo(c, 'compartido');
              return !!n && (n.mode & 0o2000) !== 0;
            },
          },
          {
            id: 'r11-sticky',
            enunciado: 'Activa el sticky bit en `compartido` para que cada usuario solo pueda borrar sus propios archivos.',
            snapshot: 'permisos',
            xp: 60,
            pistas: ['El sticky bit se activa con `+t`.', '`chmod +t compartido`'],
            solucion: 'chmod +t compartido',
            check: (c) => {
              const n = k.nodo(c, 'compartido');
              return !!n && (n.mode & 0o1000) !== 0;
            },
          },
          {
            id: 'r11-octal',
            enunciado: 'Deja la carpeta `compartido` exactamente en 2775: SGID activado, dueño y grupo con todo, y los demás solo leer y entrar.',
            snapshot: 'permisos',
            xp: 70,
            pistas: ['El primer dígito son los bits especiales: 2 es SGID.', '`chmod 2775 compartido`'],
            solucion: 'chmod 2775 compartido',
            check: (c) => {
              const n = k.nodo(c, 'compartido');
              return !!n && (n.mode & 0o7777) === 0o2775;
            },
            diagnostico: [
              { cuando: (c) => { const n = k.nodo(c, 'compartido'); return !!n && (n.mode & 0o777) === 0o775 && (n.mode & 0o2000) === 0; }, titulo: 'Los permisos básicos están bien, falta el bit especial', texto: 'Escribiste `775` con tres dígitos. Para los bits especiales hay que usar cuatro: `2775`.' },
            ],
          },
        ],
      },
      {
        id: 'capabilities',
        titulo: 'Capabilities',
        subtitulo: 'Superpoderes sueltos en vez de root entero',
        cuerpo: [
          { t: 'La alternativa moderna a SUID', p: 'SUID da todos los poderes de root. Las capabilities parten esos poderes en piezas y dan solo la que hace falta. `ping` necesita abrir sockets de red crudos, no necesita poder borrar `/etc`.' },
          { f: [['getcap archivo', 'Ver las capabilities de un binario'], ['getcap -r / 2>/dev/null', 'Auditar todo el sistema'], ['setcap cap_net_raw+ep ping', 'Conceder una capability'], ['cap_net_bind_service', 'Abrir puertos por debajo del 1024'], ['cap_dac_override', 'Saltarse las comprobaciones de permisos'], ['cap_setuid', 'Cambiar de identidad — peligrosísima']] },
          { t: 'Al auditar', p: 'Un binario con `cap_setuid` o `cap_dac_override` es tan peligroso como uno con SUID: permite acceder a cualquier archivo o convertirse en otro usuario. Se revisan igual de cerca.' },
          { n: 'Idea que conviene grabarse: **el privilegio mínimo necesario**. Ni SUID ni capabilities de más. Es la diferencia entre un servidor endurecido y uno que se cae al primer empujón.' },
        ],
        retos: [
          {
            id: 'r11-getcap',
            enunciado: 'Busca en todo el sistema los binarios que tengan capabilities asignadas, descartando los errores.',
            snapshot: 'base',
            xp: 60,
            pistas: ['El comando es `getcap` y la opción recursiva es `-r`.', '`getcap -r / 2>/dev/null`'],
            solucion: 'getcap -r / 2>/dev/null',
            check: (c) => k.ultimoUsó(c, /getcap/),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué hace el bit SUID en un ejecutable?', opciones: ['Lo hace de solo lectura', 'Lo ejecuta con los permisos de su dueño', 'Lo oculta', 'Lo comparte con el grupo'], correcta: 1, explicacion: 'Por eso `passwd` puede escribir en `/etc/shadow` aunque lo lance un usuario normal.' },
      { pregunta: '¿Qué representa la `t` al final de `drwxrwxrwt`?', opciones: ['Temporal', 'Sticky bit', 'Solo texto', 'Terminal'], correcta: 1, explicacion: 'El sticky bit: cada usuario solo puede borrar lo suyo. Es lo que protege `/tmp`.' },
      { pregunta: '¿Qué busca `find / -perm -4000`?', opciones: ['Archivos de 4000 bytes', 'Archivos con SUID', 'Carpetas vacías', 'Archivos de root'], correcta: 1, explicacion: '4000 en octal es el bit SUID; el guion delante significa «que lo tenga, entre otros».' },
      { pregunta: '¿Por qué es peligroso dar SUID a `/usr/bin/find`?', opciones: ['Consume mucha CPU', 'Porque find puede ejecutar comandos con -exec, y lo haría como root', 'Porque es muy grande', 'No es peligroso'], correcta: 1, explicacion: 'Cualquier binario SUID que permita ejecutar otros comandos o leer archivos arbitrarios entrega root de forma inmediata.' },
      { pregunta: '¿Qué ventaja tienen las capabilities sobre SUID?', opciones: ['Son más rápidas', 'Conceden solo el privilegio concreto que hace falta', 'Ocupan menos', 'Funcionan sin root'], correcta: 1, explicacion: 'Principio de mínimo privilegio: `ping` recibe permiso para sockets crudos y nada más.' },
    ],
  },

  // ======================================================================
  {
    id: 'redes',
    n: 12,
    nombre: 'Redes',
    resumen: 'Cómo se conecta la máquina y cómo diagnosticar cuando no',
    comandos: ['ip', 'ping', 'dig', 'host', 'curl', 'ss', 'traceroute', 'hostname'],
    lecciones: [
      {
        id: 'fundamentos',
        titulo: 'Los cuatro conceptos',
        subtitulo: 'IP, máscara, gateway y DNS',
        cuerpo: [
          { t: 'IP: la dirección', p: 'Identifica a la máquina dentro de una red. `192.168.1.50` es privada (solo válida dentro de tu red local); las públicas son las que se ven en internet.' },
          { t: 'Máscara y CIDR: el barrio', p: 'El `/24` de `192.168.1.50/24` dice cuántos bits de la dirección identifican a la red. Con /24, todo lo que empiece por `192.168.1.` está en tu red y se alcanza directamente; el resto tiene que salir por el gateway.' },
          { t: 'Gateway: la puerta', p: 'El router. Cuando la dirección de destino no es de tu red, el paquete se le entrega a él para que lo saque fuera.' },
          { t: 'DNS: la agenda', p: 'Traduce nombres a direcciones. `google.com` no significa nada para la red: alguien tiene que convertirlo en una IP. Ese alguien es el servidor DNS.' },
          { t: 'Puertos', p: 'Una IP identifica la máquina; el puerto identifica el servicio dentro de ella. 22 SSH, 80 HTTP, 443 HTTPS, 3306 MySQL, 5432 PostgreSQL.' },
          { c: 'IP:       192.168.1.50/24\nRed:      192.168.1.0    ← el barrio\nGateway:  192.168.1.1    ← la salida\nDNS:      1.1.1.1        ← la agenda' },
        ],
        retos: [
          {
            id: 'r12-ip',
            enunciado: 'Averigua qué dirección IP tiene esta máquina.',
            snapshot: 'base',
            xp: 40,
            pistas: ['El comando moderno es `ip` y el subcomando de direcciones es `a` o `addr`.', '`ip a`'],
            solucion: 'ip a',
            check: (c) => k.salidaTiene(c, '192.168.1.50', 'eth0'),
          },
          {
            id: 'r12-route',
            enunciado: 'Descubre cuál es la puerta de enlace (gateway) por la que sale el tráfico de esta máquina.',
            snapshot: 'base',
            xp: 50,
            pistas: ['La tabla de rutas se ve con `ip r`.', '`ip r` — el gateway es la línea que empieza por `default via`.'],
            solucion: 'ip r',
            check: (c) => k.salidaTiene(c, 'default via 192.168.1.1'),
          },
        ],
      },
      {
        id: 'diagnostico',
        titulo: 'La escalera de diagnóstico',
        subtitulo: 'Qué comprobar y en qué orden cuando «no hay internet»',
        cuerpo: [
          { t: 'Se va de dentro hacia fuera', p: 'Cada peldaño descarta una capa. Si fallas en el tercero pero los dos primeros van, ya sabes que el problema no está ni en tu tarjeta ni en tu router.' },
          { f: [['1. ip a', '¿Tengo IP? Si no, el problema es local o del DHCP'], ['2. ping gateway', '¿Llego a mi router? Si no, es la red local'], ['3. ping 8.8.8.8', '¿Salgo a internet por IP? Si no, es el router o el proveedor'], ['4. dig google.com', '¿Resuelvo nombres? Si el 3 va y este no, es el DNS'], ['5. curl -v https://…', '¿Responde el servicio? Si todo lo anterior va, es la aplicación']] },
          { t: 'El síntoma clásico', p: '«`ping 8.8.8.8` funciona pero las webs no cargan» significa casi siempre problema de DNS. Es el diagnóstico más rentable que puedes memorizar.' },
          { f: [['ss -tulpn', 'Qué servicios están escuchando y en qué puerto'], ['curl -I web', 'Solo las cabeceras de respuesta'], ['traceroute host', 'Por dónde pasa el tráfico'], ['dig +short host', 'Solo la IP, sin ruido']] },
        ],
        retos: [
          {
            id: 'r12-ping',
            enunciado: 'Comprueba con 4 paquetes que hay conectividad con `servidor.local`.',
            snapshot: 'base',
            xp: 45,
            pistas: ['`ping` con la opción `-c` limita el número de paquetes.', '`ping -c 4 servidor.local`'],
            solucion: 'ping -c 4 servidor.local',
            check: (c) => k.salidaTiene(c, '4 packets transmitted', '192.168.1.50'),
          },
          {
            id: 'r12-dig',
            enunciado: 'Resuelve el nombre `github.com` a su dirección IP, mostrando solo la IP.',
            snapshot: 'base',
            xp: 50,
            pistas: ['`dig` con la opción `+short` da la respuesta pelada.', '`dig +short github.com`'],
            solucion: 'dig +short github.com',
            check: (c) => k.salidaTiene(c, '140.82.121.4'),
          },
          {
            id: 'r12-ss',
            enunciado: 'Lista qué servicios están escuchando en esta máquina y en qué puertos.',
            snapshot: 'base',
            xp: 55,
            pistas: ['El comando moderno es `ss`; las opciones habituales son `-tulpn`.', '`ss -tulpn`'],
            solucion: 'ss -tulpn',
            check: (c) => k.salidaTiene(c, 'LISTEN', ':22', ':80'),
          },
          {
            id: 'r12-escalera',
            enunciado: 'Una web no carga. Haz el diagnóstico completo: comprueba tu IP, luego que llegas al gateway y por último que el DNS resuelve `example.com`.',
            snapshot: 'base',
            xp: 80,
            pistas: ['Son tres comandos, en orden: `ip a`, luego `ping -c 2 192.168.1.1`, luego `dig +short example.com`.', 'Puedes encadenarlos con `;` o ejecutarlos uno a uno.'],
            solucion: 'ip a; ping -c 2 servidor.local; dig +short example.com',
            check: (c) => k.usó(c, /ip\s+(a|addr)/) && k.usó(c, /ping/) && k.usó(c, /dig|host/),
            diagnostico: [
              { cuando: (c) => !k.usó(c, /ip\s+(a|addr)/), titulo: 'Empieza por el primer peldaño', texto: 'Antes de nada hay que saber si la máquina tiene IP. Ejecuta `ip a`.' },
              { cuando: (c) => !k.usó(c, /ping/), titulo: 'Falta comprobar la conectividad', texto: 'Después de la IP, toca ver si llegas al gateway: `ping -c 2 192.168.1.1`.' },
            ],
          },
        ],
      },
    ],
    examen: [
      { pregunta: 'En `192.168.1.50/24`, ¿qué indica el /24?', opciones: ['La velocidad', 'Cuántos bits identifican a la red', 'El número de equipos conectados', 'El puerto'], correcta: 1, explicacion: '24 bits de red: todo lo que empiece por `192.168.1.` está en tu misma red.' },
      { pregunta: '`ping 8.8.8.8` funciona pero las webs no cargan. ¿Qué falla?', opciones: ['El cable', 'El DNS', 'El gateway', 'La tarjeta de red'], correcta: 1, explicacion: 'Sales a internet por IP, así que la conectividad está bien; lo que falla es la traducción de nombres.' },
      { pregunta: '¿Qué puerto usa HTTPS por defecto?', opciones: ['22', '80', '443', '8080'], correcta: 2, explicacion: '443 para HTTPS, 80 para HTTP y 22 para SSH.' },
      { pregunta: '¿Qué muestra `ss -tulpn`?', opciones: ['Los usuarios conectados', 'Los puertos en escucha y qué proceso los abre', 'La velocidad de red', 'Las rutas'], correcta: 1, explicacion: 'Es la forma estándar de auditar qué está expuesto en una máquina.' },
      { pregunta: '¿Para qué sirve el gateway?', opciones: ['Resolver nombres', 'Sacar el tráfico que va fuera de tu red', 'Asignar IPs', 'Cifrar la conexión'], correcta: 1, explicacion: 'Si el destino no está en tu red, el paquete se le entrega al gateway.' },
    ],
  },

  // ======================================================================
  {
    id: 'ssh',
    n: 13,
    nombre: 'SSH y acceso remoto',
    resumen: 'Entrar a otras máquinas de forma segura',
    comandos: ['ssh', 'scp', 'ssh-keygen', 'ssh-copy-id', 'rsync'],
    lecciones: [
      {
        id: 'ssh-basico',
        titulo: 'Conectarse',
        subtitulo: 'La herramienta con la que administrarás servidores',
        cuerpo: [
          { t: 'Una terminal en otra máquina', p: 'SSH abre una sesión cifrada contra un servidor remoto. Todo lo que has aprendido hasta aquí lo usarás por SSH: los servidores rara vez tienen pantalla.' },
          { f: [['ssh usuario@host', 'Conectar'], ['ssh -p 2222 usuario@host', 'Si el puerto no es el 22'], ['ssh usuario@host "comando"', 'Ejecutar algo y salir'], ['exit', 'Cerrar la sesión'], ['scp archivo usuario@host:/ruta', 'Copiar hacia el servidor'], ['scp usuario@host:/ruta .', 'Copiar desde el servidor'], ['rsync -avz origen destino/', 'Sincronizar, solo lo que cambió']] },
          { t: 'La huella del servidor', p: 'La primera vez te pregunta si confías en la huella del host. Está evitando que alguien se haga pasar por el servidor. Si esa huella cambia de golpe más adelante, SSH lo avisa a gritos: hay que investigarlo, no ignorarlo.' },
        ],
        retos: [
          {
            id: 'r13-ssh',
            enunciado: 'Conéctate a `servidor.local` con el usuario `user`.',
            snapshot: 'base',
            xp: 45,
            pistas: ['El formato es `ssh usuario@maquina`.', '`ssh user@servidor.local`'],
            solucion: 'ssh user@servidor.local',
            check: (c) => k.ultimoUsó(c, /ssh\s+\w+@servidor\.local/) && !k.salidaTiene(c, 'Could not resolve'),
          },
          {
            id: 'r13-scp',
            enunciado: 'Copia el archivo `notas.txt` al directorio `/tmp` de `servidor.local`, con el usuario `user`.',
            snapshot: 'inicio',
            xp: 60,
            pistas: ['`scp` usa la misma sintaxis, con dos puntos antes de la ruta remota.', '`scp notas.txt user@servidor.local:/tmp`'],
            solucion: 'scp notas.txt user@servidor.local:/tmp',
            check: (c) => k.ultimoUsó(c, /scp\s+notas\.txt\s+\w+@servidor\.local:/),
          },
        ],
      },
      {
        id: 'claves',
        titulo: 'Claves en vez de contraseñas',
        subtitulo: 'Más cómodo y muchísimo más seguro',
        cuerpo: [
          { t: 'Cómo funciona', p: 'Generas un par: una clave **privada** que no sale nunca de tu equipo y una **pública** que copias al servidor. El servidor te lanza un desafío que solo puede resolver quien tenga la privada. Nunca viaja ninguna contraseña.' },
          { f: [['ssh-keygen -t ed25519', 'Genera el par de claves'], ['~/.ssh/id_ed25519', 'La privada — NUNCA se comparte'], ['~/.ssh/id_ed25519.pub', 'La pública — esta es la que se copia'], ['ssh-copy-id usuario@host', 'Instala tu pública en el servidor'], ['~/.ssh/authorized_keys', 'Dónde acaba, en el servidor']] },
          { t: 'Por qué es más seguro', p: 'Una contraseña se puede adivinar por fuerza bruta; una clave ed25519 no. Por eso el primer paso de endurecer un servidor es pasar a claves y desactivar la autenticación por contraseña.' },
          { t: 'El archivo config', p: 'En `~/.ssh/config` guardas atajos: alias, usuario, puerto y clave por servidor. Así en vez de `ssh -p 2222 deploy@203.0.113.9` escribes `ssh produccion`.' },
          { c: '# ~/.ssh/config\nHost produccion\n    HostName 203.0.113.9\n    User deploy\n    Port 2222\n    IdentityFile ~/.ssh/id_ed25519' },
          { n: 'Los permisos de `~/.ssh` importan: la carpeta debe ser 700 y la clave privada 600. Si están más abiertos, SSH se niega a usarlas.' },
        ],
        retos: [
          {
            id: 'r13-keygen',
            enunciado: 'Crea la carpeta `.ssh` en tu directorio personal con los permisos correctos: solo tu usuario debe poder entrar y leerla (700).',
            snapshot: 'inicio',
            xp: 60,
            pistas: ['Primero `mkdir .ssh` y después ajusta los permisos.', '`mkdir .ssh && chmod 700 .ssh`'],
            solucion: 'mkdir .ssh && chmod 700 .ssh',
            check: (c) => k.esDir(c, '/home/user/.ssh') && k.modo(c, '/home/user/.ssh') === 0o700,
            diagnostico: [
              { cuando: (c) => k.esDir(c, '/home/user/.ssh') && k.modo(c, '/home/user/.ssh') !== 0o700, titulo: 'La carpeta existe pero los permisos no son 700', texto: 'SSH exige que `~/.ssh` sea privada. Ajusta con `chmod 700 .ssh`.' },
            ],
          },
          {
            id: 'r13-config',
            enunciado: 'Crea el archivo `.ssh/config` con una línea que defina el alias: `Host produccion`',
            snapshot: 'inicio',
            xp: 55,
            pistas: ['Puedes crear la carpeta y el archivo con `mkdir -p` y `echo`.', '`mkdir -p .ssh && echo "Host produccion" > .ssh/config`'],
            solucion: 'mkdir -p .ssh && echo "Host produccion" > .ssh/config',
            check: (c) => (k.contenido(c, '/home/user/.ssh/config') || '').includes('Host produccion'),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Cuál de las dos claves se copia al servidor?', opciones: ['La privada', 'La pública', 'Las dos', 'Ninguna'], correcta: 1, explicacion: 'Solo la pública, que acaba en `~/.ssh/authorized_keys`. La privada no sale nunca de tu equipo.' },
      { pregunta: '¿Qué permisos debe tener la clave privada?', opciones: ['777', '644', '600', '755'], correcta: 2, explicacion: 'Solo el dueño puede leerla y escribirla. Con permisos más abiertos, SSH se niega a usarla.' },
      { pregunta: '¿Por qué SSH avisa cuando cambia la huella de un servidor?', opciones: ['Por si actualizaron el sistema', 'Porque podría ser un impostor interceptando la conexión', 'Para pedir la contraseña', 'Es solo informativo'], correcta: 1, explicacion: 'Detecta un posible ataque de intermediario. Nunca se debe ignorar sin comprobar por qué cambió.' },
      { pregunta: '¿Qué hace `scp archivo user@host:/tmp`?', opciones: ['Ejecuta el archivo remoto', 'Copia el archivo local al servidor', 'Descarga el archivo', 'Sincroniza carpetas'], correcta: 1, explicacion: 'Los dos puntos separan la máquina de la ruta remota.' },
      { pregunta: '¿Para qué sirve `~/.ssh/config`?', opciones: ['Guardar contraseñas', 'Definir alias con usuario, puerto y clave por servidor', 'Registrar las conexiones', 'Configurar el servidor SSH'], correcta: 1, explicacion: 'Te ahorra escribir opciones largas. La configuración del servidor es otra cosa: `/etc/ssh/sshd_config`.' },
    ],
  },

  // ======================================================================
  {
    id: 'systemd',
    n: 14,
    nombre: 'Servicios, logs y tareas',
    resumen: 'systemd, journalctl y cron: mantener cosas funcionando',
    comandos: ['systemctl', 'journalctl', 'crontab', 'service', 'dmesg'],
    lecciones: [
      {
        id: 'systemctl',
        titulo: 'systemctl',
        subtitulo: 'Arrancar, parar y consultar servicios',
        cuerpo: [
          { t: 'Qué es un servicio', p: 'Un programa que corre en segundo plano permanentemente: el servidor web, la base de datos, SSH. systemd es quien los arranca al encender y los vigila.' },
          { f: [['systemctl status nginx', 'Cómo está y por qué falló'], ['sudo systemctl start nginx', 'Arrancarlo ahora'], ['sudo systemctl stop nginx', 'Pararlo'], ['sudo systemctl restart nginx', 'Reiniciarlo'], ['sudo systemctl enable nginx', 'Que arranque solo al encender'], ['sudo systemctl disable nginx', 'Que no arranque solo'], ['systemctl list-units --failed', 'Qué está roto']] },
          { t: 'start y enable no son lo mismo', p: '**start** lo arranca ahora pero no sobrevive a un reinicio. **enable** hace que arranque al encender pero no lo lanza ahora. Casi siempre quieres los dos: `sudo systemctl enable --now servicio`.' },
          { n: 'Al diagnosticar, `systemctl status` es la primera parada: dice si está activo, desde cuándo, con qué PID y las últimas líneas de su registro.' },
        ],
        retos: [
          {
            id: 'r14-status',
            enunciado: 'Comprueba el estado del servicio `render-worker`, que parece que da problemas.',
            snapshot: 'diagnostico',
            xp: 40,
            pistas: ['`systemctl status nombre`.', '`systemctl status render-worker`'],
            solucion: 'systemctl status render-worker',
            check: (c) => k.salidaTiene(c, 'render-worker', 'failed'),
          },
          {
            id: 'r14-failed',
            enunciado: 'Lista todos los servicios que están en estado fallido en esta máquina.',
            snapshot: 'diagnostico',
            xp: 55,
            pistas: ['Hay un subcomando específico para los fallidos.', '`systemctl list-failed` o `systemctl list-units --failed`'],
            solucion: 'systemctl list-failed',
            check: (c) => k.salidaTiene(c, 'render-worker'),
          },
          {
            id: 'r14-start',
            enunciado: 'Arranca el servicio `render-worker` y déjalo además configurado para que se inicie automáticamente al encender la máquina.',
            snapshot: 'diagnostico',
            xp: 75,
            pistas: ['Son dos cosas distintas: arrancarlo ahora (`start`) y activarlo al inicio (`enable`).', '`sudo systemctl start render-worker && sudo systemctl enable render-worker`'],
            solucion: 'sudo systemctl enable render-worker && sudo systemctl start render-worker',
            check: (c) => {
              const s = c.shell.state.services;
              return !!s && s['render-worker'] && s['render-worker'].active && s['render-worker'].enabled;
            },
            diagnostico: [
              { cuando: (c) => { const s = c.shell.state.services; return !!s && s['render-worker'].active && !s['render-worker'].enabled; }, titulo: 'Está arrancado, pero no sobrevive a un reinicio', texto: '`start` solo lo lanza ahora. Falta `sudo systemctl enable render-worker` para que arranque al encender.' },
              { cuando: (c) => { const s = c.shell.state.services; return !!s && !s['render-worker'].active && s['render-worker'].enabled; }, titulo: 'Arrancará al reiniciar, pero ahora sigue parado', texto: '`enable` no lo lanza. Falta `sudo systemctl start render-worker`.' },
              { cuando: (c) => k.salidaTiene(c, 'Interactive authentication required'), titulo: 'Falta sudo', texto: 'Controlar servicios del sistema requiere privilegios de administrador.' },
            ],
          },
        ],
      },
      {
        id: 'journalctl',
        titulo: 'journalctl: los registros',
        subtitulo: 'Donde está escrito qué pasó realmente',
        cuerpo: [
          { t: 'El diario del sistema', p: 'systemd guarda todo lo que escriben los servicios en un registro central. `journalctl` lo consulta y filtra.' },
          { f: [['journalctl -u nginx', 'Solo de ese servicio'], ['journalctl -n 50', 'Las 50 últimas líneas'], ['journalctl -f', 'En vivo, según van llegando'], ['journalctl -p err', 'Solo errores'], ['journalctl --since "1 hour ago"', 'Por tiempo'], ['journalctl -k', 'Mensajes del kernel']] },
          { t: 'El método', p: 'Cuando algo falla: `systemctl status` para ver el resumen, y luego `journalctl -u servicio -n 50` para leer qué dijo el programa justo antes de morir. La causa casi siempre está ahí escrita.' },
        ],
        retos: [
          {
            id: 'r14-journal',
            enunciado: 'Lee el registro del servicio `render-worker` para averiguar por qué falló.',
            snapshot: 'diagnostico',
            xp: 60,
            pistas: ['La opción para filtrar por unidad es `-u`.', '`journalctl -u render-worker`'],
            solucion: 'journalctl -u render-worker',
            check: (c) => k.salidaTiene(c, 'render-worker') && k.salidaTiene(c, 'ERROR'),
          },
          {
            id: 'r14-journal-err',
            enunciado: 'Filtra el registro del sistema para ver únicamente los mensajes de error.',
            snapshot: 'diagnostico',
            xp: 55,
            pistas: ['La prioridad se filtra con `-p`. El nivel de error se llama `err`.', '`journalctl -p err`'],
            solucion: 'journalctl -p err',
            check: (c) => k.salidaTiene(c, 'ERROR') && !k.salidaTiene(c, 'Accepted publickey'),
          },
        ],
      },
      {
        id: 'cron',
        titulo: 'cron: tareas programadas',
        subtitulo: 'Que se ejecute solo, a su hora',
        cuerpo: [
          { t: 'Cinco campos y un comando', p: 'Cada línea de un crontab dice cuándo y qué. El orden es minuto, hora, día del mes, mes y día de la semana. Un asterisco significa «todos».' },
          { c: '*  *  *  *  *  comando\n│  │  │  │  └── día de la semana (0-7, domingo = 0 y 7)\n│  │  │  └───── mes (1-12)\n│  │  └──────── día del mes (1-31)\n│  └─────────── hora (0-23)\n└────────────── minuto (0-59)' },
          { f: [['0 3 * * *', 'Todos los días a las 3:00'], ['*/15 * * * *', 'Cada 15 minutos'], ['0 9 * * 1', 'Los lunes a las 9:00'], ['30 2 1 * *', 'El día 1 de cada mes a las 2:30'], ['crontab -l', 'Ver tus tareas'], ['crontab -e', 'Editarlas']] },
          { n: 'El error más habitual: cron se ejecuta con un entorno mínimo, sin tu PATH. Usa siempre rutas absolutas en los comandos programados.' },
        ],
        retos: [
          {
            id: 'r14-cron',
            enunciado: 'Crea un archivo `mitarea.cron` con una línea que ejecute `/usr/local/bin/backup.sh` todos los días a las 3 de la mañana.',
            snapshot: 'inicio',
            xp: 70,
            pistas: ['A las 3:00 en punto es: minuto 0, hora 3, y el resto asteriscos.', '`echo "0 3 * * * /usr/local/bin/backup.sh" > mitarea.cron`'],
            solucion: 'echo "0 3 * * * /usr/local/bin/backup.sh" > mitarea.cron',
            check: (c) => {
              const t = (k.contenido(c, '/home/user/mitarea.cron') || '').trim();
              return /^0\s+3\s+\*\s+\*\s+\*\s+\/usr\/local\/bin\/backup\.sh/.test(t);
            },
            diagnostico: [
              { cuando: (c) => { const t = (k.contenido(c, '/home/user/mitarea.cron') || '').trim(); return t.startsWith('3 0'); }, titulo: 'Los campos están al revés', texto: 'El primer campo es el minuto y el segundo la hora. Las 3:00 se escriben `0 3`, no `3 0`.' },
            ],
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Cuál es la diferencia entre `start` y `enable`?', opciones: ['Ninguna', 'start lo arranca ahora, enable hace que arranque al encender', 'enable lo arranca ahora', 'start es permanente'], correcta: 1, explicacion: 'Para las dos cosas a la vez existe `systemctl enable --now servicio`.' },
      { pregunta: '¿Qué muestra `journalctl -u nginx -n 50`?', opciones: ['50 servicios', 'Las 50 últimas líneas del registro de nginx', 'Los errores de nivel 50', 'Nginx durante 50 segundos'], correcta: 1, explicacion: '`-u` filtra por unidad y `-n` limita el número de líneas.' },
      { pregunta: '¿Qué significa `*/15 * * * *` en cron?', opciones: ['A las 15:00', 'Cada 15 minutos', 'El día 15', 'Cada 15 horas'], correcta: 1, explicacion: 'El `*/15` en el campo de minutos significa «cada 15 minutos».' },
      { pregunta: 'Un servicio falla al arrancar. ¿Cuál es el primer comando?', opciones: ['reboot', 'systemctl status servicio', 'apt update', 'ps aux'], correcta: 1, explicacion: 'Da el estado, el motivo del fallo y las últimas líneas del registro, todo de golpe.' },
      { pregunta: '¿Por qué se usan rutas absolutas en cron?', opciones: ['Por elegancia', 'Porque cron corre con un entorno mínimo sin tu PATH', 'Porque es más rápido', 'No hace falta'], correcta: 1, explicacion: 'Es la causa número uno de «el script me funciona a mano pero no en cron».' },
    ],
  },
];
