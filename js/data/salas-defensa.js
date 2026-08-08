// Academia Defensa y forense · ruta «Operación y respuesta».
// De leer un registro a reconstruir un incidente entero. El hilo conductor es
// un servidor comprometido (snapshot `incidente`): un ataque de fuerza bruta,
// un acceso que sí entró, una cuenta creada por el atacante, un binario en
// /tmp y una tarea de persistencia. Cada sala aporta una pieza del parte.

import * as k from './checks.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';

const INC = 'incidente';

// ---------------------------------------------------------------------------
// 1. Leer registros
// ---------------------------------------------------------------------------

export const SALA_LOGS = {
  id: 'logs', n: 29, nombre: 'Leer los registros',
  resumen: 'Encontrar la señal entre el ruido: accesos, fallos y la línea de tiempo de lo que pasó',
  dificultad: 'Fácil', minutos: 35, comandos: ['journalctl', 'grep', 'cat', 'wc'], origen: 'v4-defensa',
  tareas: [
    {
      id: 'logs-donde', titulo: '1. Dónde vive la verdad', subtitulo: 'journalctl y /var/log',
      teoria: [
        { t: 'El sistema lo apunta todo', p: 'Cada servicio deja rastro. En un sistema con systemd, `journalctl` es la puerta de entrada; los servicios clásicos escriben además en ficheros dentro de `/var/log`, como `auth.log` para los accesos.' },
        { f: [['`journalctl`', 'el diario del sistema'], ['`journalctl -u servicio`', 'solo un servicio'], ['`/var/log/auth.log`', 'accesos y autenticación'], ['`journalctl --since`', 'desde una hora']] },
        { n: 'Empieza por el aviso', p: 'Antes de bucear, lee qué se reportó y cuándo. Eso acota la ventana temporal en la que mirar.' },
      ],
      practica: [
        terminal('logs-parte', 'Lee el aviso del incidente en `parte.txt` para saber qué se reportó y desde qué hora mirar.', INC, 'cat parte.txt', (c) => k.salidaTiene(c, 'INCIDENTE', '10:26'), ['`cat parte.txt`.']),
        respuesta('logs-r1', 'Según `parte.txt`, ¿a partir de qué hora está la ventana sospechosa?', ['10:26'], 'Todo lo relevante ocurre a partir de ese minuto: es donde concentrar la búsqueda.'),
        quiz('logs-q1', '¿Qué archivo registra los intentos de inicio de sesión?', ['/var/log/auth.log', '/etc/passwd', '/var/log/nginx/access.log', '/etc/crontab'], 0, '`auth.log` guarda autenticaciones: aciertos y fallos de SSH, sudo, etc.'),
        terminal('logs-journal', 'Muestra el diario del sistema para el servicio `ssh`.', INC, 'journalctl -u ssh', (c) => k.salidaTiene(c, 'ssh') || k.salidaTiene(c, 'Secure Shell'), ['`journalctl -u ssh`.']),
        completar('logs-c1', 'Completa la ruta del registro de autenticaciones.', 'cat /var/log/________', ['auth.log'], 'En Debian y derivados se llama `auth.log`.'),
      ],
    },
    {
      id: 'logs-filtrar', titulo: '2. Filtrar lo que importa', subtitulo: 'grep sobre los registros',
      teoria: [
        { t: 'Un log tiene miles de líneas; tú quieres cinco', p: '`grep` es tu cedazo. Buscas la palabra clave —`Failed`, `Accepted`, una IP— y el ruido desaparece.' },
        { c: 'grep Failed /var/log/auth.log\ngrep Accepted /var/log/auth.log' },
        { n: 'Contar también informa', p: '`grep -c` cuenta coincidencias. Cuarenta «Failed» de la misma IP en un minuto es un patrón de fuerza bruta, no un despiste.' },
      ],
      practica: [
        terminal('logs-failed', 'Filtra `/var/log/auth.log` para ver solo los intentos de acceso fallidos.', INC, 'grep Failed /var/log/auth.log', (c) => k.salidaTiene(c, 'Failed password', '45.12.9.3'), ['`grep Failed /var/log/auth.log`.']),
        terminal('logs-contar', 'Cuenta cuántos intentos fallidos hay en `/var/log/auth.log`.', INC, 'grep -c Failed /var/log/auth.log', (c) => k.salidaTiene(c, '4'), ['Añade `-c` a tu `grep`.']),
        respuesta('logs-r2', 'Ejecuta `grep -c Failed /var/log/auth.log`. ¿Cuántos intentos fallidos hay?', ['4'], 'Varios fallos seguidos desde la misma IP delatan un ataque de fuerza bruta.'),
        terminal('logs-accepted', 'Ahora filtra los accesos que SÍ tuvieron éxito.', INC, 'grep Accepted /var/log/auth.log', (c) => k.salidaTiene(c, 'Accepted', 'deploy'), ['`grep Accepted /var/log/auth.log`.']),
        ordenar('logs-o1', 'Construye la orden que cuenta las líneas con `Failed` en el registro.', barajar(['grep', '-c', 'Failed', '/var/log/auth.log'], 'logs-o1'), 'grep -c Failed /var/log/auth.log', 'La opción de contar es `-c`.', ['grep']),
        quiz('logs-q2', 'Ves 4 «Failed» y luego un «Accepted» desde la MISMA IP. ¿Qué sugiere?', ['Un ataque de fuerza bruta que acabó teniendo éxito', 'Un usuario despistado', 'Un fallo del disco', 'Nada raro'], 0, 'El patrón fallos→acierto desde una IP externa es la firma de un acceso forzado.'),
      ],
    },
    {
      id: 'logs-quien', titulo: '3. Quién entró y desde dónde', subtitulo: 'Extraer usuario e IP',
      teoria: [
        { t: 'Del log al dato accionable', p: 'La línea de un `Accepted` contiene el usuario, la IP de origen y la hora. Esos tres datos son el arranque de todo el informe: a quién suplantaron, desde dónde y cuándo.' },
        { c: 'Accepted password for deploy from 45.12.9.3 ... 10:27' },
      ],
      practica: [
        respuesta('logs-r3', 'Ejecuta `grep Accepted /var/log/auth.log`. ¿Qué usuario legítimo fue el primero en ser accedido por el atacante?', ['deploy'], 'La contraseña de `deploy`, filtrada en otra fase, fue la vía de entrada.'),
        respuesta('logs-r4', '¿Desde qué dirección IP se produjeron los accesos?', ['45.12.9.3'], 'Esa IP externa es el origen del ataque; conviene bloquearla y buscarla en otros registros.'),
        terminal('logs-ip', 'Filtra en `/var/log/auth.log` todas las líneas que mencionan la IP `45.12.9.3`.', INC, 'grep 45.12.9.3 /var/log/auth.log', (c) => k.salidaTiene(c, 'Failed', 'Accepted'), ['`grep 45.12.9.3 /var/log/auth.log`.']),
        completar('logs-c2', 'Completa la palabra que filtra los accesos con éxito.', 'grep ________ /var/log/auth.log', ['Accepted'], 'SSH escribe «Accepted» cuando la autenticación tiene éxito.'),
        quiz('logs-q3', 'Tienes usuario, IP y hora del acceso. ¿Para qué sirven en el informe?', ['Son el punto de partida: a quién, desde dónde y cuándo', 'No sirven de nada', 'Solo para rellenar', 'Para acelerar el servidor'], 0, 'Esos tres datos anclan toda la línea de tiempo del incidente.'),
      ],
    },
    {
      id: 'logs-timeline', titulo: '4. La línea de tiempo', subtitulo: 'Ordenar los hechos',
      teoria: [
        { t: 'Un incidente es una secuencia', p: 'Fuerza bruta → acceso con una cuenta → acción del atacante. Reconstruir ese orden a partir de las horas de los logs es la mitad de una investigación.' },
        { n: 'Guarda lo que encuentras', p: 'Cada línea relevante que rescates debería ir a un fichero de hallazgos: es el borrador del parte.' },
      ],
      practica: [
        terminal('logs-guardar', 'Guarda en `hallazgos/accesos.txt` las líneas de acceso con éxito.', INC, 'grep Accepted /var/log/auth.log > hallazgos/accesos.txt\ncat hallazgos/accesos.txt', (c) => k.existe(c, 'hallazgos/accesos.txt') && k.contenido(c, 'hallazgos/accesos.txt').includes('deploy'), ['`grep Accepted ... > hallazgos/accesos.txt`.']),
        terminal('logs-useradd', 'Busca en `/var/log/auth.log` si se creó alguna cuenta durante el incidente.', INC, 'grep useradd /var/log/auth.log', (c) => k.salidaTiene(c, 'backupsvc'), ['Filtra por `useradd`.']),
        respuesta('logs-r5', 'Según el registro, ¿qué cuenta nueva se creó durante el incidente?', ['backupsvc'], 'Una cuenta creada por el atacante es un mecanismo de persistencia: le permite volver.'),
        quiz('logs-q4', 'Ordena el incidente. ¿Qué ocurrió primero?', ['Los intentos fallidos de fuerza bruta', 'La creación de la cuenta nueva', 'El acceso con backupsvc', 'La tarea de persistencia'], 0, 'Primero la fuerza bruta; el acceso y la cuenta vienen después.'),
        ordenar('logs-o2', 'Construye la orden que guarda los accesos con éxito en un archivo de hallazgos.', barajar(['grep', 'Accepted', '/var/log/auth.log', '>', 'hallazgos/accesos.txt'], 'logs-o2'), 'grep Accepted /var/log/auth.log > hallazgos/accesos.txt', 'La redirección `>` va al final.', ['grep', 'redirecciones']),
      ],
    },
    {
      id: 'logs-cierre', titulo: '5. Primer resumen', subtitulo: 'De las líneas a los hechos',
      teoria: [
        { t: 'Lo que ya sabes', p: 'Hubo fuerza bruta desde `45.12.9.3`, entró con `deploy` a las 10:27 y creó `backupsvc` a las 10:31. Con eso ya tienes el esqueleto del parte; las siguientes salas rellenan el resto.' },
      ],
      practica: [
        terminal('logs-resumen-1', 'Cuenta cuántos accesos con éxito hubo en total.', INC, 'grep -c Accepted /var/log/auth.log', (c) => k.salidaTiene(c, '2'), ['`grep -c Accepted /var/log/auth.log`.']),
        respuesta('logs-r6', '¿Cuántos accesos con éxito registró el incidente?', ['2'], 'Dos: primero `deploy`, y luego la cuenta creada `backupsvc`.'),
        terminal('logs-primera-ip', 'Extrae solo la IP de origen guardándola: filtra las líneas con la IP y cuéntalas.', INC, 'grep -c 45.12.9.3 /var/log/auth.log', (c) => k.salidaTiene(c, '6'), ['`grep -c 45.12.9.3 /var/log/auth.log`.']),
        quiz('logs-q5', '¿Qué te falta averiguar todavía para cerrar el parte?', ['Qué hizo el atacante una vez dentro', 'El color del servidor', 'La marca del teclado', 'Nada, ya está'], 0, 'Sabes cómo entró; falta qué tocó: cuentas, ficheros y persistencia.'),
        completar('logs-c3', 'Completa la opción de grep que cuenta coincidencias en vez de mostrarlas.', 'grep __ Accepted /var/log/auth.log', ['-c', 'c'], '`-c` de «count».'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. Cuentas y accesos
// ---------------------------------------------------------------------------

export const SALA_CUENTAS = {
  id: 'cuentas', n: 30, nombre: 'Cuentas y accesos',
  resumen: 'Auditar quién puede entrar: usuarios, grupos, contraseñas y la cuenta que sobra',
  dificultad: 'Fácil', minutos: 35, comandos: ['cat', 'grep', 'cut', 'sort'], origen: 'v4-defensa',
  tareas: [
    {
      id: 'cuentas-passwd', titulo: '1. El censo del sistema', subtitulo: '/etc/passwd por dentro',
      teoria: [
        { t: 'Cada línea es una cuenta', p: '`/etc/passwd` tiene una fila por usuario, con campos separados por `:`. Los que importan: el nombre (1º), el UID (3º), el home (6º) y la shell (7º).' },
        { c: 'backupsvc:x:1050:1050:,,,:/home/backupsvc:/bin/bash' },
        { f: [['campo 1', 'nombre'], ['campo 3', 'UID'], ['campo 6', 'directorio home'], ['campo 7', 'shell de login']] },
      ],
      practica: [
        terminal('cuentas-passwd', 'Lista todas las cuentas leyendo `/etc/passwd`.', INC, 'cat /etc/passwd', (c) => k.salidaTiene(c, 'backupsvc', 'root'), ['`cat /etc/passwd`.']),
        terminal('cuentas-login', 'Filtra solo las cuentas que pueden iniciar sesión con `bash`.', INC, 'grep /bin/bash /etc/passwd', (c) => k.salidaTiene(c, 'backupsvc') && !k.ultimaSalida(c).includes('nologin'), ['`grep /bin/bash /etc/passwd`.']),
        ordenar('cuentas-o1', 'Construye la orden que extrae nombre y UID (campos 1 y 3) de `/etc/passwd`.', barajar(['cut', '-d:', '-f1,3', '/etc/passwd'], 'cuentas-o1'), 'cut -d: -f1,3 /etc/passwd', 'El separador es `:` y los campos se listan con comas.', ['cut']),
        terminal('cuentas-uid', 'Muestra solo el nombre y el UID de cada cuenta.', INC, 'cut -d: -f1,3 /etc/passwd', (c) => k.salidaTiene(c, 'backupsvc:1050'), ['`cut -d: -f1,3 /etc/passwd`.']),
        respuesta('cuentas-r1', 'Ejecuta `cut -d: -f1,3 /etc/passwd`. ¿Qué UID tiene la cuenta `backupsvc`?', ['1050'], 'Un UID alto y fuera de rango habitual, en una cuenta que nadie recuerda haber creado, es sospechoso.'),
        quiz('cuentas-q1', '¿Qué campo de `/etc/passwd` determina si una cuenta puede iniciar sesión?', ['La shell (último campo)', 'El UID', 'El nombre', 'El GID'], 0, 'Una shell real permite login; `/usr/sbin/nologin` lo impide.'),
      ],
    },
    {
      id: 'cuentas-sospechosa', titulo: '2. La cuenta que sobra', subtitulo: 'Detectar al intruso',
      teoria: [
        { t: 'Comparar con lo esperado', p: 'Un defensor conoce (o documenta) qué cuentas deberían existir. La que aparece de más —sobre todo con shell de login y home reciente— es candidata a ser del atacante.' },
        { n: 'Cruza con los logs', p: 'Si el nombre coincide con un `useradd` en `auth.log` durante la ventana del incidente, ya no es sospecha: es hallazgo.' },
      ],
      practica: [
        terminal('cuentas-cruce', 'Confirma en `/var/log/auth.log` que `backupsvc` se creó durante el incidente.', INC, 'grep backupsvc /var/log/auth.log', (c) => k.salidaTiene(c, 'new user') || k.salidaTiene(c, 'backupsvc'), ['`grep backupsvc /var/log/auth.log`.']),
        terminal('cuentas-home', 'Comprueba que existe un directorio personal para `backupsvc`.', INC, 'ls -la /home', (c) => k.salidaTiene(c, 'backupsvc'), ['`ls -la /home`.']),
        respuesta('cuentas-r2', '¿Cómo se llama la cuenta creada por el atacante?', ['backupsvc'], 'Nombre inocuo, apariencia de cuenta de servicio: así intentan pasar desapercibidas.'),
        quiz('cuentas-q2', '¿Por qué una cuenta nueva es un mecanismo de persistencia?', ['Le permite al atacante volver a entrar más tarde', 'Acelera el servidor', 'Cifra el disco', 'Borra los logs'], 0, 'Mientras la cuenta exista, el atacante conserva una puerta de entrada.'),
        ordenar('cuentas-o2', 'Construye la búsqueda de la cuenta sospechosa en el registro de accesos.', barajar(['grep', 'backupsvc', '/var/log/auth.log'], 'cuentas-o2'), 'grep backupsvc /var/log/auth.log', 'Filtras el nombre en el archivo de log.', ['grep']),
        completar('cuentas-c1', 'Completa el archivo que enumera todas las cuentas del sistema.', 'cat /etc/______', ['passwd'], '`/etc/passwd` es el censo de usuarios.'),
      ],
    },
    {
      id: 'cuentas-grupos', titulo: '3. Grupos y privilegios', subtitulo: 'Quién puede hacer sudo',
      teoria: [
        { t: 'No basta con entrar: importa el poder', p: 'Pertenecer al grupo `sudo` permite actuar como root. Revisar `/etc/group` te dice qué cuentas tienen ese privilegio, y si el atacante se lo ha dado.' },
        { c: 'sudo:x:27:user,ana' },
      ],
      practica: [
        terminal('cuentas-group', 'Lee `/etc/group` y localiza quién pertenece al grupo `sudo`.', INC, 'grep sudo /etc/group', (c) => k.salidaTiene(c, 'sudo'), ['`grep sudo /etc/group`.']),
        respuesta('cuentas-r3', 'Ejecuta `grep sudo /etc/group`. ¿La cuenta `backupsvc` aparece con privilegios sudo?', ['no'], 'Aquí no se los dio; comprobarlo es parte de acotar el daño.'),
        quiz('cuentas-q3', '¿Qué grupo suele conceder privilegios de administrador en Debian?', ['sudo', 'users', 'www-data', 'audio'], 0, 'Pertenecer al grupo `sudo` autoriza a ejecutar comandos como root.'),
        terminal('cuentas-id', 'Comprueba a qué grupos pertenece tu usuario actual.', INC, 'groups', (c) => k.ultimaSalida(c).trim().length > 0, ['`groups` sin argumentos muestra los tuyos.']),
        completar('cuentas-c2', 'Completa el archivo que define los grupos y sus miembros.', 'cat /etc/______', ['group'], '`/etc/group` relaciona cada grupo con sus usuarios.'),
      ],
    },
    {
      id: 'cuentas-contener', titulo: '4. Contener la cuenta', subtitulo: 'Bloquear sin borrar pruebas',
      teoria: [
        { t: 'Bloquear, no borrar', p: 'Ante una cuenta comprometida, el reflejo es borrarla; el error es que borras pruebas. Lo correcto es **bloquearla** —`passwd -l`— para que no pueda usarse, conservando todo para el análisis.' },
        { c: 'passwd -l backupsvc   # bloquea el acceso, mantiene la evidencia' },
        { n: 'Orden de la respuesta', p: 'Primero contener (que no siga el daño), después erradicar, y solo al final —con las pruebas ya guardadas— limpiar.' },
      ],
      practica: [
        quiz('cuentas-q4', 'Detectas la cuenta del atacante. ¿Qué haces primero?', ['Bloquearla para contener, sin destruir pruebas', 'Borrarla de inmediato', 'Ignorarla', 'Cambiarle el nombre'], 0, 'Contener preservando la evidencia es la prioridad; borrar destruye información del análisis.'),
        quiz('cuentas-q5', '¿Qué hace `passwd -l usuario`?', ['Bloquea la cuenta sin eliminarla', 'Borra el usuario', 'Le da privilegios de root', 'Cambia su shell'], 0, '`-l` («lock») deshabilita la contraseña, impidiendo el acceso.'),
        ordenar('cuentas-o3', 'Construye la orden que bloquea la cuenta `backupsvc` conservándola.', barajar(['passwd', '-l', 'backupsvc'], 'cuentas-o3'), 'passwd -l backupsvc', 'La opción de bloqueo es `-l`.', ['passwd']),
        respuesta('cuentas-r4', '¿Qué opción de `passwd` bloquea una cuenta sin borrarla?', ['-l', 'l'], '`-l` mantiene la cuenta y su rastro, pero impide iniciar sesión.'),
        completar('cuentas-c3', 'Completa el orden correcto de la respuesta a incidentes.', 'contener → ________ → limpiar', ['erradicar'], 'Contener, erradicar y limpiar, en ese orden.'),
      ],
    },
    {
      id: 'cuentas-cierre', titulo: '5. Cierra la pieza de cuentas', subtitulo: 'Documentar el hallazgo',
      teoria: [
        { t: 'Un hallazgo, una línea de informe', p: 'Cuenta `backupsvc`, UID 1050, creada a las 10:31 por el acceso de `deploy`. Con la evidencia guardada, esta parte del parte está lista.' },
      ],
      practica: [
        terminal('cuentas-doc', 'Guarda en `hallazgos/cuenta.txt` la línea de `/etc/passwd` de la cuenta sospechosa.', INC, 'grep backupsvc /etc/passwd > hallazgos/cuenta.txt\ncat hallazgos/cuenta.txt', (c) => k.existe(c, 'hallazgos/cuenta.txt') && k.contenido(c, 'hallazgos/cuenta.txt').includes('1050'), ['`grep backupsvc /etc/passwd > hallazgos/cuenta.txt`.']),
        terminal('cuentas-uid-alto', 'Lista los nombres de cuentas con UID de 1000 en adelante (las de personas).', INC, 'cut -d: -f1,3 /etc/passwd | sort', (c) => k.salidaTiene(c, 'backupsvc'), ['Encadena `cut` con `sort`.']),
        quiz('cuentas-q6', 'Ya documentaste la cuenta y la bloqueaste. ¿Qué pieza del incidente falta revisar?', ['Qué ficheros y tareas dejó el atacante', 'El color del terminal', 'La versión de bash', 'Nada'], 0, 'Falta el rastro en el sistema de ficheros: binarios y persistencia.'),
        respuesta('cuentas-r5', 'En la respuesta a incidentes, ¿qué haces con una cuenta comprometida antes de borrarla?', ['bloquearla', 'contenerla', 'bloquear'], 'Bloquear contiene el daño sin destruir la evidencia.'),
        ordenar('cuentas-o4', 'Construye la orden que guarda la línea de la cuenta sospechosa en un archivo.', barajar(['grep', 'backupsvc', '/etc/passwd', '>', 'hallazgos/cuenta.txt'], 'cuentas-o4'), 'grep backupsvc /etc/passwd > hallazgos/cuenta.txt', 'Filtra y redirige con `>`.', ['grep', 'redirecciones']),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. Cortafuegos
// ---------------------------------------------------------------------------

export const SALA_FIREWALL = {
  id: 'firewall', n: 31, nombre: 'Cortafuegos',
  resumen: 'Decidir qué entra y qué no: reglas con ufw, política por defecto y contraste con lo que escucha',
  dificultad: 'Intermedio', minutos: 35, comandos: ['ufw', 'iptables', 'ss', 'sudo'], origen: 'v4-defensa',
  tareas: [
    {
      id: 'fw-idea', titulo: '1. Para qué sirve un cortafuegos', subtitulo: 'Permitir y denegar',
      teoria: [
        { t: 'La puerta de la máquina', p: 'Un cortafuegos decide qué tráfico entra y sale. Aunque un servicio escuche, si el cortafuegos bloquea su puerto, desde fuera no se alcanza. Es la primera línea de contención.' },
        { f: [['`ufw status`', 'estado y reglas'], ['`ufw allow 22`', 'permite el puerto 22'], ['`ufw deny 23`', 'bloquea el 23'], ['`ufw default deny incoming`', 'todo denegado salvo lo permitido']] },
        { n: 'Denegar por defecto', p: 'La política sana es bloquear todo lo entrante y abrir solo lo imprescindible. Menos puertos abiertos, menos superficie de ataque.' },
      ],
      practica: [
        quiz('fw-q1', '¿Qué hace un cortafuegos?', ['Decide qué tráfico entra y sale', 'Cifra los archivos', 'Acelera la red', 'Borra los logs'], 0, 'Controla el tráfico según reglas; es contención, no cifrado.'),
        quiz('fw-q2', 'Un servicio escucha en el puerto 22 pero desde fuera no se alcanza. ¿Causa probable?', ['El cortafuegos bloquea ese puerto', 'El disco está lleno', 'Falta memoria', 'El DNS está mal'], 0, 'Escuchar no basta si el cortafuegos no deja pasar el tráfico a ese puerto.'),
        terminal('fw-status', 'Consulta el estado del cortafuegos con `ufw`.', INC, 'sudo ufw status', (c) => k.salidaTiene(c, 'Status'), ['`sudo ufw status`.']),
        completar('fw-c1', 'Completa el subcomando de ufw que muestra las reglas activas.', 'sudo ufw ______', ['status'], '`ufw status` resume política y reglas.'),
        respuesta('fw-r1', '¿Qué política por defecto para el tráfico entrante es la más segura?', ['deny', 'denegar', 'deny incoming'], 'Denegar todo lo entrante y abrir solo lo necesario reduce la superficie expuesta.'),
      ],
    },
    {
      id: 'fw-reglas', titulo: '2. Crear reglas', subtitulo: 'allow, deny y el orden',
      teoria: [
        { t: 'Abrir lo justo', p: 'Se permite lo imprescindible (SSH, web) y se deniega el resto. Cada regla es explícita: `ufw allow 22/tcp` abre SSH; `ufw deny 23` cierra telnet.' },
        { c: 'sudo ufw default deny incoming\nsudo ufw allow 22/tcp\nsudo ufw allow 80/tcp' },
        { n: 'Requiere privilegios', p: 'Cambiar reglas es tarea de root: por eso van con `sudo`.' },
      ],
      practica: [
        terminal('fw-allow', 'Permite el puerto 22 (SSH) en el cortafuegos.', INC, 'sudo ufw allow 22/tcp', (c) => k.salidaTiene(c, 'Rule added') || k.salidaTiene(c, 'añadida') || c.ultimo?.code === 0, ['`sudo ufw allow 22/tcp`.']),
        terminal('fw-deny', 'Bloquea el puerto 23 (telnet), que no debería estar abierto.', INC, 'sudo ufw deny 23', (c) => k.salidaTiene(c, 'Rule') || c.ultimo?.code === 0, ['`sudo ufw deny 23`.']),
        ordenar('fw-o1', 'Construye la regla que permite el puerto 80 en TCP.', barajar(['sudo', 'ufw', 'allow', '80/tcp'], 'fw-o1'), 'sudo ufw allow 80/tcp', '`sudo`, la herramienta, la acción y el puerto.', ['ufw']),
        quiz('fw-q3', '¿Qué hace `ufw default deny incoming`?', ['Deniega todo el tráfico entrante salvo lo permitido explícitamente', 'Abre todos los puertos', 'Apaga el cortafuegos', 'Borra las reglas'], 0, 'Es la base de una configuración segura: denegar por defecto.'),
        completar('fw-c2', 'Completa la acción que abre un puerto.', 'sudo ufw ______ 443/tcp', ['allow'], '`allow` permite; `deny` bloquea.'),
        respuesta('fw-r2', '¿Qué acción de ufw bloquea un puerto?', ['deny', 'denegar'], '`ufw deny <puerto>` cierra ese puerto al tráfico entrante.'),
      ],
    },
    {
      id: 'fw-ver', titulo: '3. Leer las reglas', subtitulo: 'ufw status e iptables -L',
      teoria: [
        { t: 'Dos vistas de lo mismo', p: '`ufw status` da el resumen legible; `iptables -L` enseña las reglas de bajo nivel que ufw genera. Saber leer ambas evita sorpresas.' },
        { c: 'sudo ufw status\nStatus: active\n22/tcp   ALLOW   Anywhere' },
      ],
      practica: [
        terminal('fw-status-2', 'Activa el cortafuegos y consulta su estado y reglas.', INC, 'sudo ufw enable\nsudo ufw status', (c) => k.salidaTiene(c, 'active') || k.salidaTiene(c, 'Status'), ['`sudo ufw enable` y luego `sudo ufw status`.']),
        terminal('fw-iptables', 'Muestra las reglas de bajo nivel con `iptables`.', INC, 'sudo iptables -L', (c) => k.salidaTiene(c, 'Chain'), ['`sudo iptables -L`.']),
        quiz('fw-q4', '¿Qué diferencia hay entre `ufw status` e `iptables -L`?', ['ufw es el resumen legible; iptables muestra las reglas de bajo nivel', 'Son comandos idénticos', 'iptables cifra el tráfico', 'ufw solo funciona en Windows'], 0, 'ufw es una capa cómoda sobre iptables/nftables.'),
        completar('fw-c3', 'Completa la opción de iptables que lista las reglas.', 'sudo iptables __', ['-L', 'L'], '`-L` de «list».'),
        respuesta('fw-r3', '¿Qué comando de ufw activa el cortafuegos?', ['ufw enable', 'sudo ufw enable', 'enable'], '`ufw enable` pone las reglas en vigor y las mantiene tras reiniciar.'),
      ],
    },
    {
      id: 'fw-contraste', titulo: '4. Contrastar con lo que escucha', subtitulo: 'Reglas frente a realidad',
      teoria: [
        { t: 'La comprobación que cierra el círculo', p: '`ss -tlpn` dice qué escucha de verdad; el cortafuegos dice qué se deja alcanzar. Un puerto que escucha y NO debería estar abierto es un riesgo; uno bloqueado que no escucha, ruido.' },
        { c: 'ss -tlpn        # qué escucha\nsudo ufw status # qué se permite' },
        { n: 'Aplicado al incidente', p: 'Si el atacante abrió un servicio, aparecerá escuchando en `ss` aunque no haya regla que lo justifique.' },
      ],
      practica: [
        terminal('fw-ss', 'Lista qué puertos TCP están a la escucha en la máquina.', INC, 'ss -tlpn', (c) => k.salidaTiene(c, 'LISTEN'), ['`ss -tlpn`.']),
        terminal('fw-contar', 'Cuenta cuántos servicios TCP están a la escucha.', INC, 'ss -tln | grep -c LISTEN', (c) => k.salidaTiene(c, '4'), ['Encadena `ss -tln` con `grep -c LISTEN`.']),
        quiz('fw-q5', 'Ves un puerto a la escucha que no corresponde a ningún servicio conocido ni regla. ¿Qué sospechas?', ['Que el atacante abrió un servicio propio', 'Que el servidor va lento', 'Que falta memoria', 'Nada'], 0, 'Un puerto escuchando sin justificación es una posible puerta trasera.'),
        ordenar('fw-o2', 'Construye la orden que cuenta los sockets TCP a la escucha.', barajar(['ss', '-tln', '|', 'grep', '-c', 'LISTEN'], 'fw-o2'), 'ss -tln | grep -c LISTEN', 'La tubería pasa la salida de `ss` a `grep -c`.', ['ss', 'pipes']),
        respuesta('fw-r4', '¿Qué comando te dice qué puertos escuchan de verdad, para contrastarlo con las reglas?', ['ss', 'ss -tlpn'], '`ss` lee los sockets reales del kernel.'),
      ],
    },
    {
      id: 'fw-cierre', titulo: '5. Endurecer tras el incidente', subtitulo: 'Cerrar lo que sobra',
      teoria: [
        { t: 'Reducir la superficie', p: 'Terminada la contención, se cierra todo lo innecesario: denegar por defecto, permitir solo SSH y web, y bloquear la IP del atacante. Menos abierto, menos por dónde volver.' },
        { c: 'sudo ufw default deny incoming\nsudo ufw deny from 45.12.9.3' },
      ],
      practica: [
        terminal('fw-default', 'Establece la política por defecto de denegar todo el tráfico entrante.', INC, 'sudo ufw default deny incoming', (c) => k.salidaTiene(c, 'deny') || c.ultimo?.code === 0, ['`sudo ufw default deny incoming`.']),
        terminal('fw-block-ip', 'Bloquea todo el tráfico procedente de la IP del atacante `45.12.9.3`.', INC, 'sudo ufw deny from 45.12.9.3', (c) => k.salidaTiene(c, 'Rule') || c.ultimo?.code === 0, ['`sudo ufw deny from 45.12.9.3`.']),
        quiz('fw-q6', '¿Por qué endurecer el cortafuegos tras un incidente?', ['Para reducir la superficie de ataque y cerrar vías de vuelta', 'Para que el servidor arranque antes', 'Para liberar disco', 'Por estética'], 0, 'Cerrar lo innecesario limita cómo y por dónde puede reintentar el atacante.'),
        ordenar('fw-o3', 'Construye la regla que bloquea todo el tráfico de la IP del atacante.', barajar(['sudo', 'ufw', 'deny', 'from', '45.12.9.3'], 'fw-o3'), 'sudo ufw deny from 45.12.9.3', 'Tras `deny` va `from` y la IP.', ['ufw']),
        respuesta('fw-r5', '¿Qué política por defecto aplicarías al tráfico entrante para endurecer el sistema?', ['deny', 'denegar', 'deny incoming'], 'Denegar por defecto y abrir solo lo imprescindible.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. Respuesta a incidentes
// ---------------------------------------------------------------------------

export const SALA_INCIDENTE = {
  id: 'respuesta', n: 32, nombre: 'Respuesta a incidentes',
  resumen: 'Reconstruir el ataque completo: rastros en el sistema de ficheros, persistencia y el parte final',
  dificultad: 'Avanzado', minutos: 40, comandos: ['find', 'stat', 'strings', 'sha256sum', 'cat'], origen: 'v4-defensa',
  tareas: [
    {
      id: 'resp-metodo', titulo: '1. El método de respuesta', subtitulo: 'De la alerta al parte',
      teoria: [
        { t: 'Un orden que evita destrozos', p: 'Identificar → contener → erradicar → recuperar → documentar. Saltarse pasos —borrar antes de recoger pruebas, limpiar antes de entender— destruye la investigación.' },
        { f: [['identificar', 'qué pasó y hasta dónde llega'], ['contener', 'frenar el daño en curso'], ['erradicar', 'quitar la presencia del atacante'], ['documentar', 'el parte con evidencia y arreglos']] },
        { n: 'La evidencia es sagrada', p: 'Cada acción sobre el sistema puede alterar pruebas. Se recoge y se hashea antes de tocar nada.' },
      ],
      practica: [
        quiz('resp-q1', '¿Cuál es el primer paso de la respuesta a un incidente?', ['Identificar qué pasó y su alcance', 'Formatear el servidor', 'Apagar la máquina', 'Borrar los logs'], 0, 'Sin entender el alcance, cualquier acción es a ciegas.'),
        quiz('resp-q2', '¿Por qué NO se borra al intruso nada más detectarlo?', ['Porque destruirías las pruebas del análisis', 'Porque es imposible', 'Porque tarda mucho', 'Porque no hace falta'], 0, 'Primero se recoge la evidencia; borrar antes la elimina para siempre.'),
        terminal('resp-parte', 'Repasa el aviso inicial del incidente en `parte.txt`.', INC, 'cat parte.txt', (c) => k.salidaTiene(c, 'INCIDENTE'), ['`cat parte.txt`.']),
        completar('resp-c1', 'Completa el paso que va entre contener y documentar.', 'contener → ________ → recuperar', ['erradicar'], 'Erradicar quita la presencia del atacante antes de recuperar el servicio.'),
        respuesta('resp-r1', 'Nombra el primer paso del método de respuesta.', ['identificar', 'identificacion'], 'Identificar el qué y el hasta dónde guía todo lo demás.'),
      ],
    },
    {
      id: 'resp-ficheros', titulo: '2. Rastros en el disco', subtitulo: 'Ficheros recién tocados',
      teoria: [
        { t: 'El atacante deja huellas', p: 'Herramientas, scripts y ficheros modificados durante el ataque quedan en el disco. `find` con `-newer` sobre una marca del inicio del incidente saca todo lo tocado desde entonces.' },
        { c: 'find /home -mindepth 1 -maxdepth 1 -newer /var/log/incidente.inicio' },
        { n: 'Sospecha de /tmp', p: 'Los directorios escribibles por todos, como `/tmp`, son el escondite favorito para binarios y, a menudo, empiezan por punto para no aparecer en un `ls` normal.' },
      ],
      practica: [
        terminal('resp-newer', 'Busca en `/home` qué directorios personales se crearon después del inicio del incidente.', INC, 'find /home -mindepth 1 -maxdepth 1 -newer /var/log/incidente.inicio', (c) => k.salidaTiene(c, 'backupsvc') && !k.ultimaSalida(c).includes('/home/ana'), ['`find /home -mindepth 1 -maxdepth 1 -newer /var/log/incidente.inicio`.']),
        terminal('resp-tmp', 'Lista el contenido de `/tmp`, incluidos los ficheros ocultos.', INC, 'ls -la /tmp', (c) => k.salidaTiene(c, '.sysupd'), ['`ls -la /tmp`: `-a` muestra los que empiezan por punto.']),
        respuesta('resp-r2', 'Ejecuta `ls -la /tmp`. ¿Qué fichero oculto y sospechoso aparece?', ['.sysupd', '/tmp/.sysupd'], 'Un binario oculto en /tmp, con nombre que imita algo del sistema, es una bandera roja.'),
        ordenar('resp-o1', 'Construye la búsqueda de lo tocado tras el inicio del incidente en `/home`.', barajar(['find', '/home', '-mindepth', '1', '-newer', '/var/log/incidente.inicio'], 'resp-o1'), 'find /home -mindepth 1 -newer /var/log/incidente.inicio', 'El fichero de referencia va tras `-newer`.', ['find']),
        quiz('resp-q3', '¿Por qué `/tmp` es un escondite habitual?', ['Es escribible por cualquiera y se limpia entre reinicios', 'Es invisible', 'Solo lo ve root', 'Está cifrado'], 0, 'Cualquiera puede escribir allí, y su volatilidad ayuda a borrar rastros.'),
        completar('resp-c2', 'Completa la opción de `ls` que revela los ficheros ocultos.', 'ls -l_ /tmp', ['a'], '`-a` incluye los nombres que empiezan por punto.'),
      ],
    },
    {
      id: 'resp-analizar', titulo: '3. Analizar el artefacto', subtitulo: 'strings, stat y hash',
      teoria: [
        { t: 'Interrogar al binario sin ejecutarlo', p: 'Nunca ejecutas el artefacto sospechoso. `strings` saca su texto legible —IPs, comandos, palabras clave—; `stat` da sus fechas; `sha256sum` genera una huella única para identificarlo.' },
        { c: 'strings /tmp/.sysupd\nconnect 45.12.9.3 4444' },
        { n: 'El hash es la ficha del artefacto', p: 'Con el SHA-256 puedes buscar si ese fichero ya se conoce como malicioso y demostrar que la copia que analizaste es exactamente esa.' },
      ],
      practica: [
        terminal('resp-strings', 'Extrae las cadenas legibles del binario sospechoso `/tmp/.sysupd`.', INC, 'strings /tmp/.sysupd', (c) => k.salidaTiene(c, '45.12.9.3') || k.salidaTiene(c, 'connect'), ['`strings /tmp/.sysupd`.']),
        respuesta('resp-r3', 'Ejecuta `strings /tmp/.sysupd`. ¿Qué IP aparece dentro del binario?', ['45.12.9.3'], 'La misma IP del ataque: el binario se conecta de vuelta al atacante. Es un implante.'),
        terminal('resp-stat', 'Consulta las fechas del binario con `stat` para situarlo en la línea de tiempo.', INC, 'stat /tmp/.sysupd', (c) => k.salidaTiene(c, 'sysupd') && (k.salidaTiene(c, 'Modify') || k.salidaTiene(c, '10:34')), ['`stat /tmp/.sysupd`.']),
        terminal('resp-hash', 'Calcula el hash SHA-256 del artefacto para poder identificarlo.', INC, 'sha256sum /tmp/.sysupd', (c) => /[0-9a-f]{64}/.test(k.ultimaSalida(c)), ['`sha256sum /tmp/.sysupd`.']),
        quiz('resp-q4', '¿Por qué usas `strings` en vez de ejecutar el binario?', ['Para analizarlo sin dispararlo y sin infectarte', 'Porque va más rápido', 'Porque no tienes permisos', 'Porque strings lo cifra'], 0, 'Ejecutar el artefacto podría activar el ataque; `strings` solo lee su contenido.'),
        respuesta('resp-r4', '¿Qué comando genera una huella única del fichero para identificarlo?', ['sha256sum', 'sha256'], 'El hash SHA-256 es la ficha del artefacto: identifica esa copia exacta.'),
      ],
    },
    {
      id: 'resp-persistencia', titulo: '4. Cortar la persistencia', subtitulo: 'El cron del atacante',
      teoria: [
        { t: 'Cómo vuelve el atacante', p: 'Además de la cuenta, la persistencia suele esconderse en tareas programadas. Una línea en `/etc/crontab` que ejecuta un binario sospechoso es una puerta que se reabre sola.' },
        { c: '*/10 * * * * deploy /tmp/.sysupd   ← ejecuta el implante cada 10 min' },
        { n: 'Erradicar', p: 'Se documenta la línea, se elimina la tarea, se bloquea la cuenta y se retira el binario. En ese orden y con la evidencia ya guardada.' },
      ],
      practica: [
        terminal('resp-cron', 'Lee `/etc/crontab` y localiza la tarea que ejecuta el binario sospechoso.', INC, 'cat /etc/crontab', (c) => k.salidaTiene(c, '.sysupd'), ['`cat /etc/crontab`.']),
        respuesta('resp-r5', 'Según `/etc/crontab`, ¿cada cuántos minutos se ejecuta el implante? Escribe el número.', ['10'], 'El `*/10` significa «cada 10 minutos»: así el atacante se reconecta periódicamente.'),
        terminal('resp-cron-grep', 'Filtra en `/etc/crontab` solo la línea que menciona `.sysupd`.', INC, 'grep .sysupd /etc/crontab', (c) => k.salidaTiene(c, 'sysupd') && !k.ultimaSalida(c).includes('run-parts'), ['`grep .sysupd /etc/crontab`.']),
        quiz('resp-q5', '¿Por qué revisas las tareas cron tras un incidente?', ['Son un escondite habitual de persistencia', 'Aceleran el disco', 'Cifran los logs', 'No aportan nada'], 0, 'Una tarea programada reejecuta el implante aunque cierres la sesión del atacante.'),
        ordenar('resp-o2', 'Construye el filtro que aísla la línea del implante en el crontab.', barajar(['grep', '.sysupd', '/etc/crontab'], 'resp-o2'), 'grep .sysupd /etc/crontab', 'Filtras el nombre del binario en el archivo.', ['grep']),
        completar('resp-c3', 'Completa el archivo del sistema donde vive la tarea de persistencia.', 'cat /etc/________', ['crontab'], '`/etc/crontab` define tareas programadas de todo el sistema.'),
      ],
    },
    {
      id: 'resp-parte', titulo: '5. El parte final', subtitulo: 'Reunir toda la evidencia',
      teoria: [
        { t: 'La historia completa', p: 'Fuerza bruta desde `45.12.9.3` → acceso con `deploy` → cuenta `backupsvc` → implante `/tmp/.sysupd` con cron cada 10 min. Cada afirmación, respaldada por su evidencia guardada.' },
        { c: 'grep Accepted /var/log/auth.log >  hallazgos/parte.txt\ngrep backupsvc /etc/passwd     >> hallazgos/parte.txt\nstrings /tmp/.sysupd           >> hallazgos/parte.txt' },
        { n: 'Cierra el círculo', p: 'El parte no solo cuenta qué pasó: recomienda qué cambiar para que no vuelva a pasar.' },
      ],
      practica: [
        terminal('resp-parte-1', 'Empieza el parte guardando los accesos con éxito en `hallazgos/parte.txt`.', INC, 'grep Accepted /var/log/auth.log > hallazgos/parte.txt\ncat hallazgos/parte.txt', (c) => k.existe(c, 'hallazgos/parte.txt') && k.contenido(c, 'hallazgos/parte.txt').includes('deploy'), ['`grep Accepted ... > hallazgos/parte.txt`.']),
        terminal('resp-parte-2', 'Añade al parte la cuenta sospechosa y las cadenas del implante, sin borrar lo anterior.', INC, 'grep Accepted /var/log/auth.log > hallazgos/parte.txt\ngrep backupsvc /etc/passwd >> hallazgos/parte.txt\nstrings /tmp/.sysupd >> hallazgos/parte.txt\ncat hallazgos/parte.txt', (c) => k.contenido(c, 'hallazgos/parte.txt').includes('backupsvc') && k.contenido(c, 'hallazgos/parte.txt').includes('45.12.9.3'), ['Añade con `>>` la línea de passwd y las `strings`.']),
        quiz('resp-q6', 'Reconstruye el orden del ataque. ¿Qué fue lo ÚLTIMO que hizo el atacante?', ['Dejar persistencia (cuenta y cron con el implante)', 'La fuerza bruta', 'El primer acceso con deploy', 'Escanear la red'], 0, 'La persistencia es lo último: asegura poder volver tras el acceso inicial.'),
        respuesta('resp-r6', 'Da la cadena completa de la respuesta a incidentes, empezando por el primer paso.', ['identificar', 'identificar contener erradicar recuperar documentar'], 'Identificar → contener → erradicar → recuperar → documentar.'),
        ordenar('resp-o3', 'Construye la orden que añade las cadenas del implante al parte.', barajar(['strings', '/tmp/.sysupd', '>>', 'hallazgos/parte.txt'], 'resp-o3'), 'strings /tmp/.sysupd >> hallazgos/parte.txt', 'El doble `>>` conserva lo ya escrito.', ['strings', 'redirecciones']),
      ],
    },
  ],
};

export const SALAS_DEFENSA = [SALA_LOGS, SALA_CUENTAS, SALA_FIREWALL, SALA_INCIDENTE];
