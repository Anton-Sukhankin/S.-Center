import { createButton } from './button.js';
import { createTooltip } from './tooltip.js';

const activeInstances = new Set();

function createStory({ label, content, delay = 500, open = false, placement = 'auto', edge = false, disabled = false }) {
  const story = document.createElement('div');
  story.className = `component-tooltip-story${edge ? ' component-tooltip-story--edge' : ''}`;
  const trigger = createButton({ label, variant: 'outlined', disabled });
  const tooltip = createTooltip({ content, delay, placement });
  tooltip.connect(trigger);
  tooltip.mount();
  activeInstances.add(tooltip);
  story.append(trigger);
  if (open) requestAnimationFrame(() => tooltip.show(trigger));
  return story;
}

function longContent() {
  const content = document.createElement('span');
  content.className = 'component-tooltip-story__long-content';
  const title = document.createElement('strong');
  title.textContent = 'Последнее изменение';
  const value = document.createElement('span');
  value.textContent = 'Завершено на текущей неделе · Мария Соколова (@m.sokolova) · 26.08.2026, 17:42';
  content.append(title, value);
  return content;
}

export default {
  title: 'Overlays/Tooltip',
  tags: ['autodocs'],
  beforeEach: () => () => {
    activeInstances.forEach(instance => instance.destroy());
    activeInstances.clear();
  },
};

export const DelayedHover = {
  render: () => createStory({
    label: 'Наведите курсор',
    content: 'Подсказка появится через 500 мс и исчезнет при уходе курсора.',
  }),
};

export const KeyboardFocus = {
  render: () => createStory({
    label: 'Переведите фокус',
    content: 'При фокусе с клавиатуры подсказка показывается сразу.',
  }),
};

export const LongContent = {
  render: () => createStory({ label: 'История изменения', content: longContent(), open: true }),
};

export const ViewportEdge = {
  render: () => createStory({
    label: 'Триггер у края',
    content: 'Позиция автоматически меняется и остаётся внутри видимой области.',
    open: true,
    placement: 'right',
    edge: true,
  }),
};

export const DisabledTrigger = {
  render: () => createStory({
    label: 'Недоступный триггер',
    content: 'Эта подсказка не должна открываться.',
    disabled: true,
  }),
};
