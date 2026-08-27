import { appendContent, setAttributes } from './dom.js';

const PANEL_PADDINGS = new Set(['none', 'compact', 'medium']);
const BADGE_VARIANTS = new Set(['neutral', 'accent']);

let accordionSequence = 0;

function hasContent(content) {
  if (Array.isArray(content)) return content.some(hasContent);
  return content !== undefined && content !== null && content !== '';
}

function appendSlot(target, content) {
  if (Array.isArray(content)) {
    content.forEach(item => appendSlot(target, item));
    return;
  }
  appendContent(target, content);
}

function replaceSlot(target, content) {
  target.replaceChildren();
  appendSlot(target, content);
}

export function createAccordionBadge({
  label,
  variant = 'neutral',
  className = '',
  attributes = {},
} = {}) {
  if (!BADGE_VARIANTS.has(variant)) throw new Error(`Unknown accordion badge variant: ${variant}`);

  const element = document.createElement('span');
  element.className = [
    'ds-accordion__badge',
    `ds-accordion__badge--${variant}`,
    className,
  ].filter(Boolean).join(' ');
  setAttributes(element, attributes);
  appendContent(element, label);
  return element;
}

export function createAccordion({
  id = `ds-accordion-${++accordionSequence}`,
  panelId = `${id}-panel`,
  title,
  description,
  icon,
  indicators,
  actions,
  content,
  open = false,
  disabled = false,
  headingLevel = 3,
  panelPadding = 'medium',
  className = '',
  panelClassName = '',
  attributes = {},
  headerAttributes = {},
  triggerAttributes = {},
  titleAttributes = {},
  descriptionAttributes = {},
  panelAttributes = {},
  onToggle,
} = {}) {
  if (!PANEL_PADDINGS.has(panelPadding)) throw new Error(`Unknown accordion panel padding: ${panelPadding}`);

  const element = document.createElement('section');
  element.id = id;
  element.className = ['ds-accordion', 'ds-accordion--component', className].filter(Boolean).join(' ');
  setAttributes(element, attributes);

  const header = document.createElement('header');
  header.className = 'ds-accordion__header';
  setAttributes(header, headerAttributes);

  const trigger = document.createElement('button');
  trigger.id = `${id}-trigger`;
  trigger.type = 'button';
  trigger.className = 'ds-accordion__trigger';
  trigger.disabled = disabled;
  trigger.setAttribute('aria-controls', panelId);
  setAttributes(trigger, triggerAttributes);

  const leading = document.createElement('span');
  leading.className = 'ds-accordion__leading';
  leading.setAttribute('aria-hidden', 'true');

  const metaphor = document.createElement('span');
  metaphor.className = 'ds-accordion__metaphor';
  const chevron = document.createElement('span');
  chevron.className = 'ds-accordion__chevron';
  if (hasContent(icon)) appendSlot(metaphor, icon);
  else leading.classList.add('ds-accordion__leading--chevron-only');
  leading.append(metaphor, chevron);

  const copy = document.createElement('span');
  copy.className = 'ds-accordion__copy';

  const normalizedHeadingLevel = Math.min(6, Math.max(1, Number(headingLevel) || 3));
  const titleElement = document.createElement('span');
  titleElement.id = `${id}-title`;
  titleElement.className = 'ds-accordion__title';
  titleElement.setAttribute('role', 'heading');
  titleElement.setAttribute('aria-level', String(normalizedHeadingLevel));
  setAttributes(titleElement, titleAttributes);
  appendContent(titleElement, title);

  const descriptionElement = document.createElement('span');
  descriptionElement.className = 'ds-accordion__description';
  setAttributes(descriptionElement, descriptionAttributes);
  replaceSlot(descriptionElement, description);
  descriptionElement.hidden = !hasContent(description);
  copy.append(titleElement, descriptionElement);

  const indicatorsElement = document.createElement('span');
  indicatorsElement.className = 'ds-accordion__indicators';
  indicatorsElement.setAttribute('aria-label', 'Параметры раздела');
  replaceSlot(indicatorsElement, indicators);
  indicatorsElement.hidden = !hasContent(indicators);

  trigger.append(leading, copy, indicatorsElement);

  const actionsElement = document.createElement('div');
  actionsElement.className = 'ds-accordion__actions';
  actionsElement.setAttribute('aria-label', 'Действия раздела');
  replaceSlot(actionsElement, actions);

  header.append(trigger, actionsElement);

  const panel = document.createElement('div');
  panel.id = panelId;
  panel.className = [
    'ds-accordion__panel',
    `ds-accordion__panel--${panelPadding}`,
    panelClassName,
  ].filter(Boolean).join(' ');
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', titleElement.id);
  setAttributes(panel, panelAttributes);
  appendSlot(panel, content);
  element.append(header, panel);

  let expanded = false;
  let hasActions = hasContent(actions);

  const syncActions = () => {
    element.classList.toggle('has-actions', hasActions);
    actionsElement.hidden = !expanded || !hasActions;
  };

  const setOpen = (nextOpen, { emit = false, event } = {}) => {
    expanded = Boolean(nextOpen);
    element.classList.toggle('is-expanded', expanded);
    trigger.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
    panel.setAttribute('aria-hidden', String(!expanded));
    syncActions();
    if (emit) onToggle?.(expanded, event);
  };

  trigger.addEventListener('click', event => setOpen(!expanded, { emit: true, event }));
  setOpen(open);

  return {
    element,
    header,
    trigger,
    leading,
    titleElement,
    descriptionElement,
    indicatorsElement,
    actionsElement,
    panel,
    isOpen: () => expanded,
    setOpen,
    setDisabled(nextDisabled) {
      trigger.disabled = Boolean(nextDisabled);
    },
    setDescription(nextDescription) {
      replaceSlot(descriptionElement, nextDescription);
      descriptionElement.hidden = !hasContent(nextDescription);
    },
    setIndicators(nextIndicators) {
      replaceSlot(indicatorsElement, nextIndicators);
      indicatorsElement.hidden = !hasContent(nextIndicators);
    },
    setActions(nextActions) {
      replaceSlot(actionsElement, nextActions);
      hasActions = hasContent(nextActions);
      syncActions();
    },
    setContent(nextContent) {
      replaceSlot(panel, nextContent);
    },
  };
}
