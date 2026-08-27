import { createCheckbox } from './checkbox.js';

export default {
  title: 'Controls/Checkbox',
  tags: ['autodocs'],
  args: { label: 'Выбрать позицию', checked: false, indeterminate: false, disabled: false },
};

export const Playground = { render: args => createCheckbox(args).element };

export const States = {
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'component-story-stack';
    stack.append(
      createCheckbox({ label: 'Не выбрано' }).element,
      createCheckbox({ label: 'Выбрано', checked: true }).element,
      createCheckbox({ label: 'Частичный выбор', indeterminate: true }).element,
      createCheckbox({ label: 'Недоступно', disabled: true }).element,
    );
    return stack;
  },
};
