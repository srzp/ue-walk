/**
 * Header del blog de Mutua Madrileña para EDS + xwalk.
 *
 * Marcado generado:
 *   .rowLogo > .showMenu, .logo, .claim (opcional), .goMutua (.logoMM / .icoMM)
 *   #mainNav > ul > li (categorías) + li.search (lupa + campo, ver search.js)
 *
 * Las categorías son las páginas hijas directas de la home del blog,
 * ordenadas por `nav-order` (metadato de página).
 *
 * Origen de las categorías, en este orden:
 *   1. índice (CONFIG.indexUrl)
 *   2. última copia buena guardada en localStorage
 *   3. nav-fallback.json (menú estático del repositorio)
 */

import buildSearch from './search.js';

const CONFIG = {
  homePath: '/home', // página home cuyos hijos se listan
  indexUrl: '/home/nav-index.json', // índice pequeño solo con hijos directos
  search: {
    action: 'https://www.mutua.es/blog/buscador/', // se lanza GET ?q=TERMINO
    param: 'q',
    placeholder: 'BUSCAR EN EL BLOG...',
    minLength: 3, // la búsqueda se lanza con 3 o más caracteres (como el original)
    focusDelay: 700, // ms hasta enfocar el campo al abrir el buscador (como el original)
  },
  fetchTimeoutMs: 5000, // tiempo máximo de espera del índice antes de usar el respaldo
  fallbackUrl: new URL('./nav-fallback.json', import.meta.url), // menú estático de emergencia
  claim: '', // el header actual no muestra claim; ej. 'Encendiendo el futuro de las personas'
  scrollThreshold: 50, // px de scroll (solo escritorio) para añadir .scrolled
  logoOn: { src: '/icons/logo-on.svg', alt: 'Logotipo ON' },
  logoMM: {
    full: '/icons/logo-mm.svg', // .logoMM (arriba del todo)
    icon: '/icons/ico-logo-mm.svg', // .icoMM (al hacer scroll y en móvil)
    href: 'https://www.mutua.es/',
    label: 'Mutua Madrileña (se abre en nueva pestaña)',
  },
};

const MOBILE = window.matchMedia('(max-width: 768px)');

/* ---------- utilidades ---------- */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v !== false && v != null) node.setAttribute(k, v === true ? '' : v);
  });
  node.append(...children.filter(Boolean));
  return node;
}

const img = (src, alt = '', cls = null) => el('img', { src, alt, class: cls });

/** Texto del menú: usa `titulo` (metadato titulo) y, si no existe, `title`. */
const labelOf = (p) => p.titulo || p.title || p.path;

const orderOf = (p) => {
  const n = Number(p.navOrder);
  return p.navOrder === undefined || p.navOrder === '' || Number.isNaN(n) ? Infinity : n;
};

/* ---------- categorías del menú: índice -> caché -> respaldo estático ---------- */

const CACHE_KEY = `header-nav:${CONFIG.indexUrl}`;

/** Pide un JSON con tiempo límite; lanza error si la respuesta no es 2xx. */
async function fetchJson(url) {
  const resp = await fetch(url, { signal: AbortSignal.timeout(CONFIG.fetchTimeoutMs) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** Deja solo las hijas directas de la home, visibles, y las ordena. */
function selectCategories(data = []) {
  const direct = new RegExp(`^${CONFIG.homePath}/[^/]+/?$`);

  return data
    .filter((p) => direct.test(p.path) && p.navHide !== 'true')
    .sort((a, b) => {
      const ao = orderOf(a);
      const bo = orderOf(b);
      if (ao !== bo) return ao < bo ? -1 : 1;
      return labelOf(a).localeCompare(labelOf(b), 'es');
    });
}

function readCache() {
  try {
    const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY));
    return Array.isArray(cached) ? cached : [];
  } catch (e) {
    return [];
  }
}

function writeCache(list) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    // localStorage no disponible (modo privado, cuota...): se ignora
  }
}

async function loadCategories() {
  // 1) índice
  try {
    const { data } = await fetchJson(CONFIG.indexUrl);
    const list = selectCategories(data);
    if (list.length) {
      writeCache(list);
      return list;
    }
    // eslint-disable-next-line no-console
    console.warn(`Índice de navegación sin categorías: ${CONFIG.indexUrl}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Índice de navegación no disponible (${e.message}): ${CONFIG.indexUrl}`);
  }

  // 2) última copia buena guardada en este navegador
  const cached = readCache();
  if (cached.length) {
    // eslint-disable-next-line no-console
    console.warn('Menú: usando la última copia guardada en localStorage');
    return cached;
  }

  // 3) menú estático del repositorio
  try {
    const { data } = await fetchJson(CONFIG.fallbackUrl);
    // eslint-disable-next-line no-console
    console.warn('Menú: usando el respaldo estático nav-fallback.json');
    return selectCategories(data);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`No se pudo cargar ningún menú (${e.message})`);
    return [];
  }
}

/* ---------- bloque ---------- */

export default async function decorate(block) {
  block.textContent = '';

  // destino del enlace "Saltar al contenido principal"
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'mainContainer';

  const skip = el('div', { class: 'skip-link' },
    el('a', { href: '#mainContainer' }, 'Saltar al contenido principal'));

  const showMenu = el('button', {
    type: 'button',
    class: 'showMenu',
    'aria-label': 'Menú principal',
    'aria-expanded': 'false',
    'aria-controls': 'mainNav',
  }, el('span', { class: 'lines' }));

  const logo = el('a', { class: 'logo', href: `${CONFIG.homePath}/` },
    img(CONFIG.logoOn.src, CONFIG.logoOn.alt));

  const claim = CONFIG.claim ? el('p', { class: 'claim' }, CONFIG.claim) : null;

  const goMutua = el('a', {
    class: 'goMutua',
    href: CONFIG.logoMM.href,
    target: '_blank',
    rel: 'noopener noreferrer',
    title: 'Se abre en nueva pestaña',
    'aria-label': CONFIG.logoMM.label,
  }, img(CONFIG.logoMM.full, '', 'logoMM'), img(CONFIG.logoMM.icon, '', 'icoMM'));

  const rowLogo = el('div', { class: 'rowLogo' }, showMenu, logo, claim, goMutua);

  const nav = el('nav', { id: 'mainNav', 'aria-label': 'Principal' });
  const list = el('ul');

  try {
    const categories = await loadCategories();
    categories.forEach((page) => {
      const a = el('a', { href: page.path }, labelOf(page));
      if (window.location.pathname.startsWith(page.path)) {
        a.classList.add('current');
        a.setAttribute('aria-current', 'page');
      }
      list.append(el('li', {}, a));
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('No se pudieron cargar las categorías', e);
  }

  /* Menú móvil. Como en el original, no bloquea el scroll de la página. */
  const closeMenu = () => {
    showMenu.classList.remove('open');
    showMenu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('active');
    nav.removeAttribute('style');
  };

  // Buscador: una sola vez, como último <li> de la lista.
  // Al pulsar la lupa se cierra el menú, como en el original.
  const search = buildSearch({
    ...CONFIG.search,
    isMobile: () => MOBILE.matches,
    onToggle: closeMenu,
  });

  list.append(el('li', { class: 'search' }, search.element));
  nav.append(list);

  block.append(skip, rowLogo, nav);

  // Botón de menú: abre/cierra y cierra el buscador
  showMenu.addEventListener('click', (e) => {
    e.preventDefault();
    search.setOpen(false);
    const open = showMenu.classList.toggle('open');
    nav.classList.toggle('active', open);
    showMenu.setAttribute('aria-expanded', String(open));
    if (open) nav.style.display = 'block';
    else nav.removeAttribute('style');
  });

  // Escape dentro del menú (o en el botón): lo cierra y devuelve el foco al botón
  const onEscape = (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    showMenu.classList.remove('open');
    nav.removeAttribute('style');
    setTimeout(() => {
      nav.classList.remove('active');
      showMenu.setAttribute('aria-expanded', 'false');
      showMenu.focus();
    }, 100);
  };
  nav.addEventListener('keydown', onEscape);
  showMenu.addEventListener('keydown', onEscape);

  /* Estado compacto al hacer scroll: solo en escritorio, como el original */
  const onScroll = () => {
    const compact = window.scrollY > CONFIG.scrollThreshold && !MOBILE.matches;
    block.classList.toggle('scrolled', compact);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Al cambiar entre móvil y escritorio se reinicia el menú y se recalcula el scroll
  MOBILE.addEventListener('change', () => {
    closeMenu();
    onScroll();
  });

  onScroll();
}
