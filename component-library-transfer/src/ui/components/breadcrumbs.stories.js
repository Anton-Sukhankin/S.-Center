import { createBreadcrumbs } from './breadcrumbs.js';

export default {
  title: 'Navigation/Breadcrumbs',
  tags: ['autodocs'],
};

export const Tasks = {
  render: () => createBreadcrumbs({
    ariaLabel: 'Путь раздела задач',
    items: [
      { label: 'Задачи' },
      { label: 'Все задачи', current: true, headingLevel: 1 },
    ],
  }).element,
};

export const DocumentsPackage = {
  render: () => createBreadcrumbs({
    ariaLabel: 'Путь выбранного пакета',
    items: [
      { label: 'Документы' },
      { label: 'Договоры и обязательства' },
      { label: 'Договоры', current: true },
    ],
  }).element,
};

export const SearchTitle = {
  render: () => createBreadcrumbs({
    ariaLabel: 'Раздел результатов поиска',
    items: [
      { label: 'Поиск по документам', current: true, headingLevel: 1 },
    ],
  }).element,
};
