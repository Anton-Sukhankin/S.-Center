import { appendContent, setAttributes } from './dom.js';

export const CARD_STATES = Object.freeze(['default', 'accent', 'success', 'warning', 'danger']);
export const CARD_LAYOUTS = Object.freeze(['horizontal', 'vertical']);

let cardSequence = 0;

function appendItems(target, items) {
  (Array.isArray(items) ? items : [items]).forEach(item => appendContent(target, item));
}

function hasContent(content) {
  if (Array.isArray(content)) return content.some(hasContent);
  return content !== undefined && content !== null && content !== '';
}

export function createCard({
  title,
  description,
  leading,
  indicator,
  tags = [],
  actions = [],
  content,
  footer,
  state = 'default',
  layout = 'horizontal',
  interactive = false,
  disabled = false,
  ariaLabel,
  className = '',
  attributes = {},
  onClick,
} = {}) {
  if (!CARD_STATES.includes(state)) throw new Error(`Unknown card state: ${state}`);
  if (!CARD_LAYOUTS.includes(layout)) throw new Error(`Unknown card layout: ${layout}`);

  const isInteractive = Boolean(interactive || onClick);
  const hasTitle = hasContent(title);
  const hasDescription = hasContent(description);
  const hasLeading = hasContent(leading);
  const hasTags = Array.isArray(tags) ? tags.length > 0 : Boolean(tags);
  const hasActions = Array.isArray(actions) ? actions.length > 0 : Boolean(actions);
  const hasIndicator = hasContent(indicator);
  const hasHeader = hasTitle || hasDescription || hasLeading || hasIndicator || hasActions;
  if (isInteractive && (hasActions || hasTags || content !== undefined || footer !== undefined)) {
    throw new Error('Interactive card supports display-only header content. Use a non-interactive card for actions, tags, body or footer.');
  }

  const element = document.createElement(isInteractive ? 'button' : 'article');
  const titleId = `ds-card-title-${++cardSequence}`;
  const descriptionId = `${titleId}-description`;
  let currentState = state;

  element.className = [
    'ds-card',
    `ds-card--${layout}`,
    `ds-card--${state}`,
    isInteractive ? 'ds-card--interactive' : '',
    disabled ? 'is-disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  if (isInteractive) {
    element.type = 'button';
    element.disabled = Boolean(disabled);
    element.setAttribute('aria-label', ariaLabel || String(title || 'Карточка'));
    if (onClick) element.addEventListener('click', onClick);
  } else {
    if (hasTitle) element.setAttribute('aria-labelledby', titleId);
    else if (ariaLabel) element.setAttribute('aria-label', ariaLabel);
    if (hasDescription) element.setAttribute('aria-describedby', descriptionId);
    if (disabled) element.setAttribute('aria-disabled', 'true');
  }
  setAttributes(element, attributes);

  if (hasHeader) {
    const header = document.createElement(isInteractive ? 'span' : 'header');
    header.className = 'ds-card__header';

    if (hasLeading) {
      const leadingElement = document.createElement('span');
      leadingElement.className = 'ds-card__leading';
      appendContent(leadingElement, leading);
      header.append(leadingElement);
    }

    if (hasTitle || hasDescription) {
      const copy = document.createElement('span');
      copy.className = 'ds-card__copy';
      if (hasTitle) {
        const titleElement = document.createElement(isInteractive ? 'span' : 'h3');
        titleElement.id = titleId;
        titleElement.className = 'ds-card__title';
        appendContent(titleElement, title);
        copy.append(titleElement);
      }
      if (hasDescription) {
        const descriptionElement = document.createElement(isInteractive ? 'span' : 'p');
        descriptionElement.id = descriptionId;
        descriptionElement.className = 'ds-card__description';
        appendContent(descriptionElement, description);
        copy.append(descriptionElement);
      }
      header.append(copy);
    }

    const hasAside = hasIndicator || hasActions;
    if (hasAside) {
      const aside = document.createElement('span');
      aside.className = 'ds-card__aside';
      if (hasIndicator) {
        const indicatorElement = document.createElement('span');
        indicatorElement.className = 'ds-card__indicator';
        appendContent(indicatorElement, indicator);
        aside.append(indicatorElement);
      }
      if (hasActions) {
        const actionList = document.createElement('span');
        actionList.className = 'ds-card__actions';
        appendItems(actionList, actions);
        aside.append(actionList);
      }
      header.append(aside);
    }

    element.append(header);
  }

  if (content !== undefined && content !== null) {
    const body = document.createElement('div');
    body.className = 'ds-card__body';
    appendContent(body, content);
    element.append(body);
  }

  if (hasTags || (footer !== undefined && footer !== null)) {
    const footerElement = document.createElement('footer');
    footerElement.className = 'ds-card__footer';

    if (hasTags) {
      const tagList = document.createElement('span');
      tagList.className = 'ds-card__tags';
      appendItems(tagList, tags);
      footerElement.append(tagList);
    }

    if (footer !== undefined && footer !== null) {
      const footerMeta = document.createElement('span');
      footerMeta.className = 'ds-card__footer-meta';
      appendContent(footerMeta, footer);
      footerElement.append(footerMeta);
    }
    element.append(footerElement);
  }

  return {
    element,
    setState(nextState) {
      if (!CARD_STATES.includes(nextState)) throw new Error(`Unknown card state: ${nextState}`);
      element.classList.replace(`ds-card--${currentState}`, `ds-card--${nextState}`);
      currentState = nextState;
    },
    setDisabled(nextDisabled) {
      const isDisabled = Boolean(nextDisabled);
      element.classList.toggle('is-disabled', isDisabled);
      if (isInteractive) element.disabled = isDisabled;
      else element.setAttribute('aria-disabled', String(isDisabled));
    },
  };
}
