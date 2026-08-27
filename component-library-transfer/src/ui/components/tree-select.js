import { createDropdownPlacementController } from './dropdown-placement.js';
import { setAttributes } from './dom.js';
import { createPackageDisclosureIcon } from './package-disclosure-icon.js';
import { createTag } from './tag.js';
import { createTree } from './tree.js';

let treeSelectSequence = 0;

export function createTreeSelect({
  id = `ds-tree-select-${++treeSelectSequence}`,
  label,
  placeholder = 'Выберите значение',
  nodes = [],
  selectedIds = [],
  expandedIds = [],
  multiple = true,
  cascadeSelection = false,
  disabled = false,
  className = '',
  attributes = {},
  onChange,
  onOpenChange,
} = {}) {
  const element = document.createElement('div');
  element.className = ['ds-field', 'ds-tree-select', className].filter(Boolean).join(' ');
  setAttributes(element, attributes);

  if (label) {
    const labelElement = document.createElement('label');
    labelElement.className = 'ds-field__label';
    labelElement.htmlFor = id;
    labelElement.textContent = label;
    element.append(labelElement);
  }

  const control = document.createElement('button');
  control.id = id;
  control.type = 'button';
  control.className = 'ds-tree-select__control';
  control.disabled = disabled;
  control.setAttribute('aria-haspopup', 'tree');
  control.setAttribute('aria-expanded', 'false');
  control.setAttribute('aria-controls', `${id}-dropdown`);

  const icon = document.createElement('span');
  icon.className = 'ds-tree-select__icon';
  icon.append(createPackageDisclosureIcon({ state: 'leaf' }));
  const value = document.createElement('span');
  value.className = 'ds-tree-select__value';
  const indicatorSlot = document.createElement('span');
  indicatorSlot.className = 'ds-tree-select__indicator-slot ds-select-indicator-slot';
  indicatorSlot.setAttribute('aria-hidden', 'true');
  const indicator = document.createElement('span');
  indicator.className = 'ds-tree-select__indicator ds-select-chevron';
  indicator.setAttribute('aria-hidden', 'true');
  indicatorSlot.append(indicator);
  control.append(icon, value, indicatorSlot);

  const dropdown = document.createElement('div');
  dropdown.id = `${id}-dropdown`;
  dropdown.className = 'ds-tree-select__dropdown';
  dropdown.hidden = true;

  let isOpen = false;
  let destroyed = false;
  let currentSelectedIds = selectedIds.map(String);
  let currentExpandedIds = expandedIds.map(String);

  const tree = createTree({
    label: label || placeholder,
    nodes,
    selectionMode: multiple ? 'multiple' : 'single',
    cascadeSelection,
    branchClickAction: 'toggle',
    selectedIds: currentSelectedIds,
    expandedIds: currentExpandedIds,
    className: 'ds-tree-select__tree',
    onSelectionChange(ids, detail) {
      currentSelectedIds = ids;
      syncValue();
      onChange?.(ids, detail);
    },
    onToggle(id, expanded, ids) {
      currentExpandedIds = ids;
    },
  });
  dropdown.append(tree.element);
  element.append(control, dropdown);

  const placement = createDropdownPlacementController({ container: element, trigger: control, dropdown });

  function syncValue() {
    const count = currentSelectedIds.length;
    value.replaceChildren();
    if (count > 0 && multiple) {
      const selectionTag = createTag({
        label: `Выбрано: ${count}`,
        variant: 'neutral',
        className: 'ds-tree-select__selection-tag',
      });
      value.append(selectionTag.element);
    } else {
      value.textContent = count > 0 ? String(count) : placeholder;
    }
    value.classList.toggle('is-placeholder', count === 0);
    control.setAttribute('aria-label', count > 0 ? `${label || placeholder}. Выбрано: ${count}` : (label || placeholder));
  }

  function setOpen(nextOpen, { focus = true } = {}) {
    if (destroyed) return false;
    isOpen = Boolean(nextOpen) && !control.disabled;
    element.classList.toggle('is-open', isOpen);
    control.setAttribute('aria-expanded', String(isOpen));
    dropdown.hidden = !isOpen;
    if (isOpen) placement.start();
    else placement.stop();
    if (!isOpen && focus) control.focus();
    onOpenChange?.(isOpen);
    return isOpen;
  }

  const handleControlClick = event => {
    event.stopPropagation();
    setOpen(!isOpen, { focus: false });
  };
  const handleDocumentPointerDown = event => {
    if (!element.contains(event.target)) setOpen(false, { focus: false });
  };
  const handleKeydown = event => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'ArrowDown' && !isOpen) {
      event.preventDefault();
      setOpen(true, { focus: false });
    }
  };

  control.addEventListener('click', handleControlClick);
  element.addEventListener('keydown', handleKeydown);
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  syncValue();

  return {
    element,
    control,
    dropdown,
    tree,
    isOpen: () => isOpen,
    setOpen,
    setSelectedIds(ids = []) {
      currentSelectedIds = ids.map(String);
      tree.setSelectedIds(currentSelectedIds);
      syncValue();
    },
    setExpandedIds(ids = []) {
      currentExpandedIds = ids.map(String);
      tree.setExpandedIds(currentExpandedIds);
    },
    setNodes(nextNodes = []) {
      tree.setNodes(nextNodes);
    },
    getSelectedIds: () => [...currentSelectedIds],
    getExpandedIds: () => [...currentExpandedIds],
    destroy() {
      if (destroyed) return;
      destroyed = true;
      placement.destroy();
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      control.removeEventListener('click', handleControlClick);
      element.removeEventListener('keydown', handleKeydown);
      element.remove();
    },
  };
}
