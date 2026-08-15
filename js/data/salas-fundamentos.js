// Fundamentos informáticos antes de la primera terminal. La meta no es formar
// técnicos de hardware: es dar el modelo mental que Linux, Redes y Seguridad
// usarán después sin asumir vocabulario previo.

import * as k from './checks.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';
import { entrena, tareaV2 } from './curriculum-v2.js';

const SNAP = 'inicio';

export const SALA_FUNDAMENTOS = {
  id: 'fundamentos-informatica', n: 43, nombre: 'Fundamentos informáticos',
  resumen: 'Del hardware y los bits al sistema operativo, los procesos y la virtualización',
  dificultad: 'Inicial', minutos: 45,
  comandos: ['uname', 'whoami', 'id', 'ps', 'free', 'df'], origen: 'v2-fase3',
  tareas: [
    tareaV2({
      id: 'fi-hardware-software', titulo: '1. Hardware, software y firmware', subtitulo: 'Tres capas que no conviene mezclar',
      teoria: [
        { t: 'Hardware: lo que ocupa espacio', p: 'CPU, memoria, disco, teclado y tarjeta de red son **hardware**. Tienen límites físicos: velocidad, capacidad, temperatura y conexiones.' },
        { t: 'Software: instrucciones reproducibles', p: 'Un programa es información que indica al hardware qué hacer. Se puede copiar, actualizar y ejecutar; no es la máquina que lo ejecuta.' },
        { t: 'Firmware: el puente cercano al dispositivo', p: 'El firmware también es software, pero vive asociado a un dispositivo y lo inicializa o controla a bajo nivel. BIOS/UEFI es un ejemplo.' },
        { n: 'Modelo útil para diagnosticar', p: 'Cuando algo falla, pregunta primero en qué capa ocurre. Cambiar una aplicación no arregla un cable desconectado; cambiar un disco no corrige una configuración.' },
      ],
      practica: [
        entrena(quiz('fi-hs-q1', '¿Cuál de estos elementos es hardware?', ['Un módulo de RAM', 'Una distribución Linux', 'Un archivo de configuración', 'Un proceso'], 0, 'La RAM es un componente físico.'), 'hardware-software'),
        entrena(quiz('fi-hs-q2', '¿Qué describe mejor al software?', ['Instrucciones y datos que puede ejecutar un sistema', 'Solo piezas electrónicas', 'Electricidad almacenada', 'La carcasa del equipo'], 0, 'El software expresa comportamiento mediante instrucciones y datos.'), 'hardware-software'),
        entrena(quiz('fi-hs-q3', '¿Qué papel cumple normalmente el firmware?', ['Inicializa o controla hardware a bajo nivel', 'Sustituye toda la RAM', 'Conecta cualquier red pública', 'Crea usuarios de Linux'], 0, 'El firmware está muy cerca del dispositivo que controla.'), 'hardware-software'),
        entrena(respuesta('fi-hs-r1', '¿Cómo se llama el conjunto de componentes físicos de un computador?', ['hardware'], 'Hardware es la parte física.'), 'hardware-software'),
        entrena(completar('fi-hs-c1', 'Completa la capa adecuada.', 'Un editor de texto es _______.', ['software'], 'Es un programa, por tanto software.', ['hardware-software']), 'hardware-software'),
        entrena(ordenar('fi-hs-o1', 'Ordena desde la capa física hasta la aplicación.', barajar(['hardware', '→', 'sistema operativo', '→', 'aplicación'], 'fi-hs-o1'), 'hardware → sistema operativo → aplicación', 'El sistema operativo media entre programas y hardware.', ['hardware-software', 'sistema-operativo']), 'hardware-software', 'sistema-operativo'),
      ],
    }),
    tareaV2({
      id: 'fi-cpu-memoria', titulo: '2. CPU, RAM y almacenamiento', subtitulo: 'Calcular, trabajar y conservar',
      teoria: [
        { t: 'La CPU ejecuta', p: 'La CPU busca instrucciones, las interpreta y opera con datos. Sus núcleos permiten mantener varias secuencias de trabajo, pero todo recurso sigue siendo finito.' },
        { t: 'La RAM mantiene el trabajo activo', p: 'Código y datos en uso pasan por RAM porque es rápida. Es **volátil**: al apagar, su contenido deja de ser una forma fiable de persistencia.' },
        { t: 'El almacenamiento conserva', p: 'SSD y discos guardan sistema, programas y archivos. Son más lentos que la RAM, pero persisten entre reinicios.' },
        { f: [['CPU', 'ejecuta instrucciones'], ['RAM', 'mantiene datos activos'], ['Almacenamiento', 'conserva datos'], ['I/O', 'mueve datos entre dispositivos']] },
      ],
      practica: [
        entrena(quiz('fi-cm-q1', '¿Qué componente ejecuta instrucciones?', ['CPU', 'SSD', 'Monitor', 'Router'], 0, 'La CPU interpreta y ejecuta instrucciones.'), 'cpu-memoria'),
        entrena(quiz('fi-cm-q2', '¿Por qué no guardas un documento solo en RAM?', ['Porque es volátil', 'Porque no acepta bits', 'Porque siempre está cifrada', 'Porque pertenece al router'], 0, 'La RAM no es almacenamiento persistente.'), 'cpu-memoria', 'almacenamiento'),
        entrena(quiz('fi-cm-q3', 'Un programa tarda al abrir, pero luego responde rápido. ¿Qué movimiento explica parte del cambio?', ['Pasa del almacenamiento a RAM', 'Pasa de CPU a teclado', 'Sale de la red local', 'Se convierte en firmware'], 0, 'Al cargar, código y datos activos quedan disponibles en memoria rápida.'), 'cpu-memoria', 'almacenamiento'),
        entrena(terminal('fi-cm-free', 'Consulta la memoria del sistema en unidades legibles.', SNAP, 'free -h', (c) => k.salidaTiene(c, 'Mem', 'total', 'available'), ['Usa `free` con la opción humana `-h`.']), 'cpu-memoria', 'free'),
        entrena(terminal('fi-cm-df', 'Consulta el espacio disponible de los sistemas de archivos en formato legible.', SNAP, 'df -h', (c) => k.salidaTiene(c, 'Filesystem', 'Mounted'), ['`df -h` resume capacidad y espacio libre.']), 'almacenamiento', 'df'),
        entrena(respuesta('fi-cm-r1', '¿Qué memoria rápida y volátil conserva el trabajo activo?', ['ram', 'memoria ram'], 'RAM.'), 'cpu-memoria'),
      ],
      imagen: {
        src: 'assets/teoria/fundamentos/arquitectura-computador.png', width: 960, height: 640,
        alt: 'Flujo entre entrada, CPU, RAM, almacenamiento, sistema operativo y un proceso.',
        caption: 'Un proceso no vive aislado: el sistema operativo coordina CPU, RAM, almacenamiento y entrada/salida.',
      },
    }),
    tareaV2({
      id: 'fi-so-procesos', titulo: '3. Sistema operativo y procesos', subtitulo: 'El coordinador y el trabajo en ejecución',
      teoria: [
        { t: 'El sistema operativo administra recursos', p: 'Linux reparte CPU y memoria, controla dispositivos, organiza archivos y aplica identidades y permisos. Las aplicaciones piden servicios al sistema en vez de manejar cada pieza directamente.' },
        { t: 'Kernel y espacio de usuario', p: 'El **kernel** opera con privilegios y expone interfaces seguras. Shells, navegadores y editores viven normalmente en espacio de usuario.' },
        { t: 'Programa no es proceso', p: 'Un programa es código almacenado. Un **proceso** es una instancia en ejecución: tiene PID, memoria, usuario, archivos abiertos y estado.' },
        { n: 'Seguridad desde el principio', p: 'El usuario que ejecuta un proceso determina qué puede leer, modificar o controlar. Esta relación volverá en servicios, contenedores y escalada de privilegios.' },
      ],
      practica: [
        entrena(quiz('fi-sp-q1', '¿Qué administra el sistema operativo?', ['CPU, memoria, dispositivos, archivos e identidades', 'Solo el fondo de pantalla', 'Únicamente la conexión Wi-Fi', 'Solo archivos de texto'], 0, 'El sistema operativo coordina los recursos compartidos.'), 'sistema-operativo'),
        entrena(quiz('fi-sp-q2', '¿Cuál es la diferencia entre programa y proceso?', ['El proceso es una instancia del programa en ejecución', 'El programa siempre usa red', 'El proceso está apagado', 'No existe diferencia'], 0, 'Un mismo programa puede originar varios procesos.'), 'sistema-operativo', 'procesos'),
        entrena(terminal('fi-sp-uname', 'Identifica el kernel y la arquitectura del sistema.', SNAP, 'uname -a', (c) => k.salidaTiene(c, 'Linux'), ['`uname -a` muestra la identidad completa del kernel.']), 'sistema-operativo', 'uname'),
        entrena(terminal('fi-sp-ps', 'Lista los procesos visibles de esta sesión.', SNAP, 'ps', (c) => k.salidaTiene(c, 'PID', 'CMD'), ['Usa `ps` sin opciones para una primera vista.']), 'procesos', 'ps'),
        entrena(respuesta('fi-sp-r1', '¿Qué identificador numérico distingue a cada proceso?', ['pid'], 'PID significa Process ID.'), 'procesos'),
        entrena(completar('fi-sp-c1', 'Completa la frase.', 'El _______ es el núcleo privilegiado del sistema operativo.', ['kernel'], 'El kernel controla recursos y expone llamadas al sistema.', ['sistema-operativo']), 'sistema-operativo'),
      ],
    }),
    tareaV2({
      id: 'fi-datos', titulo: '4. Bits, bytes, binario y hexadecimal', subtitulo: 'Cómo representa información una máquina',
      teoria: [
        { t: 'Un bit distingue dos estados', p: 'Un **bit** vale 0 o 1. Ocho bits forman un byte, unidad habitual para almacenar un carácter o una pequeña cantidad de información.' },
        { t: 'Binario es posición', p: 'Cada posición binaria vale el doble de la anterior: `1, 2, 4, 8, 16…`. Por eso `1010₂` representa `8 + 2 = 10`.' },
        { t: 'Hexadecimal compacta cuatro bits', p: 'Una cifra hexadecimal representa cuatro bits. Usa `0..9` y `A..F`; `FF₁₆` equivale a `255`.' },
        { t: 'Unidades: no mezclar memoria y velocidad', p: 'KiB, MiB y GiB miden cantidades de datos. Latencia mide tiempo; ancho de banda mide cuántos datos pueden pasar por unidad de tiempo.' },
      ],
      practica: [
        entrena(quiz('fi-da-q1', '¿Cuántos bits forman un byte?', ['8', '2', '10', '16'], 0, 'Un byte contiene ocho bits.'), 'datos-binarios'),
        entrena(quiz('fi-da-q2', '¿Qué valor decimal representa `1010` en binario?', ['10', '8', '12', '1010'], 0, '`1010₂` es 8 + 2.'), 'datos-binarios'),
        entrena(quiz('fi-da-q3', '¿Qué valor decimal representa `FF` hexadecimal?', ['255', '16', '100', '256'], 0, 'F vale 15: 15×16 + 15 = 255.'), 'datos-binarios'),
        entrena(respuesta('fi-da-r1', 'Escribe en hexadecimal el valor decimal 16.', ['10', '0x10'], '`10₁₆` equivale a dieciséis decimal.'), 'datos-binarios'),
        entrena(completar('fi-da-c1', 'Completa la unidad.', '1024 bytes forman 1 ___ aproximadamente en notación binaria.', ['kib', 'kibibyte'], '1024 bytes son un kibibyte (KiB).', ['datos-binarios']), 'datos-binarios'),
        entrena(ordenar('fi-da-o1', 'Ordena de menor a mayor unidad.', barajar(['bit', '→', 'byte', '→', 'KiB', '→', 'MiB'], 'fi-da-o1'), 'bit → byte → KiB → MiB', 'Ocho bits forman un byte; luego crecen las unidades.', ['datos-binarios']), 'datos-binarios'),
      ],
    }),
    tareaV2({
      id: 'fi-identidad-archivos', titulo: '5. Archivos, usuarios y permisos', subtitulo: 'Persistencia con propietario y reglas',
      teoria: [
        { t: 'El filesystem da nombres a datos persistentes', p: 'Un archivo relaciona contenido con nombre, ubicación y metadatos. Un directorio organiza referencias; la ruta indica cómo llegar.' },
        { t: 'La identidad viaja con cada acción', p: 'El sistema sabe qué usuario solicita una operación y a qué grupos pertenece. Esa identidad acompaña procesos y accesos.' },
        { t: 'Permitir lo necesario', p: 'Lectura, escritura y ejecución se evalúan para dueño, grupo y otros. No son decoración: deciden si una operación se autoriza.' },
        { n: 'Principio de mínimo privilegio', p: 'Un usuario o servicio debe recibir solo las capacidades necesarias. Menos privilegio reduce el impacto de errores y ataques.' },
      ],
      practica: [
        entrena(quiz('fi-ia-q1', '¿Qué añade un filesystem al contenido de un archivo?', ['Nombre, ruta y metadatos', 'Una IP pública', 'Un puerto TCP', 'Un núcleo de CPU'], 0, 'El filesystem organiza y describe datos persistentes.'), 'rutas', 'almacenamiento'),
        entrena(quiz('fi-ia-q2', '¿Qué identidad hereda normalmente un proceso?', ['La del usuario que lo ejecuta', 'La del router', 'La del último archivo leído', 'Siempre root'], 0, 'El usuario del proceso limita sus operaciones.'), 'sistema-operativo', 'permisos'),
        entrena(quiz('fi-ia-q3', '¿Qué busca el mínimo privilegio?', ['Conceder solo el acceso necesario', 'Dar root a todos', 'Ocultar todos los archivos', 'Eliminar los grupos'], 0, 'Menos privilegio limita el impacto.'), 'permisos'),
        entrena(terminal('fi-ia-whoami', 'Comprueba con qué usuario actúa esta sesión.', SNAP, 'whoami', (c) => k.salidaTiene(c, 'user'), ['El comando se llama `whoami`.']), 'whoami', 'permisos'),
        entrena(terminal('fi-ia-id', 'Muestra el identificador del usuario y sus grupos.', SNAP, 'id', (c) => k.salidaTiene(c, 'uid=', 'gid='), ['Usa `id`.']), 'id', 'permisos'),
        entrena(respuesta('fi-ia-r1', '¿Cómo se llama la secuencia que localiza un archivo dentro del filesystem?', ['ruta', 'path'], 'La ruta describe su ubicación.'), 'rutas'),
      ],
    }),
    tareaV2({
      id: 'fi-virtualizacion', titulo: '6. Virtualización y diagnóstico', subtitulo: 'Aislar sistemas y razonar con evidencia',
      teoria: [
        { t: 'Una máquina virtual simula una máquina completa', p: 'Un **hipervisor** reparte CPU, RAM, disco y red entre sistemas invitados. Cada VM ejecuta su propio sistema operativo.' },
        { t: 'Aislamiento no significa magia', p: 'Las VMs comparten hardware físico y dependen de configuración, actualizaciones y límites. Un snapshot ayuda a volver a un estado conocido, pero no sustituye una copia de seguridad.' },
        { t: 'Diagnosticar es reducir hipótesis', p: 'Primero observa el síntoma; después mide CPU/procesos, RAM y almacenamiento. Cambia una variable cada vez y conserva evidencia.' },
        { f: [['Equipo lento', 'procesos y CPU'], ['Aplicación termina', 'RAM disponible'], ['No se puede guardar', 'espacio y permisos'], ['Solo una VM falla', 'configuración del invitado']] },
      ],
      practica: [
        entrena(quiz('fi-vi-q1', '¿Qué componente reparte hardware entre máquinas virtuales?', ['El hipervisor', 'El navegador', 'El DNS', 'La shell'], 0, 'El hipervisor crea y administra VMs.'), 'virtualizacion'),
        entrena(quiz('fi-vi-q2', '¿Qué contiene normalmente una VM?', ['Su propio sistema operativo invitado', 'Solo un archivo de texto', 'Una dirección sin memoria', 'Únicamente firmware físico'], 0, 'La VM modela una máquina completa.'), 'virtualizacion', 'sistema-operativo'),
        entrena(quiz('fi-vi-q3', '¿Por qué un snapshot no reemplaza una copia externa?', ['Puede depender del mismo almacenamiento y entorno', 'Porque no conserva estado', 'Porque siempre apaga la red', 'Porque elimina el hipervisor'], 0, 'Una avería del almacenamiento puede afectar original y snapshot.'), 'virtualizacion', 'almacenamiento'),
        entrena(ordenar('fi-vi-o1', 'Ordena un diagnóstico responsable.', barajar(['observar', '→', 'medir', '→', 'formular hipótesis', '→', 'cambiar una variable', '→', 'verificar'], 'fi-vi-o1'), 'observar → medir → formular hipótesis → cambiar una variable → verificar', 'La evidencia precede al cambio.', ['errores']), 'errores'),
        entrena(terminal('fi-vi-medidas', 'Reúne evidencia de memoria, disco y procesos ejecutando las tres consultas.', SNAP, 'free -h\ndf -h\nps', (c) => k.usó(c, /^free -h$/) && k.usó(c, /^df -h$/) && k.usó(c, /^ps$/), ['Ejecuta `free -h`, luego `df -h` y finalmente `ps`.']), 'cpu-memoria', 'almacenamiento', 'procesos'),
        entrena(respuesta('fi-vi-r1', '¿Cómo se llama una captura del estado de una máquina virtual para poder volver atrás?', ['snapshot', 'instantánea', 'instantanea'], 'Snapshot o instantánea.'), 'virtualizacion'),
      ],
    }),
  ],
};

export const SALAS_FUNDAMENTOS = [SALA_FUNDAMENTOS];
