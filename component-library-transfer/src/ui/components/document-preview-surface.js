import { createButton } from './button.js';
import { createDocumentPreviewIcon } from './document-preview-icon.js';
import { setAttributes } from './dom.js';

function bindTransientScrollState(element) {
  let timer = 0;
  const handleScroll = () => {
    element.classList.add('is-scrolling');
    window.clearTimeout(timer);
    timer = window.setTimeout(() => element.classList.remove('is-scrolling'), 720);
  };
  element.addEventListener('scroll', handleScroll, { passive: true });
  return () => {
    window.clearTimeout(timer);
    element.removeEventListener('scroll', handleScroll);
  };
}

export function createDocumentPreviewSurface({
  format = 'DOCX',
  page = 1,
  pageCount = 1,
  zoom = 90,
  defaultZoom = 90,
  minZoom = 50,
  maxZoom = 300,
  zoomStep = 10,
  content,
  className = '',
  attributes = {},
  onPageChange,
  onZoomChange,
} = {}) {
  let currentFormat = String(format || 'DOCX').toUpperCase();
  let currentPage = Math.max(1, Number(page) || 1);
  let currentPageCount = Math.max(1, Number(pageCount) || 1);
  const normalizedDefaultZoom = Math.max(minZoom, Math.min(maxZoom, Number(defaultZoom) || 90));
  let currentZoom = Math.max(minZoom, Math.min(maxZoom, Number(zoom) || normalizedDefaultZoom));

  const element = document.createElement('section');
  element.className = ['ds-document-preview-surface', className].filter(Boolean).join(' ');
  element.setAttribute('aria-label', 'Рабочая область документа');
  setAttributes(element, attributes);

  const scroller = document.createElement('div');
  scroller.className = 'ds-document-preview-surface__scroller';
  const surface = document.createElement('div');
  surface.className = 'ds-document-preview-surface__document';
  const contentHost = document.createElement('div');
  contentHost.className = 'ds-document-preview-surface__content';
  surface.append(contentHost);
  scroller.append(surface);

  const controls = document.createElement('div');
  controls.className = 'ds-document-preview-surface__controls';
  controls.setAttribute('aria-label', 'Навигация по документу и масштаб');
  const previous = createButton({
    label: 'Предыдущая страница',
    icon: createDocumentPreviewIcon('chevron-left'),
    iconOnly: true,
    ariaLabel: 'Предыдущая страница',
    variant: 'text',
    size: 'small',
    className: 'ds-document-preview-surface__control',
    onClick: () => setPage(currentPage - 1, { emit: true }),
  });
  const pageLabel = document.createElement('span');
  pageLabel.className = 'ds-document-preview-surface__page-label';
  const next = createButton({
    label: 'Следующая страница',
    icon: createDocumentPreviewIcon('chevron-right'),
    iconOnly: true,
    ariaLabel: 'Следующая страница',
    variant: 'text',
    size: 'small',
    className: 'ds-document-preview-surface__control',
    onClick: () => setPage(currentPage + 1, { emit: true }),
  });
  const pageZoomSeparator = document.createElement('span');
  pageZoomSeparator.className = 'ds-document-preview-surface__separator';
  pageZoomSeparator.setAttribute('aria-hidden', 'true');
  const zoomOut = createButton({
    label: 'Уменьшить масштаб',
    icon: createDocumentPreviewIcon('zoom-out'),
    iconOnly: true,
    ariaLabel: 'Уменьшить масштаб',
    variant: 'text',
    size: 'small',
    className: 'ds-document-preview-surface__control',
    onClick: () => setZoom(currentZoom - zoomStep, { emit: true }),
  });
  const zoomLabel = document.createElement('span');
  zoomLabel.className = 'ds-document-preview-surface__zoom-label';
  const zoomIn = createButton({
    label: 'Увеличить масштаб',
    icon: createDocumentPreviewIcon('zoom-in'),
    iconOnly: true,
    ariaLabel: 'Увеличить масштаб',
    variant: 'text',
    size: 'small',
    className: 'ds-document-preview-surface__control',
    onClick: () => setZoom(currentZoom + zoomStep, { emit: true }),
  });
  const zoomResetSeparator = document.createElement('span');
  zoomResetSeparator.className = 'ds-document-preview-surface__separator';
  zoomResetSeparator.setAttribute('aria-hidden', 'true');
  const resetZoom = createButton({
    label: 'Сбросить масштаб',
    icon: createDocumentPreviewIcon('rotate-ccw'),
    iconOnly: true,
    ariaLabel: `Сбросить масштаб до ${normalizedDefaultZoom}%`,
    variant: 'text',
    size: 'small',
    className: 'ds-document-preview-surface__control ds-document-preview-surface__reset',
    attributes: { title: `Сбросить масштаб до ${normalizedDefaultZoom}%` },
    onClick: () => setZoom(normalizedDefaultZoom, { emit: true }),
  });
  controls.append(
    previous,
    pageLabel,
    next,
    pageZoomSeparator,
    zoomOut,
    zoomLabel,
    zoomIn,
    zoomResetSeparator,
    resetZoom,
  );
  element.append(scroller, controls);
  const destroyScrollBinding = bindTransientScrollState(scroller);

  function sync() {
    currentPage = Math.max(1, Math.min(currentPageCount, currentPage));
    element.dataset.format = currentFormat;
    surface.style.setProperty('--document-preview-zoom', String(currentZoom / 100));
    pageLabel.textContent = `${currentFormat === 'XLSX' ? 'Лист' : 'Страница'} ${currentPage} из ${currentPageCount}`;
    zoomLabel.textContent = `${currentZoom}%`;
    previous.disabled = currentPage <= 1;
    next.disabled = currentPage >= currentPageCount;
    zoomOut.disabled = currentZoom <= minZoom;
    zoomIn.disabled = currentZoom >= maxZoom;
    resetZoom.disabled = currentZoom === normalizedDefaultZoom;
  }

  function setPage(nextPage, { emit = false } = {}) {
    const normalized = Math.max(1, Math.min(currentPageCount, Number(nextPage) || 1));
    if (normalized === currentPage) return;
    currentPage = normalized;
    sync();
    scroller.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (emit) onPageChange?.(currentPage);
  }

  function setZoom(nextZoom, { emit = false } = {}) {
    const normalized = Math.max(minZoom, Math.min(maxZoom, Number(nextZoom) || currentZoom));
    if (normalized === currentZoom) return;
    currentZoom = normalized;
    sync();
    if (emit) onZoomChange?.(currentZoom);
  }

  const setContent = nextContent => {
    contentHost.replaceChildren();
    if (nextContent instanceof Node) contentHost.append(nextContent);
  };

  setContent(content);
  sync();

  return {
    element,
    scroller,
    surface,
    contentHost,
    controls,
    resetZoom,
    setContent,
    setPage,
    setZoom,
    update({ format: nextFormat, page: nextPage, pageCount: nextPageCount, zoom: nextZoom, content: nextContent } = {}) {
      if (nextFormat !== undefined) currentFormat = String(nextFormat || 'DOCX').toUpperCase();
      if (nextPageCount !== undefined) currentPageCount = Math.max(1, Number(nextPageCount) || 1);
      if (nextPage !== undefined) currentPage = Math.max(1, Number(nextPage) || 1);
      if (nextZoom !== undefined) currentZoom = Math.max(minZoom, Math.min(maxZoom, Number(nextZoom) || currentZoom));
      if (nextContent !== undefined) setContent(nextContent);
      sync();
    },
    destroy() {
      destroyScrollBinding();
    },
  };
}
