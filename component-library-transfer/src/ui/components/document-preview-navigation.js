import { createButton } from './button.js';
import { createFileList } from './file-list.js';
import { createDocumentPreviewIcon } from './document-preview-icon.js';
import { createResizeHandle } from './resize-handle.js';
import { setAttributes } from './dom.js';

export const DOCUMENT_PREVIEW_DEFAULT_FILES_WIDTH = 376;
export const DOCUMENT_PREVIEW_MIN_FILES_WIDTH = 200;
export const DOCUMENT_PREVIEW_MAX_FILES_WIDTH = 520;

function createPagesToggleIcon(collapsed = false) {
  const direction = collapsed ? 'left' : 'right';
  return createDocumentPreviewIcon(
    `chevron-${direction}`,
    18,
    'ds-document-preview-navigation__pages-toggle-icon',
  );
}

function createResizeIndicatorIcon() {
  return createDocumentPreviewIcon('move-horizontal', 18);
}

function normalizeFilesWidth(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.round(numericValue) : fallback;
}

function getFileId(file, index) {
  return String(file?.id ?? file?.name ?? index);
}

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

export function createDocumentPreviewNavigation({
  title = 'Файлы',
  format = 'DOCX',
  pages = [],
  files = [],
  activePage = 1,
  activeFileId = null,
  collapsed = false,
  filesWidth = DOCUMENT_PREVIEW_DEFAULT_FILES_WIDTH,
  minFilesWidth = DOCUMENT_PREVIEW_MIN_FILES_WIDTH,
  maxFilesWidth = DOCUMENT_PREVIEW_MAX_FILES_WIDTH,
  className = '',
  attributes = {},
  onPageChange,
  onFileOpen,
  onFileDownload,
  onCollapseChange,
  onFilesWidthChange,
} = {}) {
  let currentFormat = String(format || 'DOCX').toUpperCase();
  let currentPages = Array.from(pages || []);
  let currentFiles = Array.from(files || []);
  let currentActivePage = Math.max(1, Number(activePage) || 1);
  let currentActiveFileId = activeFileId === null || activeFileId === undefined ? null : String(activeFileId);
  let currentCollapsed = Boolean(collapsed);
  const minimumFilesWidth = Math.max(
    DOCUMENT_PREVIEW_MIN_FILES_WIDTH,
    normalizeFilesWidth(minFilesWidth, DOCUMENT_PREVIEW_MIN_FILES_WIDTH),
  );
  const maximumFilesWidth = Math.max(
    minimumFilesWidth,
    normalizeFilesWidth(maxFilesWidth, DOCUMENT_PREVIEW_MAX_FILES_WIDTH),
  );
  const clampFilesWidth = value => Math.min(
    maximumFilesWidth,
    Math.max(minimumFilesWidth, normalizeFilesWidth(value, DOCUMENT_PREVIEW_DEFAULT_FILES_WIDTH)),
  );
  let currentFilesWidth = clampFilesWidth(filesWidth);
  let fileQuery = '';

  const element = document.createElement('aside');
  element.className = ['ds-document-preview-navigation', className].filter(Boolean).join(' ');
  element.setAttribute('aria-label', title);
  setAttributes(element, attributes);

  const header = document.createElement('div');
  header.className = 'ds-document-preview-navigation__header';
  const heading = document.createElement('h2');
  heading.className = 'ds-document-preview-navigation__title';
  heading.textContent = title;
  header.append(heading);

  const collapseButton = createButton({
    label: 'Скрыть панель страниц',
    icon: createPagesToggleIcon(false),
    iconOnly: true,
    ariaLabel: 'Скрыть панель страниц',
    variant: 'outlined',
    size: 'small',
    className: 'ds-document-preview-navigation__collapse',
    attributes: { 'aria-expanded': 'true' },
    onClick: () => {
      currentCollapsed = !currentCollapsed;
      syncCollapsed();
      onCollapseChange?.(currentCollapsed);
    },
  });
  header.append(collapseButton);
  const searchRow = document.createElement('div');
  searchRow.className = 'ds-document-preview-navigation__search-row';
  const searchLabel = document.createElement('label');
  searchLabel.className = 'ds-document-preview-navigation__search';
  searchLabel.append(createDocumentPreviewIcon('search'));
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = 'Найти файл';
  searchInput.setAttribute('aria-label', 'Найти файл');
  searchInput.addEventListener('input', event => {
    fileQuery = event.target.value.trim().toLocaleLowerCase('ru');
    renderFiles();
  });
  searchLabel.append(searchInput);
  searchRow.append(searchLabel);

  const columns = document.createElement('div');
  columns.className = 'ds-document-preview-navigation__columns';
  const pagesColumn = document.createElement('section');
  pagesColumn.className = 'ds-document-preview-navigation__pages';
  pagesColumn.setAttribute('aria-label', 'Страницы документа');
  const pagesHeading = document.createElement('div');
  pagesHeading.className = 'ds-document-preview-navigation__column-heading';
  const pagesHeadingText = document.createElement('span');
  pagesHeading.append(pagesHeadingText);
  const pagesScroller = document.createElement('div');
  pagesScroller.className = 'ds-document-preview-navigation__page-list';
  pagesColumn.append(pagesHeading, pagesScroller);

  const filesColumn = document.createElement('section');
  filesColumn.className = 'ds-document-preview-navigation__files';
  filesColumn.setAttribute('aria-label', 'Список файлов');
  const filesHeading = document.createElement('div');
  filesHeading.className = 'ds-document-preview-navigation__column-heading';
  const filesHeadingText = document.createElement('span');
  filesHeadingText.textContent = 'Список файлов';
  filesHeading.append(filesHeadingText);
  let fileList;
  fileList = createFileList({
    title: 'Список файлов',
    showHeader: false,
    showCount: false,
    variant: 'drawer',
    files: currentFiles,
    activeFileId: currentActiveFileId,
    downloadable: false,
    selectionIndicator: true,
    selectOnOpen: false,
    className: 'ds-document-preview-navigation__file-list',
    onFileOpen: (file, event) => {
      onFileOpen?.(file, event);
    },
    onFileDownload,
  });
  filesColumn.append(filesHeading, searchRow, fileList.element);
  columns.append(pagesColumn, filesColumn);
  element.append(header, columns);

  const resizeControl = createResizeHandle({
    label: 'Изменить ширину панели файлов документа',
    value: currentFilesWidth,
    defaultValue: DOCUMENT_PREVIEW_DEFAULT_FILES_WIDTH,
    min: minimumFilesWidth,
    max: maximumFilesWidth,
    step: 16,
    largeStep: 40,
    direction: -1,
    indicator: createResizeIndicatorIcon(),
    className: 'ds-document-preview-navigation__resize',
    attributes: {
      title: 'Перетащите левую границу панели «Файлы». Двойной клик — ширина по умолчанию',
    },
    formatValue: value => `Файлы: ${value} пикселей`,
    onChange: (value, event) => {
      currentFilesWidth = clampFilesWidth(value);
      element.style.setProperty('--document-navigation-files-width', `${currentFilesWidth}px`);
      onFilesWidthChange?.(currentFilesWidth, event);
    },
    onResizeStateChange: resizing => {
      element.classList.toggle('is-resizing-files', resizing);
    },
  });
  element.prepend(resizeControl.element);

  const destroyPagesScroll = bindTransientScrollState(pagesScroller);
  const destroyFilesScroll = bindTransientScrollState(fileList.list);

  const createPagePreview = pageItem => {
    const preview = document.createElement('span');
    preview.className = 'ds-document-preview-navigation__page-preview';
    if (pageItem.thumbnail) {
      const image = document.createElement('img');
      image.src = pageItem.thumbnail;
      image.alt = '';
      image.loading = 'lazy';
      image.draggable = false;
      preview.append(image);
      return preview;
    }
    if (currentFormat === 'XLSX' || pageItem.kind === 'sheet') {
      preview.classList.add('is-sheet');
      Array.from({ length: 20 }, (_, index) => {
        const cell = document.createElement('span');
        if (index < 4) cell.className = 'is-heading';
        preview.append(cell);
      });
      return preview;
    }
    const accent = document.createElement('span');
    accent.className = 'ds-document-preview-navigation__page-accent';
    preview.append(accent);
    Array.from({ length: 4 }, (_, index) => {
      const line = document.createElement('span');
      line.className = `ds-document-preview-navigation__page-line is-line-${index + 1}`;
      preview.append(line);
    });
    return preview;
  };

  function renderPages() {
    pagesScroller.replaceChildren();
    const visiblePages = currentPages;
    visiblePages.forEach(pageItem => {
      const pageNumber = Number(pageItem.number) || 1;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ds-document-preview-navigation__page';
      button.classList.toggle('is-active', currentActivePage === pageNumber);
      button.setAttribute('aria-label', pageItem.label || `${currentFormat === 'XLSX' ? 'Лист' : 'Страница'} ${pageNumber}`);
      if (currentActivePage === pageNumber) button.setAttribute('aria-current', 'page');
      const label = document.createElement('span');
      label.className = 'ds-document-preview-navigation__page-label';
      label.textContent = currentFormat === 'XLSX' ? (pageItem.label || `Лист ${pageNumber}`) : String(pageNumber);
      button.append(createPagePreview(pageItem), label);
      button.addEventListener('click', () => {
        currentActivePage = pageNumber;
        renderPages();
        onPageChange?.(pageNumber);
      });
      pagesScroller.append(button);
    });
    if (visiblePages.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'ds-document-preview-navigation__empty';
      empty.textContent = 'Страницы отсутствуют';
      pagesScroller.append(empty);
    }
  }

  function renderFiles() {
    const visibleFiles = currentFiles.filter(file => {
      const value = String(file.name || '').toLocaleLowerCase('ru');
      return !fileQuery || value.includes(fileQuery);
    });
    fileList.setFiles(visibleFiles);
    fileList.setActiveFileId(currentActiveFileId);
  }

  function syncCollapsed() {
    element.classList.toggle('is-pages-collapsed', currentCollapsed);
    pagesColumn.setAttribute('aria-hidden', String(currentCollapsed));
    collapseButton.setAttribute('aria-expanded', String(!currentCollapsed));
    collapseButton.classList.toggle('is-collapsed', currentCollapsed);
    const contentName = currentFormat === 'XLSX' ? 'листов' : 'страниц';
    const label = currentCollapsed ? `Показать панель ${contentName}` : `Скрыть панель ${contentName}`;
    collapseButton.setAttribute('aria-label', label);
    collapseButton.title = label;
    collapseButton.replaceChildren(createPagesToggleIcon(currentCollapsed));
  }

  function syncHeadings() {
    pagesHeadingText.textContent = currentFormat === 'XLSX' ? 'Листы' : 'Страницы';
    pagesColumn.setAttribute('aria-label', currentFormat === 'XLSX' ? 'Листы книги' : 'Страницы документа');
  }

  function syncFilesWidth() {
    currentFilesWidth = clampFilesWidth(currentFilesWidth);
    resizeControl.setValue(currentFilesWidth);
    element.style.setProperty('--document-navigation-files-width', `${currentFilesWidth}px`);
  }

  syncHeadings();
  syncCollapsed();
  syncFilesWidth();
  renderPages();
  renderFiles();

  return {
    element,
    header,
    searchInput,
    pagesScroller,
    fileList,
    setActivePage(nextPage) {
      currentActivePage = Math.max(1, Number(nextPage) || 1);
      renderPages();
    },
    setActiveFileId(nextId) {
      currentActiveFileId = nextId === null || nextId === undefined ? null : String(nextId);
      fileList.setActiveFileId(currentActiveFileId);
    },
    setCollapsed(value) {
      currentCollapsed = Boolean(value);
      syncCollapsed();
    },
    setFilesWidth(value) {
      currentFilesWidth = clampFilesWidth(value);
      syncFilesWidth();
    },
    getFilesWidth() {
      return currentFilesWidth;
    },
    update({ format: nextFormat, pages: nextPages, files: nextFiles, activePage: nextPage, activeFileId: nextFileId, filesWidth: nextFilesWidth } = {}) {
      if (nextFormat !== undefined) currentFormat = String(nextFormat || 'DOCX').toUpperCase();
      if (nextPages !== undefined) currentPages = Array.from(nextPages || []);
      if (nextFiles !== undefined) currentFiles = Array.from(nextFiles || []);
      if (nextPage !== undefined) currentActivePage = Math.max(1, Number(nextPage) || 1);
      if (nextFileId !== undefined) currentActiveFileId = nextFileId === null ? null : String(nextFileId);
      if (nextFilesWidth !== undefined) currentFilesWidth = clampFilesWidth(nextFilesWidth);
      syncHeadings();
      syncCollapsed();
      syncFilesWidth();
      renderPages();
      renderFiles();
    },
    destroy() {
      destroyPagesScroll();
      destroyFilesScroll();
      resizeControl.destroy();
    },
  };
}
