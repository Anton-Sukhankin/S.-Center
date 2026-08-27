import { createMultiSelect } from './multi-select.js';

const options = [
  { value: 'one', label: 'Значение 1' },
  { value: 'two', label: 'Значение 2' },
  { value: 'three', label: 'Значение 3' },
  { value: 'four', label: 'Значение 4' },
  { value: 'five', label: 'Недоступное значение', disabled: true },
];
const activeInstances = new Set();

function renderMultiSelect(args, { open = false, overflow = false } = {}) {
  const story = document.createElement('div');
  story.className = 'component-multi-select-story';
  const instance = createMultiSelect(args);
  activeInstances.add(instance);
  story.append(instance.element);
  if (open) instance.setOpen(true, { focus: false });
  if (overflow) instance.setOverflowOpen(true);
  return story;
}

export default {
  title: 'Controls/MultiSelect',
  tags: ['autodocs'],
  args: {
    label: 'Набор значений',
    placeholder: 'Выберите значения',
    options,
    values: [],
    maxVisibleTags: 1,
    searchable: false,
    clearable: false,
    disabled: false,
  },
  beforeEach: () => () => {
    activeInstances.forEach(instance => instance.destroy());
    activeInstances.clear();
  },
};

export const Empty = {
  args: { options: [], emptyMessage: 'Значения не найдены' },
  render: args => renderMultiSelect(args, { open: true }),
};

export const ClearableEmpty = {
  args: { values: [], clearable: true },
  render: args => renderMultiSelect(args),
};

export const Selected = {
  args: { values: ['one', 'two'], maxVisibleTags: 2, clearable: true },
  render: args => renderMultiSelect(args),
};

export const Searchable = {
  args: { searchable: true, searchPlaceholder: 'Найти значение' },
  render: args => renderMultiSelect(args, { open: true }),
};

export const Overflow = {
  args: { values: ['one', 'two', 'three', 'four'], maxVisibleTags: 1, clearable: true },
  render: args => renderMultiSelect(args, { overflow: true }),
};

export const Disabled = {
  args: { values: ['one', 'two'], disabled: true },
  render: args => renderMultiSelect(args),
};

export const DropUp = {
  args: { searchable: true, searchPlaceholder: 'Найти значение' },
  render: args => {
    const canvas = document.createElement('div');
    canvas.className = 'component-drop-up-story';
    const instance = createMultiSelect(args);
    activeInstances.add(instance);
    canvas.append(instance.element);
    requestAnimationFrame(() => instance.setOpen(true, { focus: false }));
    return canvas;
  },
};
