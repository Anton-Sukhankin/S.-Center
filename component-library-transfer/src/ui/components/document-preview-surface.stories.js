import { createDocumentPreviewSurface } from './document-preview-surface.js';

function createDocumentPage() {
  const page = document.createElement('article');
  page.className = 'ds-document-preview-story-page';
  [
    ['small', 'S.DOCS / ДОГОВОРНЫЕ ДОКУМЕНТЫ'],
    ['h1', 'Техническое задание'],
    ['p', 'на внедрение системы управления документами'],
    ['h2', '1. Общие положения'],
    ['p', 'Настоящий документ определяет состав работ, требования к результату и порядок взаимодействия сторон.'],
  ].forEach(([tagName, text]) => {
    const element = document.createElement(tagName);
    element.textContent = text;
    page.append(element);
  });
  return page;
}

function wrapSurface(surface) {
  const frame = document.createElement('div');
  frame.className = 'ds-document-preview-story-frame';
  frame.append(surface.element || surface);
  return frame;
}

export default {
  title: 'Data Display/Document Preview Surface',
  tags: ['autodocs'],
};

export const Default = {
  render: () => wrapSurface(createDocumentPreviewSurface({
    format: 'DOCX',
    page: 1,
    pageCount: 12,
    zoom: 90,
    content: createDocumentPage(),
  })),
};

export const InteractiveNavigation = {
  render: () => {
    const surface = createDocumentPreviewSurface({
      format: 'DOCX',
      page: 1,
      pageCount: 12,
      zoom: 90,
      content: createDocumentPage(),
      onPageChange: page => surface.setPage(page),
      onZoomChange: zoom => surface.setZoom(zoom),
    });
    return wrapSurface(surface);
  },
};

export const ZoomAndReset = {
  render: () => wrapSurface(createDocumentPreviewSurface({
    format: 'DOCX',
    page: 1,
    pageCount: 12,
    zoom: 180,
    defaultZoom: 90,
    maxZoom: 300,
    content: createDocumentPage(),
  })),
};
