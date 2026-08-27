import { createTreeSelect } from './tree-select.js';

const nodes = [
  { id: 'root', label: 'Корень системы', children: [
    { id: 'documents', label: 'Документы', children: [
      { id: 'contracts', label: 'Договоры' },
      { id: 'orders', label: 'Приказы' },
    ] },
    { id: 'archive', label: 'Архив' },
  ] },
];

export default {
  title: 'Controls/TreeSelect',
  tags: ['autodocs'],
  args: {
    label: 'Поиск в пакете',
    placeholder: 'Корень системы / Документы',
    nodes,
    selectedIds: [],
    expandedIds: ['root', 'documents'],
    multiple: true,
    cascadeSelection: true,
    disabled: false,
  },
  render: args => createTreeSelect(args).element,
};

export const Playground = {};
export const Selected = { args: { selectedIds: ['contracts', 'orders'] } };
export const ManySelected = {
  args: { selectedIds: ['root', 'documents', 'contracts', 'orders', 'archive'] },
};
export const Disabled = { args: { disabled: true } };
