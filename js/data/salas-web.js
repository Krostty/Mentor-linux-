// Fase 5: fundamentos Web y datos antes de estudiar vulnerabilidades.
// Todos los objetivos, sesiones, APIs y bases viven dentro del simulador.

import * as k from './checks.js';
import { quiz, terminal, ordenar, completar, barajar } from './piezas.js';
import { entrena, tareaV2 } from './curriculum-v2.js';

const SNAPSHOT = 'web-lab';

function crearTarea({
  id, titulo, subtitulo, teoria, habilidad, preguntas, relleno, secuencia,
  terminales, imagen = null,
}) {
  const practica = [
    ...preguntas.map(([enunciado, opciones, correcta, explicacion, extras = []], indice) =>
      entrena(quiz(id + '-q' + (indice + 1), enunciado, opciones, correcta, explicacion), habilidad, ...extras)),
    entrena(completar(
      id + '-c1', relleno[0], relleno[1], relleno[2], relleno[3], [habilidad, ...(relleno[4] || [])]
    ), habilidad, ...(relleno[4] || [])),
    entrena(ordenar(
      id + '-o1', secuencia[0], barajar(secuencia[1], id), secuencia[2], secuencia[3], [habilidad, ...(secuencia[4] || [])]
    ), habilidad, ...(secuencia[4] || [])),
    ...terminales.map(([enunciado, solucion, check, pistas, extras = []], indice) =>
      entrena(terminal(id + '-t' + (indice + 1), enunciado, SNAPSHOT, solucion, check, pistas, 30), habilidad, ...extras)),
  ];
  return tareaV2({ id, titulo, subtitulo, teoria, practica, imagen });
}

function crearSala({ id, n, nombre, resumen, dificultad, comandos, tareas }) {
  return {
    id, n, nombre, resumen, dificultad,
    minutos: tareas.length * 35,
    comandos,
    tareas,
    origen: 'v2-fase5',
  };
}

const SALA_WEB_ARQUITECTURA = crearSala({
  id: 'web-arquitectura', n: 45, nombre: 'Cómo funciona la Web',
  resumen: 'Del navegador al servidor, el código y los datos sin saltos conceptuales',
  dificultad: 'Inicial', comandos: ['curl', 'dig', 'grep', 'printf', 'ss'],
  tareas: [
    crearTarea({
      id: 'wa-viaje', titulo: '1. Una página es una conversación', subtitulo: 'Cliente, petición, servidor y respuesta',
      habilidad: 'web-arquitectura',
      teoria: [
        { t: 'Dos papeles distintos', p: 'El navegador es un cliente: formula una petición. El servidor escucha, decide y devuelve una respuesta. Ninguno adivina lo que quiere el otro.' },
        { t: 'El viaje completo', p: 'El nombre se resuelve, se establece transporte, TLS protege el canal y el servidor web entrega la petición a la aplicación. La aplicación puede consultar datos antes de responder.' },
        { c: 'Navegador → DNS → TCP/TLS → servidor web → aplicación → datos\nNavegador ← contenido y estado HTTP ← respuesta' },
        { n: 'Diagnosticar por fronteras', p: 'Un fallo de DNS, TLS, aplicación o base de datos puede verse igual como página que no carga. Identificar la frontera evita probar cosas al azar.' },
      ],
      imagen: { despuesDe: 1, src: 'assets/teoria/web/ciclo-peticion.png', alt: 'Flujo de una petición desde navegador, DNS y TLS hasta servidor, aplicación y datos, con la respuesta de regreso', caption: 'La petición atraviesa varias fronteras; la respuesta vuelve por el canal protegido.', width: 1774, height: 887 },
      preguntas: [
        ['¿Quién inicia normalmente una conversación HTTP?', ['El cliente', 'La base de datos', 'DNS', 'El disco'], 0, 'El cliente construye y envía la petición.'],
        ['¿Qué componente decide la lógica de negocio?', ['La aplicación', 'El cable Ethernet', 'El certificado', 'La pantalla'], 0, 'El servidor web entrega la petición a la aplicación.'],
      ],
      relleno: ['Completa el sentido inicial.', 'cliente → ________ → respuesta', ['petición', 'servidor'], 'El cliente envía una petición al servidor.'],
      secuencia: ['Ordena el recorrido.', ['navegador', '→', 'DNS y TLS', '→', 'servidor', '→', 'aplicación y datos'], 'navegador → DNS y TLS → servidor → aplicación y datos', 'Cada frontera resuelve una responsabilidad.'],
      terminales: [
        ['Observa una conversación detallada con el servidor Web local.', 'curl -v https://web.local', (ctx) => k.salidaTiene(ctx, 'Connected to web.local', 'GET /', 'Tienda Mentor'), ['Usa curl con salida verbose.', 'El destino autorizado es web.local.'], ['curl']],
        ['Empieza por HTTP y deja que curl siga el salto seguro.', 'curl -L http://web.local', (ctx) => k.salidaTiene(ctx, 'Tienda Mentor'), ['Añade la opción que sigue redirecciones.'], ['curl', 'tls']],
      ],
    }),
    crearTarea({
      id: 'wa-url', titulo: '2. Leer una URL', subtitulo: 'Esquema, host, puerto, ruta, query y fragmento',
      habilidad: 'web-url',
      teoria: [
        { c: 'https://web.local:443/api/productos?limite=2#resultado\n  │         │    │              │        └─ fragmento local\n  │         │    │              └────────── query\n  │         │    └───────────────────────── ruta\n  │         └────────────────────────────── host y puerto\n  └──────────────────────────────────────── esquema' },
        { t: 'La URL selecciona un recurso', p: 'El esquema indica el protocolo, el host identifica el servicio y la ruta selecciona un recurso. La query añade parámetros; el fragmento no se envía al servidor.' },
        { t: 'Origen', p: 'Para el navegador, esquema, host y puerto forman el origen. Cambiar cualquiera produce otro origen y activa controles como same-origin y CORS.' },
        { n: 'Codificación', p: 'Espacios y caracteres reservados deben codificarse. Construir URLs concatenando entrada sin validar crea ambigüedades y errores.' },
      ],
      preguntas: [
        ['¿Qué parte no viaja en la petición HTTP?', ['El fragmento', 'La ruta', 'La query', 'El host'], 0, 'El navegador usa el fragmento localmente.'],
        ['¿Qué tres piezas definen un origen?', ['Esquema, host y puerto', 'Ruta, query y fragmento', 'HTML, CSS y JS', 'IP, MAC y PID'], 0, 'El origen no incluye la ruta.'],
      ],
      relleno: ['Completa el parámetro.', 'https://web.local/api/productos?________=2', ['limite'], 'La query comienza después de ?.'],
      secuencia: ['Ordena una URL de izquierda a derecha.', ['esquema', '→', 'host y puerto', '→', 'ruta', '→', 'query', '→', 'fragmento'], 'esquema → host y puerto → ruta → query → fragmento', 'El fragmento queda en el cliente.'],
      terminales: [
        ['Consulta solo los dos primeros productos mediante la query.', 'curl https://web.local/api/productos?limite=2', (ctx) => k.salidaTiene(ctx, 'Teclado', 'Ratón') && !k.ultimaSalida(ctx).includes('Monitor'), ['Usa limite=2 después de ?.'], ['curl', 'api-rest']],
        ['Resuelve el host Web para separar nombre y dirección.', 'dig +short web.local', (ctx) => k.ultimaSalida(ctx).trim() === '192.168.1.90', ['Pregunta el registro corto de web.local.'], ['dig', 'dns']],
      ],
    }),
    crearTarea({
      id: 'wa-html', titulo: '3. HTML da estructura', subtitulo: 'Documento, semántica, accesibilidad y DOM',
      habilidad: 'html-semantico',
      teoria: [
        { t: 'HTML describe significado', p: 'Un título, una navegación, el contenido principal y un formulario expresan estructura. CSS presenta y JavaScript añade comportamiento.' },
        { c: '<main>\n  <h1>Informe</h1>\n  <button type="button">Actualizar</button>\n</main>' },
        { t: 'El navegador construye el DOM', p: 'Parsea las etiquetas como un árbol de nodos. JavaScript consulta y modifica ese árbol; una etiqueta mal anidada puede cambiar el resultado.' },
        { n: 'Accesibilidad primero', p: 'Semántica, labels, orden de foco y nombres accesibles ayudan a teclado, lectores de pantalla y automatización.' },
      ],
      preguntas: [
        ['¿Qué aporta principalmente HTML?', ['Estructura y significado', 'Cifrado TLS', 'Consultas SQL', 'Resolución DNS'], 0, 'HTML representa el documento.'],
        ['¿Qué es el DOM?', ['El árbol de nodos construido por el navegador', 'Una base de datos', 'Un puerto TCP', 'Un hash'], 0, 'El DOM es la representación manipulable del documento.'],
      ],
      relleno: ['Completa la región principal.', '<________><h1>Informe</h1></________>', ['main', 'main'], 'main identifica el contenido central.'],
      secuencia: ['Ordena el procesamiento.', ['recibir HTML', '→', 'parsear etiquetas', '→', 'construir DOM', '→', 'renderizar'], 'recibir HTML → parsear etiquetas → construir DOM → renderizar', 'El DOM precede a la representación visual.'],
      terminales: [
        ['Encuentra el encabezado principal del documento local.', "grep '<h1>' web/index.html", (ctx) => k.salidaTiene(ctx, 'Tienda Mentor'), ['Busca literalmente la etiqueta h1.'], ['grep']],
        ['Crea un fragmento semántico con main y h1.', "printf '<main><h1>Informe</h1></main>\\n' > semantica.html", (ctx) => k.contenido(ctx, 'semantica.html').includes('<main><h1>Informe</h1></main>'), ['Redirige printf a semantica.html.'], ['printf', 'redirecciones']],
      ],
    }),
    crearTarea({
      id: 'wa-recursos', titulo: '4. Formularios y recursos', subtitulo: 'Entradas, navegación, CSS y scripts',
      habilidad: 'web-formularios',
      teoria: [
        { t: 'Un documento solicita más recursos', p: 'link, img y script pueden iniciar nuevas peticiones. La página visible es el resultado de varias respuestas, no de un único archivo.' },
        { t: 'El formulario serializa entrada', p: 'name identifica cada campo y method decide cómo se envían los datos. El servidor debe validar siempre, aunque el navegador ya lo haga.' },
        { c: '<form method="post" action="/api/login">\n  <input name="usuario">\n  <button>Entrar</button>\n</form>' },
        { n: 'Cliente controlable', p: 'HTML y JavaScript llegan al usuario y pueden modificarse. La confianza y la autorización deben vivir en el servidor.' },
      ],
      preguntas: [
        ['¿Qué atributo identifica un campo al enviarlo?', ['name', 'class', 'style', 'lang'], 0, 'Sin name el control no aporta esa clave al formulario.'],
        ['¿Dónde debe repetirse la validación importante?', ['En el servidor', 'Solo en CSS', 'Solo en el navegador', 'En DNS'], 0, 'El cliente no es una frontera de confianza.'],
      ],
      relleno: ['Completa el destino del formulario.', '<form method="post" ________="/api/login">', ['action'], 'action indica el endpoint receptor.'],
      secuencia: ['Ordena un envío.', ['rellenar controles', '→', 'serializar nombres y valores', '→', 'enviar petición', '→', 'validar en servidor'], 'rellenar controles → serializar nombres y valores → enviar petición → validar en servidor', 'La validación del servidor es obligatoria.'],
      terminales: [
        ['Localiza el formulario servido por el laboratorio.', "curl https://web.local | grep '<form'", (ctx) => k.salidaTiene(ctx, 'method="post"', '/api/login'), ['Descarga la portada y filtra form.'], ['curl', 'grep']],
        ['Comprueba qué script carga el HTML local.', "grep 'script src' web/index.html", (ctx) => k.salidaTiene(ctx, 'app.js'), ['Busca la etiqueta script.'], ['grep', 'javascript-web']],
      ],
    }),
    crearTarea({
      id: 'wa-capas', titulo: '5. Capas de una aplicación', subtitulo: 'Servidor Web, aplicación, API y base de datos',
      habilidad: 'web-capas',
      teoria: [
        { t: 'Separar responsabilidades', p: 'El servidor Web termina TLS y sirve archivos; la aplicación aplica reglas; la base persiste datos. Un reverse proxy puede enrutar hacia varios procesos.' },
        { t: 'Una respuesta resume muchas operaciones', p: 'Un 500 puede originarse en código, dependencia o datos. Los registros y un identificador de petición permiten seguir el recorrido.' },
        { c: 'cliente → reverse proxy → aplicación → base de datos\n        ← estado HTTP + cuerpo ←' },
        { n: 'Menor privilegio', p: 'Cada capa necesita solo los permisos y conexiones imprescindibles. Separarlas limita el impacto de un fallo.' },
      ],
      preguntas: [
        ['¿Qué capa aplica normalmente las reglas de negocio?', ['La aplicación', 'DNS', 'El monitor', 'ARP'], 0, 'La aplicación transforma la petición en una decisión.'],
        ['¿Qué facilita seguir una petición entre capas?', ['Un identificador de correlación', 'Cambiar el puerto al azar', 'Ocultar los logs', 'Usar root'], 0, 'El mismo identificador conecta eventos distribuidos.'],
      ],
      relleno: ['Completa la capa intermedia.', 'cliente → reverse proxy → ________ → datos', ['aplicación', 'app'], 'La aplicación aplica la lógica.'],
      secuencia: ['Ordena responsabilidades.', ['terminar TLS', '→', 'enrutar', '→', 'aplicar lógica', '→', 'consultar datos'], 'terminar TLS → enrutar → aplicar lógica → consultar datos', 'Cada capa reduce una parte del problema.'],
      terminales: [
        ['Consulta la documentación textual del servicio.', 'curl https://web.local/documentacion', (ctx) => k.salidaTiene(ctx, 'GET /api/productos', 'POST /api/login'), ['Solicita /documentacion.'], ['curl', 'api-rest']],
        ['Identifica los puertos atendidos por nginx en el sistema simulado.', 'ss -tlpn | grep nginx', (ctx) => k.salidaTiene(ctx, '0.0.0.0:80', '0.0.0.0:443', 'nginx'), ['Lista sockets TCP en escucha y filtra nginx.'], ['ss', 'grep']],
      ],
    }),
  ],
});

const SALA_HTTP_APLICACIONES = crearSala({
  id: 'http-aplicaciones', n: 46, nombre: 'HTTP y HTTPS por dentro',
  resumen: 'Mensajes, métodos, estados, cabeceras, TLS, redirecciones y CORS',
  dificultad: 'Intermedio', comandos: ['curl', 'dig', 'grep'],
  tareas: [
    crearTarea({
      id: 'ha-mensaje', titulo: '1. Anatomía de HTTP', subtitulo: 'Línea inicial, cabeceras y cuerpo',
      habilidad: 'http-mensajes',
      teoria: [
        { c: 'GET /api/productos HTTP/1.1\nHost: web.local\nAccept: application/json\n\n[sin cuerpo]' },
        { t: 'La petición expresa intención', p: 'Método y ruta forman la línea inicial. Las cabeceras aportan contexto; una línea vacía separa el cuerpo.' },
        { c: 'HTTP/1.1 200 OK\nContent-Type: application/json\nContent-Length: 42\n\n[{"id":1,"nombre":"Teclado"}]' },
        { n: 'HTTP no recuerda por sí solo', p: 'Cada mensaje es independiente. Cookies o tokens enlazan varias peticiones cuando la aplicación necesita estado.' },
      ],
      preguntas: [
        ['¿Qué separa cabeceras y cuerpo?', ['Una línea vacía', 'DNS', 'Un hash', 'El puerto 22'], 0, 'La línea vacía termina la sección de cabeceras.'],
        ['¿Qué indica Content-Type?', ['Cómo interpretar el cuerpo', 'La IP del cliente', 'El PID del servidor', 'La contraseña'], 0, 'El receptor necesita conocer el formato.'],
      ],
      relleno: ['Completa la línea inicial.', '________ /api/productos HTTP/1.1', ['GET'], 'GET solicita una representación.'],
      secuencia: ['Ordena una petición.', ['línea de petición', '→', 'cabeceras', '→', 'línea vacía', '→', 'cuerpo opcional'], 'línea de petición → cabeceras → línea vacía → cuerpo opcional', 'El cuerpo no existe en todas las peticiones.'],
      terminales: [
        ['Muestra el intercambio de una consulta API.', 'curl -v https://web.local/api/productos', (ctx) => k.salidaTiene(ctx, 'GET /', 'Host: web.local', 'Teclado'), ['Usa el modo verbose.'], ['curl']],
        ['Envía un documento JSON con POST.', "curl -i -X POST -H 'Content-Type: application/json' -d '{\"nombre\":\"Cable\"}' https://web.local/api/productos", (ctx) => k.salidaTiene(ctx, '201 Created', '"creado":true'), ['Declara application/json y envía nombre.'], ['curl', 'api-rest']],
      ],
    }),
    crearTarea({
      id: 'ha-metodos-estados', titulo: '2. Métodos y estados', subtitulo: 'Intención, resultado y redirecciones',
      habilidad: 'http-metodos',
      teoria: [
        { t: 'El método importa', p: 'GET lee, POST crea o inicia una acción, PUT reemplaza, PATCH modifica parcialmente y DELETE solicita eliminación. La ruta sola no comunica intención.' },
        { t: 'Familias de estado', p: '2xx éxito, 3xx redirección, 4xx problema de la petición o autorización y 5xx fallo del servidor.' },
        { c: '201 Created     recurso creado\n204 No Content  éxito sin cuerpo\n401 Unauthorized falta autenticación\n405 Method Not Allowed' },
        { n: 'No confundir 401 y 403', p: '401 pide autenticarse; 403 reconoce la identidad pero niega esa acción.' },
      ],
      preguntas: [
        ['¿Qué familia representa errores del servidor?', ['5xx', '2xx', '3xx', '1xx'], 0, 'Los 5xx indican que el servidor no pudo completar una petición válida.'],
        ['¿Qué método suele obtener un recurso sin modificarlo?', ['GET', 'POST', 'PATCH', 'DELETE'], 0, 'GET se diseña como seguro.'],
      ],
      relleno: ['Completa el resultado de creación.', 'HTTP/1.1 ________ Created', ['201'], '201 señala que se creó un recurso.'],
      secuencia: ['Ordena la interpretación.', ['leer estado', '→', 'ubicar familia', '→', 'revisar cabeceras', '→', 'interpretar cuerpo'], 'leer estado → ubicar familia → revisar cabeceras → interpretar cuerpo', 'El cuerpo añade detalle al estado.'],
      terminales: [
        ['Observa una redirección sin seguirla.', 'curl -I https://web.local/redirect', (ctx) => k.salidaTiene(ctx, '302 Found', 'Location: https://web.local/documentacion'), ['Solicita solo cabeceras.'], ['curl']],
        ['Sigue la redirección y confirma el recurso final.', 'curl -L https://web.local/redirect', (ctx) => k.salidaTiene(ctx, 'API Mentor Web'), ['Añade -L.'], ['curl']],
      ],
    }),
    crearTarea({
      id: 'ha-cabeceras', titulo: '3. Cabeceras y representaciones', subtitulo: 'Tipo, longitud, negociación y caché',
      habilidad: 'http-cabeceras',
      teoria: [
        { t: 'Metadatos del mensaje', p: 'Content-Type describe el cuerpo, Content-Length su tamaño y Location un nuevo destino. Accept expresa qué representaciones comprende el cliente.' },
        { t: 'Caché con reglas', p: 'Cache-Control y validadores evitan transferir lo mismo sin servir contenido obsoleto. Datos privados requieren políticas más estrictas.' },
        { c: 'Content-Type: application/json\nLocation: /api/productos/4\nCache-Control: no-store' },
        { n: 'No confiar en la extensión', p: 'El tipo declarado y el contenido real deben concordar. El navegador aplica reglas diferentes según el tipo.' },
      ],
      preguntas: [
        ['¿Qué cabecera describe JSON?', ['Content-Type: application/json', 'Host: JSON', 'Location: JSON', 'Server: JSON'], 0, 'Content-Type define el media type.'],
        ['¿Qué cabecera señala un destino nuevo?', ['Location', 'Accept', 'Content-Length', 'Date'], 0, 'Las redirecciones y creaciones pueden usar Location.'],
      ],
      relleno: ['Completa el media type.', 'Content-Type: application/________', ['json'], 'JSON usa application/json.'],
      secuencia: ['Ordena el consumo.', ['leer estado', '→', 'leer Content-Type', '→', 'decodificar cuerpo', '→', 'validar esquema'], 'leer estado → leer Content-Type → decodificar cuerpo → validar esquema', 'Decodificar no equivale a validar.'],
      terminales: [
        ['Muestra cabeceras y JSON de un producto.', 'curl -i https://web.local/api/productos/2', (ctx) => k.salidaTiene(ctx, 'Content-Type: application/json', '"Ratón"'), ['Usa -i para conservar cuerpo.'], ['curl']],
        ['Guarda una representación y comprueba el archivo.', 'curl -o producto.json https://web.local/api/productos/1', (ctx) => k.contenido(ctx, 'producto.json').includes('"Teclado"'), ['Usa -o producto.json.'], ['curl', 'archivos-texto']],
      ],
    }),
    crearTarea({
      id: 'ha-https', titulo: '4. HTTPS y confianza', subtitulo: 'TLS protege el canal, no corrige la aplicación',
      habilidad: 'https-tls',
      teoria: [
        { t: 'Tres garantías del canal', p: 'TLS aporta confidencialidad, integridad y autenticación del servidor mediante certificados y una cadena de confianza.' },
        { t: 'HTTPS sigue siendo HTTP', p: 'Métodos, rutas, cabeceras y cuerpos viajan dentro del canal cifrado. TLS no valida que la lógica de autorización sea correcta.' },
        { c: 'HTTP  → redirección 308 → HTTPS\nHTTPS → certificado válido → HTTP protegido' },
        { n: 'HSTS', p: 'Strict-Transport-Security indica al navegador que vuelva solo por HTTPS durante un periodo y reduce degradaciones accidentales.' },
      ],
      preguntas: [
        ['¿Qué NO garantiza TLS?', ['Que la autorización de la app sea correcta', 'Integridad en tránsito', 'Cifrado en tránsito', 'Identidad del servidor'], 0, 'TLS protege el canal, no la lógica.'],
        ['¿Qué comunica HSTS?', ['Usar HTTPS en futuras visitas', 'Desactivar certificados', 'Guardar contraseñas', 'Abrir SQL'], 0, 'El navegador recuerda la política segura.'],
      ],
      relleno: ['Completa la cabecera.', 'Strict-Transport-________: max-age=31536000', ['Security'], 'HSTS se expresa con Strict-Transport-Security.'],
      secuencia: ['Ordena el establecimiento.', ['resolver nombre', '→', 'conectar TCP', '→', 'negociar TLS', '→', 'enviar HTTP'], 'resolver nombre → conectar TCP → negociar TLS → enviar HTTP', 'HTTP viaja después de proteger el canal.'],
      terminales: [
        ['Comprueba que HTTPS anuncia HSTS.', 'curl -I https://web.local', (ctx) => k.salidaTiene(ctx, 'Strict-Transport-Security', '200 OK'), ['Consulta solo las cabeceras HTTPS.'], ['curl', 'tls']],
        ['Comprueba a dónde conduce HTTP.', 'curl -I http://web.local', (ctx) => k.salidaTiene(ctx, '308 Permanent Redirect', 'Location: https://web.local'), ['Consulta la respuesta sin -L.'], ['curl', 'tls']],
      ],
    }),
    crearTarea({
      id: 'ha-origen-cors', titulo: '5. Same-origin y CORS', subtitulo: 'Qué puede leer el JavaScript de otro origen',
      habilidad: 'cors-sop',
      teoria: [
        { t: 'Same-origin protege lecturas', p: 'El navegador limita que un script de un origen lea respuestas de otro. No es un firewall: el servidor igualmente recibe algunas peticiones.' },
        { t: 'CORS es permiso del servidor', p: 'Access-Control-Allow-Origin declara qué origen puede leer la respuesta. Para peticiones no simples, el navegador consulta primero con OPTIONS.' },
        { c: 'OPTIONS /api/productos\nOrigin: https://app.local\n\nAccess-Control-Allow-Origin: https://app.local' },
        { n: 'Servidor y navegador cooperan', p: 'curl no aplica same-origin porque no es un navegador. Por eso permite observar el protocolo, pero no reproduce todas las restricciones del frontend.' },
      ],
      preguntas: [
        ['¿Quién declara el permiso CORS?', ['El servidor de la API', 'DNS', 'La base de datos', 'El usuario en CSS'], 0, 'El servidor responde con Access-Control-Allow-Origin.'],
        ['¿Qué método usa el preflight?', ['OPTIONS', 'TRACE', 'PATCH', 'CONNECT'], 0, 'OPTIONS pregunta por capacidades antes de la petición real.'],
      ],
      relleno: ['Completa la cabecera de origen.', '________: https://app.local', ['Origin'], 'Origin identifica el origen solicitante.'],
      secuencia: ['Ordena un flujo con preflight.', ['enviar OPTIONS', '→', 'evaluar permiso CORS', '→', 'enviar petición real', '→', 'exponer respuesta al script'], 'enviar OPTIONS → evaluar permiso CORS → enviar petición real → exponer respuesta al script', 'Sin permiso, el navegador no expone la respuesta.'],
      terminales: [
        ['Realiza el preflight autorizado.', "curl -i -X OPTIONS -H 'Origin: https://app.local' https://web.local/api/productos", (ctx) => k.salidaTiene(ctx, '204 No Content', 'Access-Control-Allow-Origin: https://app.local'), ['Usa OPTIONS y una cabecera Origin.'], ['curl']],
        ['Extrae los métodos admitidos por CORS.', "curl -i -X OPTIONS -H 'Origin: https://app.local' https://web.local/api/productos | grep 'Access-Control-Allow-Methods'", (ctx) => k.salidaTiene(ctx, 'GET, POST, OPTIONS'), ['Filtra la cabecera Allow-Methods.'], ['curl', 'grep']],
      ],
    }),
  ],
});

const SALA_JAVASCRIPT_WEB = crearSala({
  id: 'javascript-web', n: 47, nombre: 'JavaScript para comprender el navegador',
  resumen: 'DOM, eventos, asincronía, fetch y fronteras de confianza',
  dificultad: 'Intermedio', comandos: ['cat', 'grep', 'printf', 'curl'],
  tareas: [
    crearTarea({
      id: 'jw-lenguaje', titulo: '1. Datos y funciones', subtitulo: 'El mínimo de JavaScript que exige una aplicación',
      habilidad: 'javascript-web',
      teoria: [
        { c: 'function total(precio, cantidad) {\n  return precio * cantidad;\n}\nconst importe = total(25, 2);' },
        { t: 'Valores y referencias', p: 'JavaScript maneja números, cadenas, booleanos, null, arrays y objetos. const impide reasignar el nombre, no congela el objeto.' },
        { t: 'Funciones con una responsabilidad', p: 'Entradas claras y retorno explícito hacen el comportamiento comprobable. Mezclar DOM, red y cálculo dificulta probar.' },
        { n: 'Tipos dinámicos', p: 'Comparar y convertir de forma explícita evita resultados sorprendentes. La entrada de formularios comienza como texto.' },
      ],
      preguntas: [
        ['¿Qué devuelve una función sin return explícito?', ['undefined', 'null siempre', 'false', '0'], 0, 'undefined representa ausencia de retorno.'],
        ['¿Qué estructura representa pares clave-valor?', ['Un objeto', 'Un puerto', 'Una cabecera TCP', 'Un certificado'], 0, 'Los objetos agrupan propiedades.'],
      ],
      relleno: ['Completa el retorno.', 'function doble(n) { ________ n * 2; }', ['return'], 'return entrega el resultado.'],
      secuencia: ['Ordena una función pura.', ['recibir argumentos', '→', 'calcular', '→', 'devolver resultado', '→', 'usar retorno'], 'recibir argumentos → calcular → devolver resultado → usar retorno', 'La salida explícita puede verificarse.'],
      terminales: [
        ['Localiza la función asíncrona del frontend.', "grep 'async function' web/app.js", (ctx) => k.salidaTiene(ctx, 'cargarProductos'), ['Busca async function.'], ['grep']],
        ['Escribe una función pequeña y comprobable.', "printf 'function doble(n) { return n * 2; }\\n' > calculo.js", (ctx) => k.contenido(ctx, 'calculo.js').includes('return n * 2'), ['Guárdala en calculo.js.'], ['printf', 'redirecciones']],
      ],
    }),
    crearTarea({
      id: 'jw-dom', titulo: '2. DOM y eventos', subtitulo: 'Seleccionar nodos y reaccionar sin mezclar capas',
      habilidad: 'javascript-dom',
      teoria: [
        { t: 'Consulta antes de cambiar', p: 'querySelector devuelve el primer nodo que coincide con un selector CSS. Puede devolver null; el código debe contemplarlo.' },
        { c: "const boton = document.querySelector('#cargar');\nboton.addEventListener('click', cargarProductos);" },
        { t: 'Los eventos conectan intención y función', p: 'click, submit e input describen qué ocurrió. El manejador decide la acción sin incrustar código en HTML.' },
        { n: 'Texto frente a HTML', p: 'textContent inserta texto. innerHTML vuelve a interpretar etiquetas y exige controlar estrictamente el origen del contenido.' },
      ],
      preguntas: [
        ['¿Qué devuelve querySelector si no encuentra nodo?', ['null', 'Una contraseña', 'Un proceso', 'Siempre un div'], 0, 'El resultado debe comprobarse.'],
        ['¿Qué propiedad inserta texto sin interpretarlo como HTML?', ['textContent', 'innerHTML', 'href', 'action'], 0, 'textContent trata el valor como texto.'],
      ],
      relleno: ['Completa el evento.', "boton.addEventListener('________', cargar)", ['click'], 'click se dispara al activar el botón.'],
      secuencia: ['Ordena el flujo.', ['seleccionar nodo', '→', 'registrar manejador', '→', 'recibir evento', '→', 'actualizar DOM'], 'seleccionar nodo → registrar manejador → recibir evento → actualizar DOM', 'El registro ocurre antes del evento.'],
      terminales: [
        ['Localiza la selección del DOM usada por la aplicación.', "grep 'querySelector' web/app.js", (ctx) => k.salidaTiene(ctx, '#productos', '#cargar'), ['Busca querySelector en app.js.'], ['grep']],
        ['Escribe un registro de evento separado del HTML.', "printf \"document.querySelector('#guardar').addEventListener('click', guardar);\\n\" > evento.js", (ctx) => k.contenido(ctx, 'evento.js').includes("addEventListener('click', guardar)"), ['Guarda una línea en evento.js.'], ['printf']],
      ],
    }),
    crearTarea({
      id: 'jw-fetch', titulo: '3. Asincronía y fetch', subtitulo: 'Una promesa de respuesta no es todavía JSON',
      habilidad: 'javascript-fetch',
      teoria: [
        { c: "const respuesta = await fetch('/api/productos');\nif (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);\nconst datos = await respuesta.json();" },
        { t: 'Dos esperas distintas', p: 'fetch resuelve cuando llegan las cabeceras. respuesta.json espera y decodifica el cuerpo. Ambas operaciones pueden fallar por motivos diferentes.' },
        { t: 'El estado no lanza por sí solo', p: 'Un 404 sigue siendo una respuesta válida para fetch. El programa debe revisar ok o status antes de usar el cuerpo.' },
        { n: 'Errores visibles', p: 'La interfaz debe mostrar recuperación útil y conservar detalle técnico en registros, sin filtrar secretos.' },
      ],
      preguntas: [
        ['¿Un 404 hace que fetch rechace siempre la promesa?', ['No', 'Sí', 'Solo con JSON', 'Solo en localhost'], 0, 'Hay que comprobar respuesta.ok.'],
        ['¿Qué hace respuesta.json()?', ['Lee y decodifica el cuerpo JSON', 'Abre DNS', 'Firma un JWT', 'Ejecuta SQL'], 0, 'La decodificación es asíncrona.'],
      ],
      relleno: ['Completa la espera.', 'const respuesta = ________ fetch(url);', ['await'], 'await espera la promesa.'],
      secuencia: ['Ordena el consumo.', ['llamar fetch', '→', 'comprobar status', '→', 'decodificar JSON', '→', 'renderizar datos'], 'llamar fetch → comprobar status → decodificar JSON → renderizar datos', 'No se renderiza antes de validar.'],
      terminales: [
        ['Encuentra la comprobación de estado en el frontend.', "grep 'respuesta.ok' web/app.js", (ctx) => k.salidaTiene(ctx, 'throw new Error'), ['Busca respuesta.ok.'], ['grep']],
        ['Consulta el endpoint que consumiría fetch.', 'curl https://web.local/api/productos', (ctx) => k.salidaTiene(ctx, '"id":1', '"precio":220'), ['Usa el mismo recurso de app.js.'], ['curl', 'api-rest']],
      ],
    }),
    crearTarea({
      id: 'jw-validacion', titulo: '4. Entrada y validación', subtitulo: 'Tipos, formato y reglas en ambos lados',
      habilidad: 'web-validacion',
      teoria: [
        { t: 'Validar por capas', p: 'El navegador mejora la experiencia; la API vuelve a validar tipo, longitud, formato, rango y autorización. La validación cliente se puede modificar.' },
        { c: "const nombre = entrada.value.trim();\nif (nombre.length < 2) mostrarError('Nombre demasiado corto');" },
        { t: 'Normalizar con cuidado', p: 'trim elimina espacios exteriores, pero cambiar mayúsculas o Unicode puede alterar identidades. La regla depende del dato.' },
        { n: 'Mensajes útiles, datos mínimos', p: 'Explica qué corregir sin revelar consultas, rutas internas ni stack traces.' },
      ],
      preguntas: [
        ['¿Por qué validar otra vez en servidor?', ['Porque el cliente es modificable', 'Porque DNS no funciona', 'Para abrir puertos', 'Para evitar HTML'], 0, 'La API es la frontera de confianza.'],
        ['¿Qué debe comprobar una cantidad?', ['Tipo y rango', 'Solo el color', 'El hostname del usuario', 'El PID'], 0, 'Ser numérico no basta si el rango es inválido.'],
      ],
      relleno: ['Completa la normalización exterior.', 'const nombre = entrada.value.________();', ['trim'], 'trim retira espacios exteriores.'],
      secuencia: ['Ordena el tratamiento.', ['recibir entrada', '→', 'normalizar lo permitido', '→', 'validar reglas', '→', 'usar valor'], 'recibir entrada → normalizar lo permitido → validar reglas → usar valor', 'La entrada se usa después de validarla.'],
      terminales: [
        ['Escribe una validación mínima de nombre.', "printf \"const nombre = entrada.value.trim(); if (nombre.length < 2) mostrarError('Nombre demasiado corto');\\n\" > validacion.js", (ctx) => k.contenido(ctx, 'validacion.js').includes('trim()') && k.contenido(ctx, 'validacion.js').includes('length < 2'), ['Guárdala en validacion.js.'], ['printf']],
        ['Comprueba que la API rechaza JSON sin nombre.', "curl -i -X POST -H 'Content-Type: application/json' -d '{\"precio\":10}' https://web.local/api/productos", (ctx) => k.salidaTiene(ctx, '400 Bad Request', 'nombre requerido'), ['Envía un objeto sin nombre.'], ['curl', 'api-rest']],
      ],
    }),
    crearTarea({
      id: 'jw-frontera', titulo: '5. Código público y secretos', subtitulo: 'Todo JavaScript del navegador llega al usuario',
      habilidad: 'web-frontera-confianza',
      teoria: [
        { t: 'El frontend es público', p: 'Código, rutas y configuración enviada al navegador pueden inspeccionarse. Un secreto incluido en JavaScript deja de ser secreto.' },
        { t: 'Configuración no es credencial', p: 'Una URL de API o un identificador público puede vivir en el cliente. Claves privadas, contraseñas y tokens privilegiados pertenecen al servidor.' },
        { c: "const API_BASE = 'https://web.local';     // público\n// const CLAVE_PRIVADA = '...'              // nunca en frontend" },
        { n: 'La ofuscación no crea seguridad', p: 'Minificar dificulta leer, pero el navegador necesita ejecutar el código. La autorización se comprueba en el servidor.' },
      ],
      preguntas: [
        ['¿Dónde debe vivir una clave privada?', ['En el servidor o gestor de secretos', 'En app.js', 'En un comentario HTML', 'En localStorage'], 0, 'El cliente no puede custodiar secretos.'],
        ['¿Minificar convierte un valor en secreto?', ['No', 'Sí siempre', 'Solo con HTTPS', 'Solo en móvil'], 0, 'La ofuscación no cambia la frontera de confianza.'],
      ],
      relleno: ['Completa la regla.', 'Las decisiones de autorización se validan en el ________.', ['servidor', 'backend'], 'El servidor controla recursos y reglas.'],
      secuencia: ['Ordena una decisión segura.', ['cliente solicita', '→', 'servidor autentica', '→', 'servidor autoriza', '→', 'servidor responde'], 'cliente solicita → servidor autentica → servidor autoriza → servidor responde', 'La interfaz no concede permisos.'],
      terminales: [
        ['Inspecciona el código enviado al navegador.', 'cat web/app.js', (ctx) => k.salidaTiene(ctx, 'fetch', 'querySelector') && !k.ultimaSalida(ctx).includes('practica-local'), ['Lee app.js completo.'], ['cat']],
        ['Crea una configuración pública sin credenciales.', "printf \"const API_BASE = 'https://web.local';\\n\" > config-publica.js", (ctx) => k.contenido(ctx, 'config-publica.js').includes('API_BASE') && !k.contenido(ctx, 'config-publica.js').includes('clave'), ['Guarda solo la URL base.'], ['printf']],
      ],
    }),
  ],
});

const SALA_APIS_REST = crearSala({
  id: 'apis-rest', n: 48, nombre: 'APIs y contratos',
  resumen: 'Recursos, JSON, métodos, errores, documentación y clientes reproducibles',
  dificultad: 'Intermedio', comandos: ['curl', 'python3', 'grep'],
  tareas: [
    crearTarea({
      id: 'ar-recursos', titulo: '1. Recursos y endpoints', subtitulo: 'Colecciones, elementos e identificadores',
      habilidad: 'api-rest',
      teoria: [
        { t: 'Modelar sustantivos', p: 'Una API de recursos usa /productos para la colección y /productos/2 para un elemento. El método expresa la operación.' },
        { c: 'GET /api/productos       colección\nGET /api/productos/2     elemento\nPOST /api/productos      nuevo elemento' },
        { t: 'Identificadores estables', p: 'El cliente no debería depender de la posición del elemento en una lista. Un id estable sobrevive a ordenamientos.' },
        { n: 'REST es una restricción de diseño', p: 'No basta con devolver JSON. Métodos, estados, caché y enlaces deben conservar una semántica coherente.' },
      ],
      preguntas: [
        ['¿Qué representa /api/productos?', ['Una colección', 'Una contraseña', 'Un proceso', 'Una MAC'], 0, 'La ruta plural representa varios recursos.'],
        ['¿Dónde expresa REST la operación?', ['En el método HTTP', 'En el color del botón', 'En DNS', 'En el PID'], 0, 'GET y POST sobre la misma ruta tienen intenciones distintas.'],
      ],
      relleno: ['Completa el elemento individual.', '/api/productos/________', ['2', 'id'], 'El identificador selecciona un recurso.'],
      secuencia: ['Ordena el diseño.', ['identificar recurso', '→', 'elegir método', '→', 'definir estado', '→', 'definir representación'], 'identificar recurso → elegir método → definir estado → definir representación', 'El contrato precede al cliente.'],
      terminales: [
        ['Obtén la colección completa.', 'curl https://web.local/api/productos', (ctx) => k.salidaTiene(ctx, 'Teclado', 'Ratón', 'Monitor'), ['Consulta /api/productos.'], ['curl']],
        ['Obtén únicamente el producto 2.', 'curl https://web.local/api/productos/2', (ctx) => k.salidaTiene(ctx, '"id":2', '"Ratón"') && !k.ultimaSalida(ctx).includes('Monitor'), ['Añade /2 a la ruta.'], ['curl']],
      ],
    }),
    crearTarea({
      id: 'ar-json', titulo: '2. JSON conserva estructura', subtitulo: 'Objetos, arrays, tipos y esquema',
      habilidad: 'api-json',
      teoria: [
        { c: '{"id":2,"nombre":"Ratón","precio":25}' },
        { t: 'Tipos limitados y claros', p: 'JSON representa objetos, arrays, cadenas, números, booleanos y null. No incluye fechas ni comentarios como tipos nativos.' },
        { t: 'Parsear no valida', p: 'Un cuerpo puede ser JSON válido y aun faltar una propiedad obligatoria. El consumidor valida forma y significado.' },
        { n: 'Contrato', p: 'OpenAPI documenta rutas, métodos, parámetros y respuestas. Una implementación y sus clientes deben evolucionar de forma compatible.' },
      ],
      preguntas: [
        ['¿Qué delimitador representa un objeto JSON?', ['Llaves', 'Paréntesis', 'Etiquetas HTML', 'Barras'], 0, 'Un objeto usa llaves.'],
        ['¿JSON válido garantiza el esquema esperado?', ['No', 'Sí siempre', 'Solo con TLS', 'Solo con GET'], 0, 'Sintaxis y contrato son comprobaciones distintas.'],
      ],
      relleno: ['Completa la clave entre comillas.', '{"________":"Ratón"}', ['nombre'], 'Las claves JSON son cadenas.'],
      secuencia: ['Ordena el consumo robusto.', ['recibir bytes', '→', 'decodificar JSON', '→', 'validar esquema', '→', 'usar datos'], 'recibir bytes → decodificar JSON → validar esquema → usar datos', 'Cada frontera puede fallar.'],
      terminales: [
        ['Guarda la colección JSON como evidencia local.', 'curl -o productos.json https://web.local/api/productos', (ctx) => k.contenido(ctx, 'productos.json').includes('"precio":220'), ['Usa -o productos.json.'], ['curl', 'python-json']],
        ['Inspecciona las rutas declaradas por el contrato OpenAPI.', 'grep -o \'/api/[a-z]*\' web/api.json', (ctx) => k.salidaTiene(ctx, '/api/productos', '/api/perfil'), ['Extrae rutas que empiezan por /api/.'], ['grep']],
      ],
    }),
    crearTarea({
      id: 'ar-operaciones', titulo: '3. Crear y consultar', subtitulo: 'GET seguro, POST no idempotente y representación',
      habilidad: 'api-metodos',
      teoria: [
        { t: 'Seguridad e idempotencia', p: 'GET debería ser seguro. Repetir PUT con el mismo estado es idempotente; repetir POST puede crear más de un recurso.' },
        { t: 'Crear con contexto', p: 'POST suele responder 201 y Location apunta al recurso creado. El cuerpo puede devolver su identificador.' },
        { c: 'POST /api/productos\nContent-Type: application/json\n\n{"nombre":"Cable"}' },
        { n: 'Reintentos conscientes', p: 'Una caída después de enviar POST deja incertidumbre. Claves de idempotencia o identificadores del cliente permiten reintentos seguros.' },
      ],
      preguntas: [
        ['¿Qué método debería ser seguro?', ['GET', 'POST', 'DELETE', 'PATCH'], 0, 'Leer no debería cambiar el estado.'],
        ['¿Qué estado comunica creación?', ['201', '204', '304', '401'], 0, '201 Created es explícito.'],
      ],
      relleno: ['Completa la cabecera necesaria.', 'Content-Type: application/________', ['json'], 'La API exige JSON.'],
      secuencia: ['Ordena una creación.', ['validar entrada', '→', 'crear recurso', '→', 'asignar id', '→', 'responder 201 y Location'], 'validar entrada → crear recurso → asignar id → responder 201 y Location', 'El cliente recibe una referencia estable.'],
      terminales: [
        ['Crea un producto simulado con JSON.', "curl -i -X POST -H 'Content-Type: application/json' -d '{\"nombre\":\"Cable\"}' https://web.local/api/productos", (ctx) => k.salidaTiene(ctx, '201 Created', 'Location: /api/productos/4'), ['POST, Content-Type y un objeto con nombre.'], ['curl']],
        ['Comprueba que GET conserva la colección inicial.', 'curl https://web.local/api/productos?limite=1', (ctx) => k.salidaTiene(ctx, '"id":1', '"Teclado"'), ['Usa limite=1.'], ['curl']],
      ],
    }),
    crearTarea({
      id: 'ar-errores', titulo: '4. Errores como parte del contrato', subtitulo: 'Estados, cuerpo estable y métodos permitidos',
      habilidad: 'api-errores',
      teoria: [
        { t: 'Error legible por máquinas', p: 'Un estado correcto y un cuerpo estable permiten decidir si corregir, autenticarse, reintentar o escalar.' },
        { c: '{"error":"producto no encontrado","codigo":"PRODUCTO_AUSENTE"}' },
        { t: '405 no es 404', p: '405 indica que la ruta existe pero el método no está permitido. Allow puede enumerar los métodos válidos.' },
        { n: 'No filtrar internals', p: 'El cliente necesita una causa accionable, no consultas SQL, trazas ni rutas del servidor.' },
      ],
      preguntas: [
        ['¿Qué diferencia 405 de 404?', ['La ruta existe pero el método no se admite', 'No hay DNS', 'Falló TLS', 'El cuerpo es HTML'], 0, '405 conserva la existencia del recurso.'],
        ['¿Qué debe evitar un error público?', ['Stack traces y secretos', 'Un código estable', 'Un mensaje accionable', 'Un status correcto'], 0, 'Los internals no pertenecen al cliente.'],
      ],
      relleno: ['Completa el estado.', 'HTTP/1.1 405 Method Not ________', ['Allowed'], '405 significa Method Not Allowed.'],
      secuencia: ['Ordena el tratamiento del cliente.', ['leer status', '→', 'parsear error', '→', 'clasificar recuperabilidad', '→', 'mostrar acción'], 'leer status → parsear error → clasificar recuperabilidad → mostrar acción', 'No todos los errores se reintentan.'],
      terminales: [
        ['Solicita un producto ausente y conserva el estado.', 'curl -i https://web.local/api/productos/99', (ctx) => k.salidaTiene(ctx, '404 Not Found', 'producto no encontrado'), ['Usa el id 99.'], ['curl']],
        ['Prueba un método no permitido.', 'curl -i -X DELETE https://web.local/api/productos', (ctx) => k.salidaTiene(ctx, '405 Method Not Allowed', 'Allow: GET, POST, OPTIONS'), ['Usa DELETE sobre la colección.'], ['curl']],
      ],
    }),
    crearTarea({
      id: 'ar-clientes', titulo: '5. Clientes reproducibles', subtitulo: 'Parámetros, timeouts, evidencia y automatización',
      habilidad: 'api-clientes',
      teoria: [
        { t: 'Petición reproducible', p: 'Método, URL, cabeceras, cuerpo y timeout deben quedar explícitos. Una captura aislada no basta para repetir el caso.' },
        { t: 'Colecciones grandes', p: 'Paginación, filtros y orden limitan coste y estabilizan respuestas. El cliente no debería descargar todo para descartar casi todo.' },
        { c: 'GET /api/productos?limite=2\nAccept: application/json\nTimeout: 3 s' },
        { n: 'Automatizar sin borrar contexto', p: 'El script reúne respuestas y estados; la interpretación final conserva objetivo, hora y alcance.' },
      ],
      preguntas: [
        ['¿Para qué sirve paginar?', ['Limitar coste y tamaño de respuesta', 'Desactivar TLS', 'Crear usuarios root', 'Ocultar estados'], 0, 'Las colecciones crecen.'],
        ['¿Qué evita esperar indefinidamente?', ['Un timeout', 'Un fragmento URL', 'Una clase CSS', 'Una primary key'], 0, 'Toda frontera de red necesita límite.'],
      ],
      relleno: ['Completa la query.', '/api/productos?________=2', ['limite'], 'El laboratorio usa limite.'],
      secuencia: ['Ordena la automatización.', ['fijar petición', '→', 'poner timeout', '→', 'capturar status y cuerpo', '→', 'validar muestra'], 'fijar petición → poner timeout → capturar status y cuerpo → validar muestra', 'La evidencia debe poder repetirse.'],
      terminales: [
        ['Pide una página de dos elementos.', 'curl https://web.local/api/productos?limite=2', (ctx) => k.salidaTiene(ctx, 'Teclado', 'Ratón') && !k.ultimaSalida(ctx).includes('Monitor'), ['Usa limite=2.'], ['curl']],
        ['Obtén solo el código HTTP para automatizar una comprobación.', "curl -s -o /dev/null -w '%{http_code}' https://web.local/api/productos", (ctx) => k.ultimaSalida(ctx).trim() === '200', ['Combina salida silenciosa, /dev/null y http_code.'], ['curl', 'bash-automatizacion']],
      ],
    }),
  ],
});

const SALA_IDENTIDAD_WEB = crearSala({
  id: 'identidad-web', n: 49, nombre: 'Identidad, cookies y sesiones',
  resumen: 'Autenticación, autorización, estado, SameSite y tokens sin secretos mágicos',
  dificultad: 'Intermedio', comandos: ['curl', 'cat', 'cut', 'printf'],
  tareas: [
    crearTarea({
      id: 'iw-dos-preguntas', titulo: '1. Autenticar no es autorizar', subtitulo: 'Quién eres frente a qué puedes hacer',
      habilidad: 'web-identidad',
      teoria: [
        { t: 'Primera pregunta: identidad', p: 'Autenticar aporta evidencia de quién controla la sesión: contraseña, llave, factor o identidad federada.' },
        { t: 'Segunda pregunta: permiso', p: 'Autorizar compara identidad, acción, recurso y contexto. Una persona autenticada no obtiene acceso universal.' },
        { c: 'autenticación: ¿quién eres?\nautorización: ¿puedes leer ESTE perfil?' },
        { n: 'Denegar por defecto', p: 'Si no existe una regla explícita, el servidor niega. La interfaz puede ocultar botones, pero no sustituye la comprobación.' },
      ],
      preguntas: [
        ['¿Qué responde la autorización?', ['Qué puede hacer una identidad', 'Cuál es su IP pública', 'Cómo resolver DNS', 'Qué HTML usar'], 0, 'La autorización evalúa permisos.'],
        ['¿Ocultar un botón protege el endpoint?', ['No', 'Sí siempre', 'Solo con CSS', 'Solo en móvil'], 0, 'El servidor debe comprobar cada acción.'],
      ],
      relleno: ['Completa la segunda decisión.', 'autenticar → identificar; autorizar → comprobar ________', ['permisos', 'permiso'], 'Identidad y permiso son decisiones separadas.'],
      secuencia: ['Ordena una petición protegida.', ['recibir credencial', '→', 'autenticar', '→', 'autorizar recurso y acción', '→', 'responder'], 'recibir credencial → autenticar → autorizar recurso y acción → responder', 'La autorización ocurre después de identificar.'],
      terminales: [
        ['Consulta un perfil sin sesión.', 'curl -i https://web.local/api/perfil', (ctx) => k.salidaTiene(ctx, '401 Unauthorized', 'sesión requerida'), ['No envíes cookie.'], ['curl']],
        ['Prueba credenciales incorrectas.', "curl -i -d 'usuario=ana&clave=incorrecta' https://web.local/api/login", (ctx) => k.salidaTiene(ctx, '401 Unauthorized', 'credenciales inválidas'), ['POST se infiere al usar -d.'], ['curl']],
      ],
    }),
    crearTarea({
      id: 'iw-sesion', titulo: '2. Ciclo de una sesión', subtitulo: 'Credencial una vez, identificador opaco después',
      habilidad: 'web-sesiones',
      teoria: [
        { t: 'La contraseña no viaja en cada petición', p: 'Tras validar el login, el servidor crea estado de sesión y entrega un identificador aleatorio. El navegador lo devuelve como cookie.' },
        { t: 'El servidor conserva la autoridad', p: 'El identificador referencia una sesión que puede caducar o revocarse. No debería contener la contraseña.' },
        { c: 'POST /api/login → Set-Cookie: session=valor-opaco\nGET /api/perfil → Cookie: session=valor-opaco' },
        { n: 'Renovar y cerrar', p: 'La sesión cambia después de autenticar y se invalida al cerrar. Límites de tiempo reducen exposición.' },
      ],
      imagen: { despuesDe: 1, src: 'assets/teoria/web/sesion-autenticacion.png', alt: 'Cuatro etapas: login protegido, validación, entrega de cookie y autorización de una petición posterior', caption: 'La credencial autentica; la cookie identifica una sesión revocable.', width: 1774, height: 887 },
      preguntas: [
        ['¿Qué debería contener la cookie de sesión?', ['Un identificador opaco', 'La contraseña', 'La clave privada', 'La consulta SQL'], 0, 'La sesión real permanece en el servidor.'],
        ['¿Qué ocurre al cerrar sesión?', ['Se invalida la sesión', 'Se publica la cookie', 'Se desactiva TLS', 'Se borra DNS'], 0, 'Un identificador antiguo ya no debe autorizar.'],
      ],
      relleno: ['Completa la respuesta de login.', 'Set-Cookie: ________=valor-opaco', ['session'], 'La cookie referencia la sesión.'],
      secuencia: ['Ordena el ciclo.', ['enviar login por TLS', '→', 'validar credencial', '→', 'crear sesión', '→', 'entregar cookie'], 'enviar login por TLS → validar credencial → crear sesión → entregar cookie', 'La cookie nace tras validar.'],
      terminales: [
        ['Observa la cookie segura emitida por el login.', "curl -i -d 'usuario=ana&clave=practica-local' https://web.local/api/login", (ctx) => k.salidaTiene(ctx, 'Set-Cookie: session=mentor-local-123', 'HttpOnly', 'Secure', 'SameSite=Lax'), ['Envía las credenciales ficticias autorizadas.'], ['curl']],
        ['Guarda la cookie en un jar local.', "curl -c cookies.txt -d 'usuario=ana&clave=practica-local' https://web.local/api/login", (ctx) => k.contenido(ctx, 'cookies.txt').includes('session=mentor-local-123'), ['Usa -c cookies.txt.'], ['curl', 'archivos-texto']],
      ],
    }),
    crearTarea({
      id: 'iw-cookie', titulo: '3. Cookies con límites', subtitulo: 'Secure, HttpOnly, SameSite, alcance y expiración',
      habilidad: 'web-cookies',
      teoria: [
        { t: 'Atributos complementarios', p: 'Secure limita el envío a HTTPS; HttpOnly impide lectura desde JavaScript; SameSite reduce envíos entre sitios. Ninguno reemplaza la autorización.' },
        { t: 'Alcance mínimo', p: 'Domain y Path determinan dónde se envía. Una cookie con alcance innecesariamente amplio llega a más componentes.' },
        { c: 'Set-Cookie: session=…; Secure; HttpOnly; SameSite=Lax; Path=/' },
        { n: 'Datos pequeños', p: 'Las cookies acompañan peticiones y tienen límites. No son una base de datos ni un lugar para secretos legibles.' },
      ],
      preguntas: [
        ['¿Qué atributo impide leer la cookie con JavaScript?', ['HttpOnly', 'Secure', 'Path', 'Max-Age'], 0, 'HttpOnly reduce exposición al script.'],
        ['¿Qué atributo exige HTTPS?', ['Secure', 'SameSite', 'Domain', 'Expires'], 0, 'Secure evita envío por HTTP.'],
      ],
      relleno: ['Completa el atributo.', 'Set-Cookie: session=...; ________; HttpOnly', ['Secure'], 'Secure restringe el transporte.'],
      secuencia: ['Ordena una reutilización.', ['leer jar', '→', 'seleccionar cookie por alcance', '→', 'enviar por HTTPS', '→', 'validar sesión'], 'leer jar → seleccionar cookie por alcance → enviar por HTTPS → validar sesión', 'El servidor valida el identificador recibido.'],
      terminales: [
        ['Autentícate y reutiliza el jar para leer el perfil.', "curl -c cookies.txt -d 'usuario=ana&clave=practica-local' https://web.local/api/login\ncurl -b cookies.txt https://web.local/api/perfil", (ctx) => k.salidaTiene(ctx, '"usuario":"ana"', '"rol":"analista"'), ['Primero -c; después -b.'], ['curl']],
        ['Muestra el identificador guardado en el jar.', "curl -c cookies.txt -d 'usuario=ana&clave=practica-local' https://web.local/api/login\ncat cookies.txt", (ctx) => k.salidaTiene(ctx, 'session=mentor-local-123'), ['Crea cookies.txt y léelo.'], ['curl', 'cat']],
      ],
    }),
    crearTarea({
      id: 'iw-sitios', titulo: '4. Peticiones entre sitios', subtitulo: 'SameSite, CSRF y preflight no son lo mismo',
      habilidad: 'web-csrf',
      teoria: [
        { t: 'El navegador puede adjuntar credenciales', p: 'Una petición iniciada desde otro sitio puede incluir cookies según contexto y SameSite. Por eso una acción sensible necesita defensa contra solicitudes no intencionadas.' },
        { t: 'CSRF y CORS resuelven preguntas distintas', p: 'CSRF trata acciones con credenciales del usuario; CORS controla qué respuestas puede leer un script de otro origen.' },
        { c: 'SameSite + token anti-CSRF + comprobación Origin\nCORS → permiso explícito de lectura entre orígenes' },
        { n: 'Métodos seguros', p: 'GET no debe cambiar estado. Acciones sensibles usan método adecuado, validación y una señal que otro sitio no pueda fabricar.' },
      ],
      preguntas: [
        ['¿CORS por sí solo evita todo CSRF?', ['No', 'Sí', 'Solo con JSON', 'Solo con DNSSEC'], 0, 'Lectura entre orígenes y acción autenticada son problemas distintos.'],
        ['¿GET debería modificar estado?', ['No', 'Sí siempre', 'Solo con cookie', 'Solo con TLS'], 0, 'GET se diseña como seguro.'],
      ],
      relleno: ['Completa una defensa de cookie.', 'SameSite=________', ['Lax', 'Strict'], 'Lax o Strict limita contextos entre sitios.'],
      secuencia: ['Ordena una acción sensible.', ['recibir POST', '→', 'validar sesión', '→', 'validar señal anti-CSRF', '→', 'autorizar acción'], 'recibir POST → validar sesión → validar señal anti-CSRF → autorizar acción', 'La sesión sola no demuestra intención.'],
      terminales: [
        ['Consulta la política CORS antes de un POST.', "curl -i -X OPTIONS -H 'Origin: https://app.local' https://web.local/api/productos", (ctx) => k.salidaTiene(ctx, 'Access-Control-Allow-Methods: GET, POST, OPTIONS'), ['Usa el preflight OPTIONS.'], ['curl', 'cors-sop']],
        ['Comprueba que el servidor exige el formato declarado.', "curl -i -X POST -d 'nombre=Cable' https://web.local/api/productos", (ctx) => k.salidaTiene(ctx, '415 Unsupported Media Type'), ['Omite Content-Type para observar el rechazo.'], ['curl', 'api-errores']],
      ],
    }),
    crearTarea({
      id: 'iw-tokens', titulo: '5. Tokens y decisiones de acceso', subtitulo: 'JWT firmado no significa secreto ni permiso universal',
      habilidad: 'web-tokens',
      teoria: [
        { t: 'Tres segmentos no implican cifrado', p: 'Un JWT típico contiene cabecera, payload y firma. Cabecera y payload suelen estar codificados, no cifrados; no guardes secretos allí.' },
        { t: 'Validar antes de confiar', p: 'El receptor comprueba algoritmo permitido, firma, emisor, audiencia y tiempos. Después todavía autoriza la acción concreta.' },
        { c: 'cabecera.payload.firma\nidentidad verificada ≠ permiso automático' },
        { n: 'Elegir el mecanismo por el sistema', p: 'Sesiones de servidor simplifican revocación; tokens ayudan entre servicios. Ninguno es superior en todos los contextos.' },
      ],
      preguntas: [
        ['¿El payload de un JWT es secreto por defecto?', ['No', 'Sí', 'Solo si tiene tres puntos', 'Solo con HTTP'], 0, 'Base64url no cifra.'],
        ['¿Qué ocurre después de validar la firma?', ['Se evalúa autorización', 'Se concede todo', 'Se omite expiración', 'Se abre SQL'], 0, 'Identidad y permiso permanecen separados.'],
      ],
      relleno: ['Completa la estructura.', 'cabecera.________.firma', ['payload'], 'El payload contiene claims.'],
      secuencia: ['Ordena la validación.', ['limitar algoritmo', '→', 'verificar firma', '→', 'validar emisor y tiempos', '→', 'autorizar acción'], 'limitar algoritmo → verificar firma → validar emisor y tiempos → autorizar acción', 'Una firma válida no decide permisos.'],
      terminales: [
        ['Separa el payload de un token didáctico.', "printf 'cabecera.payload.firma\\n' > token.txt\ncut -d. -f2 token.txt", (ctx) => k.ultimaSalida(ctx).trim() === 'payload', ['Corta el segundo campo delimitado por punto.'], ['printf', 'cut']],
        ['Guarda identidad y rol como datos separados.', "printf 'usuario=ana\\nrol=analista\\n' > identidad.txt", (ctx) => k.contenido(ctx, 'identidad.txt').includes('usuario=ana') && k.contenido(ctx, 'identidad.txt').includes('rol=analista'), ['Crea dos líneas en identidad.txt.'], ['printf', 'redirecciones']],
      ],
    }),
  ],
});

const SALA_SQL_FUNDAMENTOS = crearSala({
  id: 'sql-fundamentos', n: 50, nombre: 'SQL y bases de datos relacionales',
  resumen: 'Tablas, claves, filtros, agregación, joins y consultas parametrizadas',
  dificultad: 'Intermedio', comandos: ['sqlite3', 'cat', 'printf'],
  tareas: [
    crearTarea({
      id: 'sf-modelo', titulo: '1. Del mundo a tablas relacionadas', subtitulo: 'Filas, columnas, claves y restricciones',
      habilidad: 'sql-modelo',
      teoria: [
        { t: 'Una tabla representa una clase de entidad', p: 'Cada fila es un registro y cada columna una propiedad con tipo y restricciones. El esquema expresa reglas antes de guardar datos.' },
        { t: 'Claves', p: 'La primary key identifica una fila. Una foreign key referencia otra tabla y evita relaciones con elementos inexistentes.' },
        { c: 'usuarios.id ← pedidos.usuario_id\nproductos.id ← pedidos.producto_id' },
        { n: 'Normalizar evita contradicciones', p: 'Guardar el nombre del usuario en cada pedido duplicaría datos. Referenciar su id conserva una sola fuente.' },
      ],
      imagen: { despuesDe: 1, src: 'assets/teoria/web/modelo-relacional.png', alt: 'Modelo relacional con tablas usuarios, pedidos y productos conectadas por claves foráneas', caption: 'Pedidos relaciona una identidad con un producto mediante claves estables.', width: 1774, height: 887 },
      preguntas: [
        ['¿Qué identifica una fila de forma estable?', ['La primary key', 'El orden visual', 'El color', 'La cookie'], 0, 'La clave primaria no depende de posición.'],
        ['¿Qué expresa una foreign key?', ['Una referencia a otra tabla', 'Un certificado TLS', 'Una ruta HTTP', 'Un proceso'], 0, 'La relación queda dentro del esquema.'],
      ],
      relleno: ['Completa la restricción.', 'id INTEGER PRIMARY ________', ['KEY'], 'PRIMARY KEY identifica cada fila.'],
      secuencia: ['Ordena el modelado.', ['identificar entidades', '→', 'definir claves', '→', 'definir relaciones', '→', 'aplicar restricciones'], 'identificar entidades → definir claves → definir relaciones → aplicar restricciones', 'Las restricciones protegen el modelo.'],
      terminales: [
        ['Enumera las tablas de la base local.', 'sqlite3 tienda.db .tables', (ctx) => k.salidaTiene(ctx, 'usuarios', 'productos', 'pedidos'), ['Usa el metacomando .tables.'], ['sqlite3']],
        ['Inspecciona las relaciones de pedidos.', 'sqlite3 tienda.db ".schema pedidos"', (ctx) => k.salidaTiene(ctx, 'usuario_id INTEGER REFERENCES usuarios(id)', 'producto_id INTEGER REFERENCES productos(id)'), ['Usa .schema pedidos.'], ['sqlite3']],
      ],
    }),
    crearTarea({
      id: 'sf-select', titulo: '2. Seleccionar y filtrar', subtitulo: 'Columnas explícitas, WHERE y predicados',
      habilidad: 'sql-select',
      teoria: [
        { c: 'SELECT nombre, precio\nFROM productos\nWHERE precio < 50;' },
        { t: 'Proyectar y filtrar', p: 'SELECT elige columnas; FROM la fuente; WHERE conserva filas cuyo predicado es verdadero.' },
        { t: 'Columnas explícitas', p: 'Evitar SELECT * documenta qué necesita el consumidor y reduce transferencia y acoplamiento.' },
        { n: 'NULL requiere su lógica', p: 'NULL representa desconocido o ausente. Se consulta con IS NULL, no con igualdad ordinaria.' },
      ],
      preguntas: [
        ['¿Qué cláusula filtra filas?', ['WHERE', 'FROM', 'AS', 'JOIN'], 0, 'WHERE aplica un predicado.'],
        ['¿Por qué elegir columnas explícitas?', ['Reduce datos y documenta intención', 'Desactiva claves', 'Cifra la tabla', 'Evita HTTP'], 0, 'El contrato de salida queda claro.'],
      ],
      relleno: ['Completa el filtro.', 'SELECT nombre FROM productos ________ precio < 50;', ['WHERE'], 'WHERE precede al predicado.'],
      secuencia: ['Ordena la lectura lógica.', ['FROM fuente', '→', 'WHERE filtra', '→', 'SELECT proyecta', '→', 'devolver filas'], 'FROM fuente → WHERE filtra → SELECT proyecta → devolver filas', 'La lectura lógica ayuda a razonar.'],
      terminales: [
        ['Lista nombres y precios.', 'sqlite3 tienda.db "SELECT nombre, precio FROM productos ORDER BY id"', (ctx) => k.salidaTiene(ctx, 'Teclado|45', 'Ratón|25', 'Monitor|220'), ['Selecciona dos columnas.'], ['sqlite3']],
        ['Filtra productos de menos de 50 y ordénalos por precio.', 'sqlite3 tienda.db "SELECT nombre, precio FROM productos WHERE precio < 50 ORDER BY precio"', (ctx) => k.ultimaSalida(ctx).trim() === 'Ratón|25\nTeclado|45', ['WHERE precio < 50 y ORDER BY precio.'], ['sqlite3']],
      ],
    }),
    crearTarea({
      id: 'sf-orden-agregado', titulo: '3. Ordenar, limitar y resumir', subtitulo: 'ORDER BY, LIMIT, COUNT y GROUP BY',
      habilidad: 'sql-agregacion',
      teoria: [
        { t: 'El orden no es implícito', p: 'Sin ORDER BY la base no promete un orden. LIMIT sin orden puede devolver subconjuntos distintos.' },
        { c: 'SELECT rol, COUNT(*) AS total\nFROM usuarios\nGROUP BY rol\nORDER BY rol;' },
        { t: 'Agrupar cambia la unidad', p: 'GROUP BY produce una fila por grupo. COUNT, SUM y AVG resumen las filas de cada grupo.' },
        { n: 'Interpretar el denominador', p: 'Un conteo sin conocer filtros, periodo y población puede inducir conclusiones erróneas.' },
      ],
      preguntas: [
        ['¿Qué garantiza el orden?', ['ORDER BY', 'SELECT solo', 'La primary key sin declararla', 'LIMIT'], 0, 'El orden debe pedirse.'],
        ['¿Qué hace COUNT(*)?', ['Cuenta filas', 'Suma precios', 'Crea una tabla', 'Firma datos'], 0, 'COUNT resume cantidad.'],
      ],
      relleno: ['Completa la agrupación.', 'SELECT rol, COUNT(*) FROM usuarios ________ BY rol;', ['GROUP'], 'GROUP BY reúne filas por valor.'],
      secuencia: ['Ordena un resumen.', ['filtrar filas', '→', 'agrupar', '→', 'calcular agregado', '→', 'ordenar resultado'], 'filtrar filas → agrupar → calcular agregado → ordenar resultado', 'El agregado trabaja sobre cada grupo.'],
      terminales: [
        ['Cuenta todos los pedidos.', 'sqlite3 tienda.db "SELECT COUNT(*) AS total FROM pedidos"', (ctx) => k.ultimaSalida(ctx).trim() === '4', ['Usa COUNT(*).'], ['sqlite3']],
        ['Cuenta usuarios por rol.', 'sqlite3 tienda.db "SELECT rol, COUNT(*) AS total FROM usuarios GROUP BY rol ORDER BY rol"', (ctx) => k.salidaTiene(ctx, 'analista|2', 'operador|1'), ['Agrupa por rol.'], ['sqlite3']],
      ],
    }),
    crearTarea({
      id: 'sf-joins', titulo: '4. Relacionar sin duplicar', subtitulo: 'JOIN, ON y claves foráneas',
      habilidad: 'sql-joins',
      teoria: [
        { t: 'JOIN combina filas relacionadas', p: 'ON declara la condición que conecta claves. Omitirla puede producir un producto cartesiano enorme.' },
        { c: 'FROM pedidos\nJOIN usuarios ON pedidos.usuario_id = usuarios.id\nJOIN productos ON pedidos.producto_id = productos.id' },
        { t: 'Calificar columnas', p: 'usuarios.nombre y productos.nombre evitan ambigüedad cuando varias tablas tienen una columna llamada nombre.' },
        { n: 'La relación explica el resultado', p: 'Antes de ejecutar, predice cuántas filas puede aportar cada unión y qué ocurre con referencias ausentes.' },
      ],
      preguntas: [
        ['¿Qué cláusula declara la condición de unión?', ['ON', 'LIMIT', 'AS', 'VALUES'], 0, 'ON relaciona columnas.'],
        ['¿Por qué escribir tabla.columna?', ['Evita ambigüedad', 'Cifra el dato', 'Cambia el tipo', 'Abre una sesión'], 0, 'Varias tablas pueden compartir nombres.'],
      ],
      relleno: ['Completa la relación.', 'pedidos.usuario_id = usuarios.________', ['id'], 'La foreign key apunta a usuarios.id.'],
      secuencia: ['Ordena la unión.', ['partir de pedidos', '→', 'unir usuarios por usuario_id', '→', 'unir productos por producto_id', '→', 'proyectar nombres'], 'partir de pedidos → unir usuarios por usuario_id → unir productos por producto_id → proyectar nombres', 'Las claves dan contexto a cada pedido.'],
      terminales: [
        ['Relaciona cada pedido con usuario y producto.', 'sqlite3 tienda.db "SELECT usuarios.nombre AS usuario, productos.nombre AS producto FROM pedidos JOIN usuarios ON pedidos.usuario_id = usuarios.id JOIN productos ON pedidos.producto_id = productos.id ORDER BY pedidos.id"', (ctx) => k.salidaTiene(ctx, 'Ana|Ratón', 'Leo|Monitor', 'Ana|Teclado', 'Mara|Ratón'), ['Une pedidos con ambas tablas.'], ['sqlite3']],
        ['Resume cuántos usuarios hay por rol para practicar agregación tras el modelo.', 'sqlite3 tienda.db "SELECT rol, COUNT(*) AS total FROM usuarios GROUP BY rol ORDER BY rol"', (ctx) => k.salidaTiene(ctx, 'analista|2', 'operador|1'), ['Agrupa usuarios por rol.'], ['sqlite3', 'sql-agregacion']],
      ],
    }),
    crearTarea({
      id: 'sf-consultas-seguras', titulo: '5. Consultas seguras y cambios controlados', subtitulo: 'Parámetros, transacciones, privilegios y evidencia',
      habilidad: 'sql-seguro',
      teoria: [
        { t: 'Datos y código separados', p: 'Una consulta parametrizada envía la plantilla SQL y los valores por canales distintos. Concatenar entrada convierte datos en sintaxis.' },
        { c: 'cursor.execute(\n  "SELECT nombre FROM usuarios WHERE id = ?",\n  (id_usuario,)\n)' },
        { t: 'Transacciones', p: 'BEGIN agrupa cambios; COMMIT los confirma y ROLLBACK los descarta. Las restricciones deben mantenerse durante toda la operación.' },
        { n: 'Menor privilegio y copias', p: 'La cuenta de la aplicación no necesita administrar la base. Antes de cambios irreversibles se prueba recuperación, no solo la creación del backup.' },
      ],
      preguntas: [
        ['¿Qué evita mezclar entrada con sintaxis SQL?', ['Consultas parametrizadas', 'Concatenar cadenas', 'Ocultar el formulario', 'Cambiar DNS'], 0, 'El driver trata el valor como dato.'],
        ['¿Qué descarta una transacción no confirmada?', ['ROLLBACK', 'SELECT', 'ORDER BY', 'JOIN'], 0, 'ROLLBACK revierte el grupo de cambios.'],
      ],
      relleno: ['Completa el placeholder.', 'SELECT nombre FROM usuarios WHERE id = ________', ['?'], 'El driver enlaza el valor al placeholder.'],
      secuencia: ['Ordena un cambio controlado.', ['BEGIN', '→', 'validar y modificar', '→', 'comprobar invariantes', '→', 'COMMIT o ROLLBACK'], 'BEGIN → validar y modificar → comprobar invariantes → COMMIT o ROLLBACK', 'La confirmación llega después de verificar.'],
      terminales: [
        ['Inspecciona tipos y clave primaria de productos.', 'sqlite3 -header -column tienda.db "PRAGMA table_info(productos)"', (ctx) => k.salidaTiene(ctx, 'name', 'type', 'precio', 'REAL'), ['Usa PRAGMA table_info.'], ['sqlite3']],
        ['Guarda una plantilla parametrizada para una revisión posterior.', "printf 'SELECT nombre FROM usuarios WHERE id = ?;\\n' > consulta-parametrizada.sql", (ctx) => k.contenido(ctx, 'consulta-parametrizada.sql').includes('WHERE id = ?'), ['Usa ? en vez de concatenar el id.'], ['printf', 'redirecciones']],
      ],
    }),
  ],
});

export const SALAS_WEB = [
  SALA_WEB_ARQUITECTURA,
  SALA_HTTP_APLICACIONES,
  SALA_JAVASCRIPT_WEB,
  SALA_APIS_REST,
  SALA_IDENTIDAD_WEB,
  SALA_SQL_FUNDAMENTOS,
];
