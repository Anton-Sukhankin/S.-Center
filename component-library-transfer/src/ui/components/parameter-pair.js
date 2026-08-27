import { appendContent, setAttributes } from './dom.js';

export const PARAMETER_PAIR_EMPHASIS = Object.freeze(['default', 'strong']);

function replaceContent(target, content) {
  target.replaceChildren();
  appendContent(target, content);
}

export function createParameterPair({
  label,
  value,
  icon,
  emphasis = 'default',
  truncate = false,
  className = '',
  attributes = {},
} = {}) {
  if (!PARAMETER_PAIR_EMPHASIS.includes(emphasis)) {
    throw new Error(`Unknown parameter pair emphasis: ${emphasis}`);
  }

  const element = document.createElement('div');
  element.className = [
    'ds-parameter-pair',
    `ds-parameter-pair--${emphasis}`,
    truncate ? 'ds-parameter-pair--truncate' : '',
    className,
  ].filter(Boolean).join(' ');
  setAttributes(element, attributes);

  const labelElement = document.createElement('span');
  labelElement.className = 'ds-parameter-pair__label';
  if (icon !== undefined && icon !== null) {
    const iconElement = document.createElement('span');
    iconElement.className = 'ds-parameter-pair__icon';
    iconElement.setAttribute('aria-hidden', 'true');
    appendContent(iconElement, icon);
    labelElement.append(iconElement);
  }
  const labelText = document.createElement('span');
  labelText.className = 'ds-parameter-pair__label-text';
  appendContent(labelText, label);
  labelElement.append(labelText);

  const valueElement = document.createElement('span');
  valueElement.className = 'ds-parameter-pair__value';
  appendContent(valueElement, value);
  element.append(labelElement, valueElement);

  return {
    element,
    labelElement,
    valueElement,
    setLabel(nextLabel) {
      replaceContent(labelText, nextLabel);
    },
    setValue(nextValue) {
      replaceContent(valueElement, nextValue);
    },
  };
}
