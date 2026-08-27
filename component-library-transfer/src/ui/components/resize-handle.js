import { appendContent, setAttributes } from './dom.js';

function normalizeNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function createResizeHandle({
  label = 'Изменить размер',
  orientation = 'vertical',
  value = 0,
  defaultValue = value,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 8,
  largeStep = step * 4,
  direction = 1,
  disabled = false,
  indicator,
  className = '',
  attributes = {},
  formatValue = currentValue => String(currentValue),
  onResizeStart,
  onChange,
  onResizeEnd,
  onResizeStateChange,
} = {}) {
  if (!['vertical', 'horizontal'].includes(orientation)) {
    throw new Error(`Unknown resize handle orientation: ${orientation}`);
  }

  let minimum = normalizeNumber(min, 0);
  let maximum = Math.max(minimum, normalizeNumber(max, Number.MAX_SAFE_INTEGER));
  const clamp = nextValue => Math.min(maximum, Math.max(minimum, normalizeNumber(nextValue, minimum)));

  const element = document.createElement('div');
  element.className = ['ds-resize-handle', `ds-resize-handle--${orientation}`, className].filter(Boolean).join(' ');
  element.setAttribute('role', 'separator');
  element.setAttribute('aria-label', label);
  element.setAttribute('aria-orientation', orientation);
  element.tabIndex = 0;
  element.title = orientation === 'vertical'
    ? 'Перетащите для изменения ширины. Двойной клик — ширина по умолчанию'
    : 'Перетащите для изменения высоты. Двойной клик — высота по умолчанию';
  setAttributes(element, attributes);

  const indicatorElement = document.createElement('span');
  indicatorElement.className = 'ds-resize-indicator';
  indicatorElement.setAttribute('aria-hidden', 'true');
  if (indicator !== undefined) appendContent(indicatorElement, indicator);
  else indicatorElement.textContent = orientation === 'vertical' ? '↔' : '↕';
  element.append(indicatorElement);

  let current = clamp(value);
  let dragging = false;
  let startCoordinate = 0;
  let startValue = current;
  let activePointerId = null;
  let previousBodyCursor = '';
  let previousBodyUserSelect = '';
  let isDisabled = Boolean(disabled);

  const syncValue = () => {
    element.setAttribute('aria-valuemin', String(minimum));
    element.setAttribute('aria-valuemax', String(maximum));
    element.setAttribute('aria-valuenow', String(current));
    element.setAttribute('aria-valuetext', formatValue(current));
  };
  const setValue = (nextValue, { emit = false, event } = {}) => {
    const normalized = clamp(nextValue);
    if (normalized === current) return false;
    current = normalized;
    syncValue();
    if (emit) onChange?.(current, event);
    return true;
  };

  const getCoordinate = event => orientation === 'vertical' ? event.clientX : event.clientY;
  const stopDragging = (event, { emit = true } = {}) => {
    if (!dragging) return;
    dragging = false;
    if (activePointerId !== null && element.hasPointerCapture?.(activePointerId)) {
      element.releasePointerCapture(activePointerId);
    }
    activePointerId = null;
    element.classList.remove('is-resizing');
    document.body.style.cursor = previousBodyCursor;
    document.body.style.userSelect = previousBodyUserSelect;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', stopDragging);
    document.removeEventListener('pointercancel', stopDragging);
    onResizeStateChange?.(false, current, event);
    if (emit) onResizeEnd?.(current, event);
  };
  const handlePointerMove = event => {
    if (!dragging) return;
    const delta = (getCoordinate(event) - startCoordinate) * (direction < 0 ? -1 : 1);
    setValue(startValue + delta, { emit: true, event });
  };
  const handlePointerDown = event => {
    if (isDisabled) return;
    if (event.button !== 0) return;
    event.preventDefault();
    dragging = true;
    activePointerId = event.pointerId;
    element.setPointerCapture?.(event.pointerId);
    startCoordinate = getCoordinate(event);
    startValue = current;
    element.classList.add('is-resizing');
    previousBodyCursor = document.body.style.cursor;
    previousBodyUserSelect = document.body.style.userSelect;
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', stopDragging);
    document.addEventListener('pointercancel', stopDragging);
    onResizeStateChange?.(true, current, event);
    onResizeStart?.(current, event);
  };
  const handleDoubleClick = event => {
    if (isDisabled) return;
    event.preventDefault();
    setValue(defaultValue, { emit: true, event });
    onResizeEnd?.(current, event);
  };
  const handleKeydown = event => {
    if (isDisabled) return;
    const decreaseKey = orientation === 'vertical' ? 'ArrowLeft' : 'ArrowUp';
    const increaseKey = orientation === 'vertical' ? 'ArrowRight' : 'ArrowDown';
    if (![decreaseKey, increaseKey, 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const increment = event.shiftKey ? largeStep : step;
    if (event.key === 'Home') setValue(defaultValue, { emit: true, event });
    else if (event.key === 'End') setValue(maximum, { emit: true, event });
    else setValue(current + (event.key === decreaseKey ? -increment : increment) * (direction < 0 ? -1 : 1), { emit: true, event });
  };

  element.addEventListener('pointerdown', handlePointerDown);
  element.addEventListener('dblclick', handleDoubleClick);
  element.addEventListener('keydown', handleKeydown);
  element.setAttribute('aria-disabled', String(isDisabled));
  if (isDisabled) element.tabIndex = -1;
  syncValue();

  return {
    element,
    getValue: () => current,
    setValue,
    setBounds(nextMin, nextMax) {
      minimum = normalizeNumber(nextMin, minimum);
      maximum = Math.max(minimum, normalizeNumber(nextMax, maximum));
      current = clamp(current);
      syncValue();
    },
    setDisabled(nextDisabled) {
      isDisabled = Boolean(nextDisabled);
      element.setAttribute('aria-disabled', String(isDisabled));
      element.tabIndex = isDisabled ? -1 : 0;
      if (isDisabled) stopDragging(undefined, { emit: false });
    },
    destroy() {
      stopDragging(undefined, { emit: false });
      element.removeEventListener('pointerdown', handlePointerDown);
      element.removeEventListener('dblclick', handleDoubleClick);
      element.removeEventListener('keydown', handleKeydown);
      element.remove();
    },
  };
}
