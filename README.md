# Mentor Linux v4

Aplicación móvil y offline para aprender Linux, Bash y fundamentos de hacking ético usando un sistema Linux simulado. No abre SSH ni contacta objetivos externos: filesystem, shell, servicios y máquinas vulnerables viven dentro del navegador.

La v4 conserva el contenido y lo sirve **una cosa por pantalla**: cada tarea es una lección paso a paso, con avance y retroceso siempre disponibles, diagnóstico concreto del fallo y la ficha del comando a mano.

## Qué incluye

- **24 salas** organizadas en 5 academias y 10 rutas: Linux, Redes, Bash, Seguridad ofensiva y Defensa.
- **146 lecciones y 563 ejercicios** con decisión, recuperación, completar, construcción de comandos y terminal.
- **Reproductor paso a paso**: un bloque de teoría o un ejercicio por pantalla, barra de progreso por lección, saltar y repescar, y pantalla de cierre con el resumen.
- **Sala 0 intensiva** con 37 interacciones para practicar repetidamente `pwd`, `ls`, `cd`, ayuda y errores.
- **12 máquinas simuladas** — 5 fáciles, 4 medias y 3 difíciles— con reconocimiento, enumeración, acceso, escalada, `user.txt`, `root.txt` y writeup.
- **Wargame de 15 niveles** encadenados por contraseña.
- **8 misiones rápidas** y un laboratorio libre restaurable.
- **107 fichas de chuletario**, 154 comandos/builtins disponibles en el motor y búsqueda offline.
- **40 logros**, 15 rangos, racha, combos, temas y dominio real por habilidad.
- **PWA offline** instalable en iOS, Android y escritorio.

La navegación principal tiene cuatro áreas: **Aprender · Máquinas · Practicar · Perfil**.

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

### Pruebas

```bash
node tests/shell.test.mjs        # 180 pruebas heredadas del motor
node tests/content.test.mjs      # 1.991 comprobaciones del contenido original
node tests/v2-shell.test.mjs     # 12 pruebas de herramientas nuevas
node tests/v2-content.test.mjs   # 2.480 comprobaciones v2 y resolución integral
node tests/e2e.mjs               # 32 flujos en móvil, persistencia y offline
```

`v2-content.test.mjs` resuelve todos los ejercicios de terminal con su solución de referencia, completa las cuatro fases y ambas flags de cada máquina, encadena los 15 niveles y comprueba migración, debounce y precaché PWA.

`e2e.mjs` requiere el servidor local en el puerto 8123. Recorre una sala, una máquina completa, Wargame, laboratorio, perfil y offline a 390×844; deja las capturas en `.capturas/`.

## Estructura

```text
index.html                 aplicación y navegación
css/                       base, componentes y terminal responsive
js/
  app.js                   cuatro áreas y flujos interactivos
  store.js                 progreso v3, dominio, repaso, migración y copias
  engine/                  filesystem, shell, terminal y comandos
  data/
    modulos-1..4.js        contenido original conservado
    salas.js               academias, rutas, ampliaciones y Sala 0
    habilidades.js         catálogo, inferencia y niveles de dominio
    maquinas.js            12 laboratorios por fases
    wargame.js             15 niveles encadenados
    snapshots.js           sistemas virtuales reproducibles
tests/                     motor, contenido y E2E móvil
sw.js                      precaché y funcionamiento offline
manifest.webmanifest       instalación PWA
```

## Alcance ético y referencias

La seguridad se enseña solo sobre entornos propios o expresamente autorizados. Mentor Linux no incluye objetivos reales, evasión ni conexiones externas.

El diseño didáctico toma como referencia pública el aprendizaje por salas de TryHackMe, la progresión visual de Duolingo, el flujo de máquinas de Hack The Box y los niveles encadenados de OverTheWire. La cobertura temática se contrastó con los temarios públicos de [Hack4u](https://hack4u.io/); el contenido, las máquinas, los textos y la identidad visual de Mentor Linux son propios.
