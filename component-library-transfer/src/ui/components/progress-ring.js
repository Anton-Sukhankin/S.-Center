import { setAttributes } from './dom.js';

export const PROGRESS_RING_SIZES = Object.freeze(['small', 'medium', 'large']);
export const PROGRESS_RING_TONES = Object.freeze(['neutral', 'accent', 'success', 'warning', 'danger']);

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const TRACK_LENGTH = 100;

function normalizeRange(min, max) {
  const normalizedMin = Number(min);
  const normalizedMax = Number(max);
  if (!Number.isFinite(normalizedMin) || !Number.isFinite(normalizedMax) || normalizedMax <= normalizedMin) {
    throw new Error('Progress Ring requires a finite max value greater than min.');
  }
  return { min: normalizedMin, max: normalizedMax };
}

function normalizeValue(value, min, max) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) throw new Error('Progress Ring value must be a finite number.');
  return Math.min(max, Math.max(min, numericValue));
}

function percentage(value, min, max) {
  return ((value - min) / (max - min)) * TRACK_LENGTH;
}

function defaultValueText(value, min, max) {
  const percent = Math.round(percentage(value, min, max));
  return `${percent}%`;
}

export function createProgressRing({
  value = 0,
  min = 0,
  max = 100,
  size = 'medium',
  tone = 'accent',
  label = 'Прогресс',
  valueText,
  showValue = true,
  indeterminate = false,
  className = '',
  attributes = {},
} = {}) {
  if (!PROGRESS_RING_SIZES.includes(size)) throw new Error(`Unknown Progress Ring size: ${size}`);
  if (!PROGRESS_RING_TONES.includes(tone)) throw new Error(`Unknown Progress Ring tone: ${tone}`);

  const range = normalizeRange(min, max);
  let currentValue = normalizeValue(value, range.min, range.max);
  let currentTone = tone;
  let currentIndeterminate = Boolean(indeterminate);
  let customValueText = valueText;

  const element = document.createElement('span');
  element.className = [
    'ds-progress-ring',
    `ds-progress-ring--${size}`,
    `ds-progress-ring--${tone}`,
    currentIndeterminate ? 'is-indeterminate' : '',
    showValue ? 'has-value' : '',
    className,
  ].filter(Boolean).join(' ');
  element.setAttribute('role', 'progressbar');
  element.setAttribute('aria-label', label);
  setAttributes(element, attributes);

  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
  svg.classList.add('ds-progress-ring__svg');
  svg.setAttribute('viewBox', '0 0 44 44');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const track = document.createElementNS(SVG_NAMESPACE, 'circle');
  track.classList.add('ds-progress-ring__track');
  track.setAttribute('cx', '22');
  track.setAttribute('cy', '22');
  track.setAttribute('r', '18');

  const indicator = document.createElementNS(SVG_NAMESPACE, 'circle');
  indicator.classList.add('ds-progress-ring__indicator');
  indicator.setAttribute('cx', '22');
  indicator.setAttribute('cy', '22');
  indicator.setAttribute('r', '18');
  indicator.setAttribute('pathLength', String(TRACK_LENGTH));
  svg.append(track, indicator);
  element.append(svg);

  const valueElement = document.createElement('span');
  valueElement.className = 'ds-progress-ring__value';
  valueElement.setAttribute('aria-hidden', 'true');
  if (showValue) element.append(valueElement);

  const sync = () => {
    const text = customValueText ?? defaultValueText(currentValue, range.min, range.max);
    element.classList.toggle('is-indeterminate', currentIndeterminate);
    indicator.style.setProperty('--ds-progress-ring-offset', String(TRACK_LENGTH - percentage(currentValue, range.min, range.max)));
    valueElement.textContent = currentIndeterminate ? '' : text;

    if (currentIndeterminate) {
      element.removeAttribute('aria-valuemin');
      element.removeAttribute('aria-valuemax');
      element.removeAttribute('aria-valuenow');
      element.removeAttribute('aria-valuetext');
      return;
    }

    element.setAttribute('aria-valuemin', String(range.min));
    element.setAttribute('aria-valuemax', String(range.max));
    element.setAttribute('aria-valuenow', String(currentValue));
    element.setAttribute('aria-valuetext', text);
  };

  sync();

  return {
    element,
    svg,
    indicator,
    valueElement,
    setValue(nextValue, nextValueText) {
      currentValue = normalizeValue(nextValue, range.min, range.max);
      customValueText = nextValueText;
      currentIndeterminate = false;
      sync();
    },
    setIndeterminate(nextIndeterminate) {
      currentIndeterminate = Boolean(nextIndeterminate);
      sync();
    },
    setTone(nextTone) {
      if (!PROGRESS_RING_TONES.includes(nextTone)) throw new Error(`Unknown Progress Ring tone: ${nextTone}`);
      element.classList.replace(`ds-progress-ring--${currentTone}`, `ds-progress-ring--${nextTone}`);
      currentTone = nextTone;
    },
  };
}
