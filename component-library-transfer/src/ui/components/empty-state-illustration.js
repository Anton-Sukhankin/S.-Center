import { createIcon } from './icon.js';

const assetUrl = fileName => new URL(`./assets/empty-states/${fileName}.png`, import.meta.url).href;

const VARIANTS = Object.freeze({
  empty: {
    icon: 'inbox',
    tone: 'neutral',
    src: assetUrl('empty'),
  },
  search: {
    icon: 'search',
    tone: 'info',
    src: assetUrl('search'),
  },
  filtered: {
    icon: 'list-filter',
    tone: 'info',
    src: assetUrl('filtered'),
  },
  error: {
    icon: 'triangle-alert',
    tone: 'danger',
    src: assetUrl('error'),
  },
  access: {
    icon: 'lock-keyhole',
    tone: 'warning',
    src: assetUrl('access'),
  },
  success: {
    icon: 'circle-check',
    tone: 'success',
    src: assetUrl('success'),
  },
});
const SIZES = new Set(['small', 'medium', 'large']);

function createCssFallback({ variant }) {
  const fallback = document.createElement('span');
  fallback.className = 'ds-empty-state-illustration__fallback';
  fallback.dataset.variant = variant;
  return fallback;
}

export function createEmptyStateIllustration({
  variant = 'empty',
  size = 'medium',
  className = '',
} = {}) {
  const normalizedVariant = VARIANTS[variant] ? variant : 'empty';
  const normalizedSize = SIZES.has(size) ? size : 'medium';
  const definition = VARIANTS[normalizedVariant];
  const iconSizes = { small: 18, medium: 24, large: 32 };

  const element = document.createElement('div');
  element.className = [
    'ds-empty-state-illustration',
    `ds-empty-state-illustration--${normalizedSize}`,
    `ds-empty-state-illustration--${definition.tone}`,
    className,
  ].filter(Boolean).join(' ');
  element.dataset.variant = normalizedVariant;
  element.setAttribute('aria-hidden', 'true');

  const image = document.createElement('img');
  image.className = 'ds-empty-state-illustration__image';
  image.src = definition.src;
  image.alt = '';
  image.decoding = 'async';
  image.draggable = false;

  const fallbackIcon = createIcon({
    name: definition.icon,
    size: iconSizes[normalizedSize],
    fallback: () => createCssFallback({ variant: normalizedVariant }),
    className: 'ds-empty-state-illustration__icon',
  });
  fallbackIcon.hidden = true;
  image.addEventListener('error', () => {
    image.hidden = true;
    fallbackIcon.hidden = false;
  }, { once: true });
  element.append(image, fallbackIcon);

  return element;
}
