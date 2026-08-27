import { createFieldShell, setAttributes, setFieldError } from './dom.js';

let textareaSequence = 0;

export function createTextarea({
  id = `ds-textarea-${++textareaSequence}`,
  label,
  description,
  error,
  value = '',
  placeholder = '',
  rows = 4,
  required = false,
  disabled = false,
  readOnly = false,
  className = '',
  controlClassName = '',
  attributes = {},
  onInput,
  onChange,
} = {}) {
  const shell = createFieldShell({ id, label, description, required });
  shell.element.className = ['ds-field', className].filter(Boolean).join(' ');

  const textarea = document.createElement('textarea');
  textarea.id = id;
  textarea.className = ['ds-textarea', controlClassName].filter(Boolean).join(' ');
  textarea.value = value;
  textarea.placeholder = placeholder;
  textarea.rows = rows;
  textarea.required = required;
  textarea.disabled = disabled;
  textarea.readOnly = readOnly;
  setAttributes(textarea, attributes);

  shell.element.append(textarea, shell.helperElement);

  const setError = message => {
    setFieldError(shell, textarea, message);
  };

  setError(error);
  if (onInput) textarea.addEventListener('input', event => onInput(event.target.value, event));
  if (onChange) textarea.addEventListener('change', event => onChange(event.target.value, event));

  return {
    element: shell.element,
    textarea,
    input: textarea,
    setValue(nextValue) {
      textarea.value = nextValue ?? '';
    },
    setError,
  };
}
