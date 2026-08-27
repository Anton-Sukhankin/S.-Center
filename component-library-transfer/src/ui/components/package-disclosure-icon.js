const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const FOLDER_PATH = 'M2.8 5.3a1.5 1.5 0 0 1 1.5-1.5h3l1.6 1.8h6.8a1.5 1.5 0 0 1 1.5 1.5v7.6a1.5 1.5 0 0 1-1.5 1.5H4.3a1.5 1.5 0 0 1-1.5-1.5Z';

const STATE_MARKS = Object.freeze({
  collapsed: 'M10 8.5v5M7.5 11h5',
  expanded: 'M7.5 11h5',
});

export function createPackageDisclosureIcon({ state = 'leaf', className = '' } = {}) {
  const normalizedState = state in STATE_MARKS ? state : 'leaf';
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.setAttribute('viewBox', '0 0 20 20');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.7');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('ds-package-disclosure-icon', `is-${normalizedState}`);
  className.split(/\s+/).filter(Boolean).forEach(name => svg.classList.add(name));

  const folder = document.createElementNS(SVG_NAMESPACE, 'path');
  folder.setAttribute('d', FOLDER_PATH);
  svg.append(folder);

  const mark = STATE_MARKS[normalizedState];
  if (mark) {
    const stateMark = document.createElementNS(SVG_NAMESPACE, 'path');
    stateMark.setAttribute('d', mark);
    svg.append(stateMark);
  }

  return svg;
}
