const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSvgIcon(paths, { size = 20, viewBox = '0 0 24 24', className = '' } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (className) svg.setAttribute('class', className);

  paths.forEach(({ tag = 'path', ...attributes }) => {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    svg.append(node);
  });
  return svg;
}

export const icons = {
  apps: () => createSvgIcon([
    { tag: 'circle', cx: 5, cy: 5, r: 1, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 12, cy: 5, r: 1, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 19, cy: 5, r: 1, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 5, cy: 12, r: 1, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 12, cy: 12, r: 1, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 19, cy: 12, r: 1, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 5, cy: 19, r: 1, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 12, cy: 19, r: 1, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 19, cy: 19, r: 1, fill: 'currentColor', stroke: 'none' },
  ]),
  brand: () => createSvgIcon([
    { tag: 'rect', x: 4, y: 4, width: 16, height: 16, rx: 3 },
    { tag: 'circle', cx: 4, cy: 9, r: 1.25, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 9, cy: 4, r: 1.25, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 20, cy: 15, r: 1.25, fill: 'currentColor', stroke: 'none' },
    { tag: 'circle', cx: 15, cy: 20, r: 1.25, fill: 'currentColor', stroke: 'none' },
  ]),
  bell: () => createSvgIcon([
    { d: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9' },
    { d: 'M10 21h4' },
  ]),
  gear: () => createSvgIcon([
    { tag: 'circle', cx: 12, cy: 12, r: 3 },
    { d: 'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.36.72.67.98.31.25.7.4 1.1.4H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z' },
  ], { size: 18 }),
  search: () => createSvgIcon([
    { tag: 'circle', cx: 11, cy: 11, r: 7 },
    { d: 'm20 20-4-4' },
  ], { size: 18 }),
  resize: () => createSvgIcon([
    { d: 'm9 7-4 5 4 5' },
    { d: 'm15 7 4 5-4 5' },
  ], { size: 16 }),
};
