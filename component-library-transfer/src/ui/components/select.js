import { createFieldShell, setAttributes, setFieldError } from './dom.js';
import { createDropdownPlacementController } from './dropdown-placement.js';

let selectSequence = 0;
let activeSelectClose = null;
let globalListenersReady = false;

const normalizeOptions = options => (Array.isArray(options) ? options : []).map(option => (
  typeof option === 'object' ? option : { value: option, label: option }
));

function ensureGlobalListeners() {
  if (globalListenersReady) return;
  globalListenersReady = true;
  document.addEventListener('pointerdown', event => activeSelectClose?.(event.target));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !activeSelectClose) return;
    event.preventDefault();
    event.stopPropagation();
    activeSelectClose(null, { restoreFocus: true });
  }, true);
}

export function createSelect({
  id = `ds-select-${++selectSequence}`,
  label,
  description,
  options = [],
  value = '',
  placeholder,
  error,
  required = false,
  disabled = false,
  attributes = {},
  onChange,
} = {}) {
  ensureGlobalListeners();

  const shell = createFieldShell({ id, label, description, required });
  shell.element.classList.add('ds-select-field');

  let normalizedOptions = normalizeOptions(options);
  let isDisabled = Boolean(disabled);
  const select = document.createElement('select');
  select.id = id;
  select.className = 'ds-select__native';
  select.required = required;
  select.disabled = disabled;
  select.tabIndex = -1;
  select.hidden = true;
  select.setAttribute('aria-hidden', 'true');
  setAttributes(select, attributes);

  if (placeholder) {
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    placeholderOption.disabled = required;
    select.append(placeholderOption);
  }

  normalizedOptions.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    optionElement.disabled = Boolean(option.disabled);
    select.append(optionElement);
  });
  select.value = value;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ds-select';
  trigger.disabled = disabled;
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-controls', `${id}-dropdown`);
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-label', attributes['aria-label'] || label || placeholder || 'Выберите значение');
  if (required) trigger.setAttribute('aria-required', 'true');

  const valueElement = document.createElement('span');
  valueElement.className = 'ds-select__value';
  const indicator = document.createElement('span');
  indicator.className = 'ds-select__indicator ds-select-chevron';
  indicator.setAttribute('aria-hidden', 'true');
  trigger.append(valueElement, indicator);

  const dropdown = document.createElement('div');
  dropdown.id = `${id}-dropdown`;
  dropdown.className = 'ds-select__dropdown';
  dropdown.setAttribute('role', 'listbox');
  dropdown.hidden = true;

  const placement = createDropdownPlacementController({
    container: shell.element,
    trigger,
    dropdown,
  });

  let isOpen = false;
  let optionButtons = [];

  const selectedOption = () => normalizedOptions.find(option => String(option.value) === select.value);

  const syncVisualState = () => {
    const selected = selectedOption();
    valueElement.textContent = selected?.label ?? placeholder ?? '';
    valueElement.classList.toggle('is-placeholder', !selected);
    if (selected) trigger.setAttribute('aria-activedescendant', `${id}-option-${normalizedOptions.indexOf(selected)}`);
    else trigger.removeAttribute('aria-activedescendant');
    optionButtons.forEach((button, index) => {
      const isSelected = String(normalizedOptions[index].value) === select.value;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-selected', String(isSelected));
    });
  };

  const close = (outsideTarget, { restoreFocus = false } = {}) => {
    if (outsideTarget && shell.element.contains(outsideTarget)) return;
    if (!isOpen) return;
    isOpen = false;
    dropdown.hidden = true;
    shell.element.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    placement.stop();
    if (activeSelectClose === close) activeSelectClose = null;
    if (restoreFocus) trigger.focus();
  };

  const focusOption = index => {
    const enabled = optionButtons.filter(button => !button.disabled);
    if (!enabled.length) return;
    const current = enabled.indexOf(optionButtons[index]);
    enabled[Math.max(0, current)]?.focus();
  };

  const open = () => {
    if (isDisabled || isOpen) return;
    activeSelectClose?.();
    isOpen = true;
    dropdown.hidden = false;
    shell.element.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    placement.start();
    activeSelectClose = close;
    const selectedIndex = normalizedOptions.findIndex(option => String(option.value) === select.value && !option.disabled);
    requestAnimationFrame(() => focusOption(selectedIndex >= 0 ? selectedIndex : 0));
  };

  const choose = (nextValue, event) => {
    if (select.value === String(nextValue)) {
      close(null, { restoreFocus: true });
      return;
    }
    select.value = nextValue;
    syncVisualState();
    close(null, { restoreFocus: true });
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const createOptionButton = (option, index) => {
    const optionButton = document.createElement('button');
    optionButton.id = `${id}-option-${index}`;
    optionButton.type = 'button';
    optionButton.className = 'ds-select__option';
    optionButton.textContent = option.label;
    optionButton.disabled = Boolean(option.disabled);
    optionButton.setAttribute('role', 'option');
    optionButton.addEventListener('click', event => choose(option.value, event));
    optionButton.addEventListener('keydown', event => {
      const enabled = optionButtons.filter(button => !button.disabled);
      const enabledIndex = enabled.indexOf(optionButton);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        enabled[(enabledIndex + 1) % enabled.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        enabled[(enabledIndex - 1 + enabled.length) % enabled.length]?.focus();
      } else if (event.key === 'Home') {
        event.preventDefault();
        enabled[0]?.focus();
      } else if (event.key === 'End') {
        event.preventDefault();
        enabled.at(-1)?.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close(null, { restoreFocus: true });
      }
    });
    return optionButton;
  };

  const renderDropdownOptions = () => {
    dropdown.replaceChildren();
    optionButtons = normalizedOptions.map((option, index) => createOptionButton(option, index));
    if (optionButtons.length) {
      dropdown.append(...optionButtons);
      return;
    }

    const empty = document.createElement('span');
    empty.className = 'ds-select__empty';
    empty.textContent = 'Нет доступных значений';
    dropdown.append(empty);
  };

  const renderNativeOptions = () => {
    select.replaceChildren();
    if (placeholder) {
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = placeholder;
      placeholderOption.disabled = required;
      select.append(placeholderOption);
    }
    normalizedOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      optionElement.disabled = Boolean(option.disabled);
      select.append(optionElement);
    });
  };

  renderDropdownOptions();

  trigger.addEventListener('click', () => (isOpen ? close() : open()));
  trigger.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      open();
    }
  });

  shell.element.append(select, trigger, dropdown, shell.helperElement);

  const setError = message => {
    setFieldError(shell, [select, trigger], message);
  };

  select.addEventListener('change', event => {
    syncVisualState();
    onChange?.(event.target.value, event);
  });
  select.focus = options => trigger.focus(options);
  shell.element.querySelector('.ds-field__label')?.addEventListener('click', event => {
    event.preventDefault();
    trigger.focus();
  });
  syncVisualState();
  setError(error);

  return {
    element: shell.element,
    select,
    trigger,
    dropdown,
    setValue(nextValue) {
      select.value = nextValue ?? '';
      syncVisualState();
    },
    setOptions(nextOptions = [], { value: nextValue = select.value } = {}) {
      close();
      normalizedOptions = normalizeOptions(nextOptions);
      renderNativeOptions();
      renderDropdownOptions();
      const requestedValue = String(nextValue ?? '');
      const hasRequestedValue = normalizedOptions.some(option => String(option.value) === requestedValue);
      select.value = hasRequestedValue
        ? requestedValue
        : (placeholder ? '' : String(normalizedOptions.find(option => !option.disabled)?.value ?? ''));
      syncVisualState();
    },
    setDisabled(nextDisabled) {
      isDisabled = Boolean(nextDisabled);
      select.disabled = isDisabled;
      trigger.disabled = isDisabled;
      shell.element.classList.toggle('is-disabled', isDisabled);
      if (isDisabled) close();
    },
    setError,
    open,
    close,
    destroy() {
      close();
      placement.destroy();
    },
  };
}
