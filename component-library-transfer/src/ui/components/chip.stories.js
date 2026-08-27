import { createChip } from './chip.js';

function createStoryRow() {
  const row = document.createElement('div');
  row.className = 'component-story-stack component-chip-story';
  return row;
}

export default {
  title: 'Controls/Chip',
  tags: ['autodocs'],
};

export const FilterGroup = {
  render: () => {
    const row = createStoryRow();
    const controls = [
      { label: 'до 500 тыс.', selected: false },
      { label: '1 млн - 5 млн', selected: true },
      { label: 'свыше 10 млн', selected: false },
    ].map(option => createChip({ ...option, kind: 'filter' }));

    controls.forEach((control, index) => {
      control.element.addEventListener('click', () => {
        controls.forEach((item, itemIndex) => item.setSelected(itemIndex === index));
      });
      row.append(control.element);
    });
    return row;
  },
};

export const Kinds = {
  render: () => {
    const row = createStoryRow();
    row.append(
      createChip({ label: 'Фильтр', kind: 'filter' }).element,
      createChip({ label: 'Помощник', kind: 'assist' }).element,
      createChip({ label: 'Рекомендация', kind: 'suggestion' }).element,
      createChip({ label: 'Выбранное значение', kind: 'input', removable: true }).element,
    );
    return row;
  },
};

export const States = {
  render: () => {
    const row = createStoryRow();
    row.append(
      createChip({ label: 'По умолчанию' }).element,
      createChip({ label: 'Выбран', selected: true }).element,
      createChip({ label: 'Недоступен', disabled: true }).element,
      createChip({ label: 'Выбран и недоступен', selected: true, disabled: true }).element,
    );
    return row;
  },
};

export const Sizes = {
  render: () => {
    const row = createStoryRow();
    row.append(
      createChip({ label: 'Маленький', size: 'small' }).element,
      createChip({ label: 'Средний', size: 'medium' }).element,
      createChip({ label: 'Большой', size: 'large' }).element,
    );
    return row;
  },
};
