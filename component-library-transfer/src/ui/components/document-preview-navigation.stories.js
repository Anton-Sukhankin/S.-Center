import { createDocumentPreviewNavigation } from './document-preview-navigation.js';

const files = [
  { id: 'docx', name: 'Техническое задание.docx', format: 'DOCX', size: '1,8 МБ' },
  { id: 'pdf', name: 'Приложение №1.pdf', format: 'PDF', size: '3,2 МБ' },
  { id: 'xlsx', name: 'Расчёт стоимости.xlsx', format: 'XLSX', size: '640 КБ' },
];

const pages = Array.from({ length: 12 }, (_, index) => ({
  number: index + 1,
  label: `Страница ${index + 1}`,
  meta: index === 0 ? 'Начало документа' : `Раздел ${Math.ceil((index + 1) / 2)}`,
}));

export default {
  title: 'Navigation/Document Preview Navigation',
  tags: ['autodocs'],
};

function wrapNavigation(navigation) {
  const frame = document.createElement('div');
  frame.className = 'ds-document-preview-navigation-story-frame';
  frame.append(navigation.element || navigation);
  return frame;
}

export const Default = {
  render: () => wrapNavigation(createDocumentPreviewNavigation({
    files,
    pages,
    activeFileId: 'docx',
    activePage: 1,
  })),
};

export const Interactive = {
  render: () => {
    const navigation = createDocumentPreviewNavigation({
      files,
      pages,
      activeFileId: 'docx',
      activePage: 1,
      onPageChange: page => navigation.setActivePage(page),
      onFileOpen: file => navigation.setActiveFileId(file.id),
    });
    return wrapNavigation(navigation);
  },
};

export const CollapsedPages = {
  render: () => wrapNavigation(createDocumentPreviewNavigation({
    files,
    pages,
    activeFileId: 'pdf',
    activePage: 2,
    collapsed: true,
  })),
};

export const MinimumFilesWidth = {
  render: () => wrapNavigation(createDocumentPreviewNavigation({
    files,
    pages,
    activeFileId: 'xlsx',
    activePage: 3,
    filesWidth: 200,
  })),
};

export const FileNameSearch = {
  render: () => {
    const navigation = createDocumentPreviewNavigation({
      files,
      pages,
      activeFileId: 'pdf',
      activePage: 1,
    });
    navigation.searchInput.value = 'Приложение';
    navigation.searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    return wrapNavigation(navigation);
  },
};
