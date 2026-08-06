// Texto: grep, sed, awk, cut, sort, uniq, tr, rev, diff, less, more, nl, tee, column
import { parseArgs, ok, err, lines, withNewline, pad } from './util.js';

function readInputs(operands, ctx, stdin, cmdName) {
  if (!operands.length) return { items: [{ name: null, text: stdin }], errs: '' };
  const items = [];
  let errs = '';
  for (const t of operands) {
    try {
      items.push({ name: t, text: ctx.fs.readFile(ctx.shell.resolve(t), ctx) });
    } catch (e) {
      errs += `${cmdName}: ${t}: ${e.message}\n`;
    }
  }
  return { items, errs };
}

// Traduce una expresión regular básica/extendida de POSIX a JS.
function toRegex(pattern, { extended = false, fixed = false, ignoreCase = false, wordMatch = false } = {}) {
  let src = pattern;
  if (fixed) src = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  else if (!extended) {
    // BRE: \( \) \{ \} \| son metacaracteres; ( ) { } | son literales
    src = src
      .replace(/([+?{}()|])/g, (m) => '\\' + m)
      .replace(/\\\\([+?{}()|])/g, '$1');
  }
  if (wordMatch) src = `\\b(?:${src})\\b`;
  return new RegExp(src, ignoreCase ? 'i' : '');
}

export const text = {
  grep: (args, ctx, stdin) => {
    const { operands, values, flags, has } = parseArgs(args, { withValue: ['e', 'm', 'A', 'B', 'C'] });
    let pattern = values.e;
    const rest = [...operands];
    if (pattern == null) pattern = rest.shift();
    if (pattern == null) return err('usage: grep [OPTION]... PATTERN [FILE]...', 2);

    const invert = has('-v', '--invert-match');
    const count = has('-c', '--count');
    const listFiles = has('-l');
    const numbers = has('-n', '--line-number');
    const quiet = has('-q');
    const onlyMatch = has('-o');
    const recursive = has('-r', '-R');

    const re = toRegex(pattern, {
      extended: has('-E'),
      fixed: has('-F'),
      ignoreCase: has('-i', '--ignore-case'),
      wordMatch: has('-w'),
    });

    let targets = rest;
    if (recursive) {
      const expand = (base) => {
        const out = [];
        const walk = (p, label) => {
          let node;
          try {
            node = ctx.fs.lookup(p, ctx);
          } catch {
            return;
          }
          if (node.type === 'dir') {
            for (const [name] of node.children) walk(p + (p === '/' ? '' : '/') + name, label + '/' + name);
          } else out.push(label);
        };
        walk(ctx.shell.resolve(base), base.replace(/\/$/, ''));
        return out;
      };
      targets = rest.flatMap(expand);
    }

    const { items, errs } = readInputs(targets, ctx, stdin, 'grep');
    const many = items.length > 1;
    let out = '';
    let matched = false;

    for (const item of items) {
      const ls = lines(item.text);
      const hits = [];
      ls.forEach((l, i) => {
        const isMatch = re.test(l);
        if (isMatch !== invert) hits.push({ line: l, no: i + 1 });
      });
      if (hits.length) matched = true;
      if (quiet) continue;
      if (count) {
        out += (many ? item.name + ':' : '') + hits.length + '\n';
        continue;
      }
      if (listFiles) {
        if (hits.length) out += item.name + '\n';
        continue;
      }
      for (const h of hits) {
        const prefix = (many && item.name ? item.name + ':' : '') + (numbers ? h.no + ':' : '');
        if (onlyMatch) {
          const g = new RegExp(re.source, re.flags + 'g');
          for (const m of h.line.match(g) || []) out += prefix + m + '\n';
        } else {
          out += prefix + h.line + '\n';
        }
      }
    }
    return { stdout: quiet ? '' : out, stderr: errs, code: matched ? 0 : errs ? 2 : 1 };
  },

  sed: (args, ctx, stdin) => {
    const { operands, values, has } = parseArgs(args, { withValue: ['e'] });
    const rest = [...operands];
    let script = values.e != null ? values.e : rest.shift();
    if (script == null) return err('usage: sed [OPTION]... {script} [input-file]...', 1);
    const inPlace = has('-i', '--in-place');
    const quiet = has('-n');

    const apply = (textIn) => {
      let ls = lines(textIn);
      for (const stmt of script.split(';')) {
        const s = stmt.trim();
        if (!s) continue;
        let m = s.match(/^s(.)(.*)$/);
        if (m) {
          const delim = m[1];
          const parts = splitUnescaped(m[2], delim);
          const [pat, rep, flagsRaw = ''] = parts;
          const g = flagsRaw.includes('g');
          const i = flagsRaw.includes('i');
          const re = new RegExp(toRegex(pat, { extended: has('-E', '-r'), ignoreCase: i }).source, g ? (i ? 'gi' : 'g') : i ? 'i' : '');
          const replacement = rep.replace(/\\(\d)/g, '$$$1').replace(/&/g, '$&');
          ls = ls.map((l) => l.replace(re, replacement));
          continue;
        }
        m = s.match(/^(\d+)?d$/) || s.match(/^\/(.*)\/d$/);
        if (s.endsWith('d')) {
          const body = s.slice(0, -1);
          if (/^\d+$/.test(body)) ls = ls.filter((_, idx) => idx + 1 !== parseInt(body, 10));
          else if (body.startsWith('/') && body.endsWith('/')) {
            const re = toRegex(body.slice(1, -1), { extended: has('-E', '-r') });
            ls = ls.filter((l) => !re.test(l));
          }
          continue;
        }
        m = s.match(/^(\d+)?p$/);
        if (m) {
          const n = m[1] ? parseInt(m[1], 10) : null;
          ls = n ? [ls[n - 1]].filter((x) => x != null) : ls;
          continue;
        }
        m = s.match(/^(\d+),(\d+)p$/);
        if (m) {
          ls = ls.slice(parseInt(m[1], 10) - 1, parseInt(m[2], 10));
          continue;
        }
      }
      return withNewline(ls.join('\n'));
    };

    if (!rest.length) return ok(apply(stdin));
    let out = '';
    let errs = '';
    for (const t of rest) {
      try {
        const path = ctx.shell.resolve(t);
        const result = apply(ctx.fs.readFile(path, ctx));
        if (inPlace) ctx.fs.writeFile(path, result, ctx);
        else out += result;
      } catch (e) {
        errs += `sed: can't read ${t}: ${e.message}\n`;
      }
    }
    return { stdout: out, stderr: errs, code: errs ? 1 : 0 };
  },

  awk: (args, ctx, stdin) => {
    const { operands, values } = parseArgs(args, { withValue: ['F', 'v'] });
    const rest = [...operands];
    const program = rest.shift();
    if (program == null) return err('usage: awk [-F fs] program [file ...]', 2);
    const fs = values.F ? (values.F === '\\t' ? '\t' : values.F) : null;
    const { items, errs } = readInputs(rest, ctx, stdin, 'awk');
    const textIn = items.map((i) => i.text).join('');

    // Soporta: BEGIN{}, END{}, /re/{action}, cond{action}, print $n, print expr, sumas
    const rules = parseAwk(program);
    let out = '';
    const vars = { NR: 0, NF: 0 };
    const runAction = (action, fields, line) => {
      for (const stmt of action.split(';')) {
        const s = stmt.trim();
        if (!s) continue;
        const assign = s.match(/^(\w+)\s*([+\-*/]?)=\s*(.+)$/);
        if (assign && !s.startsWith('print')) {
          const [, name, op, expr] = assign;
          const v = evalAwk(expr, fields, vars, line);
          vars[name] = op === '+' ? (num(vars[name]) + num(v)) : op === '-' ? num(vars[name]) - num(v) : op === '*' ? num(vars[name]) * num(v) : op === '/' ? num(vars[name]) / num(v) : v;
          continue;
        }
        if (s === 'print') {
          out += line + '\n';
          continue;
        }
        if (s.startsWith('print')) {
          const expr = s.slice(5).trim();
          out += expr.split(',').map((e) => String(evalAwk(e.trim(), fields, vars, line))).join(' ') + '\n';
        }
      }
    };

    for (const r of rules) if (r.type === 'BEGIN') runAction(r.action, [], '');
    for (const line of lines(textIn)) {
      vars.NR++;
      const fields = fs ? line.split(fs) : line.trim() === '' ? [] : line.trim().split(/\s+/);
      vars.NF = fields.length;
      for (const r of rules) {
        if (r.type === 'BEGIN' || r.type === 'END') continue;
        if (r.type === 'always' || matchCond(r.cond, fields, vars, line)) runAction(r.action, fields, line);
      }
    }
    for (const r of rules) if (r.type === 'END') runAction(r.action, [], '');
    return { stdout: out, stderr: errs, code: errs ? 2 : 0 };
  },

  cut: (args, ctx, stdin) => {
    const { operands, values } = parseArgs(args, { withValue: ['d', 'f', 'c'] });
    const delim = values.d === '\\t' ? '\t' : values.d != null ? values.d : '\t';
    const { items, errs } = readInputs(operands, ctx, stdin, 'cut');
    let out = '';
    for (const item of items) {
      for (const l of lines(item.text)) {
        if (values.f != null) {
          const idx = parseRanges(values.f);
          const parts = l.split(delim);
          if (parts.length === 1 && values.d != null && !l.includes(delim)) {
            out += l + '\n';
            continue;
          }
          out += idx.map((i) => parts[i - 1]).filter((x) => x != null).join(delim) + '\n';
        } else if (values.c != null) {
          const idx = parseRanges(values.c);
          out += idx.map((i) => l[i - 1] || '').join('') + '\n';
        }
      }
    }
    return { stdout: out, stderr: errs, code: errs ? 1 : 0 };
  },

  sort: (args, ctx, stdin) => {
    const { operands, values, has } = parseArgs(args, { withValue: ['k', 't'] });
    const { items, errs } = readInputs(operands, ctx, stdin, 'sort');
    let ls = items.flatMap((i) => lines(i.text));
    const numeric = has('-n', '--numeric-sort') || has('-h');
    const sep = values.t || /\s+/;
    const key = values.k ? parseInt(values.k, 10) : null;
    const keyOf = (l) => (key ? (typeof sep === 'string' ? l.split(sep) : l.trim().split(sep))[key - 1] || '' : l);
    ls.sort((a, b) => {
      const ka = keyOf(a);
      const kb = keyOf(b);
      if (numeric) return (parseFloat(ka) || 0) - (parseFloat(kb) || 0);
      return ka.localeCompare(kb, 'en');
    });
    if (has('-r', '--reverse')) ls.reverse();
    if (has('-u', '--unique')) ls = ls.filter((l, i) => i === 0 || l !== ls[i - 1]);
    return { stdout: withNewline(ls.join('\n')), stderr: errs, code: errs ? 2 : 0 };
  },

  uniq: (args, ctx, stdin) => {
    const { operands, has } = parseArgs(args);
    const { items, errs } = readInputs(operands, ctx, stdin, 'uniq');
    const ls = items.flatMap((i) => lines(i.text));
    const groups = [];
    for (const l of ls) {
      if (groups.length && groups[groups.length - 1].value === l) groups[groups.length - 1].count++;
      else groups.push({ value: l, count: 1 });
    }
    let sel = groups;
    if (has('-d')) sel = groups.filter((g) => g.count > 1);
    if (has('-u')) sel = groups.filter((g) => g.count === 1);
    const out = sel.map((g) => (has('-c') ? pad(g.count, 7) + ' ' + g.value : g.value));
    return { stdout: withNewline(out.join('\n')), stderr: errs, code: 0 };
  },

  tr: (args, ctx, stdin) => {
    const { operands, has } = parseArgs(args);
    const expand = (set) =>
      set
        .replace(/\[:lower:\]/g, 'abcdefghijklmnopqrstuvwxyz')
        .replace(/\[:upper:\]/g, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        .replace(/\[:digit:\]/g, '0123456789')
        .replace(/(\w)-(\w)/g, (m, a, b) => {
          let s = '';
          for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) s += String.fromCharCode(c);
          return s;
        });
    const from = expand(operands[0] || '');
    const to = expand(operands[1] || '');
    let out = '';
    for (const ch of stdin) {
      const i = from.indexOf(ch);
      if (has('-d')) {
        if (i < 0) out += ch;
      } else if (i >= 0) out += to[Math.min(i, to.length - 1)] || ch;
      else out += ch;
    }
    if (has('-s')) out = out.replace(/(.)\1+/g, (m, c) => (from.includes(c) || to.includes(c) ? c : m));
    return ok(out);
  },

  rev: (args, ctx, stdin) => {
    const { items, errs } = readInputs(parseArgs(args).operands, ctx, stdin, 'rev');
    const out = items.flatMap((i) => lines(i.text)).map((l) => [...l].reverse().join(''));
    return { stdout: withNewline(out.join('\n')), stderr: errs, code: errs ? 1 : 0 };
  },

  nl: (args, ctx, stdin) => {
    const { items, errs } = readInputs(parseArgs(args).operands, ctx, stdin, 'nl');
    const out = items
      .flatMap((i) => lines(i.text))
      .map((l, idx) => pad(idx + 1, 6) + '\t' + l);
    return { stdout: withNewline(out.join('\n')), stderr: errs, code: errs ? 1 : 0 };
  },

  tee: (args, ctx, stdin) => {
    const { operands, has } = parseArgs(args);
    let errs = '';
    for (const t of operands) {
      try {
        ctx.fs.writeFile(ctx.shell.resolve(t), stdin, ctx, { append: has('-a') });
      } catch (e) {
        errs += `tee: ${t}: ${e.message}\n`;
      }
    }
    return { stdout: stdin, stderr: errs, code: errs ? 1 : 0 };
  },

  less: (args, ctx, stdin) => text.cat(args, ctx, stdin),
  more: (args, ctx, stdin) => text.cat(args, ctx, stdin),

  diff: (args, ctx) => {
    const { operands } = parseArgs(args);
    if (operands.length < 2) return err('diff: missing operand');
    let a, b;
    try {
      a = lines(ctx.fs.readFile(ctx.shell.resolve(operands[0]), ctx));
      b = lines(ctx.fs.readFile(ctx.shell.resolve(operands[1]), ctx));
    } catch (e) {
      return err(`diff: ${e.message}`, 2);
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) {
        i++;
        j++;
        continue;
      }
      const nextMatch = b.indexOf(a[i], j);
      if (i >= a.length) {
        out.push(`${i}a${j + 1}`, `> ${b[j]}`);
        j++;
      } else if (j >= b.length) {
        out.push(`${i + 1}d${j}`, `< ${a[i]}`);
        i++;
      } else if (nextMatch < 0) {
        out.push(`${i + 1}c${j + 1}`, `< ${a[i]}`, '---', `> ${b[j]}`);
        i++;
        j++;
      } else {
        out.push(`${i}a${j + 1}`, `> ${b[j]}`);
        j++;
      }
    }
    return { stdout: withNewline(out.join('\n')), code: out.length ? 1 : 0 };
  },
};

// cat lo aporta files.js; aquí solo se usa como fallback de less/more.
text.cat = (args, ctx, stdin) => {
  const { operands } = parseArgs(args);
  if (!operands.length) return ok(stdin);
  let out = '';
  let errs = '';
  for (const t of operands) {
    try {
      out += ctx.fs.readFile(ctx.shell.resolve(t), ctx);
    } catch (e) {
      errs += `less: ${t}: ${e.message}\n`;
    }
  }
  return { stdout: out, stderr: errs, code: errs ? 1 : 0 };
};

// --- helpers ------------------------------------------------------------

function splitUnescaped(s, delim) {
  const parts = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === delim) {
      cur += delim;
      i++;
      continue;
    }
    if (s[i] === delim) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += s[i];
  }
  parts.push(cur);
  return parts;
}

function parseRanges(spec) {
  const out = [];
  for (const part of spec.split(',')) {
    const m = part.match(/^(\d*)-(\d*)$/);
    if (m) {
      const from = parseInt(m[1] || '1', 10);
      const to = parseInt(m[2] || '30', 10);
      for (let i = from; i <= to; i++) out.push(i);
    } else out.push(parseInt(part, 10));
  }
  return out;
}

function parseAwk(program) {
  const src = program.trim().replace(/^'|'$/g, '');
  const rules = [];
  let i = 0;
  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) break;
    let cond = '';
    while (i < src.length && src[i] !== '{') cond += src[i++];
    let action = '';
    if (src[i] === '{') {
      let depth = 0;
      do {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') depth--;
        action += src[i++];
      } while (i < src.length && depth > 0);
      action = action.slice(1, -1);
    }
    cond = cond.trim();
    if (cond === 'BEGIN') rules.push({ type: 'BEGIN', action });
    else if (cond === 'END') rules.push({ type: 'END', action });
    else if (!cond) rules.push({ type: 'always', action: action || 'print' });
    else rules.push({ type: 'cond', cond, action: action || 'print' });
  }
  return rules;
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function field(expr, fields, line) {
  // $NF es el último campo; $(NF-1) el penúltimo.
  if (expr === '$NF') return fields.length ? fields[fields.length - 1] : '';
  const rel = expr.match(/^\$\(NF-(\d+)\)$/);
  if (rel) {
    const idx = fields.length - 1 - parseInt(rel[1], 10);
    return idx >= 0 ? fields[idx] : '';
  }
  const m = expr.match(/^\$(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n === 0 ? line : fields[n - 1] != null ? fields[n - 1] : '';
}

function evalAwk(expr, fields, vars, line) {
  expr = expr.trim();
  if (expr === '') return '';
  if (/^".*"$/.test(expr)) return expr.slice(1, -1);
  const f = field(expr, fields, line);
  if (f !== null) return f;
  if (expr in vars) return vars[expr];
  if (/^-?[\d.]+$/.test(expr)) return parseFloat(expr);
  // aritmética simple sobre campos y variables
  const arith = expr.match(/^(.+?)\s*([+\-*/])\s*(.+)$/);
  if (arith) {
    const a = num(evalAwk(arith[1], fields, vars, line));
    const b = num(evalAwk(arith[3], fields, vars, line));
    return arith[2] === '+' ? a + b : arith[2] === '-' ? a - b : arith[2] === '*' ? a * b : a / b;
  }
  return expr;
}

function matchCond(cond, fields, vars, line) {
  cond = cond.trim();
  if (/^\/.*\/$/.test(cond)) return new RegExp(cond.slice(1, -1)).test(line);
  const m = cond.match(/^(.+?)\s*(==|!=|>=|<=|>|<|~)\s*(.+)$/);
  if (m) {
    const left = evalAwk(m[1], fields, vars, line);
    const rightRaw = m[3].trim();
    if (m[2] === '~') return new RegExp(rightRaw.replace(/^\/|\/$/g, '')).test(String(left));
    const right = evalAwk(rightRaw, fields, vars, line);
    const bothNum = !isNaN(parseFloat(left)) && !isNaN(parseFloat(right));
    const a = bothNum ? num(left) : String(left);
    const b = bothNum ? num(right) : String(right);
    switch (m[2]) {
      case '==': return a === b;
      case '!=': return a !== b;
      case '>': return a > b;
      case '<': return a < b;
      case '>=': return a >= b;
      case '<=': return a <= b;
    }
  }
  return Boolean(evalAwk(cond, fields, vars, line));
}
