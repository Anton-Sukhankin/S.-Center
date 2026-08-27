import { appendContent, setAttributes } from './dom.js';

const VARIANTS = new Set(['neutral', 'accent', 'success', 'warning', 'danger']);
export const TAG_COLORS = Object.freeze(['cyan', 'purple', 'blue', 'gray', 'green', 'dark-gray', 'red']);
export const TAG_TONES = Object.freeze(['contrast', 'light']);

export function createTag({
  label,
  content,
  variant = 'neutral',
  color,
  tone = 'contrast',
  removable = false,
  removeLabel,
  className = '',
  attributes = {},
  onRemove,
} = {}) {
  if (color && !TAG_COLORS.includes(color)) throw new Error(`Unknown tag color: ${color}`);
  if (color && !TAG_TONES.includes(tone)) throw new Error(`Unknown tag tone: ${tone}`);
  if (!color && !VARIANTS.has(variant)) throw new Error(`Unknown tag variant: ${variant}`);

  const element = document.createElement('span');
  const visualClasses = color
    ? [`ds-tag--color-${color}`, `ds-tag--tone-${tone}`]
    : [`ds-tag--${variant}`];
  element.className = ['ds-tag', 'ds-tag--component', ...visualClasses, className].filter(Boolean).join(' ');
  setAttributes(element, attributes);

  const contentElement = document.createElement('span');
  contentElement.className = 'ds-tag__content';
  appendContent(contentElement, content === undefined ? label : content);
  element.append(contentElement);

  let removeButton = null;
  if (removable) {
    removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'ds-tag__remove';
    removeButton.setAttribute('aria-label', removeLabel || (typeof label === 'string' ? `Удалить ${label}` : 'Удалить тег'));
    removeButton.textContent = '×';
    if (onRemove) removeButton.addEventListener('click', onRemove);
    element.append(removeButton);
  }

  return { element, removeButton };
}
