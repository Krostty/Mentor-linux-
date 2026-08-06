// Widget de terminal: dibuja la consola, gestiona el historial, el
// autocompletado con Tab y la barra de teclas de Linux.

import { Shell } from './shell.js';
import { COMMANDS, COMMAND_NAMES } from './commands/index.js';
import { MARK } from './commands/util.js';
import { snapshot } from '../data/snapshots.js';
import { S_DIR } from './fs.js';

const TECLAS = ['|', '/', '-', '~', '$', '*', '>', '.', '_', '"', "'", ':', ';', '&'];

function escapar(s) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

// Convierte las marcas invisibles de color en <span> y escapa el resto.
function pintar(texto) {
  let html = '';
  let i = 0;
  while (i < texto.length) {
    const inicio = texto.indexOf(MARK, i);
    if (inicio < 0) {
      html += escapar(texto.slice(i));
      break;
    }
    html += escapar(texto.slice(i, inicio));
    const fin = texto.indexOf(MARK, inicio + 1);
    if (fin < 0) {
      html += escapar(texto.slice(inicio + 1));
      break;
    }
    const cuerpo = texto.slice(inicio + 1, fin);
    const sep = cuerpo.indexOf(':');
    const clase = cuerpo.slice(0, sep);
    const valor = cuerpo.slice(sep + 1);
    html += `<span class="t-${clase}">${escapar(valor)}</span>`;
    i = fin + 1;
  }
  return html;
}

// Resalta errores conocidos para que se lean de un vistazo.
function pintarLinea(linea) {
  const html = pintar(linea);
  if (/Permission denied|No such file|command not found|not permitted|invalid mode|Failed|error:|ERROR/.test(linea)) {
    return `<span class="t-err">${html}</span>`;
  }
  return html;
}

export class Terminal {
  constructor(contenedor, opciones = {}) {
    this.el = contenedor;
    // La barra de teclas puede vivir en otro contenedor: en las vistas de reto
    // debe quedar pegada al teclado del móvil, debajo de todo lo demás.
    this.elTeclas = opciones.teclasEn || null;
    this.snapshotNombre = opciones.snapshot || 'inicio';
    this.opcionesShell = {
      user: opciones.usuario || 'user',
      cwd: opciones.cwd,
      hostname: opciones.hostname || 'mentor',
      groupMap: opciones.groupMap || null,
      machine: opciones.machine ? structuredClone(opciones.machine) : null,
    };
    this.alEjecutar = opciones.alEjecutar || (() => {});
    this.historial = [];
    this.indiceHistorial = -1;
    this.ultimo = null;
    this.borrador = '';

    this.crearShell();
    this.render();
    this.conectar();
    if (opciones.bienvenida !== false) this.bienvenida();
    if (opciones.autoFocus !== false) this.enfocar();
  }

  crearShell() {
    this.shell = new Shell({
      fs: snapshot(this.snapshotNombre),
      commands: COMMANDS,
      ...this.opcionesShell,
    });
  }

  render() {
    const consola = `
      <div class="consola">
        <div class="consola-salida" role="log" aria-live="polite" aria-label="Salida de la terminal"></div>
        <form class="consola-entrada">
          <span class="consola-prompt"></span>
          <input class="consola-input" autocomplete="off" autocapitalize="off"
                 autocorrect="off" spellcheck="false" aria-label="Escribe un comando"
                 enterkeyhint="go">
          <button class="consola-ejecutar" type="submit" aria-label="Ejecutar comando">↵</button>
        </form>
      </div>`;

    const teclas = `
      <div class="teclas" role="toolbar" aria-label="Teclas de Linux">
        <button type="button" class="tecla" data-accion="historial-arriba" aria-label="Comando anterior">↑</button>
        <button type="button" class="tecla" data-accion="historial-abajo" aria-label="Comando siguiente">↓</button>
        <button type="button" class="tecla" data-accion="tab" aria-label="Autocompletar">⇥</button>
        ${TECLAS.map((t) => `<button type="button" class="tecla" data-insertar="${escapar(t)}">${escapar(t)}</button>`).join('')}
      </div>`;

    if (this.elTeclas) {
      this.el.innerHTML = consola;
      this.elTeclas.innerHTML = teclas;
    } else {
      this.el.innerHTML = consola + teclas;
      this.elTeclas = this.el;
    }

    this.salida = this.el.querySelector('.consola-salida');
    this.input = this.el.querySelector('.consola-input');
    this.form = this.el.querySelector('.consola-entrada');
    this.promptEl = this.el.querySelector('.consola-prompt');
    this.actualizarPrompt();
  }

  actualizarPrompt() {
    this.promptEl.textContent = this.shell.prompt();
  }

  conectar() {
    const consola = this.el.querySelector('.consola');
    const enfocarConsola = (e) => {
      if (e.target.closest('button, a')) return;
      this.input.focus({ preventScroll: true });
    };
    consola.addEventListener('pointerdown', enfocarConsola);
    consola.addEventListener('click', enfocarConsola);

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const linea = this.input.value;
      this.input.value = '';
      this.ejecutar(linea);
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.navegarHistorial(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.navegarHistorial(1);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.autocompletar();
      }
    });

    this.elTeclas.querySelectorAll('.tecla').forEach((b) => {
      b.addEventListener('click', () => {
        const accion = b.dataset.accion;
        if (accion === 'historial-arriba') this.navegarHistorial(-1);
        else if (accion === 'historial-abajo') this.navegarHistorial(1);
        else if (accion === 'tab') this.autocompletar();
        else this.insertar(b.dataset.insertar);
        this.input.focus();
      });
    });
  }

  insertar(texto) {
    const pos = this.input.selectionStart ?? this.input.value.length;
    this.input.value = this.input.value.slice(0, pos) + texto + this.input.value.slice(pos);
    this.input.setSelectionRange(pos + texto.length, pos + texto.length);
  }

  navegarHistorial(direccion) {
    if (!this.historial.length) return;
    if (this.indiceHistorial === -1) {
      this.borrador = this.input.value;
      this.indiceHistorial = this.historial.length;
    }
    this.indiceHistorial = Math.max(0, Math.min(this.historial.length, this.indiceHistorial + direccion));
    this.input.value = this.indiceHistorial >= this.historial.length ? this.borrador : this.historial[this.indiceHistorial];
    const fin = this.input.value.length;
    requestAnimationFrame(() => this.input.setSelectionRange(fin, fin));
  }

  // Tab completa comandos al principio de la línea y rutas en el resto.
  autocompletar() {
    const valor = this.input.value;
    const trozos = valor.split(/\s+/);
    const ultimo = trozos[trozos.length - 1];
    const esComando = trozos.length === 1;

    let candidatos;
    if (esComando) {
      candidatos = COMMAND_NAMES.filter((c) => c.startsWith(ultimo));
    } else {
      candidatos = this.rutasQueEmpiezanPor(ultimo);
    }

    if (!candidatos.length) return;

    if (candidatos.length === 1) {
      const completo = candidatos[0];
      trozos[trozos.length - 1] = completo;
      this.input.value = trozos.join(' ') + (completo.endsWith('/') ? '' : ' ');
      return;
    }

    // Varios candidatos: completa el prefijo común y muéstralos, como bash.
    const comun = prefijoComun(candidatos);
    if (comun.length > ultimo.length) {
      trozos[trozos.length - 1] = comun;
      this.input.value = trozos.join(' ');
    }
    this.escribir(`${this.shell.prompt()} ${valor}`, 'eco');
    this.escribir(candidatos.slice(0, 40).join('  '));
  }

  rutasQueEmpiezanPor(parcial) {
    const barra = parcial.lastIndexOf('/');
    const dir = barra >= 0 ? parcial.slice(0, barra + 1) : '';
    const nombre = barra >= 0 ? parcial.slice(barra + 1) : parcial;
    const base = this.shell.resolve(dir || '.');
    let entradas;
    try {
      entradas = this.shell.fs.list(base, this.shell.ctx);
    } catch {
      return [];
    }
    return entradas
      .filter((e) => e.name.startsWith(nombre) && (nombre.startsWith('.') || !e.name.startsWith('.')))
      .map((e) => dir + e.name + (e.node.type === S_DIR ? '/' : ''));
  }

  escribir(texto, clase = '') {
    if (texto === '') return;
    const div = document.createElement('div');
    div.className = 'consola-linea' + (clase ? ' consola-' + clase : '');
    div.innerHTML = clase === 'eco' ? escapar(texto) : pintarLinea(texto);
    this.salida.appendChild(div);
    this.desplazarAlFinal();
  }

  escribirBloque(texto) {
    for (const linea of texto.replace(/\n$/, '').split('\n')) {
      this.escribir(linea || ' ');
    }
  }

  desplazarAlFinal() {
    requestAnimationFrame(() => {
      this.salida.scrollTop = this.salida.scrollHeight;
    });
  }

  limpiar() {
    this.salida.innerHTML = '';
  }

  bienvenida() {
    this.escribir('Mentor Linux — terminal simulada. Escribe `help` para ver los comandos disponibles.', 'nota');
  }

  ejecutar(linea) {
    const texto = linea.trim();
    // El eco del comando, con el prompt delante, igual que en una terminal real.
    const eco = document.createElement('div');
    eco.className = 'consola-linea consola-eco';
    eco.innerHTML = `<span class="t-prompt">${escapar(this.shell.prompt())}</span> ${escapar(linea)}`;
    this.salida.appendChild(eco);

    if (!texto) {
      this.desplazarAlFinal();
      return;
    }

    this.historial.push(texto);
    this.indiceHistorial = -1;

    const resultado = this.shell.run(texto);
    if (resultado.clear) this.limpiar();
    else if (resultado.output) this.escribirBloque(resultado.output);

    this.actualizarPrompt();
    this.desplazarAlFinal();

    this.ultimo = { cmd: texto, salida: resultado.output, code: resultado.code };
    this.alEjecutar(this.contexto());
  }

  // El contexto que reciben los check() de los retos y los incidentes.
  contexto() {
    return {
      fs: this.shell.fs,
      shell: this.shell,
      historial: [...this.historial],
      ultimo: this.ultimo,
    };
  }

  reiniciar() {
    this.crearShell();
    this.historial = [];
    this.indiceHistorial = -1;
    this.ultimo = null;
    this.limpiar();
    this.actualizarPrompt();
    this.escribir('Sistema restaurado al estado inicial.', 'nota');
  }

  enfocar() {
    this.input.focus({ preventScroll: true });
  }
}

function prefijoComun(lista) {
  if (!lista.length) return '';
  let prefijo = lista[0];
  for (const s of lista) {
    while (!s.startsWith(prefijo)) prefijo = prefijo.slice(0, -1);
  }
  return prefijo;
}

export { pintar };
