# Currículo Mentor V2

## Misión

Mentor recibe a una persona sin base técnica y la lleva, mediante comprensión y práctica simulada, hasta Pentesting y Red Team avanzados. El alumno aprende sistemas antes que herramientas y solo actúa en laboratorios propios o expresamente autorizados.

Pentesting y Red Team son la especialización central. Blue Team, DFIR, malware, Cloud Security, DevSecOps y SOC no crecerán como academias independientes en esta etapa. El conocimiento defensivo se conserva cuando explica evidencia, impacto, detección o mitigación de una técnica ofensiva.

## Principios curriculares

- Una capacidad real justifica cada tema.
- La tecnología se enseña antes de la vulnerabilidad que la rompe.
- La profundidad del currículo no aumenta la carga de una sola pantalla.
- Linux, redes, Bash, máquinas, Wargame, progreso y PWA evolucionan; no se reemplazan.
- Los IDs publicados y el progreso son contratos de compatibilidad.
- Los escenarios avanzan de ayuda explícita a autonomía.

## Base existente reutilizable

| Área | Estado actual | Decisión V2 |
|---|---|---|
| Fundamentos y Linux | 17 salas; incluye base informática e internals | Migración Fase 3 completada |
| Redes | 11 salas desde enlace hasta diagnóstico | Capas y protocolos profundizados en Fase 3 |
| Bash | 4 salas desde sintaxis hasta automatización robusta | Migración Fase 4 completada |
| Python | 3 salas progresivas y runtime offline | Programación, datos y laboratorios completados en Fase 4 |
| Pentesting | metodología, recon, enum, acceso, Linux PrivEsc | Reordenar y profundizar |
| Web | HTTP y vulnerabilidades introductorias | Anteponer fundamentos web completos |
| Defensa | 6 salas independientes | Reubicar como perspectiva contextual |
| Máquinas | 12 Linux, cuatro fases | Cinco autonomías, ROE, evidencia y reporte implementados |
| Wargame | 15 niveles encadenados | Conservar y ampliar después |

Línea base auditada: 5 academias, 17 rutas, 42 salas, 236 lecciones y 1.110 ejercicios.

## Tronco objetivo

1. Fundamentos informáticos.
2. Linux desde cero y administración.
3. Redes e Internet.
4. Bash y Git.
5. Python y programación.
6. Web, HTTP, APIs, JavaScript y SQL.
7. Fundamentos de seguridad.
8. Windows y PowerShell.
9. Pentesting base.
10. Web Pentesting.
11. Linux Privilege Escalation.
12. Windows Privilege Escalation.
13. Active Directory.
14. Pivoting y tunneling.
15. Red Team.
16. Operaciones avanzadas y escenarios integrales.

## Capacidades por etapa

### Fundamentos informáticos

Hardware y software; CPU; RAM; almacenamiento; procesos; sistemas operativos; archivos; usuarios; binario; hexadecimal; arquitectura básica; virtualización.

### Linux

Terminal, shell, filesystem, rutas, enlaces, permisos, usuarios, grupos, pipes, descriptores, procesos, señales, servicios, systemd, logs, paquetes, almacenamiento, mounts, SSH, cron, entorno, `/proc`, `/sys`, red, capabilities, SUID/SGID, administración y troubleshooting.

### Redes e Internet

LAN/WAN; NIC; Ethernet; frames; MAC; ARP; IPv4; IPv6 básico; máscara; CIDR; subnetting; DHCP; gateway; routing; NAT/PAT; ICMP; TCP/UDP; handshake y estados; puertos; sockets; DNS; HTTP/HTTPS; TLS; certificados; proxies; VPN; firewall y diagnóstico capa por capa.

### Programación

Bash robusto y Python real: tipos, control, funciones, módulos, archivos, excepciones, JSON, regex, requests, parsing, sockets y automatización segura.

### Web y datos

Cliente/servidor; navegador; HTML; JavaScript necesario; HTTP; cookies; sesiones; autenticación; autorización; APIs REST/JSON; bases de datos; SQL; TLS; reverse proxy; same-origin policy y CORS.

### Pentesting

Autorización; alcance; reglas de enfrentamiento; OSINT; reconocimiento; descubrimiento; escaneo; enumeración; fingerprinting; CVE/CVSS; validación; explotación en laboratorio; shells; transferencia; credenciales; hashes; post-explotación; escalada; movimiento lateral; pivoting; reporting y remediación.

### Windows y Active Directory

Windows, filesystem, usuarios, grupos, ACL, servicios, procesos, registro, PowerShell, red, SMB y autenticación antes de dominios, DC, OU, GPO, LDAP, Kerberos, NTLM, DNS y trusts.

### Red Team

Objetivo y ROE; entrada inicial; enumeración interna; credenciales; movimiento lateral; Active Directory; pivoting; objetivos; evidencia y reporte en infraestructura simulada.

## Dependencias

```text
Fundamentos -> Linux básico -> Linux administración -> Linux PrivEsc
Fundamentos -> Redes -> Web y datos -> Web Pentesting
Linux + Bash/Git -> Python -> automatización ofensiva
Linux + Redes + Fundamentos de seguridad -> Pentesting base
Windows + PowerShell + Redes/DNS -> Windows PrivEsc -> Active Directory
Redes + Pentesting base -> Pivoting/tunneling
Pentesting + Web Pentesting + PrivEsc + AD + Pivoting -> Red Team
Red Team + reporting -> operaciones integrales
```

El modelo V2 incorpora de forma compatible:

- `REQUISITOS_RUTA`: dependencias explícitas de rutas y niveles de capacidades.
- `CAPACIDADES`: grupos de habilidades atómicas que aportan evidencia conjunta.
- `autonomia`: `guided`, `assisted`, `independent`, `expert` o `red-team`.
- `dificultad`: complejidad técnica independiente de la ayuda.

El grafo actual cubre las 30 rutas y veinticuatro capacidades compuestas. Las dependencias se muestran como diagnóstico y recomendación; el orden dentro de cada academia continúa siendo el único mecanismo de desbloqueo. Esto conserva todos los progresos y permite que una persona con experiencia externa avance sin un bloqueo artificial.

La preparación de una ruta combina:

1. avance de las rutas base;
2. nivel 0..6 de las capacidades requeridas;
3. evidencia atómica: intentos, aciertos sin pista, ejercicios y días distintos.

Los caminos críticos ya quedan expresados: Linux antes de administración; Bash antes de Python; Python de datos y Redes antes de automatizaciones de laboratorio; Linux y Redes antes de Pentesting avanzado; y Python de datos antes de aplicaciones ofensivas. Web, Windows y Active Directory ampliarán el mismo grafo sin cambiar el contrato.

## Migración Fase 3

La primera etapa curricular migrada conserva las 636 prácticas Linux/Redes existentes y añade:

- Fundamentos informáticos como entrada real: hardware/software, CPU, RAM, almacenamiento, sistema operativo, procesos, bits, hexadecimal, identidades y virtualización.
- Linux bajo la superficie: particiones, filesystems, mounts, espacio/inodos, RAM/swap, `/proc`, `/sys`, kernel y troubleshooting por recursos.
- Redes por capas: NIC, Ethernet/Wi-Fi, tramas, MAC, switches, ARP, DHCP y encapsulación.
- Transporte e Internet seguro: ICMP, sockets, handshake/estados TCP, UDP, IPv6, NAT/PAT, port forwarding, TLS, certificados, proxies, VPN y firewalls.
- 4 salas, 24 lecciones, 131 ejercicios, 4 diagramas pedagógicos y 4 capacidades nuevas.

Estado al cerrar Fase 3: 5 academias, 20 rutas, 46 salas, 260 lecciones y 1.241 ejercicios.

## Migración Fase 4

La programación se incorpora como una progresión ejecutable, no como un catálogo de fragmentos:

- Bash profesional completa expansión y quoting, arrays indexados, códigos de salida, composición, parsing, idempotencia y verificación posterior al cambio.
- Python desde cero enseña valores, tipos, colecciones, condicionales, bucles, funciones, módulos y argumentos antes de aplicarlo a seguridad.
- Python para datos cubre archivos, contextos, excepciones, JSON, expresiones regulares y parsing reproducible.
- Python para laboratorios combina requests, APIs, sockets y automatización exclusivamente sobre `api.local` y `lab.local` simulados.
- Un runtime propio interpreta el subconjunto enseñado sin `eval`, dependencias remotas ni acceso al dispositivo; usa el filesystem del shell y bloquea cualquier destino externo.
- 4 salas, 21 lecciones, 126 ejercicios, 4 rutas y 4 capacidades compuestas nuevas.

Estado acumulado: 5 academias, 24 rutas, 50 salas, 281 lecciones y 1.367 ejercicios.

## Migración Fase 5

La Web se enseña como un sistema completo antes de estudiar vulnerabilidades:

- Arquitectura cliente/servidor, recorrido de una petición, URL, origen, navegador, HTML semántico, DOM, formularios y separación entre servidor Web, aplicación y datos.
- HTTP/HTTPS desde mensajes y métodos hasta estados, cabeceras, redirecciones, HSTS, same-origin y preflight CORS.
- JavaScript necesario para comprender DOM, eventos, asincronía, `fetch`, validación y la frontera pública del frontend.
- APIs REST y JSON como contratos: colecciones, recursos, métodos, errores, paginación y clientes reproducibles.
- Autenticación frente a autorización, cookies, sesiones, SameSite, CSRF y tokens; ninguna decisión crítica se delega al navegador.
- Bases relacionales y SQL antes de SQL injection: esquema, claves, `SELECT`, filtros, agregación, `JOIN`, transacciones y consultas parametrizadas.
- `web.local` simula HTTP, HTTPS, APIs, CORS y sesiones; `sqlite3` ejecuta consultas de solo lectura sobre datos deterministas. Nada sale del navegador.
- 6 salas, 30 lecciones, 180 ejercicios, una portada propia, 3 diagramas pedagógicos, 6 rutas y 6 capacidades compuestas nuevas.

Estado acumulado: 6 academias, 30 rutas, 56 salas, 311 lecciones y 1.547 ejercicios.

## Migración

1. Contratos y documentación.
2. Motor de pasos y visuales.
3. Piloto Linux/Redes.
4. Prerrequisitos y mastery.
5. Fundamentos, Linux y Redes.
6. Bash y Python.
7. Web y datos.
8. Fase pedagógica transversal.
9. Seguridad Core y Pentesting base.
10. Web Pentesting y Linux PrivEsc.
11. Windows, Windows PrivEsc y AD.
12. Pivoting, Red Team y escenarios integrales.

## Progreso de implementación

- [x] Auditoría de arquitectura y contenido.
- [x] Inventario base y mapa objetivo.
- [x] Contrato de pasos intercalados compatible.
- [x] Soporte inicial de imagen pedagógica PNG.
- [x] Piloto mínimo Linux y Redes.
- [x] Grafo de prerrequisitos para las 30 rutas actuales.
- [x] Mastery por veinticuatro capacidades compuestas.
- [x] Diagnóstico no bloqueante, recomendaciones y mapa de perfil.
- [x] Fase 3: Fundamentos, Linux y Redes.
- [x] Fase 4: Bash y Python.
- [x] Fase 5: Web y datos.
- [x] Motor semántico: diagnóstico, predicción, ejemplo, explicación, práctica guiada, escenario, reflexión, reporte y repaso.
- [x] Recuperación espaciada adaptativa, feedback específico, mezcla estable de quizzes y calibración.
- [x] Maestría alcanzable para todas las habilidades de capacidades compuestas.
- [x] Pilotos completos de TCP y permisos.
- [x] Cinco niveles de autonomía, ROE, evidencia y reporte en las 12 máquinas.
- [ ] Migraciones curriculares posteriores.
