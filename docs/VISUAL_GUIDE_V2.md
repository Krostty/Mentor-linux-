# Guía visual Mentor V2

## Identidad

Mentor combina papel técnico claro con una terminal oscura. La interfaz usa tipografía monoespaciada, superficies blancas, sombras suaves y acentos funcionales. Las imágenes pueden variar de composición, pero conservan paleta, contraste y tono educativo.

## Tokens actuales

| Uso | Color |
|---|---|
| Fondo papel | `#f1f3f6` |
| Panel | `#ffffff` |
| Texto | `#191d26` |
| Azul de marca | `#17a7ef` |
| Verde completado | `#1aa668` |
| Ámbar atención | `#d9860a` |
| Rojo ofensiva | `#e14356` |
| Terminal | `#0d1330` |
| Fósforo terminal | `#b6ff5c` |

## Portadas

- Formato PNG.
- Academias y secciones: 800x400, proporción 2:1.
- Máquinas y Wargame: 720x480, proporción 3:2.
- El texto principal permanece en HTML cuando sea posible.
- La portada debe funcionar con recorte `object-fit: cover`.
- No repetir siempre el mismo punto de vista, material o diorama.
- Mantener cohesión mediante paleta, iluminación, contraste y acabado.

## Imágenes pedagógicas

- Formato piloto: PNG 3:2 o 16:9, sin transparencia requerida.
- Fondo oscuro o papel claro según el concepto, con contraste AA alrededor del componente.
- Diagramas con pocos elementos, flechas claras y jerarquía visual.
- Evitar texto pequeño dentro del bitmap; los rótulos esenciales viven en HTML/caption.
- Sin logos, marcas de terceros ni elementos decorativos sin función.
- `alt` obligatorio cuando la imagen transmite información.
- `caption` breve: qué observar y por qué importa.

## Componente responsive

- Ancho máximo 100%.
- Altura automática y proporción estable para evitar layout shift.
- Bordes redondeados coherentes con `--r-md`.
- Caption debajo, nunca superpuesto sobre información esencial.
- Sin scroll horizontal a 320–390 px.
- Carga diferida y decodificación asíncrona.

## Offline y rendimiento

- Todos los assets esenciales se guardan en `assets/`.
- Cada asset integrado debe figurar en el precache y en tests de existencia.
- Objetivo inicial: menos de 350 KB por imagen pedagógica tras optimización.
- Actualizar versión del cache en cada cambio de recursos esenciales.
- Nunca depender de una URL remota.

## Accesibilidad

- Portada decorativa dentro de una tarjeta: `alt=""` si el nombre ya está en HTML.
- Imagen pedagógica: alt específico del aprendizaje.
- El caption no duplica literalmente el alt.
- El contenido debe seguir siendo comprensible si la imagen no carga.
- Respetar `prefers-reduced-motion` y no animar información crítica.

## Revisión antes de integrar

1. El concepto se entiende en móvil.
2. No hay texto ilegible dentro del PNG.
3. La imagen enseña algo que el texto solo explicaría peor.
4. El archivo está comprimido y local.
5. `src`, `alt`, `caption` y precache están validados.
6. La lección mantiene sentido sin red.

## Biblioteca pedagógica integrada

- `assets/teoria/fundamentos/arquitectura-computador.png`: CPU, RAM, almacenamiento, sistema operativo y proceso.
- `assets/teoria/linux/filesystem-raiz.png`: jerarquía del filesystem y `~`.
- `assets/teoria/linux/almacenamiento-internals.png`: disco, partición, filesystem, mount, RAM y `/proc`.
- `assets/teoria/redes/viaje-paquete.png`: equipo, gateway y destino.
- `assets/teoria/redes/encapsulacion.png`: datos, segmento, paquete, trama y bits.
- `assets/teoria/redes/handshake-tcp.png`: `SYN`, `SYN-ACK`, `ACK` y conexión establecida.

Todos usan lienzo 3:2 de 960×640, son locales, tienen `alt` y caption en HTML, y están incluidos en el precaché.
