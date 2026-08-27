import { createButton } from './button.js';
import { createDocumentPreviewIcon } from './document-preview-icon.js';
import { setAttributes } from './dom.js';

function normalizeCount(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.round(numericValue));
}

function createAction(action, index) {
  if (action instanceof Node) return action;
  if (!action || typeof action !== 'object') {
    throw new Error(`Bulk action at index ${index} must be a Node or an action definition.`);
  }
  if (!action.label && !action.ariaLabel) {
    throw new Error(`Bulk action at index ${index} requires label or ariaLabel.`);
  }

  return createButton({
    label: action.label,
    ariaLabel: action.ariaLabel,
    icon: action.icon,
    iconPosition: action.iconPosition,
    disabled: action.disabled,
    pressed: action.pressed,
    size: 'small',
    variant: 'outlined',
    className: ['ds-bulk-action-bar__action', action.className].filter(Boolean).join(' '),
    attributes: {
      'data-action-id': action.id,
      ...action.attributes,
    },
    onClick: action.onClick,
  });
}

/**
 * Creates a floating toolbar for contextual or bulk actions.
 * Product operations and their results remain owned by the consumer.
 */
export function createBulkActionBar({
  label = 'Действия с выбранными позициями',
  countLabel = 'Результат:',
  count = 0,
  showCount = true,
  actions = [],
  active = false,
  clearLabel = 'Сбросить выбор',
  className = '',
  attributes = {},
  onClear,
} = {}) {
  const element = document.createElement('div');
  element.className = ['ds-bulk-action-bar', className].filter(Boolean).join(' ');
  element.setAttribute('role', 'toolbar');
  element.setAttribute('aria-label', label);
  setAttributes(element, attributes);

  const result = document.createElement('div');
  result.className = 'ds-bulk-action-bar__result';
  result.setAttribute('aria-live', 'polite');

  const resultLabel = document.createElement('span');
  resultLabel.className = 'ds-bulk-action-bar__result-label';
  resultLabel.textContent = countLabel;

  const badge = document.createElement('strong');
  badge.className = 'ds-bulk-action-bar__badge';
  result.append(resultLabel, badge);

  const actionsElement = document.createElement('div');
  actionsElement.className = 'ds-bulk-action-bar__actions';

  const clearButton = createButton({
    iconOnly: true,
    ariaLabel: clearLabel,
    icon: createDocumentPreviewIcon('x', 18),
    variant: 'outlined',
    size: 'small',
    className: 'ds-bulk-action-bar__clear',
    onClick: event => {
      setActive(false);
      onClear?.(event);
    },
  });

  element.append(result, actionsElement, clearButton);

  let visible = false;
  let countVisible = Boolean(showCount);
  let currentCount = normalizeCount(count);

  const syncCount = () => {
    badge.textContent = String(currentCount);
    result.hidden = !countVisible;
    element.classList.toggle('has-count', countVisible);
    if (countVisible) result.setAttribute('aria-label', `${countLabel} ${currentCount}`);
    else result.removeAttribute('aria-label');
  };

  const setActive = nextActive => {
    visible = Boolean(nextActive);
    element.hidden = !visible;
    element.classList.toggle('is-active', visible);
    element.setAttribute('aria-hidden', String(!visible));
  };

  const setActions = nextActions => {
    if (!Array.isArray(nextActions)) throw new Error('Bulk action bar actions must be an array.');
    actionsElement.replaceChildren(...nextActions.map(createAction));
  };

  const setCount = nextCount => {
    currentCount = normalizeCount(nextCount);
    syncCount();
  };

  const setShowCount = nextShowCount => {
    countVisible = Boolean(nextShowCount);
    syncCount();
  };

  setActions(actions);
  syncCount();
  setActive(active);

  return {
    element,
    result,
    badge,
    actionsElement,
    clearButton,
    isActive: () => visible,
    getCount: () => currentCount,
    setActive,
    setActions,
    setCount,
    setShowCount,
    clear({ emit = false } = {}) {
      setActive(false);
      if (emit) onClear?.();
    },
  };
}
