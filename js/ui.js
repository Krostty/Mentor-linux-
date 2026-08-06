// Ayudantes de interfaz: formato de texto, avisos y celebraciones.

export function escapar(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Formato ligero para los textos del currículum: **negrita** y `código`.
// Se escapa primero, así que el contenido nunca puede inyectar HTML.
export function formato(texto) {
  return escapar(texto)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function $(selector, raiz = document) {
  return raiz.querySelector(selector);
}

export function $$(selector, raiz = document) {
  return [...raiz.querySelectorAll(selector)];
}

// --- avisos flotantes ------------------------------------------------------

const contenedorBrindis = () => document.getElementById('brindis');

export function brindis(mensaje, tipo = '', ms = 2600) {
  const cont = contenedorBrindis();
  if (!cont) return;
  const el = document.createElement('div');
  el.className = 'brindis-item';
  if (tipo) el.dataset.tipo = tipo;
  el.innerHTML = formato(mensaje);
  cont.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 320);
  }, ms);
}

// --- celebración -----------------------------------------------------------

const COLORES_CHISPA = ['#7CFF4F', '#26E6FF', '#FF3D9A', '#FFC24B'];

function lanzarChispas(contenedor) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 26; i++) {
    const chispa = document.createElement('i');
    chispa.className = 'chispa';
    chispa.style.background = COLORES_CHISPA[i % COLORES_CHISPA.length];
    chispa.style.left = '50%';
    chispa.style.top = '40%';
    chispa.style.setProperty('--dx', Math.random() * 300 - 150 + 'px');
    chispa.style.setProperty('--dy', Math.random() * 260 - 70 + 'px');
    chispa.style.setProperty('--rot', Math.random() * 720 - 360 + 'deg');
    chispa.style.animation = `volar ${700 + Math.random() * 500}ms cubic-bezier(.2,.7,.4,1) forwards`;
    contenedor.appendChild(chispa);
    setTimeout(() => chispa.remove(), 1300);
  }
}

/**
 * Muestra la tarjeta de celebración.
 * @param {object} opciones - marca, titulo, texto, xp, combo, logros, botones
 */
export function celebrar({ marca = '🎉', titulo, texto = '', xp = 0, combo = 0, logros = [], botones = [] }) {
  const cont = document.getElementById('celebracion');
  if (!cont) return;

  const logrosHtml = logros
    .map(
      (l) => `<div class="logro-nuevo">
          <span class="logro-icono">${escapar(l.icono)}</span>
          <span><b>${escapar(l.nombre)}</b><small>${escapar(l.desc)}</small></span>
        </div>`
    )
    .join('');

  cont.innerHTML = `
    <div class="celebracion-tarjeta">
      <div class="celebracion-marca">${escapar(marca)}</div>
      <h2 id="celebracion-titulo">${escapar(titulo)}</h2>
      ${texto ? `<p>${formato(texto)}</p>` : ''}
      ${xp ? `<span class="celebracion-xp">+${xp} XP</span>` : ''}
      ${combo >= 4 ? `<div><span class="celebracion-combo">🔥 combo ×${combo}</span></div>` : ''}
      ${logrosHtml ? `<div style="margin:14px 0 4px;text-align:left">${logrosHtml}</div>` : ''}
      ${botones
        .map(
          (b, i) =>
            `<button class="${b.principal === false ? 'btn-fantasma' : 'btn'}" data-boton="${i}" style="width:100%;margin-top:8px">${escapar(b.texto)}</button>`
        )
        .join('')}
    </div>`;

  cont.dataset.abierta = '';
  lanzarChispas(cont);

  cont.querySelectorAll('[data-boton]').forEach((b) => {
    b.addEventListener('click', () => {
      cerrarCelebracion();
      const accion = botones[Number(b.dataset.boton)].accion;
      if (accion) accion();
    });
  });

  // Foco al primer botón para que el teclado y los lectores de pantalla sigan.
  const primero = cont.querySelector('[data-boton]');
  if (primero) primero.focus();
}

// Los avisos pendientes se descartan al cambiar de vista: si no, uno de la
// pantalla anterior aparece flotando sobre la nueva.
export function limpiarBrindis() {
  const cont = contenedorBrindis();
  if (cont) cont.innerHTML = '';
}

export function cerrarCelebracion() {
  const cont = document.getElementById('celebracion');
  if (cont) delete cont.dataset.abierta;
}

// --- utilidades varias -----------------------------------------------------

export function porcentaje(fraccion) {
  return Math.round(Math.max(0, Math.min(1, fraccion)) * 100);
}

export function vibrar(ms = 12) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {}
  }
}

export function tiempo(segundos) {
  const m = Math.floor(Math.max(0, segundos) / 60);
  const s = Math.max(0, segundos) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
