import { createFieldShell, setAttributes, setFieldError } from './dom.js';

let inputSequence = 0;

export function createInput({
  id = `ds-input-${++inputSequence}`,
  label,
  description,
  error,
  value = '',
  placeholder = '',
  type = 'text',
  required = false,
  disabled = false,
  readOnly = false,
  className = '',
  leadingIcon,
  trailingAction,
  attributes = {},
  onInput,
  onChange,
} = {}) {
  const shell = createFieldShell({ id, label, description, required });
  shell.element.className = ['ds-field', className].filter(Boolean).join(' ');
  const input = document.createElement('input');
  input.id = id;
  input.className = 'ds-input';
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.required = required;
  input.disabled = disabled;
  input.readOnly = readOnly;
  setAttributes(input, attributes);

  let control = input;
  if (leadingIcon || trailingAction) {
    control = document.createElement('div');
    control.className = 'ds-input-control';
    if (leadingIcon) {
      const icon = document.createElement('span');
      icon.className = 'ds-input-control__leading';
      icon.setAttribute('aria-hidden', 'true');
      icon.append(leadingIcon);
      control.append(icon);
    }
    control.append(input);
    if (trailingAction) {
      const action = document.createElement('span');
      action.className = 'ds-input-control__trailing';
      action.append(trailingAction);
      control.append(action);
    }
  }

  shell.element.append(control, shell.helperElement);

  const setError = message => {
    setFieldError(shell, input, message);
  };

  setError(error);
  if (onInput) input.addEventListener('input', event => onInput(event.target.value, event));
  if (onChange) input.addEventListener('change', event => onChange(event.target.value, event));

  return {
    element: shell.element,
    input,
    control,
    setValue(nextValue) {
      input.value = nextValue ?? '';
    },
    setError,
  };
}
