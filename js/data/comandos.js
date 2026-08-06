// Chuletario: todos los comandos con sintaxis, opciones y ejemplo.
// Consultable sin conexión desde cualquier punto de la app.

export const CATEGORIAS = [
  {
    id: 'navegacion',
    nombre: 'Navegación',
    comandos: [
      { n: 'pwd', q: 'Dice en qué carpeta estás', s: 'pwd', o: [], e: 'pwd  →  /home/user' },
      { n: 'ls', q: 'Lista el contenido de una carpeta', s: 'ls [opciones] [ruta]', o: [['-l', 'formato largo: permisos, dueño, tamaño'], ['-a', 'incluye los ocultos'], ['-h', 'tamaños legibles'], ['-t', 'ordena por fecha'], ['-S', 'ordena por tamaño'], ['-R', 'entra en subcarpetas']], e: 'ls -lah /etc' },
      { n: 'cd', q: 'Cambia de carpeta', s: 'cd [ruta]', o: [['..', 'sube un nivel'], ['~', 'tu carpeta personal'], ['-', 'la carpeta anterior']], e: 'cd /var/log' },
      { n: 'tree', q: 'Dibuja la estructura de carpetas', s: 'tree [opciones] [ruta]', o: [['-d', 'solo carpetas'], ['-a', 'incluye ocultos'], ['-L n', 'limita la profundidad']], e: 'tree -d proyectos' },
    ],
  },
  {
    id: 'archivos',
    nombre: 'Archivos',
    comandos: [
      { n: 'touch', q: 'Crea un archivo vacío o actualiza su fecha', s: 'touch archivo...', o: [], e: 'touch notas.txt' },
      { n: 'mkdir', q: 'Crea carpetas', s: 'mkdir [opciones] carpeta...', o: [['-p', 'crea también los niveles intermedios'], ['-m modo', 'con permisos concretos']], e: 'mkdir -p a/b/c' },
      { n: 'rmdir', q: 'Borra carpetas vacías', s: 'rmdir carpeta...', o: [], e: 'rmdir vacia' },
      { n: 'rm', q: 'Borra archivos y carpetas (sin papelera)', s: 'rm [opciones] ruta...', o: [['-r', 'recursivo, para carpetas'], ['-f', 'no protesta si no existe'], ['-i', 'pregunta antes de cada uno']], e: 'rm -r descargas' },
      { n: 'cp', q: 'Copia archivos y carpetas', s: 'cp [opciones] origen destino', o: [['-r', 'recursivo, para carpetas'], ['-a', 'conserva permisos y fechas'], ['-i', 'pregunta antes de sobrescribir']], e: 'cp -r web web-backup' },
      { n: 'mv', q: 'Mueve o renombra', s: 'mv origen destino', o: [['-i', 'pregunta antes de sobrescribir'], ['-n', 'nunca sobrescribe']], e: 'mv viejo.txt nuevo.txt' },
      { n: 'ln', q: 'Crea enlaces', s: 'ln [-s] destino nombre', o: [['-s', 'enlace simbólico (el habitual)']], e: 'ln -s /var/log/syslog registro' },
      { n: 'file', q: 'Dice qué tipo de archivo es', s: 'file archivo...', o: [], e: 'file script.sh' },
      { n: 'stat', q: 'Metadatos completos de un archivo', s: 'stat archivo', o: [], e: 'stat notas.txt' },
      { n: 'du', q: 'Cuánto ocupa una carpeta', s: 'du [opciones] [ruta]', o: [['-s', 'solo el total'], ['-h', 'legible']], e: 'du -sh *' },
      { n: 'df', q: 'Espacio libre por partición', s: 'df [-h]', o: [['-h', 'legible']], e: 'df -h' },
    ],
  },
  {
    id: 'texto',
    nombre: 'Ver y editar texto',
    comandos: [
      { n: 'cat', q: 'Muestra el contenido completo', s: 'cat [opciones] archivo...', o: [['-n', 'numera las líneas'], ['-A', 'muestra caracteres invisibles']], e: 'cat -n /etc/passwd' },
      { n: 'less', q: 'Ver archivos largos navegando', s: 'less archivo', o: [['/texto', 'buscar dentro'], ['q', 'salir']], e: 'less /var/log/syslog' },
      { n: 'head', q: 'Las primeras líneas', s: 'head [-n N] archivo', o: [['-n N', 'cuántas líneas']], e: 'head -n 5 acceso.log' },
      { n: 'tail', q: 'Las últimas líneas', s: 'tail [-n N] archivo', o: [['-n N', 'cuántas líneas'], ['-f', 'sigue mostrando lo nuevo en vivo']], e: 'tail -f /var/log/syslog' },
      { n: 'wc', q: 'Cuenta líneas, palabras y bytes', s: 'wc [opciones] archivo', o: [['-l', 'solo líneas'], ['-w', 'solo palabras'], ['-c', 'solo bytes']], e: 'wc -l /etc/passwd' },
      { n: 'nl', q: 'Numera las líneas', s: 'nl archivo', o: [], e: 'nl script.sh' },
      { n: 'echo', q: 'Imprime texto', s: 'echo [-n] texto', o: [['-n', 'sin salto de línea final'], ['-e', 'interpreta \\n y \\t']], e: 'echo "hola" > a.txt' },
      { n: 'tee', q: 'Muestra y guarda a la vez', s: 'comando | tee [-a] archivo', o: [['-a', 'añade en vez de sobrescribir']], e: 'ls -l | tee listado.txt' },
      { n: 'diff', q: 'Compara dos archivos', s: 'diff a b', o: [['-u', 'formato unificado']], e: 'diff antes.txt despues.txt' },
    ],
  },
  {
    id: 'buscar',
    nombre: 'Buscar',
    comandos: [
      { n: 'find', q: 'Busca archivos por cualquier criterio', s: 'find ruta [condiciones] [acción]', o: [['-name "p"', 'por nombre, admite comodines'], ['-iname', 'sin distinguir mayúsculas'], ['-type f|d', 'archivo o carpeta'], ['-size +1M', 'por tamaño'], ['-perm -4000', 'por permisos (SUID)'], ['-user u', 'por dueño'], ['-mmin -60', 'modificado hace menos de 60 min'], ['-delete', 'borra lo encontrado'], ['-exec cmd {} ;', 'ejecuta un comando por resultado']], e: 'find / -perm -4000 2>/dev/null' },
      { n: 'grep', q: 'Busca texto dentro de archivos', s: 'grep [opciones] patrón [archivo...]', o: [['-i', 'ignora mayúsculas'], ['-r', 'recursivo por carpetas'], ['-n', 'muestra el número de línea'], ['-v', 'invierte: lo que NO coincide'], ['-c', 'solo cuenta'], ['-l', 'solo nombres de archivo'], ['-w', 'palabra completa'], ['-E', 'expresiones regulares extendidas']], e: 'grep -rn TODO proyectos/' },
      { n: 'which', q: 'Dónde está instalado un programa', s: 'which programa', o: [], e: 'which python3' },
      { n: 'whereis', q: 'Binario, fuentes y manual', s: 'whereis programa', o: [], e: 'whereis nginx' },
      { n: 'xargs', q: 'Convierte la entrada en argumentos', s: 'comando | xargs [opciones] comando2', o: [['-n N', 'N argumentos por llamada'], ['-I {}', 'usa {} como marcador']], e: 'find . -name "*.log" | xargs rm' },
    ],
  },
  {
    id: 'permisos',
    nombre: 'Permisos',
    comandos: [
      { n: 'chmod', q: 'Cambia los permisos', s: 'chmod [-R] modo ruta...', o: [['u g o a', 'dueño, grupo, otros, todos'], ['+ - =', 'añadir, quitar, fijar'], ['r w x', 'leer (4), escribir (2), ejecutar (1)'], ['-R', 'recursivo'], ['4000', 'SUID'], ['2000', 'SGID'], ['1000', 'sticky bit']], e: 'chmod 755 script.sh' },
      { n: 'chown', q: 'Cambia el dueño y el grupo', s: 'chown [-R] usuario[:grupo] ruta', o: [['-R', 'recursivo']], e: 'sudo chown ana:desarrollo informe.txt' },
      { n: 'chgrp', q: 'Cambia solo el grupo', s: 'chgrp [-R] grupo ruta', o: [['-R', 'recursivo']], e: 'chgrp desarrollo compartido' },
      { n: 'umask', q: 'Permisos por defecto de lo que creas', s: 'umask [valor]', o: [], e: 'umask 022' },
      { n: 'id', q: 'Tu usuario, grupo y grupos secundarios', s: 'id [usuario]', o: [['-u', 'solo el uid'], ['-g', 'solo el gid']], e: 'id' },
      { n: 'whoami', q: 'Con qué usuario estás', s: 'whoami', o: [], e: 'whoami' },
      { n: 'sudo', q: 'Ejecuta un comando como administrador', s: 'sudo [opciones] comando', o: [['-l', 'qué puedes ejecutar como root'], ['-i', 'abre una sesión de root'], ['-u u', 'como otro usuario']], e: 'sudo systemctl restart nginx' },
      { n: 'su', q: 'Cambia de usuario', s: 'su [-] [usuario]', o: [['-', 'carga también su entorno']], e: 'su - ana' },
      { n: 'getcap', q: 'Ver capabilities de un binario', s: 'getcap [-r] ruta', o: [['-r', 'recursivo']], e: 'getcap -r / 2>/dev/null' },
      { n: 'setcap', q: 'Asignar capabilities', s: 'setcap caps archivo', o: [], e: 'sudo setcap cap_net_raw+ep /usr/bin/ping' },
    ],
  },
  {
    id: 'procesos',
    nombre: 'Procesos',
    comandos: [
      { n: 'ps', q: 'Lista los procesos', s: 'ps [opciones]', o: [['aux', 'todos, con detalle'], ['-ef', 'formato alternativo completo']], e: 'ps aux | grep nginx' },
      { n: 'top', q: 'Monitor de procesos en vivo', s: 'top', o: [], e: 'top' },
      { n: 'kill', q: 'Envía una señal a un proceso', s: 'kill [-señal] PID', o: [['-15', 'termina ordenadamente (por defecto)'], ['-9', 'mata sin contemplaciones']], e: 'kill 1533' },
      { n: 'killall', q: 'Termina procesos por nombre', s: 'killall nombre', o: [], e: 'killall nginx' },
      { n: 'pgrep', q: 'Busca PIDs por nombre', s: 'pgrep [-l] patrón', o: [['-l', 'muestra también el nombre']], e: 'pgrep -l postgres' },
      { n: 'free', q: 'Memoria usada y disponible', s: 'free [-h]', o: [['-h', 'legible']], e: 'free -h' },
      { n: 'uptime', q: 'Tiempo encendido y carga media', s: 'uptime', o: [], e: 'uptime' },
      { n: 'nohup', q: 'Ejecuta algo que sobrevive al cierre de sesión', s: 'nohup comando &', o: [], e: 'nohup ./tarea.sh &' },
    ],
  },
  {
    id: 'flujos',
    nombre: 'Flujos y redirección',
    comandos: [
      { n: '>', q: 'Redirige la salida a un archivo (sobrescribe)', s: 'comando > archivo', o: [], e: 'ls -l > listado.txt' },
      { n: '>>', q: 'Redirige añadiendo al final', s: 'comando >> archivo', o: [], e: 'echo linea >> registro.txt' },
      { n: '2>', q: 'Redirige solo los errores', s: 'comando 2> archivo', o: [], e: 'find / -name x 2> errores.txt' },
      { n: '2>&1', q: 'Manda los errores donde va la salida', s: 'comando > todo.log 2>&1', o: [], e: 'script.sh > todo.log 2>&1' },
      { n: '/dev/null', q: 'Descarta todo lo que se le escriba', s: 'comando 2>/dev/null', o: [], e: 'find / -name x 2>/dev/null' },
      { n: '|', q: 'Conecta la salida de un comando con la entrada del siguiente', s: 'comando1 | comando2', o: [], e: 'ps aux | grep nginx | wc -l' },
      { n: '&&', q: 'Ejecuta el segundo solo si el primero tuvo éxito', s: 'cmd1 && cmd2', o: [], e: 'mkdir p && cd p' },
      { n: '||', q: 'Ejecuta el segundo solo si el primero falló', s: 'cmd1 || cmd2', o: [], e: 'test -f a || echo "no existe"' },
    ],
  },
  {
    id: 'filtros',
    nombre: 'Filtros de texto',
    comandos: [
      { n: 'sort', q: 'Ordena líneas', s: 'sort [opciones] archivo', o: [['-n', 'orden numérico'], ['-r', 'al revés'], ['-u', 'sin duplicados'], ['-k N', 'por la columna N']], e: 'sort -rn numeros.txt' },
      { n: 'uniq', q: 'Colapsa líneas repetidas consecutivas', s: 'uniq [opciones]', o: [['-c', 'cuenta repeticiones'], ['-d', 'solo los repetidos'], ['-u', 'solo los únicos']], e: 'sort log | uniq -c | sort -rn' },
      { n: 'cut', q: 'Extrae columnas', s: 'cut -d sep -f campos archivo', o: [['-d', 'separador'], ['-f', 'qué campos'], ['-c', 'por caracteres']], e: 'cut -d: -f1 /etc/passwd' },
      { n: 'tr', q: 'Sustituye o borra caracteres', s: 'tr [opciones] set1 [set2]', o: [['-d', 'borra los del set1'], ['-s', 'colapsa repetidos']], e: 'echo HOLA | tr A-Z a-z' },
      { n: 'awk', q: 'Procesa texto por columnas', s: "awk [-F sep] 'programa' archivo", o: [['-F', 'separador de campos'], ['$1 $2', 'las columnas'], ['$NF', 'la última columna'], ['NR', 'número de línea'], ['END{}', 'bloque final']], e: "awk -F, '{s+=$4} END {print s}' ventas.csv" },
      { n: 'sed', q: 'Edita texto en flujo', s: "sed [-i] 'expresión' archivo", o: [['s/a/b/g', 'sustituye a por b'], ['-i', 'modifica el archivo original'], ['Nd', 'borra la línea N'], ['-n Np', 'muestra solo la línea N']], e: "sed 's/error/ERROR/g' log" },
    ],
  },
  {
    id: 'paquetes',
    nombre: 'Paquetes',
    comandos: [
      { n: 'apt', q: 'Gestor de paquetes de Debian y Ubuntu', s: 'apt subcomando [paquete]', o: [['update', 'refresca el catálogo'], ['upgrade', 'actualiza lo instalado'], ['install', 'instala'], ['remove', 'desinstala'], ['search', 'busca'], ['show', 'información del paquete']], e: 'sudo apt install htop' },
      { n: 'dpkg', q: 'Consulta paquetes instalados en Debian', s: 'dpkg opción [paquete]', o: [['-l', 'lista lo instalado'], ['-L', 'qué archivos instaló'], ['-s', 'estado y versión']], e: 'dpkg -L nginx' },
      { n: 'dnf', q: 'Gestor de Fedora y RHEL', s: 'dnf subcomando [paquete]', o: [['install', 'instala'], ['remove', 'desinstala'], ['search', 'busca']], e: 'sudo dnf install htop' },
      { n: 'pacman', q: 'Gestor de Arch Linux', s: 'pacman opción [paquete]', o: [['-S', 'instala'], ['-R', 'desinstala'], ['-Q', 'consulta lo instalado'], ['-Ss', 'busca']], e: 'sudo pacman -S htop' },
    ],
  },
  {
    id: 'red',
    nombre: 'Red',
    comandos: [
      { n: 'ip', q: 'Configuración de red', s: 'ip objeto [comando]', o: [['a', 'direcciones'], ['r', 'tabla de rutas'], ['l', 'interfaces']], e: 'ip a' },
      { n: 'ping', q: 'Comprueba conectividad', s: 'ping [-c N] destino', o: [['-c N', 'solo N paquetes']], e: 'ping -c 4 8.8.8.8' },
      { n: 'ss', q: 'Puertos y conexiones', s: 'ss [opciones]', o: [['-t', 'TCP'], ['-u', 'UDP'], ['-l', 'solo en escucha'], ['-p', 'qué proceso'], ['-n', 'sin resolver nombres']], e: 'ss -tulpn' },
      { n: 'dig', q: 'Consulta DNS', s: 'dig [+short] dominio', o: [['+short', 'solo la respuesta']], e: 'dig +short github.com' },
      { n: 'curl', q: 'Cliente HTTP desde la terminal', s: 'curl [opciones] url', o: [['-I', 'solo cabeceras'], ['-o archivo', 'guarda la respuesta'], ['-L', 'sigue redirecciones'], ['-v', 'muestra el detalle']], e: 'curl -I https://example.com' },
      { n: 'ssh', q: 'Sesión remota cifrada', s: 'ssh [-p puerto] usuario@host', o: [['-p', 'puerto'], ['-i', 'clave concreta']], e: 'ssh -p 2222 deploy@servidor' },
      { n: 'scp', q: 'Copia archivos por SSH', s: 'scp origen destino', o: [['-r', 'carpetas']], e: 'scp notas.txt user@host:/tmp' },
      { n: 'traceroute', q: 'Por dónde pasa el tráfico', s: 'traceroute host', o: [], e: 'traceroute google.com' },
    ],
  },
  {
    id: 'servicios',
    nombre: 'Servicios y logs',
    comandos: [
      { n: 'systemctl', q: 'Controla los servicios', s: 'systemctl subcomando [unidad]', o: [['status', 'estado y motivo del fallo'], ['start / stop', 'arranca o para ahora'], ['restart', 'reinicia'], ['enable / disable', 'que arranque o no al encender'], ['list-failed', 'qué está roto']], e: 'sudo systemctl restart nginx' },
      { n: 'journalctl', q: 'Consulta los registros del sistema', s: 'journalctl [opciones]', o: [['-u unidad', 'de un servicio concreto'], ['-n N', 'últimas N líneas'], ['-f', 'en vivo'], ['-p err', 'solo errores'], ['-k', 'del kernel']], e: 'journalctl -u nginx -n 50' },
      { n: 'crontab', q: 'Tareas programadas', s: 'crontab [opciones]', o: [['-l', 'ver las tuyas'], ['-e', 'editarlas'], ['-r', 'borrarlas']], e: 'crontab -l' },
      { n: 'dmesg', q: 'Mensajes del kernel', s: 'dmesg', o: [], e: 'dmesg | tail' },
      { n: 'uname', q: 'Información del sistema', s: 'uname [opciones]', o: [['-a', 'todo'], ['-r', 'versión del kernel'], ['-m', 'arquitectura']], e: 'uname -a' },
    ],
  },
  {
    id: 'seguridad',
    nombre: 'Seguridad y cifrado',
    comandos: [
      { n: 'sha256sum', q: 'Huella digital de un archivo', s: 'sha256sum [-c] archivo', o: [['-c', 'verifica contra una lista']], e: 'sha256sum imagen.iso' },
      { n: 'md5sum', q: 'Hash MD5 (obsoleto para seguridad)', s: 'md5sum archivo', o: [], e: 'md5sum descarga.zip' },
      { n: 'base64', q: 'Codifica y descodifica (no es cifrado)', s: 'base64 [-d] [archivo]', o: [['-d', 'descodifica']], e: 'echo hola | base64' },
      { n: 'gpg', q: 'Cifrado y firma', s: 'gpg [opciones] archivo', o: [['-c', 'cifrado simétrico'], ['-d', 'descifra'], ['-e -r u', 'cifra para un destinatario'], ['--gen-key', 'genera tu par de claves']], e: 'gpg -c secreto.txt' },
      { n: 'openssl', q: 'Caja de herramientas criptográfica', s: 'openssl subcomando [opciones]', o: [['dgst', 'calcula hashes'], ['enc', 'cifra y descifra'], ['rand', 'genera datos aleatorios']], e: 'openssl rand -hex 16' },
      { n: 'ufw', q: 'Cortafuegos sencillo', s: 'ufw subcomando', o: [['default deny incoming', 'denegar por defecto'], ['allow 22/tcp', 'abrir un puerto'], ['enable', 'activar'], ['status', 'ver las reglas']], e: 'sudo ufw allow 443/tcp' },
      { n: 'iptables', q: 'Cortafuegos de bajo nivel', s: 'iptables [opciones]', o: [['-L', 'lista las reglas']], e: 'sudo iptables -L' },
      { n: 'last', q: 'Últimos accesos correctos', s: 'last', o: [], e: 'last' },
      { n: 'lastb', q: 'Intentos de acceso fallidos', s: 'lastb', o: [], e: 'sudo lastb' },
      { n: 'who', q: 'Quién está conectado ahora', s: 'who', o: [], e: 'who' },
    ],
  },
  {
    id: 'scripting',
    nombre: 'Scripting',
    comandos: [
      { n: '#!/bin/bash', q: 'Shebang: con qué intérprete ejecutar el script', s: 'primera línea del archivo', o: [], e: '#!/bin/bash' },
      { n: 'set -euo pipefail', q: 'Modo estricto: la protección estándar', s: 'segunda línea del script', o: [['-e', 'parar al primer error'], ['-u', 'error si falta una variable'], ['-o pipefail', 'un fallo en un pipe cuenta']], e: 'set -euo pipefail' },
      { n: 'var=valor', q: 'Asignar una variable (sin espacios)', s: 'nombre=valor', o: [], e: 'nombre="Ana"' },
      { n: '$1 $@ $#', q: 'Argumentos del script', s: '$1 primero, $@ todos, $# cuántos', o: [], e: 'echo "Hola $1"' },
      { n: '$?', q: 'Código de salida del último comando', s: 'echo $?', o: [], e: 'test -f a; echo $?' },
      { n: '$( )', q: 'Captura la salida de un comando', s: 'var=$(comando)', o: [], e: 'total=$(ls | wc -l)' },
      { n: 'if', q: 'Condicional', s: 'if [ cond ]; then … fi', o: [['-f', 'es un archivo'], ['-d', 'es una carpeta'], ['-z', 'variable vacía'], ['-eq -gt -lt', 'comparar números']], e: 'if [ -f "$1" ]; then echo ok; fi' },
      { n: 'for', q: 'Bucle sobre una lista', s: 'for x in lista; do … done', o: [], e: 'for f in *.txt; do echo $f; done' },
      { n: 'while', q: 'Bucle mientras se cumpla', s: 'while [ cond ]; do … done', o: [], e: 'while read l; do echo $l; done < f' },
      { n: 'export', q: 'Lleva una variable al entorno', s: 'export VAR=valor', o: [], e: 'export EDITOR=nano' },
      { n: 'alias', q: 'Atajo para un comando', s: 'alias nombre="comando"', o: [], e: 'alias ll="ls -alF"' },
    ],
  },
];

export const TODOS_COMANDOS = CATEGORIAS.flatMap((c) => c.comandos.map((x) => ({ ...x, categoria: c.nombre, categoriaId: c.id })));

export function buscarComandos(consulta) {
  const q = consulta.toLowerCase().trim();
  if (!q) return TODOS_COMANDOS;
  return TODOS_COMANDOS.filter(
    (c) =>
      c.n.toLowerCase().includes(q) ||
      c.q.toLowerCase().includes(q) ||
      c.categoria.toLowerCase().includes(q) ||
      c.o.some(([f, d]) => f.toLowerCase().includes(q) || d.toLowerCase().includes(q))
  );
}
