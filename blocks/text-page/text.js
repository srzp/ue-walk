import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Bloque genérico para páginas de texto (condiciones legales, política de cookies...).
 *
 * Campos del modelo, en este orden (ver _text-page.json):
 *   1. title -> título visible de la página (<h1>)
 *   2. text  -> contenido enriquecido (subtítulos, párrafos, listas, enlaces)
 * Además, el campo `classes` añade una variante de estilo al bloque (p. ej. headings-md).
 */

/** Elemento con la instrumentación del Universal Editor (data-aue-*), si existe. */
function instrumented(cell) {
  if (!cell) return null;
  return cell.matches('[data-aue-prop]') ? cell : cell.querySelector('[data-aue-prop]');
}

/** Enlaces a otros dominios: nueva pestaña, como en el blog actual. */
function markExternalLinks(root) {
  root.querySelectorAll('a[href^="http"]').forEach((a) => {
    let external = false;
    try {
      external = new URL(a.href).origin !== window.location.origin;
    } catch (e) {
      // href no válido: se deja como está
    }
    if (!external) return;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    if (!a.title) a.title = 'Abre en nueva pestaña';
  });
}

export default function decorate(block) {
  const [titleCell, textCell] = [...block.children].map((row) => row.firstElementChild);
  const nodes = [];

  // 1) Título -> h1
  const title = titleCell?.textContent.trim();
  if (title) {
    const h1 = document.createElement('h1');
    h1.className = 'text-page-title';
    h1.textContent = title;
    const source = instrumented(titleCell);
    if (source) moveInstrumentation(source, h1);
    nodes.push(h1);
  }

  // 2) Contenido enriquecido: se conserva el HTML tal cual lo escribe el autor
  if (textCell) {
    const content = document.createElement('div');
    content.className = 'text-page-content';
    const source = instrumented(textCell);
    if (source) moveInstrumentation(source, content);
    content.append(...textCell.childNodes);
    markExternalLinks(content);
    nodes.push(content);
  }

  block.replaceChildren(...nodes);
}
