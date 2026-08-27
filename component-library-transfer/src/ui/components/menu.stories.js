import { createButton } from './button.js';
import { createIcon } from './icon.js';
import { createMenu } from './menu.js';

const activeInstances = new Set();
const createFallbackIcon = () => {
  const fallback = document.createElement('span');
  fallback.textContent = '○';
  return fallback;
};
const createItems = () => [
  { id: 'first', label: 'Действие 1', icon: createIcon({ name: 'circle', fallback: createFallbackIcon }) },
  { id: 'second', label: 'Действие 2' },
  { type: 'separator' },
  { id: 'disabled', label: 'Недоступное действие', disabled: true },
  { id: 'danger', label: 'Опасное действие', danger: true },
];

function renderMenu(options, { open = false } = {}) {
  const story = document.createElement('div');
  story.className = 'component-menu-story';
  const instance = createMenu(options);
  activeInstances.add(instance);
  story.append(instance.element);
  if (open) instance.setOpen(true, { focus: false });
  return story;
}

export default {
  title: 'Overlays/Menu',
  tags: ['autodocs'],
  beforeEach: () => () => {
    activeInstances.forEach(instance => instance.destroy());
    activeInstances.clear();
  },
};

export const ButtonConfigTrigger = {
  render: () => renderMenu({
    label: 'Доступные действия',
    trigger: { label: 'Открыть меню', variant: 'outlined' },
    items: createItems(),
  }, { open: true }),
};

export const ExistingTrigger = {
  render: () => renderMenu({
    label: 'Дополнительные действия',
    trigger: createButton({ label: 'Ещё действия', variant: 'text' }),
    items: createItems(),
  }),
};
