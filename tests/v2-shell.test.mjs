// Cobertura de los comandos añadidos para salas, máquinas y Wargame.
import { Shell } from '../js/engine/shell.js';
import { COMMANDS } from '../js/engine/commands/index.js';
import { stripMarks } from '../js/engine/commands/util.js';
import { snapshot } from '../js/data/snapshots.js';
import { MAQUINAS } from '../js/data/maquinas.js';

let ok = 0;
let mal = 0;
function probar(nombre, fn) { try { const r = fn(); if (r) ok++; else { mal++; console.error(`  ✗ ${nombre}`); } } catch (e) { mal++; console.error(`  ✗ ${nombre}: ${e.message}`); } }
function shell(snap = 'profesional', extra = {}) { return new Shell({ fs: snapshot(snap), commands: COMMANDS, user: 'user', ...extra }); }
function run(sh, cmd) { const r = sh.run(cmd); return { ...r, output: stripMarks(r.output) }; }

console.log('\n▸ Herramientas profesionales');
probar('strings extrae texto legible', () => /TOKEN=LINUX/.test(run(shell('avanzado'), 'strings /home/user/firmas.bin').output));
probar('file reconoce ELF', () => /ELF/.test(run(shell('avanzado'), 'file /home/user/firmas.bin').output));
probar('lsattr muestra inmutable', () => { const sh = shell('avanzado', { user: 'root' }); run(sh, 'chattr +i /home/user/inmutable.conf'); return /^----i/.test(run(sh, 'lsattr /home/user/inmutable.conf').output); });
probar('chattr cambia atributos como root', () => { const sh = shell('avanzado', { user: 'root' }); run(sh, 'chattr +i /home/user/inmutable.conf'); run(sh, 'chattr -i /home/user/inmutable.conf'); return /^--------------/.test(run(sh, 'lsattr /home/user/inmutable.conf').output); });
probar('git status funciona', () => { const sh = shell(); run(sh, 'cd repo && git init'); return /rama main/i.test(run(sh, 'git status').output); });
probar('tmux crea y lista sesión', () => { const sh = shell(); run(sh, 'tmux new -s mentor'); return /mentor/.test(run(sh, 'tmux ls').output); });
probar('vim abre un archivo simulado', () => run(shell(), 'vim notas.txt').code === 0);
probar('nmap detecta servicios de máquina', () => { const m = MAQUINAS[0]; const sh = shell(m.snapshot, { user: 'kali', machine: structuredClone(m.profile), hostname: 'attackbox' }); const out = run(sh, `nmap -sV ${m.ip}`).output; return m.profile.ports.every((p) => out.includes(String(p.port)) && out.includes(p.service)); });
probar('nc obtiene banner', () => { const m = MAQUINAS[0]; const sh = shell(m.snapshot, { user: 'kali', machine: structuredClone(m.profile) }); return /SSH|HTTP/.test(run(sh, `nc ${m.ip} ${m.profile.ports[0].port}`).output); });
probar('curl enumera página simulada', () => { const m = MAQUINAS[0]; const sh = shell(m.snapshot, { user: 'kali', machine: structuredClone(m.profile) }); return run(sh, `curl http://${m.host}/robots.txt`).output.includes(m.profile.token); });
probar('ssh se bloquea antes de enumerar', () => { const m = MAQUINAS[0]; const sh = shell(m.snapshot, { user: 'kali', machine: structuredClone(m.profile) }); return run(sh, `ssh ${m.user}@${m.host}`).code !== 0; });
probar('ssh entra tras desbloquear acceso', () => { const m = MAQUINAS[0]; const profile = structuredClone(m.profile); profile.accessUnlocked = true; const sh = shell(m.snapshot, { user: 'kali', machine: profile, hostname: 'attackbox', groupMap: m.groupMap }); return run(sh, `ssh ${m.user}@${m.host}`).code === 0 && sh.user === m.user; });

console.log('\n▸ Red: DNS, puertos y HTTP');
const red = () => shell('red-servicios');
probar('dig +short devuelve solo la dirección', () => run(red(), 'dig +short api.local').output.trim() === '192.168.1.60');
probar('dig resuelve por /etc/hosts antes que por la tabla interna', () => run(red(), 'dig +short intranet.local').output.includes('192.168.1.70'));
probar('dig MX devuelve el registro de correo', () => /correo\.mentor\.dev/.test(run(red(), 'dig MX mentor.dev').output));
probar('dig TXT +short devuelve el texto', () => run(red(), 'dig TXT api.local +short').output.includes('entorno=pruebas'));
probar('dig NS lista los servidores de la zona', () => /ns1\.mentor\.dev/.test(run(red(), 'dig NS mentor.dev').output));
probar('un tipo sin registros da NOERROR con 0 respuestas', () => { const o = run(red(), 'dig MX api.local').output; return o.includes('NOERROR') && o.includes('ANSWER: 0'); });
probar('un dominio inexistente da NXDOMAIN', () => run(red(), 'dig noexiste.zzz').output.includes('NXDOMAIN'));
probar('un resolutor averiado da SERVFAIL', () => run(red(), 'dig @192.168.1.99 api.local').output.includes('SERVFAIL'));
probar('host -t MX usa el lenguaje de host', () => /mail is handled by/.test(run(red(), 'host -t MX correo.local').output));
probar('ss -t deja fuera los sockets UDP', () => { const o = run(red(), 'ss -tlpn').output; return o.includes('tcp') && !o.includes('udp'); });
probar('ss -u deja fuera los sockets TCP', () => { const o = run(red(), 'ss -ulpn').output; return o.includes('udp') && !o.includes('tcp'); });
probar('ss -l solo muestra los que escuchan', () => !run(red(), 'ss -tl').output.includes('ESTAB'));
probar('ss -a incluye las conexiones establecidas', () => run(red(), 'ss -ta').output.includes('ESTAB'));
probar('ss sin -p oculta la columna de proceso', () => !run(red(), 'ss -tl').output.includes('sshd'));
probar('nc -z confirma un puerto abierto', () => run(red(), 'nc -zv localhost 5432').output.includes('succeeded'));
probar('nc -z rechaza un puerto cerrado', () => { const r = run(red(), 'nc -zv localhost 3306'); return r.code !== 0 && r.output.includes('refused'); });
probar('nc sin -z devuelve el banner del servicio', () => run(red(), 'nc localhost 22').output.includes('SSH-2.0'));
probar('nmap -p distingue abierto de cerrado', () => { const o = run(red(), 'nmap -p 22,3306 localhost').output; return o.includes('22/tcp\topen') && o.includes('3306/tcp\tclosed'); });
probar('nmap -sn no escanea puertos', () => { const o = run(red(), 'nmap -sn 192.168.1.50').output; return o.includes('Host is up') && !o.includes('PORT'); });
probar('curl -I muestra el código de estado', () => run(red(), 'curl -I http://api.local/salud').output.includes('404'));
probar('curl sin -L no sigue la redirección', () => run(red(), 'curl http://api.local').output.trim() === '');
probar('curl -L llega al contenido final', () => run(red(), 'curl -L http://api.local').output.includes('degraded'));
probar('curl -w devuelve solo el código', () => run(red(), "curl -s -o /dev/null -w '%{http_code}' http://api.local/version").output.trim() === '200');
probar('una ruta inexistente en un host que resuelve da 404', () => run(red(), 'curl -I http://intranet.local/no-existe').output.includes('404'));
probar('un host que no resuelve da error de DNS', () => run(red(), 'curl http://noexiste.zzz').output.includes('Could not resolve'));
probar('curl -o guarda la respuesta en un archivo', () => { const sh = red(); run(sh, 'curl -o r.txt http://intranet.local/robots.txt'); return run(sh, 'cat r.txt').output.includes('Disallow'); });
probar('ping acepta una dirección numérica sin resolver', () => run(red(), 'ping -c 1 192.168.1.1').code === 0);
probar('/etc/resolv.conf declara el resolutor', () => run(red(), 'cat /etc/resolv.conf').output.includes('nameserver 192.168.1.1'));

console.log('\n▸ Ofensiva: enumeración y escalada');
const aud = (extra = {}) => shell('auditoria', extra);
probar('sudo -l lee la política real de /etc/sudoers', () => { const o = run(aud({ groupMap: { deploy: ['deploy'] }, user: 'deploy' }), 'sudo -l').output; return o.includes('/usr/bin/find'); });
probar('sudo cat revela la regla NOPASSWD', () => run(aud(), 'sudo cat /etc/sudoers').output.includes('NOPASSWD'));
probar('find -perm -4000 encuentra el SUID no estándar', () => run(aud(), 'find / -perm -4000 -type f 2>/dev/null').output.includes('/usr/local/bin/reporte'));
probar('getcap -r lista capabilities', () => run(aud(), 'getcap -r /').output.includes('cap_net_raw'));
probar('el crontab del sistema muestra la tarea de root', () => run(aud(), 'cat /etc/crontab').output.includes('limpiar.sh'));
probar('el script del cron es escribible por cualquiera', () => /rwxrwxrwx/.test(run(aud(), 'ls -l /opt/mantenimiento/limpiar.sh').output));
probar('grep encuentra la credencial en config.php', () => run(aud(), 'grep -ri pass /var/www/html').output.includes('Verano2026'));
probar('cut extrae los nombres de /etc/passwd', () => run(aud(), 'cut -d: -f1 /etc/passwd').output.includes('deploy'));
probar('robots.txt del host de auditoría revela rutas', () => run(aud(), 'curl http://10.30.0.15/robots.txt').output.includes('/panel'));
probar('una ruta protegida del host responde 403', () => run(aud(), 'curl -I http://10.30.0.15/panel').output.includes('403'));
probar('base64 codifica y -d recupera', () => { const sh = aud(); const cod = run(sh, 'base64 alcance.txt').output.trim().split('\n')[0]; return /^[A-Za-z0-9+/=]+$/.test(cod); });
probar('sha256sum produce un hash de 64 hex', () => /[0-9a-f]{64}/.test(run(aud(), 'sha256sum alcance.txt').output));

console.log('\n▸ Defensa: registros, cuentas e incidente');
const inc = (extra = {}) => shell('incidente', extra);
probar('auth.log muestra los intentos fallidos', () => run(inc(), 'grep Failed /var/log/auth.log').output.includes('45.12.9.3'));
probar('grep -c cuenta los fallidos', () => run(inc(), 'grep -c Failed /var/log/auth.log').output.trim() === '4');
probar('los accesos con éxito aparecen', () => run(inc(), 'grep Accepted /var/log/auth.log').output.includes('deploy'));
probar('el registro delata la cuenta creada', () => run(inc(), 'grep useradd /var/log/auth.log').output.includes('backupsvc'));
probar('la cuenta rogue está en /etc/passwd', () => run(inc(), 'grep backupsvc /etc/passwd').output.includes('1050'));
probar('cut extrae nombre y UID', () => run(inc(), 'cut -d: -f1,3 /etc/passwd').output.includes('backupsvc:1050'));
probar('find -newer señala solo lo posterior al incidente', () => { const o = run(inc(), 'find /home -mindepth 1 -maxdepth 1 -newer /var/log/incidente.inicio').output; return o.includes('backupsvc') && !o.includes('/home/ana'); });
probar('ls -la revela el binario oculto en /tmp', () => run(inc(), 'ls -la /tmp').output.includes('.sysupd'));
probar('strings saca la IP del implante', () => run(inc(), 'strings /tmp/.sysupd').output.includes('45.12.9.3'));
probar('sha256sum del artefacto es un hash de 64 hex', () => /[0-9a-f]{64}/.test(run(inc(), 'sha256sum /tmp/.sysupd').output));
probar('el crontab expone la persistencia', () => run(inc(), 'cat /etc/crontab').output.includes('.sysupd'));
probar('ufw allow añade una regla', () => run(inc({ user: 'root' }), 'ufw allow 22/tcp').code === 0);
probar('ufw default deny se acepta', () => run(inc({ user: 'root' }), 'ufw default deny incoming').code === 0);
probar('sudo iptables -L pasa la opción al comando', () => run(inc({ groupMap: { user: ['user', 'sudo'] } }), 'sudo iptables -L').output.includes('Chain'));
probar('ss cuenta los servicios a la escucha', () => run(inc(), 'ss -tln | grep -c LISTEN').output.trim() === '4');

console.log('\n▸ Python y Lua: intérpretes didácticos');
const prog = (extra = {}) => shell('programacion', extra);
// Cada prueba usa una shell nueva para que un script no herede el estado del
// anterior, igual que ocurre en las salas.
probar('python3 ejecuta un archivo', () => run(prog(), 'python3 ejemplos/hola.py').output.includes('Hola, mundo'));
probar('lua ejecuta un archivo', () => run(prog(), 'lua ejemplos/hola.lua').output.includes('Hola, mundo'));
probar('python3 -c ejecuta código suelto', () => run(prog(), `python3 -c 'print(2 + 3)'`).output.trim() === '5');
probar('lua -e ejecuta código suelto', () => run(prog(), `lua -e 'print(2 + 3)'`).output.trim() === '5');
probar('la división de Python da float', () => run(prog(), `python3 -c 'print(10 / 2, 10 // 3, 10 % 3)'`).output.trim() === '5.0 3 1');
probar('la división de Lua da float', () => run(prog(), `lua -e 'print(10 / 2)'`).output.trim() === '5.0');
probar('las f-strings interpolan y formatean', () => run(prog(), `python3 -c 'n = "mentor"; print(f"{n.upper()} tiene {len(n)} letras y pi es {3.14159:.2f}")'`).output.trim() === 'MENTOR tiene 6 letras y pi es 3.14');
probar('el for de Python respeta la sangría', () => run(prog(), `python3 -c 'for i in range(1, 4): print(i)'`).output.trim().split('\n').join(',') === '1,2,3');
probar('lo asignado dentro de un for sobrevive fuera', () => run(prog(), `python3 -c 't = 0
for i in range(1, 5): t = t + i
print(t)'`).output.trim() === '10');
probar('las listas y los diccionarios funcionan', () => run(prog(), `python3 -c 'n = [3, 1, 2]; n.sort(); d = {"a": 1}; d["b"] = 2; print(n, len(d), d["b"])'`).output.trim() === '[1, 2, 3] 2 2');
probar('las funciones devuelven valores', () => run(prog(), `python3 -c 'def m(x): return sum(x) / len(x)
print(m([4, 6, 8]))'`).output.trim() === '6.0');
probar('las tablas de Lua empiezan en 1', () => run(prog(), `lua -e 'local t = {10, 20}; print(t[1], #t)'`).output.trim() === '10\t2');
probar('ipairs recorre en orden', () => run(prog(), `lua -e 'for i, v in ipairs({"a", "b"}) do print(i, v) end'`).output.includes('2\tb'));
probar('table.sort y table.concat ordenan y unen', () => run(prog(), `lua -e 'local t = {5, 3, 9}; table.sort(t); print(table.concat(t, ","))'`).output.trim() === '3,5,9');
probar('string.format aplica precisión', () => run(prog(), `lua -e 'print(string.format("%.2f", 3.14159))'`).output.trim() === '3.14');
probar('los scripts leen del filesystem simulado', () => run(prog(), `python3 -c 'print(len(open("nombres.txt").readlines()))'`).output.trim() === '5');
probar('los scripts escriben en el filesystem simulado', () => {
  const sh = prog();
  run(sh, `python3 -c 'f = open("salida.txt", "w"); f.write("hecho"); f.close()'`);
  return run(sh, 'cat salida.txt').output.includes('hecho');
});
probar('sys.argv recibe los argumentos', () => {
  const sh = prog();
  run(sh, `printf '%s\\n' 'import sys' 'print(sys.argv[1])' > eco.py`);
  return run(sh, 'python3 eco.py hola').output.trim() === 'hola';
});
probar('arg recibe los argumentos en Lua', () => {
  const sh = prog();
  run(sh, `echo 'print(arg[1])' > eco.lua`);
  return run(sh, 'lua eco.lua hola').output.trim() === 'hola';
});
probar('el shebang elige el intérprete al ejecutar ./', () => {
  const sh = prog();
  run(sh, 'chmod +x ejemplos/hola.py');
  return run(sh, './ejemplos/hola.py').output.includes('Hola, mundo');
});
probar('sin permiso de ejecución da Permission denied', () => run(prog(), './ejemplos/hola.py').output.includes('Permission denied'));
probar('un error de Python nombra archivo, línea y tipo', () => {
  const o = run(prog(), 'python3 ejemplos/roto.py').output;
  return o.includes('empieza') && o.includes('NameError') && o.includes('roto.py');
});
probar('un error de Lua nombra archivo, línea y causa', () => {
  const o = run(prog(), 'lua ejemplos/roto.lua').output;
  return o.includes('roto.lua:2') && o.includes('attempt to perform arithmetic');
});
probar('un archivo inexistente da error del intérprete', () => run(prog(), 'python3 no-existe.py').code === 2);
probar('un bucle infinito se corta en vez de colgar la app', () => {
  const r = run(prog(), `lua -e 'while true do end'`);
  return r.code === 1 && /no termina/.test(r.output);
});
probar('printf reutiliza el formato con varios argumentos', () => run(prog(), `printf '%s\\n' uno dos tres`).output === 'uno\ndos\ntres\n');

console.log(`${ok} pruebas nuevas de shell pasadas, ${mal} fallidas`);
process.exit(mal ? 1 : 0);
