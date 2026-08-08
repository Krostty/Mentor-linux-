// =====================================================================
// Sonidos de la app
//
// Sintetizados con WebAudio en vez de reproducir archivos: pesan cero,
// no hay nada que precachear y suenan igual sin conexión. Son avisos
// cortos, de teclado mecánico y arcade suave, no melodías.
//
// Reglas de convivencia con el móvil:
//   · El AudioContext se crea en el PRIMER gesto del usuario. Crearlo
//     antes lo deja «suspended» en iOS y el primer sonido se pierde.
//   · Si el usuario apaga los sonidos en Perfil, no se crea nada.
//   · Ningún sonido dura más de 400 ms ni pasa de un volumen discreto.
// =====================================================================

const PERFILES = {
  // Toque neutro al pulsar algo que navega.
  toque: { notas: [[520, 0, .05]], tipo: 'triangle', vol: .16 },
  // Tecla de la consola: click corto y seco.
  tecla: { notas: [[880, 0, .028]], tipo: 'square', vol: .07 },
  // Acierto: dos notas que suben.
  acierto: { notas: [[660, 0, .09], [990, .07, .13]], tipo: 'triangle', vol: .2 },
  // Fallo: una nota grave, breve, sin dramatismo.
  fallo: { notas: [[220, 0, .12], [165, .09, .16]], tipo: 'sine', vol: .18 },
  // Lección terminada: arpegio de tres.
  leccion: { notas: [[523, 0, .1], [659, .08, .1], [784, .16, .22]], tipo: 'triangle', vol: .2 },
  // Subida de nivel: arpegio de cuatro, más brillante.
  nivel: { notas: [[523, 0, .1], [659, .08, .1], [784, .16, .1], [1047, .24, .3]], tipo: 'triangle', vol: .22 },
  // Algo se abre: nota que sube deslizando.
  desbloqueo: { notas: [[392, 0, .1], [587, .06, .1], [880, .13, .26]], tipo: 'sine', vol: .2 },
  // Bandera capturada o máquina resuelta.
  logro: { notas: [[784, 0, .09], [1047, .07, .09], [1319, .15, .28]], tipo: 'triangle', vol: .22 },
};

let ctx = null;
let permitido = true;

function contexto() {
  if (!permitido) return null;
  const Constructor = window.AudioContext || window.webkitAudioContext;
  if (!Constructor) return null;
  if (!ctx) ctx = new Constructor();
  // Safari suspende el contexto al volver de segundo plano.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function reproducir(nombre) {
  const perfil = PERFILES[nombre];
  if (!perfil) return;
  const audio = contexto();
  if (!audio) return;

  const ahora = audio.currentTime;
  for (const [hz, retardo, duracion] of perfil.notas) {
    const osc = audio.createOscillator();
    const ganancia = audio.createGain();
    osc.type = perfil.tipo;
    osc.frequency.setValueAtTime(hz, ahora + retardo);

    // Envolvente: ataque muy corto y caída exponencial. Sin esto, cortar
    // el oscilador de golpe produce un chasquido.
    const pico = ahora + retardo + .008;
    ganancia.gain.setValueAtTime(.0001, ahora + retardo);
    ganancia.gain.exponentialRampToValueAtTime(perfil.vol, pico);
    ganancia.gain.exponentialRampToValueAtTime(.0001, ahora + retardo + duracion);

    osc.connect(ganancia).connect(audio.destination);
    osc.start(ahora + retardo);
    osc.stop(ahora + retardo + duracion + .02);
  }
}

export const sonido = {
  // El store decide; la app solo avisa de los cambios.
  configurar(activo) {
    permitido = activo !== false;
    if (!permitido && ctx) { ctx.close().catch(() => {}); ctx = null; }
  },
  get activo() { return permitido; },
  toque: () => reproducir('toque'),
  tecla: () => reproducir('tecla'),
  acierto: () => reproducir('acierto'),
  fallo: () => reproducir('fallo'),
  leccion: () => reproducir('leccion'),
  nivel: () => reproducir('nivel'),
  desbloqueo: () => reproducir('desbloqueo'),
  logro: () => reproducir('logro'),
};
