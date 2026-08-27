import { appendContent, setAttributes } from './dom.js';

let switchSequence = 0;

export function createSwitch({
  id = `ds-switch-${++switchSequence}`,
  label,
  ariaLabel,
  checked = false,
  disabled = false,
  name,
  value = 'on',
  className = '',
  attributes = {},
  onChange,
} = {}) {
  if (!label && !ariaLabel) throw new Error('Switch requires label or ariaLabel.');

  const element = document.createElement('label');
  element.className = ['ds-switch', className].filter(Boolean).join(' ');
  element.htmlFor = id;

  const input = document.createElement('input');
  input.id = id;
  input.className = 'ds-switch__control';
  input.type = 'checkbox';
  input.setAttribute('role', 'switch');
  input.checked = checked;
  input.disabled = disabled;
  input.value = value;
  if (name) input.name = name;
  setAttributes(input, { 'aria-label': ariaLabel, ...attributes });

  const track = document.createElement('span');
  track.className = 'ds-switch__track';
  track.setAttribute('aria-hidden', 'true');

  element.append(input, track);
  if (label) {
    const labelElement = document.createElement('span');
    labelElement.className = 'ds-switch__label';
    appendContent(labelElement, label);
    element.append(labelElement);
  }

  if (onChange) input.addEventListener('change', event => onChange(event.target.checked, event));

  return {
    element,
    input,
    setChecked(nextChecked) {
      input.checked = Boolean(nextChecked);
    },
    setDisabled(nextDisabled) {
      input.disabled = Boolean(nextDisabled);
    },
  };
}
