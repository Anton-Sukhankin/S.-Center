import { createTabs } from './tabs.js';

const items = [
  { value: 'details', label: 'Основное', content: 'Основные сведения.' },
  { value: 'history', label: 'История', content: 'История изменений.' },
  { value: 'disabled', label: 'Недоступно', content: 'Недоступная вкладка.', disabled: true },
];

export default {
  title: 'Navigation/Tabs',
  tags: ['autodocs'],
  args: { label: 'Разделы карточки', items, value: 'details', orientation: 'horizontal' },
};

export const Default = { render: args => createTabs(args).element };
export const Vertical = { args: { orientation: 'vertical' }, render: args => createTabs(args).element };
