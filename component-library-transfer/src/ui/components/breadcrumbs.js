import { appendContent, setAttributes } from './dom.js';
import { createIcon } from './icon.js';

function createChevronFallback() {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  const path = document.createElementNS(namespace, 'path');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('d', 'm9 18 6-6-6-6');
  svg.append(path);
  return svg;
}

function createBreadcrumbLabel(item) {
  const tagName = item.headingLevel ? `h${item.headingLevel}` : 'span';
  const label = document.createElement(tagName);
  label.className = ['ds-breadcrumbs__label', item.className].filter(Boolean).join(' ');
  appendContent(label, item.label);

  if (item.id) label.id = item.id;
  if (item.current) label.setAttribute('aria-current', 'page');
  if (item.title) label.title = item.title;

  return label;
}

export function createBreadcrumbs({
  items = [],
  ariaLabel = 'Хлебные крошки',
  className = '',
  attributes = {},
} = {}) {
  const element = document.createElement('nav');
  element.className = ['ds-breadcrumbs', className].filter(Boolean).join(' ');
  element.setAttribute('aria-label', ariaLabel);
  setAttributes(element, attributes);

  const list = document.createElement('ol');
  list.className = 'ds-breadcrumbs__list';
  let current = null;

  items.forEach((item, index) => {
    const listItem = document.createElement('li');
    listItem.className = ['ds-breadcrumbs__item', item.current ? 'is-current' : '']
      .filter(Boolean)
      .join(' ');

    if (index > 0) {
      listItem.append(createIcon({
        name: 'chevron-right',
        size: 14,
        className: 'ds-breadcrumbs__separator',
        fallback: createChevronFallback,
      }));
    }

    const label = createBreadcrumbLabel(item);
    listItem.append(label);
    list.append(listItem);
    if (item.current) current = label;
  });

  element.append(list);
  return { element, list, current };
}
