/**
 * Buscador para el header: una lupa que abre un campo de texto.
 * Al pulsar Enter se navega a:
 *   <action>?<param>=TERMINO
 * p. ej. https://www.mutua.es/blog/buscador/?q=TERMINO
 * (es un <form method="GET">, así que el navegador codifica el término solo).
 *
 * aria-expanded va en el botón de la lupa (quien abre/cierra el campo),
 * y aria-controls apunta al formulario.
 */

const DEFAULTS = {
  action: 'https://www.mutua.es/blog/buscador/',
  param: 'q',
  placeholder: 'Buscar en el blog...',
};

export default function buildSearch(options = {}) {
  const { action, param, placeholder } = { ...DEFAULTS, ...options };

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

  const setOpen = (open) => {
    form.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  };

  toggle.addEventListener('click', () => setOpen(form.hidden));

  // X: vacía el campo, cierra y devuelve el foco a la lupa
  close.addEventListener('click', () => {
    input.value = '';
    setOpen(false);
    toggle.focus();
  });

  // Enter: no lanzar búsquedas vacías
  form.addEventListener('submit', (e) => {
    if (!input.value.trim()) {
      e.preventDefault();
      input.focus();
    }
  });

  // Escape cierra y devuelve el foco a la lupa
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !form.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Clic fuera cierra
  document.addEventListener('click', (e) => {
    if (!form.hidden && !wrapper.contains(e.target)) setOpen(false);
  });

  return wrapper;
}
