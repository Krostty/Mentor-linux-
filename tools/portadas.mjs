// Generador de las portadas PNG.
//
// Cada portada es una escena compuesta: fondo con luz, rejilla en fuga,
// paneles de cristal con su cromo de ventana, código coloreado de verdad y
// piezas satélite (chips, barras, nodos) que cuentan de qué va la academia.
// Se monta en HTML/CSS y la rasteriza Chromium, así que se puede usar tipografía
// real, desenfoques y sombras que un SVG en línea no daría igual en todos los
// navegadores.
//
// Por qué PNG y no SVG en la app:
//   · el resultado es idéntico en cualquier navegador, sin depender de
//     `color-mix`, `mask-image` ni filtros;
//   · el navegador la decodifica una vez y la reutiliza en cada tarjeta, en
//     vez de re-renderizar el mismo dibujo decenas de veces al hacer scroll;
//   · se precachea con el service worker, así que sigue offline.
//
// Uso:  node tools/portadas.mjs             regenera todas
//       node tools/portadas.mjs linux       regenera solo una
//       node tools/portadas.mjs --lista     enumera sin generar
//
// El dibujo SVG de `js/arte.js` sigue siendo el respaldo: si falta un PNG, la
// app dibuja y no se rompe nada.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'assets', 'portadas');

// La portada se ve como mucho a 600 px de ancho; 1000 deja margen en pantallas
// densas sin que el archivo se dispare por culpa de los degradados.
const ANCHO = 1000;
const ALTO = 500;

const MONO = "ui-monospace, 'SF Mono', SFMono-Regular, 'JetBrains Mono', Menlo, Consolas, monospace";

// Cada acento trae su propio fondo: teñir uno solo apaga el ámbar y satura
// el rojo. `luz` es el color de los halos; `tinta`, el del papel de fondo.
const PALETA = {
  lime: { acento: '#3ee08f', luz: '#12d97a', tinta: '#04120d', medio: '#0a2b1e' },
  cyan: { acento: '#4cc2ff', luz: '#0ea5e9', tinta: '#03111d', medio: '#0a2740' },
  magenta: { acento: '#cf7ef5', luz: '#a855f7', tinta: '#0e0a1b', medio: '#251540' },
  red: { acento: '#ff7a6b', luz: '#f43f5e', tinta: '#170809', medio: '#37131b' },
  blue: { acento: '#7aa5ff', luz: '#3b6ef6', tinta: '#070d1f', medio: '#141f4a' },
  amber: { acento: '#ffb545', luz: '#f59e0b', tinta: '#150e03', medio: '#33230a' },
};

// --- piezas de composición --------------------------------------------

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Ventana de cristal: el marco con sus tres puntos y su título.
function panel({ x, y, w, h, titulo = '', contenido = '', clase = '', z = 2 }) {
  return `<div class="panel ${clase}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;z-index:${z}">
    <div class="panel-barra">
      <i class="punto rojo"></i><i class="punto ambar"></i><i class="punto verde"></i>
      ${titulo ? `<span class="panel-titulo">${esc(titulo)}</span>` : ''}
    </div>
    <div class="panel-cuerpo">${contenido}</div>
  </div>`;
}

// Tarjeta pequeña sin cromo de ventana: para datos sueltos y leyendas.
function ficha({ x, y, w, h = 'auto', contenido, clase = '', z = 3 }) {
  return `<div class="ficha ${clase}" style="left:${x}px;top:${y}px;width:${w}px;${h === 'auto' ? '' : `height:${h}px;`}z-index:${z}">${contenido}</div>`;
}

// Línea de código con trozos coloreados: ['texto', 'clase'].
function codigo(lineas, { numeros = true, desde = 1 } = {}) {
  return `<div class="codigo">${lineas.map((trozos, i) => `
    <div class="linea">
      ${numeros ? `<span class="num">${desde + i}</span>` : ''}
      <span class="txt">${trozos.map(([t, c = '']) => `<span class="${c}">${esc(t)}</span>`).join('')}</span>
    </div>`).join('')}</div>`;
}

// Barra de progreso o de medida, con su etiqueta.
function barra(etiqueta, porcentaje, clase = '') {
  return `<div class="medida">
    <span class="medida-eti">${esc(etiqueta)}</span>
    <span class="medida-pista"><i class="${clase}" style="width:${porcentaje}%"></i></span>
  </div>`;
}

const chip = (texto, clase = '') => `<span class="chip ${clase}">${esc(texto)}</span>`;

// --- escenas ----------------------------------------------------------

const ESCENAS = {
  // Linux: la terminal mandando, con su salida real y el árbol al lado.
  linux: () => `
    ${panel({
      x: 96, y: 74, w: 620, h: 352, titulo: 'user@mentor: ~',
      contenido: codigo([
        [['$ ', 'prompt'], ['ls -l ', 'cmd'], ['/etc', 'arg']],
        [['drwxr-xr-x  root root  4096  systemd/', 'salida']],
        [['-rw-r--r--  root root  2913  passwd', 'salida']],
        [['-rw-r-----  root shadow 1284  shadow', 'salida-tenue']],
        [['', '']],
        [['$ ', 'prompt'], ['chmod ', 'cmd'], ['640 ', 'arg'], ['informe.txt', 'arg2']],
        [['$ ', 'prompt'], ['stat -c ', 'cmd'], ['"%a %U" ', 'cadena'], ['informe.txt', 'arg2']],
        [['640 user', 'acento']],
        [['', '']],
        [['$ ', 'prompt'], ['_', 'cursor']],
      ], { numeros: false }),
    })}
    ${ficha({
      x: 664, y: 148, w: 250, contenido: `
        <b class="ficha-titulo">filesystem</b>
        <div class="arbol">
          <span>/</span>
          <span class="hijo">├─ etc/</span>
          <span class="hijo">├─ home/</span>
          <span class="hijo acento">│  └─ user/</span>
          <span class="hijo">├─ var/log/</span>
          <span class="hijo">└─ usr/bin/</span>
        </div>`,
    })}
    ${ficha({ x: 96, y: 442, w: 620, clase: 'ficha-plana', contenido: `${chip('pwd')}${chip('ls')}${chip('cd')}${chip('grep')}${chip('find')}${chip('chmod', 'chip-acento')}` })}`,

  // Redes: la topología con el paquete en vuelo y el diagnóstico al lado.
  redes: () => `
    <div class="malla">
      <svg viewBox="0 0 1000 500" preserveAspectRatio="none">
        <path d="M300 238 L500 128 L700 238" class="cable"/>
        <path d="M300 238 L300 330 M700 238 L700 330" class="cable"/>
        <circle cx="398" cy="182" r="7" class="paquete"/>
        <circle cx="606" cy="186" r="5" class="paquete tenue"/>
      </svg>
    </div>
    ${ficha({ x: 428, y: 96, w: 144, clase: 'nodo nodo-router', contenido: `<b>router</b><small>192.168.1.1</small>` })}
    ${ficha({ x: 232, y: 208, w: 136, clase: 'nodo', contenido: `<b>host-a</b><small>.1.20</small>` })}
    ${ficha({ x: 632, y: 208, w: 136, clase: 'nodo', contenido: `<b>host-b</b><small>.1.21</small>` })}
    ${panel({
      x: 96, y: 300, w: 400, h: 156, titulo: 'ping 192.168.1.21',
      contenido: codigo([
        [['64 bytes  ', 'salida'], ['tiempo=0.42 ms', 'acento']],
        [['64 bytes  ', 'salida'], ['tiempo=0.39 ms', 'acento']],
        [['0% perdidos · 3 enviados', 'salida-tenue']],
      ], { numeros: false }),
    })}
    ${panel({
      x: 528, y: 300, w: 376, h: 156, titulo: 'ss -tlpn',
      contenido: `${barra('22/tcp  ssh', 92, 'lleno')}${barra('80/tcp  http', 74, 'lleno')}${barra('443/tcp', 18)}`,
    })}
    ${ficha({ x: 96, y: 60, w: 320, clase: 'ficha-plana', contenido: `${chip('192.168.1.0/24', 'chip-acento')}${chip('gw .1.1')}${chip('mtu 1500')}` })}`,

  // Bash: el script, la tubería y el cron que lo dispara.
  bash: () => `
    ${panel({
      x: 78, y: 62, w: 560, h: 330, titulo: 'copia.sh',
      contenido: codigo([
        [['#!/bin/bash', 'acento']],
        [['set ', 'cmd'], ['-euo pipefail', 'arg']],
        [['', '']],
        [['for ', 'clave'], ['f ', 'var'], ['in ', 'clave'], ['*.log; ', 'arg'], ['do', 'clave']],
        [['  gzip ', 'cmd'], ['-c ', 'arg'], ['"$f" ', 'cadena'], ['> ', 'op'], ['"$f.gz"', 'cadena']],
        [['done', 'clave']],
        [['', '']],
        [['echo ', 'cmd'], ['"listo: $(date +%F)"', 'cadena']],
      ]),
    })}
    ${ficha({
      x: 596, y: 118, w: 330, clase: 'tuberia', contenido: `
        <b class="ficha-titulo">una tubería</b>
        <div class="flujo">
          <span class="paso">cat</span><i>▸</i>
          <span class="paso">grep</span><i>▸</i>
          <span class="paso">sort</span><i>▸</i>
          <span class="paso acento">uniq -c</span>
        </div>`,
    })}
    ${panel({
      x: 328, y: 344, w: 400, h: 116, titulo: 'crontab -l',
      contenido: codigo([
        [['0 3 * * *  ', 'acento'], ['/opt/copia.sh', 'salida']],
        [['*/15 * * * *  ', 'salida-tenue'], ['/opt/salud.sh', 'salida-tenue']],
      ], { numeros: false }),
    })}`,

  // Scripting: Python y Lua a la vez, cada uno con su color de sintaxis.
  scripting: () => `
    ${panel({
      x: 70, y: 66, w: 500, h: 340, titulo: 'analiza.py', clase: 'panel-python',
      contenido: `<div class="pestanas-panel"><span class="pestana activa">python</span><span class="pestana">lua</span></div>` + codigo([
        [['def ', 'clave'], ['media', 'fn'], ['(', 'op'], ['numeros', 'var'], ['):', 'op']],
        [['    return ', 'clave'], ['sum', 'fn'], ['(numeros) ', 'op'], ['/ ', 'op'], ['len', 'fn'], ['(numeros)', 'op']],
        [['', '']],
        [['temps ', 'var'], ['= ', 'op'], ['[', 'op'], ['12', 'num'], [', ', 'op'], ['18', 'num'], [', ', 'op'], ['21', 'num'], [']', 'op']],
        [['print', 'fn'], ['(', 'op'], ['f"media: ', 'cadena'], ['{media(temps):.1f}', 'interp'], ['"', 'cadena'], [')', 'op']],
        [['', '']],
        [['# media: 17.0', 'coment']],
      ]),
    })}
    ${panel({
      x: 520, y: 178, w: 410, h: 250, titulo: 'analiza.lua', clase: 'panel-lua',
      contenido: codigo([
        [['local function ', 'clave'], ['media', 'fn'], ['(t)', 'op']],
        [['  local ', 'clave'], ['s ', 'var'], ['= ', 'op'], ['0', 'num']],
        [['  for ', 'clave'], ['_, v ', 'var'], ['in ', 'clave'], ['ipairs', 'fn'], ['(t) ', 'op'], ['do ', 'clave'], ['s = s + v ', 'var'], ['end', 'clave']],
        [['  return ', 'clave'], ['s / #t', 'var']],
        [['end', 'clave']],
      ]),
    })}
    ${ficha({ x: 78, y: 424, w: 430, clase: 'ficha-plana', contenido: `${chip('python3 analiza.py', 'chip-acento')}${chip('lua analiza.lua')}` })}`,

  // Ofensiva: el escaneo, el punto de entrada y la bandera.
  ofensiva: () => `
    ${panel({
      x: 78, y: 70, w: 470, h: 300, titulo: 'nmap -sV 10.10.10.24',
      contenido: codigo([
        [['PUERTO   ESTADO  SERVICIO', 'salida-tenue']],
        [['22/tcp   ', 'salida'], ['open', 'acento'], ['    OpenSSH 8.4', 'salida']],
        [['80/tcp   ', 'salida'], ['open', 'acento'], ['    nginx 1.18', 'salida']],
        [['443/tcp  ', 'salida-tenue'], ['closed', 'salida-tenue']],
        [['3306/tcp ', 'salida-tenue'], ['filtered', 'salida-tenue']],
        [['', '']],
        [['# el 80 responde: por ahí se entra', 'coment']],
      ], { numeros: false }),
    })}
    ${panel({
      x: 508, y: 178, w: 420, h: 236, titulo: 'user@archive: ~', clase: 'panel-shell',
      contenido: codigo([
        [['$ ', 'prompt'], ['sudo -l', 'cmd']],
        [['(root) NOPASSWD: /usr/bin/find', 'peligro']],
        [['$ ', 'prompt'], ['cat ', 'cmd'], ['root.txt', 'arg']],
        [['MENTOR{...}', 'acento']],
      ], { numeros: false }),
    })}
    ${ficha({ x: 78, y: 396, w: 430, clase: 'ficha-plana', contenido: `${chip('reconocer')}${chip('enumerar')}${chip('explotar', 'chip-acento')}${chip('informar')}` })}
    ${ficha({ x: 792, y: 62, w: 136, clase: 'sello', contenido: `<b>AUTORIZADO</b><small>laboratorio</small>` })}`,

  // Defensa: los registros con su anomalía marcada y la línea de tiempo.
  defensa: () => `
    ${panel({
      x: 92, y: 62, w: 560, h: 340, titulo: '/var/log/auth.log',
      contenido: codigo([
        [['10:24 sshd  Accepted password for ana', 'salida']],
        [['10:31 sudo  ana : COMMAND=/usr/bin/apt', 'salida']],
        [['10:34 sshd  ', 'salida'], ['Failed password for root', 'peligro']],
        [['10:34 sshd  ', 'salida'], ['Failed password for root', 'peligro']],
        [['10:35 sshd  ', 'salida'], ['Failed password for root', 'peligro']],
        [['10:36 useradd  new user: backupsvc', 'alerta']],
        [['10:41 cron  (deploy) CMD /tmp/.sysupd', 'alerta']],
      ], { numeros: false }),
    })}
    ${ficha({
      x: 620, y: 128, w: 300, clase: 'tarjeta-alerta', contenido: `
        <b class="ficha-titulo alerta">3 fallos y una cuenta nueva</b>
        <div class="linea-tiempo"><i style="left:12%"></i><i style="left:38%"></i><i style="left:44%"></i><i class="rojo" style="left:62%"></i><i class="rojo" style="left:78%"></i></div>
        <small class="pie">10:24 — 10:41</small>`,
    })}
    ${panel({
      x: 400, y: 330, w: 470, h: 130, titulo: 'respuesta',
      contenido: `${barra('contener', 100, 'lleno')}${barra('erradicar', 62, 'lleno')}${barra('recuperar', 24)}`,
    })}`,

  // Máquinas: el rack y el objetivo del día.
  maquinas: () => `
    <div class="rack">
      ${[0, 1, 2, 3].map((i) => `
        <div class="unidad" style="top:${72 + i * 84}px">
          <span class="led ${i === 1 ? 'vivo' : ''}"></span><span class="led"></span>
          <span class="rack-eti">nodo-0${i + 1}</span>
          <span class="rack-barra"><i style="width:${[62, 88, 34, 51][i]}%"></i></span>
        </div>`).join('')}
    </div>
    ${panel({
      x: 452, y: 82, w: 460, h: 320, titulo: 'objetivo: 10.10.10.24',
      contenido: codigo([
        [['host   ', 'salida-tenue'], ['archive.box', 'acento']],
        [['so     ', 'salida-tenue'], ['Debian 11', 'salida']],
        [['fases  ', 'salida-tenue'], ['4', 'salida']],
        [['', '']],
        [['[✓] reconocimiento', 'acento']],
        [['[✓] enumeración', 'acento']],
        [['[ ] acceso', 'salida']],
        [['[ ] escalada', 'salida-tenue']],
      ], { numeros: false }),
    })}
    ${ficha({ x: 452, y: 420, w: 420, clase: 'ficha-plana', contenido: `${chip('user.txt', 'chip-acento')}${chip('root.txt')}${chip('writeup')}` })}`,

  // Wargame: los niveles encadenados por contraseña.
  wargame: () => `
    <div class="cadena">
      <svg viewBox="0 0 1000 500" preserveAspectRatio="none">
        <path d="M176 348 L336 288 L496 228 L656 168 L816 108" class="cable"/>
      </svg>
    </div>
    ${[0, 1, 2, 3, 4].map((i) => ficha({
      x: 130 + i * 160, y: 320 - i * 60, w: 92, clase: `nivel ${i < 3 ? 'hecho' : ''}`,
      contenido: `<b>${i + 1}</b><small>${i < 3 ? 'hecho' : 'cerrado'}</small>`,
    })).join('')}
    ${panel({
      x: 300, y: 340, w: 420, h: 130, titulo: 'nivel 3 → nivel 4',
      contenido: codigo([
        [['$ ', 'prompt'], ['cat ', 'cmd'], ['/etc/bandit_pass/nivel4', 'arg']],
        [['J8p2...  ', 'acento'], ['→ la contraseña del siguiente', 'coment']],
      ], { numeros: false }),
    })}`,

  // Laboratorio: la consola libre, sin objetivos ni examen.
  laboratorio: () => `
    ${panel({
      x: 150, y: 88, w: 560, h: 324, titulo: 'laboratorio libre',
      contenido: codigo([
        [['$ ', 'prompt'], ['mkdir ', 'cmd'], ['pruebas && ', 'arg'], ['cd ', 'cmd'], ['pruebas', 'arg']],
        [['$ ', 'prompt'], ['echo ', 'cmd'], ['"a b c" ', 'cadena'], ['| ', 'op'], ['tr ', 'cmd'], ["' ' '\\n'", 'cadena']],
        [['a', 'salida']],
        [['b', 'salida']],
        [['c', 'salida']],
        [['$ ', 'prompt'], ['rm ', 'cmd'], ['-rf ', 'arg'], ['/ ', 'peligro'], ['# aquí no pasa nada', 'coment']],
        [['$ ', 'prompt'], ['_', 'cursor']],
      ], { numeros: false }),
    })}
    ${ficha({ x: 660, y: 128, w: 250, clase: 'matraz', contenido: `<b class="ficha-titulo">se restaura solo</b><small class="pie">rompe lo que quieras</small>` })}`,

  // Retos: el panel de acceso y el reto contrarreloj.
  retos: () => `
    ${panel({
      x: 132, y: 88, w: 480, h: 300, titulo: 'reto · acceso',
      contenido: `
        <div class="formulario">
          <span class="campo"><i>usuario</i><b>admin</b></span>
          <span class="campo"><i>clave</i><b>••••••••</b></span>
          <span class="boton">entrar</span>
        </div>`,
    })}
    <div class="tajo"></div>
    ${panel({
      x: 520, y: 210, w: 400, h: 214, titulo: 'objetivo',
      contenido: codigo([
        [['Cuenta los usuarios únicos', 'salida']],
        [['de /etc/passwd con una', 'salida']],
        [['sola tubería.', 'salida']],
        [['', '']],
        [['+55 XP', 'acento']],
      ], { numeros: false }),
    })}
    ${ficha({ x: 132, y: 404, w: 420, clase: 'ficha-plana', contenido: `${chip('cut')}${chip('sort -u')}${chip('wc -l', 'chip-acento')}` })}`,
};

// Qué escena y qué color lleva cada archivo. El nombre del archivo tiene que
// coincidir con lo que espera `rutaPortada()` en js/arte.js.
const PORTADAS = [
  { archivo: 'terminal-lime.png', escena: 'linux', color: 'lime' },
  { archivo: 'red-cyan.png', escena: 'redes', color: 'cyan' },
  { archivo: 'script-magenta.png', escena: 'bash', color: 'magenta' },
  { archivo: 'codigo-amber.png', escena: 'scripting', color: 'amber' },
  { archivo: 'encapuchado-red.png', escena: 'ofensiva', color: 'red' },
  { archivo: 'escudo-blue.png', escena: 'defensa', color: 'blue' },
  { archivo: 'servidor-cyan.png', escena: 'maquinas', color: 'cyan' },
  { archivo: 'banderas-magenta.png', escena: 'wargame', color: 'magenta' },
  { archivo: 'laboratorio-lime.png', escena: 'laboratorio', color: 'lime' },
  { archivo: 'acceso-red.png', escena: 'retos', color: 'red' },
];

function documento(escena, color) {
  const { acento, luz, tinta, medio } = PALETA[color] || PALETA.cyan;
  return `<!doctype html>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${ANCHO}px; height: ${ALTO}px; overflow: hidden;
    background: ${tinta};
    font-family: ${MONO};
    --acento: ${acento};
    --luz: ${luz};
    --tinta: ${tinta};
    --medio: ${medio};
  }
  .lienzo { position: relative; width: 100%; height: 100%; }
  .capa { position: absolute; inset: 0; }
  /* Zona segura: la app recorta la portada a 16/9 en las cabeceras y encima
     escribe su rótulo arriba y el título abajo. La escena se encoge un poco
     para que nunca se coma un panel ni choque con el texto. */
  .escena { position: absolute; inset: 0; transform: scale(.84); transform-origin: center center; }

  /* Fondo: dos focos de luz y un degradado en diagonal. */
  .luz {
    background:
      radial-gradient(58% 62% at 16% 2%, var(--medio) 0%, transparent 64%),
      radial-gradient(52% 58% at 92% 98%, color-mix(in srgb, var(--luz) 34%, transparent) 0%, transparent 62%),
      linear-gradient(158deg, var(--tinta) 0%, var(--medio) 148%);
  }
  /* Rejilla en fuga: da suelo a la escena sin robar atención. */
  .rejilla {
    background-image:
      linear-gradient(color-mix(in srgb, var(--acento) 13%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in srgb, var(--acento) 13%, transparent) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(96% 88% at 50% 6%, #000 12%, transparent 76%);
  }
  /* Halo detrás de los paneles: los despega del fondo. */
  .halo {
    position: absolute; left: 50%; top: 50%; width: 78%; height: 84%;
    transform: translate(-50%, -50%);
    background: radial-gradient(closest-side, color-mix(in srgb, var(--luz) 30%, transparent), transparent 74%);
  }

  /* --- panel de cristal --- */
  .panel {
    position: absolute;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, .13);
    border-radius: 16px;
    background: linear-gradient(180deg, rgba(16, 22, 38, .96), rgba(8, 12, 22, .97));
    box-shadow:
      0 32px 70px rgba(0, 0, 0, .55),
      0 2px 0 rgba(255, 255, 255, .07) inset,
      0 0 0 1px rgba(0, 0, 0, .35);
  }
  .panel-barra {
    display: flex; align-items: center; gap: 7px;
    height: 34px; padding: 0 14px;
    border-bottom: 1px solid rgba(255, 255, 255, .08);
    background: rgba(255, 255, 255, .045);
  }
  .punto { width: 10px; height: 10px; border-radius: 50%; }
  .punto.rojo { background: #ff5f57; }
  .punto.ambar { background: #febc2e; }
  .punto.verde { background: #28c840; }
  .panel-titulo { margin-left: 8px; color: rgba(255, 255, 255, .5); font-size: 12.5px; letter-spacing: -.01em; }
  .panel-cuerpo { padding: 14px 16px; }
  .panel-python { border-color: color-mix(in srgb, var(--acento) 34%, transparent); }
  .panel-lua { background: linear-gradient(180deg, rgba(13, 18, 34, .97), rgba(6, 10, 20, .98)); }
  .panel-shell { border-color: color-mix(in srgb, var(--acento) 30%, transparent); }

  /* --- código --- */
  .codigo { display: grid; gap: 5px; font-size: 14px; line-height: 1.45; }
  .linea { display: flex; gap: 12px; }
  .linea .txt { white-space: pre; }
  .num { width: 16px; color: rgba(255, 255, 255, .2); text-align: right; }
  .salida { color: rgba(255, 255, 255, .68); }
  .salida-tenue { color: rgba(255, 255, 255, .3); }
  .prompt, .acento, .cursor { color: var(--acento); }
  .cursor { background: var(--acento); color: transparent; }
  .cmd { color: #fff; font-weight: 600; }
  .arg { color: rgba(255, 255, 255, .62); }
  .arg2 { color: rgba(255, 255, 255, .82); }
  .clave { color: #ff8fc7; }
  .fn { color: #79d0ff; }
  .var { color: rgba(255, 255, 255, .86); }
  .num-lit, .num { }
  .cadena { color: #a5e88a; }
  .interp { color: var(--acento); }
  .coment { color: rgba(255, 255, 255, .32); font-style: italic; }
  .op { color: rgba(255, 255, 255, .5); }
  .peligro { color: #ff8d84; }
  .alerta { color: #ffc861; }
  .codigo .num-lit { color: #ffc861; }

  /* --- fichas satélite --- */
  .ficha {
    position: absolute;
    padding: 13px 15px;
    border: 1px solid rgba(255, 255, 255, .12);
    border-radius: 14px;
    background: rgba(12, 17, 30, .9);
    box-shadow: 0 20px 44px rgba(0, 0, 0, .45);
    color: rgba(255, 255, 255, .78);
    font-size: 13px;
  }
  .ficha-titulo { display: block; margin-bottom: 8px; color: #fff; font-size: 13px; }
  .ficha-plana { display: flex; flex-wrap: wrap; gap: 7px; background: transparent; border: 0; box-shadow: none; padding: 0; }
  .chip {
    padding: 6px 11px;
    border: 1px solid rgba(255, 255, 255, .16);
    border-radius: 999px;
    background: rgba(255, 255, 255, .06);
    color: rgba(255, 255, 255, .72);
    font-size: 12.5px;
  }
  .chip-acento {
    border-color: color-mix(in srgb, var(--acento) 55%, transparent);
    background: color-mix(in srgb, var(--acento) 16%, transparent);
    color: var(--acento);
  }
  .arbol { display: grid; gap: 4px; color: rgba(255, 255, 255, .55); font-size: 12.5px; }
  .arbol .hijo { padding-left: 8px; }
  .arbol .acento { color: var(--acento); }
  .pie { color: rgba(255, 255, 255, .4); font-size: 11.5px; }

  /* --- medidas --- */
  .medida { display: grid; grid-template-columns: 116px 1fr; align-items: center; gap: 12px; margin-bottom: 11px; }
  .medida-eti { color: rgba(255, 255, 255, .6); font-size: 12.5px; }
  .medida-pista { height: 9px; border-radius: 999px; background: rgba(255, 255, 255, .09); overflow: hidden; }
  .medida-pista i { display: block; height: 100%; border-radius: 999px; background: rgba(255, 255, 255, .22); }
  .medida-pista i.lleno { background: linear-gradient(90deg, color-mix(in srgb, var(--acento) 60%, transparent), var(--acento)); }

  /* --- red --- */
  .malla, .cadena { position: absolute; inset: 0; z-index: 1; }
  .malla svg, .cadena svg { width: 100%; height: 100%; }
  .cable { fill: none; stroke: color-mix(in srgb, var(--acento) 55%, transparent); stroke-width: 2; stroke-dasharray: 7 7; }
  .paquete { fill: var(--acento); filter: drop-shadow(0 0 8px var(--acento)); }
  .paquete.tenue { opacity: .5; }
  .nodo { display: grid; gap: 2px; text-align: center; }
  .nodo b { color: #fff; font-size: 14px; }
  .nodo small { color: rgba(255, 255, 255, .45); font-size: 11.5px; }
  .nodo-router {
    border-color: color-mix(in srgb, var(--acento) 60%, transparent);
    background: color-mix(in srgb, var(--acento) 12%, rgba(12, 17, 30, .92));
    box-shadow: 0 0 34px color-mix(in srgb, var(--luz) 45%, transparent), 0 20px 44px rgba(0, 0, 0, .5);
  }

  /* --- bash --- */
  .flujo { display: flex; align-items: center; gap: 8px; }
  .paso { padding: 6px 10px; border: 1px solid rgba(255,255,255,.16); border-radius: 9px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.8); font-size: 12.5px; }
  .paso.acento { border-color: var(--acento); color: var(--acento); background: color-mix(in srgb, var(--acento) 15%, transparent); }
  .flujo i { color: color-mix(in srgb, var(--acento) 80%, transparent); font-style: normal; }
  .pestanas-panel { display: flex; gap: 8px; margin-bottom: 12px; }
  .pestanas-panel .pestana { padding: 5px 12px; border-radius: 8px; background: rgba(255,255,255,.06); color: rgba(255,255,255,.5); font-size: 12.5px; }
  .pestanas-panel .pestana.activa { background: color-mix(in srgb, var(--acento) 22%, transparent); color: var(--acento); }

  /* --- ofensiva y defensa --- */
  .sello { display: grid; gap: 2px; text-align: center; border-color: color-mix(in srgb, var(--acento) 50%, transparent); }
  .sello b { color: var(--acento); font-size: 12px; letter-spacing: .1em; }
  .sello small { color: rgba(255,255,255,.45); font-size: 11px; }
  .tarjeta-alerta { border-color: rgba(255, 160, 90, .34); }
  .tarjeta-alerta .alerta { color: #ffc861; }
  .linea-tiempo { position: relative; height: 8px; margin: 12px 0 8px; border-radius: 999px; background: rgba(255,255,255,.09); }
  .linea-tiempo i { position: absolute; top: -3px; width: 6px; height: 14px; border-radius: 3px; background: rgba(255,255,255,.4); }
  .linea-tiempo i.rojo { background: #ff8d84; box-shadow: 0 0 12px rgba(255,141,132,.8); }

  /* --- máquinas --- */
  .rack { position: absolute; left: 78px; top: 0; width: 330px; height: 100%; }
  .unidad {
    position: absolute; left: 0; width: 330px; height: 64px;
    display: grid; grid-template-columns: 12px 12px 1fr; align-items: center; gap: 9px;
    padding: 0 16px;
    border: 1px solid rgba(255,255,255,.1); border-radius: 12px;
    background: rgba(12, 17, 30, .9);
    box-shadow: 0 16px 34px rgba(0,0,0,.4);
  }
  .led { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.18); }
  .led.vivo { background: var(--acento); box-shadow: 0 0 12px var(--acento); }
  .rack-eti { grid-column: 3; color: rgba(255,255,255,.6); font-size: 12.5px; }
  .rack-barra { grid-column: 3; height: 6px; border-radius: 999px; background: rgba(255,255,255,.09); }
  .rack-barra i { display: block; height: 100%; border-radius: 999px; background: color-mix(in srgb, var(--acento) 75%, transparent); }

  /* --- wargame --- */
  .cadena svg { width: 100%; height: 100%; }
  .nivel { display: grid; gap: 2px; text-align: center; }
  .nivel b { color: rgba(255,255,255,.5); font-size: 20px; }
  .nivel small { color: rgba(255,255,255,.35); font-size: 10.5px; }
  .nivel.hecho { border-color: color-mix(in srgb, var(--acento) 55%, transparent); background: color-mix(in srgb, var(--acento) 12%, rgba(12,17,30,.92)); }
  .nivel.hecho b { color: var(--acento); }

  /* --- retos --- */
  .formulario { display: grid; gap: 12px; }
  .campo { display: grid; gap: 4px; padding: 11px 13px; border: 1px solid rgba(255,255,255,.13); border-radius: 11px; background: rgba(255,255,255,.05); }
  .campo i { color: rgba(255,255,255,.4); font-style: normal; font-size: 11.5px; }
  .campo b { color: rgba(255,255,255,.85); font-size: 14px; }
  .boton { padding: 11px; border-radius: 11px; background: color-mix(in srgb, var(--acento) 22%, transparent); color: var(--acento); font-size: 13px; text-align: center; }
  .tajo {
    position: absolute; left: 90px; top: 430px; width: 820px; height: 3px; z-index: 6;
    transform: rotate(-24deg); transform-origin: left center;
    background: linear-gradient(90deg, transparent, var(--acento), transparent);
    box-shadow: 0 0 22px color-mix(in srgb, var(--luz) 80%, transparent);
  }
  .matraz { display: grid; gap: 4px; }

  /* Viñeta: oscurece los bordes para que el rótulo blanco de la app lea. */
  .vineta {
    z-index: 20;
    background:
      linear-gradient(to top, rgba(0,0,0,.66) 0%, transparent 40%),
      linear-gradient(to bottom, rgba(0,0,0,.38) 0%, transparent 26%);
  }
</style>
<div class="lienzo">
  <div class="capa luz"></div>
  <div class="capa rejilla"></div>
  <div class="halo"></div>
  <div class="escena">${ESCENAS[escena]()}</div>
  <div class="capa vineta"></div>
</div>`;
}

// --- ejecución --------------------------------------------------------

const filtro = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const seleccion = filtro.length
  ? PORTADAS.filter((p) => filtro.some((f) => p.escena.includes(f) || p.archivo.includes(f)))
  : PORTADAS;

if (process.argv.includes('--lista')) {
  for (const p of seleccion) console.log(`${p.archivo.padEnd(26)} ${p.escena} · ${p.color}`);
  process.exit(0);
}

// Playwright vive en global: la app no tiene dependencias de producción y
// esto es solo una herramienta de autoría.
async function cargarPlaywright() {
  try { return await import('playwright'); }
  catch {
    const { existsSync } = await import('node:fs');
    const { pathToFileURL } = await import('node:url');
    const candidatos = [
      process.env.PLAYWRIGHT_MODULE,
      '/opt/node22/lib/node_modules/playwright/index.mjs',
      '/usr/lib/node_modules/playwright/index.mjs',
      '/usr/local/lib/node_modules/playwright/index.mjs',
    ].filter(Boolean);
    const ruta = candidatos.find(existsSync);
    if (!ruta) throw new Error('No se encontró Playwright. Instálalo o define PLAYWRIGHT_MODULE.');
    return import(pathToFileURL(ruta).href);
  }
}

const { chromium } = await cargarPlaywright();
const navegador = await chromium.launch({ headless: true });
const pagina = await navegador.newPage({ viewport: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1 });

await mkdir(DESTINO, { recursive: true });
let total = 0;
for (const { archivo, escena, color } of seleccion) {
  await pagina.setContent(documento(escena, color), { waitUntil: 'domcontentloaded' });
  await pagina.evaluate(() => document.fonts.ready);
  const png = await pagina.screenshot({ type: 'png' });
  await writeFile(join(DESTINO, archivo), png);
  total += png.length;
  console.log(`${archivo.padEnd(26)} ${(png.length / 1024).toFixed(1)} KB`);
}
await navegador.close();
console.log(`\n${seleccion.length} portadas · ${(total / 1024 / 1024).toFixed(2)} MB en assets/portadas/`);
