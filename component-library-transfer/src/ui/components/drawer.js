import { createButton } from './button.js';
import { createIcon } from './icon.js';

let drawerSequence = 0;
const OPEN_DRAWERS = [];
let modalLockCount = 0;
let previousBodyOverflow = '';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(element) {
  return Array.from(element.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter(control => (
      !control.hidden
      && control.getAttribute('aria-hidden') !== 'true'
      && !control.closest('[hidden], [inert], [aria-hidden="true"]')
    ));
}

function lockDocumentScroll() {
  if (modalLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  modalLockCount += 1;
}

function unlockDocumentScroll() {
  modalLockCount = Math.max(0, modalLockCount - 1);
  if (modalLockCount === 0) document.body.style.overflow = previousBodyOverflow;
}

export function createDrawer({
  id = `ds-drawer-${++drawerSequence}`,
  title,
  description = '',
  content,
  footer,
  backVisible = false,
  backLabel = 'Вернуться к предыдущему этапу',
  expanded = false,
  placement = 'right',
  modal = true,
  showOverlay = modal,
  focusOnOpen = true,
  closeOnOverlay = showOverlay,
  closeOnEscape = true,
  closeLabel = 'Закрыть панель',
  closeIcon,
  beforeClose,
  onRequestClose,
  onBack,
  onOpen,
  onClose,
} = {}) {
  if (!['right', 'bottom'].includes(placement)) {
    throw new Error(`Unknown drawer placement: ${placement}`);
  }

  const overlay = document.createElement('div');
  overlay.className = 'ds-drawer-overlay';

  const element = document.createElement('div');
  element.id = id;
  element.className = `ds-drawer ds-drawer--${placement}${expanded ? ' is-expanded' : ''}`;
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', String(modal));
  element.setAttribute('aria-hidden', 'true');
  element.setAttribute('inert', '');
  element.tabIndex = -1;

  const header = document.createElement('header');
  header.className = 'ds-drawer__header';
  const headerPane = document.createElement('div');
  headerPane.className = 'ds-drawer__header-pane ds-drawer__header-pane--full';
  let backButton = null;
  if (onBack || backVisible) {
    const backFallback = document.createElement('span');
    backFallback.className = 'ds-drawer__back-glyph';
    backButton = createButton({
      icon: createIcon({ name: 'arrow-left', size: 18, fallback: backFallback }),
      iconOnly: true,
      ariaLabel: backLabel,
      variant: 'text',
      size: 'small',
      className: 'ds-drawer__back',
    });
    backButton.hidden = !backVisible;
    headerPane.append(backButton);
  }

  const headingCopy = document.createElement('div');
  headingCopy.className = 'ds-drawer__heading-copy';
  const heading = document.createElement('h2');
  heading.className = 'ds-drawer__title';
  heading.id = `${id}-title`;
  heading.textContent = title || '';
  const descriptionElement = document.createElement('p');
  descriptionElement.className = 'ds-drawer__description';
  descriptionElement.id = `${id}-description`;
  descriptionElement.textContent = description;
  descriptionElement.hidden = !description;
  headingCopy.append(heading, descriptionElement);
  element.setAttribute('aria-labelledby', heading.id);
  if (description) element.setAttribute('aria-describedby', descriptionElement.id);

  const closeGlyph = closeIcon || document.createElement('span');
  if (!closeIcon) {
    closeGlyph.className = 'ds-drawer__close-glyph';
    closeGlyph.textContent = '×';
  }
  const closeButton = createButton({
    icon: closeGlyph,
    iconOnly: true,
    variant: 'text',
    size: 'small',
    ariaLabel: closeLabel,
    className: 'ds-drawer__close',
  });
  headerPane.append(headingCopy, closeButton);
  header.append(headerPane);

  const body = document.createElement('div');
  body.className = 'ds-drawer__content';
  body.tabIndex = 0;

  const footerElement = document.createElement('footer');
  footerElement.className = 'ds-drawer__footer';

  const setContent = nextContent => {
    body.replaceChildren();
    if (nextContent instanceof Node) body.append(nextContent);
    body.scrollTop = 0;
  };

  const setFooter = nextFooter => {
    footerElement.replaceChildren();
    if (nextFooter instanceof Node) footerElement.append(nextFooter);
    footerElement.hidden = !(nextFooter instanceof Node);
  };

  const setHeader = ({
    title: nextTitle,
    description: nextDescription,
    backVisible: nextBackVisible,
  } = {}) => {
    if (nextTitle !== undefined) heading.textContent = nextTitle || '';
    if (nextDescription !== undefined) {
      descriptionElement.textContent = nextDescription || '';
      descriptionElement.hidden = !nextDescription;
      if (nextDescription) element.setAttribute('aria-describedby', descriptionElement.id);
      else element.removeAttribute('aria-describedby');
    }
    if (nextBackVisible !== undefined && backButton) backButton.hidden = !nextBackVisible;
  };

  setContent(content);
  setFooter(footer);
  element.append(header, body, footerElement);

  let returnFocus = null;
  let opened = false;

  const open = trigger => {
    if (opened) return;
    opened = true;
    returnFocus = trigger || document.activeElement;
    if (showOverlay) overlay.classList.add('is-active');
    element.removeAttribute('inert');
    element.classList.add('is-active');
    element.setAttribute('aria-hidden', 'false');
    OPEN_DRAWERS.push(api);
    if (modal) lockDocumentScroll();
    if (focusOnOpen) {
      window.requestAnimationFrame(() => {
        const [firstControl] = getFocusableElements(element);
        (firstControl || element).focus({ preventScroll: true });
      });
    }
    onOpen?.();
  };

  const performClose = ({ restoreFocus = true, reason = 'programmatic' } = {}) => {
    if (!opened) return;
    opened = false;
    overlay.classList.remove('is-active');
    element.classList.remove('is-active');
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('inert', '');
    const drawerIndex = OPEN_DRAWERS.lastIndexOf(api);
    if (drawerIndex >= 0) OPEN_DRAWERS.splice(drawerIndex, 1);
    if (modal) unlockDocumentScroll();
    if (restoreFocus) returnFocus?.focus?.({ preventScroll: true });
    onClose?.({ reason });
  };

  const close = ({ restoreFocus = true, reason = 'programmatic', event } = {}) => {
    if (!opened) return false;
    const request = { reason, event, drawer: api };
    if (beforeClose?.(request) === false) return false;
    performClose({ restoreFocus, reason });
    return true;
  };

  const requestClose = (reason, event) => {
    if (!opened) return false;
    const request = { reason, event, drawer: api };
    if (onRequestClose?.(request) === false) return false;
    return close({ reason, event });
  };

  const handleKeydown = event => {
    if (!opened || OPEN_DRAWERS.at(-1) !== api) return;
    const activeNativeModal = document.querySelector('dialog[open]');
    if (activeNativeModal && !element.contains(activeNativeModal)) return;
    if (event.key === 'Tab' && modal) {
      const controls = getFocusableElements(element);
      if (controls.length === 0) {
        event.preventDefault();
        element.focus({ preventScroll: true });
        return;
      }
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (closeOnEscape && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      requestClose('escape', event);
    }
  };

  const handleCloseButtonClick = event => requestClose('close-button', event);
  const handleBackButtonClick = event => onBack?.({ event, drawer: api });
  const handleOverlayClick = event => requestClose('overlay', event);
  closeButton.addEventListener('click', handleCloseButtonClick);
  backButton?.addEventListener('click', handleBackButtonClick);
  if (closeOnOverlay) overlay.addEventListener('click', handleOverlayClick);
  document.addEventListener('keydown', handleKeydown);

  const api = {
    element,
    overlay,
    open,
    close,
    requestClose,
    setHeader,
    setContent,
    setFooter,
    header,
    contentElement: body,
    footerElement,
    isOpen() {
      return opened;
    },
    mount(target = document.body) {
      if (showOverlay) target.append(overlay);
      target.append(element);
    },
    destroy() {
      performClose({ restoreFocus: false, reason: 'destroy' });
      document.removeEventListener('keydown', handleKeydown);
      closeButton.removeEventListener('click', handleCloseButtonClick);
      backButton?.removeEventListener('click', handleBackButtonClick);
      overlay.removeEventListener('click', handleOverlayClick);
      overlay.remove();
      element.remove();
    },
  };

  return api;
}
