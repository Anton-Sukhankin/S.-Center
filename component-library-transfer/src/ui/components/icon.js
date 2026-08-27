import { setAttributes } from './dom.js';

function toPascalCase(name) {
  return String(name || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function createLucideNode(name) {
  if (typeof window === 'undefined') return null;
  const adapter = window.lucide;
  if (!adapter?.icons || typeof adapter.createElement !== 'function') return null;
  const definition = adapter.icons[name] || adapter.icons[toPascalCase(name)];
  if (!definition) return null;

  try {
    const node = adapter.createElement(definition);
    return node instanceof Node ? node : null;
  } catch {
    return null;
  }
}

function createProvidedFallback(fallback, context) {
  if (fallback === undefined || fallback === null) return null;
  const candidate = typeof fallback === 'function' ? fallback(context) : fallback;
  return candidate instanceof Node ? candidate : null;
}

function createAdapterTarget(name) {
  if (typeof window === 'undefined' || typeof window.lucide?.createIcons !== 'function' || !name) return null;
  const target = document.createElement('i');
  target.className = 'ds-icon__adapter-target';
  target.dataset.lucide = String(name);
  return target;
}

function createGenericPlaceholder() {
  const placeholder = document.createElement('span');
  placeholder.className = 'ds-icon__placeholder';
  placeholder.textContent = '?';
  return placeholder;
}

export function createIcon({
  name,
  size = 16,
  label,
  fallback,
  className = '',
  attributes = {},
} = {}) {
  const numericSize = Number(size);
  const normalizedSize = Number.isFinite(numericSize) && numericSize > 0 ? numericSize : 16;
  const element = document.createElement('span');
  element.className = ['ds-icon', className].filter(Boolean).join(' ');
  element.style.setProperty('--ds-icon-size', `${normalizedSize}px`);
  if (label) {
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', label);
  } else {
    element.setAttribute('aria-hidden', 'true');
  }
  setAttributes(element, attributes);

  const context = { name, size: normalizedSize, label };
  const iconNode = createLucideNode(name)
    || createProvidedFallback(fallback, context)
    || createAdapterTarget(name)
    || createGenericPlaceholder();
  if (iconNode instanceof Element) {
    iconNode.setAttribute('aria-hidden', 'true');
    iconNode.setAttribute('focusable', 'false');
    if (iconNode.namespaceURI === 'http://www.w3.org/2000/svg') {
      iconNode.setAttribute('width', String(normalizedSize));
      iconNode.setAttribute('height', String(normalizedSize));
    }
  }
  element.append(iconNode);
  return element;
}
