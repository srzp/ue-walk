/**
 * Buscador para el header: una lupa que abre un campo de texto.
 * Al pulsar Enter se navega a:
 *   https://www.mutua.es/blog/buscador/?q=TERMINO
 * (es un <form method="GET">, así que el navegador codifica el término solo).
 */

const SEARCH_URL = 'https://www.mutua.es/blog/buscador/';
const SEARCH_PARAM = 'q';
const PLACEHOLDER = 'Buscar en el blog...';

export default function buildSearch() {
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
  form.action = SEARCH_URL;
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
  input.name = SEARCH_PARAM;
  input.placeholder = PLACEHOLDER;
  input.autocomplete = 'off';

  form.append(label, input);
  wrapper.append(toggle, form);

  const setOpen = (open) => {
    form.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  };

  toggle.addEventListener('click', () => setOpen(form.hidden));

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
