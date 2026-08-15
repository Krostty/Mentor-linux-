# Mentor Linux

Aplicación móvil y offline para aprender fundamentos informáticos, Linux, Redes, Bash, Python, Web, SQL y hacking ético usando un sistema Linux simulado. No abre SSH ni contacta objetivos externos: filesystem, shell, servicios, APIs, bases y máquinas vulnerables viven dentro del navegador.

La fase pedagógica conserva todo el contenido y convierte el reproductor en un tutor compatible: diagnostica, pide predecir, muestra ejemplos resueltos, retira ayuda, exige transferencia y programa recuperación espaciada.

## Qué incluye

- **56 salas** organizadas en 6 academias y 30 rutas: Linux/Fundamentos, Redes, Bash/Python, Web/Datos, Seguridad ofensiva y Defensa.
- **311 lecciones y 1.547 ejercicios** con decisión, recuperación, completar, construcción de comandos y terminal.
- **Fundamentos informáticos**: hardware, CPU, RAM, almacenamiento, sistemas operativos, datos y virtualización antes de la primera terminal.
- **Redes desde cero**: enlace, Ethernet, ARP, encapsulación, direccionamiento, transporte, TLS e intermediarios antes del diagnóstico avanzado.
- **Bash y Python**: quoting, arrays, exit codes, scripts robustos, tipos, control de flujo, funciones, archivos, excepciones, JSON, regex, requests, sockets y automatización.
- **Python ejecutable y aislado**: runtime educativo sin `eval`, descargas ni red real; comparte el filesystem virtual y solo conversa con endpoints `*.local` simulados.
- **Web antes de vulnerabilidades**: cliente/servidor, URL y origen, HTML, DOM, JavaScript, fetch, HTTP/HTTPS, CORS, REST, JSON, autenticación, autorización, cookies, sesiones y tokens.
- **SQL ejecutable de solo lectura**: tablas, claves, filtros, agregación, `JOIN`, esquema y parámetros sobre una base SQLite educativa determinista.
- **Pentesting desde cero**: qué se contrata y qué se firma, familias de vulnerabilidades web y almacenamiento de contraseñas.
- **Reproductor paso a paso**: un bloque de teoría o un ejercicio por pantalla, barra de progreso por lección, saltar y repescar, y pantalla de cierre con el resumen.
- **Ciclo de aprendizaje completo**: diagnóstico → predicción → ejemplo → práctica guiada → feedback específico → transferencia → autoexplicación → reporte → repaso.
- **Cuestionarios sin sesgo posicional**: las opciones se mezclan de forma estable; un error explica la diferencia y permite volver a decidir sin eliminar alternativas.
- **Repaso espaciado adaptativo** a 10 minutos, 1, 3, 7 y 21 días, con reinicio inmediato tras un error.
- **Calibración metacognitiva**: Mentor conserva la confianza declarada en predicciones y la compara con el resultado.
- **Sala 0 intensiva** con 37 interacciones para practicar repetidamente `pwd`, `ls`, `cd`, ayuda y errores.
- **12 máquinas simuladas** —5 fáciles, 4 medias y 3 difíciles— con cinco niveles de autonomía, alcance/ROE, evidencia por fase, reconocimiento, enumeración, acceso, escalada, flags, reporte y writeup.
- **Wargame de 15 niveles** encadenados por contraseña.
- **8 misiones rápidas** y un laboratorio libre restaurable.
- **109 fichas de chuletario**, 157 comandos/builtins disponibles en el motor y búsqueda offline.
- **40 logros**, 15 rangos, racha, combos, temas y dominio real por habilidad.
- **30 rutas con prerrequisitos explícitos** y 24 capacidades compuestas: Mentor detecta bases débiles, recomienda dónde reforzarlas y nunca bloquea por ellas.
- **PWA offline** instalable en iOS, Android y escritorio.
- **Portadas e ilustraciones PNG** precargadas para uso offline, con SVG como respaldo, y **sonidos sintetizados** con WebAudio. Nueve diagramas pedagógicos ya se intercalan con teoría y práctica.

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
4. Repasos programados según aciertos sin pista, contextos, recuperación demorada y días distintos.
5. Predicción y confianza antes de revelar la respuesta en conceptos piloto.
6. Transferencia y reporte para demostrar que la habilidad funciona fuera del ejemplo.

Si dos secuencias de comandos producen el estado correcto, ambas cuentan. Las pistas son progresivas y los errores conocidos generan explicaciones concretas.

Las máquinas siguen un flujo **Guiado → Asistido → Independiente → Experto → Red Team**, siempre simulado y autorizado. Sus IP, hosts, banners, tokens y vulnerabilidades son ficción determinista; ningún comando realiza tráfico de red.

## Motor Linux simulado

- Filesystem en memoria con dueños, grupos, permisos octales/simbólicos, SUID, SGID, sticky bit, capabilities, atributos y enlaces.
- Shell con comillas, globs, variables, arrays, pipes, redirecciones, descriptores, `&&`, `||`, `;` y bucles.
- Runtime Python seguro con tipos, colecciones, bloques, funciones, archivos, excepciones y módulos de laboratorio para JSON, regex, HTTP y sockets.
- Servicios Web deterministas con métodos, estados, cabeceras, redirecciones, CORS, cookies y sesiones; `sqlite3` consulta una base relacional local de solo lectura.
- Procesos, paquetes, servicios, red y criptografía simulados.
- Herramientas profesionales como `git`, `strings`, `file`, `lsattr`, `chattr`, `nmap`, `nc`, `tmux` y `vim`.
- Snapshots independientes para salas, máquinas y cada nivel del Wargame.

## Desarrollo

No hay compilación ni dependencias de producción; la app usa módulos ES nativos.

```bash
python3 -m http.server 8123
# abre http://localhost:8123
```

### Pruebas

```bash
node tests/shell.test.mjs        # 190 pruebas heredadas y expansión de ~
node tests/content.test.mjs      # 1.997 comprobaciones del contenido original
node tests/v2-shell.test.mjs     # 108 pruebas de herramientas, Python, Web y SQL
node tests/v2-content.test.mjs   # 13.085 comprobaciones y resolución de los 1.547 ejercicios
node tests/e2e.mjs               # 140 comprobaciones en móvil, persistencia y offline
```

`v2-content.test.mjs` resuelve todos los ejercicios de terminal con su solución de referencia, incluidos Bash, Python, HTTP, sesiones y SQL; completa las cuatro fases y ambas flags de cada máquina, encadena los 15 niveles y comprueba migración, debounce y precaché PWA.

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
  arte.js                  ilustraciones SVG usadas como respaldo
  portadas.js              mapa de portadas PNG y respaldo SVG
  sonido.js                avisos sintetizados con WebAudio, sin archivos
  store.js                 progreso v4, dominio, repaso, evidencias, migración y copias
  data/pedagogia.js        pasos semánticos, quiz, intervalos y autonomía
  engine/                  filesystem, shell, terminal y comandos
    commands/python.js     runtime Python seguro y módulos locales simulados
    commands/web.js        SQLite educativo de solo lectura
  data/
    modulos-1..4.js        contenido original conservado
    salas.js               academias, rutas, ampliaciones y Sala 0
    salas-redes-cero.js    redes desde cero, subredes y diagnóstico
    salas-fundamentos.js   fundamentos informáticos desde cero
    salas-linux-internals.js almacenamiento, memoria, kernel y /proc
    salas-redes-profundas.js enlace, transporte y seguridad de red
    salas-programacion.js  Bash profesional y Python progresivo
    salas-web.js           Web, HTTP, JavaScript, APIs, identidad y SQL
    curriculum-v2.js       pasos intercalados de unidades migradas
    salas-pentesting.js    auditoría, vulnerabilidades web y contraseñas
    habilidades.js         catálogo, inferencia y niveles de dominio
    prerrequisitos.js       grafo de rutas y capacidades compuestas
    maquinas.js            12 laboratorios por fases
    wargame.js             15 niveles encadenados
    snapshots.js           sistemas virtuales reproducibles
tools/
  iconos.html              arte fuente de los iconos: los PNG son capturas suyas
assets/
  portadas/                cubiertas PNG de academias, rutas y salas
  arte/                    recursos visuales generales
  teoria/                  diagramas pedagógicos PNG de las lecciones
docs/                      currículo, pedagogía y guía visual V2
tests/                     motor, contenido y E2E móvil
sw.js                      precaché y funcionamiento offline
manifest.webmanifest       instalación PWA
```

## Alcance ético y referencias

La seguridad se enseña solo sobre entornos propios o expresamente autorizados. Mentor Linux no incluye objetivos reales, evasión ni conexiones externas.

El diseño didáctico toma como referencia pública el aprendizaje por salas de TryHackMe, la progresión visual de Duolingo, el flujo de máquinas de Hack The Box y los niveles encadenados de OverTheWire. La cobertura temática se contrastó con los temarios públicos de [Hack4u](https://hack4u.io/); el contenido, las máquinas, los textos y la identidad visual de Mentor Linux son propios.
