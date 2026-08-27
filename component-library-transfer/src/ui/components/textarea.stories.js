import { createTextarea } from './textarea.js';

export default {
  title: 'Controls/Textarea',
  tags: ['autodocs'],
  args: {
    label: 'Комментарий',
    placeholder: 'Введите комментарий',
    description: 'Поле поддерживает многострочный текст.',
    rows: 4,
    required: false,
    disabled: false,
    readOnly: false,
  },
};

export const Playground = { render: args => createTextarea(args).element };
export const Error = { args: { error: 'Добавьте комментарий.' }, render: args => createTextarea(args).element };
