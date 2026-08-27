import { createTag, TAG_COLORS, TAG_TONES } from './tag.js';

const COLOR_LABELS = Object.freeze({
  cyan: 'Циан',
  purple: 'Фиолетовый',
  blue: 'Синий',
  gray: 'Серый',
  green: 'Зелёный',
  'dark-gray': 'Тёмно-серый',
  red: 'Красный',
});

const TONE_LABELS = Object.freeze({
  contrast: 'Контрастные',
  light: 'Светлые',
});

export default {
  title: 'Feedback/Tag',
  tags: ['autodocs'],
};

export const Variants = {
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'component-story-stack';
    ['neutral', 'accent', 'success', 'warning', 'danger'].forEach(variant => {
      stack.append(createTag({ label: variant, variant }).element);
    });
    return stack;
  },
};

export const ColorPalettes = {
  render: () => {
    const matrix = document.createElement('div');
    matrix.className = 'component-tag-palette';

    TAG_TONES.forEach(tone => {
      const group = document.createElement('section');
      group.className = 'component-tag-palette__group';
      const title = document.createElement('h3');
      title.className = 'component-tag-palette__title';
      title.textContent = TONE_LABELS[tone];
      const row = document.createElement('div');
      row.className = 'component-tag-palette__row';
      TAG_COLORS.forEach(color => {
        row.append(createTag({ label: COLOR_LABELS[color], color, tone }).element);
      });
      group.append(title, row);
      matrix.append(group);
    });

    return matrix;
  },
};

export const Removable = {
  render: () => createTag({
    label: 'Выбранное значение',
    removable: true,
    removeLabel: 'Удалить выбранное значение',
  }).element,
};
