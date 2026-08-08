// Registro único de comandos: el shell recibe este objeto.
import { nav } from './nav.js';
import { files } from './files.js';
import { perms } from './perms.js';
import { text } from './text.js';
import { processes } from './procs.js';
import { net } from './net.js';
import { pkg } from './pkg.js';
import { sysd } from './sysd.js';
import { misc } from './misc.js';
import { sec } from './sec.js';
import { advanced } from './advanced.js';
import { scripts } from './scripts.js';

// El orden importa: `files.cat` es la implementación real de cat y debe ganar
// al fallback interno de text.js.
export const COMMANDS = {
  ...text,
  ...nav,
  ...files,
  ...perms,
  ...processes,
  ...net,
  ...pkg,
  ...sysd,
  ...misc,
  ...sec,
  ...advanced,
  ...scripts,
};

// `sudoList` es un ayudante interno de sec.js, no un comando real.
delete COMMANDS.sudoList;

export const COMMAND_NAMES = Object.keys(COMMANDS).sort();
