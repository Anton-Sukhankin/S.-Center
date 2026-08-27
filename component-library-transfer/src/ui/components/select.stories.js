import { createSelect } from './select.js';

const options = [
  { value: 'one', label: 'Первое значение' },
  { value: 'two', label: 'Второе значение' },
  { value: 'three', label: 'Третье значение' },
];

export default {
  title: 'Controls/Select',
  tags: ['autodocs'],
  args: {
    label: 'Значение',
    placeholder: 'Выберите значение',
    description: 'Выберите одно из доступных значений.',
    options,
    value: '',
    disabled: false,
  },
};

export const Playground = { render: args => createSelect(args).element };
export const Selected = { args: { value: 'two' }, render: args => createSelect(args).element };
export const Error = { args: { error: 'Выберите обязательное значение.' }, render: args => createSelect(args).element };

export const DropUp = {
  render: args => {
    const canvas = document.createElement('div');
    canvas.className = 'component-drop-up-story';
    const select = createSelect(args);
    canvas.append(select.element);
    requestAnimationFrame(() => select.open());
    return canvas;
  },
};
