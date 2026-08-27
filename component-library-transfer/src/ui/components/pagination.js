import { createButton } from './button.js';

function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 4, 'ellipsis', totalPages];
  if (currentPage >= totalPages - 2) return [1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}

function normalizePage(page, totalPages) {
  const numericPage = Number(page);
  const safePage = Number.isFinite(numericPage) ? Math.trunc(numericPage) : 1;
  return Math.min(totalPages, Math.max(1, safePage));
}

function normalizeTotalPages(totalPages) {
  const numericTotal = Number(totalPages);
  return Number.isFinite(numericTotal) ? Math.max(1, Math.trunc(numericTotal)) : 1;
}

export function createPagination({ currentPage = 1, totalPages = 1, label = 'Постраничная навигация', onChange } = {}) {
  const element = document.createElement('nav');
  element.className = 'ds-pagination';
  element.setAttribute('aria-label', label);

  const normalizedTotalPages = normalizeTotalPages(totalPages);
  let current = normalizePage(currentPage, normalizedTotalPages);
  const render = () => {
    element.replaceChildren();
    if (normalizedTotalPages <= 1) return;

    const previous = createButton({
      label: '‹',
      variant: 'text',
      size: 'small',
      ariaLabel: 'Предыдущая страница',
      disabled: current === 1,
      className: 'ds-pagination-arrow',
      onClick: () => setCurrent(current - 1),
    });
    element.append(previous);

    getVisiblePages(current, normalizedTotalPages).forEach(page => {
      if (page === 'ellipsis') {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'ds-pagination-item ds-pagination-item--ellipsis';
        ellipsis.textContent = '…';
        ellipsis.setAttribute('aria-hidden', 'true');
        element.append(ellipsis);
        return;
      }

      const button = createButton({
        label: page,
        variant: 'text',
        size: 'small',
        ariaLabel: `Страница ${page}`,
        className: `ds-pagination-item${page === current ? ' ds-pagination-item--active' : ''}`,
        attributes: page === current ? { 'aria-current': 'page' } : {},
        onClick: () => setCurrent(page),
      });
      element.append(button);
    });

    const next = createButton({
      label: '›',
      variant: 'text',
      size: 'small',
      ariaLabel: 'Следующая страница',
      disabled: current === normalizedTotalPages,
      className: 'ds-pagination-arrow',
      onClick: () => setCurrent(current + 1),
    });
    element.append(next);
  };

  const setCurrent = nextPage => {
    const normalized = normalizePage(nextPage, normalizedTotalPages);
    if (normalized === current) return;
    current = normalized;
    render();
    onChange?.(current);
  };

  render();
  return { element, getCurrent: () => current, setCurrent, render };
}
