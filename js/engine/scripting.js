// =====================================================================
// Intérpretes didácticos de Python y Lua
//
// La app no ejecuta código real: no hay CPython ni PUC-Lua dentro del
// navegador. Este módulo interpreta un SUBCONJUNTO de ambos lenguajes,
// el que se enseña en las salas «Python desde cero» y «Lua desde cero»:
// literales, variables, operadores, cadenas, listas/tablas, condiciones,
// bucles y funciones, más una biblioteca estándar mínima.
//
// Decisiones:
//   1. Un solo analizador de expresiones para los dos lenguajes, con una
//      tabla de precedencias por idioma. Lo que cambia de verdad es la
//      sintaxis de los bloques (indentación en Python, `end` en Lua) y la
//      biblioteca, así que eso sí está separado.
//   2. Los valores se representan con tipos de JavaScript: número, cadena,
//      booleano, `null` para None/nil, `Array` para las listas de Python y
//      `Tabla` para las tablas de Lua y los diccionarios de Python.
//   3. Los errores imitan el formato real (`NameError`, `attempt to ...`)
//      porque el alumno va a buscarlos tal cual en la vida real, pero sin
//      prometer un traceback idéntico.
//   4. Todo es determinista y sin acceso a red: el único mundo exterior es
//      el filesystem simulado, que se inyecta como `io`.
//
// Límite explícito: no hay clases, excepciones, módulos, corrutinas,
// metatablas, comprensiones ni generadores. Si una lección los necesitara,
// habría que ampliarlo aquí y no fingirlo en el contenido.
// =====================================================================

const MAX_PASOS = 200000;      // corta bucles infinitos del alumno
const MAX_SALIDA = 200000;     // corta `while true do print() end`

export class ErrorScript extends Error {
  constructor(mensaje, linea) {
    super(mensaje);
    this.linea = linea;
  }
}

// --- valores compartidos ---------------------------------------------

// Un número con parte decimal explícita. Python y Lua 5.4 distinguen 5 de
// 5.0: `10 / 2` da 5.0 en los dos, y esa diferencia se enseña en las salas,
// así que el valor la lleva encima en vez de perderse en el `number` de JS.
export class Flotante {
  constructor(valor) {
    this.valor = valor;
  }
}

// Devuelve el número primitivo esté envuelto o no.
export function crudo(v) {
  return v instanceof Flotante ? v.valor : v;
}

// Envuelve solo si hace falta: NaN e infinitos ya se imprimen aparte.
function flota(n) {
  return new Flotante(n);
}

// Tabla asociativa con orden de inserción: sirve de `dict` de Python y de
// tabla de Lua. Las claves numéricas y de cadena se distinguen, igual que
// en ambos lenguajes (t[1] no es t["1"]).
export class Tabla {
  constructor(pares = []) {
    this.mapa = new Map();
    for (const [k, v] of pares) this.set(k, v);
  }

  static clave(k) {
    const c = crudo(k);
    return typeof c === 'number' ? 'n:' + c : typeof c === 'boolean' ? 'b:' + c : 's:' + String(c);
  }

  get(k) {
    const e = this.mapa.get(Tabla.clave(k));
    return e ? e.v : null;
  }

  has(k) {
    return this.mapa.has(Tabla.clave(k));
  }

  set(k, v) {
    const clave = Tabla.clave(k);
    if (v === null && this.esLua) this.mapa.delete(clave);
    else this.mapa.set(clave, { k, v });
  }

  borrar(k) {
    this.mapa.delete(Tabla.clave(k));
  }

  get tamaño() {
    return this.mapa.size;
  }

  claves() {
    return [...this.mapa.values()].map((e) => e.k);
  }

  valores() {
    return [...this.mapa.values()].map((e) => e.v);
  }

  pares() {
    return [...this.mapa.values()].map((e) => [e.k, e.v]);
  }

  // Longitud «de secuencia» de Lua: 1..n consecutivos.
  longitudSecuencia() {
    let n = 0;
    while (this.has(n + 1)) n++;
    return n;
  }
}

// Función definida por el usuario o nativa.
class Funcion {
  constructor(nombre, params, cuerpo, entorno, defectos = []) {
    this.nombre = nombre;
    this.params = params;
    this.cuerpo = cuerpo;
    this.entorno = entorno;
    this.defectos = defectos;
  }
}

class Nativa {
  constructor(nombre, fn) {
    this.nombre = nombre;
    this.fn = fn;
  }
}

// Señales de control de flujo.
const SEÑAL_RETORNO = Symbol('return');
const SEÑAL_ROMPER = Symbol('break');
const SEÑAL_SEGUIR = Symbol('continue');

// --- tokenizador -----------------------------------------------------

const OPS = [
  '//=', '**=', '...', '..=', '//', '**', '==', '!=', '~=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '..',
  '(', ')', '[', ']', '{', '}', ',', ':', ';', '.', '+', '-', '*', '/', '%', '^', '#', '<', '>', '=',
];

function esLetra(c) {
  return /[A-Za-z_]/.test(c);
}

function esDigito(c) {
  return c >= '0' && c <= '9';
}

// Devuelve la lista de tokens. En Python emite INDENT/DEDENT/NEWLINE; en Lua
// las líneas nuevas son espacio en blanco corriente.
function tokenizar(fuente, lang) {
  const py = lang === 'py';
  const tokens = [];
  const pila = [0];
  let i = 0;
  let linea = 1;
  let inicioLinea = true;
  let profundidad = 0; // paréntesis abiertos: dentro no hay indentación

  const push = (tipo, valor, extra = {}) => tokens.push({ tipo, valor, linea, ...extra });

  while (i < fuente.length) {
    // Indentación al principio de línea (solo Python y fuera de paréntesis).
    if (inicioLinea && py && profundidad === 0) {
      let ancho = 0;
      while (i < fuente.length && (fuente[i] === ' ' || fuente[i] === '\t')) {
        ancho += fuente[i] === '\t' ? 8 - (ancho % 8) : 1;
        i++;
      }
      if (i >= fuente.length) break;
      if (fuente[i] === '\n') { i++; linea++; continue; }          // línea en blanco
      if (fuente[i] === '#') { while (i < fuente.length && fuente[i] !== '\n') i++; continue; }
      const actual = pila[pila.length - 1];
      inicioLinea = false;
      if (ancho > actual) { pila.push(ancho); push('indent'); }
      else if (ancho < actual) {
        while (pila.length > 1 && ancho < pila[pila.length - 1]) { pila.pop(); push('dedent'); }
        if (ancho !== pila[pila.length - 1]) throw new ErrorScript('IndentationError: unindent does not match any outer indentation level', linea);
      }
      continue;
    }

    const c = fuente[i];

    if (c === '\n') {
      linea++;
      i++;
      if (py && profundidad === 0) { push('newline'); inicioLinea = true; }
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }

    // Comentarios.
    if (py && c === '#') { while (i < fuente.length && fuente[i] !== '\n') i++; continue; }
    if (!py && c === '-' && fuente[i + 1] === '-') {
      if (fuente[i + 2] === '[' && fuente[i + 3] === '[') {
        const fin = fuente.indexOf(']]', i + 4);
        const trozo = fuente.slice(i, fin < 0 ? fuente.length : fin + 2);
        linea += (trozo.match(/\n/g) || []).length;
        i = fin < 0 ? fuente.length : fin + 2;
        continue;
      }
      while (i < fuente.length && fuente[i] !== '\n') i++;
      continue;
    }

    // Cadenas largas de Lua: [[ ... ]]
    if (!py && c === '[' && fuente[i + 1] === '[') {
      const fin = fuente.indexOf(']]', i + 2);
      if (fin < 0) throw new ErrorScript('unfinished long string', linea);
      let texto = fuente.slice(i + 2, fin);
      if (texto.startsWith('\n')) texto = texto.slice(1);
      linea += (fuente.slice(i, fin).match(/\n/g) || []).length;
      i = fin + 2;
      push('cadena', texto);
      continue;
    }

    // Cadenas normales, con prefijo f de Python.
    if (c === '"' || c === "'" || (py && (c === 'f' || c === 'F') && (fuente[i + 1] === '"' || fuente[i + 1] === "'"))) {
      const formato = c === 'f' || c === 'F';
      if (formato) i++;
      const comilla = fuente[i];
      i++;
      let texto = '';
      while (i < fuente.length && fuente[i] !== comilla) {
        if (fuente[i] === '\\') {
          const sig = fuente[i + 1];
          texto += sig === 'n' ? '\n' : sig === 't' ? '\t' : sig === '\\' ? '\\' : sig === '0' ? '\0' : sig;
          i += 2;
          continue;
        }
        if (fuente[i] === '\n') throw new ErrorScript(py ? 'SyntaxError: unterminated string literal' : 'unfinished string', linea);
        texto += fuente[i++];
      }
      if (i >= fuente.length) throw new ErrorScript(py ? 'SyntaxError: unterminated string literal' : 'unfinished string', linea);
      i++;
      push(formato ? 'fcadena' : 'cadena', texto);
      continue;
    }

    if (esDigito(c) || (c === '.' && esDigito(fuente[i + 1]))) {
      let n = '';
      while (i < fuente.length && /[0-9._]/.test(fuente[i])) {
        if (fuente[i] !== '_') n += fuente[i];
        i++;
      }
      if (/[eE]/.test(fuente[i] || '') && /[0-9+-]/.test(fuente[i + 1] || '')) {
        n += fuente[i++];
        if (/[+-]/.test(fuente[i])) n += fuente[i++];
        while (i < fuente.length && esDigito(fuente[i])) n += fuente[i++];
      }
      push('numero', Number(n), { decimal: /[.eE]/.test(n) });
      continue;
    }

    if (esLetra(c)) {
      let nombre = '';
      while (i < fuente.length && /[A-Za-z0-9_]/.test(fuente[i])) nombre += fuente[i++];
      push('nombre', nombre);
      continue;
    }

    const op = OPS.find((o) => fuente.startsWith(o, i));
    if (!op) throw new ErrorScript(py ? `SyntaxError: invalid character '${c}'` : `unexpected symbol near '${c}'`, linea);
    if ('([{'.includes(op)) profundidad++;
    if (')]}'.includes(op)) profundidad = Math.max(0, profundidad - 1);
    i += op.length;
    push('op', op);
  }

  if (py) {
    push('newline');
    while (pila.length > 1) { pila.pop(); push('dedent'); }
  }
  push('eof');
  return tokens;
}

// --- analizador sintáctico -------------------------------------------

const PALABRAS_PY = new Set(['if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'break', 'continue', 'and', 'or', 'not', 'True', 'False', 'None', 'pass', 'import', 'from', 'with', 'as', 'global']);
const PALABRAS_LUA = new Set(['if', 'then', 'elseif', 'else', 'end', 'while', 'do', 'for', 'in', 'function', 'local', 'return', 'break', 'repeat', 'until', 'and', 'or', 'not', 'true', 'false', 'nil']);

class Analizador {
  constructor(tokens, lang) {
    this.t = tokens;
    this.i = 0;
    this.lang = lang;
    this.py = lang === 'py';
  }

  get actual() { return this.t[this.i]; }
  get linea() { return this.actual ? this.actual.linea : 0; }

  esOp(...valores) {
    return this.actual.tipo === 'op' && valores.includes(this.actual.valor);
  }

  esNombre(...valores) {
    return this.actual.tipo === 'nombre' && valores.includes(this.actual.valor);
  }

  comer(tipo, valor) {
    const t = this.actual;
    if (t.tipo !== tipo || (valor !== undefined && t.valor !== valor)) {
      const visto = t.tipo === 'eof' ? '<eof>' : String(t.valor ?? t.tipo);
      throw new ErrorScript(this.py ? `SyntaxError: invalid syntax (near '${visto}')` : `'${valor ?? tipo}' expected near '${visto}'`, t.linea);
    }
    this.i++;
    return t;
  }

  aceptarOp(valor) {
    if (this.esOp(valor)) { this.i++; return true; }
    return false;
  }

  aceptarNombre(valor) {
    if (this.esNombre(valor)) { this.i++; return true; }
    return false;
  }

  // --- programa y bloques --------------------------------------------

  programa() {
    const cuerpo = this.py ? this.sentenciasHastaDedent(true) : this.sentenciasLua(['eof']);
    return { tipo: 'bloque', cuerpo };
  }

  // En Python el punto y coma también separa sentencias en una misma línea:
  // `x = 1; print(x)`. Se trata igual que un salto de línea.
  saltarNuevaLinea() {
    while (this.actual.tipo === 'newline' || this.esOp(';')) this.i++;
  }

  sentenciasHastaDedent(raiz = false) {
    const cuerpo = [];
    this.saltarNuevaLinea();
    while (this.actual.tipo !== 'eof' && this.actual.tipo !== 'dedent') {
      cuerpo.push(this.sentencia());
      this.saltarNuevaLinea();
    }
    if (!raiz && this.actual.tipo === 'dedent') this.i++;
    return cuerpo;
  }

  bloquePython() {
    this.comer('op', ':');
    if (this.actual.tipo === 'newline') {
      this.saltarNuevaLinea();
      if (this.actual.tipo !== 'indent') throw new ErrorScript('IndentationError: expected an indented block', this.linea);
      this.i++;
      return this.sentenciasHastaDedent();
    }
    // Bloque en la misma línea: `if x: print(1)`
    const s = [this.sentencia()];
    this.saltarNuevaLinea();
    return s;
  }

  sentenciasLua(finales) {
    const cuerpo = [];
    while (true) {
      const t = this.actual;
      if (t.tipo === 'eof' && !finales.includes('eof')) throw new ErrorScript("'end' expected near <eof>", t.linea);
      if (t.tipo === 'eof') break;
      if (t.tipo === 'nombre' && finales.includes(t.valor)) break;
      cuerpo.push(this.sentencia());
      this.aceptarOp(';');
    }
    return cuerpo;
  }

  // --- sentencias ------------------------------------------------------

  sentencia() {
    return this.py ? this.sentenciaPy() : this.sentenciaLua();
  }

  sentenciaPy() {
    const linea = this.linea;
    if (this.esNombre('if')) return this.siPython();
    if (this.esNombre('while')) {
      this.i++;
      const cond = this.expresion();
      return { tipo: 'mientras', cond, cuerpo: this.bloquePython(), linea };
    }
    if (this.esNombre('for')) {
      this.i++;
      const vars = [this.comer('nombre').valor];
      while (this.aceptarOp(',')) vars.push(this.comer('nombre').valor);
      if (!this.aceptarNombre('in')) throw new ErrorScript('SyntaxError: invalid syntax', linea);
      const iterable = this.expresion();
      return { tipo: 'paraEn', vars, iterable, cuerpo: this.bloquePython(), linea };
    }
    if (this.esNombre('def')) {
      this.i++;
      const nombre = this.comer('nombre').valor;
      const { params, defectos } = this.parametros();
      return { tipo: 'defun', nombre, params, defectos, cuerpo: this.bloquePython(), linea };
    }
    if (this.esNombre('return')) {
      this.i++;
      const valor = (this.actual.tipo === 'newline' || this.actual.tipo === 'dedent' || this.actual.tipo === 'eof') ? null : this.expresion();
      return { tipo: 'retorno', valores: valor ? [valor] : [], linea };
    }
    if (this.esNombre('break')) { this.i++; return { tipo: 'romper', linea }; }
    if (this.esNombre('continue')) { this.i++; return { tipo: 'seguir', linea }; }
    if (this.esNombre('pass')) { this.i++; return { tipo: 'nada', linea }; }
    if (this.esNombre('global')) {
      this.i++;
      const nombres = [this.comer('nombre').valor];
      while (this.aceptarOp(',')) nombres.push(this.comer('nombre').valor);
      return { tipo: 'global', nombres, linea };
    }
    if (this.esNombre('import')) {
      this.i++;
      const modulo = this.comer('nombre').valor;
      let alias = modulo;
      if (this.aceptarNombre('as')) alias = this.comer('nombre').valor;
      return { tipo: 'importar', modulo, alias, linea };
    }
    if (this.esNombre('from')) {
      this.i++;
      const modulo = this.comer('nombre').valor;
      if (!this.aceptarNombre('import')) throw new ErrorScript('SyntaxError: invalid syntax', linea);
      const nombres = [this.comer('nombre').valor];
      while (this.aceptarOp(',')) nombres.push(this.comer('nombre').valor);
      return { tipo: 'importarDe', modulo, nombres, linea };
    }
    if (this.esNombre('with')) {
      this.i++;
      const valor = this.expresion();
      if (!this.aceptarNombre('as')) throw new ErrorScript('SyntaxError: invalid syntax', linea);
      const alias = this.comer('nombre').valor;
      return { tipo: 'con', valor, alias, cuerpo: this.bloquePython(), linea };
    }
    return this.expresionOAsignacion();
  }

  siPython() {
    const linea = this.linea;
    this.i++;
    const cond = this.expresion();
    const cuerpo = this.bloquePython();
    let sino = [];
    this.saltarNuevaLinea();
    if (this.esNombre('elif')) sino = [this.siPython()];
    else if (this.esNombre('else')) { this.i++; sino = this.bloquePython(); }
    return { tipo: 'si', cond, cuerpo, sino, linea };
  }

  sentenciaLua() {
    const linea = this.linea;
    if (this.esNombre('if')) {
      this.i++;
      const cond = this.expresion();
      this.comer('nombre', 'then');
      const cuerpo = this.sentenciasLua(['elseif', 'else', 'end']);
      let sino = [];
      if (this.esNombre('elseif')) sino = [this.sentenciaLuaElseif()];
      else if (this.aceptarNombre('else')) { sino = this.sentenciasLua(['end']); this.comer('nombre', 'end'); }
      else this.comer('nombre', 'end');
      return { tipo: 'si', cond, cuerpo, sino, linea };
    }
    if (this.esNombre('while')) {
      this.i++;
      const cond = this.expresion();
      this.comer('nombre', 'do');
      const cuerpo = this.sentenciasLua(['end']);
      this.comer('nombre', 'end');
      return { tipo: 'mientras', cond, cuerpo, linea };
    }
    if (this.esNombre('repeat')) {
      this.i++;
      const cuerpo = this.sentenciasLua(['until']);
      this.comer('nombre', 'until');
      return { tipo: 'repetir', cuerpo, cond: this.expresion(), linea };
    }
    if (this.esNombre('for')) {
      this.i++;
      const primera = this.comer('nombre').valor;
      if (this.aceptarOp('=')) {
        const desde = this.expresion();
        this.comer('op', ',');
        const hasta = this.expresion();
        const paso = this.aceptarOp(',') ? this.expresion() : null;
        this.comer('nombre', 'do');
        const cuerpo = this.sentenciasLua(['end']);
        this.comer('nombre', 'end');
        return { tipo: 'paraNumerico', variable: primera, desde, hasta, paso, cuerpo, linea };
      }
      const vars = [primera];
      while (this.aceptarOp(',')) vars.push(this.comer('nombre').valor);
      this.comer('nombre', 'in');
      const iterable = this.expresion();
      this.comer('nombre', 'do');
      const cuerpo = this.sentenciasLua(['end']);
      this.comer('nombre', 'end');
      return { tipo: 'paraEn', vars, iterable, cuerpo, linea };
    }
    if (this.esNombre('function')) {
      this.i++;
      let destino = { tipo: 'nombre', nombre: this.comer('nombre').valor, linea };
      let nombre = destino.nombre;
      while (this.esOp('.') || this.esOp(':')) {
        this.i++;
        const campo = this.comer('nombre').valor;
        nombre += '.' + campo;
        destino = { tipo: 'indice', objeto: destino, clave: { tipo: 'literal', valor: campo }, linea };
      }
      const { params, defectos } = this.parametros();
      const cuerpo = this.sentenciasLua(['end']);
      this.comer('nombre', 'end');
      return { tipo: 'asignar', destinos: [destino], valores: [{ tipo: 'funcion', nombre, params, defectos, cuerpo, linea }], linea };
    }
    if (this.esNombre('local')) {
      this.i++;
      if (this.esNombre('function')) {
        this.i++;
        const nombre = this.comer('nombre').valor;
        const { params, defectos } = this.parametros();
        const cuerpo = this.sentenciasLua(['end']);
        this.comer('nombre', 'end');
        return { tipo: 'local', nombres: [nombre], valores: [{ tipo: 'funcion', nombre, params, defectos, cuerpo, linea }], linea };
      }
      const nombres = [this.comer('nombre').valor];
      while (this.aceptarOp(',')) nombres.push(this.comer('nombre').valor);
      const valores = [];
      if (this.aceptarOp('=')) {
        valores.push(this.expresion());
        while (this.aceptarOp(',')) valores.push(this.expresion());
      }
      return { tipo: 'local', nombres, valores, linea };
    }
    if (this.esNombre('return')) {
      this.i++;
      const valores = [];
      const fin = this.actual.tipo === 'eof' || (this.actual.tipo === 'nombre' && ['end', 'else', 'elseif', 'until'].includes(this.actual.valor)) || this.esOp(';');
      if (!fin) {
        valores.push(this.expresion());
        while (this.aceptarOp(',')) valores.push(this.expresion());
      }
      return { tipo: 'retorno', valores, linea };
    }
    if (this.esNombre('break')) { this.i++; return { tipo: 'romper', linea }; }
    if (this.esNombre('do')) {
      this.i++;
      const cuerpo = this.sentenciasLua(['end']);
      this.comer('nombre', 'end');
      return { tipo: 'bloque', cuerpo, linea };
    }
    return this.expresionOAsignacion();
  }

  sentenciaLuaElseif() {
    const linea = this.linea;
    this.comer('nombre', 'elseif');
    const cond = this.expresion();
    this.comer('nombre', 'then');
    const cuerpo = this.sentenciasLua(['elseif', 'else', 'end']);
    let sino = [];
    if (this.esNombre('elseif')) sino = [this.sentenciaLuaElseif()];
    else if (this.aceptarNombre('else')) { sino = this.sentenciasLua(['end']); this.comer('nombre', 'end'); }
    else this.comer('nombre', 'end');
    return { tipo: 'si', cond, cuerpo, sino, linea };
  }

  parametros() {
    this.comer('op', '(');
    const params = [];
    const defectos = [];
    while (!this.esOp(')')) {
      if (this.esOp('...')) { this.i++; params.push('...'); defectos.push(null); }
      else {
        params.push(this.comer('nombre').valor);
        defectos.push(this.aceptarOp('=') ? this.expresion() : null);
      }
      if (!this.aceptarOp(',')) break;
    }
    this.comer('op', ')');
    return { params, defectos };
  }

  expresionOAsignacion() {
    const linea = this.linea;
    const primera = this.expresion();
    if (this.esOp('=', '+=', '-=', '*=', '/=', '%=', '//=', '**=', '..=')) {
      const op = this.actual.valor;
      this.i++;
      const destinos = [primera];
      const valores = [this.expresion()];
      while (this.aceptarOp(',')) valores.push(this.expresion());
      return { tipo: 'asignar', destinos, valores, op: op === '=' ? null : op.slice(0, -1), linea };
    }
    if (this.esOp(',')) {
      // Asignación múltiple de Lua: a, b = 1, 2
      const destinos = [primera];
      while (this.aceptarOp(',')) destinos.push(this.expresion());
      this.comer('op', '=');
      const valores = [this.expresion()];
      while (this.aceptarOp(',')) valores.push(this.expresion());
      return { tipo: 'asignar', destinos, valores, op: null, linea };
    }
    return { tipo: 'expresion', valor: primera, linea };
  }

  // --- expresiones -----------------------------------------------------

  expresion() {
    return this.binaria(0);
  }

  precedencia(token) {
    if (token.tipo === 'nombre') {
      if (token.valor === 'or') return 1;
      if (token.valor === 'and') return 2;
      if (this.py && token.valor === 'in') return 3;
    }
    if (token.tipo !== 'op') return -1;
    switch (token.valor) {
      case '<': case '>': case '<=': case '>=': case '==': case '!=': case '~=': return 3;
      case '..': return 4;   // Lua: concatenación
      case '+': case '-': return 5;
      case '*': case '/': case '//': case '%': return 6;
      case '**': case '^': return 8;
      default: return -1;
    }
  }

  binaria(min) {
    let izq = this.unaria();
    while (true) {
      const t = this.actual;
      const p = this.precedencia(t);
      if (p < 0 || p < min) break;
      const op = t.valor;
      this.i++;
      // `**`, `^` y `..` asocian a la derecha.
      const derecha = ['**', '^', '..'].includes(op) ? this.binaria(p) : this.binaria(p + 1);
      izq = { tipo: 'binaria', op, izq, der: derecha, linea: t.linea };
    }
    return izq;
  }

  unaria() {
    const t = this.actual;
    if ((this.py && this.esNombre('not')) || (!this.py && this.esNombre('not'))) {
      this.i++;
      return { tipo: 'unaria', op: 'not', valor: this.unaria(), linea: t.linea };
    }
    if (this.esOp('-')) { this.i++; return { tipo: 'unaria', op: '-', valor: this.unaria(), linea: t.linea }; }
    if (!this.py && this.esOp('#')) { this.i++; return { tipo: 'unaria', op: '#', valor: this.unaria(), linea: t.linea }; }
    return this.sufijos(this.primaria());
  }

  sufijos(nodo) {
    while (true) {
      const linea = this.linea;
      if (this.esOp('.')) {
        this.i++;
        nodo = { tipo: 'indice', objeto: nodo, clave: { tipo: 'literal', valor: this.comer('nombre').valor }, punto: true, linea };
        continue;
      }
      if (!this.py && this.esOp(':')) {
        // Llamada con «self» implícito: solo la usamos para cadenas y tablas.
        this.i++;
        const metodo = this.comer('nombre').valor;
        const args = this.argumentos();
        nodo = { tipo: 'llamada', fn: { tipo: 'indice', objeto: nodo, clave: { tipo: 'literal', valor: metodo }, punto: true, linea }, args, self: nodo, linea };
        continue;
      }
      if (this.esOp('[')) {
        this.i++;
        const clave = this.expresion();
        this.comer('op', ']');
        nodo = { tipo: 'indice', objeto: nodo, clave, linea };
        continue;
      }
      if (this.esOp('(')) {
        nodo = { tipo: 'llamada', fn: nodo, args: this.argumentos(), linea };
        continue;
      }
      if (!this.py && (this.actual.tipo === 'cadena')) {
        // Azúcar de Lua: f"texto"
        nodo = { tipo: 'llamada', fn: nodo, args: [{ tipo: 'literal', valor: this.comer('cadena').valor }], linea };
        continue;
      }
      break;
    }
    return nodo;
  }

  argumentos() {
    this.comer('op', '(');
    const args = [];
    while (!this.esOp(')')) {
      // Argumento con nombre de Python: print(x, end="")
      if (this.py && this.actual.tipo === 'nombre' && this.t[this.i + 1] && this.t[this.i + 1].tipo === 'op' && this.t[this.i + 1].valor === '=') {
        const nombre = this.comer('nombre').valor;
        this.i++;
        args.push({ tipo: 'argNombrado', nombre, valor: this.expresion() });
      } else {
        args.push(this.expresion());
      }
      if (!this.aceptarOp(',')) break;
    }
    this.comer('op', ')');
    return args;
  }

  primaria() {
    const t = this.actual;
    const linea = t.linea;
    if (t.tipo === 'numero') { this.i++; return { tipo: 'literal', valor: t.decimal ? new Flotante(t.valor) : t.valor, linea }; }
    if (t.tipo === 'cadena') { this.i++; return { tipo: 'literal', valor: t.valor, linea }; }
    if (t.tipo === 'fcadena') { this.i++; return this.compilarFCadena(t.valor, linea); }
    if (t.tipo === 'nombre') {
      const v = t.valor;
      if (this.py) {
        if (v === 'True') { this.i++; return { tipo: 'literal', valor: true, linea }; }
        if (v === 'False') { this.i++; return { tipo: 'literal', valor: false, linea }; }
        if (v === 'None') { this.i++; return { tipo: 'literal', valor: null, linea }; }
        if (v === 'not') return this.unaria();
      } else {
        if (v === 'true') { this.i++; return { tipo: 'literal', valor: true, linea }; }
        if (v === 'false') { this.i++; return { tipo: 'literal', valor: false, linea }; }
        if (v === 'nil') { this.i++; return { tipo: 'literal', valor: null, linea }; }
        if (v === 'function') {
          this.i++;
          const { params, defectos } = this.parametros();
          const cuerpo = this.sentenciasLua(['end']);
          this.comer('nombre', 'end');
          return { tipo: 'funcion', nombre: 'anónima', params, defectos, cuerpo, linea };
        }
      }
      const reservadas = this.py ? PALABRAS_PY : PALABRAS_LUA;
      if (reservadas.has(v) && !['in', 'and', 'or', 'not'].includes(v)) {
        throw new ErrorScript(this.py ? `SyntaxError: invalid syntax (near '${v}')` : `unexpected symbol near '${v}'`, linea);
      }
      this.i++;
      return { tipo: 'nombre', nombre: v, linea };
    }
    if (this.esOp('(')) {
      this.i++;
      const e = this.expresion();
      this.comer('op', ')');
      return e;
    }
    if (this.esOp('[') && this.py) {
      this.i++;
      const items = [];
      while (!this.esOp(']')) {
        items.push(this.expresion());
        if (!this.aceptarOp(',')) break;
      }
      this.comer('op', ']');
      return { tipo: 'lista', items, linea };
    }
    if (this.esOp('{')) {
      this.i++;
      const pares = [];
      const posicionales = [];
      while (!this.esOp('}')) {
        if (!this.py && this.esOp('[')) {
          this.i++;
          const clave = this.expresion();
          this.comer('op', ']');
          this.comer('op', '=');
          pares.push([clave, this.expresion()]);
        } else if (!this.py && this.actual.tipo === 'nombre' && this.t[this.i + 1] && this.t[this.i + 1].tipo === 'op' && this.t[this.i + 1].valor === '=') {
          const clave = this.comer('nombre').valor;
          this.i++;
          pares.push([{ tipo: 'literal', valor: clave }, this.expresion()]);
        } else {
          const primero = this.expresion();
          if (this.py) {
            this.comer('op', ':');
            pares.push([primero, this.expresion()]);
          } else {
            posicionales.push(primero);
          }
        }
        if (!this.aceptarOp(',') && !(!this.py && this.aceptarOp(';'))) break;
      }
      this.comer('op', '}');
      return { tipo: 'tabla', pares, posicionales, linea };
    }
    throw new ErrorScript(this.py ? `SyntaxError: invalid syntax (near '${t.valor ?? t.tipo}')` : `unexpected symbol near '${t.valor ?? '<eof>'}'`, linea);
  }

  // f"Hola {nombre}" se compila a una concatenación de trozos.
  compilarFCadena(texto, linea) {
    const partes = [];
    let buffer = '';
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (c === '{' && texto[i + 1] === '{') { buffer += '{'; i++; continue; }
      if (c === '}' && texto[i + 1] === '}') { buffer += '}'; i++; continue; }
      if (c === '{') {
        const fin = texto.indexOf('}', i);
        if (fin < 0) throw new ErrorScript("SyntaxError: f-string: expecting '}'", linea);
        if (buffer) { partes.push({ tipo: 'literal', valor: buffer }); buffer = ''; }
        let interior = texto.slice(i + 1, fin);
        let formato = null;
        const dosPuntos = interior.lastIndexOf(':');
        if (dosPuntos > 0 && /^[.,0-9dfs<>^]*$/.test(interior.slice(dosPuntos + 1))) {
          formato = interior.slice(dosPuntos + 1);
          interior = interior.slice(0, dosPuntos);
        }
        const sub = new Analizador(tokenizar(interior, 'py'), 'py');
        partes.push({ tipo: 'formatear', valor: sub.expresion(), formato, linea });
        i = fin;
        continue;
      }
      buffer += c;
    }
    if (buffer) partes.push({ tipo: 'literal', valor: buffer });
    return { tipo: 'fcadena', partes, linea };
  }
}

// --- intérprete -------------------------------------------------------

class Entorno {
  constructor(padre = null) {
    this.vars = new Map();
    this.padre = padre;
  }

  buscar(nombre) {
    let e = this;
    while (e) {
      if (e.vars.has(nombre)) return e;
      e = e.padre;
    }
    return null;
  }

  get(nombre) {
    const e = this.buscar(nombre);
    return e ? e.vars.get(nombre) : undefined;
  }

  definir(nombre, valor) {
    this.vars.set(nombre, valor);
  }

  asignar(nombre, valor) {
    const e = this.buscar(nombre);
    (e || this).vars.set(nombre, valor);
  }
}

export class Interprete {
  constructor(lang, { io = null, argv = [] } = {}) {
    this.lang = lang;
    this.py = lang === 'py';
    this.io = io;
    this.argv = argv;
    this.salida = '';
    this.pasos = 0;
    this.global = new Entorno();
    this.instalarBiblioteca();
  }

  escribir(texto) {
    this.salida += texto;
    if (this.salida.length > MAX_SALIDA) throw new ErrorScript(this.py ? 'MemoryError: demasiada salida (¿un bucle infinito?)' : 'not enough memory (¿un bucle infinito?)', 0);
  }

  paso() {
    if (++this.pasos > MAX_PASOS) {
      throw new ErrorScript(this.py ? 'RuntimeError: el script no termina (¿un bucle infinito?)' : 'el script no termina (¿un bucle infinito?)', 0);
    }
  }

  // --- conversión y verdad --------------------------------------------

  verdad(valorOriginal) {
    const v = crudo(valorOriginal);
    if (v === undefined) return false;   // argumento con nombre no pasado
    if (this.py) {
      if (v === null || v === false) return false;
      if (v === true) return true;
      if (typeof v === 'number') return v !== 0;
      if (typeof v === 'string') return v.length > 0;
      if (Array.isArray(v)) return v.length > 0;
      if (v instanceof Tabla) return v.tamaño > 0;
      return true;
    }
    return v !== null && v !== false;   // Lua: solo nil y false son falsos
  }

  texto(v, dentro = false) {
    if (v instanceof Flotante) return this.flotanteATexto(v.valor);
    if (v === null) return this.py ? 'None' : 'nil';
    if (v === true) return this.py ? 'True' : 'true';
    if (v === false) return this.py ? 'False' : 'false';
    if (typeof v === 'number') return this.numeroATexto(v);
    if (typeof v === 'string') return dentro && this.py ? `'${v}'` : v;
    if (Array.isArray(v)) return '[' + v.map((x) => this.texto(x, true)).join(', ') + ']';
    if (v instanceof Tabla) {
      if (this.py) return '{' + v.pares().map(([k, val]) => `${this.texto(k, true)}: ${this.texto(val, true)}`).join(', ') + '}';
      return 'table: 0x' + (v.id || (v.id = (0x14000 + v.tamaño * 8 + this.pasos % 64).toString(16)));
    }
    if (v instanceof Funcion || v instanceof Nativa) {
      return this.py ? `<function ${v.nombre}>` : 'function: builtin';
    }
    return String(v);
  }

  // Un flotante siempre enseña su punto decimal: 5.0, no 5.
  flotanteATexto(n) {
    if (!Number.isFinite(n)) return this.numeroATexto(n);
    return Number.isInteger(n) ? n.toFixed(1) : this.numeroATexto(n);
  }

  numeroATexto(n) {
    if (!Number.isFinite(n)) return n > 0 ? 'inf' : Number.isNaN(n) ? (this.py ? 'nan' : '-nan') : '-inf';
    if (Number.isInteger(n)) return String(n);
    const s = String(n);
    return s.includes('e') ? s : this.py ? s : String(Number(n.toFixed(14)));
  }

  tipoDe(v) {
    if (v instanceof Flotante) return this.py ? 'float' : 'number';
    if (v === null) return this.py ? 'NoneType' : 'nil';
    if (typeof v === 'boolean') return this.py ? 'bool' : 'boolean';
    if (typeof v === 'number') return this.py ? (Number.isInteger(v) ? 'int' : 'float') : 'number';
    if (typeof v === 'string') return this.py ? 'str' : 'string';
    if (Array.isArray(v)) return 'list';
    if (v instanceof Tabla) return this.py ? 'dict' : 'table';
    if (v instanceof Funcion || v instanceof Nativa) return 'function';
    return 'object';
  }

  error(mensaje, linea) {
    throw new ErrorScript(mensaje, linea);
  }

  // --- ejecución -------------------------------------------------------

  ejecutar(fuente) {
    const tokens = tokenizar(fuente, this.lang);
    const arbol = new Analizador(tokens, this.lang).programa();
    const señal = this.bloque(arbol.cuerpo, this.global);
    if (señal && señal.tipo === SEÑAL_RETORNO) return señal.valor;
    return null;
  }

  // En Python un `if` o un `for` NO abren un ámbito: lo que se asigna dentro
  // sigue vivo fuera. En Lua sí lo abren, y las variables `local` mueren con
  // el bloque. De ahí que el ámbito de un bloque dependa del lenguaje.
  ambitoDeBloque(entorno) {
    return this.py ? entorno : new Entorno(entorno);
  }

  bloque(sentencias, entorno) {
    for (const s of sentencias) {
      const señal = this.sentencia(s, entorno);
      if (señal) return señal;
    }
    return null;
  }

  sentencia(nodo, entorno) {
    this.paso();
    switch (nodo.tipo) {
      case 'expresion':
        this.evaluar(nodo.valor, entorno);
        return null;

      case 'nada':
        return null;

      case 'bloque':
        return this.bloque(nodo.cuerpo, this.ambitoDeBloque(entorno));

      case 'global':
        for (const n of nodo.nombres) if (!this.global.vars.has(n)) this.global.definir(n, null);
        entorno.globales = new Set([...(entorno.globales || []), ...nodo.nombres]);
        return null;

      case 'local':
        nodo.nombres.forEach((n, i) => entorno.definir(n, nodo.valores[i] ? this.evaluar(nodo.valores[i], entorno) : null));
        return null;

      case 'asignar': {
        const valores = nodo.valores.map((v) => this.evaluar(v, entorno));
        nodo.destinos.forEach((destino, i) => {
          let valor = valores[i] === undefined ? null : valores[i];
          if (nodo.op) valor = this.binaria(nodo.op, this.evaluar(destino, entorno), valor, nodo.linea);
          this.asignarA(destino, valor, entorno);
        });
        return null;
      }

      case 'defun': {
        const fn = new Funcion(nodo.nombre, nodo.params, nodo.cuerpo, entorno, nodo.defectos);
        entorno.definir(nodo.nombre, fn);
        return null;
      }

      case 'si':
        if (this.verdad(this.evaluar(nodo.cond, entorno))) return this.bloque(nodo.cuerpo, this.ambitoDeBloque(entorno));
        return this.bloque(nodo.sino, this.ambitoDeBloque(entorno));

      case 'mientras':
        while (this.verdad(this.evaluar(nodo.cond, entorno))) {
          this.paso();
          const señal = this.bloque(nodo.cuerpo, this.ambitoDeBloque(entorno));
          if (señal) {
            if (señal.tipo === SEÑAL_ROMPER) break;
            if (señal.tipo === SEÑAL_SEGUIR) continue;
            return señal;
          }
        }
        return null;

      case 'repetir':
        while (true) {
          this.paso();
          const hijo = this.ambitoDeBloque(entorno);
          const señal = this.bloque(nodo.cuerpo, hijo);
          if (señal) {
            if (señal.tipo === SEÑAL_ROMPER) break;
            if (señal.tipo !== SEÑAL_SEGUIR) return señal;
          }
          if (this.verdad(this.evaluar(nodo.cond, hijo))) break;
        }
        return null;

      case 'paraNumerico': {
        const desde = this.numero(this.evaluar(nodo.desde, entorno), nodo.linea);
        const hasta = this.numero(this.evaluar(nodo.hasta, entorno), nodo.linea);
        const paso = nodo.paso ? this.numero(this.evaluar(nodo.paso, entorno), nodo.linea) : 1;
        if (paso === 0) this.error("'for' step is zero", nodo.linea);
        for (let v = desde; paso > 0 ? v <= hasta : v >= hasta; v += paso) {
          this.paso();
          const hijo = this.ambitoDeBloque(entorno);
          hijo.definir(nodo.variable, v);
          const señal = this.bloque(nodo.cuerpo, hijo);
          if (señal) {
            if (señal.tipo === SEÑAL_ROMPER) break;
            if (señal.tipo === SEÑAL_SEGUIR) continue;
            return señal;
          }
        }
        return null;
      }

      case 'paraEn': {
        const iterable = this.evaluar(nodo.iterable, entorno);
        for (const item of this.iterar(iterable, nodo.linea)) {
          this.paso();
          const hijo = this.ambitoDeBloque(entorno);
          if (nodo.vars.length === 1) hijo.definir(nodo.vars[0], Array.isArray(item) && item.esPar ? item[0] : item);
          else nodo.vars.forEach((n, i) => hijo.definir(n, Array.isArray(item) ? (item[i] === undefined ? null : item[i]) : (i === 0 ? item : null)));
          const señal = this.bloque(nodo.cuerpo, hijo);
          if (señal) {
            if (señal.tipo === SEÑAL_ROMPER) break;
            if (señal.tipo === SEÑAL_SEGUIR) continue;
            return señal;
          }
        }
        return null;
      }

      case 'retorno':
        return { tipo: SEÑAL_RETORNO, valor: nodo.valores.length ? this.evaluar(nodo.valores[0], entorno) : null };

      case 'romper':
        return { tipo: SEÑAL_ROMPER };

      case 'seguir':
        return { tipo: SEÑAL_SEGUIR };

      case 'importar': {
        const modulo = this.modulo(nodo.modulo, nodo.linea);
        entorno.definir(nodo.alias, modulo);
        return null;
      }

      case 'importarDe': {
        const modulo = this.modulo(nodo.modulo, nodo.linea);
        for (const n of nodo.nombres) entorno.definir(n, modulo.get(n));
        return null;
      }

      case 'con': {
        const valor = this.evaluar(nodo.valor, entorno);
        const hijo = new Entorno(entorno);
        hijo.definir(nodo.alias, valor);
        const señal = this.bloque(nodo.cuerpo, hijo);
        return señal;
      }

      default:
        this.error(`sentencia no soportada: ${nodo.tipo}`, nodo.linea);
        return null;
    }
  }

  asignarA(destino, valor, entorno) {
    if (destino.tipo === 'nombre') {
      if (entorno.globales && entorno.globales.has(destino.nombre)) this.global.asignar(destino.nombre, valor);
      // Python liga siempre en el ámbito de la función actual (o el global);
      // Lua, en cambio, escribe donde estuviera declarada la variable.
      else if (this.py) entorno.definir(destino.nombre, valor);
      else entorno.asignar(destino.nombre, valor);
      return;
    }
    if (destino.tipo === 'indice') {
      const objeto = this.evaluar(destino.objeto, entorno);
      const clave = this.evaluar(destino.clave, entorno);
      if (Array.isArray(objeto)) {
        const i = this.indiceLista(objeto, clave, destino.linea);
        objeto[i] = valor;
        return;
      }
      if (objeto instanceof Tabla) {
        objeto.set(clave, valor);
        return;
      }
      this.error(this.py ? `TypeError: '${this.tipoDe(objeto)}' object does not support item assignment` : `attempt to index a ${this.tipoDe(objeto)} value`, destino.linea);
    }
    this.error(this.py ? 'SyntaxError: cannot assign to expression' : 'cannot assign', destino.linea);
  }

  indiceLista(lista, claveOriginal, linea) {
    const clave = crudo(claveOriginal);
    if (typeof clave !== 'number') this.error(`TypeError: list indices must be integers, not ${this.tipoDe(clave)}`, linea);
    const i = clave < 0 ? lista.length + clave : clave;
    if (i < 0 || i >= lista.length) this.error('IndexError: list index out of range', linea);
    return i;
  }

  *iterar(valor, linea) {
    if (typeof valor === 'string') {
      for (const c of valor) yield c;
      return;
    }
    if (Array.isArray(valor)) {
      yield* valor;
      return;
    }
    if (valor instanceof Tabla) {
      if (valor.iterador) { yield* valor.iterador(); return; }
      if (this.py) { yield* valor.claves(); return; }
      yield* valor.pares();
      return;
    }
    this.error(this.py ? `TypeError: '${this.tipoDe(valor)}' object is not iterable` : `attempt to call a ${this.tipoDe(valor)} value`, linea);
  }

  numero(valorOriginal, linea) {
    const v = crudo(valorOriginal);
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)) && !this.py) return Number(v);
    this.error(this.py ? `TypeError: '${this.tipoDe(v)}' object cannot be interpreted as an integer` : `attempt to perform arithmetic on a ${this.tipoDe(v)} value`, linea);
    return 0;
  }

  // --- expresiones ------------------------------------------------------

  evaluar(nodo, entorno) {
    this.paso();
    switch (nodo.tipo) {
      case 'literal':
        return nodo.valor;

      case 'nombre': {
        const e = entorno.buscar(nodo.nombre);
        if (!e) {
          if (this.py) this.error(`NameError: name '${nodo.nombre}' is not defined`, nodo.linea);
          return null;   // Lua: una variable no declarada vale nil
        }
        return e.vars.get(nodo.nombre);
      }

      case 'lista':
        return nodo.items.map((n) => this.evaluar(n, entorno));

      case 'tabla': {
        const t = new Tabla();
        if (!this.py) t.esLua = true;
        (nodo.posicionales || []).forEach((n, i) => t.set(i + 1, this.evaluar(n, entorno)));
        for (const [k, v] of nodo.pares) t.set(this.evaluar(k, entorno), this.evaluar(v, entorno));
        return t;
      }

      case 'fcadena':
        return nodo.partes.map((p) => {
          if (p.tipo === 'literal') return p.valor;
          return this.formatear(this.evaluar(p.valor, entorno), p.formato);
        }).join('');

      case 'unaria': {
        const v = this.evaluar(nodo.valor, entorno);
        if (nodo.op === 'not') return !this.verdad(v);
        if (nodo.op === '-') return v instanceof Flotante ? flota(-v.valor) : -this.numero(v, nodo.linea);
        if (nodo.op === '#') {
          if (typeof v === 'string') return v.length;
          if (v instanceof Tabla) return v.longitudSecuencia();
          if (Array.isArray(v)) return v.length;
          this.error(`attempt to get length of a ${this.tipoDe(v)} value`, nodo.linea);
        }
        return null;
      }

      case 'binaria': {
        // `and`/`or` cortocircuitan y devuelven un operando, no un booleano.
        if (nodo.op === 'and') {
          const izq = this.evaluar(nodo.izq, entorno);
          return this.verdad(izq) ? this.evaluar(nodo.der, entorno) : izq;
        }
        if (nodo.op === 'or') {
          const izq = this.evaluar(nodo.izq, entorno);
          return this.verdad(izq) ? izq : this.evaluar(nodo.der, entorno);
        }
        return this.binaria(nodo.op, this.evaluar(nodo.izq, entorno), this.evaluar(nodo.der, entorno), nodo.linea);
      }

      case 'indice': {
        const objeto = this.evaluar(nodo.objeto, entorno);
        const clave = this.evaluar(nodo.clave, entorno);
        return this.leerIndice(objeto, clave, nodo);
      }

      case 'llamada':
        return this.llamar(nodo, entorno);

      case 'funcion':
        return new Funcion(nodo.nombre, nodo.params, nodo.cuerpo, entorno, nodo.defectos);

      case 'formatear':
        return this.formatear(this.evaluar(nodo.valor, entorno), nodo.formato);

      default:
        this.error(`expresión no soportada: ${nodo.tipo}`, nodo.linea);
        return null;
    }
  }

  leerIndice(objeto, claveOriginal, nodo) {
    const clave = objeto instanceof Tabla ? claveOriginal : crudo(claveOriginal);
    if (typeof objeto === 'string') {
      const metodo = this.metodoCadena(objeto, clave);
      if (metodo) return metodo;
      if (typeof clave === 'number') {
        const i = clave < 0 ? objeto.length + clave : clave;
        if (i < 0 || i >= objeto.length) this.error('IndexError: string index out of range', nodo.linea);
        return objeto[i];
      }
      this.error(this.py ? `AttributeError: 'str' object has no attribute '${clave}'` : `attempt to index a string value`, nodo.linea);
    }
    if (Array.isArray(objeto)) {
      const metodo = this.metodoLista(objeto, clave);
      if (metodo) return metodo;
      return objeto[this.indiceLista(objeto, clave, nodo.linea)];
    }
    if (objeto instanceof Tabla) {
      const metodo = this.metodoTabla(objeto, clave);
      if (metodo) return metodo;
      if (this.py && !objeto.has(clave) && !objeto.esModulo) this.error(`KeyError: ${this.texto(clave, true)}`, nodo.linea);
      return objeto.get(clave);
    }
    if (objeto === null) {
      this.error(this.py
        ? `AttributeError: 'NoneType' object has no attribute '${clave}'`
        : `attempt to index a nil value${nodo.objeto && nodo.objeto.nombre ? ` (global '${nodo.objeto.nombre}')` : ''}`, nodo.linea);
    }
    this.error(this.py ? `TypeError: '${this.tipoDe(objeto)}' object is not subscriptable` : `attempt to index a ${this.tipoDe(objeto)} value`, nodo.linea);
    return null;
  }

  binaria(op, valorIzq, valorDer, linea) {
    // La aritmética se hace con primitivos; el resultado vuelve a ser
    // flotante si lo era alguno de los operandos o si la operación lo
    // produce siempre (la división real).
    const decimal = valorIzq instanceof Flotante || valorDer instanceof Flotante;
    const a = crudo(valorIzq);
    const b = crudo(valorDer);
    const envolver = (n) => (typeof n === 'number' && Number.isFinite(n) ? flota(n) : n);
    const quiza = (n) => (decimal ? envolver(n) : n);
    const cad = typeof a === 'string' || typeof b === 'string';
    switch (op) {
      case '+':
        if (this.py && typeof a === 'string' && typeof b === 'string') return a + b;
        if (this.py && Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
        if (this.py && cad) this.error(`TypeError: can only concatenate str (not "${this.tipoDe(typeof a === 'string' ? b : a)}") to str`, linea);
        return quiza(this.numero(a, linea) + this.numero(b, linea));
      case '-': return quiza(this.numero(a, linea) - this.numero(b, linea));
      case '*':
        if (this.py && typeof a === 'string' && typeof b === 'number') return a.repeat(Math.max(0, Math.trunc(b)));
        if (this.py && typeof b === 'string' && typeof a === 'number') return b.repeat(Math.max(0, Math.trunc(a)));
        if (this.py && Array.isArray(a) && typeof b === 'number') {
          const salida = [];
          for (let i = 0; i < Math.max(0, Math.trunc(b)); i++) salida.push(...a);
          return salida;
        }
        return quiza(this.numero(a, linea) * this.numero(b, linea));
      case '/': {
        const d = this.numero(b, linea);
        if (d === 0) {
          if (this.py) this.error('ZeroDivisionError: division by zero', linea);
          return this.numero(a, linea) === 0 ? NaN : (this.numero(a, linea) > 0 ? Infinity : -Infinity);
        }
        // `/` da siempre un número con decimales, tanto en Python 3 como en Lua 5.4.
        return envolver(this.numero(a, linea) / d);
      }
      case '//': {
        const d = this.numero(b, linea);
        if (d === 0) this.error('ZeroDivisionError: integer division or modulo by zero', linea);
        return quiza(Math.floor(this.numero(a, linea) / d));
      }
      case '%': {
        const d = this.numero(b, linea);
        if (d === 0) this.error(this.py ? 'ZeroDivisionError: integer division or modulo by zero' : 'attempt to perform \'n%%0\'', linea);
        const x = this.numero(a, linea);
        return quiza(x - Math.floor(x / d) * d);   // módulo con signo del divisor, como en ambos lenguajes
      }
      // En Lua `^` siempre da decimal; en Python `**` conserva el tipo.
      case '**': return quiza(Math.pow(this.numero(a, linea), this.numero(b, linea)));
      case '^': return envolver(Math.pow(this.numero(a, linea), this.numero(b, linea)));
      case '..':
        if (a === null || b === null || typeof a === 'boolean' || typeof b === 'boolean') {
          this.error(`attempt to concatenate a ${this.tipoDe(a === null || typeof a === 'boolean' ? a : b)} value`, linea);
        }
        return this.texto(a) + this.texto(b);
      case '==': return this.iguales(a, b);
      case '!=': case '~=': return !this.iguales(a, b);
      case '<': case '<=': case '>': case '>=': {
        if (typeof a === 'string' && typeof b === 'string') {
          const c = a < b ? -1 : a > b ? 1 : 0;
          return op === '<' ? c < 0 : op === '<=' ? c <= 0 : op === '>' ? c > 0 : c >= 0;
        }
        if (typeof a !== 'number' || typeof b !== 'number') {
          this.error(this.py
            ? `TypeError: '${op}' not supported between instances of '${this.tipoDe(a)}' and '${this.tipoDe(b)}'`
            : `attempt to compare ${this.tipoDe(a)} with ${this.tipoDe(b)}`, linea);
        }
        return op === '<' ? a < b : op === '<=' ? a <= b : op === '>' ? a > b : a >= b;
      }
      case 'in': {
        if (typeof b === 'string') return typeof a === 'string' && b.includes(a);
        if (Array.isArray(b)) return b.some((x) => this.iguales(x, a));
        if (b instanceof Tabla) return b.has(a);
        this.error(`TypeError: argument of type '${this.tipoDe(b)}' is not iterable`, linea);
        return false;
      }
      default:
        this.error(`operador no soportado: ${op}`, linea);
        return null;
    }
  }

  iguales(izquierdo, derecho) {
    const a = crudo(izquierdo);
    const b = crudo(derecho);
    if (a === null || b === null) return a === b;
    if (typeof a === 'number' && typeof b === 'number') return a === b;
    if (typeof a !== typeof b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      return this.py && a.length === b.length && a.every((x, i) => this.iguales(x, b[i]));
    }
    if (a instanceof Tabla && b instanceof Tabla) {
      if (!this.py) return a === b;   // Lua compara tablas por identidad
      if (a.tamaño !== b.tamaño) return false;
      return a.pares().every(([k, v]) => b.has(k) && this.iguales(b.get(k), v));
    }
    return a === b;
  }

  // Mini especificación de formato de las f-strings: [alineación][ancho][.precisión][tipo]
  // Cubre lo que se usa al enseñar («{importe:.2f}», «{nombre:<10}», «{n:>3}»).
  formatear(valor, formato) {
    if (!formato) return this.texto(valor);
    const m = /^(?:([<>^])?(\d+))?(?:\.(\d+))?([dfs]?)$/.exec(formato);
    if (!m) return this.texto(valor);
    const [, alineacion, ancho, precision, tipo] = m;
    const n = crudo(valor);
    let s;
    if (precision !== undefined && typeof n === 'number') s = n.toFixed(Number(precision));
    else if (tipo === 'd' && typeof n === 'number') s = String(Math.trunc(n));
    else if (tipo === 'f' && typeof n === 'number') s = n.toFixed(6);
    else s = this.texto(valor);
    if (!ancho) return s;
    const w = Number(ancho);
    if (s.length >= w) return s;
    const hueco = w - s.length;
    // Por defecto, los números se alinean a la derecha y el texto a la izquierda.
    const modo = alineacion || (typeof n === 'number' ? '>' : '<');
    if (modo === '>') return ' '.repeat(hueco) + s;
    if (modo === '<') return s + ' '.repeat(hueco);
    const izq = Math.floor(hueco / 2);
    return ' '.repeat(izq) + s + ' '.repeat(hueco - izq);
  }

  // --- llamadas ---------------------------------------------------------

  llamar(nodo, entorno) {
    const fn = this.evaluar(nodo.fn, entorno);
    const args = [];
    const nombrados = {};
    if (nodo.self) args.push(this.evaluar(nodo.self, entorno));
    for (const a of nodo.args) {
      if (a.tipo === 'argNombrado') nombrados[a.nombre] = this.evaluar(a.valor, entorno);
      else args.push(this.evaluar(a, entorno));
    }
    return this.invocar(fn, args, nombrados, nodo.linea, nodo.fn);
  }

  invocar(fn, args, nombrados, linea, nodoFn) {
    if (fn instanceof Nativa) return fn.fn(args, nombrados, linea);
    if (fn instanceof Funcion) {
      const entorno = new Entorno(fn.entorno);
      fn.params.forEach((p, i) => {
        if (p === '...') return;
        let valor = args[i];
        if (valor === undefined) valor = fn.defectos && fn.defectos[i] ? this.evaluar(fn.defectos[i], fn.entorno) : null;
        if (nombrados && nombrados[p] !== undefined) valor = nombrados[p];
        entorno.definir(p, valor);
      });
      if (this.py) {
        const faltan = fn.params.filter((p, i) => args[i] === undefined && !(nombrados && nombrados[p] !== undefined) && !(fn.defectos && fn.defectos[i]));
        if (faltan.length) {
          this.error(`TypeError: ${fn.nombre}() missing ${faltan.length} required positional argument${faltan.length > 1 ? 's' : ''}: ${faltan.map((p) => `'${p}'`).join(', ')}`, linea);
        }
      }
      const señal = this.bloque(fn.cuerpo, entorno);
      if (señal && señal.tipo === SEÑAL_RETORNO) return señal.valor;
      return null;
    }
    const nombre = nodoFn && nodoFn.nombre ? nodoFn.nombre : nodoFn && nodoFn.clave ? nodoFn.clave.valor : '?';
    this.error(this.py
      ? `TypeError: '${this.tipoDe(fn)}' object is not callable`
      : `attempt to call a ${this.tipoDe(fn)} value${nombre !== '?' ? ` (global '${nombre}')` : ''}`, linea);
    return null;
  }

  nativa(nombre, fn) {
    return new Nativa(nombre, fn);
  }

  // --- métodos de los tipos ---------------------------------------------

  metodoCadena(s, clave) {
    if (typeof clave !== 'string') return null;
    const n = (nombre, fn) => this.nativa(nombre, fn);
    if (this.py) {
      switch (clave) {
        case 'upper': return n('upper', () => s.toUpperCase());
        case 'lower': return n('lower', () => s.toLowerCase());
        case 'strip': return n('strip', (a) => a[0] ? s.replace(new RegExp(`^[${a[0]}]+|[${a[0]}]+$`, 'g'), '') : s.trim());
        case 'lstrip': return n('lstrip', () => s.replace(/^\s+/, ''));
        case 'rstrip': return n('rstrip', () => s.replace(/\s+$/, ''));
        case 'split': return n('split', (a) => (a[0] == null ? s.trim().split(/\s+/).filter(Boolean) : s.split(a[0])));
        case 'join': return n('join', (a) => (Array.isArray(a[0]) ? a[0] : [...this.iterar(a[0], 0)]).map((x) => this.texto(x)).join(s));
        case 'replace': return n('replace', (a) => s.split(a[0]).join(a[1]));
        case 'startswith': return n('startswith', (a) => s.startsWith(a[0]));
        case 'endswith': return n('endswith', (a) => s.endsWith(a[0]));
        case 'find': return n('find', (a) => s.indexOf(a[0]));
        case 'count': return n('count', (a) => (a[0] === '' ? s.length + 1 : s.split(a[0]).length - 1));
        case 'title': return n('title', () => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()));
        case 'capitalize': return n('capitalize', () => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s));
        case 'isdigit': return n('isdigit', () => s.length > 0 && /^\d+$/.test(s));
        case 'isalpha': return n('isalpha', () => s.length > 0 && /^[A-Za-zÀ-ÿ]+$/.test(s));
        case 'format': return n('format', (a) => {
          let i = 0;
          return s.replace(/\{(\d*)\}/g, (_, d) => this.texto(a[d === '' ? i++ : Number(d)]));
        });
        case 'zfill': return n('zfill', (a) => s.padStart(a[0], '0'));
        case 'splitlines': return n('splitlines', () => s.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === '')));
        default: return null;
      }
    }
    // En Lua los métodos de cadena viven en `string`, y s:upper() los alcanza.
    const stringLib = this.global.get('string');
    if (stringLib && stringLib.has(clave)) {
      const fn = stringLib.get(clave);
      return this.nativa(clave, (a, nom, linea) => this.invocar(fn, a[0] === s ? a : [s, ...a], nom, linea));
    }
    return null;
  }

  metodoLista(lista, clave) {
    if (typeof clave !== 'string') return null;
    const n = (nombre, fn) => this.nativa(nombre, fn);
    switch (clave) {
      case 'append': return n('append', (a) => { lista.push(a[0] === undefined ? null : a[0]); return null; });
      case 'extend': return n('extend', (a) => { lista.push(...(Array.isArray(a[0]) ? a[0] : [])); return null; });
      case 'insert': return n('insert', (a) => { lista.splice(a[0], 0, a[1]); return null; });
      case 'pop': return n('pop', (a) => (a.length ? lista.splice(this.indiceLista(lista, a[0], 0), 1)[0] : lista.pop() ?? null));
      case 'remove': return n('remove', (a) => {
        const i = lista.findIndex((x) => this.iguales(x, a[0]));
        if (i < 0) this.error('ValueError: list.remove(x): x not in list', 0);
        lista.splice(i, 1);
        return null;
      });
      case 'sort': return n('sort', (a, nom) => {
        const inverso = nom && this.verdad(nom.reverse);
        lista.sort((x, y) => (typeof x === 'string' ? (x < y ? -1 : x > y ? 1 : 0) : crudo(x) - crudo(y)));
        if (inverso) lista.reverse();
        return null;
      });
      case 'reverse': return n('reverse', () => { lista.reverse(); return null; });
      case 'index': return n('index', (a) => {
        const i = lista.findIndex((x) => this.iguales(x, a[0]));
        if (i < 0) this.error(`ValueError: ${this.texto(a[0], true)} is not in list`, 0);
        return i;
      });
      case 'count': return n('count', (a) => lista.filter((x) => this.iguales(x, a[0])).length);
      case 'clear': return n('clear', () => { lista.length = 0; return null; });
      default: return null;
    }
  }

  metodoTabla(tabla, clave) {
    if (!this.py || typeof clave !== 'string' || tabla.esModulo) return null;
    const n = (nombre, fn) => this.nativa(nombre, fn);
    switch (clave) {
      case 'keys': return n('keys', () => tabla.claves());
      case 'values': return n('values', () => tabla.valores());
      case 'items': return n('items', () => tabla.pares().map((p) => Object.assign([...p], { esPar: false })));
      case 'get': return n('get', (a) => (tabla.has(a[0]) ? tabla.get(a[0]) : (a[1] === undefined ? null : a[1])));
      case 'pop': return n('pop', (a) => { const v = tabla.get(a[0]); tabla.borrar(a[0]); return v; });
      case 'update': return n('update', (a) => { if (a[0] instanceof Tabla) for (const [k, v] of a[0].pares()) tabla.set(k, v); return null; });
      default: return null;
    }
  }

  modulo(nombre, linea) {
    const m = this.global.get('__modulos__').get(nombre);
    if (!m) this.error(`ModuleNotFoundError: No module named '${nombre}'`, linea);
    return m;
  }

  // --- biblioteca estándar ----------------------------------------------

  instalarBiblioteca() {
    const g = this.global;
    const n = (nombre, fn) => this.nativa(nombre, fn);
    const num = (v, linea) => this.numero(v, linea);

    if (this.py) {
      g.definir('print', n('print', (args, nom) => {
        const sep = nom && nom.sep !== undefined ? this.texto(nom.sep) : ' ';
        const fin = nom && nom.end !== undefined ? this.texto(nom.end) : '\n';
        this.escribir(args.map((a) => this.texto(a)).join(sep) + fin);
        return null;
      }));
      g.definir('len', n('len', (a, nom, linea) => {
        const v = a[0];
        if (typeof v === 'string') return v.length;
        if (Array.isArray(v)) return v.length;
        if (v instanceof Tabla) return v.tamaño;
        this.error(`TypeError: object of type '${this.tipoDe(v)}' has no len()`, linea);
        return 0;
      }));
      g.definir('range', n('range', (a) => {
        const [x, y, z] = a.map((v) => (typeof crudo(v) === 'number' ? Math.trunc(crudo(v)) : crudo(v)));
        const desde = y === undefined ? 0 : x;
        const hasta = y === undefined ? x : y;
        const paso = z === undefined ? 1 : z;
        const salida = [];
        if (paso > 0) for (let i = desde; i < hasta; i += paso) salida.push(i);
        else for (let i = desde; i > hasta; i += paso) salida.push(i);
        return salida;
      }));
      g.definir('int', n('int', (a, nom, linea) => {
        const v = crudo(a[0]);
        if (typeof v === 'number') return Math.trunc(v);
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (typeof v === 'string') {
          const limpio = v.trim();
          if (!/^[+-]?\d+$/.test(limpio)) this.error(`ValueError: invalid literal for int() with base 10: '${v}'`, linea);
          return parseInt(limpio, 10);
        }
        this.error(`TypeError: int() argument must be a string or a number, not '${this.tipoDe(v)}'`, linea);
        return 0;
      }));
      g.definir('float', n('float', (a, nom, linea) => {
        const v = crudo(a[0]);
        if (typeof v === 'number') return flota(v);
        const x = Number(String(v).trim());
        if (Number.isNaN(x)) this.error(`ValueError: could not convert string to float: '${v}'`, linea);
        return flota(x);
      }));
      g.definir('str', n('str', (a) => this.texto(a[0] === undefined ? '' : a[0])));
      g.definir('bool', n('bool', (a) => this.verdad(a[0])));
      g.definir('list', n('list', (a) => (a[0] === undefined ? [] : [...this.iterar(a[0], 0)])));
      g.definir('dict', n('dict', () => new Tabla()));
      g.definir('sum', n('sum', (a, nom, linea) => {
        const items = [...this.iterar(a[0], linea)];
        const total = items.reduce((s, x) => s + num(x, linea), crudo(a[1]) || 0);
        return items.some((x) => x instanceof Flotante) ? flota(total) : total;
      }));
      g.definir('min', n('min', (a, nom, linea) => {
        const items = a.length === 1 ? [...this.iterar(a[0], linea)] : a;
        return items.reduce((m, x) => (this.binaria('<', x, m, linea) ? x : m));
      }));
      g.definir('max', n('max', (a, nom, linea) => {
        const items = a.length === 1 ? [...this.iterar(a[0], linea)] : a;
        return items.reduce((m, x) => (this.binaria('>', x, m, linea) ? x : m));
      }));
      g.definir('abs', n('abs', (a, nom, linea) => Math.abs(num(a[0], linea))));
      g.definir('round', n('round', (a, nom, linea) => {
        const d = a[1] === undefined ? 0 : Math.trunc(crudo(a[1]));
        const f = Math.pow(10, d);
        const r = Math.round(num(a[0], linea) * f) / f;
        return a[0] instanceof Flotante && d > 0 ? flota(r) : r;
      }));
      g.definir('sorted', n('sorted', (a, nom, linea) => {
        const items = [...this.iterar(a[0], linea)];
        items.sort((x, y) => (typeof x === 'string' ? (x < y ? -1 : x > y ? 1 : 0) : num(x, linea) - num(y, linea)));
        if (nom && this.verdad(nom.reverse)) items.reverse();
        return items;
      }));
      g.definir('reversed', n('reversed', (a, nom, linea) => [...this.iterar(a[0], linea)].reverse()));
      g.definir('enumerate', n('enumerate', (a, nom, linea) => {
        const inicio = a[1] === undefined ? 0 : a[1];
        return [...this.iterar(a[0], linea)].map((x, i) => [i + inicio, x]);
      }));
      g.definir('zip', n('zip', (a, nom, linea) => {
        const listas = a.map((x) => [...this.iterar(x, linea)]);
        const largo = Math.min(...listas.map((l) => l.length));
        return Array.from({ length: largo }, (_, i) => listas.map((l) => l[i]));
      }));
      g.definir('type', n('type', (a) => this.tipoDe(a[0])));
      g.definir('input', n('input', (a) => {
        // Sin teclado interactivo: se anuncia y se devuelve cadena vacía.
        if (a[0] !== undefined) this.escribir(this.texto(a[0]));
        return '';
      }));
      g.definir('open', n('open', (a, nom, linea) => this.abrirArchivo(a[0], a[1] || 'r', linea)));

      const sys = new Tabla();
      sys.esModulo = true;
      sys.set('argv', this.argv.slice());
      sys.set('exit', n('exit', (a) => { this.codigoSalida = a[0] === undefined ? 0 : Math.trunc(a[0]); throw { salida: true }; }));
      const os = new Tabla();
      os.esModulo = true;
      os.set('getcwd', n('getcwd', () => (this.io ? this.io.cwd() : '/home/user')));
      const math = new Tabla();
      math.esModulo = true;
      math.set('pi', Math.PI);
      math.set('sqrt', n('sqrt', (a, nom, linea) => Math.sqrt(num(a[0], linea))));
      math.set('floor', n('floor', (a, nom, linea) => Math.floor(num(a[0], linea))));
      math.set('ceil', n('ceil', (a, nom, linea) => Math.ceil(num(a[0], linea))));
      const modulos = new Tabla();
      modulos.esModulo = true;
      modulos.set('sys', sys);
      modulos.set('os', os);
      modulos.set('math', math);
      g.definir('__modulos__', modulos);
      return;
    }

    // --- Lua ------------------------------------------------------------
    g.definir('print', n('print', (args) => {
      this.escribir(args.map((a) => this.texto(a)).join('\t') + '\n');
      return null;
    }));
    g.definir('tostring', n('tostring', (a) => this.texto(a[0])));
    g.definir('tonumber', n('tonumber', (a) => {
      if (typeof crudo(a[0]) === 'number') return a[0];
      if (typeof a[0] !== 'string') return null;
      const base = crudo(a[1]);
      const x = base ? parseInt(a[0].trim(), base) : Number(a[0].trim());
      return Number.isNaN(x) || a[0].trim() === '' ? null : x;
    }));
    g.definir('type', n('type', (a) => this.tipoDe(a[0])));
    g.definir('ipairs', n('ipairs', (a, nom, linea) => {
      const t = a[0];
      if (!(t instanceof Tabla)) this.error(`bad argument #1 to 'ipairs' (table expected, got ${this.tipoDe(t)})`, linea);
      const pares = [];
      for (let i = 1; t.has(i); i++) pares.push([i, t.get(i)]);
      const salida = new Tabla();
      salida.iterador = () => pares;
      return salida;
    }));
    g.definir('pairs', n('pairs', (a, nom, linea) => {
      const t = a[0];
      if (!(t instanceof Tabla)) this.error(`bad argument #1 to 'pairs' (table expected, got ${this.tipoDe(t)})`, linea);
      const pares = t.pares();
      const salida = new Tabla();
      salida.iterador = () => pares;
      return salida;
    }));
    g.definir('error', n('error', (a, nom, linea) => {
      this.error(typeof a[0] === 'string' ? a[0] : this.texto(a[0]), linea);
      return null;
    }));
    g.definir('assert', n('assert', (a, nom, linea) => {
      if (!this.verdad(a[0])) this.error(a[1] ? this.texto(a[1]) : 'assertion failed!', linea);
      return a[0];
    }));
    g.definir('select', n('select', (a) => (a[0] === '#' ? a.length - 1 : a[Math.trunc(crudo(a[0]))])));

    const string = new Tabla();
    string.esModulo = true;
    string.set('upper', n('upper', (a) => this.texto(a[0]).toUpperCase()));
    string.set('lower', n('lower', (a) => this.texto(a[0]).toLowerCase()));
    string.set('len', n('len', (a) => this.texto(a[0]).length));
    string.set('rep', n('rep', (a) => this.texto(a[0]).repeat(Math.max(0, Math.trunc(crudo(a[1]) || 0)))));
    string.set('reverse', n('reverse', (a) => [...this.texto(a[0])].reverse().join('')));
    string.set('sub', n('sub', (a) => {
      const s = this.texto(a[0]);
      let i = a[1] === undefined ? 1 : Math.trunc(crudo(a[1]));
      let j = a[2] === undefined ? s.length : Math.trunc(crudo(a[2]));
      if (i < 0) i = Math.max(s.length + i + 1, 1);
      if (i === 0) i = 1;
      if (j < 0) j = s.length + j + 1;
      return s.slice(i - 1, j);
    }));
    string.set('find', n('find', (a) => {
      const s = this.texto(a[0]);
      const i = s.indexOf(this.texto(a[1]), Math.max(0, (crudo(a[2]) || 1) - 1));
      return i < 0 ? null : i + 1;
    }));
    string.set('format', n('format', (a, nom, linea) => this.formatoLua(this.texto(a[0]), a.slice(1), linea)));
    string.set('gsub', n('gsub', (a) => {
      const s = this.texto(a[0]);
      const patron = this.texto(a[1]);
      const reemplazo = this.texto(a[2]);
      return s.split(patron).join(reemplazo);
    }));
    g.definir('string', string);

    const table = new Tabla();
    table.esModulo = true;
    table.set('insert', n('insert', (a, nom, linea) => {
      const t = a[0];
      if (!(t instanceof Tabla)) this.error(`bad argument #1 to 'insert' (table expected, got ${this.tipoDe(t)})`, linea);
      if (a.length >= 3) {
        const pos = Math.trunc(crudo(a[1]));
        const largo = t.longitudSecuencia();
        for (let i = largo; i >= pos; i--) t.set(i + 1, t.get(i));
        t.set(pos, a[2]);
      } else {
        t.set(t.longitudSecuencia() + 1, a[1]);
      }
      return null;
    }));
    table.set('remove', n('remove', (a) => {
      const t = a[0];
      const largo = t.longitudSecuencia();
      const pos = a[1] === undefined ? largo : Math.trunc(crudo(a[1]));
      const v = t.get(pos);
      for (let i = pos; i < largo; i++) t.set(i, t.get(i + 1));
      t.borrar(largo);
      return v === undefined ? null : v;
    }));
    table.set('concat', n('concat', (a) => {
      const t = a[0];
      const sep = a[1] === undefined ? '' : this.texto(a[1]);
      const salida = [];
      for (let i = 1; t.has(i); i++) salida.push(this.texto(t.get(i)));
      return salida.join(sep);
    }));
    table.set('sort', n('sort', (a, nom, linea) => {
      const t = a[0];
      const cmp = a[1];
      const items = [];
      for (let i = 1; t.has(i); i++) items.push(t.get(i));
      items.sort((x, y) => {
        if (cmp) return this.verdad(this.invocar(cmp, [x, y], {}, linea)) ? -1 : this.verdad(this.invocar(cmp, [y, x], {}, linea)) ? 1 : 0;
        if (typeof x === 'string') return x < y ? -1 : x > y ? 1 : 0;
        return crudo(x) - crudo(y);
      });
      items.forEach((v, i) => t.set(i + 1, v));
      return null;
    }));
    g.definir('table', table);

    const math = new Tabla();
    math.esModulo = true;
    math.set('pi', Math.PI);
    math.set('huge', Infinity);
    math.set('floor', n('floor', (a, nom, linea) => Math.floor(num(a[0], linea))));
    math.set('ceil', n('ceil', (a, nom, linea) => Math.ceil(num(a[0], linea))));
    math.set('abs', n('abs', (a, nom, linea) => Math.abs(num(a[0], linea))));
    math.set('max', n('max', (a, nom, linea) => Math.max(...a.map((x) => num(x, linea)))));
    math.set('min', n('min', (a, nom, linea) => Math.min(...a.map((x) => num(x, linea)))));
    math.set('sqrt', n('sqrt', (a, nom, linea) => Math.sqrt(num(a[0], linea))));
    math.set('fmod', n('fmod', (a, nom, linea) => num(a[0], linea) % num(a[1], linea)));
    g.definir('math', math);

    const io = new Tabla();
    io.esModulo = true;
    io.set('write', n('write', (a) => { this.escribir(a.map((x) => this.texto(x)).join('')); return null; }));
    io.set('read', n('read', () => null));
    io.set('open', n('open', (a, nom, linea) => this.abrirArchivo(a[0], a[1] || 'r', linea, true)));
    g.definir('io', io);

    const os = new Tabla();
    os.esModulo = true;
    os.set('time', n('time', () => 1768470660));
    os.set('date', n('date', () => '2026-01-15'));
    os.set('getenv', n('getenv', (a) => (this.io ? this.io.env(this.texto(a[0])) : null)));
    g.definir('os', os);

    // `arg` con los parámetros de la línea de órdenes, como el intérprete real.
    const arg = new Tabla();
    this.argv.slice(1).forEach((v, i) => arg.set(i + 1, v));
    arg.set(0, this.argv[0] || 'script.lua');
    g.definir('arg', arg);
  }

  formatoLua(plantilla, args, linea) {
    let i = 0;
    return plantilla.replace(/%([-+ #0]*)(\d*)(?:\.(\d+))?([sdifq%])/g, (todo, banderas, ancho, precision, conv) => {
      if (conv === '%') return '%';
      const v = args[i++];
      let s;
      if (conv === 'd' || conv === 'i') s = String(Math.trunc(this.numero(v, linea)));
      else if (conv === 'f') s = this.numero(v, linea).toFixed(precision === undefined ? 6 : Number(precision));
      else if (conv === 'q') s = `"${this.texto(v)}"`;
      else s = this.texto(v);
      if (ancho) {
        const w = Number(ancho);
        if (s.length < w) s = banderas.includes('-') ? s + ' '.repeat(w - s.length) : (banderas.includes('0') && conv !== 's' ? s.padStart(w, '0') : ' '.repeat(w - s.length) + s);
      }
      return s;
    });
  }

  // Archivos: solo lo que ofrece el filesystem simulado inyectado.
  abrirArchivo(ruta, modo, linea, lua = false) {
    if (!this.io) this.error(this.py ? 'OSError: sin acceso al filesystem' : 'sin acceso al filesystem', linea);
    const camino = this.texto(ruta);
    if (modo.startsWith('r')) {
      const contenido = this.io.leer(camino);
      if (contenido == null) {
        if (lua) return null;
        this.error(`FileNotFoundError: [Errno 2] No such file or directory: '${camino}'`, linea);
      }
      const t = new Tabla();
      t.esModulo = true;
      // `f:read()` de Lua pasa el propio archivo como primer argumento;
      // `f.read()` de Python no. Se descarta para tratarlos igual.
      const props = (a) => (a[0] === t ? a.slice(1) : a);
      t.set('read', this.nativa('read', (a) => {
        const modo = props(a)[0];
        if (lua && (modo === 'l' || modo === '*l')) return contenido.split('\n')[0];
        return contenido;
      }));
      t.set('readlines', this.nativa('readlines', () => contenido.split('\n').filter((l, i, arr) => !(i === arr.length - 1 && l === '')).map((l) => l + '\n')));
      t.set('close', this.nativa('close', () => null));
      t.set('lines', this.nativa('lines', () => {
        const salida = new Tabla();
        salida.iterador = () => contenido.split('\n').filter((l) => l !== '');
        return salida;
      }));
      return t;
    }
    // Escritura: se acumula y se vuelca al cerrar o al terminar el script.
    const buffer = { texto: modo.startsWith('a') ? (this.io.leer(camino) || '') : '' };
    const volcar = () => this.io.escribir(camino, buffer.texto);
    const t = new Tabla();
    t.esModulo = true;
    const props = (a) => (a[0] === t ? a.slice(1) : a);
    t.set('write', this.nativa('write', (a) => {
      buffer.texto += props(a).map((x) => this.texto(x)).join('');
      volcar();
      return null;
    }));
    t.set('close', this.nativa('close', () => { volcar(); return null; }));
    volcar();
    return t;
  }
}

// --- API pública -------------------------------------------------------

// Ejecuta `fuente` y devuelve { salida, error, codigo }. Nunca lanza:
// los errores del alumno son parte del aprendizaje, no una excepción de la app.
export function ejecutarScript(lang, fuente, { io = null, argv = [], nombre = '' } = {}) {
  const interprete = new Interprete(lang, { io, argv });
  try {
    // La línea `#!` es para el kernel, no para el intérprete: se ignora
    // dejando un hueco en blanco para no descuadrar los números de línea.
    const codigo = fuente.startsWith('#!') ? fuente.replace(/^[^\n]*/, '') : fuente;
    interprete.ejecutar(codigo);
    return { salida: interprete.salida, error: '', codigo: interprete.codigoSalida || 0 };
  } catch (e) {
    if (e && e.salida) return { salida: interprete.salida, error: '', codigo: interprete.codigoSalida || 0 };
    if (e instanceof ErrorScript) {
      const etiqueta = nombre || (lang === 'py' ? 'script.py' : 'script.lua');
      const donde = e.linea ? `${etiqueta}:${e.linea}: ` : `${etiqueta}: `;
      const texto = lang === 'py'
        ? `Traceback (most recent call last):\n  File "${etiqueta}", line ${e.linea || 1}\n${e.message}\n`
        : `lua: ${donde}${e.message}\n`;
      return { salida: interprete.salida, error: texto, codigo: 1 };
    }
    const msg = e && e.message ? e.message : String(e);
    return { salida: interprete.salida, error: `${lang === 'py' ? 'python3' : 'lua'}: error interno: ${msg}\n`, codigo: 1 };
  }
}
