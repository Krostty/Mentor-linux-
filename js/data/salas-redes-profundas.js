// Redes profundas: enlace local, encapsulación, transporte y protección del
// tráfico. Los comandos siguen dentro del simulador; ninguna práctica sale a
// Internet ni contacta objetivos reales.

import * as k from './checks.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';
import { entrena, tareaV2 } from './curriculum-v2.js';

const SNAP = 'red-servicios';

export const SALA_ENLACE_RED = {
  id: 'enlace-red', n: 45, nombre: 'Enlace y red local',
  resumen: 'NIC, Ethernet, Wi-Fi, tramas, MAC, switches, ARP y DHCP sin saltarse capas',
  dificultad: 'Fácil', minutos: 50,
  comandos: ['ip', 'grep', 'ping', 'cat'], origen: 'v2-fase3',
  tareas: [
    tareaV2({
      id: 're-nic-medios', titulo: '1. NIC, medios y red local', subtitulo: 'La interfaz que convierte datos en señales',
      teoria: [
        { t: 'La NIC conecta al medio', p: 'La tarjeta o interfaz de red (**NIC**) transforma datos en señales y viceversa. Tiene estado, MTU y una identidad de enlace.' },
        { t: 'Ethernet y Wi-Fi resuelven el acceso al medio', p: 'Ethernet usa normalmente cable y switches; Wi-Fi usa radio y puntos de acceso. Ambos pueden transportar IP, pero sus detalles físicos y de acceso cambian.' },
        { t: 'LAN no significa “sin routers”', p: 'Una LAN agrupa dispositivos en un dominio local. Para llegar a otra red se entrega el paquete a un router mediante la puerta de enlace.' },
        { f: [['NIC', 'interfaz del equipo'], ['Medio', 'cobre, fibra o radio'], ['Switch/AP', 'conecta el segmento local'], ['Router', 'une redes distintas']] },
      ],
      practica: [
        entrena(quiz('re-nm-q1', '¿Qué hace una NIC?', ['Convierte datos en señales del medio y viceversa', 'Resuelve todos los DNS públicos', 'Crea procesos root', 'Guarda archivos'], 0, 'La NIC es la interfaz entre el sistema y el medio.'), 'enlace-red'),
        entrena(quiz('re-nm-q2', '¿Qué diferencia conceptual destaca entre Ethernet y Wi-Fi?', ['Cable frente a radio como medio habitual', 'TCP frente a UDP', 'IPv4 frente a DNS', 'Usuario frente a grupo'], 0, 'Ambos transportan red, pero acceden a medios distintos.'), 'ethernet'),
        entrena(quiz('re-nm-q3', '¿Qué dispositivo conecta redes IP diferentes?', ['Router', 'Switch de capa de enlace', 'Teclado', 'SSD'], 0, 'El router toma decisiones entre redes.'), 'fundamentos-red'),
        entrena(terminal('re-nm-link', 'Comprueba qué interfaces existen y si están activas.', SNAP, 'ip link', (c) => k.salidaTiene(c, 'lo:', 'eth0:', 'state UP'), ['Usa `ip link`.']), 'enlace-red', 'ip'),
        entrena(respuesta('re-nm-r1', '¿Qué sigla identifica una tarjeta o interfaz de red?', ['nic'], 'NIC: Network Interface Card/Controller.'), 'enlace-red'),
      ],
    }),
    tareaV2({
      id: 're-tramas-mac', titulo: '2. Tramas, MAC y switches', subtitulo: 'Entrega dentro del segmento',
      teoria: [
        { t: 'Ethernet transporta tramas', p: 'En una LAN Ethernet, la unidad de enlace es la **trama**. Incluye MAC de origen, MAC de destino, tipo de contenido y verificación de errores.' },
        { t: 'La MAC identifica una interfaz en el enlace', p: 'Una dirección MAC tiene 48 bits y se escribe en hexadecimal. No reemplaza la IP: responde otra pregunta y solo guía la entrega local.' },
        { t: 'El switch aprende observando', p: 'Un switch registra por qué puerto vio cada MAC de origen. Después reenvía una trama conocida solo por el puerto adecuado; si no conoce el destino, la difunde dentro del segmento.' },
        { n: 'La MAC cambia por salto', p: 'Al cruzar un router se construye otra trama para el siguiente enlace. Las IP origen/destino del paquete suelen permanecer; las MAC no.' },
      ],
      practica: [
        entrena(quiz('re-tm-q1', '¿Cuál es la unidad de datos de Ethernet?', ['Trama', 'Proceso', 'Archivo', 'Consulta DNS'], 0, 'Ethernet mueve tramas.'), 'ethernet'),
        entrena(quiz('re-tm-q2', '¿Para qué aprende MAC un switch?', ['Para elegir el puerto de salida local', 'Para traducir nombres DNS', 'Para asignar usuarios', 'Para montar discos'], 0, 'Su tabla asocia MAC con puertos.'), 'ethernet', 'mac-arp'),
        entrena(quiz('re-tm-q3', '¿Qué suele cambiar cuando un paquete cruza un router?', ['La cabecera de enlace/MAC para el siguiente salto', 'El archivo solicitado', 'El usuario Linux', 'El puerto del proceso local siempre'], 0, 'Cada enlace necesita su propia trama.'), 'mac-arp', 'fundamentos-red'),
        entrena(terminal('re-tm-mac', 'Extrae de `ip a` la dirección Ethernet de la interfaz.', SNAP, 'ip a | grep ether', (c) => k.salidaTiene(c, '52:54:00:a1:b2:c3'), ['Filtra la salida por `ether`.']), 'mac-arp', 'ip', 'grep'),
        entrena(respuesta('re-tm-r1', '¿Qué dispositivo reenvía tramas según una tabla de direcciones MAC?', ['switch', 'conmutador'], 'El switch o conmutador.'), 'ethernet', 'mac-arp'),
      ],
    }),
    tareaV2({
      id: 're-arp', titulo: '3. ARP: de IP local a MAC', subtitulo: 'La pregunta previa a la primera trama',
      teoria: [
        { t: 'La aplicación conoce una IP, Ethernet necesita una MAC', p: 'Antes de enviar dentro de IPv4 local, el host debe conocer qué MAC corresponde a la IP del siguiente salto.' },
        { t: 'ARP pregunta por broadcast', p: 'La solicitud “¿quién tiene esta IP?” se difunde en la LAN. El dueño responde con su MAC y el emisor conserva temporalmente la asociación en caché.' },
        { t: 'El siguiente salto decide a quién preguntar', p: 'Si el destino está en la misma subred, ARP busca su MAC. Si está fuera, ARP busca la MAC del **gateway**, no la del servidor remoto.' },
        { n: 'Implicación de seguridad', p: 'ARP no autentica sus respuestas por diseño. En una red hostil puede falsificarse; la defensa combina segmentación, controles de switch y cifrado extremo a extremo.' },
      ],
      practica: [
        entrena(quiz('re-ar-q1', '¿Qué traduce ARP en una LAN IPv4?', ['IP del siguiente salto a dirección MAC', 'Nombre DNS a contraseña', 'Puerto a proceso', 'Archivo a usuario'], 0, 'ARP resuelve identidad de enlace para una IP local.'), 'mac-arp'),
        entrena(quiz('re-ar-q2', 'El servidor está fuera de tu subred. ¿Qué MAC busca tu equipo?', ['La del gateway', 'La del servidor remoto', 'La del DNS siempre', 'Ninguna'], 0, 'La primera trama solo llega al siguiente salto local.'), 'mac-arp', 'fundamentos-red'),
        entrena(quiz('re-ar-q3', '¿Por qué la solicitud ARP se difunde?', ['Todavía no conoce la MAC del dueño de la IP', 'Porque TCP la exige', 'Porque el disco está lleno', 'Porque usa HTTPS'], 0, 'La pregunta debe llegar a todos en el segmento.'), 'mac-arp'),
        entrena(ordenar('re-ar-o1', 'Ordena la entrega a un destino remoto.', barajar(['comparar subred', '→', 'elegir gateway', '→', 'resolver MAC con ARP', '→', 'enviar trama'], 're-ar-o1'), 'comparar subred → elegir gateway → resolver MAC con ARP → enviar trama', 'Primero se determina el siguiente salto.', ['fundamentos-red', 'mac-arp']), 'fundamentos-red', 'mac-arp'),
        entrena(completar('re-ar-c1', 'Completa el siguiente salto.', 'Destino fuera de la LAN → trama dirigida a la MAC del _______.', ['gateway', 'router', 'puerta de enlace'], 'La trama local se entrega al router.', ['mac-arp']), 'mac-arp'),
      ],
    }),
    tareaV2({
      id: 're-encapsulacion', titulo: '4. Encapsulación', subtitulo: 'Datos dentro de segmento, paquete y trama',
      teoria: [
        { t: 'Cada capa añade contexto', p: 'La aplicación produce datos. TCP puede añadir puertos y control; IP añade direcciones y vida del paquete; Ethernet añade identidad del enlace local.' },
        { t: 'Encapsular no es cifrar', p: 'Encapsulación organiza cabeceras para que cada capa haga su trabajo. El contenido puede seguir legible; TLS es quien aporta confidencialidad en muchos protocolos.' },
        { t: 'En recepción se desencapsula', p: 'La NIC acepta la trama, IP valida el destino, transporte identifica el socket y la aplicación recibe sus datos.' },
        { f: [['Aplicación', 'datos'], ['Transporte', 'segmento o datagrama'], ['Internet', 'paquete IP'], ['Enlace', 'trama'], ['Físico', 'bits/señales']] },
      ],
      practica: [
        entrena(quiz('re-en-q1', '¿Qué añade IP?', ['Direcciones de origen y destino para enrutar', 'Usuarios y grupos', 'Nombres de archivo', 'Permisos rwx'], 0, 'IP permite decidir el camino entre redes.'), 'encapsulacion', 'fundamentos-red'),
        entrena(quiz('re-en-q2', '¿Qué identifica transporte mediante puertos?', ['Aplicaciones o sockets de origen y destino', 'Discos físicos', 'Usuarios Linux', 'Direcciones MAC únicamente'], 0, 'Los puertos entregan a la conversación correcta.'), 'encapsulacion', 'transporte-red'),
        entrena(quiz('re-en-q3', '¿Encapsular cifra automáticamente los datos?', ['No, organiza cabeceras; el cifrado es otro mecanismo', 'Sí, siempre', 'Solo en Ethernet', 'Solo si hay DHCP'], 0, 'Una captura puede ver protocolos no cifrados.'), 'encapsulacion', 'tls'),
        entrena(ordenar('re-en-o1', 'Ordena la encapsulación al enviar.', barajar(['datos', '→', 'segmento TCP', '→', 'paquete IP', '→', 'trama Ethernet', '→', 'bits'], 're-en-o1'), 'datos → segmento TCP → paquete IP → trama Ethernet → bits', 'Cada capa envuelve a la anterior.'), 'encapsulacion'),
        entrena(respuesta('re-en-r1', '¿Cómo se llama el proceso inverso al recibir y retirar cabeceras?', ['desencapsulación', 'desencapsulacion'], 'Desencapsulación.'), 'encapsulacion'),
      ],
      imagen: {
        src: 'assets/teoria/redes/encapsulacion.png', width: 960, height: 640,
        alt: 'Datos de aplicación encapsulados como segmento TCP, paquete IP, trama Ethernet y bits.',
        caption: 'Cada capa añade la información que necesita; encapsular organiza, pero no implica cifrar.',
      },
    }),
    tareaV2({
      id: 're-dhcp', titulo: '5. DHCP: obtener configuración', subtitulo: 'Dirección, máscara, gateway y DNS de forma coordinada',
      teoria: [
        { t: 'Conectar no basta', p: 'Un host necesita dirección, prefijo, gateway y normalmente DNS. DHCP entrega una configuración coherente mediante una concesión temporal.' },
        { t: 'DORA resume el intercambio IPv4', p: '**Discover** busca servidores; **Offer** propone; **Request** solicita una oferta; **Acknowledge** confirma la concesión.' },
        { t: 'La concesión se renueva', p: 'La dirección no se “posee” para siempre. El cliente intenta renovarla antes de que expire; si falla, puede perder conectividad válida.' },
        { n: 'Dirección automática de emergencia', p: 'Una dirección `169.254.x.x` suele indicar que el equipo no obtuvo respuesta DHCP. Permite enlace local limitado, pero no una ruta normal a Internet.' },
      ],
      practica: [
        entrena(quiz('re-dh-q1', '¿Qué conjunto entrega normalmente DHCP?', ['IP, prefijo, gateway y DNS', 'Usuario root y contraseña', 'Certificado TLS privado', 'PID y memoria'], 0, 'DHCP coordina la configuración de red del cliente.'), 'dhcp'),
        entrena(quiz('re-dh-q2', '¿Qué paso sigue a Discover?', ['Offer', 'Acknowledge', 'Route', 'Encrypt'], 0, 'DORA: Discover, Offer, Request, Acknowledge.'), 'dhcp'),
        entrena(quiz('re-dh-q3', '¿Qué sugiere una dirección `169.254.x.x`?', ['No se obtuvo una concesión DHCP normal', 'HTTPS correcto', 'VPN activa', 'Disco lleno'], 0, 'Es una dirección link-local autoconfigurada.'), 'dhcp'),
        entrena(ordenar('re-dh-o1', 'Ordena DORA.', barajar(['Discover', '→', 'Offer', '→', 'Request', '→', 'Acknowledge'], 're-dh-o1'), 'Discover → Offer → Request → Acknowledge', 'Ese es el intercambio inicial habitual.', ['dhcp']), 'dhcp'),
        entrena(terminal('re-dh-ip', 'Confirma que la dirección de `eth0` aparece como obtenida dinámicamente.', SNAP, 'ip a | grep "dynamic eth0"', (c) => k.salidaTiene(c, '192.168.1.50/24', 'dynamic eth0'), ['Filtra `ip a` por `dynamic eth0`.']), 'dhcp', 'ip'),
      ],
    }),
    tareaV2({
      id: 're-local-diagnostico', titulo: '6. Diagnóstico de la LAN', subtitulo: 'Interfaz, dirección, vecino y gateway',
      teoria: [
        { t: 'Empieza por el enlace', p: 'Comprueba que la interfaz existe y está `UP`. Sin enlace no importa qué DNS o aplicación uses.' },
        { t: 'Valida la configuración', p: 'Dirección y prefijo deben pertenecer a la red esperada. Después confirma una ruta por defecto hacia un gateway alcanzable.' },
        { t: 'Separa local de remoto', p: 'Si el gateway responde pero un destino remoto no, el enlace local funciona. Si tampoco responde el gateway, aún no salgas de la LAN en tu investigación.' },
        { t: 'Documenta la capa exacta', p: '“No hay Internet” es ambiguo. “eth0 UP, IP válida, gateway sin respuesta” permite actuar y escalar con evidencia.' },
      ],
      practica: [
        entrena(quiz('re-ld-q1', 'La interfaz está DOWN. ¿Qué capa investigas primero?', ['Enlace', 'DNS', 'HTTP', 'TLS'], 0, 'Sin enlace no existe transporte superior.'), 'enlace-red', 'diagnostico-sistemas'),
        entrena(quiz('re-ld-q2', 'La IP es válida y el gateway responde. ¿Qué ya has demostrado?', ['Que la LAN y el primer salto funcionan', 'Que cualquier web funciona', 'Que TLS es válido', 'Que todos los puertos están abiertos'], 0, 'Aún faltan ruta remota, DNS y servicio.'), 'fundamentos-red', 'diagnostico-sistemas'),
        entrena(terminal('re-ld-inventario', 'Consulta interfaz, dirección y ruta por defecto.', SNAP, 'ip link\nip a\nip route', (c) => k.usó(c, /^ip link$/) && k.usó(c, /^ip a$/) && k.usó(c, /^ip route$/), ['Ejecuta las tres consultas en ese orden.']), 'enlace-red', 'fundamentos-red', 'ip'),
        entrena(terminal('re-ld-gateway', 'Comprueba el primer salto con dos paquetes.', SNAP, 'ping -c 2 192.168.1.1', (c) => k.salidaTiene(c, '2 packets transmitted', '2 received'), ['`ping -c 2 192.168.1.1`.']), 'icmp', 'ping'),
        entrena(ordenar('re-ld-o1', 'Ordena el diagnóstico local.', barajar(['ip link', '→', 'ip a', '→', 'ip route', '→', 'ping gateway'], 're-ld-o1'), 'ip link → ip a → ip route → ping gateway', 'Enlace, configuración, ruta y alcance.', ['diagnostico-sistemas', 'ip']), 'diagnostico-sistemas', 'ip'),
      ],
    }),
  ],
};

export const SALA_TRANSPORTE_RED = {
  id: 'transporte-red', n: 46, nombre: 'Transporte e Internet seguro',
  resumen: 'ICMP, TCP, UDP, IPv6, NAT, TLS, proxies, VPN y firewalls con un modelo común',
  dificultad: 'Intermedio', minutos: 60,
  comandos: ['ping', 'ss', 'ip', 'curl', 'traceroute'], origen: 'v2-fase3',
  tareas: [
    tareaV2({
      id: 'rt-icmp-sockets', titulo: '1. ICMP, puertos y sockets', subtitulo: 'Control de red frente a conversaciones de aplicación',
      teoria: [
        { t: 'ICMP informa sobre la entrega IP', p: 'ICMP transporta mensajes de control y error: eco, destino inalcanzable o tiempo excedido. No usa puertos TCP/UDP.' },
        { t: 'Un puerto identifica una aplicación', p: 'TCP y UDP usan números de puerto. La tupla protocolo, IP y puerto permite distinguir conversaciones y servicios.' },
        { t: 'El socket es el extremo del sistema operativo', p: 'Una aplicación abre un socket, escucha o conecta y el kernel entrega allí los datos que coinciden con su protocolo y dirección.' },
        { n: 'Ping no prueba un servicio', p: 'Que un host responda ICMP demuestra alcance IP parcial. No demuestra que SSH, HTTP o la aplicación específica estén disponibles.' },
      ],
      practica: [
        entrena(quiz('rt-is-q1', '¿Qué transporta ICMP?', ['Mensajes de control y error de IP', 'Archivos mediante puertos', 'Usuarios Linux', 'Certificados privados'], 0, 'ICMP ayuda a informar y diagnosticar la red.'), 'icmp'),
        entrena(quiz('rt-is-q2', '¿Usa ICMP puertos TCP o UDP?', ['No', 'Siempre TCP', 'Siempre UDP', 'Solo el 443'], 0, 'ICMP es otro protocolo sobre IP.'), 'icmp'),
        entrena(quiz('rt-is-q3', '¿Qué representa un socket?', ['Un extremo de comunicación administrado por el sistema', 'Una partición', 'Un usuario', 'Una MAC física'], 0, 'La aplicación usa sockets para enviar, recibir o escuchar.'), 'transporte-red'),
        entrena(terminal('rt-is-ping', 'Comprueba alcance IP hacia el gateway con dos ecos.', SNAP, 'ping -c 2 192.168.1.1', (c) => k.salidaTiene(c, '2 received'), ['`ping -c 2 192.168.1.1`.']), 'icmp', 'ping'),
        entrena(terminal('rt-is-ss', 'Lista sockets TCP y UDP que están escuchando.', SNAP, 'ss -tuln', (c) => k.salidaTiene(c, 'LISTEN', ':22', ':80'), ['`ss -tuln` combina TCP, UDP, escucha y números.']), 'transporte-red', 'ss'),
      ],
    }),
    tareaV2({
      id: 'rt-handshake', titulo: '2. Handshake y estados TCP', subtitulo: 'Acordar antes de transferir',
      objetivo: 'Interpretar estados TCP y justificar el siguiente paso de diagnóstico con evidencia.',
      prerrequisitos: ['Puertos y sockets', 'Diferencia entre cliente y servidor'],
      teoria: [
        { t: 'SYN propone una conexión', p: 'El cliente envía `SYN` con su número inicial de secuencia. El servidor responde `SYN-ACK` si escucha y acepta.' },
        { t: 'ACK confirma', p: 'El tercer mensaje `ACK` confirma la respuesta del servidor. Desde entonces ambos extremos pueden transferir bytes de forma ordenada.' },
        { t: 'Los estados cuentan la historia', p: '`LISTEN` espera; `SYN-SENT` intenta; `ESTAB` transfiere; `TIME-WAIT` protege frente a segmentos retrasados tras cerrar.' },
        { n: 'Diagnóstico por estado', p: 'Muchos `SYN-SENT` apuntan a falta de respuesta o filtrado. Muchos `ESTAB` pueden ser carga normal. El contexto determina si es problema.' },
      ],
      practica: [
        entrena({
          ...quiz('rt-ha-q1', '¿Cuál es el orden del handshake TCP?', ['SYN → SYN-ACK → ACK', 'ACK → SYN → FIN', 'DNS → HTTP → TLS', 'MAC → ARP → DHCP'], 0, 'Tres mensajes establecen la conexión.'),
          feedbackOpciones: [null, 'ACK no puede confirmar una propuesta que todavía no ocurrió; el cliente primero envía SYN.', 'DNS, HTTP y TLS son capas o protocolos distintos, no mensajes del acuerdo TCP.', 'MAC, ARP y DHCP participan en conectividad local, no en el handshake TCP.'],
        }, 'tcp'),
        entrena(quiz('rt-ha-q2', '¿Qué estado indica transferencia activa?', ['ESTAB/ESTABLISHED', 'LISTEN', 'CLOSED sin socket', 'ARP'], 0, 'ESTABLISHED significa conexión aceptada en ambos extremos.'), 'tcp'),
        entrena({
          ...quiz('rt-ha-q3', 'Muchos sockets en SYN-SENT sugieren…', ['Intentos sin respuesta completa', 'Disco lleno', 'Permisos rwx', 'Resolución correcta obligatoriamente'], 0, 'El cliente envió SYN pero no completó el acuerdo.'),
          feedbackOpciones: [null, 'El espacio en disco no explica por sí solo que TCP permanezca esperando SYN-ACK.', 'Los permisos de archivos no describen un estado de transporte TCP.', 'Resolver un nombre no demuestra que el servidor haya respondido al SYN.'],
        }, 'tcp', 'diagnostico-sistemas'),
        entrena(ordenar('rt-ha-o1', 'Ordena los mensajes del handshake.', barajar(['SYN', '→', 'SYN-ACK', '→', 'ACK'], 'rt-ha-o1'), 'SYN → SYN-ACK → ACK', 'Propuesta, aceptación y confirmación.', ['tcp']), 'tcp'),
        entrena(terminal('rt-ha-ss', 'Muestra las conexiones TCP con sus estados sin resolver nombres.', SNAP, 'ss -tan', (c) => k.salidaTiene(c, 'LISTEN', 'ESTAB'), ['Usa `ss -tan`.']), 'tcp', 'ss'),
      ],
      pasos: [
        {
          id: 'tcp-diagnostico', tipo: 'diagnostico', titulo: 'Lee el síntoma antes de estudiar',
          pregunta: 'Un cliente permanece en SYN-SENT. Escribe qué crees que ya ocurrió y qué respuesta falta.',
        },
        {
          id: 'tcp-prediccion', tipo: 'prediccion', titulo: 'Predice el siguiente mensaje',
          pregunta: 'El servidor escucha y recibe un SYN válido. ¿Qué mensaje debería enviar ahora?',
          opciones: ['SYN-ACK', 'ACK final', 'FIN', 'Una consulta DNS'],
          correcta: 0,
        },
        {
          id: 'tcp-ejemplo', tipo: 'ejemplo', indice: 0,
          desarrollo: ['Cliente propone con SYN.', 'Servidor acepta y confirma la propuesta con SYN-ACK.', 'Cliente confirma la respuesta con ACK.'],
        },
        {
          tipo: 'imagen', id: 'tcp-diagrama',
          src: 'assets/teoria/redes/handshake-tcp.png', width: 960, height: 640,
          alt: 'Secuencia TCP de tres mensajes entre cliente y servidor: SYN, SYN-ACK y ACK.',
          caption: 'La conexión existe después de propuesta, aceptación y confirmación; antes solo hay intentos.',
        },
        { id: 'tcp-explica-ack', tipo: 'explicacion', indice: 1 },
        {
          id: 'tcp-guiada-orden', tipo: 'practica-guiada', ejercicioId: 'rt-ha-q1',
          guia: 'Relaciona cada mensaje con propuesta, aceptación y confirmación.',
        },
        { id: 'tcp-estados-modelo', tipo: 'explicacion', indice: 2 },
        { id: 'tcp-recupera-estado', tipo: 'ejercicio', ejercicioId: 'rt-ha-q2' },
        {
          id: 'tcp-transferencia', tipo: 'escenario', ejercicioId: 'rt-ha-q3',
          contexto: 'En un servidor real ves decenas de intentos detenidos en SYN-SENT. Elige la hipótesis que mejor encaja antes de ejecutar otra prueba.',
        },
        { id: 'tcp-diagnostico-modelo', tipo: 'explicacion', indice: 3 },
        { id: 'tcp-construye', tipo: 'practica-guiada', ejercicioId: 'rt-ha-o1' },
        {
          id: 'tcp-terminal', tipo: 'escenario', ejercicioId: 'rt-ha-ss',
          contexto: 'Obtén evidencia local: muestra estados TCP sin depender de resolución de nombres.',
        },
        {
          id: 'tcp-reflexion', tipo: 'reflexion', titulo: 'Explícalo sin memorizar',
          pregunta: '¿Por qué muchos SYN-SENT orientan el diagnóstico, pero no prueban por sí solos cuál es la causa?',
        },
        {
          id: 'tcp-reporte', tipo: 'reporte', titulo: 'Formula el siguiente paso',
          pregunta: 'Documenta observación, hipótesis, evidencia disponible y la siguiente prueba menos invasiva.',
        },
      ],
    }),
    tareaV2({
      id: 'rt-udp-tcp', titulo: '3. TCP y UDP con criterio', subtitulo: 'Fiabilidad, latencia y responsabilidad de la aplicación',
      teoria: [
        { t: 'TCP ofrece un flujo fiable', p: 'Ordena bytes, confirma recepción, retransmite pérdidas y regula el envío. No conserva fronteras entre mensajes: entrega un flujo.' },
        { t: 'UDP entrega datagramas independientes', p: 'No establece conexión ni garantiza llegada u orden. Conserva cada datagrama y deja recuperación, temporización y control a la aplicación.' },
        { t: 'UDP no significa inseguro ni TCP seguro', p: 'Fiabilidad de transporte y seguridad son propiedades distintas. QUIC usa UDP y añade fiabilidad y cifrado en otra capa.' },
        { f: [['Transferencia de archivo', 'TCP: integridad y orden'], ['Voz en vivo', 'UDP: importa la latencia'], ['DNS habitual', 'UDP; TCP si hace falta'], ['HTTPS moderno', 'TCP+TLS o QUIC sobre UDP']] },
      ],
      practica: [
        entrena(quiz('rt-ut-q1', '¿Qué entrega TCP a la aplicación?', ['Un flujo ordenado de bytes', 'Tramas Ethernet', 'Usuarios Linux', 'Particiones'], 0, 'TCP abstrae un flujo fiable.'), 'tcp'),
        entrena(quiz('rt-ut-q2', '¿Qué conserva UDP?', ['Los límites de cada datagrama', 'El orden garantizado', 'Una sesión autenticada', 'La ruta completa'], 0, 'Cada envío UDP es un datagrama independiente.'), 'udp'),
        entrena(quiz('rt-ut-q3', '¿Por qué voz en vivo suele tolerar UDP?', ['Un dato tardío puede ser menos útil que uno perdido', 'UDP cifra siempre', 'No usa IP', 'No necesita aplicación'], 0, 'La latencia importa más que retransmitir audio antiguo.'), 'udp'),
        entrena(quiz('rt-ut-q4', '¿Qué afirmación es correcta?', ['TCP fiable no implica contenido cifrado', 'UDP es siempre malicioso', 'TCP no pierde nunca bajo ninguna capa', 'UDP no usa puertos'], 0, 'TLS u otro protocolo aporta cifrado.'), 'tcp', 'udp', 'tls'),
        entrena(respuesta('rt-ut-r1', '¿Qué protocolo de transporte no establece conexión antes de enviar datagramas?', ['udp'], 'UDP.'), 'udp'),
      ],
    }),
    tareaV2({
      id: 'rt-ipv6', titulo: '4. IPv6 básico', subtitulo: 'Más espacio de direcciones y autoconfiguración',
      teoria: [
        { t: 'IPv6 usa 128 bits', p: 'Se escribe en hexadecimal separado por dos puntos. Puede comprimir ceros una vez con `::`; por ejemplo `2001:db8::10`.' },
        { t: 'Link-local siempre cerca', p: 'Direcciones `fe80::/10` sirven en el enlace local y requieren conocer la interfaz. No se enrutan por Internet.' },
        { t: 'No hay broadcast IPv6', p: 'IPv6 usa multicast y Neighbor Discovery para funciones que IPv4 resuelve con broadcast y ARP.' },
        { n: 'Dual stack es normal', p: 'Muchos sistemas mantienen IPv4 e IPv6 simultáneamente. Diagnosticar exige comprobar qué familia resolvió el nombre y cuál intentó la conexión.' },
      ],
      practica: [
        entrena(quiz('rt-v6-q1', '¿Cuántos bits tiene una dirección IPv6?', ['128', '32', '48', '64'], 0, 'IPv6 amplía el espacio a 128 bits.'), 'ipv6'),
        entrena(quiz('rt-v6-q2', '¿Qué indica normalmente `fe80::/10`?', ['Una dirección link-local', 'Una IPv4 privada', 'Un puerto TLS', 'Una MAC'], 0, 'Solo es válida dentro del enlace.'), 'ipv6'),
        entrena(quiz('rt-v6-q3', '¿Qué sustituye ARP en IPv6?', ['Neighbor Discovery', 'FTP', 'SUID', 'cron'], 0, 'ND usa ICMPv6 y multicast.'), 'ipv6', 'mac-arp'),
        entrena(completar('rt-v6-c1', 'Completa la familia.', '2001:db8::10 es una dirección _____.', ['ipv6'], 'Los grupos hexadecimales y `::` son característicos.', ['ipv6']), 'ipv6'),
        entrena(respuesta('rt-v6-r1', '¿Cómo se llama operar IPv4 e IPv6 simultáneamente?', ['dual stack', 'doble pila', 'pila dual'], 'Dual stack o doble pila.'), 'ipv6'),
      ],
    }),
    tareaV2({
      id: 'rt-nat-pat', titulo: '5. NAT, PAT y port forwarding', subtitulo: 'Traducir direcciones y publicar servicios',
      teoria: [
        { t: 'NAT modifica direcciones', p: 'Un router puede sustituir direcciones privadas por una pública. La tabla de estado permite invertir la traducción para las respuestas.' },
        { t: 'PAT comparte usando puertos', p: 'Muchos equipos salen con una sola IP pública porque el router asigna puertos externos distintos a cada conversación.' },
        { t: 'Port forwarding publica una entrada', p: 'Una regla estática puede dirigir `IP_pública:puerto` hacia `IP_privada:puerto`. Eso expone un servicio y exige autenticación, parches y filtrado.' },
        { n: 'NAT no es un firewall', p: 'La traducción cambia cabeceras; un firewall aplica una política. Suelen convivir en el mismo equipo, pero no son la misma función.' },
      ],
      practica: [
        entrena(quiz('rt-np-q1', '¿Qué modifica NAT?', ['Direcciones IP en tránsito según una tabla', 'Archivos locales', 'Usuarios del servidor', 'Certificados'], 0, 'NAT traduce direcciones.'), 'nat'),
        entrena(quiz('rt-np-q2', '¿Cómo comparte PAT una IP pública?', ['Distingue conversaciones con puertos externos', 'Elimina TCP', 'Cambia el DNS de todos', 'Usa una MAC global'], 0, 'Los puertos permiten mantener traducciones simultáneas.'), 'nat'),
        entrena(quiz('rt-np-q3', '¿Qué hace port forwarding?', ['Dirige una entrada pública a un servicio interno', 'Cifra un disco', 'Crea una VM', 'Resuelve ARP remoto'], 0, 'Publica una correspondencia de dirección y puerto.'), 'nat', 'firewall'),
        entrena(quiz('rt-np-q4', '¿Por qué NAT no sustituye un firewall?', ['Traducir no expresa por sí solo una política completa', 'Porque NAT solo usa IPv6', 'Porque el firewall no ve puertos', 'Porque ambos son archivos'], 0, 'La política debe decidir qué permitir y registrar.'), 'nat', 'firewall'),
        entrena(completar('rt-np-c1', 'Completa el mecanismo.', 'Muchos clientes, una IP pública y puertos distintos: ___.', ['pat', 'nat overload'], 'PAT traduce también puertos.', ['nat']), 'nat'),
      ],
    }),
    tareaV2({
      id: 'rt-tls', titulo: '6. TLS y certificados', subtitulo: 'Confidencialidad, integridad e identidad',
      teoria: [
        { t: 'TLS protege la conversación', p: 'TLS negocia algoritmos y claves para cifrar, detectar modificaciones y autenticar normalmente al servidor.' },
        { t: 'El certificado vincula identidad y clave', p: 'Un certificado contiene nombre, clave pública, validez y firma de una autoridad. El navegador comprueba cadena, nombre y fecha.' },
        { t: 'HTTPS es HTTP dentro de TLS', p: 'TLS protege el transporte, no corrige una aplicación vulnerable ni decide qué usuario puede ver cada recurso.' },
        { n: 'Un aviso tiene una causa concreta', p: 'Nombre distinto, certificado expirado o autoridad no confiable son fallos diferentes. Ignorarlos elimina la garantía de identidad.' },
      ],
      practica: [
        entrena(quiz('rt-tl-q1', '¿Qué propiedades aporta TLS?', ['Confidencialidad, integridad y autenticación', 'Espacio de disco', 'Rutas locales', 'Permisos de archivos'], 0, 'TLS protege la conversación.'), 'tls'),
        entrena(quiz('rt-tl-q2', '¿Qué vincula un certificado?', ['Una identidad con una clave pública', 'Una MAC con un disco', 'Un PID con RAM', 'Un usuario con DHCP'], 0, 'La firma permite verificar esa vinculación.'), 'tls'),
        entrena(quiz('rt-tl-q3', 'El certificado es válido pero la web tiene SQLi. ¿TLS la corrige?', ['No', 'Sí, siempre', 'Solo con IPv6', 'Solo con NAT'], 0, 'TLS no repara la lógica de la aplicación.'), 'tls'),
        entrena(quiz('rt-tl-q4', 'El nombre visitado no aparece en el certificado. ¿Qué garantía falla?', ['Identidad del servidor para ese nombre', 'Capacidad del disco', 'Estado ARP', 'Usuario local'], 0, 'Un certificado para otro nombre no autentica este destino.'), 'tls'),
        entrena(respuesta('rt-tl-r1', '¿Cómo se llama HTTP protegido mediante TLS?', ['https'], 'HTTPS.'), 'tls'),
      ],
    }),
    tareaV2({
      id: 'rt-intermediarios', titulo: '7. Proxies, VPN y firewalls', subtitulo: 'Intermediar, tunelizar y aplicar política',
      teoria: [
        { t: 'El proxy habla en nombre de otro', p: 'Un proxy de salida representa clientes; un **reverse proxy** representa servidores y puede terminar TLS, repartir carga o aplicar controles.' },
        { t: 'La VPN crea un túnel', p: 'Una VPN encapsula y normalmente cifra tráfico entre extremos. Amplía alcance lógico, pero no vuelve confiable todo lo que existe al otro lado.' },
        { t: 'El firewall decide según política', p: 'Evalúa origen, destino, protocolo, puerto, estado y otras señales. Debe permitir lo necesario y registrar rechazos útiles.' },
        { t: 'Diagnóstico con intermediarios', p: 'Distingue conexión directa, proxy, túnel y política. Compara rutas, DNS, certificado observado y logs del punto que tomó la decisión.' },
      ],
      practica: [
        entrena(quiz('rt-in-q1', '¿Qué representa un reverse proxy?', ['A los servidores frente a los clientes', 'Solo al cliente local', 'Un disco virtual', 'Una MAC'], 0, 'Recibe peticiones antes del servicio de aplicación.'), 'proxy-vpn'),
        entrena(quiz('rt-in-q2', '¿Qué aporta una VPN?', ['Un túnel lógico normalmente cifrado entre extremos', 'Permisos root universales', 'Almacenamiento infinito', 'DNS siempre correcto'], 0, 'Protege y transporta tráfico entre redes o hosts.'), 'proxy-vpn'),
        entrena(quiz('rt-in-q3', '¿Qué debe expresar un firewall?', ['Una política de tráfico permitido y rechazado', 'Una tabla de particiones', 'Una lista de procesos', 'El contenido de RAM'], 0, 'El firewall toma decisiones sobre flujos.'), 'firewall'),
        entrena(quiz('rt-in-q4', 'Con VPN activa resuelve un DNS distinto. ¿Qué hipótesis es razonable?', ['El túnel cambió rutas o resolutores', 'La CPU se convirtió en router', 'TLS eliminó DHCP', 'El disco cambió la MAC'], 0, 'Una VPN suele aportar rutas y DNS propios.'), 'proxy-vpn', 'diagnostico-sistemas'),
        entrena(ordenar('rt-in-o1', 'Ordena el diagnóstico con intermediarios.', barajar(['comprobar ruta', '→', 'comprobar DNS', '→', 'identificar proxy o VPN', '→', 'revisar política y logs'], 'rt-in-o1'), 'comprobar ruta → comprobar DNS → identificar proxy o VPN → revisar política y logs', 'Cada intermediario puede cambiar el resultado.', ['proxy-vpn', 'firewall', 'diagnostico-sistemas']), 'proxy-vpn', 'firewall', 'diagnostico-sistemas'),
      ],
    }),
  ],
};

export const SALAS_REDES_PROFUNDAS = [SALA_ENLACE_RED, SALA_TRANSPORTE_RED];
