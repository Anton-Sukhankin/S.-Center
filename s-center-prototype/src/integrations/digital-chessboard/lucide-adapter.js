// Локальный совместимый слой для иконок, используемых переносимой шахматкой.
// Повторяет минимальный контракт lucide.createIcons без сетевой CDN-зависимости.
(function installDigitalChessboardIcons(window, document) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const iconShapes = {
    'building-2': [
      ['path', { d: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18' }],
      ['path', { d: 'M6 12H4a2 2 0 0 0-2 2v8h16V8a2 2 0 0 0-2-2h-2' }],
      ['path', { d: 'M10 6h4M10 10h4M10 14h4M10 18h4' }],
    ],
    'calendar-days': [
      ['rect', { x: '3', y: '5', width: '18', height: '16', rx: '2' }],
      ['path', { d: 'M16 3v4M8 3v4M3 11h18' }],
      ['path', { d: 'M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01' }],
    ],
    'chevron-down': [['path', { d: 'm6 9 6 6 6-6' }]],
    'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
    'chevron-right': [['path', { d: 'm9 18 6-6-6-6' }]],
    'clipboard-x': [
      ['rect', { x: '6', y: '4', width: '12', height: '18', rx: '2' }],
      ['path', { d: 'M9 4V2h6v2M9.5 11.5l5 5M14.5 11.5l-5 5' }],
    ],
    'git-compare-arrows': [
      ['path', { d: 'm13 3 4 4-4 4M17 7H3M11 21l-4-4 4-4M7 17h14' }],
    ],
    folder: [
      ['path', { d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' }],
    ],
    pencil: [
      ['path', { d: 'M12 20h9' }],
      ['path', { d: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z' }],
    ],
    search: [
      ['circle', { cx: '11', cy: '11', r: '8' }],
      ['path', { d: 'm21 21-4.3-4.3' }],
    ],
    'table-2': [
      ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }],
      ['path', { d: 'M3 9h18M3 15h18M9 9v12' }],
    ],
    x: [['path', { d: 'M18 6 6 18M6 6l12 12' }]],
  };

  function setAttributes(element, attributes) {
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  }

  function createIcon(placeholder, name, attributes) {
    const shapes = iconShapes[name];
    if (!shapes) return null;

    const svg = document.createElementNS(NS, 'svg');
    setAttributes(svg, {
      xmlns: NS,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': attributes['stroke-width'] || '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': placeholder.getAttribute('aria-hidden') || 'true',
      focusable: 'false',
      class: `lucide lucide-${name}`,
    });

    ['style', 'width', 'height'].forEach(attribute => {
      if (placeholder.hasAttribute(attribute)) svg.setAttribute(attribute, placeholder.getAttribute(attribute));
    });

    shapes.forEach(([tag, shapeAttributes]) => {
      const shape = document.createElementNS(NS, tag);
      setAttributes(shape, shapeAttributes);
      svg.append(shape);
    });
    return svg;
  }

  window.lucide = Object.freeze({
    createIcons(options = {}) {
      const attributes = options.attrs || {};
      document.querySelectorAll('i[data-lucide]').forEach(placeholder => {
        const icon = createIcon(placeholder, placeholder.dataset.lucide, attributes);
        if (icon) placeholder.replaceWith(icon);
      });
    },
  });
})(window, document);
