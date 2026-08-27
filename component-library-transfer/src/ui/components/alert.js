import { createButton } from './button.js';
import { createIcon } from './icon.js';
import { appendContent } from './dom.js';

const VARIANTS = new Set(['info', 'success', 'error']);

function normalizeVariant(variant) {
  return VARIANTS.has(variant) ? variant : 'info';
}

export function createAlert({
  title = '',
  message = '',
  icon,
  variant = 'info',
  dismissible = true,
  ariaLabel = 'Закрыть уведомление',
  className = '',
  onDismiss,
} = {}) {
  const element = document.createElement('div');
  element.className = ['ds-alert', className].filter(Boolean).join(' ');
  element.setAttribute('aria-atomic', 'true');

  const content = document.createElement('div');
  content.className = 'ds-alert__content';

  const iconElement = document.createElement('span');
  iconElement.className = 'ds-alert__icon';
  iconElement.setAttribute('aria-hidden', 'true');

  const titleElement = document.createElement('strong');
  titleElement.className = 'ds-alert__title';

  const messageElement = document.createElement('div');
  messageElement.className = 'ds-alert__message';

  const closeButton = createButton({
    icon: createIcon({
      name: 'x',
      size: 16,
      fallback: () => {
        const fallback = document.createElement('span');
        fallback.textContent = '\u00d7';
        return fallback;
      },
    }),
    iconOnly: true,
    variant: 'text',
    size: 'small',
    ariaLabel,
    className: 'ds-alert__close',
  });

  content.append(titleElement, messageElement);
  element.append(iconElement, content, closeButton);

  const setIcon = nextIcon => {
    iconElement.replaceChildren();
    if (nextIcon !== undefined && nextIcon !== null) appendContent(iconElement, nextIcon);
    iconElement.hidden = iconElement.childNodes.length === 0;
  };

  const setContent = ({ title: nextTitle = '', message: nextMessage = '' } = {}) => {
    titleElement.textContent = nextTitle;
    titleElement.hidden = !nextTitle;
    messageElement.replaceChildren();
    if (nextMessage !== undefined && nextMessage !== null) appendContent(messageElement, nextMessage);
    messageElement.hidden = messageElement.childNodes.length === 0;
  };

  const setVariant = nextVariant => {
    const normalized = normalizeVariant(nextVariant);
    element.classList.remove('ds-alert--info', 'ds-alert--success', 'ds-alert--error');
    element.classList.add(`ds-alert--${normalized}`);
    element.dataset.variant = normalized;
    element.setAttribute('role', normalized === 'error' ? 'alert' : 'status');
    element.setAttribute('aria-live', normalized === 'error' ? 'assertive' : 'polite');
  };

  const setDismissible = value => {
    closeButton.hidden = !value;
  };

  const dismiss = () => {
    if (typeof onDismiss === 'function') onDismiss();
    else element.hidden = true;
  };

  closeButton.addEventListener('click', dismiss);
  setIcon(icon);
  setContent({ title, message });
  setVariant(variant);
  setDismissible(dismissible);

  return {
    element,
    closeButton,
    iconElement,
    setContent,
    setIcon,
    setVariant,
    setDismissible,
    dismiss,
  };
}
