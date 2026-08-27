import { createTree } from './tree.js';

const packageNodes = [
  {
    id: 'root',
    label: 'Корень системы',
    children: [
      {
        id: 'documents',
        label: 'Документы',
        children: [
          { id: 'contracts', label: 'Договоры' },
          { id: 'orders', label: 'Приказы' },
        ],
      },
      { id: 'archive', label: 'Архив' },
    ],
  },
  { id: 'shared', label: 'Общие документы' },
  { id: 'restricted', label: 'Закрытый пакет', disabled: true },
];

export default {
  title: 'Navigation/Tree',
  tags: ['autodocs'],
  args: {
    label: 'Пакеты документов',
    nodes: packageNodes,
    selectionMode: 'single',
    selectedIds: [],
    expandedIds: ['root', 'documents'],
    cascadeSelection: false,
  },
  argTypes: {
    selectionMode: {
      control: 'select',
      options: ['none', 'single', 'multiple'],
    },
  },
  render: args => {
    const container = document.createElement('div');
    container.className = 'component-tree-story';
    container.append(createTree(args).element);
    return container;
  },
};

export const Playground = {};

export const Selected = {
  args: {
    selectedIds: ['contracts'],
  },
};

export const MultiSelect = {
  args: {
    selectionMode: 'multiple',
    cascadeSelection: true,
    selectedIds: ['contracts'],
  },
};

export const Collapsed = {
  args: {
    expandedIds: [],
  },
};

export const Empty = {
  args: {
    nodes: [],
    emptyMessage: 'Пакеты не найдены',
  },
};
