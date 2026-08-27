import { appendContent, setAttributes } from './dom.js';

let tabsSequence = 0;

export function createTabs({
  id = `ds-tabs-${++tabsSequence}`,
  label,
  items = [],
  value,
  orientation = 'horizontal',
  className = '',
  attributes = {},
  onChange,
} = {}) {
  if (!['horizontal', 'vertical'].includes(orientation)) {
    throw new Error(`Unknown tabs orientation: ${orientation}`);
  }

  const element = document.createElement('div');
  element.className = ['ds-tabs', `ds-tabs--${orientation}`, className].filter(Boolean).join(' ');
  setAttributes(element, attributes);

  const tablist = document.createElement('div');
  tablist.className = 'ds-tabs__list';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-orientation', orientation);
  if (label) tablist.setAttribute('aria-label', label);

  const tabs = [];
  const panels = new Map();

  items.forEach((item, index) => {
    const normalized = typeof item === 'object' ? item : { value: item, label: item };
    const itemValue = String(normalized.value ?? index);
    const tab = document.createElement('button');
    tab.id = `${id}-tab-${index + 1}`;
    tab.type = 'button';
    tab.className = 'ds-tabs__tab';
    tab.dataset.value = itemValue;
    tab.setAttribute('role', 'tab');
    tab.disabled = Boolean(normalized.disabled);
    setAttributes(tab, normalized.attributes);
    appendContent(tab, normalized.label);
    tablist.append(tab);
    tabs.push(tab);

    if (normalized.content !== undefined && normalized.content !== null) {
      const panel = document.createElement('div');
      panel.id = `${id}-panel-${index + 1}`;
      panel.className = 'ds-tabs__panel';
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      appendContent(panel, normalized.content);
      tab.setAttribute('aria-controls', panel.id);
      panels.set(itemValue, panel);
    }
  });

  const panelsElement = document.createElement('div');
  panelsElement.className = 'ds-tabs__panels';
  panels.forEach(panel => panelsElement.append(panel));
  element.append(tablist);
  if (panels.size > 0) element.append(panelsElement);

  let current = '';
  const getEnabledTabs = () => tabs.filter(tab => !tab.disabled);
  const setValue = (nextValue, { focus = false, emit = false, event } = {}) => {
    const nextTab = tabs.find(tab => tab.dataset.value === String(nextValue) && !tab.disabled);
    if (!nextTab) return false;

    current = nextTab.dataset.value;
    tabs.forEach(tab => {
      const selected = tab === nextTab;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel, panelValue) => {
      panel.hidden = panelValue !== current;
    });
    if (focus) nextTab.focus();
    if (emit) onChange?.(current, event);
    return true;
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', event => setValue(tab.dataset.value, { emit: true, event }));
    tab.addEventListener('keydown', event => {
      const previousKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
      if (![previousKey, nextKey, 'Home', 'End'].includes(event.key)) return;

      const enabledTabs = getEnabledTabs();
      if (enabledTabs.length === 0) return;
      event.preventDefault();
      const currentIndex = Math.max(0, enabledTabs.indexOf(tab));
      let nextIndex = currentIndex;
      if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = enabledTabs.length - 1;
      else if (event.key === previousKey) nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
      else nextIndex = (currentIndex + 1) % enabledTabs.length;
      setValue(enabledTabs[nextIndex].dataset.value, { focus: true, emit: true, event });
    });
  });

  const initialTab = tabs.find(tab => tab.dataset.value === String(value) && !tab.disabled) || getEnabledTabs()[0];
  if (initialTab) setValue(initialTab.dataset.value);

  return { element, tablist, getValue: () => current, setValue };
}
