// Academia Scripting · ruta «Programar desde cero».
//
// Bash convierte comandos en herramientas, pero se queda corto en cuanto hay
// que calcular, estructurar datos o mantener un programa. Estas tres salas
// enseñan a escribir programas de verdad partiendo de cero absoluto —sin dar
// por sabido qué es una variable— en los dos lenguajes que más aparecen
// alrededor de un sistema Linux: **Python** (automatización, datos, seguridad)
// y **Lua** (embebido en Nginx, Redis, Neovim, juegos y routers).
//
// Los scripts se ejecutan de verdad dentro del intérprete didáctico del motor
// (`js/engine/scripting.js`): el alumno escribe el archivo con `echo`/`printf`,
// lo ejecuta con `python3` o `lua` y ve su salida y sus errores reales.
//
// Límite honesto, que además se enseña en la última tarea de cada sala: el
// intérprete cubre el subconjunto del lenguaje que aquí se explica (tipos,
// operadores, cadenas, listas/tablas, condiciones, bucles, funciones, archivos
// y una biblioteca estándar mínima). Clases, excepciones, módulos externos,
// comprensiones y metatablas quedan fuera y se señalan como siguiente paso.

import * as k from './checks.js';
import { quiz, respuesta, terminal, ordenar, completar, barajar } from './piezas.js';

const SNAP = 'programacion';

// Comprueba que un archivo existe y que su contenido cumple lo pedido.
const archivoCon = (c, ruta, ...trozos) => {
  const texto = k.contenido(c, ruta);
  return typeof texto === 'string' && trozos.every((t) => (t instanceof RegExp ? t.test(texto) : texto.includes(t)));
};

// ---------------------------------------------------------------------------
// 1. Python desde cero
// ---------------------------------------------------------------------------

export const SALA_PYTHON_CERO = {
  id: 'python-cero', n: 39, nombre: 'Python desde cero',
  resumen: 'Escribe y ejecuta tus primeros programas: variables, texto, decisiones, bucles y funciones',
  dificultad: 'Principiante', minutos: 55,
  comandos: ['python3', 'echo', 'printf', 'cat', 'chmod'], origen: 'v6-scripting',
  tareas: [
    {
      id: 'py-primer-programa', titulo: '1. Tu primer programa', subtitulo: 'Qué es un script y cómo se ejecuta',
      teoria: [
        { t: 'Un script es un archivo de texto con órdenes', p: 'Un programa en Python es un archivo normal, casi siempre con extensión `.py`. No se compila: se lo das a un **intérprete** (`python3`) y este lo lee de arriba abajo y va ejecutando línea por línea.' },
        { c: '$ python3 hola.py\nHola, mundo' },
        { t: 'print muestra cosas', p: '`print(...)` escribe en la terminal lo que le pongas entre paréntesis y añade un salto de línea al final. El texto va entre comillas: `print("Hola")`.' },
        { n: 'Los paréntesis y las comillas van en pareja', p: 'Casi todos los primeros errores son un paréntesis o una comilla sin cerrar. Python te dirá `SyntaxError` y el número de línea: empieza siempre por ahí.' },
      ],
      practica: [
        quiz('py-q1', '¿Qué hace `python3 hola.py`?', ['Lee el archivo y ejecuta sus líneas una a una', 'Compila el archivo a un binario', 'Abre un editor de texto', 'Instala Python'], 0, 'Python es interpretado: no genera un ejecutable, lee y ejecuta.'),
        terminal('py-ejecutar-ejemplo', 'Ejecuta el programa de ejemplo que hay en `ejemplos/hola.py`.', SNAP, 'python3 ejemplos/hola.py', (c) => k.salidaTiene(c, 'Hola, mundo') && k.ultimoUsó(c, /python3?\s/), ['El intérprete es `python3` y el archivo, `ejemplos/hola.py`.']),
        ordenar('py-orden-ejecutar', 'Construye la orden que ejecuta el archivo `informe.py`.', ['python3', 'informe.py'], 'python3 informe.py', 'Primero el intérprete, después el archivo.', ['python3']),
        terminal('py-crear-hola', 'Crea un archivo `hola.py` que escriba `Hola, Mentor` y ejecútalo.', SNAP, 'echo \'print("Hola, Mentor")\' > hola.py\npython3 hola.py', (c) => k.salidaTiene(c, 'Hola, Mentor') && archivoCon(c, 'hola.py', 'print'), ['Puedes escribirlo con `echo \'print("Hola, Mentor")\' > hola.py` y después ejecutarlo.']),
        quiz('py-q2', '¿Qué imprime `print("2 + 3")`?', ['2 + 3', '5', 'Error', '"2 + 3"'], 0, 'Entre comillas es texto literal. Sin comillas, `print(2 + 3)` sí calcularía 5.'),
        terminal('py-una-linea', 'Sin crear ningún archivo, calcula 2 + 3 con Python y muestra el resultado.', SNAP, 'python3 -c \'print(2 + 3)\'', (c) => k.salidaTiene(c, '5') && k.ultimoUsó(c, /-c/), ['La opción `-c` ejecuta código suelto: `python3 -c \'print(2 + 3)\'`.']),
        respuesta('py-r1', '¿Qué extensión llevan por convención los archivos de Python?', ['.py', 'py'], 'No es obligatoria para el intérprete, pero es la convención universal.'),
        completar('py-c1', 'Completa la función que muestra texto por pantalla.', '_____("Hola")', ['print'], '`print` es la función de salida estándar.', ['python3']),
      ],
    },
    {
      id: 'py-variables', titulo: '2. Variables y tipos', subtitulo: 'Guardar datos y saber qué son',
      teoria: [
        { t: 'Una variable es un nombre para un valor', p: 'Se crea asignando: `edad = 30`. No se declara el tipo: Python lo deduce del valor. Reasignar cambia el valor, y también puede cambiar el tipo.' },
        { c: 'nombre = "mentor"   # str, texto\nedad = 30           # int, entero\naltura = 1.75       # float, decimal\nactivo = True       # bool, verdadero o falso' },
        { t: 'Los tipos no se mezclan solos', p: '`"3" + 4` es un error, porque uno es texto y otro número. Se convierte a mano con `int("3")`, `str(4)` o `float("1.5")`.' },
        { f: [['`int`', 'enteros: 30, -2, 0'], ['`float`', 'decimales: 1.75, 3.0'], ['`str`', 'texto entre comillas'], ['`bool`', '`True` o `False`'], ['`type(x)`', 'dice qué es `x`']] },
        { n: 'La división siempre da decimal', p: '`10 / 2` vale `5.0`, no `5`. Para quedarte con el entero de la división usa `//`: `10 // 3` es `3`. Y `%` da el resto: `10 % 3` es `1`.' },
      ],
      practica: [
        quiz('py-q3', '¿Cuánto vale `10 / 2` en Python 3?', ['5.0', '5', '2', '"5"'], 0, 'La barra normal produce siempre un `float`.'),
        quiz('py-q4', '¿Qué operador da el RESTO de una división?', ['%', '//', '/', '**'], 0, '`%` es el módulo: `10 % 3` vale 1.'),
        terminal('py-tipos', 'Muestra el tipo del valor `1.75` usando Python en una sola orden.', SNAP, 'python3 -c \'print(type(1.75))\'', (c) => k.salidaTiene(c, 'float'), ['`type(valor)` responde qué es. Recuerda `python3 -c`.']),
        terminal('py-division', 'Muestra en una sola orden el resultado de `17 / 4`, `17 // 4` y `17 % 4`, en ese orden.', SNAP, 'python3 -c \'print(17 / 4, 17 // 4, 17 % 4)\'', (c) => k.salidaTiene(c, '4.25', '4', '1'), ['`print` acepta varios valores separados por comas.']),
        completar('py-c2', 'Completa la conversión de texto a número entero.', 'edad = ____("30")', ['int'], '`int()` convierte texto a entero; fallaría con "treinta".', ['python3']),
        ordenar('py-orden-asigna', 'Construye la línea que guarda el número 7 en una variable llamada `total`.', ['total', '=', '7'], 'total = 7', 'Nombre, igual, valor. El igual asigna, no compara.', ['python3']),
        terminal('py-variable-script', 'Escribe un script `edad.py` que guarde tu edad en una variable y muestre `Tengo 30 años` usando esa variable, y ejecútalo.', SNAP, 'printf \'%s\\n\' \'edad = 30\' \'print("Tengo", edad, "años")\' > edad.py\npython3 edad.py', (c) => k.salidaTiene(c, 'Tengo 30 años') && archivoCon(c, 'edad.py', 'edad'), ['`printf \'%s\\n\' \'linea1\' \'linea2\' > edad.py` escribe varias líneas de golpe.']),
        quiz('py-q5', '¿Qué ocurre con `"3" + 4`?', ['Da un TypeError', 'Da 7', 'Da "34"', 'Da 34'], 0, 'Python no adivina: hay que convertir con `int("3")` o `str(4)`.'),
      ],
    },
    {
      id: 'py-texto', titulo: '3. Trabajar con texto', subtitulo: 'f-strings, métodos y troceado',
      teoria: [
        { t: 'Las f-strings meten valores dentro del texto', p: 'Poniendo una `f` delante de las comillas puedes incrustar expresiones entre llaves: `f"Hola, {nombre}"`. Es la forma moderna y la más legible.' },
        { c: 'nombre = "ana"\nedad = 30\nprint(f"{nombre} tiene {edad} años")\nprint(f"El año que viene: {edad + 1}")\nprint(f"{3.14159:.2f}")   # dos decimales' },
        { t: 'El texto trae funciones incorporadas', p: 'Se llaman con un punto detrás del valor: `nombre.upper()`, `linea.strip()`, `texto.split(",")`, `frase.replace("a", "e")`. Ninguna cambia el original: devuelven uno nuevo.' },
        { f: [['`.upper()` / `.lower()`', 'mayúsculas o minúsculas'], ['`.strip()`', 'quita espacios y saltos de los extremos'], ['`.split(",")`', 'trocea en una lista'], ['`.replace(a, b)`', 'sustituye'], ['`len(texto)`', 'cuántos caracteres tiene']] },
        { n: 'Contar empieza en 0', p: '`palabra[0]` es la primera letra. Es la fuente número uno de errores «off by one» al empezar.' },
      ],
      practica: [
        quiz('py-q6', '¿Qué imprime `print(f"{2 + 2}")`?', ['4', '2 + 2', '{2 + 2}', 'Error'], 0, 'Lo de dentro de las llaves se evalúa antes de imprimirse.'),
        terminal('py-fstring', 'Con una sola orden, muestra `mentor tiene 6 letras` calculando el número con Python.', SNAP, 'python3 -c \'p = "mentor"; print(f"{p} tiene {len(p)} letras")\'', (c) => k.salidaTiene(c, 'mentor tiene 6 letras'), ['`len(p)` cuenta caracteres y las f-strings los incrustan: `f"{p} tiene {len(p)} letras"`.']),
        terminal('py-mayusculas', 'Muestra en mayúsculas el texto `mentor linux` usando Python.', SNAP, 'python3 -c \'print("mentor linux".upper())\'', (c) => k.salidaTiene(c, 'MENTOR LINUX'), ['El método se escribe pegado con un punto: `"texto".upper()`.']),
        completar('py-c3', 'Completa el método que quita los espacios sobrantes de los extremos.', 'linea = "  ana  ".______()', ['strip'], '`strip()` limpia el principio y el final, muy útil al leer archivos.', ['python3']),
        ordenar('py-orden-split', 'Construye la expresión que trocea `linea` por comas.', ['linea', '.split(",")'], 'linea.split(",")', 'El punto encadena el método al valor.', ['python3']),
        terminal('py-split', 'Con Python, trocea `ana:30:madrid` por los dos puntos y muestra la lista resultante.', SNAP, 'python3 -c \'print("ana:30:madrid".split(":"))\'', (c) => k.salidaTiene(c, "'ana'", "'30'", "'madrid'"), ['`.split(":")` devuelve una lista con los trozos.']),
        respuesta('py-r2', 'En `palabra = "linux"`, ¿qué letra devuelve `palabra[0]`?', ['l', '"l"', "'l'"], 'Los índices empiezan en 0, así que la primera letra es la 0.'),
        quiz('py-q7', '`nombre.upper()` sobre `nombre = "ana"`, ¿qué le pasa a `nombre`?', ['Sigue valiendo "ana"', 'Pasa a valer "ANA"', 'Se borra', 'Da error'], 0, 'Los métodos de texto devuelven una copia; hay que asignarla si la quieres.'),
      ],
    },
    {
      id: 'py-decisiones', titulo: '4. Decidir y repetir', subtitulo: 'if, else, for y while',
      teoria: [
        { t: 'La indentación ES la sintaxis', p: 'Python no usa llaves: lo que está dentro de un `if` o de un `for` se marca con **cuatro espacios** de sangría. Si la sangría no cuadra, el programa no arranca (`IndentationError`).' },
        { c: 'temp = 21\nif temp > 25:\n    print("calor")\nelif temp > 15:\n    print("templado")\nelse:\n    print("frío")' },
        { t: 'for recorre; while repite mientras', p: '`for x in lista:` recorre cada elemento. `for i in range(5):` cuenta de 0 a 4. `while condicion:` repite hasta que la condición deje de cumplirse.' },
        { c: 'total = 0\nfor n in [3, 5, 8]:\n    total = total + n\nprint(total)   # 16' },
        { n: 'Cuidado con el bucle que no acaba', p: 'Si dentro de un `while` no cambia nada de lo que mide la condición, el programa no termina nunca. Aquí el intérprete lo corta y avisa; en un servidor real se come la CPU.' },
        { f: [['`==`', 'igual que'], ['`!=`', 'distinto de'], ['`>` `<` `>=` `<=`', 'comparaciones'], ['`and` `or` `not`', 'combinan condiciones'], ['`break`', 'sale del bucle'], ['`continue`', 'salta a la vuelta siguiente']] },
      ],
      practica: [
        quiz('py-q8', '¿Qué marca en Python el cuerpo de un `if`?', ['La indentación', 'Las llaves { }', 'La palabra end', 'El punto y coma'], 0, 'Cuatro espacios por nivel: la sangría es obligatoria y significativa.'),
        quiz('py-q9', '¿Cuántas vueltas da `for i in range(5)`?', ['5, de 0 a 4', '5, de 1 a 5', '4', '6'], 0, '`range(5)` genera 0, 1, 2, 3 y 4.'),
        terminal('py-range', 'Muestra los números del 1 al 5, uno por línea, con un bucle de Python.', SNAP, 'python3 -c \'for i in range(1, 6): print(i)\'', (c) => k.salidaLineas(c).slice(-5).join(',') === '1,2,3,4,5', ['`range(1, 6)` va del 1 al 5. El cuerpo del bucle va sangrado.']),
        completar('py-c4', 'Completa la comparación de igualdad dentro de un `if`.', 'if usuario __ "root":', ['=='], 'Un solo `=` asigna; dos `==` comparan.', ['python3']),
        terminal('py-condicion', 'Escribe un script `nota.py` que guarde la nota 7 y muestre `aprobado` si es 5 o más, y ejecútalo.', SNAP, 'printf \'%s\\n\' \'nota = 7\' \'if nota >= 5:\' \'    print("aprobado")\' \'else:\' \'    print("suspenso")\' > nota.py\npython3 nota.py', (c) => k.salidaTiene(c, 'aprobado') && archivoCon(c, 'nota.py', 'if'), ['Con `printf \'%s\\n\'` y una cadena por línea; recuerda los cuatro espacios delante del `print`.']),
        terminal('py-suma', 'Calcula con Python la suma de los números del 1 al 100 y muéstrala.', SNAP, 'python3 -c \'print(sum(range(1, 101)))\'', (c) => k.salidaTiene(c, '5050'), ['`sum()` suma una secuencia entera; `range(1, 101)` llega hasta 100.']),
        quiz('py-q10', '¿Qué hace `continue` dentro de un bucle?', ['Salta a la siguiente vuelta', 'Termina el bucle', 'Reinicia el bucle desde el principio', 'Sale del programa'], 0, '`break` termina; `continue` pasa a la vuelta siguiente.'),
        respuesta('py-r3', '¿Cuántos espacios se usan por convención para cada nivel de sangría?', ['4', 'cuatro'], 'Es lo que fija la guía de estilo PEP 8.'),
      ],
    },
    {
      id: 'py-estructuras', titulo: '5. Listas, diccionarios y funciones', subtitulo: 'Guardar muchos datos y reutilizar código',
      teoria: [
        { t: 'Una lista guarda cosas en orden', p: 'Se escribe entre corchetes: `nombres = ["ana", "luis"]`. Se accede por posición (`nombres[0]`), se añade con `.append(...)` y se cuenta con `len(...)`.' },
        { t: 'Un diccionario guarda pares clave→valor', p: 'Se escribe entre llaves: `edades = {"ana": 30, "luis": 25}`. Se accede por clave (`edades["ana"]`), no por posición. Es la estructura de datos más usada de Python.' },
        { c: 'edades = {"ana": 30, "luis": 25}\nedades["mar"] = 22\nfor nombre, edad in edades.items():\n    print(nombre, edad)' },
        { t: 'Una función es un trozo con nombre', p: '`def` la define, los paréntesis reciben los datos y `return` devuelve el resultado. Sirve para no repetir y para poder probar cada parte por separado.' },
        { c: 'def media(numeros):\n    return sum(numeros) / len(numeros)\n\nprint(media([4, 6, 8]))   # 6.0' },
        { n: 'Una función sin return devuelve None', p: 'Imprimir dentro de la función y devolver un valor son cosas distintas: si vas a reutilizar el resultado, devuélvelo.' },
      ],
      practica: [
        quiz('py-q11', '¿Con qué se accede a un valor de un diccionario?', ['Con su clave', 'Con su posición', 'Con .split()', 'Con range()'], 0, 'Las listas van por posición; los diccionarios, por clave.'),
        quiz('py-q12', '¿Qué palabra define una función en Python?', ['def', 'function', 'fun', 'sub'], 0, '`def nombre(parametros):` y el cuerpo sangrado.'),
        terminal('py-lista', 'Con Python, crea una lista con 3, 1 y 2, ordénala y muéstrala.', SNAP, 'python3 -c \'n = [3, 1, 2]; n.sort(); print(n)\'', (c) => k.salidaTiene(c, '[1, 2, 3]'), ['`.sort()` ordena la lista en su sitio; luego imprímela.']),
        terminal('py-diccionario', 'Con Python, guarda las edades de ana (30) y luis (25) en un diccionario y muestra la de luis.', SNAP, 'python3 -c \'edades = {"ana": 30, "luis": 25}; print(edades["luis"])\'', (c) => k.salidaTiene(c, '25'), ['Entre llaves, `clave: valor`, y se lee con `edades["luis"]`.']),
        completar('py-c5', 'Completa el método que añade un elemento al final de una lista.', 'nombres.______("eva")', ['append'], '`append` añade al final; `insert` elige la posición.', ['python3']),
        ordenar('py-orden-def', 'Construye la primera línea de una función `saluda` que recibe `nombre`.', ['def', 'saluda(nombre):'], 'def saluda(nombre):', 'Palabra clave, nombre, parámetros y dos puntos.', ['python3']),
        terminal('py-funcion', 'Escribe un script `media.py` con una función que calcule la media de `[4, 6, 8]` y muestre el resultado, y ejecútalo.', SNAP, 'printf \'%s\\n\' \'def media(n):\' \'    return sum(n) / len(n)\' \'print(media([4, 6, 8]))\' > media.py\npython3 media.py', (c) => k.salidaTiene(c, '6.0') && archivoCon(c, 'media.py', 'def'), ['La función va primero, con `return`, y la llamada después.']),
        respuesta('py-r4', '¿Qué devuelve una función que no tiene `return`?', ['None', 'none'], 'Devuelve `None`, el valor «nada» de Python.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. Python aplicado al sistema
// ---------------------------------------------------------------------------

export const SALA_PYTHON_SISTEMA = {
  id: 'python-sistema', n: 40, nombre: 'Python en el sistema',
  resumen: 'Lee archivos, procesa registros, recibe argumentos y deja tu script ejecutable como una herramienta más',
  dificultad: 'Fácil', minutos: 45,
  comandos: ['python3', 'chmod', 'cat', 'printf', 'grep'], origen: 'v6-scripting',
  tareas: [
    {
      id: 'pys-archivos', titulo: '1. Leer archivos', subtitulo: 'open, read y readlines',
      teoria: [
        { t: 'Abrir, leer, cerrar', p: '`open("datos.txt")` abre el archivo, `.read()` devuelve todo su contenido como un texto y `.readlines()` devuelve una lista con una línea por elemento. Al terminar se cierra con `.close()`.' },
        { c: 'f = open("temperaturas.txt")\nfor linea in f.readlines():\n    print(linea.strip())\nf.close()' },
        { t: 'Las líneas traen el salto de línea pegado', p: 'Cada elemento de `.readlines()` termina en `\\n`. Por eso casi siempre se pasa por `.strip()` antes de usarlo, y por `int(...)` si es un número.' },
        { n: 'Un archivo que no existe es una excepción', p: '`FileNotFoundError` detiene el programa. En un script serio se comprueba antes; aquí basta con saber leer el error y el número de línea.' },
      ],
      practica: [
        quiz('pys-q1', '¿Qué devuelve `.readlines()`?', ['Una lista con una línea por elemento', 'Todo el archivo como un texto', 'El número de líneas', 'El archivo abierto'], 0, '`.read()` da el texto entero; `.readlines()`, la lista de líneas.'),
        terminal('pys-leer', 'Con Python, muestra el contenido completo de `nombres.txt`.', SNAP, 'python3 -c \'print(open("nombres.txt").read())\'', (c) => k.salidaTiene(c, 'ana', 'luis', 'eva'), ['`open("nombres.txt").read()` devuelve el texto completo.']),
        terminal('pys-contar-lineas', 'Con Python, muestra cuántas líneas tiene `nombres.txt`.', SNAP, 'python3 -c \'print(len(open("nombres.txt").readlines()))\'', (c) => k.salidaTiene(c, '5'), ['Cuenta los elementos de `.readlines()` con `len(...)`.']),
        completar('pys-c1', 'Completa el método que limpia el salto de línea del final.', 'linea.______()', ['strip'], 'Sin `strip()` arrastrarías el `\\n` a cada comparación.', ['python3']),
        terminal('pys-sumar', 'Escribe `suma.py` para sumar todas las temperaturas de `temperaturas.txt` y ejecútalo: debe mostrar el total.', SNAP, 'printf \'%s\\n\' \'total = 0\' \'for linea in open("temperaturas.txt").readlines():\' \'    total = total + int(linea.strip())\' \'print(total)\' > suma.py\npython3 suma.py', (c) => k.salidaTiene(c, '106') && archivoCon(c, 'suma.py', 'int'), ['Acumula en `total` y convierte cada línea con `int(linea.strip())`.'], 35),
        quiz('pys-q2', '¿Por qué `int(linea)` puede fallar al leer un archivo?', ['Porque la línea trae espacios o el salto de línea', 'Porque int() no existe', 'Porque los archivos son binarios', 'Porque Python no lee números'], 0, 'Primero `strip()`, después `int()`.'),
        respuesta('pys-r1', '¿Qué error da Python si el archivo no existe?', ['FileNotFoundError', 'filenotfounderror'], 'Es la excepción estándar al abrir una ruta inexistente.'),
      ],
    },
    {
      id: 'pys-procesar', titulo: '2. Procesar y resumir', subtitulo: 'Contar, filtrar y escribir un informe',
      teoria: [
        { t: 'El patrón es siempre el mismo', p: 'Leer → trocear → filtrar → acumular → escribir. Cambia el dato, no la estructura: es exactamente lo que haces con `grep`, `cut` y `sort`, pero con memoria y aritmética.' },
        { c: 'errores = 0\nfor linea in open("acceso.log").readlines():\n    if linea.startswith("ERROR"):\n        errores = errores + 1\nprint("errores:", errores)' },
        { t: 'Escribir también es abrir', p: '`open("salida.txt", "w")` crea o vacía el archivo, y `.write(texto)` escribe en él. El modo `"a"` añade al final en vez de vaciarlo. Hay que cerrar para asegurar el volcado.' },
        { f: [['`"r"`', 'lectura (por defecto)'], ['`"w"`', 'escritura: vacía lo que hubiera'], ['`"a"`', 'añade al final'], ['`.write()`', 'no añade el salto de línea: ponlo tú']] },
      ],
      practica: [
        quiz('pys-q3', '¿Qué le pasa a un archivo existente al abrirlo con `"w"`?', ['Se vacía', 'Se conserva y se añade al final', 'Da error', 'Se abre solo para leer'], 0, 'Para conservar el contenido se usa el modo `"a"`.'),
        terminal('pys-contar-errores', 'Escribe `errores.py` que cuente cuántas líneas de `acceso.log` empiezan por ERROR y muestre el número, y ejecútalo.', SNAP, 'printf \'%s\\n\' \'errores = 0\' \'for linea in open("acceso.log").readlines():\' \'    if linea.startswith("ERROR"):\' \'        errores = errores + 1\' \'print(errores)\' > errores.py\npython3 errores.py', (c) => k.salidaTiene(c, '2') && archivoCon(c, 'errores.py', 'startswith'), ['Un contador a 0, un `for` sobre las líneas y un `if linea.startswith("ERROR")` dentro.'], 35),
        terminal('pys-informe', 'Escribe un script `informe.py` que guarde en `informe.txt` el número de nombres de `nombres.txt`, ejecútalo y comprueba el archivo.', SNAP, 'printf \'%s\\n\' \'n = len(open("nombres.txt").readlines())\' \'f = open("informe.txt", "w")\' \'f.write("nombres: " + str(n))\' \'f.close()\' > informe.py\npython3 informe.py\ncat informe.txt', (c) => archivoCon(c, 'informe.txt', 'nombres: 5') && k.salidaTiene(c, 'nombres: 5'), ['Cuenta con `len(...readlines())`, abre `informe.txt` en modo `"w"` y escribe el texto.'], 35),
        completar('pys-c2', 'Completa el modo de apertura que AÑADE al final sin borrar.', 'f = open("registro.txt", "_")', ['a'], 'El modo `"a"` es de append.', ['python3']),
        ordenar('pys-orden-open', 'Construye la apertura de `salida.txt` para escribir.', ['open(', '"salida.txt"', ', "w")'], 'open("salida.txt", "w")', 'Ruta primero, modo después.', ['python3']),
        terminal('pys-media-csv', 'Escribe `unidades.py` que sume la columna de unidades de `ventas.csv` sin contar la cabecera, y ejecútalo.', SNAP, 'printf \'%s\\n\' \'total = 0\' \'primera = True\' \'for linea in open("ventas.csv").readlines():\' \'    if primera:\' \'        primera = False\' \'    else:\' \'        total = total + int(linea.split(",")[1])\' \'print(total)\' > unidades.py\npython3 unidades.py', (c) => k.salidaTiene(c, '20') && archivoCon(c, 'unidades.py', 'split'), ['Salta la cabecera con una bandera y toma la columna 1 de cada `linea.split(",")`.'], 40),
        quiz('pys-q4', 'Después de escribir con `.write()`, ¿qué conviene hacer?', ['Cerrar el archivo con .close()', 'Reiniciar Python', 'Cambiar los permisos', 'Nada, ya está'], 0, 'Cerrar asegura que todo se ha volcado a disco.'),
      ],
    },
    {
      id: 'pys-herramienta', titulo: '3. Convertirlo en una herramienta', subtitulo: 'Argumentos, shebang y permiso de ejecución',
      teoria: [
        { t: 'sys.argv trae lo que escribiste detrás', p: 'Al ejecutar `python3 saluda.py ana`, la lista `sys.argv` vale `["saluda.py", "ana"]`: la posición 0 es el propio programa y las siguientes, los argumentos.' },
        { c: 'import sys\nprint("Hola,", sys.argv[1])' },
        { t: 'El shebang elige el intérprete', p: 'Si la primera línea del archivo es `#!/usr/bin/env python3` y le das permiso de ejecución con `chmod +x`, puedes lanzarlo como `./saluda.py`, igual que cualquier comando del sistema.' },
        { c: '$ chmod +x saluda.py\n$ ./saluda.py ana\nHola, ana' },
        { n: 'Sin shebang, la shell intenta leerlo como Bash', p: 'Y falla con errores raros de sintaxis. Si ves `command not found` en una línea de Python, te falta la línea `#!`.' },
      ],
      practica: [
        quiz('pys-q5', '¿Qué contiene `sys.argv[0]`?', ['El nombre del propio script', 'El primer argumento', 'El intérprete', 'La ruta actual'], 0, 'Los argumentos del usuario empiezan en `sys.argv[1]`.'),
        terminal('pys-argv', 'Escribe `saluda.py` para que muestre `Hola, ana` cuando lo ejecutes pasándole `ana` como argumento, y pruébalo.', SNAP, 'printf \'%s\\n\' \'import sys\' \'print("Hola,", sys.argv[1])\' > saluda.py\npython3 saluda.py ana', (c) => k.salidaTiene(c, 'Hola, ana') && archivoCon(c, 'saluda.py', 'argv'), ['Importa `sys` y usa `sys.argv[1]`; los argumentos van detrás del nombre del archivo.'], 30),
        completar('pys-c3', 'Completa la primera línea que hace que el sistema use Python.', '#!/usr/bin/env ______', ['python3'], 'Esa línea es el shebang: la lee el kernel, no Python.', ['python3']),
        terminal('pys-ejecutable', 'Haz que `ejemplos/hola.py` se pueda ejecutar directamente y lánzalo como `./ejemplos/hola.py`.', SNAP, 'chmod +x ejemplos/hola.py\n./ejemplos/hola.py', (c) => k.salidaTiene(c, 'Hola, mundo') && k.usó(c, /chmod \+x/) && (k.modo(c, 'ejemplos/hola.py') & 0o111) !== 0, ['Primero `chmod +x ejemplos/hola.py`, después `./ejemplos/hola.py`. Ya trae el shebang.'], 30),
        quiz('pys-q6', 'Ejecutas `./programa.py` y responde `Permission denied`. ¿Qué falta?', ['El permiso de ejecución: chmod +x', 'Instalar Python', 'Poner el shebang', 'Ser root'], 0, 'El shebang dice cómo ejecutarlo; el bit `x` dice que se puede.'),
        respuesta('pys-r2', '¿Qué comando da permiso de ejecución a un archivo?', ['chmod +x', 'chmod +x archivo', 'chmod'], '`chmod +x archivo` añade el bit de ejecución.'),
        terminal('pys-error', 'Ejecuta `ejemplos/roto.py`, que tiene un fallo, y observa el error que devuelve Python.', SNAP, 'python3 ejemplos/roto.py', (c) => k.salidaTiene(c, 'NameError') && k.salidaTiene(c, 'empieza'), ['Ejecútalo tal cual: el objetivo es leer el mensaje de error.']),
        quiz('pys-q7', '`NameError: name \'total\' is not defined` significa que…', ['Usaste una variable que nunca creaste', 'El archivo no existe', 'Falta un paréntesis', 'Python no está instalado'], 0, 'Casi siempre es una errata en el nombre o una asignación que nunca llegó a ejecutarse.'),
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. Lua desde cero
// ---------------------------------------------------------------------------

export const SALA_LUA_CERO = {
  id: 'lua-cero', n: 41, nombre: 'Lua desde cero',
  resumen: 'El lenguaje que llevan dentro Nginx, Redis, Neovim y media industria del videojuego: sintaxis, tablas y funciones',
  dificultad: 'Principiante', minutos: 50,
  comandos: ['lua', 'echo', 'printf', 'cat', 'chmod'], origen: 'v6-scripting',
  tareas: [
    {
      id: 'lua-primer-programa', titulo: '1. Hola, Lua', subtitulo: 'Para qué sirve y cómo se ejecuta',
      teoria: [
        { t: 'Un lenguaje pequeño que va dentro de otros', p: 'Lua se diseñó para **empotrarse**: Nginx (OpenResty), Redis, Neovim, Wireshark, routers y muchísimos juegos lo usan para que puedas programar su comportamiento sin recompilarlos. Es diminuto y muy rápido.' },
        { c: '$ lua hola.lua\nHola, mundo' },
        { t: 'Se parece a Python, con dos diferencias que duelen', p: 'No hay indentación obligatoria: los bloques terminan con `end`. Y las listas empiezan en **1**, no en 0.' },
        { n: 'Comentarios con dos guiones', p: '`-- esto es un comentario`. Nada de `#`, que en Lua es el operador de longitud.' },
      ],
      practica: [
        quiz('lua-q1', '¿Qué palabra cierra un bloque en Lua?', ['end', 'fi', '}', 'done'], 0, 'Cada `if`, `for`, `while` y `function` termina con `end`.'),
        terminal('lua-ejecutar-ejemplo', 'Ejecuta el ejemplo `ejemplos/hola.lua`.', SNAP, 'lua ejemplos/hola.lua', (c) => k.salidaTiene(c, 'Hola, mundo') && k.ultimoUsó(c, /^lua\s/), ['El intérprete se llama `lua` y el archivo es `ejemplos/hola.lua`.']),
        terminal('lua-crear-hola', 'Crea `hola.lua` con un saludo a Mentor y ejecútalo.', SNAP, 'echo \'print("Hola, Mentor")\' > hola.lua\nlua hola.lua', (c) => k.salidaTiene(c, 'Hola, Mentor') && archivoCon(c, 'hola.lua', 'print'), ['`echo \'print("Hola, Mentor")\' > hola.lua` y después `lua hola.lua`.']),
        ordenar('lua-orden-ejecutar', 'Construye la orden que ejecuta `tarea.lua`.', ['lua', 'tarea.lua'], 'lua tarea.lua', 'Intérprete y archivo, igual que con Python.', ['lua']),
        completar('lua-c1', 'Completa el comienzo de un comentario en Lua.', '__ esto no se ejecuta', ['--'], 'Dos guiones: `#` es el operador de longitud.', ['lua']),
        terminal('lua-una-linea', 'Sin crear archivos, calcula 2 + 3 con Lua y muéstralo.', SNAP, 'lua -e \'print(2 + 3)\'', (c) => k.salidaTiene(c, '5') && k.ultimoUsó(c, /-e/), ['La opción de Lua para código suelto es `-e`: `lua -e \'print(2 + 3)\'`.']),
        quiz('lua-q2', '¿En qué número empieza la primera posición de una tabla en Lua?', ['1', '0', '-1', 'Depende'], 0, 'Es la diferencia que más errores provoca al venir de otros lenguajes.'),
      ],
    },
    {
      id: 'lua-variables', titulo: '2. Variables, texto y números', subtitulo: 'local, concatenación y longitud',
      teoria: [
        { t: 'Declara siempre con local', p: 'Sin `local`, la variable es **global** y vive en todo el programa: en un script empotrado eso pisa cosas ajenas. `local nombre = "mentor"` la limita al bloque actual.' },
        { c: 'local nombre = "mentor"\nlocal edad = 30\nprint("Hola, " .. nombre)     -- concatenar es ..\nprint(#nombre)                -- longitud: 6' },
        { t: 'El texto se pega con dos puntos', p: 'En Lua no se suma texto: se concatena con `..`. Y `#` delante de una cadena o de una tabla da su longitud.' },
        { f: [['`..`', 'une textos'], ['`#x`', 'longitud de texto o tabla'], ['`nil`', 'el «no hay valor»'], ['`~=`', 'distinto de (¡no `!=`!)'], ['`tostring` / `tonumber`', 'conversión']] },
        { n: 'Una variable que no existe vale nil', p: 'Lua no protesta al leerla: devuelve `nil`. El error aparece más tarde, al operar con ella («attempt to index a nil value»). Por eso `local` y los nombres bien escritos importan tanto.' },
      ],
      practica: [
        quiz('lua-q3', '¿Cómo se unen dos textos en Lua?', ['Con ..', 'Con +', 'Con &', 'Con concat()'], 0, '`+` es solo aritmético; el `+` sobre texto da error.'),
        quiz('lua-q4', '¿Qué operador significa «distinto de» en Lua?', ['~=', '!=', '<>', 'not='], 0, 'Es una de las diferencias clásicas con C y con Python.'),
        terminal('lua-concatenar', 'Con Lua, muestra `Hola, mentor` concatenando el saludo y el nombre.', SNAP, 'lua -e \'local n = "mentor"; print("Hola, " .. n)\'', (c) => k.salidaTiene(c, 'Hola, mentor'), ['Usa `..` para pegar el texto: `"Hola, " .. n`.']),
        terminal('lua-longitud', 'Con Lua, muestra cuántos caracteres tiene la palabra `mentor`.', SNAP, 'lua -e \'print(#"mentor")\'', (c) => k.salidaTiene(c, '6'), ['`#` delante de la cadena da su longitud.']),
        completar('lua-c2', 'Completa la palabra que limita el alcance de una variable.', '_____ total = 0', ['local'], 'Sin `local` sería global y podría pisar otra variable.', ['lua']),
        ordenar('lua-orden-local', 'Construye la declaración de una variable local `contador` con valor 0.', ['local', 'contador', '=', '0'], 'local contador = 0', '`local`, nombre, igual y valor.', ['lua']),
        terminal('lua-mayusculas', 'Con Lua, muestra `mentor` en mayúsculas.', SNAP, 'lua -e \'print(string.upper("mentor"))\'', (c) => k.salidaTiene(c, 'MENTOR'), ['Está en la biblioteca `string`: `string.upper("mentor")`, o `("mentor"):upper()`.']),
        respuesta('lua-r1', '¿Qué valor tiene en Lua una variable que nunca se ha asignado?', ['nil'], 'Leerla no da error; operar con ella, sí.'),
      ],
    },
    {
      id: 'lua-control', titulo: '3. Decisiones y bucles', subtitulo: 'if/then/else, for numérico y while',
      teoria: [
        { t: 'Todo bloque abre y cierra', p: '`if cond then ... end`, `for i = 1, 10 do ... end`, `while cond do ... end`. La sangría es solo estética: lo que manda es `end`.' },
        { c: 'local n = 7\nif n % 2 == 0 then\n  print("par")\nelse\n  print("impar")\nend' },
        { t: 'El for numérico lleva sus límites dentro', p: '`for i = 1, 10 do` cuenta del 1 al 10 **incluidos**, al revés que `range` de Python. Se puede añadir un paso: `for i = 1, 10, 2 do`.' },
        { f: [['`if ... then ... end`', 'condición'], ['`elseif`', 'todo junto, sin espacio'], ['`for i = a, b, paso do`', 'bucle contado'], ['`while cond do`', 'mientras se cumpla'], ['`repeat ... until cond`', 'al menos una vez']] },
        { n: 'Solo nil y false son falsos', p: 'El 0 y la cadena vacía son **verdaderos** en Lua, a diferencia de Python o C. Es una fuente de bugs muy sutiles.' },
      ],
      practica: [
        quiz('lua-q5', 'En Lua, ¿el número 0 es verdadero o falso en un `if`?', ['Verdadero', 'Falso', 'Da error', 'Depende de la versión'], 0, 'Solo `nil` y `false` son falsos; todo lo demás es verdadero.'),
        quiz('lua-q6', '¿Hasta qué número cuenta `for i = 1, 5 do`?', ['Hasta el 5 incluido', 'Hasta el 4', 'Hasta el 6', 'Hasta el 0'], 0, 'Los dos extremos entran, al contrario que `range(1, 5)` en Python.'),
        terminal('lua-for', 'Con Lua, muestra los números del 1 al 5, uno por línea.', SNAP, 'lua -e \'for i = 1, 5 do print(i) end\'', (c) => k.salidaLineas(c).slice(-5).join(',') === '1,2,3,4,5', ['`for i = 1, 5 do print(i) end`, todo en una línea si quieres.']),
        terminal('lua-suma', 'Con Lua, suma los números del 1 al 100 y muestra el total.', SNAP, 'lua -e \'local s = 0; for i = 1, 100 do s = s + i end; print(s)\'', (c) => k.salidaTiene(c, '5050'), ['Acumula en una variable dentro del bucle y muéstrala al salir.'], 30),
        completar('lua-c3', 'Completa la palabra que abre el cuerpo de un `if`.', 'if edad >= 18 ____', ['then'], '`if condición then` … `end`.', ['lua']),
        terminal('lua-condicion', 'Escribe `nota.lua` que guarde la nota 7 y muestre `aprobado` si llega a 5, y ejecútalo.', SNAP, 'printf \'%s\\n\' \'local nota = 7\' \'if nota >= 5 then\' \'  print("aprobado")\' \'else\' \'  print("suspenso")\' \'end\' > nota.lua\nlua nota.lua', (c) => k.salidaTiene(c, 'aprobado') && archivoCon(c, 'nota.lua', 'if', 'end'), ['Recuerda cerrar con `end`. Puedes escribirlo con `printf \'%s\\n\'` línea a línea.'], 30),
        respuesta('lua-r2', '¿Qué palabra cierra un `for` en Lua?', ['end'], 'Igual que el `if` y la `function`.'),
      ],
    },
    {
      id: 'lua-tablas', titulo: '4. Tablas: la única estructura', subtitulo: 'Listas, diccionarios y funciones',
      teoria: [
        { t: 'En Lua todo es una tabla', p: 'No hay listas y diccionarios por separado: hay **tablas**, que sirven para las dos cosas. `{10, 20, 30}` es una lista (posiciones 1, 2 y 3) y `{nombre = "ana"}` es un diccionario.' },
        { c: 'local t = {10, 20, 30}\ntable.insert(t, 40)\nprint(#t)          -- 4\nfor i, v in ipairs(t) do\n  print(i, v)\nend' },
        { t: 'ipairs para listas, pairs para claves', p: '`ipairs` recorre 1, 2, 3… en orden y para en el primer hueco. `pairs` recorre todas las claves, incluidas las de texto.' },
        { t: 'Las funciones también se guardan en variables', p: '`local function suma(a, b) return a + b end`. Una función es un valor más: se puede pasar como argumento o meter en una tabla.' },
        { f: [['`table.insert(t, v)`', 'añade al final'], ['`table.remove(t)`', 'quita el último'], ['`table.concat(t, ", ")`', 'une en un texto'], ['`table.sort(t)`', 'ordena'], ['`string.format("%.2f", x)`', 'formatea']] },
      ],
      practica: [
        quiz('lua-q7', '¿Qué estructura de datos usa Lua para listas Y diccionarios?', ['La tabla', 'El array', 'El dict', 'La lista enlazada'], 0, 'Una sola estructura para todo: la tabla.'),
        quiz('lua-q8', '¿Cuál recorre una tabla en orden de posición?', ['ipairs', 'pairs', 'next', 'sort'], 0, '`pairs` no garantiza orden; `ipairs` va 1, 2, 3…'),
        terminal('lua-tabla', 'Con Lua, crea una tabla con 5, 3 y 9, ordénala y muéstrala separada por comas.', SNAP, 'lua -e \'local t = {5, 3, 9}; table.sort(t); print(table.concat(t, ","))\'', (c) => k.salidaTiene(c, '3,5,9'), ['`table.sort(t)` ordena y `table.concat(t, ",")` la convierte en texto.'], 30),
        terminal('lua-ipairs', 'Con Lua, recorre la tabla `{"ana", "luis"}` y muestra cada nombre en mayúsculas, uno por línea.', SNAP, 'lua -e \'for _, n in ipairs({"ana", "luis"}) do print(string.upper(n)) end\'', (c) => k.salidaTiene(c, 'ANA', 'LUIS'), ['`for _, n in ipairs(tabla) do ... end`; el `_` descarta el índice.'], 30),
        completar('lua-c4', 'Completa la función que añade un valor al final de una tabla.', 'table.______(t, 40)', ['insert'], '`table.insert` añade; con tres argumentos elige la posición.', ['lua']),
        ordenar('lua-orden-funcion', 'Construye la cabecera de una función local `suma` con dos parámetros.', ['local', 'function', 'suma(a, b)'], 'local function suma(a, b)', '`local function nombre(parámetros)` … `end`.', ['lua']),
        terminal('lua-funcion', 'Escribe `area.lua` con una función que calcule el área de un triángulo de base 3 y altura 4, y muestre el resultado con dos decimales.', SNAP, 'printf \'%s\\n\' \'local function area(b, h)\' \'  return b * h / 2\' \'end\' \'print(string.format("%.2f", area(3, 4)))\' > area.lua\nlua area.lua', (c) => k.salidaTiene(c, '6.00') && archivoCon(c, 'area.lua', 'function'), ['`string.format("%.2f", valor)` da dos decimales; la función se cierra con `end`.'], 35),
        respuesta('lua-r3', '¿Qué función une los elementos de una tabla en un solo texto?', ['table.concat', 'concat'], '`table.concat(t, separador)`.'),
      ],
    },
    {
      id: 'lua-herramienta', titulo: '5. Scripts de verdad y sus límites', subtitulo: 'Argumentos, shebang, errores y hasta dónde llega esto',
      teoria: [
        { t: 'arg trae los argumentos', p: 'Al ejecutar `lua saluda.lua ana`, la tabla `arg` vale `arg[1] = "ana"` (y `arg[0]` es el propio script). Ojo: aquí también se empieza a contar en 1.' },
        { c: '#!/usr/bin/env lua\nprint("Hola, " .. arg[1])' },
        { t: 'Los errores de Lua señalan archivo y línea', p: '`lua: saluda.lua:2: attempt to concatenate a nil value` se lee de izquierda a derecha: archivo, línea y qué intentaba hacer. «nil value» casi siempre significa que un dato no llegó.' },
        { n: 'Qué cubre este intérprete y qué no', p: 'Dentro de Mentor Linux funcionan tipos, operadores, cadenas, tablas, control de flujo, funciones, `string`, `table`, `math`, `io` y `os` básicos. **No** hay metatablas, corrutinas, módulos externos ni `require`: ese es el siguiente paso, ya con Lua instalado en tu máquina.' },
      ],
      practica: [
        quiz('lua-q9', '¿Qué contiene `arg[1]` al ejecutar `lua tarea.lua informe`?', ['informe', 'tarea.lua', 'lua', 'nil'], 0, '`arg[0]` es el script; los argumentos empiezan en 1.'),
        terminal('lua-argumentos', 'Escribe `saluda.lua` para que salude al nombre que le pases y pruébalo con `ana`.', SNAP, 'printf \'%s\\n\' \'print("Hola, " .. arg[1])\' > saluda.lua\nlua saluda.lua ana', (c) => k.salidaTiene(c, 'Hola, ana') && archivoCon(c, 'saluda.lua', 'arg'), ['Concatena con `..` el valor de `arg[1]`.'], 30),
        terminal('lua-ejecutable', 'Haz ejecutable `ejemplos/hola.lua` y lánzalo directamente con `./ejemplos/hola.lua`.', SNAP, 'chmod +x ejemplos/hola.lua\n./ejemplos/hola.lua', (c) => k.salidaTiene(c, 'Hola, mundo') && (k.modo(c, 'ejemplos/hola.lua') & 0o111) !== 0, ['`chmod +x` y después `./ejemplos/hola.lua`; ya trae su línea `#!`.'], 30),
        terminal('lua-error', 'Ejecuta `ejemplos/roto.lua` y lee el error que devuelve el intérprete.', SNAP, 'lua ejemplos/roto.lua', (c) => k.salidaTiene(c, 'attempt to perform arithmetic'), ['Ejecútalo tal cual: aquí lo que se practica es leer el error.']),
        quiz('lua-q10', '`attempt to index a nil value` suele significar que…', ['La variable o la clave no existe', 'Falta un end', 'El archivo está vacío', 'Lua no está instalado'], 0, 'Estás usando como tabla algo que vale `nil`.'),
        completar('lua-c5', 'Completa el shebang que hace que el sistema ejecute el archivo con Lua.', '#!/usr/bin/env ___', ['lua'], 'Igual que con Python, pero apuntando a `lua`.', ['lua']),
        quiz('lua-q11', '¿Cuál de estas cosas NO cubre el intérprete de Mentor Linux?', ['Las metatablas y las corrutinas', 'Las tablas', 'Los bucles for', 'string.format'], 0, 'El subconjunto llega hasta funciones y biblioteca básica; lo demás se practica ya con Lua instalado.'),
        respuesta('lua-r4', '¿Qué palabra usarías en Lua real para cargar un módulo externo?', ['require'], 'Queda fuera de este simulador, pero es lo primero que verás en un proyecto de verdad.'),
      ],
    },
  ],
};

export const SALAS_SCRIPTING = [SALA_PYTHON_CERO, SALA_PYTHON_SISTEMA, SALA_LUA_CERO];
