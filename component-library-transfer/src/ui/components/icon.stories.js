import { createIcon } from './icon.js';

const createFallback = ({ name }) => {
  const fallback = document.createElement('span');
  fallback.textContent = name === 'plus' ? '+' : '○';
  return fallback;
};

export default {
  title: 'Utilities/Icon',
  tags: ['autodocs'],
  args: { name: 'plus', size: 20, label: 'Добавить' },
};

export const Fallback = {
  render: args => createIcon({ ...args, fallback: createFallback }),
};

export const Decorative = {
  args: { label: undefined, size: 16 },
  render: args => createIcon({ ...args, fallback: createFallback }),
};
