import { createButton } from './button.js';
import { createEmptyState } from './empty-state.js';
import { createEmptyStateIllustration } from './empty-state-illustration.js';

const semanticVariants = [
  {
    variant: 'empty',
    title: 'Пока ничего нет',
    description: 'Здесь появятся добавленные элементы.',
  },
  {
    variant: 'search',
    title: 'Ничего не найдено',
    description: 'Измените запрос и повторите поиск.',
  },
  {
    variant: 'filtered',
    title: 'Нет подходящих результатов',
    description: 'Измените или сбросьте выбранные фильтры.',
  },
  {
    variant: 'error',
    title: 'Не удалось загрузить данные',
    description: 'Повторите попытку или вернитесь позже.',
  },
  {
    variant: 'access',
    title: 'Нет доступа',
    description: 'Запросите разрешение у владельца раздела.',
  },
  {
    variant: 'success',
    title: 'Все задачи завершены',
    description: 'Новых действий сейчас не требуется.',
  },
];

function illustration(variant, size = 'medium') {
  return createEmptyStateIllustration({ variant, size });
}

function storyGrid(className = '') {
  const grid = document.createElement('div');
  grid.className = ['ds-empty-state-story-grid', className].filter(Boolean).join(' ');
  return grid;
}

export default {
  title: 'Feedback/Empty State',
  tags: ['autodocs'],
};

export const Default = {
  render: () => createEmptyState({
    illustration: illustration('empty'),
    title: 'Пока ничего нет',
    description: 'Здесь появятся доступные элементы.',
  }).element,
};

export const TitleOnly = {
  render: () => createEmptyState({
    illustration: illustration('empty'),
    title: 'Пока ничего нет',
  }).element,
};

export const DescriptionOnly = {
  render: () => createEmptyState({
    illustration: illustration('search'),
    description: 'Измените условия и повторите поиск.',
    ariaLabel: 'Результаты отсутствуют',
  }).element,
};

export const TitleAndDescription = {
  render: () => createEmptyState({
    illustration: illustration('filtered'),
    title: 'Нет подходящих результатов',
    description: 'Измените или сбросьте выбранные фильтры.',
  }).element,
};

export const OneAction = {
  render: () => createEmptyState({
    illustration: illustration('error'),
    title: 'Не удалось загрузить данные',
    description: 'Проверьте подключение и повторите попытку.',
    actions: createButton({ label: 'Повторить', variant: 'primary' }),
  }).element,
};

export const TwoActions = {
  render: () => createEmptyState({
    illustration: illustration('access'),
    title: 'Нет доступа',
    description: 'Запросите разрешение или вернитесь в доступный раздел.',
    actions: [
      createButton({ label: 'Запросить доступ', variant: 'primary' }),
      createButton({ label: 'Вернуться', variant: 'outlined' }),
    ],
  }).element,
};

export const Sizes = {
  render: () => {
    const grid = storyGrid('ds-empty-state-story-grid--sizes');
    ['small', 'medium', 'large'].forEach(size => {
      grid.append(createEmptyState({
        illustration: illustration('empty', size),
        title: size === 'small' ? 'Маленький' : size === 'medium' ? 'Средний' : 'Большой',
        description: 'Размер компоновки и иллюстрации.',
        size,
      }).element);
    });
    return grid;
  },
};

export const Illustrations = {
  render: () => {
    const grid = storyGrid('ds-empty-state-illustration-story');
    semanticVariants.forEach(item => {
      const sample = document.createElement('div');
      sample.className = 'ds-empty-state-illustration-story__item';
      sample.append(illustration(item.variant, 'large'));
      const label = document.createElement('span');
      label.textContent = item.variant;
      sample.append(label);
      grid.append(sample);
    });
    return grid;
  },
};

export const SemanticVariants = {
  render: () => {
    const grid = storyGrid();
    semanticVariants.forEach(item => {
      grid.append(createEmptyState({
        illustration: illustration(item.variant, 'small'),
        title: item.title,
        description: item.description,
        size: 'small',
      }).element);
    });
    return grid;
  },
};

export const WithoutIllustration = {
  render: () => createEmptyState({
    title: 'Нет результатов',
    description: 'Иллюстрация необязательна, если область компактна.',
    size: 'small',
  }).element,
};
