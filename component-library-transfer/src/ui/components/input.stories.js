import { createInput } from './input.js';

export default {
  title: 'Controls/Input',
  tags: ['autodocs'],
  args: {
    label: 'Наименование',
    placeholder: 'Введите значение',
    description: 'Подсказка относится к текущему полю.',
    required: false,
    disabled: false,
  },
};

export const Playground = { render: args => createInput(args).element };
export const Error = { args: { error: 'Поле необходимо заполнить.' }, render: args => createInput(args).element };
