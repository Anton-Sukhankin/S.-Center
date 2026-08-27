import { createIcon } from './icon.js';
import { createParameterPair } from './parameter-pair.js';

export default {
  title: 'Data Display/Parameter Pair',
  tags: ['autodocs'],
  args: {
    label: 'Плановый срок',
    value: '01.02.2024–30.06.2024',
    emphasis: 'default',
    truncate: false,
  },
  argTypes: {
    emphasis: { control: 'inline-radio', options: ['default', 'strong'] },
  },
};

export const Playground = {
  render: args => createParameterPair(args).element,
};

export const WithIcon = {
  args: { label: 'Период группы' },
  render: args => createParameterPair({
    ...args,
    icon: createIcon({ name: 'calendar-range', size: 14 }),
  }).element,
};

export const StrongValue = {
  args: {
    label: 'Готовность',
    value: '51%',
    emphasis: 'strong',
  },
  render: args => createParameterPair(args).element,
};

export const States = {
  render: () => {
    const stack = document.createElement('div');
    stack.className = 'component-parameter-pair-story';
    stack.append(
      createParameterPair({ label: 'Плановый срок', value: '01.02.2024–30.06.2024' }).element,
      createParameterPair({ label: 'Подрядчик', value: 'СМУ-1' }).element,
      createParameterPair({ label: 'Готовность', value: '51%', emphasis: 'strong' }).element,
      createParameterPair({
        label: 'Длинное значение',
        value: 'Значение, которое сокращается внутри ограниченного контейнера',
        truncate: true,
      }).element,
    );
    return stack;
  },
};
