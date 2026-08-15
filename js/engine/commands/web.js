// Herramientas de la Fase 5. SQLite trabaja sobre una base determinista y
// exclusivamente local: no abre archivos del dispositivo ni ejecuta código.

import { ok, err, padEnd } from './util.js';

const ESQUEMAS = Object.freeze({
  usuarios: 'CREATE TABLE usuarios (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, rol TEXT NOT NULL);',
  productos: 'CREATE TABLE productos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, precio REAL NOT NULL);',
  pedidos: 'CREATE TABLE pedidos (id INTEGER PRIMARY KEY, usuario_id INTEGER REFERENCES usuarios(id), producto_id INTEGER REFERENCES productos(id), cantidad INTEGER NOT NULL);',
});

const DATOS = Object.freeze({
  usuarios: [
    { id: 1, nombre: 'Ana', rol: 'analista' },
    { id: 2, nombre: 'Leo', rol: 'operador' },
    { id: 3, nombre: 'Mara', rol: 'analista' },
  ],
  productos: [
    { id: 1, nombre: 'Teclado', precio: 45 },
    { id: 2, nombre: 'Ratón', precio: 25 },
    { id: 3, nombre: 'Monitor', precio: 220 },
  ],
  pedidos: [
    { id: 1, usuario_id: 1, producto_id: 2, cantidad: 2 },
    { id: 2, usuario_id: 2, producto_id: 3, cantidad: 1 },
    { id: 3, usuario_id: 1, producto_id: 1, cantidad: 1 },
    { id: 4, usuario_id: 3, producto_id: 2, cantidad: 1 },
  ],
});

function listaSql(texto) {
  const partes = [];
  let actual = '';
  let comilla = '';
  let nivel = 0;
  for (const caracter of texto) {
    if (comilla) {
      actual += caracter;
      if (caracter === comilla) comilla = '';
      continue;
    }
    if (caracter === "'" || caracter === '"') {
      comilla = caracter;
      actual += caracter;
    } else if (caracter === '(') {
      nivel++;
      actual += caracter;
    } else if (caracter === ')') {
      nivel--;
      actual += caracter;
    } else if (caracter === ',' && nivel === 0) {
      partes.push(actual.trim());
      actual = '';
    } else {
      actual += caracter;
    }
  }
  if (actual.trim()) partes.push(actual.trim());
  return partes;
}

function literal(texto) {
  const limpio = texto.trim();
  if ((limpio.startsWith("'") && limpio.endsWith("'")) || (limpio.startsWith('"') && limpio.endsWith('"'))) {
    return limpio.slice(1, -1);
  }
  if (/^-?\d+(?:\.\d+)?$/.test(limpio)) return Number(limpio);
  if (/^null$/i.test(limpio)) return null;
  return limpio;
}

function filaConTabla(tabla, fila) {
  const salida = {};
  for (const [columna, valor] of Object.entries(fila)) {
    salida[columna] = valor;
    salida[tabla + '.' + columna] = valor;
  }
  return salida;
}

function valorDe(fila, expresion) {
  const clave = expresion.trim();
  if (Object.hasOwn(fila, clave)) return fila[clave];
  const simple = clave.split('.').pop();
  return Object.hasOwn(fila, simple) ? fila[simple] : undefined;
}

function comparar(izquierda, operador, derecha) {
  if (operador === '=') return izquierda === derecha;
  if (operador === '!=' || operador === '<>') return izquierda !== derecha;
  if (operador === '>') return izquierda > derecha;
  if (operador === '<') return izquierda < derecha;
  if (operador === '>=') return izquierda >= derecha;
  if (operador === '<=') return izquierda <= derecha;
  return false;
}

function cumpleWhere(fila, where) {
  if (!where) return true;
  return where.split(/\s+AND\s+/i).every((condicion) => {
    const match = condicion.trim().match(/^([\w.]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
    return match ? comparar(valorDe(fila, match[1]), match[2], literal(match[3])) : false;
  });
}

function clausula(resto, nombre, siguientes) {
  const patron = new RegExp('\\b' + nombre + '\\s+(.+?)(?=\\s+(' + siguientes.join('|') + ')\\b|$)', 'i');
  return resto.match(patron)?.[1]?.trim() || '';
}

function campoSeleccion(texto) {
  const alias = texto.match(/^(.+?)\s+AS\s+(\w+)$/i);
  const expresion = (alias ? alias[1] : texto).trim();
  return {
    expresion,
    alias: alias?.[2] || (/^COUNT\s*\(\s*\*\s*\)$/i.test(expresion) ? 'COUNT(*)' : expresion.split('.').pop()),
    conteo: /^COUNT\s*\(\s*\*\s*\)$/i.test(expresion),
  };
}

function ordenarFilas(filas, order) {
  if (!order) return filas;
  const match = order.match(/^([\w.()]+)(?:\s+(ASC|DESC))?$/i);
  if (!match) return filas;
  const factor = /^DESC$/i.test(match[2] || '') ? -1 : 1;
  return filas.sort((a, b) => {
    const av = valorDe(a.valores || a, match[1]) ?? valorDe(a.fuente || {}, match[1]);
    const bv = valorDe(b.valores || b, match[1]) ?? valorDe(b.fuente || {}, match[1]);
    return av === bv ? 0 : av > bv ? factor : -factor;
  });
}

function seleccionar(sql) {
  const match = sql.match(/^SELECT\s+(.+?)\s+FROM\s+(\w+)([\s\S]*)$/i);
  if (!match) throw new Error('solo se admite SELECT sobre las tablas del laboratorio');
  const [, seleccion, tablaBase, resto] = match;
  if (!DATOS[tablaBase]) throw new Error('no existe la tabla: ' + tablaBase);

  let filas = DATOS[tablaBase].map((fila) => filaConTabla(tablaBase, fila));
  const joinRegex = /\bJOIN\s+(\w+)\s+ON\s+([\w.]+)\s*=\s*([\w.]+)/gi;
  let join;
  while ((join = joinRegex.exec(resto))) {
    const [, tabla, izquierda, derecha] = join;
    if (!DATOS[tabla]) throw new Error('no existe la tabla: ' + tabla);
    filas = filas.flatMap((fila) => DATOS[tabla]
      .map((otra) => ({ ...fila, ...filaConTabla(tabla, otra) }))
      .filter((combinada) => valorDe(combinada, izquierda) === valorDe(combinada, derecha)));
  }

  const where = clausula(resto, 'WHERE', ['GROUP\\s+BY', 'ORDER\\s+BY', 'LIMIT']);
  const group = clausula(resto, 'GROUP\\s+BY', ['ORDER\\s+BY', 'LIMIT']);
  const order = clausula(resto, 'ORDER\\s+BY', ['LIMIT']);
  const limitText = clausula(resto, 'LIMIT', ['__FIN__']);
  filas = filas.filter((fila) => cumpleWhere(fila, where));

  let campos;
  if (seleccion.trim() === '*') {
    campos = Object.keys(DATOS[tablaBase][0]).map((columna) => campoSeleccion(columna));
  } else {
    campos = listaSql(seleccion).map(campoSeleccion);
  }

  let proyectadas;
  if (group) {
    const grupos = new Map();
    for (const fila of filas) {
      const clave = valorDe(fila, group);
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(fila);
    }
    proyectadas = [...grupos.values()].map((grupoFilas) => ({
      fuente: grupoFilas[0],
      valores: Object.fromEntries(campos.map((campo) => [
        campo.alias,
        campo.conteo ? grupoFilas.length : valorDe(grupoFilas[0], campo.expresion),
      ])),
    }));
  } else if (campos.some((campo) => campo.conteo)) {
    proyectadas = [{
      fuente: filas[0] || {},
      valores: Object.fromEntries(campos.map((campo) => [
        campo.alias,
        campo.conteo ? filas.length : valorDe(filas[0] || {}, campo.expresion),
      ])),
    }];
  } else {
    proyectadas = filas.map((fila) => ({
      fuente: fila,
      valores: Object.fromEntries(campos.map((campo) => [campo.alias, valorDe(fila, campo.expresion)])),
    }));
  }

  ordenarFilas(proyectadas, order);
  const limite = /^\d+$/.test(limitText) ? Number(limitText) : proyectadas.length;
  return { columnas: campos.map((campo) => campo.alias), filas: proyectadas.slice(0, limite).map((fila) => fila.valores) };
}

function tablaTexto(columnas, filas, columnasAlineadas) {
  if (!filas.length) return '';
  if (!columnasAlineadas) return filas.map((fila) => columnas.map((columna) => fila[columna] ?? '').join('|')).join('\n') + '\n';
  const anchos = columnas.map((columna) => Math.max(columna.length, ...filas.map((fila) => String(fila[columna] ?? '').length)));
  const linea = columnas.map((columna, indice) => padEnd(columna, anchos[indice])).join('  ');
  const separador = anchos.map((ancho) => '-'.repeat(ancho)).join('  ');
  const cuerpo = filas.map((fila) => columnas.map((columna, indice) => padEnd(fila[columna] ?? '', anchos[indice])).join('  '));
  return [linea, separador, ...cuerpo].join('\n') + '\n';
}

function sqlite3(args) {
  const columnas = args.includes('-column') || args.includes('--column');
  const encabezado = args.includes('-header') || args.includes('--header');
  const operandos = args.filter((arg) => !['-column', '--column', '-header', '--header'].includes(arg));
  const archivo = operandos.shift();
  const consulta = operandos.join(' ').trim().replace(/;\s*$/, '');
  if (!archivo) return err('Usage: sqlite3 DATABASE [SQL]', 1);
  if (!consulta) return ok('SQLite educativo · usa .tables, .schema tabla o SELECT\n');
  if (consulta === '.tables') return ok(Object.keys(DATOS).sort().join('  ') + '\n');
  if (consulta.startsWith('.schema')) {
    const tabla = consulta.split(/\s+/)[1];
    if (tabla && !ESQUEMAS[tabla]) return err('Error: tabla desconocida: ' + tabla, 1);
    return ok((tabla ? [ESQUEMAS[tabla]] : Object.values(ESQUEMAS)).join('\n') + '\n');
  }
  const pragma = consulta.match(/^PRAGMA\s+table_info\s*\(\s*(\w+)\s*\)$/i);
  if (pragma) {
    const esquema = ESQUEMAS[pragma[1]];
    if (!esquema) return err('Error: tabla desconocida: ' + pragma[1], 1);
    const columnasTabla = [...esquema.matchAll(/(?:\(|,\s*)(\w+)\s+(INTEGER|TEXT|REAL)/g)]
      .map((m, indice) => ({ cid: indice, name: m[1], type: m[2], notnull: /NOT NULL/.test(m[0]) ? 1 : 0, dflt_value: '', pk: /PRIMARY KEY/.test(m[0]) ? 1 : 0 }));
    return ok(tablaTexto(['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk'], columnasTabla, columnas));
  }
  if (!/^SELECT\b/i.test(consulta)) return err('Error: el laboratorio SQL es de solo lectura; usa SELECT', 1);
  try {
    const resultado = seleccionar(consulta);
    if (columnas || encabezado) return ok(tablaTexto(resultado.columnas, resultado.filas, columnas));
    return ok(tablaTexto(resultado.columnas, resultado.filas, false));
  } catch (error) {
    return err('Error: ' + error.message, 1);
  }
}

export const web = { sqlite3 };
