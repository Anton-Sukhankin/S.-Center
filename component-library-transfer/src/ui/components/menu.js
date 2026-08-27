import { createButton } from './button.js';
import { appendContent, setAttributes } from './dom.js';

let menuSequence = 0;

function normalizeItems(items = []) {
  return items.map((item, index) => ({
    id: item.id ?? String(index + 1),
    type: item.type === 'separator' ? 'separator' : 'item',
    label: item.label ?? '',
    icon: item.icon,
    disabled: Boolean(item.disabled),
    danger: Boolean(item.danger),
    onSelect: item.onSelect,
  }));
}

export function createMenu({
  id = `ds-menu-${++menuSequence}`,
  label = 'Меню действий',
  trigger,
  items = [],
  className = '',
  attributes = {},
} = {}) {
  if (trigger instanceof Node && !(trigger instanceof Element)) {
    throw new Error('Menu trigger must be an Element or a Button config.');
  }

  const element = document.createElement('div');
  element.className = ['ds-menu', 'ds-menu--component', className].filter(Boolean).join(' ');
  setAttributes(element, attributes);

  const triggerElement = trigger instanceof Element
    ? trigger
    : createButton(trigger || { label: 'Открыть меню', variant: 'outlined' });
  const usesNativeButton = triggerElement instanceof HTMLButtonElement;
  if (!usesNativeButton && !triggerElement.matches('a[href], input, select, textarea, [tabindex]')) {
    triggerElement.setAttribute('role', 'button');
    triggerElement.tabIndex = 0;
  }
  triggerElement.setAttribute('aria-haspopup', 'menu');
  triggerElement.setAttribute('aria-controls', id);
  triggerElement.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('div');
  menu.id = id;
  menu.className = 'ds-menu__popover';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', label);
  menu.hidden = true;

  let currentItems = normalizeItems(items);
  let itemElements = [];
  let opened = false;
  let destroyed = false;
  let focusFrame = 0;

  const getEnabledItems = () => itemElements.filter(item => !item.disabled);
  const focusItem = (index, enabledItems = getEnabledItems()) => {
    if (enabledItems.length === 0) return false;
    const normalizedIndex = (index + enabledItems.length) % enabledItems.length;
    itemElements.forEach(item => { item.tabIndex = -1; });
    enabledItems[normalizedIndex].tabIndex = 0;
    enabledItems[normalizedIndex].focus();
    return true;
  };

  const setOpen = (nextOpen, { focus = 'first', returnFocus = !nextOpen } = {}) => {
    if (destroyed) return false;
    const triggerDisabled = triggerElement.matches(':disabled, [aria-disabled="true"]');
    const shouldOpen = Boolean(nextOpen) && !triggerDisabled;
    opened = shouldOpen;
    element.classList.toggle('is-open', shouldOpen);
    triggerElement.setAttribute('aria-expanded', String(shouldOpen));
    menu.hidden = !shouldOpen;
    window.cancelAnimationFrame(focusFrame);

    if (shouldOpen && focus !== false) {
      focusFrame = window.requestAnimationFrame(() => {
        if (!destroyed && opened) focusItem(focus === 'last' ? getEnabledItems().length - 1 : 0);
      });
    } else if (!shouldOpen && returnFocus) {
      triggerElement.focus();
    }
    return shouldOpen;
  };

  const renderItems = () => {
    menu.replaceChildren();
    itemElements = [];
    currentItems.forEach(item => {
      if (item.type === 'separator') {
        const separator = document.createElement('div');
        separator.className = 'ds-menu__separator';
        separator.setAttribute('role', 'separator');
        menu.append(separator);
        return;
      }

      const menuItem = document.createElement('button');
      menuItem.type = 'button';
      menuItem.className = ['ds-menu__item', item.danger ? 'ds-menu__item--danger' : ''].filter(Boolean).join(' ');
      menuItem.dataset.menuItemId = String(item.id);
      menuItem.setAttribute('role', 'menuitem');
      menuItem.disabled = item.disabled;
      menuItem.tabIndex = -1;
      if (item.icon instanceof Node) {
        const icon = document.createElement('span');
        icon.className = 'ds-menu__item-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.append(item.icon);
        menuItem.append(icon);
      }
      const itemLabel = document.createElement('span');
      itemLabel.className = 'ds-menu__item-label';
      appendContent(itemLabel, item.label);
      menuItem.append(itemLabel);
      menuItem.addEventListener('focus', () => {
        itemElements.forEach(element => { element.tabIndex = element === menuItem ? 0 : -1; });
      });
      menuItem.addEventListener('click', event => {
        if (item.disabled) return;
        setOpen(false, { returnFocus: true });
        item.onSelect?.(item.id, event);
      });
      menu.append(menuItem);
      itemElements.push(menuItem);
    });
    const [firstEnabled] = getEnabledItems();
    if (firstEnabled) firstEnabled.tabIndex = 0;
  };

  const handleTriggerClick = () => setOpen(!opened);
  const handleTriggerKeydown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true, { focus: event.key === 'ArrowUp' ? 'last' : 'first' });
    } else if (!usesNativeButton && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setOpen(!opened);
    }
  };
  const handleMenuKeydown = event => {
    const enabledItems = getEnabledItems();
    const activeIndex = Math.max(0, enabledItems.indexOf(document.activeElement));
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(activeIndex + 1, enabledItems);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(activeIndex - 1, enabledItems);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0, enabledItems);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(enabledItems.length - 1, enabledItems);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false, { returnFocus: true });
    } else if (event.key === 'Tab') {
      setOpen(false, { returnFocus: false });
    }
  };
  const handleDocumentPointerDown = event => {
    if (!element.contains(event.target)) setOpen(false, { returnFocus: false });
  };

  triggerElement.addEventListener('click', handleTriggerClick);
  triggerElement.addEventListener('keydown', handleTriggerKeydown);
  menu.addEventListener('keydown', handleMenuKeydown);
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  element.append(triggerElement, menu);
  renderItems();

  return {
    element,
    trigger: triggerElement,
    menu,
    isOpen: () => opened,
    setItems(nextItems = []) {
      currentItems = normalizeItems(nextItems);
      renderItems();
      if (opened) {
        window.cancelAnimationFrame(focusFrame);
        focusFrame = window.requestAnimationFrame(() => {
          if (!destroyed && opened) focusItem(0);
        });
      }
    },
    setOpen,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
      triggerElement.removeEventListener('click', handleTriggerClick);
      triggerElement.removeEventListener('keydown', handleTriggerKeydown);
      menu.removeEventListener('keydown', handleMenuKeydown);
      element.remove();
    },
  };
}
