// Fase 4: Bash profundo y Python aplicado. Todo se ejecuta dentro del
// filesystem y la red simulados; requests y socket nunca salen del navegador.

import * as k from './checks.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';
import { entrena, tareaV2 } from './curriculum-v2.js';

const q = (id, enunciado, opciones, correcta, explicacion, ...habilidades) =>
  entrena(quiz(id, enunciado, opciones, correcta, explicacion), ...habilidades);
const r = (id, enunciado, respuestas, explicacion, ...habilidades) =>
  entrena(respuesta(id, enunciado, respuestas, explicacion), ...habilidades);
const c = (id, enunciado, plantilla, respuestas, explicacion, ...habilidades) =>
  entrena(completar(id, enunciado, plantilla, respuestas, explicacion, habilidades), ...habilidades);
const o = (id, enunciado, tokens, correcta, explicacion, ...habilidades) =>
  entrena(ordenar(id, enunciado, barajar(tokens, id), correcta, explicacion, habilidades), ...habilidades);
const t = (id, enunciado, snapshot, solucion, check, pistas, ...habilidades) =>
  entrena(terminal(id, enunciado, snapshot, solucion, check, pistas), ...habilidades);

const BASH = 'scripts';
const PY = 'inicio';

export const SALA_BASH_PROFESIONAL = {
  id: 'bash-profesional', n: 47, nombre: 'Bash profesional',
  resumen: 'Expansión segura, arrays, códigos de salida, parsing y automatización verificable',
  dificultad: 'Intermedia', minutos: 50,
  comandos: ['bash', 'printf', 'test', 'grep', 'cut', 'sort', 'uniq', 'find'], origen: 'v2-fase4',
  tareas: [
    tareaV2({
      id: 'bp-quoting', titulo: '1. Expansión y quoting sin sorpresas', subtitulo: 'Controlar cuándo Bash interpreta el texto',
      teoria: [
        { t: 'Bash transforma antes de ejecutar', p: 'Una línea pasa por expansión de variables, sustitución de comandos, separación en palabras y globs. El programa recibe el resultado, no el texto original.' },
        { t: 'Comillas dobles para datos', p: 'Las comillas dobles conservan espacios y todavía expanden variables. Las simples preservan cada carácter literalmente. Una variable que representa una ruta casi siempre debe ir entre comillas dobles.' },
        { t: 'Llaves para marcar límites', p: 'La forma ${nombre} separa el nombre de la variable del texto pegado. Las expansiones con valor por defecto permiten distinguir entre una opción ausente y una cadena proporcionada.' },
        { n: 'Regla operativa', p: 'El shell interpreta sintaxis; los datos no deberían convertirse accidentalmente en sintaxis. Cita variables y valida antes de construir comandos.' },
      ],
      practica: [
        q('bp-quo-q1', '¿Qué comillas expanden una variable sin dividir un valor con espacios?', ['Dobles', 'Simples', 'Ninguna', 'Solo corchetes'], 0, 'Las dobles expanden y conservan el valor como un argumento.', 'bash-quoting'),
        q('bp-quo-q2', '¿Qué imprime echo con una variable entre comillas simples?', ['El texto literal con dólar', 'El valor expandido', 'Un código de salida', 'Nada siempre'], 0, 'Las comillas simples desactivan la expansión.', 'bash-quoting'),
        c('bp-quo-c1', 'Completa la referencia segura a una ruta.', 'cat "______"', ['$archivo', '${archivo}'], 'La variable queda protegida de separación y globs.', 'bash-quoting'),
        o('bp-quo-o1', 'Ordena las transformaciones principales de una palabra no citada.', ['expandir', '→', 'separar palabras', '→', 'expandir globs', '→', 'ejecutar'], 'expandir → separar palabras → expandir globs → ejecutar', 'Bash prepara los argumentos antes de invocar el comando.', 'bash-quoting'),
        t('bp-quo-t1', 'Guarda informe final en etiqueta e imprímelo como un único argumento entre ángulos.', BASH, "etiqueta='informe final'\nprintf '<%s>\\n' \"$etiqueta\"", (ctx) => k.salidaTiene(ctx, '<informe final>') && ctx.shell.env.etiqueta === 'informe final', ['Asigna con comillas.', 'Usa printf y cita "$etiqueta".'], 'bash-quoting', 'printf'),
        r('bp-quo-r1', '¿Qué carácter rodea el nombre en ${archivo} para delimitarlo?', ['llaves', 'llave', '{}'], 'Las llaves separan el identificador del texto vecino.', 'bash-quoting'),
      ],
    }),
    tareaV2({
      id: 'bp-arrays', titulo: '2. Arrays indexados', subtitulo: 'Una colección, no una cadena disfrazada',
      teoria: [
        { t: 'Una variable puede contener varios elementos', p: 'puertos=(22 80 443) crea un array indexado. Cada elemento conserva su identidad y puede recorrerse sin inventar separadores.' },
        { t: 'Tres expansiones distintas', p: '${puertos[0]} recupera el primer elemento, ${puertos[@]} expande todos y ${#puertos[@]} devuelve la cantidad.' },
        { t: 'Recorrer con seguridad', p: 'for puerto in "${puertos[@]}" conserva un elemento por iteración, incluso si alguno contiene espacios.' },
        { n: 'Cuándo no usar arrays', p: 'Un array Bash no sustituye JSON ni una tabla. Es adecuado para listas pequeñas de argumentos dentro de un script.' },
      ],
      practica: [
        q('bp-arr-q1', '¿Con qué índice comienza un array Bash?', ['0', '1', '-1', 'Depende del usuario'], 0, 'Los arrays indexados empiezan en cero.', 'bash-arrays'),
        q('bp-arr-q2', '¿Qué expansión devuelve la cantidad de elementos?', ['${#a[@]}', '${a[0]}', '$?', '$#'], 0, 'El prefijo # pide longitud.', 'bash-arrays'),
        c('bp-arr-c1', 'Completa la expansión de todos los elementos.', 'for x in "______"; do echo "$x"; done', ['${datos[@]}'], '[@] representa todos los elementos.', 'bash-arrays', 'for'),
        o('bp-arr-o1', 'Ordena las piezas de una asignación de array.', ['servicios=', '(', 'ssh', 'http', 'dns', ')'], 'servicios= ( ssh http dns )', 'Los elementos se escriben entre paréntesis; en código real no hay espacio antes del paréntesis.', 'bash-arrays'),
        t('bp-arr-t1', 'Crea un array puertos con 22, 80 y 443, y muestra cuántos elementos tiene.', BASH, "puertos=(22 80 443)\necho ${#puertos[@]}", (ctx) => Array.isArray(ctx.shell.env.puertos) && ctx.shell.env.puertos.length === 3 && k.salidaTiene(ctx, '3'), ['Asigna con paréntesis.', 'La longitud es ${#puertos[@]}.'], 'bash-arrays', 'bash'),
        t('bp-arr-t2', 'Recorre el array nombres con ana y leo e imprime cada elemento.', BASH, "nombres=(ana leo)\nfor nombre in \"${nombres[@]}\"; do echo \"$nombre\"; done", (ctx) => k.salidaTiene(ctx, 'ana', 'leo') && k.ultimoUsó(ctx, /^for /), ['Crea el array primero.', 'Recorre "${nombres[@]}" con for.'], 'bash-arrays', 'for'),
      ],
    }),
    tareaV2({
      id: 'bp-salidas', titulo: '3. Códigos de salida y composición', subtitulo: 'El contrato invisible de cada comando',
      teoria: [
        { t: 'Cero significa éxito', p: 'Los comandos devuelven un entero. Bash usa 0 como éxito y cualquier otro valor como una familia de fallos; el texto mostrado no sustituye ese contrato.' },
        { t: 'Operadores con intención', p: 'A && B ejecuta B solo si A funciona. A || B ejecuta B si A falla. El punto y coma no condiciona el siguiente comando.' },
        { t: 'Un pipeline también puede fallar', p: 'En scripts reales, set -o pipefail hace que un fallo temprano del pipe no quede oculto por el último comando.' },
        { n: 'Diseña salidas útiles', p: 'Una función debe devolver 0 cuando cumplió su objetivo y un valor distinto cuando su llamador debe tomar otra ruta.' },
      ],
      practica: [
        q('bp-exit-q1', '¿Qué código representa éxito en Unix?', ['0', '1', '200', '255 siempre'], 0, 'Cero es éxito.', 'bash-robustez'),
        q('bp-exit-q2', '¿Cuándo se ejecuta la derecha de ||?', ['Cuando falla la izquierda', 'Cuando funciona', 'Siempre', 'Nunca'], 0, '|| implementa una alternativa ante fallo.', 'bash-robustez'),
        c('bp-exit-c1', 'Completa el operador de recuperación.', 'test -f config || ________ "falta config"', ['echo', 'printf'], 'La rama derecha informa del fallo.', 'bash-robustez', 'test'),
        o('bp-exit-o1', 'Ordena el patrón de validación.', ['validar', '→', 'examinar código', '→', 'informar', '→', 'salir'], 'validar → examinar código → informar → salir', 'La salida del script debe reflejar el resultado.', 'bash-robustez'),
        t('bp-exit-t1', 'Ejecuta false y después muestra su código de salida.', BASH, "false\necho $?", (ctx) => k.salidaTiene(ctx, '1') && k.usó(ctx, /^false$/), ['false termina con error.', 'Después consulta $? con echo.'], 'bash-robustez'),
        t('bp-exit-t2', 'Usa || para imprimir RECUPERADO únicamente después de un fallo.', BASH, 'false || echo RECUPERADO', (ctx) => k.salidaTiene(ctx, 'RECUPERADO') && ctx.ultimo.code === 0, ['Coloca false a la izquierda.', 'Une con ||.'], 'bash-robustez'),
      ],
    }),
    tareaV2({
      id: 'bp-parsing', titulo: '4. Parsing de texto con propósito', subtitulo: 'Filtrar, extraer, ordenar y resumir',
      teoria: [
        { t: 'Define primero la forma de entrada', p: 'Antes de encadenar herramientas identifica delimitador, campos, líneas inválidas y salida deseada. Sin contrato, un pipe correcto puede responder la pregunta equivocada.' },
        { t: 'Una herramienta por transformación', p: 'grep selecciona líneas, cut extrae columnas, sort ordena y uniq resume repeticiones adyacentes. Pipes pequeñas son más fáciles de comprobar.' },
        { t: 'Evita parsear presentación humana', p: 'Si una herramienta ofrece JSON, formato nulo o columnas explícitas, prefiere esa interfaz frente a espacios variables pensados para una pantalla.' },
        { n: 'Conserva una muestra', p: 'Prueba el pipeline sobre pocos datos conocidos y compara el resultado esperado antes de automatizarlo.' },
      ],
      practica: [
        q('bp-parse-q1', '¿Qué comando extrae campos separados por un delimitador?', ['cut', 'chmod', 'ping', 'mount'], 0, 'cut selecciona campos.', 'bash-parsing', 'cut'),
        q('bp-parse-q2', '¿Por qué suele usarse sort antes de uniq?', ['uniq agrupa repeticiones adyacentes', 'sort cifra los datos', 'uniq solo lee binario', 'No es necesario nunca'], 0, 'Ordenar reúne valores iguales.', 'bash-parsing', 'sort', 'uniq'),
        c('bp-parse-c1', 'Completa la extracción de usuarios de passwd.', 'cut -d: -f___ /etc/passwd', ['1'], 'El nombre de usuario es el primer campo.', 'bash-parsing', 'cut'),
        o('bp-parse-o1', 'Ordena un pipeline de conteo.', ['cat datos.txt', '|', 'sort', '|', 'uniq -c'], 'cat datos.txt | sort | uniq -c', 'Primero se leen y ordenan los valores; después se cuentan.', 'bash-parsing', 'pipes'),
        t('bp-parse-t1', 'Extrae solo los nombres de usuario de /etc/passwd.', BASH, 'cut -d: -f1 /etc/passwd', (ctx) => k.salidaTiene(ctx, 'root', 'user') && k.ultimoUsó(ctx, /^cut /), ['El delimitador es :.', 'Pide el campo 1.'], 'bash-parsing', 'cut'),
        t('bp-parse-t2', 'Ordena colores.txt y cuenta cuántas veces aparece cada valor.', BASH, "printf 'azul\\nrojo\\nazul\\n' > colores.txt\nsort colores.txt | uniq -c", (ctx) => k.salidaTiene(ctx, '2 azul', '1 rojo'), ['Crea la muestra indicada.', 'Usa sort antes de uniq -c.'], 'bash-parsing', 'sort', 'uniq', 'pipes'),
      ],
    }),
    tareaV2({
      id: 'bp-automatizacion', titulo: '5. Automatización robusta', subtitulo: 'Un script es una interfaz que debe poder auditarse',
      teoria: [
        { t: 'Contrato de entrada', p: 'Un script profesional documenta argumentos, valida rutas y devuelve mensajes accionables. Fallar temprano es más seguro que continuar con datos ambiguos.' },
        { t: 'Modo estricto y limpieza', p: 'set -euo pipefail detecta fallos, variables ausentes y errores en pipes. trap permite limpiar temporales al salir.' },
        { t: 'Idempotencia', p: 'Ejecutar dos veces debería producir el mismo estado correcto o detectar que el trabajo ya estaba hecho, no duplicar líneas sin control.' },
        { n: 'Verifica después de cambiar', p: 'Automatizar no elimina la comprobación: compara estado previo, cambio aplicado, código de salida y estado final.' },
      ],
      practica: [
        q('bp-auto-q1', '¿Qué propiedad permite repetir un script sin acumular efectos incorrectos?', ['Idempotencia', 'Latencia', 'Compresión', 'Recursión'], 0, 'Una operación idempotente converge al mismo estado.', 'bash-automatizacion'),
        q('bp-auto-q2', '¿Qué opción falla ante una variable no definida?', ['set -u', 'set -x', 'set +e', 'chmod +x'], 0, '-u detecta variables ausentes.', 'bash-robustez'),
        c('bp-auto-c1', 'Completa la línea de modo estricto.', 'set ________ pipefail', ['-euo'], 'Combina -e, -u y -o pipefail.', 'bash-robustez'),
        o('bp-auto-o1', 'Ordena un cambio automatizado responsable.', ['validar entrada', '→', 'registrar estado inicial', '→', 'aplicar cambio', '→', 'verificar'], 'validar entrada → registrar estado inicial → aplicar cambio → verificar', 'La evidencia rodea al cambio.', 'bash-automatizacion'),
        t('bp-auto-t1', 'Crea auditor.sh con shebang y set -euo pipefail, y dale permiso de ejecución.', BASH, "printf '#!/bin/bash\\nset -euo pipefail\\necho AUDITORIA\\n' > auditor.sh\nchmod +x auditor.sh", (ctx) => {
          const contenido = k.contenido(ctx, 'auditor.sh') || '';
          return contenido.startsWith('#!/bin/bash\nset -euo pipefail') && k.tieneBits(ctx, 'auditor.sh', k.bits.dueñoEjecuta);
        }, ['Escribe las tres líneas con printf.', 'Después usa chmod +x.'], 'bash-automatizacion', 'bash', 'chmod'),
        t('bp-auto-t2', 'Genera inventario.txt con la lista de archivos .txt del directorio actual y muestra cuántos hay.', 'busqueda', 'find . -type f -name "*.txt" | sort | tee inventario.txt | wc -l', (ctx) => k.existe(ctx, 'inventario.txt') && /^\d+$/.test(k.ultimaSalida(ctx).trim()), ['Busca por nombre y ordena.', 'tee conserva la lista antes de wc -l.'], 'bash-automatizacion', 'find', 'sort', 'pipes'),
      ],
    }),
  ],
};

export const SALA_PYTHON_FUNDAMENTOS = {
  id: 'python-fundamentos', n: 48, nombre: 'Python desde cero',
  resumen: 'Valores, colecciones, control de flujo, funciones y módulos sin saltarse programación',
  dificultad: 'Inicial', minutos: 60,
  comandos: ['python3'], origen: 'v2-fase4',
  tareas: [
    tareaV2({
      id: 'py-ejecucion', titulo: '1. Ejecutar y observar', subtitulo: 'Intérprete, archivo y salida',
      teoria: [
        { t: 'Código con estructura explícita', p: 'Python usa nombres, expresiones y sangría para expresar un programa. El intérprete ejecuta instrucciones y detiene el programa cuando encuentra un error no controlado.' },
        { t: 'Dos formas de practicar', p: 'python3 -c ejecuta una instrucción breve. python3 programa.py ejecuta un archivo reproducible y permite recibir argumentos.' },
        { t: 'Los errores son evidencia', p: 'El tipo y el mensaje del error señalan qué contrato se rompió: nombre ausente, tipo incompatible, archivo inexistente o sintaxis inválida.' },
        { n: 'Runtime de Mentor', p: 'Es un subconjunto seguro de Python 3.11. Archivos, requests y sockets están conectados solo al laboratorio virtual.' },
      ],
      practica: [
        q('py-run-q1', '¿Qué comando ejecuta un archivo Python?', ['python3 programa.py', 'bash programa.py', 'chmod programa.py', 'cat programa.py'], 0, 'python3 invoca el intérprete.', 'python'),
        q('py-run-q2', '¿Qué hace la opción -c de python3?', ['Ejecuta código dado como argumento', 'Compila el kernel', 'Cambia de usuario', 'Cierra la red'], 0, '-c sirve para fragmentos breves.', 'python'),
        c('py-run-c1', 'Completa la llamada al intérprete.', '______ -c "print(2 + 3)"', ['python3', 'python'], 'El comando ejecuta la expresión sin crear archivo.', 'python3'),
        o('py-run-o1', 'Ordena el ciclo de un programa pequeño.', ['escribir', '→', 'ejecutar', '→', 'leer salida o error', '→', 'corregir'], 'escribir → ejecutar → leer salida o error → corregir', 'Programar es un ciclo de hipótesis y evidencia.', 'python'),
        t('py-run-t1', 'Consulta la versión del runtime Python del laboratorio.', PY, 'python3 --version', (ctx) => k.salidaTiene(ctx, 'Python 3.11.8', 'offline'), ['Usa python3 con --version.'], 'python3'),
        t('py-run-t2', 'Calcula 7 por 6 con Python e imprime el resultado.', PY, "python3 -c 'print(7 * 6)'", (ctx) => k.ultimaSalida(ctx).trim() === '42', ['Usa print dentro de python3 -c.'], 'python3', 'python'),
      ],
    }),
    tareaV2({
      id: 'py-valores', titulo: '2. Variables y tipos', subtitulo: 'Nombrar datos y entender operaciones',
      teoria: [
        { t: 'El valor determina el tipo', p: 'int y float representan números, str representa texto, bool representa decisiones y None expresa ausencia. Una variable enlaza un nombre con un valor.' },
        { t: 'Los operadores dependen del tipo', p: '3 + 4 suma; "3" + "4" concatena. Convertir con int, float o str debe ser una decisión explícita.' },
        { t: 'Nombres que explican', p: 'intentos = 3 comunica más que x = 3. Los buenos nombres reducen comentarios y errores al revisar automatizaciones.' },
        { n: 'Entrada no es confianza', p: 'Datos de argumentos, archivos o red llegan como entrada y deben validarse antes de convertirse o usarse.' },
      ],
      practica: [
        q('py-val-q1', '¿Qué tipo representa texto en Python?', ['str', 'int', 'bool', 'list'], 0, 'str significa string.', 'python-tipos'),
        q('py-val-q2', '¿Cuál es el resultado de "3" + "4"?', ['34', '7', 'Error siempre', '12'], 0, 'Dos cadenas se concatenan.', 'python-tipos'),
        c('py-val-c1', 'Completa la conversión a entero.', 'puerto = ________("443")', ['int'], 'int convierte una representación decimal válida.', 'python-tipos'),
        o('py-val-o1', 'Construye una asignación y su uso.', ['intentos', '=', '3', ';', 'print', '(', 'intentos', ')'], 'intentos = 3 ; print ( intentos )', 'Primero se enlaza el nombre y después se lee.', 'python-tipos'),
        t('py-val-t1', 'Crea variables servicio="ssh" y puerto=22, e imprime ambos valores.', PY, "python3 -c 'servicio=\"ssh\"; puerto=22; print(servicio, puerto)'", (ctx) => k.salidaTiene(ctx, 'ssh 22'), ['Separa instrucciones con punto y coma.', 'print acepta varios argumentos.'], 'python-tipos', 'python3'),
        r('py-val-r1', '¿Qué valor representa ausencia explícita en Python?', ['none', 'None'], 'None no es una cadena vacía ni cero.', 'python-tipos'),
      ],
    }),
    tareaV2({
      id: 'py-colecciones', titulo: '3. Cadenas, listas y diccionarios', subtitulo: 'Modelar una cosa, una secuencia o un registro',
      teoria: [
        { t: 'Una lista conserva orden', p: 'Una lista agrupa valores y se indexa desde cero. append añade un elemento; len mide su longitud.' },
        { t: 'Un diccionario relaciona claves y valores', p: 'Un servicio puede modelarse con nombre y puerto. La clave describe el significado del valor.' },
        { t: 'Las cadenas también ofrecen operaciones', p: 'strip limpia extremos, split separa campos y lower normaliza mayúsculas. Transformar no equivale a validar.' },
        { n: 'Escoge por contrato', p: 'Usa lista para una secuencia y diccionario para atributos nombrados. Evita posiciones mágicas cuando una clave explica mejor el dato.' },
      ],
      practica: [
        q('py-col-q1', '¿Qué colección relaciona claves con valores?', ['dict', 'list', 'str', 'bool'], 0, 'dict modela registros por nombre.', 'python-tipos'),
        q('py-col-q2', '¿Qué índice recupera el primer elemento de una lista?', ['0', '1', '-0.5', 'first'], 0, 'Los índices empiezan en cero.', 'python-tipos'),
        c('py-col-c1', 'Completa el método que añade un elemento.', 'puertos.______(443)', ['append'], 'append modifica la lista.', 'python-tipos'),
        o('py-col-o1', 'Construye el acceso a una clave.', ['servicio', '[', '"puerto"', ']'], 'servicio [ "puerto" ]', 'Los corchetes consultan la clave.', 'python-tipos'),
        t('py-col-t1', 'Crea la lista [22, 80], añade 443 e imprime su longitud.', PY, "python3 -c 'puertos=[22,80]; puertos.append(443); print(len(puertos))'", (ctx) => k.ultimaSalida(ctx).trim() === '3', ['Usa append.', 'Después len dentro de print.'], 'python-tipos', 'python3'),
        t('py-col-t2', 'Crea un diccionario de servicio con nombre ssh y puerto 22, e imprime el nombre.', PY, "python3 -c 'servicio={\"nombre\":\"ssh\",\"puerto\":22}; print(servicio[\"nombre\"])'", (ctx) => k.ultimaSalida(ctx).trim() === 'ssh', ['Las claves son cadenas.', 'Consulta ["nombre"].'], 'python-tipos', 'python3'),
      ],
    }),
    tareaV2({
      id: 'py-condiciones', titulo: '4. Condicionales', subtitulo: 'Tomar una ruta por evidencia',
      teoria: [
        { t: 'Una condición produce verdad o falsedad', p: 'Comparaciones como codigo >= 400 producen bool. if ejecuta un bloque; elif prueba otra hipótesis y else cubre lo restante.' },
        { t: 'La sangría es sintaxis', p: 'Los espacios marcan qué instrucciones pertenecen al bloque. Mezclar niveles sin intención cambia el programa o produce IndentationError.' },
        { t: 'Combinar sin ocultar', p: 'and exige ambas condiciones; or acepta cualquiera; not invierte. Una condición larga suele ser más clara si primero nombras sus partes.' },
        { n: 'Cubre los bordes', p: 'Prueba valores justo antes, en y después del límite: 399, 400 y 401 revelan errores de comparación.' },
      ],
      practica: [
        q('py-if-q1', '¿Qué palabra cubre el caso restante de un if?', ['else', 'then', 'fi', 'case'], 0, 'else es la rama alternativa.', 'python-control'),
        q('py-if-q2', '¿Qué significa and?', ['Ambas condiciones deben ser verdaderas', 'Solo una', 'Invierte el resultado', 'Termina el programa'], 0, 'and es conjunción lógica.', 'python-control'),
        c('py-if-c1', 'Completa el operador para detectar error HTTP.', 'if codigo ____ 400:', ['>='], 'Los errores comienzan en 400.', 'python-control'),
        o('py-if-o1', 'Ordena las ramas.', ['if', '→', 'elif', '→', 'else'], 'if → elif → else', 'Se evalúan de arriba hacia abajo.', 'python-control'),
        t('py-if-t1', 'Escribe clasifica.py para imprimir error cuando codigo=404 sea al menos 400, y ejecútalo.', PY, "printf 'codigo = 404\\nif codigo >= 400:\\n    print(\"error\")\\nelse:\\n    print(\"ok\")\\n' > clasifica.py\npython3 clasifica.py", (ctx) => k.ultimaSalida(ctx).trim() === 'error' && k.existe(ctx, 'clasifica.py'), ['Crea el archivo con printf y sangría.', 'Después ejecútalo con python3.'], 'python-control', 'python3'),
        r('py-if-r1', '¿Cómo se llama el error típico de un bloque mal sangrado?', ['indentationerror', 'IndentationError'], 'La sangría forma parte de la gramática.', 'python-control'),
      ],
    }),
    tareaV2({
      id: 'py-bucles', titulo: '5. Bucles', subtitulo: 'Procesar una colección de forma controlada',
      teoria: [
        { t: 'for recorre un iterable', p: 'for puerto in puertos asigna cada elemento y ejecuta el bloque. enumerate añade un índice cuando ese dato sí aporta significado.' },
        { t: 'while depende de estado', p: 'while repite mientras una condición sea verdadera. Debe existir una actualización que acerque el estado a la salida.' },
        { t: 'break y continue', p: 'break termina el bucle; continue salta a la siguiente vuelta. Úsalos cuando hagan explícita una decisión, no para esconder una condición confusa.' },
        { n: 'Límite del laboratorio', p: 'Mentor corta bucles excesivos para proteger la interfaz. Un programa real también debe limitar reintentos y tiempos de espera.' },
      ],
      practica: [
        q('py-loop-q1', '¿Qué bucle es natural para recorrer una lista?', ['for', 'if', 'def', 'try'], 0, 'for consume un iterable.', 'python-control'),
        q('py-loop-q2', '¿Qué debe cambiar dentro de un while?', ['El estado de su condición', 'El nombre del archivo siempre', 'El intérprete', 'Nada'], 0, 'Sin progreso puede ser infinito.', 'python-control'),
        c('py-loop-c1', 'Completa el iterable numérico.', 'for n in ________(3):', ['range'], 'range(3) produce 0, 1 y 2.', 'python-control'),
        o('py-loop-o1', 'Construye el encabezado.', ['for', 'puerto', 'in', 'puertos', ':'], 'for puerto in puertos :', 'El bloque siguiente debe ir sangrado.', 'python-control'),
        t('py-loop-t1', 'Escribe puertos.py para recorrer [22, 80, 443] e imprimir cada puerto.', PY, "printf 'puertos = [22, 80, 443]\\nfor puerto in puertos:\\n    print(puerto)\\n' > puertos.py\npython3 puertos.py", (ctx) => k.salidaTiene(ctx, '22', '80', '443') && k.existe(ctx, 'puertos.py'), ['Crea una lista.', 'El print lleva cuatro espacios.'], 'python-control', 'python3'),
        t('py-loop-t2', 'Usa range para imprimir 0, 1 y 2 desde un archivo vueltas.py.', PY, "printf 'for numero in range(3):\\n    print(numero)\\n' > vueltas.py\npython3 vueltas.py", (ctx) => k.ultimaSalida(ctx).trim() === '0\n1\n2', ['range(3) excluye el 3.', 'Respeta la sangría.'], 'python-control', 'python3'),
      ],
    }),
    tareaV2({
      id: 'py-funciones', titulo: '6. Funciones, módulos y argumentos', subtitulo: 'Separar decisiones y recibir contexto',
      teoria: [
        { t: 'Una función define un contrato', p: 'Parámetros son entradas, return produce un resultado y el nombre expresa intención. Una función pequeña es más fácil de probar.' },
        { t: 'Ámbito local', p: 'Los nombres asignados dentro de una función pertenecen a esa llamada. Pasar datos explícitamente reduce dependencias invisibles.' },
        { t: 'Los módulos agrupan herramientas', p: 'import json carga un módulo; from pathlib import Path trae un nombre concreto. Importar no sustituye entender el dato que entra y sale.' },
        { t: 'Argumentos de línea de comandos', p: 'sys.argv contiene el nombre del script y los argumentos. Validar cantidad y formato debe ocurrir antes de operar.' },
      ],
      practica: [
        q('py-fn-q1', '¿Qué palabra devuelve un resultado desde una función?', ['return', 'print', 'yield siempre', 'exit'], 0, 'return entrega el valor al llamador.', 'python-funciones'),
        q('py-fn-q2', '¿Dónde aparecen los argumentos del programa?', ['sys.argv', 'json.argv', 'os.stdout', 're.args'], 0, 'sys expone el contexto del intérprete.', 'python-modulos'),
        c('py-fn-c1', 'Completa la definición.', '______ duplicar(valor):', ['def'], 'def inicia una función.', 'python-funciones'),
        o('py-fn-o1', 'Ordena el ciclo de una función.', ['definir', '→', 'llamar', '→', 'recibir parámetros', '→', 'retornar'], 'definir → llamar → recibir parámetros → retornar', 'La llamada activa el bloque.', 'python-funciones'),
        t('py-fn-t1', 'Escribe doble.py con una función doble que retorne valor*2 e imprime doble(21).', PY, "printf 'def doble(valor):\\n    return valor * 2\\n\\nprint(doble(21))\\n' > doble.py\npython3 doble.py", (ctx) => k.ultimaSalida(ctx).trim() === '42' && k.existe(ctx, 'doble.py'), ['Define con def.', 'Usa return dentro del bloque.'], 'python-funciones', 'python3'),
        t('py-fn-t2', 'Crea argumento.py para imprimir sys.argv[1] y ejecútalo con inventario.', PY, "printf 'import sys\\nprint(sys.argv[1])\\n' > argumento.py\npython3 argumento.py inventario", (ctx) => k.ultimaSalida(ctx).trim() === 'inventario', ['Importa sys.', 'El primer argumento está en el índice 1.'], 'python-modulos', 'python3'),
      ],
    }),
  ],
};

export const SALA_PYTHON_DATOS = {
  id: 'python-datos', n: 49, nombre: 'Python para datos',
  resumen: 'Archivos, excepciones, JSON, regex y parsing reproducible',
  dificultad: 'Intermedia', minutos: 55,
  comandos: ['python3'], origen: 'v2-fase4',
  tareas: [
    tareaV2({
      id: 'pyd-archivos', titulo: '1. Archivos con contexto', subtitulo: 'Leer, transformar y escribir de forma explícita',
      teoria: [
        { t: 'Abrir implica modo y ciclo de vida', p: 'open(ruta, "r") lee; "w" reemplaza y "a" añade. with cierra el recurso al terminar el bloque incluso si ocurre un error.' },
        { t: 'Path hace visible la intención', p: 'pathlib.Path ofrece exists, read_text y write_text para operaciones de texto sencillas sin mezclar detalles de bajo nivel.' },
        { t: 'Codificación y tamaño importan', p: 'Un archivo no es siempre texto pequeño. En automatizaciones reales debes decidir codificación, límites y estrategia de lectura.' },
        { n: 'Filesystem aislado', p: 'El runtime solo ve el snapshot virtual de la sala; no puede leer archivos del dispositivo.' },
      ],
      practica: [
        q('pyd-file-q1', '¿Qué modo reemplaza el contenido de un archivo?', ['w', 'r', 'a', 'x siempre'], 0, 'w abre para escritura y trunca.', 'python-archivos'),
        q('pyd-file-q2', '¿Qué ventaja aporta with al abrir?', ['Gestiona el cierre al salir del bloque', 'Cifra el archivo', 'Lo convierte en JSON', 'Da permisos root'], 0, 'El contexto libera el recurso.', 'python-archivos'),
        c('pyd-file-c1', 'Completa la lectura con pathlib.', 'Path("reporte.txt").__________()', ['read_text'], 'read_text devuelve el contenido.', 'python-archivos'),
        o('pyd-file-o1', 'Ordena el flujo de archivo.', ['abrir', '→', 'leer', '→', 'transformar', '→', 'escribir resultado'], 'abrir → leer → transformar → escribir resultado', 'Cada etapa tiene una responsabilidad.', 'python-archivos'),
        t('pyd-file-t1', 'Usa Path para escribir hola en saludo.txt y después leerlo e imprimirlo.', PY, "python3 -c 'from pathlib import Path; Path(\"saludo.txt\").write_text(\"hola\"); print(Path(\"saludo.txt\").read_text())'", (ctx) => k.ultimaSalida(ctx).trim() === 'hola' && k.contenido(ctx, 'saludo.txt') === 'hola', ['Importa Path.', 'Usa write_text y read_text.'], 'python-archivos', 'python3'),
        t('pyd-file-t2', 'Escribe lector.py con with open para leer notas.txt e imprimir su contenido.', PY, "printf 'with open(\"notas.txt\", \"r\") as archivo:\\n    print(archivo.read())\\n' > lector.py\npython3 lector.py", (ctx) => k.salidaTiene(ctx, 'pan', 'leche') && k.existe(ctx, 'lector.py'), ['Abre notas.txt en modo r.', 'Imprime archivo.read() dentro del bloque.'], 'python-archivos', 'python3'),
      ],
    }),
    tareaV2({
      id: 'pyd-excepciones', titulo: '2. Excepciones controladas', subtitulo: 'Distinguir un fallo esperado de un programa roto',
      teoria: [
        { t: 'Una excepción interrumpe el flujo normal', p: 'El tipo expresa la causa: ValueError, TypeError o FileNotFoundError. El traceback muestra dónde emergió.' },
        { t: 'Captura lo que puedes resolver', p: 'except FileNotFoundError puede ofrecer una ruta alternativa. except Exception indiscriminado suele ocultar errores de programación.' },
        { t: 'Validar antes y controlar después', p: 'Comprobar una condición mejora el mensaje, pero una operación todavía puede fallar. Ambas capas se complementan.' },
        { n: 'No conviertas fallo en éxito falso', p: 'Si el objetivo no se cumplió, informa con claridad y devuelve un estado coherente al llamador.' },
      ],
      practica: [
        q('pyd-exc-q1', '¿Qué excepción describe un archivo ausente?', ['FileNotFoundError', 'IndexError', 'SyntaxWarning', 'HTTPError'], 0, 'El nombre describe el recurso faltante.', 'python-excepciones'),
        q('pyd-exc-q2', '¿Por qué evitar except Exception sin criterio?', ['Puede ocultar defectos no previstos', 'Hace el código más rápido', 'Impide usar archivos', 'Desactiva Python'], 0, 'Capturar todo sin actuar borra evidencia.', 'python-excepciones'),
        c('pyd-exc-c1', 'Completa la captura específica.', 'except ____________________:', ['FileNotFoundError'], 'Se maneja solo el caso esperado.', 'python-excepciones'),
        o('pyd-exc-o1', 'Ordena la respuesta a un fallo.', ['operar', '→', 'capturar excepción conocida', '→', 'informar', '→', 'decidir salida'], 'operar → capturar excepción conocida → informar → decidir salida', 'El manejo debe mantener el contrato.', 'python-excepciones'),
        t('pyd-exc-t1', 'Escribe seguro.py para intentar leer ausente.txt y mostrar controlado si no existe.', PY, "printf 'from pathlib import Path\\ntry:\\n    Path(\"ausente.txt\").read_text()\\nexcept FileNotFoundError:\\n    print(\"controlado\")\\n' > seguro.py\npython3 seguro.py", (ctx) => k.ultimaSalida(ctx).trim() === 'controlado', ['Usa try.', 'Captura FileNotFoundError con la misma sangría que try.'], 'python-excepciones', 'python3'),
        t('pyd-exc-t2', 'Provoca una conversión inválida con int("puerto") y comprueba que Python devuelve error.', PY, "python3 -c 'print(int(\"puerto\"))'", (ctx) => ctx.ultimo.code === 1 && k.salidaTiene(ctx, 'ValueError', 'Traceback'), ['int solo acepta una representación numérica.', 'El objetivo es observar el tipo de error.'], 'python-excepciones', 'python3'),
      ],
    }),
    tareaV2({
      id: 'pyd-json', titulo: '3. JSON', subtitulo: 'Cruzar fronteras con una estructura definida',
      teoria: [
        { t: 'JSON representa datos, no código', p: 'Objetos, arrays, cadenas, números, booleanos y null forman el formato. Una cadena JSON debe parsearse antes de tratarla como diccionario.' },
        { t: 'loads y dumps', p: 'json.loads convierte texto en valores Python; json.dumps serializa valores a texto interoperable.' },
        { t: 'La forma puede ser válida y el dato incorrecto', p: 'Después de parsear valida claves, tipos y rangos. JSON correcto no garantiza un puerto válido ni una autorización.' },
        { n: 'No construyas JSON concatenando', p: 'Usa el serializador para escapar correctamente cadenas y conservar tipos.' },
      ],
      practica: [
        q('pyd-json-q1', '¿Qué función convierte texto JSON en valores Python?', ['json.loads', 'json.dumps', 'json.open', 're.findall'], 0, 'loads carga desde una cadena.', 'python-json'),
        q('pyd-json-q2', '¿Qué valor JSON equivale aproximadamente a None?', ['null', 'false', '0', '""'], 0, 'null expresa ausencia.', 'python-json'),
        c('pyd-json-c1', 'Completa la serialización.', 'texto = json.______(datos)', ['dumps'], 'dumps produce una cadena JSON.', 'python-json'),
        o('pyd-json-o1', 'Ordena el consumo de JSON.', ['recibir texto', '→', 'parsear', '→', 'validar estructura', '→', 'usar valores'], 'recibir texto → parsear → validar estructura → usar valores', 'El parseo no reemplaza validación semántica.', 'python-json'),
        t('pyd-json-t1', 'Parsea {"puerto": 443} e imprime el puerto.', PY, "python3 -c 'import json; datos=json.loads(\"{\\\"puerto\\\":443}\"); print(datos[\"puerto\"])'", (ctx) => k.ultimaSalida(ctx).trim() === '443', ['Importa json.', 'Usa loads y consulta la clave puerto.'], 'python-json', 'python3'),
        t('pyd-json-t2', 'Serializa un diccionario con servicio ssh y muestra el JSON.', PY, "python3 -c 'import json; print(json.dumps({\"servicio\":\"ssh\"}))'", (ctx) => k.salidaTiene(ctx, '"servicio":"ssh"'), ['Usa json.dumps.', 'El argumento es un diccionario.'], 'python-json', 'python3'),
      ],
    }),
    tareaV2({
      id: 'pyd-regex', titulo: '4. Expresiones regulares', subtitulo: 'Reconocer formas, no demostrar validez',
      teoria: [
        { t: 'Un patrón describe una forma', p: 'Una regex puede localizar direcciones o códigos dentro de texto. Coincidir con la forma no demuestra que el valor exista o sea confiable.' },
        { t: 'Cadenas raw', p: 'El prefijo r evita que Python consuma barras antes de que lleguen al motor regex. Mejora legibilidad en patrones con \\d o \\s.' },
        { t: 'findall y search', p: 'findall devuelve todas las coincidencias; search devuelve la primera o None. Elige según la pregunta.' },
        { n: 'Patrones acotados', p: 'Evita regex innecesariamente ambiguas sobre entradas enormes. Divide el parsing y limita los datos.' },
      ],
      practica: [
        q('pyd-re-q1', '¿Qué devuelve re.findall?', ['Todas las coincidencias', 'Solo un booleano', 'Un archivo', 'Siempre None'], 0, 'findall crea una lista.', 'python-regex'),
        q('pyd-re-q2', '¿Qué aporta el prefijo r a una cadena de patrón?', ['Conserva las barras para la regex', 'Ejecuta como root', 'Invierte la cadena', 'La convierte en JSON'], 0, 'Es una raw string.', 'python-regex'),
        c('pyd-re-c1', 'Completa el patrón de uno o más dígitos.', 'patron = r"______"', ['\\d+'], '\\d representa un dígito y + repite.', 'python-regex'),
        o('pyd-re-o1', 'Ordena la extracción.', ['definir patrón', '→', 'buscar', '→', 'revisar coincidencias', '→', 'validar valores'], 'definir patrón → buscar → revisar coincidencias → validar valores', 'Una coincidencia aún necesita contexto.', 'python-regex'),
        t('pyd-re-t1', 'Extrae todos los números de "ssh 22, https 443".', PY, "python3 -c 'import re; print(re.findall(r\"\\d+\", \"ssh 22, https 443\"))'", (ctx) => k.salidaTiene(ctx, "'22'", "'443'"), ['Importa re.', 'Usa findall con \\d+.'], 'python-regex', 'python3'),
        t('pyd-re-t2', 'Busca la primera IP en "origen=10.0.0.8 estado=fallo" e imprime el grupo completo.', PY, "python3 -c 'import re; m=re.search(r\"\\d+\\.\\d+\\.\\d+\\.\\d+\", \"origen=10.0.0.8 estado=fallo\"); print(m.group())'", (ctx) => k.ultimaSalida(ctx).trim() === '10.0.0.8', ['Usa re.search.', 'El resultado ofrece group().'], 'python-regex', 'python3'),
      ],
    }),
    tareaV2({
      id: 'pyd-parsing', titulo: '5. Parsing reproducible', subtitulo: 'Convertir texto en hechos verificables',
      teoria: [
        { t: 'Separar adquisición y análisis', p: 'Primero obtén los datos, luego parsea y finalmente presenta resultados. Así puedes probar el análisis sobre una muestra fija.' },
        { t: 'Normalizar con cuidado', p: 'strip y lower ayudan a comparar, pero no deben destruir diferencias significativas. Conserva el original cuando la evidencia importa.' },
        { t: 'Contar requiere una clave', p: 'Un diccionario permite acumular ocurrencias por IP, usuario o código. Define qué unidad representa cada conteo.' },
        { n: 'Salida útil para humanos y máquinas', p: 'Un resumen legible ayuda a operar; JSON permite encadenar otra herramienta. Puedes ofrecer ambos sin mezclar sus canales.' },
      ],
      practica: [
        q('pyd-parse-q1', '¿Por qué separar adquisición y análisis?', ['Permite probar con muestras fijas', 'Obliga a usar red real', 'Elimina tipos', 'Evita funciones'], 0, 'La separación hace reproducible el parser.', 'python-parsing'),
        q('pyd-parse-q2', '¿Qué estructura acumula conteos por clave?', ['dict', 'str', 'bool', 'None'], 0, 'Cada clave puede guardar su contador.', 'python-parsing'),
        c('pyd-parse-c1', 'Completa el valor por defecto del contador.', 'conteos[ip] = conteos.get(ip, ___) + 1', ['0'], 'Una clave nueva comienza en cero.', 'python-parsing'),
        o('pyd-parse-o1', 'Ordena el pipeline de análisis.', ['adquirir', '→', 'parsear', '→', 'validar', '→', 'resumir'], 'adquirir → parsear → validar → resumir', 'Cada fase reduce ambigüedad.', 'python-parsing'),
        t('pyd-parse-t1', 'Escribe cuenta.py para contar tres códigos [401,401,200] con un diccionario e imprimir el conteo de 401.', PY, "printf 'conteos = {}\\nfor codigo in [401, 401, 200]:\\n    conteos[codigo] = conteos.get(codigo, 0) + 1\\nprint(conteos[401])\\n' > cuenta.py\npython3 cuenta.py", (ctx) => k.ultimaSalida(ctx).trim() === '2', ['Empieza con un diccionario vacío.', 'Acumula con get(codigo, 0).'], 'python-parsing', 'python3'),
        t('pyd-parse-t2', 'Normaliza "  ERROR SSH  " con strip y lower e imprime el resultado.', PY, "python3 -c 'texto=\"  ERROR SSH  \"; print(texto.strip().lower())'", (ctx) => k.ultimaSalida(ctx).trim() === 'error ssh', ['Encadena strip().lower().'], 'python-parsing', 'python3'),
      ],
    }),
  ],
};

export const SALA_PYTHON_LABORATORIOS = {
  id: 'python-laboratorios', n: 50, nombre: 'Python para laboratorios',
  resumen: 'HTTP, APIs, sockets y automatizaciones pequeñas sobre objetivos locales simulados',
  dificultad: 'Intermedia', minutos: 60,
  comandos: ['python3'], origen: 'v2-fase4',
  tareas: [
    tareaV2({
      id: 'pyl-requests', titulo: '1. Requests y respuestas HTTP', subtitulo: 'Pedir, comprobar y limitar',
      teoria: [
        { t: 'Una petición puede fallar de varias formas', p: 'DNS, conexión, timeout y estado HTTP son capas distintas. requests.get devuelve una respuesta solo cuando pudo conversar con el servicio.' },
        { t: 'Comprueba el estado', p: 'status_code expone el código; ok resume 2xx/3xx y raise_for_status convierte 4xx/5xx en excepción.' },
        { t: 'Timeout siempre', p: 'Una automatización real debe limitar cuánto espera. El runtime acepta el argumento por compatibilidad, aunque sus endpoints locales son deterministas.' },
        { n: 'Sin red externa', p: 'Solo api.local y lab.local existen para Python. Cualquier otro destino falla de forma intencional y verificable.' },
      ],
      practica: [
        q('pyl-req-q1', '¿Qué propiedad contiene el estado HTTP?', ['status_code', 'json_code', 'socket', 'argv'], 0, 'status_code guarda 200, 404 y similares.', 'python-http'),
        q('pyl-req-q2', '¿Por qué especificar timeout?', ['Para limitar la espera', 'Para cifrar JSON', 'Para cambiar la IP', 'Para importar módulos'], 0, 'Evita bloqueos indefinidos.', 'python-http'),
        c('pyl-req-c1', 'Completa la petición limitada.', 'requests.get(url, ________=3)', ['timeout'], 'El timeout expresa un límite temporal.', 'python-http'),
        o('pyl-req-o1', 'Ordena el consumo HTTP.', ['pedir con timeout', '→', 'comprobar estado', '→', 'parsear cuerpo', '→', 'validar datos'], 'pedir con timeout → comprobar estado → parsear cuerpo → validar datos', 'Cada capa puede fallar.', 'python-http'),
        t('pyl-req-t1', 'Consulta http://api.local/status e imprime su código HTTP.', PY, "python3 -c 'import requests; r=requests.get(\"http://api.local/status\", timeout=3); print(r.status_code)'", (ctx) => k.ultimaSalida(ctx).trim() === '200', ['Importa requests.', 'Lee status_code.'], 'python-http', 'python3'),
        t('pyl-req-t2', 'Intenta consultar example.com y observa que el laboratorio bloquea red externa.', PY, "python3 -c 'import requests; requests.get(\"https://example.com\")'", (ctx) => ctx.ultimo.code === 1 && k.salidaTiene(ctx, 'ConnectionError', 'red externa desactivada'), ['El fallo es esperado.', 'Mentor solo acepta dominios .local definidos.'], 'python-http', 'python3'),
      ],
    }),
    tareaV2({
      id: 'pyl-api-json', titulo: '2. APIs y JSON', subtitulo: 'Del estado HTTP al dato útil',
      teoria: [
        { t: 'Una API define un contrato', p: 'Ruta, método, estado y esquema del cuerpo forman la interfaz. Automatizar contra una API implica respetar ese contrato y sus versiones.' },
        { t: 'response.json', p: 'json() parsea el cuerpo como JSON. Puede fallar si el servidor devuelve HTML o texto, incluso con estado 200.' },
        { t: 'Valida claves y tipos', p: 'Comprobar que version existe y es una cadena evita que un cambio de esquema se convierta en una decisión equivocada.' },
        { n: 'Conserva contexto mínimo', p: 'Al registrar un fallo incluye endpoint, estado y operación, pero no vuelques tokens ni secretos.' },
      ],
      practica: [
        q('pyl-api-q1', '¿Qué elementos forman el contrato básico de una API?', ['Ruta, método, estado y esquema', 'Solo la IP', 'Solo JSON', 'El color del navegador'], 0, 'El consumidor depende de todos ellos.', 'python-http', 'python-json'),
        q('pyl-api-q2', '¿Puede json() fallar con estado 200?', ['Sí, si el cuerpo no es JSON válido', 'No nunca', 'Solo con sockets', 'Solo como root'], 0, 'El estado y el formato son contratos distintos.', 'python-json'),
        c('pyl-api-c1', 'Completa el acceso al cuerpo estructurado.', 'datos = respuesta.______()', ['json'], 'json() parsea el cuerpo.', 'python-http', 'python-json'),
        o('pyl-api-o1', 'Ordena las validaciones.', ['estado', '→', 'formato JSON', '→', 'claves', '→', 'tipos y rangos'], 'estado → formato JSON → claves → tipos y rangos', 'Cada etapa asume la anterior.', 'python-json'),
        t('pyl-api-t1', 'Consulta /version, convierte la respuesta a JSON e imprime version.', PY, "python3 -c 'import requests; r=requests.get(\"http://api.local/version\"); datos=r.json(); print(datos[\"version\"])'", (ctx) => k.ultimaSalida(ctx).trim() === '2.4', ['Usa response.json().', 'Consulta la clave version.'], 'python-http', 'python-json', 'python3'),
        t('pyl-api-t2', 'Consulta /usuarios e imprime cuántos registros devuelve.', PY, "python3 -c 'import requests; usuarios=requests.get(\"http://api.local/usuarios\").json(); print(len(usuarios))'", (ctx) => k.ultimaSalida(ctx).trim() === '2', ['La respuesta JSON es una lista.', 'Usa len.'], 'python-http', 'python-json', 'python3'),
      ],
    }),
    tareaV2({
      id: 'pyl-sockets', titulo: '3. Sockets con límites', subtitulo: 'Dirección, puerto y conexión',
      teoria: [
        { t: 'Un socket une extremos', p: 'Para TCP necesitas host y puerto. DNS resuelve el nombre; la conexión puede aceptar o rechazar independientemente de esa resolución.' },
        { t: 'No es un escáner', p: 'Probar un servicio propio y conocido es diagnóstico. Barrer objetivos ajenos cambia alcance, riesgo y autorización.' },
        { t: 'Cerrar y limitar', p: 'Las conexiones deben tener timeout y cierre. En programas mayores, un gestor de contexto reduce fugas de recursos.' },
        { n: 'Topología simulada', p: 'api.local expone 80 y 443; lab.local expone 22 y 8000. No se envía un solo paquete real.' },
      ],
      practica: [
        q('pyl-sock-q1', '¿Qué par identifica un servicio TCP?', ['Host y puerto', 'Usuario y grupo', 'Archivo e inode', 'Hash y salt'], 0, 'La conexión apunta a ambos.', 'python-sockets'),
        q('pyl-sock-q2', '¿Resolver DNS garantiza que el puerto acepte conexión?', ['No', 'Sí siempre', 'Solo en IPv6', 'Solo con JSON'], 0, 'Son capas distintas.', 'python-sockets'),
        c('pyl-sock-c1', 'Completa la resolución.', 'ip = socket.________________("api.local")', ['gethostbyname'], 'La función devuelve la dirección conocida.', 'python-sockets'),
        o('pyl-sock-o1', 'Ordena una conexión responsable.', ['resolver', '→', 'conectar con timeout', '→', 'intercambiar lo mínimo', '→', 'cerrar'], 'resolver → conectar con timeout → intercambiar lo mínimo → cerrar', 'Los recursos deben liberarse.', 'python-sockets'),
        t('pyl-sock-t1', 'Resuelve api.local con socket e imprime su dirección.', PY, "python3 -c 'import socket; print(socket.gethostbyname(\"api.local\"))'", (ctx) => k.ultimaSalida(ctx).trim() === '192.168.1.60', ['Importa socket.', 'Usa gethostbyname.'], 'python-sockets', 'python3'),
        t('pyl-sock-t2', 'Conecta al puerto 443 de api.local e imprime getpeername().', PY, "python3 -c 'import socket; s=socket.create_connection((\"api.local\",443), timeout=2); print(s.getpeername()); s.close()'", (ctx) => k.salidaTiene(ctx, '192.168.1.60', '443') && ctx.ultimo.code === 0, ['create_connection recibe una tupla.', 'Después imprime getpeername y cierra.'], 'python-sockets', 'python3'),
      ],
    }),
    tareaV2({
      id: 'pyl-automatizacion', titulo: '4. Automatización de laboratorio', subtitulo: 'Pequeños programas, resultados repetibles',
      teoria: [
        { t: 'Un objetivo por programa', p: 'Inventariar endpoints, resumir eventos o validar configuración son proyectos pequeños y comprobables. Mezclar los tres dificulta probar y recuperar fallos.' },
        { t: 'Configura fuera del código', p: 'Argumentos y archivos de configuración separan el programa de cada ejecución. Nunca incrustes secretos en el repositorio.' },
        { t: 'Salida determinista', p: 'Ordena resultados y usa formatos estables. Así un diff muestra cambios reales en vez de variaciones accidentales.' },
        { n: 'Automatiza evidencia, no conclusiones', p: 'El programa reúne y resume; una persona revisa contexto antes de declarar un incidente o vulnerabilidad.' },
      ],
      practica: [
        q('pyl-auto-q1', '¿Por qué ordenar una salida automatizada?', ['Para que los cambios sean comparables', 'Para ocultar errores', 'Para abrir puertos', 'Para obtener root'], 0, 'El orden estable mejora revisión y pruebas.', 'python-automatizacion'),
        q('pyl-auto-q2', '¿Dónde deberían ir los secretos?', ['En un gestor o entrada protegida, no en el código', 'En Git', 'En print', 'En el nombre del script'], 0, 'Separar secretos reduce exposición.', 'python-automatizacion'),
        c('pyl-auto-c1', 'Completa la función que ordena una colección.', 'for host in ________(hosts):', ['sorted'], 'sorted devuelve una vista ordenada.', 'python-automatizacion'),
        o('pyl-auto-o1', 'Ordena la automatización.', ['definir objetivo', '→', 'fijar entrada', '→', 'producir salida estable', '→', 'verificar muestra'], 'definir objetivo → fijar entrada → producir salida estable → verificar muestra', 'El diseño precede a la escala.', 'python-automatizacion'),
        t('pyl-auto-t1', 'Escribe inventario.py para ordenar ["lab.local","api.local"] e imprimir cada host.', PY, "printf 'hosts = [\"lab.local\", \"api.local\"]\\nfor host in sorted(hosts):\\n    print(host)\\n' > inventario.py\npython3 inventario.py", (ctx) => k.ultimaSalida(ctx).trim() === 'api.local\nlab.local', ['Usa sorted(hosts).', 'Imprime dentro del for.'], 'python-automatizacion', 'python3'),
        t('pyl-auto-t2', 'Guarda en version.txt la versión obtenida desde api.local usando Python.', PY, "python3 -c 'import requests; from pathlib import Path; datos=requests.get(\"http://api.local/version\").json(); Path(\"version.txt\").write_text(datos[\"version\"])'", (ctx) => k.contenido(ctx, 'version.txt') === '2.4', ['Consulta y parsea la API.', 'Escribe la clave version con Path.'], 'python-automatizacion', 'python-http', 'python-archivos'),
      ],
    }),
    tareaV2({
      id: 'pyl-proyecto', titulo: '5. Proyecto: resumen de eventos', subtitulo: 'HTTP, JSON, bucles, diccionarios y salida',
      teoria: [
        { t: 'Pregunta concreta', p: 'El endpoint /eventos devuelve IP y código. El proyecto contará eventos por IP para señalar dónde conviene investigar, sin afirmar por sí solo que exista un ataque.' },
        { t: 'Diseño en cuatro funciones mentales', p: 'Adquirir JSON, validar cada registro, acumular conteos y presentar en orden. Aunque el programa sea corto, esas responsabilidades siguen separadas.' },
        { t: 'Errores esperados', p: 'Red, JSON y esquema pueden fallar. Una versión de producción controlaría cada frontera y devolvería un código útil.' },
        { n: 'Interpretación responsable', p: 'Dos 401 desde una IP son una señal, no una atribución. Correlaciona con tiempo, usuario, activo y contexto autorizado.' },
      ],
      practica: [
        q('pyl-pro-q1', '¿Qué demuestra por sí solo un conteo alto de 401?', ['Solo una señal que requiere contexto', 'Una identidad confirmada', 'Acceso root', 'Que DNS está roto'], 0, 'El resumen orienta la investigación.', 'python-parsing'),
        q('pyl-pro-q2', '¿Qué operaciones combina el proyecto?', ['HTTP, JSON, bucles y diccionarios', 'Solo chmod', 'Solo sockets UDP', 'Montaje de discos'], 0, 'Integra la progresión anterior.', 'python-automatizacion'),
        c('pyl-pro-c1', 'Completa la acumulación por IP.', 'conteos[ip] = conteos.get(ip, 0) ___ 1', ['+'], 'Cada evento incrementa una unidad.', 'python-parsing'),
        o('pyl-pro-o1', 'Ordena el proyecto.', ['obtener eventos', '→', 'validar registros', '→', 'contar por IP', '→', 'presentar resumen'], 'obtener eventos → validar registros → contar por IP → presentar resumen', 'El resultado conserva trazabilidad.', 'python-automatizacion'),
        t('pyl-pro-t1', 'Escribe resumen.py para consultar /eventos, contar por ip e imprimir el conteo de 10.0.0.8.', PY, "printf 'import requests\\neventos = requests.get(\"http://lab.local/eventos\").json()\\nconteos = {}\\nfor evento in eventos:\\n    ip = evento[\"ip\"]\\n    conteos[ip] = conteos.get(ip, 0) + 1\\nprint(conteos[\"10.0.0.8\"])\\n' > resumen.py\npython3 resumen.py", (ctx) => k.ultimaSalida(ctx).trim() === '2' && k.existe(ctx, 'resumen.py'), ['Obtén la lista con requests.', 'Acumula evento["ip"] en un diccionario.'], 'python-automatizacion', 'python-http', 'python-json', 'python-parsing'),
        t('pyl-pro-t2', 'Consulta /eventos e imprime cuántos códigos 401 hay.', PY, "printf 'import requests\\neventos = requests.get(\"http://lab.local/eventos\").json()\\ntotal = 0\\nfor evento in eventos:\\n    if evento[\"codigo\"] == 401:\\n        total += 1\\nprint(total)\\n' > fallos.py\npython3 fallos.py", (ctx) => k.ultimaSalida(ctx).trim() === '2', ['Recorre la lista de eventos.', 'Incrementa total cuando codigo sea 401.'], 'python-automatizacion', 'python-control', 'python-http'),
      ],
    }),
  ],
};

export const SALAS_PROGRAMACION = [
  SALA_BASH_PROFESIONAL,
  SALA_PYTHON_FUNDAMENTOS,
  SALA_PYTHON_DATOS,
  SALA_PYTHON_LABORATORIOS,
];
