# Mentor Linux v4

Aplicación móvil y offline para aprender Linux, Bash y fundamentos de hacking ético usando un sistema Linux simulado. No abre SSH ni contacta objetivos externos: filesystem, shell, servicios y máquinas vulnerables viven dentro del navegador.

La v4 conserva el contenido y lo sirve **una cosa por pantalla**: cada tarea es una lección paso a paso, con avance y retroceso siempre disponibles, diagnóstico concreto del fallo y la ficha del comando a mano.

## Qué incluye

- **45 salas** organizadas en 6 academias y 19 rutas: Linux, Redes, Bash, Scripting, Seguridad ofensiva y Defensa.
- **249 lecciones y 1.210 ejercicios** con decisión, recuperación, completar, construcción de comandos y terminal.
- **Scripting desde cero**: Python y Lua explicados sin dar por sabido qué es una variable, con los scripts ejecutándose de verdad dentro de la app.
- **Redes desde cero**: cómo viaja un paquete, direcciones y subredes, y diagnóstico de conexiones, latencia y rutas.
- **Pentesting desde cero**: qué se contrata y qué se firma, familias de vulnerabilidades web y almacenamiento de contraseñas.
- **Reproductor paso a paso**: un bloque de teoría o un ejercicio por pantalla, barra de progreso por lección, saltar y repescar, y pantalla de cierre con el resumen.
- **Sala 0 intensiva** con 37 interacciones para practicar repetidamente `pwd`, `ls`, `cd`, ayuda y errores.
- **12 máquinas simuladas** — 5 fáciles, 4 medias y 3 difíciles— con reconocimiento, enumeración, acceso, escalada, `user.txt`, `root.txt` y writeup.
- **Wargame de 15 niveles** encadenados por contraseña.
- **8 misiones rápidas** y un laboratorio libre restaurable.
- **107 fichas de chuletario**, 158 comandos/builtins disponibles en el motor y búsqueda offline.
- **44 logros con rango** —bronce, plata, oro y platino—, 15 rangos de nivel, racha, combos, temas y dominio real por habilidad.
- **PWA offline** instalable en iOS, Android y escritorio.
- **Portadas PNG** generadas con `tools/portadas.mjs` para las academias y las secciones, dibujo SVG para las tarjetas pequeñas, y **sonidos sintetizados** con WebAudio: ni un archivo de audio y todas las imágenes precacheadas, así que la app sigue entera sin conexión.

La navegación principal tiene cuatro áreas: **Aprender · Máquinas · Retos · Perfil**.

Dentro de Aprender la jerarquía es: **academia → sala → lección → paso**. Una academia agrupa
salas, una sala enumera sus lecciones y una lección se recorre pantalla a pantalla.

## Instalar en móvil

### iPhone o iPad

1. Abre la aplicación en Safari.
2. Antes de instalar, entra en **Perfil → Exportar progreso** o **Copia al portapapeles**.
3. Toca **Compartir → Añadir a pantalla de inicio**.

iOS puede mantener separado el almacenamiento de Safari y el de la app instalada. Mentor Linux avisa de esto en la primera visita y mantiene importar/exportar en el primer nivel del perfil.

### Android

Abre la aplicación en Chrome y usa **Menú → Instalar aplicación**.

## Modelo didáctico

La jerarquía es **Academia → Ruta → Sala → Tarea → Ejercicio**. Dentro de cada tarea conviven:

1. Explicaciones cortas, ejemplos y tablas.
2. Decisiones, predicción de salida, respuestas recuperadas y construcción de comandos.
3. Ejercicios de terminal que validan el estado final, no un único texto escrito.
4. Repasos programados según aciertos sin pista y días distintos de práctica.

Si dos secuencias de comandos producen el estado correcto, ambas cuentan. Las pistas son progresivas y los errores conocidos generan explicaciones concretas.

Las máquinas siguen un flujo de laboratorio ofensivo **exclusivamente simulado y autorizado**. Sus IP, hosts, banners, tokens y vulnerabilidades son ficción determinista; ningún comando realiza tráfico de red.

## Scripting: Python y Lua de verdad (dentro del simulador)

La academia **Scripting** enseña a programar desde cero en dos lenguajes:

- **Python desde cero** — primer `print`, variables y tipos, texto y f-strings, `if`/`for`/`while`, listas, diccionarios y funciones.
- **Python en el sistema** — leer archivos, procesar registros, escribir informes, `sys.argv`, shebang y `chmod +x` para convertir un script en una herramienta.
- **Lua desde cero** — el lenguaje que llevan dentro Nginx, Redis y Neovim: `local`, concatenación, tablas (la única estructura), `ipairs`/`pairs`, funciones y `string.format`.

Los scripts **se ejecutan**: `js/engine/scripting.js` es un intérprete didáctico de
ambos lenguajes que corre contra el filesystem simulado, con la salida y los
errores que daría el intérprete real (`NameError`, `attempt to index a nil value`,
número de línea incluido). Cubre tipos, operadores —con la distinción entre entero
y decimal, así que `10 / 2` da `5.0` en los dos lenguajes—, cadenas, listas y
tablas, control de flujo, funciones, archivos y una biblioteca estándar mínima
(`string`, `table`, `math`, `io`, `os`, `sys`).

**No** cubre clases, excepciones, comprensiones, módulos externos, metatablas ni
corrutinas: la última tarea de cada sala lo dice explícitamente y señala ese punto
como el momento de instalar el lenguaje en tu máquina. Un bucle infinito se corta
con un aviso en vez de colgar la pestaña.

## Motor Linux simulado

- Filesystem en memoria con dueños, grupos, permisos octales/simbólicos, SUID, SGID, sticky bit, capabilities, atributos y enlaces.
- Shell con comillas, globs, variables, pipes, redirecciones, descriptores, `&&`, `||`, `;` y bucles.
- Procesos, paquetes, servicios, red y criptografía simulados.
- Herramientas profesionales como `git`, `strings`, `file`, `lsattr`, `chattr`, `nmap`, `nc`, `tmux` y `vim`.
- Snapshots independientes para salas, máquinas y cada nivel del Wargame.

## Desarrollo

No hay compilación ni dependencias de producción; la app usa módulos ES nativos.

```bash
python3 -m http.server 8123
# abre http://localhost:8123
```

Las portadas están versionadas ya generadas. Solo hay que regenerarlas si cambia
una escena o se añade una academia:

```bash
node tools/portadas.mjs          # necesita Playwright (solo para autoría)
```

### Pruebas

```bash
node tests/shell.test.mjs        # 180 pruebas heredadas del motor
node tests/content.test.mjs      # 1.991 comprobaciones del contenido original
node tests/v2-shell.test.mjs     # 93 pruebas de herramientas nuevas y de los intérpretes
node tests/v2-content.test.mjs   # 9.697 comprobaciones y resolución de los 1.210 ejercicios
node tests/e2e.mjs               # 90 comprobaciones en móvil, persistencia y offline
```

`v2-content.test.mjs` resuelve todos los ejercicios de terminal con su solución de referencia —incluidos los que escriben y ejecutan programas en Python y en Lua—, completa las cuatro fases y ambas flags de cada máquina, encadena los 15 niveles y comprueba migración, debounce y precaché PWA.

`e2e.mjs` requiere el servidor local en el puerto 8123. Recorre una sala, una máquina completa, Wargame, retos, perfil y offline a 390×844; deja las capturas en `.capturas/`.

## Estructura

```text
index.html                 aplicación y navegación
css/
  base.css                 paleta clara, tipografía monoespaciada y tokens
  ui.css                   estructura de los componentes
  tema.css                 piel clara: tarjetas, cubiertas, módulos y filas
  terminal.css             la consola, única isla oscura de la app
js/
  app.js                   cuatro áreas y flujos interactivos
  arte.js                  portadas (PNG o SVG) y medallas de logro
  sonido.js                avisos sintetizados con WebAudio, sin archivos
  store.js                 progreso v3, dominio, repaso, migración y copias
  engine/                  filesystem, shell, terminal y comandos
  data/
    modulos-1..4.js        contenido original conservado
    salas.js               academias, rutas, ampliaciones y Sala 0
    salas-redes-cero.js    redes desde cero, subredes y diagnóstico
    salas-pentesting.js    auditoría, vulnerabilidades web y contraseñas
    habilidades.js         catálogo, inferencia y niveles de dominio
    maquinas.js            12 laboratorios por fases
    wargame.js             15 niveles encadenados
    salas-scripting.js     Python y Lua desde cero
    snapshots.js           sistemas virtuales reproducibles
  engine/
    scripting.js           intérpretes didácticos de Python y de Lua
assets/
  portadas/                las 10 portadas PNG generadas
tools/
  iconos.html              arte fuente de los iconos: los PNG son capturas suyas
  portadas.mjs             genera assets/portadas/*.png con Chromium
tests/                     motor, contenido y E2E móvil
sw.js                      precaché y funcionamiento offline
manifest.webmanifest       instalación PWA
```

## Alcance ético y referencias

La seguridad se enseña solo sobre entornos propios o expresamente autorizados. Mentor Linux no incluye objetivos reales, evasión ni conexiones externas.

El diseño didáctico toma como referencia pública el aprendizaje por salas de TryHackMe, la progresión visual de Duolingo, el flujo de máquinas de Hack The Box y los niveles encadenados de OverTheWire. La cobertura temática se contrastó con los temarios públicos de [Hack4u](https://hack4u.io/); el contenido, las máquinas, los textos y la identidad visual de Mentor Linux son propios.
