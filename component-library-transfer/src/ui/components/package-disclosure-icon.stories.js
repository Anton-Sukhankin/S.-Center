import { createPackageDisclosureIcon } from './package-disclosure-icon.js';

export default {
  title: 'Iconography/PackageDisclosureIcon',
  tags: ['autodocs'],
};

function renderState(state, label) {
  const item = document.createElement('div');
  item.className = 'component-package-disclosure-story__item';
  item.append(createPackageDisclosureIcon({ state }));
  const caption = document.createElement('span');
  caption.textContent = label;
  item.append(caption);
  return item;
}

export const States = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'component-package-disclosure-story';
    wrapper.append(
      renderState('leaf', 'Пакет без дочерних пакетов'),
      renderState('collapsed', 'Пакет свернут'),
      renderState('expanded', 'Пакет развернут'),
    );
    return wrapper;
  },
};
