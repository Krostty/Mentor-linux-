// =====================================================================
// Micro-animaciones de recompensa
//
// Tres momentos merecen una animación en una app de práctica: cuando
// aciertas, cuando ganas XP y cuando desbloqueas algo. El resto —abrir
// una pantalla, plegar un bloque— se resuelve con CSS y transiciones
// cortas, porque una animación que se ve dos veces encanta y a la
// vigésima estorba.
//
// Reglas que se respetan aquí:
//   1. Nada dura más de 900 ms ni bloquea la interacción.
//   2. Todo se apaga con `prefers-reduced-motion: reduce`.
//   3. Nada se anima con `left`/`top`: solo `transform` y `opacity`, que
//      el navegador compone en la GPU y no reflotan la página.
//   4. Los elementos volantes viven en su propia capa y se autodestruyen.
// =====================================================================

export const menosMovimiento = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Suavizado: rápido al principio, remansado al final.
const suave = (t) => 1 - Math.pow(1 - t, 3);

// Cuenta un número de `desde` a `hasta` pintándolo con `pintar`. Devuelve
// una función para cancelarla si el valor vuelve a cambiar antes de acabar.
export function contarHasta(desde, hasta, pintar, ms = 650) {
  if (desde === hasta) { pintar(hasta); return () => {}; }
  if (menosMovimiento()) { pintar(hasta); return () => {}; }
  const inicio = performance.now();
  let cancelado = false;
  const paso = (ahora) => {
    if (cancelado) return;
    const t = Math.min(1, (ahora - inicio) / ms);
    pintar(Math.round(desde + (hasta - desde) * suave(t)));
    if (t < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
  return () => { cancelado = true; };
}

// Capa donde viven las piezas volantes: por encima de todo y sin capturar
// ningún clic.
function capa() {
  let el = document.getElementById('capa-animacion');
  if (!el) {
    el = document.createElement('div');
    el.id = 'capa-animacion';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

function centro(elemento) {
  const c = elemento.getBoundingClientRect();
  return { x: c.left + c.width / 2, y: c.top + c.height / 2 };
}

// «+25 XP» que sale de la tarjeta resuelta y aterriza en el marcador de la
// cabecera. Es la conexión visual entre lo que acabas de hacer y el número
// que sube: sin ella, el contador cambia solo y no se lee como consecuencia.
export function volarXp(xp, origen, destino = document.getElementById('ficha-xp')) {
  if (!xp || !destino || menosMovimiento()) return;
  const desde = origen ? centro(origen) : { x: innerWidth / 2, y: innerHeight * 0.6 };
  const hasta = centro(destino);

  const pieza = document.createElement('span');
  pieza.className = 'xp-volante';
  pieza.textContent = `+${xp} XP`;
  pieza.style.transform = `translate(${desde.x}px, ${desde.y}px) translate(-50%, -50%)`;
  capa().appendChild(pieza);

  const animacion = pieza.animate([
    { transform: `translate(${desde.x}px, ${desde.y}px) translate(-50%, -50%) scale(.7)`, opacity: 0 },
    { transform: `translate(${desde.x}px, ${desde.y - 46}px) translate(-50%, -50%) scale(1.12)`, opacity: 1, offset: .28 },
    { transform: `translate(${hasta.x}px, ${hasta.y}px) translate(-50%, -50%) scale(.6)`, opacity: 0 },
  ], { duration: 820, easing: 'cubic-bezier(.35,.85,.4,1)' });

  animacion.onfinish = () => {
    pieza.remove();
    destino.removeAttribute('data-sube');
    void destino.offsetWidth;
    destino.setAttribute('data-sube', '');
  };
}

// Onda de acierto: un anillo que se expande desde la tarjeta resuelta. Dice
// «esto ha salido bien» sin tapar el contenido ni pedir un clic.
export function ondaAcierto(elemento) {
  if (!elemento || menosMovimiento()) return;
  const onda = document.createElement('i');
  onda.className = 'onda-acierto';
  elemento.appendChild(onda);
  onda.animate([
    { transform: 'scale(.82)', opacity: .55 },
    { transform: 'scale(1.04)', opacity: 0 },
  ], { duration: 620, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => onda.remove();
}

// Brillo que barre una medalla recién conseguida o una tarjeta destacada.
export function destello(elemento) {
  if (!elemento || menosMovimiento()) return;
  const brillo = document.createElement('i');
  brillo.className = 'destello';
  elemento.appendChild(brillo);
  brillo.animate([
    { transform: 'translateX(-120%) rotate(18deg)' },
    { transform: 'translateX(220%) rotate(18deg)' },
  ], { duration: 900, easing: 'cubic-bezier(.3,.7,.4,1)' }).onfinish = () => brillo.remove();
}

// Las barras de progreso crecen desde donde estaban, no aparecen ya llenas.
// Se llama después de pintar: lee el ancho final del DOM y lo interpola.
export function animarBarras(raiz = document, previos = new Map()) {
  if (menosMovimiento()) return;
  raiz.querySelectorAll('.barra > i').forEach((barra) => {
    const destino = barra.style.width || '0%';
    const clave = barra.parentElement?.dataset?.clave || '';
    const anterior = previos.get(clave) || '0%';
    if (anterior === destino) return;
    barra.animate([{ width: anterior }, { width: destino }], {
      duration: 700, easing: 'cubic-bezier(.2,.8,.3,1)',
    });
  });
}
