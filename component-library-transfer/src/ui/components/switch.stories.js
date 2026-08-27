import { createSwitch } from './switch.js';

export default {
  title: 'Controls/Switch',
  tags: ['autodocs'],
  args: { label: 'Показывать скрытые элементы', checked: false, disabled: false },
};

export const Playground = { render: args => createSwitch(args).element };

export const States = {
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'component-story-stack';
    stack.append(
      createSwitch({ label: 'Выключено' }).element,
      createSwitch({ label: 'Включено', checked: true }).element,
      createSwitch({ label: 'Недоступно', disabled: true }).element,
    );
    return stack;
  },
};
