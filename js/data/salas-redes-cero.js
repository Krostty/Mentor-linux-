// Academia Redes · rutas «Redes desde cero» y «Diagnóstico avanzado».
//
// Las salas de `salas-redes.js` daban por sabido lo básico: entraban ya
// resolviendo nombres y mirando puertos. Aquí está lo de antes —qué es una
// dirección, qué separa una máscara, por qué TCP no es UDP— y lo de después
// —leer el estado de las conexiones, medir latencia y diagnosticar capa a
// capa—. Todo dentro del simulador: ninguna orden sale del dispositivo.

import * as k from './checks.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';

const SNAP = 'red-servicios';

// ---------------------------------------------------------------------------
// 1. Cómo viaja la información
// ---------------------------------------------------------------------------

export const SALA_REDES_CERO = {
  id: 'redes-cero', n: 33, nombre: 'Cómo viaja la información',
  resumen: 'Qué es una dirección, qué hace un router y por qué un servicio necesita además un puerto',
  dificultad: 'Inicial', minutos: 30, comandos: ['ip', 'ping', 'cat', 'grep', 'traceroute'], origen: 'v5-redes',
  tareas: [
    {
      id: 'rc-que-es-red', titulo: '1. Dos máquinas y un cable', subtitulo: 'Direcciones, paquetes y saltos',
      teoria: [
        { t: 'Una red es un acuerdo para trocear', p: 'Nada viaja de una pieza. Lo que envías se parte en **paquetes**, cada uno con la dirección de origen y la de destino escritas encima, como sobres. Cada equipo que los ve decide a quién se los pasa.' },
        { c: '[ tu equipo ] → [ router ] → [ internet ] → [ servidor ]\n   192.168.1.50    192.168.1.1                    10.30.0.15' },
        { t: 'Dentro de tu casa y fuera de ella', p: 'Si el destino está en tu misma red, tu equipo se lo entrega directamente. Si no, se lo da a la **puerta de enlace** (el router), que es el único que sabe salir. Toda la magia de «internet» es repetir eso muchas veces.' },
        { f: [['Dirección IP', 'quién es cada máquina'], ['Máscara', 'dónde acaba tu red'], ['Puerta de enlace', 'por dónde se sale'], ['DNS', 'quién traduce los nombres']] },
        { n: 'Por qué esto se enseña primero', p: 'Casi todos los fallos de red son uno de esos cuatro datos mal puesto. Si sabes cuál es cuál, dejas de adivinar.' },
      ],
      practica: [
        quiz('rc-q1', '¿Qué hace la puerta de enlace?', ['Sacar el tráfico que no es de tu propia red', 'Traducir nombres a direcciones', 'Cifrar tus paquetes', 'Repartir contraseñas'], 0, 'La puerta de enlace (el router) es la salida hacia otras redes; dentro de la tuya los equipos se hablan directamente.'),
        quiz('rc-q2', 'Envías un archivo grande. ¿Cómo viaja?', ['Partido en muchos paquetes numerados', 'De una sola pieza', 'Convertido en un nombre de dominio', 'Solo si el destino está en tu red'], 0, 'Se trocea en paquetes; el destino los reordena por su número.'),
        quiz('rc-q3', '¿Qué dato dice dónde acaba tu red y empieza el resto?', ['La máscara', 'El nombre del equipo', 'El servidor DNS', 'El puerto'], 0, 'La máscara separa la parte de red de la parte de máquina en una dirección.'),
        terminal('rc-ver-ip', 'Muestra las direcciones IP de este equipo quedándote solo con las líneas que las contienen.', SNAP, 'ip a | grep inet', (c) => k.salidaTiene(c, '192.168.1.50') && k.usó(c, /grep/), ['`ip a` lo lista todo; filtra su salida con `grep inet`.']),
        respuesta('rc-r1', 'Según esa salida, ¿cuál es la dirección de este equipo en su red? (sin la barra ni el número que la sigue)', ['192.168.1.50'], 'La otra, `127.0.0.1`, es la dirección de bucle: la máquina hablando consigo misma.'),
        terminal('rc-ver-gw', 'Averigua por dónde sale este equipo hacia otras redes: filtra la tabla de rutas por la ruta por defecto.', SNAP, 'ip route | grep default', (c) => k.salidaTiene(c, 'default', '192.168.1.1'), ['`ip route` muestra la tabla; la salida general es la línea `default`.']),
        respuesta('rc-r2', '¿Qué dirección es la puerta de enlace de esta red?', ['192.168.1.1'], 'Es el router: todo lo que no sea 192.168.1.x se le entrega a él.'),
        completar('rc-c1', 'Completa la palabra que marca la ruta de salida general en la tabla de rutas.', 'ip route | grep _______', ['default'], 'La ruta `default` es la que se usa cuando ninguna otra encaja.'),
      ],
    },
    {
      id: 'rc-identidad', titulo: '2. Los cuatro datos de tu equipo', subtitulo: 'Dirección, máscara, gateway y resolutor',
      teoria: [
        { t: 'Leer una dirección con su máscara', p: 'En `192.168.1.50/24`, el `/24` dice que los tres primeros números identifican la red y el último la máquina. Es decir: tu red es `192.168.1.0` y tus vecinos van del `.1` al `.254`.' },
        { c: '192.168.1.50/24\n└──red──┘└máquina┘' },
        { t: 'Dónde vive cada dato', p: 'La dirección y la máscara se ven con `ip a`. La puerta de enlace, con `ip route`. El resolutor de nombres, en `/etc/resolv.conf`. Son tres sitios distintos y conviene saberlos de memoria.' },
        { f: [['`ip a`', 'direcciones e interfaces'], ['`ip route`', 'por dónde sale el tráfico'], ['`/etc/resolv.conf`', 'a qué DNS se pregunta'], ['`/etc/hosts`', 'nombres fijados a mano']] },
        { n: 'La interfaz también importa', p: '`lo` es el bucle local y siempre está. `eth0` es la tarjeta de verdad. Si `eth0` no aparece, no tienes red: no sigas mirando el DNS.' },
      ],
      practica: [
        terminal('rc-inventario', 'Reúne en `red.txt` la dirección de este equipo y su ruta por defecto, y comprueba después el archivo.', SNAP, 'ip a | grep "inet 192" > red.txt\nip route | grep default >> red.txt\ncat red.txt', (c) => k.existe(c, 'red.txt') && k.contenido(c, 'red.txt').includes('192.168.1.50') && k.contenido(c, 'red.txt').includes('default'), ['Redirige con `>` la primera vez y con `>>` la segunda, para añadir sin borrar.']),
        quiz('rc-q4', '¿Qué significa el `/24` de `192.168.1.50/24`?', ['Los tres primeros números son la red', 'Que hay 24 equipos', 'Que el puerto es el 24', 'Que la conexión va a 24 Mb'], 0, '`/24` son 24 bits de red: los tres primeros octetos.'),
        terminal('rc-resolutor', 'Comprueba a qué servidores DNS pregunta este equipo, mostrando solo esas líneas.', SNAP, 'grep nameserver /etc/resolv.conf', (c) => k.salidaTiene(c, 'nameserver', '192.168.1.1'), ['Filtra `/etc/resolv.conf` por la palabra `nameserver`.']),
        terminal('rc-cuantos-dns', 'Cuenta cuántos servidores DNS tiene configurados este equipo.', SNAP, 'grep -c nameserver /etc/resolv.conf', (c) => k.salidaTiene(c, '2') && k.usó(c, /-c/), ['`grep -c` cuenta líneas en vez de mostrarlas.']),
        ordenar('rc-o1', 'Construye la orden que guarda la tabla de rutas en `rutas.txt`.', barajar(['ip', 'route', '>', 'rutas.txt'], 'rc-o1'), 'ip route > rutas.txt', 'La redirección va al final.', ['ip', 'redirecciones']),
        quiz('rc-q5', '`ip a` no muestra ninguna `inet` en `eth0`. ¿Qué revisas primero?', ['Si el equipo tiene dirección: sin ella no hay red', 'El servidor DNS', 'El navegador', 'Los puertos abiertos'], 0, 'Sin dirección no hay nada que diagnosticar más arriba: se empieza por abajo.'),
        respuesta('rc-r3', '¿Qué interfaz es el bucle local, la que siempre existe aunque no haya red?', ['lo'], '`lo` es «loopback»: `127.0.0.1`, la máquina hablando consigo misma.'),
      ],
    },
    {
      id: 'rc-tcp-udp', titulo: '3. TCP y UDP', subtitulo: 'Dos formas de enviar, dos usos distintos',
      teoria: [
        { t: 'TCP confirma; UDP no espera', p: '**TCP** establece la conexión, numera los paquetes y reenvía lo que se pierde: llega todo y en orden, a cambio de latencia. **UDP** dispara y sigue: rápido y sin garantías.' },
        { f: [['TCP', 'web, SSH, correo, bases de datos'], ['UDP', 'DNS, vídeo en directo, juegos, NTP']] },
        { t: 'El puerto es la puerta del servicio', p: 'La dirección lleva a la máquina; el **puerto** dice con qué programa hablas dentro de ella. Un servidor puede atender web en el 80 y SSH en el 22 con la misma dirección.' },
        { c: '192.168.1.50:22   → SSH\n192.168.1.50:80   → web' },
        { n: 'Los nombres de los puertos', p: '`/etc/services` es la tabla que traduce número a nombre. No abre nada: solo documenta la costumbre.' },
      ],
      practica: [
        quiz('rc-q6', '¿Por qué el DNS usa UDP normalmente?', ['Una pregunta corta y rápida no necesita confirmación', 'Porque es más seguro', 'Porque cifra el tráfico', 'Porque TCP no permite el puerto 53'], 0, 'La consulta cabe en un paquete y, si se pierde, se repite: montar una conexión TCP costaría más.'),
        quiz('rc-q7', 'Descargas un archivo y necesitas que llegue íntegro. ¿Qué protocolo se usa?', ['TCP', 'UDP', 'ICMP', 'DNS'], 0, 'TCP reenvía lo que se pierde y reordena lo que llega desordenado.'),
        terminal('rc-services', 'Consulta en la tabla de servicios qué número de puerto corresponde a `https`.', SNAP, 'grep https /etc/services', (c) => k.salidaTiene(c, '443'), ['`grep https /etc/services`.']),
        terminal('rc-udp-services', 'Muestra solo los servicios de `/etc/services` que trabajan sobre UDP.', SNAP, 'grep udp /etc/services', (c) => k.salidaTiene(c, '53/udp', '123/udp') && !k.ultimaSalida(c).includes('22/tcp'), ['Filtra por la palabra `udp`.']),
        respuesta('rc-r4', 'Según esa tabla, ¿en qué puerto escucha el servicio de nombres (`domain`)?', ['53'], 'El DNS atiende en el 53, normalmente sobre UDP.'),
        completar('rc-c2', 'Completa el protocolo que garantiza que todo llega y en orden.', 'Una descarga usa ___ y no UDP.', ['TCP', 'tcp'], 'TCP confirma cada tramo; UDP no.'),
        quiz('rc-q8', 'Dos servicios distintos en la MISMA máquina se distinguen por…', ['el puerto', 'la máscara', 'la puerta de enlace', 'el nombre del equipo'], 0, 'Misma dirección, puertos distintos.'),
        ordenar('rc-o2', 'Construye la orden que busca el puerto de `postgresql` en la tabla de servicios.', barajar(['grep', 'postgresql', '/etc/services'], 'rc-o2'), 'grep postgresql /etc/services', 'Patrón primero, archivo después.', ['grep']),
      ],
    },
    {
      id: 'rc-nombres', titulo: '4. Del nombre a la máquina', subtitulo: 'Por qué escribes letras y viajan números',
      teoria: [
        { t: 'Nadie memoriza direcciones', p: 'Escribes `intranet.local` y tu equipo tiene que convertirlo en `192.168.1.70` antes de enviar un solo paquete. Primero mira su tabla local `/etc/hosts`; si no está, pregunta al DNS.' },
        { c: '/etc/hosts  →  ¿está aquí?  →  sí: se usa\n            →  no          →  se pregunta al DNS' },
        { t: 'La tabla local gana siempre', p: 'Por eso añadir una línea a `/etc/hosts` permite apuntar un nombre a la máquina que quieras en pruebas, sin tocar nada público.' },
        { n: 'Un fallo típico', p: '«La web no carga» con el nombre pero sí con la IP significa que el problema es de resolución, no del servidor.' },
      ],
      practica: [
        terminal('rc-hosts', 'Comprueba qué nombres tiene fijados este equipo en su tabla local.', SNAP, 'cat /etc/hosts', (c) => k.salidaTiene(c, 'localhost'), ['`cat /etc/hosts`.']),
        terminal('rc-hosts-filtro', 'Filtra esa tabla para quedarte solo con las líneas de la red 192.168.', SNAP, 'grep 192.168 /etc/hosts', (c) => k.salidaTiene(c, '192.168') && !k.ultimaSalida(c).includes('127.0.0.1'), ['`grep 192.168 /etc/hosts`.']),
        quiz('rc-q9', 'Un nombre resuelve mal pero por IP el servicio responde. ¿Dónde está el fallo?', ['En la resolución de nombres', 'En el cable', 'En el puerto del servicio', 'En la máscara'], 0, 'Si por dirección funciona, el transporte está bien: falla la traducción del nombre.'),
        quiz('rc-q10', '¿Qué se consulta ANTES de preguntar al DNS?', ['`/etc/hosts`', '`/etc/services`', '`ip route`', 'El navegador'], 0, 'La tabla local tiene prioridad, y por eso sirve para forzar una dirección en pruebas.'),
        completar('rc-c3', 'Completa la ruta de la tabla local de nombres.', 'cat /etc/_____', ['hosts'], 'Se llama `hosts`, en plural.'),
        respuesta('rc-r5', '¿Cómo se llama el proceso de convertir un nombre en una dirección IP?', ['resolución', 'resolucion', 'resolución de nombres'], 'Resolución de nombres: la hace el sistema antes de conectar.'),
      ],
    },
    {
      id: 'rc-comprobar', titulo: '5. Comprobar de abajo arriba', subtitulo: 'El orden que evita perder media hora',
      teoria: [
        { t: 'Siempre en el mismo orden', p: 'Cuando algo no conecta, se comprueba por capas y de abajo arriba. Cada paso descarta la mitad del problema, así que en tres comandos sabes dónde mirar.' },
        { c: '1. ¿tengo dirección?      ip a\n2. ¿llego al router?      ping -c 2 192.168.1.1\n3. ¿resuelvo nombres?     dig +short api.local\n4. ¿responde el servicio? curl -I http://api.local' },
        { t: 'Qué significa cada fallo', p: 'Sin dirección: problema local. Sin router: cable o Wi-Fi. Con router pero sin nombres: DNS. Con nombres pero sin respuesta: el servicio.' },
        { n: 'Cuidado con `ping`', p: 'Muchos servidores no responden al ping por política. Que no conteste no siempre significa que esté caído; comprueba el puerto antes de dar el aviso.' },
      ],
      practica: [
        terminal('rc-ping-gw', 'Comprueba con dos paquetes que este equipo llega a su puerta de enlace.', SNAP, 'ping -c 2 192.168.1.1', (c) => k.salidaTiene(c, '2 received') || k.salidaTiene(c, '0% packet loss'), ['`ping -c 2 192.168.1.1`: `-c` limita el número de paquetes.']),
        terminal('rc-ruta', 'Traza el camino hasta `intranet.local` y observa cuántos saltos hay.', SNAP, 'traceroute intranet.local', (c) => k.salidaTiene(c, '_gateway', '192.168.1.70'), ['`traceroute intranet.local`.']),
        respuesta('rc-r6', 'En ese trazado, ¿cuál es el PRIMER salto?', ['192.168.1.1', '_gateway'], 'El primer salto siempre es tu puerta de enlace: es por donde sales.'),
        terminal('rc-diagnostico', 'Deja en `chequeo.txt` la ruta por defecto y el resultado corto de resolver `api.local`, y muestra el archivo.', SNAP, 'ip route | grep default > chequeo.txt\ndig +short api.local >> chequeo.txt\ncat chequeo.txt', (c) => k.existe(c, 'chequeo.txt') && k.contenido(c, 'chequeo.txt').includes('default') && k.contenido(c, 'chequeo.txt').includes('192.168.1.60'), ['Dos redirecciones: `>` para crear y `>>` para añadir.']),
        quiz('rc-q11', 'Llegas al router pero ningún nombre resuelve. ¿Qué capa falla?', ['La resolución de nombres (DNS)', 'La tarjeta de red', 'El cable', 'El servicio web'], 0, 'Si el router responde, lo de abajo está bien; lo siguiente en la escalera es el DNS.'),
        quiz('rc-q12', 'Un servidor no responde al `ping` pero su web carga. ¿Qué ocurre?', ['Bloquea el ping por política, pero el servicio funciona', 'Está caído', 'No tiene dirección', 'El DNS está mal'], 0, 'Filtrar ICMP es habitual: el ping no es una prueba fiable de que algo esté caído.'),
        ordenar('rc-o3', 'Construye la comprobación de conectividad con el router usando tres paquetes.', barajar(['ping', '-c', '3', '192.168.1.1'], 'rc-o3'), 'ping -c 3 192.168.1.1', 'La opción y su número van juntos, antes del destino.', ['ping']),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. Direcciones y subredes
// ---------------------------------------------------------------------------

export const SALA_SUBREDES = {
  id: 'subredes', n: 34, nombre: 'Direcciones y subredes',
  resumen: 'Lee una dirección en binario, calcula qué entra en tu red y distingue lo privado de lo público',
  dificultad: 'Fácil', minutos: 35, comandos: ['ip', 'ping', 'grep', 'cat'], origen: 'v5-redes',
  tareas: [
    {
      id: 'sr-binario', titulo: '1. Una dirección son 32 bits', subtitulo: 'Cuatro octetos escritos en decimal',
      teoria: [
        { t: 'Los puntos son una comodidad', p: 'Una dirección IPv4 es un número de 32 bits. Se escribe en cuatro trozos de 8 bits —**octetos**— separados por puntos, porque `192.168.1.50` se recuerda mejor que once mil millones.' },
        { c: '192      .168     .1       .50\n11000000 .10101000 .00000001 .00110010' },
        { t: 'Por qué el máximo es 255', p: 'Ocho bits dan 256 combinaciones: de 0 a 255. Cualquier octeto mayor de 255 no es una dirección válida, y por eso `192.168.1.300` no existe.' },
        { f: [['128 64 32 16 8 4 2 1', 'valor de cada bit'], ['11000000', '128+64 = 192'], ['10101000', '128+32+8 = 168'], ['11111111', '255: todos los bits a uno']] },
      ],
      practica: [
        quiz('sr-q1', '¿Cuántos bits tiene una dirección IPv4?', ['32', '8', '64', '128'], 0, 'Cuatro octetos de 8 bits: 32 en total.'),
        quiz('sr-q2', '¿Por qué ningún octeto pasa de 255?', ['Porque 8 bits solo llegan a 255', 'Por convenio de los routers', 'Porque 256 se reserva al DNS', 'Porque lo impide la máscara'], 0, '2⁸ = 256 valores, de 0 a 255.'),
        respuesta('sr-r1', '¿Cuánto vale en decimal el octeto `11111111`?', ['255'], 'Todos los bits a uno: 128+64+32+16+8+4+2+1.'),
        respuesta('sr-r2', '¿Cuánto vale en decimal el octeto `11000000`?', ['192'], '128 + 64 = 192, el primer octeto de las redes privadas más comunes.'),
        quiz('sr-q3', '¿Cuál de estas NO puede ser una dirección IPv4?', ['192.168.1.300', '10.0.0.1', '172.16.5.4', '8.8.8.8'], 0, '300 no cabe en un octeto.'),
        completar('sr-c1', 'Completa cuántos valores distintos caben en un octeto.', 'Un octeto admite ___ valores, de 0 a 255.', ['256'], '2 elevado a 8.'),
      ],
    },
    {
      id: 'sr-mascara', titulo: '2. La máscara parte la dirección', subtitulo: 'Qué es red y qué es máquina',
      teoria: [
        { t: 'La máscara marca dónde cortar', p: 'La máscara dice cuántos bits del principio identifican la **red**; el resto identifica la **máquina**. `255.255.255.0` —o `/24`— reserva los tres primeros octetos para la red.' },
        { c: 'dirección  192.168.1.50\nmáscara    255.255.255.0\nred        192.168.1.0\nmáquina              .50' },
        { t: 'Para qué sirve saberlo', p: 'Tu equipo compara el destino con su propia red. Si coincide, entrega directo; si no, se lo pasa al router. Una máscara mal puesta hace que intente hablar directamente con quien no puede oírle.' },
        { f: [['/24', '255.255.255.0', '254 equipos'], ['/16', '255.255.0.0', '65 534 equipos'], ['/8', '255.0.0.0', 'más de 16 millones'], ['/32', '255.255.255.255', 'una sola dirección']] },
        { n: 'Dos direcciones no son de nadie', p: 'La primera de cada red la identifica (`192.168.1.0`) y la última es la de difusión (`192.168.1.255`). De ahí que en un /24 quepan 254 equipos y no 256.' },
      ],
      practica: [
        quiz('sr-q4', 'En `10.0.5.7/16`, ¿cuál es la parte de red?', ['10.0', '10.0.5', '10', '10.0.5.7'], 0, '/16 son dos octetos de red: `10.0`.'),
        respuesta('sr-r3', '¿Qué máscara decimal equivale a `/24`?', ['255.255.255.0'], 'Veinticuatro bits a uno: tres octetos completos.'),
        quiz('sr-q5', '¿Cuántos equipos utilizables caben en una red /24?', ['254', '256', '255', '128'], 0, '256 direcciones menos la de red y la de difusión.'),
        respuesta('sr-r4', 'En la red `192.168.1.0/24`, ¿cuál es la dirección de difusión?', ['192.168.1.255'], 'La última de la red: la que llega a todos a la vez.'),
        terminal('sr-mi-red', 'Comprueba con qué máscara está configurada la tarjeta de este equipo.', SNAP, 'ip a | grep "inet 192"', (c) => k.salidaTiene(c, '192.168.1.50/24'), ['Filtra la salida de `ip a` por `inet 192`.']),
        respuesta('sr-r5', 'Según esa salida, ¿en qué red está este equipo? Escríbela con su máscara en formato corto.', ['192.168.1.0/24'], 'Dirección `.50` con `/24`: la red es `192.168.1.0/24`.'),
        completar('sr-c2', 'Completa la máscara corta que reserva dos octetos para la red.', 'La máscara 255.255.0.0 se escribe ___', ['/16', '16'], 'Dieciséis bits a uno.'),
        quiz('sr-q6', '¿Qué pasa si pones una máscara demasiado pequeña, por ejemplo /30 en una red /24?', ['Tu equipo creerá que casi nadie es vecino y lo mandará todo al router', 'Ganarás velocidad', 'Se apagará la tarjeta', 'Cambiará tu dirección'], 0, 'La máscara define a quién considera local; si se estrecha, deja de hablar directamente con sus vecinos reales.'),
      ],
    },
    {
      id: 'sr-cidr', titulo: '3. Cuentas de subred', subtitulo: 'De la notación corta al rango real',
      teoria: [
        { t: 'Cada bit dobla o parte', p: 'Cada bit que le quitas a la máscara duplica el tamaño de la red; cada bit que le añades la parte en dos. Con eso se responde casi cualquier pregunta de subredes sin fórmulas.' },
        { f: [['/24', '256 direcciones'], ['/25', '128'], ['/26', '64'], ['/27', '32'], ['/28', '16'], ['/30', '4: sirve para un enlace entre dos routers']] },
        { t: 'Saber si dos direcciones son vecinas', p: 'Aplica la máscara a las dos y compara la parte de red. `192.168.1.50/24` y `192.168.1.200` comparten `192.168.1`, así que son vecinas. `192.168.2.10` ya no.' },
        { c: '¿está 10.30.0.15 en 10.30.0.0/24?  → sí\n¿está 10.31.0.15 en 10.30.0.0/24?  → no' },
        { n: 'Truco de campo', p: 'En un `/24` basta con mirar si los tres primeros números coinciden. La mayoría de las redes de oficina y de casa son `/24`.' },
      ],
      practica: [
        quiz('sr-q7', '¿Cuántas direcciones tiene una red /26?', ['64', '32', '128', '16'], 0, 'Seis bits libres: 2⁶ = 64 direcciones.'),
        quiz('sr-q8', '¿Está `192.168.1.200` en la misma red que `192.168.1.50/24`?', ['Sí: comparten los tres primeros octetos', 'No: cambia el último número', 'Solo si el router lo permite', 'Solo con máscara /16'], 0, 'En un /24 la red la marcan los tres primeros octetos.'),
        quiz('sr-q9', '¿Y `192.168.2.10` respecto a `192.168.1.50/24`?', ['No: es otra red', 'Sí, siempre', 'Sí, si hay DNS', 'Depende del puerto'], 0, 'El tercer octeto cambia, así que la parte de red es distinta: hace falta el router.'),
        respuesta('sr-r6', '¿Cuántas direcciones tiene una red `/30`?', ['4'], 'Dos bits libres: 4 direcciones, de las que 2 son utilizables. Es la típica de un enlace punto a punto.'),
        terminal('sr-vecino', 'Comprueba con dos paquetes si este equipo alcanza a su vecino `192.168.1.70`.', SNAP, 'ping -c 2 192.168.1.70', (c) => k.salidaTiene(c, '0% packet loss'), ['`ping -c 2 192.168.1.70`.']),
        terminal('sr-tabla', 'Muestra qué redes conoce este equipo por su propia tarjeta, sin la ruta por defecto.', SNAP, 'ip route | grep -v default', (c) => k.salidaTiene(c, '192.168.1.0/24') && !k.ultimaSalida(c).includes('default'), ['`grep -v` invierte el filtro: muestra lo que NO contiene el patrón.']),
        completar('sr-c3', 'Completa la opción de grep que descarta las líneas con el patrón.', 'ip route | grep __ default', ['-v'], '`-v` es «invert match».'),
        ordenar('sr-o1', 'Construye la comprobación de alcance con un solo paquete a la puerta de enlace.', barajar(['ping', '-c', '1', '192.168.1.1'], 'sr-o1'), 'ping -c 1 192.168.1.1', 'Comando, opción con su número y destino.', ['ping']),
      ],
    },
    {
      id: 'sr-privadas', titulo: '4. Privado, público y NAT', subtitulo: 'Por qué tu dirección empieza por 192.168',
      teoria: [
        { t: 'Hay rangos reservados para redes internas', p: 'Tres bloques están apartados para uso privado y no se enrutan por internet. Se repiten en millones de casas y oficinas sin conflicto porque nunca salen tal cual.' },
        { f: [['10.0.0.0/8', 'grandes redes internas'], ['172.16.0.0/12', 'rango intermedio'], ['192.168.0.0/16', 'casas y oficinas pequeñas'], ['127.0.0.0/8', 'bucle local, nunca sale del equipo']] },
        { t: 'NAT: una dirección para todos', p: 'Tu router traduce las direcciones privadas de tu red a su única dirección pública, y recuerda quién pidió qué para devolver cada respuesta a su equipo. Eso es **NAT**.' },
        { c: '192.168.1.50 → [ router NAT ] → 88.20.14.7 → internet' },
        { n: 'Consecuencia práctica', p: 'Desde fuera no se puede llegar a tu equipo directamente: hay que publicar el puerto en el router. Es la razón por la que «no me funciona el servidor desde fuera» casi nunca es un problema del servidor.' },
      ],
      practica: [
        quiz('sr-q10', '¿Cuál de estas direcciones es privada?', ['10.0.4.9', '8.8.8.8', '93.184.216.34', '142.250.185.46'], 0, '`10.0.0.0/8` es uno de los tres rangos privados.'),
        quiz('sr-q11', '¿Qué hace NAT?', ['Traducir las direcciones privadas a la pública del router', 'Cifrar el tráfico', 'Repartir nombres de dominio', 'Asignar puertos a los servicios'], 0, 'Traduce y recuerda las conexiones para devolver cada respuesta a su origen.'),
        respuesta('sr-r7', '¿Qué red completa está reservada al bucle local?', ['127.0.0.0/8', '127.0.0.0'], 'Todo `127.x.x.x` se queda dentro del propio equipo.'),
        quiz('sr-q12', 'Tienes un servicio en tu equipo y desde internet no responde. ¿Qué es lo más probable?', ['Tu dirección es privada y el router no publica ese puerto', 'El servicio no existe', 'Falta el DNS', 'La máscara está mal'], 0, 'Sin publicar el puerto en el router, NAT no sabe a quién entregar la conexión entrante.'),
        terminal('sr-privada', 'Comprueba si la dirección de este equipo pertenece al rango privado 192.168, filtrando la salida de `ip a`.', SNAP, 'ip a | grep "inet 192.168"', (c) => k.salidaTiene(c, '192.168.1.50'), ['Filtra por el prefijo completo `inet 192.168`.']),
        completar('sr-c4', 'Completa el nombre de la traducción que hace el router entre tu red y la pública.', 'El router aplica ___ a tus paquetes.', ['NAT', 'nat'], 'Network Address Translation.'),
        quiz('sr-q13', '¿Por qué se pueden repetir las direcciones privadas en millones de redes?', ['Porque nunca se enrutan por internet', 'Porque cada país tiene las suyas', 'Porque el DNS las diferencia', 'Porque cambian cada día'], 0, 'Solo tienen sentido dentro de su red: fuera se sustituyen por la pública.'),
      ],
    },
    {
      id: 'sr-practica', titulo: '5. Resolver un caso entero', subtitulo: 'Con los datos del propio equipo',
      teoria: [
        { t: 'El método', p: 'Lee tu dirección y tu máscara, deduce tu red, comprueba si el destino cae dentro y actúa: si es vecino, directo; si no, por el router. Cuatro pasos, siempre los mismos.' },
        { c: 'yo:      192.168.1.50/24 → red 192.168.1.0\ndestino: 192.168.1.70   → dentro  → directo\ndestino: 10.30.0.15     → fuera   → por el router' },
        { n: 'Documenta lo que averiguas', p: 'En un trabajo real, lo que no está escrito no existe. Guardar el inventario en un archivo es parte de la tarea, no un extra.' },
      ],
      practica: [
        terminal('sr-informe', 'Deja en `subred.txt` la dirección con su máscara y las redes conocidas sin la ruta por defecto; después revisa el archivo.', SNAP, 'ip a | grep "inet 192" > subred.txt\nip route | grep -v default >> subred.txt\ncat subred.txt', (c) => k.existe(c, 'subred.txt') && k.contenido(c, 'subred.txt').includes('192.168.1.50/24') && k.contenido(c, 'subred.txt').includes('192.168.1.0/24'), ['Primero `>` y luego `>>`, y termina con `cat`.']),
        respuesta('sr-r8', 'Con los datos de este equipo, ¿cuántas direcciones utilizables tiene su red?', ['254'], 'Un /24: 256 menos la de red y la de difusión.'),
        quiz('sr-q14', 'Este equipo quiere hablar con `10.30.0.15`. ¿Cómo sale ese paquete?', ['Por la puerta de enlace, porque está fuera de su red', 'Directamente, porque es privada', 'No puede salir nunca', 'Por el servidor DNS'], 0, '`10.30.0.15` no está en `192.168.1.0/24`, así que se entrega al router.'),
        terminal('sr-vecinos', 'Cuenta cuántos nombres tiene fijados la tabla local en la red 192.168.', SNAP, 'grep -c 192.168 /etc/hosts', (c) => k.usó(c, /grep\s+-c/) && /[1-9]/.test(k.ultimaSalida(c)), ['Combina `grep -c` con el patrón `192.168`.']),
        ordenar('sr-o2', 'Construye la orden que guarda en `red.txt` solo las líneas de dirección de `ip a`.', barajar(['ip', 'a', '|', 'grep', 'inet', '>', 'red.txt'], 'sr-o2'), 'ip a | grep inet > red.txt', 'La tubería filtra y la redirección guarda: en ese orden.', ['ip', 'grep', 'redirecciones']),
        quiz('sr-q15', 'Resumiendo: ¿qué dato decide si un destino es vecino tuyo?', ['Tu máscara aplicada a las dos direcciones', 'El puerto del servicio', 'El servidor DNS', 'La velocidad del enlace'], 0, 'La máscara define la parte de red; si coincide en ambas, son vecinas.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. Conexiones, latencia y rutas
// ---------------------------------------------------------------------------

export const SALA_TRAFICO = {
  id: 'trafico', n: 35, nombre: 'Conexiones, latencia y rutas',
  resumen: 'Lee el estado real de las conexiones, mide latencia, sigue el camino y comprueba un servicio a mano',
  dificultad: 'Intermedio', minutos: 40, comandos: ['ss', 'nmap', 'ping', 'traceroute', 'curl', 'grep', 'wc'], origen: 'v5-redes',
  tareas: [
    {
      id: 'tr-escucha', titulo: '1. Qué escucha en esta máquina', subtitulo: 'ss y sus filtros',
      teoria: [
        { t: 'Escuchar es esperar clientes', p: '`ss -tuln` lista los sockets: `-t` TCP, `-u` UDP, `-l` solo los que escuchan y `-n` sin traducir números a nombres. Es lo primero que se mira en un servidor.' },
        { c: 'ss -tuln\ntcp LISTEN 0.0.0.0:22\ntcp LISTEN 127.0.0.1:5432' },
        { t: 'La dirección de escucha importa más que el puerto', p: '`0.0.0.0:80` escucha en todas las interfaces: accesible desde la red. `127.0.0.1:5432` solo desde la propia máquina. Confundirlas es la causa de la mitad de los «no me conecto».' },
        { f: [['`-t`', 'sockets TCP'], ['`-u`', 'sockets UDP'], ['`-l`', 'solo los que escuchan'], ['`-n`', 'números, sin resolver nombres'], ['`-p`', 'qué proceso lo abrió']] },
      ],
      practica: [
        terminal('tr-listen', 'Lista todos los sockets que escuchan en esta máquina, TCP y UDP, sin resolver nombres.', SNAP, 'ss -tuln', (c) => k.salidaTiene(c, 'LISTEN', 'udp') && k.usó(c, /ss\s+-[tuln]+/), ['Junta las cuatro opciones: `ss -tuln`.']),
        terminal('tr-contar', 'Cuenta cuántos sockets TCP están escuchando.', SNAP, 'ss -tln | grep -c LISTEN', (c) => k.salidaTiene(c, '4'), ['Filtra por `LISTEN` y cuenta con `grep -c`.']),
        respuesta('tr-r1', '¿Qué dirección de escucha significa «solo desde esta misma máquina»?', ['127.0.0.1'], 'El bucle local: nadie de la red puede conectarse ahí.'),
        quiz('tr-q1', 'Un servicio escucha en `127.0.0.1:8080` y desde otro equipo no responde. ¿Por qué?', ['Solo escucha en el bucle local', 'El puerto está mal', 'Falta DNS', 'El cable está desconectado'], 0, 'Hay que hacerlo escuchar en `0.0.0.0` para atender a la red.'),
        terminal('tr-solo-udp', 'Muestra únicamente los sockets UDP que escuchan.', SNAP, 'ss -uln', (c) => k.salidaTiene(c, 'udp') && !k.ultimaSalida(c).includes('tcp'), ['Quita la `t` de las opciones.']),
        completar('tr-c1', 'Completa las opciones que listan sockets TCP en escucha sin resolver nombres.', 'ss _____', ['-tln', '-tnl', '-ltn'], 'Las opciones cortas se pueden juntar en cualquier orden.'),
        quiz('tr-q2', '¿Qué añade `-p` a `ss`?', ['El proceso que abrió el socket', 'El protocolo', 'La prioridad', 'El país de origen'], 0, '`-p` muestra el programa y su PID: quién es el responsable.'),
      ],
    },
    {
      id: 'tr-desde-fuera', titulo: '2. Mirar desde fuera', subtitulo: 'El escaneo dice lo que ve un cliente',
      teoria: [
        { t: 'Dentro y fuera no ven lo mismo', p: '`ss` te dice lo que la máquina abre; un escaneo te dice lo que se ve **desde la red**. La diferencia entre ambas listas es, casi siempre, un cortafuegos.' },
        { c: 'nmap -p 22,80,443 192.168.1.50\n22/tcp  open\n80/tcp  open' },
        { f: [['`-p 22,80`', 'solo esos puertos'], ['`-sV`', 'identifica programa y versión'], ['`-sn`', 'solo descubre si el host vive'], ['`open`', 'alguien escucha y responde'], ['`filtered`', 'algo por medio lo bloquea']] },
        { n: 'Solo sobre lo tuyo', p: 'Escanear una máquina ajena sin autorización es acceso no autorizado. Aquí todo es un laboratorio local simulado, y el criterio se practica igual.' },
      ],
      practica: [
        terminal('tr-escaneo', 'Escanea los puertos 22, 80 y 443 de `192.168.1.50` y guarda el resultado en `escaneo.txt`.', SNAP, 'nmap -p 22,80,443 192.168.1.50 > escaneo.txt\ncat escaneo.txt', (c) => k.existe(c, 'escaneo.txt') && k.contenido(c, 'escaneo.txt').includes('22/tcp') && k.contenido(c, 'escaneo.txt').includes('443/tcp'), ['La lista de puertos va con `-p` separada por comas, y la salida se redirige con `>`.']),
        terminal('tr-abiertos', 'Cuenta cuántos puertos abiertos encontró ese escaneo, leyendo el archivo que guardaste.', SNAP, 'nmap -p 22,80,443 192.168.1.50 > escaneo.txt\ngrep -c open escaneo.txt', (c) => /[1-9]/.test(k.ultimaSalida(c)) && k.usó(c, /grep\s+-c\s+open/), ['`grep -c open escaneo.txt`.']),
        terminal('tr-versiones', 'Identifica qué programa y versión atiende cada puerto de `192.168.1.50`.', SNAP, 'nmap -sV 192.168.1.50', (c) => k.salidaTiene(c, 'open') && k.usó(c, /-sV/), ['La detección de versión es `-sV`.']),
        quiz('tr-q3', '`ss` muestra el puerto 5432 escuchando pero el escaneo desde otro equipo lo da cerrado. ¿Qué explica eso?', ['Escucha solo en el bucle local o hay un cortafuegos', 'El escaneo está roto', 'El servicio no existe', 'Falta el DNS'], 0, 'Ver el socket abierto dentro no garantiza que sea alcanzable desde fuera.'),
        quiz('tr-q4', '¿Qué significa que un puerto salga como `filtered`?', ['Algo por medio bloquea la respuesta', 'Nadie escucha', 'El servicio va lento', 'El puerto no existe'], 0, 'No hay respuesta clara: normalmente un cortafuegos descarta el paquete.'),
        ordenar('tr-o1', 'Construye el escaneo de los puertos 22 y 80 de la puerta de enlace.', barajar(['nmap', '-p', '22,80', '192.168.1.1'], 'tr-o1'), 'nmap -p 22,80 192.168.1.1', 'Comando, opción de puertos y objetivo.', ['nmap']),
        respuesta('tr-r2', '¿Qué opción de nmap identifica la versión de cada servicio?', ['-sV', 'sV'], '`-sV` interroga al servicio para averiguar programa y versión.'),
      ],
    },
    {
      id: 'tr-latencia', titulo: '3. Latencia y camino', subtitulo: 'Medir en vez de opinar',
      teoria: [
        { t: 'La latencia es tiempo de ida y vuelta', p: 'El resumen de `ping` da mínimo, media, máximo y **mdev**, que es cuánto varía. Una media buena con mdev alto se nota más que una media mediocre y estable: es lo que hace que una llamada se corte.' },
        { c: 'rtt min/avg/max/mdev = 12.400/13.450/18.700/1.902 ms' },
        { t: 'Y el camino explica el tiempo', p: '`traceroute` enumera los saltos hasta el destino. Si el retardo se dispara en un salto concreto y sigue alto, el problema está ahí o más allá; si se dispara y luego baja, es solo ese equipo respondiendo con desgana.' },
        { f: [['pérdida de paquetes', 'algo descarta tráfico'], ['mdev alto', 'red inestable, saltos de tiempo'], ['salto que no responde', 'no siempre es un fallo: puede filtrar']] },
      ],
      practica: [
        terminal('tr-medir', 'Mide la latencia hasta `api.local` con cuatro paquetes y quédate solo con la línea del resumen.', SNAP, 'ping -c 4 api.local | grep rtt', (c) => k.salidaTiene(c, 'rtt') && k.usó(c, /grep/), ['El resumen final empieza por `rtt`: fíltralo con `grep`.']),
        terminal('tr-perdida', 'Comprueba el porcentaje de paquetes perdidos hacia `intranet.local` filtrando esa línea.', SNAP, 'ping -c 3 intranet.local | grep loss', (c) => k.salidaTiene(c, 'packet loss'), ['La línea de estadísticas contiene la palabra `loss`.']),
        terminal('tr-saltos', 'Traza la ruta hasta `mentor.dev` y cuenta cuántas líneas de salto devuelve.', SNAP, 'traceroute mentor.dev | wc -l', (c) => /[1-9]/.test(k.ultimaSalida(c)) && k.usó(c, /traceroute/) && k.usó(c, /wc\s+-l/), ['Encadena `traceroute` con `wc -l`.']),
        quiz('tr-q5', '¿Qué mide `mdev` en el resumen de ping?', ['Cuánto varía la latencia', 'La velocidad de descarga', 'El número de saltos', 'La pérdida de paquetes'], 0, 'Es la desviación: cuánto se mueve el tiempo entre paquete y paquete.'),
        quiz('tr-q6', 'Un salto intermedio de `traceroute` no responde pero el destino sí. ¿Qué significa?', ['Ese equipo filtra el trazado, pero el tráfico pasa', 'La ruta está cortada', 'El destino está caído', 'Falta la puerta de enlace'], 0, 'Muchos routers no contestan al trazado por política; lo que importa es que el destino conteste.'),
        respuesta('tr-r3', '¿Cuál es siempre el primer salto de cualquier trazado que sale de tu red?', ['192.168.1.1', 'el gateway', '_gateway', 'la puerta de enlace'], 'Tu puerta de enlace: es por donde sale todo lo que no es local.'),
        completar('tr-c2', 'Completa la opción que limita el número de paquetes de ping.', 'ping __ 4 api.local', ['-c'], '`-c` de «count».'),
      ],
    },
    {
      id: 'tr-http', titulo: '4. Hablar con un servicio a mano', subtitulo: 'curl, códigos y cabeceras',
      teoria: [
        { t: 'El código de respuesta es el diagnóstico', p: '`curl -I` pide solo las cabeceras. La primera línea trae el código, y con él ya sabes de quién es el problema: 2xx bien, 3xx te manda a otro sitio, 4xx has pedido mal, 5xx el servidor ha fallado.' },
        { c: 'curl -I http://api.local\nHTTP/1.1 301 Moved Permanently\nLocation: http://api.local/status' },
        { f: [['200', 'correcto'], ['301', 'movido: sigue la cabecera Location'], ['403', 'existe pero no te deja'], ['404', 'no existe'], ['500', 'el servidor se rompió']] },
        { n: 'Un 404 no es un servidor caído', p: 'Si te responde con un 404, el servicio está vivo y contestando. Distinguir «no responde» de «responde que no» ahorra avisos innecesarios.' },
      ],
      practica: [
        terminal('tr-cabecera', 'Pide solo las cabeceras de `http://api.local` y quédate con la primera línea, la del código.', SNAP, 'curl -I http://api.local | head -1', (c) => k.salidaTiene(c, '301'), ['`curl -I` trae las cabeceras; `head -1` deja la primera línea.']),
        respuesta('tr-r4', '¿A qué dirección te manda esa respuesta? Escribe la URL de la cabecera `Location`.', ['http://api.local/status'], 'Un 301 siempre indica el destino nuevo en `Location`.'),
        terminal('tr-estado', 'Consulta el estado real del servicio en `http://api.local/status`.', SNAP, 'curl http://api.local/status', (c) => k.salidaTiene(c, 'degraded') || k.salidaTiene(c, 'api'), ['`curl` sin opciones devuelve el cuerpo de la respuesta.']),
        terminal('tr-404', 'Comprueba qué código devuelve una ruta que no existe: `http://api.local/salud`.', SNAP, 'curl -I http://api.local/salud | head -1', (c) => k.salidaTiene(c, '404'), ['Misma orden que antes, cambiando la ruta.']),
        terminal('tr-robots', 'Descarga `http://intranet.local/robots.txt` y quédate solo con las líneas que prohíben rutas.', SNAP, 'curl -s http://intranet.local/robots.txt | grep Disallow', (c) => k.salidaTiene(c, 'Disallow', '/admin'), ['`-s` calla el progreso; filtra por `Disallow`.']),
        quiz('tr-q7', 'Un servicio devuelve 500. ¿De quién es el problema?', ['Del servidor: ha fallado procesando la petición', 'Tuyo: has pedido mal', 'Del DNS', 'De la máscara de red'], 0, 'Los 5xx son fallos del lado del servidor.'),
        quiz('tr-q8', '¿Qué diferencia hay entre «no responde» y «responde 404»?', ['Un 404 prueba que el servicio está vivo', 'Ninguna', 'Un 404 significa que está caído', 'Un 404 es un fallo de red'], 0, 'Para contestar 404 alguien tiene que estar escuchando y procesando.'),
        respuesta('tr-r5', '¿Qué opción de curl pide únicamente las cabeceras?', ['-I', 'I', '--head'], '`-I` hace una petición HEAD: cabeceras sin cuerpo.'),
      ],
    },
    {
      id: 'tr-cierre', titulo: '5. Un diagnóstico completo', subtitulo: 'Capa por capa y por escrito',
      teoria: [
        { t: 'Todo junto, en orden', p: 'Dirección, ruta, resolución, alcance, puerto y servicio. Seis comprobaciones en el mismo orden siempre, y cada una descarta una capa entera.' },
        { c: 'ip a            → ¿tengo dirección?\nip route        → ¿sé salir?\ndig +short X    → ¿resuelvo?\nping -c 2 X     → ¿llego?\nnmap -p 80 X    → ¿está el puerto?\ncurl -I http://X → ¿responde el servicio?' },
        { n: 'El informe es la mitad del trabajo', p: 'Un diagnóstico que no queda escrito hay que repetirlo. Guarda las salidas en un archivo con la fecha y compártelo tal cual.' },
      ],
      practica: [
        terminal('tr-informe', 'Construye `informe.txt` con la ruta por defecto, la dirección corta de `api.local` y la primera línea de su respuesta HTTP; después muéstralo.', SNAP, 'ip route | grep default > informe.txt\ndig +short api.local >> informe.txt\ncurl -I http://api.local | head -1 >> informe.txt\ncat informe.txt', (c) => k.existe(c, 'informe.txt') && k.contenido(c, 'informe.txt').includes('default') && k.contenido(c, 'informe.txt').includes('192.168.1.60') && k.contenido(c, 'informe.txt').includes('301'), ['Tres órdenes: la primera con `>` y las otras dos con `>>`.']),
        terminal('tr-servicios-vivos', 'Deja en `puertos.txt` solo las líneas de puertos abiertos de un escaneo a `192.168.1.50`, y cuenta cuántas son.', SNAP, 'nmap -p 22,80,443,5432 192.168.1.50 | grep open > puertos.txt\nwc -l puertos.txt', (c) => k.existe(c, 'puertos.txt') && k.contenido(c, 'puertos.txt').includes('open') && k.usó(c, /wc\s+-l/), ['Filtra la salida del escaneo con `grep open` antes de redirigirla.']),
        quiz('tr-q9', 'Resuelves el nombre, llegas por ping, el puerto 80 sale abierto y curl devuelve 500. ¿Qué informas?', ['La red está bien; falla la aplicación del servidor', 'Falla el DNS', 'Falla el cable', 'Falla la máscara'], 0, 'Todas las capas de red respondieron: el fallo es de la aplicación.'),
        quiz('tr-q10', 'Resuelves el nombre pero el ping falla y el puerto sale filtrado. ¿Qué informas?', ['Hay algo bloqueando el tráfico entre medias', 'El DNS está roto', 'El servicio devuelve 500', 'Tu equipo no tiene dirección'], 0, 'Resolución correcta y transporte bloqueado apunta a cortafuegos o ruta.'),
        ordenar('tr-o2', 'Construye la orden que guarda las cabeceras de la intranet en `cabeceras.txt`.', barajar(['curl', '-I', 'http://intranet.local', '>', 'cabeceras.txt'], 'tr-o2'), 'curl -I http://intranet.local > cabeceras.txt', 'Opción, destino y al final la redirección.', ['curl', 'redirecciones']),
        respuesta('tr-r6', 'En el orden de diagnóstico, ¿qué se comprueba ANTES de mirar el puerto de un servicio?', ['que llego a la máquina', 'ping', 'el alcance'], 'Primero alcanzas la máquina; solo entonces tiene sentido preguntar por su puerto.'),
      ],
    },
  ],
};

export const SALAS_REDES_CERO = [SALA_REDES_CERO, SALA_SUBREDES, SALA_TRAFICO];
