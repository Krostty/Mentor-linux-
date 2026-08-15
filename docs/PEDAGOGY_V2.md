# Pedagogía Mentor V2

## Resultado buscado

El alumno debe comprender, predecir, ejecutar, interpretar y combinar. Una respuesta correcta sin razonamiento no basta en niveles avanzados.

Secuencia pedagógica implementada:

```text
Diagnosticar -> Predecir -> Explicar -> Ver ejemplo -> Hacer con ayuda
-> Corregir -> Retirar ayuda -> Transferir -> Autoexplicar -> Repasar
```

## Reglas de una lección

- Una pantalla, una idea o acción principal.
- Un comando importante se explica antes de su primer ejercicio.
- Cada explicación conecta con una capacidad futura.
- La salida de un comando se interpreta; no se presenta como decoración.
- El error recibe una causa y un siguiente paso.
- Los conceptos esenciales reaparecen espaciados y en contextos nuevos.
- Una lección puede omitir pasos que no aporten valor; no existe plantilla rígida.

## Modelo de pasos V2

Una tarea puede declarar `pasos`. Si no lo hace, el adaptador conserva el contrato antiguo `teoria + practica`.

Tipos compatibles:

- `teoria`: concepto, nota, tabla o código.
- `imagen`: PNG pedagógico con `src`, `alt` y `caption`.
- `ejercicio`: referencia a un ejercicio de `practica` por ID.
- `diagnostico`: recuperación inicial sin penalización.
- `prediccion`: decisión antes de ejecutar.
- `ejemplo`: procedimiento resuelto y razonado.
- `explicacion`: comparación entre predicción y resultado.
- `practica-guiada`: ejercicio con contexto y andamiaje.
- `escenario`: contexto, objetivo, alcance y evidencia.
- `reflexion`: explicación del alumno con sus palabras.
- `reporte`: hallazgo estructurado con impacto y remediación.
- `repaso`: recuperación del concepto en otro momento.
- `fin`: generado por el reproductor.

Ejemplo compatible:

```js
{
  teoria: [...],
  practica: [...],
  pasos: [
    { tipo: 'teoria', bloque: { t: '...', p: '...' } },
    { tipo: 'imagen', src: 'assets/teoria/linux/filesystem.png', alt: '...', caption: '...' },
    { tipo: 'ejercicio', ejercicioId: 'ejemplo-q1' }
  ]
}
```

## Ejercicios

Tipos existentes que se conservan:

- Quiz para discriminación conceptual.
- Respuesta corta para recuperación.
- Completar para sintaxis significativa.
- Ordenar para construir comandos o secuencias.
- Terminal para demostrar estado y salida.

Reglas:

- Validar estado final cuando existan varios caminos correctos.
- No repetir mecánicamente la misma habilidad.
- Mezclar habilidades anteriores con la nueva.
- Separar dificultad conceptual de dificultad de escritura.
- Las pistas reducen recompensa y programan repaso, pero no avergüenzan.

## Dificultad y autonomía

| Nivel | Información y ayuda |
|---|---|
| Guided | Objetivo, explicación, pasos y feedback inmediato |
| Assisted | Objetivo y pistas progresivas |
| Independent | Objetivo sin receta |
| Expert | Infraestructura, ruido e información incompleta |
| Red Team | Objetivo, ROE e infraestructura; camino libre |

Los cinco niveles están disponibles en las doce máquinas. Experto exige reporte y Red Team exige además aceptar las ROE. Cada fase conserva comando y salida como evidencia. Las flags no completan la máquina: observación, evidencia, impacto y remediación son obligatorios.

## Comandos

Antes del primer uso significativo deben aparecer:

1. propósito;
2. estructura;
3. opciones relevantes;
4. ejemplo;
5. salida esperada;
6. elementos que observar;
7. límites o riesgos.

La ficha colapsable sirve como referencia, no como única explicación.

## Imágenes

- Una portada identifica; una imagen pedagógica explica.
- La imagen nunca sustituye la explicación textual.
- `alt` describe el concepto relevante, no cada detalle decorativo.
- `caption` conecta la imagen con la decisión que tomará el alumno.
- No incluir texto pequeño esencial dentro del bitmap.
- El recurso debe ser local, responsive, cacheado y funcionar offline.

Prioridades: filesystem, permisos, procesos, memoria, pipes, ARP, DHCP, CIDR, routing, NAT, TCP, DNS, HTTP, TLS, Windows, AD, Kerberos, LDAP, pivoting y cadenas de ataque.

## Feedback y mastery

- Explicar por qué una respuesta falla.
- Mezclar las opciones de forma determinista sin usar el índice correcto como posición visual.
- Conservar historial de intentos, pistas y fechas.
- Medir capacidades compuestas además de comandos.
- Requerir variedad de contextos y días para niveles altos.
- Programar recuperación a 10 minutos, 1, 3, 7 y 21 días; un error vence el repaso inmediatamente.
- Comparar confianza declarada y resultado para calibración metacognitiva.
- No bloquear innecesariamente; mostrar debilidades y ofrecer repaso.

Ejemplos de capacidad: interpretar permisos, diagnosticar DNS, explicar TCP, enumerar HTTP, justificar una vulnerabilidad y escribir un hallazgo.

### Contrato implementado

- Una habilidad atómica conserva su nivel 0..6 según recuperación, pistas, variedad y tiempo.
- Una capacidad compuesta agrega el nivel de todas sus habilidades; practicar una sola herramienta no basta para dominar un proceso.
- Una ruta puede requerir avance previo y niveles mínimos de capacidades.
- Un requisito incumplido produce una recomendación concreta y enlaza la primera base que conviene reforzar.
- Los requisitos no deshabilitan rutas. El alumno puede continuar y Mentor mantiene visible la deuda de aprendizaje.
- Los progresos antiguos calculan mastery al vuelo: no necesitan campos persistentes ni pierden datos.
- Todas las habilidades que forman capacidades tienen al menos un ejercicio entrenable.

### Fase pedagógica transversal

Los 1.547 ejercicios existentes reciben mezcla visual de quiz, feedback correctivo y agenda de repaso sin cambiar sus IDs. `rt-handshake` y `permisos-chmod-letras-teoria` son los pilotos completos del nuevo ciclo. Sus pasos piden recuperar y predecir antes de revelar el modelo; después alternan ejemplo, práctica guiada, transferencia, autoexplicación y reporte. El adaptador mantiene operativas las demás lecciones mientras se migra contenido de alto valor.

### Aplicación en Fase 3

Las 24 lecciones nuevas usan el contrato intercalado completo. Fundamentos presenta primero modelos mentales; Linux conecta esos modelos con comandos y estado del sistema; Redes recorre enlace → Internet → transporte → protección antes de diagnosticar servicios. Los ejercicios alternan predicción, clasificación, orden causal, respuesta recuperada y terminal. Ninguna imagen contiene información imprescindible que no esté explicada también en HTML.

### Aplicación en Fase 4

Las 21 lecciones de programación conservan el mismo reproductor y añaden ejecución verificable. Bash comienza por predecir expansiones y códigos de salida antes de combinar herramientas; Python empieza con tipos y control de flujo antes de tocar archivos, HTTP o sockets. Los programas se escriben en el filesystem virtual, se ejecutan con `python3` y se validan por salida o estado final. Requests y sockets solo conocen servicios `*.local` deterministas, de modo que la práctica sigue siendo offline, reproducible y segura.

Los proyectos terminan en síntesis: un script Bash inventaría y cuenta archivos; un programa Python adquiere eventos locales, valida JSON, acumula por clave y presenta una señal que todavía requiere interpretación humana. Automatizar evidencia no automatiza una conclusión de seguridad.

### Aplicación en Fase 5

Las 30 lecciones Web conservan una dependencia estricta: primero se entiende la tecnología y después se estudia cómo puede fallar. El alumno sigue una petición completa, interpreta mensajes HTTP, lee HTML y JavaScript, consume un contrato API, mantiene una sesión y consulta el modelo relacional antes de volver a las salas de Pentesting Web.

La práctica alterna tres representaciones del mismo sistema: código fuente local, mensajes observables con `curl` y estado relacional con `sqlite3`. Las predicciones distinguen cliente de servidor, autenticación de autorización, CORS de CSRF y JSON válido de dato válido. Los ejercicios terminales validan salida y archivos, mientras el laboratorio bloquea red real y mutaciones SQL.

Tres diagramas explican el ciclo petición/respuesta, la vida de una sesión y las claves de un modelo relacional. Cada uno conserva explicación textual, `alt`, `caption`, dimensiones explícitas y precaché offline. La portada Web identifica la academia sin sustituir estos recursos pedagógicos.

## Seguridad y ética

- Toda práctica ofensiva vive en snapshots, simulaciones o laboratorios autorizados.
- Alcance y autorización aparecen antes que herramientas ofensivas.
- En técnicas avanzadas se explica evidencia, impacto y mitigación.
- No se enseña evasión operativa contra objetivos reales.

## Criterios de calidad

Una unidad nueva termina cuando tiene objetivo, prerrequisitos, explicación, práctica, feedback, progresión, diseño móvil, offline, accesibilidad y validación. Las secciones principales requieren portada PNG; los conceptos visuales requieren imágenes solo cuando mejoran la comprensión.
