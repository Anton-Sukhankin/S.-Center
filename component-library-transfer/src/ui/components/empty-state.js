import { appendContent, setAttributes } from './dom.js';

let emptyStateSequence = 0;
const ROLES = new Set(['region', 'status']);
const SIZES = new Set(['small', 'medium', 'large']);
const SURFACES = new Set(['plain', 'outlined']);

export function createEmptyState({
  id = `ds-empty-state-${++emptyStateSequence}`,
  illustration,
  icon,
  title,
  description,
  actions = [],
  compact = false,
  size,
  surface = 'outlined',
  role = 'region',
  ariaLabel,
  live,
  className = '',
  attributes = {},
} = {}) {
  if (role !== null && role !== false && !ROLES.has(role)) {
    throw new Error(`Unknown empty state role: ${role}`);
  }
  const normalizedSize = SIZES.has(size) ? size : compact ? 'small' : 'medium';
  const normalizedSurface = SURFACES.has(surface) ? surface : 'outlined';

  const element = document.createElement('section');
  element.id = id;
  element.className = [
    'ds-empty-state',
    'ds-empty-state--component',
    `ds-empty-state--${normalizedSize}`,
    `ds-empty-state--${normalizedSurface}`,
    compact ? 'ds-empty-state--compact' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  if (role) element.setAttribute('role', role);
  if (ariaLabel) element.setAttribute('aria-label', ariaLabel);
  setAttributes(element, attributes);

  const visual = illustration instanceof Node ? illustration : icon;
  let illustrationElement = null;
  if (visual instanceof Node) {
    illustrationElement = document.createElement('div');
    illustrationElement.className = [
      'ds-empty-state__illustration',
      illustration instanceof Node ? '' : 'is-icon',
    ].filter(Boolean).join(' ');
    illustrationElement.setAttribute('aria-hidden', 'true');
    illustrationElement.append(visual);
    element.append(illustrationElement);
  }

  let titleElement = null;
  if (title !== undefined && title !== null) {
    titleElement = document.createElement('h3');
    titleElement.id = `${id}-title`;
    titleElement.className = 'ds-empty-state__title';
    appendContent(titleElement, title);
    element.append(titleElement);
    if (titleElement.textContent.trim() && !element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
      element.setAttribute('aria-labelledby', titleElement.id);
    }
  }

  let descriptionElement = null;
  if (description !== undefined && description !== null) {
    descriptionElement = document.createElement('div');
    descriptionElement.className = 'ds-empty-state__description';
    appendContent(descriptionElement, description);
    element.append(descriptionElement);
  }

  const actionNodes = actions instanceof Node ? [actions] : Array.from(actions || []).filter(action => action instanceof Node);
  let actionsElement = null;
  if (actionNodes.length > 0) {
    actionsElement = document.createElement('div');
    actionsElement.className = 'ds-empty-state__actions';
    actionsElement.append(...actionNodes);
    element.append(actionsElement);
  }

  const effectiveRole = element.getAttribute('role');
  const hasAccessibleName = Boolean(
    element.getAttribute('aria-label')?.trim()
    || element.getAttribute('aria-labelledby')?.trim(),
  );
  if (effectiveRole === 'region' && !hasAccessibleName) element.removeAttribute('role');
  if (live) element.setAttribute('aria-live', live);
  else if (element.getAttribute('role') === 'status') element.setAttribute('aria-live', 'polite');

  return {
    element,
    illustrationElement,
    iconElement: illustrationElement,
    titleElement,
    descriptionElement,
    actionsElement,
  };
}
