import { createSegmentedControl, createViewModeSegmentIcon } from './segmented-control.js';

function createCountLabel(label, count) {
  const wrapper = document.createElement('span');
  wrapper.className = 'ds-segmented-control__label';
  wrapper.append(document.createTextNode(label));

  const counter = document.createElement('strong');
  counter.className = 'ds-segmented-control__count';
  counter.textContent = String(count);
  wrapper.append(counter);
  return wrapper;
}

const viewItems = () => [
  {
    value: 'cards',
    icon: createViewModeSegmentIcon('cards'),
    ariaLabel: 'Карточный вид',
    title: 'Карточный вид',
  },
  {
    value: 'table',
    icon: createViewModeSegmentIcon('table'),
    ariaLabel: 'Табличный вид',
    title: 'Табличный вид',
  },
];

const statusItems = () => [
  { value: 'all', label: createCountLabel('Все', 24), ariaLabel: 'Все: 24' },
  { value: 'repair', label: createCountLabel('Проблемы', 3), ariaLabel: 'Проблемы: 3' },
  { value: 'draft', label: createCountLabel('Черновики', 7), ariaLabel: 'Черновики: 7' },
  { value: 'ready', label: createCountLabel('Доступны', 14), ariaLabel: 'Доступны: 14' },
];

export default {
  title: 'Controls/Segmented Control',
  tags: ['autodocs'],
  args: {
    label: 'Режим отображения',
    value: 'cards',
  },
};

export const Text = {
  render: args => createSegmentedControl({
    ...args,
    items: [
      { value: 'active', label: 'Активные' },
      { value: 'archive', label: 'Архив' },
    ],
    value: 'active',
  }).element,
};

export const CompactWithCounters = {
  render: args => createSegmentedControl({
    ...args,
    label: 'Фильтр состояний',
    items: statusItems(),
    value: 'all',
    size: 'compact',
  }).element,
};

export const IconOnly = {
  render: args => createSegmentedControl({
    ...args,
    label: 'Режим отображения',
    items: viewItems(),
    value: 'cards',
    size: 'compact',
  }).element,
};

export const DisabledItem = {
  render: args => createSegmentedControl({
    ...args,
    items: [
      { value: 'current', label: 'Текущие' },
      { value: 'planned', label: 'Планируемые', disabled: true },
    ],
    value: 'current',
  }).element,
};
