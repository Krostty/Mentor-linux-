// Modo Incidente: escenarios de crisis cronometrados.
// Cada uno plantea una situación real, arranca un reloj y te pide resolverla
// paso a paso en la terminal. Al final da un informe con lo que hiciste.
import * as k from './checks.js';

export const INCIDENTES = [
  {
    id: 'servicio-caido',
    titulo: 'La web está caída',
    gravedad: 'crítica',
    minutos: 6,
    xp: 200,
    snapshot: 'diagnostico',
    aviso: 'Son las 03:14. Te suena el móvil: la web no responde y hay clientes quejándose. Entras al servidor por SSH.',
    objetivos: [
      {
        id: 'ver-fallidos',
        texto: 'Averigua qué servicio está caído',
        check: (c) => k.usó(c, /systemctl\s+(status|list-failed|list-units)/),
        ayuda: 'Empieza por lo obvio: ¿qué servicios están en estado fallido? `systemctl list-failed`',
      },
      {
        id: 'leer-log',
        texto: 'Lee su registro para saber por qué murió',
        check: (c) => k.usó(c, /journalctl/),
        ayuda: 'La causa está escrita en el diario del sistema: `journalctl -u render-worker -n 20`',
      },
      {
        id: 'arrancar',
        texto: 'Vuelve a levantarlo',
        check: (c) => {
          const s = c.shell.state.services;
          return !!s && s['render-worker'] && s['render-worker'].active;
        },
        ayuda: 'Con `sudo systemctl start render-worker`. Recuerda que hace falta sudo.',
      },
      {
        id: 'persistente',
        texto: 'Asegúrate de que sobreviva a un reinicio',
        check: (c) => {
          const s = c.shell.state.services;
          return !!s && s['render-worker'] && s['render-worker'].enabled;
        },
        ayuda: 'Arrancarlo no basta: si la máquina reinicia, vuelve a caerse. `sudo systemctl enable render-worker`',
      },
    ],
    conclusion:
      'El servicio estaba caído porque no pudo abrir su carpeta de caché, y además estaba `disabled`: no habría vuelto solo tras un reinicio. Diagnosticar y dejarlo persistente son dos pasos distintos, y olvidar el segundo es cómo un incidente vuelve la semana siguiente.',
  },

  {
    id: 'fuerza-bruta',
    titulo: 'Alguien está intentando entrar',
    gravedad: 'alta',
    minutos: 8,
    xp: 250,
    snapshot: 'base',
    aviso: 'El sistema de monitorización ha disparado una alerta: picos de intentos de autenticación fallidos en el servidor de producción. Hay que averiguar qué está pasando y si han conseguido entrar.',
    objetivos: [
      {
        id: 'ver-fallos',
        texto: 'Localiza los intentos fallidos en el registro',
        check: (c) => k.usó(c, /grep.*Failed|Failed.*grep|lastb/),
        ayuda: 'Los intentos fallidos dejan la cadena «Failed password»: `sudo grep "Failed password" /var/log/syslog`',
      },
      {
        id: 'identificar-ip',
        texto: 'Identifica desde qué IP vienen y cuántos son',
        check: (c) => k.usó(c, /uniq/) || k.usó(c, /grep\s+-c/),
        ayuda: 'Extrae la última columna y cuenta: `… | awk \'{print $NF}\' | sort | uniq -c | sort -rn`',
      },
      {
        id: 'comprobar-exito',
        texto: 'Comprueba si algún intento tuvo éxito',
        check: (c) => k.usó(c, /Accepted|grep.*Accept/i),
        ayuda: 'Un acceso correcto deja la palabra «Accepted»: `sudo grep Accepted /var/log/syslog`',
      },
      {
        id: 'blindar',
        texto: 'Cierra la puerta: cortafuegos denegando por defecto y SSH permitido',
        check: (c) => {
          const f = c.shell.state.firewall;
          return !!f && f.defaultIn === 'deny' && f.rules.some((r) => String(r.port) === '22');
        },
        ayuda: 'Primero `sudo ufw default deny incoming`, después `sudo ufw allow 22/tcp` y por último `sudo ufw enable`.',
      },
    ],
    conclusion:
      'Tres intentos fallidos desde 45.12.9.3 probando usuarios genéricos: un robot, no una persona. El acceso correcto fue por clave pública desde una IP interna, así que no entraron. La medida real es desactivar la autenticación por contraseña y poner fail2ban, no solo bloquear esa IP: mañana vendrán desde otra.',
  },

  {
    id: 'disco-lleno',
    titulo: 'No queda espacio en disco',
    gravedad: 'alta',
    minutos: 5,
    xp: 180,
    snapshot: 'busqueda',
    aviso: 'La aplicación ha dejado de escribir registros y devuelve errores. El aviso dice «No space left on device».',
    objetivos: [
      {
        id: 'ver-disco',
        texto: 'Comprueba el estado de las particiones',
        check: (c) => k.usó(c, /df/),
        ayuda: 'El comando de espacio en disco es `df -h`.',
      },
      {
        id: 'localizar',
        texto: 'Averigua qué está ocupando el espacio',
        check: (c) => k.usó(c, /du/),
        ayuda: '`du -sh *` te dice cuánto ocupa cada cosa de la carpeta actual.',
      },
      {
        id: 'limpiar',
        texto: 'Elimina los archivos temporales que sobran',
        check: (c) => !k.existe(c, 'proyectos/viejo/temporal.tmp') && !k.existe(c, 'proyectos/viejo/basura.tmp'),
        ayuda: 'Búscalos primero y luego bórralos: `find . -name "*.tmp" -delete`',
      },
    ],
    conclusion:
      'El orden correcto es siempre el mismo: `df` te dice **qué partición** está llena, `du` te dice **qué la llena**. Saltarse el primero lleva a limpiar la carpeta equivocada. Y antes de borrar con comodines, ejecuta la misma búsqueda sin `-delete`.',
  },

  {
    id: 'permisos-rotos',
    titulo: 'El despliegue no arranca',
    gravedad: 'media',
    minutos: 5,
    xp: 160,
    snapshot: 'permisos',
    aviso: 'El script de despliegue falla en cuanto se lanza. El equipo dice que «funcionaba ayer». Tienes que dejarlo operativo y de paso revisar que no haya nada mal configurado alrededor.',
    objetivos: [
      {
        id: 'reproducir',
        texto: 'Reproduce el error intentando ejecutarlo',
        check: (c) => k.usó(c, /\.\/deploy\.sh|bash\s+deploy\.sh/),
        ayuda: 'Lánzalo tal cual para ver el mensaje exacto: `./deploy.sh`',
      },
      {
        id: 'inspeccionar',
        texto: 'Mira sus permisos actuales',
        check: (c) => k.usó(c, /ls\s+-\w*l/),
        ayuda: '`ls -l deploy.sh` te enseña la fila de permisos.',
      },
      {
        id: 'arreglar',
        texto: 'Dale permiso de ejecución solo a su dueño',
        check: (c) => k.tieneBits(c, 'deploy.sh', k.bits.dueñoEjecuta) && k.sinBits(c, 'deploy.sh', k.bits.otrosEjecuta),
        ayuda: '`chmod u+x deploy.sh` — solo el dueño, sin abrirlo a los demás.',
      },
      {
        id: 'proteger',
        texto: 'Protege el archivo con credenciales que hay al lado',
        check: (c) => k.modo(c, 'notas-privadas.txt') === 0o600,
        ayuda: '`notas-privadas.txt` contiene una contraseña y lo puede leer todo el mundo: `chmod 600 notas-privadas.txt`',
      },
    ],
    conclusion:
      'El fallo era un `chmod` perdido, pero lo importante del incidente fue lo que encontraste de camino: un archivo con credenciales legible por cualquiera. Arreglar el síntoma sin mirar alrededor es cómo se acumulan los problemas.',
  },

  {
    id: 'auditoria-suid',
    titulo: 'Auditoría antes de salir a producción',
    gravedad: 'media',
    minutos: 7,
    xp: 220,
    snapshot: 'base',
    aviso: 'El servidor sale a internet mañana. Tienes que revisarlo antes: qué está expuesto, qué privilegios hay repartidos y qué cuentas pueden entrar.',
    objetivos: [
      {
        id: 'puertos',
        texto: 'Inventaría qué servicios están escuchando',
        check: (c) => k.usó(c, /ss\s|netstat/),
        ayuda: '`ss -tulpn` lista puertos en escucha y el proceso que los abre.',
      },
      {
        id: 'suid',
        texto: 'Audita los binarios con SUID',
        check: (c) => k.usó(c, /-perm\s+-?\/?4000/),
        ayuda: '`find / -perm -4000 2>/dev/null`',
      },
      {
        id: 'capabilities',
        texto: 'Revisa también las capabilities repartidas',
        check: (c) => k.usó(c, /getcap/),
        ayuda: '`getcap -r / 2>/dev/null`',
      },
      {
        id: 'cuentas',
        texto: 'Comprueba qué cuentas tienen shell real',
        check: (c) => k.usó(c, /passwd/) && k.usó(c, /grep/),
        ayuda: '`grep -v nologin /etc/passwd` deja fuera las cuentas de servicio.',
      },
      {
        id: 'ssh',
        texto: 'Verifica la configuración de SSH',
        check: (c) => k.usó(c, /sshd_config/),
        ayuda: '`grep -E "PermitRootLogin|PasswordAuthentication" /etc/ssh/sshd_config`',
      },
    ],
    conclusion:
      'Esta es la revisión que se hace antes de exponer cualquier máquina: qué escucha, quién tiene privilegios, quién puede entrar y cómo. Ninguno de estos comandos es nuevo — es el mismo Linux de los módulos anteriores, mirado con la pregunta «qué está mal configurado aquí».',
  },
];

export const INCIDENTE_POR_ID = Object.fromEntries(INCIDENTES.map((i) => [i.id, i]));
