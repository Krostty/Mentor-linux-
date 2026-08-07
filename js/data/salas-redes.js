// Academia Redes · ruta «Servicios y diagnóstico».
// Cuatro salas que van de resolver un nombre a explicar por qué algo no
// conecta. Todo ocurre dentro del simulador: ningún comando sale del móvil.

import * as k from './checks.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';

const SNAP = 'red-servicios';

// ---------------------------------------------------------------------------
// 1. DNS: del nombre a la dirección
// ---------------------------------------------------------------------------

export const SALA_DNS = {
  id: 'dns', n: 21, nombre: 'DNS: del nombre a la dirección',
  resumen: 'Resuelve nombres, distingue los tipos de registro y reconoce cuándo el problema es del DNS y no tuyo',
  dificultad: 'Fácil', minutos: 35, comandos: ['dig', 'host', 'cat', 'grep'], origen: 'v4-redes',
  tareas: [
    {
      id: 'dns-que-es', titulo: '1. Qué hace realmente el DNS', subtitulo: 'Nombres, direcciones y quién responde',
      teoria: [
        { t: 'Un nombre no viaja por la red', p: 'Las máquinas se hablan por **dirección IP**. `api.local` es una comodidad para las personas; antes de conectar, tu sistema tiene que traducirlo a algo como `192.168.1.60`. Esa traducción es el DNS.' },
        { c: 'api.local  ──resolución──▶  192.168.1.60  ──conexión──▶  servicio' },
        { t: 'Quién traduce', p: 'Tu equipo pregunta a un **resolutor**, apuntado en `/etc/resolv.conf`. Antes de preguntar mira `/etc/hosts`, que es una tabla local que gana siempre.' },
        { n: 'Por qué importa', p: 'Media hora de «la web no carga» se resuelve en diez segundos si compruebas primero si el nombre resuelve.' },
      ],
      practica: [
        quiz('dns-q1', '¿Qué se consulta ANTES de preguntar al servidor DNS?', ['El archivo `/etc/hosts`', 'El historial del navegador', 'La tabla de rutas', 'El archivo `/etc/services`'], 0, '`/etc/hosts` es una tabla local y tiene prioridad sobre el DNS: por eso sirve para forzar una dirección en pruebas.'),
        quiz('dns-q2', '¿Dónde se apunta qué servidor DNS usa tu sistema?', ['`/etc/resolv.conf`', '`/etc/hostname`', '`/etc/fstab`', '`/etc/passwd`'], 0, '`/etc/resolv.conf` lista los `nameserver` a los que preguntar, en orden.'),
        terminal('dns-resolv', 'Muestra el contenido de `/etc/resolv.conf` para ver a qué servidor pregunta este equipo.', SNAP, 'cat /etc/resolv.conf', (c) => k.salidaTiene(c, 'nameserver', '192.168.1.1'), ['Es un archivo de texto: basta con `cat`.']),
        terminal('dns-hosts', 'Comprueba qué nombres tiene fijados este equipo en su tabla local `/etc/hosts`.', SNAP, 'cat /etc/hosts', (c) => k.salidaTiene(c, 'api.local', 'intranet.local'), ['`cat /etc/hosts`.']),
        respuesta('dns-r1', 'Según `/etc/hosts`, ¿qué dirección IP corresponde a `api.local`?', ['192.168.1.60'], 'La tabla local ya trae ese nombre resuelto, así que ni siquiera hace falta el DNS.'),
        completar('dns-c1', 'Completa la ruta del archivo que dice a qué servidores DNS preguntar.', 'cat /etc/___', ['resolv.conf'], 'Se llama `resolv.conf`, sin la «e» final de «resolve».'),
      ],
    },
    {
      id: 'dns-dig', titulo: '2. Preguntar con dig', subtitulo: 'La herramienta que te dice la verdad',
      teoria: [
        { t: 'dig pregunta y te enseña la respuesta entera', p: '`dig dominio` devuelve un informe: la pregunta, el estado y la sección de respuesta. `+short` recorta todo eso y deja solo el dato.' },
        { c: 'dig +short api.local\n192.168.1.60' },
        { f: [['`dig dominio`', 'informe completo'], ['`dig +short dominio`', 'solo la respuesta'], ['`dig @servidor dominio`', 'pregunta a ESE servidor'], ['`host dominio`', 'versión corta y directa']] },
        { n: 'El estado importa', p: '`NOERROR` con 0 respuestas no es lo mismo que `NXDOMAIN`. El primero dice «el dominio existe pero no tiene ese dato»; el segundo, «ese dominio no existe».' },
      ],
      practica: [
        ordenar('dns-o1', 'Construye la consulta que devuelve solo la dirección de `api.local`.', barajar(['dig', '+short', 'api.local'], 'dns-o1'), 'dig +short api.local', 'Comando, opción y por último a quién preguntas.', ['dig']),
        terminal('dns-dig-short', 'Averigua la dirección de `intranet.local` mostrando solo el dato, sin el informe completo.', SNAP, 'dig +short intranet.local', (c) => k.salidaTiene(c, '192.168.1.70') && k.usó(c, /\+short/), ['`dig +short intranet.local`.']),
        respuesta('dns-r2', 'Ejecuta `dig +short intranet.local`. ¿Qué dirección devuelve?', ['192.168.1.70'], 'Es la dirección de la intranet en esta red de prácticas.'),
        terminal('dns-dig-largo', 'Consulta `mentor.dev` con el informe completo y localiza la sección de respuesta.', SNAP, 'dig mentor.dev', (c) => k.salidaTiene(c, 'ANSWER SECTION', '10.30.0.15'), ['`dig mentor.dev`, sin `+short`.']),
        quiz('dns-q3', 'Un `dig` devuelve `status: NXDOMAIN`. ¿Qué significa?', ['Ese dominio no existe', 'El dominio existe pero está caído', 'Tu red no tiene salida', 'El servidor tardó demasiado'], 0, 'NXDOMAIN es «non-existent domain»: el nombre no está registrado en esa zona.'),
        completar('dns-c2', 'Completa la opción que reduce la salida de `dig` a la respuesta pelada.', 'dig ______ github.com', ['+short'], 'Las opciones de `dig` que empiezan por `+` cambian el formato, no la consulta.'),
      ],
    },
    {
      id: 'dns-tipos', titulo: '3. Tipos de registro', subtitulo: 'A, MX, TXT y NS',
      teoria: [
        { t: 'Un dominio guarda varias cosas', p: 'La dirección es solo un registro más. El correo, la verificación de dominio y los servidores autorizados son registros distintos, y si preguntas por el tipo equivocado parecerá que «no hay nada».' },
        { f: [['`A`', 'dirección IPv4'], ['`AAAA`', 'dirección IPv6'], ['`MX`', 'quién recibe el correo'], ['`TXT`', 'texto libre: SPF, verificaciones'], ['`NS`', 'servidores con autoridad sobre la zona']] },
        { c: 'dig MX mentor.dev\nmentor.dev.  300  IN  MX  10 correo.mentor.dev.' },
        { n: 'El número del MX es la prioridad', p: 'En `10 correo.mentor.dev.`, el 10 es la preferencia: cuanto más bajo, antes se intenta.' },
      ],
      practica: [
        quiz('dns-q4', '¿Qué registro dice a qué servidor entregar el correo de un dominio?', ['MX', 'A', 'NS', 'TXT'], 0, 'MX viene de «mail exchange».'),
        terminal('dns-mx', 'Consulta el registro de correo de `mentor.dev`.', SNAP, 'dig MX mentor.dev', (c) => k.salidaTiene(c, 'correo.mentor.dev'), ['`dig MX mentor.dev`.']),
        terminal('dns-txt', 'Muestra solo el contenido del registro TXT de `api.local`.', SNAP, 'dig TXT api.local +short', (c) => k.salidaTiene(c, 'entorno=pruebas'), ['Combina el tipo `TXT` con `+short`.']),
        ordenar('dns-o2', 'Construye la consulta de los servidores con autoridad sobre `mentor.dev`.', barajar(['dig', 'NS', 'mentor.dev'], 'dns-o2'), 'dig NS mentor.dev', 'El tipo va entre el comando y el dominio.', ['dig']),
        respuesta('dns-r3', 'Ejecuta `dig TXT api.local +short`. ¿Qué valor aparece entre comillas?', ['entorno=pruebas', '"entorno=pruebas"'], 'Los TXT se usan para marcar entornos, verificar dominios o publicar políticas SPF.'),
        quiz('dns-q5', 'Pides `dig MX api.local` y sale `NOERROR` con `ANSWER: 0`. ¿Qué pasa?', ['El dominio existe pero no tiene registro MX', 'El dominio no existe', 'El servidor DNS está caído', 'Falta permiso para consultar'], 0, 'La consulta funcionó; simplemente ese tipo de registro no está definido.'),
        terminal('dns-host-mx', 'Usa `host` para ver quién gestiona el correo de `correo.local`.', SNAP, 'host -t MX correo.local', (c) => k.salidaTiene(c, 'correo.local'), ['`host -t MX correo.local`.']),
      ],
    },
    {
      id: 'dns-averiado', titulo: '4. Cuando el DNS es el problema', subtitulo: 'Aislar la causa en dos comandos',
      teoria: [
        { t: 'Preguntar a otro servidor lo demuestra', p: 'Si `dig dominio` falla pero `dig @1.1.1.1 dominio` responde, el problema no es el dominio: es tu resolutor. Ese contraste es la prueba más rápida que tienes.' },
        { c: 'dig +short api.local              # tu resolutor\ndig @192.168.1.99 api.local +short  # otro resolutor' },
        { n: 'En esta red', p: '`192.168.1.1` funciona; `192.168.1.99` está averiado y devuelve `SERVFAIL`. Vas a ver la diferencia con tus ojos.' },
      ],
      practica: [
        terminal('dns-averiado-1', 'Pregunta por `api.local` al resolutor averiado `192.168.1.99` y observa qué devuelve.', SNAP, 'dig @192.168.1.99 api.local', (c) => k.salidaTiene(c, 'SERVFAIL'), ['El servidor se indica con `@` delante: `dig @192.168.1.99 api.local`.']),
        terminal('dns-averiado-2', 'Repite la consulta contra el resolutor bueno `192.168.1.1` y comprueba que sí responde.', SNAP, 'dig @192.168.1.1 api.local +short', (c) => k.salidaTiene(c, '192.168.1.60'), ['Mismo comando, cambiando el servidor tras la `@`.']),
        quiz('dns-q6', 'Un nombre no resuelve con tu resolutor pero sí con `1.1.1.1`. ¿Dónde está el fallo?', ['En tu resolutor o en su configuración', 'En el dominio consultado', 'En tu cable de red', 'En el navegador'], 0, 'El dominio existe y es resoluble; lo que falla es el servidor al que preguntas.'),
        respuesta('dns-r4', '¿Qué estado devuelve un servidor DNS que no puede completar la consulta por un fallo propio?', ['SERVFAIL', 'servfail'], 'SERVFAIL indica fallo del servidor, no ausencia del dominio.'),
        completar('dns-c3', 'Completa el símbolo que indica a `dig` a qué servidor preguntar.', 'dig _1.1.1.1 github.com', ['@'], 'La arroba precede siempre al servidor consultado.'),
        quiz('dns-q7', '¿Cuál de estas comprobaciones NO te dice nada sobre DNS?', ['`ls -l /etc`', '`dig +short dominio`', '`cat /etc/resolv.conf`', '`host dominio`'], 0, 'Listar un directorio no tiene relación con la resolución de nombres.'),
      ],
    },
    {
      id: 'dns-practica', titulo: '5. Cierra el circuito', subtitulo: 'De la tabla local a la respuesta',
      teoria: [
        { t: 'El orden completo', p: 'Nombre → `/etc/hosts` → resolutor de `/etc/resolv.conf` → respuesta. Si conoces ese camino, sabes en qué punto mirar cuando algo falla.' },
        { n: 'Truco de campo', p: 'Añadir una línea a `/etc/hosts` permite apuntar un nombre a otra máquina sin tocar el DNS. Es la forma habitual de probar un servidor nuevo antes de publicarlo.' },
      ],
      practica: [
        terminal('dns-grep-hosts', 'Filtra `/etc/hosts` para quedarte solo con la línea de `intranet.local`.', SNAP, 'grep intranet.local /etc/hosts', (c) => k.salidaTiene(c, '192.168.1.70') && !k.ultimaSalida(c).includes('localhost'), ['`grep intranet.local /etc/hosts`.']),
        terminal('dns-nameserver', 'Extrae de `/etc/resolv.conf` únicamente las líneas que declaran un servidor.', SNAP, 'grep nameserver /etc/resolv.conf', (c) => k.salidaTiene(c, '192.168.1.1') && k.usó(c, /grep/), ['Filtra por la palabra `nameserver`.']),
        ordenar('dns-o3', 'Construye la orden que guarda en `dns.txt` la dirección corta de `api.local`.', barajar(['dig', '+short', 'api.local', '>', 'dns.txt'], 'dns-o3'), 'dig +short api.local > dns.txt', 'La redirección `>` va al final y crea el archivo.', ['dig', 'redirecciones']),
        terminal('dns-guardar', 'Guarda en `dns.txt` la dirección corta de `api.local` y comprueba el archivo.', SNAP, 'dig +short api.local > dns.txt\ncat dns.txt', (c) => k.existe(c, 'dns.txt') && k.contenido(c, 'dns.txt').includes('192.168.1.60'), ['Redirige la salida con `>` y luego usa `cat`.']),
        quiz('dns-q8', '¿Para qué sirve añadir un nombre a `/etc/hosts` en tu equipo?', ['Probar un servidor nuevo sin tocar el DNS público', 'Acelerar tu conexión a internet', 'Cifrar el tráfico hacia ese nombre', 'Registrar el dominio a tu nombre'], 0, 'Es una anulación local: solo afecta a tu máquina, y por eso es ideal para pruebas.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. Puertos y servicios
// ---------------------------------------------------------------------------

export const SALA_PUERTOS = {
  id: 'puertos', n: 22, nombre: 'Puertos y servicios',
  resumen: 'Descubre qué escucha en una máquina, qué proceso lo hace y cómo comprobar un puerto desde fuera',
  dificultad: 'Fácil', minutos: 35, comandos: ['ss', 'nc', 'nmap', 'grep', 'cat'], origen: 'v4-redes',
  tareas: [
    {
      id: 'puertos-idea', titulo: '1. Qué es un puerto', subtitulo: 'La dirección lleva a la máquina; el puerto, al servicio',
      teoria: [
        { t: 'Una máquina, muchos servicios', p: 'La IP identifica la máquina. El **puerto** identifica el servicio dentro de ella. Por eso una misma dirección puede servir web, SSH y base de datos a la vez.' },
        { f: [['22', 'SSH'], ['25', 'correo (SMTP)'], ['53', 'DNS'], ['80', 'HTTP'], ['443', 'HTTPS'], ['5432', 'PostgreSQL']] },
        { n: 'Escuchar no es lo mismo que estar conectado', p: '`LISTEN` es un servicio esperando clientes. `ESTAB` es una conversación ya en curso.' },
      ],
      practica: [
        quiz('puertos-q1', '¿Qué identifica un puerto?', ['El servicio dentro de una máquina', 'La máquina dentro de la red', 'El usuario que se conecta', 'La velocidad de la conexión'], 0, 'La IP llega a la máquina; el puerto elige con qué programa hablas.'),
        quiz('puertos-q2', '¿Qué puerto usa SSH por defecto?', ['22', '80', '443', '25'], 0, 'El 22 es el estándar de SSH; cambiarlo es una medida de higiene habitual.'),
        terminal('puertos-services', 'Consulta el archivo del sistema que relaciona nombres de servicio con números de puerto.', SNAP, 'cat /etc/services', (c) => k.salidaTiene(c, 'ssh', '22/tcp'), ['Se llama `/etc/services`.']),
        terminal('puertos-buscar', 'Busca en `/etc/services` con qué puerto se corresponde `https`.', SNAP, 'grep https /etc/services', (c) => k.salidaTiene(c, '443'), ['Combina `grep https` con el archivo.']),
        respuesta('puertos-r1', 'Según `/etc/services`, ¿en qué puerto escucha PostgreSQL?', ['5432'], 'Es el puerto estándar de PostgreSQL; suele estar limitado a localhost.'),
        completar('puertos-c1', 'Completa el estado que muestra un servicio esperando conexiones.', 'tcp   ______   0.0.0.0:22', ['LISTEN', 'listen'], '`LISTEN` es el estado de un socket a la espera.'),
      ],
    },
    {
      id: 'puertos-ss', titulo: '2. Ver qué escucha con ss', subtitulo: 'La foto local de tus sockets',
      teoria: [
        { t: 'ss lee los sockets del propio sistema', p: 'No hace tráfico: pregunta al kernel. Es la forma más fiable de saber qué está abierto **en esta máquina**.' },
        { f: [['`-t`', 'solo TCP'], ['`-u`', 'solo UDP'], ['`-l`', 'solo los que escuchan'], ['`-n`', 'números en vez de nombres'], ['`-p`', 'qué proceso lo abre']] },
        { c: 'ss -tulpn\ntcp  LISTEN  0.0.0.0:22   users:(("sshd",pid=638))' },
        { n: 'La combinación que se usa a diario', p: '`ss -tulpn`: TCP y UDP, solo los que escuchan, en números y con el proceso.' },
      ],
      practica: [
        ordenar('puertos-o1', 'Construye la orden que lista los puertos TCP a la escucha, con proceso y en formato numérico.', barajar(['ss', '-tlpn'], 'puertos-o1'), 'ss -tlpn', 'Las opciones cortas se combinan en un solo guion.', ['ss']),
        terminal('puertos-ss-listen', 'Lista los sockets TCP que están a la escucha en este equipo, con el proceso que los abre.', SNAP, 'ss -tlpn', (c) => k.salidaTiene(c, 'LISTEN', 'sshd') && !k.ultimaSalida(c).includes('udp'), ['`ss -tlpn`.']),
        terminal('puertos-ss-udp', 'Lista ahora únicamente los sockets UDP.', SNAP, 'ss -ulpn', (c) => k.salidaTiene(c, 'udp', ':53') && !k.ultimaSalida(c).includes('tcp'), ['La opción de UDP es `-u`.']),
        respuesta('puertos-r2', 'Ejecuta `ss -tlpn`. ¿Qué proceso mantiene abierto el puerto 80?', ['nginx'], 'nginx es el servidor web de esta máquina.'),
        quiz('puertos-q3', '`ss` muestra `127.0.0.1:5432`. ¿Quién puede conectarse a ese servicio?', ['Solo la propia máquina', 'Cualquiera de la red local', 'Cualquiera de internet', 'Solo el usuario root'], 0, 'Escuchar en `127.0.0.1` limita el servicio a la máquina; `0.0.0.0` lo expone a la red.'),
        completar('puertos-c2', 'Completa la opción de `ss` que añade el proceso dueño de cada socket.', 'ss -tln_', ['p', '-p'], '`-p` muestra la columna Process.'),
        terminal('puertos-ss-estab', 'Muestra todos los sockets TCP, incluidas las conexiones ya establecidas.', SNAP, 'ss -ta', (c) => k.salidaTiene(c, 'ESTAB'), ['`-a` incluye lo que no está solo escuchando.']),
      ],
    },
    {
      id: 'puertos-fuera', titulo: '3. Comprobar desde fuera', subtitulo: 'nc y nmap',
      teoria: [
        { t: 'Lo que tú ves no es lo que ve el cliente', p: 'Un servicio puede estar `LISTEN` y aun así no llegar: cortafuegos, dirección de escucha, red intermedia. Comprobarlo desde el punto de vista del cliente es otro comando.' },
        { f: [['`nc -zv host puerto`', 'comprueba si el puerto acepta conexión'], ['`nmap -p 22,80 host`', 'escanea puertos concretos'], ['`nmap -sV host`', 'además intenta identificar el servicio y su versión'], ['`nmap -sn red`', 'solo descubre qué hosts están vivos']] },
        { n: 'Solo donde tengas permiso', p: 'Escanear máquinas ajenas sin autorización es ilegal en muchos países. Aquí todo es simulado y local.' },
      ],
      practica: [
        terminal('puertos-nc', 'Comprueba si el puerto 5432 de `localhost` acepta conexiones, sin enviar datos.', SNAP, 'nc -zv localhost 5432', (c) => k.salidaTiene(c, 'succeeded'), ['`-z` solo comprueba; `-v` explica el resultado.']),
        terminal('puertos-nc-cerrado', 'Prueba el puerto 3306 de `localhost` y observa el mensaje cuando no hay nadie escuchando.', SNAP, 'nc -zv localhost 3306', (c) => k.salidaTiene(c, 'refused'), ['Mismo comando, cambiando el número de puerto.']),
        ordenar('puertos-o2', 'Construye el escaneo de los puertos 22 y 443 de `localhost`.', barajar(['nmap', '-p', '22,443', 'localhost'], 'puertos-o2'), 'nmap -p 22,443 localhost', 'La lista de puertos va pegada a `-p`, separada por comas.', ['nmap']),
        terminal('puertos-nmap', 'Escanea los puertos 22 y 3306 de `localhost` y compara sus estados.', SNAP, 'nmap -p 22,3306 localhost', (c) => k.salidaTiene(c, 'open', 'closed'), ['`nmap -p 22,3306 localhost`.']),
        terminal('puertos-nmap-version', 'Escanea `localhost` intentando además identificar la versión de cada servicio.', SNAP, 'nmap -sV localhost', (c) => k.salidaTiene(c, 'OpenSSH') && k.usó(c, /-sV/), ['La opción de detección de versión es `-sV`.']),
        quiz('puertos-q4', '¿Qué diferencia hay entre `closed` y `filtered` en un escaneo?', ['`closed` responde que no hay servicio; `filtered` no responde nada', 'Son sinónimos', '`closed` significa que el host está apagado', '`filtered` significa que el servicio es antiguo'], 0, 'Un puerto cerrado contesta con un rechazo; uno filtrado se traga el paquete, típico de un cortafuegos.'),
        respuesta('puertos-r3', '¿Qué opción de `nc` comprueba un puerto sin enviar ni un byte de datos?', ['-z', 'z'], '`-z` es el modo «zero I/O»: abre, mira y cierra.'),
      ],
    },
    {
      id: 'puertos-banner', titulo: '4. Quién hay al otro lado', subtitulo: 'Banners y versiones',
      teoria: [
        { t: 'Los servicios se presentan', p: 'Muchos protocolos envían una línea de bienvenida nada más conectar. Esa línea, el **banner**, suele decir el programa y la versión.' },
        { c: 'nc localhost 22\nSSH-2.0-OpenSSH_9.2p1 Debian-2' },
        { n: 'Es información, y también exposición', p: 'Un banner te ayuda a inventariar tu red, pero también le dice a un atacante qué versión tienes. Por eso muchos servidores lo recortan.' },
      ],
      practica: [
        terminal('puertos-banner-ssh', 'Conéctate al puerto 22 de `localhost` y lee el banner del servicio.', SNAP, 'nc localhost 22', (c) => k.salidaTiene(c, 'SSH-2.0'), ['`nc localhost 22`, sin la opción `-z`.']),
        respuesta('puertos-r4', 'Ejecuta `nc localhost 22`. ¿Qué versión del protocolo SSH anuncia el banner?', ['2.0', 'SSH-2.0'], 'La primera parte del banner es la versión del protocolo, no la del programa.'),
        quiz('puertos-q5', '¿Por qué un administrador querría ocultar los banners de sus servicios?', ['Para no revelar versiones concretas a un atacante', 'Para que el servicio vaya más rápido', 'Para cumplir con el protocolo TCP', 'Porque ocupan mucho disco'], 0, 'Conocer la versión exacta facilita buscar un fallo conocido para esa versión.'),
        completar('puertos-c3', 'Completa el comando que lee el banner del servicio web local.', 'nc localhost ___', ['80'], 'El puerto 80 es HTTP.'),
        terminal('puertos-inventario', 'Revisa el inventario de puertos anotado en `inventario/puertos.txt`.', SNAP, 'cat inventario/puertos.txt', (c) => k.salidaTiene(c, '5432', 'postgresql'), ['`cat inventario/puertos.txt`.']),
      ],
    },
    {
      id: 'puertos-cierre', titulo: '5. Contrastar las dos vistas', subtitulo: 'Lo que escucha y lo que se alcanza',
      teoria: [
        { t: 'La comprobación que resuelve discusiones', p: 'Primero `ss` dentro de la máquina: ¿está escuchando? Después `nc -zv` desde fuera: ¿se alcanza? Si escucha pero no se alcanza, el problema está en el camino, no en el servicio.' },
        { c: 'ss -tlpn            # ¿escucha?\nnc -zv host puerto  # ¿se alcanza?' },
      ],
      practica: [
        terminal('puertos-contraste', 'Cuenta cuántos sockets TCP están a la escucha en este equipo.', SNAP, 'ss -tln | grep -c LISTEN', (c) => k.salidaTiene(c, '4'), ['Conecta `ss -tln` con `grep -c LISTEN`.']),
        ordenar('puertos-o3', 'Construye la orden que filtra de `ss` solo la línea del puerto 443.', barajar(['ss', '-tlpn', '|', 'grep', '443'], 'puertos-o3'), 'ss -tlpn | grep 443', 'La tubería pasa la salida de `ss` a `grep`.', ['ss', 'pipes']),
        terminal('puertos-filtrar', 'Muestra solo la línea de `ss` correspondiente al puerto 443.', SNAP, 'ss -tlpn | grep 443', (c) => k.salidaTiene(c, '443') && !k.ultimaSalida(c).includes(':22'), ['Encadena con `| grep 443`.']),
        quiz('puertos-q6', 'Un servicio aparece en `ss` como `LISTEN` pero `nc -zv` desde otra máquina falla. ¿Qué miras primero?', ['El cortafuegos y la dirección de escucha', 'La versión del kernel', 'El espacio en disco', 'El archivo `/etc/passwd`'], 0, 'Escuchar solo en `127.0.0.1` o un cortafuegos que bloquea son las dos causas habituales.'),
        respuesta('puertos-r5', '¿Qué dirección de escucha significa «acepto conexiones de cualquier interfaz»?', ['0.0.0.0'], '`0.0.0.0` es el comodín; `127.0.0.1` restringe a la propia máquina.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. HTTP desde la terminal
// ---------------------------------------------------------------------------

export const SALA_HTTP = {
  id: 'http', n: 23, nombre: 'HTTP desde la terminal',
  resumen: 'Lee cabeceras, interpreta códigos de estado y sigue redirecciones sin abrir un navegador',
  dificultad: 'Intermedio', minutos: 35, comandos: ['curl', 'wget', 'grep', 'cat'], origen: 'v4-redes',
  tareas: [
    {
      id: 'http-idea', titulo: '1. Una petición es texto', subtitulo: 'Cabeceras, cuerpo y código',
      teoria: [
        { t: 'Qué devuelve un servidor web', p: 'Una respuesta HTTP tiene dos partes: **cabeceras** (metadatos: código, tipo, tamaño) y **cuerpo** (el contenido). El navegador te enseña solo el cuerpo; `curl` te deja ver las dos.' },
        { c: 'HTTP/1.1 200 OK\nServer: nginx/1.24.0\nContent-Type: text/html\n\n<h1>Hola</h1>' },
        { f: [['`curl url`', 'muestra el cuerpo'], ['`curl -I url`', 'solo las cabeceras'], ['`curl -s url`', 'sin barra de progreso'], ['`curl -o fichero url`', 'guarda en un archivo']] },
      ],
      practica: [
        quiz('http-q1', '¿Qué parte de la respuesta lleva el código de estado?', ['Las cabeceras', 'El cuerpo', 'La URL', 'El nombre del servidor'], 0, 'La primera línea de las cabeceras es la de estado: `HTTP/1.1 200 OK`.'),
        terminal('http-cuerpo', 'Pide la página de `http://mentor.dev` y observa el cuerpo que devuelve.', SNAP, 'curl http://mentor.dev', (c) => k.salidaTiene(c, 'Mentor Dev'), ['`curl http://mentor.dev`.']),
        terminal('http-cabeceras', 'Muestra únicamente las cabeceras de `http://mentor.dev`.', SNAP, 'curl -I http://mentor.dev', (c) => k.salidaTiene(c, 'HTTP/1.1 200', 'Server:'), ['La opción de solo cabeceras es `-I` mayúscula.']),
        respuesta('http-r1', 'Ejecuta `curl -I http://mentor.dev`. ¿Qué servidor web anuncia la cabecera `Server`?', ['nginx', 'nginx/1.24.0'], 'La cabecera `Server` identifica el software, y por eso a veces se oculta.'),
        completar('http-c1', 'Completa la opción de `curl` que muestra solo las cabeceras.', 'curl __ http://api.local', ['-I'], 'Es la `i` mayúscula: `-I` de «head».'),
      ],
    },
    {
      id: 'http-codigos', titulo: '2. Los códigos de estado', subtitulo: '200, 301, 403, 404, 500',
      teoria: [
        { t: 'El número dice de quién es el problema', p: 'La primera cifra clasifica la respuesta: 2xx salió bien, 3xx te mandan a otro sitio, 4xx la petición está mal, 5xx el servidor se rompió.' },
        { f: [['200', 'OK'], ['301', 'movido: sigue la cabecera `Location`'], ['403', 'prohibido: existe, pero no puedes'], ['404', 'no existe esa ruta'], ['500', 'error dentro del servidor']] },
        { n: '403 y 404 no son lo mismo', p: 'Un 404 dice «aquí no hay nada»; un 403 confirma que hay algo y que no tienes permiso. Esa diferencia es oro cuando enumeras un servicio.' },
      ],
      practica: [
        quiz('http-q2', '¿Qué significa un 403?', ['El recurso existe pero no tienes permiso', 'El recurso no existe', 'El servidor falló', 'La petición se redirige'], 0, 'Forbidden: el servidor entiende la petición y se niega a servirla.'),
        quiz('http-q3', 'Recibes un 500. ¿De quién es el problema?', ['Del servidor', 'De tu petición', 'De tu DNS', 'De tu cortafuegos'], 0, 'La familia 5xx señala fallos del lado del servidor.'),
        terminal('http-404', 'Pide `http://api.local/salud` mostrando solo las cabeceras y comprueba el código.', SNAP, 'curl -I http://api.local/salud', (c) => k.salidaTiene(c, '404'), ['`curl -I http://api.local/salud`.']),
        terminal('http-403', 'Consulta las cabeceras de `http://intranet.local/admin`.', SNAP, 'curl -I http://intranet.local/admin', (c) => k.salidaTiene(c, '403'), ['Mismo patrón, con la ruta `/admin`.']),
        respuesta('http-r2', 'Ejecuta `curl -I http://intranet.local/admin`. ¿Qué código devuelve?', ['403'], '403 confirma que la ruta existe pero está protegida: es un buen indicio al enumerar.'),
        terminal('http-code', 'Obtén solo el código de estado numérico de `http://api.local/version`.', SNAP, "curl -s -o /dev/null -w '%{http_code}' http://api.local/version", (c) => k.salidaTiene(c, '200'), ['Combina `-s`, `-o /dev/null` y `-w \'%{http_code}\'`.']),
        completar('http-c2', 'Completa la familia de códigos que indica que el error es del servidor.', 'Error del servidor: ___', ['5xx', '500'], 'Todo lo que empieza por 5 apunta al servidor.'),
      ],
    },
    {
      id: 'http-redirecciones', titulo: '3. Redirecciones', subtitulo: 'Por qué «no devuelve nada»',
      teoria: [
        { t: 'Un 301 no trae contenido', p: 'Devuelve una cabecera `Location` con el destino. Si pides la URL sin más, `curl` te enseña un cuerpo vacío y parece que falla. Con `-L`, `curl` sigue la redirección hasta el final.' },
        { c: 'curl http://api.local        # vacío\ncurl -L http://api.local     # contenido final' },
      ],
      practica: [
        terminal('http-301', 'Mira las cabeceras de `http://api.local` y localiza a dónde redirige.', SNAP, 'curl -I http://api.local', (c) => k.salidaTiene(c, '301', 'Location'), ['`curl -I http://api.local`.']),
        respuesta('http-r3', 'Ejecuta `curl -I http://api.local`. ¿A qué ruta apunta la cabecera `Location`?', ['http://api.local/status', '/status'], 'La cabecera `Location` es el destino de la redirección.'),
        terminal('http-seguir', 'Pide `http://api.local` siguiendo la redirección hasta el contenido real.', SNAP, 'curl -L http://api.local', (c) => k.salidaTiene(c, 'degraded'), ['Añade `-L` para que `curl` siga el `Location`.']),
        ordenar('http-o1', 'Construye la petición que sigue redirecciones hasta la página final de la intranet.', barajar(['curl', '-L', 'http://intranet.local'], 'http-o1'), 'curl -L http://intranet.local', 'La opción va entre el comando y la URL.', ['curl']),
        quiz('http-q4', '`curl url` devuelve una respuesta vacía y el código es 301. ¿Qué falta?', ['Seguir la redirección con `-L`', 'Añadir `-I`', 'Cambiar de DNS', 'Usar `wget` en su lugar'], 0, 'El cuerpo está vacío a propósito: el contenido está en el destino de `Location`.'),
        terminal('http-descarga', 'Descarga `http://intranet.local/robots.txt` a un archivo llamado `robots.txt` y muéstralo.', SNAP, 'curl -o robots.txt http://intranet.local/robots.txt\ncat robots.txt', (c) => k.existe(c, 'robots.txt') && k.contenido(c, 'robots.txt').includes('Disallow'), ['`curl -o robots.txt URL` y luego `cat`.']),
      ],
    },
    {
      id: 'http-explorar', titulo: '4. Explorar un servicio web', subtitulo: 'robots.txt, rutas y pistas',
      teoria: [
        { t: 'robots.txt es una lista de deseos, no un candado', p: 'Le pide a los buscadores que no indexen ciertas rutas. Como es público, también es el primer sitio donde se mira para descubrir rutas interesantes.' },
        { c: 'User-agent: *\nDisallow: /admin\nDisallow: /copias' },
        { n: 'Descubrir no es entrar', p: 'Leer `robots.txt` de un servicio propio o autorizado es enumeración legítima. Acceder a lo que encuentres sin permiso, no.' },
      ],
      practica: [
        terminal('http-robots', 'Lee el `robots.txt` de `http://intranet.local`.', SNAP, 'curl http://intranet.local/robots.txt', (c) => k.salidaTiene(c, 'Disallow', '/admin'), ['`curl http://intranet.local/robots.txt`.']),
        respuesta('http-r4', 'Según ese `robots.txt`, ¿qué dos rutas se piden no indexar? Escribe la primera.', ['/admin'], 'Las rutas «prohibidas» suelen ser precisamente las que merece la pena revisar en una auditoría autorizada.'),
        terminal('http-disallow', 'Extrae del `robots.txt` de la intranet solo las líneas `Disallow`.', SNAP, 'curl -s http://intranet.local/robots.txt | grep Disallow', (c) => k.salidaTiene(c, '/admin', '/copias') && !k.ultimaSalida(c).includes('User-agent'), ['Encadena `curl -s` con `grep Disallow`.']),
        quiz('http-q5', '¿Qué garantiza `robots.txt`?', ['Nada: es una petición, no un control de acceso', 'Que nadie pueda entrar en esas rutas', 'Que las rutas estén cifradas', 'Que el servidor devuelva 403'], 0, 'Es una convención voluntaria; cualquiera puede leerlo e ignorarlo.'),
        terminal('http-json', 'Consulta `http://api.local/version` y observa la respuesta JSON.', SNAP, 'curl http://api.local/version', (c) => k.salidaTiene(c, '2.4.1'), ['`curl http://api.local/version`.']),
        respuesta('http-r5', '¿Qué versión anuncia `http://api.local/version`?', ['2.4.1'], 'Los endpoints de versión son cómodos para inventariar, y también revelan información.'),
      ],
    },
    {
      id: 'http-cierre', titulo: '5. Diagnóstico de un servicio web', subtitulo: 'Del nombre al contenido',
      teoria: [
        { t: 'La cadena completa', p: '¿Resuelve el nombre? → ¿acepta el puerto? → ¿qué código devuelve? → ¿qué dice el cuerpo? Cada pregunta descarta una capa entera.' },
        { c: 'dig +short api.local\nnc -zv api.local 80\ncurl -I http://api.local\ncurl -L http://api.local' },
        { n: 'Guarda la evidencia', p: 'Redirigir la salida a un archivo convierte una comprobación en una prueba que puedes adjuntar a un parte.' },
      ],
      practica: [
        terminal('http-cadena-1', 'Primer paso del diagnóstico: comprueba que `api.local` resuelve.', SNAP, 'dig +short api.local', (c) => k.salidaTiene(c, '192.168.1.60'), ['`dig +short api.local`.']),
        terminal('http-cadena-2', 'Segundo paso: guarda en `estado.txt` el código de estado de `http://api.local/status`.', SNAP, "curl -s -o /dev/null -w '%{http_code}' http://api.local/status > estado.txt\ncat estado.txt", (c) => k.existe(c, 'estado.txt') && k.contenido(c, 'estado.txt').includes('200'), ['Redirige con `>` la salida de `curl -w`.']),
        ordenar('http-o2', 'Construye la comprobación que muestra el estado de la API sin descargar el cuerpo.', barajar(['curl', '-I', 'http://api.local/status'], 'http-o2'), 'curl -I http://api.local/status', 'Con `-I` pides solo cabeceras.', ['curl']),
        quiz('http-q6', 'El nombre resuelve, el puerto 80 acepta y `curl` devuelve 500. ¿Dónde está el fallo?', ['En la aplicación del servidor', 'En el DNS', 'En el cortafuegos', 'En tu tabla de rutas'], 0, 'Has llegado hasta la aplicación: la red funciona y el error es interno del servicio.'),
        respuesta('http-r6', 'Ejecuta `curl -s -o /dev/null -w \'%{http_code}\' http://api.local/status`. ¿Qué código sale?', ['200'], 'Es la forma más limpia de comprobar un servicio en un script: solo el número.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. Diagnóstico capa a capa
// ---------------------------------------------------------------------------

export const SALA_DIAGNOSTICO_RED = {
  id: 'diagnostico-red', n: 24, nombre: 'Diagnóstico capa a capa',
  resumen: 'Un método fijo para averiguar por qué algo no conecta, descartando una capa en cada paso',
  dificultad: 'Intermedio', minutos: 35, comandos: ['ip', 'ping', 'traceroute', 'dig', 'nc', 'curl'], origen: 'v4-redes',
  tareas: [
    {
      id: 'diag-metodo', titulo: '1. El método', subtitulo: 'Cinco preguntas en orden',
      teoria: [
        { t: 'Siempre en el mismo orden', p: 'De abajo arriba: **interfaz → ruta → nombre → puerto → aplicación**. Cada paso que pasa descarta una capa entera, y así el problema no se te esconde.' },
        { f: [['¿Tengo dirección?', '`ip a`'], ['¿Tengo salida?', '`ip r` y `ping` al gateway'], ['¿Resuelve el nombre?', '`dig +short`'], ['¿Acepta el puerto?', '`nc -zv`'], ['¿Responde bien?', '`curl -I`']] },
        { n: 'Por qué de abajo arriba', p: 'Si empiezas por el navegador, cualquier síntoma vale para cualquier causa. Empezando por la interfaz, cada comprobación elimina posibilidades de verdad.' },
      ],
      practica: [
        quiz('diag-q1', '¿Cuál es el primer paso del método?', ['Comprobar que tienes dirección IP', 'Abrir el navegador', 'Reiniciar el router', 'Consultar el DNS'], 0, 'Sin dirección no hay nada más que discutir.'),
        terminal('diag-ip', 'Comprueba qué direcciones tiene configuradas este equipo.', SNAP, 'ip a', (c) => k.salidaTiene(c, '192.168.1.50', 'eth0'), ['`ip a` lista las interfaces y sus direcciones.']),
        respuesta('diag-r1', 'Ejecuta `ip a`. ¿Qué dirección IPv4 tiene la interfaz `eth0`?', ['192.168.1.50', '192.168.1.50/24'], 'La `/24` indica la máscara: los tres primeros octetos son la red.'),
        terminal('diag-ruta', 'Consulta la tabla de rutas para ver por dónde sale el tráfico.', SNAP, 'ip r', (c) => k.salidaTiene(c, 'default via 192.168.1.1'), ['`ip r` muestra las rutas; la de `default` es la salida.']),
        respuesta('diag-r2', 'Según `ip r`, ¿cuál es la puerta de enlace por defecto?', ['192.168.1.1'], 'La ruta `default via` es por donde sale todo lo que no es de tu red local.'),
        completar('diag-c1', 'Completa el subcomando que muestra la tabla de rutas.', 'ip _', ['r', 'route'], '`ip r` es la forma corta de `ip route`.'),
      ],
    },
    {
      id: 'diag-alcance', titulo: '2. ¿Llego hasta ahí?', subtitulo: 'ping y traceroute',
      teoria: [
        { t: 'ping mide si hay camino de ida y vuelta', p: 'Manda un paquete y espera respuesta. Si contesta, existe camino. Si no, puede ser que no haya ruta, que el host esté apagado o que un cortafuegos descarte el eco.' },
        { t: 'traceroute enseña el camino', p: 'Va marcando cada salto intermedio. Cuando el camino se corta, el último salto que responde te dice más o menos dónde.' },
        { n: 'Que no responda al ping no significa que esté caído', p: 'Muchos servidores bloquean ICMP a propósito. Por eso el ping se complementa con `nc -zv` al puerto que te interesa.' },
      ],
      practica: [
        terminal('diag-ping-gw', 'Comprueba con tres paquetes si la puerta de enlace responde.', SNAP, 'ping -c 3 192.168.1.1', (c) => k.salidaTiene(c, '3 received') || k.salidaTiene(c, '3 packets transmitted'), ['`ping -c 3 192.168.1.1` limita a tres intentos.']),
        ordenar('diag-o1', 'Construye el ping de cuatro paquetes a `servidor.local`.', barajar(['ping', '-c', '4', 'servidor.local'], 'diag-o1'), 'ping -c 4 servidor.local', 'El número va justo detrás de `-c`.', ['ping']),
        terminal('diag-trace', 'Traza el camino hasta `github.com` y observa los saltos intermedios.', SNAP, 'traceroute github.com', (c) => k.salidaTiene(c, '_gateway') && k.salidaTiene(c, '140.82.121.4'), ['`traceroute github.com`.']),
        quiz('diag-q2', 'Un servidor no responde al ping pero su web funciona. ¿Qué ocurre?', ['Está bloqueando ICMP a propósito', 'La web está en caché', 'El DNS está mal', 'El servidor está apagado'], 0, 'Filtrar ICMP es habitual; el servicio TCP sigue funcionando.'),
        terminal('diag-ping-nombre', 'Comprueba con un solo paquete si `api.local` responde.', SNAP, 'ping -c 1 api.local', (c) => k.salidaTiene(c, '192.168.1.60'), ['`ping -c 1 api.local`.']),
        respuesta('diag-r3', '¿Qué opción de `ping` limita el número de paquetes enviados?', ['-c', 'c'], 'Sin `-c`, `ping` sigue hasta que lo cortes.'),
      ],
    },
    {
      id: 'diag-nombre', titulo: '3. ¿Es el nombre o la máquina?', subtitulo: 'Separar DNS de conectividad',
      teoria: [
        { t: 'Prueba por IP y por nombre', p: 'Si `ping 192.168.1.60` funciona pero `ping api.local` no, la máquina está bien y el problema es la resolución. Ese contraste separa dos mundos en un segundo.' },
        { c: 'ping -c 1 192.168.1.60   # ¿está viva?\nping -c 1 api.local      # ¿resuelve el nombre?' },
      ],
      practica: [
        terminal('diag-por-ip', 'Comprueba por dirección, sin usar nombres, si `192.168.1.60` responde.', SNAP, 'ping -c 1 192.168.1.60', (c) => k.salidaTiene(c, '192.168.1.60'), ['`ping -c 1 192.168.1.60`.']),
        quiz('diag-q3', '`ping 192.168.1.60` funciona y `ping api.local` da «Name or service not known». ¿Qué falla?', ['La resolución de nombres', 'El cable de red', 'La tabla de rutas', 'El servicio web'], 0, 'La máquina está viva; lo que no funciona es traducir el nombre.'),
        terminal('diag-nombre-falso', 'Intenta hacer ping a `noexiste.zzz` y lee el error exacto.', SNAP, 'ping -c 1 noexiste.zzz', (c) => k.salidaTiene(c, 'Name or service not known'), ['El comando fallará: lo interesante es el mensaje.']),
        respuesta('diag-r4', '¿Qué mensaje da `ping` cuando no puede traducir un nombre? Escribe las tres primeras palabras.', ['Name or service', 'name or service'], '«Name or service not known» siempre apunta a resolución, nunca a conectividad.'),
        completar('diag-c2', 'Completa el comando que comprueba la resolución sin generar tráfico al destino.', 'dig ______ api.local', ['+short'], '`dig` pregunta al DNS; no toca la máquina de destino.'),
      ],
    },
    {
      id: 'diag-servicio', titulo: '4. ¿Es la red o el servicio?', subtitulo: 'El último descarte',
      teoria: [
        { t: 'Llegar no es lo mismo que ser atendido', p: 'Si el puerto acepta la conexión, la red hizo su trabajo. Lo que venga después —un 500, una respuesta rara, un cuelgue— es de la aplicación.' },
        { c: 'nc -zv api.local 80     # ¿la red llega?\ncurl -I http://api.local  # ¿la app responde bien?' },
        { n: 'Así se cierra una incidencia', p: '«El nombre resuelve, el puerto acepta y la aplicación devuelve 500» es un parte que el equipo de desarrollo puede accionar. «No va» no lo es.' },
      ],
      practica: [
        terminal('diag-puerto', 'Comprueba si el puerto 80 de `api.local` acepta conexiones.', SNAP, 'nc -zv api.local 80', (c) => k.salidaTiene(c, 'succeeded'), ['`nc -zv api.local 80`.']),
        terminal('diag-app', 'Comprueba qué código devuelve la aplicación en `http://api.local/status`.', SNAP, 'curl -I http://api.local/status', (c) => k.salidaTiene(c, '200'), ['`curl -I http://api.local/status`.']),
        quiz('diag-q4', 'El puerto acepta pero la aplicación devuelve 500. ¿A quién escalas?', ['Al equipo que mantiene la aplicación', 'Al proveedor de red', 'Al administrador del DNS', 'A nadie: es tu equipo'], 0, 'La red entregó la petición; el fallo ocurre dentro del servicio.'),
        ordenar('diag-o2', 'Construye la comprobación de puerto sin enviar datos a `api.local`.', barajar(['nc', '-zv', 'api.local', '80'], 'diag-o2'), 'nc -zv api.local 80', 'Host y puerto van al final, en ese orden.', ['nc']),
        respuesta('diag-r5', 'Si `nc -zv host 443` responde «succeeded», ¿qué has demostrado?', ['Que el puerto 443 acepta conexiones', 'que el puerto acepta conexiones'], 'Has descartado red, ruta, DNS y cortafuegos hasta ese puerto.'),
      ],
    },
    {
      id: 'diag-parte', titulo: '5. Escribe el parte', subtitulo: 'Convertir comprobaciones en evidencia',
      teoria: [
        { t: 'Un diagnóstico sin registro se pierde', p: 'Guardar la salida de cada comprobación deja constancia de qué se probó, cuándo y con qué resultado. Es la diferencia entre una sospecha y un informe.' },
        { c: 'ip r > diagnostico.txt\ndig +short api.local >> diagnostico.txt' },
        { n: 'Recuerda', p: '`>` crea o vacía el archivo; `>>` añade al final. Confundirlos borra lo anterior.' },
      ],
      practica: [
        terminal('diag-parte-1', 'Empieza un informe: guarda la tabla de rutas en `diagnostico.txt`.', SNAP, 'ip r > diagnostico.txt\ncat diagnostico.txt', (c) => k.existe(c, 'diagnostico.txt') && k.contenido(c, 'diagnostico.txt').includes('default via'), ['`ip r > diagnostico.txt`.']),
        terminal('diag-parte-2', 'Añade al mismo informe, sin borrarlo, la resolución corta de `api.local`.', SNAP, 'ip r > diagnostico.txt\ndig +short api.local >> diagnostico.txt\ncat diagnostico.txt', (c) => k.contenido(c, 'diagnostico.txt').includes('default via') && k.contenido(c, 'diagnostico.txt').includes('192.168.1.60'), ['Añadir sin borrar es `>>`.']),
        ordenar('diag-o3', 'Construye la orden que añade la resolución de `api.local` al final del informe.', barajar(['dig', '+short', 'api.local', '>>', 'diagnostico.txt'], 'diag-o3'), 'dig +short api.local >> diagnostico.txt', 'El doble `>>` conserva lo que ya había.', ['dig', 'redirecciones']),
        quiz('diag-q5', '¿Qué pasa si usas `>` en vez de `>>` sobre un informe que ya tenía contenido?', ['Se borra lo anterior y queda solo lo nuevo', 'Se añade al final', 'Da error', 'Crea un segundo archivo'], 0, '`>` trunca el archivo antes de escribir.'),
        respuesta('diag-r6', 'Escribe el orden correcto de las cinco preguntas del método, empezando por la primera capa.', ['interfaz', 'interfaz ruta nombre puerto aplicacion'], 'Interfaz → ruta → nombre → puerto → aplicación: de abajo arriba, siempre.'),
        terminal('diag-notas', 'Repasa las notas de red del equipo en `notas-red.txt`.', SNAP, 'cat notas-red.txt', (c) => k.salidaTiene(c, 'gateway', '192.168.1.99'), ['`cat notas-red.txt`.']),
      ],
    },
  ],
};

export const SALAS_REDES = [SALA_DNS, SALA_PUERTOS, SALA_HTTP, SALA_DIAGNOSTICO_RED];
