import { createCheckbox } from './checkbox.js';
import { setAttributes } from './dom.js';
import { createDropdownPlacementController } from './dropdown-placement.js';

let multiSelectSequence = 0;

function normalizeOptions(options = []) {
  const uniqueOptions = new Map();

  options.forEach(option => {
    const normalized = typeof option === 'object' && option !== null
      ? {
          value: option.value,
          label: String(option.label ?? option.value ?? ''),
          disabled: Boolean(option.disabled),
        }
      : { value: option, label: String(option ?? ''), disabled: false };

    if (!uniqueOptions.has(normalized.value)) uniqueOptions.set(normalized.value, normalized);
  });

  return Array.from(uniqueOptions.values());
}

function normalizeTagLimit(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, Math.trunc(numericValue)) : 1;
}

export function createMultiSelect({
  id = `ds-multi-select-${++multiSelectSequence}`,
  label,
  placeholder = 'Выберите значения',
  options = [],
  values = [],
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Поиск',
  maxVisibleTags = 1,
  clearable = false,
  clearLabel = 'Очистить выбранные значения',
  clearOverflowLabel = 'Удалить скрытые значения',
  emptyMessage = 'Нет доступных значений',
  className = '',
  attributes = {},
  onChange,
} = {}) {
  const element = document.createElement('div');
  element.className = ['ds-field', 'ds-multi-select', 'ds-multi-select--component', className].filter(Boolean).join(' ');
  setAttributes(element, attributes);

  let labelElement = null;
  if (label) {
    labelElement = document.createElement('label');
    labelElement.className = 'ds-field__label';
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    element.append(labelElement);
  }

  const control = document.createElement('div');
  control.className = 'ds-multi-select__control';

  const tags = document.createElement('div');
  tags.className = 'ds-multi-select__tags';

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'ds-multi-select__clear';
  clearButton.setAttribute('aria-label', clearLabel);
  clearButton.title = clearLabel;
  clearButton.textContent = '×';

  const trigger = document.createElement('button');
  trigger.id = id;
  trigger.type = 'button';
  trigger.className = 'ds-multi-select__trigger ds-select-indicator-slot';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-controls', `${id}-dropdown`);
  trigger.setAttribute('aria-label', label || placeholder);
  const triggerIndicator = document.createElement('span');
  triggerIndicator.className = 'ds-multi-select__trigger-indicator ds-select-chevron';
  triggerIndicator.setAttribute('aria-hidden', 'true');
  trigger.append(triggerIndicator);

  const dropdown = document.createElement('div');
  dropdown.id = `${id}-dropdown`;
  dropdown.className = 'ds-multi-select__dropdown';
  dropdown.setAttribute('role', 'dialog');
  dropdown.setAttribute('aria-label', label || placeholder);
  dropdown.hidden = true;

  const placement = createDropdownPlacementController({ container: element, trigger: control, dropdown });

  let searchInput = null;
  if (searchable) {
    searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'ds-multi-select__search';
    searchInput.placeholder = searchPlaceholder;
    searchInput.setAttribute('aria-label', searchPlaceholder);
    dropdown.append(searchInput);
  }

  const optionGroup = document.createElement('div');
  optionGroup.className = 'ds-multi-select__options';
  optionGroup.setAttribute('role', 'group');
  optionGroup.setAttribute('aria-label', label || placeholder);
  dropdown.append(optionGroup);

  const visibleTagLimit = normalizeTagLimit(maxVisibleTags);
  let currentOptions = normalizeOptions(options);
  let selected = new Set(values);
  let optionControls = [];
  let searchQuery = '';
  let isDisabled = Boolean(disabled);
  let isOpen = false;
  let overflowOpen = false;
  let overflowElement = null;
  let overflowButton = null;
  let focusFrame = 0;
  let destroyed = false;

  const getOption = value => currentOptions.find(option => Object.is(option.value, value));
  const getLabel = value => getOption(value)?.label ?? String(value ?? '');
  const isValueDisabled = value => Boolean(getOption(value)?.disabled);
  const getValues = () => Array.from(selected);
  const emitChange = (event, reason) => onChange?.(getValues(), event, reason);

  const syncOptionControls = () => {
    optionControls.forEach(({ option, control: checkbox }) => {
      checkbox.setChecked(selected.has(option.value));
      checkbox.input.disabled = isDisabled || option.disabled;
    });
  };

  const setOverflowOpen = nextOpen => {
    const shouldOpen = Boolean(nextOpen) && !isDisabled && Boolean(overflowElement);
    overflowOpen = shouldOpen;
    if (overflowElement) overflowElement.hidden = !shouldOpen;
    if (overflowButton) overflowButton.setAttribute('aria-expanded', String(shouldOpen));
    return shouldOpen;
  };

  const renderTags = () => {
    const keepOverflowOpen = overflowOpen;
    tags.replaceChildren();
    overflowOpen = false;
    overflowElement = null;
    overflowButton = null;

    const selectedValues = getValues();
    if (selectedValues.length === 0) {
      const placeholderElement = document.createElement('span');
      placeholderElement.className = 'ds-multi-select__placeholder';
      placeholderElement.textContent = placeholder;
      tags.append(placeholderElement);
      clearButton.hidden = true;
      return;
    }

    const visibleValues = selectedValues.slice(0, visibleTagLimit);
    const hiddenValues = selectedValues.slice(visibleTagLimit);

    visibleValues.forEach(value => {
      const tag = document.createElement('span');
      tag.className = 'ds-multi-select__tag';
      const tagLabel = document.createElement('span');
      tagLabel.className = 'ds-multi-select__tag-label';
      tagLabel.textContent = getLabel(value);
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'ds-multi-select__tag-remove';
      removeButton.setAttribute('aria-label', `Удалить ${getLabel(value)}`);
      removeButton.textContent = '×';
      removeButton.disabled = isDisabled || isValueDisabled(value);
      removeButton.addEventListener('click', event => {
        event.stopPropagation();
        selected.delete(value);
        renderTags();
        syncOptionControls();
        emitChange(event, 'remove-tag');
        trigger.focus();
      });
      tag.append(tagLabel, removeButton);
      tags.append(tag);
    });

    if (hiddenValues.length > 0) {
      const overflowWrapper = document.createElement('span');
      overflowWrapper.className = 'ds-multi-select__overflow';

      overflowButton = document.createElement('button');
      overflowButton.type = 'button';
      overflowButton.className = 'ds-multi-select__overflow-button';
      overflowButton.textContent = `+${hiddenValues.length}`;
      overflowButton.setAttribute('aria-label', `Ещё выбрано: ${hiddenValues.length}`);
      overflowButton.setAttribute('aria-expanded', 'false');
      overflowButton.setAttribute('aria-controls', `${id}-overflow`);
      overflowButton.disabled = isDisabled;

      overflowElement = document.createElement('div');
      overflowElement.id = `${id}-overflow`;
      overflowElement.className = 'ds-multi-select__overflow-popover';
      overflowElement.setAttribute('role', 'dialog');
      overflowElement.setAttribute('aria-label', 'Скрытые выбранные значения');
      overflowElement.hidden = true;

      const overflowList = document.createElement('div');
      overflowList.className = 'ds-multi-select__overflow-list';
      overflowList.setAttribute('role', 'list');
      hiddenValues.forEach(value => {
        const row = document.createElement('div');
        row.className = 'ds-multi-select__overflow-item';
        row.setAttribute('role', 'listitem');
        const rowLabel = document.createElement('span');
        rowLabel.textContent = getLabel(value);
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'ds-multi-select__overflow-remove';
        removeButton.setAttribute('aria-label', `Удалить ${getLabel(value)}`);
        removeButton.textContent = '×';
        removeButton.disabled = isDisabled || isValueDisabled(value);
        removeButton.addEventListener('click', event => {
          event.stopPropagation();
          selected.delete(value);
          renderTags();
          syncOptionControls();
          emitChange(event, 'remove-overflow');
          if (overflowButton) {
            setOverflowOpen(true);
            overflowButton.focus();
          } else {
            trigger.focus();
          }
        });
        row.append(rowLabel, removeButton);
        overflowList.append(row);
      });
      overflowElement.append(overflowList);

      const removableHiddenValues = hiddenValues.filter(value => !isValueDisabled(value));
      if (removableHiddenValues.length > 0) {
        const clearOverflowButton = document.createElement('button');
        clearOverflowButton.type = 'button';
        clearOverflowButton.className = 'ds-multi-select__overflow-clear';
        clearOverflowButton.textContent = clearOverflowLabel;
        clearOverflowButton.disabled = isDisabled;
        clearOverflowButton.addEventListener('click', event => {
          event.stopPropagation();
          removableHiddenValues.forEach(value => selected.delete(value));
          renderTags();
          syncOptionControls();
          emitChange(event, 'clear-overflow');
          trigger.focus();
        });
        overflowElement.append(clearOverflowButton);
      }

      overflowButton.addEventListener('click', event => {
        event.stopPropagation();
        setOverflowOpen(true);
      });
      overflowWrapper.addEventListener('mouseenter', () => setOverflowOpen(true));
      overflowWrapper.addEventListener('mouseleave', () => {
        if (!overflowWrapper.contains(document.activeElement)) setOverflowOpen(false);
      });
      overflowWrapper.addEventListener('focusin', () => setOverflowOpen(true));
      overflowWrapper.addEventListener('focusout', event => {
        if (!overflowWrapper.contains(event.relatedTarget) && !overflowWrapper.matches(':hover')) {
          setOverflowOpen(false);
        }
      });
      overflowWrapper.append(overflowButton, overflowElement);
      tags.append(overflowWrapper);
      if (keepOverflowOpen) setOverflowOpen(true);
    }

    clearButton.hidden = !clearable;
    clearButton.disabled = isDisabled || selectedValues.every(isValueDisabled);
  };

  const renderOptions = () => {
    optionGroup.replaceChildren();
    optionControls = [];
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const visibleOptions = normalizedQuery
      ? currentOptions.filter(option => option.label.toLocaleLowerCase().includes(normalizedQuery))
      : currentOptions;

    if (visibleOptions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'ds-multi-select__empty';
      empty.setAttribute('role', 'status');
      empty.textContent = emptyMessage;
      optionGroup.append(empty);
      return;
    }

    visibleOptions.forEach((option, index) => {
      const checkbox = createCheckbox({
        id: `${id}-option-${index + 1}`,
        label: option.label,
        value: String(option.value ?? ''),
        checked: selected.has(option.value),
        disabled: isDisabled || option.disabled,
        onChange: (checked, event) => {
          if (checked) selected.add(option.value);
          else selected.delete(option.value);
          renderTags();
          emitChange(event, checked ? 'select' : 'deselect');
        },
      });
      checkbox.element.classList.add('ds-multi-select__option');
      optionControls.push({ option, control: checkbox });
      optionGroup.append(checkbox.element);
    });
  };

  const setOpen = (nextOpen, { focus = true, returnFocus = false } = {}) => {
    if (destroyed) return false;
    const shouldOpen = Boolean(nextOpen) && !isDisabled;
    isOpen = shouldOpen;
    element.classList.toggle('is-open', shouldOpen);
    trigger.setAttribute('aria-expanded', String(shouldOpen));
    dropdown.hidden = !shouldOpen;

    if (shouldOpen) {
      setOverflowOpen(false);
      placement.start();
      if (focus) {
        window.cancelAnimationFrame(focusFrame);
        focusFrame = window.requestAnimationFrame(() => {
          if (!destroyed && isOpen) (searchInput || optionGroup.querySelector('input:not(:disabled)'))?.focus();
        });
      }
    } else {
      placement.stop();
      if (searchQuery) {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        renderOptions();
      }
      if (returnFocus) trigger.focus();
    }

    return shouldOpen;
  };

  const clearSelection = (event, reason = 'clear') => {
    const nextSelected = getValues().filter(isValueDisabled);
    if (nextSelected.length === selected.size) return;
    selected = new Set(nextSelected);
    renderTags();
    syncOptionControls();
    emitChange(event, reason);
    trigger.focus();
  };

  trigger.addEventListener('click', event => {
    event.stopPropagation();
    setOpen(!isOpen);
  });
  control.addEventListener('click', event => {
    if (isDisabled || event.target.closest('button, input, label')) return;
    setOpen(!isOpen);
  });
  clearButton.addEventListener('click', event => {
    event.stopPropagation();
    clearSelection(event);
  });
  element.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (overflowOpen) {
      event.preventDefault();
      event.stopPropagation();
      setOverflowOpen(false);
      overflowButton?.focus();
    } else if (isOpen) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, { returnFocus: true });
    }
  });
  if (searchInput) {
    searchInput.addEventListener('input', event => {
      searchQuery = event.target.value;
      renderOptions();
    });
  }

  const handleDocumentPointerDown = event => {
    if (element.contains(event.target)) return;
    setOverflowOpen(false);
    setOpen(false, { focus: false });
  };
  document.addEventListener('pointerdown', handleDocumentPointerDown);

  control.append(tags);
  if (clearable) control.append(clearButton);
  control.append(trigger);
  element.append(control, dropdown);
  renderOptions();
  renderTags();
  trigger.disabled = isDisabled;
  if (searchInput) searchInput.disabled = isDisabled;
  element.classList.toggle('is-disabled', isDisabled);

  return {
    element,
    trigger,
    dropdown,
    searchInput,
    getValues,
    setOptions(nextOptions = []) {
      currentOptions = normalizeOptions(nextOptions);
      renderOptions();
      renderTags();
    },
    setValues(nextValues = []) {
      selected = new Set(nextValues);
      renderTags();
      syncOptionControls();
    },
    setDisabled(nextDisabled) {
      isDisabled = Boolean(nextDisabled);
      element.classList.toggle('is-disabled', isDisabled);
      trigger.disabled = isDisabled;
      if (searchInput) searchInput.disabled = isDisabled;
      if (isDisabled) {
        setOverflowOpen(false);
        setOpen(false, { focus: false });
      }
      renderTags();
      syncOptionControls();
    },
    setOpen,
    setOverflowOpen,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      placement.destroy();
      element.remove();
    },
  };
}
