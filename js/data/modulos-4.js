// Módulos 15–20: scripting, cifrado y seguridad.
// La parte de seguridad se enseña desde el lado defensivo y siempre dentro del
// Linux simulado del dispositivo: nada de esto sale del móvil.
import * as k from './checks.js';

export const MODULOS_4 = [
  // ======================================================================
  {
    id: 'bash1',
    n: 15,
    nombre: 'Bash scripting I',
    resumen: 'Variables, condicionales y bucles',
    comandos: ['bash', 'echo', 'read', 'test', 'seq', 'chmod'],
    lecciones: [
      {
        id: 'primer-script',
        titulo: 'Tu primer script',
        subtitulo: 'Un archivo de texto que se ejecuta',
        cuerpo: [
          { t: 'Tres pasos', p: 'Un script es un archivo con comandos, uno por línea. Necesita el shebang en la primera línea, permiso de ejecución y se lanza con `./nombre.sh`.' },
          { c: '#!/bin/bash\n# esto es un comentario\necho "Hola desde el script"' },
          { t: 'El shebang', p: '`#!/bin/bash` le dice al sistema con qué intérprete ejecutar el archivo. Sin él, el sistema no sabe si es bash, python o cualquier otra cosa.' },
          { f: [['chmod +x script.sh', 'Darle permiso de ejecución'], ['./script.sh', 'Ejecutarlo'], ['bash script.sh', 'Ejecutarlo sin necesitar +x'], ['source script.sh', 'Ejecutarlo en la shell actual']] },
          { n: '`./` delante no es decorativo: sin él, bash busca el script en el PATH y no en la carpeta actual.' },
        ],
        retos: [
          {
            id: 'r15-script',
            enunciado: 'Crea un script llamado `hola.sh` que imprima `Hola mundo`, y dale permisos de ejecución.',
            snapshot: 'scripts',
            xp: 70,
            pistas: ['Puedes crear el archivo con `echo` y redirección, en dos líneas usando `>>`.', 'Luego `chmod +x hola.sh`.'],
            solucion: 'echo \'#!/bin/bash\' > hola.sh && echo \'echo "Hola mundo"\' >> hola.sh && chmod +x hola.sh',
            check: (c) => {
              const t = k.contenido(c, '/home/user/hola.sh') || '';
              return t.includes('Hola mundo') && k.tieneBits(c, 'hola.sh', k.bits.dueñoEjecuta);
            },
            diagnostico: [
              { cuando: (c) => (k.contenido(c, '/home/user/hola.sh') || '').includes('Hola mundo') && !k.tieneBits(c, 'hola.sh', k.bits.dueñoEjecuta), titulo: 'El script existe pero no se puede ejecutar', texto: 'Le falta el bit `x`. Añádelo con `chmod +x hola.sh`.' },
            ],
          },
        ],
      },
      {
        id: 'variables',
        titulo: 'Variables y argumentos',
        subtitulo: 'Guardar valores y recibir datos de fuera',
        cuerpo: [
          { t: 'Sin espacios al asignar', p: '`nombre="Ana"` funciona; `nombre = "Ana"` no. Bash interpretaría `nombre` como un comando. Para leer el valor se pone `$` delante.' },
          { f: [['nombre="Ana"', 'Asignar (sin espacios)'], ['echo $nombre', 'Leer el valor'], ['echo "${nombre}s"', 'Llaves cuando hay texto pegado'], ['$1 $2 $3', 'Los argumentos del script'], ['$0', 'El nombre del propio script'], ['$#', 'Cuántos argumentos recibió'], ['$@', 'Todos los argumentos'], ['$?', 'El código de salida del último comando']] },
          { t: 'Comillas', p: 'Las dobles `"` expanden variables; las simples `\'` las dejan literales. Pon siempre las variables entre comillas dobles: evita que un valor con espacios rompa el script.' },
          { c: '#!/bin/bash\nnombre="$1"\necho "Hola, $nombre"\necho "Recibí $# argumentos"' },
        ],
        retos: [
          {
            id: 'r15-var',
            enunciado: 'Crea una variable llamada `curso` con el valor `Linux` y muéstrala por pantalla con echo.',
            snapshot: 'scripts',
            xp: 45,
            pistas: ['Asignar es `curso=Linux`, sin espacios alrededor del igual.', 'Y para leerla: `echo $curso`. Puedes hacerlo en dos comandos.'],
            solucion: 'curso=Linux; echo $curso',
            check: (c) => c.shell.env.curso === 'Linux' && k.salidaTiene(c, 'Linux'),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /curso\s+=|=\s+Linux/), titulo: 'Sobran espacios en la asignación', texto: 'Bash no admite espacios alrededor del `=`. Tiene que ser `curso=Linux`, todo pegado.' },
            ],
          },
          {
            id: 'r15-export',
            enunciado: 'Define la variable de entorno `EDITOR` con el valor `nano`, de forma que quede exportada al entorno.',
            snapshot: 'scripts',
            xp: 50,
            pistas: ['Para exportarla al entorno se usa `export`.', '`export EDITOR=nano`'],
            solucion: 'export EDITOR=nano',
            check: (c) => c.shell.env.EDITOR === 'nano',
          },
        ],
      },
      {
        id: 'condicionales',
        titulo: 'Condicionales',
        subtitulo: 'if, test y los corchetes',
        cuerpo: [
          { t: 'La forma', p: 'Un `if` en bash evalúa el código de salida de un comando: 0 significa verdadero. `[ ... ]` es en realidad el comando `test`, por eso necesita espacios a los lados.' },
          { c: '#!/bin/bash\nif [ -f "$1" ]; then\n    echo "El archivo existe"\nelif [ -d "$1" ]; then\n    echo "Es una carpeta"\nelse\n    echo "No existe"\nfi' },
          { f: [['-f ruta', 'Existe y es un archivo'], ['-d ruta', 'Existe y es una carpeta'], ['-e ruta', 'Existe, sea lo que sea'], ['-r / -w / -x', 'Se puede leer / escribir / ejecutar'], ['-z "$v"', 'La variable está vacía'], ['-n "$v"', 'La variable tiene algo'], ['"$a" = "$b"', 'Cadenas iguales'], ['$a -eq $b', 'Números iguales (-ne -gt -lt -ge -le)']] },
          { n: 'Los espacios dentro de los corchetes son obligatorios: `[ -f x ]` sí, `[-f x]` da error. Es la primera piedra con la que tropieza todo el mundo.' },
        ],
        retos: [
          {
            id: 'r15-test',
            enunciado: 'Comprueba con el comando `test` si existe el archivo `saludo.sh`, y muestra el código de salida resultante.',
            snapshot: 'scripts',
            xp: 60,
            pistas: ['`test -f archivo` no imprime nada: hay que mirar `$?`.', '`test -f saludo.sh; echo $?` — un 0 significa que sí existe.'],
            solucion: 'test -f saludo.sh; echo $?',
            check: (c) => k.usó(c, /test\s+-f|\[\s+-f/) && k.salidaTiene(c, '0'),
          },
        ],
      },
      {
        id: 'bucles',
        titulo: 'Bucles',
        subtitulo: 'for y while: hacer lo mismo muchas veces',
        cuerpo: [
          { t: 'for recorre una lista', p: 'Archivos, números, palabras: lo que le des. Es la forma habitual de procesar muchos archivos de golpe.' },
          { c: '#!/bin/bash\nfor archivo in *.txt; do\n    echo "Procesando $archivo"\ndone\n\nfor i in $(seq 1 5); do\n    echo "Vuelta $i"\ndone' },
          { t: 'while repite mientras se cumpla algo', p: 'Se usa para leer archivos línea a línea o para esperar a que ocurra una condición.' },
          { c: 'while read linea; do\n    echo "> $linea"\ndone < datos/lista.txt' },
          { f: [['for x in lista; do … done', 'Recorrer una lista'], ['for i in $(seq 1 10)', 'Recorrer números'], ['while [ cond ]; do … done', 'Mientras se cumpla'], ['break', 'Salir del bucle'], ['continue', 'Saltar a la siguiente vuelta']] },
        ],
        retos: [
          {
            id: 'r15-seq',
            enunciado: 'Genera la lista de números del 1 al 10, uno por línea.',
            snapshot: 'scripts',
            xp: 45,
            pistas: ['Hay un comando que genera secuencias.', '`seq 1 10`'],
            solucion: 'seq 1 10',
            check: (c) => {
              const l = k.salidaLineas(c).map((x) => x.trim());
              return l.length === 10 && l[0] === '1' && l[9] === '10';
            },
          },
          {
            id: 'r15-for',
            enunciado: 'Recorre los números del 1 al 3 con un bucle for e imprime cada uno.',
            snapshot: 'scripts',
            xp: 75,
            pistas: ['La estructura es `for i in 1 2 3; do echo $i; done`, todo en una línea.', 'Cópiala tal cual: `for i in 1 2 3; do echo $i; done`'],
            solucion: 'for i in 1 2 3; do echo $i; done',
            check: (c) => {
              const s = k.ultimaSalida(c);
              return s.includes('1') && s.includes('2') && s.includes('3') && k.ultimoUsó(c, /for\s+\w+\s+in/);
            },
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Para qué sirve `#!/bin/bash`?', opciones: ['Es un comentario', 'Indica con qué intérprete ejecutar el script', 'Importa bash', 'Activa el modo depuración'], correcta: 1, explicacion: 'Es el shebang. Sin él, el sistema no sabe cómo interpretar el archivo.' },
      { pregunta: '¿Cuál es la asignación correcta?', opciones: ['nombre = "Ana"', 'nombre="Ana"', '$nombre = Ana', 'set nombre Ana'], correcta: 1, explicacion: 'Sin espacios alrededor del `=`. Con espacios, bash cree que `nombre` es un comando.' },
      { pregunta: '¿Qué contiene `$?`', opciones: ['El nombre del script', 'El número de argumentos', 'El código de salida del último comando', 'El PID'], correcta: 2, explicacion: '0 significa éxito y cualquier otro valor, algún tipo de fallo.' },
      { pregunta: '¿Por qué `[-f archivo]` da error?', opciones: ['Falta el $', 'Faltan espacios dentro de los corchetes', 'Hay que usar llaves', 'Falta el punto y coma'], correcta: 1, explicacion: '`[` es realmente un comando, así que necesita espacios: `[ -f archivo ]`.' },
      { pregunta: '¿Qué representa `$1` dentro de un script?', opciones: ['El primer archivo', 'El primer argumento recibido', 'El código de salida', 'La primera línea'], correcta: 1, explicacion: '`$0` es el nombre del script y `$1`, `$2`… los argumentos que le pasas.' },
    ],
  },

  // ======================================================================
  {
    id: 'bash2',
    n: 16,
    nombre: 'Bash scripting II',
    resumen: 'Funciones, robustez y un proyecto de verdad',
    comandos: ['bash', 'test', 'find', 'grep', 'chmod'],
    lecciones: [
      {
        id: 'funciones',
        titulo: 'Funciones',
        subtitulo: 'Trocear el script en piezas con nombre',
        cuerpo: [
          { t: 'Reutilizar en vez de repetir', p: 'Una función agrupa varias líneas bajo un nombre. Sus argumentos también se leen con `$1`, `$2`, igual que los del script.' },
          { c: '#!/bin/bash\n\nsaludar() {\n    echo "Hola, $1"\n}\n\nerror() {\n    echo "ERROR: $1" >&2\n    exit 1\n}\n\nsaludar "Ana"\n[ -f "$1" ] || error "no existe $1"' },
          { t: 'Los errores van a stderr', p: 'Fíjate en el `>&2` de la función `error`. Los mensajes de fallo deben ir al descriptor 2 para que quien use tu script pueda separarlos de los resultados.' },
          { f: [['nombre() { … }', 'Definir una función'], ['return 0', 'Devolver un código de salida'], ['exit 1', 'Terminar el script con error'], ['local var=x', 'Variable solo dentro de la función']] },
        ],
        retos: [
          {
            id: 'r16-funcion',
            enunciado: 'Crea un script `saluda.sh` que defina una función y salude usando el primer argumento. Debe contener la palabra `function` o unos paréntesis de función, y usar `$1`.',
            snapshot: 'scripts',
            xp: 80,
            pistas: ['Puedes escribirlo con varios `echo` y `>>`, o de una vez.', 'Necesita al menos: `saludar() {`, un `echo "Hola, $1"` y la llamada.'],
            solucion: 'printf \'#!/bin/bash\\nsaludar() {\\n  echo "Hola, $1"\\n}\\nsaludar "$1"\\n\' > saluda.sh',
            check: (c) => {
              const t = k.contenido(c, '/home/user/saluda.sh') || '';
              return /\(\)\s*\{/.test(t) && t.includes('$1');
            },
          },
        ],
      },
      {
        id: 'robustez',
        titulo: 'Scripts que no te traicionan',
        subtitulo: 'Las tres líneas que ponen los profesionales',
        cuerpo: [
          { t: 'El problema', p: 'Por defecto, si un comando de tu script falla, bash sigue con la línea siguiente como si nada. En un script de despliegue o de borrado, eso es un desastre esperando a ocurrir.' },
          { c: '#!/bin/bash\nset -euo pipefail\n\n#  -e  parar al primer error\n#  -u  error si usas una variable sin definir\n#  -o pipefail  un fallo en medio de un pipe cuenta como fallo' },
          { t: 'Comillas siempre', p: '`rm $archivo` con un valor que contenga espacios borra cosas que no querías. `rm "$archivo"` no. Entrecomilla todas las variables, sin excepciones.' },
          { f: [['set -e', 'Parar al primer error'], ['set -u', 'Fallar si falta una variable'], ['set -x', 'Mostrar cada comando antes de ejecutarlo (depurar)'], ['trap limpiar EXIT', 'Ejecutar algo al salir, pase lo que pase'], ['"$var"', 'Siempre entre comillas']] },
          { n: '`set -x` es el mejor depurador de bash: imprime cada línea con las variables ya sustituidas, así ves exactamente qué se está ejecutando.' },
        ],
        retos: [
          {
            id: 'r16-set',
            enunciado: 'Crea un script `seguro.sh` cuya segunda línea sea `set -euo pipefail`, la protección estándar de un script serio.',
            snapshot: 'scripts',
            xp: 70,
            pistas: ['Primera línea el shebang, segunda el `set`.', '`echo \'#!/bin/bash\' > seguro.sh && echo \'set -euo pipefail\' >> seguro.sh`'],
            solucion: "echo '#!/bin/bash' > seguro.sh && echo 'set -euo pipefail' >> seguro.sh",
            check: (c) => {
              const t = k.contenido(c, '/home/user/seguro.sh') || '';
              return t.includes('#!/bin/bash') && t.includes('set -euo pipefail');
            },
          },
        ],
      },
      {
        id: 'proyecto',
        titulo: 'Proyecto: buscador de archivos',
        subtitulo: 'Juntar todo en una herramienta que usarías de verdad',
        cuerpo: [
          { t: 'Qué vas a construir', p: 'Un script que recibe un patrón y una carpeta, comprueba que los argumentos son correctos, busca los archivos que coinciden y resume cuántos encontró. Es pequeño, pero usa todo lo del módulo.' },
          { c: '#!/bin/bash\nset -euo pipefail\n\nuso() {\n    echo "Uso: $0 <patrón> [carpeta]" >&2\n    exit 1\n}\n\n[ $# -ge 1 ] || uso\n\npatron="$1"\ncarpeta="${2:-.}"\n\n[ -d "$carpeta" ] || { echo "No existe $carpeta" >&2; exit 1; }\n\nencontrados=$(find "$carpeta" -type f -name "*$patron*" | wc -l)\nfind "$carpeta" -type f -name "*$patron*"\necho "--- $encontrados resultados ---"' },
          { t: 'Las piezas', p: '`${2:-.}` es un valor por defecto: si no hay segundo argumento, usa el punto. `$( … )` captura la salida de un comando dentro de una variable. Y todas las variables van entrecomilladas.' },
        ],
        retos: [
          {
            id: 'r16-buscador',
            enunciado: 'Practica la pieza clave del proyecto: guarda en una variable llamada `total` el número de archivos `.txt` que hay en tu carpeta, y muéstrala.',
            snapshot: 'busqueda',
            xp: 90,
            pistas: ['Se captura la salida de un comando con `$( … )`.', '`total=$(find . -name "*.txt" | wc -l); echo $total`'],
            solucion: 'total=$(find . -name "*.txt" | wc -l); echo $total',
            check: (c) => k.ultimoUsó(c, /\$\(/) && /\d/.test(k.ultimaSalida(c)),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /total=find/), titulo: 'Falta capturar la salida', texto: 'Así estarías guardando el texto literal «find». Para quedarte con el resultado del comando hay que envolverlo: `total=$(find …)`.' },
            ],
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué hace `set -e`?', opciones: ['Muestra los comandos', 'Detiene el script al primer error', 'Exporta variables', 'Activa el modo estricto de variables'], correcta: 1, explicacion: 'Sin él, el script continúa aunque un comando falle, que es como se producen los desastres.' },
      { pregunta: '¿Qué significa `${2:-.}`?', opciones: ['El segundo argumento menos un punto', 'El segundo argumento, o un punto si no hay', 'Borra el segundo argumento', 'Es un error de sintaxis'], correcta: 1, explicacion: 'Es la sintaxis de valor por defecto.' },
      { pregunta: '¿Por qué se entrecomillan las variables?', opciones: ['Por estilo', 'Para que los valores con espacios no se partan en varios argumentos', 'Para que sean más rápidas', 'Para exportarlas'], correcta: 1, explicacion: 'Sin comillas, un nombre de archivo con espacios se convierte en varios argumentos y el comando hace algo distinto de lo previsto.' },
      { pregunta: '¿Qué hace `$(comando)`?', opciones: ['Ejecuta en segundo plano', 'Captura la salida del comando', 'Define una función', 'Comenta la línea'], correcta: 1, explicacion: 'Sustituye la expresión por lo que el comando imprimió.' },
      { pregunta: '¿A dónde deben ir los mensajes de error de un script?', opciones: ['A stdout', 'A stderr, con >&2', 'A un archivo', 'Da igual'], correcta: 1, explicacion: 'Así quien use tu script puede separar los resultados de los fallos.' },
    ],
  },

  // ======================================================================
  {
    id: 'cifrado',
    n: 17,
    nombre: 'Cifrado y hashes',
    resumen: 'Integridad, confidencialidad y codificación',
    comandos: ['sha256sum', 'md5sum', 'base64', 'gpg', 'openssl', 'diff'],
    lecciones: [
      {
        id: 'hashes',
        titulo: 'Hashes: la huella digital',
        subtitulo: 'Comprobar que un archivo no ha cambiado',
        cuerpo: [
          { t: 'Qué es un hash', p: 'Una función que convierte cualquier archivo en una cadena de longitud fija. Cambia un solo byte del archivo y la cadena cambia por completo. No se puede invertir: del hash no se saca el archivo.' },
          { f: [['sha256sum archivo', 'Calcula el hash SHA-256'], ['md5sum archivo', 'MD5 — obsoleto, no usar para seguridad'], ['sha256sum -c suma.txt', 'Verifica contra una lista de hashes'], ['sha256sum *', 'Hash de varios archivos']] },
          { t: 'Para qué se usa', p: 'Verificar que una descarga no se corrompió ni fue manipulada, detectar si un archivo del sistema ha cambiado, y guardar contraseñas (nunca en claro: se guarda su hash).' },
          { t: 'MD5 y SHA-1 están rotos', p: 'Se pueden fabricar dos archivos distintos con el mismo hash. Siguen valiendo para detectar corrupción accidental, pero no para seguridad. Usa SHA-256.' },
        ],
        retos: [
          {
            id: 'r17-sha',
            enunciado: 'Calcula el hash SHA-256 del archivo `notas.txt`.',
            snapshot: 'inicio',
            xp: 50,
            pistas: ['El comando lleva el nombre del algoritmo y la palabra «sum».', '`sha256sum notas.txt`'],
            solucion: 'sha256sum notas.txt',
            check: (c) => /[0-9a-f]{32,}/.test(k.ultimaSalida(c)) && k.salidaTiene(c, 'notas.txt'),
          },
          {
            id: 'r17-integridad',
            enunciado: 'Comprueba la integridad: calcula el hash de `notas.txt`, guárdalo en `suma.txt` y verifícalo después.',
            snapshot: 'inicio',
            xp: 80,
            pistas: ['Primero `sha256sum notas.txt > suma.txt`.', 'Después verifica con `sha256sum -c suma.txt`.'],
            solucion: 'sha256sum notas.txt > suma.txt && sha256sum -c suma.txt',
            check: (c) => k.existe(c, '/home/user/suma.txt') && k.salidaTiene(c, 'OK'),
          },
        ],
      },
      {
        id: 'base64',
        titulo: 'Codificar no es cifrar',
        subtitulo: 'La confusión más común del mundo',
        cuerpo: [
          { t: 'Base64 no protege nada', p: 'Convierte datos binarios en texto imprimible para poder mandarlos por correo o meterlos en un JSON. Cualquiera lo revierte en un segundo. **No es seguridad.**' },
          { f: [['base64 archivo', 'Codificar'], ['base64 -d archivo', 'Descodificar'], ['echo texto | base64', 'Codificar por un pipe']] },
          { t: 'Los tres conceptos, separados', p: '**Codificar** cambia el formato (base64) y cualquiera lo revierte. **Hashear** es de una sola dirección (sha256) y no se revierte. **Cifrar** protege el contenido con una clave (gpg, openssl) y solo se revierte con esa clave.' },
          { n: 'Si ves algo terminado en `==`, casi seguro es base64. Encontrar credenciales «protegidas» en base64 dentro de un archivo de configuración es un hallazgo clásico en cualquier auditoría.' },
        ],
        retos: [
          {
            id: 'r17-b64',
            enunciado: 'Codifica el texto `secreto` en base64.',
            snapshot: 'inicio',
            xp: 50,
            pistas: ['Encadena `echo` con `base64` mediante un pipe.', '`echo secreto | base64`'],
            solucion: 'echo secreto | base64',
            check: (c) => k.salidaTiene(c, 'c2VjcmV0bwo=') || k.salidaTiene(c, 'c2VjcmV0bw=='),
          },
          {
            id: 'r17-b64-d',
            enunciado: 'Descodifica esta cadena en base64: `bGludXggZXMgZGl2ZXJ0aWRv`',
            snapshot: 'inicio',
            xp: 60,
            pistas: ['La opción de descodificar es `-d`.', '`echo bGludXggZXMgZGl2ZXJ0aWRv | base64 -d`'],
            solucion: 'echo bGludXggZXMgZGl2ZXJ0aWRv | base64 -d',
            check: (c) => k.salidaTiene(c, 'linux es divertido'),
          },
        ],
      },
      {
        id: 'gpg',
        titulo: 'Cifrar de verdad',
        subtitulo: 'gpg y openssl',
        cuerpo: [
          { t: 'Cifrado simétrico', p: 'Una sola contraseña sirve para cifrar y descifrar. Sencillo, pero hay que hacer llegar esa contraseña al destinatario de forma segura, que es justo el problema difícil.' },
          { f: [['gpg -c archivo', 'Cifrar con contraseña'], ['gpg -d archivo.gpg', 'Descifrar'], ['gpg --gen-key', 'Generar tu par de claves'], ['gpg -e -r ana archivo', 'Cifrar para que solo Ana lo abra'], ['openssl enc -aes-256-cbc -in a -out a.enc', 'Alternativa con openssl']] },
          { t: 'Cifrado asimétrico', p: 'El mismo esquema de claves de SSH: cifras con la clave **pública** del destinatario y solo su clave **privada** puede abrirlo. No hace falta compartir ningún secreto previo.' },
          { t: 'Firmar', p: 'Con la privada también se firma: quien tenga tu pública puede comprobar que el archivo lo escribiste tú y que nadie lo alteró. Así se verifican los paquetes que instala `apt`.' },
        ],
        retos: [
          {
            id: 'r17-gpg',
            enunciado: 'Cifra el archivo `notas.txt` de forma simétrica con gpg.',
            snapshot: 'inicio',
            xp: 70,
            pistas: ['La opción de cifrado simétrico es `-c`.', '`gpg -c notas.txt`'],
            solucion: 'gpg -c notas.txt',
            check: (c) => k.existe(c, '/home/user/notas.txt.gpg'),
          },
          {
            id: 'r17-gpg-d',
            enunciado: 'Cifra `notas.txt`, borra el original y recupéralo descifrando el archivo resultante.',
            snapshot: 'inicio',
            xp: 90,
            pistas: ['Son tres pasos: `gpg -c notas.txt`, `rm notas.txt`, y luego descifrar.', 'Descifrar es `gpg -d notas.txt.gpg > notas.txt`.'],
            solucion: 'gpg -c notas.txt && rm notas.txt && gpg -d notas.txt.gpg > notas.txt',
            check: (c) => (k.contenido(c, '/home/user/notas.txt') || '').includes('lista de la compra') && k.usó(c, /gpg\s+-c/) && k.usó(c, /gpg\s+-d/),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Se puede revertir un hash SHA-256?', opciones: ['Sí, con la clave', 'No, es de una sola dirección', 'Sí, con base64 -d', 'Solo si es corto'], correcta: 1, explicacion: 'Por eso sirve para guardar contraseñas: se compara el hash, nunca se recupera el original.' },
      { pregunta: '¿Base64 es cifrado?', opciones: ['Sí, muy fuerte', 'No, es solo codificación reversible por cualquiera', 'Solo con contraseña', 'Depende del archivo'], correcta: 1, explicacion: 'No protege absolutamente nada: cualquiera lo revierte con `base64 -d`.' },
      { pregunta: '¿Por qué no se debe usar MD5 para seguridad?', opciones: ['Es lento', 'Se pueden fabricar colisiones', 'Da cadenas muy largas', 'No existe ya'], correcta: 1, explicacion: 'Se pueden construir dos archivos distintos con el mismo hash. Sirve para detectar corrupción, no para seguridad.' },
      { pregunta: 'En cifrado asimétrico, ¿con qué clave cifras un mensaje para alguien?', opciones: ['Con tu privada', 'Con la pública del destinatario', 'Con tu pública', 'Con una contraseña'], correcta: 1, explicacion: 'Solo su clave privada podrá descifrarlo.' },
      { pregunta: '¿Para qué sirve `sha256sum -c`?', opciones: ['Calcular más rápido', 'Verificar archivos contra una lista de hashes', 'Cifrar', 'Comprimir'], correcta: 1, explicacion: 'Comprueba que los archivos siguen coincidiendo con los hashes guardados.' },
    ],
  },

  // ======================================================================
  {
    id: 'hardening',
    n: 18,
    nombre: 'Endurecer un servidor',
    resumen: 'Cerrar puertas antes de que alguien las pruebe',
    comandos: ['ufw', 'iptables', 'ss', 'systemctl', 'grep', 'sudo'],
    lecciones: [
      {
        id: 'superficie',
        titulo: 'Reducir la superficie de ataque',
        subtitulo: 'Lo que no está encendido no se puede atacar',
        cuerpo: [
          { t: 'El principio', p: 'Cada servicio en escucha es una puerta. Cada usuario con shell es una llave. Cada permiso de más es un atajo. Endurecer consiste en quitar todo lo que no haga falta.' },
          { f: [['ss -tulpn', 'Qué está escuchando ahora mismo'], ['systemctl list-units --type=service', 'Qué servicios corren'], ['sudo systemctl disable --now servicio', 'Apagar lo que sobra'], ['grep -v nologin /etc/passwd', 'Qué cuentas tienen shell real'], ['find / -perm -4000 2>/dev/null', 'Auditar binarios SUID']] },
          { t: 'Orden de trabajo', p: '1) Ver qué escucha. 2) Apagar lo que no se use. 3) Cortafuegos que deniegue por defecto. 4) SSH con claves y sin root. 5) Auditar permisos y SUID. 6) Actualizar.' },
        ],
        retos: [
          {
            id: 'r18-ss',
            enunciado: 'Empieza la auditoría: lista todos los puertos en escucha y qué proceso los abre.',
            snapshot: 'base',
            xp: 50,
            pistas: ['`ss` con las opciones tcp, udp, listening, procesos y numérico.', '`ss -tulpn`'],
            solucion: 'ss -tulpn',
            check: (c) => k.salidaTiene(c, 'LISTEN'),
          },
          {
            id: 'r18-shells',
            enunciado: 'Averigua qué cuentas del sistema tienen una shell real (es decir, las que NO acaban en `nologin`).',
            snapshot: 'base',
            xp: 70,
            pistas: ['Filtra `/etc/passwd` descartando las líneas con nologin.', '`grep -v nologin /etc/passwd`'],
            solucion: 'grep -v nologin /etc/passwd',
            check: (c) => k.salidaTiene(c, 'root') && !k.salidaTiene(c, 'nologin'),
          },
        ],
      },
      {
        id: 'ssh-seguro',
        titulo: 'Blindar SSH',
        subtitulo: 'El puerto que todo el mundo ataca',
        cuerpo: [
          { t: 'Por qué SSH', p: 'Es el servicio más expuesto de cualquier servidor. En cuanto una máquina sale a internet, empieza a recibir intentos automáticos de acceso. No es personal: son robots probando usuarios y contraseñas comunes.' },
          { t: 'Las cuatro medidas', p: 'Todas se configuran en `/etc/ssh/sshd_config`.' },
          { f: [['PasswordAuthentication no', 'Solo claves, se acabó la fuerza bruta'], ['PermitRootLogin no', 'Nadie entra directamente como root'], ['Port 2222', 'Cambiar de puerto reduce el ruido automático'], ['AllowUsers deploy', 'Solo estos usuarios pueden entrar'], ['sudo systemctl restart ssh', 'Aplicar los cambios']] },
          { t: 'fail2ban', p: 'Vigila los registros y bloquea automáticamente la IP que falla varias veces seguidas. Es la defensa práctica contra la fuerza bruta.' },
          { n: 'Antes de reiniciar SSH tras cambiar la configuración: **deja abierta otra sesión**. Si te equivocas y te desconectas, esa sesión abierta es tu única forma de arreglarlo.' },
        ],
        retos: [
          {
            id: 'r18-sshd',
            enunciado: 'Revisa la configuración del servidor SSH y comprueba si el acceso directo como root está permitido.',
            snapshot: 'base',
            xp: 65,
            pistas: ['El archivo es `/etc/ssh/sshd_config`. Busca dentro la directiva correspondiente.', '`grep PermitRootLogin /etc/ssh/sshd_config`'],
            solucion: 'grep PermitRootLogin /etc/ssh/sshd_config',
            check: (c) => k.salidaTiene(c, 'PermitRootLogin'),
          },
          {
            id: 'r18-passauth',
            enunciado: 'Comprueba si el servidor SSH acepta autenticación por contraseña, buscando la directiva concreta en su configuración.',
            snapshot: 'base',
            xp: 65,
            pistas: ['La directiva se llama PasswordAuthentication.', '`grep PasswordAuthentication /etc/ssh/sshd_config`'],
            solucion: 'grep PasswordAuthentication /etc/ssh/sshd_config',
            check: (c) => k.salidaTiene(c, 'PasswordAuthentication'),
          },
        ],
      },
      {
        id: 'firewall',
        titulo: 'Cortafuegos',
        subtitulo: 'Denegar por defecto, permitir lo justo',
        cuerpo: [
          { t: 'La política correcta', p: 'No se trata de bloquear lo malo: es imposible enumerarlo. Se bloquea **todo** y luego se abre solo lo que el servicio necesita.' },
          { f: [['sudo ufw default deny incoming', 'Denegar todo lo que entra'], ['sudo ufw default allow outgoing', 'Permitir lo que sale'], ['sudo ufw allow 22/tcp', 'Abrir SSH'], ['sudo ufw allow 443/tcp', 'Abrir HTTPS'], ['sudo ufw enable', 'Activar el cortafuegos'], ['sudo ufw status verbose', 'Ver las reglas']] },
          { t: 'ufw es la cara amable de iptables', p: 'Por debajo está `iptables` (o `nftables`), con sus cadenas INPUT, OUTPUT y FORWARD. `ufw` genera esas reglas por ti con una sintaxis mucho más simple.' },
          { n: 'Antes de activar el cortafuegos en un servidor remoto, asegúrate de haber permitido tu puerto SSH. Es la forma clásica de quedarse fuera de la propia máquina.' },
        ],
        retos: [
          {
            id: 'r18-ufw',
            enunciado: 'Configura el cortafuegos con la política correcta: denegar todo el tráfico entrante por defecto.',
            snapshot: 'base',
            xp: 70,
            pistas: ['La política por defecto se fija con `ufw default`.', '`sudo ufw default deny incoming`'],
            solucion: 'sudo ufw default deny incoming',
            check: (c) => !!c.shell.state.firewall && c.shell.state.firewall.defaultIn === 'deny',
          },
          {
            id: 'r18-ufw-ssh',
            enunciado: 'Antes de activar nada, abre el puerto 22 para no quedarte fuera, y después activa el cortafuegos.',
            snapshot: 'base',
            xp: 85,
            pistas: ['Primero `sudo ufw allow 22/tcp`.', 'Y después `sudo ufw enable`.'],
            solucion: 'sudo ufw allow 22/tcp && sudo ufw enable',
            check: (c) => {
              const f = c.shell.state.firewall;
              return !!f && f.enabled && f.rules.some((r) => String(r.port) === '22');
            },
            diagnostico: [
              { cuando: (c) => { const f = c.shell.state.firewall; return !!f && f.enabled && !f.rules.some((r) => String(r.port) === '22'); }, titulo: 'Activaste el cortafuegos sin abrir SSH', texto: 'En un servidor real acabas de dejarte fuera. El orden correcto es permitir tu puerto de acceso **antes** de activar el cortafuegos.' },
            ],
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Cuál es la política correcta de un cortafuegos?', opciones: ['Permitir todo y bloquear lo malo', 'Denegar todo y abrir solo lo necesario', 'Depende del servidor', 'Bloquear solo los puertos altos'], correcta: 1, explicacion: 'Enumerar lo malo es imposible. Se deniega por defecto y se abre lo justo.' },
      { pregunta: '¿Qué directiva desactiva el acceso por contraseña en SSH?', opciones: ['PermitRootLogin no', 'PasswordAuthentication no', 'AllowUsers', 'Port 2222'], correcta: 1, explicacion: 'Obliga a usar claves, con lo que la fuerza bruta deja de ser viable.' },
      { pregunta: '¿Para qué sirve fail2ban?', opciones: ['Cifrar el tráfico', 'Bloquear IPs que fallan repetidamente al autenticarse', 'Acelerar SSH', 'Hacer copias de seguridad'], correcta: 1, explicacion: 'Lee los registros y banea automáticamente al atacante.' },
      { pregunta: '¿Qué precaución hay que tomar antes de activar ufw en un servidor remoto?', opciones: ['Reiniciar', 'Permitir el puerto SSH primero', 'Desactivar SSH', 'Nada'], correcta: 1, explicacion: 'Si activas el cortafuegos sin abrir tu puerto de acceso, te quedas fuera de la máquina.' },
      { pregunta: '¿Por qué cambiar el puerto de SSH ayuda?', opciones: ['Lo hace indescifrable', 'Reduce enormemente los intentos automáticos', 'Es más rápido', 'No sirve de nada'], correcta: 1, explicacion: 'No es seguridad real por sí solo, pero elimina casi todo el ruido de los escaneos masivos.' },
    ],
  },

  // ======================================================================
  {
    id: 'analisis',
    n: 19,
    nombre: 'Análisis e investigación',
    resumen: 'Leer los rastros que deja un incidente',
    comandos: ['grep', 'awk', 'sort', 'uniq', 'last', 'who', 'find', 'ps', 'sha256sum'],
    lecciones: [
      {
        id: 'auth',
        titulo: 'Detectar un ataque de fuerza bruta',
        subtitulo: 'Todo queda escrito en auth.log',
        cuerpo: [
          { t: 'La huella', p: 'Cada intento fallido de SSH deja una línea `Failed password`. Muchas seguidas desde la misma IP en pocos segundos es un ataque automatizado, no un usuario despistado.' },
          { c: 'ene 15 10:26:02 sshd[1190]: Failed password for invalid user admin from 45.12.9.3\nene 15 10:26:05 sshd[1191]: Failed password for invalid user root from 45.12.9.3\nene 15 10:26:09 sshd[1192]: Failed password for invalid user test from 45.12.9.3' },
          { t: 'La cadena que lo resume', p: 'Filtras los fallos, extraes la IP, ordenas, cuentas repeticiones y ordenas por cantidad. Es exactamente lo que aprendiste en el módulo de pipes, aplicado a un caso real.' },
          { c: 'grep "Failed password" /var/log/auth.log | \\\n  awk \'{print $NF}\' | sort | uniq -c | sort -rn' },
          { f: [['last', 'Últimos accesos correctos'], ['who / w', 'Quién está conectado ahora'], ['lastb', 'Intentos fallidos'], ['grep Accepted auth.log', 'Accesos que sí funcionaron']] },
          { n: 'Lo importante no es solo ver los fallos: es comprobar si después de muchos fallos hay un `Accepted`. Eso significa que el ataque tuvo éxito.' },
        ],
        retos: [
          {
            id: 'r19-failed',
            enunciado: 'Busca en `/var/log/syslog` todos los intentos fallidos de autenticación.',
            snapshot: 'base',
            xp: 60,
            pistas: ['La cadena que aparece en el registro es «Failed password».', '`sudo grep "Failed password" /var/log/syslog`'],
            solucion: 'sudo grep "Failed password" /var/log/syslog',
            check: (c) => k.salidaTiene(c, 'Failed password', '45.12.9.3'),
            diagnostico: [
              { cuando: (c) => k.salidaTiene(c, 'Permission denied'), titulo: 'Los registros están protegidos', texto: 'El archivo pertenece a root. Añade `sudo` delante del comando.' },
            ],
          },
          {
            id: 'r19-ranking',
            enunciado: 'Averigua desde qué IP vienen más intentos fallidos: filtra, extrae la última columna, cuenta y ordena de mayor a menor.',
            snapshot: 'base',
            xp: 110,
            pistas: ['La IP es el último campo: en awk se accede con `$NF`.', 'La cadena completa: `sudo grep "Failed password" /var/log/syslog | awk \'{print $NF}\' | sort | uniq -c | sort -rn`'],
            solucion: 'sudo grep "Failed password" /var/log/syslog | awk \'{print $NF}\' | sort | uniq -c | sort -rn',
            check: (c) => /3\s+45\.12\.9\.3/.test(k.ultimaSalida(c)),
            diagnostico: [
              { cuando: (c) => k.ultimoUsó(c, /uniq/) && !k.ultimoUsó(c, /sort.*uniq/), titulo: 'Falta ordenar antes de contar', texto: '`uniq` solo agrupa líneas iguales consecutivas. Mete un `sort` justo antes.' },
              { cuando: (c) => k.ultimoUsó(c, /awk/) && !k.salidaTiene(c, '45.12.9.3'), titulo: 'La columna extraída no es la IP', texto: 'La IP está al final de la línea. En awk, el último campo es `$NF`.' },
            ],
          },
          {
            id: 'r19-exito',
            enunciado: 'Comprueba si algún intento de acceso llegó a tener éxito: busca las líneas de acceso aceptado en el registro.',
            snapshot: 'base',
            xp: 70,
            pistas: ['La palabra que aparece cuando un acceso funciona es «Accepted».', '`sudo grep Accepted /var/log/syslog`'],
            solucion: 'sudo grep Accepted /var/log/syslog',
            check: (c) => k.salidaTiene(c, 'Accepted publickey'),
          },
        ],
      },
      {
        id: 'rastros',
        titulo: 'Buscar lo que no encaja',
        subtitulo: 'Procesos, permisos y archivos sospechosos',
        cuerpo: [
          { t: 'Qué se revisa', p: 'Tras un incidente se busca lo anómalo: procesos que consumen sin explicación, binarios SUID que no deberían existir, archivos escribibles por todo el mundo, tareas programadas que nadie puso y ficheros modificados hace poco.' },
          { f: [['ps aux --sort=-%cpu', 'Procesos ordenados por consumo'], ['find / -perm -4000 2>/dev/null', 'Binarios SUID'], ['find / -perm -002 -type f 2>/dev/null', 'Archivos que cualquiera puede escribir'], ['crontab -l', 'Tareas programadas del usuario'], ['find / -mmin -60 2>/dev/null', 'Modificado en la última hora'], ['sha256sum /usr/bin/*', 'Comprobar integridad de binarios']] },
          { t: 'El método', p: 'Compara siempre contra lo esperado. Un binario SUID en `/tmp` es anómalo; `passwd` con SUID en `/usr/bin` es lo normal. Lo que delata un problema no es una lista larga, es un elemento fuera de sitio.' },
        ],
        retos: [
          {
            id: 'r19-cpu',
            enunciado: 'Identifica qué proceso está consumiendo más CPU en la máquina.',
            snapshot: 'diagnostico',
            xp: 60,
            pistas: ['Puedes usar `top`, o bien `ps aux` filtrando.', '`top` muestra los procesos ya ordenados por consumo.'],
            solucion: 'top',
            check: (c) => k.salidaTiene(c, 'render-worker') || k.salidaTiene(c, '%Cpu'),
          },
          {
            id: 'r19-escribibles',
            enunciado: 'Busca en el sistema los archivos que cualquier usuario puede escribir, descartando los errores de permisos.',
            snapshot: 'base',
            xp: 90,
            pistas: ['El permiso de escritura para «otros» es 002.', '`find / -perm -002 -type f 2>/dev/null`'],
            solucion: 'find / -perm -002 -type f 2>/dev/null',
            check: (c) => k.ultimoUsó(c, /-perm\s+-?002/) && k.ultimoUsó(c, /2\s*>\s*\/dev\/null/),
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué indica una ráfaga de «Failed password» desde la misma IP?', opciones: ['Un usuario despistado', 'Un ataque de fuerza bruta automatizado', 'Un fallo del servidor', 'Mantenimiento'], correcta: 1, explicacion: 'Muchos intentos con usuarios distintos en segundos es un robot probando credenciales.' },
      { pregunta: 'Tras muchos «Failed password» encuentras un «Accepted». ¿Qué significa?', opciones: ['Que el ataque falló', 'Que el atacante consiguió entrar', 'Que se reinició SSH', 'Nada relevante'], correcta: 1, explicacion: 'Es la señal de compromiso: hay que investigar qué hizo esa sesión.' },
      { pregunta: '¿Qué hace `awk \'{print $NF}\'`?', opciones: ['Imprime la primera columna', 'Imprime la última columna', 'Cuenta los campos', 'Imprime el número de línea'], correcta: 1, explicacion: '`NF` es el número de campos, así que `$NF` es el último.' },
      { pregunta: '¿Por qué es sospechoso un binario SUID en /tmp?', opciones: ['Ocupa espacio', 'Porque ahí no debería haber binarios privilegiados: suele ser una puerta trasera', 'Porque /tmp se borra', 'No es sospechoso'], correcta: 1, explicacion: 'Un SUID fuera de los directorios del sistema es una de las formas clásicas de mantener acceso de root.' },
      { pregunta: '¿Para qué sirve `sha256sum` en una investigación?', opciones: ['Cifrar pruebas', 'Comprobar si un binario del sistema fue modificado', 'Comprimir registros', 'Buscar texto'], correcta: 1, explicacion: 'Si el hash de un binario no coincide con el original del paquete, ha sido alterado.' },
    ],
  },

  // ======================================================================
  {
    id: 'etico',
    n: 20,
    nombre: 'Hacking ético',
    resumen: 'Metodología, reconocimiento y enumeración — con la ley delante',
    comandos: ['ss', 'curl', 'dig', 'grep', 'find', 'ping'],
    lecciones: [
      {
        id: 'legal',
        titulo: 'Antes que cualquier técnica: la ley',
        subtitulo: 'La única diferencia entre un profesional y un delito',
        cuerpo: [
          { t: 'No es una formalidad', p: 'Acceder o siquiera escanear sistemas ajenos sin autorización expresa y por escrito es delito. En España, el artículo 197 bis del Código Penal contempla penas de prisión. La técnica es la misma; lo que cambia es el permiso.' },
          { t: 'Qué necesitas siempre', p: 'Un contrato o autorización firmada que diga **qué** sistemas puedes tocar, **cuándo**, con **qué** técnicas y a **quién** avisar si encuentras algo grave. Sin ese papel, no se toca nada.' },
          { t: 'Dónde practicar legalmente', p: 'Máquinas propias en una VM, laboratorios diseñados para ello (HackTheBox, TryHackMe, VulnHub, PortSwigger Academy), CTFs y programas públicos de recompensas por errores, respetando siempre su alcance.' },
          { n: 'En esta app todo ocurre dentro de un Linux simulado en tu móvil. No hay red, no hay objetivos reales y nada sale del dispositivo. Es un laboratorio cerrado, exactamente igual que una VM de prácticas.' },
        ],
        retos: [],
      },
      {
        id: 'metodologia',
        titulo: 'La metodología',
        subtitulo: 'Las fases de una auditoría, en orden',
        cuerpo: [
          { t: 'No se empieza atacando', p: 'Una auditoría real es sobre todo información. La fase de explotación es corta; lo largo es entender el objetivo.' },
          { f: [['1 · Alcance', 'Qué se puede tocar y qué no. Por escrito'], ['2 · Reconocimiento', 'Información pública, sin tocar el objetivo'], ['3 · Enumeración', 'Qué servicios y versiones hay activos'], ['4 · Análisis', 'Qué de eso es vulnerable'], ['5 · Explotación', 'Demostrar el impacto real, controladamente'], ['6 · Post-explotación', 'Hasta dónde se podría llegar'], ['7 · Informe', 'Hallazgos, riesgo y cómo arreglarlo']] },
          { t: 'El informe es el producto', p: 'A quien te contrata no le sirve una consola con acceso de root: le sirve un documento que explique qué falla, qué impacto tiene en su negocio y qué pasos concretos lo arreglan. Es la parte que separa a un profesional de alguien que solo sabe lanzar herramientas.' },
        ],
        retos: [],
      },
      {
        id: 'enumeracion',
        titulo: 'Enumeración en el laboratorio',
        subtitulo: 'Qué corre, en qué versión y cómo está configurado',
        cuerpo: [
          { t: 'Enumerar es inventariar', p: 'Antes de valorar riesgos hay que saber qué hay: qué puertos escuchan, qué servicio hay detrás de cada uno, qué versión y cómo está configurado. Todos los comandos que necesitas ya los conoces.' },
          { f: [['ss -tulpn', 'Servicios en escucha en la máquina local'], ['curl -I http://host', 'Cabeceras del servidor web: revela producto y versión'], ['dig host', 'Registros DNS del dominio'], ['cat /etc/os-release', 'Qué distribución y versión'], ['uname -r', 'Versión del kernel'], ['dpkg -l', 'Qué software hay instalado']] },
          { t: 'Enumeración local para escalar', p: 'Si ya tienes acceso como usuario normal, lo que se revisa para saber si podrías llegar a root es exactamente lo que viste en los módulos 11 y 19: binarios SUID, capabilities, tareas de cron escribibles, permisos flojos en archivos de configuración y credenciales guardadas en texto claro.' },
          { c: '# la comprobación local clásica\nid\nsudo -l\nfind / -perm -4000 2>/dev/null\ngetcap -r / 2>/dev/null\ncat /etc/crontab' },
          { n: 'Fíjate en que no hay ningún comando nuevo. Auditar es aplicar lo que ya sabes con una pregunta distinta: no «cómo uso este sistema» sino «qué está mal configurado aquí».' },
        ],
        retos: [
          {
            id: 'r20-os',
            enunciado: 'Identifica qué distribución y versión de Linux corre esta máquina.',
            snapshot: 'base',
            xp: 50,
            pistas: ['La información está en un archivo dentro de `/etc`.', '`cat /etc/os-release`'],
            solucion: 'cat /etc/os-release',
            check: (c) => k.salidaTiene(c, 'Debian') && k.salidaTiene(c, '12'),
          },
          {
            id: 'r20-kernel',
            enunciado: 'Averigua la versión exacta del kernel, dato clave para saber si le afecta alguna vulnerabilidad conocida.',
            snapshot: 'base',
            xp: 45,
            pistas: ['`uname` con la opción de *release*.', '`uname -r`'],
            solucion: 'uname -r',
            check: (c) => k.salidaTiene(c, '6.6.15'),
          },
          {
            id: 'r20-headers',
            enunciado: 'Obtén las cabeceras del servidor web que corre en `http://localhost`, sin descargar la página entera.',
            snapshot: 'base',
            xp: 65,
            pistas: ['La opción de curl para pedir solo cabeceras es `-I` mayúscula.', '`curl -I http://localhost`'],
            solucion: 'curl -I http://localhost',
            check: (c) => k.salidaTiene(c, 'HTTP/1.1 200') && k.salidaTiene(c, 'nginx'),
          },
          {
            id: 'r20-completa',
            enunciado: 'Haz la enumeración local completa de escalada: comprueba tu identidad, busca binarios SUID y revisa las tareas programadas del sistema.',
            snapshot: 'base',
            xp: 120,
            pistas: ['Son tres comandos: `id`, luego la búsqueda de SUID y luego el crontab del sistema.', '`id; find / -perm -4000 2>/dev/null; cat /etc/crontab`'],
            solucion: 'id; find / -perm -4000 2>/dev/null; cat /etc/crontab',
            check: (c) => k.usó(c, /^id\b|;\s*id\b/) && k.usó(c, /-perm\s+-?\/?4000/) && k.usó(c, /crontab/),
            diagnostico: [
              { cuando: (c) => !k.usó(c, /-perm/), titulo: 'Falta la auditoría de SUID', texto: 'Es el paso más rentable de la enumeración local: `find / -perm -4000 2>/dev/null`.' },
              { cuando: (c) => !k.usó(c, /crontab/), titulo: 'Falta revisar las tareas programadas', texto: 'Una tarea de cron que ejecute un script escribible por ti es una vía directa a root. Mira `/etc/crontab`.' },
            ],
          },
        ],
      },
    ],
    examen: [
      { pregunta: '¿Qué necesitas antes de auditar un sistema que no es tuyo?', opciones: ['Buenas intenciones', 'Autorización expresa y por escrito', 'Avisar después', 'Nada, si no rompes nada'], correcta: 1, explicacion: 'Sin autorización previa por escrito es un delito, aunque no causes daño alguno.' },
      { pregunta: '¿Cuál es el producto final de una auditoría profesional?', opciones: ['Un acceso de root', 'El informe con hallazgos, riesgo y remediación', 'Una lista de contraseñas', 'Un exploit'], correcta: 1, explicacion: 'El cliente paga por entender qué falla y cómo arreglarlo, no por una demostración.' },
      { pregunta: '¿Qué fase va justo antes de la explotación?', opciones: ['El informe', 'El análisis de vulnerabilidades', 'El alcance', 'La post-explotación'], correcta: 1, explicacion: 'Primero enumeras, luego analizas qué de eso es explotable, y solo entonces se prueba.' },
      { pregunta: '¿Por qué se revisan los binarios SUID en una enumeración local?', opciones: ['Para liberar espacio', 'Porque un SUID mal elegido permite escalar a root', 'Para acelerar el sistema', 'Por costumbre'], correcta: 1, explicacion: 'Se ejecutan con los permisos de su dueño; si ese dueño es root y el binario permite ejecutar comandos, es acceso total.' },
      { pregunta: '¿Qué revela `curl -I` de un servidor web?', opciones: ['Su código fuente', 'Las cabeceras, que suelen delatar producto y versión', 'Sus contraseñas', 'Sus usuarios'], correcta: 1, explicacion: 'Cabeceras como `Server:` identifican el software, primer paso para saber si tiene fallos conocidos.' },
    ],
  },
];
