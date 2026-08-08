// =====================================================================
// Ilustraciones de las portadas
//
// La referencia visual usa una imagen por curso: una captura de terminal,
// un desensamblador, una topología de red. Aquí esas escenas están
// DIBUJADAS en SVG en vez de importadas como imágenes, por tres razones:
//
//   1. La app es offline-first y no debe depender de ningún archivo
//      externo ni engordar el precaché con mapas de bits.
//   2. Un SVG se adapta a cualquier ancho sin pixelarse, y las portadas
//      se ven a 16/8 en el catálogo y a 16/9 a sangre en la cabecera.
//   3. Cada escena toma el color de su academia con
//      `var(--acento-academia)`, así que la misma ilustración encaja
//      igual en Linux (verde) que en Ofensiva (rojo).
//
// Todas las escenas comparten el lienzo 320×160 y se recortan con
// `preserveAspectRatio="slice"`, de modo que al cambiar la proporción se
// recorta por los bordes en vez de deformarse.
// =====================================================================

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// Cromo de ventana: el marco con sus tres puntos que hace que cualquier
// contenido se lea como «una captura de pantalla».
function ventana(x, y, w, h, { titulo = '', fondo = '#080d1c' } = {}) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${fondo}" stroke="rgba(255,255,255,.14)"/>
    <path d="M${x} ${y + 7}a7 7 0 0 1 7-7h${w - 14}a7 7 0 0 1 7 7v9H${x}z" fill="rgba(255,255,255,.07)"/>
    <circle cx="${x + 9}" cy="${y + 8}" r="2.1" fill="#ff5f57"/>
    <circle cx="${x + 16.5}" cy="${y + 8}" r="2.1" fill="#febc2e"/>
    <circle cx="${x + 24}" cy="${y + 8}" r="2.1" fill="#28c840"/>
    ${titulo ? `<text x="${x + 32}" y="${y + 10.5}" font-family="${MONO}" font-size="5.4" fill="rgba(255,255,255,.5)">${titulo}</text>` : ''}`;
}

// Línea de texto falso: barras del ancho de las palabras. A este tamaño
// una barra se lee como código mejor que una letra de 3px.
function barras(x, y, anchos, { alto = 3.4, hueco = 3, color = 'rgba(255,255,255,.3)' } = {}) {
  let cursor = x;
  return anchos.map((w) => {
    const r = `<rect x="${cursor}" y="${y}" width="${w}" height="${alto}" rx="1.7" fill="${typeof color === 'function' ? color() : color}"/>`;
    cursor += w + hueco;
    return r;
  }).join('');
}

const ACENTO = 'var(--acento-academia, #17a7ef)';

// --- escenas ---------------------------------------------------------

// Terminal con un prompt escribiendo: la portada de Linux.
const terminal = () => `
  ${ventana(46, 30, 228, 112, { titulo: 'user@mentor: ~' })}
  <g>
    <text x="56" y="36" font-family="${MONO}" font-size="7" fill="${ACENTO}">$</text>
    ${barras(64, 32.5, [26, 14, 34], { color: 'rgba(255,255,255,.62)' })}
    ${barras(56, 45, [40, 22, 12, 30])}
    ${barras(56, 54, [18, 46, 20])}
    ${barras(56, 63, [52, 16])}
    <text x="56" y="80" font-family="${MONO}" font-size="7" fill="${ACENTO}">$</text>
    ${barras(64, 76.5, [30, 18], { color: 'rgba(255,255,255,.62)' })}
    ${barras(56, 89, [24, 38, 14, 22])}
    ${barras(56, 98, [44, 26])}
    ${barras(56, 107, [16, 30, 40])}
    <text x="56" y="124" font-family="${MONO}" font-size="7" fill="${ACENTO}">$</text>
    <rect x="65" y="118" width="5" height="8" fill="${ACENTO}"/>
  </g>`;

// Topología: un router, tres equipos y paquetes en tránsito.
const red = () => `
  <g stroke="${ACENTO}" stroke-width="1.4" opacity=".75" fill="none">
    <path d="M160 74V52M160 74l-52 26M160 74l52 26"/>
  </g>
  <g fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.4" stroke-dasharray="3 5">
    <path d="M108 100h104"/>
  </g>
  <rect x="132" y="60" width="56" height="26" rx="6" fill="#0d1730" stroke="${ACENTO}" stroke-width="1.6"/>
  <g fill="${ACENTO}">
    <circle cx="144" cy="73" r="2.4"/><circle cx="153" cy="73" r="2.4"/>
    <rect x="160" y="70" width="18" height="5" rx="2.5" opacity=".55"/>
  </g>
  <path d="M152 52h16l-8-12z" fill="rgba(255,255,255,.3)"/>
  ${[80, 132, 184].map((x, i) => `
    ${ventana(x + 4, 100, 52, 40, {})}
    ${barras(x + 12, 112, i === 1 ? [20, 10] : [14, 16], { alto: 2.8 })}
    ${barras(x + 12, 119, [26], { alto: 2.8, color: 'rgba(255,255,255,.18)' })}
    ${barras(x + 12, 126, i === 2 ? [12, 18] : [22], { alto: 2.8, color: 'rgba(255,255,255,.18)' })}`).join('')}
  <g fill="${ACENTO}">
    <rect x="130" y="86" width="6" height="4" rx="1.4"/>
    <rect x="186" y="90" width="6" height="4" rx="1.4" opacity=".6"/>
    <rect x="158" y="44" width="5" height="4" rx="1.4" opacity=".8"/>
  </g>
  <text x="18" y="150" font-family="${MONO}" font-size="6" fill="rgba(255,255,255,.28)">192.168.1.0/24</text>`;

// Editor con un script y su engranaje: Bash.
const script = () => `
  ${ventana(40, 26, 240, 118, { titulo: 'copia.sh' })}
  <rect x="40" y="42" width="18" height="102" fill="rgba(255,255,255,.05)"/>
  ${Array.from({ length: 9 }, (_, i) => `<text x="45" y="${57 + i * 10}" font-family="${MONO}" font-size="5" fill="rgba(255,255,255,.28)">${i + 1}</text>`).join('')}
  <text x="64" y="56" font-family="${MONO}" font-size="6.4" fill="${ACENTO}">#!/bin/bash</text>
  ${barras(64, 63, [22, 30, 12])}
  ${barras(64, 73, [16, 40], { color: 'rgba(255,255,255,.45)' })}
  ${barras(76, 83, [28, 18, 24])}
  ${barras(76, 93, [20, 34])}
  ${barras(64, 103, [12], { color: ACENTO })}
  ${barras(64, 113, [26, 14, 32])}
  ${barras(64, 123, [18, 22])}
  <g transform="translate(238 112)" fill="${ACENTO}" opacity=".9">
    <circle cx="0" cy="0" r="9" fill="none" stroke="${ACENTO}" stroke-width="3"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="-1.6" y="-15" width="3.2" height="5" rx="1.2" transform="rotate(${i * 45})"/>`).join('')}
  </g>`;

// Figura encapuchada sobre un circuito: la portada de Seguridad ofensiva.
const encapuchado = () => `
  <g stroke="${ACENTO}" stroke-width="1.2" fill="none" opacity=".55">
    <path d="M20 40h34v26h26M20 74h20v34h30M300 46h-30v30h-24M300 92h-26v26h-32"/>
    <circle cx="54" cy="40" r="3"/><circle cx="80" cy="66" r="3"/><circle cx="70" cy="108" r="3"/>
    <circle cx="270" cy="46" r="3"/><circle cx="246" cy="76" r="3"/><circle cx="242" cy="118" r="3"/>
  </g>
  <path d="M160 34c-30 0-50 22-50 52 0 20 6 34 14 46h72c8-12 14-26 14-46 0-30-20-52-50-52z" fill="#131a2c"/>
  <path d="M160 42c-24 0-40 18-40 42 0 10 2 18 6 26 10-14 20-20 34-20s24 6 34 20c4-8 6-16 6-26 0-24-16-42-40-42z" fill="#1c2438"/>
  <path d="M128 84c8-10 18-15 32-15s24 5 32 15c-4 14-16 22-32 22s-28-8-32-22z" fill="#080c16"/>
  <g fill="${ACENTO}">
    <path d="M138 86c4-3 9-3 13 0-4 3-9 3-13 0z"/>
    <path d="M169 86c4-3 9-3 13 0-4 3-9 3-13 0z"/>
  </g>
  <path d="M116 132c10-14 24-20 44-20s34 6 44 20z" fill="#0f1526"/>
  ${ventana(196, 96, 96, 46, {})}
  ${barras(204, 112, [18, 10, 24], { alto: 2.6, color: ACENTO })}
  ${barras(204, 120, [30, 14], { alto: 2.6 })}
  ${barras(204, 128, [12, 26], { alto: 2.6, color: 'rgba(255,255,255,.2)' })}`;

// Escudo sobre un panel de registros: Defensa y forense.
const escudo = () => `
  ${ventana(112, 22, 176, 120, { titulo: 'auth.log' })}
  ${Array.from({ length: 8 }, (_, i) => `
    ${barras(122, 48 + i * 11, i % 3 === 1 ? [10, 34, 18] : [14, 26, 30], { alto: 3, color: i % 3 === 1 ? '#ff8d9b' : 'rgba(255,255,255,.26)' })}`).join('')}
  <g transform="translate(66 80)">
    <path d="M0-46c14 6 26 9 38 9v34c0 26-16 42-38 52-22-10-38-26-38-52v-34c12 0 24-3 38-9z" fill="#101830" stroke="${ACENTO}" stroke-width="2.4"/>
    <path d="M-16 2l12 12 22-24" fill="none" stroke="${ACENTO}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;

// Formulario de acceso atravesado por un tajo: los retos.
const acceso = () => `
  ${ventana(56, 28, 208, 108, { titulo: 'panel de acceso' })}
  <g>
    <circle cx="76" cy="62" r="5.4" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.4"/>
    <path d="M70.5 71c1.6-3.6 9.4-3.6 11 0" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.4"/>
    <rect x="92" y="56" width="152" height="14" rx="7" fill="rgba(255,255,255,.09)"/>
    <rect x="70" y="84" width="12" height="9" rx="2" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.4"/>
    <path d="M72.5 84v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.4"/>
    <rect x="92" y="82" width="152" height="14" rx="7" fill="rgba(255,255,255,.09)"/>
    ${Array.from({ length: 9 }, (_, i) => `<circle cx="${102 + i * 7}" cy="89" r="1.8" fill="rgba(255,255,255,.45)"/>`).join('')}
    <rect x="92" y="108" width="70" height="16" rx="8" fill="rgba(255,255,255,.14)"/>
  </g>
  <path d="M74 142L262 22" stroke="${ACENTO}" stroke-width="2.2" opacity=".95"/>
  <path d="M74 142L262 22" stroke="${ACENTO}" stroke-width="9" opacity=".16"/>
  ${Array.from({ length: 26 }, (_, i) => {
    const t = i / 25;
    const x = 74 + (262 - 74) * t + (i % 5) * 3.5;
    const y = 142 + (22 - 142) * t - (i % 4) * 3;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(1.4 + (i % 3) * .6).toFixed(1)}" height="${(1.4 + (i % 3) * .6).toFixed(1)}" fill="${ACENTO}" opacity="${(.2 + (i % 5) * .12).toFixed(2)}"/>`;
  }).join('')}`;

// Servidor y su puerto abierto: máquinas y servicios.
const servidor = () => `
  <g>
    ${[38, 74, 110].map((y) => `
      <rect x="42" y="${y}" width="104" height="28" rx="5" fill="#0d1428" stroke="rgba(255,255,255,.15)"/>
      <circle cx="54" cy="${y + 14}" r="3" fill="${ACENTO}"/>
      <circle cx="63" cy="${y + 14}" r="3" fill="rgba(255,255,255,.2)"/>
      ${barras(74, y + 8, [24, 14], { alto: 3, color: 'rgba(255,255,255,.26)' })}
      ${barras(74, y + 17, [34], { alto: 3, color: 'rgba(255,255,255,.14)' })}
      <rect x="128" y="${y + 8}" width="10" height="12" rx="2" fill="rgba(255,255,255,.08)"/>`).join('')}
  </g>
  ${ventana(166, 40, 116, 96, { titulo: 'nmap' })}
  <text x="176" y="70" font-family="${MONO}" font-size="6.2" fill="${ACENTO}">22/tcp   open</text>
  <text x="176" y="82" font-family="${MONO}" font-size="6.2" fill="${ACENTO}">80/tcp   open</text>
  <text x="176" y="94" font-family="${MONO}" font-size="6.2" fill="rgba(255,255,255,.34)">443/tcp  closed</text>
  <text x="176" y="106" font-family="${MONO}" font-size="6.2" fill="rgba(255,255,255,.34)">3306/tcp filtered</text>
  ${barras(176, 116, [22, 30, 12], { alto: 2.8 })}
  <g stroke="${ACENTO}" stroke-width="1.3" stroke-dasharray="4 4" opacity=".6">
    <path d="M146 88h20"/>
  </g>`;

// Llave y bloques de hash: contraseñas y criptografía.
const llaves = () => `
  <g transform="translate(74 80)">
    <circle cx="0" cy="0" r="22" fill="none" stroke="${ACENTO}" stroke-width="6"/>
    <circle cx="0" cy="0" r="8" fill="none" stroke="${ACENTO}" stroke-width="4"/>
    <path d="M20 0h52" stroke="${ACENTO}" stroke-width="6" stroke-linecap="round"/>
    <path d="M56 0v14M68 0v14" stroke="${ACENTO}" stroke-width="6" stroke-linecap="round"/>
  </g>
  ${ventana(160, 26, 128, 116, { titulo: 'sha256sum' })}
  ${Array.from({ length: 7 }, (_, i) => `
    ${barras(170, 50 + i * 13, [10, 18, 14, 22], { alto: 3.4, hueco: 3, color: i === 2 ? ACENTO : 'rgba(255,255,255,.24)' })}`).join('')}
  <text x="18" y="146" font-family="${MONO}" font-size="6" fill="rgba(255,255,255,.26)">hash ≠ cifrado</text>`;

// Registros y hexadecimal: binarios y análisis.
const binario = () => {
  const registros = [0, 1, 2].map((i) => `
    <text x="44" y="${68 + i * 11}" font-family="${MONO}" font-size="5.8" fill="rgba(255,255,255,.5)">r${i}x</text>
    ${barras(64, 64 + i * 11, [26, 20, 14], { alto: 3, color: 'rgba(255,255,255,.22)' })}`).join('');
  const desensamblado = [0, 1, 2].map((i) =>
    barras(44, 114 + i * 9, [18, 12, 26, 16], { alto: 3, color: 'rgba(255,255,255,.2)' })).join('');
  const hex = Array.from({ length: 5 }, (_, f) => Array.from({ length: 8 }, (_, c) => {
    const byte = ((f * 8 + c) * 37 % 255).toString(16).padStart(2, '0');
    const alfa = (0.16 + ((f + c) % 4) * 0.12).toFixed(2);
    return `<text x="${182 + c * 13}" y="${62 + f * 13}" font-family="${MONO}" font-size="5.6" fill="rgba(255,255,255,${alfa})">${byte}</text>`;
  }).join('')).join('');
  return `
    ${ventana(34, 24, 252, 118, { titulo: 'debug' })}
    <rect x="34" y="42" width="252" height="1" fill="rgba(255,255,255,.09)"/>
    <text x="44" y="56" font-family="${MONO}" font-size="6" fill="${ACENTO}">registros</text>
    ${registros}
    <text x="44" y="106" font-family="${MONO}" font-size="6" fill="${ACENTO}">desensamblado</text>
    ${desensamblado}
    <g>${hex}</g>`;
};

// Banderas encadenadas: el wargame.
const banderas = () => `
  <g stroke="rgba(255,255,255,.2)" stroke-width="1.6" fill="none" stroke-dasharray="5 5">
    <path d="M46 120h56v-34h56V52h56"/>
  </g>
  ${[[46, 120], [102, 86], [158, 52]].map(([x, y], i) => `
    <circle cx="${x}" cy="${y}" r="9" fill="#0e1526" stroke="${ACENTO}" stroke-width="2"/>
    <text x="${x}" y="${y + 3}" text-anchor="middle" font-family="${MONO}" font-size="8" font-weight="700" fill="${ACENTO}">${i + 1}</text>`).join('')}
  <g transform="translate(214 42)">
    <path d="M0 0v76" stroke="rgba(255,255,255,.4)" stroke-width="3" stroke-linecap="round"/>
    <path d="M4 2c18 0 26 10 44 10-6 10-6 18 0 28-18 0-26-10-44-10z" fill="${ACENTO}"/>
  </g>
  <text x="46" y="146" font-family="${MONO}" font-size="6" fill="rgba(255,255,255,.26)">nivel → contraseña → nivel</text>`;

// Laboratorio libre: un matraz sobre una consola.
const laboratorio = () => `
  ${ventana(120, 30, 168, 112, { titulo: 'lab' })}
  ${Array.from({ length: 7 }, (_, i) => `${barras(130, 52 + i * 12, i % 2 ? [16, 30, 12] : [24, 14, 26], { alto: 3, color: 'rgba(255,255,255,.22)' })}`).join('')}
  <g transform="translate(66 76)">
    <path d="M-14-32h28M-8-32v20L-26 22a6 6 0 0 0 5 9h42a6 6 0 0 0 5-9L8-12v-20" fill="#0f1729" stroke="${ACENTO}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M-19 12h38c3 5 1 9-4 9h-30c-5 0-7-4-4-9z" fill="${ACENTO}" opacity=".75"/>
    <circle cx="-6" cy="4" r="2.6" fill="${ACENTO}" opacity=".6"/>
    <circle cx="4" cy="-4" r="2" fill="${ACENTO}" opacity=".45"/>
  </g>`;

// Editor con dos lenguajes a la vez: la portada de Scripting.
const codigo = () => `
  ${ventana(28, 24, 264, 118, { titulo: 'analiza.py — mentor' })}
  <rect x="28" y="40" width="264" height="1" fill="rgba(255,255,255,.08)"/>
  <g>
    <rect x="36" y="46" width="52" height="13" rx="4" fill="${ACENTO}" opacity=".22"/>
    <text x="44" y="55" font-family="${MONO}" font-size="6.4" fill="${ACENTO}">python</text>
    <rect x="92" y="46" width="40" height="13" rx="4" fill="rgba(255,255,255,.08)"/>
    <text x="99" y="55" font-family="${MONO}" font-size="6.4" fill="rgba(255,255,255,.45)">lua</text>
  </g>
  <rect x="28" y="66" width="20" height="76" fill="rgba(255,255,255,.05)"/>
  ${Array.from({ length: 7 }, (_, i) => `<text x="34" y="${79 + i * 10}" font-family="${MONO}" font-size="5" fill="rgba(255,255,255,.26)">${i + 1}</text>`).join('')}
  <text x="56" y="79" font-family="${MONO}" font-size="6.4" fill="${ACENTO}">def</text>
  ${barras(74, 74, [26, 16], { color: 'rgba(255,255,255,.55)' })}
  ${barras(66, 84, [18, 30, 12])}
  <text x="66" y="99" font-family="${MONO}" font-size="6.4" fill="${ACENTO}">for</text>
  ${barras(84, 94, [14, 22, 18])}
  ${barras(76, 104, [24, 34], { color: 'rgba(255,255,255,.3)' })}
  <text x="56" y="119" font-family="${MONO}" font-size="6.4" fill="${ACENTO}">return</text>
  ${barras(86, 114, [20, 14])}
  ${barras(56, 124, [30, 18, 26], { color: 'rgba(255,255,255,.2)' })}
  <g transform="translate(246 108)">
    <circle cx="0" cy="0" r="20" fill="#0d1526" stroke="${ACENTO}" stroke-width="1.6"/>
    <text x="0" y="4" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="700" fill="${ACENTO}">{ }</text>
  </g>
  <text x="30" y="152" font-family="${MONO}" font-size="6" fill="rgba(255,255,255,.28)">python3 analiza.py · lua analiza.lua</text>`;

// --- catálogo --------------------------------------------------------

export const ESCENAS = {
  terminal, red, script, encapuchado, escudo,
  acceso, servidor, llaves, binario, banderas, laboratorio, codigo,
};

// Qué escena y qué rótulo lleva cada academia. El rótulo en mayúsculas es
// el que corona la portada, igual que en la referencia.
export const PORTADA_ACADEMIA = {
  linux: { escena: 'terminal', rotulo: 'TERMINAL & SHELL' },
  redes: { escena: 'red', rotulo: 'NETWORKING' },
  bash: { escena: 'script', rotulo: 'BASH SCRIPTING' },
  scripting: { escena: 'codigo', rotulo: 'PYTHON & LUA' },
  ofensiva: { escena: 'encapuchado', rotulo: 'ETHICAL HACKING' },
  defensa: { escena: 'escudo', rotulo: 'BLUE TEAM & FORENSICS' },
};

// Escenas de las secciones que no son academias.
export const PORTADA_SECCION = {
  maquinas: { escena: 'servidor', rotulo: 'MACHINES' },
  wargame: { escena: 'banderas', rotulo: 'WARGAME' },
  laboratorio: { escena: 'laboratorio', rotulo: 'FREE LAB' },
  misiones: { escena: 'acceso', rotulo: 'CHALLENGES' },
};

// Reparto de escenas para los retos: se elige por el tema del reto y, si no
// encaja ninguno, de forma estable por su identificador (nunca al azar, para
// que la misma máquina tenga siempre la misma portada).
const POR_TEMA = [
  [/login|acceso|panel|portal|credencial/i, 'acceso'],
  [/hash|contrase|cifrad|cripto|clave|firma/i, 'llaves'],
  [/binari|memoria|desensambl|revers|forense de/i, 'binario'],
  [/red|puerto|escane|servicio|dns|web|http|nmap|curl/i, 'servidor'],
  [/log|registro|evidencia|defens|incidente|auditor/i, 'escudo'],
  [/script|automat|bash|tuber|pipe|grep|filtr/i, 'script'],
  [/termin|comando|carpeta|archivo|oculto|kernel|usuario|permiso|proceso/i, 'terminal'],
];
const RUEDA = ['terminal', 'acceso', 'servidor', 'llaves', 'script', 'escudo'];

// --- portadas rasterizadas -------------------------------------------
//
// `tools/portadas.mjs` genera un PNG por cada pareja escena+color de esta
// lista. La app usa el PNG cuando existe y el SVG cuando no, así que añadir
// una escena nueva nunca rompe nada: como mucho, se ve dibujada.

// Solo se rasterizan las portadas grandes: las de academia y las de las
// secciones, que ocupan el ancho completo y son la primera impresión de cada
// pantalla. Las tarjetas pequeñas de los retos siguen dibujándose en SVG,
// porque a ese tamaño no se distingue y evita cargar veintitantas imágenes.
export const PORTADAS = [
  { escena: 'terminal', color: 'lime' },        // Linux
  { escena: 'red', color: 'cyan' },             // Redes
  { escena: 'script', color: 'magenta' },       // Bash
  { escena: 'codigo', color: 'amber' },         // Scripting
  { escena: 'encapuchado', color: 'red' },      // Ofensiva
  { escena: 'escudo', color: 'blue' },          // Defensa
  { escena: 'servidor', color: 'cyan' },        // Máquinas
  { escena: 'banderas', color: 'magenta' },     // Wargame
  { escena: 'laboratorio', color: 'lime' },     // Laboratorio
  { escena: 'acceso', color: 'red' },           // Retos
];

const CON_PNG = new Set(PORTADAS.map((p) => `${p.escena}-${p.color}`));

// Ruta del PNG de una portada, o null si esa pareja no está generada.
export function rutaPortada(escena, color) {
  return CON_PNG.has(`${escena}-${color}`) ? `assets/portadas/${escena}-${color}.png` : null;
}

export function escenaDe(texto = '', id = '') {
  for (const [patron, escena] of POR_TEMA) if (patron.test(texto)) return escena;
  let suma = 0;
  for (const c of String(id)) suma += c.charCodeAt(0);
  return RUEDA[suma % RUEDA.length];
}

// Devuelve la portada lista para incrustar dentro de `.cubierta`.
//
// Si existe el PNG de esa pareja escena+color se usa la imagen: está
// compuesta con su fondo, su rejilla y su halo, y el navegador la decodifica
// una vez para todas las tarjetas. Si no existe —una escena nueva, un color
// sin generar—, se dibuja el SVG, que se colorea con la variable de la
// academia. La app funciona igual en los dos casos.
export function ilustracion(nombre, color = '') {
  const png = rutaPortada(nombre, color);
  if (png) {
    return `<img class="cubierta-arte cubierta-foto" src="${png}" alt="" aria-hidden="true"
      width="800" height="400" loading="lazy" decoding="async">`;
  }
  const escena = ESCENAS[nombre] || ESCENAS.terminal;
  return `<svg class="cubierta-arte" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice"
    aria-hidden="true" focusable="false">${escena()}</svg>`;
}

// --- medallas de logro ------------------------------------------------
//
// Un emoji dentro de un círculo gris no distingue «ejecutaste tu primer
// comando» de «terminaste las doce máquinas». La medalla sí: cada rango
// tiene su metal, su cinta y su corona de puntas, y el platino además gira
// un halo. Se dibuja en SVG —no hay archivo que cargar— y el emoji del logro
// se conserva en el centro, porque es lo que lo hace reconocible.

const METALES = {
  bronce: { claro: '#e0a06a', medio: '#c07a41', oscuro: '#8a5024', borde: '#a5652f', puntas: 0 },
  plata: { claro: '#e8eef4', medio: '#b9c6d4', oscuro: '#8593a4', borde: '#a9b7c6', puntas: 4 },
  oro: { claro: '#ffdf8a', medio: '#f0b73f', oscuro: '#b97f13', borde: '#dda32b', puntas: 6 },
  platino: { claro: '#dff3ff', medio: '#8fd7f5', oscuro: '#3d9fc6', borde: '#6fc6ea', puntas: 8 },
};

export const RANGOS_LOGRO = ['bronce', 'plata', 'oro', 'platino'];

export function nombreRango(rango) {
  return { bronce: 'Bronce', plata: 'Plata', oro: 'Oro', platino: 'Platino' }[rango] || 'Bronce';
}

// `conseguido` a false devuelve la misma silueta apagada: se ve qué medalla
// falta y de qué rango es, que es justo lo que empuja a ir a por ella.
export function medalla(rango = 'bronce', { conseguido = true, tamaño = 56 } = {}) {
  const m = METALES[rango] || METALES.bronce;
  const id = `m-${rango}-${conseguido ? 'on' : 'off'}`;
  const puntas = Array.from({ length: m.puntas }, (_, i) => {
    const angulo = (360 / m.puntas) * i;
    return `<path d="M0-45l4.2 9.5H-4.2z" transform="rotate(${angulo})" fill="url(#${id})" opacity=".95"/>`;
  }).join('');

  return `<svg class="medalla" data-rango="${rango}" ${conseguido ? '' : 'data-bloqueada'}
    viewBox="-50 -50 100 100" width="${tamaño}" height="${tamaño}" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${m.claro}"/>
        <stop offset=".55" stop-color="${m.medio}"/>
        <stop offset="1" stop-color="${m.oscuro}"/>
      </linearGradient>
    </defs>
    <g ${conseguido ? '' : 'opacity=".42"'}>
      ${puntas}
      <circle r="34" fill="url(#${id})"/>
      <circle r="34" fill="none" stroke="${m.borde}" stroke-width="2.5"/>
      <circle r="26" fill="rgba(255,255,255,.55)"/>
      <circle r="26" fill="none" stroke="rgba(0,0,0,.12)" stroke-width="1.5"/>
      ${rango === 'platino' ? '<circle r="45" fill="none" stroke="rgba(143,215,245,.6)" stroke-width="2" stroke-dasharray="5 7"/>' : ''}
    </g>
  </svg>`;
}
