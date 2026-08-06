// Refuerzos de contenido para las salas 11–20.
// Mismo formato que refuerzos-1.js.

export const REFUERZOS_2 = {
  // ==================================================================
  especiales: [
    { t: 'ordenar', id: 'rf-esp-1', e: 'Construye la auditoría que busca binarios SUID en todo el sistema.', k: ['find', '/', '-perm', '-4000', '2>/dev/null'], r: 'find / -perm -4000 2>/dev/null', x: 'Es el primer paso de cualquier enumeración local: qué se ejecuta con permisos de otro.' },
    { t: 'ordenar', id: 'rf-esp-2', e: 'Construye el comando que activa SGID en la carpeta `equipo`.', k: ['chmod', 'g+s', 'equipo'], r: 'chmod g+s equipo', x: 'Con SGID, todo lo que se cree dentro hereda el grupo de la carpeta.' },
    { t: 'ordenar', id: 'rf-esp-3', e: 'Construye el comando que audita las capabilities repartidas por el sistema.', k: ['getcap', '-r', '/', '2>/dev/null'], r: 'getcap -r / 2>/dev/null', x: 'Las capabilities son la alternativa moderna a SUID y se auditan igual de cerca.' },
    { t: 'completar', id: 'rf-esp-4', e: 'Completa el modo octal que activa SUID sobre permisos 755.', p: 'chmod ___ programa', r: ['4755'], x: 'El cuarto dígito son los bits especiales: 4 SUID, 2 SGID, 1 sticky.' },
    { t: 'completar', id: 'rf-esp-5', e: 'Completa el bit que impide que unos borren los archivos de otros en una carpeta compartida.', p: 'chmod +___ /tmp', r: ['t'], x: 'El sticky bit: en `/tmp` todos crean, pero cada uno solo borra lo suyo.' },
    { t: 'completar', id: 'rf-esp-6', e: 'Completa el modo que deja la carpeta en 775 con SGID activado.', p: 'chmod ___ compartido', r: ['2775'], x: 'El 2 delante es SGID; los tres siguientes son los permisos de siempre.' },
    { t: 'respuesta', id: 'rf-esp-7', e: 'En `ls -l`, ¿qué letra sustituye a la `x` del dueño cuando hay SUID?', r: ['s', 'la s'], x: '`-rwsr-xr-x`. Esa `s` es la que hace que `passwd` pueda escribir en `/etc/shadow`.' },
    { t: 'respuesta', id: 'rf-esp-8', e: '¿Qué letra aparece al final de los permisos de `/tmp`?', r: ['t', 'la t'], x: '`drwxrwxrwt`. La `t` del sticky bit protege los archivos de cada usuario.' },
    { t: 'respuesta', id: 'rf-esp-9', e: '¿Qué capability necesita `ping` para funcionar sin ser root?', r: ['cap_net_raw', 'net_raw'], x: 'Solo necesita abrir sockets de red crudos, no todos los poderes de root.' },
    { t: 'quiz', id: 'rf-esp-10', e: '¿Por qué es peligrosísimo dar SUID a `/usr/bin/find`?', o: ['Consume mucha CPU', 'Porque con -exec ejecutaría cualquier comando como root', 'Porque es muy grande', 'No es peligroso'], c: 1, x: 'Cualquier binario SUID que permita ejecutar otros comandos entrega root de inmediato.' },
    { t: 'quiz', id: 'rf-esp-11', e: '¿Qué ventaja tienen las capabilities sobre SUID?', o: ['Son más rápidas', 'Conceden solo el privilegio concreto que hace falta', 'Ocupan menos', 'Funcionan sin root'], c: 1, x: 'Principio de mínimo privilegio: partir los poderes de root en piezas.' },
    { t: 'quiz', id: 'rf-esp-12', e: 'Encuentras un binario SUID en `/tmp`. ¿Qué indica?', o: ['Es normal', 'Es muy sospechoso: suele ser una puerta trasera', 'Que falta espacio', 'Que se borrará al reiniciar'], c: 1, x: 'Un SUID fuera de los directorios del sistema es una forma clásica de mantener acceso de root.' },
  ],

  // ==================================================================
  redes: [
    { t: 'ordenar', id: 'rf-red-1', e: 'Construye el comando que muestra las direcciones IP de la máquina.', k: ['ip', 'a'], r: 'ip a', x: '`ip a` (o `ip addr`) sustituye al antiguo `ifconfig`.' },
    { t: 'ordenar', id: 'rf-red-2', e: 'Construye el comando que envía exactamente 4 paquetes a `8.8.8.8`.', k: ['ping', '-c', '4', '8.8.8.8'], r: 'ping -c 4 8.8.8.8', x: 'Sin `-c` seguiría enviando indefinidamente hasta que lo pares.' },
    { t: 'ordenar', id: 'rf-red-3', e: 'Construye el comando que lista qué servicios están escuchando y qué proceso los abre.', k: ['ss', '-tulpn'], r: 'ss -tulpn', x: 'tcp, udp, listening, process y numeric. Es la auditoría básica de exposición.' },
    { t: 'completar', id: 'rf-red-4', e: 'Completa la opción de dig que devuelve solo la dirección, sin ruido.', p: 'dig ___ github.com', r: ['+short', 'short'], x: 'Sin ella, dig devuelve la consulta completa con todas sus secciones.' },
    { t: 'completar', id: 'rf-red-5', e: 'Completa el subcomando que muestra la tabla de rutas y el gateway.', p: 'ip ___', r: ['r', 'route'], x: 'La línea `default via` es la salida hacia fuera de tu red.' },
    { t: 'completar', id: 'rf-red-6', e: 'Completa la opción de curl que pide solo las cabeceras.', p: 'curl ___ https://example.com', r: ['-I', '--head'], x: 'Es mayúscula. Las cabeceras suelen delatar el producto y la versión del servidor.' },
    { t: 'respuesta', id: 'rf-red-7', e: 'En `192.168.1.50/24`, ¿qué indica el /24?', r: ['cuántos bits identifican a la red', 'los bits de red', 'la máscara', '24 bits de red'], x: 'Con /24, todo lo que empiece por `192.168.1.` está en tu misma red.' },
    { t: 'respuesta', id: 'rf-red-8', e: '`ping 8.8.8.8` funciona pero las webs no cargan. ¿Qué falla?', r: ['el DNS', 'DNS', 'la resolución de nombres'], x: 'Sales a internet por IP, así que lo que falla es traducir nombres a direcciones.' },
    { t: 'respuesta', id: 'rf-red-9', e: '¿Qué puerto usa HTTPS por defecto?', r: ['443'], x: '443 HTTPS, 80 HTTP, 22 SSH, 3306 MySQL, 5432 PostgreSQL.' },
    { t: 'quiz', id: 'rf-red-10', e: '¿Cuál es el primer peldaño al diagnosticar «no hay internet»?', o: ['Reiniciar el router', 'Comprobar si la máquina tiene IP con ip a', 'Cambiar el DNS', 'Reinstalar la red'], c: 1, x: 'Se va de dentro hacia fuera: IP, gateway, salida por IP, DNS y por último el servicio.' },
    { t: 'quiz', id: 'rf-red-11', e: '¿Para qué sirve el gateway?', o: ['Resolver nombres', 'Sacar el tráfico que va fuera de tu red', 'Asignar IPs', 'Cifrar la conexión'], c: 1, x: 'Si el destino no está en tu red, el paquete se le entrega a él para que lo saque.' },
    { t: 'quiz', id: 'rf-red-12', e: '¿Qué distingue una IP de un puerto?', o: ['Nada', 'La IP identifica la máquina y el puerto el servicio dentro de ella', 'El puerto identifica la máquina', 'La IP es más rápida'], c: 1, x: 'Por eso una sola máquina puede ofrecer web, SSH y base de datos a la vez.' },
  ],

  // ==================================================================
  ssh: [
    { t: 'ordenar', id: 'rf-ssh-1', e: 'Construye la conexión al servidor `servidor.local` con el usuario `deploy`.', k: ['ssh', 'deploy@servidor.local'], r: 'ssh deploy@servidor.local', x: 'Formato usuario@máquina. Si el puerto no es el 22, se añade `-p`.' },
    { t: 'ordenar', id: 'rf-ssh-2', e: 'Construye la copia de `notas.txt` al directorio `/tmp` del servidor.', k: ['scp', 'notas.txt', 'user@servidor.local:/tmp'], r: 'scp notas.txt user@servidor.local:/tmp', x: 'Los dos puntos separan la máquina de la ruta remota.' },
    { t: 'ordenar', id: 'rf-ssh-3', e: 'Construye el comando que genera un par de claves moderno.', k: ['ssh-keygen', '-t', 'ed25519'], r: 'ssh-keygen -t ed25519', x: 'ed25519 es corta, rápida y más segura que las RSA antiguas.' },
    { t: 'completar', id: 'rf-ssh-4', e: 'Completa los permisos que exige SSH en la carpeta `~/.ssh`.', p: 'chmod ___ ~/.ssh', r: ['700'], x: 'Y 600 para la clave privada. Con permisos más abiertos, SSH se niega a usarlas.' },
    { t: 'completar', id: 'rf-ssh-5', e: 'Completa el archivo del servidor donde acaba tu clave pública.', p: '~/.ssh/___', r: ['authorized_keys', 'authorized_keys2'], x: 'Ahí es donde el servidor busca las claves que tiene permitidas.' },
    { t: 'completar', id: 'rf-ssh-6', e: 'Completa la opción que indica un puerto distinto del 22.', p: 'ssh ___ 2222 user@host', r: ['-p'], x: 'En minúscula para el cliente; en `scp` es `-P` mayúscula.' },
    { t: 'respuesta', id: 'rf-ssh-7', e: '¿Cuál de las dos claves se copia al servidor?', r: ['la pública', 'pública', 'publica', 'la clave pública'], x: 'La privada no sale nunca de tu equipo. Si sale, se considera comprometida.' },
    { t: 'respuesta', id: 'rf-ssh-8', e: '¿Qué permisos debe tener la clave privada?', r: ['600'], x: 'Solo el dueño puede leerla y escribirla.' },
    { t: 'respuesta', id: 'rf-ssh-9', e: '¿En qué archivo se guardan los atajos de conexión del cliente SSH?', r: ['~/.ssh/config', '.ssh/config', 'config'], x: 'Ahí defines alias con su usuario, puerto y clave para no escribirlo todo cada vez.' },
    { t: 'quiz', id: 'rf-ssh-10', e: 'SSH avisa de que la huella del servidor ha cambiado. ¿Qué haces?', o: ['Ignorarlo', 'Investigarlo: podría ser alguien interceptando la conexión', 'Borrar la clave privada', 'Cambiar de puerto'], c: 1, x: 'Detecta un posible ataque de intermediario. Nunca se acepta sin comprobar por qué cambió.' },
    { t: 'quiz', id: 'rf-ssh-11', e: '¿Por qué las claves son más seguras que las contraseñas?', o: ['Son más cortas', 'No se pueden adivinar por fuerza bruta y no viaja ningún secreto', 'Se escriben más rápido', 'No caducan'], c: 1, x: 'El servidor lanza un desafío que solo resuelve quien tiene la privada.' },
    { t: 'quiz', id: 'rf-ssh-12', e: '¿Dónde se configura el servidor SSH, no el cliente?', o: ['~/.ssh/config', '/etc/ssh/sshd_config', '~/.bashrc', '/etc/hosts'], c: 1, x: 'La `d` de `sshd` es de *daemon*: la configuración del servicio que escucha.' },
  ],

  // ==================================================================
  systemd: [
    { t: 'ordenar', id: 'rf-sys-1', e: 'Construye el comando que consulta el estado del servicio nginx.', k: ['systemctl', 'status', 'nginx'], r: 'systemctl status nginx', x: 'Da estado, motivo del fallo, PID y las últimas líneas del registro de una vez.' },
    { t: 'ordenar', id: 'rf-sys-2', e: 'Construye el comando que arranca nginx y lo deja activado al inicio.', k: ['sudo', 'systemctl', 'enable', '--now', 'nginx'], r: 'sudo systemctl enable --now nginx', x: '`--now` hace las dos cosas: lo activa al arranque y lo lanza ahora mismo.' },
    { t: 'ordenar', id: 'rf-sys-3', e: 'Construye el comando que lee las 50 últimas líneas del registro de nginx.', k: ['journalctl', '-u', 'nginx', '-n', '50'], r: 'journalctl -u nginx -n 50', x: '`-u` filtra por unidad y `-n` limita cuántas líneas quieres ver.' },
    { t: 'completar', id: 'rf-sys-4', e: 'Completa el subcomando que lista los servicios rotos.', p: 'systemctl ___', r: ['list-failed', '--failed', 'list-units --failed'], x: 'Es lo primero que se mira cuando algo no responde en una máquina.' },
    { t: 'completar', id: 'rf-sys-5', e: 'Completa la opción de journalctl que muestra solo errores.', p: 'journalctl -p ___', r: ['err', '3', 'error'], x: 'Filtra por prioridad y descarta el ruido informativo.' },
    { t: 'completar', id: 'rf-sys-6', e: 'Completa la expresión de cron para ejecutar algo cada día a las 3:00.', p: '___ /usr/local/bin/backup.sh', r: ['0 3 * * *'], x: 'Minuto, hora, día del mes, mes y día de la semana. Las 3:00 son `0 3`, no `3 0`.' },
    { t: 'respuesta', id: 'rf-sys-7', e: '¿Cuál es la diferencia entre `start` y `enable`?', r: ['start lo arranca ahora y enable al encender', 'start ahora, enable al arranque', 'enable es al arrancar el sistema', 'start es ahora'], x: 'Olvidar `enable` es cómo un incidente vuelve al siguiente reinicio.' },
    { t: 'respuesta', id: 'rf-sys-8', e: '¿Qué significa `*/15` en el campo de minutos de cron?', r: ['cada 15 minutos', 'cada quince minutos'], x: 'La barra indica intervalo dentro del campo.' },
    { t: 'respuesta', id: 'rf-sys-9', e: '¿Por qué se usan rutas absolutas en las tareas de cron?', r: ['porque cron corre sin tu PATH', 'porque cron tiene un entorno mínimo', 'porque no hereda el PATH', 'cron no tiene PATH'], x: 'Es la causa número uno de «me funciona a mano pero no en cron».' },
    { t: 'quiz', id: 'rf-sys-10', e: 'Un servicio falla al arrancar. ¿Cuál es el primer comando?', o: ['reboot', 'systemctl status servicio', 'apt update', 'ps aux'], c: 1, x: 'Resume el estado y las últimas líneas del registro sin tener que buscar nada.' },
    { t: 'quiz', id: 'rf-sys-11', e: '¿Qué hace `journalctl -f`?', o: ['Filtra por fecha', 'Muestra el registro en vivo según llega', 'Borra el registro', 'Fuerza el arranque'], c: 1, x: 'Igual que `tail -f`, pero sobre el diario de systemd.' },
    { t: 'quiz', id: 'rf-sys-12', e: '¿Qué es exactamente un servicio?', o: ['Un archivo de configuración', 'Un programa que corre en segundo plano de forma permanente', 'Un usuario del sistema', 'Una carpeta protegida'], c: 1, x: 'El servidor web, la base de datos o SSH: arrancan al encender y systemd los vigila.' },
  ],

  // ==================================================================
  bash1: [
    { t: 'ordenar', id: 'rf-b1-1', e: 'Construye la primera línea que todo script necesita.', k: ['#!/bin/bash'], r: '#!/bin/bash', x: 'El shebang dice al sistema con qué intérprete ejecutar el archivo.' },
    { t: 'ordenar', id: 'rf-b1-2', e: 'Construye el comando que da permiso de ejecución a un script.', k: ['chmod', '+x', 'script.sh'], r: 'chmod +x script.sh', x: 'Sin el bit `x`, al lanzarlo responde `Permission denied`.' },
    { t: 'ordenar', id: 'rf-b1-3', e: 'Construye el bucle que imprime los números del 1 al 3.', k: ['for', 'i', 'in', '1 2 3;', 'do', 'echo $i;', 'done'], r: 'for i in 1 2 3; do echo $i; done', x: 'La estructura es siempre `for variable in lista; do … done`.' },
    { t: 'completar', id: 'rf-b1-4', e: 'Completa la asignación correcta de una variable en bash.', p: 'nombre___"Ana"', r: ['=', '= '], x: 'Sin espacios alrededor del igual. Con espacios, bash cree que `nombre` es un comando.' },
    { t: 'completar', id: 'rf-b1-5', e: 'Completa la variable que guarda el código de salida del último comando.', p: 'echo ___', r: ['$?'], x: '0 significa éxito; cualquier otro valor, algún tipo de fallo.' },
    { t: 'completar', id: 'rf-b1-6', e: 'Completa la prueba que comprueba si existe un archivo.', p: 'if [ ___ "$1" ]; then', r: ['-f', '-e'], x: '`-f` archivo normal, `-d` carpeta, `-e` existe sea lo que sea.' },
    { t: 'respuesta', id: 'rf-b1-7', e: '¿Qué contiene `$1` dentro de un script?', r: ['el primer argumento', 'primer argumento', 'el primer parámetro'], x: '`$0` es el nombre del script y `$#` cuántos argumentos recibió.' },
    { t: 'respuesta', id: 'rf-b1-8', e: '¿Por qué `[-f archivo]` da error?', r: ['faltan espacios', 'porque faltan espacios dentro de los corchetes', 'faltan los espacios'], x: '`[` es en realidad un comando, así que necesita espacios: `[ -f archivo ]`.' },
    { t: 'respuesta', id: 'rf-b1-9', e: '¿Qué hay que poner delante para ejecutar un script de la carpeta actual?', r: ['./', 'punto barra'], x: 'Sin `./`, bash lo busca en el PATH y no en donde estás.' },
    { t: 'quiz', id: 'rf-b1-10', e: '¿Qué diferencia hay entre comillas simples y dobles?', o: ['Ninguna', 'Las dobles expanden variables y las simples no', 'Las simples expanden variables', 'Las simples son para números'], c: 1, x: 'Por eso los programas de awk van entre comillas simples: para que `$1` llegue intacto.' },
    { t: 'quiz', id: 'rf-b1-11', e: '¿Para qué sirve `seq 1 10`?', o: ['Ordena', 'Genera los números del 1 al 10', 'Cuenta archivos', 'Espera 10 segundos'], c: 1, x: 'Muy usado junto a `for` para repetir algo un número fijo de veces.' },
    { t: 'quiz', id: 'rf-b1-12', e: '¿Qué hace `while read linea; do … done < archivo`?', o: ['Borra el archivo', 'Recorre el archivo línea a línea', 'Cuenta las líneas', 'Ordena el archivo'], c: 1, x: 'Es la forma estándar de procesar un archivo línea por línea en bash.' },
  ],

  // ==================================================================
  bash2: [
    { t: 'ordenar', id: 'rf-b2-1', e: 'Construye la línea que protege un script serio contra fallos silenciosos.', k: ['set', '-euo', 'pipefail'], r: 'set -euo pipefail', x: '`-e` para al primer error, `-u` falla si falta una variable y `-o pipefail` vigila los pipes.' },
    { t: 'ordenar', id: 'rf-b2-2', e: 'Construye la captura de la salida de un comando en una variable.', k: ['total=$(ls', '|', 'wc', '-l)'], r: 'total=$(ls | wc -l)', x: 'Sin `$( )` guardarías el texto literal en vez del resultado.' },
    { t: 'ordenar', id: 'rf-b2-3', e: 'Construye la línea que manda un mensaje de error al canal correcto.', k: ['echo', '"ERROR"', '>&2'], r: 'echo "ERROR" >&2', x: 'Los fallos van a stderr para que quien use tu script pueda separarlos de los datos.' },
    { t: 'completar', id: 'rf-b2-4', e: 'Completa la sintaxis de valor por defecto para el segundo argumento.', p: 'carpeta="${2___.}"', r: [':-', '-'], x: '`${2:-.}` significa «el segundo argumento, o un punto si no hay».' },
    { t: 'completar', id: 'rf-b2-5', e: 'Completa la opción de set que imprime cada comando antes de ejecutarlo.', p: 'set ___', r: ['-x'], x: 'Es el mejor depurador de bash: muestra las líneas con las variables ya sustituidas.' },
    { t: 'completar', id: 'rf-b2-6', e: 'Completa la definición de una función llamada `saludar`.', p: 'saludar___ {', r: ['()', '() '], x: 'Los paréntesis vacíos marcan que es una función; sus argumentos también son `$1`, `$2`…' },
    { t: 'respuesta', id: 'rf-b2-7', e: '¿Por qué se entrecomillan siempre las variables?', r: ['para que los valores con espacios no se partan', 'por los espacios', 'para que no se parta en varios argumentos', 'para proteger los espacios'], x: '`rm $archivo` con un nombre que tenga espacios borra cosas que no querías.' },
    { t: 'respuesta', id: 'rf-b2-8', e: '¿Qué hace exactamente `set -e`?', r: ['detiene el script al primer error', 'para al primer error', 'para el script si algo falla'], x: 'Sin él, el script sigue como si nada aunque un comando haya fallado.' },
    { t: 'respuesta', id: 'rf-b2-9', e: '¿A qué canal deben ir los mensajes de error de un script?', r: ['stderr', 'a stderr', '2', 'al 2'], x: 'Se consigue con `>&2` al final del echo.' },
    { t: 'quiz', id: 'rf-b2-10', e: '¿Qué hace `trap limpiar EXIT`?', o: ['Borra el script', 'Ejecuta `limpiar` al salir, pase lo que pase', 'Captura errores de red', 'Ignora las señales'], c: 1, x: 'Sirve para borrar archivos temporales aunque el script muera a mitad.' },
    { t: 'quiz', id: 'rf-b2-11', e: '¿Qué significa `local` dentro de una función?', o: ['La ejecuta en local', 'La variable solo existe dentro de la función', 'La hace de solo lectura', 'La exporta'], c: 1, x: 'Evita pisar variables del resto del script sin darte cuenta.' },
    { t: 'quiz', id: 'rf-b2-12', e: '¿Para qué sirve `-o pipefail`?', o: ['Acelera los pipes', 'Hace que un fallo en medio de un pipe cuente como fallo', 'Ordena la salida', 'Evita los pipes'], c: 1, x: 'Sin él, solo cuenta el código del último comando de la cadena y los errores intermedios se pierden.' },
  ],

  // ==================================================================
  cifrado: [
    { t: 'ordenar', id: 'rf-cif-1', e: 'Construye el comando que calcula la huella SHA-256 de un archivo.', k: ['sha256sum', 'imagen.iso'], r: 'sha256sum imagen.iso', x: 'Cambia un solo byte del archivo y la huella cambia por completo.' },
    { t: 'ordenar', id: 'rf-cif-2', e: 'Construye el comando que cifra `secreto.txt` con contraseña.', k: ['gpg', '-c', 'secreto.txt'], r: 'gpg -c secreto.txt', x: '`-c` es cifrado simétrico: una sola contraseña cifra y descifra.' },
    { t: 'ordenar', id: 'rf-cif-3', e: 'Construye la verificación de un archivo contra su lista de sumas.', k: ['sha256sum', '-c', 'sumas.txt'], r: 'sha256sum -c sumas.txt', x: 'Responde OK o FAILED por cada archivo de la lista.' },
    { t: 'completar', id: 'rf-cif-4', e: 'Completa la opción que descodifica una cadena en base64.', p: 'base64 ___', r: ['-d', '--decode'], x: 'Base64 no protege nada: cualquiera lo revierte en un segundo.' },
    { t: 'completar', id: 'rf-cif-5', e: 'Completa la opción de gpg que descifra un archivo.', p: 'gpg ___ secreto.txt.gpg', r: ['-d', '--decrypt'], x: 'Devuelve el contenido original por la salida estándar.' },
    { t: 'completar', id: 'rf-cif-6', e: 'Completa el algoritmo de hash recomendado hoy.', p: '___sum archivo', r: ['sha256', 'sha512'], x: 'MD5 y SHA-1 están rotos: se pueden fabricar dos archivos con el mismo hash.' },
    { t: 'respuesta', id: 'rf-cif-7', e: '¿Se puede revertir un hash SHA-256 para recuperar el archivo?', r: ['no', 'No'], x: 'Es de una sola dirección. Por eso sirve para guardar contraseñas.' },
    { t: 'respuesta', id: 'rf-cif-8', e: '¿Base64 es cifrado?', r: ['no', 'No'], x: 'Es codificación: cambia el formato, no protege nada. Es la confusión más común.' },
    { t: 'respuesta', id: 'rf-cif-9', e: 'En cifrado asimétrico, ¿con qué clave cifras un mensaje para otra persona?', r: ['la pública', 'con su clave pública', 'pública', 'publica'], x: 'Solo su clave privada podrá abrirlo. Es el mismo esquema que usa SSH.' },
    { t: 'quiz', id: 'rf-cif-10', e: '¿Por qué no se debe usar MD5 para seguridad?', o: ['Es lento', 'Se pueden fabricar colisiones', 'Da hashes muy largos', 'Ya no existe'], c: 1, x: 'Sigue valiendo para detectar corrupción accidental, pero no frente a un atacante.' },
    { t: 'quiz', id: 'rf-cif-11', e: 'Encuentras `cGFzc3dvcmQ=` en un archivo de configuración. ¿Qué es?', o: ['Un hash seguro', 'Texto en base64, fácilmente reversible', 'Una clave privada', 'Un identificador aleatorio'], c: 1, x: 'El `=` final delata base64. Encontrar credenciales así es un hallazgo clásico en auditorías.' },
    { t: 'quiz', id: 'rf-cif-12', e: '¿Para qué sirve firmar con la clave privada?', o: ['Para cifrar más rápido', 'Para que cualquiera compruebe que el archivo es tuyo y no fue alterado', 'Para comprimir', 'Para generar contraseñas'], c: 1, x: 'Así verifica `apt` que los paquetes vienen de quien dicen venir.' },
  ],

  // ==================================================================
  hardening: [
    { t: 'ordenar', id: 'rf-har-1', e: 'Construye la política que deniega todo el tráfico entrante por defecto.', k: ['sudo', 'ufw', 'default', 'deny', 'incoming'], r: 'sudo ufw default deny incoming', x: 'No se trata de bloquear lo malo: se bloquea todo y se abre solo lo necesario.' },
    { t: 'ordenar', id: 'rf-har-2', e: 'Construye la regla que abre el puerto de SSH.', k: ['sudo', 'ufw', 'allow', '22/tcp'], r: 'sudo ufw allow 22/tcp', x: 'Esto va SIEMPRE antes de activar el cortafuegos en un servidor remoto.' },
    { t: 'ordenar', id: 'rf-har-3', e: 'Construye la comprobación de si SSH permite entrar como root.', k: ['grep', 'PermitRootLogin', '/etc/ssh/sshd_config'], r: 'grep PermitRootLogin /etc/ssh/sshd_config', x: 'Debe estar en `no`: nadie debería entrar directamente como administrador.' },
    { t: 'completar', id: 'rf-har-4', e: 'Completa la directiva que desactiva el acceso por contraseña en SSH.', p: 'PasswordAuthentication ___', r: ['no'], x: 'Obliga a usar claves, con lo que la fuerza bruta deja de ser viable.' },
    { t: 'completar', id: 'rf-har-5', e: 'Completa el comando que lista las cuentas con shell real.', p: 'grep -v ___ /etc/passwd', r: ['nologin', '/usr/sbin/nologin'], x: 'Las cuentas de servicio llevan `nologin` y no pueden iniciar sesión.' },
    { t: 'completar', id: 'rf-har-6', e: 'Completa el comando que desactiva y para un servicio innecesario.', p: 'sudo systemctl disable ___ servicio', r: ['--now'], x: 'Lo que no está encendido no se puede atacar. Es la medida más barata que existe.' },
    { t: 'respuesta', id: 'rf-har-7', e: '¿Cuál es la política correcta de un cortafuegos?', r: ['denegar todo y abrir lo necesario', 'denegar por defecto', 'denegar todo por defecto', 'bloquear todo y abrir lo justo'], x: 'Enumerar todo lo malo es imposible; enumerar lo que necesitas, no.' },
    { t: 'respuesta', id: 'rf-har-8', e: '¿Qué herramienta bloquea automáticamente las IP que fallan al autenticarse?', r: ['fail2ban', 'Fail2ban'], x: 'Lee los registros y banea al atacante sin que tengas que mirar tú.' },
    { t: 'respuesta', id: 'rf-har-9', e: '¿Qué precaución hay que tomar antes de activar ufw en un servidor remoto?', r: ['abrir el puerto SSH antes', 'permitir SSH primero', 'abrir SSH', 'permitir el puerto 22'], x: 'Si no, acabas de dejarte fuera de tu propia máquina.' },
    { t: 'quiz', id: 'rf-har-10', e: '¿Qué comando inventaría lo que está expuesto en una máquina?', o: ['ls -l', 'ss -tulpn', 'df -h', 'uname -a'], c: 1, x: 'Cada puerto en escucha es una puerta; lo primero es saber cuántas hay.' },
    { t: 'quiz', id: 'rf-har-11', e: '¿Por qué ayuda cambiar el puerto de SSH?', o: ['Lo hace indescifrable', 'Elimina casi todo el ruido de los escaneos automáticos', 'Es más rápido', 'No sirve de nada'], c: 1, x: 'No es seguridad real por sí solo, pero reduce muchísimo el ruido en los registros.' },
    { t: 'quiz', id: 'rf-har-12', e: '¿En qué consiste el principio de mínimo privilegio?', o: ['Dar acceso solo a los jefes', 'Conceder únicamente los permisos imprescindibles', 'Usar siempre root', 'Cifrarlo todo'], c: 1, x: 'Es la idea que ordena permisos, capabilities, sudoers y cortafuegos.' },
  ],

  // ==================================================================
  analisis: [
    { t: 'ordenar', id: 'rf-ana-1', e: 'Construye la búsqueda de intentos fallidos de autenticación.', k: ['sudo', 'grep', '"Failed password"', '/var/log/auth.log'], r: 'sudo grep "Failed password" /var/log/auth.log', x: 'Cada intento fallido de SSH deja esa cadena exacta en el registro.' },
    { t: 'ordenar', id: 'rf-ana-2', e: 'Construye el ranking de IPs atacantes a partir de los fallos.', k: ['awk', "'{print $NF}'", '|', 'sort', '|', 'uniq', '-c', '|', 'sort', '-rn'], r: "awk '{print $NF}' | sort | uniq -c | sort -rn", x: 'Extraer, ordenar, contar y ordenar por cantidad: la cadena que resuelve casi todo análisis.' },
    { t: 'ordenar', id: 'rf-ana-3', e: 'Construye la búsqueda de archivos que puede escribir cualquiera.', k: ['find', '/', '-perm', '-002', '-type', 'f', '2>/dev/null'], r: 'find / -perm -002 -type f 2>/dev/null', x: '002 es el permiso de escritura para «otros», y es un riesgo claro.' },
    { t: 'completar', id: 'rf-ana-4', e: 'Completa la palabra que aparece cuando un acceso SSH sí tuvo éxito.', p: 'grep ___ /var/log/auth.log', r: ['Accepted', 'accepted'], x: 'Si hay muchos «Failed» y luego un «Accepted», el ataque funcionó.' },
    { t: 'completar', id: 'rf-ana-5', e: 'Completa el campo de awk que devuelve la última columna, donde suele ir la IP.', p: "awk '{print ___}'", r: ['$NF'], x: 'La IP del atacante está al final de la línea del registro.' },
    { t: 'completar', id: 'rf-ana-6', e: 'Completa el comando que lista los últimos accesos correctos al sistema.', p: '___', r: ['last'], x: 'Y `lastb` muestra los fallidos, aunque requiere privilegios.' },
    { t: 'respuesta', id: 'rf-ana-7', e: 'Muchos «Failed password» seguidos desde una misma IP. ¿Qué es?', r: ['un ataque de fuerza bruta', 'fuerza bruta', 'un ataque automatizado', 'un bot'], x: 'Probando usuarios genéricos en segundos: es un robot, no una persona despistada.' },
    { t: 'respuesta', id: 'rf-ana-8', e: '¿Qué comando muestra quién está conectado ahora mismo?', r: ['who', 'w'], x: '`w` añade además qué está haciendo cada uno.' },
    { t: 'respuesta', id: 'rf-ana-9', e: '¿Para qué sirve `sha256sum` en una investigación?', r: ['para comprobar si un binario fue modificado', 'para ver si un archivo cambió', 'para verificar integridad', 'comprobar integridad'], x: 'Si el hash no coincide con el del paquete original, el binario ha sido alterado.' },
    { t: 'quiz', id: 'rf-ana-10', e: 'Tras muchos fallos encuentras un «Accepted». ¿Qué significa?', o: ['Que el ataque falló', 'Que el atacante consiguió entrar', 'Que se reinició SSH', 'Nada relevante'], c: 1, x: 'Es la señal de compromiso: hay que investigar qué hizo esa sesión.' },
    { t: 'quiz', id: 'rf-ana-11', e: '¿Qué se busca al revisar procesos tras un incidente?', o: ['Los más antiguos', 'Consumos y nombres que no encajan con lo esperado', 'Los de root solamente', 'Los que usan poca RAM'], c: 1, x: 'Lo que delata no es una lista larga, es un elemento fuera de sitio.' },
    { t: 'quiz', id: 'rf-ana-12', e: '¿Qué archivo de registro guarda los intentos de autenticación?', o: ['/var/log/syslog', '/var/log/auth.log', '/var/log/kern.log', '/etc/passwd'], c: 1, x: 'En Debian y Ubuntu es `auth.log`; en Red Hat, `secure`.' },
  ],

  // ==================================================================
  etico: [
    { t: 'ordenar', id: 'rf-eti-1', e: 'Construye el comando que identifica la distribución y su versión.', k: ['cat', '/etc/os-release'], r: 'cat /etc/os-release', x: 'Primer paso de cualquier enumeración: saber sobre qué sistema estás.' },
    { t: 'ordenar', id: 'rf-eti-2', e: 'Construye el comando que muestra qué puedes ejecutar como root.', k: ['sudo', '-l'], r: 'sudo -l', x: 'Es la comprobación más rentable de la enumeración local.' },
    { t: 'ordenar', id: 'rf-eti-3', e: 'Construye el comando que obtiene las cabeceras de un servidor web.', k: ['curl', '-I', 'http://localhost'], r: 'curl -I http://localhost', x: 'La cabecera `Server:` suele delatar producto y versión.' },
    { t: 'completar', id: 'rf-eti-4', e: 'Completa la opción de uname que da la versión exacta del kernel.', p: 'uname ___', r: ['-r'], x: 'Dato clave para saber si al sistema le afecta alguna vulnerabilidad conocida.' },
    { t: 'completar', id: 'rf-eti-5', e: 'Completa el archivo que lista las tareas programadas del sistema.', p: 'cat /etc/___', r: ['crontab'], x: 'Una tarea de cron que ejecute un script escribible por ti es una vía directa a root.' },
    { t: 'completar', id: 'rf-eti-6', e: 'Completa lo único que separa una auditoría legal de un delito.', p: '___ expresa y por escrito', r: ['autorización', 'autorizacion', 'la autorización'], x: 'La técnica es la misma; lo que cambia es el permiso. Sin papel, no se toca nada.' },
    { t: 'respuesta', id: 'rf-eti-7', e: '¿Cuál es el producto final de una auditoría profesional?', r: ['el informe', 'un informe', 'el informe de hallazgos'], x: 'Al cliente no le sirve una consola con root: le sirve saber qué falla y cómo se arregla.' },
    { t: 'respuesta', id: 'rf-eti-8', e: '¿Qué fase va justo antes de la explotación?', r: ['el análisis de vulnerabilidades', 'análisis', 'analisis', 'el análisis'], x: 'Primero enumeras, luego analizas qué de eso es explotable, y solo entonces se prueba.' },
    { t: 'respuesta', id: 'rf-eti-9', e: 'Menciona un sitio donde se puede practicar hacking legalmente.', r: ['HackTheBox', 'TryHackMe', 'VulnHub', 'PortSwigger', 'hackthebox', 'tryhackme'], x: 'Laboratorios hechos para eso, CTFs y programas públicos de recompensas respetando su alcance.' },
    { t: 'quiz', id: 'rf-eti-10', e: '¿Qué necesitas antes de auditar un sistema que no es tuyo?', o: ['Buenas intenciones', 'Autorización expresa y por escrito', 'Avisar después', 'Nada si no rompes nada'], c: 1, x: 'Sin autorización previa es delito, aunque no causes ningún daño.' },
    { t: 'quiz', id: 'rf-eti-11', e: '¿Por qué se auditan los binarios SUID en una enumeración local?', o: ['Para liberar espacio', 'Porque uno mal elegido permite escalar a root', 'Para acelerar el sistema', 'Por costumbre'], c: 1, x: 'Se ejecutan con los permisos de su dueño; si ese dueño es root, es acceso total.' },
    { t: 'quiz', id: 'rf-eti-12', e: '¿Qué tienen en común todos los comandos de enumeración que has visto?', o: ['Son comandos nuevos', 'Son los mismos de siempre, con otra pregunta', 'Necesitan root', 'Solo funcionan en Kali'], c: 1, x: 'Auditar no es saber comandos raros: es mirar lo de siempre preguntando qué está mal configurado.' },
  ],
};
