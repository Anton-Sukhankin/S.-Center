import { createButton } from './button.js';
import { createCard } from './card.js';
import { createIcon } from './icon.js';
import { createProgressRing } from './progress-ring.js';

export default {
  title: 'Data Display/Progress Ring',
  tags: ['autodocs'],
  args: {
    value: 44,
    size: 'medium',
    tone: 'accent',
    showValue: true,
    indeterminate: false,
    label: 'Готовность',
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    tone: { control: 'select', options: ['neutral', 'accent', 'success', 'warning', 'danger'] },
    showValue: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    label: { control: 'text' },
  },
};

const STORY_ICON_PATHS = Object.freeze({
  'building-2': ['M4 21h16', 'M6 21V5l6-3 6 3v16', 'M9 8h.01', 'M15 8h.01', 'M9 12h.01', 'M15 12h.01'],
  'list-checks': ['m4 6 2 2 3-3', 'M11 7h9', 'm4 12 2 2 3-3', 'M11 13h9', 'm4 18 2 2 3-3', 'M11 19h9'],
  'circle-check-big': ['M21.8 10A10 10 0 1 1 12 2', 'm9 11 3 3L22 4'],
});

function createStoryIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  (STORY_ICON_PATHS[name] ?? STORY_ICON_PATHS['building-2']).forEach(definition => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', definition);
    svg.append(path);
  });
  return svg;
}

function storyRow() {
  const row = document.createElement('div');
  row.className = 'component-progress-ring-story-row';
  return row;
}

function labeledRing(label, options) {
  const item = document.createElement('div');
  item.className = 'component-progress-ring-story-item';
  item.append(
    createProgressRing({ label, ...options }).element,
    Object.assign(document.createElement('span'), { textContent: label }),
  );
  return item;
}

export const Playground = {
  render: args => createProgressRing(args).element,
};

export const DeterminateStates = {
  render: () => {
    const row = storyRow();
    row.append(
      labeledRing('Не начато', { value: 0, tone: 'neutral' }),
      labeledRing('Выполнено на 44%', { value: 44, tone: 'accent' }),
      labeledRing('Завершено', { value: 100, tone: 'success' }),
    );
    return row;
  },
};

export const SemanticTones = {
  render: () => {
    const row = storyRow();
    row.append(
      labeledRing('Нейтральный', { value: 44, tone: 'neutral' }),
      labeledRing('Основной', { value: 44, tone: 'accent' }),
      labeledRing('Успех', { value: 100, tone: 'success' }),
      labeledRing('Предупреждение', { value: 68, tone: 'warning' }),
      labeledRing('Критический', { value: 24, tone: 'danger' }),
    );
    return row;
  },
};

export const Sizes = {
  render: () => {
    const row = storyRow();
    row.append(
      labeledRing('Малый', { value: 44, size: 'small', showValue: false }),
      labeledRing('Средний', { value: 44, size: 'medium' }),
      labeledRing('Большой', { value: 44, size: 'large' }),
    );
    return row;
  },
};

export const Indeterminate = {
  render: () => createProgressRing({
    value: 0,
    indeterminate: true,
    showValue: false,
    label: 'Выполняется расчёт готовности',
  }).element,
};

export const RuntimeUpdates = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'component-progress-ring-story-controls';
    const progress = createProgressRing({ value: 25, label: 'Демонстрационный прогресс' });
    const values = [25, 50, 75, 100];
    let index = 0;
    const button = createButton({
      label: 'Увеличить прогресс',
      variant: 'outlined',
      onClick: () => {
        index = (index + 1) % values.length;
        progress.setValue(values[index]);
        progress.setTone(values[index] === 100 ? 'success' : 'accent');
      },
    });
    wrap.append(progress.element, button);
    return wrap;
  },
};

export const SummaryCardComposition = {
  render: () => {
    const grid = document.createElement('div');
    grid.className = 'component-card-story-grid component-card-story-grid--metrics';
    const definitions = [
      { label: 'Готовность дома', value: 44, icon: 'building-2', tone: 'accent' },
      { label: 'Готовность группы', value: 51, icon: 'list-checks', tone: 'accent' },
      { label: 'Работы завершены', value: 68, icon: 'circle-check-big', tone: 'success' },
    ];
    definitions.forEach(definition => {
      const value = document.createElement('strong');
      value.className = 'component-card-story-metric-value';
      value.textContent = `${definition.value}%`;
      grid.append(createCard({
        title: definition.label,
        description: 'Актуально на 25.08.2026',
        leading: createIcon({ name: definition.icon, fallback: createStoryIcon(definition.icon) }),
        actions: createProgressRing({
          value: definition.value,
          tone: definition.tone,
          size: 'medium',
          showValue: false,
          label: `${definition.label}: ${definition.value}%`,
        }).element,
        content: value,
      }).element);
    });
    return grid;
  },
};
