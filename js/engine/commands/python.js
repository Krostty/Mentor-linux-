// Intérprete educativo de Python para el laboratorio offline.
// Implementa un subconjunto deliberado del lenguaje sin eval/Function y conecta
// archivos, HTTP y sockets únicamente con el mundo virtual de Mentor Linux.

import { ok, err } from './util.js';

const MAX_STEPS = 5000;
const MAX_LOOP = 1000;

class PyError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
  }
}

class Scope {
  constructor(parent = null) {
    this.parent = parent;
    this.values = new Map();
  }

  has(name) {
    return this.values.has(name) || !!this.parent?.has(name);
  }

  get(name) {
    if (this.values.has(name)) return this.values.get(name);
    if (this.parent) return this.parent.get(name);
    throw new PyError('NameError', `name '${name}' is not defined`);
  }

  set(name, value) {
    this.values.set(name, value);
  }
}

const callable = (fn) => ({ __pyCallable: fn });
const moduleObject = (name, values) => ({ __pyModule: name, ...values });

function pyType(value) {
  if (value === null) return 'NoneType';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  if (typeof value === 'string') return 'str';
  if (Array.isArray(value)) return 'list';
  if (value?.__pyFile) return 'TextIOWrapper';
  if (value?.__pyPath) return 'Path';
  if (value?.__pyResponse) return 'Response';
  if (value?.__pySocket) return 'socket';
  if (value?.__pyMatch) return 'Match';
  if (value?.__pyCallable || value?.__pyFunction) return 'function';
  return 'dict';
}

function pyRepr(value) {
  if (value === null) return 'None';
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (Array.isArray(value)) return `[${value.map(pyRepr).join(', ')}]`;
  if (typeof value === 'object' && !value.__pyModule && !value.__pyCallable) {
    return `{${Object.entries(value).filter(([k]) => !k.startsWith('__py')).map(([k, v]) => `${pyRepr(k)}: ${pyRepr(v)}`).join(', ')}}`;
  }
  return String(value);
}

function pyStr(value) {
  return typeof value === 'string' ? value : pyRepr(value);
}

function truthy(value) {
  if (value == null || value === false || value === 0 || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object' && !value.__pyCallable && !value.__pyFunction) {
    return Object.keys(value).some((key) => !key.startsWith('__py'));
  }
  return true;
}

function iterable(value) {
  if (value == null) throw new PyError('TypeError', `'${pyType(value)}' object is not iterable`);
  if (typeof value === 'string' || Array.isArray(value)) return [...value];
  if (value.__pyFile) return value.__pyReadlines();
  if (typeof value === 'object') return Object.keys(value).filter((key) => !key.startsWith('__py'));
  throw new PyError('TypeError', `'${pyType(value)}' object is not iterable`);
}

function number(value, kind = 'int') {
  const parsed = kind === 'float' ? Number.parseFloat(value) : Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) throw new PyError('ValueError', `invalid literal for ${kind}(): ${pyRepr(value)}`);
  return parsed;
}

function decodeString(raw, isRaw) {
  if (isRaw) return raw;
  return raw.replace(/\\(n|r|t|\\|'|"|x[0-9a-fA-F]{2})/g, (_, escape) => {
    if (escape === 'n') return '\n';
    if (escape === 'r') return '\r';
    if (escape === 't') return '\t';
    if (escape.startsWith('x')) return String.fromCharCode(Number.parseInt(escape.slice(1), 16));
    return escape;
  });
}

function tokenizeExpression(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '#') break;
    if ((c === 'r' || c === 'f') && (source[i + 1] === "'" || source[i + 1] === '"')) {
      const prefix = c;
      i++;
      const quote = source[i++];
      let raw = '';
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\' && i + 1 < source.length) raw += source[i++] + source[i++];
        else raw += source[i++];
      }
      if (source[i] !== quote) throw new PyError('SyntaxError', 'unterminated string literal');
      i++;
      tokens.push({ type: prefix === 'f' ? 'fstring' : 'string', value: decodeString(raw, prefix === 'r') });
      continue;
    }
    if (c === "'" || c === '"') {
      const quote = c;
      i++;
      let raw = '';
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\' && i + 1 < source.length) raw += source[i++] + source[i++];
        else raw += source[i++];
      }
      if (source[i] !== quote) throw new PyError('SyntaxError', 'unterminated string literal');
      i++;
      tokens.push({ type: 'string', value: decodeString(raw, false) });
      continue;
    }
    const numberMatch = source.slice(i).match(/^\d+(?:\.\d+)?/);
    if (numberMatch) {
      tokens.push({ type: 'number', value: Number(numberMatch[0]) });
      i += numberMatch[0].length;
      continue;
    }
    const nameMatch = source.slice(i).match(/^[A-Za-z_]\w*/);
    if (nameMatch) {
      tokens.push({ type: 'name', value: nameMatch[0] });
      i += nameMatch[0].length;
      continue;
    }
    const op = ['**', '//', '==', '!=', '<=', '>=', ':='].find((candidate) => source.startsWith(candidate, i));
    if (op) {
      tokens.push({ type: 'op', value: op });
      i += op.length;
      continue;
    }
    if ('+-*/%<>()[]{}.,:='.includes(c)) {
      tokens.push({ type: 'op', value: c });
      i++;
      continue;
    }
    throw new PyError('SyntaxError', `invalid character '${c}'`);
  }
  tokens.push({ type: 'eof', value: '' });
  return tokens;
}

function getItem(value, key) {
  if (value == null) throw new PyError('TypeError', `'${pyType(value)}' object is not subscriptable`);
  if (typeof key === 'object' && key?.__pySlice) {
    const start = key.start == null ? 0 : Number(key.start);
    const end = key.end == null ? value.length : Number(key.end);
    return value.slice(start, end);
  }
  const normalized = Array.isArray(value) || typeof value === 'string'
    ? (Number(key) < 0 ? value.length + Number(key) : Number(key))
    : key;
  const exists = Array.isArray(value) || typeof value === 'string'
    ? normalized in value
    : Object.hasOwn(value, normalized);
  if (!exists) throw new PyError(Array.isArray(value) ? 'IndexError' : 'KeyError', pyRepr(key));
  return value[normalized];
}

function getAttr(value, name) {
  if (value == null) throw new PyError('AttributeError', `'${pyType(value)}' object has no attribute '${name}'`);
  if (name.startsWith('__')) throw new PyError('AttributeError', `access to '${name}' is disabled in the Mentor runtime`);
  if (value.__pyModule && name in value) return value[name];
  if (value.__pyResponse && name in value) return value[name];
  if (value.__pySocket && name in value) return value[name];
  if (value.__pyFile && name in value) return value[name];
  if (value.__pyPath && name in value) return value[name];
  if (value.__pyMatch && name in value) return value[name];

  if (typeof value === 'string') {
    const methods = {
      upper: () => value.toUpperCase(), lower: () => value.toLowerCase(),
      strip: () => value.trim(), lstrip: () => value.trimStart(), rstrip: () => value.trimEnd(),
      split: (args) => args[0] == null ? value.trim().split(/\s+/) : value.split(String(args[0])),
      splitlines: () => value.split(/\r?\n/),
      replace: (args) => value.split(String(args[0])).join(String(args[1] ?? '')),
      startswith: (args) => value.startsWith(String(args[0])),
      endswith: (args) => value.endsWith(String(args[0])),
      isdigit: () => /^\d+$/.test(value),
      join: (args) => iterable(args[0]).map(pyStr).join(value),
    };
    if (methods[name]) return callable((args) => methods[name](args));
  }

  if (Array.isArray(value)) {
    const methods = {
      append: (args) => { value.push(args[0]); return null; },
      extend: (args) => { value.push(...iterable(args[0])); return null; },
      pop: (args) => value.splice(args[0] == null ? value.length - 1 : Number(args[0]), 1)[0],
      count: (args) => value.filter((item) => item === args[0]).length,
      index: (args) => {
        const index = value.indexOf(args[0]);
        if (index < 0) throw new PyError('ValueError', `${pyRepr(args[0])} is not in list`);
        return index;
      },
      sort: () => { value.sort((a, b) => typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))); return null; },
    };
    if (methods[name]) return callable((args) => methods[name](args));
  }

  if (typeof value === 'object') {
    const cleanKeys = () => Object.keys(value).filter((key) => !key.startsWith('__py'));
    const methods = {
      get: (args) => Object.hasOwn(value, args[0]) ? value[args[0]] : (args[1] ?? null),
      keys: () => cleanKeys(), values: () => cleanKeys().map((key) => value[key]),
      items: () => cleanKeys().map((key) => [key, value[key]]),
      update: (args) => { Object.assign(value, args[0]); return null; },
    };
    if (methods[name]) return callable((args) => methods[name](args));
    if (name in value) return value[name];
  }
  throw new PyError('AttributeError', `'${pyType(value)}' object has no attribute '${name}'`);
}

function callValue(fn, args, kwargs) {
  if (fn?.__pyCallable) return fn.__pyCallable(args, kwargs);
  if (fn?.__pyFunction) return fn.call(args, kwargs);
  throw new PyError('TypeError', `'${pyType(fn)}' object is not callable`);
}

class ExpressionParser {
  constructor(source, scope, runtime) {
    this.tokens = tokenizeExpression(source);
    this.pos = 0;
    this.scope = scope;
    this.runtime = runtime;
  }

  peek(value = null, offset = 0) {
    const token = this.tokens[this.pos + offset];
    return value == null ? token : token?.value === value;
  }

  take(value = null) {
    const token = this.tokens[this.pos];
    if (value != null && token.value !== value) throw new PyError('SyntaxError', `expected '${value}'`);
    this.pos++;
    return token;
  }

  parse() {
    const value = this.parseOr();
    if (this.peek().type !== 'eof') throw new PyError('SyntaxError', `unexpected token '${this.peek().value}'`);
    return value;
  }

  parseOr() {
    let value = this.parseAnd();
    while (this.peek('or')) { this.take(); const right = this.parseAnd(); value = truthy(value) ? value : right; }
    return value;
  }

  parseAnd() {
    let value = this.parseNot();
    while (this.peek('and')) { this.take(); const right = this.parseNot(); value = truthy(value) ? right : value; }
    return value;
  }

  parseNot() {
    if (this.peek('not') && !this.peek('in', 1)) { this.take(); return !truthy(this.parseNot()); }
    return this.parseCompare();
  }

  parseCompare() {
    let left = this.parseAdd();
    while (true) {
      let op = this.peek().value;
      if (op === 'not' && this.peek('in', 1)) { this.take(); this.take(); op = 'not in'; }
      else if (op === 'is' && this.peek('not', 1)) { this.take(); this.take(); op = 'is not'; }
      else if (['==', '!=', '<', '<=', '>', '>=', 'in', 'is'].includes(op)) this.take();
      else break;
      const right = this.parseAdd();
      const contains = typeof right === 'string' || Array.isArray(right)
        ? right.includes(left)
        : right && typeof right === 'object' && Object.hasOwn(right, left);
      if (op === '==') left = left === right;
      else if (op === '!=') left = left !== right;
      else if (op === '<') left = left < right;
      else if (op === '<=') left = left <= right;
      else if (op === '>') left = left > right;
      else if (op === '>=') left = left >= right;
      else if (op === 'in') left = contains;
      else if (op === 'not in') left = !contains;
      else if (op === 'is') left = left === right;
      else if (op === 'is not') left = left !== right;
    }
    return left;
  }

  parseAdd() {
    let value = this.parseMul();
    while (this.peek('+') || this.peek('-')) {
      const op = this.take().value;
      const right = this.parseMul();
      if (op === '+') {
        if (Array.isArray(value) && Array.isArray(right)) value = [...value, ...right];
        else if (typeof value === 'string' && typeof right === 'string') value += right;
        else value = Number(value) + Number(right);
      } else value = Number(value) - Number(right);
    }
    return value;
  }

  parseMul() {
    let value = this.parsePower();
    while (['*', '/', '//', '%'].includes(this.peek().value)) {
      const op = this.take().value;
      const right = this.parsePower();
      if (op === '*' && typeof value === 'string' && Number.isInteger(right)) value = value.repeat(right);
      else if (op === '*' && Array.isArray(value) && Number.isInteger(right)) value = Array.from({ length: right }, () => value).flat();
      else if (op === '*') value = Number(value) * Number(right);
      else if (op === '/') value = Number(value) / Number(right);
      else if (op === '//') value = Math.floor(Number(value) / Number(right));
      else value = Number(value) % Number(right);
    }
    return value;
  }

  parsePower() {
    let value = this.parseUnary();
    if (this.peek('**')) { this.take(); value = Number(value) ** Number(this.parsePower()); }
    return value;
  }

  parseUnary() {
    if (this.peek('+')) { this.take(); return Number(this.parseUnary()); }
    if (this.peek('-')) { this.take(); return -Number(this.parseUnary()); }
    return this.parsePostfix();
  }

  parsePostfix() {
    let value = this.parseAtom();
    while (true) {
      if (this.peek('.')) {
        this.take();
        value = getAttr(value, this.take().value);
      } else if (this.peek('(')) {
        this.take();
        const args = [];
        const kwargs = {};
        while (!this.peek(')')) {
          if (this.peek().type === 'name' && this.peek('=', 1)) {
            const name = this.take().value;
            this.take('=');
            kwargs[name] = this.parseOr();
          } else args.push(this.parseOr());
          if (!this.peek(',')) break;
          this.take();
        }
        this.take(')');
        value = callValue(value, args, kwargs);
      } else if (this.peek('[')) {
        this.take();
        let key = null;
        if (!this.peek(':') && !this.peek(']')) key = this.parseOr();
        if (this.peek(':')) {
          this.take();
          const end = this.peek(']') ? null : this.parseOr();
          key = { __pySlice: true, start: key, end };
        }
        this.take(']');
        value = getItem(value, key);
      } else break;
    }
    return value;
  }

  parseAtom() {
    const token = this.take();
    if (token.type === 'number' || token.type === 'string') return token.value;
    if (token.type === 'fstring') {
      return token.value.replace(/\{([^{}]+)\}/g, (_, expression) => pyStr(evaluate(expression, this.scope, this.runtime)));
    }
    if (token.type === 'name') {
      if (token.value === 'True') return true;
      if (token.value === 'False') return false;
      if (token.value === 'None') return null;
      return this.scope.get(token.value);
    }
    if (token.value === '[') {
      const values = [];
      while (!this.peek(']')) {
        values.push(this.parseOr());
        if (!this.peek(',')) break;
        this.take();
      }
      this.take(']');
      return values;
    }
    if (token.value === '{') {
      const value = Object.create(null);
      while (!this.peek('}')) {
        const key = this.parseOr();
        this.take(':');
        value[String(key)] = this.parseOr();
        if (!this.peek(',')) break;
        this.take();
      }
      this.take('}');
      return value;
    }
    if (token.value === '(') {
      if (this.peek(')')) { this.take(); return []; }
      const first = this.parseOr();
      if (!this.peek(',')) { this.take(')'); return first; }
      const values = [first];
      while (this.peek(',')) {
        this.take();
        if (this.peek(')')) break;
        values.push(this.parseOr());
      }
      this.take(')');
      return values;
    }
    throw new PyError('SyntaxError', `unexpected token '${token.value}'`);
  }
}

function evaluate(source, scope, runtime) {
  return new ExpressionParser(source, scope, runtime).parse();
}

function stripComment(source) {
  let quote = null;
  let escaped = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (c === '#') return source.slice(0, i);
  }
  return source;
}

function splitSemicolons(source) {
  const pieces = [];
  let start = 0;
  let quote = null;
  let escaped = false;
  let depth = 0;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ';' && depth === 0) { pieces.push(source.slice(start, i)); start = i + 1; }
  }
  pieces.push(source.slice(start));
  return pieces;
}

function prepareLines(source) {
  const prepared = [];
  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const leading = raw.match(/^[ \t]*/)[0].replace(/\t/g, '    ');
    const body = stripComment(raw.slice(raw.match(/^[ \t]*/)[0].length)).trimEnd();
    if (!body.trim()) continue;
    for (const piece of splitSemicolons(body)) {
      if (piece.trim()) prepared.push({ indent: leading.length, text: piece.trim(), line: prepared.length + 1 });
    }
  }
  return prepared;
}

function parseProgram(source) {
  const lines = prepareLines(source);

  function childSuite(index, indent) {
    if (index >= lines.length || lines[index].indent <= indent) throw new PyError('IndentationError', 'expected an indented block');
    return parseSuite(index, lines[index].indent);
  }

  function parseSuite(start, indent) {
    const nodes = [];
    let index = start;
    while (index < lines.length) {
      const line = lines[index];
      if (line.indent < indent) break;
      if (line.indent > indent) throw new PyError('IndentationError', 'unexpected indent');
      const text = line.text;

      const ifMatch = text.match(/^if\s+(.+):$/);
      if (ifMatch) {
        const child = childSuite(index + 1, indent);
        const branches = [{ test: ifMatch[1], body: child.nodes }];
        index = child.index;
        let otherwise = [];
        while (index < lines.length && lines[index].indent === indent) {
          const elifMatch = lines[index].text.match(/^elif\s+(.+):$/);
          if (elifMatch) {
            const branch = childSuite(index + 1, indent);
            branches.push({ test: elifMatch[1], body: branch.nodes });
            index = branch.index;
            continue;
          }
          if (lines[index].text === 'else:') {
            const branch = childSuite(index + 1, indent);
            otherwise = branch.nodes;
            index = branch.index;
          }
          break;
        }
        nodes.push({ type: 'if', branches, otherwise, line: line.line });
        continue;
      }

      const forMatch = text.match(/^for\s+(.+?)\s+in\s+(.+):$/);
      if (forMatch) {
        const child = childSuite(index + 1, indent);
        nodes.push({ type: 'for', target: forMatch[1], expression: forMatch[2], body: child.nodes, line: line.line });
        index = child.index;
        continue;
      }

      const whileMatch = text.match(/^while\s+(.+):$/);
      if (whileMatch) {
        const child = childSuite(index + 1, indent);
        nodes.push({ type: 'while', expression: whileMatch[1], body: child.nodes, line: line.line });
        index = child.index;
        continue;
      }

      const defMatch = text.match(/^def\s+([A-Za-z_]\w*)\s*\((.*)\):$/);
      if (defMatch) {
        const child = childSuite(index + 1, indent);
        const params = defMatch[2].trim() ? splitTopLevel(defMatch[2], ',').map((part) => {
          const assignment = findAssignment(part);
          return assignment ? { name: part.slice(0, assignment.index).trim(), defaultExpr: part.slice(assignment.index + 1).trim() } : { name: part.trim(), defaultExpr: null };
        }) : [];
        nodes.push({ type: 'def', name: defMatch[1], params, body: child.nodes, line: line.line });
        index = child.index;
        continue;
      }

      if (text === 'try:') {
        const child = childSuite(index + 1, indent);
        index = child.index;
        const handlers = [];
        while (index < lines.length && lines[index].indent === indent) {
          const exceptMatch = lines[index].text.match(/^except(?:\s+([A-Za-z_]\w*))?(?:\s+as\s+([A-Za-z_]\w*))?:$/);
          if (!exceptMatch) break;
          const handler = childSuite(index + 1, indent);
          handlers.push({ errorType: exceptMatch[1] || null, name: exceptMatch[2] || null, body: handler.nodes });
          index = handler.index;
        }
        if (!handlers.length) throw new PyError('SyntaxError', 'expected except block');
        nodes.push({ type: 'try', body: child.nodes, handlers, line: line.line });
        continue;
      }

      const withMatch = text.match(/^with\s+(.+?)\s+as\s+([A-Za-z_]\w*)\s*:\s*$/);
      if (withMatch) {
        const child = childSuite(index + 1, indent);
        nodes.push({ type: 'with', expression: withMatch[1], name: withMatch[2], body: child.nodes, line: line.line });
        index = child.index;
        continue;
      }

      if (/^(elif\b|else:|except\b)/.test(text)) break;
      if (text.endsWith(':')) throw new PyError('SyntaxError', `unsupported statement '${text}'`);
      nodes.push({ type: 'simple', text, line: line.line });
      index++;
    }
    return { nodes, index };
  }

  if (!lines.length) return [];
  if (lines[0].indent !== 0) throw new PyError('IndentationError', 'unexpected indent');
  const result = parseSuite(0, 0);
  if (result.index !== lines.length) throw new PyError('IndentationError', 'unexpected indent');
  return result.nodes;
}

function splitTopLevel(source, delimiter) {
  const pieces = [];
  let start = 0;
  let quote = null;
  let escaped = false;
  let depth = 0;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === delimiter && depth === 0) { pieces.push(source.slice(start, i).trim()); start = i + 1; }
  }
  pieces.push(source.slice(start).trim());
  return pieces;
}

function findAssignment(source) {
  let quote = null;
  let escaped = false;
  let depth = 0;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === '=' && depth === 0 && source[i - 1] !== '=' && source[i + 1] !== '=' && !'<>!:+-*/%'.includes(source[i - 1] || '')) return { index: i };
  }
  return null;
}

function assignTarget(target, value, scope, runtime) {
  const names = splitTopLevel(target, ',');
  if (names.length > 1) {
    const values = iterable(value);
    if (values.length !== names.length) throw new PyError('ValueError', 'not enough values to unpack');
    names.forEach((name, index) => assignTarget(name, values[index], scope, runtime));
    return;
  }
  const name = target.trim();
  const subscript = name.match(/^([A-Za-z_]\w*)\[(.+)\]$/);
  if (subscript) {
    const container = scope.get(subscript[1]);
    const key = evaluate(subscript[2], scope, runtime);
    if (container == null || (typeof container !== 'object' && typeof container !== 'string')) {
      throw new PyError('TypeError', `'${pyType(container)}' object does not support item assignment`);
    }
    if (typeof container === 'string') throw new PyError('TypeError', "'str' object does not support item assignment");
    if (['__proto__', 'prototype', 'constructor'].includes(String(key))) {
      throw new PyError('KeyError', `unsafe key ${pyRepr(key)}`);
    }
    container[key] = value;
    return;
  }
  if (!/^[A-Za-z_]\w*$/.test(name)) throw new PyError('SyntaxError', `cannot assign to '${name}'`);
  scope.set(name, value);
}

function createFile(path, mode, runtime) {
  const resolved = runtime.ctx.shell.resolve(String(path));
  let cursor = 0;
  if (mode.startsWith('r') && !runtime.ctx.fs.exists(resolved, runtime.ctx)) {
    throw new PyError('FileNotFoundError', `[Errno 2] No such file or directory: ${pyRepr(path)}`);
  }
  if (mode.includes('w')) runtime.ctx.fs.writeFile(resolved, '', runtime.ctx);
  if (mode.includes('a')) {
    try { cursor = runtime.ctx.fs.readFile(resolved, runtime.ctx).length; }
    catch { runtime.ctx.fs.writeFile(resolved, '', runtime.ctx); }
  }
  const readAll = () => {
    try { return runtime.ctx.fs.readFile(resolved, runtime.ctx); }
    catch (error) { throw new PyError('FileNotFoundError', `[Errno 2] No such file or directory: ${pyRepr(path)}`); }
  };
  const readlines = () => readAll().split(/(?<=\n)/).filter(Boolean);
  const file = {
    __pyFile: true,
    read: callable(() => { const text = readAll().slice(cursor); cursor = readAll().length; return text; }),
    readline: callable(() => {
      const text = readAll();
      if (cursor >= text.length) return '';
      const end = text.indexOf('\n', cursor);
      const line = text.slice(cursor, end < 0 ? text.length : end + 1);
      cursor += line.length;
      return line;
    }),
    readlines: callable(() => readlines()),
    __pyReadlines: readlines,
    write: callable((args) => {
      if (!/[wa+]/.test(mode)) throw new PyError('UnsupportedOperation', 'not writable');
      const text = pyStr(args[0]);
      runtime.ctx.fs.writeFile(resolved, text, runtime.ctx, { append: true });
      cursor += text.length;
      return text.length;
    }),
    close: callable(() => null),
  };
  return file;
}

const LAB_HTTP = {
  'http://api.local/status': { status: 200, body: { servicio: 'mentor-api', estado: 'ok' } },
  'http://api.local/version': { status: 200, body: { servicio: 'mentor-api', version: '2.4', estable: true } },
  'http://api.local/usuarios': { status: 200, body: [{ id: 1, usuario: 'ana', rol: 'analista' }, { id: 2, usuario: 'leo', rol: 'operador' }] },
  'http://lab.local/eventos': { status: 200, body: [{ ip: '10.0.0.8', codigo: 401 }, { ip: '10.0.0.8', codigo: 401 }, { ip: '10.0.0.21', codigo: 200 }] },
};

function makeResponse(url, entry) {
  const text = typeof entry.body === 'string' ? entry.body : JSON.stringify(entry.body);
  return {
    __pyResponse: true,
    status_code: entry.status,
    ok: entry.status >= 200 && entry.status < 400,
    text,
    url,
    json: callable(() => JSON.parse(text)),
    raise_for_status: callable(() => {
      if (entry.status >= 400) throw new PyError('HTTPError', `${entry.status} response for ${url}`);
      return null;
    }),
  };
}

function makePath(path, runtime) {
  const textPath = String(path);
  const resolved = () => runtime.ctx.shell.resolve(textPath);
  return {
    __pyPath: true,
    name: textPath.split('/').filter(Boolean).at(-1) || '/',
    suffix: (textPath.match(/(\.[^./]+)$/) || [''])[0],
    exists: callable(() => runtime.ctx.fs.exists(resolved(), runtime.ctx)),
    read_text: callable(() => {
      try { return runtime.ctx.fs.readFile(resolved(), runtime.ctx); }
      catch { throw new PyError('FileNotFoundError', `[Errno 2] No such file or directory: ${pyRepr(textPath)}`); }
    }),
    write_text: callable((args) => { runtime.ctx.fs.writeFile(resolved(), pyStr(args[0]), runtime.ctx); return pyStr(args[0]).length; }),
  };
}

function createModules(runtime) {
  const json = moduleObject('json', {
    loads: callable((args) => {
      try { return JSON.parse(String(args[0])); }
      catch (error) { throw new PyError('JSONDecodeError', error.message); }
    }),
    dumps: callable((args, kwargs) => JSON.stringify(args[0], null, kwargs.indent == null ? 0 : Number(kwargs.indent))),
  });

  const re = moduleObject('re', {
    findall: callable((args) => {
      try {
        const regex = new RegExp(String(args[0]), 'g');
        return [...String(args[1]).matchAll(regex)].map((match) => match.length > 1 ? (match.length === 2 ? match[1] : match.slice(1)) : match[0]);
      } catch (error) { throw new PyError('error', error.message); }
    }),
    search: callable((args) => {
      const match = new RegExp(String(args[0])).exec(String(args[1]));
      if (!match) return null;
      return { __pyMatch: true, group: callable((groupArgs) => match[Number(groupArgs[0] || 0)] ?? null), groups: callable(() => match.slice(1)) };
    }),
    sub: callable((args) => String(args[2]).replace(new RegExp(String(args[0]), 'g'), String(args[1]))),
    split: callable((args) => String(args[1]).split(new RegExp(String(args[0])))),
  });

  const requests = moduleObject('requests', {
    get: callable((args) => {
      const url = String(args[0]);
      const entry = LAB_HTTP[url];
      if (!entry) throw new PyError('ConnectionError', `red externa desactivada; usa un endpoint *.local del laboratorio (${url})`);
      return makeResponse(url, entry);
    }),
  });

  const dns = { localhost: '127.0.0.1', 'api.local': '192.168.1.60', 'lab.local': '10.0.0.40' };
  const socket = moduleObject('socket', {
    gethostbyname: callable((args) => {
      const host = String(args[0]);
      if (!dns[host]) throw new PyError('gaierror', `[Errno -2] Name or service not known: ${host}`);
      return dns[host];
    }),
    create_connection: callable((args) => {
      const [host, port] = args[0] || [];
      const openPorts = { 'api.local': [80, 443], 'lab.local': [22, 8000], localhost: [22] };
      if (!openPorts[host]?.includes(Number(port))) throw new PyError('ConnectionRefusedError', `[Errno 111] Connection refused: ${host}:${port}`);
      return {
        __pySocket: true,
        getpeername: callable(() => [dns[host], Number(port)]),
        sendall: callable(() => null), recv: callable(() => 'MENTOR-LAB\n'), close: callable(() => null),
      };
    }),
  });

  const osPath = moduleObject('os.path', {
    exists: callable((args) => runtime.ctx.fs.exists(runtime.ctx.shell.resolve(String(args[0])), runtime.ctx)),
    basename: callable((args) => String(args[0]).replace(/\/$/, '').split('/').at(-1)),
    dirname: callable((args) => String(args[0]).replace(/\/[^/]*$/, '') || '.'),
    join: callable((args) => args.map(String).join('/').replace(/\/{2,}/g, '/')),
  });
  const os = moduleObject('os', {
    path: osPath,
    getenv: callable((args) => runtime.ctx.env[String(args[0])] ?? (args[1] ?? null)),
    listdir: callable((args) => runtime.ctx.fs.list(runtime.ctx.shell.resolve(String(args[0] ?? '.')), runtime.ctx).map((entry) => entry.name)),
  });

  return {
    json, re, requests, socket, os,
    sys: moduleObject('sys', { argv: runtime.argv }),
    pathlib: moduleObject('pathlib', { Path: callable((args) => makePath(args[0], runtime)) }),
  };
}

function installBuiltins(scope, runtime) {
  const builtins = {
    print: callable((args, kwargs) => {
      const sep = kwargs.sep == null ? ' ' : String(kwargs.sep);
      const end = kwargs.end == null ? '\n' : String(kwargs.end);
      runtime.stdout += args.map(pyStr).join(sep) + end;
      return null;
    }),
    len: callable((args) => {
      const value = args[0];
      if (typeof value === 'string' || Array.isArray(value)) return value.length;
      if (value && typeof value === 'object') return Object.keys(value).filter((key) => !key.startsWith('__py')).length;
      throw new PyError('TypeError', `object of type '${pyType(value)}' has no len()`);
    }),
    str: callable((args) => pyStr(args[0] ?? '')),
    repr: callable((args) => pyRepr(args[0])),
    int: callable((args) => number(args[0] ?? 0, 'int')),
    float: callable((args) => number(args[0] ?? 0, 'float')),
    bool: callable((args) => truthy(args[0])),
    list: callable((args) => args.length ? iterable(args[0]) : []),
    dict: callable(() => Object.create(null)),
    range: callable((args) => {
      let start = 0;
      let end = Number(args[0] || 0);
      let step = 1;
      if (args.length > 1) { start = Number(args[0]); end = Number(args[1]); }
      if (args.length > 2) step = Number(args[2]);
      if (!step) throw new PyError('ValueError', 'range() arg 3 must not be zero');
      const values = [];
      if (step > 0) for (let n = start; n < end; n += step) values.push(n);
      else for (let n = start; n > end; n += step) values.push(n);
      return values;
    }),
    enumerate: callable((args) => iterable(args[0]).map((value, index) => [index + Number(args[1] || 0), value])),
    zip: callable((args) => {
      const lists = args.map(iterable);
      const length = Math.min(...lists.map((list) => list.length));
      return Array.from({ length }, (_, index) => lists.map((list) => list[index]));
    }),
    sorted: callable((args, kwargs) => {
      const values = iterable(args[0]);
      values.sort((a, b) => typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)));
      if (kwargs.reverse) values.reverse();
      return values;
    }),
    sum: callable((args) => iterable(args[0]).reduce((total, value) => total + Number(value), Number(args[1] || 0))),
    min: callable((args) => Math.min(...(args.length === 1 ? iterable(args[0]) : args).map(Number))),
    max: callable((args) => Math.max(...(args.length === 1 ? iterable(args[0]) : args).map(Number))),
    any: callable((args) => iterable(args[0]).some(truthy)),
    all: callable((args) => iterable(args[0]).every(truthy)),
    type: callable((args) => `<class '${pyType(args[0])}'>`),
    open: callable((args) => createFile(args[0], String(args[1] || 'r'), runtime)),
    input: callable((args) => {
      if (args[0] != null) runtime.stdout += pyStr(args[0]);
      return runtime.stdin.shift() ?? '';
    }),
    abs: callable((args) => Math.abs(Number(args[0]))),
    round: callable((args) => {
      const digits = Number(args[1] || 0);
      return Number(Number(args[0]).toFixed(digits));
    }),
  };
  for (const [name, value] of Object.entries(builtins)) scope.set(name, value);
  for (const errorName of ['Exception', 'ValueError', 'TypeError', 'FileNotFoundError', 'JSONDecodeError', 'ConnectionError']) scope.set(errorName, errorName);
}

function runSimple(text, scope, runtime) {
  if (++runtime.steps > MAX_STEPS) throw new PyError('RuntimeError', 'execution limit exceeded');
  if (text === 'pass') return null;
  if (text === 'break') return { flow: 'break' };
  if (text === 'continue') return { flow: 'continue' };
  if (text === 'return') return { flow: 'return', value: null };
  if (text.startsWith('return ')) return { flow: 'return', value: evaluate(text.slice(7), scope, runtime) };
  if (text.startsWith('raise ')) throw new PyError('Exception', pyStr(evaluate(text.slice(6), scope, runtime)));
  if (text.startsWith('assert ')) {
    if (!truthy(evaluate(text.slice(7), scope, runtime))) throw new PyError('AssertionError', 'assertion failed');
    return null;
  }

  const fromImport = text.match(/^from\s+([A-Za-z_]\w*)\s+import\s+(.+)$/);
  if (fromImport) {
    const module = runtime.modules[fromImport[1]];
    if (!module) throw new PyError('ModuleNotFoundError', `No module named '${fromImport[1]}'`);
    for (const name of splitTopLevel(fromImport[2], ',')) scope.set(name, getAttr(module, name));
    return null;
  }
  const importMatch = text.match(/^import\s+(.+)$/);
  if (importMatch) {
    for (const spec of splitTopLevel(importMatch[1], ',')) {
      const match = spec.match(/^([A-Za-z_]\w*)(?:\s+as\s+([A-Za-z_]\w*))?$/);
      if (!match || !runtime.modules[match[1]]) throw new PyError('ModuleNotFoundError', `No module named '${match?.[1] || spec}'`);
      scope.set(match[2] || match[1], runtime.modules[match[1]]);
    }
    return null;
  }

  const augmented = text.match(/^([A-Za-z_]\w*)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
  if (augmented) {
    const current = scope.get(augmented[1]);
    const right = evaluate(augmented[3], scope, runtime);
    if (augmented[2] === '+=') scope.set(augmented[1], typeof current === 'string' ? current + pyStr(right) : Number(current) + Number(right));
    else if (augmented[2] === '-=') scope.set(augmented[1], Number(current) - Number(right));
    else if (augmented[2] === '*=') scope.set(augmented[1], Number(current) * Number(right));
    else scope.set(augmented[1], Number(current) / Number(right));
    return null;
  }

  const assignment = findAssignment(text);
  if (assignment) {
    const target = text.slice(0, assignment.index).trim();
    const expression = text.slice(assignment.index + 1).trim();
    assignTarget(target, evaluate(expression, scope, runtime), scope, runtime);
    return null;
  }
  evaluate(text, scope, runtime);
  return null;
}

function executeBlock(nodes, scope, runtime) {
  for (const node of nodes) {
    let result = null;
    if (node.type === 'simple') result = runSimple(node.text, scope, runtime);
    else if (node.type === 'if') {
      let chosen = node.otherwise;
      for (const branch of node.branches) {
        if (truthy(evaluate(branch.test, scope, runtime))) { chosen = branch.body; break; }
      }
      result = executeBlock(chosen, scope, runtime);
    } else if (node.type === 'for') {
      const values = iterable(evaluate(node.expression, scope, runtime));
      for (let index = 0; index < values.length && index < MAX_LOOP; index++) {
        assignTarget(node.target, values[index], scope, runtime);
        const flow = executeBlock(node.body, scope, runtime);
        if (flow?.flow === 'break') break;
        if (flow?.flow === 'continue') continue;
        if (flow) { result = flow; break; }
      }
    } else if (node.type === 'while') {
      for (let index = 0; index < MAX_LOOP && truthy(evaluate(node.expression, scope, runtime)); index++) {
        const flow = executeBlock(node.body, scope, runtime);
        if (flow?.flow === 'break') break;
        if (flow?.flow === 'continue') continue;
        if (flow) { result = flow; break; }
      }
    } else if (node.type === 'def') {
      const fn = {
        __pyFunction: true,
        call: (args, kwargs) => {
          const child = new Scope(scope);
          node.params.forEach((param, index) => {
            let value;
            if (index < args.length) value = args[index];
            else if (Object.hasOwn(kwargs, param.name)) value = kwargs[param.name];
            else if (param.defaultExpr != null) value = evaluate(param.defaultExpr, scope, runtime);
            else throw new PyError('TypeError', `${node.name}() missing required argument '${param.name}'`);
            child.set(param.name, value);
          });
          const flow = executeBlock(node.body, child, runtime);
          return flow?.flow === 'return' ? flow.value : null;
        },
      };
      scope.set(node.name, fn);
    } else if (node.type === 'try') {
      try { result = executeBlock(node.body, scope, runtime); }
      catch (error) {
        const handler = node.handlers.find((candidate) => !candidate.errorType || candidate.errorType === error.type || candidate.errorType === 'Exception');
        if (!handler) throw error;
        if (handler.name) scope.set(handler.name, error.message);
        result = executeBlock(handler.body, scope, runtime);
      }
    } else if (node.type === 'with') {
      scope.set(node.name, evaluate(node.expression, scope, runtime));
      result = executeBlock(node.body, scope, runtime);
    }
    if (result) return result;
  }
  return null;
}

export function executePython(source, ctx, { argv = ['-c'], stdin = '' } = {}) {
  const runtime = { ctx, argv, stdin: stdin.split(/\r?\n/), stdout: '', steps: 0, modules: null };
  const scope = new Scope();
  installBuiltins(scope, runtime);
  runtime.modules = createModules(runtime);
  const nodes = parseProgram(source);
  executeBlock(nodes, scope, runtime);
  return runtime.stdout;
}

function pythonCommand(args, ctx, stdin = '') {
  if (args.includes('--version') || args.includes('-V')) return ok('Python 3.11.8 (Mentor runtime offline)\n');
  let source;
  let argv;
  if (args[0] === '-c') {
    if (args[1] == null) return err('python3: argument expected for -c', 2);
    source = args[1];
    argv = ['-c', ...args.slice(2)];
  } else if (!args.length || args[0] === '-') {
    source = stdin;
    argv = ['-'];
  } else {
    const path = args[0];
    try { source = ctx.fs.readFile(ctx.shell.resolve(path), ctx); }
    catch (error) { return err(`python3: can't open file '${path}': ${error.message}`, 2); }
    argv = [path, ...args.slice(1)];
  }
  try {
    return ok(executePython(source, ctx, { argv, stdin }));
  } catch (error) {
    const type = error instanceof PyError ? error.type : 'RuntimeError';
    return err(`Traceback (most recent call last):\n  File "${argv[0]}", line 1\n${type}: ${error.message}`, 1);
  }
}

export const python = {
  python3: pythonCommand,
  python: pythonCommand,
};
