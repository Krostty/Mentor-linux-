// Refuerzos de contenido para las salas 1–10.
//
// Las salas heredadas del currículo v1 solo traían dos tipos de ejercicio:
// test y terminal. Les faltaban los tres que más consolidan y que ya usa la
// sala 0: construir el comando pieza a pieza, rellenar el hueco que falta y
// recordar la salida exacta. Aquí se añaden, apoyados en los comandos reales
// que enseña cada sala.
//
// Formato compacto:
//   t: tipo · e: enunciado · x: explicación
//   ordenar   → k: piezas a ordenar · r: comando correcto
//   completar → p: plantilla con ___ · r: respuestas aceptadas
//   respuesta → r: respuestas aceptadas
//   quiz      → o: opciones · c: índice de la correcta

export const REFUERZOS_1 = {
  // ==================================================================
  inicio: [
    { t: 'ordenar', id: 'rf-inicio-1', e: 'Ordena las piezas para que la terminal escriba «Hola Linux».', k: ['echo', 'Hola', 'Linux'], r: 'echo Hola Linux', x: 'Primero el comando y después lo que quieres imprimir. `echo` repite tal cual lo que le des.' },
    { t: 'ordenar', id: 'rf-inicio-2', e: 'Monta el comando que muestra el manual de `ls`.', k: ['man', 'ls'], r: 'man ls', x: '`man` abre la documentación completa del comando que le indiques.' },
    { t: 'completar', id: 'rf-inicio-3', e: 'Completa el comando que muestra toda la información del sistema.', p: 'uname ___', r: ['-a', '--all'], x: '`-a` viene de *all*: kernel, versión, arquitectura y nombre de la máquina de una vez.' },
    { t: 'completar', id: 'rf-inicio-4', e: 'Completa el comando que dice con qué usuario estás trabajando.', p: '___', r: ['whoami', 'id -un'], x: '`whoami` responde justo eso: quién soy. `id -un` da lo mismo por otro camino.' },
    { t: 'respuesta', id: 'rf-inicio-5', e: 'Si tu usuario es `user`, ¿qué imprime exactamente `whoami`?', r: ['user'], x: 'Solo el nombre, sin adornos ni salto visible: `user`.' },
    { t: 'respuesta', id: 'rf-inicio-6', e: '¿Qué símbolo aparece al final del prompt cuando eres un usuario normal?', r: ['$'], x: '`$` para usuario normal y `#` para root. Ver una almohadilla significa que puedes romperlo todo.' },
    { t: 'quiz', id: 'rf-inicio-7', e: '¿Qué programa lee e interpreta lo que escribes en la terminal?', o: ['La shell', 'El kernel', 'El monitor', 'El teclado'], c: 0, x: 'La terminal es solo la ventana. Quien interpreta y ejecuta es la shell, normalmente bash.' },
    { t: 'quiz', id: 'rf-inicio-8', e: 'Escribes un comando y sale `command not found`. ¿Qué ha pasado?', o: ['El archivo está vacío', 'La shell no encontró ese programa en el PATH', 'Te faltan permisos', 'La red está caída'], c: 1, x: 'La shell buscó ese nombre en las carpetas del PATH y no lo encontró: mal escrito o no instalado.' },
    { t: 'quiz', id: 'rf-inicio-9', e: '¿Para qué sirve `--help` frente a `man`?', o: ['Hace lo mismo', 'Da un resumen rápido de las opciones', 'Instala el manual', 'Solo funciona como root'], c: 1, x: '`--help` es el resumen que usarás el 90% de las veces; `man` es la referencia completa.' },
    { t: 'completar', id: 'rf-inicio-10', e: 'Completa el comando que limpia la pantalla sin borrar nada.', p: '___', r: ['clear'], x: 'Solo limpia lo que se ve. Ni tus archivos ni el historial se tocan.' },
  ],

  // ==================================================================
  navegacion: [
    { t: 'ordenar', id: 'rf-nav-1', e: 'Construye el comando que lista con detalle el contenido de `/etc`.', k: ['ls', '-l', '/etc'], r: 'ls -l /etc', x: 'Comando, opción y por último sobre qué actuar. Ese orden se repite en casi todo Linux.' },
    { t: 'ordenar', id: 'rf-nav-2', e: 'Construye el comando que muestra los archivos ocultos con sus permisos.', k: ['ls', '-la'], r: 'ls -la', x: '`-l` da el formato largo y `-a` incluye los que empiezan por punto. Se juntan en una sola opción.' },
    { t: 'ordenar', id: 'rf-nav-3', e: 'Construye el comando que sube dos niveles de carpeta de una vez.', k: ['cd', '../..'], r: 'cd ../..', x: 'Cada `..` sube un nivel; encadenados con `/` suben varios en un solo paso.' },
    { t: 'completar', id: 'rf-nav-4', e: 'Completa la opción que hace legibles los tamaños (4.0K en vez de 4096).', p: 'ls -l___', r: ['h', '-h'], x: '`-h` de *human readable*. Se pega a las demás: `ls -lh`.' },
    { t: 'completar', id: 'rf-nav-5', e: 'Completa el atajo que te devuelve a la carpeta anterior.', p: 'cd ___', r: ['-'], x: '`cd -` alterna entre la carpeta actual y la última en la que estuviste. Muy cómodo.' },
    { t: 'completar', id: 'rf-nav-6', e: 'Completa el comando que dibuja solo las carpetas, sin archivos.', p: 'tree ___', r: ['-d'], x: '`-d` de *directories*: deja fuera los archivos y enseña la estructura limpia.' },
    { t: 'respuesta', id: 'rf-nav-7', e: 'Estás en `/home/user` y escribes `cd /etc`. ¿Qué imprimiría `pwd` justo después?', r: ['/etc'], x: 'Al empezar por `/` la ruta es absoluta: ignora dónde estabas.' },
    { t: 'respuesta', id: 'rf-nav-8', e: '¿Qué carpeta del sistema guarda los archivos de configuración?', r: ['/etc', 'etc'], x: '`/etc` es donde vive la configuración de todo el sistema.' },
    { t: 'respuesta', id: 'rf-nav-9', e: '¿A qué carpeta te lleva `cd` sin ningún argumento?', r: ['/home/user', '~', 'home', 'a mi carpeta personal'], x: '`cd` a secas equivale a `cd ~`: tu carpeta personal.' },
    { t: 'quiz', id: 'rf-nav-10', e: '¿Cuál de estas rutas funciona igual desde cualquier carpeta?', o: ['documentos/facturas', './notas.txt', '/var/log/syslog', '../etc'], c: 2, x: 'Las absolutas empiezan por `/` y siempre significan lo mismo. Las demás dependen de dónde estés.' },
    { t: 'quiz', id: 'rf-nav-11', e: 'En `ls -l`, ¿qué indica una `d` en el primer carácter?', o: ['Que está en disco', 'Que es un directorio', 'Que se puede borrar', 'Que está duplicado'], c: 1, x: 'El primer carácter es el tipo: `-` archivo, `d` directorio, `l` enlace simbólico.' },
    { t: 'quiz', id: 'rf-nav-12', e: 'Quieres ver qué se modificó más recientemente en una carpeta. ¿Qué opción usas?', o: ['ls -S', 'ls -t', 'ls -R', 'ls -i'], c: 1, x: '`-t` ordena por fecha, lo más nuevo primero. `-S` ordena por tamaño.' },
  ],

  // ==================================================================
  archivos: [
    { t: 'ordenar', id: 'rf-arch-1', e: 'Construye el comando que crea la ruta `trabajo/2026/enero` completa de una vez.', k: ['mkdir', '-p', 'trabajo/2026/enero'], r: 'mkdir -p trabajo/2026/enero', x: 'Sin `-p` falla, porque `mkdir` solo crea el último nivel y exige que los de arriba existan.' },
    { t: 'ordenar', id: 'rf-arch-2', e: 'Construye el comando que copia la carpeta `web` entera como `web-backup`.', k: ['cp', '-r', 'web', 'web-backup'], r: 'cp -r web web-backup', x: 'Sin `-r`, `cp` avisa de que omite el directorio: por defecto solo copia archivos sueltos.' },
    { t: 'ordenar', id: 'rf-arch-3', e: 'Construye el enlace simbólico `registro` que apunta a `/var/log/syslog`.', k: ['ln', '-s', '/var/log/syslog', 'registro'], r: 'ln -s /var/log/syslog registro', x: 'Primero a dónde apunta y después cómo se llama. Invertirlos es el error clásico.' },
    { t: 'completar', id: 'rf-arch-4', e: 'Completa la opción que borra una carpeta con todo lo que hay dentro.', p: 'rm ___ descargas', r: ['-r', '-rf', '-R'], x: '`-r` de recursivo. Sin ella `rm` se niega y dice `Is a directory`.' },
    { t: 'completar', id: 'rf-arch-5', e: 'Completa el comando que renombra `viejo.txt` como `nuevo.txt`.', p: '___ viejo.txt nuevo.txt', r: ['mv'], x: 'En Linux no hay comando «rename»: renombrar es mover al mismo sitio con otro nombre.' },
    { t: 'completar', id: 'rf-arch-6', e: 'Completa el comando que crea un archivo vacío llamado `notas.txt`.', p: '___ notas.txt', r: ['touch'], x: '`touch` lo crea si no existe y, si ya existe, solo actualiza su fecha.' },
    { t: 'respuesta', id: 'rf-arch-7', e: '¿Qué mensaje da `rmdir` sobre una carpeta que todavía tiene archivos?', r: ['Directory not empty', 'directory not empty', 'no está vacía'], x: '`rmdir` es la opción segura: solo borra carpetas vacías. Para el resto, `rm -r`.' },
    { t: 'respuesta', id: 'rf-arch-8', e: 'En `ls -l`, ¿qué letra identifica a un enlace simbólico?', r: ['l', 'L'], x: 'La `l` de *link*, en el primer carácter de la fila.' },
    { t: 'respuesta', id: 'rf-arch-9', e: '¿Qué le pasa al contenido de `notas.txt` si ejecutas `touch notas.txt` y ya existía?', r: ['nada', 'no cambia', 'se mantiene', 'sigue igual'], x: 'No lo toca. Solo actualiza la fecha de modificación.' },
    { t: 'quiz', id: 'rf-arch-10', e: 'Copias con `cp a.txt b.txt` y `b.txt` ya existía. ¿Qué ocurre?', o: ['Da error', 'Pregunta antes', 'Lo sobrescribe sin avisar', 'Crea b.txt.1'], c: 2, x: 'Sobrescribe en silencio. Para que pregunte hay que añadir `-i`.' },
    { t: 'quiz', id: 'rf-arch-11', e: '¿Qué costumbre evita desastres antes de un `rm` con comodines?', o: ['Ejecutar el mismo patrón con ls primero', 'Usar siempre -f', 'Hacerlo como root', 'Borrar de uno en uno'], c: 0, x: 'Si `ls *.tmp` lista lo que esperas, `rm *.tmp` borrará exactamente eso y nada más.' },
    { t: 'quiz', id: 'rf-arch-12', e: 'Borras el archivo original al que apuntaba un enlace simbólico. ¿Qué pasa con el enlace?', o: ['Se borra solo', 'Queda roto y apunta a la nada', 'Conserva una copia', 'Se convierte en archivo'], c: 1, x: 'El enlace sobrevive pero queda colgando: apunta a una ruta que ya no existe.' },
  ],

  // ==================================================================
  texto: [
    { t: 'ordenar', id: 'rf-txt-1', e: 'Construye el comando que muestra las 5 primeras líneas de `/etc/passwd`.', k: ['head', '-n', '5', '/etc/passwd'], r: 'head -n 5 /etc/passwd', x: 'Sin `-n` muestra 10 por defecto. El número va justo detrás de la opción.' },
    { t: 'ordenar', id: 'rf-txt-2', e: 'Construye el comando que cuenta cuántas líneas tiene `/etc/passwd`.', k: ['wc', '-l', '/etc/passwd'], r: 'wc -l /etc/passwd', x: '`wc` viene de *word count* y `-l` restringe la cuenta a líneas.' },
    { t: 'ordenar', id: 'rf-txt-3', e: 'Construye el comando que guarda «hola» en `saludo.txt` sin borrar lo que hubiera.', k: ['echo', 'hola', '>>', 'saludo.txt'], r: 'echo hola >> saludo.txt', x: 'La doble flecha añade al final. Una sola habría borrado el archivo entero.' },
    { t: 'completar', id: 'rf-txt-4', e: 'Completa la opción que numera las líneas al mostrar un archivo.', p: 'cat ___ notas.txt', r: ['-n'], x: '`-n` pone el número de línea delante de cada una.' },
    { t: 'completar', id: 'rf-txt-5', e: 'Completa el comando que vigila un registro en vivo, mostrando lo nuevo según llega.', p: 'tail ___ /var/log/syslog', r: ['-f', '-F'], x: '`-f` de *follow*. Es la forma estándar de mirar un registro mientras reproduces un error.' },
    { t: 'completar', id: 'rf-txt-6', e: 'Completa el símbolo que guarda la salida en un archivo borrando lo anterior.', p: 'ls -l ___ listado.txt', r: ['>'], x: 'Una flecha sobrescribe, dos añaden. Es la diferencia que más disgustos da.' },
    { t: 'respuesta', id: 'rf-txt-7', e: 'Ejecutas `echo uno > a.txt` y luego `echo dos > a.txt`. ¿Qué contiene `a.txt`?', r: ['dos'], x: 'La segunda redirección borró el archivo y escribió de cero. Con `>>` tendrías las dos líneas.' },
    { t: 'respuesta', id: 'rf-txt-8', e: '¿Cuántas líneas muestra `head` si no le indicas ninguna cantidad?', r: ['10', 'diez'], x: 'Diez por defecto, igual que `tail`.' },
    { t: 'respuesta', id: 'rf-txt-9', e: '¿De qué palabra viene el nombre del comando `cat`?', r: ['concatenate', 'concatenar', 'concatenate/concatenar'], x: 'De *concatenate*: su función original era pegar archivos uno detrás de otro.' },
    { t: 'quiz', id: 'rf-txt-10', e: '¿Por qué es mala idea hacer `cat` de un registro de 200.000 líneas?', o: ['Borra el archivo', 'Vuelca todo de golpe y te inunda la pantalla', 'Necesita sudo', 'No funciona con .log'], c: 1, x: 'Para archivos grandes se usa `less`, `head` o `tail`, que muestran solo un trozo.' },
    { t: 'quiz', id: 'rf-txt-11', e: '¿Qué hace `wc -w`?', o: ['Cuenta líneas', 'Cuenta palabras', 'Cuenta bytes', 'Cuenta archivos'], c: 1, x: '`-l` líneas, `-w` palabras y `-c` bytes.' },
    { t: 'quiz', id: 'rf-txt-12', e: 'Quieres las últimas 20 líneas de un registro. ¿Qué usas?', o: ['head -n 20', 'tail -n 20', 'cat -20', 'wc -l'], c: 1, x: 'El final de un registro es lo más reciente, y ahí es donde suele estar el error.' },
  ],

  // ==================================================================
  permisos: [
    { t: 'ordenar', id: 'rf-perm-1', e: 'Construye el comando que da permiso de ejecución solo al dueño de `deploy.sh`.', k: ['chmod', 'u+x', 'deploy.sh'], r: 'chmod u+x deploy.sh', x: '`u` es el dueño, `+` añade y `x` es ejecutar. Todo pegado, sin espacios.' },
    { t: 'ordenar', id: 'rf-perm-2', e: 'Construye el comando que deja `secreto.txt` accesible solo para su dueño.', k: ['chmod', '600', 'secreto.txt'], r: 'chmod 600 secreto.txt', x: '6 es rw para el dueño y los dos ceros dejan a grupo y otros sin nada.' },
    { t: 'ordenar', id: 'rf-perm-3', e: 'Construye el comando que cambia el dueño de `informe.txt` a `ana`, con privilegios.', k: ['sudo', 'chown', 'ana', 'informe.txt'], r: 'sudo chown ana informe.txt', x: 'Cambiar la propiedad está reservado a root, por eso hace falta `sudo` delante.' },
    { t: 'completar', id: 'rf-perm-4', e: 'Completa los permisos típicos de un script ejecutable por todos.', p: 'chmod ___ script.sh', r: ['755', '0755'], x: '7 dueño (rwx), 5 grupo (r-x), 5 otros (r-x). Es el estándar para scripts y carpetas.' },
    { t: 'completar', id: 'rf-perm-5', e: 'Completa la opción que aplica el cambio a todo el contenido de la carpeta.', p: 'chmod ___ g+w compartido', r: ['-R', '--recursive'], x: 'Sin `-R` solo cambia la carpeta y los archivos de dentro se quedan igual.' },
    { t: 'completar', id: 'rf-perm-6', e: 'Completa el comando que muestra tu usuario, grupo y grupos secundarios.', p: '___', r: ['id'], x: 'Dos letras que resumen toda tu identidad en el sistema.' },
    { t: 'respuesta', id: 'rf-perm-7', e: '¿A qué permisos equivale el número 644 en letras?', r: ['rw-r--r--', 'rw-r--r--'], x: '6 = rw, 4 = r, 4 = r. Es el estándar para archivos normales.' },
    { t: 'respuesta', id: 'rf-perm-8', e: 'Ejecutas un script y responde `Permission denied`. ¿Qué permiso le falta?', r: ['x', 'ejecución', 'ejecutar', 'execute'], x: 'Le falta el bit `x`. Se arregla con `chmod +x`.' },
    { t: 'respuesta', id: 'rf-perm-9', e: 'En `-rwxr-xr--`, ¿qué puede hacer alguien que no es ni el dueño ni del grupo?', r: ['leer', 'solo leer', 'r', 'leerlo'], x: 'Los últimos tres caracteres son `r--`: solo lectura.' },
    { t: 'quiz', id: 'rf-perm-10', e: '¿Qué permiso necesita una carpeta para poder entrar en ella con `cd`?', o: ['r', 'w', 'x', 'ninguno'], c: 2, x: 'En carpetas, `x` significa poder atravesarla. Sin `r` entras pero no puedes listar lo que hay.' },
    { t: 'quiz', id: 'rf-perm-11', e: '¿Por qué `chown` exige ser root?', o: ['Por costumbre', 'Para que nadie pueda endosar sus archivos a otro usuario', 'Porque es lento', 'No lo exige'], c: 1, x: 'Si pudieras regalar archivos, podrías saltarte cuotas de disco y esquivar responsabilidades.' },
    { t: 'quiz', id: 'rf-perm-12', e: 'Un comando falla con «are you root?». ¿Cuál es la solución habitual?', o: ['Repetirlo con sudo delante', 'Cambiar de carpeta', 'Reiniciar', 'Usar chmod 777'], c: 0, x: 'Ese mensaje pide privilegios. Distinto de «No such file», donde sudo no arregla nada.' },
  ],

  // ==================================================================
  busqueda: [
    { t: 'ordenar', id: 'rf-bus-1', e: 'Construye la búsqueda de todos los archivos `.log` desde la carpeta actual.', k: ['find', '.', '-name', '"*.log"'], r: 'find . -name "*.log"', x: 'El patrón va entre comillas para que la shell no expanda el asterisco antes de tiempo.' },
    { t: 'ordenar', id: 'rf-bus-2', e: 'Construye la búsqueda de la palabra TODO dentro de todos los archivos de `proyectos`.', k: ['grep', '-r', 'TODO', 'proyectos'], r: 'grep -r TODO proyectos', x: 'Sin `-r`, grep no sabe qué hacer con una carpeta y responde `Is a directory`.' },
    { t: 'ordenar', id: 'rf-bus-3', e: 'Construye la auditoría que busca binarios con el bit SUID en todo el sistema.', k: ['find', '/', '-perm', '-4000', '2>/dev/null'], r: 'find / -perm -4000 2>/dev/null', x: '4000 es el bit SUID y `2>/dev/null` esconde los cientos de «Permission denied».' },
    { t: 'completar', id: 'rf-bus-4', e: 'Completa la opción que hace que grep ignore mayúsculas y minúsculas.', p: 'grep ___ error registro.log', r: ['-i', '--ignore-case'], x: '`-i` encuentra error, Error y ERROR por igual.' },
    { t: 'completar', id: 'rf-bus-5', e: 'Completa la opción que muestra las líneas que NO contienen el patrón.', p: 'grep ___ INFO app.log', r: ['-v', '--invert-match'], x: '`-v` invierte el filtro. Perfecto para quitar ruido de un registro.' },
    { t: 'completar', id: 'rf-bus-6', e: 'Completa la condición que limita la búsqueda solo a carpetas.', p: 'find . -type ___', r: ['d'], x: '`d` de directorio; `f` para archivos normales y `l` para enlaces.' },
    { t: 'respuesta', id: 'rf-bus-7', e: '¿Qué opción de grep cuenta las coincidencias en vez de mostrarlas?', r: ['-c', 'c', '--count'], x: '`-c` devuelve solo el número, que muchas veces es lo único que necesitas.' },
    { t: 'respuesta', id: 'rf-bus-8', e: '¿Qué acción de `find` borra directamente lo que encuentra?', r: ['-delete', 'delete'], x: 'Antes de usarla, ejecuta la misma búsqueda sin ella y comprueba la lista.' },
    { t: 'respuesta', id: 'rf-bus-9', e: 'En `find . -name "*.txt"`, ¿por qué van las comillas?', r: ['para que la shell no expanda el asterisco', 'para que no lo expanda la shell', 'para proteger el asterisco', 'para que el asterisco llegue a find'], x: 'Sin comillas la shell sustituye el `*` antes y find recibe algo distinto de lo que querías.' },
    { t: 'quiz', id: 'rf-bus-10', e: '¿Qué hace `{}` dentro de `find -exec`?', o: ['Agrupa comandos', 'Se sustituye por cada archivo encontrado', 'Marca el final', 'Crea una carpeta'], c: 1, x: 'Y el `;` marca dónde termina el comando que se ejecuta por cada resultado.' },
    { t: 'quiz', id: 'rf-bus-11', e: '¿Qué opción de grep muestra el número de línea de cada coincidencia?', o: ['-l', '-n', '-c', '-w'], c: 1, x: '`-n` numera; `-l` en minúscula da solo los nombres de archivo.' },
    { t: 'quiz', id: 'rf-bus-12', e: 'Quieres encontrar «red» pero no «redondo» ni «credo». ¿Qué opción usas?', o: ['-i', '-w', '-v', '-r'], c: 1, x: '`-w` exige que sea una palabra completa, con límites a ambos lados.' },
  ],

  // ==================================================================
  pipes: [
    { t: 'ordenar', id: 'rf-pipe-1', e: 'Construye la cadena que cuenta cuántas líneas con 404 hay en `acceso.log`.', k: ['grep', '404', 'acceso.log', '|', 'wc', '-l'], r: 'grep 404 acceso.log | wc -l', x: 'Primero filtras y después cuentas. Cada tramo recibe lo que produjo el anterior.' },
    { t: 'ordenar', id: 'rf-pipe-2', e: 'Construye la cadena que cuenta cuántas veces se repite cada palabra.', k: ['sort', 'palabras.txt', '|', 'uniq', '-c'], r: 'sort palabras.txt | uniq -c', x: '`uniq` solo agrupa repeticiones seguidas, por eso hay que ordenar antes.' },
    { t: 'ordenar', id: 'rf-pipe-3', e: 'Construye el ranking: cuenta repeticiones y ordena de mayor a menor.', k: ['sort', 'log.txt', '|', 'uniq', '-c', '|', 'sort', '-rn'], r: 'sort log.txt | uniq -c | sort -rn', x: 'Es la cadena más útil que existe para analizar registros: filtrar, contar y ordenar.' },
    { t: 'completar', id: 'rf-pipe-4', e: 'Completa la opción que hace que `sort` ordene como números y no como texto.', p: 'sort ___ numeros.txt', r: ['-n', '--numeric-sort'], x: 'Sin `-n` compara carácter a carácter, y así el 108 queda antes que el 3.' },
    { t: 'completar', id: 'rf-pipe-5', e: 'Completa el separador para extraer el primer campo de `/etc/passwd`.', p: 'cut ___ -f1 /etc/passwd', r: ['-d:', '-d ":"', "-d':'"], x: 'El separador por defecto de `cut` es el tabulador; este archivo usa dos puntos.' },
    { t: 'completar', id: 'rf-pipe-6', e: 'Completa el campo de awk que devuelve la última columna de cada línea.', p: "awk '{print ___}'", r: ['$NF', 'NF'], x: '`NF` es el número de campos, así que `$NF` es siempre el último.' },
    { t: 'respuesta', id: 'rf-pipe-7', e: '¿Qué símbolo conecta la salida de un comando con la entrada del siguiente?', r: ['|', 'pipe', 'tubería'], x: 'La tubería. Es la idea que hace potente a Linux: comandos pequeños encadenados.' },
    { t: 'respuesta', id: 'rf-pipe-8', e: 'En awk, ¿qué campo representa la línea entera?', r: ['$0', '0'], x: '`$0` es la línea completa; `$1`, `$2`… son las columnas.' },
    { t: 'respuesta', id: 'rf-pipe-9', e: '¿Qué letra al final de `s/viejo/nuevo/` hace que sed cambie todas las apariciones de la línea?', r: ['g', 'la g'], x: 'Sin la `g` solo sustituye la primera coincidencia de cada línea.' },
    { t: 'quiz', id: 'rf-pipe-10', e: '¿Cómo se depura una cadena larga de pipes que no da lo esperado?', o: ['Ejecutarla como root', 'Quitar el último tramo y mirar la salida intermedia', 'Añadir más pipes', 'Reiniciar la terminal'], c: 1, x: 'Se construye y se comprueba por partes: si la salida intermedia ya está mal, el fallo está antes.' },
    { t: 'quiz', id: 'rf-pipe-11', e: '¿Qué tiene de peligroso `sed -i`?', o: ['Es lento', 'Modifica el archivo original sin copia de seguridad', 'Solo funciona como root', 'Borra el archivo'], c: 1, x: 'Prueba siempre sin `-i` primero y, cuando la salida sea la correcta, añádelo.' },
    { t: 'quiz', id: 'rf-pipe-12', e: '¿Qué hace `tee` que no hace una redirección normal?', o: ['Comprime la salida', 'La muestra por pantalla y la guarda a la vez', 'Ordena el resultado', 'Cifra el archivo'], c: 1, x: 'Parte el flujo en dos, como una T de fontanería: sigue por el pipe y además se escribe.' },
  ],

  // ==================================================================
  procesos: [
    { t: 'ordenar', id: 'rf-proc-1', e: 'Construye el comando que busca el proceso de nginx entre todos los del sistema.', k: ['ps', 'aux', '|', 'grep', 'nginx'], r: 'ps aux | grep nginx', x: '`ps aux` lista todo y `grep` se queda con lo que te interesa.' },
    { t: 'ordenar', id: 'rf-proc-2', e: 'Construye el comando que muestra la memoria en unidades legibles.', k: ['free', '-h'], r: 'free -h', x: '`-h` convierte los kilobytes en Mi y Gi, que es como se lee de verdad.' },
    { t: 'ordenar', id: 'rf-proc-3', e: 'Construye el comando que mide cuánto ocupa la carpeta actual, con un solo número.', k: ['du', '-sh', '.'], r: 'du -sh .', x: '`-s` da solo el total en vez de desglosar, y `-h` lo hace legible.' },
    { t: 'completar', id: 'rf-proc-4', e: 'Completa la señal que mata un proceso sin darle opción a reaccionar.', p: 'kill ___ 1533', r: ['-9', '-KILL', '-SIGKILL'], x: 'Es el último recurso: el proceso no guarda, no cierra archivos y puede dejar datos a medias.' },
    { t: 'completar', id: 'rf-proc-5', e: 'Completa el comando que termina todos los procesos con un nombre concreto.', p: '___ nginx', r: ['killall', 'pkill'], x: '`kill` espera un PID; para trabajar por nombre están `killall` y `pkill`.' },
    { t: 'completar', id: 'rf-proc-6', e: 'Completa el comando que muestra el espacio libre por partición.', p: '___ -h', r: ['df'], x: '`df` mide particiones y `du` mide carpetas. Confundirlos es habitual.' },
    { t: 'respuesta', id: 'rf-proc-7', e: '¿Cómo se llama el número que identifica de forma única a un proceso?', r: ['PID', 'pid', 'process id'], x: 'Es la segunda columna de `ps aux` y lo que espera `kill`.' },
    { t: 'respuesta', id: 'rf-proc-8', e: 'En `free -h`, ¿qué columna indica la memoria realmente disponible?', r: ['available', 'disponible'], x: '«free» excluye la caché, que el sistema libera cuando hace falta. «available» es la cifra útil.' },
    { t: 'respuesta', id: 'rf-proc-9', e: 'Un servidor va lento. ¿Qué comando abres primero para ver quién consume CPU?', r: ['top', 'htop'], x: '`top` ordena los procesos por consumo y se refresca solo.' },
    { t: 'quiz', id: 'rf-proc-10', e: '¿Por qué se recomienda `kill` antes que `kill -9`?', o: ['Es más rápido', 'Permite al proceso cerrar ordenadamente', '-9 no siempre funciona', 'No hay diferencia'], c: 1, x: 'La señal por defecto le da la oportunidad de guardar y limpiar antes de salir.' },
    { t: 'quiz', id: 'rf-proc-11', e: 'El load average marca 8.0 en una máquina de 2 núcleos. ¿Qué significa?', o: ['Va sobrada', 'Hay mucha más cola de trabajo que capacidad', 'Faltan 8 GB de RAM', 'Hay 8 usuarios'], c: 1, x: 'La carga se compara con el número de núcleos: 8 en 2 núcleos es saturación clara.' },
    { t: 'quiz', id: 'rf-proc-12', e: '¿Qué hace `df -h` que no hace `du -sh`?', o: ['Nada, son iguales', 'Mide particiones enteras en vez de una carpeta', 'Borra temporales', 'Lista procesos'], c: 1, x: 'Ante un disco lleno: `df` dice qué partición y `du` dice qué la llena. En ese orden.' },
  ],

  // ==================================================================
  paquetes: [
    { t: 'ordenar', id: 'rf-paq-1', e: 'Construye el comando que actualiza la lista de paquetes disponibles.', k: ['sudo', 'apt', 'update'], r: 'sudo apt update', x: 'Solo refresca el catálogo. Actualizar los programas instalados es `apt upgrade`.' },
    { t: 'ordenar', id: 'rf-paq-2', e: 'Construye el comando que instala `htop`.', k: ['sudo', 'apt', 'install', 'htop'], r: 'sudo apt install htop', x: 'Escribe en carpetas del sistema, por eso necesita privilegios.' },
    { t: 'ordenar', id: 'rf-paq-3', e: 'Construye el comando que lista qué archivos instaló el paquete `nginx`.', k: ['dpkg', '-L', 'nginx'], r: 'dpkg -L nginx', x: '`-L` en mayúscula lista archivos; `-l` en minúscula lista paquetes.' },
    { t: 'completar', id: 'rf-paq-4', e: 'Completa el gestor de paquetes de Fedora y RHEL.', p: 'sudo ___ install htop', r: ['dnf', 'yum'], x: 'Los verbos son los mismos que en apt; solo cambia el nombre del gestor.' },
    { t: 'completar', id: 'rf-paq-5', e: 'Completa la opción de pacman que instala desde los repositorios.', p: 'sudo pacman ___ htop', r: ['-S', '-Sy'], x: '`-S` de *sync*. Para desinstalar es `-R` y para consultar `-Q`.' },
    { t: 'completar', id: 'rf-paq-6', e: 'Completa el comando que dice dónde está instalado un programa.', p: '___ python3', r: ['which', 'whereis'], x: '`which` da la ruta del ejecutable; `whereis` añade fuentes y manual.' },
    { t: 'respuesta', id: 'rf-paq-7', e: '¿Qué comando lista todos los paquetes instalados en Debian?', r: ['dpkg -l', 'apt list --installed'], x: 'Cualquiera de los dos sirve; `apt list --installed` es el más moderno.' },
    { t: 'respuesta', id: 'rf-paq-8', e: '¿Qué ventaja tiene instalar desde repositorio en vez de bajar un archivo suelto?', r: ['resuelve dependencias y verifica firmas', 'verifica la firma', 'resuelve dependencias', 'comprueba la firma y las dependencias'], x: 'El gestor comprueba la firma criptográfica y arrastra todo lo que el programa necesita.' },
    { t: 'respuesta', id: 'rf-paq-9', e: 'Intentas instalar sin sudo y falla. ¿Qué mensaje da apt?', r: ['are you root?', 'Permission denied', 'are you root'], x: 'Se queja de no poder abrir el archivo de bloqueo de dpkg.' },
    { t: 'quiz', id: 'rf-paq-10', e: '¿Cuál es el equivalente de `apt remove` en Arch Linux?', o: ['pacman -S', 'pacman -R', 'pacman -Q', 'pacman -U'], c: 1, x: '`-R` de *remove*. `-S` instala y `-Q` consulta.' },
    { t: 'quiz', id: 'rf-paq-11', e: '¿Qué hace exactamente `apt update`?', o: ['Actualiza los programas', 'Refresca la lista de paquetes disponibles', 'Instala todo', 'Limpia la caché'], c: 1, x: 'Es el paso previo: sin refrescar el catálogo, apt no conoce las versiones nuevas.' },
    { t: 'quiz', id: 'rf-paq-12', e: 'Instalas un paquete y apt responde «Unable to locate package». ¿Qué falta normalmente?', o: ['Reiniciar', 'Ejecutar apt update antes', 'Más espacio', 'Cambiar de usuario'], c: 1, x: 'O el nombre está mal escrito, o el catálogo local está desactualizado.' },
  ],

  // ==================================================================
  descriptores: [
    { t: 'ordenar', id: 'rf-desc-1', e: 'Construye el comando que guarda solo los errores en `errores.txt`.', k: ['ls', 'noexiste', '2>', 'errores.txt'], r: 'ls noexiste 2> errores.txt', x: 'El 2 es el descriptor de errores y va pegado a la flecha.' },
    { t: 'ordenar', id: 'rf-desc-2', e: 'Construye la búsqueda que descarta los errores de permisos.', k: ['find', '/', '-name', 'passwd', '2>/dev/null'], r: 'find / -name passwd 2>/dev/null', x: '`/dev/null` es un agujero negro: todo lo que se le escribe desaparece.' },
    { t: 'ordenar', id: 'rf-desc-3', e: 'Construye el comando que guarda salida y errores juntos en `todo.log`.', k: ['comando', '>', 'todo.log', '2>&1'], r: 'comando > todo.log 2>&1', x: 'Primero rediriges stdout al archivo y después mandas stderr al mismo sitio.' },
    { t: 'completar', id: 'rf-desc-4', e: 'Completa el número del descriptor de la salida normal.', p: 'El descriptor de stdout es el ___', r: ['1', 'uno'], x: '0 es stdin, 1 es stdout y 2 es stderr.' },
    { t: 'completar', id: 'rf-desc-5', e: 'Completa el destino que descarta cualquier cosa que se le escriba.', p: 'comando 2> ___', r: ['/dev/null', 'dev/null'], x: 'Es el dispositivo nulo: silencia el ruido sin guardar nada.' },
    { t: 'completar', id: 'rf-desc-6', e: 'Completa el comando que muestra por pantalla y guarda a la vez.', p: 'cat notas.txt | ___ copia.txt', r: ['tee'], x: 'Parte el flujo en dos: sigue viéndose y además se escribe en el archivo.' },
    { t: 'respuesta', id: 'rf-desc-7', e: '¿Qué número corresponde al canal de errores?', r: ['2', 'dos'], x: 'Por eso se escribe `2>` para redirigir solo los mensajes de fallo.' },
    { t: 'respuesta', id: 'rf-desc-8', e: 'En `2>&1`, ¿qué significa el `&1`?', r: ['el destino actual de stdout', 'donde va stdout', 'el descriptor 1', 'a donde apunta stdout'], x: 'No es un archivo llamado 1: es «donde esté apuntando ahora el descriptor 1».' },
    { t: 'respuesta', id: 'rf-desc-9', e: '¿Por qué están separados stdout y stderr?', r: ['para poder guardar los resultados y ver los errores aparte', 'para separar resultados de errores', 'para no mezclar errores con datos', 'para filtrar los errores'], x: 'Si fueran el mismo flujo, los errores contaminarían tus datos al guardarlos.' },
    { t: 'quiz', id: 'rf-desc-10', e: '¿Por qué `> f 2>&1` y `2>&1 > f` no hacen lo mismo?', o: ['Sí lo hacen', 'Porque el orden decide a dónde apunta cada flujo al copiarse', 'Porque el segundo da error', 'Por el espacio'], c: 1, x: 'En el segundo, stderr copia el destino de stdout antes de que este cambie, y se queda en pantalla.' },
    { t: 'quiz', id: 'rf-desc-11', e: '¿Qué hace `comando >/dev/null 2>&1`?', o: ['Guarda todo en un archivo', 'Silencia por completo el comando', 'Muestra solo errores', 'Duplica la salida'], c: 1, x: 'Salida y errores acaban en el agujero negro: silencio absoluto.' },
    { t: 'quiz', id: 'rf-desc-12', e: 'Ejecutas `ls existe.txt noexiste > salida.txt`. ¿Qué contiene el archivo?', o: ['Los dos nombres', 'Solo existe.txt', 'Solo el error', 'Nada'], c: 1, x: 'Solo se redirigió stdout. El error siguió apareciendo en la pantalla.' },
  ],
};
