import { appendContent, setAttributes } from './dom.js';

export const CHIP_KINDS = Object.freeze(['filter', 'assist', 'suggestion', 'input']);
export const CHIP_SIZES = Object.freeze(['small', 'medium', 'large']);

export function createChip({
  label,
  content,
  kind = 'filter',
  size = 'medium',
  selected = false,
  disabled = false,
  leadingIcon,
  removable = kind === 'input',
  removeLabel,
  className = '',
  attributes = {},
  onClick,
  onChange,
  onRemove,
} = {}) {
  if (!CHIP_KINDS.includes(kind)) throw new Error(`Unknown chip kind: ${kind}`);
  if (!CHIP_SIZES.includes(size)) throw new Error(`Unknown chip size: ${size}`);

  const isFilter = kind === 'filter';
  const isInput = kind === 'input';
  if (removable && !isInput) {
    throw new Error('Only input chips can be removable.');
  }
  const element = document.createElement(isInput ? 'span' : 'button');
  element.className = [
    'ds-chip',
    `ds-chip--${kind}`,
    `ds-chip--${size}`,
    className,
  ].filter(Boolean).join(' ');

  if (!isInput) element.type = 'button';
  setAttributes(element, attributes);

  const leadingElement = document.createElement('span');
  leadingElement.className = 'ds-chip__leading';
  leadingElement.setAttribute('aria-hidden', 'true');
  appendContent(leadingElement, leadingIcon);
  if (leadingIcon !== undefined && leadingIcon !== null) element.append(leadingElement);

  const contentElement = document.createElement('span');
  contentElement.className = 'ds-chip__label';
  appendContent(contentElement, content === undefined ? label : content);
  element.append(contentElement);

  let isSelected = Boolean(selected);
  let isDisabled = Boolean(disabled);
  let removeButton = null;

  const syncState = () => {
    element.classList.toggle('is-selected', isFilter && isSelected);
    element.classList.toggle('is-disabled', isDisabled);
    if (isFilter) element.setAttribute('aria-pressed', String(isSelected));
    if (isInput) element.setAttribute('aria-disabled', String(isDisabled));
    else element.disabled = isDisabled;
    if (removeButton) removeButton.disabled = isDisabled;
  };

  const setSelected = (nextSelected, { emit = false, event } = {}) => {
    if (!isFilter) return false;
    const normalized = Boolean(nextSelected);
    if (normalized === isSelected) return false;
    isSelected = normalized;
    syncState();
    if (emit) onChange?.(isSelected, event);
    return true;
  };

  if (!isInput) {
    element.addEventListener('click', event => {
      if (isDisabled) return;
      if (isFilter) setSelected(!isSelected, { emit: true, event });
      onClick?.(event, { selected: isSelected });
    });
  }

  if (removable) {
    removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'ds-chip__remove';
    removeButton.setAttribute(
      'aria-label',
      removeLabel || (typeof label === 'string' ? `Удалить ${label}` : 'Удалить значение')
    );
    removeButton.textContent = '×';
    removeButton.addEventListener('click', event => {
      if (isDisabled) return;
      event.stopPropagation();
      onRemove?.(event);
    });
    element.append(removeButton);
  }

  syncState();

  return {
    element,
    contentElement,
    removeButton,
    getSelected: () => isSelected,
    setSelected,
    setDisabled(nextDisabled) {
      isDisabled = Boolean(nextDisabled);
      syncState();
    },
  };
}
