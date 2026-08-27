import { createButton } from './button.js';
import { createFileList } from './file-list.js';

const files = [
  { id: 'contract', name: 'Договор поставки № 42.pdf', format: 'PDF', size: '2,4 МБ' },
  { id: 'approval', name: 'Лист согласования.docx', format: 'DOCX', size: '640 КБ' },
  { id: 'estimate', name: 'Расчёт стоимости.xlsx', format: 'XLSX', size: '1,1 МБ' },
];

export default {
  title: 'Data Display/File List',
  tags: ['autodocs'],
};

export const Default = {
  render: () => createFileList({ files }).element,
};

export const SelectedFile = {
  render: () => createFileList({ files, activeFileId: 'approval' }).element,
};

export const Interactive = {
  render: () => {
    const status = document.createElement('p');
    status.className = 'ds-file-list-story-status';
    status.textContent = 'Выберите файл в списке.';
    const list = createFileList({
      files,
      onFileOpen: file => {
        status.textContent = `Выбран файл: ${file.name}`;
      },
      onFileDownload: file => {
        status.textContent = `Запрошено скачивание: ${file.name}`;
      },
    });
    const canvas = document.createElement('div');
    canvas.className = 'ds-file-list-story';
    canvas.append(list.element, status);
    return canvas;
  },
};

export const Empty = {
  render: () => createFileList({
    files: [],
    emptyActions: createButton({ label: 'Добавить файл', variant: 'outlined', size: 'small' }),
  }).element,
};

export const WithoutDownload = {
  render: () => createFileList({ files, downloadable: false }).element,
};

export const DrawerList = {
  render: () => createFileList({
    title: 'Файлы',
    files,
    activeFileId: 'approval',
    downloadable: false,
    variant: 'drawer',
  }).element,
};
