import { createIcon } from './icon.js';

const documentPreviewIconSpriteUrl = new URL('../../assets/icons/document-editor-lucide.svg', import.meta.url).href;

function createSpriteIcon(name, size) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('width', String(size));
  icon.setAttribute('height', String(size));
  icon.setAttribute('fill', 'none');
  icon.setAttribute('stroke', 'currentColor');
  icon.setAttribute('stroke-width', '2');
  icon.setAttribute('stroke-linecap', 'round');
  icon.setAttribute('stroke-linejoin', 'round');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `${documentPreviewIconSpriteUrl}#${name}`);
  icon.append(use);
  return icon;
}

export function createDocumentPreviewIcon(name, size = 16, className = '') {
  return createIcon({
    name,
    size,
    className,
    fallback: ({ size: normalizedSize }) => createSpriteIcon(name, normalizedSize),
  });
}
