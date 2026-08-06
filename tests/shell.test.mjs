// Batería del motor: cada comando con sus opciones, pipes, redirecciones,
// globs, permisos denegados y mensajes de error exactos.
import { Shell } from '../js/engine/shell.js';
import { COMMANDS } from '../js/engine/commands/index.js';
import { stripMarks } from '../js/engine/commands/util.js';
import { snapshot } from '../js/data/snapshots.js';

let fallos = 0;
let pasados = 0;
let seccion = '';

function nuevaShell(snap = 'inicio', user = 'user') {
  return new Shell({ fs: snapshot(snap), commands: COMMANDS, user });
}

// Ejecuta una lista de comandos y devuelve la salida del último, sin marcas.
function correr(sh, ...comandos) {
  let r = { output: '', code: 0 };
  for (const c of comandos) r = sh.run(c);
  return { salida: stripMarks(r.output), code: r.code };
}

function test(nombre, fn) {
  try {
    const resultado = fn();
    if (resultado === true) {
      pasados++;
    } else {
      fallos++;
      console.error(`  ✗ [${seccion}] ${nombre}\n      ${resultado}`);
    }
  } catch (e) {
    fallos++;
    console.error(`  ✗ [${seccion}] ${nombre}\n      excepción: ${e.message}`);
  }
}

// Comprueba que la salida contiene todos los trozos indicados.
function contiene(salida, ...trozos) {
  const faltan = trozos.filter((t) => !(t instanceof RegExp ? t.test(salida) : salida.includes(t)));
  return faltan.length === 0 ? true : `falta ${JSON.stringify(faltan)} en ${JSON.stringify(salida.slice(0, 200))}`;
}

function noContiene(salida, ...trozos) {
  const sobran = trozos.filter((t) => (t instanceof RegExp ? t.test(salida) : salida.includes(t)));
  return sobran.length === 0 ? true : `no debería contener ${JSON.stringify(sobran)}`;
}

function igual(a, b) {
  return a === b ? true : `esperaba ${JSON.stringify(b)} y llegó ${JSON.stringify(a)}`;
}

// ==========================================================================
seccion = 'navegación';
console.log('\n▸ Navegación');

test('pwd devuelve la carpeta actual', () => igual(correr(nuevaShell(), 'pwd').salida, '/home/user\n'));
test('cd relativo', () => {
  const sh = nuevaShell();
  correr(sh, 'cd documentos');
  return igual(sh.cwd, '/home/user/documentos');
});
test('cd absoluto', () => {
  const sh = nuevaShell();
  correr(sh, 'cd /var/log');
  return igual(sh.cwd, '/var/log');
});
test('cd .. sube un nivel', () => {
  const sh = nuevaShell();
  correr(sh, 'cd documentos/facturas', 'cd ..');
  return igual(sh.cwd, '/home/user/documentos');
});
test('cd - vuelve a la anterior', () => {
  const sh = nuevaShell();
  correr(sh, 'cd /etc', 'cd /var', 'cd -');
  return igual(sh.cwd, '/etc');
});
test('cd sin argumentos va a HOME', () => {
  const sh = nuevaShell();
  correr(sh, 'cd /etc', 'cd');
  return igual(sh.cwd, '/home/user');
});
test('cd a ruta inexistente da error', () => contiene(correr(nuevaShell(), 'cd /noexiste').salida, 'No such file or directory'));
test('cd a un archivo da Not a directory', () => contiene(correr(nuevaShell(), 'cd notas.txt').salida, 'Not a directory'));
test('ls lista los archivos', () => contiene(correr(nuevaShell(), 'ls').salida, 'notas.txt', 'documentos'));
test('ls -l muestra permisos', () => contiene(correr(nuevaShell(), 'ls -l').salida, '-rw-r--r--', 'user'));
test('ls -a muestra ocultos', () => contiene(correr(nuevaShell(), 'ls -a').salida, '.bashrc'));
test('ls sin -a oculta los que empiezan por punto', () => noContiene(correr(nuevaShell(), 'ls').salida, '.bashrc'));
test('ls -la combina opciones', () => contiene(correr(nuevaShell(), 'ls -la').salida, '.bashrc', 'rw-'));
test('ls de ruta inexistente', () => contiene(correr(nuevaShell(), 'ls /noexiste').salida, 'cannot access'));
test('ls -lh tamaños legibles', () => contiene(correr(nuevaShell(), 'ls -lh').salida, 'K'));
test('tree dibuja la estructura', () => contiene(correr(nuevaShell(), 'tree proyectos').salida, '├──', 'directories'));
test('tree -d solo carpetas', () => noContiene(correr(nuevaShell(), 'tree -d proyectos').salida, 'index.html'));

// ==========================================================================
seccion = 'archivos';
console.log('▸ Archivos');

test('touch crea un archivo', () => {
  const sh = nuevaShell();
  correr(sh, 'touch nuevo.txt');
  return igual(sh.fs.exists('/home/user/nuevo.txt', sh.ctx), true);
});
test('mkdir crea una carpeta', () => {
  const sh = nuevaShell();
  correr(sh, 'mkdir carpeta');
  return igual(sh.fs.lookup('/home/user/carpeta', sh.ctx).type, 'dir');
});
test('mkdir anidado sin -p falla', () => contiene(correr(nuevaShell(), 'mkdir a/b/c').salida, 'No such file or directory'));
test('mkdir -p crea toda la ruta', () => {
  const sh = nuevaShell();
  correr(sh, 'mkdir -p a/b/c');
  return igual(sh.fs.exists('/home/user/a/b/c', sh.ctx), true);
});
test('cp copia un archivo', () => {
  const sh = nuevaShell();
  correr(sh, 'cp notas.txt copia.txt');
  return igual(sh.fs.readFile('/home/user/copia.txt', sh.ctx), sh.fs.readFile('/home/user/notas.txt', sh.ctx));
});
test('cp de carpeta sin -r avisa', () => contiene(correr(nuevaShell(), 'cp documentos otro').salida, 'omitting directory'));
test('cp -r copia la carpeta entera', () => {
  const sh = nuevaShell();
  correr(sh, 'cp -r documentos copia');
  return igual(sh.fs.exists('/home/user/copia/cv.txt', sh.ctx), true);
});
test('mv renombra', () => {
  const sh = nuevaShell();
  correr(sh, 'mv notas.txt otro.txt');
  return igual(sh.fs.exists('/home/user/notas.txt', sh.ctx), false) === true && sh.fs.exists('/home/user/otro.txt', sh.ctx)
    ? true
    : 'no se renombró';
});
test('mv a una carpeta mete dentro', () => {
  const sh = nuevaShell();
  correr(sh, 'mv notas.txt documentos/');
  return igual(sh.fs.exists('/home/user/documentos/notas.txt', sh.ctx), true);
});
test('rm borra un archivo', () => {
  const sh = nuevaShell();
  correr(sh, 'rm notas.txt');
  return igual(sh.fs.exists('/home/user/notas.txt', sh.ctx), false);
});
test('rm de carpeta sin -r da Is a directory', () => contiene(correr(nuevaShell(), 'rm documentos').salida, 'Is a directory'));
test('rm -r borra la carpeta', () => {
  const sh = nuevaShell();
  correr(sh, 'rm -r documentos');
  return igual(sh.fs.exists('/home/user/documentos', sh.ctx), false);
});
test('rm -f no protesta si no existe', () => igual(correr(nuevaShell(), 'rm -f noexiste').salida, ''));
test('rmdir falla si no está vacía', () => contiene(correr(nuevaShell(), 'rmdir documentos').salida, 'Directory not empty'));
test('ln -s crea un enlace simbólico', () => {
  const sh = nuevaShell();
  correr(sh, 'ln -s /var/log/syslog reg');
  const n = sh.fs.lookup('/home/user/reg', sh.ctx, { followFinal: false });
  return n.type === 'link' && n.target === '/var/log/syslog' ? true : `tipo ${n.type}`;
});
test('ls -l muestra la flecha del enlace', () => {
  const sh = nuevaShell();
  correr(sh, 'ln -s /var/log/syslog reg');
  return contiene(correr(sh, 'ls -l reg').salida, '->', 'lrwx');
});
test('file identifica una carpeta', () => contiene(correr(nuevaShell(), 'file documentos').salida, 'directory'));
test('stat muestra metadatos', () => contiene(correr(nuevaShell(), 'stat notas.txt').salida, 'Size:', 'Access:'));

// ==========================================================================
seccion = 'texto';
console.log('▸ Texto');

test('cat muestra el contenido', () => contiene(correr(nuevaShell(), 'cat notas.txt').salida, 'lista de la compra'));
test('cat de archivo inexistente', () => contiene(correr(nuevaShell(), 'cat noexiste').salida, 'No such file or directory'));
test('cat -n numera', () => contiene(correr(nuevaShell(), 'cat -n notas.txt').salida, /\s+1\t/));
test('echo imprime', () => igual(correr(nuevaShell(), 'echo hola mundo').salida, 'hola mundo\n'));
test('echo -n sin salto', () => igual(correr(nuevaShell(), 'echo -n hola').salida, 'hola'));
test('head -n limita', () => igual(correr(nuevaShell(), 'head -n 2 /etc/passwd').salida.split('\n').filter(Boolean).length, 2));
test('tail -n coge el final', () => contiene(correr(nuevaShell(), 'tail -n 1 /etc/passwd').salida, 'deploy'));
test('wc -l cuenta líneas', () => contiene(correr(nuevaShell(), 'wc -l /etc/passwd').salida, '7'));
test('nl numera', () => contiene(correr(nuevaShell(), 'nl notas.txt').salida, /1\t/));

// ==========================================================================
seccion = 'redirección';
console.log('▸ Redirección y pipes');

test('> escribe en un archivo', () => {
  const sh = nuevaShell();
  correr(sh, 'echo hola > a.txt');
  return igual(sh.fs.readFile('/home/user/a.txt', sh.ctx), 'hola\n');
});
test('> sobrescribe', () => {
  const sh = nuevaShell();
  correr(sh, 'echo uno > a.txt', 'echo dos > a.txt');
  return igual(sh.fs.readFile('/home/user/a.txt', sh.ctx), 'dos\n');
});
test('>> añade al final', () => {
  const sh = nuevaShell();
  correr(sh, 'echo uno > a.txt', 'echo dos >> a.txt');
  return igual(sh.fs.readFile('/home/user/a.txt', sh.ctx), 'uno\ndos\n');
});
test('2> guarda solo los errores', () => {
  const sh = nuevaShell();
  correr(sh, 'ls notas.txt noexiste 2> err.txt');
  return contiene(sh.fs.readFile('/home/user/err.txt', sh.ctx), 'No such file');
});
test('> no captura los errores', () => {
  const sh = nuevaShell();
  correr(sh, 'ls notas.txt noexiste > out.txt');
  return noContiene(sh.fs.readFile('/home/user/out.txt', sh.ctx), 'No such file');
});
test('2>&1 junta los dos flujos', () => {
  const sh = nuevaShell();
  correr(sh, 'ls notas.txt noexiste > todo.txt 2>&1');
  const t = sh.fs.readFile('/home/user/todo.txt', sh.ctx);
  return contiene(t, 'notas.txt', 'No such file');
});
test('2>/dev/null descarta los errores', () => {
  const r = correr(nuevaShell(), 'ls notas.txt noexiste 2>/dev/null');
  return noContiene(r.salida, 'No such file');
});
test('< lee de un archivo', () => contiene(correr(nuevaShell(), 'wc -l < /etc/passwd').salida, '7'));
test('pipe encadena', () => contiene(correr(nuevaShell(), 'cat /etc/passwd | grep root').salida, 'root'));
test('pipe triple', () => igual(correr(nuevaShell(), 'cat /etc/passwd | grep bash | wc -l').salida.trim(), '5'));
test('&& solo si el primero va bien', () => contiene(correr(nuevaShell(), 'cd documentos && pwd').salida, '/home/user/documentos'));
test('&& no ejecuta si falla', () => noContiene(correr(nuevaShell(), 'cd /noexiste && echo llegue').salida, 'llegue'));
test('|| ejecuta si falla', () => contiene(correr(nuevaShell(), 'cd /noexiste || echo rescate').salida, 'rescate'));
test('; ejecuta ambos', () => contiene(correr(nuevaShell(), 'echo uno; echo dos').salida, 'uno', 'dos'));
test('tee muestra y guarda', () => {
  const sh = nuevaShell();
  const r = correr(sh, 'cat notas.txt | tee copia.txt');
  return contiene(r.salida, 'pan') === true && sh.fs.readFile('/home/user/copia.txt', sh.ctx).includes('pan') ? true : 'no guardó';
});

// ==========================================================================
seccion = 'globs y variables';
console.log('▸ Globs, comillas y variables');

test('* expande', () => {
  const sh = nuevaShell('busqueda');
  correr(sh, 'cd proyectos/web');
  return contiene(correr(sh, 'ls *.js').salida, 'app.js');
});
test('comillas simples no expanden variables', () => igual(correr(nuevaShell(), "echo '$HOME'").salida, '$HOME\n'));
test('comillas dobles sí expanden', () => igual(correr(nuevaShell(), 'echo "$HOME"').salida, '/home/user\n'));
test('$VAR se expande', () => igual(correr(nuevaShell(), 'echo $USER').salida, 'user\n'));
test('asignación de variable', () => {
  const sh = nuevaShell();
  correr(sh, 'x=hola');
  return igual(correr(sh, 'echo $x').salida, 'hola\n');
});
test('$? refleja el código de salida', () => {
  const sh = nuevaShell();
  correr(sh, 'cd /noexiste');
  return igual(correr(sh, 'echo $?').salida, '1\n');
});
test('~ se expande a HOME', () => contiene(correr(nuevaShell(), 'ls ~').salida, 'notas.txt'));
test('comando inexistente', () => {
  const r = correr(nuevaShell(), 'noexiste');
  return contiene(r.salida, 'command not found') === true && r.code === 127 ? true : `code ${r.code}`;
});

// ==========================================================================
seccion = 'permisos';
console.log('▸ Permisos');

test('chmod octal', () => {
  const sh = nuevaShell('permisos');
  correr(sh, 'chmod 755 deploy.sh');
  return igual(sh.fs.lookup('/home/user/deploy.sh', sh.ctx).mode & 0o777, 0o755);
});
test('chmod u+x', () => {
  const sh = nuevaShell('permisos');
  correr(sh, 'chmod u+x deploy.sh');
  return igual(sh.fs.lookup('/home/user/deploy.sh', sh.ctx).mode & 0o777, 0o744);
});
test('chmod go-rwx', () => {
  const sh = nuevaShell('permisos');
  correr(sh, 'chmod go-rwx notas-privadas.txt');
  return igual(sh.fs.lookup('/home/user/notas-privadas.txt', sh.ctx).mode & 0o777, 0o600);
});
test('chmod u+s activa SUID', () => {
  const sh = nuevaShell('permisos');
  correr(sh, 'chmod u+s informe.txt');
  return igual((sh.fs.lookup('/home/user/informe.txt', sh.ctx).mode & 0o4000) !== 0, true);
});
test('chmod g+s activa SGID', () => {
  const sh = nuevaShell('permisos');
  correr(sh, 'chmod g+s compartido');
  return igual((sh.fs.lookup('/home/user/compartido', sh.ctx).mode & 0o2000) !== 0, true);
});
test('chmod +t activa sticky', () => {
  const sh = nuevaShell('permisos');
  correr(sh, 'chmod +t compartido');
  return igual((sh.fs.lookup('/home/user/compartido', sh.ctx).mode & 0o1000) !== 0, true);
});
test('chmod 2775 aplica bits especiales en octal', () => {
  const sh = nuevaShell('permisos');
  correr(sh, 'chmod 2775 compartido');
  return igual(sh.fs.lookup('/home/user/compartido', sh.ctx).mode & 0o7777, 0o2775);
});
test('chmod -R afecta al contenido', () => {
  const sh = nuevaShell('permisos');
  correr(sh, 'chmod -R g+w compartido');
  return igual((sh.fs.lookup('/home/user/compartido/equipo.txt', sh.ctx).mode & 0o020) !== 0, true);
});
test('chmod modo inválido', () => contiene(correr(nuevaShell('permisos'), 'chmod zzz deploy.sh').salida, 'invalid mode'));
test('leer archivo sin permiso da Permission denied', () => contiene(correr(nuevaShell(), 'cat /var/log/syslog').salida, 'Permission denied'));
test('sudo permite leerlo', () => contiene(correr(nuevaShell(), 'sudo cat /var/log/syslog').salida, 'render-worker'));
test('chown sin sudo no está permitido', () => contiene(correr(nuevaShell('permisos'), 'chown user ajeno.conf').salida, 'Operation not permitted'));
test('sudo chown funciona', () => {
  const sh = nuevaShell('permisos');
  correr(sh, 'sudo chown user ajeno.conf');
  return igual(sh.fs.lookup('/home/user/ajeno.conf', sh.ctx).owner, 'user');
});
test('whoami', () => igual(correr(nuevaShell(), 'whoami').salida, 'user\n'));
test('sudo whoami dice root', () => igual(correr(nuevaShell(), 'sudo whoami').salida, 'root\n'));
test('id muestra grupos', () => contiene(correr(nuevaShell(), 'id').salida, 'uid=1000(user)', 'groups='));
test('sudo -l lista privilegios', () => contiene(correr(nuevaShell(), 'sudo -l').salida, 'may run the following'));
test('no se puede entrar en la carpeta de otro usuario', () => contiene(correr(nuevaShell(), 'ls /home/ana').salida, 'Permission denied'));

// ==========================================================================
seccion = 'búsqueda';
console.log('▸ Búsqueda');

test('find -name', () => contiene(correr(nuevaShell('busqueda'), 'find . -name "*.json"').salida, 'config.json'));
test('find -type d', () => noContiene(correr(nuevaShell('busqueda'), 'find proyectos -type d').salida, '.js'));
test('find -type f', () => contiene(correr(nuevaShell('busqueda'), 'find proyectos -type f -name "*.js"').salida, 'server.js'));
test('find -delete borra', () => {
  const sh = nuevaShell('busqueda');
  correr(sh, 'find . -name "*.tmp" -delete');
  return igual(sh.fs.exists('/home/user/proyectos/viejo/temporal.tmp', sh.ctx), false);
});
test('find -perm -4000 encuentra los SUID', () => contiene(correr(nuevaShell(), 'find / -perm -4000 2>/dev/null').salida, '/usr/bin/passwd', '/usr/bin/sudo'));
test('find -exec ejecuta', () => contiene(correr(nuevaShell('busqueda'), 'find registros -name "*.log" -exec wc -l {} ;').salida, /\d/));
test('grep filtra líneas', () => contiene(correr(nuevaShell('busqueda'), 'grep ERROR registros/app.log').salida, 'timeout'));
test('grep -i ignora mayúsculas', () => contiene(correr(nuevaShell('busqueda'), 'grep -i error registros/app.log').salida, 'ERROR'));
test('grep -v invierte', () => noContiene(correr(nuevaShell('busqueda'), 'grep -v INFO registros/app.log').salida, 'arranque ok'));
test('grep -c cuenta', () => igual(correr(nuevaShell('busqueda'), 'grep -c ERROR registros/app.log').salida.trim(), '2'));
test('grep -n numera', () => contiene(correr(nuevaShell('busqueda'), 'grep -n ERROR registros/app.log').salida, '2:'));
test('grep -r recursivo', () => contiene(correr(nuevaShell('busqueda'), 'grep -r TODO proyectos').salida, 'TODO'));
test('grep sin coincidencias devuelve código 1', () => igual(correr(nuevaShell('busqueda'), 'grep zzzz registros/app.log').code, 1));
test('which localiza el binario', () => contiene(correr(nuevaShell(), 'which ls').salida, '/usr/bin/ls'));

// ==========================================================================
seccion = 'filtros';
console.log('▸ Filtros de texto');

test('sort alfabético', () => contiene(correr(nuevaShell('datos'), 'sort palabras.txt').salida, 'kiwi'));
test('sort -n numérico', () => igual(correr(nuevaShell('datos'), 'sort -n numeros.txt').salida.split('\n')[0], '3'));
test('sort -r invierte', () => igual(correr(nuevaShell('datos'), 'sort -rn numeros.txt').salida.split('\n')[0], '108'));
test('sort -u quita duplicados', () => igual(correr(nuevaShell('datos'), 'sort -u palabras.txt').salida.split('\n').filter(Boolean).length, 4));
test('uniq -c cuenta', () => contiene(correr(nuevaShell('datos'), 'sort palabras.txt | uniq -c').salida, /3\s+pera/));
test('cut -d -f extrae campos', () => {
  const r = correr(nuevaShell('datos'), 'cut -d: -f1 /etc/passwd');
  return contiene(r.salida, 'root') === true && !r.salida.includes('/bin/bash') ? true : 'extrajo de más';
});
test('cut con coma en CSV', () => contiene(correr(nuevaShell('datos'), 'cut -d, -f2 ventas.csv').salida, 'teclado'));
test('tr cambia mayúsculas', () => igual(correr(nuevaShell(), 'echo HOLA | tr A-Z a-z').salida, 'hola\n'));
test('awk imprime una columna', () => {
  const r = correr(nuevaShell('datos'), "awk -F: '{print $1}' usuarios.txt");
  return contiene(r.salida, 'ana') === true && !r.salida.includes('madrid') ? true : 'no filtró';
});
test('awk $NF da el último campo', () => contiene(correr(nuevaShell('datos'), "awk -F: '{print $NF}' usuarios.txt").salida, 'madrid'));
test('awk suma con END', () => contiene(correr(nuevaShell('datos'), "awk -F, 'NR>1 {s+=$4} END {print s}' ventas.csv").salida, '106'));
test('awk filtra por condición', () => contiene(correr(nuevaShell('datos'), "awk -F: '$2 > 30 {print $1}' usuarios.txt").salida, 'luis'));
test('sed sustituye', () => contiene(correr(nuevaShell('datos'), "sed 's/:/ - /g' usuarios.txt").salida, 'ana - 28'));
test('sed -i modifica el archivo', () => {
  const sh = nuevaShell('datos');
  correr(sh, "sed -i 's/pera/PERA/g' palabras.txt");
  return contiene(sh.fs.readFile('/home/user/palabras.txt', sh.ctx), 'PERA');
});
test('sed borra una línea', () => noContiene(correr(nuevaShell('datos'), "sed '1d' numeros.txt").salida.split('\n')[0], '42'));

// ==========================================================================
seccion = 'procesos';
console.log('▸ Procesos');

test('ps aux lista procesos', () => contiene(correr(nuevaShell('diagnostico'), 'ps aux').salida, 'PID', 'nginx'));
test('ps con grep filtra', () => noContiene(correr(nuevaShell('diagnostico'), 'ps aux | grep render').salida, 'postgres'));
test('top muestra la carga', () => contiene(correr(nuevaShell('diagnostico'), 'top').salida, 'load average'));
test('kill elimina el proceso', () => {
  const sh = nuevaShell('diagnostico');
  correr(sh, 'ps aux', 'kill 1533');
  return igual(sh.state.processes.some((p) => p.pid === 1533), false);
});
test('kill de PID inexistente', () => contiene(correr(nuevaShell('diagnostico'), 'ps aux; kill 99999').salida, 'No such process'));
test('free -h', () => contiene(correr(nuevaShell(), 'free -h').salida, 'Mem:'));
test('df -h', () => contiene(correr(nuevaShell(), 'df -h').salida, 'Filesystem', '/dev/sda1'));
test('du -sh da un total', () => igual(correr(nuevaShell(), 'du -sh .').salida.split('\n').filter(Boolean).length, 1));
test('pgrep encuentra PIDs', () => contiene(correr(nuevaShell('diagnostico'), 'pgrep nginx').salida, /\d/));

// ==========================================================================
seccion = 'servicios';
console.log('▸ Servicios y paquetes');

test('systemctl status de servicio caído', () => contiene(correr(nuevaShell('diagnostico'), 'systemctl status render-worker').salida, 'failed'));
test('systemctl start sin sudo falla', () => contiene(correr(nuevaShell('diagnostico'), 'systemctl start render-worker').salida, 'authentication required'));
test('sudo systemctl start funciona', () => {
  const sh = nuevaShell('diagnostico');
  correr(sh, 'sudo systemctl start render-worker');
  return igual(sh.state.services['render-worker'].active, true);
});
test('sudo systemctl enable marca el arranque', () => {
  const sh = nuevaShell('diagnostico');
  correr(sh, 'sudo systemctl enable render-worker');
  return igual(sh.state.services['render-worker'].enabled, true);
});
test('systemctl list-failed', () => contiene(correr(nuevaShell('diagnostico'), 'systemctl list-failed').salida, 'render-worker'));
test('journalctl -u filtra por unidad', () => contiene(correr(nuevaShell('diagnostico'), 'journalctl -u render-worker').salida, 'ERROR'));
test('journalctl -p err solo errores', () => noContiene(correr(nuevaShell('diagnostico'), 'journalctl -p err').salida, 'Accepted publickey'));
test('apt install sin sudo falla', () => contiene(correr(nuevaShell(), 'apt install htop').salida, 'are you root'));
test('sudo apt install instala', () => {
  const sh = nuevaShell();
  correr(sh, 'sudo apt install htop');
  return igual(sh.state.packages.has('htop'), true);
});
test('apt install de paquete inexistente', () => contiene(correr(nuevaShell(), 'sudo apt install noexistepaquete').salida, 'Unable to locate package'));
test('dpkg -l lista lo instalado', () => contiene(correr(nuevaShell(), 'dpkg -l').salida, 'curl'));

// ==========================================================================
seccion = 'red';
console.log('▸ Red');

test('ip a muestra la interfaz', () => contiene(correr(nuevaShell(), 'ip a').salida, '192.168.1.50', 'eth0'));
test('ip r muestra el gateway', () => contiene(correr(nuevaShell(), 'ip r').salida, 'default via'));
test('ping con -c', () => contiene(correr(nuevaShell(), 'ping -c 2 servidor.local').salida, '2 packets transmitted'));
test('ping a host desconocido', () => contiene(correr(nuevaShell(), 'ping -c 1 noexiste.zzz').salida, 'Name or service not known'));
test('ss -tulpn lista puertos', () => contiene(correr(nuevaShell(), 'ss -tulpn').salida, 'LISTEN', ':22'));
test('dig +short resuelve', () => contiene(correr(nuevaShell(), 'dig +short github.com').salida, '140.82.121.4'));
test('curl -I devuelve cabeceras', () => contiene(correr(nuevaShell(), 'curl -I http://localhost').salida, 'HTTP/1.1 200', 'nginx'));
test('ssh a host desconocido', () => contiene(correr(nuevaShell(), 'ssh user@noexiste.zzz').salida, 'Could not resolve'));

// ==========================================================================
seccion = 'seguridad';
console.log('▸ Seguridad y cifrado');

test('sha256sum da un hash estable', () => {
  const a = correr(nuevaShell(), 'sha256sum notas.txt').salida;
  const b = correr(nuevaShell(), 'sha256sum notas.txt').salida;
  return igual(a, b);
});
test('sha256sum cambia si cambia el archivo', () => {
  const sh = nuevaShell();
  const antes = correr(sh, 'sha256sum notas.txt').salida.split(' ')[0];
  correr(sh, 'echo extra >> notas.txt');
  const despues = correr(sh, 'sha256sum notas.txt').salida.split(' ')[0];
  return antes !== despues ? true : 'el hash no cambió';
});
test('sha256sum -c verifica', () => {
  const sh = nuevaShell();
  correr(sh, 'sha256sum notas.txt > suma.txt');
  return contiene(correr(sh, 'sha256sum -c suma.txt').salida, 'OK');
});
test('sha256sum -c detecta manipulación', () => {
  const sh = nuevaShell();
  correr(sh, 'sha256sum notas.txt > suma.txt', 'echo alterado >> notas.txt');
  return contiene(correr(sh, 'sha256sum -c suma.txt').salida, 'FAILED');
});
test('base64 codifica y descodifica', () => {
  const sh = nuevaShell();
  const cod = correr(sh, 'echo hola | base64').salida.trim();
  return igual(correr(sh, `echo ${cod} | base64 -d`).salida.trim(), 'hola');
});
test('base64 -d de cadena conocida', () => contiene(correr(nuevaShell(), 'echo bGludXggZXMgZGl2ZXJ0aWRv | base64 -d').salida, 'linux es divertido'));
test('gpg -c cifra', () => {
  const sh = nuevaShell();
  correr(sh, 'gpg -c notas.txt');
  return igual(sh.fs.exists('/home/user/notas.txt.gpg', sh.ctx), true);
});
test('gpg -d recupera el original', () => {
  const sh = nuevaShell();
  const original = sh.fs.readFile('/home/user/notas.txt', sh.ctx);
  correr(sh, 'gpg -c notas.txt', 'rm notas.txt', 'gpg -d notas.txt.gpg > notas.txt');
  return igual(sh.fs.readFile('/home/user/notas.txt', sh.ctx), original);
});
test('getcap -r lista capabilities', () => contiene(correr(nuevaShell(), 'getcap -r / 2>/dev/null').salida, 'cap_net_raw'));
test('ufw sin sudo falla', () => contiene(correr(nuevaShell(), 'ufw enable').salida, 'need to be root'));
test('ufw default deny', () => {
  const sh = nuevaShell();
  correr(sh, 'sudo ufw default deny incoming');
  return igual(sh.state.firewall.defaultIn, 'deny');
});
test('ufw allow añade regla', () => {
  const sh = nuevaShell();
  correr(sh, 'sudo ufw allow 22/tcp');
  return igual(sh.state.firewall.rules.some((r) => r.port === '22'), true);
});
test('ufw enable activa', () => {
  const sh = nuevaShell();
  correr(sh, 'sudo ufw enable');
  return igual(sh.state.firewall.enabled, true);
});
test('ufw status muestra las reglas', () => {
  const sh = nuevaShell();
  correr(sh, 'sudo ufw allow 443/tcp', 'sudo ufw enable');
  return contiene(correr(sh, 'sudo ufw status').salida, 'active', '443');
});
test('lastb sin sudo falla', () => contiene(correr(nuevaShell(), 'lastb').salida, 'Permission denied'));
test('sudo lastb muestra fallos', () => contiene(correr(nuevaShell(), 'sudo lastb').salida, '45.12.9.3'));

// ==========================================================================
seccion = 'scripting';
console.log('▸ Scripting');

test('for recorre una lista', () => contiene(correr(nuevaShell('scripts'), 'for i in 1 2 3; do echo $i; done').salida, '1', '2', '3'));
test('for con glob', () => contiene(correr(nuevaShell('scripts'), 'for f in *.sh; do echo $f; done').salida, 'saludo.sh'));
test('seq genera números', () => igual(correr(nuevaShell(), 'seq 1 5').salida, '1\n2\n3\n4\n5\n'));
test('test -f devuelve 0 si existe', () => {
  const sh = nuevaShell('scripts');
  correr(sh, 'test -f saludo.sh');
  return igual(correr(sh, 'echo $?').salida, '0\n');
});
test('test -f devuelve 1 si no existe', () => {
  const sh = nuevaShell('scripts');
  correr(sh, 'test -f noexiste');
  return igual(correr(sh, 'echo $?').salida, '1\n');
});
test('test -d con carpeta', () => {
  const sh = nuevaShell('scripts');
  correr(sh, 'test -d datos');
  return igual(correr(sh, 'echo $?').salida, '0\n');
});
test('printf con formato', () => igual(correr(nuevaShell(), 'printf "hola\\n"').salida, 'hola\n'));
test('export define variable de entorno', () => {
  const sh = nuevaShell();
  correr(sh, 'export EDITOR=nano');
  return igual(sh.env.EDITOR, 'nano');
});
test('alias funciona', () => {
  const sh = nuevaShell();
  correr(sh, 'alias ll="ls -l"');
  return contiene(correr(sh, 'll').salida, 'rw-');
});
test('history recuerda', () => contiene(correr(nuevaShell(), 'pwd', 'ls', 'history').salida, 'pwd', 'ls'));
test('bash -c ejecuta', () => contiene(correr(nuevaShell(), 'bash -c "echo dentro"').salida, 'dentro'));
test('source ejecuta un script', () => {
  const sh = nuevaShell('scripts');
  correr(sh, 'echo "echo desde-script" > s.sh');
  return contiene(correr(sh, 'source s.sh').salida, 'desde-script');
});

// ==========================================================================
seccion = 'robustez';
console.log('▸ Robustez');

test('línea vacía no rompe', () => igual(correr(nuevaShell(), '').code, 0));
test('solo espacios no rompe', () => igual(correr(nuevaShell(), '   ').code, 0));
test('comilla sin cerrar da error de sintaxis', () => contiene(correr(nuevaShell(), 'echo "sin cerrar').salida, 'unexpected EOF'));
test('pipe sin comando final no rompe', () => igual(typeof correr(nuevaShell(), 'ls |').salida, 'string'));
test('las marcas de color no llegan a los archivos', () => {
  const sh = nuevaShell();
  correr(sh, 'ls > listado.txt');
  return noContiene(sh.fs.readFile('/home/user/listado.txt', sh.ctx), '');
});
test('las marcas no viajan por el pipe', () => noContiene(correr(nuevaShell(), 'ls | cat').salida, ''));
test('cd a carpeta sin permisos', () => contiene(correr(nuevaShell(), 'cd /home/ana').salida, 'Permission denied'));
test('escribir en carpeta ajena falla', () => contiene(correr(nuevaShell(), 'touch /home/ana/x.txt').salida, 'Permission denied'));
test('rm -rf / no destruye la raíz', () => {
  const sh = nuevaShell();
  correr(sh, 'rm -rf /');
  return igual(sh.fs.exists('/etc', sh.ctx), true);
});
test('bucle while con límite no se cuelga', () => igual(typeof correr(nuevaShell(), 'while true; do echo x; done').salida, 'string'));

// ==========================================================================
console.log('\n─────────────────────────────────────────');
console.log(`${pasados} pruebas pasadas, ${fallos} fallidas`);
process.exit(fallos ? 1 : 0);
