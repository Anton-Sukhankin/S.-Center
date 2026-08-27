let checkboxSequence = 0;

export function createCheckbox({
  id = `ds-checkbox-${++checkboxSequence}`,
  label,
  ariaLabel,
  checked = false,
  indeterminate = false,
  disabled = false,
  value = 'on',
  name,
  className = '',
  inputClassName = '',
  attributes = {},
  onChange,
} = {}) {
  const element = document.createElement('label');
  element.className = ['ds-checkbox', 'ds-checkbox--native', className].filter(Boolean).join(' ');
  element.htmlFor = id;

  const input = document.createElement('input');
  input.id = id;
  input.className = ['ds-checkbox__native-control', inputClassName].filter(Boolean).join(' ');
  input.type = 'checkbox';
  input.checked = checked;
  input.indeterminate = indeterminate;
  input.disabled = disabled;
  input.value = value;
  if (name) input.name = name;
  if (ariaLabel) input.setAttribute('aria-label', ariaLabel);
  Object.entries(attributes).forEach(([attribute, attributeValue]) => {
    if (attributeValue === undefined || attributeValue === null || attributeValue === false) return;
    input.setAttribute(attribute, attributeValue === true ? '' : String(attributeValue));
  });

  const box = document.createElement('span');
  box.className = 'ds-checkbox__box';
  box.setAttribute('aria-hidden', 'true');

  const labelElement = document.createElement('span');
  labelElement.className = 'ds-checkbox__label';
  labelElement.textContent = label || '';

  element.append(input, box, labelElement);
  if (onChange) input.addEventListener('change', event => onChange(event.target.checked, event));

  return {
    element,
    input,
    setChecked(nextChecked, nextIndeterminate = false) {
      input.checked = Boolean(nextChecked);
      input.indeterminate = Boolean(nextIndeterminate);
    },
  };
}
