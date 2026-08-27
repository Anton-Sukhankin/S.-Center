import { createButton } from './button.js';
import { createFileItem } from './file-item.js';

const baseFile = {
  id: 'agreement',
  name: 'Договор поставки № 42.pdf',
  format: 'PDF',
  size: '2,4 МБ',
};

function storyStack() {
  const element = document.createElement('div');
  element.className = 'ds-file-story-stack';
  return element;
}

export default {
  title: 'Data Display/File Item',
  tags: ['autodocs'],
};

export const Default = {
  render: () => createFileItem({ file: baseFile }).element,
};

export const States = {
  render: () => {
    const stack = storyStack();
    stack.append(
      createFileItem({ file: baseFile }).element,
      createFileItem({ file: { ...baseFile, id: 'selected', name: 'Выбранный файл.pdf' }, selected: true }).element,
      createFileItem({ file: { ...baseFile, id: 'disabled', name: 'Недоступный файл.pdf' }, disabled: true }).element,
    );
    return stack;
  },
};

export const LongName = {
  render: () => createFileItem({
    file: {
      id: 'long-name',
      name: 'Приложение к договору поставки с результатами согласования и замечаниями контрагента.pdf',
      format: 'PDF',
      size: '18,7 МБ',
    },
  }).element,
};

export const CustomAction = {
  render: () => createFileItem({
    file: { id: 'signature', name: 'Лист согласования.docx', format: 'DOCX', size: '640 КБ' },
    actions: createButton({ label: 'Версии', variant: 'text', size: 'small' }),
  }).element,
};

export const FormatMetaphors = {
  render: () => {
    const stack = storyStack();
    stack.append(
      createFileItem({ file: { id: 'docx', name: 'Техническое задание.docx', format: 'DOCX', size: '1,8 МБ' }, downloadable: false }).element,
      createFileItem({ file: { id: 'pdf', name: 'Приложение №1.pdf', format: 'PDF', size: '3,2 МБ' }, downloadable: false }).element,
      createFileItem({ file: { id: 'xlsx', name: 'Расчёт стоимости.xlsx', format: 'XLSX', size: '640 КБ' }, downloadable: false, selected: true }).element,
    );
    return stack;
  },
};
