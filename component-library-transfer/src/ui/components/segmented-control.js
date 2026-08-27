import { appendContent, setAttributes } from './dom.js';

function getItemValue(item) {
  if (!item) return '';
  return item.dataset.value || item.dataset.view || item.dataset.status || '';
}

function createSvgChild(name, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  setAttributes(element, attributes);
  return element;
}

export function createViewModeSegmentIcon(mode) {
  const svg = createSvgChild('svg', {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': true,
    focusable: false,
  });

  if (mode === 'cards') {
    [
      { x: 3, y: 3, width: 7, height: 7 },
      { x: 14, y: 3, width: 7, height: 7 },
      { x: 14, y: 14, width: 7, height: 7 },
      { x: 3, y: 14, width: 7, height: 7 },
    ].forEach(attributes => svg.append(createSvgChild('rect', attributes)));
    return svg;
  }

  [6, 12, 18].forEach(y => {
    svg.append(createSvgChild('line', { x1: 8, y1: y, x2: 21, y2: y }));
    svg.append(createSvgChild('line', { x1: 3, y1: y, x2: 3.01, y2: y }));
  });
  return svg;
}

export function bindSegmentedControl(element, { value, onChange } = {}) {
  const items = Array.from(element.querySelectorAll('.ds-segmented-control__item'));

  const setValue = nextValue => {
    items.forEach(item => {
      const isActive = getItemValue(item) === nextValue;
      item.classList.toggle('is-active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });
  };

  items.forEach(item => {
    item.type = 'button';
    item.addEventListener('click', event => {
      if (item.disabled) return;
      const nextValue = getItemValue(item);
      setValue(nextValue);
      onChange?.(nextValue, event);
    });
    item.addEventListener('keydown', event => {
      const enabledItems = items.filter(candidate => !candidate.disabled);
      const currentIndex = enabledItems.indexOf(item);
      if (currentIndex < 0) return;

      const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
      let target = null;
      if (direction) target = enabledItems[(currentIndex + direction + enabledItems.length) % enabledItems.length];
      if (event.key === 'Home') target = enabledItems[0];
      if (event.key === 'End') target = enabledItems.at(-1);
      if (!target) return;

      event.preventDefault();
      target.focus();
      target.click();
    });
  });

  const initialValue = value || getItemValue(items.find(item => item.classList.contains('is-active'))) || getItemValue(items[0]);
  setValue(initialValue);
  return {
    element,
    items,
    getValue: () => getItemValue(items.find(item => item.classList.contains('is-active'))),
    setValue,
  };
}

export function createSegmentedControl({
  label,
  items = [],
  value,
  onChange,
  size = 'default',
  className = '',
  attributes = {},
} = {}) {
  const element = document.createElement('div');
  element.className = [
    'ds-segmented-control',
    size === 'compact' ? 'ds-segmented-control--compact' : '',
    className,
  ].filter(Boolean).join(' ');
  element.setAttribute('role', 'group');
  if (label) element.setAttribute('aria-label', label);
  setAttributes(element, attributes);

  items.forEach(item => {
    const button = document.createElement('button');
    button.className = ['ds-segmented-control__item', item.className || ''].filter(Boolean).join(' ');
    button.dataset.value = item.value;
    if (item.ariaLabel) button.setAttribute('aria-label', item.ariaLabel);
    if (item.title) button.title = item.title;
    button.disabled = Boolean(item.disabled);
    setAttributes(button, item.attributes);
    if (item.icon) appendContent(button, item.icon);
    if (item.label) appendContent(button, item.label);
    element.append(button);
  });

  return bindSegmentedControl(element, { value, onChange });
}
