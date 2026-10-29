/**
 * Header del blog de Mutua Madrileña para EDS + xwalk.
 *
 * Marcado generado:
 *   .rowLogo > .showMenu, .logo, .claim (opcional), .goMutua (.logoMM / .icoMM)
 *   #mainNav > ul > li (categorías) + li.search (lupa + campo, ver search.js)
 *
 * Las categorías son las páginas hijas directas de la home del blog,
 * ordenadas por `nav-order` (metadato de página).
 */

import buildSearch from './search.js';

const CONFIG = {
  homePath: '/home', // página home cuyos hijos se listan
  indexUrl: '/home/nav-index.json', // índice pequeño solo con hijos directos
  search: {
    action: 'https://www.mutua.es/blog/buscador/', // se lanza GET ?q=TERMINO
    param: 'q',
    placeholder: 'BUSCAR EN EL BLOG...',
  },
  claim: '', // el header actual no muestra claim; ej. 'Encendiendo el futuro de las personas'
  scrollThreshold: 20, // px de scroll a partir de los cuales se añade .scrolled
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

async function fetchCategories() {
  const resp = await fetch(CONFIG.indexUrl);
  if (!resp.ok) {
    // eslint-disable-next-line no-console
    console.warn(`Índice de navegación no disponible (${resp.status}): ${CONFIG.indexUrl}`);
    return [];
  }
  const { data } = await resp.json();
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
    rel: 'noopener',
    title: 'Se abre en nueva pestaña',
    'aria-label': CONFIG.logoMM.label,
  }, img(CONFIG.logoMM.full, '', 'logoMM'), img(CONFIG.logoMM.icon, '', 'icoMM'));

  const rowLogo = el('div', { class: 'rowLogo' }, showMenu, logo, claim, goMutua);

  const nav = el('nav', { id: 'mainNav', 'aria-label': 'Principal' });
  const list = el('ul');

  try {
    const categories = await fetchCategories();
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

  // Buscador: una sola vez, como último <li> de la lista
  list.append(el('li', { class: 'search' }, buildSearch(CONFIG.search)));
  nav.append(list);

  block.append(skip, rowLogo, nav);

  /* menú móvil */
  const setMenu = (open) => {
    nav.classList.toggle('active', open);
    showMenu.classList.toggle('open', open);
    showMenu.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('fixBody', open);
  };
  showMenu.addEventListener('click', () => setMenu(!nav.classList.contains('active')));
  MOBILE.addEventListener('change', () => setMenu(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) {
      setMenu(false);
      showMenu.focus();
    }
  });

  /* estado compacto al hacer scroll */
  const onScroll = () => {
    block.classList.toggle('scrolled', window.scrollY > CONFIG.scrollThreshold);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
