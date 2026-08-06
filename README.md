# Mentor Linux

App para aprender y practicar Linux desde el móvil. No es una terminal SSH: es un
entorno didáctico con teoría, retos progresivos y un **Linux simulado dentro del
propio teléfono** donde los ejercicios se validan por resultado.

Funciona sin conexión y se instala sin pasar por la App Store.

---

## Instalarla en el iPhone

1. Abre la URL de la app en **Safari** (no en Chrome: solo Safari puede instalar).
2. Toca **Compartir** (el cuadrado con la flecha).
3. Elige **Añadir a pantalla de inicio**.

A partir de ahí tienes un ícono en el escritorio. Se abre a pantalla completa, sin
barra del navegador, y funciona en modo avión.

En Android es lo mismo desde Chrome: menú → *Instalar aplicación*.

---

## Qué incluye

**20 módulos en 3 rutas**, con desbloqueo progresivo:

| Ruta | Módulos |
|---|---|
| **Fundamentos** | Primeros pasos · Navegación · Archivos y carpetas · Ver y escribir texto · Permisos y usuarios · Buscar · Pipes y filtros · Procesos y recursos |
| **Administración** | Paquetes · Descriptores y flujos · Permisos especiales (SUID/SGID/capabilities) · Redes · SSH y acceso remoto · Servicios, logs y tareas |
| **Scripting y seguridad** | Bash I · Bash II · Cifrado y hashes · Endurecer un servidor · Análisis e investigación · Hacking ético |

Cada módulo trae lecciones cortas, retos prácticos con pistas y examen de 5 preguntas.

**Además:**

- **Terminal libre** — un sandbox sin enunciados para trastear.
- **Modo Incidente** — 5 escenarios cronometrados: la web caída, un ataque por SSH,
  el disco lleno, un despliegue roto y una auditoría previa a producción.
- **Chuletario** — 99 comandos con sintaxis, opciones y ejemplos, buscable y offline.
- **Progreso** — XP, 15 niveles, racha diaria, multiplicador por combo, 24 logros,
  6 temas de terminal desbloqueables y repaso espaciado de lo que fallaste.

En números: **64 lecciones, 130 retos y 145 comandos implementados.**

## El Linux simulado

No hay servidor ni red: todo corre en el navegador.

- Sistema de archivos en memoria con permisos octales y simbólicos, bits especiales
  (SUID, SGID, sticky), dueños, grupos y enlaces simbólicos.
- Shell con comillas simples y dobles, globs, variables, `|`, `>`, `>>`, `<`, `2>`,
  `2>&1`, `/dev/null`, `&&`, `||`, `;` y bucles `for`/`while`.
- Errores auténticos: `Permission denied`, `No such file or directory`,
  `command not found`… porque leer errores es parte de aprender.
- Los retos se validan **por el estado final del sistema**, no comparando texto: si
  llegas al objetivo por otro camino, cuenta igual.
- Cuando fallas, la app te dice **por qué**, con una explicación específica del error
  que cometiste.

## Desarrollo

Sin dependencias ni compilación. Módulos ES nativos.

```bash
python3 -m http.server 8123     # y abre http://localhost:8123
```

### Pruebas

```bash
node tests/shell.test.mjs      # 180 pruebas del motor
node tests/content.test.mjs    # 1935 comprobaciones del currículum
node tests/e2e.mjs             # 48 pruebas end-to-end en Chromium (iPhone)
```

`content.test.mjs` resuelve **cada uno de los 130 retos** con su solución de
referencia y comprueba que pasa su propia validación, así que el contenido no puede
quedar roto sin que salte.

`e2e.mjs` necesita el servidor local en marcha y deja capturas en `.capturas/`.

### Estructura

```
index.html            sw.js              manifest.webmanifest
css/                  base · ui · terminal
js/
  app.js              vistas y navegación
  store.js            progreso, XP, logros, repaso espaciado
  ui.js               formato, avisos, celebraciones
  engine/
    fs.js             filesystem virtual
    shell.js          tokenizer, parser y ejecución
    terminal.js       widget de terminal
    commands/         145 comandos en 10 familias
  data/
    modulos-1..4.js   el currículum
    checks.js         validación y diagnóstico de errores
    snapshots.js      estados iniciales del sistema
    comandos.js       chuletario
    incidentes.js     Modo Incidente
    logros.js         logros, niveles y temas
```

## Nota sobre el módulo de seguridad

Los módulos 18–20 se enseñan **desde el lado defensivo** y todo ocurre dentro del
Linux simulado del dispositivo: no hay red, no hay objetivos reales y nada sale del
teléfono. El módulo de hacking ético abre con la parte legal antes que con cualquier
técnica, porque auditar sistemas ajenos sin autorización por escrito es delito.

## Créditos

La estructura del temario se apoya en el enfoque de los cursos de
[Hack4u](https://hack4u.io) (*Introducción a Linux* e *Introducción al Hacking*),
adaptado a formato móvil y a un laboratorio simulado.
