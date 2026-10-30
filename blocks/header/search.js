/**
 * Buscador del header: lupa que abre un campo de texto sobre la barra de navegación.
 * Comportamiento equivalente al de main.js del blog actual:
 *  - Lupa: abre/cierra el campo (y avisa con onToggle para que el header cierre el menú).
 *    El foco pasa al campo tras una pausa (focusDelay).
 *  - Enter: lanza la búsqueda solo si el texto tiene minLength caracteres o más.
 *    El formulario es GET: <action>?<param>=TERMINO
 *  - Escape en el campo: cierra el buscador y devuelve el foco a la lupa.
 *  - X: en escritorio cierra el buscador; en móvil (campo siempre visible) vacía el campo.
 *
 * Devuelve { element, setOpen, isOpen }.
 */

const DEFAULTS = {
  action: 'https://www.mutua.es/blog/buscador/',
  param: 'q',
  placeholder: 'BUSCAR EN EL BLOG...',
  minLength: 3, // el original lanza la búsqueda con más de 2 caracteres
  focusDelay: 700, // ms hasta enfocar el campo al abrir (como el original)
  isMobile: () => false,
  onToggle: null, // se llama al pulsar la lupa, antes de abrir/cerrar
};

export default function buildSearch(options = {}) {
  const {
    action, param, placeholder, minLength, focusDelay, isMobile, onToggle,
  } = { ...DEFAULTS, ...options };

  const wrapper = document.createElement('div');
  wrapper.className = 'header-search';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'header-search-toggle';
  toggle.setAttribute('aria-label', 'Buscador');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'header-search-form');

  const form = document.createElement('form');
  form.id = 'header-search-form';
  form.className = 'header-search-form';
  form.action = action;
  form.method = 'GET';
  form.acceptCharset = 'UTF-8';
  form.setAttribute('role', 'search');
  form.hidden = true;

  const label = document.createElement('label');
  label.htmlFor = 'header-search-input';
  label.className = 'sr-only';
  label.textContent = 'Texto de búsqueda';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'header-search-input';
  input.name = param;
  input.placeholder = placeholder;
  input.autocomplete = 'off';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'header-search-close';
  close.setAttribute('aria-label', 'Oculta el buscador');

  form.append(label, input, close);
  wrapper.append(toggle, form);

  const isOpen = () => !form.hidden;

  const setOpen = (open) => {
    form.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };

  const isValid = () => input.value.trim().length >= minLength;

  // Lupa: cierra el menú (si lo hay abierto), abre/cierra el campo y lo enfoca tras una pausa
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    if (onToggle) onToggle();
    setOpen(!isOpen());
    setTimeout(() => {
      if (isOpen()) input.focus();
    }, focusDelay);
  });

  // X: escritorio cierra; móvil (campo siempre visible) vacía y enfoca
  close.addEventListener('click', (e) => {
    e.preventDefault();
    if (isMobile()) {
      input.value = '';
      input.focus();
    } else {
      setOpen(false);
      toggle.focus();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isValid()) form.submit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      toggle.focus();
    }
  });

  // Por si el envío llega por otra vía: nunca con menos caracteres de los mínimos
  form.addEventListener('submit', (e) => {
    if (!isValid()) e.preventDefault();
  });

  return { element: wrapper, setOpen, isOpen };
}
