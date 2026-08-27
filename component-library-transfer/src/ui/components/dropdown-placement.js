function getVerticalBoundary(element) {
  let top = 0;
  let bottom = window.innerHeight;

  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const style = window.getComputedStyle(ancestor);
    const clipsVertically = /(auto|scroll|hidden|clip)/.test(`${style.overflow} ${style.overflowY}`);
    if (!clipsVertically) continue;

    const rect = ancestor.getBoundingClientRect();
    top = Math.max(top, rect.top);
    bottom = Math.min(bottom, rect.bottom);
  }

  return { top, bottom };
}

export function syncDropdownPlacement({ container, trigger, dropdown, gap = 4 }) {
  if (!container || !trigger || !dropdown || dropdown.hidden) return 'bottom';

  const triggerRect = trigger.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const dropdownRect = dropdown.getBoundingClientRect();
  const boundary = getVerticalBoundary(container);
  const spaceBelow = Math.max(0, boundary.bottom - triggerRect.bottom - gap);
  const spaceAbove = Math.max(0, triggerRect.top - boundary.top - gap);
  const requiredHeight = Math.max(dropdownRect.height, dropdown.scrollHeight);
  const opensUp = requiredHeight > spaceBelow && spaceAbove > spaceBelow;

  container.classList.toggle('is-drop-up', opensUp);
  dropdown.dataset.placement = opensUp ? 'top' : 'bottom';
  dropdown.style.top = opensUp ? 'auto' : `${triggerRect.bottom - containerRect.top + gap}px`;
  dropdown.style.bottom = opensUp ? `${containerRect.bottom - triggerRect.top + gap}px` : 'auto';

  return dropdown.dataset.placement;
}

export function createDropdownPlacementController(config) {
  let active = false;
  let frame = 0;

  const sync = () => syncDropdownPlacement(config);
  const schedule = () => {
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(sync);
  };
  const start = () => {
    if (active) return sync();
    active = true;
    window.addEventListener('resize', schedule);
    document.addEventListener('scroll', schedule, true);
    return sync();
  };
  const stop = () => {
    if (!active) return;
    active = false;
    window.cancelAnimationFrame(frame);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('scroll', schedule, true);
    config.container.classList.remove('is-drop-up');
    config.dropdown.dataset.placement = 'bottom';
    config.dropdown.style.removeProperty('top');
    config.dropdown.style.removeProperty('bottom');
  };

  return { sync, start, stop, destroy: stop };
}
