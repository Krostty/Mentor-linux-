// Academia Seguridad ofensiva · ruta «Metodología de auditoría».
// Los cuatro pasos de una auditoría autorizada —reconocimiento, enumeración,
// acceso y escalada— sobre un laboratorio simulado. Todo es local: ninguna
// orden contacta con un sistema real, y cada sala arranca recordando que sin
// autorización por escrito nada de esto es legítimo.

import * as k from './checks.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';

const SNAP = 'auditoria';

// ---------------------------------------------------------------------------
// 1. Reconocimiento
// ---------------------------------------------------------------------------

export const SALA_RECON = {
  id: 'recon', n: 25, nombre: 'Reconocimiento',
  resumen: 'Antes de tocar nada: confirmar el alcance, descubrir qué hay vivo y qué servicios expone',
  dificultad: 'Intermedio', minutos: 35, comandos: ['cat', 'nmap', 'nc', 'dig'], origen: 'v4-ofensiva',
  tareas: [
    {
      id: 'recon-alcance', titulo: '1. Primero, el permiso', subtitulo: 'Alcance, autorización y por qué importan',
      teoria: [
        { t: 'Sin autorización no es una auditoría, es un delito', p: 'Lo primero de cualquier trabajo es el documento de **alcance**: qué sistemas puedes tocar, cuándo, y quién lo firma. Salirte de ahí, aunque «no rompas nada», es acceso no autorizado.' },
        { c: 'Alcance: 10.30.0.0/24 y mentor.dev\nFuera de alcance: todo lo demás' },
        { n: 'En Mentor Linux', p: 'Todo lo que verás es un laboratorio local simulado. Las IP y los servicios son ficción; ninguna orden sale del dispositivo. Aun así, se practica con el mismo rigor: mirar el alcance antes de escanear.' },
      ],
      practica: [
        quiz('recon-q1', '¿Qué es lo primero que revisas antes de lanzar un solo comando?', ['El documento de alcance y autorización', 'La versión de nmap', 'Tu conexión a internet', 'El sistema operativo del objetivo'], 0, 'El alcance define qué es legítimo tocar. Sin él, cualquier escaneo es un acceso no autorizado.'),
        terminal('recon-leer-alcance', 'Lee el documento de alcance de esta auditoría en `alcance.txt`.', SNAP, 'cat alcance.txt', (c) => k.salidaTiene(c, 'AUTORIZADA', '10.30.0.0/24'), ['`cat alcance.txt`.']),
        respuesta('recon-r1', 'Según `alcance.txt`, ¿qué rango de red está autorizado? Escríbelo tal cual aparece.', ['10.30.0.0/24'], 'Solo ese rango y `mentor.dev` entran en el trabajo; cualquier otra dirección queda fuera.'),
        quiz('recon-q2', 'Encuentras un servidor interesante cuya IP NO está en el alcance. ¿Qué haces?', ['No lo tocas y lo consultas con quien autorizó', 'Lo escaneas rápido antes de que se den cuenta', 'Lo añades tú mismo al alcance', 'Lo ignoras y no lo mencionas'], 0, 'Ampliar el alcance es una decisión del cliente, nunca del auditor.'),
        completar('recon-c1', 'Completa el nombre del documento que autoriza y delimita el trabajo.', 'Documento de ______', ['alcance'], 'El alcance («scope») fija qué, cuándo y sobre qué puedes actuar.'),
      ],
    },
    {
      id: 'recon-vivos', titulo: '2. Qué hay vivo', subtitulo: 'Descubrimiento de hosts',
      teoria: [
        { t: 'Primero el mapa, luego el detalle', p: 'Antes de escanear puertos conviene saber qué máquinas responden. `nmap -sn` hace solo descubrimiento: comprueba quién está vivo sin tocar ningún puerto, así que es rápido y poco ruidoso.' },
        { c: 'nmap -sn 10.30.0.0/24\nHost is up: 10.30.0.15' },
        { n: 'Ruidoso frente a sigiloso', p: 'Un barrido completo se nota en cualquier registro. En un trabajo real se empieza suave y se justifica cada paso.' },
      ],
      practica: [
        terminal('recon-sn', 'Comprueba si el host `10.30.0.15` está vivo, sin escanear sus puertos.', SNAP, 'nmap -sn 10.30.0.15', (c) => k.salidaTiene(c, 'Host is up') && !k.ultimaSalida(c).includes('PORT'), ['La opción de solo descubrimiento es `-sn`.']),
        quiz('recon-q3', '¿Qué hace `nmap -sn`?', ['Descubre hosts vivos sin escanear puertos', 'Escanea todos los puertos', 'Detecta el sistema operativo', 'Explota vulnerabilidades'], 0, '`-sn` es «ping scan»: solo comprueba qué responde.'),
        ordenar('recon-o1', 'Construye el descubrimiento de hosts sobre `10.30.0.15`.', barajar(['nmap', '-sn', '10.30.0.15'], 'recon-o1'), 'nmap -sn 10.30.0.15', 'Comando, opción y objetivo.', ['nmap']),
        respuesta('recon-r2', '¿Qué opción de nmap descubre hosts vivos sin tocar sus puertos?', ['-sn', 'sn'], '`-sn` evita el escaneo de puertos: solo pregunta quién está.'),
        completar('recon-c2', 'Completa la opción que convierte un escaneo en simple descubrimiento.', 'nmap ___ 10.30.0.0/24', ['-sn'], 'Con `-sn` no se abre ningún puerto: solo se comprueba actividad.'),
      ],
    },
    {
      id: 'recon-puertos', titulo: '3. Qué servicios expone', subtitulo: 'Escaneo de puertos y versiones',
      teoria: [
        { t: 'Cada puerto abierto es una puerta', p: 'Una vez sabes que el host vive, escaneas sus puertos. `-sV` intenta además identificar el programa y la versión de cada servicio, que es lo que orienta el resto del trabajo.' },
        { c: 'nmap -sV 10.30.0.15\n22/tcp  open  ssh  OpenSSH 9.2p1\n80/tcp  open  http nginx 1.22.1' },
        { n: 'La versión es media auditoría', p: 'Saber la versión exacta permite comprobar si tiene fallos conocidos. Por eso ocultar banners es una defensa habitual.' },
      ],
      practica: [
        terminal('recon-sv', 'Escanea `10.30.0.15` identificando la versión de cada servicio.', SNAP, 'nmap -sV 10.30.0.15', (c) => k.salidaTiene(c, 'open', 'OpenSSH'), ['La detección de versión es `-sV`.']),
        terminal('recon-puerto', 'Escanea solo los puertos 22 y 443 de `10.30.0.15`.', SNAP, 'nmap -p 22,443 10.30.0.15', (c) => k.salidaTiene(c, '22/tcp', '443/tcp'), ['La lista de puertos va con `-p`.']),
        quiz('recon-q4', '¿Para qué sirve `-sV` en un escaneo?', ['Identificar el servicio y su versión', 'Descubrir hosts vivos', 'Saltarse el cortafuegos', 'Borrar los registros'], 0, 'Con la versión puedes buscar si ese software tiene vulnerabilidades conocidas.'),
        terminal('recon-banner', 'Lee el banner del servicio SSH conectándote al puerto 22 de `10.30.0.15`.', SNAP, 'nc 10.30.0.15 22', (c) => k.salidaTiene(c, 'SSH-2.0'), ['`nc 10.30.0.15 22`, sin `-z`.']),
        respuesta('recon-r3', 'Ejecuta `nmap -sV 10.30.0.15`. ¿Qué software sirve el puerto 22?', ['OpenSSH', 'ssh'], 'Conocer que es OpenSSH y su versión es el primer dato accionable.'),
        completar('recon-c3', 'Completa la opción que detecta versiones de servicio.', 'nmap ___ 10.30.0.15', ['-sV'], '`-sV` intenta encajar cada puerto con un servicio y versión conocidos.'),
      ],
    },
    {
      id: 'recon-notas', titulo: '4. Deja constancia', subtitulo: 'Un reconocimiento se documenta',
      teoria: [
        { t: 'Lo que no se anota, no ocurrió', p: 'Cada escaneo debe quedar guardado: qué se probó, contra qué y qué salió. Sin registro no hay informe, y sin informe el trabajo no vale.' },
        { c: 'nmap -sV 10.30.0.15 > hallazgos/recon.txt' },
      ],
      practica: [
        terminal('recon-guardar', 'Guarda el escaneo de versiones de `10.30.0.15` en `hallazgos/recon.txt` y compruébalo.', SNAP, 'nmap -sV 10.30.0.15 > hallazgos/recon.txt\ncat hallazgos/recon.txt', (c) => k.existe(c, 'hallazgos/recon.txt') && k.contenido(c, 'hallazgos/recon.txt').includes('OpenSSH'), ['Redirige con `>` a `hallazgos/recon.txt`.']),
        ordenar('recon-o2', 'Construye la orden que guarda el escaneo de versiones en el informe.', barajar(['nmap', '-sV', '10.30.0.15', '>', 'hallazgos/recon.txt'], 'recon-o2'), 'nmap -sV 10.30.0.15 > hallazgos/recon.txt', 'La redirección va al final.', ['nmap', 'redirecciones']),
        terminal('recon-contar', 'Cuenta cuántos puertos abiertos encontró tu escaneo guardado.', SNAP, "nmap 10.30.0.15 | grep -c open", (c) => k.salidaTiene(c, '4'), ['Conecta el escaneo con `grep -c open`.']),
        quiz('recon-q5', '¿Por qué se guarda la salida de cada escaneo?', ['Para tener evidencia trazable en el informe', 'Para que el escaneo sea más rápido', 'Para ocultarlo del objetivo', 'Porque nmap lo exige'], 0, 'La evidencia trazable es lo que convierte un hallazgo en un informe defendible.'),
        respuesta('recon-r4', 'En la secuencia recon → enumeración → acceso → escalada, ¿cuál es la fase que estás practicando ahora?', ['reconocimiento', 'recon'], 'El reconocimiento dibuja el mapa: qué hay y qué expone, antes de tocar nada a fondo.'),
      ],
    },
    {
      id: 'recon-repaso', titulo: '5. Cierra el reconocimiento', subtitulo: 'Del alcance al primer inventario',
      teoria: [
        { t: 'El orden que no falla', p: 'Alcance → hosts vivos → puertos y versiones → notas. Con eso tienes un inventario que justifica cada paso siguiente.' },
      ],
      practica: [
        terminal('recon-final-1', 'Vuelve a leer el alcance para confirmar que `10.30.0.15` entra en él.', SNAP, 'cat alcance.txt', (c) => k.salidaTiene(c, '10.30.0.0/24'), ['`cat alcance.txt`.']),
        terminal('recon-final-2', 'Comprueba con `-sn` que sigue vivo y anótalo en `hallazgos/vivos.txt`.', SNAP, 'nmap -sn 10.30.0.15 > hallazgos/vivos.txt\ncat hallazgos/vivos.txt', (c) => k.existe(c, 'hallazgos/vivos.txt') && k.contenido(c, 'hallazgos/vivos.txt').includes('Host is up'), ['Redirige la salida de `nmap -sn`.']),
        quiz('recon-q6', 'Ordena mentalmente: ¿qué va ANTES de escanear puertos?', ['Confirmar el alcance y que el host está vivo', 'Escalar privilegios', 'Leer user.txt', 'Instalar una puerta trasera'], 0, 'Sin confirmar alcance y actividad, el escaneo de puertos es prematuro y arriesgado.'),
        completar('recon-c4', 'Completa la fase que sigue al reconocimiento.', 'recon → ____________', ['enumeracion', 'enumeración'], 'Tras el mapa general viene la enumeración: mirar cada servicio de cerca.'),
        respuesta('recon-r5', '¿Qué opción de nmap usarías para NO tocar puertos y solo ver quién responde?', ['-sn', 'sn'], '`-sn` mantiene el reconocimiento ligero.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. Enumeración
// ---------------------------------------------------------------------------

export const SALA_ENUM = {
  id: 'enumeracion', n: 26, nombre: 'Enumeración',
  resumen: 'Mirar de cerca cada servicio: rutas web, usuarios del sistema y ficheros que hablan de más',
  dificultad: 'Intermedio', minutos: 35, comandos: ['curl', 'grep', 'cat', 'find'], origen: 'v4-ofensiva',
  tareas: [
    {
      id: 'enum-idea', titulo: '1. De la foto al detalle', subtitulo: 'Qué es enumerar',
      teoria: [
        { t: 'Enumerar es exprimir cada servicio', p: 'El reconocimiento dijo qué puertos hay. Enumerar es preguntarle a cada uno todo lo que suelte: rutas, versiones, usuarios, mensajes de error. Cuanto más enumeras, menos tienes que adivinar después.' },
        { n: 'La regla de oro', p: '«La enumeración lo es todo». La mayoría de los accesos no vienen de un exploit espectacular, sino de un dato que el servicio contaba y nadie miró.' },
      ],
      practica: [
        quiz('enum-q1', '¿Qué significa «enumerar» un servicio?', ['Sacarle todo el detalle posible: rutas, versiones, usuarios', 'Apagarlo', 'Cifrar su tráfico', 'Reiniciar la máquina'], 0, 'Enumerar es recopilar información concreta del servicio antes de intentar nada.'),
        quiz('enum-q2', '¿Por qué se dice que «la enumeración lo es todo»?', ['La mayoría de accesos salen de un dato mal protegido, no de un exploit', 'Porque es la fase más divertida', 'Porque nmap lo obliga', 'Porque borra los registros'], 0, 'Un usuario visible, una ruta olvidada o una contraseña en un fichero abren más puertas que cualquier exploit.'),
        terminal('enum-robots', 'Lee el `robots.txt` del servicio web de `10.30.0.15` para descubrir rutas que no quieren que se indexen.', SNAP, 'curl http://10.30.0.15/robots.txt', (c) => k.salidaTiene(c, 'Disallow', '/panel'), ['`curl http://10.30.0.15/robots.txt`.']),
        respuesta('enum-r1', 'Según ese `robots.txt`, ¿qué ruta «prohibida» aparece primero?', ['/panel'], 'Las rutas que se piden ocultar suelen ser justo las que interesa revisar en una auditoría autorizada.'),
        completar('enum-c1', 'Completa el archivo que revela rutas que el sitio no quiere indexar.', 'curl http://10.30.0.15/______', ['robots.txt'], '`robots.txt` es público y suele delatar rutas internas.'),
      ],
    },
    {
      id: 'enum-web', titulo: '2. Enumerar el servicio web', subtitulo: 'Rutas, cabeceras y respuestas',
      teoria: [
        { t: 'Cada código de respuesta es una pista', p: 'Un 200 en una ruta que no debería existir, un 403 que confirma que algo hay, un 301 que redirige a un panel: la web te habla a través de sus códigos.' },
        { f: [['200', 'existe y accesible'], ['403', 'existe, protegido: buena pista'], ['404', 'no existe'], ['301', 'redirige: sigue el rastro']] },
      ],
      practica: [
        terminal('enum-panel', 'Comprueba con solo las cabeceras qué responde la ruta `/panel` en `10.30.0.15`.', SNAP, 'curl -I http://10.30.0.15/panel', (c) => k.salidaTiene(c, '403') || k.salidaTiene(c, '200'), ['`curl -I http://10.30.0.15/panel`.']),
        terminal('enum-headers', 'Mira las cabeceras de la raíz web de `10.30.0.15` para identificar el servidor.', SNAP, 'curl -I http://10.30.0.15', (c) => k.salidaTiene(c, 'HTTP/1.1', 'Server'), ['`curl -I http://10.30.0.15`.']),
        quiz('enum-q3', 'Una ruta devuelve 403 en vez de 404. ¿Qué te dice eso?', ['Que existe, pero está protegida', 'Que no existe', 'Que el servidor está caído', 'Que hay un error de DNS'], 0, 'El 403 confirma la existencia del recurso: es más útil que un 404.'),
        ordenar('enum-o1', 'Construye la comprobación de cabeceras de la ruta `/copias`.', barajar(['curl', '-I', 'http://10.30.0.15/copias'], 'enum-o1'), 'curl -I http://10.30.0.15/copias', 'Con `-I` no descargas el cuerpo, solo miras el estado.', ['curl']),
        respuesta('enum-r2', '¿Qué código de respuesta te confirma que un recurso existe aunque no puedas verlo?', ['403'], 'El 403 «Forbidden» revela presencia; el 404 revela ausencia.'),
      ],
    },
    {
      id: 'enum-usuarios', titulo: '3. Usuarios del sistema', subtitulo: 'Quién puede iniciar sesión',
      teoria: [
        { t: '/etc/passwd es una lista de nombres', p: 'Es legible por todos y enumera todas las cuentas. Las que terminan en `/bin/bash` (u otra shell real) pueden iniciar sesión; las de `/usr/sbin/nologin` son de servicios.' },
        { c: 'deploy:x:1002:1002:...:/home/deploy:/bin/bash   ← puede entrar\nwww-data:x:33:33:...:/usr/sbin/nologin           ← no' },
        { n: 'Objetivo', p: 'Una lista de usuarios reales es la materia prima de un intento de acceso: nombres que probar contra SSH, contra un panel, etc.' },
      ],
      practica: [
        terminal('enum-passwd', 'Lista todas las cuentas del sistema leyendo `/etc/passwd`.', SNAP, 'cat /etc/passwd', (c) => k.salidaTiene(c, 'deploy', 'root'), ['`cat /etc/passwd`.']),
        terminal('enum-shells', 'Filtra `/etc/passwd` para quedarte solo con las cuentas que tienen shell `bash`.', SNAP, 'grep /bin/bash /etc/passwd', (c) => k.salidaTiene(c, 'deploy') && !k.ultimaSalida(c).includes('nologin'), ['`grep /bin/bash /etc/passwd`.']),
        ordenar('enum-o2', 'Construye la orden que extrae solo los nombres de usuario de `/etc/passwd`.', barajar(['cut', '-d:', '-f1', '/etc/passwd'], 'enum-o2'), 'cut -d: -f1 /etc/passwd', 'El separador es `:` y el campo del nombre es el primero.', ['cut']),
        terminal('enum-nombres', 'Extrae únicamente la primera columna (los nombres) de `/etc/passwd`.', SNAP, 'cut -d: -f1 /etc/passwd', (c) => k.salidaTiene(c, 'root', 'deploy') && !k.ultimaSalida(c).includes('/bin/bash'), ['`cut -d: -f1 /etc/passwd`.']),
        quiz('enum-q4', '¿Qué campo de `/etc/passwd` te dice si una cuenta puede iniciar sesión?', ['La shell del final de la línea', 'El número de UID', 'El nombre de usuario', 'El directorio home'], 0, 'Una shell real (`/bin/bash`) permite login; `/usr/sbin/nologin` lo impide.'),
        respuesta('enum-r3', 'Ejecuta `grep /bin/bash /etc/passwd`. ¿Qué cuenta de despliegue aparece con shell real?', ['deploy'], '`deploy` tiene shell de login: es un objetivo de acceso plausible.'),
      ],
    },
    {
      id: 'enum-ficheros', titulo: '4. Ficheros que hablan de más', subtitulo: 'Credenciales y permisos flojos',
      teoria: [
        { t: 'La contraseña suele estar escrita', p: 'Ficheros de configuración, scripts y copias de seguridad guardan credenciales en claro más veces de lo que parece. Un `grep` bien hecho encuentra en segundos lo que un exploit tardaría horas.' },
        { c: "grep -ri pass /var/www\nconfig.php:$db_pass = 'Verano2026!';" },
        { n: 'Permisos que no deberían', p: 'Un fichero de configuración legible por todos, o un script del sistema escribible por cualquiera, son hallazgos por sí mismos.' },
      ],
      practica: [
        terminal('enum-grep-pass', 'Busca de forma recursiva la palabra `pass` dentro de `/var/www/html`.', SNAP, 'grep -ri pass /var/www/html', (c) => k.salidaTiene(c, 'Verano2026', 'config.php'), ['`grep -ri pass /var/www/html`.']),
        respuesta('enum-r4', 'Ejecuta `grep -ri pass /var/www/html`. ¿Qué contraseña aparece en claro?', ['Verano2026!', 'Verano2026'], 'Una credencial en un fichero legible es un acceso servido en bandeja.'),
        terminal('enum-config', 'Lee el fichero `config.php` del sitio web para ver la configuración de la base de datos.', SNAP, 'cat /var/www/html/config.php', (c) => k.salidaTiene(c, 'db_user', 'appuser'), ['`cat /var/www/html/config.php`.']),
        ordenar('enum-o3', 'Construye la búsqueda recursiva e insensible a mayúsculas de `pass` en `/var/www`.', barajar(['grep', '-ri', 'pass', '/var/www'], 'enum-o3'), 'grep -ri pass /var/www', 'Las opciones `-r` y `-i` se combinan en una.', ['grep']),
        quiz('enum-q5', '¿Por qué una credencial en un fichero de configuración es un hallazgo grave?', ['Da acceso directo sin necesidad de romper nada', 'Ralentiza el servidor', 'Ocupa espacio en disco', 'Rompe el DNS'], 0, 'Reutilizada contra SSH o una base de datos, una contraseña filtrada suele ser la vía de acceso.'),
        terminal('enum-config-legible', 'Comprueba los permisos de `config.php`: ¿quién puede leerlo?', SNAP, 'ls -l /var/www/html/config.php', (c) => k.salidaTiene(c, 'config.php') && k.usó(c, /ls\s+-l/), ['`ls -l /var/www/html/config.php`.']),
      ],
    },
    {
      id: 'enum-cierre', titulo: '5. Ordena los hallazgos', subtitulo: 'De datos sueltos a un plan de acceso',
      teoria: [
        { t: 'Enumerar produce una lista de intentos', p: 'Al terminar tienes: usuarios reales, una contraseña filtrada y rutas web protegidas. Eso ya es un plan: probar esa contraseña con esos usuarios.' },
        { n: 'Documenta antes de actuar', p: 'Guardar los hallazgos ahora evita repetir escaneos y sostiene el informe.' },
      ],
      practica: [
        terminal('enum-recolectar', 'Guarda en `hallazgos/usuarios.txt` los nombres de cuentas con shell bash.', SNAP, 'grep /bin/bash /etc/passwd | cut -d: -f1 > hallazgos/usuarios.txt\ncat hallazgos/usuarios.txt', (c) => k.existe(c, 'hallazgos/usuarios.txt') && k.contenido(c, 'hallazgos/usuarios.txt').includes('deploy'), ['Encadena `grep` y `cut`, y redirige con `>`.']),
        terminal('enum-guardar-cred', 'Guarda en `hallazgos/credencial.txt` la línea de `config.php` que contiene la contraseña.', SNAP, 'grep pass /var/www/html/config.php > hallazgos/credencial.txt\ncat hallazgos/credencial.txt', (c) => k.existe(c, 'hallazgos/credencial.txt') && k.contenido(c, 'hallazgos/credencial.txt').includes('Verano2026'), ['`grep pass ... > hallazgos/credencial.txt`.']),
        quiz('enum-q6', 'Tienes usuarios reales y una contraseña filtrada. ¿Cuál es el siguiente paso lógico?', ['Probar esa contraseña con esos usuarios para intentar acceso', 'Reiniciar el servidor', 'Escanear otra red', 'Borrar los registros'], 0, 'La enumeración alimenta directamente la fase de acceso.'),
        ordenar('enum-o4', 'Construye la orden que extrae los nombres con shell bash a un archivo.', barajar(['grep', '/bin/bash', '/etc/passwd', '|', 'cut', '-d:', '-f1'], 'enum-o4'), 'grep /bin/bash /etc/passwd | cut -d: -f1', 'La tubería pasa el resultado de `grep` a `cut`.', ['grep', 'cut', 'pipes']),
        respuesta('enum-r5', '¿Qué fase de la auditoría viene justo después de enumerar?', ['acceso', 'acceso inicial'], 'Con los datos reunidos se intenta el primer acceso al sistema.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. Acceso inicial
// ---------------------------------------------------------------------------

export const SALA_ACCESO = {
  id: 'acceso', n: 27, nombre: 'Acceso inicial',
  resumen: 'Convertir un dato enumerado en una sesión: probar credenciales, entrar y moverse con cuidado',
  dificultad: 'Avanzado', minutos: 35, comandos: ['ssh', 'nc', 'base64', 'sha256sum'], origen: 'v4-ofensiva',
  tareas: [
    {
      id: 'acceso-idea', titulo: '1. De la información al acceso', subtitulo: 'Qué es «acceso inicial»',
      teoria: [
        { t: 'El primer pie dentro', p: 'Acceso inicial es conseguir la primera sesión en el objetivo, normalmente como un usuario sin privilegios. Casi siempre sale de la enumeración: una credencial reutilizada, un servicio mal configurado.' },
        { n: 'Con permiso y con cuidado', p: 'En un trabajo real, cada acción se registra y se acota. Aquí, en el laboratorio, se practica el gesto: usar lo enumerado para entrar de forma limpia.' },
      ],
      practica: [
        quiz('acceso-q1', '¿Qué es el «acceso inicial»?', ['La primera sesión en el objetivo, normalmente sin privilegios', 'Ser root desde el principio', 'Escanear la red', 'Leer robots.txt'], 0, 'El acceso inicial es el punto de apoyo; los privilegios vienen después.'),
        quiz('acceso-q2', '¿De dónde suele salir el acceso inicial?', ['De un dato obtenido enumerando', 'De adivinar al azar', 'De reiniciar el servidor', 'De un escaneo de puertos a secas'], 0, 'Credenciales reutilizadas, servicios expuestos o ficheros filtrados: todo viene de enumerar.'),
        respuesta('acceso-r1', 'De la sala anterior: ¿qué contraseña filtrada vas a probar?', ['Verano2026!', 'Verano2026'], 'Era la del `config.php`; se prueba contra los usuarios reales encontrados.'),
        completar('acceso-c1', 'Completa la fase previa de la que sale el acceso inicial.', 'La ______ alimenta el acceso', ['enumeracion', 'enumeración'], 'Sin enumeración, el acceso es adivinar.'),
      ],
    },
    {
      id: 'acceso-ssh', titulo: '2. Entrar por SSH', subtitulo: 'Usuario, host y primera sesión',
      teoria: [
        { t: 'SSH es la puerta más común', p: 'Con un usuario y una credencial válidos, `ssh usuario@host` abre una sesión remota. Es el camino habitual del primer acceso cuando el puerto 22 está expuesto.' },
        { c: 'ssh deploy@10.30.0.15\nWelcome to Linux' },
        { n: 'En el laboratorio', p: 'La conexión es simulada: no sale del dispositivo. Practicas la sintaxis y el flujo, no un ataque real.' },
      ],
      practica: [
        ordenar('acceso-o1', 'Construye el acceso por SSH al usuario `deploy` en `10.30.0.15`.', barajar(['ssh', 'deploy@10.30.0.15'], 'acceso-o1'), 'ssh deploy@10.30.0.15', 'El formato es `usuario@host`.', ['ssh']),
        completar('acceso-c2', 'Completa el separador entre usuario y host en una conexión SSH.', 'ssh deploy_10.30.0.15', ['@'], 'La arroba une usuario y máquina: `usuario@host`.'),
        quiz('acceso-q3', 'En `ssh deploy@10.30.0.15`, ¿qué es `deploy`?', ['El usuario con el que inicias sesión', 'El nombre de la máquina', 'El puerto', 'La contraseña'], 0, 'Antes de la arroba va el usuario; después, el host.'),
        respuesta('acceso-r2', '¿Qué puerto usa SSH por defecto y conviene comprobar antes de conectar?', ['22'], 'Si el 22 no está abierto, no habrá acceso por SSH.'),
        quiz('acceso-q4', 'Antes de intentar `ssh`, ¿qué compruebas para no perder el tiempo?', ['Que el puerto 22 esté abierto', 'Que el servidor tenga web', 'Tu velocidad de descarga', 'La versión de tu navegador'], 0, 'Comprobar el puerto con `nc -zv host 22` evita intentos contra un servicio cerrado.'),
      ],
    },
    {
      id: 'acceso-transferir', titulo: '3. Mover datos con cuidado', subtitulo: 'base64 y verificación',
      teoria: [
        { t: 'Cuando no hay scp a mano', p: 'A veces solo tienes una terminal. Codificar un fichero pequeño en **base64** permite copiar su contenido como texto y reconstruirlo al otro lado. No es cifrado: es transporte.' },
        { c: 'base64 archivo          # a texto\nbase64 -d texto > copia  # de vuelta' },
        { n: 'Verifica siempre', p: 'Tras mover un fichero, `sha256sum` en ambos lados debe dar el mismo hash. Si no coincide, la copia se corrompió.' },
      ],
      practica: [
        terminal('acceso-b64', 'Codifica en base64 el contenido de `alcance.txt`.', SNAP, 'base64 alcance.txt', (c) => k.ultimaSalida(c).length > 20 && !k.ultimaSalida(c).includes(' '), ['`base64 alcance.txt`.']),
        terminal('acceso-hash', 'Calcula el hash SHA-256 de `alcance.txt` para poder verificar una copia después.', SNAP, 'sha256sum alcance.txt', (c) => k.salidaTiene(c, 'alcance.txt') && /[0-9a-f]{64}/.test(k.ultimaSalida(c)), ['`sha256sum alcance.txt`.']),
        ordenar('acceso-o2', 'Construye la orden que decodifica `datos.b64` y lo guarda en `copia.txt`.', barajar(['base64', '-d', 'datos.b64', '>', 'copia.txt'], 'acceso-o2'), 'base64 -d datos.b64 > copia.txt', 'La opción de decodificar es `-d`, y la redirección va al final.', ['base64', 'redirecciones']),
        quiz('acceso-q5', '¿Qué NO hace base64?', ['Cifrar: cualquiera puede decodificarlo', 'Convertir binario en texto', 'Permitir copiar por una terminal', 'Reconstruir el fichero original'], 0, 'base64 es codificación, no cifrado: no protege nada, solo transporta.'),
        respuesta('acceso-r3', '¿Qué comando comprueba que dos copias de un fichero son idénticas?', ['sha256sum', 'sha256'], 'Si el hash coincide en ambos lados, la copia es exacta.'),
      ],
    },
    {
      id: 'acceso-buscar-flag', titulo: '4. La primera bandera', subtitulo: 'Encontrar user.txt',
      teoria: [
        { t: 'La prueba de que entraste', p: 'En los laboratorios, un fichero `user.txt` en el home del usuario demuestra el acceso. Encontrarlo suele ser cuestión de un `find` bien puesto.' },
        { c: 'find / -name user.txt 2>/dev/null' },
        { n: '2>/dev/null', p: 'Redirige los errores de «permiso denegado» a la nada, para que solo veas los resultados útiles.' },
      ],
      practica: [
        terminal('acceso-find', 'Busca en todo el sistema un fichero llamado `alcance.txt`, descartando los errores de permiso.', SNAP, 'find / -name alcance.txt 2>/dev/null', (c) => k.salidaTiene(c, 'alcance.txt'), ['`find / -name alcance.txt 2>/dev/null`.']),
        ordenar('acceso-o3', 'Construye la búsqueda por nombre de `user.txt` en todo el sistema, sin errores en pantalla.', barajar(['find', '/', '-name', 'user.txt', '2>/dev/null'], 'acceso-o3'), 'find / -name user.txt 2>/dev/null', 'La ruta de inicio es `/` y los errores se mandan a `/dev/null`.', ['find']),
        quiz('acceso-q6', '¿Para qué sirve `2>/dev/null` en un `find`?', ['Descartar los errores de permiso y dejar solo los resultados', 'Buscar más rápido', 'Guardar el resultado en un archivo', 'Ejecutar como root'], 0, '`2>` redirige la salida de error; `/dev/null` la descarta.'),
        completar('acceso-c3', 'Completa el destino que descarta los mensajes de error.', 'find / -name user.txt 2>______', ['/dev/null'], '`/dev/null` es el «agujero negro» del sistema.'),
        respuesta('acceso-r4', '¿Qué descriptor representa la salida de error, la que redirige `2>`?', ['2'], '0 es stdin, 1 stdout y 2 stderr.'),
      ],
    },
    {
      id: 'acceso-cierre', titulo: '5. Consolidar el acceso', subtitulo: 'Documentar y preparar la escalada',
      teoria: [
        { t: 'Ya estás dentro, ¿y ahora?', p: 'Con la primera sesión, el objetivo cambia: pasar de usuario normal a administrador. Pero antes se anota cómo se entró y desde dónde se parte.' },
        { n: 'El puente a la última fase', p: 'La escalada de privilegios es el siguiente paso, y empieza por mirar qué puede hacer tu usuario que no debería.' },
      ],
      practica: [
        terminal('acceso-quien', 'Confirma con qué identidad estás operando ahora mismo.', SNAP, 'whoami', (c) => k.ultimaSalida(c).trim().length > 0, ['`whoami`.']),
        terminal('acceso-guardar', 'Guarda en `hallazgos/acceso.txt` tu usuario actual y tu carpeta.', SNAP, 'whoami > hallazgos/acceso.txt\npwd >> hallazgos/acceso.txt\ncat hallazgos/acceso.txt', (c) => k.existe(c, 'hallazgos/acceso.txt') && k.contenido(c, 'hallazgos/acceso.txt').includes('/home'), ['`whoami > ...` y luego `pwd >> ...`.']),
        quiz('acceso-q7', 'Ya tienes acceso como usuario normal. ¿Cuál es el objetivo de la siguiente fase?', ['Escalar a administrador (root)', 'Volver a escanear la red', 'Cerrar la sesión', 'Reinstalar el sistema'], 0, 'La escalada de privilegios convierte el acceso inicial en control total.'),
        completar('acceso-c4', 'Completa la última fase de la metodología.', 'acceso → ____________ de privilegios', ['escalada'], 'La escalada de privilegios es el último paso de la cadena.'),
        respuesta('acceso-r5', 'Nombra la cadena completa de fases en orden, empezando por la primera.', ['reconocimiento', 'reconocimiento enumeracion acceso escalada'], 'Reconocimiento → enumeración → acceso → escalada.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. Escalada de privilegios
// ---------------------------------------------------------------------------

export const SALA_ESCALADA = {
  id: 'escalada', n: 28, nombre: 'Escalada de privilegios',
  resumen: 'De usuario normal a root: los caminos clásicos —sudo, SUID, capabilities y cron— y cómo documentarlos',
  dificultad: 'Avanzado', minutos: 40, comandos: ['sudo', 'find', 'getcap', 'cat', 'ls'], origen: 'v4-ofensiva',
  tareas: [
    {
      id: 'esc-idea', titulo: '1. Qué es escalar', subtitulo: 'De un usuario a otro con más poder',
      teoria: [
        { t: 'Subir de privilegios', p: 'Escalar es pasar de tu usuario a uno con más permisos, normalmente **root**. No se rompe nada nuevo: se aprovecha una configuración descuidada que ya estaba ahí.' },
        { f: [['`sudo -l`', 'qué puedes ejecutar como root'], ['SUID', 'binarios que corren como su dueño'], ['capabilities', 'permisos finos sobre un binario'], ['cron', 'tareas programadas que ejecuta root']] },
        { n: 'El patrón común', p: 'Casi toda escalada es lo mismo: encontrar algo que se ejecuta con más privilegios que tú y que tú puedes influir.' },
      ],
      practica: [
        quiz('esc-q1', '¿Qué es escalar privilegios?', ['Pasar a un usuario con más permisos aprovechando una mala configuración', 'Instalar más programas', 'Escanear más puertos', 'Cambiar la contraseña de root a ciegas'], 0, 'Se aprovecha algo mal configurado que ya existe; no se «rompe» nada nuevo.'),
        quiz('esc-q2', '¿Cuál es el usuario objetivo habitual de una escalada?', ['root', 'www-data', 'nobody', 'guest'], 0, 'root tiene control total del sistema.'),
        terminal('esc-sudo-l', 'Comprueba qué comandos puede ejecutar tu usuario como root con `sudo`.', SNAP, 'sudo -l', (c) => k.salidaTiene(c, 'may run'), ['`sudo -l` lista tu política de sudo.']),
        respuesta('esc-r1', '¿Qué comando lista lo que puedes ejecutar como root sin ser root?', ['sudo -l', 'sudo-l'], '`sudo -l` es la primera comprobación de toda escalada.'),
        completar('esc-c1', 'Completa la opción de sudo que enumera tus permisos.', 'sudo __', ['-l', 'l'], '`-l` de «list».'),
      ],
    },
    {
      id: 'esc-suid', titulo: '2. Binarios SUID', subtitulo: 'Programas que corren como su dueño',
      teoria: [
        { t: 'El bit que cambia de identidad', p: 'Un binario con el bit **SUID** se ejecuta con los permisos de su dueño, no de quien lo lanza. Si el dueño es root y el binario permite hacer cosas inesperadas, tienes una vía.' },
        { c: 'find / -perm -4000 -type f 2>/dev/null' },
        { n: 'Lo normal y lo sospechoso', p: '`passwd` o `sudo` son SUID de fábrica. Un binario raro con SUID —uno que no debería estarlo— es el hallazgo.' },
      ],
      practica: [
        terminal('esc-find-suid', 'Busca en todo el sistema los binarios con el bit SUID, descartando errores.', SNAP, 'find / -perm -4000 -type f 2>/dev/null', (c) => k.salidaTiene(c, 'passwd') && k.salidaTiene(c, 'reporte'), ['`find / -perm -4000 -type f 2>/dev/null`.']),
        respuesta('esc-r2', 'En la lista de SUID aparece un binario en `/usr/local/bin` que no es estándar. ¿Cómo se llama?', ['reporte', '/usr/local/bin/reporte'], 'Un SUID fuera de los binarios habituales del sistema es siempre sospechoso.'),
        ordenar('esc-o1', 'Construye la búsqueda de binarios SUID en todo el sistema, sin errores en pantalla.', barajar(['find', '/', '-perm', '-4000', '-type', 'f', '2>/dev/null'], 'esc-o1'), 'find / -perm -4000 -type f 2>/dev/null', 'El permiso SUID se busca con `-perm -4000`.', ['find', 'permisos']),
        quiz('esc-q3', '¿Qué hace especial a un binario SUID?', ['Se ejecuta con los permisos de su dueño, no de quien lo lanza', 'No se puede borrar', 'Solo lo ve root', 'Va más rápido'], 0, 'Si el dueño es root, el binario corre como root aunque lo lances tú.'),
        completar('esc-c2', 'Completa el valor de permiso que localiza binarios SUID.', 'find / -perm -____ -type f', ['4000'], 'El 4 inicial es el bit SUID.'),
        terminal('esc-ver-suid', 'Mira los permisos del binario `/usr/local/bin/reporte` para confirmar el bit SUID.', SNAP, 'ls -l /usr/local/bin/reporte', (c) => k.salidaTiene(c, 'reporte') && k.ultimaSalida(c).includes('s'), ['`ls -l /usr/local/bin/reporte`: la `s` en los permisos es el SUID.']),
      ],
    },
    {
      id: 'esc-sudo', titulo: '3. Reglas de sudo peligrosas', subtitulo: 'Un permiso demasiado generoso',
      teoria: [
        { t: 'No todo sudo es igual', p: 'Poder ejecutar UN comando como root puede bastar. Si `sudo -l` te deja lanzar un programa que a su vez permite ejecutar otras cosas o leer cualquier fichero, la escalada está servida.' },
        { c: 'deploy ALL=(root) NOPASSWD: /usr/bin/find' },
        { n: 'Por qué find es peligroso ahí', p: '`find` puede ejecutar comandos con `-exec`. Si lo lanzas como root vía sudo, ejecutas lo que quieras como root. Por eso una regla así es un fallo de configuración.' },
      ],
      practica: [
        terminal('esc-sudoers', 'Lee la política de sudo del sistema (con privilegios) para ver las reglas concretas.', SNAP, 'sudo cat /etc/sudoers', (c) => k.salidaTiene(c, 'deploy', '/usr/bin/find'), ['`sudo cat /etc/sudoers`.']),
        respuesta('esc-r3', 'Según `/etc/sudoers`, ¿qué comando puede ejecutar `deploy` como root sin contraseña? Escribe la ruta.', ['/usr/bin/find', 'find'], '`find` con `-exec` permite ejecutar cualquier orden: por eso esa regla es un agujero.'),
        quiz('esc-q4', '¿Por qué es peligrosa la regla `NOPASSWD: /usr/bin/find` para un usuario?', ['find puede ejecutar comandos con -exec, y aquí correría como root', 'find borra el disco', 'find abre puertos', 'No es peligrosa'], 0, 'Un comando que puede lanzar otros comandos, ejecutado como root, es una escalada directa.'),
        quiz('esc-q5', 'Tras `sudo -l`, ¿qué buscas en la lista?', ['Un comando que permita ejecutar o leer más de lo previsto', 'El más largo', 'El que empiece por a', 'Ninguno: siempre es seguro'], 0, 'Editores, intérpretes o comandos con `-exec` en la lista de sudo suelen ser la vía.'),
        completar('esc-c3', 'Completa la palabra que, en una regla de sudo, indica que no pide contraseña.', 'deploy ALL=(root) ________: /usr/bin/find', ['NOPASSWD'], '`NOPASSWD` hace la escalada aún más cómoda para un atacante.'),
        ordenar('esc-o2', 'Construye la orden que lee el fichero de política de sudo con privilegios.', barajar(['sudo', 'cat', '/etc/sudoers'], 'esc-o2'), 'sudo cat /etc/sudoers', '`sudo` va delante del comando que quieres elevar.', ['sudo']),
      ],
    },
    {
      id: 'esc-otros', titulo: '4. Capabilities y tareas cron', subtitulo: 'Otros dos caminos clásicos',
      teoria: [
        { t: 'Capabilities: permisos con bisturí', p: 'En vez de SUID completo, un binario puede tener una **capability** concreta. `getcap -r /` las lista. Algunas, como `cap_setuid`, permiten cambiar de usuario y son escalada directa.' },
        { t: 'Cron: root trabaja por ti', p: 'Si una tarea del cron ejecuta como root un script que TÚ puedes escribir, editas el script y esperas: root lo ejecutará con tu contenido dentro.' },
        { c: '*/5 * * * *  root  /opt/mantenimiento/limpiar.sh   ← ¿puedo escribirlo yo?' },
      ],
      practica: [
        terminal('esc-getcap', 'Lista de forma recursiva los binarios con capabilities en el sistema.', SNAP, 'getcap -r /', (c) => k.salidaTiene(c, 'cap_net'), ['`getcap -r /`.']),
        terminal('esc-crontab', 'Lee el crontab del sistema para ver qué tareas ejecuta root periódicamente.', SNAP, 'cat /etc/crontab', (c) => k.salidaTiene(c, 'limpiar.sh', 'root'), ['`cat /etc/crontab`.']),
        terminal('esc-cron-perms', 'Comprueba los permisos del script que ejecuta el cron: ¿puedes escribirlo?', SNAP, 'ls -l /opt/mantenimiento/limpiar.sh', (c) => k.salidaTiene(c, 'limpiar.sh') && k.ultimaSalida(c).includes('rwx'), ['`ls -l /opt/mantenimiento/limpiar.sh`.']),
        quiz('esc-q6', 'Una tarea cron ejecuta como root un script que tú puedes escribir. ¿Por qué es escalada?', ['Editas el script y root ejecutará tu contenido como root', 'El cron te da una contraseña', 'El script se borra solo', 'No es escalada'], 0, 'Controlar el contenido de algo que root ejecuta equivale a ejecutar como root.'),
        respuesta('esc-r4', '¿Qué comando lista todos los binarios con capabilities del sistema?', ['getcap -r /', 'getcap'], '`getcap -r /` recorre el árbol buscando capabilities asignadas.'),
        quiz('esc-q7', '¿Qué hace peligrosa una capability como `cap_setuid` en un binario?', ['Permite cambiar de usuario, incluso a root', 'Acelera el binario', 'Lo hace invisible', 'Cifra su salida'], 0, '`cap_setuid` otorga justo el poder de cambiar de identidad.'),
      ],
    },
    {
      id: 'esc-informe', titulo: '5. Del hallazgo al informe', subtitulo: 'Documentar la vía y recomendar el arreglo',
      teoria: [
        { t: 'Una escalada sin informe no sirve', p: 'El valor del trabajo no es «he sido root», sino explicar CÓMO y cómo evitarlo: qué regla, qué binario, qué permiso, y qué cambiar.' },
        { c: 'Vía: sudo NOPASSWD find (deploy) → -exec como root\nArreglo: retirar esa regla de /etc/sudoers' },
        { n: 'Cierra el círculo', p: 'Reconocimiento, enumeración, acceso, escalada… y un informe que permite al cliente cerrar cada puerta que abriste.' },
      ],
      practica: [
        terminal('esc-informe-1', 'Empieza el informe de escalada guardando la política de sudo en `hallazgos/escalada.txt`.', SNAP, 'sudo cat /etc/sudoers > hallazgos/escalada.txt\ncat hallazgos/escalada.txt', (c) => k.existe(c, 'hallazgos/escalada.txt') && k.contenido(c, 'hallazgos/escalada.txt').includes('/usr/bin/find'), ['`sudo cat /etc/sudoers > hallazgos/escalada.txt`.']),
        terminal('esc-informe-2', 'Sobre el informe con la política de sudo, añade con `>>` la lista de binarios SUID no estándar.', SNAP, 'sudo cat /etc/sudoers > hallazgos/escalada.txt\nfind / -perm -4000 -type f 2>/dev/null >> hallazgos/escalada.txt\ncat hallazgos/escalada.txt', (c) => k.contenido(c, 'hallazgos/escalada.txt').includes('reporte') && k.contenido(c, 'hallazgos/escalada.txt').includes('/usr/bin/find'), ['Añade con `>>` para no borrar lo anterior.']),
        quiz('esc-q8', 'Encuentras la regla `NOPASSWD: /usr/bin/find`. ¿Qué recomiendas en el informe?', ['Retirar o acotar esa regla de sudo', 'Reiniciar el servidor', 'Cambiar el DNS', 'Nada: es normal'], 0, 'La recomendación concreta —quitar la regla peligrosa— es lo que da valor al hallazgo.'),
        respuesta('esc-r5', '¿Qué fichero define qué puede ejecutar cada usuario con sudo, y por tanto revisarías para cerrar la vía?', ['/etc/sudoers', 'sudoers'], 'Corregir `/etc/sudoers` cierra la escalada por sudo.'),
        ordenar('esc-o3', 'Construye la orden que añade los SUID al informe sin borrar lo que ya tiene.', barajar(['find', '/', '-perm', '-4000', '2>/dev/null', '>>', 'hallazgos/escalada.txt'], 'esc-o3'), 'find / -perm -4000 2>/dev/null >> hallazgos/escalada.txt', 'El doble `>>` conserva el contenido previo.', ['find', 'redirecciones']),
      ],
    },
  ],
};

export const SALAS_OFENSIVA = [SALA_RECON, SALA_ENUM, SALA_ACCESO, SALA_ESCALADA];
