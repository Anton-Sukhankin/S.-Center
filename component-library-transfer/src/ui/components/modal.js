import { createButton } from './button.js';

let modalSequence = 0;

export function createModal({
  id = `ds-modal-${++modalSequence}`,
  title,
  content,
  actions = [],
  closeIcon,
  closeLabel = 'Закрыть',
  closeAriaLabel = 'Закрыть модальное окно',
} = {}) {
  const element = document.createElement('dialog');
  element.id = id;
  element.className = 'ds-modal';
  element.setAttribute('aria-labelledby', `${id}-title`);

  const header = document.createElement('header');
  header.className = 'ds-modal__header';
  const heading = document.createElement('h2');
  heading.id = `${id}-title`;
  heading.className = 'ds-modal__title';
  heading.textContent = title || '';
  const closeButton = createButton({
    label: closeLabel,
    variant: 'text',
    size: 'small',
    icon: closeIcon,
    iconOnly: Boolean(closeIcon),
    ariaLabel: closeAriaLabel,
  });
  header.append(heading, closeButton);

  const body = document.createElement('div');
  body.className = 'ds-modal__content';
  if (content instanceof Node) body.append(content);

  const footer = document.createElement('footer');
  footer.className = 'ds-modal__footer';
  actions.forEach(action => footer.append(createButton(action)));
  body.append(footer);
  element.append(header, body);

  let returnFocus = null;
  const open = trigger => {
    returnFocus = trigger || document.activeElement;
    element.showModal();
  };
  const close = () => element.close();
  closeButton.addEventListener('click', close);
  element.addEventListener('close', () => returnFocus?.focus?.());

  return { element, open, close };
}
