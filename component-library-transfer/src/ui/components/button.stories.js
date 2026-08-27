import { createButton } from './button.js';

export default {
  title: 'Controls/Button',
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'outlined', 'text'] },
    size: { control: 'select', options: ['medium', 'small'] },
  },
  args: { label: 'Выполнить действие', variant: 'primary', size: 'medium', disabled: false },
};

export const Playground = { render: args => createButton(args) };

export const Variants = {
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'component-story-stack';
    ['primary', 'outlined', 'text'].forEach(variant => {
      stack.append(createButton({ label: variant, variant }));
    });
    stack.append(createButton({ label: 'Недоступно', variant: 'primary', disabled: true }));
    return stack;
  },
};
