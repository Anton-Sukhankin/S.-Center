import { appendContent, setAttributes } from './dom.js';

const VARIANTS = new Set(['primary', 'outlined', 'text']);

export function createButton({
  label,
  variant = 'outlined',
  size = 'medium',
  icon,
  iconPosition = 'start',
  iconOnly = false,
  ariaLabel,
  disabled = false,
  pressed,
  type = 'button',
  className = '',
  attributes = {},
  onClick,
} = {}) {
  if (!VARIANTS.has(variant)) throw new Error(`Unknown button variant: ${variant}`);
  if (iconOnly && !ariaLabel) throw new Error('Icon-only button requires ariaLabel.');

  const element = document.createElement('button');
  element.type = type;
  element.className = [
    'ds-button',
    `ds-button--${variant}`,
    size === 'small' ? 'ds-button--small' : '',
    iconOnly ? 'ds-button--icon-only' : '',
    className,
  ].filter(Boolean).join(' ');
  element.disabled = disabled;
  setAttributes(element, {
    'aria-label': ariaLabel,
    'aria-pressed': pressed,
    ...attributes,
  });

  if (icon && iconPosition === 'start') appendContent(element, icon);
  if (!iconOnly) appendContent(element, label);
  if (icon && iconPosition === 'end') appendContent(element, icon);
  if (onClick) element.addEventListener('click', onClick);

  return element;
}
