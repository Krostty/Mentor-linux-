// Cobertura de los comandos añadidos para salas, máquinas y Wargame.
import { Shell } from '../js/engine/shell.js';
import { COMMANDS } from '../js/engine/commands/index.js';
import { stripMarks } from '../js/engine/commands/util.js';
import { snapshot } from '../js/data/snapshots.js';
import { MAQUINAS } from '../js/data/maquinas.js';

let ok = 0;
let mal = 0;
function probar(nombre, fn) { try { const r = fn(); if (r) ok++; else { mal++; console.error(`  ✗ ${nombre}`); } } catch (e) { mal++; console.error(`  ✗ ${nombre}: ${e.message}`); } }
function shell(snap = 'profesional', extra = {}) { return new Shell({ fs: snapshot(snap), commands: COMMANDS, user: 'user', ...extra }); }
function run(sh, cmd) { const r = sh.run(cmd); return { ...r, output: stripMarks(r.output) }; }

console.log('\n▸ Herramientas profesionales');
probar('strings extrae texto legible', () => /TOKEN=LINUX/.test(run(shell('avanzado'), 'strings /home/user/firmas.bin').output));
probar('file reconoce ELF', () => /ELF/.test(run(shell('avanzado'), 'file /home/user/firmas.bin').output));
probar('lsattr muestra inmutable', () => { const sh = shell('avanzado', { user: 'root' }); run(sh, 'chattr +i /home/user/inmutable.conf'); return /^----i/.test(run(sh, 'lsattr /home/user/inmutable.conf').output); });
probar('chattr cambia atributos como root', () => { const sh = shell('avanzado', { user: 'root' }); run(sh, 'chattr +i /home/user/inmutable.conf'); run(sh, 'chattr -i /home/user/inmutable.conf'); return /^--------------/.test(run(sh, 'lsattr /home/user/inmutable.conf').output); });
probar('git status funciona', () => { const sh = shell(); run(sh, 'cd repo && git init'); return /rama main/i.test(run(sh, 'git status').output); });
probar('tmux crea y lista sesión', () => { const sh = shell(); run(sh, 'tmux new -s mentor'); return /mentor/.test(run(sh, 'tmux ls').output); });
probar('vim abre un archivo simulado', () => run(shell(), 'vim notas.txt').code === 0);
probar('nmap detecta servicios de máquina', () => { const m = MAQUINAS[0]; const sh = shell(m.snapshot, { user: 'kali', machine: structuredClone(m.profile), hostname: 'attackbox' }); const out = run(sh, `nmap -sV ${m.ip}`).output; return m.profile.ports.every((p) => out.includes(String(p.port)) && out.includes(p.service)); });
probar('nc obtiene banner', () => { const m = MAQUINAS[0]; const sh = shell(m.snapshot, { user: 'kali', machine: structuredClone(m.profile) }); return /SSH|HTTP/.test(run(sh, `nc ${m.ip} ${m.profile.ports[0].port}`).output); });
probar('curl enumera página simulada', () => { const m = MAQUINAS[0]; const sh = shell(m.snapshot, { user: 'kali', machine: structuredClone(m.profile) }); return run(sh, `curl http://${m.host}/robots.txt`).output.includes(m.profile.token); });
probar('ssh se bloquea antes de enumerar', () => { const m = MAQUINAS[0]; const sh = shell(m.snapshot, { user: 'kali', machine: structuredClone(m.profile) }); return run(sh, `ssh ${m.user}@${m.host}`).code !== 0; });
probar('ssh entra tras desbloquear acceso', () => { const m = MAQUINAS[0]; const profile = structuredClone(m.profile); profile.accessUnlocked = true; const sh = shell(m.snapshot, { user: 'kali', machine: profile, hostname: 'attackbox', groupMap: m.groupMap }); return run(sh, `ssh ${m.user}@${m.host}`).code === 0 && sh.user === m.user; });

console.log(`${ok} pruebas nuevas de shell pasadas, ${mal} fallidas`);
process.exit(mal ? 1 : 0);
