import { appendContent, setAttributes } from './dom.js';

export const TOOLTIP_PLACEMENTS = Object.freeze(['auto', 'top', 'bottom', 'right', 'left']);

let tooltipSequence = 0;

function describedByTokens(element) {
  return new Set((element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
}

function placementCandidates(placement) {
  if (placement === 'auto') return ['top', 'bottom', 'right', 'left'];
  const opposite = { top: 'bottom', bottom: 'top', right: 'left', left: 'right' }[placement];
  return [placement, opposite, ...['top', 'bottom', 'right', 'left'].filter(item => item !== placement && item !== opposite)];
}

function coordinatesFor(placement, triggerRect, tooltipRect, offset) {
  if (placement === 'bottom') return {
    left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
    top: triggerRect.bottom + offset,
  };
  if (placement === 'right') return {
    left: triggerRect.right + offset,
    top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
  };
  if (placement === 'left') return {
    left: triggerRect.left - tooltipRect.width - offset,
    top: triggerRect.top + (triggerRect.height - tooltipRect.height) / 2,
  };
  return {
    left: triggerRect.left + (triggerRect.width - tooltipRect.width) / 2,
    top: triggerRect.top - tooltipRect.height - offset,
  };
}

function isUnavailableTrigger(trigger) {
  return trigger.matches(':disabled, [aria-disabled="true"]');
}

export function createTooltip({
  id = `ds-tooltip-${++tooltipSequence}`,
  content = '',
  delay = 500,
  placement = 'auto',
  offset = 8,
  className = '',
  attributes = {},
} = {}) {
  const preferredPlacement = TOOLTIP_PLACEMENTS.includes(placement) ? placement : 'auto';
  const element = document.createElement('div');
  element.id = id;
  element.className = ['ds-tooltip-component', className].filter(Boolean).join(' ');
  element.setAttribute('role', 'tooltip');
  element.setAttribute('aria-hidden', 'true');
  element.hidden = true;
  setAttributes(element, attributes);
  appendContent(element, content);

  let activeTrigger = null;
  let timerId = null;
  let destroyed = false;
  const connections = new Map();

  function removeDescription(trigger = activeTrigger) {
    if (!(trigger instanceof Element)) return;
    const tokens = describedByTokens(trigger);
    tokens.delete(id);
    if (tokens.size) trigger.setAttribute('aria-describedby', [...tokens].join(' '));
    else trigger.removeAttribute('aria-describedby');
  }

  function addDescription(trigger) {
    const tokens = describedByTokens(trigger);
    tokens.add(id);
    trigger.setAttribute('aria-describedby', [...tokens].join(' '));
  }

  function setContent(nextContent) {
    element.replaceChildren();
    appendContent(element, nextContent);
  }

  function position() {
    if (!(activeTrigger instanceof Element) || !activeTrigger.isConnected || element.hidden) return false;
    const viewportMargin = 8;
    const triggerRect = activeTrigger.getBoundingClientRect();
    const tooltipRect = element.getBoundingClientRect();
    const candidates = placementCandidates(preferredPlacement);
    let selected = candidates[0];
    let coordinates = coordinatesFor(selected, triggerRect, tooltipRect, offset);

    for (const candidate of candidates) {
      const candidateCoordinates = coordinatesFor(candidate, triggerRect, tooltipRect, offset);
      const fits = candidateCoordinates.left >= viewportMargin
        && candidateCoordinates.top >= viewportMargin
        && candidateCoordinates.left + tooltipRect.width <= window.innerWidth - viewportMargin
        && candidateCoordinates.top + tooltipRect.height <= window.innerHeight - viewportMargin;
      if (fits) {
        selected = candidate;
        coordinates = candidateCoordinates;
        break;
      }
    }

    const maxLeft = Math.max(viewportMargin, window.innerWidth - tooltipRect.width - viewportMargin);
    const maxTop = Math.max(viewportMargin, window.innerHeight - tooltipRect.height - viewportMargin);
    element.dataset.placement = selected;
    element.style.left = `${Math.min(maxLeft, Math.max(viewportMargin, coordinates.left))}px`;
    element.style.top = `${Math.min(maxTop, Math.max(viewportMargin, coordinates.top))}px`;
    return true;
  }

  function removeGlobalListeners() {
    document.removeEventListener('scroll', handleScroll, true);
    document.removeEventListener('keydown', handleKeydown, true);
    window.removeEventListener('resize', handleResize);
  }

  function addGlobalListeners() {
    removeGlobalListeners();
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('resize', handleResize);
  }

  function close() {
    window.clearTimeout(timerId);
    timerId = null;
    removeDescription();
    activeTrigger = null;
    element.classList.remove('is-open');
    element.hidden = true;
    element.setAttribute('aria-hidden', 'true');
    removeGlobalListeners();
  }

  function show(trigger, { content: nextContent } = {}) {
    if (destroyed || !(trigger instanceof Element) || !trigger.isConnected || isUnavailableTrigger(trigger)) return false;
    window.clearTimeout(timerId);
    timerId = null;
    removeDescription();
    activeTrigger = trigger;
    if (nextContent !== undefined) setContent(nextContent);
    element.hidden = false;
    element.setAttribute('aria-hidden', 'false');
    addDescription(trigger);
    addGlobalListeners();
    if (!position()) {
      close();
      return false;
    }
    element.classList.add('is-open');
    return true;
  }

  function schedule(trigger, { content: nextContent, delay: nextDelay = delay } = {}) {
    if (destroyed || !(trigger instanceof Element) || !trigger.isConnected || isUnavailableTrigger(trigger)) return false;
    close();
    activeTrigger = trigger;
    if (nextContent !== undefined) setContent(nextContent);
    addGlobalListeners();
    timerId = window.setTimeout(() => show(trigger), Math.max(0, Number(nextDelay) || 0));
    return true;
  }

  function handleScroll() {
    close();
  }

  function handleResize() {
    if (timerId !== null) close();
    else position();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') close();
  }

  function connect(trigger, { content: triggerContent = content, delay: triggerDelay = delay } = {}) {
    if (!(trigger instanceof Element)) throw new TypeError('Tooltip trigger must be an Element.');
    connections.get(trigger)?.();
    const resolveContent = () => typeof triggerContent === 'function' ? triggerContent(trigger) : triggerContent;
    const handlePointerEnter = () => schedule(trigger, { content: resolveContent(), delay: triggerDelay });
    const handlePointerLeave = () => close();
    const handleFocus = () => show(trigger, { content: resolveContent() });
    const handleBlur = () => close();
    trigger.addEventListener('pointerenter', handlePointerEnter);
    trigger.addEventListener('pointerleave', handlePointerLeave);
    trigger.addEventListener('focus', handleFocus);
    trigger.addEventListener('blur', handleBlur);
    const disconnect = () => {
      trigger.removeEventListener('pointerenter', handlePointerEnter);
      trigger.removeEventListener('pointerleave', handlePointerLeave);
      trigger.removeEventListener('focus', handleFocus);
      trigger.removeEventListener('blur', handleBlur);
      connections.delete(trigger);
      if (activeTrigger === trigger) close();
    };
    connections.set(trigger, disconnect);
    return disconnect;
  }

  return {
    element,
    setContent,
    show,
    schedule,
    close,
    position,
    connect,
    isOpen: () => element.classList.contains('is-open'),
    mount(target = document.body) {
      target.append(element);
    },
    destroy() {
      if (destroyed) return;
      [...connections.values()].forEach(disconnect => disconnect());
      connections.clear();
      close();
      element.remove();
      destroyed = true;
    },
  };
}
