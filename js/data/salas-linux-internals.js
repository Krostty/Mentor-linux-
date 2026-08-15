// Linux profundo: recursos e interfaces que administración, troubleshooting y
// PrivEsc necesitan antes de aparecer en un laboratorio ofensivo.

import * as k from './checks.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';
import { entrena, tareaV2 } from './curriculum-v2.js';

const SNAP = 'inicio';

export const SALA_LINUX_INTERNALS = {
  id: 'linux-internals', n: 44, nombre: 'Almacenamiento e internals',
  resumen: 'Discos, filesystems, mounts, memoria, kernel, /proc y diagnóstico por recursos',
  dificultad: 'Intermedio', minutos: 50,
  comandos: ['lsblk', 'mount', 'df', 'du', 'free', 'ps', 'uname', 'dmesg'], origen: 'v2-fase3',
  tareas: [
    tareaV2({
      id: 'li-stack-almacenamiento', titulo: '1. Del disco a una ruta', subtitulo: 'Dispositivo, partición, filesystem y mount',
      teoria: [
        { t: 'El disco es solo el soporte', p: 'Linux ve dispositivos de bloques como `/dev/sda`. Un disco puede dividirse en **particiones**, cada una con límites y uso propios.' },
        { t: 'El filesystem organiza los bloques', p: 'ext4, XFS o Btrfs definen cómo se guardan nombres, directorios, metadatos y contenido. Formatear crea esa estructura; también destruye la anterior.' },
        { t: 'Montar conecta un filesystem al árbol', p: 'No aparecen letras de unidad. `mount` enlaza el filesystem a un directorio, como `/home` o `/mnt/datos`, y desde ahí se navega con rutas normales.' },
        { n: 'Separar las preguntas', p: '`lsblk` responde qué dispositivos y particiones existen. `mount`, dónde están conectados. `df`, cuánto espacio queda en los filesystems montados.' },
      ],
      practica: [
        entrena(quiz('li-st-q1', '¿Qué divide un disco en regiones independientes?', ['Las particiones', 'Los procesos', 'Los usuarios', 'Los puertos'], 0, 'Una tabla de particiones describe regiones del dispositivo.'), 'almacenamiento', 'mounts'),
        entrena(quiz('li-st-q2', '¿Qué aporta un filesystem?', ['Estructura para archivos, directorios y metadatos', 'Una IP pública', 'Un proceso root', 'Una clave SSH'], 0, 'El filesystem organiza los bloques como objetos navegables.'), 'almacenamiento', 'mounts'),
        entrena(quiz('li-st-q3', '¿Qué hace montar `/dev/sda2` en `/home`?', ['Hace visible ese filesystem bajo `/home`', 'Copia todo el disco a RAM', 'Cambia la CPU', 'Abre un puerto'], 0, 'El punto de montaje integra el filesystem en el árbol.'), 'mounts', 'rutas'),
        entrena(terminal('li-st-lsblk', 'Muestra discos, particiones, tamaños y puntos de montaje.', SNAP, 'lsblk', (c) => k.salidaTiene(c, 'NAME', 'sda1', 'sda2'), ['Usa `lsblk`.']), 'almacenamiento', 'lsblk'),
        entrena(terminal('li-st-mount', 'Lista qué filesystems están montados y dónde.', SNAP, 'mount', (c) => k.salidaTiene(c, '/dev/sda1 on /', '/dev/sda2 on /home'), ['El comando es `mount` sin argumentos.']), 'mounts', 'mount'),
        entrena(respuesta('li-st-r1', '¿Cómo se llama el directorio donde se conecta un filesystem?', ['punto de montaje', 'mount point', 'punto montaje'], 'Punto de montaje.'), 'mounts'),
      ],
      imagen: {
        src: 'assets/teoria/linux/almacenamiento-internals.png', width: 960, height: 640,
        alt: 'Cadena desde disco y partición hasta filesystem, mount y ruta, separada de RAM y /proc.',
        caption: 'El almacenamiento persistente se monta en el árbol; `/proc` es una vista virtual del sistema activo y no una partición del disco.',
      },
    }),
    tareaV2({
      id: 'li-capacidad-espacio', titulo: '2. Capacidad, uso e inodos', subtitulo: 'No todo “disco lleno” significa lo mismo',
      teoria: [
        { t: '`df` mira el filesystem', p: '`df -h` muestra capacidad, uso, espacio disponible y punto de montaje. Sirve para saber **qué volumen** está lleno.' },
        { t: '`du` mira directorios', p: '`du -sh ruta` suma el espacio ocupado bajo una ruta. Sirve para encontrar **qué contenido** explica el consumo.' },
        { t: 'Los inodos también son finitos', p: 'Un filesystem puede tener bloques libres pero no poder crear archivos si agotó sus inodos: millones de archivos pequeños también llenan un sistema.' },
        { n: 'Borrar con evidencia', p: 'Antes de eliminar, confirma filesystem, directorio responsable, retención y propietario. Un `rm` apresurado convierte un incidente de capacidad en pérdida de datos.' },
      ],
      practica: [
        entrena(quiz('li-ce-q1', '¿Qué comando responde qué filesystem está lleno?', ['`df -h`', '`whoami`', '`ping`', '`chmod`'], 0, '`df` resume filesystems montados.'), 'almacenamiento', 'df'),
        entrena(quiz('li-ce-q2', '¿Qué comando encuentra cuánto ocupa `/var/log`?', ['`du -sh /var/log`', '`df /var/log`', '`id /var/log`', '`ps /var/log`'], 0, '`du` suma contenido bajo una ruta.'), 'almacenamiento', 'du'),
        entrena(quiz('li-ce-q3', 'Hay espacio en bytes, pero no se crean archivos nuevos. ¿Qué recurso revisarías?', ['Los inodos', 'La dirección MAC', 'El DNS', 'El prompt'], 0, 'Cada archivo necesita un inodo.'), 'almacenamiento'),
        entrena(terminal('li-ce-df', 'Consulta capacidad y puntos de montaje con unidades legibles.', SNAP, 'df -h', (c) => k.salidaTiene(c, 'Filesystem', 'Mounted'), ['`df -h`.']), 'almacenamiento', 'df'),
        entrena(terminal('li-ce-du', 'Calcula en formato legible cuánto ocupa tu directorio actual.', SNAP, 'du -sh .', (c) => k.ultimoUsó(c, /^du\s+-sh\s+\.$/) && /[KMG]/.test(k.ultimaSalida(c)), ['Usa `du -sh .`.']), 'almacenamiento', 'du'),
        entrena(ordenar('li-ce-o1', 'Ordena el diagnóstico de espacio.', barajar(['df -h', '→', 'identificar filesystem', '→', 'du -sh', '→', 'validar antes de borrar'], 'li-ce-o1'), 'df -h → identificar filesystem → du -sh → validar antes de borrar', 'Primero localiza el volumen y luego el contenido.', ['almacenamiento', 'errores']), 'almacenamiento', 'errores'),
      ],
    }),
    tareaV2({
      id: 'li-memoria-swap', titulo: '3. RAM, caché y swap', subtitulo: 'Leer memoria sin alarmarse por el número equivocado',
      teoria: [
        { t: 'Linux usa RAM libre como caché', p: 'Memoria ocupada no significa memoria perdida. El kernel reutiliza RAM para acelerar accesos y puede liberarla cuando una aplicación la necesita.' },
        { t: 'Mira `available`, no solo `free`', p: '`free -h` separa memoria libre, usada y caché. **available** estima lo que puede entregarse sin empezar a intercambiar agresivamente.' },
        { t: 'Swap es una red de seguridad lenta', p: 'Swap mueve páginas menos activas a almacenamiento. Evita una terminación inmediata, pero su uso intenso puede volver el sistema extremadamente lento.' },
        { t: 'Proceso y síntoma', p: 'Si falta memoria, identifica qué procesos crecen, desde cuándo y bajo qué carga. Reiniciar oculta evidencia y solo compra tiempo.' },
      ],
      practica: [
        entrena(quiz('li-ms-q1', '¿Por qué Linux usa RAM como caché?', ['Para acelerar accesos y liberarla cuando haga falta', 'Para impedir procesos', 'Para cambiar permisos', 'Para resolver DNS'], 0, 'RAM sin usar no aporta velocidad; la caché es recuperable.'), 'cpu-memoria'),
        entrena(quiz('li-ms-q2', '¿Qué columna de `free` aproxima mejor la memoria entregable?', ['available', 'total', 'shared', 'swap total'], 0, '`available` contempla memoria recuperable.'), 'cpu-memoria', 'free'),
        entrena(quiz('li-ms-q3', '¿Qué efecto suele tener swap intensa?', ['Latencia elevada porque usa almacenamiento', 'Más núcleos de CPU', 'Una IP nueva', 'Permisos más amplios'], 0, 'El almacenamiento es mucho más lento que RAM.'), 'cpu-memoria', 'almacenamiento'),
        entrena(terminal('li-ms-free', 'Muestra RAM y swap en formato legible.', SNAP, 'free -h', (c) => k.salidaTiene(c, 'Mem', 'Swap', 'available'), ['`free -h`.']), 'cpu-memoria', 'free'),
        entrena(terminal('li-ms-ps', 'Lista procesos para relacionar consumo con trabajo activo.', SNAP, 'ps aux', (c) => k.salidaTiene(c, 'PID', '%CPU', '%MEM'), ['Usa `ps aux`.']), 'procesos', 'ps'),
        entrena(completar('li-ms-c1', 'Completa la métrica útil.', 'En `free`, la columna _________ estima la RAM utilizable.', ['available'], 'No te quedes solo con `free`.', ['cpu-memoria']), 'cpu-memoria'),
      ],
    }),
    tareaV2({
      id: 'li-proc-sys-kernel', titulo: '4. `/proc`, `/sys` y kernel', subtitulo: 'Archivos que son interfaces, no datos del disco',
      teoria: [
        { t: '`/proc` describe estado vivo', p: '`/proc` es un filesystem virtual. Expone procesos, memoria, mounts y parámetros del kernel como archivos generados al leerlos.' },
        { t: '`/sys` modela dispositivos y kernel', p: '`/sys` organiza dispositivos, drivers, clases y atributos. Muchas herramientas consultan estas interfaces en vez de hablar directamente con el hardware.' },
        { t: 'El kernel deja evidencia', p: '`uname` identifica versión y arquitectura. `dmesg` muestra mensajes del kernel sobre arranque, dispositivos, drivers, mounts y fallos.' },
        { n: 'Leer antes de escribir', p: 'Algunas rutas permiten modificar parámetros activos. No escribas en `/proc` o `/sys` sin entender alcance, persistencia y forma de recuperación.' },
      ],
      practica: [
        entrena(quiz('li-pk-q1', '¿Por qué `/proc` no ocupa una partición como `/home`?', ['Porque genera una vista virtual del estado del kernel', 'Porque está cifrado', 'Porque vive en el DNS', 'Porque solo root puede verlo'], 0, 'Sus archivos se generan desde estructuras del kernel.'), 'filesystem-virtual'),
        entrena(quiz('li-pk-q2', '¿Qué organiza principalmente `/sys`?', ['Dispositivos, drivers y atributos del kernel', 'Contraseñas web', 'Correos remotos', 'Paquetes DNS'], 0, '`/sys` expone el modelo de dispositivos.'), 'filesystem-virtual'),
        entrena(quiz('li-pk-q3', '¿Qué consultarías tras un error al detectar un disco?', ['`dmesg`', '`history -c`', '`echo`', '`mkdir`'], 0, 'El kernel registra detección, drivers y errores de I/O.'), 'filesystem-virtual', 'errores'),
        entrena(terminal('li-pk-uname', 'Muestra versión de kernel y arquitectura.', SNAP, 'uname -a', (c) => k.salidaTiene(c, 'Linux', 'x86_64'), ['`uname -a`.']), 'sistema-operativo', 'uname'),
        entrena(terminal('li-pk-dmesg', 'Consulta los mensajes recientes del kernel.', SNAP, 'dmesg', (c) => k.salidaTiene(c, 'Linux version', 'EXT4'), ['Usa `dmesg`.']), 'filesystem-virtual', 'dmesg'),
        entrena(respuesta('li-pk-r1', '¿Qué filesystem virtual expone un directorio por PID?', ['/proc', 'proc'], '`/proc/<PID>` expone estado de cada proceso.'), 'filesystem-virtual', 'procesos'),
      ],
    }),
    tareaV2({
      id: 'li-incidente-recursos', titulo: '5. Incidente: “el servidor está lento”', subtitulo: 'Separar CPU, RAM, disco y kernel',
      teoria: [
        { t: '“Lento” no es un diagnóstico', p: 'Define alcance: ¿todo el host, un servicio, un usuario o una operación? Registra cuándo empezó y qué cambió.' },
        { t: 'Mide por recursos', p: '`ps` y `top` orientan CPU/procesos; `free` RAM/swap; `df` capacidad; `du` contenido; `dmesg` errores de kernel o I/O.' },
        { t: 'Correlaciona, no colecciones números', p: 'Una métrica solo importa si explica el síntoma en el mismo momento. Alto uso puede ser normal; el problema aparece cuando causa cola, error o latencia.' },
        { t: 'Cierra con evidencia', p: 'Documenta síntoma, mediciones, hipótesis, cambio, resultado y riesgo pendiente. Así la próxima persona no repite tu investigación.' },
      ],
      practica: [
        entrena(quiz('li-ir-q1', 'Solo una aplicación está lenta. ¿Qué alcance describes?', ['Servicio o proceso concreto', 'Todo Internet', 'Todo el hardware sin medir', 'El DNS obligatoriamente'], 0, 'El alcance evita investigar capas no afectadas.'), 'diagnostico-sistemas'),
        entrena(quiz('li-ir-q2', '¿Qué pareja investiga primero falta de espacio y su origen?', ['`df` y `du`', '`whoami` y `id`', '`ping` y `dig`', '`chmod` y `chown`'], 0, '`df` localiza el filesystem; `du`, el contenido.'), 'diagnostico-sistemas', 'almacenamiento'),
        entrena(quiz('li-ir-q3', '¿Por qué reiniciar primero puede ser mala idea?', ['Borra estado temporal y evidencia del fallo', 'Siempre rompe el disco', 'Cambia la IP pública', 'Convierte TCP en UDP'], 0, 'Puede aliviar el síntoma y ocultar la causa.'), 'diagnostico-sistemas', 'errores'),
        entrena(terminal('li-ir-medidas', 'Ejecuta una primera pasada de procesos, memoria, disco y kernel.', SNAP, 'ps aux\nfree -h\ndf -h\ndmesg', (c) => k.usó(c, /^ps aux$/) && k.usó(c, /^free -h$/) && k.usó(c, /^df -h$/) && k.usó(c, /^dmesg$/), ['Ejecuta las cuatro consultas, una por línea.']), 'diagnostico-sistemas', 'procesos', 'cpu-memoria', 'almacenamiento'),
        entrena(ordenar('li-ir-o1', 'Ordena el ciclo de troubleshooting.', barajar(['definir alcance', '→', 'medir', '→', 'correlacionar', '→', 'cambiar', '→', 'verificar', '→', 'documentar'], 'li-ir-o1'), 'definir alcance → medir → correlacionar → cambiar → verificar → documentar', 'Un cambio sin medición ni verificación no demuestra la causa.', ['diagnostico-sistemas', 'errores']), 'diagnostico-sistemas', 'errores'),
        entrena(respuesta('li-ir-r1', '¿Qué comando consulta mensajes del kernel ante errores de hardware o I/O?', ['dmesg'], '`dmesg`.'), 'filesystem-virtual', 'dmesg'),
      ],
    }),
  ],
};

export const SALAS_LINUX_INTERNALS = [SALA_LINUX_INTERNALS];
