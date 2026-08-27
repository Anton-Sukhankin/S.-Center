export function appendContent(target, content) {
  if (content === undefined || content === null) return;

  if (content instanceof Node) {
    target.append(content);
    return;
  }

  target.append(document.createTextNode(String(content)));
}

export function setAttributes(element, attributes = {}) {
  Object.entries(attributes).forEach(([name, value]) => {
    if (value === undefined || value === null) return;

    const isAriaAttribute = name.toLowerCase().startsWith('aria-');
    if (value === false) {
      if (isAriaAttribute) element.setAttribute(name, 'false');
      else element.removeAttribute(name);
      return;
    }

    element.setAttribute(name, value === true && !isAriaAttribute ? '' : String(value));
  });
}

export function createFieldShell({ id, label, description, required = false }) {
  const element = document.createElement('div');
  element.className = 'ds-field';

  if (label) {
    const labelElement = document.createElement('label');
    labelElement.className = 'ds-field__label';
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    if (required) {
      const marker = document.createElement('span');
      marker.className = 'ds-field__required';
      marker.textContent = ' *';
      marker.setAttribute('aria-hidden', 'true');
      labelElement.append(marker);
    }
    element.append(labelElement);
  }

  const helperElement = document.createElement('div');
  helperElement.className = 'ds-field__description';
  helperElement.id = `${id}-helper`;
  helperElement.textContent = description || '';
  helperElement.hidden = !description;

  return { element, helperElement, description: description || '' };
}

export function setFieldError(shell, controls, message) {
  const hasError = Boolean(message);
  const helperText = hasError ? String(message) : shell.description;
  const fieldControls = Array.isArray(controls) ? controls : [controls];

  shell.element.classList.toggle('has-error', hasError);
  shell.helperElement.className = hasError ? 'ds-field__error' : 'ds-field__description';
  shell.helperElement.textContent = helperText;
  shell.helperElement.hidden = !helperText;

  fieldControls.forEach(control => {
    control.setAttribute('aria-invalid', String(hasError));
    if (helperText) control.setAttribute('aria-describedby', shell.helperElement.id);
    else control.removeAttribute('aria-describedby');
  });
}
