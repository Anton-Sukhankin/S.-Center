import { createButton } from './button.js';
import { createDocumentPreviewIcon } from './document-preview-icon.js';
import { appendContent, setAttributes } from './dom.js';

function normalizeFileFormat(format, name = '') {
  const explicitFormat = String(format || '').trim().toUpperCase();
  if (explicitFormat) return explicitFormat;
  const extension = String(name).split('.').pop()?.trim().toUpperCase();
  return extension && extension !== String(name).toUpperCase() ? extension : 'FILE';
}

export function createFileTypeIcon({ format, name, size = 'medium' } = {}) {
  const normalizedFormat = normalizeFileFormat(format, name);
  const element = document.createElement('span');
  element.className = `ds-file-type-icon ds-file-type-icon--${size}`;
  element.dataset.format = normalizedFormat;
  element.setAttribute('aria-label', `Файл ${normalizedFormat}`);

  const fold = document.createElement('span');
  fold.className = 'ds-file-type-icon__fold';
  fold.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'ds-file-type-icon__label';
  label.textContent = normalizedFormat;
  element.append(fold, label);
  return element;
}

function createCheckIcon() {
  return createDocumentPreviewIcon('check');
}

export function createFileItem({
  file = {},
  name = file.name || 'Файл без названия',
  format = file.format || '',
  size = file.size || '',
  description,
  selected = false,
  disabled = false,
  downloadable = true,
  selectionIndicator = true,
  icon,
  actions = [],
  className = '',
  attributes = {},
  onOpen,
  onDownload,
} = {}) {
  let currentSelected = Boolean(selected);
  let currentDisabled = Boolean(disabled);
  const payload = Object.keys(file).length > 0 ? file : { name, format, size };
  const normalizedFormat = normalizeFileFormat(format, name);
  const metadata = description ?? [normalizedFormat, size].filter(Boolean).join(' · ');

  const element = document.createElement('div');
  element.className = ['ds-file-item', className].filter(Boolean).join(' ');
  element.setAttribute('role', 'listitem');
  setAttributes(element, attributes);

  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'ds-file-item__main';
  openButton.setAttribute('aria-label', `Открыть файл ${name}`);
  openButton.setAttribute('aria-pressed', String(currentSelected));

  const iconElement = document.createElement('span');
  iconElement.className = 'ds-file-item__icon';
  iconElement.append(icon instanceof Node
    ? icon
    : createFileTypeIcon({ format: normalizedFormat, name }));

  const copy = document.createElement('span');
  copy.className = 'ds-file-item__copy';
  const nameElement = document.createElement('strong');
  nameElement.className = 'ds-file-item__name';
  nameElement.title = String(name);
  appendContent(nameElement, name);
  copy.append(nameElement);

  let descriptionElement = null;
  if (metadata) {
    descriptionElement = document.createElement('span');
    descriptionElement.className = 'ds-file-item__description';
    appendContent(descriptionElement, metadata);
    copy.append(descriptionElement);
  }
  openButton.append(iconElement, copy);

  const actionList = document.createElement('div');
  actionList.className = 'ds-file-item__actions';
  const customActions = actions instanceof Node ? [actions] : Array.from(actions || []);
  customActions.filter(action => action instanceof Node).forEach(action => actionList.append(action));

  let selectedIndicator = null;
  if (selectionIndicator) {
    selectedIndicator = document.createElement('span');
    selectedIndicator.className = 'ds-file-item__selected-indicator';
    selectedIndicator.setAttribute('aria-label', 'Выбранный файл');
    selectedIndicator.append(createCheckIcon());
    actionList.append(selectedIndicator);
  }

  let downloadButton = null;
  if (downloadable) {
    downloadButton = createButton({
      label: 'Скачать',
      icon: createDocumentPreviewIcon('download'),
      iconOnly: true,
      ariaLabel: `Скачать ${name}`,
      variant: 'text',
      size: 'small',
      disabled: currentDisabled,
      className: 'ds-file-item__download',
      onClick: event => onDownload?.(payload, event),
    });
    actionList.append(downloadButton);
  }

  const syncState = () => {
    element.classList.toggle('is-selected', currentSelected);
    element.classList.toggle('is-disabled', currentDisabled);
    openButton.disabled = currentDisabled;
    openButton.setAttribute('aria-pressed', String(currentSelected));
    if (downloadButton) downloadButton.disabled = currentDisabled;
    if (selectedIndicator) selectedIndicator.hidden = !currentSelected;
  };

  openButton.addEventListener('click', event => onOpen?.(payload, event));
  element.append(openButton, actionList);
  syncState();

  return {
    element,
    openButton,
    downloadButton,
    nameElement,
    descriptionElement,
    selectedIndicator,
    setSelected(value) {
      currentSelected = Boolean(value);
      syncState();
    },
    setDisabled(value) {
      currentDisabled = Boolean(value);
      syncState();
    },
    isSelected() {
      return currentSelected;
    },
  };
}
