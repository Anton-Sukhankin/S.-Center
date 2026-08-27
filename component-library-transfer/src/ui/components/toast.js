import { createAlert } from './alert.js';

export function createToast({ duration = 3000, variant = 'info' } = {}) {
  let timeoutId = null;
  let hideTimerId = null;
  let hide = () => {};
  const alert = createAlert({
    variant,
    className: 'ds-toast',
    onDismiss: () => hide(),
  });
  const { element } = alert;
  element.hidden = true;

  hide = () => {
    window.clearTimeout(timeoutId);
    window.clearTimeout(hideTimerId);
    element.classList.remove('is-active');
    element.setAttribute('aria-hidden', 'true');
    hideTimerId = window.setTimeout(() => {
      if (!element.classList.contains('is-active')) element.hidden = true;
    }, 180);
  };

  const show = ({ title = '', message = '', variant: nextVariant = variant, duration: nextDuration = duration } = {}) => {
    window.clearTimeout(timeoutId);
    window.clearTimeout(hideTimerId);
    alert.setContent({ title, message });
    alert.setVariant(nextVariant);
    element.hidden = false;
    element.removeAttribute('aria-hidden');
    element.classList.add('is-active');
    if (nextDuration > 0) timeoutId = window.setTimeout(hide, nextDuration);
  };

  return {
    element,
    show,
    hide,
    mount(target = document.body) {
      target.append(element);
    },
    destroy() {
      window.clearTimeout(timeoutId);
      window.clearTimeout(hideTimerId);
      element.remove();
    },
  };
}
